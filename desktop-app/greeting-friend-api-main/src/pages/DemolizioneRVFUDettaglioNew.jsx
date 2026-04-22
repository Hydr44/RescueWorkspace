import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiCalendar, FiUser, FiTruck, FiFileText, FiShield,
  FiCheckCircle, FiXCircle, FiAlertCircle, FiRefreshCw, FiEdit
} from 'react-icons/fi';
import { useToast } from '@/hooks/useToast';
import { useRVFUAuth } from '@/hooks/useRVFUAuth';
import { createRVFUClient } from '@/lib/rvfu-client';
import { supabase } from '@/lib/supabase-browser';
import { useOrg } from '@/context/OrgContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import VFUProcessingTimeline from '@/components/rvfu/VFUProcessingTimeline';
import VFUWorkflowStepper from '@/components/rvfu/VFUWorkflowStepper';
import VFUFascicoloTab from '@/components/rvfu/VFUFascicoloTab';
import VFUAzioniTab from '@/components/rvfu/VFUAzioniTab';
import VFUStoricoTab from '@/components/rvfu/VFUStoricoTab';
import { getStatoLabel, getStatoColors, normalizeStato } from '@/lib/vfu-state-machine';
import { logger } from '@/lib/logger';

export default function DemolizioneRVFUDettaglioNew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess, showInfo } = useToast();
  const { orgId } = useOrg();
  const {
    isAuthenticated: rvfuAuthenticated,
    authService,
  } = useRVFUAuth('formation');

  const [loading, setLoading] = useState(true);
  const [vfuData, setVfuData] = useState(null);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [localCaseId, setLocalCaseId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('panoramica');
  const [rvfuClient, setRvfuClient] = useState(null);

  // Tabs configuration
  const tabs = [
    { id: 'panoramica', label: 'Panoramica', icon: FiTruck },
    { id: 'fascicolo', label: 'Fascicolo', icon: FiFileText },
    { id: 'azioni', label: 'Azioni', icon: FiCheckCircle },
    { id: 'storico', label: 'Storico', icon: FiCalendar },
  ];

  useEffect(() => {
    if (rvfuAuthenticated && authService) {
      const client = createRVFUClient(authService, 'formation');
      setRvfuClient(client);
      loadVFUDetail(client);
    } else {
      loadLocalDetail();
    }
  }, [id, rvfuAuthenticated, authService]);

  const loadLocalDetail = async () => {
    if (!id) return;
    // Se l'ID è numerico è un idVFU RVFU, non un UUID Supabase — skip sempre
    const isNumericId = /^\d+$/.test(id);
    if (isNumericId) {
      return;
    }
    setLoading(true);
    setIsLocalMode(true);
    try {
      let query = supabase
        .from('demolition_cases')
        .select('*')
        .eq('org_id', orgId);

      if (isNumericId) {
        // Cerca per rvfu_id (intero) invece che per id (uuid)
        query = query.eq('rvfu_id', id);
      } else {
        query = query.eq('id', id);
      }

      const { data, error } = await query.single();

      if (error) throw error;
      if (!data) throw new Error('Caso non trovato');

      setLocalCaseId(data.id);
      const meta = data.meta || {};
      
      setVfuData({
        idVFU: data.rvfu_id || data.id,
        targa: data.targa || '',
        telaio: data.telaio || '',
        tipoVeicolo: meta.rvfu?.tipoVeicolo || 'A',
        marca: meta.rvfu?.marca || '',
        modello: meta.rvfu?.modello || '',
        marcaModello: data.marca_modello || '',
        annoImmatricolazione: data.anno || '',
        causale: meta.rvfu?.causale || data.demolizione_causale || '',
        descrizioneCausale: meta.rvfu?.causale || data.demolizione_causale || '',
        obbligoIscrizionePRA: meta.rvfu?.obbligoIscrizionePRA || 'S',
        statoVFU: data.rvfu_status || 'INSERITO',
        statoFascicolo: meta.fascicolo?.stato || 'INSERITO',
        dataRegistrazione: data.created_at,
        dataUltimoAggiornamento: data.updated_at,
        intestatario: meta.intestatario || {},
        detentore: meta.detentore || null,
        noteAggiuntive: data.note || meta.rvfu?.noteAggiuntive || '',
        notePartiRifiuti: meta.rvfu?.notePartiRifiuti || '',
        _isLocal: true,
        _rawData: data,
      });
    } catch (error) {
      logger.error('Error loading local case:', error);
      showError(`Errore caricamento: ${error.message}`);
      navigate('/demolizioni-rvfu');
    } finally {
      setLoading(false);
    }
  };

  const loadVFUDetail = async (client) => {
    if (!id || !client) return;

    setLoading(true);
    setIsLocalMode(false);
    try {
      const idVFU = id.startsWith('rvfu_') ? id.replace('rvfu_', '') : id;
      const response = await client.dettaglioVFU(Number.parseInt(idVFU, 10));
      
      const vfu = response.result || response.payload || response;
      // Normalizza statoVFU da formato ACI (spazi) a formato interno (underscore)
      if (vfu.statoVFU) {
        vfu.statoVFU = normalizeStato(vfu.statoVFU);
      }
      // Normalizza statoFascicolo da formato ACI ('Inserito'/'Chiuso') a uppercase
      if (vfu.statoFascicolo) {
        vfu.statoFascicolo = vfu.statoFascicolo.toUpperCase();
      }
      console.log('[RVFU Detail] VFU loaded:', { idVFU: vfu.idVFU, statoVFU: vfu.statoVFU, statoFascicolo: vfu.statoFascicolo });
      setVfuData(vfu);
    } catch (error) {
      logger.error('Error loading VFU detail:', error);
      showError(`Errore caricamento: ${error.message}`);
      navigate('/demolizioni-rvfu');
    } finally {
      setLoading(false);
    }
  };

  const handleAzioneClick = async (azione, data) => {
    if (!rvfuClient && !isLocalMode) {
      showError('Client RVFU non disponibile');
      return;
    }

    setActionLoading(true);
    try {
      const idVFU = vfuData.idVFU;

      switch (azione) {
        case 'chiudiFascicolo': {
          const chiudiResp = await rvfuClient.chiudiFascicolo(idVFU);
          console.log('[RVFU] chiudiFascicolo response:', JSON.stringify(chiudiResp, null, 2));
          const chiudiEsito = chiudiResp?.esito;
          if (chiudiEsito && chiudiEsito.responseStatus !== 'OK' && chiudiEsito.code !== 'E000') {
            throw new Error(chiudiEsito.message || chiudiEsito.descrizione || `Errore chiusura fascicolo (${chiudiEsito.code})`);
          }
          showSuccess('Fascicolo chiuso con successo');
          break;
        }

        case 'riapriFascicolo': {
          const riapriResp = await rvfuClient.riapriFascicolo(idVFU);
          const riapriEsito = riapriResp?.esito;
          if (riapriEsito && riapriEsito.responseStatus !== 'OK' && riapriEsito.code !== 'E000') {
            throw new Error(riapriEsito.message || riapriEsito.descrizione || `Errore riapertura fascicolo (${riapriEsito.code})`);
          }
          showSuccess('Fascicolo riaperto con successo');
          break;
        }

        case 'inoltraSTA': {
          if (!data.codiceSTA) {
            showError('Seleziona agenzia STA');
            return;
          }
          const staResp = await rvfuClient.inoltraSTA(data.codiceSTA, [idVFU]);
          const staEsito = staResp?.esito;
          if (staEsito && staEsito.responseStatus !== 'OK' && staEsito.code !== 'E000') {
            throw new Error(staEsito.message || staEsito.descrizione || `Errore inoltro STA (${staEsito.code})`);
          }
          showSuccess('VFU inoltrato a STA con successo');
          break;
        }

        case 'confermaRadiazione': {
          const radResp = await rvfuClient.confermaRadiazione(idVFU);
          const radEsito = radResp?.esito;
          if (radEsito && radEsito.responseStatus !== 'OK' && radEsito.code !== 'E000') {
            throw new Error(radEsito.message || radEsito.descrizione || `Errore conferma radiazione (${radEsito.code})`);
          }
          showSuccess('Radiazione confermata con successo');
          break;
        }

        case 'generaCDR': {
          const cdrResponse = await rvfuClient.generaCDR(idVFU);
          const cdrEsito = cdrResponse?.esito;
          const cdrOk = cdrEsito?.responseStatus === 'OK' || cdrEsito?.code === 'E000';
          if (cdrOk) {
            showSuccess('CDR generato con successo. Scaricalo dalla tab Fascicolo.');
          } else {
            throw new Error(cdrEsito?.message || 'Errore generazione CDR');
          }
          break;
        }

        case 'generaRicevuta': {
          const ricResponse = await rvfuClient.generaRicevuta(idVFU);
          const ricEsito = ricResponse?.esito;
          const ricOk = ricEsito?.responseStatus === 'OK' || ricEsito?.code === 'E000';
          if (ricOk) {
            showSuccess('Ricevuta generata con successo. Scaricala dalla tab Fascicolo.');
          } else {
            throw new Error(ricEsito?.message || 'Errore generazione ricevuta');
          }
          break;
        }

        case 'verificaVFU': {
          const causale = vfuData.causale || vfuData.descrizioneCausale || 'D';
          const verResponse = await rvfuClient.verificaVFU(idVFU, causale);
          const verEsito = verResponse?.esito;
          const verOk = verEsito?.responseStatus === 'OK' || verEsito?.code === 'E000';
          if (verOk) {
            showSuccess('VFU verificato \u2192 stato VALIDATO');
          } else {
            throw new Error(verEsito?.message || 'Errore verifica VFU');
          }
          break;
        }

        case 'aggiorna': {
          const updatePayload = { ...data };
          if (!Object.keys(updatePayload).length) {
            showInfo('Nessun dato da aggiornare');
            return;
          }
          const updResponse = await rvfuClient.aggiornaVFU(idVFU, updatePayload);
          const updEsito = updResponse?.esito;
          const updOk = updEsito?.responseStatus === 'OK' || updEsito?.code === 'E000';
          if (updOk) {
            showSuccess('VFU aggiornato con successo');
          } else {
            throw new Error(updEsito?.message || 'Errore aggiornamento VFU');
          }
          break;
        }

        case 'demolisci':
          await rvfuClient.demolisciVFU(idVFU, data);
          showSuccess('VFU segnato come demolito');
          break;

        case 'annulla':
          await rvfuClient.annullaVFU(idVFU, data);
          showSuccess('VFU annullato con successo');
          navigate('/demolizioni-rvfu');
          return;

        case 'prendiInCarico':
          await rvfuClient.prendiInCarico(idVFU, data);
          showSuccess('VFU preso in carico');
          break;

        case 'annullaInoltroSTA':
          await rvfuClient.annullaInoltroSTA(idVFU);
          showSuccess('Inoltro STA annullato');
          break;

        case 'cedi':
          if (!data.codiceFiscaleDestinatario) {
            showError('Inserisci il codice fiscale del destinatario');
            return;
          }
          await rvfuClient.cediVFU(idVFU, data);
          showSuccess('VFU ceduto con successo');
          break;

        case 'trasferisci':
          await rvfuClient.trasferisciVFU(idVFU, data);
          showSuccess('VFU trasferito con successo');
          break;

        case 'integra':
          if (!data.datiIntegrazione) {
            showError('Inserisci i dati di integrazione richiesti');
            return;
          }
          await rvfuClient.integraVFU(idVFU, data);
          showSuccess('Integrazione inviata con successo');
          break;

        case 'allegaDocumento':
          setActiveTab('fascicolo');
          showInfo('Usa il tab Fascicolo per allegare documenti');
          setActionLoading(false);
          return;

        case 'generaPostillaCdr': {
          const postResponse = await rvfuClient.generaPostillaCdr(idVFU);
          const postEsito = postResponse?.esito;
          const postOk = postEsito?.responseStatus === 'OK' || postEsito?.code === 'E000';
          if (postOk) {
            showSuccess('Postilla CDR generata. Scaricala dalla tab Fascicolo.');
          } else {
            throw new Error(postEsito?.message || 'Errore generazione postilla CDR');
          }
          break;
        }

        default:
          showInfo(`Azione ${azione} non ancora implementata`);
          return;
      }

      // Reload data
      if (isLocalMode) {
        await loadLocalDetail();
      } else if (rvfuClient) {
        await loadVFUDetail(rvfuClient);
      }
    } catch (error) {
      logger.error(`Error executing action ${azione}:`, error);
      showError(`Errore: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleChiudiFascicolo = () => handleAzioneClick('chiudiFascicolo', {});
  const handleRiapriFascicolo = () => handleAzioneClick('riapriFascicolo', {});

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
          <h2 className="text-lg font-semibold text-white mb-2">VFU non trovato</h2>
          <button
            onClick={() => navigate('/demolizioni-rvfu')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Torna alla lista
          </button>
        </div>
      </div>
    );
  }

  const statoColors = getStatoColors(vfuData.statoVFU);

  return (
    <div className="min-h-screen bg-[#141c27]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/demolizioni-rvfu')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <FiArrowLeft className="h-5 w-5" />
            Torna alla lista
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-3">
                {vfuData.targa || 'N/A'}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                {isLocalMode && (
                  <span className="px-3 py-1 text-xs font-medium bg-amber-600/20 text-amber-400 rounded-full border border-amber-500/30">
                    Locale
                  </span>
                )}
                <span className={`px-3 py-1 text-xs font-medium ${statoColors.badge} rounded-full`}>
                  {getStatoLabel(vfuData.statoVFU)}
                </span>
                {vfuData.obbligoIscrizionePRA === 'S' && (
                  <span className="px-3 py-1 text-xs font-medium bg-blue-600/20 text-blue-400 rounded-full border border-blue-500/30 flex items-center gap-1">
                    <FiShield className="h-3 w-3" />
                    Con PRA
                  </span>
                )}
                <span className="text-sm text-gray-400">
                  ID: {vfuData.idVFU}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {isLocalMode && localCaseId && (
                <button
                  onClick={() => navigate(`/demolizioni-rvfu/${localCaseId}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <FiEdit className="h-4 w-4" />
                  Modifica
                </button>
              )}
              <button
                onClick={isLocalMode ? loadLocalDetail : () => loadVFUDetail(rvfuClient)}
                className="px-4 py-2 bg-[#1a2536] text-gray-300 border border-[#243044] rounded-lg hover:bg-[#243044] flex items-center gap-2"
              >
                <FiRefreshCw className="h-4 w-4" />
                Aggiorna
              </button>
            </div>
          </div>
        </div>

        {/* Workflow Stepper */}
        <div className="mb-6">
          <VFUWorkflowStepper statoCorrente={vfuData.statoVFU} />
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-[#243044]">
            <nav className="flex gap-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'panoramica' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Dati Veicolo */}
                <div className="bg-[#1a2536]/90 backdrop-blur-sm rounded-xl border border-[#243044] p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FiTruck className="h-5 w-5 text-blue-400" />
                    Dati Veicolo
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Targa</div>
                      <div className="text-white font-semibold">{vfuData.targa || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Telaio</div>
                      <div className="text-white font-mono text-sm">{vfuData.telaio || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Marca / Modello</div>
                      <div className="text-white">{vfuData.marcaModello || `${vfuData.marca || ''} ${vfuData.modello || ''}`.trim() || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Anno</div>
                      <div className="text-white">{vfuData.annoImmatricolazione || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Tipo Veicolo</div>
                      <div className="text-white">{vfuData.tipoVeicolo || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Causale</div>
                      <div className="text-white">{vfuData.descrizioneCausale || vfuData.causale || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Date */}
                  {(vfuData.dataRegistrazione || vfuData.dataRitiro || vfuData.dataPresaInCarico) && (
                    <div className="mt-6 pt-6 border-t border-[#243044]">
                      <h3 className="text-sm font-semibold text-gray-300 mb-3">Date importanti</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {vfuData.dataRegistrazione && (
                          <div>
                            <div className="text-sm text-gray-400 mb-1">Registrazione</div>
                            <div className="text-white text-sm">{new Date(vfuData.dataRegistrazione).toLocaleDateString('it-IT')}</div>
                          </div>
                        )}
                        {vfuData.dataPresaInCarico && (
                          <div>
                            <div className="text-sm text-gray-400 mb-1">Presa in carico</div>
                            <div className="text-white text-sm">{new Date(vfuData.dataPresaInCarico).toLocaleDateString('it-IT')}</div>
                          </div>
                        )}
                        {vfuData.dataRadiazione && (
                          <div>
                            <div className="text-sm text-gray-400 mb-1">Radiazione</div>
                            <div className="text-white text-sm">{new Date(vfuData.dataRadiazione).toLocaleDateString('it-IT')}</div>
                          </div>
                        )}
                        {vfuData.dataDemolizione && (
                          <div>
                            <div className="text-sm text-gray-400 mb-1">Demolizione</div>
                            <div className="text-white text-sm">{new Date(vfuData.dataDemolizione).toLocaleDateString('it-IT')}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Intestatario */}
                {vfuData.intestatario && Object.keys(vfuData.intestatario).length > 0 && (
                  <div className="bg-[#1a2536]/90 backdrop-blur-sm rounded-xl border border-[#243044] p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FiUser className="h-5 w-5 text-blue-400" />
                      Intestatario
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      {vfuData.intestatario.nome && (
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Nome</div>
                          <div className="text-white">{vfuData.intestatario.nome}</div>
                        </div>
                      )}
                      {vfuData.intestatario.cognome && (
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Cognome</div>
                          <div className="text-white">{vfuData.intestatario.cognome}</div>
                        </div>
                      )}
                      {vfuData.intestatario.codiceFiscale && (
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Codice Fiscale</div>
                          <div className="text-white font-mono text-sm">{vfuData.intestatario.codiceFiscale}</div>
                        </div>
                      )}
                      {vfuData.intestatario.comuneResidenza && (
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Residenza</div>
                          <div className="text-white text-sm">
                            {typeof vfuData.intestatario.comuneResidenza === 'object'
                              ? vfuData.intestatario.comuneResidenza.denominazione || vfuData.intestatario.comuneResidenza.codice || '—'
                              : vfuData.intestatario.comuneResidenza}
                          </div>
                        </div>
                      )}
                      {vfuData.intestatario.provinciaResidenza && (
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Provincia</div>
                          <div className="text-white text-sm">
                            {typeof vfuData.intestatario.provinciaResidenza === 'object'
                              ? vfuData.intestatario.provinciaResidenza.denominazione || vfuData.intestatario.provinciaResidenza.codice || '—'
                              : vfuData.intestatario.provinciaResidenza}
                          </div>
                        </div>
                      )}
                      {vfuData.intestatario.indirizzoResidenza && (
                        <div className="col-span-2">
                          <div className="text-sm text-gray-400 mb-1">Indirizzo</div>
                          <div className="text-white text-sm">
                            {vfuData.intestatario.indirizzoResidenza}
                            {vfuData.intestatario.capResidenza && ` — ${vfuData.intestatario.capResidenza}`}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Detentore (se diverso da intestatario) */}
                {vfuData.detentore && Object.keys(vfuData.detentore).length > 0 && (
                  <div className="bg-[#1a2536]/90 backdrop-blur-sm rounded-xl border border-[#243044] p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FiUser className="h-5 w-5 text-yellow-400" />
                      Detentore
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      {vfuData.detentore.nome && (
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Nome</div>
                          <div className="text-white">{vfuData.detentore.nome}</div>
                        </div>
                      )}
                      {vfuData.detentore.cognome && (
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Cognome</div>
                          <div className="text-white">{vfuData.detentore.cognome}</div>
                        </div>
                      )}
                      {vfuData.detentore.codiceFiscale && (
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Codice Fiscale</div>
                          <div className="text-white font-mono text-sm">{vfuData.detentore.codiceFiscale}</div>
                        </div>
                      )}
                      {vfuData.detentore.comuneResidenza && (
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Comune</div>
                          <div className="text-white text-sm">
                            {typeof vfuData.detentore.comuneResidenza === 'object'
                              ? vfuData.detentore.comuneResidenza.denominazione || vfuData.detentore.comuneResidenza.codice || '—'
                              : vfuData.detentore.comuneResidenza}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Centro di Raccolta */}
                {vfuData.centroRaccolta && (
                  <div className="bg-[#1a2536]/90 backdrop-blur-sm rounded-xl border border-[#243044] p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FiTruck className="h-5 w-5 text-green-400" />
                      Centro di Raccolta
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      {vfuData.centroRaccolta.denominazioneSociale && (
                        <div className="col-span-2">
                          <div className="text-sm text-gray-400 mb-1">Denominazione</div>
                          <div className="text-white">{vfuData.centroRaccolta.denominazioneSociale}</div>
                        </div>
                      )}
                      {vfuData.centroRaccolta.codiceFiscale && (
                        <div>
                          <div className="text-sm text-gray-400 mb-1">CF / P.IVA</div>
                          <div className="text-white font-mono text-sm">{vfuData.centroRaccolta.codiceFiscale}</div>
                        </div>
                      )}
                      {vfuData.centroRaccolta.matricolaSede && (
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Matricola</div>
                          <div className="text-white font-mono text-sm">{vfuData.centroRaccolta.matricolaSede}</div>
                        </div>
                      )}
                      {vfuData.centroRaccolta.indirizzoSede && (
                        <div className="col-span-2">
                          <div className="text-sm text-gray-400 mb-1">Sede</div>
                          <div className="text-white text-sm">{vfuData.centroRaccolta.indirizzoSede}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Concessionario (se presente) */}
                {vfuData.concessionario && (
                  <div className="bg-[#1a2536]/90 backdrop-blur-sm rounded-xl border border-[#243044] p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FiUser className="h-5 w-5 text-indigo-400" />
                      Concessionario
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      {vfuData.concessionario.denominazioneSociale && (
                        <div className="col-span-2">
                          <div className="text-sm text-gray-400 mb-1">Denominazione</div>
                          <div className="text-white">{vfuData.concessionario.denominazioneSociale}</div>
                        </div>
                      )}
                      {vfuData.concessionario.codiceFiscale && (
                        <div>
                          <div className="text-sm text-gray-400 mb-1">CF / P.IVA</div>
                          <div className="text-white font-mono text-sm">{vfuData.concessionario.codiceFiscale}</div>
                        </div>
                      )}
                      {vfuData.concessionario.matricolaSede && (
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Matricola</div>
                          <div className="text-white font-mono text-sm">{vfuData.concessionario.matricolaSede}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Note */}
                {(vfuData.noteAggiuntive || vfuData.notePartiRifiuti) && (
                  <div className="bg-[#1a2536]/90 backdrop-blur-sm rounded-xl border border-[#243044] p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FiFileText className="h-5 w-5 text-blue-400" />
                      Note
                    </h2>
                    {vfuData.noteAggiuntive && (
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-1">Note aggiuntive</div>
                        <div className="text-white text-sm">{vfuData.noteAggiuntive}</div>
                      </div>
                    )}
                    {vfuData.notePartiRifiuti && (
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Note parti rifiuti</div>
                        <div className="text-white text-sm">{vfuData.notePartiRifiuti}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Processing Timeline - solo locale */}
                {isLocalMode && localCaseId && (
                  <div className="bg-[#1a2536]/90 backdrop-blur-sm rounded-xl border border-[#243044] p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">Fasi lavorazione</h3>
                    <VFUProcessingTimeline
                      caseId={localCaseId}
                      orgId={orgId}
                      targa={vfuData.targa}
                      telaio={vfuData.telaio}
                      onStepChange={loadLocalDetail}
                    />
                  </div>
                )}

                {/* Info rapide */}
                <div className="bg-[#1a2536]/90 backdrop-blur-sm rounded-xl border border-[#243044] p-6">
                  <h3 className="text-sm font-semibold text-white mb-4">Informazioni</h3>
                  <div className="space-y-3">
                    <div className={`p-3 rounded-lg border-2 ${
                      vfuData.obbligoIscrizionePRA === 'S'
                        ? 'border-blue-500/30 bg-blue-500/10'
                        : 'border-gray-600/30 bg-gray-600/10'
                    }`}>
                      <div className="flex items-center gap-2">
                        {vfuData.obbligoIscrizionePRA === 'S' ? (
                          <FiShield className="h-5 w-5 text-blue-400" />
                        ) : (
                          <FiXCircle className="h-5 w-5 text-gray-400" />
                        )}
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {vfuData.obbligoIscrizionePRA === 'S' ? 'Con obbligo PRA' : 'Senza obbligo PRA'}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {vfuData.obbligoIscrizionePRA === 'S' ? 'Richiede radiazione' : 'Gestione UMC'}
                          </div>
                        </div>
                      </div>
                    </div>
                    {vfuData.dataUltimoAggiornamento && (
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Ultimo aggiornamento</div>
                        <div className="text-white text-xs">
                          {new Date(vfuData.dataUltimoAggiornamento).toLocaleString('it-IT')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fascicolo' && (
            <VFUFascicoloTab
              idVFU={vfuData.idVFU}
              rvfuClient={rvfuClient}
              onDocumentsChange={() => {}}
              fascicoloStato={vfuData.statoFascicolo}
              onChiudiFascicolo={handleChiudiFascicolo}
              onRiapriFascicolo={handleRiapriFascicolo}
            />
          )}

          {activeTab === 'azioni' && (
            <VFUAzioniTab
              statoVFU={vfuData.statoVFU}
              fascicoloStato={vfuData.statoFascicolo}
              onAzioneClick={handleAzioneClick}
              loading={actionLoading}
              rvfuClient={rvfuClient}
            />
          )}

          {activeTab === 'storico' && (
            <VFUStoricoTab vfuData={vfuData} />
          )}
        </div>
      </div>
    </div>
  );
}
