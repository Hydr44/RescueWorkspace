// src/pages/InvoiceForm.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import {
  FiArrowLeft, FiRefreshCw, FiFileText, FiSend, FiArchive, FiClock, FiCheckCircle,
  FiXCircle, FiActivity, FiAlertCircle, FiHash, FiCalendar, FiUser,
  FiCreditCard, FiX, FiDownload, FiEdit, FiTrash2, FiRotateCcw, FiMail, FiCode, FiCopy, FiInfo
} from "react-icons/fi";
import { sendInvoiceToSDI, getInvoiceXML, getSdiConfig } from "@/lib/sdi";
import { generateInvoicePdf } from "@/lib/invoicePdfGenerator";
import { downloadFatturaPaPdf } from "@/lib/fatturaPaPdfGenerator";
import { sendInvoiceEmail } from "@/lib/emailNotifications";
import { useDemo } from "@/hooks/useDemo";

/* ---------- Helpers ---------- */
const EUR = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "€ 0,00";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
};
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const clsInput = "border border-[#243044] rounded-lg w-full px-3 py-2 bg-[#141c27] placeholder-slate-600 outline-none focus:ring-1 ring-blue-500/30 text-sm text-slate-200";

const STATUS_CONFIG = {
  draft:        { label: "Bozza",              color: "bg-slate-500/10 text-slate-400" },
  validated:    { label: "Validata",           color: "bg-amber-500/10 text-amber-400" },
  sent:         { label: "Inviata a SDI",      color: "bg-blue-500/10 text-blue-400" },
  transmitted:  { label: "Trasmessa",          color: "bg-blue-500/10 text-blue-400" },
  delivered:    { label: "Consegnata",         color: "bg-emerald-500/10 text-emerald-400" },
  not_delivered:{ label: "Mancata consegna",   color: "bg-amber-500/10 text-amber-400" },
  rejected:     { label: "Scartata SDI",       color: "bg-red-500/10 text-red-400" },
  term_expired: { label: "Decorrenza termini", color: "bg-amber-500/10 text-amber-400" },
  archived:     { label: "Archiviata",         color: "bg-emerald-500/10 text-emerald-400" },
};
const statusBadge = (s) => {
  const cfg = STATUS_CONFIG[s] || STATUS_CONFIG.draft;
  return `inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${cfg.color}`;
};
const statusLabel = (s) => (STATUS_CONFIG[s] || STATUS_CONFIG.draft).label;

