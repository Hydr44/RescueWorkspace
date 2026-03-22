// src/pages/RifiutiRegistroForm.jsx
/**
 * Form Creazione/Modifica Registro Cronologico RENTRI
 * Design L aligned
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import {
  FiSave, FiArrowLeft, FiFileText, FiPrinter,
  FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiX, FiInfo
} from "react-icons/fi";
import { printRegistroDetail } from "../lib/services/rentriPrintService";
import { supabaseBrowser } from "../lib/supabase-browser";
import { getRentriEnvironment } from "../lib/rentri-api";

/* ─── Helpers ─── */
const inputCls = "w-full px-3 py-2 text-sm bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-600 focus:ring-1 focus:ring-blue-500/50 outline-none transition-colors";
const inputDisabledCls = "bg-gray-800/30 cursor-not-allowed opacity-60";
const selectCls = inputCls;

/* ─── FormSection (identico al FIR) ─── */
const SECTION_COLORS = {
  blue:   { bar: "bg-blue-600",   header: "bg-blue-900/20 border-blue-800/40" },
  green:  { bar: "bg-teal-600",  header: "bg-teal-900/20 border-teal-800/40" },
  amber:  { bar: "bg-amber-600",  header: "bg-amber-900/20 border-amber-800/40" },
  purple: { bar: "bg-purple-600", header: "bg-purple-900/20 border-purple-800/40" },
  indigo: { bar: "bg-indigo-600", header: "bg-indigo-900/20 border-indigo-800/40" },
};
function FormSection({ number, title, children, color = "blue" }) {
  const c = SECTION_COLORS[color] || SECTION_COLORS.blue;
  return (
    <div className="bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden">
      <div className={`flex items-center gap-3 px-4 py-3 border-b border-gray-700 ${c.header}`}>
        <div className={`flex-shrink-0 w-7 h-7 ${c.bar} text-white rounded flex items-center justify-center font-bold text-xs`}>{number}</div>
        <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* ─── FInput / FSelect inline helpers ─── */
function FInput({ label, error, required, mono, children: _c, ...props }) {
  return (
    <div>
      {label && <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <input className={`${inputCls} ${mono ? "font-mono" : ""} ${error ? "border-red-500/60" : ""} ${props.readOnly ? inputDisabledCls : ""}`} {...props} />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
function FSelect({ label, error, required, children, ...props }) {
  return (
    <div>
      {label && <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <select className={`${selectCls} ${error ? "border-red-500/60" : ""}`} {...props}>{children}</select>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

export default function RifiutiRegistroForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orgId } = useOrg();
  const [rentriEnv, setRentriEnv] = useState('demo');
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [numIscrSito, setNumIscrSito] = useState("");
  const [loadingCert, setLoadingCert] = useState(true);
  const [autorizzazioni, setAutorizzazioni] = useState([]);
  const [loadingAutorizzazioni, setLoadingAutorizzazioni] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [registroData, setRegistroData] = useState(null);
  const [movimenti, setMovimenti] = useState([]);

  const currentYear = new Date().getFullYear();

  const [form, setForm] = useState({
    anno: currentYear, tipo: "carico_scarico", numero_registro: "",
    unita_locale: "", autorizzazione: "", stato: "bozza", note: "", num_iscr_sito: "",
    attivita: [], descrizione: "",
    unita_locale_indirizzo: "", unita_locale_comune: "",
    unita_locale_provincia: "", unita_locale_cap: "",
  });
  const [errors, setErrors] = useState({});

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 6000);
  }, []);

  useEffect(() => {
    if (orgId) {
      getRentriEnvironment(orgId).then(env => setRentriEnv(env));
      loadCertificato();
      if (id) loadData();
    }
  }, [id, orgId]); // eslint-disable-line

  useEffect(() => {
    if (numIscrSito && orgId && !id) loadAutorizzazioni();
  }, [numIscrSito, orgId, id]); // eslint-disable-line

  async function loadCertificato() {
    if (!orgId) return;
    setLoadingCert(true);
    try {
      const supabase = supabaseBrowser();
      const env = await getRentriEnvironment(orgId);
      const { data: cert, error } = await supabase
        .from("rentri_org_certificates").select("num_iscr_sito")
        .eq("org_id", orgId).eq("environment", env).eq("is_active", true).eq("is_default", true)
        .eq("tipo_certificato", "interoperabilita")
        .maybeSingle();
      if (error) throw error;
      if (cert?.num_iscr_sito) {
        setNumIscrSito(cert.num_iscr_sito);
        setForm(prev => ({ ...prev, num_iscr_sito: cert.num_iscr_sito }));
      }
    } catch (err) {
      console.error("Errore caricamento certificato:", err);
    } finally {
      setLoadingCert(false);
    }
  }

  async function loadAutorizzazioni() {
    if (!orgId || !numIscrSito) return;
    setLoadingAutorizzazioni(true);
    try {
      const apiUrl = import.meta.env.VITE_RENTRI_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri';
      const response = await fetch(`${apiUrl}/siti/autorizzazioni?org_id=${orgId}&num_iscr_sito=${encodeURIComponent(numIscrSito)}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.autorizzazioni) && data.autorizzazioni.length > 0) {
          setAutorizzazioni(data.autorizzazioni);
          const prima = data.autorizzazioni[0];
          if (prima.autorizzazione_rif) setForm(prev => ({ ...prev, autorizzazione: prima.autorizzazione_rif }));
        }
      }
    } catch (err) {
      console.error("Errore caricamento autorizzazioni:", err);
    } finally {
      setLoadingAutorizzazioni(false);
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase.from("rentri_registri").select("*").eq("id", id).single();
      if (error) throw error;
      if (data) {
        setForm({
          anno: data.anno, tipo: data.tipo, numero_registro: data.numero_registro || "",
          unita_locale: data.unita_locale || "", autorizzazione: data.autorizzazione || "",
          stato: data.stato, note: data.note || "", num_iscr_sito: data.num_iscr_sito || numIscrSito || "",
          attivita: Array.isArray(data.attivita) ? data.attivita : [],
          descrizione: data.descrizione || "",
          unita_locale_indirizzo: data.unita_locale_indirizzo || "",
          unita_locale_comune: data.unita_locale_comune || "",
          unita_locale_provincia: data.unita_locale_provincia || "",
          unita_locale_cap: data.unita_locale_cap || "",
        });
        if (data.num_iscr_sito) setNumIscrSito(data.num_iscr_sito);
        const isRealRentriId = !!data.rentri_id && !data.rentri_id.startsWith('DEMO-');
        setIsSynced(isRealRentriId);
        setRegistroData(data);
        if (data.id) {
          const { data: mov } = await supabase.from("rentri_movimenti").select("*").eq("registro_id", data.id).order("data_operazione", { ascending: false });
          setMovimenti(mov || []);
        }
      }
    } catch (err) {
      console.error("Errore caricamento registro:", err);
      showToast("error", "Errore caricamento dati registro.");
    } finally {
      setLoading(false);
    }
  }

  function validate() {
    const e = {};
    if (!form.anno || form.anno < 2020 || form.anno > 2100) e.anno = "Anno non valido";
    if (!form.tipo) e.tipo = "Seleziona tipo registro";
    if (!form.attivita || form.attivita.length === 0) e.attivita = "Seleziona almeno un'attività";
    if (!form.descrizione?.trim()) e.descrizione = "Descrizione obbligatoria per RENTRI";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!orgId) { showToast("error", "Seleziona un'organizzazione dal menu in alto."); return; }
    if (!validate()) return;

    setSaving(true);
    try {
      const supabase = supabaseBrowser();
      const payload = {
        org_id: orgId, anno: Number.parseInt(form.anno), tipo: form.tipo,
        numero_registro: form.numero_registro || null, unita_locale: form.unita_locale || null,
        autorizzazione: form.autorizzazione || null, stato: form.stato,
        note: form.note || null, environment: rentriEnv,
        attivita: form.attivita.length > 0 ? form.attivita : null,
        descrizione: form.descrizione || null,
        unita_locale_indirizzo: form.unita_locale_indirizzo || null,
        unita_locale_comune: form.unita_locale_comune || null,
        unita_locale_provincia: form.unita_locale_provincia || null,
        unita_locale_cap: form.unita_locale_cap || null,
      };

      let registroId;
      if (id) {
        const { error } = await supabase.from("rentri_registri").update(payload).eq("id", id);
        if (error) throw error;
        registroId = id;
      } else {
        const { data, error } = await supabase.from("rentri_registri").insert(payload).select("id").single();
        if (error) throw error;
        registroId = data.id;
      }

      // Auto-create on RENTRI for new registri (solo se API configurata)
      if (!id && registroId) {
        const apiUrl = import.meta.env.VITE_RENTRI_API_URL;
        if (apiUrl) {
          try {
            const res = await fetch(`${apiUrl}/registri/create`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ org_id: orgId, registro_id: registroId }),
            });
            if (res.ok) {
              const result = await res.json();
              if (result.success) console.log('[RENTRI] Registro creato su RENTRI:', result.rentri_id);
            }
          } catch (createErr) {
            console.warn('[RENTRI] API non disponibile (non bloccante):', createErr.message);
          }
        }
      }

      navigate("/rifiuti/registri");
    } catch (err) {
      console.error("Errore salvataggio:", err);
      showToast("error", "Errore durante il salvataggio: " + (err.message || "Errore sconosciuto"));
    } finally {
      setSaving(false);
    }
  }

  /* ─── Skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-[#243044] rounded-lg" />
          <div><div className="h-5 w-40 bg-[#243044] rounded mb-1" /><div className="h-3 w-56 bg-[#1a2536] rounded" /></div>
        </div>
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5 space-y-4">
          {[1,2,3,4].map(i => <div key={i} className="h-10 bg-[#141c27] rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-xs font-medium ${
          toast.type === "success" ? "bg-sky-500/8 border-sky-500/15 text-sky-400" :
          toast.type === "error" ? "bg-red-500/10 border-red-500/20 text-red-400" :
          "bg-blue-500/10 border-blue-500/20 text-blue-400"
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === "success" ? <FiCheckCircle className="w-3.5 h-3.5" /> : <FiAlertCircle className="w-3.5 h-3.5" />}
            {toast.msg}
          </div>
          <button onClick={() => setToast(null)} className="p-0.5 hover:opacity-70"><FiX className="w-3 h-3" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <FiFileText className="h-6 w-6 text-blue-400" />
            REGISTRO CRONOLOGICO
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {id
              ? `${registroData?.anno || ""} · ${registroData?.numero_registro || "Modifica registro"}`
              : "Nuovo registro carico/scarico rifiuti"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/rifiuti/registri")} className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1.5">
            <FiArrowLeft className="w-3.5 h-3.5" />Indietro
          </button>
          {id && registroData && (
            <button onClick={() => printRegistroDetail(registroData, movimenti)} className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1.5">
              <FiPrinter className="w-3.5 h-3.5" />Stampa
            </button>
          )}
          {!isSynced && (
            <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5">
              {saving
                ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Salvataggio...</>
                : <><FiSave className="w-3.5 h-3.5" />{id ? "Salva Modifiche" : "Crea Registro"}</>}
            </button>
          )}
        </div>
      </div>

      {/* Synced banner */}
      {isSynced && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <FiAlertTriangle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-blue-300">Registro trasmesso a RENTRI — sola lettura</p>
            <p className="text-[11px] text-blue-400/70 mt-0.5">Un registro già trasmesso non può essere modificato (D.Lgs. 116/2020).</p>
          </div>
        </div>
      )}

      {/* ─── Sezione 1: Dati Principali ─── */}
      <FormSection number="1" title="Dati Registro" color="blue">
        <div className="grid grid-cols-3 gap-3">
          <FInput label="Anno" type="number" value={form.anno}
            onChange={e => setForm({ ...form, anno: e.target.value })}
            readOnly={isSynced} placeholder="2026" min="2020" max="2100"
            error={errors.anno} required />
          <FSelect label="Tipo Registro" value={form.tipo}
            onChange={e => setForm({ ...form, tipo: e.target.value })}
            disabled={isSynced} error={errors.tipo} required>
            <option value="carico">Carico</option>
            <option value="scarico">Scarico</option>
            <option value="carico_scarico">Carico e Scarico</option>
          </FSelect>
          <FInput label="Numero Registro" value={form.numero_registro}
            onChange={e => setForm({ ...form, numero_registro: e.target.value })}
            readOnly={isSynced} placeholder="REG-2026-001" />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <FInput label="Descrizione" value={form.descrizione}
            onChange={e => setForm({ ...form, descrizione: e.target.value })}
            readOnly={isSynced} placeholder="Es: Registro C/S rifiuti autodemolizione"
            error={errors.descrizione} required />
          <FSelect label="Stato" value={form.stato}
            onChange={e => setForm({ ...form, stato: e.target.value })}
            disabled={isSynced}>
            <option value="bozza">Bozza</option>
            <option value="attivo">Attivo</option>
            <option value="vidimato">Vidimato</option>
            <option value="chiuso">Chiuso</option>
          </FSelect>
        </div>
      </FormSection>

      {/* ─── Sezione 2: Attività ─── */}
      <FormSection number="2" title="Attività RENTRI" color="indigo">
        <div className="flex flex-wrap gap-2">
          {["CentroRaccolta", "Produzione", "Recupero", "Smaltimento", "Trasporto", "Intermediazione"].map(att => (
            <label key={att} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
              form.attivita.includes(att)
                ? "bg-blue-500/15 border-blue-500/40 text-blue-300"
                : "bg-gray-900/40 border-gray-700 text-gray-400 hover:border-gray-600"
            } ${isSynced ? "opacity-50 cursor-not-allowed" : ""}`}>
              <input type="checkbox" checked={form.attivita.includes(att)} disabled={isSynced}
                onChange={e => {
                  if (e.target.checked) setForm({ ...form, attivita: [...form.attivita, att] });
                  else setForm({ ...form, attivita: form.attivita.filter(a => a !== att) });
                }}
                className="w-3 h-3 rounded accent-blue-600" />
              {att}
            </label>
          ))}
        </div>
        {errors.attivita && <p className="text-xs text-red-400 mt-2">{errors.attivita}</p>}
      </FormSection>

      {/* ─── Sezione 3: Unità Locale ─── */}
      <FormSection number="3" title="Unità Locale" color="green">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FInput label="Nome / Descrizione" value={form.unita_locale}
              onChange={e => setForm({ ...form, unita_locale: e.target.value })}
              readOnly={isSynced} placeholder="Es: Sede principale" />
            <FInput label="Indirizzo" value={form.unita_locale_indirizzo}
              onChange={e => setForm({ ...form, unita_locale_indirizzo: e.target.value })}
              readOnly={isSynced} placeholder="Via Roma 123" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <FInput label="CAP" value={form.unita_locale_cap}
              onChange={e => setForm({ ...form, unita_locale_cap: e.target.value })}
              readOnly={isSynced} placeholder="20100" maxLength={5} mono />
            <div className="col-span-2">
              <FInput label="Comune" value={form.unita_locale_comune}
                onChange={e => setForm({ ...form, unita_locale_comune: e.target.value })}
                readOnly={isSynced} placeholder="Milano" />
            </div>
            <FInput label="Prov." value={form.unita_locale_provincia}
              onChange={e => setForm({ ...form, unita_locale_provincia: e.target.value.toUpperCase() })}
              readOnly={isSynced} placeholder="MI" maxLength={2} mono />
          </div>
        </div>
      </FormSection>

      {/* ─── Sezione 4: Autorizzazione e Certificato ─── */}
      <FormSection number="4" title="Autorizzazione e Certificato RENTRI" color="amber">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Autorizzazione
              <span className="text-gray-600 normal-case font-normal ml-1">
                {loadingAutorizzazioni ? "— caricamento..." : autorizzazioni.length > 0 ? `— ${autorizzazioni.length} trovata/e` : "— opzionale"}
              </span>
            </p>
            {loadingAutorizzazioni ? (
              <div className={`${inputCls} text-gray-500 flex items-center gap-2`}>
                <div className="w-3.5 h-3.5 border-2 border-gray-700 border-t-blue-400 rounded-full animate-spin" />
                Caricamento da RENTRI...
              </div>
            ) : autorizzazioni.length > 0 ? (
              <select value={form.autorizzazione || ""} onChange={e => setForm({ ...form, autorizzazione: e.target.value })}
                disabled={isSynced} className={`${selectCls} ${isSynced ? inputDisabledCls : ""}`}>
                <option value="">Seleziona autorizzazione...</option>
                {autorizzazioni.map((auth, idx) => (
                  <option key={idx} value={auth.autorizzazione_rif || ""}>
                    {auth.autorizzazione_rif || "N/A"}
                    {auth.tipo_autorizzazione ? ` - ${auth.tipo_autorizzazione}` : ""}
                    {auth.data_scadenza ? ` (scad: ${new Date(auth.data_scadenza).toLocaleDateString("it-IT")})` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <input type="text" value={form.autorizzazione}
                onChange={e => setForm({ ...form, autorizzazione: e.target.value })}
                readOnly={isSynced} className={`${inputCls} ${isSynced ? inputDisabledCls : ""}`}
                placeholder="AUT-2025-001234" />
            )}
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">N. Iscrizione Sito RENTRI</p>
            {loadingCert ? (
              <div className={`${inputCls} text-gray-500 flex items-center gap-2`}>
                <div className="w-3.5 h-3.5 border-2 border-gray-700 border-t-blue-400 rounded-full animate-spin" />
                Caricamento...
              </div>
            ) : numIscrSito ? (
              <input type="text" value={numIscrSito} readOnly className={`${inputCls} font-mono ${inputDisabledCls}`} />
            ) : (
              <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400 flex items-center gap-1.5">
                <FiAlertTriangle className="w-3 h-3 shrink-0" />Certificato RENTRI non configurato.
              </div>
            )}
          </div>
        </div>
      </FormSection>

      {/* ─── Sezione 5: Note ─── */}
      <FormSection number="5" title="Note" color="purple">
        <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={3}
          className={`${inputCls} resize-none`} placeholder="Note aggiuntive sul registro..." />
        <div className="flex items-start gap-2 mt-3 px-3 py-2 bg-blue-500/5 border border-blue-500/10 rounded-lg">
          <FiInfo className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-gray-500">
            Il registro verrà salvato e automaticamente creato su RENTRI (se il certificato è configurato). I movimenti associati saranno tracciati e trasmessi insieme.
          </p>
        </div>
      </FormSection>
    </div>
  );
}

