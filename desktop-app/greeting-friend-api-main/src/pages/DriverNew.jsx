/**
 * New Driver Form Page
 * Crea o modifica autista — Design L aligned
 * 
 * @author haxies
 * @created 2025
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft, FiSave, FiLoader, FiUser, FiCalendar,
  FiAlertCircle, FiCheck, FiTruck
} from "react-icons/fi";
import { supabaseBrowser } from "../lib/supabase-browser";
import { useOrg } from "../context/OrgContext";

/* ─── Costanti ─── */
const DAYS = [
  { key: "lun", label: "Lun" },
  { key: "mar", label: "Mar" },
  { key: "mer", label: "Mer" },
  { key: "gio", label: "Gio" },
  { key: "ven", label: "Ven" },
  { key: "sab", label: "Sab" },
  { key: "dom", label: "Dom" },
];

const STATI = [
  { value: "disponibile", label: "Disponibile", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { value: "occupato", label: "Occupato", cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { value: "offline", label: "Offline", cls: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
];

const PREFERENZE_MEZZO = ["Carro leggero", "Carro medio", "Carro pesante"];
const PATENTI_OPTIONS = ["B", "C", "CE", "D", "DE"];

const DEFAULT_DISP = { lun: true, mar: true, mer: true, gio: true, ven: true, sab: false, dom: false };

const inputCls = "w-full h-8 px-3 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/30 outline-none transition";

export default function DriverNew() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();

  const driverId = paramId && paramId !== "new" ? paramId : null;
  const isEditing = Boolean(driverId);

  const [form, setForm] = useState({
    nome: "", telefono: "", patente: "", stato: "disponibile",
    assegnati_oggi: 0, note: "", tags: [], preferenze: [],
    disp: { ...DEFAULT_DISP },
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const initialFormRef = useRef(null);

  // Carica autista esistente
  useEffect(() => {
    if (!isEditing || !driverId || !orgId) return;

    const loadDriver = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("staff_drivers")
          .select("*")
          .eq("id", driverId)
          .eq("org_id", orgId)
          .single();

        if (error) throw error;

        if (data) {
          const loadedForm = {
            nome: data.nome || "",
            telefono: data.telefono || "",
            patente: data.patente || "",
            stato: data.stato || "disponibile",
            assegnati_oggi: data.assegnati_oggi || 0,
            note: data.note || "",
            tags: data.tags || [],
            preferenze: data.preferenze || [],
            disp: data.disp || { ...DEFAULT_DISP },
          };
          setForm(loadedForm);
          initialFormRef.current = loadedForm;
          setHasUnsavedChanges(false);
        }
      } catch (err) {
        console.error("Error loading driver:", err);
        setErrors({ general: "Errore durante il caricamento dell'autista" });
      } finally {
        setLoading(false);
      }
    };

    loadDriver();
  }, [isEditing, driverId, orgId, supabase]);

  // Auto-save draft
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const timer = setTimeout(() => {
      localStorage.setItem(`driver-draft-${driverId || "new"}`, JSON.stringify(form));
    }, 2000);
    return () => clearTimeout(timer);
  }, [form, hasUnsavedChanges, driverId]);

  // Carica draft salvato (solo per nuovo)
  useEffect(() => {
    if (isEditing) return;
    const savedDraft = localStorage.getItem("driver-draft-new");
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
    if (!form.nome.trim()) newErrors.nome = "Nome è obbligatorio";
    if (!form.telefono.trim()) newErrors.telefono = "Telefono è obbligatorio";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  // Salva
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setSaveSuccess(false);

      const driverData = {
        org_id: orgId,
        nome: form.nome.trim(),
        telefono: form.telefono.trim(),
        patente: form.patente.trim(),
        stato: form.stato,
        assegnati_oggi: Number(form.assegnati_oggi || 0),
        note: form.note.trim(),
        tags: form.tags,
        preferenze: form.preferenze,
        disp: form.disp,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("staff_drivers")
          .update(driverData)
          .eq("id", driverId)
          .eq("org_id", orgId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("staff_drivers")
          .insert(driverData);
        if (error) throw error;
      }

      localStorage.removeItem(`driver-draft-${driverId || "new"}`);
      initialFormRef.current = { ...form };
      setHasUnsavedChanges(false);
      setSaveSuccess(true);

      setTimeout(() => navigate("/autisti"), 800);
    } catch (err) {
      console.error("Error saving driver:", err);
      setErrors({ general: "Errore durante il salvataggio dell'autista" });
    } finally {
      setSaving(false);
    }
  };

  // Uscita con conferma
  const handleExit = () => {
    if (hasUnsavedChanges) setShowExitConfirm(true);
    else navigate("/autisti");
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

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-8 w-20 bg-[#1a2536] rounded-lg" />
          <div><div className="h-5 w-40 bg-[#243044] rounded mb-2" /><div className="h-3 w-56 bg-[#1a2536] rounded" /></div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5 h-80" />
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5 h-80" />
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
            Autisti
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">
              {isEditing ? "Modifica Autista" : "Nuovo Autista"}
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              {isEditing ? `ID: ${driverId}` : "Inserisci le informazioni del nuovo autista"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Save status */}
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

          {/* Card: Dati personali */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#243044]">
              <FiUser className="w-3.5 h-3.5 text-blue-400" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Informazioni Base</h2>
            </div>
            <div className="p-5 space-y-4">
              {/* Nome */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5 block">
                  Nome completo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => set("nome", e.target.value)}
                  placeholder="Mario Rossi"
                  className={`${inputCls} ${errors.nome ? "border-red-500/40 focus:ring-red-500/30" : ""}`}
                />
                {errors.nome && <p className="mt-1 text-[10px] text-red-400">{errors.nome}</p>}
              </div>

              {/* Telefono */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5 block">
                  Telefono <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => set("telefono", e.target.value)}
                  placeholder="+39 123 456 7890"
                  className={`${inputCls} ${errors.telefono ? "border-red-500/40 focus:ring-red-500/30" : ""}`}
                />
                {errors.telefono && <p className="mt-1 text-[10px] text-red-400">{errors.telefono}</p>}
              </div>

              {/* Patente */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5 block">Patente</label>
                <div className="flex flex-wrap gap-1.5">
                  {PATENTI_OPTIONS.map(p => {
                    const active = form.patente.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          const current = form.patente.split(",").map(s => s.trim()).filter(Boolean);
                          const next = active ? current.filter(x => x !== p) : [...current, p];
                          set("patente", next.join(", "));
                        }}
                        className={`h-7 px-2.5 rounded-md text-[10px] font-medium border transition ${
                          active
                            ? "bg-blue-600 text-white border-blue-600"
                            : "text-slate-400 border-[#243044] bg-[#141c27] hover:bg-[#1e2b3d]"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assegnati oggi */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5 block">Assegnati oggi</label>
                <input
                  type="number"
                  min="0"
                  value={form.assegnati_oggi}
                  onChange={(e) => set("assegnati_oggi", Number(e.target.value) || 0)}
                  className={inputCls}
                />
              </div>

              {/* Note */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5 block">Note</label>
                <textarea
                  rows={3}
                  value={form.note}
                  onChange={(e) => set("note", e.target.value)}
                  placeholder="Turni, restrizioni, preferenze..."
                  className="w-full px-3 py-2 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/30 outline-none resize-none transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Colonna destra: Stato + Disponibilità + Preferenze ═══ */}
        <div className="space-y-5">

          {/* Card: Stato */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#243044]">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stato</h2>
            </div>
            <div className="p-5">
              <div className="flex gap-2">
                {STATI.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => set("stato", s.value)}
                    className={`flex-1 h-9 rounded-lg text-xs font-medium border transition ${
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

          {/* Card: Disponibilità settimanale */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#243044]">
              <FiCalendar className="w-3.5 h-3.5 text-emerald-400" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Disponibilità</h2>
              <span className="ml-auto text-[10px] text-slate-500">
                {Object.values(form.disp).filter(Boolean).length}/7 giorni
              </span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map(day => (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => set("disp", { ...form.disp, [day.key]: !form.disp[day.key] })}
                    className={`h-9 rounded-lg border text-xs font-medium transition ${
                      form.disp[day.key]
                        ? "bg-blue-600 text-white border-blue-600"
                        : "text-slate-400 border-[#243044] bg-[#141c27] hover:bg-[#1e2b3d]"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card: Preferenze mezzo */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#243044]">
              <FiTruck className="w-3.5 h-3.5 text-amber-400" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Preferenze Mezzo</h2>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                {PREFERENZE_MEZZO.map(pref => {
                  const active = form.preferenze.includes(pref);
                  return (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => {
                        set("preferenze", active
                          ? form.preferenze.filter(p => p !== pref)
                          : [...form.preferenze, pref]
                        );
                      }}
                      className={`h-8 px-3 rounded-lg text-xs font-medium border transition ${
                        active
                          ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                          : "text-slate-400 border-[#243044] bg-[#141c27] hover:bg-[#1e2b3d]"
                      }`}
                    >
                      {pref}
                    </button>
                  );
                })}
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
                  localStorage.removeItem(`driver-draft-${driverId || "new"}`);
                  navigate("/autisti");
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
