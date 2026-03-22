// src/pages/RifiutiTrasmissioni.jsx
/**
 * Monitor Trasmissioni RENTRI
 * Gestione trasmissioni batch con retry e tracking
 */

import { useState, useEffect } from "react";
import { useOrg } from "../context/OrgContext";
import {
  FiSend, FiCheckCircle, FiAlertCircle, FiClock,
  FiRefreshCw, FiX, FiFileText, FiPackage, FiFilter
} from "react-icons/fi";

const RENTRI_VPS_URL = 'https://rentri-test.rescuemanager.eu/api/rentri';

export default function RifiutiTrasmissioni() {
  const { orgId } = useOrg();
  
  const [trasmissioni, setTrasmissioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStato, setFilterStato] = useState('all');
  const [filterTipo, setFilterTipo] = useState('all');
  const [pollingActive, setPollingActive] = useState(false);

  useEffect(() => {
    if (orgId) {
      loadTrasmissioni();
      
      // Polling per trasmissioni in progress
      const interval = setInterval(() => {
        if (pollingActive) {
          checkInProgressTrasmissioni();
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [orgId, filterStato, filterTipo, pollingActive]);

  async function loadTrasmissioni() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ org_id: orgId, limit: 100 });
      if (filterStato !== 'all') params.set('stato', filterStato);
      if (filterTipo !== 'all') params.set('tipo', filterTipo);

      const response = await fetch(`${RENTRI_VPS_URL}/trasmissioni?${params.toString()}`);
      if (!response.ok) throw new Error('Errore caricamento trasmissioni');
      
      const data = await response.json();
      setTrasmissioni(data);
      
      // Attiva polling se ci sono trasmissioni in progress
      const hasInProgress = data.some(t => t.stato === 'in_progress' || t.stato === 'pending');
      setPollingActive(hasInProgress);
    } catch (error) {
      console.error('[TRASMISSIONI] Errore caricamento:', error);
      alert('Errore caricamento trasmissioni: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function checkInProgressTrasmissioni() {
    const inProgress = trasmissioni.filter(t => t.stato === 'in_progress');
    
    for (const trasmissione of inProgress) {
      if (!trasmissione.transazione_id) continue;
      
      try {
        const service = trasmissione.tipo === 'movimenti' ? 'dati-registri' : 'vidimazione-formulari';
        const response = await fetch(
          `${RENTRI_VPS_URL}/transazioni/${trasmissione.transazione_id}/status?org_id=${orgId}&service=${service}`
        );
        
        if (response.ok) {
          const status = await response.json();
          
          if (status.stato === 'completata') {
            // Recupera risultato
            const resultResponse = await fetch(
              `${RENTRI_VPS_URL}/transazioni/${trasmissione.transazione_id}/result?org_id=${orgId}&service=${service}`
            );
            
            if (resultResponse.ok) {
              await loadTrasmissioni(); // Ricarica lista
            }
          } else if (status.stato === 'errore') {
            await loadTrasmissioni(); // Ricarica lista
          }
        }
      } catch (error) {
        console.error('[TRASMISSIONI] Errore check status:', error);
      }
    }
  }

  async function handleRetry(trasmissioneId) {
    if (!confirm('Riprovare questa trasmissione?')) return;
    
    try {
      const response = await fetch(`${RENTRI_VPS_URL}/trasmissioni/${trasmissioneId}/retry`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Errore retry trasmissione');
      
      await loadTrasmissioni();
    } catch (error) {
      console.error('[TRASMISSIONI] Errore retry:', error);
      alert('Errore retry trasmissione: ' + error.message);
    }
  }

  function getStatoBadge(stato) {
    const badges = {
      pending: { color: 'gray', icon: FiClock, text: 'In Attesa' },
      in_progress: { color: 'blue', icon: FiRefreshCw, text: 'In Corso' },
      completed: { color: 'sky', icon: FiCheckCircle, text: 'Completata' },
      error: { color: 'red', icon: FiAlertCircle, text: 'Errore' },
      cancelled: { color: 'gray', icon: FiX, text: 'Annullata' }
    };
    
    const badge = badges[stato] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-${badge.color}-500/10 text-${badge.color}-400 border border-${badge.color}-500/20`}>
        <Icon className={`w-3 h-3 ${stato === 'in_progress' ? 'animate-spin' : ''}`} />
        {badge.text}
      </span>
    );
  }

  function getTipoIcon(tipo) {
    const icons = {
      movimenti: FiPackage,
      formulario: FiFileText,
      vidimazione: FiSend
    };
    return icons[tipo] || FiFileText;
  }

  const trasmissioniFiltrate = trasmissioni.filter(t => {
    if (filterStato !== 'all' && t.stato !== filterStato) return false;
    if (filterTipo !== 'all' && t.tipo !== filterTipo) return false;
    return true;
  });

  // Statistiche
  const stats = {
    totale: trasmissioni.length,
    pending: trasmissioni.filter(t => t.stato === 'pending').length,
    in_progress: trasmissioni.filter(t => t.stato === 'in_progress').length,
    completed: trasmissioni.filter(t => t.stato === 'completed').length,
    error: trasmissioni.filter(t => t.stato === 'error').length
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <FiSend className="w-4 h-4 text-blue-400" />
            Trasmissioni RENTRI
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor trasmissioni batch a RENTRI con gestione retry
          </p>
        </div>
        <button
          onClick={loadTrasmissioni}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors"
        >
          <FiRefreshCw className="w-3.5 h-3.5" />
          Aggiorna
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-[#1a2536] border border-[#243044] rounded-lg p-4">
          <p className="text-xs text-slate-500 mb-1">Totale</p>
          <p className="text-2xl font-semibold text-slate-200">{stats.totale}</p>
        </div>
        <div className="bg-[#1a2536] border border-gray-500/20 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">In Attesa</p>
          <p className="text-2xl font-semibold text-gray-300">{stats.pending}</p>
        </div>
        <div className="bg-[#1a2536] border border-blue-500/20 rounded-lg p-4">
          <p className="text-xs text-blue-400 mb-1">In Corso</p>
          <p className="text-2xl font-semibold text-blue-300">{stats.in_progress}</p>
        </div>
        <div className="bg-[#1a2536] border border-sky-500/20 rounded-lg p-4">
          <p className="text-xs text-sky-400 mb-1">Completate</p>
          <p className="text-2xl font-semibold text-sky-300">{stats.completed}</p>
        </div>
        <div className="bg-[#1a2536] border border-red-500/20 rounded-lg p-4">
          <p className="text-xs text-red-400 mb-1">Errori</p>
          <p className="text-2xl font-semibold text-red-300">{stats.error}</p>
        </div>
      </div>

      {/* Filtri */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <FiFilter className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-500">Filtri:</span>
        </div>
        
        <select
          value={filterStato}
          onChange={(e) => setFilterStato(e.target.value)}
          className="px-3 py-1.5 text-xs bg-[#1a2536] border border-[#243044] rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="all">Tutti gli stati</option>
          <option value="pending">In Attesa</option>
          <option value="in_progress">In Corso</option>
          <option value="completed">Completate</option>
          <option value="error">Errori</option>
        </select>
        
        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="px-3 py-1.5 text-xs bg-[#1a2536] border border-[#243044] rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="all">Tutti i tipi</option>
          <option value="movimenti">Movimenti</option>
          <option value="formulario">Formulari</option>
          <option value="vidimazione">Vidimazione</option>
        </select>
      </div>

      {/* Lista Trasmissioni */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Caricamento trasmissioni...</p>
        </div>
      ) : trasmissioniFiltrate.length === 0 ? (
        <div className="bg-[#1a2536] rounded-lg border border-[#243044] p-8 text-center">
          <FiSend className="w-8 h-8 text-slate-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-slate-400 mb-1">
            Nessuna Trasmissione
          </h3>
          <p className="text-xs text-slate-500">
            Le trasmissioni a RENTRI appariranno qui
          </p>
        </div>
      ) : (
        <div className="bg-[#1a2536] rounded-lg border border-[#243044] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#141c27]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Stato</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Dettagli</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Retry</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243044]">
              {trasmissioniFiltrate.map(trasmissione => {
                const TipoIcon = getTipoIcon(trasmissione.tipo);
                const canRetry = trasmissione.stato === 'error' && 
                                trasmissione.retry_count < trasmissione.max_retries;
                
                return (
                  <tr key={trasmissione.id} className="hover:bg-[#141c27]/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <TipoIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-300 capitalize">
                          {trasmissione.tipo}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatoBadge(trasmissione.stato)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-400">
                        {new Date(trasmissione.created_at).toLocaleString('it-IT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {trasmissione.tipo === 'movimenti' && (
                        <span className="text-xs text-slate-500">
                          {trasmissione.payload?.movimenti?.length || 0} movimenti
                        </span>
                      )}
                      {trasmissione.tipo === 'vidimazione' && (
                        <span className="text-xs text-slate-500">
                          Blocco {trasmissione.payload?.codice_blocco}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">
                        {trasmissione.retry_count}/{trasmissione.max_retries}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {canRetry && (
                          <button
                            onClick={() => handleRetry(trasmissione.id)}
                            className="px-2 py-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <FiRefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        {trasmissione.errore && (
                          <button
                            onClick={() => alert(trasmissione.errore)}
                            className="px-2 py-1 text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                            title="Mostra errore"
                          >
                            <FiAlertCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
