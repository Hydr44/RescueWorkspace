// actions.js — Write actions (require user confirmation)
//
// Pattern: AI invokes propose_* tool → tool VALIDATES and returns action proposal
// → frontend shows confirmation UI → on confirm, frontend POSTs to /api/ai/execute-action
// → executor performs the actual DB write.

// ── Action proposal tools (returned to AI as tool defs) ──
const ACTION_TOOL_DEFS = [
  {
    name: "propose_client",
    description: "Propone la creazione di un nuovo cliente. NON scrive sul DB direttamente: ritorna una proposta che l'utente deve confermare. Usa quando l'utente chiede di aggiungere/registrare un cliente.",
    input_schema: {
      type: "object",
      properties: {
        nome: { type: "string", description: "Nome (o ragione sociale se azienda)" },
        surname: { type: "string", description: "Cognome (vuoto se azienda)" },
        is_company: { type: "boolean", description: "true se persona giuridica" },
        vat: { type: "string", description: "P.IVA (11 cifre)" },
        tax_code: { type: "string", description: "Codice Fiscale" },
        email: { type: "string" },
        phone: { type: "string" },
        pec: { type: "string" },
        codice_destinatario: { type: "string", description: "Codice SDI 7 char" },
        address: { type: "string", description: "Indirizzo (via + civico)" },
        city: { type: "string" },
        province: { type: "string", description: "Sigla provincia 2 lettere" },
        zip: { type: "string", description: "CAP" },
      },
      required: ["nome"],
    },
  },
  {
    name: "propose_transport",
    description: "Propone la creazione di un trasporto. NON scrive sul DB: ritorna proposta da confermare.",
    input_schema: {
      type: "object",
      properties: {
        customer_name: { type: "string", description: "Nome cliente" },
        customer_phone: { type: "string" },
        client_id: { type: "string", description: "UUID cliente esistente (se conosciuto)" },
        pickup_address: { type: "string", description: "Indirizzo ritiro" },
        dropoff_address: { type: "string", description: "Indirizzo consegna" },
        eta_minutes: { type: "integer", description: "ETA in minuti" },
        price_cents: { type: "integer", description: "Prezzo in centesimi (es. 5000 = €50)" },
        notes: { type: "string", description: "Note interne" },
      },
      required: ["pickup_address"],
    },
  },
  {
    name: "propose_quote",
    description: "Propone la creazione di un preventivo. NON scrive sul DB: ritorna proposta da confermare.",
    input_schema: {
      type: "object",
      properties: {
        client_id: { type: "string", description: "UUID cliente esistente (preferito)" },
        cliente: { type: "string", description: "Nome cliente (se senza ID)" },
        numero: { type: "string", description: "Numero preventivo (autogenerato se omesso)" },
        data: { type: "string", description: "Data ISO (default oggi)" },
        valuta: { type: "string", default: "EUR" },
        voci: {
          type: "array",
          description: "Righe del preventivo",
          items: {
            type: "object",
            properties: {
              descrizione: { type: "string" },
              quantita: { type: "number" },
              prezzo: { type: "number", description: "Prezzo unitario" },
              iva_perc: { type: "number", description: "IVA % (default 22)" },
            },
            required: ["descrizione", "quantita", "prezzo"],
          },
        },
        sconto_perc: { type: "number" },
        note: { type: "string" },
      },
      required: ["voci"],
    },
  },
  {
    name: "propose_yard_vehicle",
    description: "Propone l'inserimento di un veicolo nel piazzale. NON scrive sul DB: ritorna proposta da confermare.",
    input_schema: {
      type: "object",
      properties: {
        targa: { type: "string" },
        marca: { type: "string" },
        modello: { type: "string" },
        telaio: { type: "string" },
        zona: { type: "string" },
        stato: { type: "string", description: "es. 'in_attesa', 'in_demolizione', 'demolito'" },
        data_ingresso: { type: "string", description: "Data ISO (default oggi)" },
        numero_pratica: { type: "string" },
        note: { type: "string" },
      },
      required: ["targa"],
    },
  },
  {
    name: "propose_draft_invoice",
    description: "Propone la creazione di una bozza di fattura (sdi_status='draft'). NON scrive sul DB: ritorna proposta da confermare. L'utente potrà poi inviarla al SDI manualmente.",
    input_schema: {
      type: "object",
      properties: {
        customer_name: { type: "string", description: "Nome/ragione sociale cliente" },
        customer_vat: { type: "string", description: "P.IVA cliente" },
        customer_tax_code: { type: "string", description: "Codice fiscale cliente" },
        customer_address: {
          type: "object",
          description: "Indirizzo cliente",
          properties: {
            address: { type: "string" }, city: { type: "string" }, province: { type: "string" }, zip: { type: "string" },
          },
        },
        date: { type: "string", description: "Data ISO (default oggi)" },
        currency: { type: "string", default: "EUR" },
        items: {
          type: "array",
          description: "Righe fattura",
          items: {
            type: "object",
            properties: {
              item_description: { type: "string" },
              item_code: { type: "string" },
              qty: { type: "number" },
              price: { type: "number", description: "Prezzo unitario" },
              vat_perc: { type: "number", default: 22 },
            },
            required: ["item_description", "qty", "price"],
          },
        },
        note_external: { type: "string", description: "Note visibili al cliente" },
        note_internal: { type: "string" },
      },
      required: ["customer_name", "items"],
    },
  },
];

