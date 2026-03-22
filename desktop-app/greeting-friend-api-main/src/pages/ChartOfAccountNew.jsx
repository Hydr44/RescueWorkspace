/**
 * ChartOfAccountNew — Design L aligned
 * Pagina dedicata per creazione/modifica conto nel piano dei conti
 *
 * Routes:
 *   /contabilita/piano-conti/nuovo       → nuovo conto
 *   /contabilita/piano-conti/:id/modifica → modifica conto esistente
 *
 * @author haxies
 * @created 2026
 */

import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import {
  FiArrowLeft, FiSave, FiAlertCircle, FiX,
  FiCheck, FiInfo, FiLock, FiHash, FiTag, FiFileText,
  FiToggleLeft, FiToggleRight, FiLink, FiAlertTriangle
} from "react-icons/fi";

/* ─── Helpers ─── */
const inputCls = (err) =>
  `w-full h-9 px-3 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500/30 outline-none transition bg-[#141c27] text-slate-200 placeholder-slate-600 ${
    err ? "border-red-500/30" : "border-[#243044]"
  }`;
const selectCls = (err) =>
  `w-full h-9 px-3 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500/30 outline-none transition bg-[#141c27] text-slate-200 ${
    err ? "border-red-500/30" : "border-[#243044]"
  }`;
const labelCls = "block text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5";
const textareaCls = (err) =>
  `w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500/30 outline-none transition bg-[#141c27] text-slate-200 placeholder-slate-600 resize-none ${
    err ? "border-red-500/30" : "border-[#243044]"
  }`;

const CATEGORIES = [
  { value: "asset",     label: "Attività",         icon: "", color: "blue",    desc: "Beni e crediti dell'azienda" },
  { value: "liability", label: "Passività",        icon: "", color: "red",     desc: "Debiti e obbligazioni" },
  { value: "equity",    label: "Patrimonio Netto", icon: "", color: "purple",  desc: "Capitale e riserve" },
  { value: "revenue",   label: "Ricavi",           icon: "", color: "emerald", desc: "Entrate e vendite" },
  { value: "expense",   label: "Costi",            icon: "", color: "amber",   desc: "Spese e acquisti" },
];

const SUBCATEGORIES = {
  asset: [
    { value: "bank", label: "Banca / Liquidità" },
    { value: "cash", label: "Cassa" },
    { value: "receivables", label: "Crediti verso clienti" },
    { value: "tax_receivables", label: "Crediti tributari" },
    { value: "advances", label: "Anticipi" },
    { value: "deposits", label: "Cauzioni / Depositi" },
    { value: "inventory", label: "Magazzino / Rimanenze" },
    { value: "fixed_assets", label: "Immobilizzazioni" },
  ],
  liability: [
    { value: "payables", label: "Debiti verso fornitori" },
    { value: "tax_payables", label: "Debiti tributari / IVA" },
    { value: "social_payables", label: "Debiti verso enti" },
    { value: "provisions", label: "Fondi / TFR" },
    { value: "environmental", label: "Debiti ambientali" },
    { value: "accruals", label: "Ratei e risconti" },
    { value: "long_term_debt", label: "Mutui / Finanziamenti" },
  ],
  equity: [
    { value: "capital", label: "Capitale sociale" },
    { value: "reserves", label: "Riserve" },
    { value: "result", label: "Utile / Perdita esercizio" },
    { value: "retained", label: "Utili / Perdite precedenti" },
  ],
  revenue: [
    { value: "sales", label: "Vendite" },
    { value: "sales_parts", label: "Vendita ricambi" },
    { value: "sales_scrap", label: "Vendita rottami" },
    { value: "sales_demolition", label: "Servizi demolizione" },
    { value: "sales_transport", label: "Servizi trasporto" },
    { value: "other_revenue", label: "Proventi diversi" },
    { value: "financial_income", label: "Proventi finanziari" },
  ],
  expense: [
    { value: "purchases", label: "Acquisti" },
    { value: "services", label: "Servizi" },
    { value: "personnel", label: "Personale" },
    { value: "rent", label: "Affitti / Leasing" },
    { value: "utilities", label: "Utenze" },
    { value: "maintenance", label: "Manutenzione" },
    { value: "insurance", label: "Assicurazioni" },
    { value: "depreciation", label: "Ammortamenti" },
    { value: "environmental_costs", label: "Costi ambientali" },
    { value: "taxes", label: "Imposte e tasse" },
    { value: "financial_expenses", label: "Oneri finanziari" },
    { value: "other_expenses", label: "Costi diversi" },
  ],
};

