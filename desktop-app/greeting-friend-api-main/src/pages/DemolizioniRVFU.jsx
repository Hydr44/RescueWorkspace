import React, { useState, useEffect, useRef } from 'react';
import { 
  FiPlus, FiSearch, FiRefreshCw, FiFileText, FiEdit2, FiTrash2, 
  FiBarChart, FiDownload, FiAlertTriangle, FiCalendar,
  FiUser, FiTruck, FiCheckCircle, FiClock, FiLogIn, FiX, FiPrinter
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase-browser';
import rvfuIcon from '@/assets/icons/icons8/icons8-auto-50-10.png';
import { useOrg } from '@/context/OrgContext';
import { useToast } from '@/hooks/useToast';
import { useRVFUAuth } from '@/hooks/useRVFUAuth';
import { createRVFUClient } from '@/lib/rvfu-client';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import LoadingButton from '@/components/ui/LoadingButton';
import RVFULogin from '@/components/rvfu/RVFULogin';
import RVFUDashboard from '@/components/rvfu/RVFUDashboard';
import RVFUExportImport from '@/components/rvfu/RVFUExportImport';
import RVFUErrorManager from '@/components/rvfu/RVFUErrorManager';
import VFUProcessingTimeline from '@/components/rvfu/VFUProcessingTimeline';
import { isRVFUMockMode, setRVFUMockMode, mockVerificaVeicolo, mockListaVFU } from '@/lib/rvfu-mock';
import { logger } from '@/lib/logger';
import { normalizeCausale } from '@/lib/rvfu-mapper';
import { printSchedaDemolizione } from '@/lib/services/rentriPrintService';

const TABLE = "demolition_cases";

// Componente CaseCard migliorato
const PROCESSING_STEP_STYLES = {
  accettazione: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Accettazione' },
  messa_in_sicurezza: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Messa in sicurezza' },
  bonifica: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Bonifica' },
  smontaggio_ricambi: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Smontaggio ricambi' },
  smontaggio_componenti: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', label: 'Smontaggio componenti' },
  pesatura: { bg: 'bg-orange-500/10', text: 'text-orange-400', label: 'Pesatura' },
  radiazione_pra: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Radiazione PRA' },
  conferimento: { bg: 'bg-slate-500/10', text: 'text-slate-400', label: 'Conferimento' },
  completato: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Completato' },
};

const CaseCard = ({ case_, onEdit, onDelete, onSync, onView, index }) => {
  const getStatusBadge = (case_) => {
    if (case_.rvfu_id) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-green-500/10 text-green-400 rounded-full">
          <FiCheckCircle className="h-3 w-3" />
          RVFU Sincronizzato
        </span>
      );
    }
    // Show processing step status
    if (case_.processing_status && case_.processing_status !== 'accettazione') {
      const stepStyle = PROCESSING_STEP_STYLES[case_.processing_status] || PROCESSING_STEP_STYLES.accettazione;
      return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium ${stepStyle.bg} ${stepStyle.text} rounded-full`}>
          <FiClock className="h-3 w-3" />
          {stepStyle.label}
        </span>
      );
    }
    if (case_.stato === 'completata') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-yellow-500/10 text-yellow-400 rounded-full">
          <FiClock className="h-3 w-3" />
          Pronto per RVFU
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-[#141c27] text-slate-200 rounded-full">
        <FiFileText className="h-3 w-3" />
        {case_.stato || 'Nuovo'}
      </span>
    );
  };

  return (
    <div
      onClick={() => onView(case_)}
      className="group relative bg-[#141c27] rounded-lg shadow border border-[#243044]  hover: transition-colors cursor-pointer overflow-hidden animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Gradiente di sfondo */}
      <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/10 rounded-md">
              <img
                src={rvfuIcon}
                alt="RVFU"
                className="h-4 w-4"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-slate-200">
                {case_.targa || 'N/A'}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-slate-400">
                  {case_.marca_modello} - {case_.anno}
                </p>
                {/* Badge PRA se disponibile */}
                {case_.obbligoIscrizionePRA && (
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium rounded ${
                    case_.obbligoIscrizionePRA === 'S' 
                      ? 'bg-blue-500/10 text-blue-400' 
                      : 'bg-[#141c27] text-slate-400  '
                  }`}>
                    {case_.obbligoIscrizionePRA === 'S' ? 'PRA' : 'No PRA'}
                  </span>
                )}
              </div>
            </div>
          </div>
          {getStatusBadge(case_)}
        </div>

        {/* Dettagli */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <FiUser className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">Cliente: {case_.clients?.nome} {case_.clients?.surname}</span>
          </div>
          {case_.transports && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <FiTruck className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">Trasporto: {case_.transports.driver_id} - {case_.transports.client_id}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <FiCalendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Creato: {new Date(case_.created_at).toLocaleDateString('it-IT')}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {/* Mostra pulsante Sincronizza solo per casi locali non ancora sincronizzati */}
          {!case_._fromRVFU && (
            <button
              onClick={(e) => { e.stopPropagation(); onSync(case_.id); }}
              disabled={!!case_.rvfu_id}
              className="flex-1 px-2 py-1.5 text-xs bg-[#1a2536] text-blue-400 border border-blue-500/20 rounded-md hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiRefreshCw className="h-3 w-3" />
              Sincronizza
            </button>
          )}
          {/* Per i casi da RVFU, mostra pulsante Dettaglio invece di Modifica */}
          {case_._fromRVFU ? (
            <button
              onClick={(e) => { e.stopPropagation(); onView(case_); }}
              className="flex-1 px-2 py-1.5 text-xs bg-[#1a2536] text-blue-400 border border-blue-500/20 rounded-md hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <FiFileText className="h-3 w-3" />
              Dettaglio
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(case_.id); }}
              className="flex-1 px-2 py-1.5 text-xs bg-[#1a2536] text-slate-300 border border-[#243044] rounded-md hover:bg-[#141c27]  transition-colors flex items-center justify-center gap-1.5"
            >
              <FiEdit2 className="h-3 w-3" />
              Modifica
            </button>
          )}
          {/* Non mostrare Elimina per casi da RVFU */}
          {!case_._fromRVFU && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(case_.id); }}
              className="px-2 py-1.5 text-xs bg-red-500/10 text-white rounded-md hover:bg-red-600 transition-colors flex items-center justify-center"
            >
              <FiTrash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente FilterBar migliorato
