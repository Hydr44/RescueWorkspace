// src/components/rentri/FirmaFIRDialog.jsx
/**
 * Dialog firma digitale FIR tramite app RENTRI FIR Digitale Demo (iPhone)
 * Mostra il flusso step-by-step con countdown e animazione attesa dispositivo.
 */

import { useState, useEffect, useRef } from "react";
import {
  FiX, FiSmartphone, FiCheckCircle, FiAlertCircle,
  FiEdit3, FiRefreshCw
} from "react-icons/fi";

const RENTRI_API_URL = import.meta.env.VITE_RENTRI_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri';

const STEP_TIMINGS = [
  { id: 'hash',        label: 'Calcolo hash documento su RENTRI',     from: 0,  to: 12 },
  { id: 'notify',      label: 'Notifica push inviata all\'iPhone',     from: 12, to: 17 },
  { id: 'waiting',     label: 'In attesa approvazione dispositivo',    from: 17, to: 57 },
  { id: 'acquisition', label: 'Acquisizione firma su RENTRI',          from: 57, to: 70 },
];

function StepRow({ step, idx, currentIdx }) {
  const done   = idx < currentIdx;
  const active = idx === currentIdx;
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${
      active ? 'bg-emerald-500/10 border border-emerald-500/20' :
      done   ? 'bg-[#141c27] border border-transparent' :
               'border border-transparent opacity-35'
    }`}>
      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
        done   ? 'bg-emerald-500' :
        active ? 'bg-emerald-500/20 ring-1 ring-emerald-500/40' :
                 'bg-[#1e2d44]'
      }`}>
        {done ? (
          <FiCheckCircle className="w-3.5 h-3.5 text-white" />
        ) : active ? (
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        ) : (
          <div className="w-1.5 h-1.5 bg-slate-600 rounded-full" />
        )}
      </div>
      <span className={`text-xs transition-colors ${
        active ? 'text-emerald-300 font-medium' :
        done   ? 'text-slate-400' :
                 'text-slate-600'
      }`}>
        {step.label}
      </span>
      {active && (
        <FiRefreshCw className="w-3 h-3 text-emerald-500 ml-auto animate-spin flex-shrink-0" />
      )}
    </div>
  );
}

