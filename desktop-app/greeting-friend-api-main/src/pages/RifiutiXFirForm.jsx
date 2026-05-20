// src/pages/RifiutiXFirForm.jsx
/**
 * Form Creazione/Modifica FIR Digitale (xFIR) — stile foglio PDF
 * Flusso: Seleziona blocco → Compila dati → Crea su RENTRI → Firma
 * Design allineato a RifiutiFormularioFormPDF.jsx
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiX, FiSend, FiRefreshCw, FiFileText, FiZap,
  FiPlus, FiTrash2, FiAlertCircle, FiCheckCircle, FiHash, FiInfo
} from "react-icons/fi";
import { useOrg } from "../context/OrgContext";
import { supabaseBrowser } from "../lib/supabase-browser";
import ItalianAddressAutocomplete from "../components/ui/ItalianAddressAutocomplete";
import {
  creaXFir, modificaXFir, fetchXFirDettaglio, fetchBlocchiFir
} from "../lib/rentri-xfir";
import { resolveComune } from "../lib/comuni-api";

/* ─── Componente sezione numerata (come nel PDF) ─── */
const FormSection = ({ number, title, children, className = "", color = "indigo" }) => {
  const colors = {
    indigo: "bg-indigo-600", blue: "bg-blue-600", green: "bg-teal-600",
    amber: "bg-amber-600", red: "bg-red-600", purple: "bg-purple-600", cyan: "bg-cyan-600",
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

export default function RifiutiXFirForm() {
  const navigate = useNavigate();
  const { id: editNumeroFir } = useParams();
  const { orgId } = useOrg();
  const isEdit = !!editNumeroFir;

  const [config, setConfig] = useState(null);
  const [blocchi, setBlocchi] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [step, setStep] = useState(isEdit ? 2 : 1);
  const [errors, setErrors] = useState({});

  const [codiceBlocco, setCodiceBlocco] = useState("");
  const [form, setForm] = useState({
    num_iscr_sito: "",
    rifiuto_provenienza: "S",
    // 1. Produttore
    produttore_cf: "", produttore_nome: "",
    produttore_indirizzo: "", produttore_civico: "", produttore_comune_id: "", produttore_cap: "", produttore_nazione_id: "IT",
    produttore_pec: "", produttore_num_iscr_sito: "", produttore_iscrizione_albo: "",
    produttore_autorizzazione_numero: "", produttore_autorizzazione_tipo: "",
    produttore_detentore: true,
    luogo_prod_indirizzo: "", luogo_prod_civico: "", luogo_prod_comune_id: "", luogo_prod_cap: "",
    // 2. Detentore
    detentore_cf: "", detentore_nome: "",
    detentore_indirizzo: "", detentore_civico: "", detentore_comune_id: "", detentore_cap: "", detentore_nazione_id: "IT",
    // 3. Destinatario
    destinatario_cf: "", destinatario_nome: "",
    destinatario_indirizzo: "", destinatario_civico: "", destinatario_comune_id: "", destinatario_cap: "", destinatario_nazione_id: "IT",
    destinatario_pec: "", destinatario_num_iscr_sito: "", destinatario_iscrizione_albo: "",
    destinatario_autorizzazione: "", destinatario_autorizzazione_tipo: "RecSmalArt208", destinatario_attivita: "R13",
    // 4. Trasportatore
    trasportatore_cf: "", trasportatore_nome: "", trasportatore_nazione_id: "IT",
    trasportatore_pec: "", trasportatore_num_iscr_sito: "", trasportatore_albo: "",
    tipo_trasporto: "Terrestre",
    // 5. Intermediario
    intermediario_cf: "", intermediario_nome: "", intermediario_albo: "",
    // 9. Trasporto + 8. Conducente
    trasportatore_targa: "", trasportatore_rimorchio: "", trasporto_percorso: "",
    conducente_nome: "", conducente_cognome: "",
    data_inizio_trasporto: new Date().toISOString().split("T")[0],
    ora_inizio_trasporto: "08:00",
    // 17. Annotazioni
    annotazioni: "", note: "",
  });

  const [detentoreDiverso, setDetentoreDiverso] = useState(false);

  const [rifiuti, setRifiuti] = useState([{
    codice: "", descrizione: "", quantita: "", unita: "kg",
    stato_fisico: "S", caratteristiche_pericolo: [], caratteristiche_chimico_fisiche: "",
    verificato_in_partenza: false, numero_colli: "", rinfusa: false,
  }]);

  const f = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
  const fCheck = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.checked }));
  const onAddressChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const addRifiuto = () => setRifiuti(prev => [...prev, {
    codice: "", descrizione: "", quantita: "", unita: "kg",
    stato_fisico: "S", caratteristiche_pericolo: [], caratteristiche_chimico_fisiche: "",
    verificato_in_partenza: false, numero_colli: "", rinfusa: false,
  }]);
  const removeRifiuto = (idx) => setRifiuti(prev => prev.filter((_, i) => i !== idx));
  const updateRifiuto = (idx, field, value) => setRifiuti(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));

  // Carica configurazione RENTRI
  useEffect(() => {
    if (!orgId) return;
    const loadConfig = async () => {
      const supabase = supabaseBrowser();
      const { data: cert } = await supabase
        .from("rentri_org_certificates")
        .select("cf_operatore, num_iscr_sito, environment")
        .eq("org_id", orgId).eq("is_default", true).eq("is_active", true)
        .maybeSingle();
      if (cert) {
        setConfig(cert);
        setForm(prev => ({
          ...prev,
          produttore_cf: cert.cf_operatore || "",
          num_iscr_sito: cert.num_iscr_sito || "",
          produttore_num_iscr_sito: cert.num_iscr_sito || "",
        }));
      }
    };
    loadConfig();
  }, [orgId]);

  // Carica blocchi FIR
  useEffect(() => {
    if (!orgId || !config) return;
    fetchBlocchiFir({
      orgId, identificativo: config.cf_operatore,
      numIscrSito: config.num_iscr_sito, environment: config.environment,
    }).then(r => setBlocchi(r.data || []))
      .catch(err => console.error("[XFIR-FORM] Errore blocchi:", err));
  }, [orgId, config]);

  // Carica dati FIR per modifica
  useEffect(() => {
    if (!isEdit || !orgId || !config) return;
    setLoading(true);
    fetchXFirDettaglio({ orgId, numeroFir: editNumeroFir, environment: config.environment })
      .then(result => {
        const d = result.data;
        if (!d) return;
        const prod = d.dati_partenza?.produttore || d.produttore || {};
        const dest = d.dati_partenza?.destinatario || {};
        const trasp = d.dati_partenza?.trasportatori?.[0] || d.trasportatori?.[0] || {};
        const rif = d.dati_partenza?.rifiuto || {};
        const dtp = d.dati_trasporto_partenza || {};
        setForm(prev => ({
          ...prev,
          produttore_cf: prod.codice_fiscale || "", produttore_nome: prod.denominazione || "",
          produttore_indirizzo: prod.indirizzo?.indirizzo || prod.indirizzo || "",
          produttore_civico: prod.indirizzo?.civico || prod.civico || "",
          produttore_comune_id: prod.indirizzo?.citta?.comune_id || prod.comune_id || "",
          destinatario_cf: dest.codice_fiscale || "", destinatario_nome: dest.denominazione || "",
          destinatario_indirizzo: dest.indirizzo?.indirizzo || dest.indirizzo || "",
          destinatario_civico: dest.indirizzo?.civico || dest.civico || "",
          destinatario_comune_id: dest.indirizzo?.citta?.comune_id || dest.comune_id || "",
          destinatario_attivita: dest.attivita || "R13",
          trasportatore_cf: trasp.codice_fiscale || "", trasportatore_nome: trasp.denominazione || "",
          trasportatore_albo: trasp.numero_iscrizione_albo || "",
          conducente_nome: dtp.conducente?.nome || "", conducente_cognome: dtp.conducente?.cognome || "",
          trasportatore_targa: dtp.targa_automezzo || "", trasportatore_rimorchio: dtp.targa_rimorchio || "",
        }));
        if (rif.codice_eer) {
          setRifiuti([{
            codice: rif.codice_eer || "", descrizione: "", quantita: rif.quantita?.valore || d.quantita || "",
            unita: rif.quantita?.unita_misura || d.unita_misura || "kg",
            stato_fisico: rif.stato_fisico || d.stato_fisico || "S",
            caratteristiche_pericolo: rif.caratteristiche_pericolo || [],
            caratteristiche_chimico_fisiche: "", verificato_in_partenza: rif.verificato_in_partenza || false,
            numero_colli: "", rinfusa: false,
          }]);
        }
      })
      .catch(err => setError("Errore caricamento FIR: " + err.message))
      .finally(() => setLoading(false));
  }, [isEdit, editNumeroFir, orgId, config]);

  // Pre-compila dati org
  useEffect(() => {
    if (!orgId || !config) return;
    const supabase = supabaseBrowser();
    supabase.from("orgs").select("name, fiscal_code, vat, address, city").eq("id", orgId).maybeSingle()
      .then(({ data: org }) => {
        if (org) setForm(prev => ({
          ...prev,
          produttore_nome: prev.produttore_nome || org.name || "",
          produttore_indirizzo: prev.produttore_indirizzo || org.address || "",
        }));
      })
      .catch(() => {});
  }, [orgId, config]);

  // Dati test
  function fillTestData() {
    setForm(prev => ({
      ...prev,
      produttore_cf: "SCZMNL05L21D960T", produttore_nome: "Impresa Edile Verdi & C.",
      produttore_indirizzo: "Via Industria", produttore_civico: "78",
      produttore_comune_id: "015146", produttore_cap: "20100", produttore_detentore: true,
      destinatario_cf: "SCZMNL05L21D960T", destinatario_nome: "Discarica Inerti Autorizzata",
      destinatario_indirizzo: "Località Cascina Nuova", destinatario_civico: "1",
      destinatario_comune_id: "015146", destinatario_cap: "20100",
      destinatario_autorizzazione: "VA-2022-00789", destinatario_attivita: "R5",
      trasportatore_cf: "SCZMNL05L21D960T", trasportatore_nome: "Trasporti Edili Express",
      trasportatore_albo: "VA/456789", tipo_trasporto: "Terrestre",
      trasportatore_targa: "CD456EF", trasportatore_rimorchio: "GH789IJ",
      conducente_cognome: "Rossi", conducente_nome: "Marco",
      data_inizio_trasporto: new Date().toISOString().split("T")[0], ora_inizio_trasporto: "08:00",
      rifiuto_provenienza: "S",
    }));
    setRifiuti([{
      codice: "170101", descrizione: "Cemento, mattoni, piastrelle", quantita: "2000", unita: "kg",
      stato_fisico: "SP", caratteristiche_pericolo: [], caratteristiche_chimico_fisiche: "",
      verificato_in_partenza: true, numero_colli: "", rinfusa: true,
    }]);
  }

  // Costruisce payload RENTRI
  const buildPayload = useCallback(() => {
    const luogoInd = form.luogo_prod_indirizzo?.trim()
      ? { indirizzo: form.luogo_prod_indirizzo, civico: form.luogo_prod_civico, citta: { comune_id: form.luogo_prod_comune_id } }
      : { indirizzo: form.produttore_indirizzo, civico: form.produttore_civico, citta: { comune_id: form.produttore_comune_id } };

    const rif = rifiuti[0] || {};
    return {
      num_iscr_sito: form.num_iscr_sito || config?.num_iscr_sito,
      dati_partenza: {
        produttore: {
          codice_fiscale: form.produttore_cf, denominazione: form.produttore_nome,
          indirizzo: { indirizzo: form.produttore_indirizzo, civico: form.produttore_civico, citta: { comune_id: form.produttore_comune_id } },
          luogo_produzione: luogoInd,
        },
        destinatario: {
          codice_fiscale: form.destinatario_cf, denominazione: form.destinatario_nome,
          indirizzo: { indirizzo: form.destinatario_indirizzo, civico: form.destinatario_civico, citta: { comune_id: form.destinatario_comune_id } },
          attivita: form.destinatario_attivita,
          ...(form.destinatario_autorizzazione ? {
            autorizzazione: { numero: form.destinatario_autorizzazione, tipo: form.destinatario_autorizzazione_tipo || "RecSmalArt208" }
          } : {}),
        },
        trasportatori: [{
          codice_fiscale: form.trasportatore_cf, denominazione: form.trasportatore_nome,
          tipo_trasporto: form.tipo_trasporto,
          ...(form.trasportatore_albo ? { numero_iscrizione_albo: form.trasportatore_albo } : {}),
        }],
        rifiuto: {
          codice_eer: rif.codice, provenienza: form.rifiuto_provenienza,
          stato_fisico: rif.stato_fisico, caratteristiche_pericolo: rif.caratteristiche_pericolo || [],
          verificato_in_partenza: rif.verificato_in_partenza || false,
          quantita: { valore: Number(rif.quantita), unita_misura: rif.unita },
        },
      },
      dati_trasporto_partenza: {
        conducente: { nome: form.conducente_nome || "Da Specificare", cognome: form.conducente_cognome || "Da Specificare" },
        targa_automezzo: form.trasportatore_targa || "DA_SPECIFICARE",
        ...(form.trasportatore_rimorchio ? { targa_rimorchio: form.trasportatore_rimorchio } : {}),
        data_ora_inizio_trasporto: new Date(`${form.data_inizio_trasporto}T${form.ora_inizio_trasporto || "08:00"}`).toISOString(),
      },
    };
  }, [form, config, rifiuti]);

  // Validazione
  const validate = useCallback(() => {
    const errs = {};
    if (!codiceBlocco && !isEdit) errs.blocco = "Seleziona un blocco";
    if (!form.produttore_nome) errs.produttore_nome = "Obbligatorio";
    if (!form.produttore_cf) errs.produttore_cf = "Obbligatorio";
    if (!form.destinatario_nome) errs.destinatario_nome = "Obbligatorio";
    if (!form.destinatario_cf) errs.destinatario_cf = "Obbligatorio";
    if (!form.trasportatore_nome) errs.trasportatore_nome = "Obbligatorio";
    const rif = rifiuti[0];
    if (!rif?.codice) errs.r_0_codice = "Obbligatorio";
    if (!rif?.quantita || Number(rif.quantita) <= 0) errs.r_0_quantita = "Obbligatorio";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form, codiceBlocco, isEdit, rifiuti]);

  // Crea/Modifica FIR
  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setSaving(true); setError(null); setSuccess(null);
    try {
      const payload = buildPayload();

      // P1.5: risoluzione comune → ISTAT 6 cifre via comuni-api (fonte di
      // verità). I campi *_comune_id arrivano dal picker come NOME comune;
      // qui li convertiamo in ISTAT e popoliamo il CAP. Nessun fallback: se
      // produttore/destinatario non risolvibili la trasmissione è bloccata
      // (mai FIR con comune indovinato — §2/§8, coerente col VPS no-Milano).
      const isIstat6 = (v) => /^\d{6}$/.test(String(v || "").trim());
      const resolveCitta = async (cittaObj, nome) => {
        if (!cittaObj) return false;
        if (isIstat6(cittaObj.comune_id)) return true;
        const r = nome ? await resolveComune(String(nome)) : null;
        if (!r?.istatComune) return false;
        cittaObj.comune_id = r.istatComune;
        return true;
      };
      const dp = payload.dati_partenza;
      const okProd = await resolveCitta(dp.produttore?.indirizzo?.citta, form.produttore_comune_id);
      await resolveCitta(dp.produttore?.luogo_produzione?.citta, form.luogo_prod_comune_id || form.produttore_comune_id);
      const okDest = await resolveCitta(dp.destinatario?.indirizzo?.citta, form.destinatario_comune_id);
      const nonRisolti = [];
      if (!okProd) nonRisolti.push(`produttore ("${form.produttore_comune_id || "—"}")`);
      if (!okDest) nonRisolti.push(`destinatario ("${form.destinatario_comune_id || "—"}")`);
      if (nonRisolti.length) {
        setError(`Comune ISTAT non risolto per: ${nonRisolti.join(", ")}. Verifica il nome del comune (fonte: comuni-api). Trasmissione bloccata: nessun codice indovinato.`);
        setSaving(false);
        return;
      }

      if (isEdit) {
        const result = await modificaXFir({ orgId, numeroFir: editNumeroFir, datiFir: payload, environment: config.environment });
        setSuccess(`FIR ${editNumeroFir} modificato! Transazione: ${result.transazione_id || "OK"}`);
      } else {
        const result = await creaXFir({ orgId, codiceBlocco, datiFir: payload, environment: config.environment });
        setSuccess(`FIR creato con successo! Transazione: ${result.transazione_id || "OK"}`);
        setStep(3);
      }
    } catch (err) {
      console.error("[XFIR-FORM] Errore:", err);
      setError("Errore: " + (err.details || err.message));
    } finally { setSaving(false); }
  }, [validate, buildPayload, orgId, config, codiceBlocco, isEdit, editNumeroFir]);

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-96">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
    </div>
  );

  /* ═══ RENDER ═══ */
  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <FiFileText className="h-6 w-6 text-indigo-400" />
            {isEdit ? `MODIFICA xFIR ${editNumeroFir}` : "NUOVO FIR DIGITALE (xFIR)"}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isEdit ? "Modifica dati FIR prima della firma" : "Crea un nuovo FIR digitale su RENTRI — il numero viene assegnato automaticamente"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {config && (
            <span className={`text-[10px] px-2 py-1 rounded font-medium ${
              config.environment === "demo" ? "bg-blue-500/10 text-blue-400" : "bg-sky-500/10 text-sky-400"
            }`}>
              {config.environment === "demo" ? "DEMO" : "PRODUZIONE"}
            </span>
          )}
          {!isEdit && (
            <button onClick={fillTestData} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs flex items-center gap-1.5">
              <FiZap className="h-3 w-3" /> Test
            </button>
          )}
        </div>
      </div>

      {/* Messaggi */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2 whitespace-pre-line">
          <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-xs text-sky-400 flex items-start gap-2">
          <FiCheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {success}
        </div>
      )}

      {/* Step 1: Seleziona Blocco */}
      {step === 1 && !isEdit && (
        <FormSection number="★" title="SELEZIONA BLOCCO FIR" color="indigo">
          <p className="text-xs text-gray-500 mb-4">
            Scegli il blocco da cui verrà assegnato il numero FIR. Il numero viene generato automaticamente da RENTRI.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {blocchi.filter(b => !b.disattivo).map(b => (
              <button key={b.codice_blocco}
                onClick={() => { setCodiceBlocco(b.codice_blocco); setStep(2); }}
                className={`p-4 rounded-lg border text-left transition-all ${
                  codiceBlocco === b.codice_blocco
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-gray-700 bg-gray-900/40 hover:border-indigo-500/30"
                }`}
              >
                <span className="text-sm font-mono font-medium text-white block">{b.codice_blocco}</span>
                <span className="text-[10px] text-gray-500 block mt-1">{b.numero_fir_vidimati || 0} FIR vidimati</span>
                {b.num_iscr_sito && <span className="text-[10px] text-gray-600 block">Sito: {b.num_iscr_sito}</span>}
                {b.descrizione && <span className="text-[10px] text-gray-600 block">{b.descrizione}</span>}
              </button>
            ))}
          </div>
          {blocchi.length === 0 && (
            <div className="text-center py-6 text-gray-500 text-xs">
              <FiInfo className="w-6 h-6 mx-auto mb-2 text-gray-600" />
              Nessun blocco attivo. I blocchi si creano dal portale RENTRI.
            </div>
          )}
        </FormSection>
      )}

      {/* Step 2: Form completo stile PDF */}
      {step >= 2 && (
        <>
          {/* Blocco selezionato */}
          {!isEdit && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">BLOCCO FIR</label>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1.5 bg-gray-900 border border-gray-700 rounded text-gray-100 text-sm font-mono flex-1">{codiceBlocco}</span>
                    <button onClick={() => setStep(1)} className="text-[10px] text-blue-400 hover:text-blue-300 whitespace-nowrap">Cambia</button>
                  </div>
                </div>
                <FInput label="N. ISCR. SITO" value={form.num_iscr_sito} onChange={f("num_iscr_sito")} placeholder="OP..." mono />
                <FSelect label="PROVENIENZA" value={form.rifiuto_provenienza} onChange={f("rifiuto_provenienza")} required>
                  <option value="U">Urbano</option>
                  <option value="S">Speciale</option>
                </FSelect>
                <FInput label="DATA EMISSIONE" type="date" value={form.data_inizio_trasporto} onChange={f("data_inizio_trasporto")} />
              </div>
            </div>
          )}

          {/* 1. PRODUTTORE */}
          <FormSection number="1" title="PRODUTTORE" color="blue">
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <FInput label="Denominazione *" value={form.produttore_nome} onChange={f("produttore_nome")} error={errors.produttore_nome} placeholder="Autodemolizioni Rossi Srl" required />
                <FInput label="Codice Fiscale / P.IVA *" value={form.produttore_cf} onChange={(e) => setForm(prev => ({ ...prev, produttore_cf: e.target.value.toUpperCase() }))} error={errors.produttore_cf} placeholder="SCZMNL05L21D960T" required mono uppercase />
              </div>
              <ItalianAddressAutocomplete prefix="produttore" form={form} onChange={onAddressChange} showIndirizzo />
              <div className="grid grid-cols-2 gap-2">
                <FInput label="N. Iscrizione Albo" value={form.produttore_iscrizione_albo} onChange={f("produttore_iscrizione_albo")} placeholder="MI/123456" />
                <FInput label="PEC" value={form.produttore_pec} onChange={f("produttore_pec")} placeholder="azienda@pec.it" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FSelect label="Tipo Autorizzazione" value={form.produttore_autorizzazione_tipo} onChange={f("produttore_autorizzazione_tipo")}>
                  <AutorizzazioneTipoOptions />
                </FSelect>
                <FInput label="N. Autorizzazione" value={form.produttore_autorizzazione_numero} onChange={f("produttore_autorizzazione_numero")} />
              </div>
              {/* Luogo produzione se diverso */}
              <div className="border-t border-gray-700 pt-2 mt-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Luogo di produzione (se diverso dall&apos;indirizzo)</p>
                  <button type="button" onClick={() => setForm(prev => ({ ...prev, luogo_prod_indirizzo: prev.luogo_prod_indirizzo ? "" : " " }))}
                    className="text-[10px] text-blue-400 hover:text-blue-300">
                    {form.luogo_prod_indirizzo?.trim() ? "Rimuovi" : "+ Aggiungi"}
                  </button>
                </div>
                {form.luogo_prod_indirizzo?.trim() !== undefined && form.luogo_prod_indirizzo !== "" && (
                  <ItalianAddressAutocomplete prefix="luogo_prod" form={form} onChange={onAddressChange} showIndirizzo />
                )}
              </div>
            </div>
          </FormSection>

          {/* 2. DETENTORE */}
          <FormSection number="2" title="DETENTORE" color="blue">
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <input type="checkbox" id="xfir_produttore_detentore" checked={form.produttore_detentore}
                  onChange={(e) => { fCheck("produttore_detentore")(e); if (e.target.checked) setDetentoreDiverso(false); }} className="rounded" />
                <label htmlFor="xfir_produttore_detentore" className="text-xs text-gray-300 cursor-pointer">
                  Il <strong>produttore</strong> è anche il <strong>detentore</strong> del rifiuto (caso più comune)
                </label>
              </div>
              {!form.produttore_detentore && (
                <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                  <input type="checkbox" id="xfir_detentore_diverso" checked={detentoreDiverso} onChange={(e) => setDetentoreDiverso(e.target.checked)} className="rounded" />
                  <label htmlFor="xfir_detentore_diverso" className="text-xs text-gray-300 cursor-pointer">
                    Il detentore è un soggetto <strong>diverso</strong> dal produttore
                  </label>
                </div>
              )}
              {!form.produttore_detentore && detentoreDiverso && (
                <div className="space-y-2.5 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <FInput label="Denominazione" value={form.detentore_nome} onChange={f("detentore_nome")} placeholder="Ragione sociale detentore" />
                    <FInput label="Codice Fiscale / P.IVA" value={form.detentore_cf} onChange={(e) => setForm(prev => ({ ...prev, detentore_cf: e.target.value.toUpperCase() }))} mono uppercase placeholder="CF o P.IVA" />
                  </div>
                  <ItalianAddressAutocomplete prefix="detentore" form={form} onChange={onAddressChange} showIndirizzo />
                </div>
              )}
              {form.produttore_detentore && (
                <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                  <p className="text-xs text-blue-300">Il produttore coincide con il detentore — nessun dato aggiuntivo richiesto.</p>
                </div>
              )}
            </div>
          </FormSection>

          {/* 3. DESTINATARIO */}
          <FormSection number="3" title="DESTINATARIO" color="green">
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <FInput label="Denominazione *" value={form.destinatario_nome} onChange={f("destinatario_nome")} error={errors.destinatario_nome} placeholder="Impianto Recupero Srl" required />
                <FInput label="Codice Fiscale / P.IVA *" value={form.destinatario_cf} onChange={(e) => setForm(prev => ({ ...prev, destinatario_cf: e.target.value.toUpperCase() }))} error={errors.destinatario_cf} required mono uppercase />
              </div>
              <ItalianAddressAutocomplete prefix="destinatario" form={form} onChange={onAddressChange} showIndirizzo />
              <div className="grid grid-cols-2 gap-2">
                <FInput label="N. Iscrizione Albo" value={form.destinatario_iscrizione_albo} onChange={f("destinatario_iscrizione_albo")} placeholder="MI/123456" />
                <FInput label="N. Aut./Comunicazione" value={form.destinatario_autorizzazione} onChange={f("destinatario_autorizzazione")} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FSelect label="Tipo Autorizzazione" value={form.destinatario_autorizzazione_tipo} onChange={f("destinatario_autorizzazione_tipo")}>
                  <AutorizzazioneTipoOptions />
                </FSelect>
                <FSelect label="Destinazione (Attività R/D) *" value={form.destinatario_attivita} onChange={f("destinatario_attivita")} required>
                  <AttivitaOptions />
                </FSelect>
              </div>
            </div>
          </FormSection>

          {/* 4. TRASPORTATORE */}
          <FormSection number="4" title="TRASPORTATORE" color="amber">
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <FInput label="Denominazione *" value={form.trasportatore_nome} onChange={f("trasportatore_nome")} error={errors.trasportatore_nome} placeholder="Trasporti Ecologici Srl" required />
                <FInput label="Codice Fiscale" value={form.trasportatore_cf} onChange={(e) => setForm(prev => ({ ...prev, trasportatore_cf: e.target.value.toUpperCase() }))} mono uppercase />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FInput label="N. Iscrizione Albo" value={form.trasportatore_albo} onChange={f("trasportatore_albo")} placeholder="VA/456789" />
                <FSelect label="Tipo Trasporto *" value={form.tipo_trasporto} onChange={f("tipo_trasporto")} required>
                  <option value="Terrestre">Terrestre</option>
                  <option value="Ferroviario">Ferroviario</option>
                  <option value="Marittimo">Marittimo</option>
                </FSelect>
              </div>
            </div>
          </FormSection>

          {/* 5. INTERMEDIARIO */}
          <FormSection number="5" title="INTERMEDIARIO O COMMERCIANTE" color="purple">
            <p className="text-[10px] text-gray-500 mb-2">(Opzionale)</p>
            <div className="space-y-2.5">
              <FInput label="Denominazione" value={form.intermediario_nome} onChange={f("intermediario_nome")} />
              <div className="grid grid-cols-2 gap-2">
                <FInput label="Codice Fiscale" value={form.intermediario_cf} onChange={f("intermediario_cf")} mono uppercase />
                <FInput label="N. Iscrizione Albo" value={form.intermediario_albo} onChange={f("intermediario_albo")} />
              </div>
            </div>
          </FormSection>

          {/* 9. TRASPORTO + 8. CONDUCENTE */}
          <FormSection number="9" title="TRASPORTO" color="amber">
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <FInput label="Targa Automezzo" value={form.trasportatore_targa} onChange={(e) => setForm(prev => ({ ...prev, trasportatore_targa: e.target.value.toUpperCase() }))} placeholder="CD456EF" maxLength={10} mono uppercase />
                <FInput label="Targa Rimorchio" value={form.trasportatore_rimorchio} onChange={(e) => setForm(prev => ({ ...prev, trasportatore_rimorchio: e.target.value.toUpperCase() }))} placeholder="GH789IJ" maxLength={10} mono uppercase />
              </div>
              <FInput label="Percorso (se diverso dal più breve)" value={form.trasporto_percorso} onChange={f("trasporto_percorso")} />
              <div className="border-t border-gray-700 pt-2 mt-1">
                <p className="text-[10px] text-gray-500 font-semibold mb-1.5 flex items-center gap-1">
                  <span className="w-4 h-4 bg-amber-600 text-white rounded flex items-center justify-center text-[9px] font-bold">8</span>
                  COGNOME E NOME CONDUCENTE
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <FInput label="Cognome" value={form.conducente_cognome} onChange={f("conducente_cognome")} placeholder="Rossi" required />
                  <FInput label="Nome" value={form.conducente_nome} onChange={f("conducente_nome")} placeholder="Marco" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FInput label="Data inizio trasporto" type="date" value={form.data_inizio_trasporto} onChange={f("data_inizio_trasporto")} />
                <FInput label="Ora" type="time" value={form.ora_inizio_trasporto} onChange={f("ora_inizio_trasporto")} />
              </div>
            </div>
          </FormSection>

          {/* 6. CARATTERISTICHE DEL RIFIUTO */}
          <FormSection number="6" title="CARATTERISTICHE DEL RIFIUTO" color="red">
            <div className="space-y-3">
              {rifiuti.map((rifiuto, index) => (
                <div key={`rif-${index}`} className="bg-gray-900/40 border border-gray-700 rounded p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-300">Rifiuto #{index + 1}</span>
                    {rifiuti.length > 1 && (
                      <button onClick={() => removeRifiuto(index)} className="text-red-400 hover:text-red-300">
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <FInput label="CODICE EER" value={rifiuto.codice} onChange={(e) => updateRifiuto(index, "codice", e.target.value)} error={errors[`r_${index}_codice`]} placeholder="170101" maxLength={8} mono required />
                    <FSelect label="STATO FISICO" value={rifiuto.stato_fisico} onChange={(e) => updateRifiuto(index, "stato_fisico", e.target.value)} required>
                      <option value="S">Solido</option>
                      <option value="SP">In polvere/pulverulento</option>
                      <option value="FP">Fangoso palabile</option>
                      <option value="L">Liquido</option>
                      <option value="VS">Vischioso sciropposo</option>
                    </FSelect>
                    <FInput label="CARATTERISTICHE DI PERICOLO" value={(rifiuto.caratteristiche_pericolo || []).join(", ")} onChange={(e) => updateRifiuto(index, "caratteristiche_pericolo", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} placeholder="HP14, HP04" className="col-span-2" />
                  </div>
                  <FInput label="Descrizione" value={rifiuto.descrizione} onChange={(e) => updateRifiuto(index, "descrizione", e.target.value)} placeholder="Cemento, mattoni, piastrelle..." />
                  <div className="grid grid-cols-5 gap-2">
                    <FInput label="Quantità" type="number" step="0.001" value={rifiuto.quantita} onChange={(e) => updateRifiuto(index, "quantita", e.target.value)} error={errors[`r_${index}_quantita`]} placeholder="2000" required />
                    <FSelect label="Unità" value={rifiuto.unita} onChange={(e) => updateRifiuto(index, "unita", e.target.value)}>
                      <option value="kg">kg</option>
                      <option value="t">t</option>
                      <option value="m3">m³</option>
                      <option value="l">litri</option>
                    </FSelect>
                    <div className="flex items-end gap-2 pb-0.5">
                      <label className="flex items-center gap-1 text-[10px] text-gray-400">
                        <input type="checkbox" checked={rifiuto.verificato_in_partenza || false} onChange={(e) => updateRifiuto(index, "verificato_in_partenza", e.target.checked)} className="rounded" />
                        Peso verificato
                      </label>
                    </div>
                    <FInput label="Nr. Colli/Contenitori" value={rifiuto.numero_colli} onChange={(e) => updateRifiuto(index, "numero_colli", e.target.value)} />
                    <div className="flex items-end gap-2 pb-0.5">
                      <label className="flex items-center gap-1 text-[10px] text-gray-400">
                        <input type="checkbox" checked={rifiuto.rinfusa || false} onChange={(e) => updateRifiuto(index, "rinfusa", e.target.checked)} className="rounded" />
                        Alla rinfusa
                      </label>
                    </div>
                  </div>
                  <FInput label="CARATTERISTICHE CHIMICO-FISICHE" value={rifiuto.caratteristiche_chimico_fisiche} onChange={(e) => updateRifiuto(index, "caratteristiche_chimico_fisiche", e.target.value)} placeholder="Descrizione caratteristiche chimico-fisiche" />
                </div>
              ))}
              <button onClick={addRifiuto} className="w-full py-2 border-2 border-dashed border-gray-700 rounded text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors flex items-center justify-center gap-2 text-xs">
                <FiPlus className="w-3.5 h-3.5" /> Aggiungi Rifiuto
              </button>
            </div>
          </FormSection>

          {/* 17. ANNOTAZIONI */}
          <FormSection number="17" title="ANNOTAZIONI" color="cyan">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Annotazioni FIR</label>
                <textarea value={form.annotazioni} onChange={f("annotazioni")} rows={3} className="w-full px-2.5 py-1.5 bg-gray-900 border border-gray-700 rounded text-gray-100 text-sm resize-none" placeholder="Annotazioni sul formulario..." />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Note interne</label>
                <textarea value={form.note} onChange={f("note")} rows={3} className="w-full px-2.5 py-1.5 bg-gray-900 border border-gray-700 rounded text-gray-100 text-sm resize-none" placeholder="Note interne (non trasmesse a RENTRI)..." />
              </div>
            </div>
          </FormSection>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            <button onClick={() => navigate("/rifiuti/xfir")} className="px-3 py-1.5 text-gray-400 hover:text-gray-300 flex items-center gap-1.5 text-sm">
              <FiX className="w-4 h-4" /> Annulla
            </button>
            <div className="flex gap-2">
              <button onClick={handleSubmit} disabled={saving}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs flex items-center gap-1.5 disabled:opacity-50">
                {saving ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiSend className="w-3.5 h-3.5" />}
                {saving ? "Invio..." : isEdit ? "Salva Modifiche" : "Crea FIR su RENTRI"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Step 3: Conferma */}
      {step === 3 && success && (
        <FormSection number="✓" title="FIR CREATO CON SUCCESSO" color="green">
          <div className="text-center py-4">
            <FiCheckCircle className="w-12 h-12 text-sky-400 mx-auto mb-3" />
            <p className="text-xs text-gray-400 mb-4">Il FIR è stato creato e vidimato su RENTRI. Ora è visibile nella lista FIR Digitali.</p>
            <div className="bg-blue-500/5 rounded-lg p-3 mb-4 text-left">
              <h4 className="text-[10px] uppercase tracking-wider text-gray-500 mb-2 font-medium">Prossimi Passi</h4>
              <ol className="text-xs text-gray-400 space-y-1.5 list-decimal list-inside">
                <li>Il FIR è ora in stato <strong className="text-blue-400">Firma Produttore + Trasportatore</strong></li>
                <li>Il produttore deve firmare digitalmente (firma XAdES)</li>
                <li>Il trasportatore firma e avvia il trasporto</li>
                <li>Il destinatario accetta e firma all&apos;arrivo</li>
              </ol>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => navigate("/rifiuti/xfir")} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs">
                Vai a FIR Digitali
              </button>
              <button onClick={() => { setStep(1); setSuccess(null); setCodiceBlocco(""); }}
                className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs">
                Crea un altro FIR
              </button>
            </div>
          </div>
        </FormSection>
      )}

      {/* Info */}
      <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg text-[10px] text-gray-500">
        <FiInfo className="w-3 h-3 inline mr-1 text-blue-400" />
        La firma digitale XAdES richiede un certificato di firma qualificato. Per l&apos;ambiente DEMO è possibile utilizzare il portale RENTRI per la firma.
      </div>
    </div>
  );
}