const FilterBar = ({ searchQuery, setSearchQuery, selectedStatus, setSelectedStatus }) => (
  <div className="bg-[#141c27] rounded-lg shadow border border-[#243044]  p-3 mb-4">
    <div className="flex flex-col lg:flex-row gap-3">
      <div className="flex-1">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cerca per targa, telaio, cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm border border-[#243044] rounded-md bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-transparent transition-colors"
          />
        </div>
      </div>
      <div className="lg:w-48">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-[#243044] rounded-md bg-[#1a2536] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-transparent transition-colors"
        >
          <option value="all">Tutti gli stati</option>
          <option value="rvfu_synced">RVFU Sincronizzati</option>
          <option value="rvfu_pending">Pronti per RVFU</option>
          <option value="draft">Bozze</option>
          <optgroup label="Fase lavorazione">
            <option value="step_accettazione">Accettazione</option>
            <option value="step_messa_in_sicurezza">Messa in sicurezza</option>
            <option value="step_bonifica">Bonifica</option>
            <option value="step_smontaggio_ricambi">Smontaggio ricambi</option>
            <option value="step_smontaggio_componenti">Smontaggio componenti</option>
            <option value="step_pesatura">Pesatura</option>
            <option value="step_radiazione_pra">Radiazione PRA</option>
            <option value="step_conferimento">Conferimento</option>
            <option value="step_completato">Completato</option>
          </optgroup>
        </select>
      </div>
    </div>
  </div>
);

export default function DemolizioniRVFU() {
  const navigate = useNavigate();
  const { orgId } = useOrg();
  const { showError, showSuccess } = useToast();
  const { 
    isAuthenticated: rvfuAuthenticated, 
    logout: rvfuLogout,
    tokens: rvfuTokens,
    reloadState: rvfuReloadState,
    authService,
  } = useRVFUAuth('formation');

  // State
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCase, setSelectedCase] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [showExportImport, setShowExportImport] = useState(false);
  const [showErrorManager, setShowErrorManager] = useState(false);
  const [showRVFULogin, setShowRVFULogin] = useState(false);

  // Load cases from RVFU API if authenticated, otherwise from Supabase
  const loadCases = async () => {
    if (!orgId) return;
    
    setLoading(true);
    try {
      // Se autenticato con RVFU, carica da API RVFU
      if (rvfuAuthenticated && authService) {
        try {
          // Usa direttamente authService invece di creare un adapter
          // authService.getAuthHeader() usa idToken (come specificato nel manuale sezione 5.3 punto 7)
          // TEST: Usa BrowserWindow per le API calls (visibile per debug)
          const rvfuClient = createRVFUClient(authService, 'formation', true);
          
          // Costruisci filtri per la ricerca
          const filters = {
            pageNumber: 0,
            pageSize: 100,
            paged: true,
          };
          
          // Applica filtri se presenti
          if (searchQuery) {
            // Prova a cercare per targa o telaio
            if (/^[A-Z0-9]{2,10}$/i.test(searchQuery.trim())) {
              filters.targa = searchQuery.trim();
            } else {
              filters.telaio = searchQuery.trim();
            }
          }
          
          if (selectedStatus !== 'all') {
            // Mappa gli stati locali agli stati RVFU
            const statoMap = {
              'rvfu_synced': undefined, // Mostra tutti quelli sincronizzati (qualsiasi stato tranne INSERITO)
              'rvfu_pending': 'INSERITO',
              'draft': undefined,
            };
            if (statoMap[selectedStatus]) {
              filters.statoVFU = statoMap[selectedStatus];
            }
          }

          const response = await rvfuClient.consultaVFUConcessionario(filters);
          const vfuList = response.payload?.content || response.result?.content || [];
          
          // Converti VFUBean in formato compatibile con la UI esistente
          const mappedCases = vfuList.map((vfu) => {
            // VFUBean ha i dati direttamente, non in un oggetto veicolo
            const intestatario = vfu.intestatario;
            return {
              id: `rvfu_${vfu.idVFU}`, // ID virtuale per distinguere da Supabase
              rvfu_id: vfu.idVFU,
              targa: vfu.targa || '',
              telaio: vfu.telaio || '',
              marca_modello: vfu.veicolo?.modello || vfu.descrizioneVeicolo || 'N/A',
              anno: vfu.veicolo?.dataPrimaImmatricolazione?.substring(0, 4) || undefined,
              stato: vfu.statoVFU || vfu.statoVfuEnum || 'sconosciuto',
              rvfu_status: vfu.statoVFU || vfu.statoVfuEnum,
              rvfu_sync_date: vfu.dataRegistrazione || vfu.dataUltimoAggiornamento,
              created_at: vfu.dataRegistrazione || new Date().toISOString(),
              // Dati intestatario
              clients: intestatario ? {
                nome: intestatario.nome || '',
                surname: intestatario.cognome || '',
              } : null,
              // Flag per indicare che viene da RVFU
              _fromRVFU: true,
              // Salva l'intero oggetto VFU per accesso ai dettagli completi
              _vfuData: vfu,
            };
          });

          setCases(mappedCases);
          return;
        } catch (rvfuError) {
          logger.error('Error loading from RVFU API, falling back to Supabase:', rvfuError);
          // Fallback a Supabase in caso di errore API
          showError('Errore nel caricamento da RVFU, uso dati locali');
        }
      }

      // Fallback: carica da Supabase (casi locali non ancora sincronizzati)
      const { data, error } = await supabase
        .from(TABLE)
        .select(`
          *,
          clients:client_id (
            id,
            nome,
            surname,
            phone,
            email
          ),
          transports:transport_id (
            id,
            driver_id,
            client_id
          ),
          vfu_processing_steps (
            id,
            step_code,
            step_order,
            step_label,
            status,
            deadline_at,
            completed_at
          )
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Marca i casi come locali (non da RVFU)
      const localCases = (data || []).map(c => ({ ...c, _fromRVFU: false }));
      setCases(localCases);
    } catch (error) {
      logger.error('Error loading demolition cases:', error);
      showError('Errore nel caricamento dei casi di demolizione');
    } finally {
      setLoading(false);
    }
  };

  // Flag per evitare chiamate duplicate dopo login
  const loginJustHappened = useRef(false);
  
  useEffect(() => {
    // Se è appena avvenuto un login E siamo autenticati, NON caricare qui - verrà caricato da handleRVFULoginSuccess
    if (loginJustHappened.current && rvfuAuthenticated) {
      loginJustHappened.current = false;
      return; // handleRVFULoginSuccess chiamerà loadCases dopo il delay
    }
    
    // Carica i casi quando cambia orgId o quando si disconnette
    if (!rvfuAuthenticated) {
      // Se non autenticato, carica da Supabase
      loadCases();
    }
  }, [orgId, rvfuAuthenticated]);

  // Ricarica quando cambiano i filtri
  useEffect(() => {
    if (rvfuAuthenticated) {
      // Debounce per evitare troppe chiamate durante la digitazione
      const timer = setTimeout(() => {
        loadCases();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, selectedStatus]);

  // Filter cases
  const filteredCases = cases.filter(case_ => {
    const matchesSearch = !searchQuery || 
      case_.targa?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.telaio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.marca_modello?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.clients?.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.clients?.surname?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'rvfu_synced' && case_.rvfu_id) ||
      (selectedStatus === 'rvfu_pending' && !case_.rvfu_id && case_.stato === 'completata') ||
      (selectedStatus === 'draft' && case_.stato === 'bozza');

    // Handle processing step filters
    if (selectedStatus.startsWith('step_')) {
      const stepCode = selectedStatus.replace('step_', '');
      matchesStatus = case_.processing_status === stepCode;
    }

    return matchesSearch && matchesStatus;
  });

  // Handle RVFU sync
  const handleRVFUSync = async (caseId) => {
    if (!rvfuAuthenticated || !rvfuTokens) {
      setShowRVFULogin(true);
      return;
    }

    // Adatta i token del hook alla firma attesa da RVFUClient
    const rvfuAuthAdapter = {
      isAuthenticated: () => !!rvfuTokens?.idToken,
      getAuthHeader: () => {
        if (!rvfuTokens?.idToken) {
          throw new Error('Token RVFU non disponibile. Effettua di nuovo il login.');
        }
        return `Bearer ${rvfuTokens.idToken}`;
      },
      // Per semplicità, non gestiamo il refresh automatico qui:
      // in caso di 401 chiediamo all’utente di rieffettuare il login RVFU.
      refreshTokens: async () => {
        throw new Error('Sessione RVFU scaduta: effettua nuovamente il login.');
      },
    };

    const rvfuClient = createRVFUClient(rvfuAuthAdapter, 'formation');

    try {
      setLoading(true);
      showSuccess('Sincronizzazione RVFU avviata verso ACI/MIT...');
      
      // Trova il caso da sincronizzare
      const caseToSync = cases.find(c => c.id === caseId);
      if (!caseToSync) {
        throw new Error('Caso non trovato');
      }

       if (!caseToSync.targa) {
        throw new Error('Targa mancante: compila prima i dati del veicolo.');
      }

      // Prepara dati del form per la mappatura
      // Estrai dati da meta o dai campi diretti
      const meta = caseToSync.meta || {};
      const formData = {
        targa: caseToSync.targa,
        telaio: caseToSync.telaio || '',
        tipoVeicolo: meta.rvfu?.tipoVeicolo || 'A',
        proprietario_cf: meta.owner?.cf || meta.intestatario?.codiceFiscale || '',
        proprietario_nome: meta.owner?.name?.split(' ')[0] || meta.intestatario?.nome || '',
        proprietario_cognome: meta.owner?.name?.split(' ').slice(1).join(' ') || meta.intestatario?.cognome || '',
        proprietario_data_nascita: meta.owner?.birth_date || meta.intestatario?.dataNascita || '',
        proprietario_indirizzo: meta.owner?.address || meta.intestatario?.indirizzoResidenza || '',
        proprietario_cap: meta.owner?.cap || meta.intestatario?.capResidenza || '',
        proprietario_comune: meta.owner?.city || meta.intestatario?.comuneResidenza || '',
        proprietario_provincia: meta.owner?.province || meta.intestatario?.provinciaResidenza || '',
        proprietario_tipo_persona: meta.intestatario?.tipoPersonaGiuridica === 'PG' ? 'PG' : 'PF',
        demolizione_causale: normalizeCausale(meta.rvfu?.causale || caseToSync.demolizione_causale || 'D'),
        demolizione_osservazioni: meta.rvfu?.noteAggiuntive || caseToSync.demolizione_osservazioni || caseToSync.note || '',
        note_parti_rifiuti: meta.rvfu?.notePartiRifiuti || '',
        flag_consegna_forze_ordine: meta.rvfu?.flagConsegnaForzeOrdine || 'N',
        canale_no_pra: meta.rvfu?.canaleNoPra || false,
        distinta_du: meta.rvfu?.distinta?.du || 'ASSENTE',
        distinta_cdc: meta.rvfu?.distinta?.cdc || 'ASSENTE',
        distinta_cdp: meta.rvfu?.distinta?.cdp || 'ASSENTE',
        distinta_foglio_c: meta.rvfu?.distinta?.foglioC || 'ASSENTE',
        distinta_documento_intestatario: meta.rvfu?.distinta?.documentoIntestatario || false,
        distinta_documento_detentore: meta.rvfu?.distinta?.documentoDetentore || false,
        distinta_targa_anteriore: meta.rvfu?.distinta?.targaAnteriore || false,
        distinta_targa_posteriore: meta.rvfu?.distinta?.targaPosteriore || false,
        distinta_targa_denuncia: meta.rvfu?.distinta?.targaDenuncia || false,
      };

      // Converti in formato API RVFU usando la funzione di mappatura
      // Import dinamico per evitare problemi di circolarità
      const { mapFormDataToVFUCreate } = await import('@/lib/rvfu-mapper');
      
      // Converti in formato API RVFU
      const vfuPayload = mapFormDataToVFUCreate(formData, {});

      // Chiamata reale al servizio RVFU con struttura corretta
      const vfuResponse = await rvfuClient.registraVFUConcessionario(vfuPayload);
      
      // Aggiorna caso locale con dati restituiti da RVFU
      // La risposta ha struttura: { esito: {...}, result: { idVFU: number, ... } }
      const vfuBean = vfuResponse.result || vfuResponse.payload || vfuResponse;
      const rvfuId = vfuBean.idVFU || vfuBean.id || vfuResponse.id;
      
      const { error } = await supabase
        .from(TABLE)
        .update({ 
          rvfu_id: rvfuId || parseInt(`${Date.now()}`),
          rvfu_status: vfuBean.statoVFU || vfuBean.stato || 'sincronizzato',
          rvfu_sync_date: new Date().toISOString()
        })
        .eq('id', caseId);
      
      if (error) throw error;
      
      showSuccess('Caso sincronizzato con RVFU (ACI/MIT) con successo');
      await loadCases();
      
    } catch (error) {
      logger.error('Error syncing with RVFU:', error);
      const message = error?.message || 'Errore sconosciuto durante la sincronizzazione RVFU';
      showError(`Errore sincronizzazione RVFU: ${message}`);
      // Non blocchiamo la UI: eventuali errori possono essere analizzati dall’Error Manager RVFU
    } finally {
      setLoading(false);
    }
  };

  // Handle RVFU login success
  const handleRVFULoginSuccess = () => {
    setShowRVFULogin(false);
    showSuccess(' Connesso a RVFU con successo! Ora puoi sincronizzare i casi.');
    
    // Imposta flag per evitare che useEffect chiami loadCases
    loginJustHappened.current = true;
    
    // Forza il reload immediato dello stato dallo storage
    // Questo assicura che lo stato venga aggiornato anche se l'evento non è stato ancora processato
    setTimeout(() => {
      console.log('[DemolizioniRVFU] Forzando reload dello stato RVFU...');
      rvfuReloadState();
      
      //  IMPORTANTE: Aspetta che i token siano completamente caricati prima di chiamare loadCases
      // Questo evita chiamate API troppo precoci che potrebbero causare problemi CDSSO
      // Il server potrebbe richiedere un delay tra login e prima chiamata API
      setTimeout(() => {
        console.log('[DemolizioniRVFU] Caricamento casi dopo login...');
        loadCases();
      }, 1000); // Delay di 1 secondo dopo reload per assicurarsi che tutto sia pronto
    }, 50);
  };

  // Handle RVFU logout
  const handleRVFULogout = async () => {
    try {
      await rvfuLogout();
      showSuccess('Disconnesso da RVFU');
    } catch (error) {
      showError(`Errore logout RVFU: ${error.message}`);
    }
  };

  // Handle delete
  const handleDelete = async (caseId) => {
    if (!confirm('Sei sicuro di voler eliminare questo caso di demolizione?')) return;

    try {
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('id', caseId)
        .eq('org_id', orgId);

      if (error) throw error;
      showSuccess('Caso di demolizione eliminato con successo!');
      await loadCases();
    } catch (error) {
      logger.error('Error deleting demolition case:', error);
      showError('Errore durante l\'eliminazione del caso di demolizione');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141c27] flex items-center justify-center">
        <LoadingSpinner text="Caricamento casi di demolizione..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141c27]">
      {/* Header compatto e organizzato */}
      <div className="bg-blue-500/5 border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Prima riga: Titolo e stato connessione */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg ">
                <img
                  src={rvfuIcon}
                  alt="RVFU"
                  className="h-5 w-5"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-semibold text-blue-400">Demolizioni RVFU</h1>
                  {rvfuAuthenticated && rvfuTokens ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-green-500/10 text-white rounded-full" title={`Token valido fino a: ${rvfuTokens.expiresAt ? new Date(rvfuTokens.expiresAt).toLocaleString('it-IT') : 'N/A'}`}>
                      <img
                        src={rvfuIcon}
                        alt="RVFU"
                        className="h-2.5 w-2.5"
                      />
                      Connesso
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-400 rounded-full">
                      <FiClock className="h-2.5 w-2.5" />
                      Locale
                    </span>
                  )}
                </div>
                <p className="text-blue-400 text-xs mt-0.5">
                  {!rvfuAuthenticated ? 'Modalità locale — gestione fasi lavorazione VFU senza connessione MIT' : 'Gestione integrata con il Registro Veicoli Fuoriuso'}
                  {rvfuAuthenticated && rvfuTokens && (
                    <span className="ml-2 text-emerald-400" title={`ID Token: ${rvfuTokens.idToken?.substring(0, 20)}...`}>
                      • Sincronizzazione attiva
                      {rvfuTokens.expiresAt && (
                        <span className="ml-1 text-xs opacity-75">
                          (scade: {new Date(rvfuTokens.expiresAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      )}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Azioni principali a destra */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/demolizioni-rvfu/new')}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1.5 "
              >
                <FiPlus className="h-3.5 w-3.5" />
                Nuovo
              </button>
              
              {rvfuAuthenticated && rvfuTokens ? (
                <button
                  onClick={handleRVFULogout}
                  className="px-3 py-1.5 text-sm bg-green-500/10 text-white rounded-md hover:bg-green-600 transition-colors flex items-center gap-1.5 "
                  title={`Connesso a RVFU. Token valido fino a: ${rvfuTokens.expiresAt ? new Date(rvfuTokens.expiresAt).toLocaleString('it-IT') : 'N/A'}`}
                >
                  <img
                    src={rvfuIcon}
                    alt="RVFU"
                    className="h-3.5 w-3.5"
                  />
                  Disconnetti
                </button>
              ) : (
                <button
                  onClick={() => setShowRVFULogin(true)}
                  className="px-3 py-1.5 text-sm bg-purple-500/10 text-white rounded-md hover:bg-purple-600 transition-colors flex items-center gap-1.5 "
                >
                  <FiLogIn className="h-3.5 w-3.5" />
                  Connetti
                </button>
              )}
            </div>
          </div>

          {/* Seconda riga: Azioni secondarie */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'dashboard' : 'list')}
              className="px-2.5 py-1.5 text-xs bg-[#1a2536] text-blue-400 border border-blue-500/20 rounded-md hover:bg-blue-500/10 transition-colors flex items-center gap-1.5"
            >
              <FiBarChart className="h-3.5 w-3.5" />
              {viewMode === 'list' ? 'Dashboard' : 'Lista'}
            </button>
            
            {/* Export Excel - Solo se autenticato RVFU */}
            {rvfuAuthenticated && rvfuTokens?.idToken && (
              <button
                onClick={async () => {
                  try {
                    const rvfuAuthAdapter = {
                      isAuthenticated: () => !!rvfuTokens?.idToken,
                      getAuthHeader: () => `Bearer ${rvfuTokens.idToken}`,
                      refreshTokens: async () => {
                        throw new Error('Sessione scaduta');
                      },
                    };
                    const rvfuClient = createRVFUClient(rvfuAuthAdapter, 'formation');
                    
                    // Costruisci filtri basati su filtri UI attuali
                    const filters = {
                      targa: searchQuery || undefined,
                      pageNumber: 0,
                      pageSize: 1000,
                    };
                    
                    const blob = await rvfuClient.exportVFUExcel(filters);
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `demolizioni-rvfu-${new Date().toISOString().split('T')[0]}.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    showSuccess('Export Excel completato con successo');
                  } catch (error) {
                    logger.error('Error exporting Excel:', error);
                    showError(`Errore export Excel: ${error.message}`);
                  }
                }}
                className="px-2.5 py-1.5 text-xs bg-green-500/10 text-white rounded-md hover:bg-green-600 transition-colors flex items-center gap-1.5"
                disabled={loading}
              >
                <FiDownload className="h-3.5 w-3.5" />
                Export Excel
              </button>
            )}
            
            {/* Stampa PDF - Solo se autenticato RVFU */}
            {rvfuAuthenticated && rvfuTokens?.idToken && (
              <button
                onClick={async () => {
                  try {
                    const rvfuAuthAdapter = {
                      isAuthenticated: () => !!rvfuTokens?.idToken,
                      getAuthHeader: () => `Bearer ${rvfuTokens.idToken}`,
                      refreshTokens: async () => {
                        throw new Error('Sessione scaduta');
                      },
                    };
                    const rvfuClient = createRVFUClient(rvfuAuthAdapter, 'formation');
                    
                    // Costruisci filtri basati su filtri UI attuali
                    const filters = {
                      targa: searchQuery || undefined,
                      pageNumber: 0,
                      pageSize: 1000,
                    };
                    
                    const blob = await rvfuClient.stampaVFUPDF(filters);
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `demolizioni-rvfu-${new Date().toISOString().split('T')[0]}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    showSuccess('Stampa PDF completata con successo');
                  } catch (error) {
                    logger.error('Error printing PDF:', error);
                    showError(`Errore stampa PDF: ${error.message}`);
                  }
                }}
                className="px-2.5 py-1.5 text-xs bg-purple-500/10 text-white rounded-md hover:bg-purple-600 transition-colors flex items-center gap-1.5"
                disabled={loading}
              >
                <FiPrinter className="h-3.5 w-3.5" />
                Stampa PDF
              </button>
            )}
            
            <button
              onClick={() => setShowExportImport(true)}
              className="px-2.5 py-1.5 text-xs bg-blue-500/10 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-1.5"
            >
              <FiDownload className="h-3.5 w-3.5" />
              Export/Import
            </button>
            
            <button
              onClick={() => setShowErrorManager(true)}
              className="px-2.5 py-1.5 text-xs bg-orange-500/10 text-white rounded-md hover:bg-orange-600 transition-colors flex items-center gap-1.5"
            >
              <FiAlertTriangle className="h-3.5 w-3.5" />
              Errori
            </button>
            
            <button
              onClick={loadCases}
              className="px-2.5 py-1.5 text-xs bg-[#1a2536] text-blue-400 border border-blue-500/20 rounded-md hover:bg-blue-500/10 transition-colors flex items-center gap-1.5"
            >
              <FiRefreshCw className="h-3.5 w-3.5" />
              Aggiorna
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {viewMode === 'dashboard' ? (
          <RVFUDashboard />
        ) : (
          <>
            {/* Filter Bar */}
            <FilterBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
            />

            {/* Cases List */}
            {filteredCases.length === 0 ? (
              <div className="bg-[#141c27] rounded-lg shadow border border-[#243044]  p-8 text-center">
                <FiFileText className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-sm font-semibold text-slate-200 mb-3">
                  Nessun caso trovato
                </h3>
                <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                  {searchQuery || selectedStatus !== 'all'
                    ? 'Prova a modificare i filtri di ricerca per trovare i casi che stai cercando.'
                    : 'Inizia creando un nuovo caso di demolizione per il sistema RVFU.'
                  }
                </p>
                {!searchQuery && selectedStatus === 'all' && (
                  <button
                    onClick={() => navigate('/demolizioni-rvfu/new')}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <FiPlus className="h-4 w-4" />
                    Crea Primo Caso RVFU
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCases.map((case_, index) => (
                  <CaseCard
                    key={case_.id}
                    case_={case_}
                    onEdit={(id) => navigate(`/demolizioni-rvfu/${id}`)}
                    onDelete={handleDelete}
                    onSync={handleRVFUSync}
                    onView={(case_) => {
                      // Se è un caso da RVFU, vai al dettaglio, altrimenti al form
                      if (case_._fromRVFU && case_.rvfu_id) {
                        navigate(`/demolizioni-rvfu/dettaglio/${case_.rvfu_id}`);
                      } else {
                        setSelectedCase(case_);
                        setShowDetail(true);
                      }
                    }}
                    index={index}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetail && selectedCase && (
        <Modal
          isOpen={showDetail}
          onClose={() => setShowDetail(false)}
          title="Dettagli Caso Demolizione"
          size="lg"
        >
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-purple-500/5 rounded-xl p-4">
                <h3 className="font-medium text-slate-200 mb-2">Stato Caso</h3>
                <div className="flex items-center gap-2">
                  {selectedCase.rvfu_id ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-green-500/10 text-green-400 rounded-full">
                      <FiCheckCircle className="h-3 w-3" />
                      RVFU Sincronizzato
                    </span>
                  ) : selectedCase.stato === 'completata' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-yellow-500/10 text-yellow-400 rounded-full">
                      <FiClock className="h-3 w-3" />
                      Pronto per RVFU
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-[#141c27] text-slate-200 rounded-full  ">
                      <FiFileText className="h-3 w-3" />
                      {selectedCase.stato}
                    </span>
                  )}
                </div>
              </div>
              {selectedCase.rvfu_id && (
                <div className="bg-emerald-500/5 rounded-xl p-4">
                  <h3 className="font-medium text-slate-200 mb-2">Dati RVFU</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">RVFU ID:</span>
                      <span className="font-medium">{selectedCase.rvfu_id}</span>
                    </div>
                    {selectedCase.rvfu_sync_date && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ultima sincronizzazione:</span>
                        <span className="font-medium">
                          {new Date(selectedCase.rvfu_sync_date).toLocaleString('it-IT')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Details */}
            <div className="bg-[#1a2536] rounded-xl p-6 border border-[#243044]">
              <h3 className="font-medium text-slate-200 mb-4 flex items-center gap-2">
                <FiTruck className="h-5 w-5 text-blue-400" />
                Dettagli Veicolo
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Targa:</span>
                  <div className="font-medium">{selectedCase.targa || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Telaio:</span>
                  <div className="font-medium">{selectedCase.telaio || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Marca/Modello:</span>
                  <div className="font-medium">{selectedCase.marca_modello || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Anno:</span>
                  <div className="font-medium">{selectedCase.anno || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Client Details */}
            {selectedCase.clients && (
              <div className="bg-[#1a2536] rounded-xl p-6 border border-[#243044]">
                <h3 className="font-medium text-slate-200 mb-4 flex items-center gap-2">
                  <FiUser className="h-5 w-5 text-blue-400" />
                  Dettagli Cliente
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Nome:</span>
                    <div className="font-medium">{selectedCase.clients.nome} {selectedCase.clients.surname}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Telefono:</span>
                    <div className="font-medium">{selectedCase.clients.phone || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Email:</span>
                    <div className="font-medium">{selectedCase.clients.email || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Transport Details */}
            {selectedCase.transports && (
              <div className="bg-[#1a2536] rounded-xl p-6 border border-[#243044]">
                <h3 className="font-medium text-slate-200 mb-4 flex items-center gap-2">
                  <FiTruck className="h-5 w-5 text-blue-400" />
                  Dettagli Trasporto
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Autista:</span>
                    <div className="font-medium">{selectedCase.transports.autista || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Cliente Trasporto:</span>
                    <div className="font-medium">{selectedCase.transports.cliente || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* RVFU Specific Details */}
            {selectedCase.rvfu_causale && (
              <div className="bg-[#1a2536] rounded-xl p-6 border border-[#243044]">
                <h3 className="font-medium text-slate-200 mb-4 flex items-center gap-2">
                  <FiShield className="h-5 w-5 text-blue-400" />
                  Dettagli RVFU
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Causale:</span>
                    <div className="font-medium">{selectedCase.rvfu_causale || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Data Demolizione:</span>
                    <div className="font-medium">{selectedCase.rvfu_data_demolizione || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Provincia:</span>
                    <div className="font-medium">{selectedCase.rvfu_provincia || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Comune:</span>
                    <div className="font-medium">{selectedCase.rvfu_comune || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Indirizzo:</span>
                    <div className="font-medium">{selectedCase.rvfu_indirizzo || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">CAP:</span>
                    <div className="font-medium">{selectedCase.rvfu_cap || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Proprietario CF:</span>
                    <div className="font-medium">{selectedCase.rvfu_proprietario_cf || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* VFU Processing Timeline */}
            {selectedCase.id && !selectedCase._fromRVFU && (
              <div className="bg-[#1a2536] rounded-xl p-6 border border-[#243044]">
                <h3 className="font-medium text-slate-200 mb-4 flex items-center gap-2">
                  <FiClock className="h-5 w-5 text-blue-400" />
                  Fasi di Lavorazione VFU
                </h3>
                <VFUProcessingTimeline
                  caseId={selectedCase.id}
                  orgId={orgId}
                  targa={selectedCase.targa}
                  telaio={selectedCase.telaio}
                  onStepChange={loadCases}
                />
              </div>
            )}

            {selectedCase.note && (
              <div className="bg-[#1a2536] rounded-xl p-6 border border-[#243044]">
                <h3 className="font-medium text-slate-200 mb-4 flex items-center gap-2">
                  <FiFileText className="h-5 w-5 text-blue-400" />
                  Note
                </h3>
                <p className="text-sm text-slate-400">{selectedCase.note}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6">
            <LoadingButton
              onClick={() => {
                setShowDetail(false);
                navigate(`/demolizioni-rvfu/${selectedCase.id}`);
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <FiEdit2 className="h-4 w-4" />
              Modifica
            </LoadingButton>

            <LoadingButton
              onClick={async () => {
                try {
                  const [stepsRes, orgRes, firRes] = await Promise.all([
                    supabase.from('vfu_processing_steps').select('step_code, started_at, completed_at').eq('demolition_case_id', selectedCase.id).order('step_order'),
                    supabase.from('orgs').select('name').eq('id', orgId).maybeSingle(),
                    selectedCase.fir_rifiuti_id
                      ? supabase.from('rentri_formulari').select('numero_fir').eq('id', selectedCase.fir_rifiuti_id).maybeSingle()
                      : Promise.resolve({ data: null }),
                  ]);
                  const enriched = { ...selectedCase, fir_numero: firRes.data?.numero_fir };
                  printSchedaDemolizione(enriched, stepsRes.data || [], orgRes.data?.name || '');
                } catch (err) {
                  logger.error('[VFU] Errore stampa scheda:', err);
                }
              }}
              className="bg-[#243044] hover:bg-[#2e3d54] text-slate-300"
            >
              <FiPrinter className="h-4 w-4" />
              Scheda PDF
            </LoadingButton>

            {!selectedCase.rvfu_id && selectedCase.stato === 'completata' && (
              <LoadingButton
                onClick={() => {
                  setShowDetail(false);
                  handleRVFUSync(selectedCase.id);
                }}
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <FiShield className="h-4 w-4" />
                Sincronizza RVFU
              </LoadingButton>
            )}
          </div>
        </Modal>
      )}

      {/* Modal Export/Import */}
      {showExportImport && (
        <Modal
          isOpen={showExportImport}
          title="Export/Import Dati RVFU"
          onClose={() => setShowExportImport(false)}
          size="lg"
        >
          <RVFUExportImport onClose={() => setShowExportImport(false)} />
        </Modal>
      )}

      {/* Modal Error Manager */}
      {showErrorManager && (
        <Modal
          isOpen={showErrorManager}
          title="Gestione Errori RVFU"
          onClose={() => setShowErrorManager(false)}
          size="xl"
        >
          <RVFUErrorManager />
        </Modal>
      )}

      {showRVFULogin && (
        <Modal
          isOpen={showRVFULogin}
          onClose={() => setShowRVFULogin(false)}
          title="Autenticazione RVFU"
          size="lg"
        >
          <RVFULogin 
            onSuccess={handleRVFULoginSuccess}
            onCancel={() => setShowRVFULogin(false)}
          />
        </Modal>
      )}
    </div>
  );
}