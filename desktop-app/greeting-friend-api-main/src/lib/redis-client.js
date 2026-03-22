/**
 * Redis Client per Desktop App
 * Usa Upstash Redis REST API (compatibile con Electron)
 */

// Fallback values se env vars non disponibili
const getEnvVar = (key, fallback) => {
  try {
    return import.meta.env?.[key] || fallback;
  } catch {
    return fallback;
  }
};

const REDIS_URL = getEnvVar('VITE_UPSTASH_REDIS_REST_URL', 'https://knowing-toad-69724.upstash.io');
const REDIS_TOKEN = getEnvVar('VITE_UPSTASH_REDIS_REST_TOKEN', 'gQAAAAAAARBcAAIncDI5ZmRiY2Q4NTk1YjM0MGFmOTA2M2FmNjM1NjA0MjNmMHAyNjk3MjQ');

class RedisClient {
  constructor() {
    this.baseUrl = REDIS_URL;
    this.token = REDIS_TOKEN;
    this.enabled = false; // Disabilita Redis REST API per evitare timeout
    this.fallbackMode = true; // Usa memory cache come primario
    
    // In-memory cache (primario)
    this.memoryCache = new Map();
    this.cacheTimers = new Map();
    
    // Stats per monitoring
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      sets: 0
    };
  }

  /**
   * Esegue comando Redis via REST API
   */
  async execute(command, ...args) {
    if (!this.enabled) return null;

    try {
      const response = await fetch(`${this.baseUrl}/${command}/${args.join('/')}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        timeout: 5000 // 5 secondi timeout
      });

      if (!response.ok) {
        throw new Error(`Redis error: ${response.status}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.warn('[Redis] Connection failed, switching to fallback mode:', error.message);
      this.fallbackMode = true;
      this.stats.errors++;
      return null;
    }
  }

  /**
   * GET - Recupera valore
   */
  async get(key) {
    try {
      // Try Redis first
      const value = await this.execute('get', key);
      
      if (value) {
        this.stats.hits++;
        return JSON.parse(value);
      }
      
      // Fallback: try memory cache
      if (this.fallbackMode && this.memoryCache.has(key)) {
        this.stats.hits++;
        return this.memoryCache.get(key);
      }
      
      this.stats.misses++;
      return null;
    } catch (error) {
      console.error('[Redis] Error in get:', error);
      this.stats.errors++;
      return null;
    }
  }

  /**
   * SET - Salva valore con TTL
   */
  async set(key, value, ttlSeconds = 300) {
    try {
      const serialized = JSON.stringify(value);
      const result = await this.execute('set', key, serialized, 'EX', ttlSeconds);
      
      // Se Redis fallisce, usa memory cache
      if (result === null && this.fallbackMode) {
        // Cancella timer precedente se esiste
        if (this.cacheTimers.has(key)) {
          clearTimeout(this.cacheTimers.get(key));
        }
        
        // Salva in memory cache
        this.memoryCache.set(key, value);
        
        // Imposta timer per scadenza
        const timer = setTimeout(() => {
          this.memoryCache.delete(key);
          this.cacheTimers.delete(key);
        }, ttlSeconds * 1000);
        
        this.cacheTimers.set(key, timer);
        console.log(`[Redis] Memory Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
      }
      
      this.stats.sets++;
      console.log(`[Redis] Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
      return true;
    } catch (error) {
      console.error('[Redis] Error in set:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * DEL - Elimina chiave
   */
  async del(key) {
    try {
      await this.execute('del', key);
      console.log(`[Redis] Cache DEL: ${key}`);
      return true;
    } catch (error) {
      console.error('[Redis] Error in del:', error);
      return false;
    }
  }

  /**
   * KEYS - Lista chiavi con pattern
   */
  async keys(pattern) {
    try {
      const keys = await this.execute('keys', pattern);
      return keys || [];
    } catch (error) {
      console.error('[Redis] Error in keys:', error);
      return [];
    }
  }

  /**
   * Invalida cache per pattern (es: "transports:org-123:*")
   */
  async invalidatePattern(pattern) {
    try {
      const keys = await this.keys(pattern);
      
      if (keys.length === 0) {
        console.log(`[Redis] No keys to invalidate for pattern: ${pattern}`);
        return 0;
      }

      // Elimina tutte le chiavi trovate
      const promises = keys.map(key => this.del(key));
      await Promise.all(promises);
      
      console.log(`[Redis] Invalidated ${keys.length} keys for pattern: ${pattern}`);
      return keys.length;
    } catch (error) {
      console.error('[Redis] Error invalidating pattern:', error);
      return 0;
    }
  }

  /**
   * Cache wrapper con fetcher
   */
  async cached(key, ttl, fetcher) {
    // Try cache
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Miss: fetch data
    try {
      const data = await fetcher();
      
      // Store in cache
      await this.set(key, data, ttl);
      
      return data;
    } catch (error) {
      console.error('[Redis] Error in cached fetcher:', error);
      throw error;
    }
  }

  /**
   * Ottieni statistiche cache
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : 0;
    
    return {
      ...this.stats,
      total,
      hitRate: `${hitRate}%`
    };
  }

  /**
   * Reset statistiche
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      sets: 0
    };
  }

  /**
   * Disabilita cache (fallback mode)
   */
  disable() {
    this.enabled = false;
    console.warn('[Redis] Cache disabled');
  }

  /**
   * Abilita cache
   */
  enable() {
    this.enabled = true;
    console.log('[Redis] Cache enabled');
  }

  /**
   * Health check
   */
  async ping() {
    try {
      const result = await this.execute('ping');
      return result === 'PONG';
    } catch (error) {
      console.error('[Redis] Health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const redis = new RedisClient();

// Export per testing
export { RedisClient };
