/**
 * New Quote Form Page
 * Crea nuovo preventivo con righe, clienti e calcoli automatici
 * 
 * @author haxies
 * @created 2025
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FiArrowLeft, FiSave, FiUser, FiFileText, FiAlertTriangle, FiCheck, FiPlus, FiTrash2, FiRefreshCcw, FiPrinter, FiMail } from "react-icons/fi";
import { supabaseBrowser } from "../lib/supabase-browser";
import { useOrg } from "../context/OrgContext";
import { sendQuoteEmail } from "../lib/emailNotifications";

/* ---------- Helpers ---------- */
const EURO = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
const parseNum = (v) => (Number.isNaN(Number.parseFloat(v)) ? 0 : Number.parseFloat(v));
const formatEuro = (n) => EURO.format(Number.isFinite(n) ? n : 0);
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/* ---------- Input class helper ---------- */
const inputCls = (err) => `w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500/40 outline-none transition-colors bg-[#141c27] ${err ? "border-red-500/30" : "border-[#243044]"}`;
const selectCls = "w-full px-3 py-2 text-sm border border-[#243044] rounded-lg focus:ring-1 focus:ring-blue-500/40 outline-none transition-colors bg-[#141c27]";

/* ---------- Status map ---------- */
const STATUS_MAP = {
  bozza:     { label: "Bozza",     cls: "bg-slate-500/10 text-slate-300 border-slate-500/20" },
  inviato:   { label: "Inviato",   cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  accettato: { label: "Accettato", cls: "bg-green-500/10 text-green-400 border-green-500/20" },
  rifiutato: { label: "Rifiutato", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  fatturato: { label: "Fatturato", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
};
const STATUS_OPTIONS = Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }));

/* ---------- Totals ---------- */
function computeTotals(q) {
  const righe = q.righe || q.voci || [];
  const subTot = righe.reduce((s, r) => s + parseNum(r.qty) * parseNum(r.prezzo), 0);
  const scontoVal = round2(subTot * (parseNum(q.scontoPerc) / 100));
  const imponibile = round2(subTot - scontoVal);
  const ivaVal = round2(imponibile * (parseNum(q.ivaPerc) / 100));
  const tot = round2(imponibile + ivaVal);
  return { subTot: round2(subTot), scontoVal, ivaVal, tot };
}

