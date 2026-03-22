/**
 * New Yard Vehicle Form Page
 * Aggiungi mezzo al piazzale con tag specifici e informazioni dettagliate
 * 
 * @author haxies
 * @created 2025
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiSave, FiTruck, FiAlertTriangle, FiCheck, FiCalendar, FiShield, FiMapPin, FiKey, FiHash } from "react-icons/fi";
import { supabaseBrowser } from "../lib/supabase-browser";
import { useOrg } from "../context/OrgContext";

/* ---------- Tag / Status maps ---------- */
const TAG_MAP = {
  sequestro:    { label: "Sequestro",    cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  confisca:     { label: "Confisca",     cls: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  demolizione:  { label: "Demolizione",  cls: "bg-slate-500/10 text-slate-300 border-slate-500/20" },
  vendita:      { label: "Vendita",      cls: "bg-green-500/10 text-green-400 border-green-500/20" },
  manutenzione: { label: "Manutenzione", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  attesa:       { label: "Attesa",       cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  altro:        { label: "Altro",        cls: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
};

const STATUS_OPTIONS = [
  { value: "attivo", label: "Attivo" },
  { value: "in_manutenzione", label: "In Manutenzione" },
  { value: "venduto", label: "Venduto" },
  { value: "demolito", label: "Demolito" },
  { value: "rimosso", label: "Rimosso" },
  { value: "rilasciato", label: "Rilasciato" },
];

/* ---------- Input class helper ---------- */
const inputCls = (err) => `w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500/40 outline-none transition-colors bg-[#141c27] ${err ? "border-red-500/30" : "border-[#243044]"}`;
const selectCls = "w-full px-3 py-2 text-sm border border-[#243044] rounded-lg focus:ring-1 focus:ring-blue-500/40 outline-none transition-colors bg-[#141c27]";

export default function YardNew() {
  const navigate = useNavigate();
  const { id: yardVehicleId } = useParams();
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();

  const isEditing = Boolean(yardVehicleId);

  const [form, setForm] = useState({
    targa: "", marca: "", modello: "", telaio: "",
    zona: "A", posizione: "",
    tag: "sequestro", numero_pratica: "", numero_chiave: "",
    autorita_competente: "", data_sequestro: "", data_confisca: "", scadenza_pratica: "",
    stato: "attivo",
    data_ingresso: new Date().toISOString().split("T")[0],
    data_rilascio: "", data_uscita: "",
    note: "",
    foto: [], foto_compresse: [],
    condizioni_iniziali: "", condizioni_finali: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("idle");
  const initialFormRef = useRef(null);

  const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // Load existing yard vehicle
  useEffect(() => {
    if (!isEditing || !orgId) return;
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("yard_vehicles").select("*")
          .eq("id", yardVehicleId).eq("org_id", orgId).single();
        if (error) throw error;
        if (data) {
          const loaded = {
            targa: data.targa || "", marca: data.marca || "", modello: data.modello || "", telaio: data.telaio || "",
            zona: data.zona || "A", posizione: data.posizione || "",
            tag: data.tag || "sequestro", numero_pratica: data.numero_pratica || "", numero_chiave: data.numero_chiave || "",
            autorita_competente: data.autorita_competente || "",
            data_sequestro: data.data_sequestro || "", data_confisca: data.data_confisca || "", scadenza_pratica: data.scadenza_pratica || "",
            stato: data.stato || "attivo",
            data_ingresso: data.data_ingresso ? new Date(data.data_ingresso).toISOString().split("T")[0] : "",
            data_rilascio: data.data_rilascio ? new Date(data.data_rilascio).toISOString().split("T")[0] : "",
            data_uscita: data.data_uscita ? new Date(data.data_uscita).toISOString().split("T")[0] : "",
            note: data.note || "",
            foto: data.foto || [], foto_compresse: data.foto_compresse || [],
            condizioni_iniziali: data.condizioni_iniziali || "", condizioni_finali: data.condizioni_finali || "",
          };
          setForm(loaded);
          initialFormRef.current = loaded;
          setHasUnsavedChanges(false);
        }
      } catch (err) {
        console.error("Error loading yard vehicle:", err);
        setErrors({ general: "Errore durante il caricamento del mezzo" });
      } finally {
        setLoading(false);
      }
    })();
  }, [isEditing, yardVehicleId, orgId, supabase]);

  // Auto-save draft
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const timer = setTimeout(() => {
      localStorage.setItem(`yard-vehicle-draft-${yardVehicleId || "new"}`, JSON.stringify(form));
      setAutoSaveStatus("saved");
    }, 2000);
    return () => clearTimeout(timer);
  }, [form, hasUnsavedChanges, yardVehicleId]);

  // Load saved draft
  useEffect(() => {
    if (isEditing) return;
    const saved = localStorage.getItem("yard-vehicle-draft-new");
    if (saved) {
      try { setForm(JSON.parse(saved)); setHasUnsavedChanges(true); } catch { /* ignore */ }
    }
  }, [isEditing]);

  // Detect changes
  useEffect(() => {
    if (!initialFormRef.current) { initialFormRef.current = form; return; }
    const changed = JSON.stringify(form) !== JSON.stringify(initialFormRef.current);
    setHasUnsavedChanges(changed);
    if (changed) setAutoSaveStatus("idle");
  }, [form]);

  // Validate
  const validate = useCallback(() => {
    const e = {};
    if (!form.targa.trim()) e.targa = "Targa obbligatoria";
    if (!form.zona.trim()) e.zona = "Zona obbligatoria";
    if (!form.tag) e.tag = "Tag obbligatorio";
    if (!form.data_ingresso) e.data_ingresso = "Data ingresso obbligatoria";
    if ((form.tag === "sequestro" || form.tag === "confisca") && !form.numero_pratica.trim()) {
      e.numero_pratica = "Numero pratica obbligatorio per sequestri/confische";
    }
    if (form.data_sequestro && form.data_confisca && new Date(form.data_sequestro) > new Date(form.data_confisca)) {
      e.data_confisca = "Deve essere successiva alla data sequestro";
    }
    if (form.scadenza_pratica) {
      const sc = new Date(form.scadenza_pratica); const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
      if (sc < oggi) e.scadenza_pratica = "Scadenza nel passato";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  // Save
  const save = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      const payload = {
        org_id: orgId,
        targa: form.targa.trim(), marca: form.marca.trim(), modello: form.modello.trim(), telaio: form.telaio.trim(),
        zona: form.zona.trim(), posizione: form.posizione.trim(),
        tag: form.tag, numero_pratica: form.numero_pratica.trim(), numero_chiave: form.numero_chiave.trim(),
        autorita_competente: form.autorita_competente.trim(),
        data_sequestro: form.data_sequestro || null, data_confisca: form.data_confisca || null, scadenza_pratica: form.scadenza_pratica || null,
        stato: form.stato,
        data_ingresso: form.data_ingresso || new Date().toISOString(),
        data_rilascio: form.data_rilascio || null, data_uscita: form.data_uscita || null,
        note: form.note.trim(),
        foto: form.foto, foto_compresse: form.foto_compresse,
        condizioni_iniziali: form.condizioni_iniziali.trim(), condizioni_finali: form.condizioni_finali.trim(),
      };
      if (isEditing) {
        const { error } = await supabase.from("yard_vehicles").update(payload).eq("id", yardVehicleId).eq("org_id", orgId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("yard_vehicles").insert(payload);
        if (error) throw error;
      }
      localStorage.removeItem(`yard-vehicle-draft-${yardVehicleId || "new"}`);
      initialFormRef.current = { ...form };
      setHasUnsavedChanges(false);
      navigate("/piazzale");
    } catch (err) {
      console.error("Error saving yard vehicle:", err);
      setErrors({ general: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Exit handling
  const handleExit = () => { hasUnsavedChanges ? setShowExitConfirm(true) : navigate("/piazzale"); };
  const confirmExit = () => { localStorage.removeItem(`yard-vehicle-draft-${yardVehicleId || "new"}`); navigate("/piazzale"); };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); void save(); }
      if (e.key === "Escape") { e.preventDefault(); handleExit(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // eslint-disable-line

  // Completion percentage
  const completionPercent = (() => {
    const fields = [form.targa, form.marca, form.modello, form.zona, form.tag, form.data_ingresso, form.stato];
    if (form.tag === "sequestro" || form.tag === "confisca") fields.push(form.numero_pratica, form.autorita_competente);
    const filled = fields.filter(f => f && String(f).trim()).length;
    return Math.round((filled / fields.length) * 100);
  })();

  const tagCfg = TAG_MAP[form.tag] || TAG_MAP.altro;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="bg-[#1a2536] rounded-xl p-6 border border-[#243044]">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Caricamento mezzo...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handleExit} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#1a2536] rounded-lg transition-colors">
            <FiArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">
              {isEditing ? "Modifica Mezzo" : "Nuovo Mezzo"}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-slate-500">
                {isEditing ? "Aggiorna le informazioni del mezzo nel piazzale" : "Aggiungi un mezzo al piazzale"}
              </p>
              {hasUnsavedChanges && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <FiAlertTriangle className="w-2.5 h-2.5 mr-1" />
                  Non salvato
                </span>
              )}
              {autoSaveStatus === "saved" && !hasUnsavedChanges && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
                  <FiCheck className="w-2.5 h-2.5 mr-1" />
                  Salvato
                </span>
              )}
              {autoSaveStatus === "saved" && hasUnsavedChanges && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400">
                  Bozza salvata
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={save}
            disabled={saving}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              saving ? "bg-[#243044] text-slate-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            <FiSave className="w-3.5 h-3.5" />
            {saving ? "Salvataggio..." : "Salva Mezzo"}
          </button>
        </div>
      </div>

      {/* Errori */}
      {errors.general && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <FiAlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{errors.general}</p>
          </div>
        </div>
      )}

      {/* Summary Card */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <FiTruck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-200">
                {form.targa.trim() || "Nuova Targa"}
                {form.marca.trim() && ` — ${form.marca}`}
                {form.modello.trim() && ` ${form.modello}`}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${tagCfg.cls}`}>
                  {tagCfg.label}
                </span>
                {form.zona.trim() && (
                  <span className="text-[10px] text-slate-500">
                    <FiMapPin className="w-2.5 h-2.5 inline mr-0.5" />Zona {form.zona}
                  </span>
                )}
                {form.numero_chiave.trim() && (
                  <span className="text-[10px] text-slate-500">
                    <FiKey className="w-2.5 h-2.5 inline mr-0.5" />Chiave {form.numero_chiave}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Completamento</div>
              <div className={`text-lg font-semibold ${
                completionPercent >= 80 ? "text-emerald-400" : completionPercent >= 50 ? "text-amber-400" : "text-slate-500"
              }`}>{completionPercent}%</div>
            </div>
            <div className="w-12 h-12 relative">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#243044" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                  stroke={completionPercent >= 80 ? "#10b981" : completionPercent >= 50 ? "#f59e0b" : "#64748b"}
                  strokeWidth="3" strokeDasharray={`${completionPercent}, 100`} strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
        {/* Quick info pills */}
        {(form.numero_pratica.trim() || form.data_ingresso) && (
          <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-[#243044]">
            {form.numero_pratica.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-[#141c27] text-slate-400 border border-[#243044]">
                <FiHash className="w-2.5 h-2.5" /> {form.numero_pratica}
              </span>
            )}
            {form.data_ingresso && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-[#141c27] text-slate-400 border border-[#243044]">
                <FiCalendar className="w-2.5 h-2.5" /> Ingresso: {form.data_ingresso}
              </span>
            )}
            {form.autorita_competente.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-[#141c27] text-slate-400 border border-[#243044]">
                <FiShield className="w-2.5 h-2.5" /> {form.autorita_competente}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: Veicolo */}
        <div className="space-y-4">
          {/* Dati Veicolo */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FiTruck className="text-blue-500" />
              Dati Veicolo
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Targa <span className="text-red-500">*</span></label>
                <input type="text" value={form.targa} onChange={e => setF("targa", e.target.value.toUpperCase())} placeholder="AB123CD" className={inputCls(errors.targa)} />
                {errors.targa && <p className="mt-1 text-xs text-red-400">{errors.targa}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Marca</label>
                  <input type="text" value={form.marca} onChange={e => setF("marca", e.target.value)} placeholder="Fiat, VW..." className={inputCls()} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Modello</label>
                  <input type="text" value={form.modello} onChange={e => setF("modello", e.target.value)} placeholder="Punto, Golf..." className={inputCls()} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Telaio</label>
                <input type="text" value={form.telaio} onChange={e => setF("telaio", e.target.value.toUpperCase())} placeholder="Numero di telaio" className={inputCls()} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Numero Chiave</label>
                <input type="text" value={form.numero_chiave} onChange={e => setF("numero_chiave", e.target.value)} placeholder="Numero chiave" className={inputCls()} />
              </div>
            </div>
          </div>

          {/* Posizione */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FiMapPin className="text-emerald-500" />
              Posizione
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Zona <span className="text-red-500">*</span></label>
                <input type="text" value={form.zona} onChange={e => setF("zona", e.target.value)} placeholder="A, Nord..." className={inputCls(errors.zona)} />
                {errors.zona && <p className="mt-1 text-xs text-red-400">{errors.zona}</p>}
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Posizione</label>
                <input type="text" value={form.posizione} onChange={e => setF("posizione", e.target.value)} placeholder="A1, B3..." className={inputCls()} />
              </div>
            </div>
          </div>

          {/* Tag e Stato */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FiShield className="text-amber-500" />
              Tag e Stato
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Tag <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(TAG_MAP).map(([key, { label, cls }]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setF("tag", key)}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${
                        form.tag === key ? cls : "border-[#243044] bg-[#141c27] text-slate-500 hover:border-slate-600"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {errors.tag && <p className="mt-1 text-xs text-red-400">{errors.tag}</p>}
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Stato</label>
                <select value={form.stato} onChange={e => setF("stato", e.target.value)} className={selectCls}>
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Dettagli + Date */}
        <div className="space-y-4">
          {/* Dettagli Specifici (sequestro/confisca) */}
          {(form.tag === "sequestro" || form.tag === "confisca") ? (
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FiShield className="text-red-500" />
                Dettagli {form.tag === "sequestro" ? "Sequestro" : "Confisca"}
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Numero Pratica <span className="text-red-500">*</span></label>
                  <input type="text" value={form.numero_pratica} onChange={e => setF("numero_pratica", e.target.value)} placeholder="Numero pratica..." className={inputCls(errors.numero_pratica)} />
                  {errors.numero_pratica && <p className="mt-1 text-xs text-red-400">{errors.numero_pratica}</p>}
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Autorità Competente</label>
                  <input type="text" value={form.autorita_competente} onChange={e => setF("autorita_competente", e.target.value)} placeholder="Tribunale, GdF..." className={inputCls()} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Data Sequestro</label>
                    <input type="date" value={form.data_sequestro} onChange={e => setF("data_sequestro", e.target.value)} className={inputCls(errors.data_sequestro)} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Data Confisca</label>
                    <input type="date" value={form.data_confisca} onChange={e => setF("data_confisca", e.target.value)} className={inputCls(errors.data_confisca)} />
                    {errors.data_confisca && <p className="mt-1 text-xs text-red-400">{errors.data_confisca}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Scadenza Pratica</label>
                  <input type="date" value={form.scadenza_pratica} onChange={e => setF("scadenza_pratica", e.target.value)} className={inputCls(errors.scadenza_pratica)} />
                  {errors.scadenza_pratica && <p className="mt-1 text-xs text-red-400">{errors.scadenza_pratica}</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FiShield className="text-slate-500" />
                Dettagli Tag
              </h2>
              <div className="text-center py-6 text-slate-500">
                <FiTruck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Mezzo: {TAG_MAP[form.tag]?.label || form.tag}</p>
                <p className="text-[10px] mt-1">Nessuna informazione aggiuntiva richiesta</p>
              </div>
              {/* Numero pratica opzionale per altri tag */}
              <div className="mt-3 pt-3 border-t border-[#243044]">
                <label className="block text-xs text-slate-400 mb-1">Numero Pratica (opzionale)</label>
                <input type="text" value={form.numero_pratica} onChange={e => setF("numero_pratica", e.target.value)} placeholder="Numero pratica..." className={inputCls()} />
              </div>
            </div>
          )}

          {/* Date */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FiCalendar className="text-purple-500" />
              Date
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Data Ingresso <span className="text-red-500">*</span></label>
                <input type="date" value={form.data_ingresso} onChange={e => setF("data_ingresso", e.target.value)} className={inputCls(errors.data_ingresso)} />
                {errors.data_ingresso && <p className="mt-1 text-xs text-red-400">{errors.data_ingresso}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Data Rilascio</label>
                  <input type="date" value={form.data_rilascio} onChange={e => setF("data_rilascio", e.target.value)} className={inputCls()} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Data Uscita</label>
                  <input type="date" value={form.data_uscita} onChange={e => setF("data_uscita", e.target.value)} className={inputCls()} />
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Note</h2>
            <textarea
              value={form.note}
              onChange={e => setF("note", e.target.value)}
              placeholder="Note aggiuntive..."
              rows={3}
              className={`${inputCls()} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* Exit Confirmation */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowExitConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-4">
            <div className="font-medium mb-2">Modifiche non salvate</div>
            <div className="text-xs text-slate-400 mb-4">Hai modifiche non salvate. Uscire senza salvare?</div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1.5 text-xs text-slate-300 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors" onClick={() => setShowExitConfirm(false)}>Continua</button>
              <button className="px-3 py-1.5 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors" onClick={confirmExit}>Esci</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}