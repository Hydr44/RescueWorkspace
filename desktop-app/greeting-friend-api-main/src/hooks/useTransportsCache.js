/**
 * Hook per cache trasporti con Redis
 * Gestisce fetch, cache e invalidazione automatica
 */

import { useState, useEffect, useCallback } from 'react';
import { supabaseBrowser } from '../lib/supabase-browser';
import { redis } from '../lib/redis-client';

export function useTransportsCache(orgId, filters = {}) {
  const [transports, setTransports] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);
  
  const supabase = supabaseBrowser();
  const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;

  // Genera cache key univoca basata su filtri
  const getCacheKey = useCallback(() => {
    const { status, searchTerm, page, itemsPerPage } = filters;
    const parts = [
      'transports',
      orgId,
      status || 'all',
      searchTerm || 'nosearch',
      `page${page || 1}`,
      `size${itemsPerPage || 25}`
    ];
    return parts.join(':');
  }, [orgId, filters]);

  // Fetch trasporti da DB
  const fetchFromDB = useCallback(async () => {
    const { status, searchTerm, page = 1, itemsPerPage = 25 } = filters;
    
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    let query = supabase
      .from("transports")
      .select("id, number, client_id, customer_name, pickup_address, dropoff_address, status, created_at", { count: "exact" })
      .eq("org_id", orgId);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (searchTerm) {
      const term = searchTerm
        .replace(/[%_\\]/g, "")
        .replace(/['"`;]/g, "")
        .trim();
      
      if (term.length > 0) {
        query = query.or(
          `pickup_address.ilike.%${term}%,dropoff_address.ilike.%${term}%,customer_name.ilike.%${term}%`
        );
      }
    }

    query = query
      .order("created_at", { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return { data: data || [], count: count || 0 };
  }, [orgId, filters, supabase]);

  // Load trasporti con cache
  const loadTransports = useCallback(async (forceRefresh = false) => {
    if (!orgId) return;

    try {
      setLoading(true);
      setError(null);

      const cacheKey = getCacheKey();

      // Se forceRefresh, salta cache
      if (forceRefresh) {
        if (isDev) console.log('[useTransportsCache] Force refresh, skipping cache');
        const result = await fetchFromDB();
        setTransports(result.data);
        setTotalCount(result.count);
        
        // Aggiorna cache
        await redis.set(cacheKey, result, 300); // 5 minuti TTL
        return;
      }

      // Try cache con Redis
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        setTransports(cached.data);
        setTotalCount(cached.count);
        setLoading(false);
        return;
      }

      // Cache miss: fetch da DB
      if (isDev) console.log('[useTransportsCache] Cache miss, fetching from DB');
      const result = await fetchFromDB();
      setTransports(result.data);
      setTotalCount(result.count);

      // Store in cache
      await redis.set(cacheKey, result, 300); // 5 minuti TTL

    } catch (err) {
      if (isDev) console.error('[useTransportsCache] Error:', err);
      setError(err.message);
      setTransports([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [orgId, getCacheKey, fetchFromDB, isDev]);

  // Invalida cache per org
  const invalidateCache = useCallback(async () => {
    if (!orgId) return;
    
    try {
      const pattern = `transports:${orgId}:*`;
      const invalidated = await redis.invalidatePattern(pattern);
      
      if (isDev) console.log(`[useTransportsCache] Invalidated ${invalidated} cache entries`);
      
      // Reload data
      await loadTransports(true);
    } catch (err) {
      if (isDev) console.error('[useTransportsCache] Error invalidating cache:', err);
    }
  }, [orgId, loadTransports, isDev]);

  // Get cache stats
  const getCacheStats = useCallback(() => {
    const stats = redis.getStats();
    setCacheStats(stats);
    return stats;
  }, []);

  // Auto-load on mount e quando cambiano filtri
  useEffect(() => {
    loadTransports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, filters.status, filters.searchTerm, filters.page, filters.itemsPerPage]);

  return {
    transports,
    totalCount,
    loading,
    error,
    refresh: () => loadTransports(true),
    invalidateCache,
    cacheStats,
    getCacheStats
  };
}

/**
 * Hook per operazioni CRUD con invalidazione cache automatica
 */
export function useTransportMutations(orgId) {
  const supabase = supabaseBrowser();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Create transport
  const createTransport = useCallback(async (data) => {
    try {
      setSaving(true);
      
      const { data: result, error } = await supabase
        .from('transports')
        .insert({ ...data, org_id: orgId })
        .select()
        .single();

      if (error) throw error;

      // Invalida cache
      await redis.invalidatePattern(`transports:${orgId}:*`);

      return { success: true, data: result };
    } catch (error) {
      console.error('[useTransportMutations] Create error:', error);
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  }, [orgId, supabase]);

  // Update transport
  const updateTransport = useCallback(async (id, data) => {
    try {
      setSaving(true);
      
      const { data: result, error } = await supabase
        .from('transports')
        .update(data)
        .eq('id', id)
        .eq('org_id', orgId)
        .select()
        .single();

      if (error) throw error;

      // Invalida cache
      await redis.invalidatePattern(`transports:${orgId}:*`);

      return { success: true, data: result };
    } catch (error) {
      console.error('[useTransportMutations] Update error:', error);
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  }, [orgId, supabase]);

  // Delete transport
  const deleteTransport = useCallback(async (id) => {
    try {
      setDeleting(true);
      
      const { error } = await supabase
        .from('transports')
        .delete()
        .eq('id', id)
        .eq('org_id', orgId);

      if (error) throw error;

      // Invalida cache
      await redis.invalidatePattern(`transports:${orgId}:*`);

      return { success: true };
    } catch (error) {
      console.error('[useTransportMutations] Delete error:', error);
      return { success: false, error: error.message };
    } finally {
      setDeleting(false);
    }
  }, [orgId, supabase]);

  return {
    createTransport,
    updateTransport,
    deleteTransport,
    saving,
    deleting
  };
}
