// src/components/rvfu/RVFUDetail.jsx
// Componente per visualizzare i dettagli di un VFU

import { useState, useEffect } from 'react';
import { 
  FiTruck, FiUser, FiFileText, FiCalendar, FiMapPin,
  FiEdit, FiTrash2, FiX, FiDownload, FiUpload,
  FiCheckCircle, FiAlertCircle, FiClock, FiEye
} from 'react-icons/fi';
import { useRVFU } from '@/hooks/useRVFU';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import PropTypes from 'prop-types';

const RVFUDetail = ({ vfuId, onClose, onEdit, onDelete }) => {
  const {
    loading,
    error,
    data,
    getVFU,
    getDocumentiVFU,
    getFascicolo,
    clearError
  } = useRVFU();

  const [activeTab, setActiveTab] = useState('details');
  const [documents, setDocuments] = useState([]);
  const [fascicolo, setFascicolo] = useState(null);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    if (vfuId) {
      loadVFUDetails();
    }
  }, [vfuId]);

  const loadVFUDetails = async () => {
    try {
      const vfuData = await getVFU(vfuId);
      if (vfuData && vfuData.idFascicolo) {
        loadDocuments(vfuData.idFascicolo);
        loadFascicolo(vfuData.idFascicolo);
      }
    } catch (err) {
      console.error('Errore caricamento dettagli VFU:', err);
    }
  };

  const loadDocuments = async (fascicoloId) => {
    try {
      setLoadingDocs(true);
      const docs = await getDocumentiVFU(vfuId);
      if (docs) {
        setDocuments(docs);
      }
    } catch (err) {
      console.error('Errore caricamento documenti:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const loadFascicolo = async (fascicoloId) => {
    try {
      const fascicoloData = await getFascicolo(fascicoloId);
      if (fascicoloData) {
        setFascicolo(fascicoloData);
      }
    } catch (err) {
      console.error('Errore caricamento fascicolo:', err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'INSERITO': 'bg-blue-500/10 text-blue-400',
      'VALIDATO': 'bg-yellow-500/10 text-yellow-400',
      'PRESO_IN_CARICO': 'bg-purple-500/10 text-purple-400',
      'CONFERITO': 'bg-blue-500/10 text-blue-400',
      'INVIATO_A_STA': 'bg-orange-500/10 text-orange-400',
      'IN_RADIAZIONE': 'bg-red-500/10 text-red-400',
      'RADIATO': 'bg-green-500/10 text-green-400',
      'DEMOLITO': 'bg-[#141c27] text-slate-200',
      'ANNULLATO': 'bg-red-500/10 text-red-400'
    };
    return colors[status] || 'bg-[#141c27] text-slate-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'INSERITO': FiClock,
      'VALIDATO': FiCheckCircle,
      'PRESO_IN_CARICO': FiTruck,
      'CONFERITO': FiFileText,
      'INVIATO_A_STA': FiUpload,
      'IN_RADIAZIONE': FiAlertCircle,
      'RADIATO': FiCheckCircle,
      'DEMOLITO': FiCheckCircle,
      'ANNULLATO': FiAlertCircle
    };
    return icons[status] || FiClock;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWorkflowProgress = (status) => {
    const steps = [
      { key: 'INSERITO', label: 'Inserito', completed: true },
      { key: 'VALIDATO', label: 'Validato', completed: ['VALIDATO', 'PRESO_IN_CARICO', 'CONFERITO', 'INVIATO_A_STA', 'IN_RADIAZIONE', 'RADIATO', 'DEMOLITO'].includes(status) },
      { key: 'PRESO_IN_CARICO', label: 'Preso in Carico', completed: ['PRESO_IN_CARICO', 'CONFERITO', 'INVIATO_A_STA', 'IN_RADIAZIONE', 'RADIATO', 'DEMOLITO'].includes(status) },
      { key: 'CONFERITO', label: 'Conferito', completed: ['CONFERITO', 'INVIATO_A_STA', 'IN_RADIAZIONE', 'RADIATO', 'DEMOLITO'].includes(status) },
      { key: 'RADIATO', label: 'Radiato', completed: ['RADIATO', 'DEMOLITO'].includes(status) },
      { key: 'DEMOLITO', label: 'Demolito', completed: status === 'DEMOLITO' }
    ];

    return steps;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Caricamento dettagli VFU..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <FiAlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={clearError}
          className="btn btn-outline"
        >
          Riprova
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <FiTruck className="h-12 w-12 text-slate-500 mx-auto mb-4" />
        <p className="text-slate-400">VFU non trovato</p>
      </div>
    );
  }

  const vfu = data;
  const workflowSteps = getWorkflowProgress(vfu.statoVfuEnum);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-200 ">
            VFU {vfu.targa}
          </h2>
          <p className="text-slate-400  mt-1">
            ID: {vfu.idVFU} • Telaio: {vfu.telaio}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit && onEdit(vfu)}
            className="btn btn-outline animate-fade-in"
          >
            <FiEdit className="h-4 w-4" />
            Modifica
          </button>
          <button
            onClick={() => onDelete && onDelete(vfu)}
            className="btn btn-danger animate-fade-in"
          >
            <FiTrash2 className="h-4 w-4" />
            Elimina
          </button>
          <button
            onClick={onClose}
            className="btn btn-ghost animate-fade-in"
          >
            <FiX className="h-4 w-4" />
            Chiudi
          </button>
        </div>
      </div>

      {/* Stato e Progresso */}
      <AnimatedCard className="animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getStatusColor(vfu.statoVfuEnum)}`}>
              {(() => {
                const Icon = getStatusIcon(vfu.statoVfuEnum);
                return <Icon className="h-6 w-6" />;
              })()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-200 ">
                Stato: {vfu.statoVfuEnum}
              </h3>
              <p className="text-sm text-slate-400 ">
                Ultimo aggiornamento: {formatDate(vfu.dataUltimoAggiornamento)}
              </p>
            </div>
          </div>
        </div>

        {/* Workflow Progress */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-300 ">
            Progresso Workflow
          </h4>
          <div className="flex items-center space-x-2">
            {workflowSteps.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                  ${step.completed 
                    ? 'bg-green-500/10 text-white' 
                    : 'bg-[#243044] text-slate-400'
                  }
                `}>
                  {index + 1}
                </div>
                <span className={`
                  ml-2 text-sm
                  ${step.completed 
                    ? 'text-green-600 font-medium' 
                    : 'text-slate-500'
                  }
                `}>
                  {step.label}
                </span>
                {index < workflowSteps.length - 1 && (
                  <div className={`
                    w-8 h-0.5 mx-2
                    ${step.completed ? 'bg-green-500/10' : 'bg-[#243044]'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>
      </AnimatedCard>

      {/* Tabs */}
      <div className="border-b border-[#243044] ">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'details', label: 'Dettagli', icon: FiTruck },
            { id: 'subjects', label: 'Soggetti', icon: FiUser },
            { id: 'documents', label: 'Documenti', icon: FiFileText },
            { id: 'timeline', label: 'Timeline', icon: FiCalendar }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-200 ease-out
                ${activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-[#243044]'
                }
              `}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dati Veicolo */}
            <AnimatedCard className="stagger-item" style={{ animationDelay: '0ms' }}>
              <div className="flex items-center gap-2 mb-4">
                <FiTruck className="h-5 w-5 text-slate-400" />
                <h3 className="text-lg font-semibold text-slate-200 ">
                  Dati Veicolo
                </h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400 ">Targa:</span>
                  <span className="text-sm font-medium text-slate-200 ">{vfu.targa}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400 ">Telaio:</span>
                  <span className="text-sm font-medium text-slate-200 ">{vfu.telaio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400 ">Tipo Veicolo:</span>
                  <span className="text-sm font-medium text-slate-200 ">{vfu.tipoVeicolo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400 ">Causale:</span>
                  <span className="text-sm font-medium text-slate-200 ">{vfu.causale}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400 ">CIC:</span>
                  <span className="text-sm font-medium text-slate-200 ">{vfu.cic || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400 ">Obbligo PRA:</span>
                  <span className="text-sm font-medium text-slate-200 ">{vfu.obbligoIscrizionePRA}</span>
                </div>
              </div>
            </AnimatedCard>

            {/* Date Importanti */}
            <AnimatedCard className="stagger-item" style={{ animationDelay: '50ms' }}>
              <div className="flex items-center gap-2 mb-4">
                <FiCalendar className="h-5 w-5 text-slate-400" />
                <h3 className="text-lg font-semibold text-slate-200 ">
                  Date Importanti
                </h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400 ">Data Registrazione:</span>
                  <span className="text-sm font-medium text-slate-200 ">{formatDate(vfu.dataRegistrazione)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400 ">Data Ritiro:</span>
                  <span className="text-sm font-medium text-slate-200 ">{formatDate(vfu.dataRitiro)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400 ">Data Conferimento:</span>
                  <span className="text-sm font-medium text-slate-200 ">{formatDate(vfu.dataConferimento)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400 ">Data Presa in Carico:</span>
                  <span className="text-sm font-medium text-slate-200 ">{formatDate(vfu.dataPresaInCarico)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400 ">Data Radiazione:</span>
                  <span className="text-sm font-medium text-slate-200 ">{formatDate(vfu.dataRadiazione)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400 ">Data Demolizione:</span>
                  <span className="text-sm font-medium text-slate-200 ">{formatDate(vfu.dataDemolizione)}</span>
                </div>
              </div>
            </AnimatedCard>

            {/* Note */}
            {(vfu.noteAggiuntive || vfu.notePartiRifiuti) && (
              <AnimatedCard className="lg:col-span-2 stagger-item" style={{ animationDelay: '100ms' }}>
                <div className="flex items-center gap-2 mb-4">
                  <FiFileText className="h-5 w-5 text-slate-400" />
                  <h3 className="text-lg font-semibold text-slate-200 ">
                    Note
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vfu.noteAggiuntive && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300  mb-2">
                        Note Aggiuntive
                      </h4>
                      <p className="text-sm text-slate-400 ">
                        {vfu.noteAggiuntive}
                      </p>
                    </div>
                  )}
                  {vfu.notePartiRifiuti && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300  mb-2">
                        Note Parti Rifiuti
                      </h4>
                      <p className="text-sm text-slate-400 ">
                        {vfu.notePartiRifiuti}
                      </p>
                    </div>
                  )}
                </div>
              </AnimatedCard>
            )}
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Intestatario */}
            {vfu.intestatario && (
              <AnimatedCard className="stagger-item" style={{ animationDelay: '0ms' }}>
                <div className="flex items-center gap-2 mb-4">
                  <FiUser className="h-5 w-5 text-slate-400" />
                  <h3 className="text-lg font-semibold text-slate-200 ">
                    Intestatario
                  </h3>
                </div>
                
                <SoggettoDetails soggetto={vfu.intestatario} />
              </AnimatedCard>
            )}

            {/* Detentore */}
            {vfu.detentore && (
              <AnimatedCard className="stagger-item" style={{ animationDelay: '50ms' }}>
                <div className="flex items-center gap-2 mb-4">
                  <FiUser className="h-5 w-5 text-slate-400" />
                  <h3 className="text-lg font-semibold text-slate-200 ">
                    Detentore
                  </h3>
                </div>
                
                <SoggettoDetails soggetto={vfu.detentore} />
              </AnimatedCard>
            )}

            {/* Detentore Rappresentante */}
            {vfu.detentoreRappresentante && (
              <AnimatedCard className="lg:col-span-2 stagger-item" style={{ animationDelay: '100ms' }}>
                <div className="flex items-center gap-2 mb-4">
                  <FiUser className="h-5 w-5 text-slate-400" />
                  <h3 className="text-lg font-semibold text-slate-200 ">
                    Detentore Rappresentante
                  </h3>
                </div>
                
                <SoggettoDetails soggetto={vfu.detentoreRappresentante} />
              </AnimatedCard>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            {/* Distinta Documenti */}
            {vfu.distinta && (
              <AnimatedCard className="animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                  <FiFileText className="h-5 w-5 text-slate-400" />
                  <h3 className="text-lg font-semibold text-slate-200 ">
                    Distinta Documenti
                  </h3>
                </div>
                
                <DistintaDetails distinta={vfu.distinta} />
              </AnimatedCard>
            )}

            {/* Documenti Allegati */}
            <AnimatedCard className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FiFileText className="h-5 w-5 text-slate-400" />
                  <h3 className="text-lg font-semibold text-slate-200 ">
                    Documenti Allegati
                  </h3>
                </div>
                <button
                  onClick={() => loadDocuments(vfu.idFascicolo)}
                  disabled={loadingDocs}
                  className="btn btn-outline btn-sm"
                >
                  <FiRefreshCw className={`h-4 w-4 ${loadingDocs ? 'animate-spin' : ''}`} />
                  Aggiorna
                </button>
              </div>
              
              {loadingDocs ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner text="Caricamento documenti..." />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8">
                  <FiFileText className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">Nessun documento allegato</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc, index) => (
                    <div
                      key={doc.idAciDocumento}
                      className="flex items-center justify-between p-3 border border-[#243044]  rounded-lg stagger-item"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <FiFileText className="h-5 w-5 text-slate-400" />
                        <div>
                          <h4 className="text-sm font-medium text-slate-200 ">
                            {doc.fileName || doc.tipoDocumento}
                          </h4>
                          <p className="text-xs text-slate-400 ">
                            {doc.tipoDocumento} • {formatDate(doc.dataInserimento)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          doc.statoDocumentoEnum === 'FIRMATO' ? 'bg-green-500/10 text-green-400' :
                          doc.statoDocumentoEnum === 'INSERITO' ? 'bg-blue-500/10 text-blue-400' :
                          'bg-[#141c27] text-slate-200'
                        }`}>
                          {doc.statoDocumentoEnum}
                        </span>
                        <button className="p-1 text-slate-500 hover:text-slate-400">
                          <FiEye className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-slate-500 hover:text-slate-400">
                          <FiDownload className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AnimatedCard>
          </div>
        )}

        {activeTab === 'timeline' && (
          <AnimatedCard className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <FiCalendar className="h-5 w-5 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-200 ">
                Timeline Eventi
              </h3>
            </div>
            
            <div className="space-y-4">
              {[
                { label: 'Registrazione', date: vfu.dataRegistrazione, icon: FiCheckCircle },
                { label: 'Ritiro', date: vfu.dataRitiro, icon: FiTruck },
                { label: 'Conferimento', date: vfu.dataConferimento, icon: FiUpload },
                { label: 'Presa in Carico', date: vfu.dataPresaInCarico, icon: FiCheckCircle },
                { label: 'Invio a STA', date: vfu.dataNotificaInoltroSTA, icon: FiUpload },
                { label: 'Radiazione', date: vfu.dataRadiazione, icon: FiCheckCircle },
                { label: 'Demolizione', date: vfu.dataDemolizione, icon: FiTrash2 }
              ].filter(event => event.date).map((event, index) => (
                <div
                  key={event.label}
                  className="flex items-center gap-3 stagger-item"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500/10 text-indigo-600 rounded-full flex items-center justify-center">
                      <event.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-slate-200 ">
                      {event.label}
                    </h4>
                    <p className="text-sm text-slate-400 ">
                      {formatDate(event.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedCard>
        )}
      </div>
    </div>
  );
};

// Componente per i dettagli del soggetto
const SoggettoDetails = ({ soggetto }) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <span className="text-sm text-slate-400 ">Codice Fiscale:</span>
          <p className="text-sm font-medium text-slate-200 ">{soggetto.codiceFiscale}</p>
        </div>
        <div>
          <span className="text-sm text-slate-400 ">Nome:</span>
          <p className="text-sm font-medium text-slate-200 ">
            {soggetto.cognome} {soggetto.nome}
          </p>
        </div>
        {soggetto.ragioneSociale && (
          <div className="md:col-span-2">
            <span className="text-sm text-slate-400 ">Ragione Sociale:</span>
            <p className="text-sm font-medium text-slate-200 ">{soggetto.ragioneSociale}</p>
          </div>
        )}
        <div>
          <span className="text-sm text-slate-400 ">Data Nascita:</span>
          <p className="text-sm font-medium text-slate-200 ">
            {soggetto.dataNascita ? new Date(soggetto.dataNascita).toLocaleDateString('it-IT') : '—'}
          </p>
        </div>
        <div>
          <span className="text-sm text-slate-400 ">Tipo Soggetto:</span>
          <p className="text-sm font-medium text-slate-200 ">{soggetto.tipoSoggettoEnum}</p>
        </div>
      </div>
      
      {(soggetto.indirizzoResidenza || soggetto.comuneResidenza) && (
        <div className="pt-3 border-t border-[#243044] ">
          <div className="flex items-start gap-2">
            <FiMapPin className="h-4 w-4 text-slate-400 mt-0.5" />
            <div>
              <span className="text-sm text-slate-400 ">Residenza:</span>
              <p className="text-sm font-medium text-slate-200 ">
                {soggetto.indirizzoResidenza && `${soggetto.indirizzoResidenza}${soggetto.numeroCivicoResidenza ? ', ' + soggetto.numeroCivicoResidenza : ''}`}
                {soggetto.comuneResidenza && soggetto.comuneResidenza.denominazione && (
                  <span className="block">
                    {soggetto.capResidenza && `${soggetto.capResidenza} `}
                    {soggetto.comuneResidenza.denominazione}
                    {soggetto.provinciaResidenza && soggetto.provinciaResidenza.sigla && ` (${soggetto.provinciaResidenza.sigla})`}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente per i dettagli della distinta
const DistintaDetails = ({ distinta }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <span className="text-sm text-slate-400 ">DU:</span>
        <p className="text-sm font-medium text-slate-200 ">{distinta.du}</p>
      </div>
      <div>
        <span className="text-sm text-slate-400 ">CDC:</span>
        <p className="text-sm font-medium text-slate-200 ">{distinta.cdc}</p>
      </div>
      <div>
        <span className="text-sm text-slate-400 ">CDP:</span>
        <p className="text-sm font-medium text-slate-200 ">{distinta.cdp}</p>
      </div>
      <div>
        <span className="text-sm text-slate-400 ">Foglio C:</span>
        <p className="text-sm font-medium text-slate-200 ">{distinta.foglioC}</p>
      </div>
      
      <div className="space-y-2">
        <span className="text-sm text-slate-400 ">Documenti:</span>
        <div className="space-y-1">
          {distinta.documentoIntestatario && (
            <span className="inline-block px-2 py-1 text-xs bg-green-500/10 text-green-400 rounded">
              Documento Intestatario
            </span>
          )}
          {distinta.documentoDetentore && (
            <span className="inline-block px-2 py-1 text-xs bg-green-500/10 text-green-400 rounded ml-1">
              Documento Detentore
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <span className="text-sm text-slate-400 ">Targhe:</span>
        <div className="space-y-1">
          {distinta.targaAnteriore && (
            <span className="inline-block px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded">
              Targa Anteriore
            </span>
          )}
          {distinta.targaPosteriore && (
            <span className="inline-block px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded ml-1">
              Targa Posteriore
            </span>
          )}
          {distinta.targaDenuncia && (
            <span className="inline-block px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded ml-1">
              Targa Denuncia
            </span>
          )}
        </div>
      </div>
      
      {distinta.altro && (
        <div className="md:col-span-2 lg:col-span-3">
          <span className="text-sm text-slate-400 ">Altro:</span>
          <p className="text-sm font-medium text-slate-200 ">{distinta.altro}</p>
        </div>
      )}
    </div>
  );
};

RVFUDetail.propTypes = {
  vfuId: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};

export default RVFUDetail;
