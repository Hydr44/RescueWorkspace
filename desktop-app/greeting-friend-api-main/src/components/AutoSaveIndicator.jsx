/**
 * Componente indicatore auto-save
 * Mostra stato sincronizzazione con animazioni
 */

import { FiCheck, FiAlertCircle, FiLoader } from 'react-icons/fi';

export default function AutoSaveIndicator({ state, lastSaved, error }) {
  if (state === 'idle') {
    return null;
  }

  const getIcon = () => {
    switch (state) {
      case 'saving':
        return <FiLoader className="w-4 h-4 animate-spin" />;
      case 'success':
        return <FiCheck className="w-4 h-4" />;
      case 'error':
        return <FiAlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getColor = () => {
    switch (state) {
      case 'saving':
        return 'text-blue-400';
      case 'success':
        return 'text-emerald-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getBgColor = () => {
    switch (state) {
      case 'saving':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/20';
      case 'error':
        return 'bg-red-500/10 border-red-500/20';
      default:
        return 'bg-slate-500/10 border-slate-500/20';
    }
  };

  const getMessage = () => {
    switch (state) {
      case 'saving':
        return 'Salvataggio in corso...';
      case 'success':
        return lastSaved
          ? `Salvato ${formatTime(lastSaved)}`
          : 'Salvato con successo';
      case 'error':
        return error || 'Errore nel salvataggio';
      default:
        return '';
    }
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getBgColor()} transition-all`}>
      <div className={getColor()}>
        {getIcon()}
      </div>
      <span className="text-xs font-medium text-slate-300">
        {getMessage()}
      </span>
    </div>
  );
}

function formatTime(date) {
  if (!date) return '';
  
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);

  if (diffSecs < 60) return 'proprio ora';
  if (diffMins < 60) return `${diffMins}m fa`;
  
  return date.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit'
  });
}
