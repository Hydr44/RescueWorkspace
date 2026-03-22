// src/pages/RifiutiMovimenti.jsx
/**
 * Gestione Movimenti Carico/Scarico Rifiuti
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import { getRentriEnvironment } from "../lib/rentri-api";
import {
  FiPlus, FiEdit, FiEye, FiTrash2, FiSearch, FiTrendingUp,
  FiTrendingDown, FiRefreshCw, FiSend, FiDownload,
  FiCheckCircle, FiClock, FiAlertCircle, FiX, FiPrinter, FiZap,
  FiMoreVertical, FiInfo
} from "react-icons/fi";
import { useMultiSelect } from "../hooks/useMultiSelect";
import MultiSelectActions from "../components/ui/MultiSelectActions";
import SelectableCheckbox from "../components/ui/SelectableCheckbox";
import AIValidationModal from "../components/rentri/AIValidationModal";
import { printMovimentiList, printMovimento } from "../lib/services/rentriPrintService";
import { supabaseBrowser } from "../lib/supabase-browser";

export default function RifiutiMovimenti() {
  const { orgId } = useOrg();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [registri, setRegistri] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterRegistro, setFilterRegistro] = useState("all");
  const [filterTipo, setFilterTipo] = useState("all");
  const [confirmId, setConfirmId] = useState(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [showAIValidation, setShowAIValidation] = useState(false);
  const [pendingTransmission, setPendingTransmission] = useState(null);
  const [toast, setToast] = useState(null);
  const [creatingTest, setCreatingTest] = useState(false);
  const [filterDataDal, setFilterDataDal] = useState("");
  const [filterDataAl, setFilterDataAl] = useState("");
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [filterStato, setFilterStato] = useState("all");

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  }

  useEffect(() => {
    if (orgId) {
      loadRegistri();
      loadData();
    }
  }, [orgId]);

  async function loadRegistri() {
    try {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("rentri_registri")
        .select("id, anno, numero_registro, tipo, rentri_id, stato")
        .eq("org_id", orgId)
        .in("stato", ["attivo", "bozza", "vidimato"])
        .order("anno", { ascending: false });

      if (error) throw error;
      setRegistri(data || []);
    } catch (error) {
      console.error("Errore caricamento registri:", error);
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const supabase = supabaseBrowser();
      
      let query = supabase
        .from("rentri_movimenti")
        .select("*, registro:registro_id(anno, numero_registro, rentri_id)")
        .eq("org_id", orgId);

      if (filterRegistro !== "all") {
        query = query.eq("registro_id", filterRegistro);
      }

      if (filterTipo !== "all") {
        query = query.eq("tipo_operazione", filterTipo);
      }

      const { data, error } = await query
        .order("data_operazione", { ascending: false })
        .order("progressivo", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRows(data || []);
    } catch (error) {
      console.error("Errore caricamento movimenti:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let result = rows;
    if (q.trim()) {
      const needle = q.toLowerCase();
      result = result.filter((r) =>
        r.codice_eer?.toLowerCase().includes(needle) ||
        r.descrizione_eer?.toLowerCase().includes(needle) ||
        r.descrizione?.toLowerCase().includes(needle) ||
        r.provenienza_destinazione?.toLowerCase().includes(needle) ||
        r.annotazioni?.toLowerCase().includes(needle) ||
        r.causale_operazione?.toLowerCase().includes(needle) ||
        r.rentri_id?.toLowerCase().includes(needle)
      );
    }
    if (filterDataDal) {
      result = result.filter(r => r.data_operazione && r.data_operazione >= filterDataDal);
    }
    if (filterDataAl) {
      result = result.filter(r => r.data_operazione && r.data_operazione <= filterDataAl + 'T23:59:59');
    }
    if (filterStato !== 'all') {
      if (filterStato === 'trasmesso') {
        result = result.filter(r => ['trasmesso', 'synced', 'completato', 'trasmesso_manuale_check'].includes(r.sync_status));
      } else {
        result = result.filter(r => r.sync_status === filterStato || (!r.sync_status && filterStato === 'pending'));
      }
    }
    return result;
  }, [rows, q, filterDataDal, filterDataAl, filterStato]);

  const {
    selectedCount,
    isSelected,
    isAllSelected,
    isSomeSelected,
    toggleSelect,
    toggleSelectAll,
    reset: resetSelection,
    getSelectedIds,
  } = useMultiSelect(filtered, (item) => item?.id);

  async function handleDelete(id) {
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase
        .from("rentri_movimenti")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setRows((prev) => prev.filter((r) => r.id !== id));
      setConfirmId(null);
      showToast("success", "Movimento eliminato.");
    } catch (error) {
      console.error("Errore eliminazione:", error);
      showToast("error", "Errore durante l'eliminazione.");
    }
  }

  async function handleBulkDelete() {
    try {
      const ids = getSelectedIds();
      const supabase = supabaseBrowser();
      const { error } = await supabase
        .from("rentri_movimenti")
        .delete()
        .in("id", ids);

      if (error) throw error;

      setRows((prev) => prev.filter((r) => !ids.includes(r.id)));
      resetSelection();
      setConfirmBulkDelete(false);
      showToast("success", `${ids.length} movimenti eliminati.`);
    } catch (error) {
      console.error("Errore eliminazione multipla:", error);
      showToast("error", "Errore durante l'eliminazione.");
    }
  }

  async function handleSyncFromRentri() {
    if (!orgId) {
      showToast("error", "Nessuna organizzazione selezionata.");
      return;
    }

    setSyncing(true);
    try {
      const apiUrl = import.meta.env.VITE_RENTRI_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri';
      const response = await fetch(`${apiUrl}/movimenti/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          registro_id: filterRegistro !== "all" ? filterRegistro : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Errore sincronizzazione');
      }

      await loadData();
      const errMsg = result.errori?.length > 0 ? ` · ${result.errori.length} errori` : '';
      showToast("success", `Sincronizzati ${result.movimenti_sincronizzati || 0} movimenti.${errMsg}`);
    } catch (error) {
      console.error("Errore sincronizzazione:", error);
      showToast("error", `Errore sincronizzazione: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  }

  // Polling stato transazione RENTRI
  const startPollingTransazione = async (transazioneId, registroId) => {
    const maxAttempts = 60; // Max 5 minuti (60 * 5s)
    let attempts = 0;
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        console.warn("[RENTRI-MOVIMENTI] Polling timeout per transazione:", transazioneId);
        setUploadProgress(prev => prev ? { ...prev, messaggio: "Timeout polling stato transazione" } : null);
        setUploading(false);
        return;
      }
      
      attempts++;
      
      try {
        // 1. Controlla stato transazione (via VPS, bypass Vercel)
        // Passa anche registro_id per garantire coerenza org_id/environment
        const pollingApiUrl = import.meta.env.VITE_RENTRI_POLLING_URL || 'https://rentri-test.rescuemanager.eu';
        const rentriEnv = await getRentriEnvironment(orgId);
        const statusResponse = await fetch(
          `${pollingApiUrl}/api/rentri/transazioni/${transazioneId}/status?org_id=${orgId}&registro_id=${registroId}&environment=${rentriEnv}`,
          { method: 'GET' }
        );
        
        // 303 = transazione completata (redirect a result) - caso di successo!
        if (statusResponse.status === 303) {
          const statusData = await statusResponse.json();
          if (statusData.stato === "completata") {
            // Transazione completata, recupera risultato
            console.log("[RENTRI-MOVIMENTI] Transazione completata, recupero risultato...");
            
            const resultResponse = await fetch(
              `${pollingApiUrl}/api/rentri/transazioni/${transazioneId}/result?org_id=${orgId}&registro_id=${registroId}&environment=${rentriEnv}`,
              { method: 'GET' }
            );
        
            if (!resultResponse.ok) {
              console.error("[RENTRI-MOVIMENTI] Errore recupero risultato:", resultResponse.status);
              setUploadProgress(prev => prev ? { 
                ...prev, 
                messaggio: "Errore recupero risultato transazione" 
              } : null);
              setUploading(false);
              return;
            }
            
            const resultData = await resultResponse.json();
            console.log("[RENTRI-MOVIMENTI] Risultato transazione:", resultData);
            
            // Aggiorna stato e ricarica dati
            setUploadProgress({
              stato: "completato",
              messaggio: "Trasmissione completata con successo",
              transazione_id: transazioneId
            });
            
            // Ricarica dati per vedere lo stato aggiornato
            await loadData();
            
            // Nascondi progresso dopo 3 secondi
            setTimeout(() => {
              setUploadProgress(null);
              setUploading(false);
            }, 3000);
            
            return; // Stop polling
          }
        }
        
        if (!statusResponse.ok) {
          // 401/404 = Endpoint non disponibile o non deployato, ferma il polling
          // Il movimento è stato trasmesso con successo, ma il polling non è disponibile
          if (statusResponse.status === 401 || statusResponse.status === 404) {
            console.warn("[RENTRI-MOVIMENTI] Endpoint polling non disponibile (", statusResponse.status, "), movimento trasmesso ma polling disabilitato");
            setUploadProgress(prev => prev ? { 
              ...prev, 
              messaggio: "Movimento trasmesso. Polling stato non disponibile. Verifica manualmente su RENTRI.",
              stato: "trasmesso_manuale_check"
            } : null);
            // Nascondi progresso dopo 5 secondi
            setTimeout(() => {
              setUploadProgress(null);
              setUploading(false);
            }, 5000);
            return;
          }
          
          // Altri errori: continua polling (potrebbero essere temporanei)
          console.error("[RENTRI-MOVIMENTI] Errore polling status:", statusResponse.status);
          setTimeout(poll, 5000); // Riprova tra 5 secondi
          return;
        }
        
        const statusData = await statusResponse.json();
        
        if (statusResponse.status === 200 && statusData.stato === "in_elaborazione") {
          // Ancora in elaborazione, continua polling
          setUploadProgress(prev => prev ? { 
            ...prev, 
            messaggio: `In elaborazione... (tentativo ${attempts}/${maxAttempts})` 
          } : null);
          setTimeout(poll, 5000); // Riprova tra 5 secondi
          return;
        }
        
        // Altri stati, continua polling
        setTimeout(poll, 5000);
        
      } catch (error) {
        console.error("[RENTRI-MOVIMENTI] Errore polling:", error);
        setTimeout(poll, 5000); // Riprova tra 5 secondi
      }
    };
    
    // Avvia polling dopo 2 secondi (per dare tempo a RENTRI di processare)
    setTimeout(poll, 2000);
  };

  async function handleTrasmettiARentri() {
    const selectedIds = getSelectedIds();
    
    if (selectedIds.length === 0) {
      showToast("error", "Seleziona almeno un movimento da trasmettere.");
      return;
    }

    // Raggruppa movimenti per registro_id
    const movimentiPerRegistro = {};
    selectedIds.forEach(id => {
      const movimento = rows.find(m => m.id === id);
      if (movimento && movimento.registro_id) {
        if (!movimentiPerRegistro[movimento.registro_id]) {
          movimentiPerRegistro[movimento.registro_id] = [];
        }
        movimentiPerRegistro[movimento.registro_id].push(id);
      }
    });

    const registriIds = Object.keys(movimentiPerRegistro);
    
    if (registriIds.length === 0) {
      showToast("error", "Nessun movimento valido con registro associato selezionato.");
      return;
    }

    if (registriIds.length > 1) {
      showToast("error", "Seleziona movimenti di un solo registro alla volta.");
      return;
    }

    const registroId = registriIds[0];
    const movimentoIds = movimentiPerRegistro[registroId];

    // Verifica che il registro abbia rentri_id
    const registro = registri.find(r => r.id === registroId);
    if (!registro || !registro.rentri_id) {
      showToast("error", "Il registro deve essere creato su RENTRI prima di trasmettere i movimenti. Vai alla pagina Registri.");
      return;
    }

    // Filtra solo movimenti in stato "pending" o "error" — esclude già trasmessi
    const movimentiDaTrasmettere = movimentoIds.filter(id => {
      const m = rows.find(r => r.id === id);
      return !m || ["pending", "error"].includes(m.sync_status);
    });

    if (movimentiDaTrasmettere.length === 0) {
      showToast("info", "Tutti i movimenti selezionati sono già stati trasmessi a RENTRI.");
      return;
    }

    if (movimentiDaTrasmettere.length < movimentoIds.length) {
      showToast("info", `${movimentoIds.length - movimentiDaTrasmettere.length} movimenti già trasmessi esclusi automaticamente.`);
    }

    // Prepara dati per validazione IA (prima movimento selezionato)
    const primoMovimento = rows.find(m => movimentiDaTrasmettere.includes(m.id));
    if (primoMovimento) {
      // Salva dati trasmissione per dopo la validazione
      setPendingTransmission({
        registroId,
        movimentoIds: movimentiDaTrasmettere,
        registro
      });
      
      // Apri modal validazione IA
      setShowAIValidation(true);
      return;
    }

    // Se non c'è movimento valido, procedi direttamente
    proceedWithTransmission(registroId, movimentiDaTrasmettere);
  }

  async function proceedWithTransmission(registroId, movimentoIds) {
    setUploading(true);
    setUploadProgress({
      stato: "in_trasmissione",
      messaggio: "Preparazione trasmissione...",
      transazione_id: null
    });

    try {
      if (!orgId) {
        showToast("error", "Seleziona un'organizzazione dal menu in alto.");
        return;
      }

      const apiUrl = import.meta.env.VITE_RENTRI_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri';
      const response = await fetch(`${apiUrl}/registri/${registroId}/movimenti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          org_id: orgId,
          movimenti_ids: movimentoIds
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Se ci sono errori di validazione, mostra i dettagli
        if (result.errori_validazione && result.errori_validazione.length > 0) {
          const erroriDettagli = result.errori_validazione.map((err) => {
            const movimento = rows.find(m => m.id === err.movimento_id);
            const movimentoInfo = movimento 
              ? `Movimento ${movimento.codice_eer || movimento.id} (${movimento.causale_operazione || 'N/A'})`
              : `Movimento ${err.movimento_id}`;
            const erroriLista = Array.isArray(err.errori) 
              ? err.errori.join('\n  - ')
              : (err.errori || 'Errore sconosciuto');
            return `${movimentoInfo}:\n  - ${erroriLista}`;
          }).join('\n\n');
          
          throw new Error(
            `${result.error || 'Errore validazione'}:\n\n${erroriDettagli}`
          );
        }
        
        // Mostra dettagli completi dell'errore
        const errorMessage = result.error || 'Errore trasmissione';
        const errorDetails = result.details 
          ? (typeof result.details === 'string' ? result.details : JSON.stringify(result.details, null, 2))
          : '';
        
        throw new Error(
          errorDetails 
            ? `${errorMessage}\n\nDettagli:\n${errorDetails}`
            : errorMessage
        );
      }

      setUploadProgress({
        stato: "trasmesso",
        messaggio: `Trasmessi ${result.movimenti_trasmessi} movimenti`,
        transazione_id: result.transazione_id,
        errori_validazione: result.errori_validazione
      });

      // Persisti sync_status nel DB (il VPS potrebbe non aggiornarlo)
      const idsTrasmessi = result.movimenti_ids?.length > 0 ? result.movimenti_ids : movimentoIds;
      if (idsTrasmessi.length > 0) {
        const supabase = supabaseBrowser();
        await supabase
          .from('rentri_movimenti')
          .update({ sync_status: 'trasmesso' })
          .in('id', idsTrasmessi)
          .eq('org_id', orgId);
      }

      // Aggiornamento ottimistico immediato: aggiorna in memoria prima di loadData()
      // evita race condition tra scrittura DB e rilettura
      setRows(prev => prev.map(r =>
        idsTrasmessi.includes(r.id) ? { ...r, sync_status: 'trasmesso' } : r
      ));

      // Reset selezione
      resetSelection();

      // Ricarica i dati per conferma dal DB
      await loadData();

      // Avvia polling stato transazione (se presente)
      // Il polling si occuperà di nascondere il progresso quando completato
      if (result.transazione_id) {
        console.log("[RENTRI-MOVIMENTI] Avvio polling transazione:", result.transazione_id);
        startPollingTransazione(result.transazione_id, registroId);
        // Non nascondere il progresso, il polling lo farà quando completato
        return; // Esci dalla funzione, il polling gestirà il cleanup
      }

    } catch (error) {
      console.error("Errore trasmissione:", error);
      setUploadProgress({
        stato: "errore",
        messaggio: `Errore: ${error.message}`,
        transazione_id: null
      });
    } finally {
      // Nascondi il progresso solo se non c'è una transazione_id in polling
      // (controllo uploadProgress che è stato aggiornato nel try)
      const hasTransaction = uploadProgress?.transazione_id;
      if (!hasTransaction) {
        setTimeout(() => {
          setUploadProgress(null);
          setUploading(false);
        }, 5000);
      }
    }
  }

  async function handleCreateTestMovimento() {
    if (!orgId) return;
    setCreatingTest(true);
    try {
      const supabase = supabaseBrowser();
      // Prendi il primo registro disponibile
      // Preferisce registro con rentri_id (già creato su RENTRI) per test trasmissione
      const { data: regs } = await supabase
        .from('rentri_registri')
        .select('id, anno, numero_registro, rentri_id')
        .eq('org_id', orgId)
        .in('stato', ['attivo', 'bozza'])
        .order('created_at', { ascending: false });
      const registroConRentri = regs?.find(r => r.rentri_id);
      const registroId = registroConRentri?.id || regs?.[0]?.id || null;
      const registroUsato = registroConRentri || regs?.[0] || null;
      const now = new Date();
      const payload = {
        org_id: orgId,
        registro_id: registroId,
        tipo_operazione: 'carico',
        causale_operazione: 'NP',
        codice_eer: '160104',
        descrizione_eer: 'Veicoli fuori uso',
        stato_fisico: 'S',
        destinato_attivita: 'R4',
        quantita: 1200,
        unita_misura: 'kg',
        provenienza_codice: 'S',
        provenienza_destinazione: 'Autodemolizioni Test Srl',
        data_operazione: now.toISOString().split('T')[0],
        data_ora_registrazione: now.toISOString(),
        anno: now.getFullYear(),
        progressivo: 1,
        sync_status: 'pending',
        note: 'Movimento creato automaticamente per test',
        annotazioni: 'Test movimento NP - Nuova Produzione VFU',
      };
      const { error } = await supabase.from('rentri_movimenti').insert(payload);
      if (error) throw error;
      await loadData();
      const labelReg = registroUsato ? `${registroUsato.numero_registro || registroUsato.anno}${registroUsato.rentri_id ? ' RENTRI' : ''}` : null;
      showToast('success', `Movimento di test creato${labelReg ? ` (registro: ${labelReg})` : ' (senza registro)'}`);
    } catch (err) {
      showToast('error', 'Errore creazione test: ' + err.message);
    } finally {
      setCreatingTest(false);
    }
  }

  function handleAIConfirm(validationResult) {
    // L'utente ha confermato dopo aver visto gli alert IA
    if (pendingTransmission) {
      proceedWithTransmission(
        pendingTransmission.registroId,
        pendingTransmission.movimentoIds
      );
    }
    setPendingTransmission(null);
    setShowAIValidation(false);
  }

  function handleAIClose() {
    setShowAIValidation(false);
    setPendingTransmission(null);
  }

  // Prepara dati movimento per validazione IA
  const movimentoForAI = pendingTransmission 
    ? rows.find(m => pendingTransmission.movimentoIds.includes(m.id))
    : null;

  const CAUSALE_LABELS = {
    NP: 'Nuova Produzione', DT: 'Deposito Temporaneo', RE: 'Recupero/Smaltimento',
    I: 'Giacenza', aT: 'Accett. Trasporto', TR: 'Trasporto Uscita',
    'T*': 'Trasporto Transfr.', 'T*aT': 'Accett. Transfr.', M: 'Materiali'
  };

  const SyncStatusBadge = ({ syncStatus }) => {
    const config = {
      pending:                { icon: FiClock,        textColor: "text-amber-400",   bgColor: "bg-amber-500/8",    label: "Da trasmettere" },
      in_trasmissione:        { icon: FiRefreshCw,    textColor: "text-blue-400",    bgColor: "bg-blue-500/8",     label: "In trasmissione", spin: true },
      trasmesso:              { icon: FiCheckCircle,  textColor: "text-sky-400",     bgColor: "bg-sky-500/8",      label: "Trasmesso" },
      trasmesso_manuale_check:{ icon: FiCheckCircle,  textColor: "text-sky-400",     bgColor: "bg-sky-500/8",      label: "Trasmesso" },
      synced:                 { icon: FiCheckCircle,  textColor: "text-sky-400",     bgColor: "bg-sky-500/8",      label: "RENTRI" },
      completato:             { icon: FiCheckCircle,  textColor: "text-sky-400",     bgColor: "bg-sky-500/8",      label: "Completato" },
      error:                  { icon: FiAlertCircle,  textColor: "text-red-400",     bgColor: "bg-red-500/8",      label: "Errore" },
    };

    const c = config[syncStatus] || config.pending;
    const Icon = c.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${c.textColor} ${c.bgColor}`}>
        <Icon className={`w-3 h-3 ${c.spin ? 'animate-spin' : ''}`} />
        {c.label}
      </span>
    );
  };

  // Contatori per KPI
  const countCarico = rows.filter(r => r.tipo_operazione === 'carico').length;
  const countScarico = rows.filter(r => r.tipo_operazione === 'scarico').length;
  const countTrasmessi = rows.filter(r => ['trasmesso', 'synced', 'completato', 'trasmesso_manuale_check'].includes(r.sync_status)).length;
  const countPending = rows.filter(r => !r.sync_status || r.sync_status === 'pending').length;

  return (
    <div className="space-y-3">
      {/* Toast */}
      {toast && (
        <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-xs font-medium transition-all ${
          toast.type === 'success' ? 'bg-sky-500/8 border-sky-500/15 text-sky-400' :
          toast.type === 'error'   ? 'bg-red-500/8 border-red-500/15 text-red-400' :
          'bg-blue-500/8 border-blue-500/15 text-blue-400'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <FiCheckCircle className="w-3.5 h-3.5" /> : <FiAlertCircle className="w-3.5 h-3.5" />}
            {toast.msg}
          </div>
          <button onClick={() => setToast(null)} className="p-0.5 hover:opacity-70"><FiX className="w-3 h-3" /></button>
        </div>
      )}

      {/* Header — pulito, azioni raggruppate */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Movimenti</h1>
          <p className="text-xs text-slate-500 mt-0.5">{rows.length} registrazioni · {countTrasmessi} trasmesse a RENTRI</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Azioni principali */}
          {selectedCount > 0 && (
            <button
              onClick={handleTrasmettiARentri}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {uploading ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiSend className="w-3.5 h-3.5" />}
              Trasmetti ({selectedCount})
            </button>
          )}
          <button onClick={() => navigate("/rifiuti/movimenti/nuovo")} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            <FiPlus className="w-3.5 h-3.5" />Nuovo
          </button>
          {/* Menu azioni secondarie */}
          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] hover:text-slate-200 transition-colors"
            >
              <FiMoreVertical className="w-3.5 h-3.5" />
            </button>
            {showActionsMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowActionsMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-52 bg-[#1e2d42] border border-[#2d3f56] rounded-lg shadow-xl z-50 py-1">
                  <button onClick={() => { loadData(); setShowActionsMenu(false); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:bg-[#243044] transition-colors">
                    <FiRefreshCw className="w-3.5 h-3.5 text-slate-500" />Aggiorna lista
                  </button>
                  <button onClick={() => { handleSyncFromRentri(); setShowActionsMenu(false); }} disabled={syncing} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:bg-[#243044] transition-colors disabled:opacity-50">
                    <FiDownload className="w-3.5 h-3.5 text-slate-500" />{syncing ? 'Sincronizzazione...' : 'Sincronizza da RENTRI'}
                  </button>
                  <button onClick={() => { printMovimentiList(filtered, { registro: filterRegistro !== 'all' ? filterRegistro : null, tipo: filterTipo !== 'all' ? filterTipo : null, data_from: filterDataDal || null, data_to: filterDataAl || null }); setShowActionsMenu(false); }} disabled={filtered.length === 0} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:bg-[#243044] transition-colors disabled:opacity-40">
                    <FiPrinter className="w-3.5 h-3.5 text-slate-500" />Stampa lista
                  </button>
                  <div className="border-t border-[#2d3f56] my-1" />
                  <button onClick={() => { handleCreateTestMovimento(); setShowActionsMenu(false); }} disabled={creatingTest} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:bg-[#243044] transition-colors disabled:opacity-50">
                    <FiZap className="w-3.5 h-3.5 text-amber-500" />{creatingTest ? 'Creazione...' : 'Crea movimento test'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info banner RENTRI — aiuta comprensione operatore */}
      {countPending > 0 && (
        <div className="flex items-start gap-2.5 px-3.5 py-2.5 bg-amber-500/5 border border-amber-500/10 rounded-lg">
          <FiInfo className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-slate-400">
            <span className="text-amber-400 font-medium">{countPending} movimenti</span> da trasmettere. Seleziona con il checkbox e clicca <span className="font-medium text-slate-300">Trasmetti</span>. 
            I movimenti trasmessi a RENTRI <span className="font-medium text-slate-300">non sono modificabili</span> — è possibile solo l&apos;annullamento tramite portale RENTRI.
          </p>
        </div>
      )}

      {/* Filtri compatti */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Cerca EER, descrizione, provenienza..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/30 outline-none"
          />
        </div>
        <select
          value={filterRegistro}
          onChange={(e) => setFilterRegistro(e.target.value)}
          className="px-2.5 py-1.5 text-xs bg-[#141c27] border border-[#243044] rounded-lg text-slate-300 focus:ring-1 focus:ring-blue-500/30 outline-none"
        >
          <option value="all">Tutti i registri</option>
          {registri.map((reg) => (
            <option key={reg.id} value={reg.id}>
              {reg.anno}/{reg.numero_registro || '—'}{reg.rentri_id ? ' ✓' : ''}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1.5">
          <input type="date" value={filterDataDal} onChange={(e) => setFilterDataDal(e.target.value)} className="px-2 py-1.5 text-xs bg-[#141c27] border border-[#243044] rounded-lg text-slate-300 focus:ring-1 focus:ring-blue-500/30 outline-none w-[120px]" />
          <span className="text-[10px] text-slate-600">→</span>
          <input type="date" value={filterDataAl} onChange={(e) => setFilterDataAl(e.target.value)} className="px-2 py-1.5 text-xs bg-[#141c27] border border-[#243044] rounded-lg text-slate-300 focus:ring-1 focus:ring-blue-500/30 outline-none w-[120px]" />
          {(filterDataDal || filterDataAl) && (
            <button onClick={() => { setFilterDataDal(""); setFilterDataAl(""); }} className="p-1 text-slate-500 hover:text-slate-300 transition-colors" title="Azzera date"><FiX className="w-3 h-3" /></button>
          )}
        </div>
        {/* Filtri tipo + stato — pills */}
        <div className="flex items-center gap-1 border-l border-[#243044] pl-2 ml-1">
          {[
            { value: 'all', label: 'Tutti' },
            { value: 'carico', label: `Carico (${countCarico})` },
            { value: 'scarico', label: `Scarico (${countScarico})` },
          ].map(t => (
            <button
              key={t.value}
              onClick={() => setFilterTipo(t.value)}
              className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${
                filterTipo === t.value ? 'bg-blue-500/10 text-blue-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 border-l border-[#243044] pl-2 ml-1">
          {[
            { value: 'all', label: 'Tutti' },
            { value: 'pending', label: 'Da trasmettere' },
            { value: 'trasmesso', label: 'Trasmessi' },
            { value: 'error', label: 'Errore' },
          ].map(t => (
            <button
              key={t.value}
              onClick={() => setFilterStato(t.value)}
              className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${
                filterStato === t.value ? 'bg-blue-500/10 text-blue-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table — design pulito SaaS */}
      <div className="bg-[#1a2536]/50 rounded-xl border border-[#243044] overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#243044]">
              <th className="px-3 py-2.5 text-left w-8">
                <SelectableCheckbox
                  checked={isAllSelected}
                  indeterminate={isSomeSelected}
                  onChange={() => toggleSelectAll()}
                />
              </th>
              <th className="px-3 py-2.5 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">Data</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">Causale</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">Rifiuto</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">Quantità</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">Provenienza / Destinazione</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">Stato</th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#243044]/20">
            {loading ? (
              <tr><td colSpan="8" className="px-3 py-10 text-center text-slate-500 text-xs">Caricamento movimenti...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="8" className="px-3 py-10 text-center text-slate-500 text-xs">Nessun movimento trovato{q ? ` per "${q}"` : ''}</td></tr>
            ) : (
              filtered.map((row) => {
                const isTransmitted = ['trasmesso', 'synced', 'trasmesso_manuale_check', 'completato'].includes(row.sync_status);
                const causaleLabel = CAUSALE_LABELS[row.causale_operazione] || row.causale_operazione;
                return (
                  <tr
                    key={row.id}
                    className="group hover:bg-[#141c27]/40 transition-colors cursor-pointer"
                    onClick={() => navigate(`/rifiuti/movimenti/${row.id}`)}
                  >
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <SelectableCheckbox checked={isSelected(row)} onChange={() => toggleSelect(row)} />
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-slate-200 font-medium">{new Date(row.data_operazione).toLocaleDateString("it-IT")}</div>
                      {row.registro && (
                        <div className="text-[10px] text-slate-600 mt-0.5">
                          Reg. {row.registro.anno}/{row.registro.numero_registro}
                          {!row.registro.rentri_id && <span className="text-amber-400/70 ml-1">⚠ non su RENTRI</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        {row.tipo_operazione === 'carico'
                          ? <FiTrendingUp className="w-3 h-3 text-teal-400" />
                          : <FiTrendingDown className="w-3 h-3 text-amber-400" />
                        }
                        <span className="text-slate-300">{row.causale_operazione}</span>
                      </div>
                      <div className="text-[10px] text-slate-600 mt-0.5">{causaleLabel}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-blue-400">{row.codice_eer}</span>
                      </div>
                      {(row.descrizione_eer || row.descrizione) && (
                        <div className="text-[10px] text-slate-600 mt-0.5 truncate max-w-[180px]">{row.descrizione_eer || row.descrizione}</div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-slate-200 font-medium tabular-nums">{row.quantita}</span>
                      <span className="text-slate-500 ml-1">{row.unita_misura}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-slate-400 truncate max-w-[200px]">{row.provenienza_destinazione || "—"}</div>
                    </td>
                    <td className="px-3 py-2">
                      <SyncStatusBadge syncStatus={row.sync_status || "pending"} />
                      {row.rentri_id && (
                        <div className="text-[9px] text-sky-400/60 font-mono mt-0.5 truncate max-w-[100px]" title={row.rentri_id}>{row.rentri_id}</div>
                      )}
                    </td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/rifiuti/movimenti/${row.id}`); }} className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors" title={isTransmitted ? 'Visualizza (sola lettura)' : 'Modifica'}>
                          {isTransmitted ? <FiEye className="w-3.5 h-3.5" /> : <FiEdit className="w-3.5 h-3.5" />}
                        </button>
                        {!isTransmitted && (
                          <button onClick={(e) => { e.stopPropagation(); setConfirmId(row.id); }} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors" title="Elimina">
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Multi-select Actions */}
      {selectedCount > 0 && (
        <MultiSelectActions
          selectedCount={selectedCount}
          onBulkDelete={() => setConfirmBulkDelete(true)}
          onBulkExport={() => {/* TODO */}}
          onClearSelection={resetSelection}
          actions={[
            {
              label: uploading ? "Trasmissione..." : "Trasmetti a RENTRI",
              icon: <FiSend className="inline w-3.5 h-3.5" />,
              onClick: handleTrasmettiARentri,
              disabled: uploading,
              variant: 'success'
            }
          ]}
        />
      )}

      {/* Upload Progress Modal */}
      {uploadProgress && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a2536] rounded-xl p-5 max-w-md w-full mx-4 border border-[#243044]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-200">
                Trasmissione a RENTRI
              </h3>
              <button
                onClick={() => setUploadProgress(null)}
                className="p-1 hover:bg-[#1a2536] rounded transition-colors"
              >
                <FiX className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              {uploadProgress.stato === "in_trasmissione" && (
                <div className="flex items-center gap-3">
                  <FiRefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                  <p className="text-slate-400">{uploadProgress.messaggio}</p>
                </div>
              )}
              
              {(uploadProgress.stato === "trasmesso" || uploadProgress.stato === "trasmesso_manuale_check" || uploadProgress.stato === "completato") && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <FiCheckCircle className="w-4 h-4 text-sky-400" />
                    <p className="text-slate-300 font-medium">{uploadProgress.messaggio}</p>
                  </div>
                  {uploadProgress.transazione_id && (
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded p-3">
                      <p className="text-xs text-slate-500 mb-1">Codice Transazione RENTRI:</p>
                      <p className="text-sm text-blue-400 font-mono break-all select-all">
                        {uploadProgress.transazione_id}
                      </p>
                    </div>
                  )}
                  {uploadProgress.errori_validazione && uploadProgress.errori_validazione.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
                      <p className="text-xs text-yellow-400 font-medium mb-1">
                         {uploadProgress.errori_validazione.length} movimenti con errori di validazione
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => { setUploadProgress(null); setUploading(false); }}
                    className="w-full px-3 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Chiudi
                  </button>
                </div>
              )}
              
              {uploadProgress.stato === "errore" && (
                <div className="flex items-center gap-3">
                  <FiAlertCircle className="w-4 h-4 text-red-400" />
                  <p className="text-red-400">{uploadProgress.messaggio}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a2536] rounded-xl p-5 max-w-md w-full mx-4 border border-[#243044]">
            <h3 className="text-sm font-semibold text-slate-200 mb-2">
              Conferma Eliminazione
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Sei sicuro di voler eliminare questo movimento? L'azione è irreversibile.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmId(null)}
                className="px-3 py-1.5 text-xs font-medium bg-[#1a2536] border border-[#243044] hover:bg-[#243044] text-slate-200 rounded-lg transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={() => handleDelete(confirmId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a2536] rounded-xl p-5 max-w-md w-full mx-4 border border-[#243044]">
            <h3 className="text-sm font-semibold text-slate-200 mb-2">
              Elimina {selectedCount} Movimenti
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Sei sicuro di voler eliminare {selectedCount} movimenti selezionati?
              L'azione è irreversibile.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmBulkDelete(false)}
                className="px-3 py-1.5 text-xs font-medium bg-[#1a2536] border border-[#243044] hover:bg-[#243044] text-slate-200 rounded-lg transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Elimina Tutto
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Modal Validazione IA */}
      {showAIValidation && movimentoForAI && (
        <AIValidationModal
          isOpen={showAIValidation}
          onClose={handleAIClose}
          onConfirm={handleAIConfirm}
          tipoEntita="movimento"
          entitaId={movimentoForAI.id}
          orgId={orgId}
          datiEntita={movimentoForAI}
        />
      )}
    </div>
  );
}