// ── Tool executor (proposals only — never writes) ──
function buildProposal(name, input) {
  switch (name) {
    case "propose_client": {
      const display = input.is_company ? input.nome : [input.nome, input.surname].filter(Boolean).join(" ");
      return {
        type: "action_proposal",
        action: "create_client",
        title: `Nuovo cliente: ${display}`,
        details: [
          input.is_company ? "Azienda" : "Persona fisica",
          input.vat && `P.IVA ${input.vat}`,
          input.tax_code && `CF ${input.tax_code}`,
          input.email && `📧 ${input.email}`,
          input.phone && `📞 ${input.phone}`,
          input.city && (input.province ? `📍 ${input.city} (${input.province})` : `📍 ${input.city}`),
        ].filter(Boolean),
        payload: {
          nome: input.nome,
          surname: input.surname || null,
          is_company: !!input.is_company,
          vat: input.vat || null,
          piva: input.vat || null,
          tax_code: input.tax_code || null,
          email: input.email || null,
          phone: input.phone || null,
          pec: input.pec || null,
          codice_destinatario: input.codice_destinatario || null,
          address: input.address || null,
          city: input.city || null,
          province: input.province || null,
          zip: input.zip || null,
          country: "IT",
        },
        confirm_label: "Crea cliente",
      };
    }

    case "propose_transport": {
      return {
        type: "action_proposal",
        action: "create_transport",
        title: `Nuovo trasporto${input.customer_name ? ` per ${input.customer_name}` : ""}`,
        details: [
          input.pickup_address && `📍 Ritiro: ${input.pickup_address}`,
          input.dropoff_address && `🎯 Consegna: ${input.dropoff_address}`,
          input.customer_phone && `📞 ${input.customer_phone}`,
          input.eta_minutes && `⏱️ ETA ${input.eta_minutes} min`,
          input.price_cents && `💰 €${(input.price_cents / 100).toFixed(2)}`,
          input.notes && `📝 ${input.notes}`,
        ].filter(Boolean),
        payload: {
          customer_name: input.customer_name || null,
          customer_phone: input.customer_phone || null,
          client_id: input.client_id || null,
          pickup_address: input.pickup_address,
          dropoff_address: input.dropoff_address || null,
          eta_minutes: input.eta_minutes || null,
          price_cents: input.price_cents || null,
          notes: input.notes || null,
          status: "planned",
        },
        confirm_label: "Crea trasporto",
      };
    }

    case "propose_quote": {
      const items = input.voci || [];
      const subtotal = items.reduce((s, v) => s + (Number(v.quantita) || 0) * (Number(v.prezzo) || 0), 0);
      const sconto = input.sconto_perc ? subtotal * (Number(input.sconto_perc) / 100) : 0;
      const ivaPerc = items[0]?.iva_perc || 22;
      const imponibile = subtotal - sconto;
      const iva = imponibile * (ivaPerc / 100);
      const totale = imponibile + iva;
      return {
        type: "action_proposal",
        action: "create_quote",
        title: `Nuovo preventivo${input.cliente ? ` per ${input.cliente}` : ""}`,
        details: [
          ...items.slice(0, 5).map(v => `• ${v.descrizione} × ${v.quantita} = €${((Number(v.prezzo) || 0) * (Number(v.quantita) || 0)).toFixed(2)}`),
          items.length > 5 && `... e altre ${items.length - 5} voci`,
          input.sconto_perc && `Sconto ${input.sconto_perc}%`,
          `📊 Totale: €${totale.toFixed(2)}`,
        ].filter(Boolean),
        payload: {
          client_id: input.client_id || null,
          cliente: input.cliente || null,
          numero: input.numero || null,
          data: input.data || new Date().toISOString().slice(0, 10),
          valuta: input.valuta || "EUR",
          voci: items,
          importo: totale,
          stato: "bozza",
          sconto_perc: input.sconto_perc || null,
          iva_perc: ivaPerc,
          note: input.note || null,
        },
        confirm_label: "Crea preventivo",
      };
    }

    case "propose_yard_vehicle": {
      return {
        type: "action_proposal",
        action: "create_yard_vehicle",
        title: `Veicolo in piazzale: ${input.targa}`,
        details: [
          (input.marca || input.modello) && `🚗 ${[input.marca, input.modello].filter(Boolean).join(" ")}`,
          input.telaio && `🆔 Telaio ${input.telaio}`,
          input.zona && `📍 Zona ${input.zona}`,
          input.stato && `🏷️ Stato: ${input.stato}`,
          input.numero_pratica && `📋 Pratica ${input.numero_pratica}`,
          input.note && `📝 ${input.note}`,
        ].filter(Boolean),
        payload: {
          targa: (input.targa || "").toUpperCase(),
          marca: input.marca || null,
          modello: input.modello || null,
          telaio: input.telaio || null,
          zona: input.zona || null,
          stato: input.stato || "in_attesa",
          data_ingresso: input.data_ingresso || new Date().toISOString().slice(0, 10),
          numero_pratica: input.numero_pratica || null,
          note: input.note || null,
        },
        confirm_label: "Inserisci in piazzale",
      };
    }

    case "propose_draft_invoice": {
      const items = input.items || [];
      const totals = items.map(i => ({
        line: (Number(i.qty) || 0) * (Number(i.price) || 0),
        vat: (Number(i.qty) || 0) * (Number(i.price) || 0) * ((Number(i.vat_perc) || 22) / 100),
      }));
      const imponibile = totals.reduce((s, t) => s + t.line, 0);
      const ivaTot = totals.reduce((s, t) => s + t.vat, 0);
      const totale = imponibile + ivaTot;
      return {
        type: "action_proposal",
        action: "create_draft_invoice",
        title: `Bozza fattura: ${input.customer_name}`,
        details: [
          input.customer_vat && `P.IVA ${input.customer_vat}`,
          ...items.slice(0, 5).map(i => `• ${i.item_description} × ${i.qty} @ €${(Number(i.price) || 0).toFixed(2)} (IVA ${i.vat_perc || 22}%)`),
          items.length > 5 && `... e altre ${items.length - 5} righe`,
          `Imponibile: €${imponibile.toFixed(2)}`,
          `IVA: €${ivaTot.toFixed(2)}`,
          `📊 Totale: €${totale.toFixed(2)}`,
        ].filter(Boolean),
        payload: {
          invoice: {
            customer_name: input.customer_name,
            customer_vat: input.customer_vat || null,
            customer_tax_code: input.customer_tax_code || null,
            customer_address: input.customer_address || null,
            date: input.date || new Date().toISOString().slice(0, 10),
            currency: input.currency || "EUR",
            total: totale,
            sdi_status: "draft",
            provider_id: "internal",
            payment_status: "unpaid",
            note_external: input.note_external || null,
            note_internal: input.note_internal || null,
          },
          items: items.map(i => ({
            item_description: i.item_description,
            item_code: i.item_code || (i.item_description || "").slice(0, 32) || "VOCE",
            qty: Number(i.qty) || 1,
            price: Number(i.price) || 0,
            vat_perc: Number(i.vat_perc) || 22,
          })),
        },
        confirm_label: "Crea bozza fattura",
      };
    }

    default:
      return null;
  }
}

