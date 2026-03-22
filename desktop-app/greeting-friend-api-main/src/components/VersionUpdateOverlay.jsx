import { useState, useEffect } from "react";
import { remoteControl } from "@/lib/remote-control";

// Simple icons
function Download({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function X({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function VersionUpdateOverlay({ visible, status, onDismiss }) {
  const [isClosing, setIsClosing] = useState(false);

  const handleDownload = () => {
    // Usa l'URL di download dalla status
    if (status?.download_url) {
      window.open(status.download_url, '_blank');
    } else {
      // Fallback se non c'è URL
      window.open('https://github.com/your-repo/releases', '_blank');
    }
  };

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  if (!visible || status?.update_required === false) return null;

  return (
    <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`bg-[#1a2536] rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-8 transform transition-transform duration-300 ${isClosing ? 'scale-95' : 'scale-100'}`}>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-blue-500/10 rounded-full flex items-center justify-center">
            <Download className="w-10 h-10 text-blue-600" />
          </div>

          <h1 className="text-3xl font-bold text-slate-200 mb-4">
            {status?.force_update ? 'Aggiornamento Richiesto' : 'Aggiornamento Disponibile'}
          </h1>

          <p className="text-lg text-slate-400 mb-4">
            {status?.force_update 
              ? 'È disponibile una nuova versione dell\'applicazione. Aggiorna per continuare.'
              : 'È disponibile una nuova versione dell\'applicazione. Ti consigliamo di aggiornare.'
            }
          </p>

          {status?.notes && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-400">{status.notes}</p>
            </div>
          )}

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between bg-[#141c27] rounded-lg p-3">
              <span className="text-sm text-slate-400">Versione Attuale:</span>
              <span className="font-mono text-sm text-slate-200">{status?.current_version}</span>
            </div>
            <div className="flex items-center justify-between bg-[#141c27] rounded-lg p-3">
              <span className="text-sm text-slate-400">Nuova Versione:</span>
              <span className="font-mono text-sm text-green-600 font-semibold">{status?.latest_version}</span>
            </div>
          </div>

          <div className="space-y-3">
            {status?.force_update ? (
              <button
                onClick={handleDownload}
                className="btn btn-primary w-full"
              >
                <Download className="w-5 h-5 inline-block mr-2" />
                Scarica Aggiornamento
              </button>
            ) : (
              <>
                <button
                  onClick={handleDownload}
                  className="btn btn-primary w-full"
                >
                  <Download className="w-5 h-5 inline-block mr-2" />
                  Scarica Aggiornamento
                </button>
                <button
                  onClick={handleDismiss}
                  className="btn btn-outline w-full"
                >
                  Più Tardi
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

