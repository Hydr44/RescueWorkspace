/**
 * Componente per visualizzare Audit History di un trasporto
 */

import { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiUser, FiEdit3, FiTrash2, FiPlus, FiClock } from 'react-icons/fi';
import { useAuditLog, formatAuditChange, formatAuditTimestamp } from '../hooks/useAuditLog';

export default function TransportAuditHistory({ transportId }) {
  const { history, loading, error } = useAuditLog(transportId);
  const [expandedId, setExpandedId] = useState(null);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 bg-[#1a2536] rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p className="text-sm text-red-400">Errore caricamento storico: {error}</p>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8">
        <FiClock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Nessuna modifica registrata</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((entry, idx) => (
        <AuditEntry
          key={idx}
          entry={entry}
          isExpanded={expandedId === idx}
          onToggle={() => setExpandedId(expandedId === idx ? null : idx)}
        />
      ))}
    </div>
  );
}

function AuditEntry({ entry, isExpanded, onToggle }) {
  const change = formatAuditChange(entry.changes, entry.action);
  const timeAgo = formatAuditTimestamp(entry.created_at);

  const getActionIcon = () => {
    switch (entry.action) {
      case 'INSERT':
        return <FiPlus className="w-4 h-4 text-green-400" />;
      case 'UPDATE':
        return <FiEdit3 className="w-4 h-4 text-blue-400" />;
      case 'DELETE':
        return <FiTrash2 className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getActionLabel = () => {
    switch (entry.action) {
      case 'INSERT':
        return 'Creato';
      case 'UPDATE':
        return 'Modificato';
      case 'DELETE':
        return 'Eliminato';
      default:
        return entry.action;
    }
  };

  const getActionColor = () => {
    switch (entry.action) {
      case 'INSERT':
        return 'bg-green-500/10 border-green-500/20';
      case 'UPDATE':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'DELETE':
        return 'bg-red-500/10 border-red-500/20';
      default:
        return 'bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className={`border rounded-lg transition-colors ${getActionColor()}`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          {getActionIcon()}
          <div className="text-left">
            <p className="text-sm font-medium text-slate-200">
              {getActionLabel()}
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <FiUser className="w-3 h-3" />
              {entry.user_email || 'Sistema'} • {timeAgo}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <FiChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <FiChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>

      {/* Dettagli */}
      {isExpanded && change && (
        <div className="px-4 pb-3 border-t border-white/5">
          {change.type === 'insert' && (
            <InsertDetails data={change.data} />
          )}
          {change.type === 'update' && (
            <UpdateDetails diffs={change.diffs} />
          )}
          {change.type === 'delete' && (
            <DeleteDetails data={change.data} />
          )}
        </div>
      )}
    </div>
  );
}

function InsertDetails({ data }) {
  const importantFields = [
    'number',
    'customer_name',
    'pickup_address',
    'dropoff_address',
    'status',
    'price'
  ];

  return (
    <div className="space-y-2 pt-3">
      <p className="text-xs font-medium text-slate-400 mb-2">Dati creati:</p>
      {importantFields.map(field => {
        const value = data[field];
        if (value === null || value === undefined) return null;
        
        return (
          <div key={field} className="flex justify-between text-xs">
            <span className="text-slate-500">{formatFieldName(field)}:</span>
            <span className="text-slate-300 font-mono">{formatValue(value)}</span>
          </div>
        );
      })}
    </div>
  );
}

function UpdateDetails({ diffs }) {
  return (
    <div className="space-y-2 pt-3">
      <p className="text-xs font-medium text-slate-400 mb-2">Modifiche:</p>
      {Object.entries(diffs).map(([field, change]) => (
        <div key={field} className="space-y-1">
          <p className="text-xs text-slate-500">{formatFieldName(field)}:</p>
          <div className="flex gap-2 text-xs font-mono">
            <div className="flex-1 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-red-300 line-through">
              {formatValue(change.old)}
            </div>
            <div className="flex-1 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-green-300">
              {formatValue(change.new)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DeleteDetails({ data }) {
  const importantFields = [
    'number',
    'customer_name',
    'pickup_address',
    'dropoff_address',
    'status'
  ];

  return (
    <div className="space-y-2 pt-3">
      <p className="text-xs font-medium text-slate-400 mb-2">Dati eliminati:</p>
      {importantFields.map(field => {
        const value = data[field];
        if (value === null || value === undefined) return null;
        
        return (
          <div key={field} className="flex justify-between text-xs">
            <span className="text-slate-500">{formatFieldName(field)}:</span>
            <span className="text-slate-300 font-mono">{formatValue(value)}</span>
          </div>
        );
      })}
    </div>
  );
}

// Utility functions
function formatFieldName(field) {
  const names = {
    'number': 'Numero',
    'customer_name': 'Cliente',
    'pickup_address': 'Partenza',
    'dropoff_address': 'Arrivo',
    'status': 'Stato',
    'price': 'Prezzo',
    'driver_id': 'Autista',
    'vehicle_id': 'Veicolo',
    'notes': 'Note',
    'created_at': 'Creato',
    'updated_at': 'Modificato'
  };
  return names[field] || field;
}

function formatValue(value) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Sì' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'number') return value.toString();
  return String(value).substring(0, 50);
}
