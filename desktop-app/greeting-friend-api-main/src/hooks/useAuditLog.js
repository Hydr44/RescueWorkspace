/**
 * Hook per gestire Audit Log
 * Recupera e visualizza storico modifiche
 */

import { useState, useEffect, useCallback } from 'react';
import { supabaseBrowser } from '../lib/supabase-browser';

export function useAuditLog(recordId, tableName = 'transports') {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const supabase = supabaseBrowser();
  const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;

  // Carica storico modifiche
  const loadHistory = useCallback(async () => {
    if (!recordId) return;

    try {
      setLoading(true);
      setError(null);

      // Usa RPC function per recuperare audit history
      const { data, error: rpcError } = await supabase.rpc(
        'get_transport_audit_history',
        { p_transport_id: recordId }
      );

      if (rpcError) throw rpcError;

      setHistory(data || []);
    } catch (err) {
      if (isDev) console.error('[useAuditLog] Error loading history:', err);
      setError(err.message);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [recordId, supabase, isDev]);

  // Auto-load on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    loading,
    error,
    refresh: loadHistory
  };
}

/**
 * Hook per audit summary
 */
export function useAuditSummary(orgId) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const supabase = supabaseBrowser();
  const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;

  const loadSummary = useCallback(async () => {
    if (!orgId) return;

    try {
      setLoading(true);
      setError(null);

      // Query view audit_summary_by_org
      const { data, error: queryError } = await supabase
        .from('audit_summary_by_org')
        .select('*')
        .eq('org_id', orgId);

      if (queryError) throw queryError;

      // Organizza per tabella e azione
      const organized = {};
      (data || []).forEach(row => {
        if (!organized[row.table_name]) {
          organized[row.table_name] = {};
        }
        organized[row.table_name][row.action] = {
          count: row.count,
          unique_users: row.unique_users,
          first_action: row.first_action,
          last_action: row.last_action
        };
      });

      setSummary(organized);
    } catch (err) {
      if (isDev) console.error('[useAuditSummary] Error loading summary:', err);
      setError(err.message);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [orgId, supabase, isDev]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return {
    summary,
    loading,
    error,
    refresh: loadSummary
  };
}

/**
 * Utility: Formatta cambio per visualizzazione
 */
export function formatAuditChange(change, action) {
  if (!change) return null;

  if (action === 'INSERT') {
    return {
      type: 'insert',
      data: change
    };
  }

  if (action === 'DELETE') {
    return {
      type: 'delete',
      data: change
    };
  }

  if (action === 'UPDATE') {
    // Confronta old vs new
    const old = change.old || {};
    const new_data = change.new || {};
    const diffs = {};

    // Trova campi modificati
    const allKeys = new Set([...Object.keys(old), ...Object.keys(new_data)]);
    
    allKeys.forEach(key => {
      if (JSON.stringify(old[key]) !== JSON.stringify(new_data[key])) {
        diffs[key] = {
          old: old[key],
          new: new_data[key]
        };
      }
    });

    return {
      type: 'update',
      diffs
    };
  }

  return null;
}

/**
 * Utility: Formatta timestamp
 */
export function formatAuditTimestamp(timestamp) {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Proprio ora';
  if (diffMins < 60) return `${diffMins}m fa`;
  if (diffHours < 24) return `${diffHours}h fa`;
  if (diffDays < 7) return `${diffDays}d fa`;

  return date.toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
