// src/pages/RifiutiMovimentoForm.jsx
/**
 * Form Creazione/Modifica Movimento Rifiuti
 * Organizzato in sezioni secondo spec RENTRI
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import { FiSave, FiTrendingUp, FiTrendingDown, FiAlertCircle, FiZap, FiTruck, FiArrowLeft, FiEye, FiSend, FiCheckCircle, FiX, FiRefreshCw, FiSearch } from "react-icons/fi";
import { supabaseBrowser } from "../lib/supabase-browser";
import { getRentriEnvironment } from "../lib/rentri-api";
import { useDemo } from "@/hooks/useDemo";
import ClientSearchModal from "../components/ClientSearchModal";

/* ─── Helpers fuori dal componente (evita scroll jump) ─── */
const SECTION_COLORS = {
  blue:   { bar: "bg-blue-600",   header: "bg-blue-900/20 border-blue-800/40" },
  green:  { bar: "bg-teal-600",   header: "bg-teal-900/20 border-teal-800/40" },
  amber:  { bar: "bg-amber-600",  header: "bg-amber-900/20 border-amber-800/40" },
  purple: { bar: "bg-purple-600", header: "bg-purple-900/20 border-purple-800/40" },
  indigo: { bar: "bg-indigo-600", header: "bg-indigo-900/20 border-indigo-800/40" },
  teal:   { bar: "bg-teal-600",   header: "bg-teal-900/20 border-teal-800/40" },
  rose:   { bar: "bg-rose-600",   header: "bg-rose-900/20 border-rose-800/40" },
  slate:  { bar: "bg-slate-600",  header: "bg-slate-900/20 border-slate-700/40" },
};

