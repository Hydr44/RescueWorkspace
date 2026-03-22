/**
 * New Vehicle Form Page
 * Crea o modifica mezzo — Design L aligned
 * 
 * @author haxies
 * @created 2025
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft, FiSave, FiLoader, FiTruck, FiAlertCircle,
  FiCheck, FiCalendar, FiUser, FiShield
} from "react-icons/fi";
import { supabaseBrowser } from "../lib/supabase-browser";
import { useOrg } from "../context/OrgContext";

/* ─── Costanti ─── */
const STATI = [
  { value: "disponibile", label: "Disponibile", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { value: "in_uso", label: "In Uso", cls: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { value: "manutenzione", label: "Manutenzione", cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { value: "fuori_servizio", label: "Fuori Servizio", cls: "text-red-400 bg-red-500/10 border-red-500/20" },
];

const TIPI = ["furgone", "camion", "auto", "motociclo", "altro"];

const inputCls = "w-full h-8 px-3 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/30 outline-none transition";

export default function VehicleNew() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();

  const vehicleId = paramId && paramId !== "new" ? paramId : null;
  const isEditing = Boolean(vehicleId);

  const [form, setForm] = useState({
    targa: "", modello: "", marca: "", tipo: "", portata: "",
    autista: "", telaio: "", stato: "disponibile",
    scad_assicurazione: "", scad_revisione: "", scad_bollo: "", scad_tachigrafo: "",
    note: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const initialFormRef = useRef(null);
  const [driversList, setDriversList] = useState([]);

  // Carica lista autisti per dropdown
  useEffect(() => {
    if (!orgId) return;
    supabase.from('staff_drivers').select('id, nome, cognome, telefono, stato').eq('org_id', orgId).order('nome')
      .then(({ data }) => setDriversList(data || []));
  }, [orgId, supabase]);

  // Carica mezzo esistente
  useEffect(() => {
    if (!isEditing || !orgId) return;

    const loadVehicle = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("vehicles")
          .select("*")
          .eq("id", vehicleId)
          .eq("org_id", orgId)
          .single();

        if (error) throw error;

        if (data) {
          const loadedForm = {
            targa: data.targa || "", modello: data.modello || "",
            marca: data.marca || "", tipo: data.tipo || "",
            portata: data.portata || "", autista: data.autista || "",
            telaio: data.telaio || "", stato: data.stato || "disponibile",
            scad_assicurazione: data.scad_assicurazione || "",
            scad_revisione: data.scad_revisione || "",
            scad_bollo: data.scad_bollo || "",
            scad_tachigrafo: data.scad_tachigrafo || "",
            note: data.note || "",
          };
          setForm(loadedForm);
          initialFormRef.current = loadedForm;
          setHasUnsavedChanges(false);
        }
      } catch (err) {
        console.error("Error loading vehicle:", err);
        setErrors({ general: "Errore durante il caricamento del mezzo" });
      } finally {
        setLoading(false);
      }
    };

    loadVehicle();
  }, [isEditing, vehicleId, orgId, supabase]);

  // Auto-save draft
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const timer = setTimeout(() => {
      localStorage.setItem(`vehicle-draft-${vehicleId || "new"}`, JSON.stringify(form));
    }, 2000);
    return () => clearTimeout(timer);
  }, [form, hasUnsavedChanges, vehicleId]);

  // Carica draft salvato (solo per nuovo)
  useEffect(() => {
    if (isEditing) return;
    const savedDraft = localStorage.getItem("vehicle-draft-new");
    if (savedDraft) {
      try {
        setForm(JSON.parse(savedDraft));
        setHasUnsavedChanges(true);
      } catch { /* ignore */ }
    }
  }, [isEditing]);

  // Track changes
  useEffect(() => {
    if (!initialFormRef.current) {
      initialFormRef.current = form;
      return;
    }
    setHasUnsavedChanges(JSON.stringify(form) !== JSON.stringify(initialFormRef.current));
  }, [form]);

  // Validazione
  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!form.targa.trim()) newErrors.targa = "La targa è obbligatoria";
    if (!form.modello.trim()) newErrors.modello = "Il modello è obbligatorio";
    if (!form.tipo.trim()) newErrors.tipo = "Il tipo di mezzo è obbligatorio";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (form.scad_assicurazione && new Date(form.scad_assicurazione) < today) newErrors.scad_assicurazione = "Data nel passato";
    if (form.scad_revisione && new Date(form.scad_revisione) < today) newErrors.scad_revisione = "Data nel passato";
    if (form.scad_bollo && new Date(form.scad_bollo) < today) newErrors.scad_bollo = "Data nel passato";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  // Salva
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setSaveSuccess(false);

      const vehicleData = {
        org_id: orgId,
        targa: form.targa.trim(), modello: form.modello.trim(),
        marca: form.marca.trim(), tipo: form.tipo.trim(),
        portata: form.portata.trim ? form.portata.trim() : form.portata,
        autista: form.autista.trim(), telaio: form.telaio.trim(),
        stato: form.stato,
        scad_assicurazione: form.scad_assicurazione || null,
        scad_revisione: form.scad_revisione || null,
        scad_bollo: form.scad_bollo || null,
        scad_tachigrafo: form.scad_tachigrafo || null,
        note: form.note.trim(),
      };

      if (isEditing) {
        const { error } = await supabase
          .from("vehicles")
          .update(vehicleData)
          .eq("id", vehicleId)
          .eq("org_id", orgId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("vehicles")
          .insert(vehicleData);
        if (error) throw error;
      }

      localStorage.removeItem(`vehicle-draft-${vehicleId || "new"}`);
      initialFormRef.current = { ...form };
      setHasUnsavedChanges(false);
      setSaveSuccess(true);

      setTimeout(() => navigate("/mezzi"), 800);
    } catch (err) {
      console.error("Error saving vehicle:", err);
      setErrors({ general: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Uscita con conferma
  const handleExit = () => {
    if (hasUnsavedChanges) setShowExitConfirm(true);
    else navigate("/mezzi");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") handleExit();
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); handleSave(); }
    };
    globalThis.addEventListener("keydown", handler);
    return () => globalThis.removeEventListener("keydown", handler);
  }, [hasUnsavedChanges]); // eslint-disable-line

  // Helper
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // Scadenza helper — colore warning se entro 30gg
  const scadCls = (dateStr) => {
    if (!dateStr) return "";
    const diff = (new Date(dateStr) - Date.now()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return "border-red-500/40";
    if (diff < 30) return "border-amber-500/40";
    return "";
  };

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-8 w-20 bg-[#1a2536] rounded-lg" />
          <div><div className="h-5 w-40 bg-[#243044] rounded mb-2" /><div className="h-3 w-56 bg-[#1a2536] rounded" /></div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5 h-96" />
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5 h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Header compatto ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExit}
            className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition"
          >
            <FiArrowLeft className="w-3.5 h-3.5 inline mr-1" />
            Mezzi
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">
              {isEditing ? "Modifica Mezzo" : "Nuovo Mezzo"}
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              {isEditing ? `ID: ${vehicleId}` : "Aggiungi un nuovo mezzo alla flotta"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <FiCheck className="w-3 h-3" /> Salvato
            </span>
          )}
          {hasUnsavedChanges && !saveSuccess && (
            <span className="text-[10px] text-amber-400">Modifiche non salvate</span>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="h-8 px-4 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <FiLoader className="w-3.5 h-3.5 inline mr-1 animate-spin" />
            ) : (
              <FiSave className="w-3.5 h-3.5 inline mr-1" />
            )}
            {isEditing ? "Aggiorna" : "Salva"}
          </button>
        </div>
      </div>

      {/* ── Errore globale ── */}
      {errors.general && (
        <div className="bg-red-500/5 rounded-xl border border-red-500/15 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <FiAlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-xs text-red-400">{errors.general}</span>
          </div>
        </div>
      )}

      {/* ── Form 2 colonne ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ═══ Colonna sinistra: Info base ═══ */}
        <div className="space-y-5">

          {/* Card: Dati veicolo */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#243044]">
              <FiTruck className="w-3.5 h-3.5 text-blue-400" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Informazioni Base</h2>
            </div>
            <div className="p-5 space-y-4">
              {/* Targa + Telaio */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5 block">
                    Targa <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.targa}
                    onChange={(e) => set("targa", e.target.value.toUpperCase())}
                    placeholder="AB123CD"
                    className={`${inputCls} ${errors.targa ? "border-red-500/40 focus:ring-red-500/30" : ""}`}
                  />
                  {errors.targa && <p className="mt-1 text-[10px] text-red-400">{errors.targa}</p>}
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5 block">Telaio (VIN)</label>
                  <input
                    type="text"
                    value={form.telaio}
                    onChange={(e) => set("telaio", e.target.value.toUpperCase())}
                    placeholder="1HGBH41JXMN109186"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Marca + Modello */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5 block">Marca</label>
                  <input
                    type="text"
                    value={form.marca}
                    onChange={(e) => set("marca", e.target.value)}
                    placeholder="Fiat, Iveco..."
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5 block">
                    Modello <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.modello}
                    onChange={(e) => set("modello", e.target.value)}
                    placeholder="Ducato, Daily..."
                    className={`${inputCls} ${errors.modello ? "border-red-500/40 focus:ring-red-500/30" : ""}`}
                  />
                  {errors.modello && <p className="mt-1 text-[10px] text-red-400">{errors.modello}</p>}
                </div>
              </div>

              {/* Tipo (toggle buttons) */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5 block">
                  Tipo <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TIPI.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set("tipo", t)}
                      className={`h-7 px-2.5 rounded-md text-[10px] font-medium border capitalize transition ${
                        form.tipo === t
                          ? "bg-blue-600 text-white border-blue-600"
                          : "text-slate-400 border-[#243044] bg-[#141c27] hover:bg-[#1e2b3d]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {errors.tipo && <p className="mt-1 text-[10px] text-red-400">{errors.tipo}</p>}
              </div>

              {/* Portata */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5 block">Portata (kg)</label>
                <input
                  type="number"
                  value={form.portata}
                  onChange={(e) => set("portata", e.target.value)}
                  placeholder="1500"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Card: Assegnazione e Note */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#243044]">
              <FiUser className="w-3.5 h-3.5 text-blue-400" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assegnazione</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5 block">Autista assegnato</label>
                <select
                  value={form.autista}
                  onChange={(e) => set("autista", e.target.value)}
                  className={inputCls}
                >
                  <option value="">— Nessun autista —</option>
                  {driversList.map(d => (
                    <option key={d.id} value={d.nome + (d.cognome ? ` ${d.cognome}` : '')}>
                      {d.nome}{d.cognome ? ` ${d.cognome}` : ''}{d.stato === 'non_disponibile' ? ' (non disponibile)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5 block">Note</label>
                <textarea
                  rows={3}
                  value={form.note}
                  onChange={(e) => set("note", e.target.value)}
                  placeholder="Manutenzione, danni, note..."
                  className="w-full px-3 py-2 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/30 outline-none resize-none transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Colonna destra: Stato + Scadenze ═══ */}
        <div className="space-y-5">

          {/* Card: Stato */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#243044]">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stato</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-2">
                {STATI.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => set("stato", s.value)}
                    className={`h-9 rounded-lg text-xs font-medium border transition ${
                      form.stato === s.value
                        ? `${s.cls} border`
                        : "text-slate-500 border-[#243044] bg-[#141c27] hover:bg-[#1e2b3d]"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card: Scadenze */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#243044]">
              <FiCalendar className="w-3.5 h-3.5 text-emerald-400" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scadenze</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5 block">
                  <FiShield className="w-3 h-3 inline mr-1" />Assicurazione
                </label>
                <input
                  type="date"
                  value={form.scad_assicurazione}
                  onChange={(e) => set("scad_assicurazione", e.target.value)}
                  className={`${inputCls} ${scadCls(form.scad_assicurazione)}`}
                />
                {errors.scad_assicurazione && <p className="mt-1 text-[10px] text-red-400">{errors.scad_assicurazione}</p>}
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5 block">Revisione</label>
                <input
                  type="date"
                  value={form.scad_revisione}
                  onChange={(e) => set("scad_revisione", e.target.value)}
                  className={`${inputCls} ${scadCls(form.scad_revisione)}`}
                />
                {errors.scad_revisione && <p className="mt-1 text-[10px] text-red-400">{errors.scad_revisione}</p>}
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5 block">Bollo</label>
                <input
                  type="date"
                  value={form.scad_bollo}
                  onChange={(e) => set("scad_bollo", e.target.value)}
                  className={`${inputCls} ${scadCls(form.scad_bollo)}`}
                />
                {errors.scad_bollo && <p className="mt-1 text-[10px] text-red-400">{errors.scad_bollo}</p>}
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5 block">Tachigrafo</label>
                <input
                  type="date"
                  value={form.scad_tachigrafo}
                  onChange={(e) => set("scad_tachigrafo", e.target.value)}
                  className={`${inputCls} ${scadCls(form.scad_tachigrafo)}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dialog conferma uscita ── */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-sm border-none cursor-pointer"
            onClick={() => setShowExitConfirm(false)}
            aria-label="Chiudi"
            type="button"
          />
          <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-5">
            <div className="text-sm font-semibold text-slate-200 mb-1.5">Modifiche non salvate</div>
            <div className="text-xs text-slate-400 mb-5">
              Hai delle modifiche non salvate. Sei sicuro di voler uscire?
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition"
                onClick={() => setShowExitConfirm(false)}
              >
                Continua
              </button>
              <button
                className="h-8 px-3 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                onClick={() => {
                  localStorage.removeItem(`vehicle-draft-${vehicleId || "new"}`);
                  navigate("/mezzi");
                }}
              >
                Esci senza salvare
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
