import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiCalendar, FiUser, FiTruck, FiFileText, FiShield,
  FiCheckCircle, FiXCircle, FiAlertCircle, FiDownload, FiRefreshCw,
  FiEdit, FiTrash2, FiMapPin, FiCreditCard, FiPrinter, FiInfo, FiMail
} from 'react-icons/fi';
import { useToast } from '@/hooks/useToast';
import { useRVFUAuth } from '@/hooks/useRVFUAuth';
import { createRVFUClient } from '@/lib/rvfu-client';
import { supabase } from '@/lib/supabase-browser';
import { useOrg } from '@/context/OrgContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import VFUProcessingTimeline from '@/components/rvfu/VFUProcessingTimeline';
import Modal from '@/components/ui/Modal';
import { logger } from '@/lib/logger';
import { creaBozzaFIR, creaBozzaFattura, checkDraftStatus } from '@/lib/vfu-draft-creator';
import { printSchedaDemolizione } from '@/lib/services/rentriPrintService';
import { sendEmailNotification } from '@/lib/emailNotifications';

export default function DemolizioneRVFUDettaglio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess, showWarning } = useToast();
  const {
    isAuthenticated: rvfuAuthenticated,
    tokens: rvfuTokens,
    authService,
  } = useRVFUAuth('formation');

  const [loading, setLoading] = useState(true);
  const [vfuData, setVfuData] = useState(null);
  const [centriRaccolta, setCentriRaccolta] = useState([]);
  const [showConferimentoModal, setShowConferimentoModal] = useState(false);
  const [showAnnullamentoModal, setShowAnnullamentoModal] = useState(false);
  const [conferimentoData, setConferimentoData] = useState({
    codiceFiscaleImpresa: '',
    matricolaSedeImpresa: '',
    dataRitiro: new Date().toISOString().split('T')[0],
    generaCdr: true,
  });
  const [motivoAnnullamento, setMotivoAnnullamento] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [documenti, setDocumenti] = useState([]);
  const [documentiLoading, setDocumentiLoading] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [localCaseId, setLocalCaseId] = useState(null);
  const [draftStatus, setDraftStatus] = useState({ hasFIR: false, hasInvoice: false });
  const [draftLoading, setDraftLoading] = useState(false);
  const [printingScheda, setPrintingScheda] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const { orgId } = useOrg();

  // Carica stato bozze quando in local mode
  useEffect(() => {
    if (isLocalMode && localCaseId) {
      checkDraftStatus(localCaseId).then(setDraftStatus).catch(() => {});
    }
  }, [isLocalMode, localCaseId]);

  const handleCreaBozzaFIR = async () => {
    if (!localCaseId || !orgId) return;
    setDraftLoading(true);
    try {
      const result = await creaBozzaFIR({ caseId: localCaseId, orgId });
      showSuccess(`Bozza FIR creata: ${result.numero_fir}`);
      setDraftStatus(prev => ({ ...prev, hasFIR: true, fir_id: result.fir_id }));
    } catch (error) {
      logger.error('[VFU] Error creating FIR draft:', error);
      showError(`Errore creazione bozza FIR: ${error.message}`);
    } finally {
      setDraftLoading(false);
    }
  };

  const handlePrintScheda = async () => {
    if (!localCaseId) return;
    setPrintingScheda(true);
    try {
      const supabaseClient = supabase;
      const firId = vfuData?.fir_rifiuti_id;
      const [stepsRes, orgRes, firRes] = await Promise.all([
        supabaseClient.from('vfu_processing_steps').select('step_code, started_at, completed_at').eq('demolition_case_id', localCaseId).order('step_order'),
        supabaseClient.from('orgs').select('name').eq('id', orgId).maybeSingle(),
        firId ? supabaseClient.from('rentri_formulari').select('numero_fir').eq('id', firId).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      const rawCase = {
        id: localCaseId,
        targa: vfuData?.targa,
        telaio: vfuData?.telaio,
        marca_modello: vfuData?.marcaModello || vfuData?.marca_modello,
        anno: vfuData?.annoImmatricolazione || vfuData?.anno,
        peso_ingresso_kg: vfuData?.pesoIngressoKg || vfuData?.peso_ingresso_kg,
        normativa_applicabile: vfuData?.normativa_applicabile,
        processing_started_at: vfuData?.processing_started_at,
        fir_rifiuti_id: vfuData?.fir_rifiuti_id,
        certificato_rottamazione_numero: vfuData?.certificato_rottamazione_numero,
        certificato_rottamazione_data: vfuData?.certificato_rottamazione_data,
        created_at: vfuData?.created_at,
        fir_numero: firRes.data?.numero_fir,
      };
      printSchedaDemolizione(rawCase, stepsRes.data || [], orgRes.data?.name || '');
    } catch (err) {
      console.error('Errore stampa scheda:', err);
    } finally {
      setPrintingScheda(false);
    }
  };

  const handleCreaBozzaFattura = async () => {
    if (!localCaseId || !orgId) return;
    setDraftLoading(true);
    try {
      const result = await creaBozzaFattura({ caseId: localCaseId, orgId });
      showSuccess('Bozza fattura creata');
      setDraftStatus(prev => ({ ...prev, hasInvoice: true, invoice_id: result.invoice_id }));
    } catch (error) {
      logger.error('[VFU] Error creating invoice draft:', error);
      showError(`Errore creazione bozza fattura: ${error.message}`);
    } finally {
      setDraftLoading(false);
    }
  };

  // Carica dettaglio VFU - supporta sia RVFU che modalità locale
  useEffect(() => {
    if (rvfuAuthenticated && authService) {
      loadVFUDetail();
    } else {
      // Modalità locale: carica da Supabase
      loadLocalDetail();
    }
  }, [id, rvfuAuthenticated, authService]);

  const loadLocalDetail = async () => {
    if (!id) return;
    setLoading(true);
    setIsLocalMode(true);
    try {
      const { data, error } = await supabase
        .from('demolition_cases')
        .select(`
          *,
          clients:client_id (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Caso non trovato');

      setLocalCaseId(data.id);
      // Map Supabase data to vfuData shape for UI compatibility
      const meta = data.meta || {};
      setVfuData({
        idVFU: data.rvfu_id || data.id,
        targa: data.targa || '',
        telaio: data.telaio || '',
        tipoVeicolo: meta.rvfu?.tipoVeicolo || 'A',
        causale: meta.rvfu?.causale || data.demolizione_causale || '',
        descrizioneCausale: meta.rvfu?.causale || data.demolizione_causale || '',
        obbligoIscrizionePRA: meta.obbligoIscrizionePRA || data.obbligoIscrizionePRA || 'S',
        statoVFU: data.rvfu_status || data.processing_status || 'LOCALE',
        dataRegistrazione: data.created_at,
        dataUltimoAggiornamento: data.updated_at,
        intestatario: {
          nome: meta.owner?.name?.split(' ')[0] || data.clients?.nome || '',
          cognome: meta.owner?.name?.split(' ').slice(1).join(' ') || data.clients?.surname || '',
          codiceFiscale: meta.owner?.cf || data.proprietario_cf || '',
          dataNascita: meta.owner?.birth_date || '',
        },
        noteAggiuntive: data.note || meta.rvfu?.noteAggiuntive || '',
        notePartiRifiuti: meta.rvfu?.notePartiRifiuti || '',
        processing_status: data.processing_status,
        _isLocal: true,
      });
    } catch (error) {
      logger.error('Error loading local case detail:', error);
      showError(`Errore caricamento: ${error.message}`);
      navigate('/demolizioni-rvfu');
    } finally {
      setLoading(false);
    }
  };

  const loadVFUDetail = async () => {
    if (!id || !authService) return;

    setLoading(true);
    try {
      // Usa direttamente authService invece di creare un adapter
      // authService.getAuthHeader() usa accessToken (come configurato in rvfu-auth.ts)
      const rvfuClient = createRVFUClient(authService, 'formation');
      
      // Estrai idVFU dal parametro (può essere "rvfu_123" o solo "123")
      const idVFU = id.startsWith('rvfu_') ? id.replace('rvfu_', '') : id;
      
      const response = await rvfuClient.getVFUById(idVFU);
      const vfu = response.payload || response.result || response;
      
      setVfuData(vfu);

      // Carica centri raccolta disponibili se lo stato permette il conferimento
      if (vfu.statoVFU === 'INSERITO' || vfu.statoVfuEnum === 'INSERITO') {
        await loadCentriRaccolta();
      }

      // Carica documenti
      await loadDocumenti(idVFU);
    } catch (error) {
      logger.error('Error loading VFU detail:', error);
      showError(`Errore nel caricamento del dettaglio: ${error.message}`);
      navigate('/demolizioni-rvfu');
    } finally {
      setLoading(false);
    }
  };

  const loadDocumenti = async (idVFU) => {
    if (!authService) return;

    setDocumentiLoading(true);
    try {
      // Usa direttamente authService invece di creare un adapter
      const rvfuClient = createRVFUClient(authService, 'formation');
      const response = await rvfuClient.consultaDocumentiVFU(idVFU);
      
      if (response.esito?.codice === 'OK') {
        const docs = response.payload || response.result || [];
        setDocumenti(Array.isArray(docs) ? docs : []);
      }
    } catch (error) {
      logger.error('Error loading documenti:', error);
      // Non mostriamo errore, semplicemente lasciamo la lista vuota
      setDocumenti([]);
    } finally {
      setDocumentiLoading(false);
    }
  };

  const loadCentriRaccolta = async () => {
    if (!authService) return;
    
    try {
      // Usa direttamente authService invece di creare un adapter
      const rvfuClient = createRVFUClient(authService, 'formation');
      const response = await rvfuClient.getCentriRaccoltaConferibili();
      
      if (response.esito?.codice !== 'OK') {
        throw new Error(response.esito?.descrizione || 'Errore nel recupero dei centri raccolta');
      }
      
      const crList = response.payload || response.result || [];
      setCentriRaccolta(Array.isArray(crList) ? crList : []);
    } catch (error) {
      logger.error('Error loading centri raccolta:', error);
      showWarning('Impossibile caricare lista centri raccolta');
    }
  };

  const handleConferimento = async () => {
    if (!conferimentoData.codiceFiscaleImpresa || !conferimentoData.matricolaSedeImpresa) {
      showError('Seleziona un centro di raccolta');
      return;
    }

    if (!authService) {
      showError('Autenticazione RVFU richiesta');
      return;
    }
    
    setActionLoading(true);
    try {
      // Usa direttamente authService invece di creare un adapter
      const rvfuClient = createRVFUClient(authService, 'formation');
      const idVFU = id.startsWith('rvfu_') ? id.replace('rvfu_', '') : id;
      
      const response = await rvfuClient.conferisciVFU(idVFU, conferimentoData);
      
      if (response.esito?.codice !== 'OK') {
        throw new Error(response.esito?.descrizione || 'Errore nel conferimento');
      }
      
      showSuccess('VFU conferito con successo al centro di raccolta');
      setShowConferimentoModal(false);
      await loadVFUDetail(); // Ricarica i dati
    } catch (error) {
      logger.error('Error conferimento VFU:', error);
      showError(`Errore nel conferimento: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnnullamento = async () => {
    if (!motivoAnnullamento.trim()) {
      showError('Inserisci il motivo dell\'annullamento');
      return;
    }

    if (!authService) {
      showError('Autenticazione RVFU richiesta');
      return;
    }
    
    setActionLoading(true);
    try {
      // Usa direttamente authService invece di creare un adapter
      const rvfuClient = createRVFUClient(authService, 'formation');
      const idVFU = id.startsWith('rvfu_') ? id.replace('rvfu_', '') : id;
      
      const response = await rvfuClient.annullaVFU(idVFU, { motivoEliminazione: motivoAnnullamento });
      
      if (response.esito?.codice !== 'OK') {
        throw new Error(response.esito?.descrizione || 'Errore nell\'annullamento');
      }
      
      showSuccess('VFU annullato con successo');
      setShowAnnullamentoModal(false);
      navigate('/demolizioni-rvfu');
    } catch (error) {
      logger.error('Error annullamento VFU:', error);
      showError(`Errore nell'annullamento: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatoBadge = (stato) => {
    const statoColors = {
      'INSERITO': 'bg-blue-500/10 text-blue-400',
      'CONFERITO': 'bg-yellow-500/10 text-yellow-400',
      'PRESO_IN_CARICO': 'bg-purple-500/10 text-purple-400',
      'DA_RADIARE': 'bg-orange-500/10 text-orange-400',
      'INVIATO_A_STA': 'bg-blue-500/10 text-blue-400',
      'RADIATO': 'bg-green-500/10 text-green-400',
      'DEMOLITO': 'bg-[#141c27] text-slate-200  ',
      'ANNULLATO': 'bg-red-500/10 text-red-400',
    };

    const colorClass = statoColors[stato] || 'bg-[#141c27] text-slate-200  ';
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${colorClass}`}>
        {stato === 'INSERITO' && <FiCheckCircle className="h-4 w-4" />}
        {stato === 'ANNULLATO' && <FiXCircle className="h-4 w-4" />}
        {stato === 'CONFERITO' && <FiAlertCircle className="h-4 w-4" />}
        {stato || 'Sconosciuto'}
      </span>
    );
  };

  const canConferire = () => {
    return vfuData?.statoVFU === 'INSERITO' || vfuData?.statoVfuEnum === 'INSERITO';
  };

  const canAnnullare = () => {
    return vfuData?.statoVFU === 'INSERITO' || vfuData?.statoVfuEnum === 'INSERITO';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141c27] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!vfuData) {
    return (
      <div className="min-h-screen bg-[#141c27] flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-sm font-semibold text-slate-200 mb-2">
            VFU non trovato
          </h2>
          <button
            onClick={() => navigate('/demolizioni-rvfu')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Torna alla lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141c27]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/demolizioni-rvfu')}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-4"
          >
            <FiArrowLeft className="h-5 w-5" />
            Torna alla lista
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-200 mb-2">
                Dettaglio VFU - {vfuData.targa || 'N/A'}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                {isLocalMode && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-amber-500/10 text-amber-400 rounded-full">
                    Locale
                  </span>
                )}
                {getStatoBadge(vfuData.statoVFU || vfuData.statoVfuEnum)}
                {/* Badge PRA */}
                {vfuData.obbligoIscrizionePRA && (
                  <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${
                    vfuData.obbligoIscrizionePRA === 'S' 
                      ? 'bg-blue-500/10 text-blue-400' 
                      : 'bg-[#141c27] text-slate-200  '
                  }`}>
                    <FiShield className="h-3 w-3" />
                    {vfuData.obbligoIscrizionePRA === 'S' ? 'Con Obbligo PRA' : 'Senza Obbligo PRA'}
                  </span>
                )}
                <span className="text-sm text-slate-400">
                  ID: {vfuData.idVFU}
                </span>
              </div>
            </div>

            {/* Azioni */}
            <div className="flex gap-2">
              {!isLocalMode && canConferire() && (
                <button
                  onClick={() => setShowConferimentoModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                >
                  <FiCheckCircle className="h-4 w-4" />
                  Conferisci a CR
                </button>
              )}
              {!isLocalMode && canAnnullare() && (
                <button
                  onClick={() => setShowAnnullamentoModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                >
                  <FiXCircle className="h-4 w-4" />
                  Annulla
                </button>
              )}
              {isLocalMode && localCaseId && (
                <button
                  onClick={() => navigate(`/demolizioni-rvfu/${localCaseId}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <FiEdit className="h-4 w-4" />
                  Modifica
                </button>
              )}
              <button
                onClick={() => setShowEmailModal(true)}
                className="px-4 py-2 bg-purple-600/10 text-purple-400 border border-purple-500/20 rounded-md hover:bg-purple-600/20 flex items-center gap-2"
              >
                <FiMail className="h-4 w-4" />
                Invia Email
              </button>
              <button
                onClick={isLocalMode ? loadLocalDetail : loadVFUDetail}
                className="px-4 py-2 bg-[#1a2536] text-slate-300 border border-[#243044] rounded-md hover:bg-[#141c27] flex items-center gap-2"
              >
                <FiRefreshCw className="h-4 w-4" />
                Aggiorna
              </button>
            </div>
          </div>
        </div>

        {/* Contenuto */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonna principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dati Veicolo */}
            <div className="bg-[#1a2536] rounded-lg shadow border border-[#243044] p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <FiTruck className="h-5 w-5 text-blue-400" />
                Dati Veicolo
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">Targa</label>
                  <p className="text-slate-200 font-semibold">{vfuData.targa || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Telaio</label>
                  <p className="text-slate-200 font-semibold">{vfuData.telaio || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Tipo Veicolo</label>
                  <p className="text-slate-200">{vfuData.tipoVeicolo || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Causale</label>
                  <p className="text-slate-200">{vfuData.descrizioneCausale || vfuData.causale || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Obbligo Iscrizione PRA</label>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${
                      vfuData.obbligoIscrizionePRA === 'S' 
                        ? 'bg-blue-500/10 text-blue-400' 
                        : 'bg-[#141c27] text-slate-200  '
                    }`}>
                      {vfuData.obbligoIscrizionePRA === 'S' ? (
                        <>
                          <FiShield className="h-3 w-3" />
                          Con Obbligo PRA
                        </>
                      ) : (
                        <>
                          <FiXCircle className="h-3 w-3" />
                          Senza Obbligo PRA
                        </>
                      )}
                    </span>
                  </div>
                </div>
                {vfuData.dataRegistrazione && (
                  <div>
                    <label className="text-sm font-medium text-slate-500">Data Registrazione</label>
                    <p className="text-slate-200">
                      {new Date(vfuData.dataRegistrazione).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                )}
                {vfuData.dataRitiro && (
                  <div>
                    <label className="text-sm font-medium text-slate-500">Data Ritiro</label>
                    <p className="text-slate-200">
                      {new Date(vfuData.dataRitiro).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                )}
                {vfuData.dataConferimento && (
                  <div>
                    <label className="text-sm font-medium text-slate-500">Data Conferimento</label>
                    <p className="text-slate-200">
                      {new Date(vfuData.dataConferimento).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Intestatario */}
            {vfuData.intestatario && (
              <div className="bg-[#1a2536] rounded-lg shadow border border-[#243044] p-6">
                <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <FiUser className="h-5 w-5 text-blue-400" />
                  Intestatario
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-500">Nome</label>
                    <p className="text-slate-200">
                      {vfuData.intestatario.nome || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Cognome</label>
                    <p className="text-slate-200">
                      {vfuData.intestatario.cognome || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Codice Fiscale</label>
                    <p className="text-slate-200 font-mono">
                      {vfuData.intestatario.codiceFiscale || 'N/A'}
                    </p>
                  </div>
                  {vfuData.intestatario.dataNascita && (
                    <div>
                      <label className="text-sm font-medium text-slate-500">Data Nascita</label>
                      <p className="text-slate-200">
                        {new Date(vfuData.intestatario.dataNascita).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Documenti */}
            <div className="bg-[#1a2536] rounded-lg shadow border border-[#243044] p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <FiFileText className="h-5 w-5 text-blue-400" />
                Documenti
              </h2>
              {documentiLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : documenti.length === 0 ? (
                <p className="text-slate-500 text-sm">Nessun documento disponibile</p>
              ) : (
                <div className="space-y-3">
                  {documenti.map((doc, index) => (
                    <div
                      key={doc.idDocumento || doc.id || index}
                      className="flex items-center justify-between p-3 border border-[#243044] rounded-md hover:bg-[#141c27]"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-200">
                          {doc.nomeDocumento || doc.tipoDocumento || 'Documento'}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                          {doc.tipoDocumento && (
                            <span>Tipo: {doc.tipoDocumento}</span>
                          )}
                          {doc.dataCaricamento && (
                            <span>
                              {new Date(doc.dataCaricamento).toLocaleDateString('it-IT')}
                            </span>
                          )}
                          {doc.dimensione && (
                            <span>{(doc.dimensione / 1024).toFixed(2)} KB</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            setDocumentiLoading(true);
                            // Usa direttamente authService invece di creare un adapter
                            const rvfuClient = createRVFUClient(authService, 'formation');
                            
                            const idVFU = id.startsWith('rvfu_') ? id.replace('rvfu_', '') : id;
                            const blob = await rvfuClient.downloadDocumento({
                              idVFU: parseInt(idVFU),
                              progressivoDocumento: doc.progressivoDocumento || doc.idDocumento || doc.id,
                            });
                            
                            // Scarica il blob
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = doc.nomeDocumento || doc.tipoDocumento || 'documento.pdf';
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                            showSuccess('Documento scaricato con successo');
                          } catch (error) {
                            logger.error('Error downloading documento:', error);
                            showError(`Errore nel download: ${error.message}`);
                          } finally {
                            setDocumentiLoading(false);
                          }
                        }}
                        disabled={documentiLoading}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center gap-2"
                      >
                        <FiDownload className="h-4 w-4" />
                        Scarica
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Note */}
            {(vfuData.noteAggiuntive || vfuData.notePartiRifiuti) && (
              <div className="bg-[#1a2536] rounded-lg shadow border border-[#243044] p-6">
                <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <FiFileText className="h-5 w-5 text-blue-400" />
                  Note
                </h2>
                {vfuData.noteAggiuntive && (
                  <div className="mb-4">
                    <label className="text-sm font-medium text-slate-500">Note Aggiuntive</label>
                    <p className="text-slate-200 mt-1">{vfuData.noteAggiuntive}</p>
                  </div>
                )}
                {vfuData.notePartiRifiuti && (
                  <div>
                    <label className="text-sm font-medium text-slate-500">Note Parti Rifiuti</label>
                    <p className="text-slate-200 mt-1">{vfuData.notePartiRifiuti}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* VFU Processing Timeline - solo in modalità locale */}
            {vfuData?._isLocal && localCaseId && (
              <div className="bg-[#1a2536] rounded-lg shadow border border-[#243044] p-6">
                <h2 className="text-lg font-semibold text-slate-200 mb-4">
                  Fasi di Lavorazione
                </h2>
                <VFUProcessingTimeline
                  caseId={localCaseId}
                  orgId={orgId}
                  targa={vfuData?.targa}
                  telaio={vfuData?.telaio}
                  onStepChange={loadLocalDetail}
                />
              </div>
            )}

            {/* Bozze RENTRI/SDI - solo in modalità locale */}
            {vfuData?._isLocal && localCaseId && (
              <div className="bg-[#1a2536] rounded-lg shadow border border-[#243044] p-6">
                <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <FiFileText className="h-5 w-5 text-blue-400" />
                  Bozze RENTRI / SDI
                </h2>
                <div className="space-y-3">
                  {/* Bozza FIR RENTRI */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-300">FIR Rifiuti</p>
                      <p className="text-xs text-slate-500">Formulario RENTRI per conferimento</p>
                    </div>
                    {draftStatus.hasFIR ? (
                      <button
                        onClick={() => navigate(`/rifiuti/formulari/${draftStatus.fir_id}`)}
                        className="px-3 py-1.5 text-xs font-medium bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-600/30 transition flex items-center gap-1"
                      >
                        <FiCheckCircle className="w-3 h-3" /> Apri
                      </button>
                    ) : (
                      <button
                        onClick={handleCreaBozzaFIR}
                        disabled={draftLoading}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <FiFileText className="w-3 h-3" /> Crea bozza
                      </button>
                    )}
                  </div>
                  {/* Bozza Fattura SDI */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-300">Fattura SDI</p>
                      <p className="text-xs text-slate-500">Fattura per servizio demolizione</p>
                    </div>
                    {draftStatus.hasInvoice ? (
                      <button
                        onClick={() => navigate(`/fatture/${draftStatus.invoice_id}`)}
                        className="px-3 py-1.5 text-xs font-medium bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-600/30 transition flex items-center gap-1"
                      >
                        <FiCheckCircle className="w-3 h-3" /> Apri
                      </button>
                    ) : (
                      <button
                        onClick={handleCreaBozzaFattura}
                        disabled={draftLoading}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <FiCreditCard className="w-3 h-3" /> Crea bozza
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Stampa scheda demolizione - solo in modalità locale */}
            {vfuData?._isLocal && localCaseId && (
              <div className="bg-[#1a2536] rounded-lg shadow border border-[#243044] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-200">Scheda Fasi Demolizione</p>
                    <p className="text-xs text-slate-500">PDF con 6 fasi, date e verifica 10 giorni (D.Lgs. 209/03)</p>
                  </div>
                  <button
                    onClick={handlePrintScheda}
                    disabled={printingScheda}
                    className="px-3 py-1.5 text-xs font-medium bg-[#243044] text-slate-300 border border-[#2e3d54] rounded hover:bg-[#2e3d54] transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <FiPrinter className="w-3 h-3" />
                    {printingScheda ? 'Generazione...' : 'Stampa scheda'}
                  </button>
                </div>
              </div>
            )}

            {/* Informazioni Rapide */}
            <div className="bg-[#1a2536] rounded-lg shadow border border-[#243044] p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-4">
                Informazioni
              </h2>
              <div className="space-y-3">
                {/* Badge PRA Prominente */}
                <div className="p-3 rounded-lg border-2 border-blue-500/20 bg-blue-500/10">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 block">
                    Tipo Veicolo
                  </label>
                  {vfuData.obbligoIscrizionePRA === 'S' ? (
                    <div className="flex items-center gap-2">
                      <FiShield className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="text-sm font-bold text-blue-900 text-xs">
                          Con Obbligo PRA
                        </p>
                        <p className="text-xs text-blue-400 mt-0.5">
                          Richiede radiazione PRA
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FiXCircle className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-sm font-bold text-slate-200">
                          Senza Obbligo PRA
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Gestione UMC
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {vfuData.flagConsegnaForzeOrdine && (
                  <div>
                    <label className="text-sm font-medium text-slate-500">Consegna Forze Ordine</label>
                    <p className="text-slate-200">{vfuData.flagConsegnaForzeOrdine}</p>
                  </div>
                )}
                {vfuData.dataUltimoAggiornamento && (
                  <div>
                    <label className="text-sm font-medium text-slate-500">Ultimo Aggiornamento</label>
                    <p className="text-slate-200 text-sm">
                      {new Date(vfuData.dataUltimoAggiornamento).toLocaleString('it-IT')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Conferimento */}
      <Modal
        isOpen={showConferimentoModal}
        onClose={() => setShowConferimentoModal(false)}
        title="Conferisci VFU a Centro di Raccolta"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Centro di Raccolta *
            </label>
            <select
              value={conferimentoData.codiceFiscaleImpresa}
              onChange={(e) => {
                const selected = centriRaccolta.find(cr => cr.codiceFiscale === e.target.value);
                setConferimentoData({
                  ...conferimentoData,
                  codiceFiscaleImpresa: e.target.value,
                  matricolaSedeImpresa: selected?.matricolaSede || '',
                });
              }}
              className="w-full px-3 py-2 border border-[#243044] rounded-md bg-[#1a2536] text-slate-200"
            >
              <option value="">Seleziona centro di raccolta</option>
              {centriRaccolta.map((cr) => (
                <option key={cr.codiceFiscale} value={cr.codiceFiscale}>
                  {cr.denominazioneSociale || cr.codiceFiscale} {cr.matricolaSede ? `- ${cr.matricolaSede}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Data Ritiro
            </label>
            <input
              type="date"
              value={conferimentoData.dataRitiro}
              onChange={(e) => setConferimentoData({ ...conferimentoData, dataRitiro: e.target.value })}
              className="w-full px-3 py-2 border border-[#243044] rounded-md bg-[#1a2536] text-slate-200"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="generaCdr"
              checked={conferimentoData.generaCdr}
              onChange={(e) => setConferimentoData({ ...conferimentoData, generaCdr: e.target.checked })}
              className="h-4 w-4 text-blue-400 focus:ring-blue-500/40/40 border-[#243044] rounded"
            />
            <label htmlFor="generaCdr" className="ml-2 block text-sm text-slate-300">
              Genera Certificato di Rottamazione (CDR)
            </label>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={() => setShowConferimentoModal(false)}
              className="px-4 py-2 border border-[#243044] rounded-md text-slate-300 hover:bg-[#141c27]"
            >
              Annulla
            </button>
            <button
              onClick={handleConferimento}
              disabled={actionLoading || !conferimentoData.codiceFiscaleImpresa}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Conferimento...' : 'Conferisci'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Annullamento */}
      <Modal
        isOpen={showAnnullamentoModal}
        onClose={() => setShowAnnullamentoModal(false)}
        title="Annulla VFU"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Motivo Annullamento *
            </label>
            <textarea
              value={motivoAnnullamento}
              onChange={(e) => setMotivoAnnullamento(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-[#243044] rounded-md bg-[#1a2536] text-slate-200"
              placeholder="Inserisci il motivo dell'annullamento..."
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={() => setShowAnnullamentoModal(false)}
              className="px-4 py-2 border border-[#243044] rounded-md text-slate-300 hover:bg-[#141c27]"
            >
              Annulla
            </button>
            <button
              onClick={handleAnnullamento}
              disabled={actionLoading || !motivoAnnullamento.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Annullamento...' : 'Conferma Annullamento'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Invia Email Conferma Demolizione */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEmailModal(false)} />
          <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-5">
            <div className="text-sm font-semibold text-slate-200 mb-1.5">Invia Conferma Demolizione</div>
            <div className="text-xs text-slate-400 mb-4">
              Veicolo: {vfuData?.targa || 'N/A'} — Stato: {vfuData?.statoVFU || vfuData?.statoVfuEnum || '—'}
            </div>
            <label className="block text-xs text-slate-400 mb-1">Email destinatario</label>
            <input
              type="email"
              value={emailTo}
              onChange={e => setEmailTo(e.target.value)}
              placeholder="proprietario@email.com"
              className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 outline-none focus:ring-1 ring-blue-500/30 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowEmailModal(false)}
                className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#243044] transition">
                Annulla
              </button>
              <button
                disabled={!emailTo?.includes('@') || sendingEmail}
                onClick={async () => {
                  setSendingEmail(true);
                  try {
                    const { data: orgData } = await supabase.from('orgs').select('name').eq('id', orgId).maybeSingle();
                    const orgName = orgData?.name || 'RescueManager';
                    const stato = vfuData?.statoVFU || vfuData?.statoVfuEnum || 'in lavorazione';
                    await sendEmailNotification({
                      to: emailTo,
                      title: `Conferma Demolizione - ${vfuData?.targa || 'Veicolo'}`,
                      message: `Gentile Cliente,\n\nLe comunichiamo che il veicolo con targa ${vfuData?.targa || 'N/A'} (telaio: ${vfuData?.telaio || 'N/A'}) risulta in stato: ${stato}.\n\nMarca: ${vfuData?.marca || '—'}\nModello: ${vfuData?.modello || '—'}\nID VFU: ${vfuData?.idVFU || '—'}\n\nPer qualsiasi informazione non esiti a contattarci.\n\nCordiali saluti,\n${orgName}`,
                      orgName,
                    });
                    showSuccess(`Email conferma inviata a ${emailTo}`);
                    setShowEmailModal(false);
                    setEmailTo('');
                  } catch (e) {
                    showError(`Errore invio email: ${e?.message || 'Errore sconosciuto'}`);
                  } finally {
                    setSendingEmail(false);
                  }
                }}
                className="h-8 px-3 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
                <FiMail className="w-3.5 h-3.5 inline mr-1" /> {sendingEmail ? 'Invio...' : 'Invia'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