export default function InvoiceForm() {
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDemo } = useDemo();

  const [inv, setInv] = useState(null);
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [xml, setXml] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [loadingXml, setLoadingXml] = useState(false);
  const [invoiceXml, setInvoiceXml] = useState(null); // null = non caricato, '' = non disponibile
  const [sdiConfig, setSdiConfig] = useState(null);

  useEffect(() => {
    let mounted = true;
    getSdiConfig().then(c => { if (mounted) setSdiConfig(c); });
    return () => { mounted = false; };
  }, []);

  const totals = useMemo(() => {
    const imponibile = items.reduce((s, r) => s + Number(r.qty||0) * Number(r.price||0), 0);
    const iva = items.reduce((s, r) => s + Number(r.qty||0) * Number(r.price||0) * (Number(r.vat_perc||0) / 100), 0);
    const totale = imponibile + iva;
    return { imponibile, iva, totale };
  }, [items]);

  const customerAddress = useMemo(() => {
    if (!inv) return null;
    if (inv.customer_address && typeof inv.customer_address === "object") {
      return inv.customer_address;
    }
    if (inv.meta?.sdi?.cessionario?.address) {
      return inv.meta.sdi.cessionario.address;
    }
    return null;
  }, [inv]);

  const sdiMeta = inv?.meta?.sdi;
  const trasmissioneMeta = sdiMeta?.trasmissione;

  const formatDateTime = (value) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  // Genera PDF della fattura con template professionale
  async function generateInvoicePDF() {
    if (!inv || !items.length) {
      setErr("Impossibile generare PDF: fattura o righe mancanti.");
      return;
    }

    try {
      const doc = await generateInvoicePdf(inv, items);
      const fileName = `Fattura_N_${inv.number || 'NONUM'}.pdf`;
      doc.save(fileName);
      setInfo("PDF generato e scaricato con successo.");
    } catch (error) {
      console.error("Errore generazione PDF:", error);
      setErr(`Errore generazione PDF: ${error?.message || "Errore sconosciuto"}`);
    }
  }

  async function load() {
    if (!id) return;
    setLoading(true);
    setErr("");
    setInfo("");

    try {
      console.log('[SDI] Caricamento fattura:', id);
      const { data: invData, error: e1 } = await supabase
        .from("invoices")
        .select("id, org_id, customer_name, customer_vat, customer_tax_code, customer_address, number, date, currency, total, sdi_status, provider_ext_id, meta, created_at")
        .eq("id", id)
        .single();
      if (e1) throw e1;

      console.log('[SDI] Fattura caricata - Stato SDI:', invData?.sdi_status);

      const { data: itemsData, error: e2 } = await supabase
        .from("invoice_items")
        .select("id, item_code, item_description, qty, price, vat_perc, discount_type, discount_value, discount_description")
        .eq("invoice_id", id)
        .order("id", { ascending: true });
      if (e2) throw e2;

      const { data: evData, error: e3 } = await supabase
        .from("sdi_events")
        .select("id, event_type, payload, created_at, provider_id")
        .eq("invoice_id", id)
        .order("created_at", { ascending: false });
      if (e3) throw e3;

      setInv(invData);
      setItems(itemsData || []);
      setEvents(evData || []);
      setXml("");
      
      console.log('[SDI] Fattura caricata completamente - Stato:', invData?.sdi_status);
    } catch (e) {
      console.error("load invoice failed", e);
      setErr(String(e?.message || "Impossibile caricare la fattura."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id, orgId]);

  async function validateXml() {
    if (isDemo) {
      alert("\u{1F512} Modalit\u00e0 Demo\n\nLa validazione XML SDI non \u00e8 disponibile in modalit\u00e0 demo.");
      return;
    }
    try {
      console.log('[SDI] validateXml chiamato - Stato attuale:', inv?.sdi_status);
      setErr("");
      setInfo("");
      
      // Validazione locale dei dati fattura
      const errors = [];
      const warnings = [];

      if (!inv.customer_name?.trim()) errors.push('Denominazione cliente mancante');
      if (!inv.customer_vat?.trim() && !inv.customer_tax_code?.trim()) errors.push('P.IVA o Codice Fiscale cliente mancante');
      if (!inv.date) errors.push('Data fattura mancante');
      if (!items || items.length === 0) errors.push('La fattura deve contenere almeno una riga');

      items.forEach((item, i) => {
        const descr = (item.item_description || item.item_code || '').trim();
        if (!descr) errors.push(`Riga ${i + 1}: descrizione obbligatoria`);
        if (!(Number(item.qty) > 0)) errors.push(`Riga ${i + 1}: quantità deve essere > 0`);
        const vatPerc = Number(item.vat_perc ?? 22);
        if (vatPerc !== 0 && vatPerc < 1) errors.push(`Riga ${i + 1}: aliquota IVA non valida (deve essere 0 o ≥ 1%)`);
      });

      const addr = inv.customer_address;
      const hasAddress = addr && (typeof addr === 'string' ? addr.trim() : (addr.street || addr.indirizzo || addr.city));
      if (!hasAddress) warnings.push('Indirizzo cliente non compilato');

      if (errors.length > 0) {
        setErr('Errori di validazione:\n' + errors.join('\n'));
        return;
      }

      if (warnings.length > 0) {
        const proceed = confirm('Avvisi (non bloccanti):\n\n' + warnings.join('\n') + '\n\nProcedere con la validazione?');
        if (!proceed) return;
      }
      
      console.log('[SDI] Validazione OK, aggiornamento stato a "validated"...');
      const { error } = await supabase
        .from("invoices")
        .update({ 
          sdi_status: "validated",
          meta: {
            ...inv.meta,
            validated_at: new Date().toISOString(),
          }
        })
        .eq("id", id);
      
      if (error) {
        console.error('[SDI] Errore aggiornamento stato:', error);
        throw error;
      }
      
      await load();
      setInfo("Fattura validata con successo e pronta per l'invio.");
    } catch (e) {
      console.error('[SDI] Errore validazione:', e);
      setErr(String(e?.message || "Validazione non riuscita."));
    }
  }

  async function send() {
    if (isDemo) {
      alert("\u{1F512} Modalit\u00e0 Demo\n\nL'invio fatture al Sistema di Interscambio non \u00e8 disponibile in modalit\u00e0 demo.");
      return;
    }
    try {
      setSending(true);
      setErr("");
      setInfo("");
      
      // Verifica che la fattura sia validata
      if (inv.sdi_status !== "validated" && inv.sdi_status !== "rejected") {
        setErr("Fattura non validata. Valida prima l'XML.");
        return;
      }

      // Dialog di conferma pre-invio
      const confirmMsg = [
        `Confermi l'invio a SDI?`,
        ``,
        `Fattura: ${inv.number || "—"}`,
        `Cliente: ${inv.customer_name || "—"}`,
        `Totale: ${EUR(inv.total)}`,
        `Data: ${inv.date ? new Date(inv.date).toLocaleDateString("it-IT") : "—"}`,
        ``,
        `L'invio al Sistema di Interscambio è irreversibile.`,
      ].join("\n");
      if (!confirm(confirmMsg)) {
        setSending(false);
        return;
      }
      // Invia fattura al SDI tramite API SFTP
      const result = await sendInvoiceToSDI(id, { orgId });
      
      console.log('[SDI] Risposta API:', result);
      
      if (!result.success) {
        const errorMsg = result.error || result.message || "Invio non riuscito";
        console.error('[SDI] Errore invio:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('[SDI] Invio riuscito, identificativo SDI:', result.identificativo_sdi);

      // Il server ha già aggiornato lo stato a "sent" dopo l'invio riuscito
      // Non serve fare un altro aggiornamento qui per evitare conflitti
      // Ricarica semplicemente la fattura per mostrare lo stato aggiornato
      console.log('[SDI] Invio completato, ricarico fattura per mostrare stato aggiornato');
      await load();
      
      // Mostra messaggio di successo
      const identificativoSDI = result.identificativo_sdi || result.identificativoSDI;
      if (identificativoSDI) {
        setErr("");
        setInfo(`Invio completato con successo. Identificativo SdI: ${identificativoSDI}`);
        console.log('[SDI] Invio completato con successo');
      } else {
        console.warn('[SDI] Invio riuscito ma nessun identificativo SDI ricevuto');
        setErr("");
        setInfo("Invio completato. In attesa dell'identificativo SdI.");
      }
    } catch (e) {
      console.error('[SDI] Errore durante invio:', e);
      setErr(String(e?.message || "Invio non riuscito."));
    } finally {
      setSending(false);
    }
  }

  async function conserve() {
    try {
      const { error } = await supabase.rpc("rpc_invoice_conserve", { p_invoice_id: id });
      if (error) throw error;
      await load();
      setErr("");
      setInfo("Richiesta di conservazione inoltrata.");
    } catch (e) {
      setErr(String(e?.message || "Conservazione non riuscita."));
    }
  }

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="flex items-center gap-3"><div className="h-8 w-8 bg-[#243044] rounded-lg" /><div className="h-5 w-48 bg-[#243044] rounded" /></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-48 bg-[#1a2536] rounded-xl border border-[#243044]" />
          <div className="lg:col-span-2 h-48 bg-[#1a2536] rounded-xl border border-[#243044]" />
        </div>
        <div className="h-64 bg-[#1a2536] rounded-xl border border-[#243044]" />
      </div>
    );
  }

  if (!inv) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FiAlertCircle className="w-10 h-10 text-slate-600 mb-3" />
        <p className="text-sm text-slate-400 mb-4">Fattura non trovata</p>
        <button onClick={() => navigate("/fatture")} className="h-8 px-3 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
          <FiArrowLeft className="w-3.5 h-3.5 inline mr-1" /> Torna alla lista
        </button>
      </div>
    );
  }

  const canValidate = inv.sdi_status === "draft" || inv.sdi_status === "rejected";
  const canSend = inv.sdi_status === "validated" || inv.sdi_status === "rejected";
  const canConserve = inv.sdi_status === "delivered";
  const canEdit = inv.sdi_status === "draft" || inv.sdi_status === "rejected";
  const canDelete = inv.sdi_status === "draft" || inv.sdi_status === "rejected";
  const canStorno = inv.sdi_status === "sent" || inv.sdi_status === "delivered";

  async function stornoInvoice() {
    const confirmMsg = [
      `Stornare la fattura N. ${inv.number || '—'}?`,
      ``,
      `Verrà creata automaticamente una Nota di Credito (TD04)`,
      `con gli stessi importi della fattura originale.`,
      ``,
      `La nota di credito dovrà poi essere validata e inviata a SDI.`,
    ].join("\n");
    if (!confirm(confirmMsg)) return;

    try {
      setErr("");
      setInfo("");

      // Recupera le righe della fattura originale
      const { data: origItems, error: itemsErr } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", id)
        .order("id", { ascending: true });
      if (itemsErr) throw itemsErr;

      // Crea la nota di credito
      const now = new Date().toISOString().slice(0, 10);
      const creditNoteMeta = {
        ...(inv.meta || {}),
        sdi: {
          ...(inv.meta?.sdi || {}),
          documento: {
            ...(inv.meta?.sdi?.documento || {}),
            tipo_documento: "TD04",
          },
          original_invoice: {
            id: inv.id,
            number: inv.number,
            date: inv.date,
          },
        },
        storno_di: inv.id,
        storno_numero_originale: inv.number,
        storno_data_originale: inv.date,
      };

      const { data: newInv, error: createErr } = await supabase
        .from("invoices")
        .insert({
          org_id: inv.org_id,
          customer_name: inv.customer_name,
          customer_vat: inv.customer_vat,
          customer_tax_code: inv.customer_tax_code,
          customer_address: inv.customer_address,
          date: now,
          currency: inv.currency || "EUR",
          total: inv.total,
          sdi_status: "draft",
          original_invoice_id: inv.id,
          meta: creditNoteMeta,
          note: `Storno integrale fattura N. ${inv.number || '—'} del ${inv.date ? new Date(inv.date).toLocaleDateString('it-IT') : '—'}`,
        })
        .select("id")
        .single();
      if (createErr) throw createErr;

      // Copia le righe nella nota di credito
      if (origItems && origItems.length > 0) {
        const newItems = origItems.map(item => ({
          invoice_id: newInv.id,
          descr: item.descr,
          item_code: item.item_code,
          item_description: item.item_description,
          qty: item.qty,
          price: item.price,
          vat_perc: item.vat_perc,
        }));
        const { error: insertItemsErr } = await supabase
          .from("invoice_items")
          .insert(newItems);
        if (insertItemsErr) throw insertItemsErr;
      }

      // Aggiorna la fattura originale con riferimento allo storno
      const { error: updateErr } = await supabase
        .from("invoices")
        .update({
          meta: {
            ...(inv.meta || {}),
            stornata: true,
            storno_invoice_id: newInv.id,
            storno_date: now,
          },
        })
        .eq("id", id);
      if (updateErr) console.warn("Errore aggiornamento fattura originale:", updateErr);

      // Naviga alla nota di credito appena creata
      navigate(`/fatture/${newInv.id}`);
      setInfo("Nota di Credito (TD04) creata. Validala e inviala a SDI per completare lo storno.");
    } catch (e) {
      console.error("Errore storno:", e);
      setErr(`Errore creazione nota di credito: ${e?.message || "Errore sconosciuto"}`);
    }
  }

  async function deleteInvoice() {
    if (!confirm(`Eliminare definitivamente la fattura ${inv.number || ''}? Questa azione non è reversibile.`)) return;
    try {
      // Elimina righe, eventi, pagamenti collegati
      await supabase.from("invoice_items").delete().eq("invoice_id", id);
      await supabase.from("sdi_events").delete().eq("invoice_id", id);
      await supabase.from("invoice_payments").delete().eq("invoice_id", id);
      await supabase.from("invoice_reminders").delete().eq("invoice_id", id);
      // Elimina movimenti contabili collegati
      await supabase.from("accounting_entries").delete().eq("invoice_id", id);
      // Elimina fattura
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
      navigate("/fatture");
    } catch (e) {
      setErr(`Errore eliminazione: ${e?.message || "Errore sconosciuto"}`);
    }
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/fatture")}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#243044] bg-[#1a2536] text-slate-400 hover:bg-[#1e2b3d] transition">
            <FiArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold bg-blue-500/15 text-blue-400">
              <FiFileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-100">
                Fattura {inv.number ? `N. ${inv.number}` : "—"}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[10px] text-slate-500">{inv.customer_name || "—"}</span>
                <span className="text-[10px] text-slate-600">•</span>
                <span className="text-[10px] text-slate-500">{fmtDate(inv.date)}</span>
                <span className="text-[10px] text-slate-600">•</span>
                <span className="text-[10px] text-slate-300 font-medium">{EUR(inv.total)}</span>
                <span className={statusBadge(inv.sdi_status)}>{statusLabel(inv.sdi_status)}</span>
                {sdiConfig?.environment && sdiConfig.environment !== 'UNKNOWN' && (
                  <span
                    title={`Ambiente SDI deciso dal VPS (${sdiConfig.upload_dir || ''})`}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      sdiConfig.test_mode
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {sdiConfig.test_mode ? '🧪 Test' : '✓ Prod'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition">
            <FiRefreshCw className="w-3.5 h-3.5 inline mr-1" />
          </button>
          <button onClick={() => navigate(`/fatture/${id}/pagamenti`)}
            className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition">
            <FiCreditCard className="w-3.5 h-3.5 inline mr-1" /> Pagamenti
          </button>
          <button onClick={generateInvoicePDF} disabled={!items.length}
            className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition disabled:opacity-50">
            <FiDownload className="w-3.5 h-3.5 inline mr-1" /> PDF
          </button>
          {canEdit && (
            <button onClick={() => navigate(`/fatture/new?edit=${id}`)}
              className="h-8 px-3 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-600/20">
              <FiEdit className="w-3.5 h-3.5 inline mr-1" /> Modifica
            </button>
          )}
          {canStorno && (
            <button onClick={stornoInvoice}
              className="h-8 px-3 text-xs font-medium text-amber-400 bg-[#1a2536] border border-amber-500/20 rounded-lg hover:bg-amber-500/10 transition">
              <FiRotateCcw className="w-3.5 h-3.5 inline mr-1" /> Storna
            </button>
          )}
          {canDelete && (
            <button onClick={deleteInvoice}
              className="h-8 px-3 text-xs font-medium text-red-400 bg-[#1a2536] border border-red-500/20 rounded-lg hover:bg-red-500/10 transition">
              <FiTrash2 className="w-3.5 h-3.5 inline mr-1" /> Elimina
            </button>
          )}
          <button onClick={async () => {
            // Cerca email cliente da clients table
            try {
              const { data: cl } = await supabase.from("clients").select("email").eq("org_id", orgId)
                .or(`nome.ilike.%${inv.customer_name}%,piva.eq.${inv.customer_vat || 'NONE'}`).limit(1).maybeSingle();
              setEmailTo(cl?.email || "");
            } catch { setEmailTo(""); }
            setShowEmailModal(true);
          }}
            className="h-8 px-3 text-xs font-medium text-purple-400 bg-[#1a2536] border border-purple-500/20 rounded-lg hover:bg-purple-500/10 transition">
            <FiMail className="w-3.5 h-3.5 inline mr-1" /> Invia Email
          </button>
        </div>
      </div>

      {/* ── Alerts ── */}
      {err && (
        <div className="bg-red-500/5 rounded-xl border border-red-500/15 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <FiAlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-xs text-red-400 flex-1 whitespace-pre-wrap">{err}</span>
            <button onClick={() => setErr("")} className="text-red-400 hover:text-red-300"><FiX className="w-3 h-3" /></button>
          </div>
        </div>
      )}
      {info && (
        <div className="bg-emerald-500/5 rounded-xl border border-emerald-500/15 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <FiCheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-xs text-emerald-400 flex-1">{info}</span>
            <button onClick={() => setInfo("")} className="text-emerald-400 hover:text-emerald-300"><FiX className="w-3 h-3" /></button>
          </div>
        </div>
      )}
      {inv.sdi_status === "rejected" && inv.meta?.sdi_rejection_code && (
        <div className="bg-red-500/5 rounded-xl border border-red-500/30 px-4 py-3">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-red-300 uppercase tracking-wider">Fattura scartata dal SDI</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-300 rounded border border-red-500/30 font-mono">Cod. {inv.meta.sdi_rejection_code}</span>
                {inv.meta.sdi_ns_received_at && (
                  <span className="text-[10px] text-slate-500">{new Date(inv.meta.sdi_ns_received_at).toLocaleString('it-IT')}</span>
                )}
              </div>
              <p className="text-xs text-red-200 leading-relaxed">
                <strong>Motivo:</strong> {inv.meta.sdi_rejection_description || "Errore non specificato"}
              </p>
              {inv.meta.sdi_rejection_suggestion && (
                <p className="text-xs text-red-200/80 leading-relaxed">
                  <strong>💡 Suggerimento:</strong> {inv.meta.sdi_rejection_suggestion}
                </p>
              )}
              {Array.isArray(inv.meta.sdi_rejection_errors) && inv.meta.sdi_rejection_errors.length > 1 && (
                <details className="mt-1.5">
                  <summary className="text-[10px] text-red-300 cursor-pointer hover:text-red-200">
                    Mostra tutti gli errori ({inv.meta.sdi_rejection_errors.length})
                  </summary>
                  <ul className="mt-1.5 space-y-1 ml-3">
                    {inv.meta.sdi_rejection_errors.map((e, i) => (
                      <li key={i} className="text-[11px] text-red-200/90">
                        <span className="font-mono font-bold">{e.codice}</span>: {e.descrizione}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <p className="text-[10px] text-slate-500 mt-2 italic">
                Correggi i dati e usa "Modifica" per generare una nuova versione.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Banner Storno ── */}
      {inv.meta?.stornata && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2.5">
            <FiRotateCcw className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-xs text-amber-400 flex-1">
              Questa fattura è stata stornata con Nota di Credito.
              {inv.meta?.storno_invoice_id && (
                <button
                  onClick={() => navigate(`/fatture/${inv.meta.storno_invoice_id}`)}
                  className="ml-2 underline hover:text-amber-300 transition"
                >
                  Vai alla Nota di Credito
                </button>
              )}
            </span>
          </div>
        </div>
      )}
      {inv.meta?.storno_di && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2.5">
            <FiRotateCcw className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="text-xs text-blue-400 flex-1">
              Nota di Credito (TD04) — Storno della fattura N. {inv.meta?.storno_numero_originale || '—'} del {inv.meta?.storno_data_originale ? new Date(inv.meta.storno_data_originale).toLocaleDateString('it-IT') : '—'}.
              <button
                onClick={() => navigate(`/fatture/${inv.meta.storno_di}`)}
                className="ml-2 underline hover:text-blue-300 transition"
              >
                Vai alla fattura originale
              </button>
            </span>
          </div>
        </div>
      )}

      {/* ── Top: Info + Trasmissione ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Info fattura */}
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#243044]">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dettagli Fattura</h3>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0"><FiUser className="w-3.5 h-3.5 text-blue-400" /></div>
              <div><div className="text-[10px] text-slate-500">Cliente</div><div className="text-xs text-slate-200">{inv.customer_name || "—"}</div></div>
            </div>
            {inv.customer_vat && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0"><FiHash className="w-3.5 h-3.5 text-purple-400" /></div>
                <div><div className="text-[10px] text-slate-500">P.IVA</div><div className="text-xs text-slate-200 font-mono">{inv.customer_vat}</div></div>
              </div>
            )}
            {inv.customer_tax_code && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0"><FiHash className="w-3.5 h-3.5 text-purple-400" /></div>
                <div><div className="text-[10px] text-slate-500">Codice Fiscale</div><div className="text-xs text-slate-200 font-mono">{inv.customer_tax_code}</div></div>
              </div>
            )}
            {customerAddress && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0"><FiCalendar className="w-3.5 h-3.5 text-amber-400" /></div>
                <div>
                  <div className="text-[10px] text-slate-500">Indirizzo</div>
                  <div className="text-xs text-slate-200">{customerAddress.street || customerAddress.address || customerAddress.via || ""}</div>
                  <div className="text-xs text-slate-400">{customerAddress.zip || customerAddress.cap || ""} {customerAddress.city || customerAddress.comune || ""} {customerAddress.province || customerAddress.provincia ? `(${customerAddress.province || customerAddress.provincia})` : ""}</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0"><FiCreditCard className="w-3.5 h-3.5 text-emerald-400" /></div>
              <div><div className="text-[10px] text-slate-500">Totale</div><div className="text-sm text-slate-100 font-semibold">{EUR(inv.total)}</div></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-500/10 flex items-center justify-center flex-shrink-0"><FiCalendar className="w-3.5 h-3.5 text-slate-400" /></div>
              <div><div className="text-[10px] text-slate-500">Data</div><div className="text-xs text-slate-200">{fmtDate(inv.date)}</div></div>
            </div>
            {inv.provider_ext_id && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0"><FiHash className="w-3.5 h-3.5 text-blue-400" /></div>
                <div><div className="text-[10px] text-slate-500">ID SdI</div><div className="text-xs text-slate-200 font-mono">{inv.provider_ext_id}</div></div>
              </div>
            )}
          </div>
        </div>

        {/* Trasmissione + Azioni */}
        <div className="lg:col-span-2 space-y-4">

          {/* Dettagli trasmissione */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#243044] flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trasmissione SDI</h3>
            </div>
            <div className="p-5 grid grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] text-slate-500 mb-1">Progressivo</div>
                <div className="text-xs text-slate-200 font-medium">{sdiMeta?.progressivo_invio || inv.number || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 mb-1">Cod. Destinatario</div>
                <div className="text-xs text-slate-200 font-mono">{trasmissioneMeta?.codice_destinatario || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 mb-1">PEC Destinatario</div>
                <div className="text-xs text-slate-200 break-all">{trasmissioneMeta?.pec_destinatario || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 mb-1">Ultimo invio</div>
                <div className="text-xs text-slate-200">{formatDateTime(inv.meta?.sdi_sent_at)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 mb-1">ID SdI</div>
                <div className="text-xs text-slate-200 font-mono">{inv.provider_ext_id || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 mb-1">Firma</div>
                <div className="text-xs text-blue-400">CAdES-BES automatica</div>
              </div>
            </div>
          </div>

          {/* Azioni SDI */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#243044]">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Azioni</h3>
            </div>
            <div className="p-5 flex flex-wrap gap-2">
              {/* Valida */}
              <button
                onClick={async () => {
                  console.log('[SDI] Click su "Valida" - Stato attuale:', inv.sdi_status);
                  await validateXml();
                }}
                disabled={!canValidate}
                className="h-8 px-3 text-xs font-medium text-slate-300 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition disabled:opacity-40 disabled:cursor-not-allowed"
                title={canValidate ? "Valida XML e marca come pronta per l'invio" : `Non disponibile nello stato: ${statusLabel(inv.sdi_status)}`}
              >
                <FiFileText className="w-3.5 h-3.5 inline mr-1" /> Valida XML
              </button>

              {/* Invia */}
              <button
                onClick={send}
                disabled={!canSend || sending}
                className="h-8 px-3 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                title={canSend ? "Genera XML, firma CAdES-BES e invia tramite SFTP" : `Valida prima la fattura (stato: ${statusLabel(inv.sdi_status)})`}
              >
                <FiSend className="w-3.5 h-3.5 inline mr-1" /> {sending ? "Invio…" : "Invia al SDI"}
              </button>

              {/* Conserva */}
              <button
                onClick={conserve}
                disabled={!canConserve}
                className="h-8 px-3 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/15 transition disabled:opacity-40 disabled:cursor-not-allowed"
                title={canConserve ? "Avvia conservazione sostitutiva" : "Disponibile solo dopo la consegna"}
              >
                <FiArchive className="w-3.5 h-3.5 inline mr-1" /> Conserva
              </button>


              {/* Hint stato */}
              {inv.sdi_status === "draft" && (
                <span className="text-[10px] text-slate-500 self-center ml-2">Valida l'XML per abilitare l'invio</span>
              )}
              {inv.sdi_status === "validated" && (
                <span className="text-[10px] text-emerald-400 self-center ml-2">Pronta per l'invio</span>
              )}
              {inv.sdi_status === "sent" && (
                <span className="text-[10px] text-blue-400 self-center ml-2">In attesa di esito dal SdI</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Righe fattura ── */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden print:hidden">
        <div className="px-5 py-3 border-b border-[#243044]">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Righe Dettaglio</h3>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#243044]">
              <th className="text-left px-5 py-2.5 text-[10px] text-slate-500 uppercase tracking-wider font-medium">Descrizione</th>
              <th className="text-center px-3 py-2.5 text-[10px] text-slate-500 uppercase tracking-wider font-medium w-16">Q.tà</th>
              <th className="text-right px-3 py-2.5 text-[10px] text-slate-500 uppercase tracking-wider font-medium w-24">Prezzo</th>
              <th className="text-right px-3 py-2.5 text-[10px] text-slate-500 uppercase tracking-wider font-medium w-16">IVA</th>
              <th className="text-right px-5 py-2.5 text-[10px] text-slate-500 uppercase tracking-wider font-medium w-24">Importo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#243044]/50">
            {items.length ? items.map((r) => {
              const imp = Number(r.qty||0)*Number(r.price||0);
              return (
                <tr key={r.id} className="hover:bg-[#141c27]/50 transition-colors">
                  <td className="px-5 py-2.5 text-slate-200">{r.descr}</td>
                  <td className="px-3 py-2.5 text-center text-slate-300">{r.qty}</td>
                  <td className="px-3 py-2.5 text-right text-slate-300">{EUR(r.price)}</td>
                  <td className="px-3 py-2.5 text-right text-slate-400">{Number(r.vat_perc||0)}%</td>
                  <td className="px-5 py-2.5 text-right text-slate-200 font-medium">{EUR(imp)}</td>
                </tr>
              );
            }) : (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500 text-xs">Nessuna riga</td></tr>
            )}
          </tbody>
        </table>
        {/* Totali */}
        <div className="border-t border-[#243044] px-5 py-3">
          <div className="flex justify-end">
            <div className="w-56 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Imponibile</span>
                <span className="text-slate-300">{EUR(totals.imponibile)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">IVA</span>
                <span className="text-slate-300">{EUR(totals.iva)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1.5 border-t border-[#243044]">
                <span className="text-slate-200 font-semibold">Totale</span>
                <span className="text-slate-100 font-semibold">{EUR(totals.totale)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Eventi SdI ── */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden print:hidden">
        <div className="px-5 py-3 border-b border-[#243044]">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Eventi SdI</h3>
        </div>
        <div className="p-5">
          {events.length ? (
            <div className="space-y-3">
              {events.map(ev => (
                <div key={ev.id} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    ev.event_type === "RicevutaConsegna" ? "bg-emerald-500/10" :
                    ev.event_type === "NotificaScarto" ? "bg-red-500/10" :
                    "bg-slate-500/10"
                  }`}>
                    {ev.event_type === "RicevutaConsegna" ? <FiCheckCircle className="w-3.5 h-3.5 text-emerald-400" /> :
                     ev.event_type === "NotificaScarto" ? <FiXCircle className="w-3.5 h-3.5 text-red-400" /> :
                     <FiClock className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-200">{ev.event_type}</span>
                      <span className="text-[10px] text-slate-500">{new Date(ev.created_at).toLocaleString("it-IT")}</span>
                    </div>
                    {ev.payload && (
                      <pre className="mt-1.5 text-[10px] text-slate-400 bg-[#141c27] border border-[#243044] p-2.5 rounded-lg overflow-auto max-h-32">
                        {JSON.stringify(ev.payload, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <FiActivity className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Nessun evento registrato</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Sezione SDI & XML ── */}
      {(inv.sdi_status !== 'draft') && (
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden print:hidden">
          <div className="px-5 py-3 border-b border-[#243044] flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiCode className="w-3.5 h-3.5" /> Documentazione SDI
            </h3>
          </div>
          <div className="p-5 space-y-4">
            {/* Riepilogo stato */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#141c27] rounded-lg p-3 border border-[#243044]">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Stato</div>
                <span className={statusBadge(inv.sdi_status)}>{statusLabel(inv.sdi_status)}</span>
              </div>
              <div className="bg-[#141c27] rounded-lg p-3 border border-[#243044]">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">ID SdI</div>
                <div className="text-xs text-slate-200 font-mono">{inv.provider_ext_id || '—'}</div>
              </div>
              <div className="bg-[#141c27] rounded-lg p-3 border border-[#243044]">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Data Invio</div>
                <div className="text-xs text-slate-200">{formatDateTime(inv.meta?.sdi_sent_at)}</div>
              </div>
              <div className="bg-[#141c27] rounded-lg p-3 border border-[#243044]">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Firma</div>
                <div className="text-xs text-blue-400">CAdES-BES</div>
              </div>
            </div>

            {/* Conferma FO (ricevuta SDI) */}
            {inv.meta?.sdi_confirmation_xml && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FiCheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">Conferma FO ricevuta dal SDI</span>
                  {inv.meta?.sdi_confirmation_at && (
                    <span className="text-[10px] text-slate-500 ml-auto">{new Date(inv.meta.sdi_confirmation_at).toLocaleString('it-IT')}</span>
                  )}
                </div>
                {inv.meta?.sdi_confirmation_fo && (
                  <div className="text-[10px] text-slate-500 font-mono mb-2">{inv.meta.sdi_confirmation_fo}</div>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      try {
                        downloadFatturaPaPdf(inv.meta.sdi_confirmation_xml, `Conferma_FO_${(inv.number || 'NONUM').replace(/\//g, '-')}`, { foFilename: inv.meta.sdi_confirmation_fo });
                      } catch (e) { setErr('Errore generazione PDF: ' + e.message); }
                    }}
                    className="h-7 px-2.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/15 transition"
                  >
                    <FiDownload className="w-3 h-3 inline mr-1" /> Scarica PDF Conferma
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([inv.meta.sdi_confirmation_xml], { type: 'application/xml' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Conferma_FO_${(inv.number || 'NONUM').replace(/\//g, '-')}.xml`;
                      document.body.appendChild(a);
                      a.click();
                      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
                    }}
                    className="h-7 px-2.5 text-[11px] font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition"
                  >
                    <FiDownload className="w-3 h-3 inline mr-1" /> Scarica XML
                  </button>
                  <button
                    onClick={() => { setXml(inv.meta.sdi_confirmation_xml); }}
                    className="h-7 px-2.5 text-[11px] font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition"
                  >
                    <FiCode className="w-3 h-3 inline mr-1" /> Mostra XML
                  </button>
                </div>
              </div>
            )}
            {!inv.meta?.sdi_confirmation_xml && (inv.sdi_status === 'sent' || inv.sdi_status === 'delivered') && (
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-3 flex items-center gap-2">
                <FiInfo className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="text-[11px] text-amber-400">
                  Conferma FO non ancora ricevuta. Verrà associata automaticamente quando il file FO arriva nella casella SFTP.
                </span>
              </div>
            )}

            {/* XML Inviato Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={async () => {
                  setLoadingXml(true);
                  try {
                    const xmlData = await getInvoiceXML(id);
                    setInvoiceXml(xmlData || '');
                    if (xmlData) setXml(xmlData);
                    else setErr('XML non ancora disponibile per questa fattura.');
                  } catch (e) {
                    setErr('Errore recupero XML: ' + (e?.message || 'Sconosciuto'));
                  } finally {
                    setLoadingXml(false);
                  }
                }}
                disabled={loadingXml}
                className="h-8 px-3 text-xs font-medium text-slate-300 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition disabled:opacity-50"
              >
                {loadingXml ? (
                  <><div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin inline-block mr-1.5" /> Caricamento...</>
                ) : (
                  <><FiCode className="w-3.5 h-3.5 inline mr-1" /> Mostra XML Inviato</>
                )}
              </button>
              {invoiceXml && (
                <>
                  <button
                    onClick={() => {
                      try {
                        downloadFatturaPaPdf(invoiceXml, `Fattura_${(inv.number || 'NONUM').replace(/\//g, '-')}_SDI`);
                      } catch (e) { setErr('Errore generazione PDF: ' + e.message); }
                    }}
                    className="h-8 px-3 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/15 transition"
                  >
                    <FiFileText className="w-3.5 h-3.5 inline mr-1" /> Scarica PDF
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([invoiceXml], { type: 'application/xml' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Fattura_${(inv.number || 'NONUM').replace(/\//g, '-')}_SDI.xml`;
                      document.body.appendChild(a);
                      a.click();
                      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
                    }}
                    className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition"
                  >
                    <FiDownload className="w-3.5 h-3.5 inline mr-1" /> Scarica XML
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(invoiceXml);
                      setInfo('XML copiato negli appunti');
                    }}
                    className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition"
                  >
                    <FiCopy className="w-3.5 h-3.5 inline mr-1" /> Copia
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Anteprima XML ── */}
      {xml && (
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden print:hidden">
          <div className="px-5 py-3 border-b border-[#243044]">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Anteprima XML</h3>
          </div>
          <div className="p-5">
            <textarea className={clsInput + " font-mono text-[10px] h-64"} readOnly value={xml} />
          </div>
        </div>
      )}

      {/* ── Versione stampabile ── */}
      <div className="hidden print:block print-invoice">
        <div className="p-8">
          <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b-2 border-[#243044]">
            <div>
              <h1 className="text-lg font-semibold text-slate-100 mb-4">FATTURA</h1>
              <div className="space-y-1 text-sm">
                <div className="font-semibold text-lg">{inv.meta?.sdi?.cedente_prestatore?.denominazione || "—"}</div>
                {inv.meta?.sdi?.cedente_prestatore?.partita_iva && <div>P.IVA: {inv.meta.sdi.cedente_prestatore.partita_iva}</div>}
                {inv.meta?.sdi?.cedente_prestatore?.codice_fiscale && <div>C.F.: {inv.meta.sdi.cedente_prestatore.codice_fiscale}</div>}
              </div>
            </div>
            <div className="text-right space-y-1 text-sm">
              <div className="text-2xl font-bold mb-2">N. {inv.number}</div>
              <div>Data: <strong>{inv.date ? new Date(inv.date).toLocaleDateString("it-IT") : "—"}</strong></div>
            </div>
          </div>
          <div className="mb-8 pb-6 border-b border-[#243044]">
            <div className="text-xs text-slate-400 mb-2">CLIENTE / DESTINATARIO</div>
            <div className="font-semibold text-lg mb-2">{inv.customer_name || "—"}</div>
            <div className="text-sm space-y-1">
              {inv.customer_vat && <div>P.IVA: {inv.customer_vat}</div>}
              {inv.customer_tax_code && <div>C.F.: {inv.customer_tax_code}</div>}
              {customerAddress && (
                <div className="mt-2">
                  <div>{customerAddress.street || customerAddress.address || ""}</div>
                  <div>{customerAddress.zip || ""} {customerAddress.city || ""} {customerAddress.province ? `(${customerAddress.province})` : ""}</div>
                </div>
              )}
            </div>
          </div>
          <div className="mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#243044] border-b-2 border-[#243044]">
                  <th className="text-left py-3 px-3 font-semibold">Descrizione</th>
                  <th className="text-center py-3 px-3 font-semibold w-20">Q.tà</th>
                  <th className="text-right py-3 px-3 font-semibold w-28">Prezzo</th>
                  <th className="text-right py-3 px-3 font-semibold w-20">IVA %</th>
                  <th className="text-right py-3 px-3 font-semibold w-28">Totale</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const importo = Number(item.qty || 0) * Number(item.price || 0);
                  return (
                    <tr key={i} className="border-b border-[#243044]">
                      <td className="py-3 px-3">{item.descr}</td>
                      <td className="py-3 px-3 text-center">{item.qty}</td>
                      <td className="py-3 px-3 text-right">{EUR(item.price)}</td>
                      <td className="py-3 px-3 text-right">{item.vat_perc}%</td>
                      <td className="py-3 px-3 text-right font-semibold">{EUR(importo)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mb-8">
            <div className="w-80 space-y-2 text-sm">
              <div className="flex justify-between py-2"><span>Imponibile:</span><span className="font-semibold">{EUR(totals.imponibile)}</span></div>
              <div className="flex justify-between py-2"><span>IVA:</span><span className="font-semibold">{EUR(totals.iva)}</span></div>
              <div className="flex justify-between py-3 border-t-2 border-[#243044] text-lg font-bold"><span>TOTALE:</span><span>{EUR(totals.totale)}</span></div>
            </div>
          </div>
          {(inv.meta?.sdi?.note || inv.meta?.sdi?.pagamento) && (
            <div className="border-t border-[#243044] pt-6 mt-6 space-y-4">
              {inv.meta.sdi.note && (
                <div>
                  <div className="text-xs text-slate-400 mb-1 font-semibold">NOTE</div>
                  <div className="text-sm whitespace-pre-wrap">{inv.meta.sdi.note}</div>
                </div>
              )}
              {inv.meta.sdi.pagamento && (
                <div>
                  <div className="text-xs text-slate-400 mb-1 font-semibold">MODALITÀ DI PAGAMENTO</div>
                  <div className="text-sm space-y-1">
                    {inv.meta.sdi.pagamento.modalita && <div>Modalità: <strong>{inv.meta.sdi.pagamento.modalita}</strong></div>}
                    {inv.meta.sdi.pagamento.scadenza && <div>Scadenza: <strong>{new Date(inv.meta.sdi.pagamento.scadenza).toLocaleDateString("it-IT")}</strong></div>}
                    {inv.meta.sdi.pagamento.iban && <div>IBAN: <strong>{inv.meta.sdi.pagamento.iban}</strong></div>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Invia Email ── */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEmailModal(false)} />
          <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-5">
            <div className="text-sm font-semibold text-slate-200 mb-1.5">Invia Fattura via Email</div>
            <div className="text-xs text-slate-400 mb-4">
              Fattura N. {inv.number || "—"} — {EUR(inv.total)} — {inv.customer_name || "—"}
            </div>
            <label className="block text-xs text-slate-400 mb-1">Email destinatario</label>
            <input
              type="email"
              value={emailTo}
              onChange={e => setEmailTo(e.target.value)}
              placeholder="cliente@email.com"
              className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 outline-none focus:ring-1 ring-blue-500/30 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowEmailModal(false)}
                className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#243044] transition">
                Annulla
              </button>
              <button
                disabled={!emailTo?.includes("@") || sendingEmail}
                onClick={async () => {
                  setSendingEmail(true);
                  try {
                    const { data: orgData } = await supabase.from("orgs").select("name").eq("id", orgId).maybeSingle();
                    let pdfBase64 = null;
                    try {
                      const pdfDoc = await generateInvoicePdf(inv, items);
                      pdfBase64 = pdfDoc.output('datauristring').split(',')[1];
                    } catch { /* allegato opzionale, continua senza */ }
                    await sendInvoiceEmail({
                      to: emailTo,
                      invoiceNumber: inv.number || "—",
                      invoiceDate: fmtDate(inv.date),
                      amount: EUR(inv.total),
                      customerName: inv.customer_name || "Cliente",
                      orgName: orgData?.name || "RescueManager",
                      attachmentBase64: pdfBase64,
                      attachmentName: `Fattura_${(inv.number || "bozza").replace(/\//g, "-")}.pdf`,
                    });
                    setInfo(`Email inviata a ${emailTo}`);
                    setShowEmailModal(false);
                  } catch (e) {
                    setErr(`Errore invio email: ${e?.message || "Errore sconosciuto"}`);
                  } finally {
                    setSendingEmail(false);
                  }
                }}
                className="h-8 px-3 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
                <FiMail className="w-3.5 h-3.5 inline mr-1" /> {sendingEmail ? "Invio..." : "Invia"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          @page { margin: 1.5cm; size: A4; }
          .print\\:hidden { display: none !important; }
          .print-invoice { display: block !important; }
        }
        .print-invoice { display: none; }
      `}</style>
    </div>
  );
}