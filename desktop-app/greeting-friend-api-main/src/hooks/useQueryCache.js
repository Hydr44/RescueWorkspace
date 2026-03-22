// src/hooks/useQueryCache.js
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Lightweight query cache hook with stale-while-revalidate pattern.
 * Caches data in memory (module-level) so navigating away and back
 * shows cached data instantly while refetching in background.
 *
 * @param {string} key - Unique cache key
 * @param {Function} fetcher - Async function that returns data
 * @param {Object} options - { enabled, staleTime, deps }
 */

const cache = new Map();

export function useQueryCache(key, fetcher, options = {}) {
  const { enabled = true, staleTime = 60000, deps = [] } = options;
  const cached = cache.get(key);

  const [data, setData] = useState(cached?.data ?? null);
  const [loading, setLoading] = useState(!cached?.data);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const isStale = !cached || (Date.now() - (cached.timestamp || 0)) > staleTime;

  const refetch = useCallback(async () => {
    if (!enabled) return;
    try {
      setError(null);
      // Only show loading if no cached data
      if (!cache.get(key)?.data) setLoading(true);

      const result = await fetcher();

      if (mountedRef.current) {
        cache.set(key, { data: result, timestamp: Date.now() });
        setData(result);
        setLoading(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        setLoading(false);
      }
    }
  }, [key, fetcher, enabled]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled && isStale) {
      refetch();
    }
    return () => { mountedRef.current = false; };
  }, [enabled, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch };
}

/**
 * Invalidate a specific cache key or all keys matching a prefix.
 */
export function invalidateCache(keyOrPrefix) {
  if (!keyOrPrefix) {
    cache.clear();
    return;
  }
  for (const k of cache.keys()) {
    if (k === keyOrPrefix || k.startsWith(keyOrPrefix + ':')) {
      cache.delete(k);
    }
  }
}
