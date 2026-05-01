// tools.js — Tool definitions + executor for RescueAI
// Tools are READ-ONLY queries scoped to the requesting org_id (always filtered).
// Schema reale RescueManager: misto IT/EN. Vedi commenti per ogni tool.

const TOOL_DEFS = [
  {
    name: "query_clients",
    description: "Cerca clienti dell'organizzazione per nome, cognome, P.IVA, codice fiscale, email o telefono. Ritorna max 20 risultati. Usa per rispondere a domande su clienti specifici, contatti, dati fiscali.",
    input_schema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Testo di ricerca (nome, cognome, P.IVA, CF, email)" },
        limit: { type: "integer", description: "Max risultati (default 20)", default: 20 },
      },
    },
  },
  {
    name: "query_invoices",
    description: "Lista fatture emesse dell'organizzazione. Filtri opzionali per stato SDI, periodo. Ritorna riepilogo (numero, data, cliente, totale, stato). Usa per riepiloghi fatturato, stati invio, scadenze.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["draft", "sent", "delivered", "rejected", "all"], description: "Filtra per stato SDI" },
        from_date: { type: "string", description: "Data inizio ISO (YYYY-MM-DD)" },
        to_date: { type: "string", description: "Data fine ISO (YYYY-MM-DD)" },
        limit: { type: "integer", default: 30 },
      },
    },
  },
  {
    name: "query_transports",
    description: "Lista trasporti. Filtri per stato, periodo. Usa per stato logistica, trasporti aperti, KPI giornalieri.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Stato (planned, in_progress, completed, cancelled, all)" },
        from_date: { type: "string", description: "Data inizio ISO" },
        to_date: { type: "string", description: "Data fine ISO" },
        limit: { type: "integer", default: 30 },
      },
    },
  },
  {
    name: "query_demolitions",
    description: "Lista pratiche di demolizione (VFU/RVFU). Stato workflow, targa veicolo, dati proprietario.",
    input_schema: {
      type: "object",
      properties: {
        stato: { type: "string", description: "Stato pratica" },
        from_date: { type: "string" },
        to_date: { type: "string" },
        limit: { type: "integer", default: 20 },
      },
    },
  },
  {
    name: "query_yard",
    description: "Veicoli attualmente in piazzale. Filtra per zona, stato, periodo arrivo.",
    input_schema: {
      type: "object",
      properties: {
        zona: { type: "string", description: "Zona piazzale" },
        stato: { type: "string" },
        limit: { type: "integer", default: 30 },
      },
    },
  },
  {
    name: "query_settings",
    description: "Legge impostazioni dell'organizzazione (azienda, SDI, RVFU env, RENTRI). NON ritorna password/credenziali sensibili.",
    input_schema: {
      type: "object",
      properties: {
        keys: { type: "array", items: { type: "string" }, description: "Lista chiavi da leggere (es. ['company','sdi'])" },
      },
    },
  },
  {
    name: "query_drivers",
    description: "Lista autisti dell'organizzazione con scadenze patente/CQC/certificato medico.",
    input_schema: {
      type: "object",
      properties: {
        active_only: { type: "boolean", default: true },
        limit: { type: "integer", default: 30 },
      },
    },
  },
  {
    name: "query_vehicles",
    description: "Veicoli flotta dell'organizzazione (mezzi propri).",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "integer", default: 30 },
      },
    },
  },
  {
    name: "compute_kpi",
    description: "Calcola KPI aggregati per un periodo: fatturato, n° fatture emesse/scartate, n° trasporti, n° demolizioni completate, valore piazzale.",
    input_schema: {
      type: "object",
      properties: {
        period: { type: "string", enum: ["today", "week", "month", "quarter", "year"], default: "month" },
      },
      required: ["period"],
    },
  },
  {
    name: "search_global",
    description: "Ricerca trasversale su clienti, fatture, trasporti, veicoli per testo libero. Usa quando l'utente non specifica l'entità.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Testo da cercare" },
      },
      required: ["query"],
    },
  },
];

// ── Period helpers ──
function periodToDates(period) {
  const now = new Date();
  const to = now.toISOString();
  const from = new Date(now);
  switch (period) {
    case "today": from.setHours(0, 0, 0, 0); break;
    case "week": from.setDate(from.getDate() - 7); break;
    case "month": from.setMonth(from.getMonth() - 1); break;
    case "quarter": from.setMonth(from.getMonth() - 3); break;
    case "year": from.setFullYear(from.getFullYear() - 1); break;
    default: from.setMonth(from.getMonth() - 1);
  }
  return { from: from.toISOString(), to };
}

// ── Sanitizer — never leak credentials ──
function sanitizeSettings(rows) {
  return (rows || []).map(r => {
    const v = (r.value && typeof r.value === "object") ? { ...r.value } : r.value;
    if (v && typeof v === "object") {
      delete v.password;
      delete v.client_secret;
      delete v.api_key;
      delete v.private_key;
      delete v.token;
    }
    return { key: r.key, value: v, updated_at: r.updated_at };
  });
}

