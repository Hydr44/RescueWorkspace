// src/components/ui/EmptyState.jsx
import PropTypes from 'prop-types';
import { FiInbox, FiPlus } from 'react-icons/fi';

/**
 * Componente EmptyState riutilizzabile per liste vuote.
 * Mostra un'icona, titolo, descrizione e opzionalmente un pulsante CTA.
 */
export default function EmptyState({
  icon: Icon = FiInbox,
  title = "Nessun elemento",
  description = "Non ci sono ancora dati da mostrare.",
  actionLabel,
  actionIcon: ActionIcon = FiPlus,
  onAction,
  className = "",
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-[#141c27]  flex items-center justify-center mb-5">
        <Icon className="w-8 h-8 text-slate-500 " />
      </div>
      <h3 className="text-lg font-semibold text-slate-200  mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500  text-center max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
        >
          <ActionIcon className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string,
  description: PropTypes.string,
  actionLabel: PropTypes.string,
  actionIcon: PropTypes.elementType,
  onAction: PropTypes.func,
  className: PropTypes.string,
};