/* ---------- Print / PDF ---------- */
function escapeHtml(s = "") {
  return String(s).replaceAll(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
}
async function printOrExportPDF(q) {
  const righe = q.righe || q.voci || [];
  const { subTot, scontoVal, ivaVal, tot } = computeTotals(q);
  const rowsHtml = righe.map(r => `<tr><td>${escapeHtml(r.desc)}</td><td style="text-align:right">${r.qty}</td><td style="text-align:right">${formatEuro(r.prezzo)}</td><td style="text-align:right">${formatEuro(parseNum(r.qty) * parseNum(r.prezzo))}</td></tr>`).join("");
  const html = `<html><head><meta charset="utf-8"/><title>${escapeHtml(q.numero || "Preventivo")}</title><style>body{font-family:system-ui,sans-serif;padding:24px;color:#111}h1{font-size:20px;margin:0 0 4px}.muted{color:#666}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:8px;border-bottom:1px solid #eee;font-size:13px}.tot{width:280px;margin-left:auto;margin-top:12px}.tot td{border:none;padding:4px 0}</style></head><body><h1>Preventivo ${escapeHtml(q.numero || "")}</h1><div class="muted">Data: ${q.data || ""} — Cliente: ${escapeHtml(q.cliente || "")}</div><table><thead><tr><th>Descrizione</th><th style="text-align:right">Qtà</th><th style="text-align:right">Prezzo</th><th style="text-align:right">Totale</th></tr></thead><tbody>${rowsHtml || '<tr><td colspan="4" class="muted">Nessuna riga</td></tr>'}</tbody></table><table class="tot"><tr><td style="text-align:right">Subtotale</td><td style="text-align:right">${formatEuro(subTot)}</td></tr><tr><td style="text-align:right">Sconto (${q.scontoPerc || 0}%)</td><td style="text-align:right">-${formatEuro(scontoVal)}</td></tr><tr><td style="text-align:right">IVA (${q.ivaPerc || 0}%)</td><td style="text-align:right">${formatEuro(ivaVal)}</td></tr><tr><td style="text-align:right;font-weight:600">Totale</td><td style="text-align:right;font-weight:600">${formatEuro(tot)}</td></tr></table>${q.note ? `<p style="margin-top:12px"><b>Note:</b> ${escapeHtml(q.note)}</p>` : ""}</body></html>`;
  try {
    if (window.api?.print?.quotePdf) {
      const b64 = await window.api.print.quotePdf({ html });
      const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const blob = new Blob([bin], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const safe = String(q.numero || "preventivo").replace(/[^a-z0-9\-_.]/gi, "_") + ".pdf";
      const a = document.createElement("a"); a.href = url; a.download = safe; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
  } catch (e) { console.error("quotePdf failed", e); }
  const w = window.open("", "_blank", "width=1024,height=768");
  if (!w) return;
  w.document.write(html + "<script>window.print();</script>");
  w.document.close(); w.focus();
}

/* ---------- Numero auto PR-YYYY-### ---------- */
function nextNumberHint(lastNumber) {
  const year = new Date().getFullYear();
  if (!lastNumber) return `PR-${year}-001`;
  const m = lastNumber.match(/^(PR)-(\d{4})-(\d{3,})$/i);
  if (!m) return `PR-${year}-001`;
  return `PR-${year}-${String(Number.parseInt(m[3], 10) + 1).padStart(m[3].length, "0")}`;
}

/* ---------- Mapping helper ---------- */
const s2q = (r) => ({
  id: r.id, orgId: r.org_id, clientId: r.client_id ?? null,
  cliente: r.cliente ?? "", numero: r.numero ?? "", data: r.data ?? null,
  importo: Number(r.importo ?? 0), stato: r.stato ?? "bozza", valuta: r.valuta ?? "EUR",
  voci: Array.isArray(r.voci) ? r.voci : (() => { try { return JSON.parse(r.voci || "[]"); } catch { return []; } })(),
  note: r.note ?? "", scontoPerc: r.sconto_perc ?? 0, ivaPerc: r.iva_perc ?? 22,
});
const q2s = (q, orgId) => ({
  org_id: orgId, client_id: q.clientId ?? null, cliente: q.cliente ?? "",
  numero: q.numero ?? null, data: q.data ?? null, importo: q.importo ?? 0,
  stato: q.stato ?? "bozza", valuta: q.valuta ?? "EUR", voci: q.voci ?? [],
  note: q.note ?? "", sconto_perc: q.scontoPerc ?? 0, iva_perc: q.ivaPerc ?? 22,
});

/* ---------- Client Autocomplete ---------- */
function ClientAutocomplete({ value, onChange, clients, onSelectClient }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState(value || "");
  const [hover, setHover] = useState(0);
  const ref = useRef(null);

  useEffect(() => setFilter(value || ""), [value]);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const list = useMemo(() => {
    const f = (filter || "").toLowerCase();
    let rows = clients || [];
    if (f) rows = rows.filter(c => (c.nome || "").toLowerCase().includes(f) || (c.phone || "").toLowerCase().includes(f) || (c.email || "").toLowerCase().includes(f));
    return rows.slice(0, 8);
  }, [clients, filter]);

  const choose = (c) => { onChange?.(c?.nome || ""); onSelectClient?.(c || null); setOpen(false); };
  const onKey = (e) => {
    if (!open && ["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) setOpen(true);
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHover(i => Math.min(i + 1, list.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setHover(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); choose(list[hover]); }
  };

  return (
    <div ref={ref} className="relative">
      <input value={filter} onFocus={() => setOpen(true)} onChange={e => { setFilter(e.target.value); onChange?.(e.target.value); }} onKeyDown={onKey} placeholder="Ragione sociale o nominativo" className={inputCls()} />
      {open && list.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-[#243044] bg-[#1a2536] max-h-60 overflow-auto">
          {list.map((c, i) => (
            <button key={c.id || i} type="button" onMouseEnter={() => setHover(i)} onClick={() => choose(c)} className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${i === hover ? "bg-blue-500/10" : ""}`}>
              <div className="min-w-0">
                <div className="truncate font-medium text-slate-200">{c.nome}</div>
                <div className="truncate text-[10px] text-slate-500">{c.phone || "—"} · {c.email || "—"}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===================================================== */

export default function QuoteNew() {
  const navigate = useNavigate();
  const { id: quoteIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();

  const quoteId = quoteIdParam || searchParams.get("id");
  const duplicateId = searchParams.get("duplicate");
  const isEditing = Boolean(quoteId) && !duplicateId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    id: null, numero: "", data: new Date().toISOString().slice(0, 10),
    cliente: "", clientId: null, stato: "bozza",
    righe: [{ desc: "", qty: 1, prezzo: 0 }],
    scontoPerc: 0, ivaPerc: 22, note: "", _isNew: true,
  });

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("idle");
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState("");
  const autoSaveRef = useRef(null);
  const lastSavedRef = useRef(null);

  const setF = (updates) => setForm(prev => ({ ...prev, ...updates }));

  /* ---------- Load ---------- */
  useEffect(() => {
    if (!orgId) return;
    (async () => {
      try {
        setLoading(true);
        // Load clients
        const { data: clData } = await supabase.from("clients").select("id, nome, phone, email, indirizzo").eq("org_id", orgId);
        setClients(clData || []);

        const loadId = quoteId || duplicateId;
        if (loadId) {
          const { data, error } = await supabase.from("quotes").select("*").eq("id", loadId).eq("org_id", orgId).single();
          if (error) throw error;
          const n = s2q(data);
          const prepared = { ...n, righe: n.voci || [], _isNew: Boolean(duplicateId) };
          if (duplicateId) { prepared.id = null; prepared.numero = ""; prepared.stato = "bozza"; }
          setForm(prepared);
          lastSavedRef.current = prepared;
          if (n.clientId) {
            const cl = (clData || []).find(c => c.id === n.clientId);
            if (cl) setSelectedClient(cl);
          }
        } else {
          // Generate next number
          const { data: existing } = await supabase.from("quotes").select("numero").eq("org_id", orgId).like("numero", `PR-${new Date().getFullYear()}-%`);
          const sorted = (existing || []).filter(q => /^PR-\d{4}-\d+$/.test(q.numero || "")).sort((a, b) => (a.numero || "").localeCompare(b.numero || ""));
          const initial = { ...form, numero: nextNumberHint(sorted.at(-1)?.numero) };
          setForm(initial);
          lastSavedRef.current = initial;
        }
      } catch (err) {
        console.error("Error loading:", err);
        setError("Errore durante il caricamento.");
      } finally {
        setLoading(false);
      }
    })();
  }, [orgId]); // eslint-disable-line

  /* ---------- Change detection ---------- */
  const isEmptyQuote = useMemo(() => {
    const f = form;
    const emptyRow = f.righe.length === 1 && !f.righe[0].desc?.trim() && (!f.righe[0].prezzo || f.righe[0].prezzo === 0);
    return !f.cliente?.trim() && emptyRow && !f.note?.trim();
  }, [form]);

  useEffect(() => {
    const changed = JSON.stringify(form) !== JSON.stringify(lastSavedRef.current);
    setHasUnsavedChanges(changed && !isEmptyQuote);
  }, [form, isEmptyQuote]);

  /* ---------- Auto-save ---------- */
  useEffect(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    if (hasUnsavedChanges && form.cliente?.trim()) {
      autoSaveRef.current = setTimeout(() => autoSave(), 2000);
    }
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [form, hasUnsavedChanges]); // eslint-disable-line

  const autoSave = async () => {
    if (!hasUnsavedChanges || !form.cliente?.trim()) return;
    try {
      setAutoSaveStatus("saving");
      const payload = { ...form, importo: computeTotals(form).tot, voci: form.righe || [] };
      if (form._isNew || !form.id) {
        const { data, error } = await supabase.from("quotes").insert(q2s(payload, orgId)).select("*").single();
        if (error) throw error;
        setF({ id: s2q(data).id, _isNew: false });
      } else {
        const { error } = await supabase.from("quotes").update(q2s(payload, orgId)).eq("id", form.id).eq("org_id", orgId);
        if (error) throw error;
      }
      lastSavedRef.current = { ...form };
      setHasUnsavedChanges(false);
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Auto-save failed:", err);
      setAutoSaveStatus("error");
      setTimeout(() => setAutoSaveStatus("idle"), 3000);
    }
  };

  /* ---------- Save ---------- */
  const save = async () => {
    try {
      setSaving(true); setError(null);
      const payload = { ...form, importo: computeTotals(form).tot, voci: form.righe || [] };
      if (form._isNew || !form.id) {
        const { data, error } = await supabase.from("quotes").insert(q2s(payload, orgId)).select("*").single();
        if (error) throw error;
        setF({ id: s2q(data).id, _isNew: false });
      } else {
        const { error } = await supabase.from("quotes").update(q2s(payload, orgId)).eq("id", form.id).eq("org_id", orgId);
        if (error) throw error;
      }
      lastSavedRef.current = { ...form };
      setHasUnsavedChanges(false);
      navigate("/preventivi");
    } catch (err) {
      console.error("Save failed:", err);
      setError("Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Exit ---------- */
  const handleExit = () => { hasUnsavedChanges ? setShowExitConfirm(true) : navigate("/preventivi"); };

  /* ---------- Keyboard shortcuts ---------- */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); void save(); }
      if (e.key === "Escape") { e.preventDefault(); handleExit(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // eslint-disable-line

  /* ---------- Row helpers ---------- */
  const addRiga = () => setF({ righe: [...form.righe, { desc: "", qty: 1, prezzo: 0 }] });
  const updateRiga = (i, u) => { const r = [...form.righe]; r[i] = { ...r[i], ...u }; setF({ righe: r }); };
  const removeRiga = (i) => setF({ righe: form.righe.filter((_, j) => j !== i) });
  const regenNumero = () => {
    const m = form.numero?.match(/^(PR)-(\d{4})-(\d{3,})$/i);
    if (!m) return setF({ numero: nextNumberHint(null) });
    setF({ numero: `${m[1]}-${m[2]}-${String(Number.parseInt(m[3], 10) + 1).padStart(m[3].length, "0")}` });
  };
  const onSelectClient = (c) => { setSelectedClient(c); setF({ cliente: c?.nome || form.cliente, clientId: c?.id ?? null }); };

  /* ---------- Computed ---------- */
  const { subTot, scontoVal, ivaVal, tot } = computeTotals(form);
  const canSave = form.cliente?.trim().length > 0 && form.righe.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="bg-[#1a2536] rounded-xl p-6 border border-[#243044]">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Caricamento preventivo...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handleExit} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#1a2536] rounded-lg transition-colors">
            <FiArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">
              {isEditing ? "Modifica Preventivo" : "Nuovo Preventivo"}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-slate-500">
                {isEditing ? form.numero || "" : "Compila i dati del preventivo"}
              </p>
              {hasUnsavedChanges && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <FiAlertTriangle className="w-2.5 h-2.5 mr-1" />Non salvato
                </span>
              )}
              {autoSaveStatus === "saved" && !hasUnsavedChanges && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
                  <FiCheck className="w-2.5 h-2.5 mr-1" />Salvato
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => {
            const clientEmail = selectedClient?.email || "";
            setEmailTo(clientEmail);
            setShowEmailModal(true);
          }} disabled={!form.cliente?.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors bg-[#1a2536] text-purple-400 border border-purple-500/20 hover:bg-purple-500/10 disabled:opacity-40 disabled:cursor-not-allowed">
            <FiMail className="w-3.5 h-3.5" />Invia Email
          </button>
          <button onClick={() => printOrExportPDF(form)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors bg-[#1a2536] text-slate-300 border border-[#243044] hover:bg-[#243044]">
            <FiPrinter className="w-3.5 h-3.5" />Stampa
          </button>
          <button onClick={save} disabled={!canSave || saving} className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-lg font-medium transition-colors ${saving || !canSave ? "bg-[#243044] text-slate-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
            <FiSave className="w-3.5 h-3.5" />{saving ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </div>

      {/* Errori */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <FiAlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* ═══════════════ 1. INTESTAZIONE DOCUMENTO ═══════════════ */}
      <section className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <FiFileText className="text-blue-500" />
          Intestazione Documento
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Numero <span className="text-red-500">*</span></label>
            <div className="flex gap-1.5">
              <input type="text" value={form.numero} onChange={e => setF({ numero: e.target.value })} placeholder="PR-2026-001" className={`${inputCls()} flex-1`} />
              <button type="button" onClick={regenNumero} className="px-2 py-2 text-slate-400 hover:text-slate-200 hover:bg-[#243044] rounded-lg transition-colors" title="Rigenera numero">
                <FiRefreshCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Data emissione <span className="text-red-500">*</span></label>
            <input type="date" value={form.data} onChange={e => setF({ data: e.target.value })} className={inputCls()} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Validità (giorni)</label>
            <input type="number" min="1" value={form.validitaGiorni || 30} onChange={e => setF({ validitaGiorni: parseNum(e.target.value) })} className={inputCls()} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Stato</label>
            <select value={form.stato} onChange={e => setF({ stato: e.target.value })} className={selectCls}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* ═══════════════ 2. CLIENTE ═══════════════ */}
      <section className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <FiUser className="text-purple-500" />
          Cliente
        </h2>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Ragione sociale / Nominativo <span className="text-red-500">*</span></label>
          <ClientAutocomplete value={form.cliente} clients={clients} onChange={v => setF({ cliente: v })} onSelectClient={onSelectClient} />
        </div>
        {/* Dati cliente selezionato */}
        {selectedClient && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#243044]">
            {selectedClient.phone && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-[#141c27] text-slate-300 border border-[#243044]">
                 {selectedClient.phone}
              </span>
            )}
            {selectedClient.email && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-[#141c27] text-slate-300 border border-[#243044]">
                 {selectedClient.email}
              </span>
            )}
            {selectedClient.indirizzo && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-[#141c27] text-slate-300 border border-[#243044]">
                 {selectedClient.indirizzo}
              </span>
            )}
            <button
              type="button"
              onClick={() => { setSelectedClient(null); setF({ cliente: "", clientId: null }); }}
              className="px-2 py-1 text-[10px] text-slate-500 hover:text-red-400 transition-colors"
            >
              Rimuovi
            </button>
          </div>
        )}
      </section>

      {/* ═══════════════ 3. RIGHE PREVENTIVO (full width) ═══════════════ */}
      <section className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <FiFileText className="text-emerald-500" />
            Voci del Preventivo
          </h2>
          <button onClick={addRiga} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors">
            <FiPlus className="w-3.5 h-3.5" />
            Aggiungi riga
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#243044]">
                <th className="text-left px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Descrizione</th>
                <th className="text-center px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-20">Qtà</th>
                <th className="text-right px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-28">Prezzo unit.</th>
                <th className="text-right px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-28">Importo</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243044]/50">
              {form.righe.map((riga, i) => {
                const rowTot = round2(parseNum(riga.qty) * parseNum(riga.prezzo));
                return (
                  <tr key={i} className="group hover:bg-[#141c27]/30 transition-colors">
                    <td className="px-3 py-2">
                      <input
                        value={riga.desc}
                        onChange={e => updateRiga(i, { desc: e.target.value })}
                        placeholder="Descrizione prodotto o servizio"
                        className="w-full px-2.5 py-1.5 text-sm border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none placeholder-slate-600"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number" min="0" step="0.5"
                        value={riga.qty}
                        onChange={e => updateRiga(i, { qty: parseNum(e.target.value) })}
                        className="w-full px-2.5 py-1.5 text-sm border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 text-center focus:ring-1 focus:ring-blue-500/40 outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number" min="0" step="0.01"
                        value={riga.prezzo}
                        onChange={e => updateRiga(i, { prezzo: parseNum(e.target.value) })}
                        onKeyDown={e => { if (e.key === "Enter") addRiga(); }}
                        className="w-full px-2.5 py-1.5 text-sm border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 text-right focus:ring-1 focus:ring-blue-500/40 outline-none"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium text-slate-200 tabular-nums">
                      {formatEuro(rowTot)}
                    </td>
                    <td className="px-2 py-2">
                      <button onClick={() => removeRiga(i)} className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all" title="Elimina riga">
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {form.righe.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-slate-500 text-sm">
                    Nessuna voce inserita. Clicca <strong>"Aggiungi riga"</strong> per iniziare.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══════════════ 4. RIEPILOGO + NOTE (due colonne) ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Note (3/5) */}
        <div className="lg:col-span-3 bg-[#1a2536] rounded-xl border border-[#243044] p-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Note e Condizioni</h2>
          <textarea
            rows={5}
            value={form.note}
            onChange={e => setF({ note: e.target.value })}
            placeholder={"Condizioni di pagamento, validità dell'offerta, esclusioni, note aggiuntive..."}
            className={`${inputCls()} resize-none`}
          />
          <p className="text-[10px] text-slate-600 mt-1.5">Queste note saranno visibili sul preventivo stampato/PDF.</p>
        </div>

        {/* Riepilogo economico (2/5) */}
        <div className="lg:col-span-2 bg-[#1a2536] rounded-xl border border-[#243044] p-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Riepilogo Economico</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Sconto globale %</label>
              <input type="number" min="0" max="100" step="0.5" value={form.scontoPerc} onChange={e => setF({ scontoPerc: parseNum(e.target.value) })} className={inputCls()} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Aliquota IVA %</label>
              <input type="number" min="0" max="100" step="1" value={form.ivaPerc} onChange={e => setF({ ivaPerc: parseNum(e.target.value) })} className={inputCls()} />
            </div>
          </div>
          <div className="p-3 bg-[#141c27] rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Subtotale</span>
              <span className="text-slate-200 tabular-nums">{formatEuro(subTot)}</span>
            </div>
            {form.scontoPerc > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Sconto ({form.scontoPerc}%)</span>
                <span className="text-red-400 tabular-nums">-{formatEuro(scontoVal)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">IVA ({form.ivaPerc}%)</span>
              <span className="text-slate-200 tabular-nums">{formatEuro(ivaVal)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#243044]">
              <span className="font-semibold text-slate-100">Totale</span>
              <span className="font-bold text-base text-slate-100 tabular-nums">{formatEuro(tot)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ EMAIL MODAL ═══════════════ */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEmailModal(false)} />
          <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-5">
            <div className="text-sm font-semibold text-slate-200 mb-1.5">Invia Preventivo via Email</div>
            <div className="text-xs text-slate-400 mb-4">
              {form.numero || "Preventivo"} — {form.cliente || "—"} — {formatEuro(tot)}
            </div>
            <label className="block text-xs text-slate-400 mb-1">Email destinatario</label>
            <input
              type="email"
              value={emailTo}
              onChange={e => setEmailTo(e.target.value)}
              placeholder="cliente@email.com"
              className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 outline-none focus:ring-1 ring-blue-500/30 mb-4"
            />
            {emailSuccess && <div className="text-xs text-emerald-400 mb-3">{emailSuccess}</div>}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowEmailModal(false); setEmailSuccess(""); }}
                className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors">
                {emailSuccess ? "Chiudi" : "Annulla"}
              </button>
              {!emailSuccess && (
                <button
                  disabled={!emailTo?.includes("@") || sendingEmail}
                  onClick={async () => {
                    setSendingEmail(true);
                    try {
                      const { data: orgData } = await supabase.from("orgs").select("name").eq("id", orgId).maybeSingle();
                      await sendQuoteEmail({
                        to: emailTo,
                        quoteNumber: form.numero || "—",
                        quoteDate: form.data || "—",
                        amount: formatEuro(tot),
                        customerName: form.cliente || "Cliente",
                        orgName: orgData?.name || "RescueManager",
                        validityDays: form.validitaGiorni || 30,
                      });
                      setEmailSuccess(`Email inviata con successo a ${emailTo}`);
                      // Aggiorna stato a "inviato" se era bozza
                      if (form.stato === "bozza" && form.id) {
                        await supabase.from("quotes").update({ stato: "inviato" }).eq("id", form.id).eq("org_id", orgId);
                        setF({ stato: "inviato" });
                      }
                    } catch (e) {
                      setError(`Errore invio email: ${e?.message || "Errore sconosciuto"}`);
                      setShowEmailModal(false);
                    } finally {
                      setSendingEmail(false);
                    }
                  }}
                  className="h-8 px-3 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
                  <FiMail className="w-3.5 h-3.5 inline mr-1" /> {sendingEmail ? "Invio..." : "Invia"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ EXIT CONFIRMATION ═══════════════ */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowExitConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-4">
            <div className="font-medium mb-2">Modifiche non salvate</div>
            <div className="text-xs text-slate-400 mb-4">Hai modifiche non salvate. Uscire senza salvare?</div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1.5 text-xs text-slate-300 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors" onClick={() => setShowExitConfirm(false)}>Continua a modificare</button>
              <button className="px-3 py-1.5 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors" onClick={() => navigate("/preventivi")}>Esci senza salvare</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