// ── Action executor (called from /api/ai/execute-action endpoint) ──
async function executeAction(action, payload, ctx) {
  const { supabase, orgId } = ctx;
  if (!orgId) throw new Error("org_id required");

  switch (action) {
    case "create_client": {
      const { data, error } = await supabase
        .from("clients")
        .insert({ ...payload, org_id: orgId })
        .select("id, nome, surname, vat, email")
        .single();
      if (error) throw error;
      return { ok: true, id: data.id, summary: `Cliente creato (id ${data.id.slice(0, 8)})` };
    }

    case "create_transport": {
      const { data, error } = await supabase
        .from("transports")
        .insert({ ...payload, org_id: orgId })
        .select("id, number, status")
        .single();
      if (error) throw error;
      return { ok: true, id: data.id, summary: `Trasporto ${data.number || data.id.slice(0, 8)} creato` };
    }

    case "create_quote": {
      const { data, error } = await supabase
        .from("quotes")
        .insert({ ...payload, org_id: orgId })
        .select("id, numero, importo")
        .single();
      if (error) throw error;
      return { ok: true, id: data.id, summary: `Preventivo ${data.numero || data.id.slice(0, 8)} creato (€${data.importo})` };
    }

    case "create_yard_vehicle": {
      const { data, error } = await supabase
        .from("yard_vehicles")
        .insert({ ...payload, org_id: orgId })
        .select("id, targa")
        .single();
      if (error) throw error;
      return { ok: true, id: data.id, summary: `Veicolo ${data.targa} aggiunto al piazzale` };
    }

    case "create_draft_invoice": {
      const { invoice, items } = payload;
      const { data: inv, error: invErr } = await supabase
        .from("invoices")
        .insert({ ...invoice, org_id: orgId })
        .select("id, number, total")
        .single();
      if (invErr) throw invErr;

      if (Array.isArray(items) && items.length > 0) {
        const { error: itemsErr } = await supabase
          .from("invoice_items")
          .insert(items.map(i => ({ ...i, invoice_id: inv.id })));
        if (itemsErr) {
          // Rollback: cancella la fattura appena creata
          await supabase.from("invoices").delete().eq("id", inv.id);
          throw new Error(`Errore inserimento righe: ${itemsErr.message}`);
        }
      }
      return { ok: true, id: inv.id, summary: `Bozza fattura ${inv.number || "creata"} (€${inv.total})` };
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

module.exports = { ACTION_TOOL_DEFS, buildProposal, executeAction };
