/**
 * New / Edit User Form Page — Design L aligned
 * Crea o modifica utente con ruoli e permessi
 *
 * @author haxies
 * @created 2025
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft, FiSave, FiLoader, FiUser, FiShield,
  FiAlertCircle, FiCheck, FiEye, FiEyeOff, FiMail,
  FiMonitor, FiSmartphone
} from "react-icons/fi";
import { supabaseBrowser } from "../lib/supabase-browser";
import { useOrg } from "../context/OrgContext";
import { OAuthService } from "../lib/oauth";
import { useOperatorAuth } from "../hooks/useOperatorAuth";

const API_BASE = import.meta.env.VITE_API_BASE || 'https://oauth.rescuemanager.eu';

/* ─── Costanti ─── */
const ROLES = [
  { value: "admin",      label: "Admin",       desc: "Accesso completo", cls: "text-red-400 bg-red-500/10 border-red-500/20" },
  { value: "dispatcher", label: "Dispatcher",  desc: "Assegnazioni e calendario", cls: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { value: "autista",    label: "Autista",     desc: "Trasporti assegnati", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { value: "meccanico",  label: "Meccanico",   desc: "Mezzi e manutenzioni", cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { value: "viewer",     label: "Viewer",      desc: "Solo lettura", cls: "text-slate-400 bg-[#243044] border-[#243044]" },
];

const STATI = [
  { value: "attivo",   label: "Attivo",   cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { value: "sospeso",  label: "Sospeso",  cls: "text-red-400 bg-red-500/10 border-red-500/20" },
  { value: "invitato", label: "Invitato", cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
];

const PERM_MAP = {
  admin:      ["Accesso completo a tutte le funzioni", "Gestione utenti e ruoli", "Configurazione sistema", "Modifica di tutti i dati"],
  dispatcher: ["Gestione assegnazioni trasporti", "Calendario e pianificazione", "Modifica trasporti e stato", "Report operativi"],
  autista:    ["Trasporti assegnati", "Aggiornamento stato", "Upload foto e documenti", "Firma digitale"],
  meccanico:  ["Gestione mezzi e manutenzioni", "Trasporti (sola lettura)", "Ricambi e ordini", "Report manutenzioni"],
  viewer:     ["Sola lettura su tutti i dati", "Report e statistiche", "Nessuna modifica permessa"],
};

const inputCls = "w-full h-8 px-3 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/30 outline-none transition";

export default function UserNew() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();

  const userId = paramId && paramId !== "new" ? paramId : null;
  const isEdit = Boolean(userId);

  const [form, setForm] = useState({
    nome: "", email: "", ruolo: "viewer", stato: "attivo", note: "", password: "",
    accesso_desktop: false, accesso_mobile: false, password_desktop: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const initialFormRef = useRef(null);

  // Carica utente esistente
  useEffect(() => {
    if (!isEdit || !orgId) return;
    setLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from("users").select("*").eq("id", userId).eq("org_id", orgId).single();
        if (error) throw error;
        const loaded = {
          nome: data.nome || "", email: data.email || "",
          ruolo: data.ruolo || "viewer", stato: data.stato || "attivo",
          note: data.note || "", password: "",
          accesso_desktop: data.accesso_desktop || false,
          accesso_mobile: data.accesso_mobile || false,
          password_desktop: "",
        };
        setForm(loaded);
        initialFormRef.current = loaded;
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error("Error loading user:", err);
        setErrors({ general: "Errore durante il caricamento." });
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, userId, orgId, supabase]);

  // Auto-save draft
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const t = setTimeout(() => localStorage.setItem(`user-draft-${userId || "new"}`, JSON.stringify(form)), 2000);
    return () => clearTimeout(t);
  }, [form, hasUnsavedChanges, userId]);

  // Load draft (new only)
  useEffect(() => {
    if (isEdit) return;
    const d = localStorage.getItem("user-draft-new");
    if (d) { try { setForm(JSON.parse(d)); setHasUnsavedChanges(true); } catch { /* ignore */ } }
  }, [isEdit]);

  // Track changes
  useEffect(() => {
    if (!initialFormRef.current) { initialFormRef.current = form; return; }
    setHasUnsavedChanges(JSON.stringify(form) !== JSON.stringify(initialFormRef.current));
  }, [form]);

  // Validazione
  const validateForm = useCallback(() => {
    const e = {};
    if (!form.nome.trim()) e.nome = "Il nome è obbligatorio";
    if (!form.email.trim()) e.email = "L'email è obbligatoria";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Formato email non valido";
    if (!isEdit && form.password && form.password.length < 8) e.password = "Minimo 8 caratteri";
    if (form.accesso_desktop && !isEdit && (!form.password_desktop || form.password_desktop.length < 6)) e.password_desktop = "Password desktop obbligatoria (min. 6 caratteri)";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form, isEdit]);

  // Salva
  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const userData = {
        nome: form.nome.trim(), email: form.email.trim(),
        ruolo: form.ruolo, stato: form.stato,
        note: form.note.trim() || null,
        accesso_desktop: form.accesso_desktop,
        accesso_mobile: form.accesso_mobile,
      };
      if (isEdit) {
        const { error } = await supabase.from("users").update(userData).eq("id", userId).eq("org_id", orgId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("users").insert({ ...userData, org_id: orgId });
        if (error) throw error;
      }

      // Se accesso desktop abilitato, crea anche operatore via OAuth API
      if (form.accesso_desktop && !isEdit && form.password_desktop) {
        try {
          const tokens = OAuthService.getTokens();
          const token = tokens?.access_token;
          if (token) {
            const res = await fetch(`${API_BASE}/api/auth/operator/create`, {
              method: "POST",
              headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ org_id: orgId, nome: form.nome.trim(), password: form.password_desktop }),
            });
            const data = await res.json();
            if (!data.success) console.warn("Operator creation warning:", data.error);
          }
        } catch (opErr) {
          console.warn("Error creating desktop operator:", opErr);
        }
      }
      localStorage.removeItem(`user-draft-${userId || "new"}`);
      initialFormRef.current = { ...form };
      setHasUnsavedChanges(false);
      setSaveSuccess(true);
      setTimeout(() => navigate("/utenti"), 800);
    } catch (err) {
      console.error("Error saving user:", err);
      setErrors({ general: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Uscita
  const handleExit = () => {
    if (hasUnsavedChanges) setShowExitConfirm(true);
    else navigate("/utenti");
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
            Utenti
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">
              {isEdit ? "Modifica Utente" : "Nuovo Utente"}
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              {isEdit ? `ID: ${userId}` : "Crea un nuovo utente per l'organizzazione"}
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
            {saving ? <FiLoader className="w-3.5 h-3.5 inline mr-1 animate-spin" /> : <FiSave className="w-3.5 h-3.5 inline mr-1" />}
            {isEdit ? "Aggiorna" : "Salva"}
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

        {/* ═══ Colonna sinistra: Info + Password ═══ */}
        <div className="space-y-5">

          {/* Card: Informazioni */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#243044]">
              <FiUser className="w-3.5 h-3.5 text-blue-400" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Informazioni</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5 block">
                  Nome completo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => set("nome", e.target.value)}
                  placeholder="Nome e cognome"
                  autoFocus
                  className={`${inputCls} ${errors.nome ? "border-red-500/40 focus:ring-red-500/30" : ""}`}
                />
                {errors.nome && <p className="mt-1 text-[10px] text-red-400">{errors.nome}</p>}
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5 block">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="nome@azienda.it"
                  className={`${inputCls} ${errors.email ? "border-red-500/40 focus:ring-red-500/30" : ""}`}
                />
                {errors.email && <p className="mt-1 text-[10px] text-red-400">{errors.email}</p>}
              </div>

              {/* Password (solo nuovo) */}
              {!isEdit && (
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5 block">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder="Min. 8 caratteri (vuoto = auto)"
                      className={`${inputCls} pr-8 ${errors.password ? "border-red-500/40 focus:ring-red-500/30" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400"
                    >
                      {showPassword ? <FiEyeOff className="w-3 h-3" /> : <FiEye className="w-3 h-3" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-[10px] text-red-400">{errors.password}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Card: Accesso Piattaforme */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#243044]">
              <FiMonitor className="w-3.5 h-3.5 text-blue-400" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Accesso Piattaforme</h2>
            </div>
            <div className="p-5 space-y-4">
              {/* Desktop App toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${form.accesso_desktop ? "bg-blue-500/15" : "bg-[#243044]"}`}>
                    <FiMonitor className={`w-4 h-4 ${form.accesso_desktop ? "text-blue-400" : "text-slate-600"}`} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-200">Desktop App</div>
                    <div className="text-[10px] text-slate-500">Accesso alla Desktop App con operatore</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => set("accesso_desktop", !form.accesso_desktop)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${form.accesso_desktop ? "bg-blue-600" : "bg-[#243044]"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.accesso_desktop ? "left-[18px]" : "left-0.5"}`} />
                </button>
              </div>

              {/* Desktop password (solo nuovo + desktop abilitato) */}
              {form.accesso_desktop && !isEdit && (
                <div className="pl-10">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5 block">
                    Password Operatore Desktop <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password_desktop}
                      onChange={(e) => set("password_desktop", e.target.value)}
                      placeholder="Min. 6 caratteri"
                      className={`${inputCls} pr-8 ${errors.password_desktop ? "border-red-500/40 focus:ring-red-500/30" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400"
                    >
                      {showPassword ? <FiEyeOff className="w-3 h-3" /> : <FiEye className="w-3 h-3" />}
                    </button>
                  </div>
                  {errors.password_desktop && <p className="mt-1 text-[10px] text-red-400">{errors.password_desktop}</p>}
                  <p className="mt-1 text-[10px] text-slate-600">Verrà creato un operatore per il login nella Desktop App</p>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-[#243044]" />

              {/* RescueMobile toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${form.accesso_mobile ? "bg-emerald-500/15" : "bg-[#243044]"}`}>
                    <FiSmartphone className={`w-4 h-4 ${form.accesso_mobile ? "text-emerald-400" : "text-slate-600"}`} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-200">RescueMobile</div>
                    <div className="text-[10px] text-slate-500">Accesso all'app mobile per autisti e meccanici</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => set("accesso_mobile", !form.accesso_mobile)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${form.accesso_mobile ? "bg-emerald-600" : "bg-[#243044]"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.accesso_mobile ? "left-[18px]" : "left-0.5"}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Card: Note */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#243044]">
              <FiMail className="w-3.5 h-3.5 text-blue-400" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Note</h2>
            </div>
            <div className="p-5">
              <textarea
                rows={3}
                value={form.note}
                onChange={(e) => set("note", e.target.value)}
                placeholder="Turni, specializzazioni, contatti..."
                className="w-full px-3 py-2 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/30 outline-none resize-none transition"
              />
            </div>
          </div>
        </div>

        {/* ═══ Colonna destra: Ruolo + Stato + Permessi ═══ */}
        <div className="space-y-5">

          {/* Card: Ruolo */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#243044]">
              <FiShield className="w-3.5 h-3.5 text-blue-400" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ruolo</h2>
            </div>
            <div className="p-5 space-y-1.5">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => set("ruolo", r.value)}
                  className={`w-full flex items-center justify-between h-9 px-3 rounded-lg text-xs font-medium border transition ${
                    form.ruolo === r.value
                      ? `${r.cls} border`
                      : "text-slate-500 border-[#243044] bg-[#141c27] hover:bg-[#1e2b3d]"
                  }`}
                >
                  <span>{r.label}</span>
                  <span className="text-[10px] opacity-70">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Card: Stato */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#243044]">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stato</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-3 gap-2">
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

          {/* Card: Permessi ruolo */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#243044]">
              <FiShield className="w-3.5 h-3.5 text-emerald-400" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Permessi — {form.ruolo}</h2>
            </div>
            <div className="p-5">
              <ul className="space-y-1.5">
                {(PERM_MAP[form.ruolo] || []).map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-slate-400">
                    <FiCheck className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
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
                  localStorage.removeItem(`user-draft-${userId || "new"}`);
                  navigate("/utenti");
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