export default function FirmaFIRDialog({ firId, firNumero, onClose, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [countdown, setCountdown]     = useState(40);
  const [status, setStatus]           = useState('running'); // running | success | error
  const [errorMsg, setErrorMsg]       = useState('');
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    const startTime = Date.now();

    const ticker = setInterval(() => {
      if (cancelledRef.current) return;
      const t = (Date.now() - startTime) / 1000;

      let idx = 0;
      for (let i = 0; i < STEP_TIMINGS.length; i++) {
        if (t >= STEP_TIMINGS[i].from) idx = i;
      }
      setCurrentStep(idx);

      if (t >= 17 && t < 57) {
        setCountdown(Math.max(0, Math.round(57 - t)));
      }
    }, 300);

    async function doFirma() {
      try {
        const res = await fetch(`${RENTRI_API_URL}/fir/firma`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fir_id: firId })
        });
        if (cancelledRef.current) return;

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const msg = data.message || data.error || `Errore ${res.status}`;
          if (data.step === 'otp_timeout') {
            setErrorMsg('Timeout: hai 60 secondi per approvare sull\'app RENTRI FIR Digitale Demo. Riprova e tocca Approva sulla notifica.');
          } else if (data.step === 'credentials_not_found') {
            setErrorMsg(`Credenziale firma non trovata su RENTRI (${data.credentials_id_used}). Verifica il credentials_id_mobile nel certificato.`);
          } else if (data.step === 'device_required') {
            setErrorMsg('Nessun dispositivo di firma configurato. Vai su Impostazioni → Certificati RENTRI e aggiungi il tuo dispositivo.');
          } else {
            setErrorMsg(msg);
          }
          setStatus('error');
          return;
        }

        setCurrentStep(3);
        setTimeout(() => {
          if (!cancelledRef.current) setStatus('success');
        }, 600);
      } catch (err) {
        if (cancelledRef.current) return;
        setErrorMsg(err.message || 'Errore di connessione al server');
        setStatus('error');
      }
    }

    doFirma();
    return () => {
      cancelledRef.current = true;
      clearInterval(ticker);
    };
  }, [firId]);

  const handleClose = () => {
    cancelledRef.current = true;
    if (status === 'success') onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0f1623] border border-[#1e2d44] rounded-2xl shadow-2xl w-full max-w-sm mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d44]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <FiEdit3 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Firma Digitale FIR</p>
              {firNumero && (
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{firNumero}</p>
              )}
            </div>
          </div>
          {status !== 'running' && (
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-[#1e2d44] text-slate-500 hover:text-slate-300 transition-colors">
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">

          {/* ── RUNNING ── */}
          {status === 'running' && (
            <>
              {/* Steps */}
              <div className="space-y-1.5">
                {STEP_TIMINGS.map((step, i) => (
                  <StepRow key={step.id} step={step} idx={i} currentIdx={currentStep} />
                ))}
              </div>

              {/* iPhone panel — visibile da step 1 */}
              {currentStep >= 1 && (
                <div className="bg-[#141c27] border border-[#1e2d44] rounded-xl p-4">
                  <div className="flex items-start gap-3">

                    {/* Animated phone */}
                    <div className="flex-shrink-0 relative mt-0.5">
                      {currentStep === 2 && (
                        <span className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" />
                      )}
                      <div className={`relative w-10 h-10 rounded-full flex items-center justify-center border ${
                        currentStep === 2
                          ? 'bg-blue-500/10 border-blue-500/30'
                          : 'bg-slate-500/10 border-slate-500/20'
                      }`}>
                        <FiSmartphone className={`w-5 h-5 ${currentStep === 2 ? 'text-blue-400' : 'text-slate-400'}`} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      {currentStep === 1 && (
                        <>
                          <p className="text-xs font-medium text-slate-200 mb-0.5">Notifica inviata</p>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Stai ricevendo una notifica push sull'iPhone...
                          </p>
                        </>
                      )}
                      {currentStep === 2 && (
                        <>
                          <p className="text-xs font-medium text-slate-200 mb-0.5">
                            Approva su iPhone <span className="text-amber-400">ora</span>
                          </p>
                          <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
                            Apri <strong className="text-slate-300">RENTRI FIR Digitale Demo</strong> e tocca <strong className="text-slate-300">Approva</strong> sulla notifica.
                          </p>
                          {/* Countdown */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-[#1e2d44] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  countdown <= 10 ? 'bg-red-500' :
                                  countdown <= 20 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${(countdown / 40) * 100}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold tabular-nums w-8 text-right ${
                              countdown <= 10 ? 'text-red-400 animate-pulse' :
                              countdown <= 20 ? 'text-amber-400' : 'text-slate-300'
                            }`}>
                              {countdown}s
                            </span>
                          </div>
                        </>
                      )}
                      {currentStep >= 3 && (
                        <>
                          <p className="text-xs font-medium text-slate-200 mb-0.5">Approvato ✓</p>
                          <p className="text-[10px] text-slate-400">Acquisizione firma in corso...</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-slate-600 text-center">
                Non chiudere questa finestra durante la firma
              </p>
            </>
          )}

          {/* ── SUCCESS ── */}
          {status === 'success' && (
            <div className="text-center py-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <FiCheckCircle className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-emerald-300 mb-1">FIR Firmato!</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                La firma digitale è stata acquisita su RENTRI.<br />
                Il FIR è ora in stato <span className="text-slate-300 font-medium">firmato</span>.
              </p>
            </div>
          )}

          {/* ── ERROR ── */}
          {status === 'error' && (
            <div className="text-center py-3">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
                <FiAlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <p className="text-sm font-semibold text-red-300 mb-2">Firma non completata</p>
              <p className="text-xs text-slate-400 leading-relaxed px-2">{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {status !== 'running' && (
          <div className="px-5 pb-5">
            <button
              onClick={handleClose}
              className={`w-full py-2 rounded-lg text-xs font-medium transition-colors ${
                status === 'success'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-[#1e2d44] hover:bg-[#243044] text-slate-300'
              }`}
            >
              {status === 'success' ? 'Chiudi' : 'Chiudi'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