const CAT_COLORS = {
  blue:    { bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/20",    ring: "ring-blue-500" },
  red:     { bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/20",     ring: "ring-red-500" },
  purple:  { bg: "bg-purple-500/10",  text: "text-purple-400",  border: "border-purple-500/20",  ring: "ring-purple-500" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", ring: "ring-emerald-500" },
  amber:   { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/20",   ring: "ring-amber-500" },
};

export default function ChartOfAccountNew() {
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEditing = !!editId;

  /* ─── Form state ─── */
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [parentCode, setParentCode] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSystem, setIsSystem] = useState(false);

  /* ─── UI state ─── */
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!editId);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [codeExists, setCodeExists] = useState(false);

  /* ─── Completion % ─── */
  const completionPercent = useMemo(() => {
    const fields = [code, name, category, subcategory, description];
    const filled = fields.filter(f => f && f.trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [code, name, category, subcategory, description]);

  /* ─── Available subcategories ─── */
  const availableSubcategories = useMemo(() => {
    return SUBCATEGORIES[category] || [];
  }, [category]);

  /* ─── Parent accounts (same category) ─── */
  const parentAccounts = useMemo(() => {
    if (!category) return accounts;
    return accounts.filter(a => a.category === category && a.id !== editId);
  }, [accounts, category, editId]);

  /* ─── Has meaningful changes ─── */
  const hasMeaningful = useCallback(() => {
    if (!editId && !name.trim() && !code.trim()) return false;
    return !!(name.trim() || code.trim());
  }, [editId, name, code]);

  /* ─── Load all accounts (for parent selection + code check) ─── */
  useEffect(() => {
    if (orgId) loadAccounts();
  }, [orgId]); // eslint-disable-line

  async function loadAccounts() {
    try {
      const { data, error: err } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("org_id", orgId)
        .order("code");
      if (err) throw err;
      setAccounts(data || []);
    } catch (err) {
      console.error("Errore caricamento conti:", err);
    }
  }

  /* ─── Load existing account if editing ─── */
  useEffect(() => {
    if (!editId || !orgId) return;
    (async () => {
      setLoading(true);
      try {
        const { data, error: err } = await supabase
          .from("chart_of_accounts")
          .select("*")
          .eq("id", editId)
          .eq("org_id", orgId)
          .maybeSingle();
        if (err) throw err;
        if (data) {
          setCode(data.code || "");
          setName(data.name || "");
          setCategory(data.category || "");
          setSubcategory(data.subcategory || "");
          setDescription(data.description || "");
          setParentCode(data.parent_code || "");
          setIsActive(data.is_active ?? true);
          setIsSystem(data.is_system ?? false);
        } else {
          setError("Conto non trovato.");
        }
      } catch (e) {
        console.error("Errore caricamento conto:", e);
        setError("Errore nel caricamento del conto.");
      } finally {
        setLoading(false);
      }
    })();
  }, [editId, orgId]); // eslint-disable-line

  /* ─── Check code uniqueness ─── */
  useEffect(() => {
    if (!code.trim() || !orgId) { setCodeExists(false); return; }
    const existing = accounts.find(a => a.code === code.trim() && a.id !== editId);
    setCodeExists(!!existing);
  }, [code, accounts, editId, orgId]);

  /* ─── Keyboard shortcuts ─── */
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); handleSave(); }
      if (e.key === "Escape") { e.preventDefault(); handleExit(); }
    };
    globalThis.addEventListener("keydown", h);
    return () => globalThis.removeEventListener("keydown", h);
  }); // eslint-disable-line

  /* ─── Reset subcategory when category changes ─── */
  useEffect(() => {
    if (category && subcategory) {
      const valid = (SUBCATEGORIES[category] || []).some(s => s.value === subcategory);
      if (!valid) setSubcategory("");
    }
  }, [category]); // eslint-disable-line

  /* ─── Suggest next code ─── */
  const suggestedCode = useMemo(() => {
    if (!category || code.trim()) return null;
    const catAccounts = accounts.filter(a => a.category === category);
    if (catAccounts.length === 0) {
      const prefixes = { asset: "100", liability: "200", equity: "300", revenue: "400", expense: "500" };
      return prefixes[category] || "100";
    }
    const codes = catAccounts.map(a => Number.parseInt(a.code, 10)).filter(n => !Number.isNaN(n));
    if (codes.length === 0) return null;
    const maxCode = Math.max(...codes);
    return String(maxCode + 1);
  }, [category, accounts, code]);

  /* ─── Validation ─── */
  function validate() {
    const errs = {};
    if (!code.trim()) errs.code = "Codice obbligatorio";
    else if (codeExists) errs.code = "Codice già esistente";
    if (!name.trim()) errs.name = "Nome obbligatorio";
    if (!category) errs.category = "Seleziona una categoria";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /* ─── Save ─── */
  async function handleSave() {
    if (isSystem) {
      setError("Non puoi modificare un conto di sistema.");
      return;
    }
    if (!validate()) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        org_id: orgId,
        code: code.trim(),
        name: name.trim(),
        category: category || null,
        subcategory: subcategory || null,
        is_active: isActive,
      };

      if (isEditing) {
        const { error: err } = await supabase
          .from("chart_of_accounts")
          .update(payload)
          .eq("id", editId)
          .eq("org_id", orgId);
        if (err) throw err;
        setSuccess("Conto aggiornato con successo.");
      } else {
        const { error: err } = await supabase
          .from("chart_of_accounts")
          .insert(payload);
        if (err) throw err;
        setSuccess("Conto creato con successo.");
      }
      setTimeout(() => navigate("/contabilita/piano-conti"), 800);
    } catch (e) {
      console.error("Errore salvataggio:", e);
      if (e.message?.includes("duplicate") || e.code === "23505") {
        setError("Esiste già un conto con questo codice.");
      } else {
        setError("Errore durante il salvataggio: " + (e.message || ""));
      }
    } finally {
      setSaving(false);
    }
  }

  /* ─── Exit ─── */
  function handleExit() {
    if (hasMeaningful() && !success) setShowExitConfirm(true);
    else navigate("/contabilita/piano-conti");
  }
  function confirmExit() {
    setShowExitConfirm(false);
    navigate("/contabilita/piano-conti");
  }

  /* ─── Category info ─── */
  const selectedCat = CATEGORIES.find(c => c.value === category);
  const catColor = selectedCat ? CAT_COLORS[selectedCat.color] : null;

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-[#243044] rounded-lg" />
          <div><div className="h-5 w-48 bg-[#243044] rounded mb-1" /><div className="h-3 w-32 bg-[#1a2536] rounded" /></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-40 bg-[#1a2536] rounded-xl border border-[#243044]" />)}</div>
          <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-40 bg-[#1a2536] rounded-xl border border-[#243044]" />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handleExit}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#243044] bg-[#1a2536] text-slate-400 hover:bg-[#1e2b3d] transition">
            <FiArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">
              {isEditing ? "Modifica Conto" : "Nuovo Conto"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing ? `Codice: ${code || "—"}` : "Aggiungi un nuovo conto al piano dei conti"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Completion ring */}
          <div className="flex items-center gap-2 mr-2">
            <div className="w-9 h-9 relative">
              <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#243044" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                  stroke={completionPercent >= 80 ? "#10b981" : completionPercent >= 50 ? "#f59e0b" : "#64748b"}
                  strokeWidth="3" strokeDasharray={`${completionPercent}, 100`} strokeLinecap="round" />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-[8px] font-semibold ${
                completionPercent >= 80 ? "text-emerald-400" : completionPercent >= 50 ? "text-amber-400" : "text-slate-500"
              }`}>{completionPercent}%</span>
            </div>
          </div>
          <button onClick={handleExit}
            className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition">
            Annulla
          </button>
          <button onClick={handleSave} disabled={saving || isSystem}
            className={`h-8 px-3.5 text-xs font-medium rounded-lg transition inline-flex items-center gap-1.5 ${
              saving || isSystem ? "bg-[#243044] text-slate-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20"
            }`}>
            <FiSave className="w-3.5 h-3.5" />
            {saving ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </div>

      {/* ── System account warning ── */}
      {isSystem && (
        <div className="bg-amber-500/5 rounded-xl border border-amber-500/15 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <FiLock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-xs text-amber-400">Questo è un conto di sistema e non può essere modificato.</span>
          </div>
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div className="bg-red-500/5 rounded-xl border border-red-500/15 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <FiAlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-xs text-red-400 flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300"><FiX className="w-3 h-3" /></button>
          </div>
        </div>
      )}

      {/* ── Success banner ── */}
      {success && (
        <div className="bg-emerald-500/5 rounded-xl border border-emerald-500/15 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <FiCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-xs text-emerald-400">{success}</span>
          </div>
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* LEFT COLUMN */}
        <div className="space-y-4">

          {/* Categoria */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
            <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Categoria</h2>
            {errors.category && <div className="text-[10px] text-red-400 mb-2">{errors.category}</div>}
            <div className="grid grid-cols-1 gap-2">
              {CATEGORIES.map(cat => {
                const colors = CAT_COLORS[cat.color];
                const isSelected = category === cat.value;
                return (
                  <button key={cat.value} type="button" onClick={() => !isSystem && setCategory(cat.value)}
                    disabled={isSystem}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? `${colors.border} ${colors.bg} ${colors.text}`
                        : "border-[#243044] bg-[#141c27] text-slate-400 hover:border-slate-600"
                    } ${isSystem ? "opacity-60 cursor-not-allowed" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                        isSelected ? colors.bg : "bg-[#243044]"
                      }`}>
                        {cat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium">{cat.label}</div>
                        <div className="text-[10px] opacity-60">{cat.desc}</div>
                      </div>
                      {isSelected && <FiCheck className="w-4 h-4 flex-shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sottocategoria */}
          {category && availableSubcategories.length > 0 && (
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
              <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Sottocategoria</h2>
              <div className="grid grid-cols-2 gap-1.5">
                {availableSubcategories.map(sub => (
                  <button key={sub.value} type="button"
                    onClick={() => !isSystem && setSubcategory(subcategory === sub.value ? "" : sub.value)}
                    disabled={isSystem}
                    className={`px-3 py-2 rounded-lg text-left text-xs transition-all border ${
                      subcategory === sub.value
                        ? `${catColor?.bg || "bg-blue-500/10"} ${catColor?.text || "text-blue-400"} ${catColor?.border || "border-blue-500/20"}`
                        : "bg-[#141c27] text-slate-400 border-[#243044] hover:border-slate-600"
                    } ${isSystem ? "opacity-60 cursor-not-allowed" : ""}`}>
                    {sub.label}
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <label className={labelCls}>Oppure inserisci manualmente</label>
                <input type="text" value={subcategory}
                  onChange={e => setSubcategory(e.target.value)}
                  disabled={isSystem}
                  className={inputCls(false)} placeholder="es. custom_subcategory" />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">

          {/* Codice e Nome */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
            <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
              <FiHash className="w-3 h-3 inline mr-1" />Identificazione
            </h2>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Codice Conto <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type="text" value={code}
                    onChange={e => setCode(e.target.value)}
                    disabled={isSystem}
                    className={`${inputCls(errors.code || codeExists)} font-mono pr-8`}
                    placeholder={suggestedCode ? `Suggerito: ${suggestedCode}` : "Es. 120, 401, 2001"} />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    {code.trim() && (
                      codeExists
                        ? <FiAlertTriangle className="w-3.5 h-3.5 text-red-400" title="Codice già esistente" />
                        : <FiCheck className="w-3.5 h-3.5 text-emerald-400" title="Codice disponibile" />
                    )}
                  </div>
                </div>
                {errors.code && <div className="text-[10px] text-red-400 mt-0.5">{errors.code}</div>}
                {codeExists && !errors.code && <div className="text-[10px] text-red-400 mt-0.5">Codice già in uso</div>}
                {suggestedCode && !code.trim() && (
                  <button type="button" onClick={() => setCode(suggestedCode)}
                    className="text-[10px] text-blue-400 hover:text-blue-300 mt-1 transition">
                    Usa codice suggerito: {suggestedCode}
                  </button>
                )}
              </div>
              <div>
                <label className={labelCls}>Nome Conto <span className="text-red-500">*</span></label>
                <input type="text" value={name}
                  onChange={e => setName(e.target.value)}
                  disabled={isSystem}
                  className={inputCls(errors.name)}
                  placeholder="Es. Crediti verso clienti, Banca c/c principale" />
                {errors.name && <div className="text-[10px] text-red-400 mt-0.5">{errors.name}</div>}
              </div>
            </div>
          </div>

          {/* Dettagli */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
            <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
              <FiFileText className="w-3 h-3 inline mr-1" />Dettagli
            </h2>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Descrizione</label>
                <textarea value={description}
                  onChange={e => setDescription(e.target.value)}
                  disabled={isSystem}
                  rows={3}
                  className={textareaCls(false)}
                  placeholder="Descrizione opzionale del conto, note sull'utilizzo..." />
              </div>
              <div>
                <label className={labelCls}>
                  <FiLink className="w-3 h-3 inline mr-1" />Conto Padre (opzionale)
                </label>
                <select value={parentCode}
                  onChange={e => setParentCode(e.target.value)}
                  disabled={isSystem}
                  className={selectCls(false)}>
                  <option value="">Nessun conto padre</option>
                  {parentAccounts.map(a => (
                    <option key={a.id} value={a.code}>{a.code} — {a.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-600 mt-1">Collega questo conto a un conto principale per la gerarchia</p>
              </div>
            </div>
          </div>

          {/* Stato */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
            <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
              <FiTag className="w-3 h-3 inline mr-1" />Stato e Configurazione
            </h2>
            <div className="space-y-3">
              <button type="button"
                onClick={() => !isSystem && setIsActive(!isActive)}
                disabled={isSystem}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isActive
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                    : "bg-[#141c27] border-[#243044] text-slate-400"
                } ${isSystem ? "opacity-60 cursor-not-allowed" : "hover:bg-[#141c27]"}`}>
                <div className="flex items-center gap-2.5">
                  {isActive
                    ? <FiToggleRight className="w-5 h-5 text-emerald-400" />
                    : <FiToggleLeft className="w-5 h-5 text-slate-500" />}
                  <div className="text-left">
                    <div className="text-xs font-medium">{isActive ? "Conto Attivo" : "Conto Disattivato"}</div>
                    <div className="text-[10px] opacity-60">
                      {isActive ? "Disponibile per movimenti contabili" : "Non utilizzabile per nuovi movimenti"}
                    </div>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full ${
                  isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-500"
                }`}>
                  {isActive ? "ON" : "OFF"}
                </span>
              </button>

              {isSystem && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
                  <FiLock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-amber-400">Conto di Sistema</div>
                    <div className="text-[10px] text-amber-400/60">Generato automaticamente, non eliminabile</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Riepilogo */}
          {(code.trim() || name.trim()) && (
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
              <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                <FiInfo className="w-3 h-3 inline mr-1" />Riepilogo
              </h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Codice</span>
                  <span className="text-xs font-mono text-slate-200">{code || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Nome</span>
                  <span className="text-xs text-slate-200 text-right max-w-[200px] truncate">{name || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Categoria</span>
                  {selectedCat ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${catColor?.bg} ${catColor?.text} ${catColor?.border}`}>
                      {selectedCat.label}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">—</span>
                  )}
                </div>
                {subcategory && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Sottocategoria</span>
                    <span className="text-xs text-slate-300">{
                      availableSubcategories.find(s => s.value === subcategory)?.label || subcategory
                    }</span>
                  </div>
                )}
                {parentCode && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Conto Padre</span>
                    <span className="text-xs text-slate-300 font-mono">{parentCode}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Stato</span>
                  <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded ${
                    isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-500"
                  }`}>
                    {isActive ? "Attivo" : "Disattivato"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer actions ── */}
      <div className="flex items-center justify-between pt-2 pb-4">
        <button onClick={handleExit}
          className="text-xs text-slate-500 hover:text-slate-300 transition">
          <FiArrowLeft className="w-3 h-3 inline mr-1" /> Torna al Piano dei Conti
        </button>
        <button onClick={handleSave} disabled={saving || isSystem}
          className="h-9 px-5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed">
          <FiSave className="w-3.5 h-3.5 inline mr-1.5" />
          {saving ? "Salvataggio..." : isEditing ? "Aggiorna Conto" : "Crea Conto"}
        </button>
      </div>

      {/* ── Exit confirm modal ── */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowExitConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-2">Modifiche non salvate</h3>
            <p className="text-xs text-slate-400 mb-4">Hai delle modifiche non salvate. Vuoi uscire senza salvare?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowExitConfirm(false)}
                className="px-3 py-1.5 text-xs text-slate-300 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors">
                Resta
              </button>
              <button onClick={confirmExit}
                className="px-3 py-1.5 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                Esci senza salvare
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