// Build display name from clients schema (mix nome/surname/piva)
function clientDisplayName(c) {
  if (!c) return "";
  if (c.is_company) return c.nome || c.surname || "(senza nome)";
  return [c.nome, c.surname].filter(Boolean).join(" ") || c.email || "(senza nome)";
}

// ── Executor ──
async function executeTool(name, input, ctx) {
  const { supabase, orgId } = ctx;
  if (!orgId) throw new Error("org_id required");

  switch (name) {
    case "query_clients": {
      const search = (input?.search || "").trim();
      const limit = Math.min(input?.limit || 20, 50);
      let q = supabase
        .from("clients")
        .select("id, nome, surname, is_company, vat, piva, tax_code, email, phone, codice_destinatario, pec, city, province, created_at")
        .eq("org_id", orgId)
        .limit(limit);
      if (search) {
        // Escape % e _
        const safe = search.replace(/[%_]/g, c => "\\" + c);
        q = q.or(
          `nome.ilike.%${safe}%,surname.ilike.%${safe}%,vat.ilike.%${safe}%,piva.ilike.%${safe}%,tax_code.ilike.%${safe}%,email.ilike.%${safe}%`
        );
      }
      const { data, error } = await q;
      if (error) throw error;
      const rows = (data || []).map(c => ({
        id: c.id,
        display_name: clientDisplayName(c),
        is_company: c.is_company,
        vat: c.vat || c.piva,
        tax_code: c.tax_code,
        email: c.email,
        phone: c.phone,
        city: c.city,
        province: c.province,
      }));
      return { count: rows.length, rows };
    }

    case "query_invoices": {
      const limit = Math.min(input?.limit || 30, 100);
      let q = supabase
        .from("invoices")
        .select("id, number, date, customer_name, customer_vat, total, currency, sdi_status, payment_status, created_at")
        .eq("org_id", orgId)
        .order("date", { ascending: false, nullsFirst: false })
        .limit(limit);
      if (input?.status && input.status !== "all") q = q.eq("sdi_status", input.status);
      if (input?.from_date) q = q.gte("date", input.from_date);
      if (input?.to_date) q = q.lte("date", input.to_date);
      const { data, error } = await q;
      if (error) throw error;
      const total = (data || []).reduce((s, r) => s + (Number(r.total) || 0), 0);
      return { count: data?.length || 0, total_amount: total, currency: data?.[0]?.currency || "EUR", rows: data || [] };
    }

    case "query_transports": {
      const limit = Math.min(input?.limit || 30, 100);
      let q = supabase
        .from("transports")
        .select("id, number, status, customer_name, customer_phone, pickup_address, dropoff_address, eta_minutes, price_cents, created_at, updated_at")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (input?.status && input.status !== "all") q = q.eq("status", input.status);
      if (input?.from_date) q = q.gte("created_at", input.from_date);
      if (input?.to_date) q = q.lte("created_at", input.to_date);
      const { data, error } = await q;
      if (error) throw error;
      const rows = (data || []).map(r => ({
        ...r,
        price_eur: r.price_cents ? Number(r.price_cents) / 100 : null,
      }));
      return { count: rows.length, rows };
    }

    case "query_demolitions": {
      const limit = Math.min(input?.limit || 20, 50);
      let q = supabase
        .from("demolition_cases")
        .select("id, targa, marca_modello, anno, stato, rvfu_status, rvfu_proprietario_nome, rvfu_proprietario_cognome, invoice_total_cents, invoice_currency, created_at, processing_status")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (input?.stato) q = q.eq("stato", input.stato);
      if (input?.from_date) q = q.gte("created_at", input.from_date);
      if (input?.to_date) q = q.lte("created_at", input.to_date);
      const { data, error } = await q;
      if (error) throw error;
      const rows = (data || []).map(r => ({
        ...r,
        invoice_total_eur: r.invoice_total_cents ? Number(r.invoice_total_cents) / 100 : null,
        proprietario: [r.rvfu_proprietario_nome, r.rvfu_proprietario_cognome].filter(Boolean).join(" ") || null,
      }));
      return { count: rows.length, rows };
    }

    case "query_yard": {
      const limit = Math.min(input?.limit || 30, 100);
      let q = supabase
        .from("yard_vehicles")
        .select("id, targa, marca, modello, telaio, zona, posizione, stato, data_ingresso, data_uscita, numero_pratica, autorita_competente, scadenza_pratica, note")
        .eq("org_id", orgId)
        .order("data_ingresso", { ascending: false, nullsFirst: false })
        .limit(limit);
      if (input?.zona) q = q.eq("zona", input.zona);
      if (input?.stato) q = q.eq("stato", input.stato);
      const { data, error } = await q;
      if (error) throw error;
      return { count: data?.length || 0, rows: data || [] };
    }

    case "query_settings": {
      const keys = Array.isArray(input?.keys) && input.keys.length
        ? input.keys
        : ["company", "sdi"];
      const allowed = ["company", "sdi", "rvfu_auth", "rentri", "appearance", "notifications", "onboarding_skipped"];
      const filtered = keys.filter(k => allowed.includes(k));
      const { data, error } = await supabase
        .from("org_settings")
        .select("key, value, updated_at")
        .eq("org_id", orgId)
        .in("key", filtered);
      if (error) throw error;
      return { rows: sanitizeSettings(data) };
    }

    case "query_drivers": {
      const limit = Math.min(input?.limit || 30, 100);
      let q = supabase
        .from("staff_drivers")
        .select("id, nome, telefono, stato, patente, scadenza_patente, scadenza_cqc, scadenza_cert_medico, costo_orario, costo_km, disp")
        .eq("org_id", orgId)
        .limit(limit);
      if (input?.active_only !== false) q = q.eq("disp", true);
      const { data, error } = await q;
      if (error) {
        // Fallback se 'disp' non è boolean: rimuovi filtro
        const { data: data2, error: err2 } = await supabase
          .from("staff_drivers")
          .select("id, nome, telefono, stato, patente, scadenza_patente, scadenza_cqc, scadenza_cert_medico, costo_orario, costo_km, disp")
          .eq("org_id", orgId)
          .limit(limit);
        if (err2) throw err2;
        return { count: data2?.length || 0, rows: data2 || [] };
      }
      return { count: data?.length || 0, rows: data || [] };
    }

    case "query_vehicles": {
      const limit = Math.min(input?.limit || 30, 100);
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, targa, marca, modello, anno, tipo, portata, alimentazione, autista, scad_assicurazione, scad_revisione, scad_bollo, stato")
        .eq("org_id", orgId)
        .limit(limit);
      if (error) throw error;
      return { count: data?.length || 0, rows: data || [] };
    }

    case "compute_kpi": {
      const { from, to } = periodToDates(input?.period || "month");
      const [invRes, trRes, demRes, yardRes] = await Promise.all([
        supabase.from("invoices")
          .select("total, sdi_status", { count: "exact" })
          .eq("org_id", orgId)
          .gte("date", from).lte("date", to),
        supabase.from("transports")
          .select("status", { count: "exact" })
          .eq("org_id", orgId)
          .gte("created_at", from).lte("created_at", to),
        supabase.from("demolition_cases")
          .select("stato", { count: "exact" })
          .eq("org_id", orgId)
          .gte("created_at", from).lte("created_at", to),
        supabase.from("yard_vehicles")
          .select("stato", { count: "exact", head: true })
          .eq("org_id", orgId),
      ]);
      const invoices = invRes.data || [];
      const revenue = invoices.reduce((s, r) => s + (Number(r.total) || 0), 0);
      const rejected = invoices.filter(r => r.sdi_status === "rejected").length;
      const sent = invoices.filter(r => r.sdi_status === "sent" || r.sdi_status === "delivered").length;
      const trList = trRes.data || [];
      const trCompleted = trList.filter(r => r.status === "completed" || r.status === "done").length;
      const demList = demRes.data || [];
      const demCompleted = demList.filter(r => r.stato === "completata" || r.stato === "inviata").length;
      return {
        period: input?.period || "month",
        from, to,
        revenue,
        currency: "EUR",
        invoices_count: invRes.count || 0,
        invoices_sent: sent,
        invoices_rejected: rejected,
        transports_count: trRes.count || 0,
        transports_completed: trCompleted,
        demolitions_count: demRes.count || 0,
        demolitions_completed: demCompleted,
        yard_total: yardRes.count || 0,
      };
    }

    case "search_global": {
      const search = (input?.query || "").trim();
      if (!search) return { results: [] };
      const safe = search.replace(/[%_]/g, c => "\\" + c);
      const [clRes, invRes, trRes, vhRes, demRes] = await Promise.all([
        supabase.from("clients")
          .select("id, nome, surname, is_company, vat, piva, email")
          .eq("org_id", orgId)
          .or(`nome.ilike.%${safe}%,surname.ilike.%${safe}%,vat.ilike.%${safe}%,piva.ilike.%${safe}%,email.ilike.%${safe}%`)
          .limit(5),
        supabase.from("invoices")
          .select("id, number, customer_name, total, date")
          .eq("org_id", orgId)
          .or(`number.ilike.%${safe}%,customer_name.ilike.%${safe}%`)
          .limit(5),
        supabase.from("transports")
          .select("id, number, customer_name, status")
          .eq("org_id", orgId)
          .or(`number.ilike.%${safe}%,customer_name.ilike.%${safe}%`)
          .limit(5),
        supabase.from("yard_vehicles")
          .select("id, targa, marca, modello")
          .eq("org_id", orgId)
          .or(`targa.ilike.%${safe}%,marca.ilike.%${safe}%,modello.ilike.%${safe}%`)
          .limit(5),
        supabase.from("demolition_cases")
          .select("id, targa, marca_modello, stato")
          .eq("org_id", orgId)
          .or(`targa.ilike.%${safe}%,marca_modello.ilike.%${safe}%`)
          .limit(5),
      ]);
      return {
        clients: (clRes.data || []).map(c => ({ ...c, display_name: clientDisplayName(c) })),
        invoices: invRes.data || [],
        transports: trRes.data || [],
        yard: vhRes.data || [],
        demolitions: demRes.data || [],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

module.exports = { TOOL_DEFS, executeTool };
