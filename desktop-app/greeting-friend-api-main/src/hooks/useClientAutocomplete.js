/**
 * Hook per autocomplete clienti con cache
 * Ricerca in tempo reale con debounce
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabaseBrowser } from '../lib/supabase-browser';

export function useClientAutocomplete(orgId, searchTerm = '') {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const supabase = supabaseBrowser();
  const debounceTimer = useRef(null);

  // Genera cache key per ricerca
  const getCacheKey = useCallback((term) => {
    return `clients:autocomplete:${orgId}:${term.toLowerCase()}`;
  }, [orgId]);

  // Fetch clienti da DB
  const fetchClientsFromDB = useCallback(async (term) => {
    try {
      let query = supabase
        .from('clients')
        .select('id, nome, codice, number, phone, email, address')
        .eq('org_id', orgId);

      if (term && term.trim().length > 0) {
        const searchTerm = term
          .replace(/[%_\\]/g, '')
          .replace(/['"`;]/g, '')
          .trim();

        if (searchTerm.length > 0) {
          query = query.or(
            `nome.ilike.%${searchTerm}%,codice.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
          );
        }
      }

      const { data, error } = await query.limit(10);

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('[useClientAutocomplete] DB error:', err);
      throw err;
    }
  }, [orgId, supabase]);

  // Memory cache locale
  const memoryCache = useRef(new Map());

  // Carica clienti con cache locale
  const loadClients = useCallback(async (term) => {
    if (!orgId) return;

    try {
      setLoading(true);
      setError(null);

      // Se term vuoto, carica top 10 clienti
      if (!term || term.trim().length === 0) {
        const data = await fetchClientsFromDB('');
        setClients(data);
        return;
      }

      const cacheKey = getCacheKey(term);

      // Try memory cache
      if (memoryCache.current.has(cacheKey)) {
        setClients(memoryCache.current.get(cacheKey));
        setLoading(false);
        return;
      }

      // Cache miss: fetch da DB
      const data = await fetchClientsFromDB(term);
      setClients(data);

      // Store in memory cache
      memoryCache.current.set(cacheKey, data);
    } catch (err) {
      console.error('[useClientAutocomplete] Error:', err);
      setError(err.message);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, getCacheKey, fetchClientsFromDB]);

  // Debounce ricerca
  useEffect(() => {
    // Cancella timer precedente
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Imposta nuovo timer
    debounceTimer.current = setTimeout(() => {
      loadClients(searchTerm);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchTerm, loadClients]);

  return {
    clients,
    loading,
    error
  };
}

/**
 * Hook per selezionare un cliente
 */
export function useClientSelection() {
  const [selectedClient, setSelectedClient] = useState(null);

  const selectClient = useCallback((client) => {
    setSelectedClient(client);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedClient(null);
  }, []);

  return {
    selectedClient,
    selectClient,
    clearSelection
  };
}
