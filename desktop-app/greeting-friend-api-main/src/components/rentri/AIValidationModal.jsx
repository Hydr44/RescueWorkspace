/**
 * Componente: Modal Validazione IA Pre-Invio
 * Mostra alert dall'IA e consente conferma umana prima dell'invio
 */

import { useState, useEffect } from "react";
import { FiX, FiAlertCircle, FiAlertTriangle, FiInfo, FiCheckCircle, FiLoader, FiEdit3 } from "react-icons/fi";

export default function AIValidationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  tipoEntita, 
  entitaId,
  orgId,
  datiEntita 
}) {
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState(null);
  const [error, setError] = useState(null);
  const [notaConferma, setNotaConferma] = useState("");

  const [hasValidated, setHasValidated] = useState(false);

  useEffect(() => {
    if (isOpen && datiEntita && orgId && !hasValidated) {
      setHasValidated(true);
      validateWithAI();
    }
    if (!isOpen) {
      setHasValidated(false);
    }
  }, [isOpen, orgId]); // Rimossa dipendenza datiEntita per evitare loop

  async function validateWithAI() {
    setValidating(true);
    setError(null);
    setValidation(null);

    try {
      // Endpoint passa attraverso VPS (che fa proxy a Vercel) per ridurre edge requests
      const apiUrl = import.meta.env.VITE_RENTRI_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri';
      
      // Timeout di 60 secondi per validazione IA (può richiedere tempo)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn("[AI-VALIDATE] Timeout raggiunto, aborting...");
        controller.abort();
      }, 60000);
      
      console.log("[AI-VALIDATE] Chiamata API:", `${apiUrl}/ai-validate`);
      
      const response = await fetch(`${apiUrl}/ai-validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo_entita: tipoEntita,
          entita_id: entitaId || 'temp-' + Date.now(),
          org_id: orgId,
          dati_entita: datiEntita
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log("[AI-VALIDATE] Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Errore validazione IA: ${response.statusText}`);
      }

      let data;
      try {
        const responseText = await response.text();
        console.log("[AI-VALIDATE] Response text (prima 500 char):", responseText.substring(0, 500));
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("[AI-VALIDATE] Errore parsing response:", parseError);
        throw new Error(`Errore parsing risposta: ${response.status} ${response.statusText}`);
      }
      
      console.log("[AI-VALIDATE] Response data:", data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data.validation) {
        console.error("[AI-VALIDATE] Risposta senza validation:", data);
        throw new Error("Risposta non valida: manca campo validation");
      }
      
      setValidation(data.validation);
    } catch (err) {
      console.error("Errore validazione IA:", err);
      
      // Gestione errori specifici
      let errorMessage = err.message;
      if (err.name === 'AbortError' || err.message?.includes('aborted') || err.message?.includes('signal')) {
        errorMessage = 'Timeout: la validazione IA ha impiegato troppo tempo. Riprova o procedi senza validazione.';
      } else if (err.message?.includes('OPENAI_API_KEY') || err.message?.includes('non disponibile')) {
        errorMessage = 'Validazione IA non configurata sul server. Verifica manualmente i dati prima dell\'invio.';
      } else if (!errorMessage || errorMessage === 'signal is aborted without reason') {
        errorMessage = 'Errore durante la validazione IA. Verifica manualmente i dati prima dell\'invio.';
      }
      
      setError(errorMessage);
      
      // In caso di errore, mostra come "ok" per permettere comunque l'invio
      setValidation({
        stato: 'ok',
        alert: [{
          tipo: 'info',
          messaggio: 'Validazione IA non disponibile. Verifica manualmente i dati prima dell\'invio.',
          severita: 1
        }]
      });
    } finally {
      setValidating(false);
    }
  }

  function handleConfirm() {
    if (onConfirm) {
      onConfirm({
        validation_id: validation?.validation_id,
        confermato: true,
        nota: notaConferma
      });
    }
    onClose();
  }

  function handleIgnore() {
    if (onConfirm) {
      onConfirm({
        validation_id: validation?.validation_id,
        confermato: true,
        nota: 'Validazione IA ignorata dall\'utente'
      });
    }
    onClose();
  }

  if (!isOpen) return null;

  const getAlertIcon = (tipo) => {
    switch (tipo) {
      case 'error':
        return FiAlertCircle;
      case 'warning':
        return FiAlertTriangle;
      default:
        return FiInfo;
    }
  };

  const getAlertColor = (tipo) => {
    switch (tipo) {
      case 'error':
        return 'bg-red-500/10 border-red-500/30 text-red-300';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
      default:
        return 'bg-blue-500/10 border-blue-500/30 text-blue-300';
    }
  };

  const canProceed = !validation || validation.stato === 'ok' || validation.stato === 'warning' || validation.ok === true;
  const hasErrors = validation?.stato === 'error' && validation?.ok !== true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#141c27] border border-[#243044] rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#243044]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FiCheckCircle className="h-6 w-6 text-indigo-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-slate-200">
                  Validazione Pre-Invio {tipoEntita === 'movimento' ? 'Movimento' : tipoEntita === 'formulario' ? 'Formulario' : 'Registro'}
                </h2>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded border border-amber-500/30">
                  BETA
                </span>
              </div>
              <p className="text-sm text-slate-500">Controllo automatico con Intelligenza Artificiale</p>
              <p className="text-xs text-amber-400/80 mt-1 flex items-center gap-1">
                <FiInfo className="h-3 w-3" />
                Sistema in continuo addestramento - Verifica sempre manualmente i dati critici
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1a2536] rounded-lg transition-colors"
          >
            <FiX className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {validating && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FiLoader className="h-12 w-12 text-indigo-400 animate-spin mx-auto mb-4" />
                <p className="text-slate-400">Analisi in corso con IA...</p>
                <p className="text-sm text-slate-500 mt-2">Verifica dati per incongruenze e errori</p>
              </div>
            </div>
          )}

          {error && !validating && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
                <div>
                  <p className="text-red-300 font-medium">Errore validazione IA</p>
                  <p className="text-sm text-red-400/80 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {validation && !validating && (
            <>
              {/* Riepilogo Stato */}
              <div className={`rounded-lg p-4 border ${
                validation.stato === 'ok' 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : validation.stato === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  {validation.stato === 'ok' ? (
                    <FiCheckCircle className="h-6 w-6 text-green-400" />
                  ) : validation.stato === 'warning' ? (
                    <FiAlertTriangle className="h-6 w-6 text-amber-400" />
                  ) : (
                    <FiAlertCircle className="h-6 w-6 text-red-400" />
                  )}
                  <div>
                    <p className={`font-semibold ${
                      validation.stato === 'ok' 
                        ? 'text-green-300' 
                        : validation.stato === 'warning'
                        ? 'text-amber-300'
                        : 'text-red-300'
                    }`}>
                      {validation.stato === 'ok' 
                        ? 'Nessun problema rilevato — pronto per l\'invio' 
                        : validation.stato === 'warning'
                        ? (validation.ok !== false ? 'Avvertimenti non bloccanti — puoi procedere' : 'Attenzione: verificare i dati')
                        : 'Errori rilevati: correggere prima dell\'invio'}
                    </p>
                    {validation.riepilogo && (
                      <p className="text-sm text-slate-400 mt-1">{validation.riepilogo}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      {validation.alert?.length || 0} segnalazioni
                    </p>
                  </div>
                </div>
              </div>

              {/* Alert List */}
              {validation.alert && validation.alert.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                      Segnalazioni ({validation.alert.length})
                    </h3>
                    {validation.alert.some(a => a.campo) && (
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <FiEdit3 className="h-3 w-3" />
                        Campi da verificare evidenziati
                      </div>
                    )}
                  </div>
                  {validation.alert.map((alert, index) => {
                    const Icon = getAlertIcon(alert.tipo);
                    return (
                      <div
                        key={index}
                        className={`rounded-lg p-4 border ${getAlertColor(alert.tipo)}`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            {alert.campo && (
                              <div className="mb-2 flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 text-amber-300 text-xs font-semibold rounded border border-amber-500/40">
                                  <FiEdit3 className="h-3 w-3" />
                                  Campo: <code className="font-mono font-bold">{alert.campo}</code>
                                </span>
                              </div>
                            )}
                            <p className="font-medium">{alert.messaggio}</p>
                            {alert.suggerimento && (
                              <p className="text-sm mt-2 opacity-80">
                                 {alert.suggerimento}
                              </p>
                            )}
                            {alert.severita && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-[#1a2536] rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      alert.severita >= 7 ? 'bg-red-500' :
                                      alert.severita >= 4 ? 'bg-amber-500' :
                                      'bg-blue-400'
                                    }`}
                                    style={{ width: `${(alert.severita / 10) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-slate-500">
                                  Severità: {alert.severita}/10
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Campo Note Conferma */}
              {hasErrors && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <p className="text-amber-300 text-sm font-medium mb-2">
                    Attenzione: sono stati rilevati errori critici
                  </p>
                  <p className="text-amber-400/80 text-sm">
                    Si consiglia di correggere gli errori prima di procedere. 
                    Se desideri comunque procedere, aggiungi una nota di conferma.
                  </p>
                  <textarea
                    value={notaConferma}
                    onChange={(e) => setNotaConferma(e.target.value)}
                    placeholder="Spiega perché procedi nonostante gli errori (opzionale)..."
                    className="mt-3 w-full px-3 py-2 bg-[#1a2536] border border-[#243044] rounded-lg text-sm text-slate-400 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    rows="3"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[#243044] bg-[#1a2536]/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-500 hover:text-slate-400 transition-colors"
          >
            Annulla
          </button>
          <div className="flex items-center gap-3">
            {hasErrors && (
              <button
                onClick={handleIgnore}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Ignora e Procedi
              </button>
            )}
            <button
              onClick={handleConfirm}
              disabled={validating}
              className={`px-6 py-2 rounded-lg transition-colors text-sm font-medium ${
                canProceed
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-[#1a2536] text-slate-500 cursor-not-allowed'
              }`}
            >
              {validating ? (
                <span className="flex items-center gap-2">
                  <FiLoader className="h-4 w-4 animate-spin" />
                  Validazione...
                </span>
              ) : (
                'Conferma e Procedi'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

