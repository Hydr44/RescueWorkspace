import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  FiAlertTriangle, FiRefreshCw, FiX, FiCheckCircle, 
  FiClock, FiInfo, FiCopy 
} from 'react-icons/fi';
import { useOrg } from '@/context/OrgContext';
import { supabase } from '@/lib/supabase-browser';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
import LoadingButton from '@/components/ui/LoadingButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const RVFUErrorManager = ({ className = '' }) => {
  const { orgId } = useOrg();
  const { showSuccess, showError } = useToast();
  
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [retryQueue, setRetryQueue] = useState([]);

  // Carica errori
  const loadErrors = useCallback(async () => {
    if (!orgId) return;

    setLoading(true);
    try {
      // Carica errori da demolition_cases
      const { data: caseErrors, error: caseError } = await supabase
        .from('demolition_cases')
        .select('id, targa, rvfu_error, rvfu_status, created_at, updated_at')
        .eq('org_id', orgId)
        .not('rvfu_error', 'is', null);

      if (caseError) throw caseError;

      // Carica errori da operation_logs
      const { data: operationErrors, error: opError } = await supabase
        .from('rvfu_operation_logs')
        .select('*')
        .eq('operation_status', 'ERROR')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (opError) throw opError;

      // Combina e formatta errori
      const formattedErrors = [
        ...caseErrors.map(error => ({
          id: `case-${error.id}`,
          type: 'case_error',
          title: `Errore caso ${error.targa}`,
          message: error.rvfu_error,
          timestamp: error.updated_at,
          severity: getSeverityFromError(error.rvfu_error),
          caseId: error.id,
          status: error.rvfu_status,
          retryable: isRetryableError(error.rvfu_error)
        })),
        ...operationErrors.map(error => ({
          id: `op-${error.id}`,
          type: 'operation_error',
          title: `Errore operazione ${error.operation_type}`,
          message: error.error_message,
          timestamp: error.created_at,
          severity: getSeverityFromError(error.error_message),
          caseId: error.demolition_case_id,
          operationType: error.operation_type,
          retryable: isRetryableError(error.error_message)
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setErrors(formattedErrors);

    } catch (error) {
      logger.error('Error loading RVFU errors:', error);
      showError('Errore nel caricamento degli errori');
    } finally {
      setLoading(false);
    }
  }, [orgId, showError]);

  // Determina severità errore
  const getSeverityFromError = (errorMessage) => {
    if (!errorMessage) return 'low';
    
    const message = errorMessage.toLowerCase();
    
    if (message.includes('timeout') || message.includes('network') || message.includes('connection')) {
      return 'medium';
    }
    if (message.includes('unauthorized') || message.includes('forbidden') || message.includes('authentication')) {
      return 'high';
    }
    if (message.includes('critical') || message.includes('fatal') || message.includes('system')) {
      return 'critical';
    }
    
    return 'low';
  };

  // Determina se errore è retryable
  const isRetryableError = (errorMessage) => {
    if (!errorMessage) return false;
    
    const message = errorMessage.toLowerCase();
    const retryablePatterns = [
      'timeout', 'network', 'connection', 'temporary', 'service unavailable',
      'rate limit', 'too many requests', 'server error', 'internal error'
    ];
    
    return retryablePatterns.some(pattern => message.includes(pattern));
  };

  // Retry errore
  const handleRetry = useCallback(async (error) => {
    if (!error.retryable) return;

    setRetryQueue(prev => [...prev, error.id]);
    
    try {
      if (error.type === 'case_error') {
        // Retry sync caso
        const { error: retryError } = await supabase
          .from('demolition_cases')
          .update({ 
            rvfu_error: null,
            rvfu_status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', error.caseId);

        if (retryError) throw retryError;
      } else if (error.type === 'operation_error') {
        // Retry operazione specifica
        await retryOperation(error);
      }

      // Rimuovi errore dalla lista
      setErrors(prev => prev.filter(e => e.id !== error.id));
      showSuccess('Retry avviato con successo');
      
    } catch (retryError) {
      logger.error('Error retrying operation:', retryError);
      showError('Errore durante il retry');
    } finally {
      setRetryQueue(prev => prev.filter(id => id !== error.id));
    }
  }, [showSuccess, showError]);

  // Retry operazione specifica
  const retryOperation = async (error) => {
    // Implementazione specifica per tipo operazione
    switch (error.operationType) {
      case 'sync_vfu':
        // Retry sync VFU
        break;
      case 'upload_document':
        // Retry upload documento
        break;
      case 'download_document':
        // Retry download documento
        break;
      default:
        throw new Error('Tipo operazione non supportato per retry');
    }
  };

  // Ignora errore
  const handleIgnore = useCallback(async (error) => {
    try {
      if (error.type === 'case_error') {
        const { error: updateError } = await supabase
          .from('demolition_cases')
          .update({ 
            rvfu_error: null,
            rvfu_status: 'ignored',
            updated_at: new Date().toISOString()
          })
          .eq('id', error.caseId);

        if (updateError) throw updateError;
      }

      setErrors(prev => prev.filter(e => e.id !== error.id));
      showSuccess('Errore ignorato');
      
    } catch (ignoreError) {
      logger.error('Error ignoring error:', ignoreError);
      showError('Errore durante l\'ignorare l\'errore');
    }
  }, [showSuccess, showError]);

  // Copia dettagli errore
  const handleCopyError = useCallback((error) => {
    const errorDetails = {
      id: error.id,
      type: error.type,
      title: error.title,
      message: error.message,
      timestamp: error.timestamp,
      severity: error.severity,
      caseId: error.caseId
    };

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => showSuccess('Dettagli errore copiati negli appunti'))
      .catch(() => showError('Errore durante la copia'));
  }, [showSuccess, showError]);

  // Get color per severità
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-600 bg-orange-500/10 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-blue-600 bg-blue-500/10 border-blue-500/20';
      default: return 'text-slate-400 bg-[#141c27] border-[#243044]';
    }
  };

  // Get icon per severità
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return FiAlertTriangle;
      case 'high': return FiAlertTriangle;
      case 'medium': return FiInfo;
      case 'low': return FiInfo;
      default: return FiInfo;
    }
  };

  useEffect(() => {
    loadErrors();
    const interval = setInterval(loadErrors, 60000); // Aggiorna ogni minuto
    return () => clearInterval(interval);
  }, [loadErrors]);

  if (loading && errors.length === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner text="Caricamento errori..." />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FiAlertTriangle className="h-6 w-6 text-red-600" />
          Gestione Errori RVFU
        </h2>
        <div className="flex gap-2">
          <LoadingButton
            onClick={loadErrors}
            variant="outline"
            size="sm"
            className="animate-fade-in"
          >
            <FiRefreshCw className="h-4 w-4" />
            Aggiorna
          </LoadingButton>
        </div>
      </div>

      {/* Statistiche Errori */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#141c27] p-4 rounded-lg border border-[#243044] ">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Totali</p>
              <p className="text-2xl font-bold text-slate-200">{errors.length}</p>
            </div>
            <FiAlertTriangle className="h-8 w-8 text-slate-500" />
          </div>
        </div>
        
        <div className="bg-[#141c27] p-4 rounded-lg border border-[#243044] ">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Critici</p>
              <p className="text-2xl font-bold text-red-600">
                {errors.filter(e => e.severity === 'critical').length}
              </p>
            </div>
            <FiAlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-[#141c27] p-4 rounded-lg border border-[#243044] ">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Retryable</p>
              <p className="text-2xl font-bold text-yellow-600">
                {errors.filter(e => e.retryable).length}
              </p>
            </div>
            <FiRefreshCw className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-[#141c27] p-4 rounded-lg border border-[#243044] ">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Ultimi 7 giorni</p>
              <p className="text-2xl font-bold text-blue-600">
                {errors.filter(e => new Date(e.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
              </p>
            </div>
            <FiClock className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Lista Errori */}
      {errors.length === 0 ? (
        <div className="text-center py-12 bg-[#141c27] rounded-lg border border-[#243044] ">
          <FiCheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-200 mb-2">
            Nessun errore trovato
          </h3>
          <p className="text-slate-400">
            Il sistema RVFU funziona correttamente
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {errors.map((error, index) => {
            const SeverityIcon = getSeverityIcon(error.severity);
            const isRetrying = retryQueue.includes(error.id);
            
            return (
              <div
                key={error.id}
                className="bg-[#141c27] p-4 rounded-lg border border-[#243044]  hover:shadow-md transition-all duration-200 ease-out animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <SeverityIcon className={`h-5 w-5 mt-0.5 ${
                      error.severity === 'critical' ? 'text-red-500' :
                      error.severity === 'high' ? 'text-orange-500' :
                      error.severity === 'medium' ? 'text-yellow-500' :
                      'text-blue-500'
                    }`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-slate-200">{error.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(error.severity)}`}>
                          {error.severity}
                        </span>
                        {error.retryable && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                            Retryable
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-slate-400 mb-2 line-clamp-2">
                        {error.message}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{new Date(error.timestamp).toLocaleString('it-IT')}</span>
                        <span>Caso: {error.caseId}</span>
                        <span>Tipo: {error.type}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <LoadingButton
                      onClick={() => handleCopyError(error)}
                      size="sm"
                      variant="ghost"
                      className="animate-fade-in"
                    >
                      <FiCopy className="h-4 w-4" />
                    </LoadingButton>
                    
                    {error.retryable && (
                      <LoadingButton
                        onClick={() => handleRetry(error)}
                        loading={isRetrying}
                        size="sm"
                        variant="outline"
                        className="animate-fade-in"
                      >
                        <FiRefreshCw className="h-4 w-4" />
                        Retry
                      </LoadingButton>
                    )}
                    
                    <LoadingButton
                      onClick={() => handleIgnore(error)}
                      size="sm"
                      variant="ghost"
                      className="animate-fade-in text-slate-500 hover:text-slate-300"
                    >
                      <FiX className="h-4 w-4" />
                      Ignora
                    </LoadingButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

RVFUErrorManager.propTypes = {
  className: PropTypes.string,
};

export default RVFUErrorManager;
