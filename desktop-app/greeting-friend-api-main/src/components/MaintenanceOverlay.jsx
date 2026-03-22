import { useState } from "react";
import { remoteControl } from "@/lib/remote-control";

// Simple icons (no lucide-react in desktop app)
function AlertCircle({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function RefreshCw({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function Clock({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function MaintenanceOverlay({ visible, status }) {
  const [retryCount, setRetryCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  // Previeni re-render infiniti
  if (!visible) return null;

  const handleRetry = async () => {
    setIsChecking(true);
    const newStatus = await remoteControl.checkMaintenance();
    setRetryCount(c => c + 1);
    setIsChecking(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#1a2536] rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-8">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-amber-500/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-amber-600" />
          </div>

          <h1 className="text-3xl font-bold text-slate-200 mb-4">
            Manutenzione in corso
          </h1>

          <p className="text-lg text-slate-400 mb-6">
            {status.message || 'L\'applicazione è temporaneamente non disponibile per manutenzione.'}
          </p>

          {status.started_at && (
            <div className="flex items-center justify-center gap-2 text-slate-500 mb-6">
              <Clock className="w-5 h-5" />
              <span className="text-sm">
                Manutenzione iniziata il{' '}
                {new Date(status.started_at).toLocaleString('it-IT')}
              </span>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleRetry}
              disabled={isChecking}
              className="btn btn-primary w-full"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin inline-block mr-2" />
                  Verifica in corso...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 inline-block mr-2" />
                  Verifica di nuovo
                </>
              )}
            </button>

            {retryCount > 0 && (
              <p className="text-sm text-slate-500">
                Tentativo {retryCount} di verifica...
              </p>
            )}

            <p className="text-xs text-slate-500">
              Questo messaggio si aggiorna automaticamente ogni 30 secondi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

