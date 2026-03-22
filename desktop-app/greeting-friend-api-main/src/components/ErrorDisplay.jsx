import { useEffect, useState } from "react";
import { X, AlertCircle, ExternalLink, AlertTriangle, Info } from "lucide-react";

/**
 * ErrorDisplay Component
 * Mostra errori con codice, soluzione e link alla documentazione
 */

export default function ErrorDisplay({ error, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  if (!error || !isVisible) return null;

  const getSeverityColor = () => {
    switch(error.severity) {
      case 'critical': return 'border-red-500 bg-red-500/10';
      case 'high': return 'border-orange-500 bg-orange-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-blue-500 bg-blue-500/10';
    }
  };

  const getSeverityIcon = () => {
    const iconClasses = "h-5 w-5";
    switch(error.severity) {
      case 'critical': return <AlertCircle className={`${iconClasses} text-red-600`} />;
      case 'high': return <AlertTriangle className={`${iconClasses} text-orange-600`} />;
      case 'medium': return <AlertTriangle className={`${iconClasses} text-yellow-600`} />;
      default: return <Info className={`${iconClasses} text-blue-600`} />;
    }
  };

  const getSeverityLabel = () => {
    switch(error.severity) {
      case 'critical': return 'Critico';
      case 'high': return 'Alto';
      case 'medium': return 'Medio';
      default: return 'Basso';
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      setTimeout(() => onClose(), 300);
    }
  };

  const handleReportError = () => {
    // Aprire email con dettagli errore
    const subject = encodeURIComponent(`Segnalazione Errore: ${error.code}`);
    const body = encodeURIComponent(
      `Codice Errore: ${error.code}\n` +
      `Titolo: ${error.title}\n` +
      `Messaggio: ${error.message}\n\n` +
      `Timestamp: ${new Date().toISOString()}\n`
    );
    window.open(`mailto:support@rescuemanager.eu?subject=${subject}&body=${body}`);
  };

  return (
    <div className={`fixed bottom-4 right-4 bg-[#1a2536] shadow-2xl rounded-lg max-w-md border-l-4 transition-all duration-300 ${getSeverityColor()}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getSeverityIcon()}
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              error.severity === 'critical' ? 'bg-red-500/10 text-red-400' :
              error.severity === 'high' ? 'bg-orange-500/10 text-orange-700' :
              error.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-700' :
              'bg-blue-500/10 text-blue-400'
            }`}>
              {getSeverityLabel()}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white/5 rounded transition"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {/* Code */}
        <div className="mb-3">
          <span className="text-xs bg-[#141c27] px-2 py-1 rounded font-mono text-slate-300">
            {error.code}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-slate-200 mb-2">
          {error.title}
        </h3>
        
        {/* Message */}
        <p className="text-sm text-slate-400 mb-3">
          {error.message}
        </p>
        
        {/* Solution */}
        {error.solution && (
          <div className="bg-[#1a2536] border border-[#243044] rounded p-3 mb-3">
            <p className="text-xs text-slate-300">
              <strong className="text-green-600">Soluzione:</strong> {error.solution}
            </p>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          {error.docLink && (
            <a
              href={error.docLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-400 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Documentazione
            </a>
          )}
          <button
            onClick={handleReportError}
            className="text-xs text-slate-400 hover:text-slate-300 hover:underline ml-auto"
          >
            Segnala errore
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook per mostrare errori
 */
export function useErrorDisplay() {
  const [error, setError] = useState(null);

  const showError = (errorInfo) => {
    setError(errorInfo);
  };

  const hideError = () => {
    setError(null);
  };

  return {
    error,
    showError,
    hideError
  };
}