function FormSection({ number, title, children, color = "blue" }) {
  const c = SECTION_COLORS[color] || SECTION_COLORS.blue;
  return (
    <div className="bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden">
      <div className={`flex items-center gap-3 px-4 py-3 border-b border-gray-700 ${c.header}`}>
        <div className={`flex-shrink-0 w-7 h-7 ${c.bar} text-white rounded flex items-center justify-center font-bold text-xs`}>{number}</div>
        <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

function FormRow({ children, cols = 1 }) {
  return (
    <div className={`grid grid-cols-1 ${cols === 2 ? 'md:grid-cols-2' : cols === 3 ? 'md:grid-cols-3' : ''} gap-4`}>
      {children}
    </div>
  );
}

function InputField({ label, required, error, help, children }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      {help && <p className="text-xs text-slate-500 mt-1">{help}</p>}
    </div>
  );
}

export default function RifiutiMovimentoForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { orgId } = useOrg();
  const { isDemo } = useDemo();
  const [rentriEnv, setRentriEnv] = useState('demo');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [registri, setRegistri] = useState([]);
  const [demolizioni, setDemolizioni] = useState([]);
  const [selectedDemolizione, setSelectedDemolizione] = useState(null);
  const [isSynced, setIsSynced] = useState(false); // Se sincronizzato con RENTRI
  const [syncStatus, setSyncStatus] = useState(null); // pending/trasmesso/synced/error
  const [trasmitting, setTrasmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [clientSearchTarget, setClientSearchTarget] = useState(null); // 'produttore'|'trasportatore'|'destinatario'|'intermediario'

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 6000);
  }

  function handleClientSelected(client) {
    const target = clientSearchTarget;
    if (!target) return;
    const denominazione = client.nome || '';
    const cf = client.piva || client.tax_code || '';
    const indirizzo = client.indirizzo || client.address || '';
    const updates = {};
    if (target === 'produttore') {
      updates.produttore_denominazione = denominazione;
      updates.produttore_codice_fiscale = cf;
      updates.produttore_indirizzo = indirizzo;
    } else if (target === 'trasportatore') {
      updates.trasportatore_denominazione = denominazione;
      updates.trasportatore_codice_fiscale = cf;
    } else if (target === 'destinatario') {
      updates.destinatario_denominazione = denominazione;
      updates.destinatario_codice_fiscale = cf;
    } else if (target === 'intermediario') {
      updates.intermediario_denominazione = denominazione;
      updates.intermediario_codice_fiscale = cf;
    }
    setForm(prev => ({ ...prev, ...updates }));
    setClientSearchTarget(null);
    showToast('success', `Dati ${target} compilati da anagrafica cliente`);
  }
  
  // Codici EER comuni per autodemolitori
  const CODICI_EER_AUTODEMOLITORI = [
    { codice: "160104", descrizione: "Veicoli fuori uso", categoria: "VFU" },
    { codice: "170101", descrizione: "Cemento, mattoni, piastrelle e ceramiche", categoria: "Inerti" },
    { codice: "170405", descrizione: "Ferro e acciaio", categoria: "Metalli" },
    { codice: "170406", descrizione: "Alluminio", categoria: "Metalli" },
    { codice: "170407", descrizione: "Rame", categoria: "Metalli" },
    { codice: "170410", descrizione: "Metalli non ferrosi misti", categoria: "Metalli" },
    { codice: "130205", descrizione: "Oli minerali per motori non clorurati", categoria: "Oli" },
    { codice: "160601", descrizione: "Batterie al piombo", categoria: "Batterie" },
    { codice: "160602", descrizione: "Batterie al nichel-cadmio", categoria: "Batterie" },
    { codice: "160603", descrizione: "Batterie al litio", categoria: "Batterie" },
    { codice: "150102", descrizione: "Imballaggi in plastica", categoria: "Plastiche" },
    { codice: "200121", descrizione: "Pneumatici fuori uso", categoria: "Pneumatici" },
    { codice: "200101", descrizione: "Vetri", categoria: "Vetri" },
    { codice: "160107", descrizione: "Filtri olio", categoria: "Filtri" },
    { codice: "160108", descrizione: "Filtri aria", categoria: "Filtri" },
  ];
  
  const [form, setForm] = useState({
    // Riferimenti (OBBLIGATORI RENTRI)
    registro_id: "",
    anno: new Date().getFullYear(),
    progressivo: 1,
    data_ora_registrazione: new Date().toISOString().slice(0, 16),
    
    // Causale (OBBLIGATORIA RENTRI)
    causale_operazione: "NP", // Nuovo Produzione (carico)
    
    // Tipo operazione (nostro, per UI) - sincronizzato con causale
    tipo_operazione: "carico",
    data_operazione: new Date().toISOString().split("T")[0],
    
    // Rifiuto (OBBLIGATORIO RENTRI)
    codice_eer: "",
    descrizione_eer: "",
    stato_fisico: "S",
    destinato_attivita: "R3",
    
    // Quantità (OBBLIGATORIA RENTRI) - solo kg o l accettati da RENTRI
    quantita: "",
    unita_misura: "kg",
    
    // Provenienza RENTRI (U=Urbano, S=Speciale)
    provenienza: "",
    provenienza_destinazione: "",
    
    // Caratteristiche di pericolo HP (per rifiuti pericolosi)
    caratteristiche_pericolo: [],
    
    // Categorie AEE/RAEE (per rifiuti elettronici)
    categorie_aee: [],
    
    // Integrazione FIR (per causali aT, TR, T*, T*aT)
    riferimento_fir: "",
    numero_fir: "",
    data_inizio_trasporto: "",
    trasporto_transfrontaliero: false,
    tipo_trasporto_transfrontaliero: "",
    
    // Esito conferimento (per causali aT, T*aT)
    data_fine_trasporto: "",
    peso_verificato_destino: "",
    respingimento_tipo: "",
    respingimento_quantita: "",
    respingimento_unita_misura: "kg",
    respingimento_causale: "",
    respingimento_causale_altro: "",
    
    // Produttore (opzionale)
    produttore_denominazione: "",
    produttore_codice_fiscale: "",
    produttore_indirizzo: "",
    produttore_comune_id: "",
    
    // Trasportatore (opzionale, per causali trasporto)
    trasportatore_denominazione: "",
    trasportatore_codice_fiscale: "",
    trasportatore_num_iscrizione_albo: "",
    
    // Destinatario (opzionale)
    destinatario_denominazione: "",
    destinatario_codice_fiscale: "",
    destinatario_num_autorizzazione: "",
    
    // Intermediario (opzionale)
    intermediario_denominazione: "",
    intermediario_codice_fiscale: "",
    intermediario_num_iscrizione_albo: "",
    
    // VFU (opzionale)
    veicolo_fuori_uso: false,
    vfu_numero_registro: "",
    vfu_data_registro: "",
    
    // Materiale (solo causale M)
    materiale_codice: "",
    
    // Annotazioni
    annotazioni: "",
    note: "",
    
    // Collegamento demolizione (per autodemolitori)
    demolition_case_id: "",
  });

  const [errors, setErrors] = useState({});

  // Helper: determina se una causale è carico o scarico
  const getTipoOperazioneFromCausale = (causale) => {
    // Causali carico: NP (nuova produzione), DT (deposito temporaneo), aT (arrivo da trasporto),
    //                 T*aT (trasporto con arrivo), I (intermediazione in entrata), M (materiali)
    // Causali scarico: RE (recupero/smaltimento), TR (trasporto in uscita), T* (trasporto generico)
    const causaliScarico = ["RE", "TR", "T*"];
    if (causaliScarico.includes(causale)) return "scarico";
    return "carico"; // NP, DT, aT, T*aT, I, M → carico
  };

  // Sincronizza tipo_operazione quando cambia la causale
  useEffect(() => {
    if (form.causale_operazione) {
      const nuovoTipo = getTipoOperazioneFromCausale(form.causale_operazione);
      if (form.tipo_operazione !== nuovoTipo) {
        setForm(prev => ({ ...prev, tipo_operazione: nuovoTipo }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.causale_operazione]); // Solo quando cambia la causale

  useEffect(() => {
    if (orgId) {
      getRentriEnvironment(orgId).then(env => setRentriEnv(env));
      loadRegistri();
      loadDemolizioni();
      if (id) loadData();
      else {
        calculateNextProgressivo();
        // Se viene da una demolizione, precompila
        const fromDemolizione = searchParams.get('from') === 'demolizione';
        const demolitionId = searchParams.get('demolition_id');
        if (fromDemolizione && demolitionId) {
          handleSelectDemolizione(demolitionId);
        }
      }
    }
  }, [id, orgId, searchParams]);

  async function loadRegistri() {
    if (!orgId) return;
    
    try {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("rentri_registri")
        .select("id, anno, numero_registro, tipo, stato")
        .eq("org_id", orgId)
        .in("stato", ["attivo", "bozza"])
        .order("anno", { ascending: false });

      if (error) throw error;
      setRegistri(data || []);
    } catch (error) {
      console.error("Errore caricamento registri:", error);
    }
  }

  async function loadDemolizioni() {
    if (!orgId) return;
    
    try {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("demolition_cases")
        .select("id, targa, marca_modello, stato, created_at")
        .eq("org_id", orgId)
        .eq("stato", "completata")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setDemolizioni(data || []);
    } catch (error) {
      console.error("Errore caricamento demolizioni:", error);
    }
  }

  async function handleSelectDemolizione(demolitionId) {
    if (!demolitionId) return;
    
    try {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("demolition_cases")
        .select("id, targa, marca_modello, anno, stato")
        .eq("id", demolitionId)
        .eq("org_id", orgId)
        .single();

      if (error) throw error;
      
      if (data) {
        setSelectedDemolizione(data);
        setForm(prev => ({
          ...prev,
          demolition_case_id: data.id,
          // Precompila note con riferimento al veicolo
          note: `Rifiuti da demolizione veicolo: ${data.targa || 'N/A'} - ${data.marca_modello || 'N/A'}`,
          annotazioni: `Rifiuti derivanti dalla demolizione del veicolo ${data.targa || 'N/A'}`,
          // Imposta causale come "NP" (Nuovo Produzione) per rifiuti da demolizione
          causale_operazione: "NP",
          tipo_operazione: "carico",
          // EER suggerito per VFU (il principale — operatore può modificarlo)
          codice_eer: prev.codice_eer || "160104",
          descrizione_eer: prev.descrizione_eer || "Veicoli fuori uso",
          stato_fisico: "S",
          provenienza: "S",
        }));
      }
    } catch (error) {
      console.error("Errore caricamento demolizione:", error);
      alert("Errore nel caricamento della demolizione selezionata");
    }
  }

  async function calculateNextProgressivo() {
    if (!form.registro_id) return;
    
    try {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("rentri_movimenti")
        .select("progressivo")
        .eq("registro_id", form.registro_id)
        .eq("anno", form.anno)
        .order("progressivo", { ascending: false })
        .limit(1);

      if (error) throw error;
      
      const nextProgressivo = data && data.length > 0 ? data[0].progressivo + 1 : 1;
      setForm(prev => ({ ...prev, progressivo: nextProgressivo }));
    } catch (error) {
      console.error("Errore calcolo progressivo:", error);
    }
  }

  useEffect(() => {
    if (orgId && form.registro_id && !id) {
      calculateNextProgressivo();
    }
  }, [orgId, form.registro_id, form.anno, id]);

  async function loadData() {
    setLoading(true);
    try {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("rentri_movimenti")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      if (data) {
        const causale = data.causale_operazione || "NP";
        const tipoOp = getTipoOperazioneFromCausale(causale);
        
        setForm({
          registro_id: data.registro_id,
          anno: data.anno,
          progressivo: data.progressivo,
          data_ora_registrazione: data.data_ora_registrazione?.slice(0, 16) || "",
          causale_operazione: causale,
          tipo_operazione: tipoOp,
          data_operazione: data.data_operazione,
          codice_eer: data.codice_eer,
          descrizione_eer: data.descrizione_eer || "",
          stato_fisico: data.stato_fisico || "S",
          destinato_attivita: data.destinato_attivita || "",
          quantita: data.quantita?.toString() || "",
          unita_misura: data.unita_misura || "kg",
          provenienza: data.provenienza_codice || data.provenienza_destinazione || "",
          provenienza_destinazione: data.provenienza_destinazione || "",
          caratteristiche_pericolo: data.caratteristiche_pericolo || [],
          categorie_aee: data.categorie_aee || [],
          riferimento_fir: data.riferimento_fir || "",
          numero_fir: data.numero_fir || "",
          data_inizio_trasporto: data.data_inizio_trasporto?.slice(0, 16) || "",
          trasporto_transfrontaliero: data.trasporto_transfrontaliero || false,
          tipo_trasporto_transfrontaliero: data.tipo_trasporto_transfrontaliero || "",
          data_fine_trasporto: data.data_fine_trasporto?.slice(0, 16) || "",
          peso_verificato_destino: data.peso_verificato_destino?.toString() || "",
          respingimento_tipo: data.respingimento_tipo || "",
          respingimento_quantita: data.respingimento_quantita?.toString() || "",
          respingimento_unita_misura: data.respingimento_unita_misura || "kg",
          respingimento_causale: data.respingimento_causale || "",
          respingimento_causale_altro: data.respingimento_causale_altro || "",
          produttore_denominazione: data.produttore_denominazione || "",
          produttore_codice_fiscale: data.produttore_codice_fiscale || "",
          produttore_indirizzo: data.produttore_indirizzo || "",
          produttore_comune_id: data.produttore_comune_id || "",
          trasportatore_denominazione: data.trasportatore_denominazione || "",
          trasportatore_codice_fiscale: data.trasportatore_codice_fiscale || "",
          trasportatore_num_iscrizione_albo: data.trasportatore_num_iscrizione_albo || "",
          destinatario_denominazione: data.destinatario_denominazione || "",
          destinatario_codice_fiscale: data.destinatario_codice_fiscale || "",
          destinatario_num_autorizzazione: data.destinatario_num_autorizzazione || "",
          intermediario_denominazione: data.intermediario_denominazione || "",
          intermediario_codice_fiscale: data.intermediario_codice_fiscale || "",
          intermediario_num_iscrizione_albo: data.intermediario_num_iscrizione_albo || "",
          veicolo_fuori_uso: data.veicolo_fuori_uso || false,
          vfu_numero_registro: data.vfu_numero_registro || "",
          vfu_data_registro: data.vfu_data_registro || "",
          materiale_codice: data.materiale_codice || "",
          annotazioni: data.annotazioni || "",
          note: data.note || "",
          demolition_case_id: data.demolition_case_id || "",
        });
        
        // Verifica se sincronizzato con RENTRI
        const ss = data.sync_status || 'pending';
        setSyncStatus(ss);
        setIsSynced(!!data.rentri_id || ss === 'synced' || ss === 'trasmesso');
      }
    } catch (error) {
      console.error("Errore caricamento movimento:", error);
      showToast('error', `Errore caricamento: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  function fillTestData() {
    const currentYear = new Date().getFullYear();
    const now = new Date();
    const dataOraRegistrazione = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    
    // Scenari di test realistici per movimenti
    const scenarios = [
      // Scenario 1: Nuova Produzione - VFU da demolizione
      {
        causale: "NP",
        tipo_operazione: "carico",
        codice_eer: "160104",
        descrizione_eer: "Veicoli fuori uso",
        stato_fisico: "S",
        quantita: (Math.random() * 2000 + 500).toFixed(2),
        unita_misura: "kg",
        destinato_attivita: "R4",
        provenienza: "S",
        provenienza_destinazione: "Autodemolizione - Via Roma 1, Milano",
        annotazioni: "Nuova produzione rifiuto - veicolo fuori uso da demolizione"
      },
      // Scenario 2: Accettazione Trasporto - Oli esausti
      {
        causale: "aT",
        tipo_operazione: "carico",
        codice_eer: "130205",
        descrizione_eer: "Oli minerali per motori non clorurati",
        stato_fisico: "L",
        quantita: (Math.random() * 500 + 50).toFixed(2),
        unita_misura: "kg",
        destinato_attivita: "R9",
        provenienza: "S",
        provenienza_destinazione: "Impianto Recupero Oli - Via Industria 12, Lainate (MI)",
        numero_fir: `FIR-${currentYear}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
        data_inizio_trasporto: now.toISOString().slice(0, 16),
        data_fine_trasporto: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
        peso_verificato_destino: (Math.random() * 500 + 50).toFixed(2),
        annotazioni: "Accettazione olio esausto da officina meccanica - peso verificato a destinazione"
      },
      // Scenario 3: Trasporto in uscita - Rottami auto
      {
        causale: "TR",
        tipo_operazione: "scarico",
        codice_eer: "160104",
        descrizione_eer: "Veicoli fuori uso",
        stato_fisico: "S",
        quantita: (Math.random() * 2000 + 800).toFixed(2),
        unita_misura: "kg",
        destinato_attivita: "R4",
        provenienza: "S",
        provenienza_destinazione: "Impianto Trattamento VFU - Via Industria 5, Sesto S.G. (MI)",
        numero_fir: `FIR-${currentYear}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
        data_inizio_trasporto: now.toISOString().slice(0, 16),
        veicolo_fuori_uso: true,
        vfu_numero_registro: `VFU-${currentYear}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
        vfu_data_registro: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        annotazioni: "Trasporto VFU in uscita verso impianto di trattamento"
      },
      // Scenario 4: Giacenza - Batterie
      {
        causale: "RE",
        tipo_operazione: "scarico",
        codice_eer: "160601",
        descrizione_eer: "Batterie al piombo",
        stato_fisico: "S",
        quantita: (Math.random() * 100 + 10).toFixed(2),
        unita_misura: "kg",
        destinato_attivita: "R4",
        provenienza: "S",
        provenienza_destinazione: "Magazzino interno - Area batterie",
        annotazioni: "Giacenza batterie accumulate nel magazzino - in attesa di conferimento"
      },
      // Scenario 5: Materiali - Metalli
      {
        causale: "M",
        tipo_operazione: "carico",
        codice_eer: "170405",
        descrizione_eer: "Ferro e acciaio",
        materiale_codice: "RFA",
        stato_fisico: "S",
        quantita: (Math.random() * 3000 + 500).toFixed(2),
        unita_misura: "kg",
        destinato_attivita: "R4",
        provenienza: "S",
        provenienza_destinazione: "Impianto Frantumazione Metalli - Zona Industriale Nord, Milano",
        annotazioni: "Materiali metallici derivanti da demolizione veicoli - non rifiuti"
      }
    ];
    
    // Scegli scenario random
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    
    // Seleziona primo registro disponibile se presente
    const registroSelezionato = registri.length > 0 ? registri[0].id : form.registro_id;
    
    // Calcola progressivo se registro selezionato
    let progressivo = form.progressivo;
    if (registroSelezionato && form.registro_id === registroSelezionato) {
      // Usa progressivo corrente se già calcolato
    } else if (registroSelezionato) {
      progressivo = 1; // Verrà ricalcolato dall'useEffect
    }
    
    setForm({
      ...form,
      registro_id: registroSelezionato || form.registro_id,
      anno: currentYear,
      progressivo: progressivo,
      data_ora_registrazione: dataOraRegistrazione,
      causale_operazione: scenario.causale,
      tipo_operazione: scenario.tipo_operazione,
      data_operazione: now.toISOString().split("T")[0],
      codice_eer: scenario.codice_eer,
      descrizione_eer: scenario.descrizione_eer,
      stato_fisico: scenario.stato_fisico,
      destinato_attivita: scenario.destinato_attivita,
      quantita: scenario.quantita,
      unita_misura: scenario.unita_misura,
      provenienza: scenario.provenienza || "",
      provenienza_destinazione: scenario.provenienza_destinazione || "",
      numero_fir: scenario.numero_fir || "",
      data_inizio_trasporto: scenario.data_inizio_trasporto || "",
      data_fine_trasporto: scenario.data_fine_trasporto || "",
      peso_verificato_destino: scenario.peso_verificato_destino || "",
      veicolo_fuori_uso: scenario.veicolo_fuori_uso || false,
      vfu_numero_registro: scenario.vfu_numero_registro || "",
      vfu_data_registro: scenario.vfu_data_registro || "",
      materiale_codice: scenario.materiale_codice || "",
      annotazioni: scenario.annotazioni || "",
      note: `Movimento di test - ${scenario.descrizione_eer}`
    });
    
    const tipoScenario = scenario.causale === "NP" ? "Nuova Produzione (carico)" :
                        scenario.causale === "aT" ? "Accettazione Trasporto (carico)" :
                        scenario.causale === "TR" ? "Trasporto in uscita (scarico)" :
                        scenario.causale === "RE" ? "Recupero/Smaltimento (scarico)" :
                        scenario.causale === "M" ? "Materiali (carico)" :
                        scenario.causale;
    
    showToast('success', `Dati test caricati: ${tipoScenario} · EER ${scenario.codice_eer} · ${scenario.quantita} ${scenario.unita_misura}`);
  }

  function validate() {
    const newErrors = {};

    if (!form.registro_id) newErrors.registro_id = "Seleziona un registro";
    if (!form.causale_operazione) newErrors.causale_operazione = "Causale obbligatoria";
    if (form.causale_operazione !== 'M') {
      if (!form.codice_eer || !/^\d{6}$/.test(form.codice_eer)) {
        newErrors.codice_eer = "Codice EER deve essere 6 cifre (es: 170101)";
      }
      if (!form.stato_fisico) newErrors.stato_fisico = "Stato fisico obbligatorio";
      if (!form.destinato_attivita) newErrors.destinato_attivita = "Attività destinazione obbligatoria";
    } else {
      if (!form.materiale_codice) newErrors.materiale_codice = "Seleziona tipo materiale";
    }
    if (!form.quantita || parseFloat(form.quantita) <= 0) {
      newErrors.quantita = "Quantità deve essere maggiore di 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!orgId) {
      alert(" Errore: Seleziona un'organizzazione dal menu in alto.");
      return;
    }

    if (!validate()) {
      showToast('error', 'Compila tutti i campi obbligatori');
      return;
    }

    setSaving(true);
    try {
      const supabase = supabaseBrowser();
      
      const payload = {
        org_id: orgId,
        registro_id: form.registro_id,
        
        // Riferimenti RENTRI
        anno: parseInt(form.anno),
        progressivo: parseInt(form.progressivo),
        data_ora_registrazione: new Date(form.data_ora_registrazione).toISOString(),
        
        // Causale
        causale_operazione: form.causale_operazione,
        
        // Nostri (UI)
        tipo_operazione: form.tipo_operazione,
        data_operazione: form.data_operazione,
        
        // Rifiuto
        codice_eer: form.codice_eer,
        descrizione_eer: form.descrizione_eer || null,
        stato_fisico: form.stato_fisico,
        destinato_attivita: form.destinato_attivita || null,
        
        // Quantità (RENTRI accetta solo kg e l)
        quantita: parseFloat(form.quantita),
        unita_misura: form.unita_misura,
        
        // Provenienza RENTRI (U=Urbano, S=Speciale)
        provenienza_codice: form.provenienza || null,
        provenienza_destinazione: form.provenienza_destinazione || null,
        
        // Caratteristiche di pericolo HP
        caratteristiche_pericolo: form.caratteristiche_pericolo.length > 0 ? form.caratteristiche_pericolo : null,
        
        // Categorie AEE/RAEE
        categorie_aee: form.categorie_aee.length > 0 ? form.categorie_aee : null,
        
        // Integrazione FIR
        riferimento_fir: form.riferimento_fir || null,
        numero_fir: form.numero_fir || null,
        data_inizio_trasporto: form.data_inizio_trasporto ? new Date(form.data_inizio_trasporto).toISOString() : null,
        trasporto_transfrontaliero: form.trasporto_transfrontaliero || false,
        tipo_trasporto_transfrontaliero: form.tipo_trasporto_transfrontaliero || null,
        
        // Esito conferimento
        data_fine_trasporto: form.data_fine_trasporto ? new Date(form.data_fine_trasporto).toISOString() : null,
        peso_verificato_destino: form.peso_verificato_destino ? parseFloat(form.peso_verificato_destino) : null,
        respingimento_tipo: form.respingimento_tipo || null,
        respingimento_quantita: form.respingimento_quantita ? parseFloat(form.respingimento_quantita) : null,
        respingimento_unita_misura: form.respingimento_tipo ? form.respingimento_unita_misura : null,
        respingimento_causale: form.respingimento_causale || null,
        respingimento_causale_altro: form.respingimento_causale_altro || null,
        
        // Produttore
        produttore_denominazione: form.produttore_denominazione || null,
        produttore_codice_fiscale: form.produttore_codice_fiscale || null,
        produttore_indirizzo: form.produttore_indirizzo || null,
        produttore_comune_id: form.produttore_comune_id || null,
        
        // Trasportatore
        trasportatore_denominazione: form.trasportatore_denominazione || null,
        trasportatore_codice_fiscale: form.trasportatore_codice_fiscale || null,
        trasportatore_num_iscrizione_albo: form.trasportatore_num_iscrizione_albo || null,
        
        // Destinatario
        destinatario_denominazione: form.destinatario_denominazione || null,
        destinatario_codice_fiscale: form.destinatario_codice_fiscale || null,
        destinatario_num_autorizzazione: form.destinatario_num_autorizzazione || null,
        
        // Intermediario
        intermediario_denominazione: form.intermediario_denominazione || null,
        intermediario_codice_fiscale: form.intermediario_codice_fiscale || null,
        intermediario_num_iscrizione_albo: form.intermediario_num_iscrizione_albo || null,
        
        // VFU
        veicolo_fuori_uso: form.veicolo_fuori_uso,
        vfu_numero_registro: form.vfu_numero_registro || null,
        vfu_data_registro: form.vfu_data_registro || null,
        
        // Materiale (solo causale M)
        materiale_codice: form.causale_operazione === 'M' ? (form.materiale_codice || null) : null,
        
        // Annotazioni RENTRI (trasmesse all'API, max 500 char) vs note interne
        annotazioni: form.annotazioni || null,
        note: form.note || null,
        
        // Collegamento demolizione (per autodemolitori)
        demolition_case_id: form.demolition_case_id || null,
        
        environment: rentriEnv,
      };

      if (id) {
        const { error } = await supabase
          .from("rentri_movimenti")
          .update(payload)
          .eq("id", id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("rentri_movimenti")
          .insert(payload);

        if (error) throw error;
      }

      showToast('success', id ? 'Movimento aggiornato!' : 'Movimento creato!');
      setTimeout(() => navigate("/rifiuti/movimenti"), 800);
    } catch (error) {
      console.error("Errore salvataggio:", error);
      showToast('error', `Errore salvataggio: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleTrasmetti() {
    if (isDemo) {
      alert("\u{1F512} Modalit\u00e0 Demo\n\nLa trasmissione movimenti a RENTRI non \u00e8 disponibile in modalit\u00e0 demo.");
      return;
    }
    if (!id || !orgId) return;
    setTrasmitting(true);
    try {
      const apiUrl = import.meta.env.VITE_RENTRI_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri';
      const response = await fetch(`${apiUrl}/registri/${form.registro_id}/movimenti`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, movimenti_ids: [id] }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Errore trasmissione');
      showToast('success', `Movimento trasmesso a RENTRI (transazione: ${result.transazione_id || 'OK'})`);
      setSyncStatus('trasmesso');
      setIsSynced(true);
    } catch (err) {
      showToast('error', `Errore trasmissione: ${err.message}`);
    } finally {
      setTrasmitting(false);
    }
  }

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

  const TipoIcon = form.tipo_operazione === "carico" ? FiTrendingUp : FiTrendingDown;
  const tipoColor = form.tipo_operazione === "carico" ? "text-teal-400" : "text-amber-400";


  return (
    <div className="space-y-4" style={{ overflowAnchor: 'none' }}>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-medium transition-all ${
          toast.type === 'success' ? 'bg-sky-500/8 border-sky-500/15 text-sky-400' :
          toast.type === 'error'   ? 'bg-red-500/10 border-red-500/20 text-red-400' :
          'bg-blue-500/10 border-blue-500/20 text-blue-400'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <FiCheckCircle className="w-3.5 h-3.5" /> : <FiAlertCircle className="w-3.5 h-3.5" />}
            {toast.msg}
          </div>
          <button onClick={() => setToast(null)} className="p-0.5 hover:opacity-70"><FiX className="w-3 h-3" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/rifiuti/movimenti")} className="p-2 text-slate-400 hover:text-slate-200 hover:bg-[#1a2536] rounded-lg transition-colors" title="Torna alla lista">
            <FiArrowLeft className="w-4 h-4" />
          </button>
          <div className={`p-2 rounded-lg ${form.tipo_operazione === 'carico' ? 'bg-teal-500/10' : 'bg-amber-500/10'}`}>
            {isSynced ? <FiEye className="w-5 h-5 text-blue-400" /> : <TipoIcon className={`w-5 h-5 ${tipoColor}`} />}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">
              {isSynced ? 'Visualizza Movimento' : (id ? 'Modifica Movimento' : 'Nuovo Movimento')}
            </h1>
            <p className="text-xs text-slate-500">
              {isSynced
                ? `Trasmesso a RENTRI · sola lettura`
                : `Registrazione ${form.tipo_operazione} rifiuti — Normativa RENTRI`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!id && !isSynced && (
            <button
              onClick={fillTestData}
              disabled={registri.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors disabled:opacity-40"
              title="Compila automaticamente con dati di esempio"
            >
              <FiZap className="w-3.5 h-3.5" /> Test
            </button>
          )}
          {id && !isSynced && (
            <button
              onClick={handleTrasmetti}
              disabled={trasmitting || !form.registro_id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              title="Trasmetti questo movimento a RENTRI"
            >
              {trasmitting ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiSend className="w-3.5 h-3.5" />}
              {trasmitting ? 'Trasmissione...' : 'Trasmetti a RENTRI'}
            </button>
          )}
          {isSynced && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-lg">
              <FiCheckCircle className="w-3.5 h-3.5" /> Trasmesso
            </span>
          )}
          <button
            onClick={() => navigate("/rifiuti/movimenti")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors"
          >
            {isSynced ? 'Chiudi' : 'Annulla'}
          </button>
          {!isSynced && (
            <button
              onClick={handleSave}
              disabled={saving || registri.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving
                ? <><FiRefreshCw className="w-3.5 h-3.5 animate-spin" />Salvataggio...</>
                : <><FiSave className="w-3.5 h-3.5" />{id ? 'Salva Modifiche' : 'Crea Movimento'}</>}
            </button>
          )}
        </div>
      </div>

      {/* Banner stato */}
      {isSynced ? (
        <div className="bg-sky-500/8 border border-sky-500/15 rounded-xl px-4 py-3 flex items-center gap-3">
          <FiCheckCircle className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-sky-300">Movimento trasmesso a RENTRI — sola lettura</p>
            <p className="text-[10px] text-slate-500 mt-0.5">I campi principali non sono modificabili. Solo le note interne possono essere aggiornate.</p>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <FiAlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-yellow-300">{rentriEnv === 'prod' ? 'Trasmissione PRODUZIONE' : 'Trasmissione di test'}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Salva il movimento, poi usa il bottone <strong className="text-yellow-300">Trasmetti a RENTRI</strong> per inviarlo{rentriEnv !== 'prod' ? ' in modalità test' : ''}.</p>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="space-y-3">
        
        {/* SEZIONE 0: COLLEGAMENTO DEMOLIZIONE (Autodemolitori) */}
        {!id && (
          <FormSection number="0" title="Collegamento Demolizione (Autodemolitori)" color="slate">
            <FormRow cols={1}>
              <InputField 
                label="Veicolo Demolito" 
                help="Seleziona il veicolo demolito per precompilare automaticamente i dati"
              >
                <select
                  value={form.demolition_case_id}
                  onChange={(e) => handleSelectDemolizione(e.target.value)}
                  disabled={isSynced}
                  className={`w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 ${
                    isSynced ? "bg-[#1a2536] cursor-not-allowed opacity-75" : ""
                  }`}
                >
                  <option value="">Nessuna demolizione (movimento generico)</option>
                  {demolizioni.map((demo) => (
                    <option key={demo.id} value={demo.id}>
                      {demo.targa || 'N/A'} - {demo.marca_modello || 'N/A'} ({new Date(demo.created_at).toLocaleDateString('it-IT')})
                    </option>
                  ))}
                </select>
              </InputField>
            </FormRow>
            {selectedDemolizione && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <FiTruck className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-blue-300">
                      Veicolo selezionato: {selectedDemolizione.targa || 'N/A'} - {selectedDemolizione.marca_modello || 'N/A'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      I dati sono stati precompilati. Puoi modificare i campi se necessario.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </FormSection>
        )}
        
        {/* SEZIONE 1: RIFERIMENTI */}
        <FormSection number="1" title="Riferimenti Operazione" color="blue">
          <FormRow cols={2}>
            <InputField 
              label="Registro" 
              required 
              error={errors.registro_id}
              help="Registro cronologico di riferimento"
            >
              <select
                value={form.registro_id}
                onChange={(e) => setForm({ ...form, registro_id: e.target.value })}
                disabled={isSynced}
                className={`w-full px-3 py-2 text-sm bg-[#141c27] border ${
                  errors.registro_id ? "border-red-500" : "border-[#243044]"
                } rounded-lg text-slate-200 ${
                  isSynced ? "bg-[#1a2536] cursor-not-allowed opacity-75" : ""
                }`}
              >
                <option value="">Seleziona registro...</option>
                {registri.map((reg) => (
                  <option key={reg.id} value={reg.id}>
                    {reg.anno} - {reg.numero_registro || "N/A"} ({reg.tipo})
                  </option>
                ))}
              </select>
            </InputField>

            <InputField 
              label="Causale Operazione" 
              required
              error={errors.causale_operazione}
              help="Codice causale secondo RENTRI. RENTRI determina carico/scarico da questa causale."
            >
              <select
                value={form.causale_operazione}
                onChange={(e) => setForm({ ...form, causale_operazione: e.target.value })}
                disabled={isSynced}
                className={`w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 ${
                  isSynced ? "bg-[#1a2536] cursor-not-allowed opacity-75" : ""
                }`}
              >
                <option value="NP">NP - Nuovo Produzione (CARICO)</option>
                <option value="DT">DT - Deposito Temporaneo (CARICO)</option>
                <option value="RE">RE - Recupero (CARICO)</option>
                <option value="I">I - Intermediazione (CARICO)</option>
                <option value="aT">aT - Accettazione Trasporto (SCARICO)  Richiede esito</option>
                <option value="TR">TR - Trasporto (SCARICO)</option>
                <option value="T*">T* - Trasporto con asterisco (SCARICO)</option>
                <option value="T*aT">T*aT - Trasporto + Accettazione (SCARICO)  Richiede esito</option>
                <option value="M">M - Materiali (non rifiuti)</option>
              </select>
              {(form.causale_operazione === "aT" || form.causale_operazione === "T*aT") && (
                <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <FiAlertCircle className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-yellow-300">
                      <strong>Nota:</strong> Per le causali aT e T*aT, RENTRI richiede obbligatoriamente il campo <strong>esito conferimento</strong>. 
                      Il sistema include automaticamente un esito di default "Accettato" se non specificato.
                    </div>
                  </div>
                </div>
              )}
            </InputField>
          </FormRow>

          <FormRow cols={3}>
            <InputField label="Anno" required help="Anno registrazione (1980-2050)">
              <input
                type="number"
                value={form.anno}
                onChange={(e) => setForm({ ...form, anno: e.target.value })}
                readOnly={isSynced}
                className={`w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 ${
                  isSynced ? "bg-[#1a2536] cursor-not-allowed opacity-75" : ""
                }`}
                min="1980"
                max="2050"
              />
            </InputField>

            <InputField label="Progressivo" required help="Numero progressivo (auto)">
              <input
                type="number"
                value={form.progressivo}
                onChange={(e) => setForm({ ...form, progressivo: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 bg-[#1a2536]"
                min="1"
                readOnly
              />
            </InputField>

            <InputField label="Data/Ora Registrazione" required help="ISO 8601">
              <input
                type="datetime-local"
                value={form.data_ora_registrazione}
                onChange={(e) => setForm({ ...form, data_ora_registrazione: e.target.value })}
                readOnly={isSynced}
                className={`w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 ${
                  isSynced ? "bg-[#1a2536] cursor-not-allowed opacity-75" : ""
                }`}
              />
            </InputField>
          </FormRow>
        </FormSection>

        {/* SEZIONE 2: IDENTIFICAZIONE RIFIUTO / MATERIALE */}
        <FormSection number="2" title={form.causale_operazione === 'M' ? 'Identificazione Materiale' : 'Identificazione Rifiuto'} color="green">
          {form.causale_operazione === 'M' ? (
            <>
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 mb-3">
                <p className="text-xs text-cyan-300">Causale M: seleziona il tipo di materiale (non rifiuto) secondo la codifica RENTRI.</p>
              </div>
              <FormRow cols={2}>
                <InputField label="Tipo Materiale" required error={errors.materiale_codice} help="Codifica RENTRI materiali end-of-waste">
                  <select
                    value={form.materiale_codice}
                    onChange={(e) => setForm({ ...form, materiale_codice: e.target.value })}
                    disabled={isSynced}
                    className={`w-full px-3 py-2 text-sm bg-[#141c27] border ${errors.materiale_codice ? "border-red-500" : "border-[#243044]"} rounded-lg text-slate-200 ${isSynced ? "opacity-75 cursor-not-allowed" : ""}`}
                  >
                    <option value="">Seleziona materiale...</option>
                    <optgroup label="Metalli">
                      <option value="RFA">RFA - Rottami di ferro e acciaio</option>
                      <option value="RA">RA - Rottami di alluminio</option>
                      <option value="RR">RR - Rottami di rame</option>
                    </optgroup>
                    <optgroup label="Altri materiali">
                      <option value="RV">RV - Rottami di vetro</option>
                      <option value="CC">CC - Carta e cartone</option>
                      <option value="PLA">PLA - Plastica</option>
                      <option value="LS">LS - Legno e sughero</option>
                      <option value="GOM">GOM - Gomma</option>
                      <option value="GMV">GMV - Gomma vulcanizzata da PFU</option>
                      <option value="TE">TE - Tessili</option>
                      <option value="CU">CU - Cuoio</option>
                      <option value="MC">MC - Materiali ceramici</option>
                      <option value="AGG">AGG - Aggregati riciclati</option>
                      <option value="CSS">CSS - CSS combustibile</option>
                    </optgroup>
                    <optgroup label="Ammendanti / Fertilizzanti">
                      <option value="ACV">ACV - Ammendante compostato verde</option>
                      <option value="ACM">ACM - Ammendante compostato misto</option>
                      <option value="AA">AA - Altri ammendanti</option>
                      <option value="DIG">DIG - Digestato</option>
                      <option value="CF">CF - Correttivi da fanghi</option>
                      <option value="AF">AF - Altri fertilizzanti</option>
                      <option value="GCB">GCB - Granulato conglomerato bituminoso</option>
                      <option value="ASS">ASS - Materiali da prodotti assorbenti</option>
                    </optgroup>
                    <option value="A">A - Altro</option>
                  </select>
                </InputField>
                <InputField label="Descrizione materiale" help="Max 50 caratteri">
                  <input
                    type="text"
                    value={form.descrizione_eer}
                    onChange={(e) => setForm({ ...form, descrizione_eer: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
                    placeholder="Rottami ferro da demolizione veicoli"
                    maxLength={50}
                  />
                </InputField>
              </FormRow>
            </>
          ) : (
            <>
              {!id && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-3">
                  <p className="text-sm font-medium text-blue-300 mb-3">Codici EER comuni per autodemolitori:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {CODICI_EER_AUTODEMOLITORI.map((eer) => (
                      <button
                        key={eer.codice}
                        type="button"
                        onClick={() => setForm(prev => ({
                          ...prev,
                          codice_eer: eer.codice,
                          descrizione_eer: eer.descrizione
                        }))}
                        className="text-left px-3 py-2 bg-[#1a2536] hover:bg-[#243044] border border-[#243044] hover:border-blue-500/50 rounded-lg transition-all text-sm"
                      >
                        <div className="font-medium text-slate-200">{eer.codice}</div>
                        <div className="text-xs text-slate-500 truncate">{eer.descrizione}</div>
                        <div className="text-xs text-blue-400 mt-1">{eer.categoria}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <FormRow cols={2}>
                <InputField 
                  label="Codice EER" 
                  required
                  error={errors.codice_eer}
                  help="6 cifre - es: 170101 (cemento)"
                >
                  <input
                    type="text"
                    value={form.codice_eer}
                    onChange={(e) => setForm({ ...form, codice_eer: e.target.value })}
                    readOnly={isSynced}
                    className={`w-full px-3 py-2 text-sm bg-[#141c27] border ${
                      errors.codice_eer ? "border-red-500" : "border-[#243044]"
                    } rounded-lg text-slate-200 font-mono ${
                      isSynced ? "bg-[#1a2536] cursor-not-allowed opacity-75" : ""
                    }`}
                    placeholder="170101"
                    maxLength={6}
                  />
                </InputField>

                <InputField 
                  label="Descrizione EER"
                  help="Obbligatoria se codice finisce con .99"
                >
                  <input
                    type="text"
                    value={form.descrizione_eer}
                    onChange={(e) => setForm({ ...form, descrizione_eer: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
                    placeholder="Cemento, mattoni, piastrelle"
                    maxLength={250}
                  />
                </InputField>
              </FormRow>
            </>
          )}

          <FormRow cols={2}>
            <InputField 
              label="Stato Fisico" 
              required
              error={errors.stato_fisico}
            >
              <select
                value={form.stato_fisico}
                onChange={(e) => setForm({ ...form, stato_fisico: e.target.value })}
                disabled={isSynced}
                className={`w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 ${
                  isSynced ? "bg-[#1a2536] cursor-not-allowed opacity-75" : ""
                }`}
              >
                <option value="S">S - Solido</option>
                <option value="SP">SP - Solido Pulverulento</option>
                <option value="L">L - Liquido</option>
                <option value="FP">FP - Fangoso/Pastoso</option>
                <option value="VS">VS - Vapore/Solido</option>
              </select>
            </InputField>

            <InputField 
              label="Destinato a Attività" 
              required
              error={errors.destinato_attivita}
              help="R=Recupero, D=Smaltimento"
            >
              <select
                value={form.destinato_attivita}
                onChange={(e) => setForm({ ...form, destinato_attivita: e.target.value })}
                disabled={isSynced}
                className={`w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 ${
                  isSynced ? "bg-[#1a2536] cursor-not-allowed opacity-75" : ""
                }`}
              >
                <option value="">Non specificato</option>
                <optgroup label="Recupero">
                  <option value="R1">R1 - Utilizzazione combustibile</option>
                  <option value="R2">R2 - Rigenerazione solventi</option>
                  <option value="R3">R3 - Riciclo sostanze organiche</option>
                  <option value="R4">R4 - Riciclo metalli</option>
                  <option value="R5">R5 - Riciclo altre sostanze inorganiche</option>
                  <option value="R6">R6 - Rigenerazione acidi/basi</option>
                  <option value="R7">R7 - Recupero captazione inquinanti</option>
                  <option value="R8">R8 - Recupero catalizzatori</option>
                  <option value="R9">R9 - Rigenerazione oli</option>
                  <option value="R10">R10 - Spandimento sul suolo</option>
                  <option value="R11">R11 - Utilizzazione rifiuti da R1-R10</option>
                  <option value="R12">R12 - Scambio rifiuti per R1-R11</option>
                  <option value="R13">R13 - Messa in riserva</option>
                </optgroup>
                <optgroup label="Smaltimento">
                  <option value="D1">D1 - Deposito sul suolo</option>
                  <option value="D2">D2 - Trattamento in ambiente terrestre</option>
                  <option value="D3">D3 - Iniezioni in profondità</option>
                  <option value="D4">D4 - Lagunaggio</option>
                  <option value="D5">D5 - Messa in discarica speciale</option>
                  <option value="D6">D6 - Scarico in ambiente idrico</option>
                  <option value="D7">D7 - Immersione/seppellimento</option>
                  <option value="D8">D8 - Trattamento biologico</option>
                  <option value="D9">D9 - Trattamento chimico-fisico</option>
                  <option value="D10">D10 - Incenerimento a terra</option>
                  <option value="D11">D11 - Incenerimento in mare</option>
                  <option value="D12">D12 - Deposito permanente</option>
                  <option value="D13">D13 - Raggruppamento preliminare</option>
                  <option value="D14">D14 - Ricondizionamento preliminare</option>
                  <option value="D15">D15 - Deposito preliminare</option>
                </optgroup>
                <optgroup label="Centro Raccolta">
                  <option value="CR">CR - Centro di Raccolta</option>
                </optgroup>
              </select>
            </InputField>
          </FormRow>

          {/* Caratteristiche di Pericolo HP */}
          <InputField 
            label="Caratteristiche di Pericolo (HP)" 
            help="Seleziona le caratteristiche HP applicabili (per rifiuti pericolosi con codice EER asteriscato)"
          >
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-1">
              {[
                { code: "HP01", label: "Esplosivo" },
                { code: "HP02", label: "Comburente" },
                { code: "HP03", label: "Infiammabile" },
                { code: "HP04", label: "Irritante" },
                { code: "HP05", label: "STOT/Tossicità respirazione" },
                { code: "HP06", label: "Tossicità acuta" },
                { code: "HP07", label: "Cancerogeno" },
                { code: "HP08", label: "Corrosivo" },
                { code: "HP09", label: "Infettivo" },
                { code: "HP10", label: "Tossico riproduzione" },
                { code: "HP11", label: "Mutageno" },
                { code: "HP12", label: "Gas tossicità acuta" },
                { code: "HP13", label: "Sensibilizzante" },
                { code: "HP14", label: "Ecotossico" },
                { code: "HP15", label: "Pericolo successivo" },
              ].map(hp => (
                <label key={hp.code} className="flex items-center gap-2 px-2 py-1.5 bg-[#141c27] border border-[#243044] rounded-lg cursor-pointer hover:border-amber-500/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.caratteristiche_pericolo.includes(hp.code)}
                    onChange={(e) => {
                      const arr = e.target.checked
                        ? [...form.caratteristiche_pericolo, hp.code]
                        : form.caratteristiche_pericolo.filter(c => c !== hp.code);
                      setForm({ ...form, caratteristiche_pericolo: arr });
                    }}
                    disabled={isSynced}
                    className="w-3.5 h-3.5 text-amber-500 bg-[#141c27] border-[#243044] rounded"
                  />
                  <span className="text-xs text-slate-300">
                    <span className="font-mono text-amber-400">{hp.code}</span>
                    <span className="text-slate-500 ml-1 hidden lg:inline">{hp.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </InputField>

          {/* Categorie AEE/RAEE */}
          <InputField 
            label="Categorie AEE/RAEE" 
            help="Solo per rifiuti di apparecchiature elettriche ed elettroniche"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
              {[
                { code: "Cat1", label: "Scambio temperatura" },
                { code: "Cat2", label: "Schermi/monitor >100cm²" },
                { code: "Cat3", label: "Lampade" },
                { code: "Cat4", label: "Grandi dimensioni >50cm" },
                { code: "Cat5", label: "Piccole dimensioni ≤50cm" },
                { code: "Cat6", label: "Piccole IT/telecom ≤50cm" },
                { code: "PF", label: "Pannelli fotovoltaici" },
              ].map(cat => (
                <label key={cat.code} className="flex items-center gap-2 px-2 py-1.5 bg-[#141c27] border border-[#243044] rounded-lg cursor-pointer hover:border-blue-500/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.categorie_aee.includes(cat.code)}
                    onChange={(e) => {
                      const arr = e.target.checked
                        ? [...form.categorie_aee, cat.code]
                        : form.categorie_aee.filter(c => c !== cat.code);
                      setForm({ ...form, categorie_aee: arr });
                    }}
                    disabled={isSynced}
                    className="w-3.5 h-3.5 text-blue-500 bg-[#141c27] border-[#243044] rounded"
                  />
                  <span className="text-xs text-slate-300">
                    <span className="font-mono text-blue-400">{cat.code}</span>
                    <span className="text-slate-500 ml-1">{cat.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </InputField>
        </FormSection>

        {/* SEZIONE 3: QUANTITÀ */}
        <FormSection number="3" title="Quantità" color="amber">
          <FormRow cols={3}>
            <InputField 
              label="Quantità" 
              required
              error={errors.quantita}
              help="Max 10 cifre + 4 decimali"
            >
              <input
                type="number"
                step="0.0001"
                value={form.quantita}
                onChange={(e) => setForm({ ...form, quantita: e.target.value })}
                readOnly={isSynced}
                className={`w-full px-3 py-2 text-sm bg-[#141c27] border ${
                  errors.quantita ? "border-red-500" : "border-[#243044]"
                } rounded-lg text-slate-200 ${
                  isSynced ? "bg-[#1a2536] cursor-not-allowed opacity-75" : ""
                }`}
                placeholder="1000.5000"
              />
            </InputField>

            <InputField label="Unità di Misura" required>
              <select
                value={form.unita_misura}
                onChange={(e) => setForm({ ...form, unita_misura: e.target.value })}
                disabled={isSynced}
                className={`w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 ${
                  isSynced ? "bg-[#1a2536] cursor-not-allowed opacity-75" : ""
                }`}
              >
                <option value="kg">kg (chilogrammi)</option>
                <option value="l">l (litri)</option>
              </select>
            </InputField>

            <InputField label="Provenienza" help="U=Urbano, S=Speciale">
              <select
                value={form.provenienza}
                onChange={(e) => setForm({ ...form, provenienza: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
              >
                <option value="">Non specificato</option>
                <option value="U">U - Urbano</option>
                <option value="S">S - Speciale</option>
              </select>
            </InputField>
          </FormRow>
        </FormSection>

        {/* SEZIONE 4: SOGGETTI */}
        <FormSection number="4" title="Produttore del Rifiuto" color="purple">
          <FormRow cols={2}>
            <InputField label="Denominazione" help="Cerca da anagrafica clienti o digita manualmente">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={form.produttore_denominazione}
                  onChange={(e) => setForm({ ...form, produttore_denominazione: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
                  placeholder="Es: Autodemolizioni Rossi Srl"
                  maxLength={255}
                />
                <button
                  type="button"
                  onClick={() => setClientSearchTarget('produttore')}
                  className="px-2.5 py-2 bg-[#1a2536] border border-[#243044] rounded-lg hover:border-blue-500/50 transition-colors"
                  title="Cerca da anagrafica clienti"
                >
                  <FiSearch className="w-3.5 h-3.5 text-blue-400" />
                </button>
              </div>
            </InputField>
            <InputField label="Codice Fiscale" help="5-20 caratteri">
              <input
                type="text"
                value={form.produttore_codice_fiscale}
                onChange={(e) => setForm({ ...form, produttore_codice_fiscale: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 font-mono"
                placeholder="01234567890"
                maxLength={20}
              />
            </InputField>
          </FormRow>
          <FormRow cols={2}>
            <InputField label="Indirizzo" help="Indirizzo completo del luogo di produzione">
              <input
                type="text"
                value={form.produttore_indirizzo}
                onChange={(e) => setForm({ ...form, produttore_indirizzo: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
                placeholder="Via Roma 10, 20100 Milano"
              />
            </InputField>
            <InputField label="Codice Comune ISTAT" help="Codice ISTAT del comune (max 6 cifre)">
              <input
                type="text"
                value={form.produttore_comune_id}
                onChange={(e) => setForm({ ...form, produttore_comune_id: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 font-mono"
                placeholder="015146"
                maxLength={6}
              />
            </InputField>
          </FormRow>
        </FormSection>

        {/* Trasportatore */}
        {["aT", "TR", "T*", "T*aT"].includes(form.causale_operazione) && (
          <FormSection number="4b" title="Trasportatore" color="indigo">
            <FormRow cols={3}>
              <InputField label="Denominazione" required help="Cerca da anagrafica o digita">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={form.trasportatore_denominazione}
                    onChange={(e) => setForm({ ...form, trasportatore_denominazione: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
                    placeholder="Trasporti Verdi Srl"
                    maxLength={255}
                  />
                  <button type="button" onClick={() => setClientSearchTarget('trasportatore')}
                    className="px-2.5 py-2 bg-[#1a2536] border border-[#243044] rounded-lg hover:border-blue-500/50 transition-colors"
                    title="Cerca da anagrafica clienti">
                    <FiSearch className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                </div>
              </InputField>
              <InputField label="Codice Fiscale" required help="5-20 caratteri">
                <input
                  type="text"
                  value={form.trasportatore_codice_fiscale}
                  onChange={(e) => setForm({ ...form, trasportatore_codice_fiscale: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 font-mono"
                  placeholder="09876543210"
                  maxLength={20}
                />
              </InputField>
              <InputField label="N° Iscrizione Albo" help="Formato: XX/000000">
                <input
                  type="text"
                  value={form.trasportatore_num_iscrizione_albo}
                  onChange={(e) => setForm({ ...form, trasportatore_num_iscrizione_albo: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 font-mono"
                  placeholder="MI/012345"
                />
              </InputField>
            </FormRow>
          </FormSection>
        )}

        {/* Destinatario */}
        <FormSection number="4c" title="Destinatario" color="teal">
          <FormRow cols={3}>
            <InputField label="Denominazione" help="Cerca da anagrafica o digita">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={form.destinatario_denominazione}
                  onChange={(e) => setForm({ ...form, destinatario_denominazione: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
                  placeholder="Impianto Recupero Srl"
                  maxLength={255}
                />
                <button type="button" onClick={() => setClientSearchTarget('destinatario')}
                  className="px-2.5 py-2 bg-[#1a2536] border border-[#243044] rounded-lg hover:border-blue-500/50 transition-colors"
                  title="Cerca da anagrafica clienti">
                  <FiSearch className="w-3.5 h-3.5 text-blue-400" />
                </button>
              </div>
            </InputField>
            <InputField label="Codice Fiscale" help="5-20 caratteri">
              <input
                type="text"
                value={form.destinatario_codice_fiscale}
                onChange={(e) => setForm({ ...form, destinatario_codice_fiscale: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 font-mono"
                placeholder="11223344556"
                maxLength={20}
              />
            </InputField>
            <InputField label="N° Autorizzazione" help="Richiesto per destinatari italiani">
              <input
                type="text"
                value={form.destinatario_num_autorizzazione}
                onChange={(e) => setForm({ ...form, destinatario_num_autorizzazione: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
                placeholder="AUT-2025-001"
                maxLength={50}
              />
            </InputField>
          </FormRow>
        </FormSection>

        {/* Intermediario */}
        <FormSection number="4d" title="Intermediario (opzionale)" color="slate">
          <FormRow cols={3}>
            <InputField label="Denominazione" help="Cerca da anagrafica o digita">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={form.intermediario_denominazione}
                  onChange={(e) => setForm({ ...form, intermediario_denominazione: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
                  placeholder="Intermediario Ambiente Srl"
                  maxLength={255}
                />
                <button type="button" onClick={() => setClientSearchTarget('intermediario')}
                  className="px-2.5 py-2 bg-[#1a2536] border border-[#243044] rounded-lg hover:border-blue-500/50 transition-colors"
                  title="Cerca da anagrafica clienti">
                  <FiSearch className="w-3.5 h-3.5 text-blue-400" />
                </button>
              </div>
            </InputField>
            <InputField label="Codice Fiscale" help="5-20 caratteri">
              <input
                type="text"
                value={form.intermediario_codice_fiscale}
                onChange={(e) => setForm({ ...form, intermediario_codice_fiscale: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 font-mono"
                placeholder="55667788990"
                maxLength={20}
              />
            </InputField>
            <InputField label="N° Iscrizione Albo" help="Formato: XX/000000">
              <input
                type="text"
                value={form.intermediario_num_iscrizione_albo}
                onChange={(e) => setForm({ ...form, intermediario_num_iscrizione_albo: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 font-mono"
                placeholder="RM/098765"
              />
            </InputField>
          </FormRow>
        </FormSection>

        {/* SEZIONE 5: FIR */}
        {["aT", "TR", "T*", "T*aT"].includes(form.causale_operazione) && (
          <FormSection number="5" title="Integrazione FIR (per causali trasporto)" color="blue">
            <FormRow cols={2}>
              <InputField label="Numero FIR" help="Max 20 caratteri. Per transfrontaliero: numero notifica e serie spedizione">
                <input
                  type="text"
                  value={form.numero_fir}
                  onChange={(e) => setForm({ ...form, numero_fir: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
                  placeholder="FIR-2025-00042"
                  maxLength={20}
                />
              </InputField>

              <InputField label="Data Inizio Trasporto">
                <input
                  type="datetime-local"
                  value={form.data_inizio_trasporto}
                  onChange={(e) => setForm({ ...form, data_inizio_trasporto: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
                />
              </InputField>
            </FormRow>

            <div className="flex items-center gap-3 mt-2">
              <input
                type="checkbox"
                id="transfrontaliero"
                checked={form.trasporto_transfrontaliero}
                onChange={(e) => setForm({ ...form, trasporto_transfrontaliero: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-[#141c27] border-[#243044] rounded"
              />
              <label htmlFor="transfrontaliero" className="text-sm text-slate-400">
                Trasporto transfrontaliero
              </label>
            </div>

            {form.trasporto_transfrontaliero && (
              <FormRow cols={1}>
                <InputField label="Tipo Trasporto Transfrontaliero" help="DM=Doc. Movimento (All. I-B), DA=Doc. Accompagnamento (All. VII)">
                  <select
                    value={form.tipo_trasporto_transfrontaliero}
                    onChange={(e) => setForm({ ...form, tipo_trasporto_transfrontaliero: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
                  >
                    <option value="">Seleziona...</option>
                    <option value="DM">DM - Documento di movimento (Allegato I-B Reg. 1013/06)</option>
                    <option value="DA">DA - Documento di accompagnamento (Allegato VII Reg. 1013/06)</option>
                  </select>
                </InputField>
              </FormRow>
            )}
          </FormSection>
        )}

        {/* SEZIONE 6: ESITO */}
        {["aT", "T*aT"].includes(form.causale_operazione) && (
          <FormSection number="6" title="Esito Conferimento (obbligatorio per accettazione)" color="rose">
            <FormRow cols={2}>
              <InputField label="Data Fine Trasporto" help="Arrivo a destinazione (ISO 8601)">
                <input
                  type="datetime-local"
                  value={form.data_fine_trasporto}
                  onChange={(e) => setForm({ ...form, data_fine_trasporto: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
                />
              </InputField>

              <InputField label="Peso Verificato a Destino (kg)" help="Peso effettivo pesato a destinazione">
                <input
                  type="number"
                  step="0.0001"
                  value={form.peso_verificato_destino}
                  onChange={(e) => setForm({ ...form, peso_verificato_destino: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
                  placeholder="980.5000"
                />
              </InputField>
            </FormRow>

            {/* Respingimento */}
            <InputField label="Respingimento" help="Compilare solo in caso di respingimento totale o parziale">
              <FormRow cols={2}>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Tipo Respingimento</label>
                  <select
                    value={form.respingimento_tipo}
                    onChange={(e) => setForm({ ...form, respingimento_tipo: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
                  >
                    <option value="">Nessun respingimento</option>
                    <option value="T">T - Totale</option>
                    <option value="P">P - Parziale</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Causale Respingimento</label>
                  <select
                    value={form.respingimento_causale}
                    onChange={(e) => setForm({ ...form, respingimento_causale: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
                  >
                    <option value="">Non specificata</option>
                    <option value="NC">NC - Non Conformità</option>
                    <option value="IR">IR - Irricevibile</option>
                    <option value="A">A - Altro (specificare)</option>
                  </select>
                </div>
              </FormRow>
              {form.respingimento_tipo === "P" && (
                <FormRow cols={2}>
                  <div className="mt-2">
                    <label className="block text-xs text-slate-500 mb-1">Quantità Respinta</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={form.respingimento_quantita}
                      onChange={(e) => setForm({ ...form, respingimento_quantita: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
                      placeholder="100.0000"
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs text-slate-500 mb-1">Unità Misura</label>
                    <select
                      value={form.respingimento_unita_misura}
                      onChange={(e) => setForm({ ...form, respingimento_unita_misura: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
                    >
                      <option value="kg">kg</option>
                      <option value="l">l</option>
                    </select>
                  </div>
                </FormRow>
              )}
              {form.respingimento_causale === "A" && (
                <div className="mt-2">
                  <label className="block text-xs text-slate-500 mb-1">Motivazione (max 50 caratteri)</label>
                  <input
                    type="text"
                    value={form.respingimento_causale_altro}
                    onChange={(e) => setForm({ ...form, respingimento_causale_altro: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
                    placeholder="Specificare la motivazione..."
                    maxLength={50}
                  />
                </div>
              )}
            </InputField>
          </FormSection>
        )}

        {/* SEZIONE 7: VFU */}
        <FormSection number="7" title="Veicolo Fuori Uso (se applicabile)" color="amber">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="vfu"
              checked={form.veicolo_fuori_uso}
              onChange={(e) => setForm({ ...form, veicolo_fuori_uso: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-[#141c27] border-[#243044] rounded"
            />
            <label htmlFor="vfu" className="text-sm text-slate-400">
              Questo movimento riguarda un Veicolo Fuori Uso
            </label>
          </div>

          {form.veicolo_fuori_uso && (
            <FormRow cols={2}>
              <InputField label="Numero Registro P.S." help="Max 50 caratteri">
                <input
                  type="text"
                  value={form.vfu_numero_registro}
                  onChange={(e) => setForm({ ...form, vfu_numero_registro: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
                  placeholder="VFU-2025-001"
                  maxLength={50}
                />
              </InputField>

              <InputField label="Data Registro">
                <input
                  type="date"
                  value={form.vfu_data_registro}
                  onChange={(e) => setForm({ ...form, vfu_data_registro: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
                />
              </InputField>
            </FormRow>
          )}
        </FormSection>

        {/* SEZIONE 8: ANNOTAZIONI */}
        <FormSection number="8" title="Annotazioni e Note" color="slate">
          <InputField label="Annotazioni (trasmesse a RENTRI)" help="Max 500 caratteri">
            <textarea
              value={form.annotazioni}
              onChange={(e) => setForm({ ...form, annotazioni: e.target.value })}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 resize-none"
              placeholder="Annotazioni ufficiali che verranno trasmesse a RENTRI..."
            />
            <div className="text-xs text-slate-500 mt-1">
              {form.annotazioni.length}/500 caratteri
            </div>
          </InputField>

          <InputField label="Note Interne" help="Solo per uso interno, non trasmesse">
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 resize-none"
              placeholder="Note interne (non verranno trasmesse a RENTRI)..."
            />
          </InputField>
        </FormSection>

      </div>

      {/* Client Search Modal */}
      <ClientSearchModal
        isOpen={!!clientSearchTarget}
        onClose={() => setClientSearchTarget(null)}
        onSelect={handleClientSelected}
        orgId={orgId}
      />
    </div>
  );
}
