// src/pages/RifiutiFormularioFormPDF.jsx
/**
 * Form Creazione/Modifica Formulario Identificazione Rifiuti (FIR)
 * Layout che segue il modulo PDF cartaceo con sezioni numerate
 * Campi completi da API spec RENTRI formulari-v1.0
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import { FiSave, FiX, FiFileText, FiPlus, FiTrash2, FiZap, FiUpload, FiClock, FiCheckCircle, FiXCircle, FiPrinter, FiAlertCircle, FiEdit, FiSend } from "react-icons/fi";
import { printFirDetail } from "../lib/services/rentriPrintService";
import AIValidationModal from "../components/rentri/AIValidationModal";
import FirmaFIRDialog from "../components/rentri/FirmaFIRDialog";
import { supabaseBrowser } from "../lib/supabase-browser";
import ItalianAddressAutocomplete from "../components/ui/ItalianAddressAutocomplete";
import { useDemo } from "@/hooks/useDemo";

/* ─── Componente sezione numerata (come nel PDF) ─── */
const FormSection = ({ number, title, children, className = "", color = "indigo" }) => {
  const colors = {
    indigo: "bg-indigo-600",
    blue: "bg-blue-600",
    green: "bg-teal-600",
    amber: "bg-amber-600",
    red: "bg-red-600",
    purple: "bg-purple-600",
    cyan: "bg-cyan-600",
  };
  return (
    <div className={`bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden ${className}`}>
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/60 border-b border-gray-700">
        <div className={`flex-shrink-0 w-7 h-7 ${colors[color] || colors.indigo} text-white rounded flex items-center justify-center font-bold text-xs`}>
          {number}
        </div>
        <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
};

/* ─── Badge stato ─── */
const StatoBadge = ({ stato }) => {
  const config = {
    bozza: { bg: "bg-gray-500/10", text: "text-gray-400", icon: FiClock, label: "Bozza" },
    trasmesso: { bg: "bg-blue-500/10", text: "text-blue-400", icon: FiUpload, label: "Trasmesso" },
    accettato: { bg: "bg-sky-500/10", text: "text-sky-400", icon: FiCheckCircle, label: "Accettato" },
    rifiutato: { bg: "bg-red-500/10", text: "text-red-400", icon: FiXCircle, label: "Rifiutato" },
    annullato: { bg: "bg-gray-500/10", text: "text-gray-500", icon: FiXCircle, label: "Annullato" },
  };
  const c = config[stato] || config.bozza;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${c.bg} ${c.text}`}>
      <Icon className="h-3 w-3" />
      {c.label}
    </span>
  );
};

/* ─── Input helper ─── */
const FInput = ({ label, value, onChange, error, placeholder, className = "", type = "text", required, maxLength, mono, uppercase, disabled, ...rest }) => (
  <div className={className}>
    <label className="block text-xs text-gray-400 mb-1">
      {label}{required && " *"}
    </label>
    <input
      type={type}
      value={value || ""}
      onChange={onChange}
      disabled={disabled}
      className={`w-full px-2.5 py-1.5 bg-gray-900 border ${error ? 'border-red-500' : 'border-gray-700'} rounded text-gray-100 text-sm ${mono ? 'font-mono' : ''} ${uppercase ? 'uppercase' : ''} disabled:opacity-50`}
      placeholder={placeholder}
      maxLength={maxLength}
      {...rest}
    />
    {error && <p className="text-[10px] text-red-400 mt-0.5">{error}</p>}
  </div>
);

const FSelect = ({ label, value, onChange, children, className = "", required, disabled }) => (
  <div className={className}>
    <label className="block text-xs text-gray-400 mb-1">
      {label}{required && " *"}
    </label>
    <select
      value={value || ""}
      onChange={onChange}
      disabled={disabled}
      className="w-full px-2.5 py-1.5 bg-gray-900 border border-gray-700 rounded text-gray-100 text-sm disabled:opacity-50"
    >
      {children}
    </select>
  </div>
);

/* ─── Attività R/D options ─── */
const AttivitaOptions = () => (
  <>
    <optgroup label="Recupero (R)">
      <option value="R1">R1 - Combustibile/energia</option>
      <option value="R2">R2 - Rigenerazione solventi</option>
      <option value="R3">R3 - Riciclo sostanze organiche</option>
      <option value="R4">R4 - Riciclo metalli</option>
      <option value="R5">R5 - Riciclo sostanze inorganiche</option>
      <option value="R6">R6 - Rigenerazione acidi/basi</option>
      <option value="R7">R7 - Recupero captatori inquinanti</option>
      <option value="R8">R8 - Recupero catalizzatori</option>
      <option value="R9">R9 - Rigenerazione oli</option>
      <option value="R10">R10 - Spandimento agricolo</option>
      <option value="R11">R11 - Utilizzo rifiuti da R1-R10</option>
      <option value="R12">R12 - Scambio per R1-R11</option>
      <option value="R13">R13 - Messa in riserva</option>
    </optgroup>
    <optgroup label="Smaltimento (D)">
      <option value="D1">D1 - Deposito su/nel suolo</option>
      <option value="D2">D2 - Trattamento terrestre</option>
      <option value="D3">D3 - Iniezioni profondità</option>
      <option value="D4">D4 - Lagunaggio</option>
      <option value="D5">D5 - Discarica</option>
      <option value="D6">D6 - Scarico ambiente idrico</option>
      <option value="D7">D7 - Immersione</option>
      <option value="D8">D8 - Trattamento biologico</option>
      <option value="D9">D9 - Trattamento fisico-chimico</option>
      <option value="D10">D10 - Incenerimento a terra</option>
      <option value="D11">D11 - Incenerimento in mare</option>
      <option value="D12">D12 - Deposito permanente</option>
      <option value="D13">D13 - Raggruppamento preliminare</option>
      <option value="D14">D14 - Ricondizionamento preliminare</option>
      <option value="D15">D15 - Deposito preliminare</option>
    </optgroup>
  </>
);

/* ─── Autorizzazione tipo options ─── */
const AutorizzazioneTipoOptions = () => (
  <>
    <option value="">-- Seleziona --</option>
    <option value="RecSmalArt208">Recupero/Smaltimento Art. 208</option>
    <option value="AIA">AIA - Autorizzazione Integrata Ambientale</option>
    <option value="AUA">AUA - Autorizzazione Unica Ambientale</option>
    <option value="ComunicazioneInizio">Comunicazione Inizio Attività</option>
    <option value="IscrizioneAlbo">Iscrizione Albo Gestori Ambientali</option>
  </>
);

export default function RifiutiFormularioFormPDF() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orgId } = useOrg();
  const { isDemo } = useDemo();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ─── Form state completo da API spec RENTRI ─── */
  const [form, setForm] = useState({
    // Identificazione
    numero_fir: "",
    anno: new Date().getFullYear(),
    data_creazione: new Date().toISOString().split("T")[0],

    // 1. Produttore (DatiProduttoreFormularioModel)
    produttore_cf: "",
    produttore_nome: "",
    produttore_indirizzo: "",
    produttore_civico: "",
    produttore_comune_id: "",
    produttore_cap: "",
    produttore_nazione_id: "IT",
    produttore_pec: "",
    produttore_num_iscr_sito: "",
    produttore_iscrizione_albo: "",
    produttore_autorizzazione_numero: "",
    produttore_autorizzazione_tipo: "",
    produttore_detentore: false,
    // Luogo produzione (se diverso da indirizzo)
    luogo_prod_indirizzo: "",
    luogo_prod_civico: "",
    luogo_prod_comune_id: "",
    luogo_prod_cap: "",

    // 3. Destinatario (DatiDestinatarioFormularioModel)
    destinatario_cf: "",
    destinatario_nome: "",
    destinatario_indirizzo: "",
    destinatario_civico: "",
    destinatario_comune_id: "",
    destinatario_cap: "",
    destinatario_nazione_id: "IT",
    destinatario_pec: "",
    destinatario_num_iscr_sito: "",
    destinatario_iscrizione_albo: "",
    destinatario_autorizzazione: "",
    destinatario_autorizzazione_tipo: "RecSmalArt208",
    destinatario_attivita: "R13",

    // 4. Trasportatore (DatiTrasportatoreFormularioModel)
    trasportatore_cf: "",
    trasportatore_nome: "",
    trasportatore_nazione_id: "IT",
    trasportatore_pec: "",
    trasportatore_num_iscr_sito: "",
    trasportatore_albo: "",
    tipo_trasporto: "Terrestre",

    // 2. Detentore (se diverso dal produttore)
    detentore_cf: "",
    detentore_nome: "",
    detentore_indirizzo: "",
    detentore_civico: "",
    detentore_comune_id: "",
    detentore_cap: "",
    detentore_nazione_id: "IT",
    detentore_iscrizione_albo: "",

    // 5. Intermediario (opzionale)
    intermediario_cf: "",
    intermediario_nome: "",
    intermediario_albo: "",

    // 9. Trasporto terrestre (DatiTrasportoTerrestreModel)
    trasportatore_targa: "",
    trasportatore_rimorchio: "",
    trasporto_percorso: "",

    // 8. Conducente (ConducenteModel) - REQUIRED
    conducente_nome: "",
    conducente_cognome: "",

    // Date trasporto
    data_inizio_trasporto: "",
    ora_inizio_trasporto: "",

    // 6. Rifiuto (DatiRifiutoModel) - provenienza a livello form
    rifiuto_provenienza: "S",

    // Stato
    stato: "bozza",

    // 17. Annotazioni
    annotazioni: "",
    note: "",

    // Top-level
    num_iscr_sito: "",
  });

  /* ─── Detentore diverso dal produttore ─── */
  const [detentoreDiverso, setDetentoreDiverso] = useState(false);

  /* ─── Helper onChange per ItalianAddressAutocomplete ─── */
  const onAddressChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  /* ─── Rifiuti (DatiRifiutoModel - codici_eer array) ─── */
  const [rifiuti, setRifiuti] = useState([{
    codice: "", descrizione: "", quantita: "", unita: "kg",
    stato_fisico: "S",
    caratteristiche_pericolo: [],
    caratteristiche_chimico_fisiche: "",
    verificato_in_partenza: false,
    trasporto_adr: false,
    adr_numero_onu: "", adr_classe: "", adr_note: "",
    analisi_tipo: "", analisi_numero: "", analisi_data: "",
    numero_colli: "",
    rinfusa: false,
  }]);

  const [errors, setErrors] = useState({});
  const [showAIValidation, setShowAIValidation] = useState(false);
  const [pendingTransmission, setPendingTransmission] = useState(null);
  const [showAnnullaModal, setShowAnnullaModal] = useState(false);
  const [motivoAnnulla, setMotivoAnnulla] = useState('Errore compilazione');

  const isEditable = !form.stato || form.stato === "bozza";

  useEffect(() => {
    if (orgId && id) loadData();
  }, [id, orgId]);

  const f = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
  const fCheck = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.checked }));

  /* ─── Load ─── */
  async function loadData() {
    setLoading(true);
    try {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase.from("rentri_formulari").select("*").eq("id", id).single();
      if (error) throw error;
      if (data) {
        setForm({
          numero_fir: data.numero_fir || "",
          anno: data.anno || new Date().getFullYear(),
          data_creazione: data.data_creazione || new Date().toISOString().split("T")[0],
          produttore_cf: data.produttore_cf || "",
          produttore_nome: data.produttore_nome || "",
          produttore_indirizzo: data.produttore_indirizzo || "",
          produttore_civico: data.produttore_civico || "",
          produttore_comune_id: data.produttore_comune_id || "",
          produttore_cap: data.produttore_cap || "",
          produttore_nazione_id: data.produttore_nazione_id || "IT",
          produttore_pec: data.produttore_pec || "",
          produttore_num_iscr_sito: data.produttore_num_iscr_sito || "",
          produttore_iscrizione_albo: data.produttore_iscrizione_albo || "",
          produttore_autorizzazione_numero: data.produttore_autorizzazione_numero || "",
          produttore_autorizzazione_tipo: data.produttore_autorizzazione_tipo || "",
          produttore_detentore: data.produttore_detentore || false,
          luogo_prod_indirizzo: data.luogo_prod_indirizzo || "",
          luogo_prod_civico: data.luogo_prod_civico || "",
          luogo_prod_comune_id: data.luogo_prod_comune_id || "",
          luogo_prod_cap: data.luogo_prod_cap || "",
          destinatario_cf: data.destinatario_cf || "",
          destinatario_nome: data.destinatario_nome || "",
          destinatario_indirizzo: data.destinatario_indirizzo || "",
          destinatario_civico: data.destinatario_civico || "",
          destinatario_comune_id: data.destinatario_comune_id || "",
          destinatario_cap: data.destinatario_cap || "",
          destinatario_nazione_id: data.destinatario_nazione_id || "IT",
          destinatario_pec: data.destinatario_pec || "",
          destinatario_num_iscr_sito: data.destinatario_num_iscr_sito || "",
          destinatario_iscrizione_albo: data.destinatario_iscrizione_albo || "",
          destinatario_autorizzazione: data.destinatario_autorizzazione || "",
          destinatario_autorizzazione_tipo: data.destinatario_autorizzazione_tipo || "RecSmalArt208",
          destinatario_attivita: data.destinatario_attivita || "R13",
          detentore_cf: data.detentore_cf || "",
          detentore_nome: data.detentore_nome || "",
          detentore_indirizzo: data.detentore_indirizzo || "",
          detentore_civico: data.detentore_civico || "",
          detentore_comune_id: data.detentore_comune_id || "",
          detentore_cap: data.detentore_cap || "",
          detentore_nazione_id: data.detentore_nazione_id || "IT",
          detentore_iscrizione_albo: data.detentore_iscrizione_albo || "",
          trasportatore_cf: data.trasportatore_cf || "",
          trasportatore_nome: data.trasportatore_nome || "",
          trasportatore_nazione_id: data.trasportatore_nazione_id || "IT",
          trasportatore_pec: data.trasportatore_pec || "",
          trasportatore_num_iscr_sito: data.trasportatore_num_iscr_sito || "",
          trasportatore_albo: data.trasportatore_albo || "",
          tipo_trasporto: data.tipo_trasporto || "Terrestre",
          intermediario_cf: data.intermediario_cf || "",
          intermediario_nome: data.intermediario_nome || "",
          intermediario_albo: data.intermediario_albo || "",
          trasportatore_targa: data.trasportatore_targa || "",
          trasportatore_rimorchio: data.trasportatore_rimorchio || "",
          trasporto_percorso: data.trasporto_percorso || "",
          conducente_nome: data.conducente_nome || "",
          conducente_cognome: data.conducente_cognome || "",
          data_inizio_trasporto: data.data_inizio_trasporto?.split("T")[0] || "",
          ora_inizio_trasporto: data.data_inizio_trasporto?.split("T")[1]?.substring(0, 5) || "",
          rifiuto_provenienza: data.rifiuto_provenienza || "S",
          stato: data.stato || "bozza",
          annotazioni: data.annotazioni || "",
          note: data.note || "",
          num_iscr_sito: data.num_iscr_sito || "",
          rentri_numero: data.rentri_numero || "",
          firmato_at: data.firmato_at || null,
        });
        if (data.codici_eer && Array.isArray(data.codici_eer) && data.codici_eer.length > 0) {
          setRifiuti(data.codici_eer.map(r => ({
            codice: r.codice || "", descrizione: r.descrizione || "",
            quantita: r.quantita || "", unita: r.unita || "kg",
            stato_fisico: r.stato_fisico || "S",
            caratteristiche_pericolo: r.caratteristiche_pericolo || [],
            caratteristiche_chimico_fisiche: r.caratteristiche_chimico_fisiche || "",
            verificato_in_partenza: r.verificato_in_partenza || false,
            trasporto_adr: r.trasporto_adr || false,
            adr_numero_onu: r.adr_numero_onu || "", adr_classe: r.adr_classe || "", adr_note: r.adr_note || "",
            analisi_tipo: r.analisi_tipo || "", analisi_numero: r.analisi_numero || "", analisi_data: r.analisi_data || "",
            numero_colli: r.numero_colli || "",
            rinfusa: r.rinfusa || false,
          })));
        }
      }
    } catch (error) {
      console.error("Errore caricamento:", error);
      alert("Errore durante il caricamento del formulario");
    } finally {
      setLoading(false);
    }
  }

  /* ─── Rifiuti helpers ─── */
  function addRifiuto() {
    setRifiuti([...rifiuti, {
      codice: "", descrizione: "", quantita: "", unita: "kg", stato_fisico: "S",
      caratteristiche_pericolo: [], caratteristiche_chimico_fisiche: "",
      verificato_in_partenza: false, trasporto_adr: false,
      adr_numero_onu: "", adr_classe: "", adr_note: "",
      analisi_tipo: "", analisi_numero: "", analisi_data: "",
      numero_colli: "", rinfusa: false,
    }]);
  }
  function removeRifiuto(index) { setRifiuti(rifiuti.filter((_, i) => i !== index)); }
  function updateRifiuto(index, field, value) {
    const u = [...rifiuti]; u[index][field] = value; setRifiuti(u);
  }

  /* ─── Validate ─── */
  function validate() {
    const e = {};
    if (!form.produttore_cf) e.produttore_cf = "CF/P.IVA obbligatorio";
    if (!form.produttore_nome) e.produttore_nome = "Denominazione obbligatoria";
    if (!form.produttore_indirizzo) e.produttore_indirizzo = "Indirizzo obbligatorio";
    if (!form.destinatario_cf) e.destinatario_cf = "CF/P.IVA obbligatorio";
    if (!form.destinatario_nome) e.destinatario_nome = "Denominazione obbligatoria";
    if (!form.destinatario_indirizzo) e.destinatario_indirizzo = "Indirizzo obbligatorio";
    if (!form.trasportatore_nome) e.trasportatore_nome = "Denominazione obbligatoria";
    if (!form.conducente_nome) e.conducente_nome = "Nome obbligatorio";
    if (!form.conducente_cognome) e.conducente_cognome = "Cognome obbligatorio";
    if (!form.rifiuto_provenienza) e.rifiuto_provenienza = "Provenienza obbligatoria";
    rifiuti.forEach((r, i) => {
      if (!r.codice) e[`r_${i}_codice`] = "Codice EER obbligatorio";
      if (!r.quantita || Number.parseFloat(r.quantita) <= 0) e[`r_${i}_quantita`] = "Quantità non valida";
      if (!r.stato_fisico) e[`r_${i}_stato_fisico`] = "Stato fisico obbligatorio";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ─── Save ─── */
  async function handleSave() {
    if (!orgId) { alert("Seleziona un'organizzazione."); return; }
    if (!validate()) { alert("Compila tutti i campi obbligatori marcati con *"); return; }
    setSaving(true);
    try {
      const supabase = supabaseBrowser();
      const payload = {
        org_id: orgId,
        numero_fir: id ? form.numero_fir : `TEST-FIR-${Date.now()}`,
        anno: form.anno,
        data_creazione: id ? form.data_creazione : new Date().toISOString().split("T")[0],
        // Produttore
        produttore_cf: form.produttore_cf,
        produttore_nome: form.produttore_nome,
        produttore_indirizzo: form.produttore_indirizzo || null,
        produttore_civico: form.produttore_civico || null,
        produttore_comune_id: form.produttore_comune_id || null,
        produttore_cap: form.produttore_cap || null,
        produttore_nazione_id: form.produttore_nazione_id || "IT",
        produttore_pec: form.produttore_pec || null,
        produttore_num_iscr_sito: form.produttore_num_iscr_sito || null,
        produttore_iscrizione_albo: form.produttore_iscrizione_albo || null,
        produttore_autorizzazione_numero: form.produttore_autorizzazione_numero || null,
        produttore_autorizzazione_tipo: form.produttore_autorizzazione_tipo || null,
        produttore_detentore: form.produttore_detentore || false,
        luogo_prod_indirizzo: form.luogo_prod_indirizzo || null,
        luogo_prod_civico: form.luogo_prod_civico || null,
        luogo_prod_comune_id: form.luogo_prod_comune_id || null,
        luogo_prod_cap: form.luogo_prod_cap || null,
        // Destinatario
        destinatario_cf: form.destinatario_cf,
        destinatario_nome: form.destinatario_nome,
        destinatario_indirizzo: form.destinatario_indirizzo || null,
        destinatario_civico: form.destinatario_civico || null,
        destinatario_comune_id: form.destinatario_comune_id || null,
        destinatario_cap: form.destinatario_cap || null,
        destinatario_nazione_id: form.destinatario_nazione_id || "IT",
        destinatario_pec: form.destinatario_pec || null,
        destinatario_num_iscr_sito: form.destinatario_num_iscr_sito || null,
        destinatario_iscrizione_albo: form.destinatario_iscrizione_albo || null,
        destinatario_autorizzazione: form.destinatario_autorizzazione || null,
        destinatario_autorizzazione_tipo: form.destinatario_autorizzazione_tipo || null,
        destinatario_attivita: form.destinatario_attivita || null,
        // Detentore (se diverso dal produttore)
        detentore_cf: form.detentore_cf || null,
        detentore_nome: form.detentore_nome || null,
        detentore_indirizzo: form.detentore_indirizzo || null,
        detentore_civico: form.detentore_civico || null,
        detentore_comune_id: form.detentore_comune_id || null,
        detentore_cap: form.detentore_cap || null,
        detentore_nazione_id: form.detentore_nazione_id || "IT",
        detentore_iscrizione_albo: form.detentore_iscrizione_albo || null,
        // Trasportatore
        trasportatore_cf: form.trasportatore_cf || null,
        trasportatore_nome: form.trasportatore_nome,
        trasportatore_nazione_id: form.trasportatore_nazione_id || "IT",
        trasportatore_pec: form.trasportatore_pec || null,
        trasportatore_num_iscr_sito: form.trasportatore_num_iscr_sito || null,
        trasportatore_albo: form.trasportatore_albo || null,
        tipo_trasporto: form.tipo_trasporto || "Terrestre",
        trasportatore_targa: form.trasportatore_targa || null,
        trasportatore_rimorchio: form.trasportatore_rimorchio || null,
        trasporto_percorso: form.trasporto_percorso || null,
        // Conducente
        conducente_nome: form.conducente_nome || null,
        conducente_cognome: form.conducente_cognome || null,
        // Trasporto
        data_inizio_trasporto: form.data_inizio_trasporto ? `${form.data_inizio_trasporto}T${form.ora_inizio_trasporto || "00:00"}:00` : null,
        // Rifiuto
        rifiuto_provenienza: form.rifiuto_provenienza || "S",
        codici_eer: rifiuti,
        // Generale
        stato: form.stato,
        annotazioni: form.annotazioni || null,
        note: form.note || null,
        num_iscr_sito: form.num_iscr_sito || null,
        environment: "demo",
      };
      if (id) {
        const { error } = await supabase.from("rentri_formulari").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("rentri_formulari").insert(payload);
        if (error) throw error;
      }
      navigate("/rifiuti/formulari");
    } catch (error) {
      console.error("Errore salvataggio:", error);
      alert("Errore durante il salvataggio: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  /* ─── Trasmissione RENTRI ─── */
  async function handleTrasmetti() {
    setPendingTransmission({ fir_id: id, datiFormulario: { ...form, rifiuti } });
    setShowAIValidation(true);
  }

  async function proceedWithTransmission() {
    if (!pendingTransmission) return;
    setSaving(true);
    try {
      const apiUrl = import.meta.env.VITE_RENTRI_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri';
      const response = await fetch(`${apiUrl}/fir/trasmetti`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fir_id: pendingTransmission.fir_id, org_id: orgId })
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try { errorData = JSON.parse(errorText); } catch { errorData = { error: errorText }; }
        throw new Error(errorData.error || `Errore ${response.status}`);
      }
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      setForm(prev => ({ ...prev, stato: result.stato_locale || "trasmesso" }));
      const transazioneId = result.transazione_id || result.transazioneId;
      alert(` FIR trasmesso a RENTRI!\nID transazione: ${transazioneId}`);
      if (transazioneId) pollTransazioneStatus(transazioneId, pendingTransmission.fir_id);
    } catch (error) {
      console.error("[FIR] Errore trasmissione:", error);
      alert(` Errore trasmissione:\n\n${error.message}`);
    } finally {
      setSaving(false);
      setPendingTransmission(null);
    }
  }

  function handleAIConfirm() { proceedWithTransmission(); setShowAIValidation(false); }
  function handleAIClose() { setShowAIValidation(false); setPendingTransmission(null); }

  /* ─── Firma Digitale RENTRI ─── */
  const [showFirmaDialog, setShowFirmaDialog] = useState(false);

  function handleFirma() {
    if (form.stato === 'firmato') {
      alert('FIR già firmato il ' + (form.firmato_at ? new Date(form.firmato_at).toLocaleString('it-IT') : 'N/A'));
      return;
    }
    setShowFirmaDialog(true);
  }

  /* ─── Annullamento ─── */
  async function confirmAnnulla() {
    if (!motivoAnnulla.trim()) { alert("Inserire un motivo"); return; }
    setShowAnnullaModal(false);
    setSaving(true);
    try {
      const apiUrl = import.meta.env.VITE_RENTRI_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri';
      const res = await fetch(`${apiUrl}/fir/annulla`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fir_id: id, motivo: motivoAnnulla })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Errore annullamento");
      alert(" FIR annullato");
      navigate("/rifiuti/formulari");
    } catch (error) {
      alert(` Errore: ${error.message}`);
    } finally { setSaving(false); }
  }

  /* ─── Polling transazione ─── */
  async function pollTransazioneStatus(transazioneId, firId) {
    let attempts = 0;
    const maxAttempts = 20;
    const poll = async () => {
      try {
        attempts++;
        const apiUrl = import.meta.env.VITE_RENTRI_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri';
        const statusRes = await fetch(`${apiUrl}/fir/transazione-status?transazione_id=${transazioneId}&org_id=${orgId}`);
        const statusData = await statusRes.json();
        if (statusData.status === 'completato' || statusData.completato) {
          const resultRes = await fetch(`${apiUrl}/fir/transazione-result?transazione_id=${transazioneId}&org_id=${orgId}&fir_id=${firId}`);
          const resultData = await resultRes.json();
          if (resultData.success) {
            const nFir = resultData.result?.esito?.numero_fir || "N/A";
            alert(` Elaborazione completata!\nNumero FIR: ${nFir}`);
            await loadData();
          }
          return;
        }
        if (attempts < maxAttempts) setTimeout(poll, 2000);
        else alert("⏳ Elaborazione in corso... verificare tra qualche minuto.");
      } catch (error) {
        if (attempts < maxAttempts) setTimeout(poll, 2000);
      }
    };
    setTimeout(poll, 2000);
  }

  /* ─── Test data ─── */
  function fillTestData() {
    const today = new Date().toISOString().split("T")[0];
    setForm({
      ...form,
      produttore_cf: "SCZMNL05L21D960T",
      produttore_nome: "Impresa Edile Verdi & C.",
      produttore_indirizzo: "Via Industria 78",
      produttore_civico: "78",
      produttore_comune_id: "RANCIO VALCUVIA",
      produttore_cap: "21030",
      produttore_nazione_id: "IT",
      produttore_num_iscr_sito: "OP6789DEF234567-VA0003",
      produttore_iscrizione_albo: "",
      produttore_detentore: false,
      destinatario_cf: "SCZMNL05L21D960T",
      destinatario_nome: "Discarica Inerti Autorizzata",
      destinatario_indirizzo: "Località Cascina Nuova 1",
      destinatario_civico: "1",
      destinatario_comune_id: "MILANO",
      destinatario_cap: "20100",
      destinatario_nazione_id: "IT",
      destinatario_num_iscr_sito: "OP3456MNO901234-MI0001",
      destinatario_autorizzazione: "VA-2022-00789",
      destinatario_autorizzazione_tipo: "RecSmalArt208",
      destinatario_attivita: "R5",
      destinatario_iscrizione_albo: "",
      trasportatore_cf: "SCZMNL05L21D960T",
      trasportatore_nome: "Trasporti Edili Express",
      trasportatore_albo: "VA/456789",
      tipo_trasporto: "Terrestre",
      trasportatore_targa: "CD456EF",
      trasportatore_rimorchio: "GH789IJ",
      conducente_nome: "Marco",
      conducente_cognome: "Rossi",
      data_inizio_trasporto: today,
      ora_inizio_trasporto: "08:00",
      rifiuto_provenienza: "S",
      note: "FIR di test - Edilizia",
    });
    setRifiuti([
      { codice: "170101", descrizione: "Cemento, mattoni, piastrelle", quantita: "2000", unita: "kg", stato_fisico: "SP", caratteristiche_pericolo: [], caratteristiche_chimico_fisiche: "", verificato_in_partenza: true, trasporto_adr: false, adr_numero_onu: "", adr_classe: "", adr_note: "", analisi_tipo: "", analisi_numero: "", analisi_data: "", numero_colli: "", rinfusa: true },
    ]);
    alert(" Dati test caricati (Edilizia - Cemento)");
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-96">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <FiFileText className="h-6 w-6 text-indigo-400" />
            FORMULARIO RIFIUTI
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {id ? `Modifica FIR ${form.numero_fir}` : "Nuovo Formulario di Identificazione Rifiuti"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {form.stato && <StatoBadge stato={form.stato} />}
          {!id && (
            <button onClick={fillTestData} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs flex items-center gap-1.5">
              <FiZap className="h-3 w-3" /> Test
            </button>
          )}
        </div>
      </div>

      {/* ─── Info Header (come nel PDF: Registro, Data, N. Iscrizione) ─── */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
        <div className="grid grid-cols-4 gap-3">
          <FInput label="REGISTRO N." value={form.numero_fir} onChange={f("numero_fir")} placeholder="Auto-generato" disabled={!!id} />
          <FInput label="DATA EMISSIONE" type="date" value={form.data_creazione} onChange={f("data_creazione")} disabled={!isEditable} />
          <FInput label="N. ISCR. SITO" value={form.num_iscr_sito || form.produttore_num_iscr_sito} onChange={f("num_iscr_sito")} placeholder="OP..." mono disabled={!isEditable} />
          <FSelect label="PROVENIENZA" value={form.rifiuto_provenienza} onChange={f("rifiuto_provenienza")} required disabled={!isEditable}>
            <option value="U">Urbano</option>
            <option value="S">Speciale</option>
          </FSelect>
        </div>
      </div>

      {/* ═══ PRIMA SEZIONE: Produttore + Detentore ═══ */}
      <div className="space-y-4">

        {/* 1. PRODUTTORE */}
        <FormSection number="1" title="PRODUTTORE" color="blue">
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <FInput label="Denominazione *" value={form.produttore_nome} onChange={f("produttore_nome")} error={errors.produttore_nome} placeholder="Autodemolizioni Rossi Srl" required disabled={!isEditable} />
              <FInput label="Codice Fiscale / P.IVA *" value={form.produttore_cf} onChange={(e) => setForm(prev => ({ ...prev, produttore_cf: e.target.value.toUpperCase() }))} error={errors.produttore_cf} placeholder="SCZMNL05L21D960T" required mono uppercase disabled={!isEditable} />
            </div>

            {/* Autocomplete indirizzo produttore */}
            <ItalianAddressAutocomplete
              prefix="produttore"
              form={form}
              onChange={onAddressChange}
              disabled={!isEditable}
              showIndirizzo
            />

            <div className="grid grid-cols-2 gap-2">
              <FInput label="N. Iscrizione Albo" value={form.produttore_iscrizione_albo} onChange={f("produttore_iscrizione_albo")} placeholder="MI/123456" disabled={!isEditable} />
              <FInput label="PEC" value={form.produttore_pec} onChange={f("produttore_pec")} placeholder="azienda@pec.it" disabled={!isEditable} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FSelect label="Tipo Autorizzazione" value={form.produttore_autorizzazione_tipo} onChange={f("produttore_autorizzazione_tipo")} disabled={!isEditable}>
                <AutorizzazioneTipoOptions />
              </FSelect>
              <FInput label="N. Autorizzazione" value={form.produttore_autorizzazione_numero} onChange={f("produttore_autorizzazione_numero")} disabled={!isEditable} />
            </div>

            {/* Luogo produzione se diverso */}
            <div className="border-t border-gray-700 pt-2 mt-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Luogo di produzione (se diverso dall&apos;indirizzo)</p>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, luogo_prod_indirizzo: prev.luogo_prod_indirizzo ? "" : " " }))}
                  disabled={!isEditable}
                  className="text-[10px] text-blue-400 hover:text-blue-300 disabled:opacity-50"
                >
                  {form.luogo_prod_indirizzo?.trim() ? "Rimuovi" : "+ Aggiungi"}
                </button>
              </div>
              {form.luogo_prod_indirizzo?.trim() !== undefined && form.luogo_prod_indirizzo !== "" && (
                <ItalianAddressAutocomplete
                  prefix="luogo_prod"
                  form={form}
                  onChange={onAddressChange}
                  disabled={!isEditable}
                  showIndirizzo
                />
              )}
            </div>
          </div>
        </FormSection>

        {/* 2. DETENTORE */}
        <FormSection number="2" title="DETENTORE" color="blue">
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
              <input
                type="checkbox"
                id="produttore_detentore"
                checked={form.produttore_detentore}
                onChange={(e) => {
                  fCheck("produttore_detentore")(e);
                  if (e.target.checked) setDetentoreDiverso(false);
                }}
                className="rounded"
                disabled={!isEditable}
              />
              <label htmlFor="produttore_detentore" className="text-xs text-gray-300 cursor-pointer">
                Il <strong>produttore</strong> è anche il <strong>detentore</strong> del rifiuto (caso più comune)
              </label>
            </div>

            {!form.produttore_detentore && (
              <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <input
                  type="checkbox"
                  id="detentore_diverso"
                  checked={detentoreDiverso}
                  onChange={(e) => setDetentoreDiverso(e.target.checked)}
                  className="rounded"
                  disabled={!isEditable}
                />
                <label htmlFor="detentore_diverso" className="text-xs text-gray-300 cursor-pointer">
                  Il detentore è un soggetto <strong>diverso</strong> dal produttore (compila i campi sotto)
                </label>
              </div>
            )}

            {!form.produttore_detentore && detentoreDiverso && (
              <div className="space-y-2.5 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <FInput label="Denominazione" value={form.detentore_nome} onChange={f("detentore_nome")} placeholder="Ragione sociale detentore" disabled={!isEditable} />
                  <FInput label="Codice Fiscale / P.IVA" value={form.detentore_cf} onChange={(e) => setForm(prev => ({ ...prev, detentore_cf: e.target.value.toUpperCase() }))} mono uppercase placeholder="CF o P.IVA" disabled={!isEditable} />
                </div>
                <ItalianAddressAutocomplete
                  prefix="detentore"
                  form={form}
                  onChange={onAddressChange}
                  disabled={!isEditable}
                  showIndirizzo
                />
                <FInput label="N. Iscrizione Albo" value={form.detentore_iscrizione_albo} onChange={f("detentore_iscrizione_albo")} placeholder="MI/123456" disabled={!isEditable} />
              </div>
            )}

            {form.produttore_detentore && (
              <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-blue-300">
                   Il produttore coincide con il detentore — nessun dato aggiuntivo richiesto per questa sezione.
                </p>
              </div>
            )}
          </div>
        </FormSection>
      </div>

      {/* ═══ SECONDA SEZIONE: Destinatario + Trasportatore ═══ */}
      <div className="space-y-4">

        {/* 3. DESTINATARIO */}
        <FormSection number="3" title="DESTINATARIO" color="green">
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <FInput label="Denominazione *" value={form.destinatario_nome} onChange={f("destinatario_nome")} error={errors.destinatario_nome} placeholder="Impianto Recupero Srl" required disabled={!isEditable} />
              <FInput label="Codice Fiscale / P.IVA *" value={form.destinatario_cf} onChange={(e) => setForm(prev => ({ ...prev, destinatario_cf: e.target.value.toUpperCase() }))} error={errors.destinatario_cf} required mono uppercase disabled={!isEditable} />
            </div>
            <ItalianAddressAutocomplete
              prefix="destinatario"
              form={form}
              onChange={onAddressChange}
              disabled={!isEditable}
              showIndirizzo
            />
            <div className="grid grid-cols-2 gap-2">
              <FInput label="N. Iscrizione Albo" value={form.destinatario_iscrizione_albo} onChange={f("destinatario_iscrizione_albo")} placeholder="MI/123456" disabled={!isEditable} />
              <FInput label="N. Aut./Comunicazione" value={form.destinatario_autorizzazione} onChange={f("destinatario_autorizzazione")} disabled={!isEditable} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FSelect label="Tipo Autorizzazione" value={form.destinatario_autorizzazione_tipo} onChange={f("destinatario_autorizzazione_tipo")} disabled={!isEditable}>
                <AutorizzazioneTipoOptions />
              </FSelect>
              <FSelect label="Destinazione (Attività R/D) *" value={form.destinatario_attivita} onChange={f("destinatario_attivita")} required disabled={!isEditable}>
                <AttivitaOptions />
              </FSelect>
            </div>
          </div>
        </FormSection>

        {/* 4. TRASPORTATORE */}
        <FormSection number="4" title="TRASPORTATORE" color="amber">
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <FInput label="Denominazione *" value={form.trasportatore_nome} onChange={f("trasportatore_nome")} error={errors.trasportatore_nome} placeholder="Trasporti Ecologici Srl" required disabled={!isEditable} />
              <FInput label="Codice Fiscale" value={form.trasportatore_cf} onChange={(e) => setForm(prev => ({ ...prev, trasportatore_cf: e.target.value.toUpperCase() }))} mono uppercase disabled={!isEditable} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FInput label="N. Iscrizione Albo" value={form.trasportatore_albo} onChange={f("trasportatore_albo")} placeholder="VA/456789" disabled={!isEditable} />
              <FSelect label="Tipo Trasporto *" value={form.tipo_trasporto} onChange={f("tipo_trasporto")} required disabled={!isEditable}>
                <option value="Terrestre">Terrestre</option>
                <option value="Ferroviario">Ferroviario</option>
                <option value="Marittimo">Marittimo</option>
              </FSelect>
            </div>
          </div>
        </FormSection>
      </div>

      {/* ═══ TERZA SEZIONE: Intermediario + Rifiuto ═══ */}
      <div className="space-y-4">

        {/* 5. INTERMEDIARIO (opzionale) */}
        <FormSection number="5" title="INTERMEDIARIO O COMMERCIANTE" color="purple">
          <p className="text-[10px] text-gray-500 mb-2">(Opzionale)</p>
          <div className="space-y-2.5">
            <FInput label="Denominazione" value={form.intermediario_nome} onChange={f("intermediario_nome")} disabled={!isEditable} />
            <div className="grid grid-cols-2 gap-2">
              <FInput label="Codice Fiscale" value={form.intermediario_cf} onChange={f("intermediario_cf")} mono uppercase disabled={!isEditable} />
              <FInput label="N. Iscrizione Albo" value={form.intermediario_albo} onChange={f("intermediario_albo")} disabled={!isEditable} />
            </div>
          </div>
        </FormSection>

        {/* 9. TRASPORTO + 8. CONDUCENTE */}
        <FormSection number="9" title="TRASPORTO" color="amber">
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <FInput label="Targa Automezzo" value={form.trasportatore_targa} onChange={(e) => setForm(prev => ({ ...prev, trasportatore_targa: e.target.value.toUpperCase() }))} placeholder="CD456EF" maxLength={10} mono uppercase disabled={!isEditable} />
              <FInput label="Targa Rimorchio" value={form.trasportatore_rimorchio} onChange={(e) => setForm(prev => ({ ...prev, trasportatore_rimorchio: e.target.value.toUpperCase() }))} placeholder="GH789IJ" maxLength={10} mono uppercase disabled={!isEditable} />
            </div>
            <FInput label="Percorso (se diverso dal più breve)" value={form.trasporto_percorso} onChange={f("trasporto_percorso")} disabled={!isEditable} />

            {/* 8. Conducente */}
            <div className="border-t border-gray-700 pt-2 mt-1">
              <p className="text-[10px] text-gray-500 font-semibold mb-1.5 flex items-center gap-1">
                <span className="w-4 h-4 bg-amber-600 text-white rounded flex items-center justify-center text-[9px] font-bold">8</span>
                COGNOME E NOME CONDUCENTE
              </p>
              <div className="grid grid-cols-2 gap-2">
                <FInput label="Cognome" value={form.conducente_cognome} onChange={f("conducente_cognome")} error={errors.conducente_cognome} placeholder="Rossi" required disabled={!isEditable} />
                <FInput label="Nome" value={form.conducente_nome} onChange={f("conducente_nome")} error={errors.conducente_nome} placeholder="Marco" required disabled={!isEditable} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <FInput label="Data inizio trasporto" type="date" value={form.data_inizio_trasporto} onChange={f("data_inizio_trasporto")} disabled={!isEditable} />
              <FInput label="Ora" type="time" value={form.ora_inizio_trasporto} onChange={f("ora_inizio_trasporto")} disabled={!isEditable} />
            </div>
          </div>
        </FormSection>
      </div>

      {/* ═══ QUARTA SEZIONE: Caratteristiche Rifiuto (tutta larghezza) ═══ */}
      <FormSection number="6" title="CARATTERISTICHE DEL RIFIUTO" color="red">
        <div className="space-y-3">
          {rifiuti.map((rifiuto, index) => (
            <div key={`rif-${index}`} className="bg-gray-900/40 border border-gray-700 rounded p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-300">Rifiuto #{index + 1}</span>
                {rifiuti.length > 1 && (
                  <button onClick={() => removeRifiuto(index)} className="text-red-400 hover:text-red-300" disabled={!isEditable}>
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Riga 1: Codice EER, Stato Fisico, Provenienza */}
              <div className="grid grid-cols-4 gap-2">
                <FInput label="CODICE EER" value={rifiuto.codice} onChange={(e) => updateRifiuto(index, "codice", e.target.value)} error={errors[`r_${index}_codice`]} placeholder="170101" maxLength={8} mono required disabled={!isEditable} />
                <FSelect label="STATO FISICO" value={rifiuto.stato_fisico} onChange={(e) => updateRifiuto(index, "stato_fisico", e.target.value)} required disabled={!isEditable}>
                  <option value="S">Solido</option>
                  <option value="SP">In polvere/pulverulento</option>
                  <option value="FP">Fangoso palabile</option>
                  <option value="L">Liquido</option>
                  <option value="VS">Vischioso sciropposo</option>
                </FSelect>
                <FInput label="CARATTERISTICHE DI PERICOLO" value={(rifiuto.caratteristiche_pericolo || []).join(", ")} onChange={(e) => updateRifiuto(index, "caratteristiche_pericolo", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} placeholder="HP14, HP04" className="col-span-2" disabled={!isEditable} />
              </div>

              {/* Riga 2: Descrizione */}
              <FInput label="Descrizione" value={rifiuto.descrizione} onChange={(e) => updateRifiuto(index, "descrizione", e.target.value)} placeholder="Cemento, mattoni, piastrelle..." disabled={!isEditable} />

              {/* Riga 3: Quantità, Unità, Verificato, Colli */}
              <div className="grid grid-cols-5 gap-2">
                <FInput label="Quantità" type="number" step="0.001" value={rifiuto.quantita} onChange={(e) => updateRifiuto(index, "quantita", e.target.value)} error={errors[`r_${index}_quantita`]} placeholder="2000" required disabled={!isEditable} />
                <FSelect label="Unità" value={rifiuto.unita} onChange={(e) => updateRifiuto(index, "unita", e.target.value)} disabled={!isEditable}>
                  <option value="kg">kg</option>
                  <option value="t">t</option>
                  <option value="m3">m³</option>
                  <option value="l">litri</option>
                </FSelect>
                <div className="flex items-end gap-2 pb-0.5">
                  <label className="flex items-center gap-1 text-[10px] text-gray-400">
                    <input type="checkbox" checked={rifiuto.verificato_in_partenza || false} onChange={(e) => updateRifiuto(index, "verificato_in_partenza", e.target.checked)} className="rounded" disabled={!isEditable} />
                    Peso verificato
                  </label>
                </div>
                <FInput label="Nr. Colli/Contenitori" value={rifiuto.numero_colli} onChange={(e) => updateRifiuto(index, "numero_colli", e.target.value)} placeholder="" disabled={!isEditable} />
                <div className="flex items-end gap-2 pb-0.5">
                  <label className="flex items-center gap-1 text-[10px] text-gray-400">
                    <input type="checkbox" checked={rifiuto.rinfusa || false} onChange={(e) => updateRifiuto(index, "rinfusa", e.target.checked)} className="rounded" disabled={!isEditable} />
                    Alla rinfusa
                  </label>
                </div>
              </div>

              {/* Riga 4: Caratteristiche chimico-fisiche */}
              <FInput label="CARATTERISTICHE CHIMICO-FISICHE" value={rifiuto.caratteristiche_chimico_fisiche} onChange={(e) => updateRifiuto(index, "caratteristiche_chimico_fisiche", e.target.value)} placeholder="Descrizione caratteristiche chimico-fisiche" disabled={!isEditable} />

              {/* Riga 5: ADR + Analisi */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs text-gray-400">
                    <input type="checkbox" checked={rifiuto.trasporto_adr || false} onChange={(e) => updateRifiuto(index, "trasporto_adr", e.target.checked)} className="rounded" disabled={!isEditable} />
                    Trasporto ADR / RID
                  </label>
                  {rifiuto.trasporto_adr && (
                    <div className="grid grid-cols-2 gap-2 pl-4">
                      <FInput label="Classe pericolo" value={rifiuto.adr_classe} onChange={(e) => updateRifiuto(index, "adr_classe", e.target.value)} disabled={!isEditable} />
                      <FInput label="Nr. ONU" value={rifiuto.adr_numero_onu} onChange={(e) => updateRifiuto(index, "adr_numero_onu", e.target.value)} disabled={!isEditable} />
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-gray-400">Analisi/rapporto di prova</p>
                  <div className="grid grid-cols-3 gap-2">
                    <FInput label="Tipo" value={rifiuto.analisi_tipo} onChange={(e) => updateRifiuto(index, "analisi_tipo", e.target.value)} placeholder="Classificazione" disabled={!isEditable} />
                    <FInput label="Nr. documento" value={rifiuto.analisi_numero} onChange={(e) => updateRifiuto(index, "analisi_numero", e.target.value)} disabled={!isEditable} />
                    <FInput label="Valida al" type="date" value={rifiuto.analisi_data} onChange={(e) => updateRifiuto(index, "analisi_data", e.target.value)} disabled={!isEditable} />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button onClick={addRifiuto} disabled={!isEditable} className="w-full py-2 border-2 border-dashed border-gray-700 rounded text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors flex items-center justify-center gap-2 text-xs disabled:opacity-50">
            <FiPlus className="w-3.5 h-3.5" /> Aggiungi Rifiuto
          </button>
        </div>
      </FormSection>

      {/* ═══ QUINTA SEZIONE: Annotazioni ═══ */}
      <FormSection number="17" title="ANNOTAZIONI" color="cyan">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Annotazioni FIR</label>
            <textarea value={form.annotazioni} onChange={f("annotazioni")} rows={3} className="w-full px-2.5 py-1.5 bg-gray-900 border border-gray-700 rounded text-gray-100 text-sm resize-none" placeholder="Annotazioni sul formulario..." disabled={!isEditable} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Note interne</label>
            <textarea value={form.note} onChange={f("note")} rows={3} className="w-full px-2.5 py-1.5 bg-gray-900 border border-gray-700 rounded text-gray-100 text-sm resize-none" placeholder="Note interne (non trasmesse a RENTRI)..." disabled={!isEditable} />
          </div>
        </div>
      </FormSection>

      {/* ═══ Footer Actions ═══ */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <button onClick={() => navigate("/rifiuti/formulari")} className="px-3 py-1.5 text-gray-400 hover:text-gray-300 flex items-center gap-1.5 text-sm">
          <FiX className="w-4 h-4" /> Annulla
        </button>

        <div className="flex gap-2">
          {id && (form.stato === 'trasmesso' || form.stato === 'accettato' || form.stato === 'in_lavorazione') && (
            <button onClick={handleFirma} disabled={saving} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs flex items-center gap-1.5 disabled:opacity-50">
              <FiEdit className="w-3.5 h-3.5" /> Firma
            </button>
          )}
          {id && form.stato !== "annullato" && form.stato !== "bozza" && (
            <button onClick={() => setShowAnnullaModal(true)} disabled={saving} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs flex items-center gap-1.5 disabled:opacity-50">
              <FiXCircle className="w-3.5 h-3.5" /> Annulla FIR
            </button>
          )}
          {id && form.stato === "bozza" && (
            <button onClick={handleTrasmetti} disabled={saving} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs flex items-center gap-1.5 disabled:opacity-50">
              <FiSend className="w-3.5 h-3.5" /> Trasmetti a RENTRI
            </button>
          )}
          {id && (
            <button onClick={() => printFirDetail({ ...form, codici_eer: rifiuti })} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs flex items-center gap-1.5">
              <FiPrinter className="w-3.5 h-3.5" /> Stampa
            </button>
          )}
          {isEditable && (
            <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs flex items-center gap-1.5 disabled:opacity-50">
              <FiSave className="w-3.5 h-3.5" /> {saving ? "Salvataggio..." : "Salva Formulario"}
            </button>
          )}
        </div>
      </div>

      {/* Modal Annullamento */}
      {showAnnullaModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 w-96 space-y-4">
            <h3 className="text-sm font-bold text-red-400 flex items-center gap-2"><FiXCircle /> Annulla FIR</h3>
            <p className="text-xs text-gray-400">Inserisci il motivo dell'annullamento:</p>
            <input
              type="text" value={motivoAnnulla}
              onChange={(e) => setMotivoAnnulla(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm text-gray-200 focus:border-red-500 focus:outline-none"
              placeholder="Es: Errore compilazione"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAnnullaModal(false)} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs">Annulla</button>
              <button onClick={confirmAnnulla} disabled={saving} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs disabled:opacity-50">Conferma Annullamento</button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Firma FIR */}
      {showFirmaDialog && (
        <FirmaFIRDialog
          firId={id}
          firNumero={form.rentri_numero}
          onClose={() => setShowFirmaDialog(false)}
          onSuccess={() => { setShowFirmaDialog(false); loadData(); }}
        />
      )}

      {/* AI Validation Modal */}
      <AIValidationModal
        isOpen={showAIValidation}
        onClose={handleAIClose}
        onConfirm={handleAIConfirm}
        tipoEntita="formulario"
        entitaId={id || null}
        orgId={orgId}
        datiEntita={{ ...form, rifiuti }}
      />
    </div>
  );
}
