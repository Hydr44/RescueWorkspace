/**
 * Piloterr AutoDoc Scraper Client
 * Scraping API per prezzi, stock e immagini ricambi auto da AutoDoc
 * Docs: https://docs.piloterr.com/v2/api-reference/website/autodoc-product
 */

const PILOTERR_BASE_URL = 'https://api.piloterr.com/v2';
const AUTODOC_BASE_URL = 'https://www.auto-doc.fr';

class PiloterrClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.requestCount = 0;
    this.cache = new Map();
    this.cacheTTL = 24 * 60 * 60 * 1000; // 24 ore
  }

  async request(endpoint, params = {}) {
    const url = new URL(`${PILOTERR_BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });

    const cacheKey = url.toString();
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log('[Piloterr] Cache hit:', endpoint);
      return cached.data;
    }

    try {
      this.requestCount++;
      console.log(`[Piloterr] Request #${this.requestCount}:`, endpoint, params);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Piloterr API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      console.error('[Piloterr] Request failed:', error);
      throw error;
    }
  }

  /**
   * Cerca ricambio per codice OEM su AutoDoc e fa scraping
   * @param {string} code - Codice OEM o numero articolo
   * @param {object} options - Opzioni aggiuntive {brand}
   * @returns {Promise<object>} Dati ricambio con prezzi e stock
   */
  async searchByCode(code, options = {}) {
    // Costruisci URL AutoDoc
    const brand = options.brand || 'generic';
    const autodocUrl = `${AUTODOC_BASE_URL}/${brand.toLowerCase()}/${code.trim()}/`;
    
    console.log('[Piloterr] Scraping AutoDoc URL:', autodocUrl);
    
    try {
      const result = await this.request('/autodoc-product', {
        query: autodocUrl
      });
      
      if (!result) {
        return null;
      }

      return this.formatProduct(result);
    } catch (error) {
      // Prova con URL generico se il brand specifico fallisce
      if (options.brand) {
        console.log('[Piloterr] Retry without brand...');
        return this.searchByCode(code, { ...options, brand: null });
      }
      throw error;
    }
  }

  /**
   * Scraping diretto da URL AutoDoc
   * @param {string} autodocUrl - URL completo prodotto AutoDoc
   * @returns {Promise<object>} Dati ricambio
   */
  async scrapeAutodocUrl(autodocUrl) {
    const result = await this.request('/autodoc-product', {
      query: autodocUrl
    });
    
    if (!result) {
      return null;
    }

    return this.formatProduct(result);
  }

  /**
   * Cerca ricambi per veicolo (non supportato direttamente, usa TecDoc)
   * @param {object} vehicle - Dati veicolo {make, model, year}
   * @param {string} category - Categoria ricambio
   * @returns {Promise<array>} Lista ricambi compatibili
   */
  async searchByVehicle(vehicle, category = null) {
    console.warn('[Piloterr] searchByVehicle not supported, use TecDoc instead');
    return [];

    const result = await this.request('/vehicle-parts', params);
    
    if (!result || !result.products) {
      return [];
    }

    return result.products.map(p => this.formatProduct(p));
  }

  /**
   * Ottieni dettagli completi ricambio
   * @param {string} productId - ID prodotto AutoDoc
   * @returns {Promise<object>} Dettagli completi
   */
  async getProductDetails(productId) {
    const result = await this.request(`/product/${productId}`, {
      country: 'IT',
      language: 'it',
    });

    return this.formatProduct(result);
  }

  /**
   * Formatta risposta API Piloterr AutoDoc in formato standardizzato
   * Response format: {ean, name, price, images, rating, seller, features, subtitle, reference, availability, specifications}
   */
  formatProduct(raw) {
    if (!raw) return null;

    return {
      productId: raw.product_id || null,
      articleNumber: raw.reference || raw.ean,
      brand: raw.seller || 'AutoDoc',
      name: raw.name || '',
      description: raw.subtitle || '',
      
      price: {
        value: Number(raw.price) || 0,
        currency: 'EUR',
        original: raw.discount_percentage ? Number(raw.price) / (1 - raw.discount_percentage / 100) : Number(raw.price),
        discountPercent: raw.discount_percentage || 0,
      },
      
      availability: {
        inStock: raw.availability === 'En stock' || raw.availability?.toLowerCase().includes('stock'),
        status: raw.availability || 'Non disponibile',
        deliveryDays: raw.availability || 'N/A',
      },
      
      images: Array.isArray(raw.images) ? raw.images : [],
      
      features: Array.isArray(raw.features) ? raw.features : [],
      
      rating: {
        value: raw.rating || 0,
        percentage: raw.rating_percentage || 0,
        count: raw.reviews_count || 0,
      },
      
      specifications: raw.specifications || {},
      
      ean: raw.ean || null,
      has360Photo: raw.has_360_photo || false,
      
      raw: raw,
    };
  }

  /**
   * Ottieni statistiche utilizzo API
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      cacheSize: this.cache.size,
      cacheHitRate: this.requestCount > 0 
        ? ((this.cache.size / this.requestCount) * 100).toFixed(1) + '%'
        : '0%',
    };
  }

  /**
   * Pulisci cache
   */
  clearCache() {
    this.cache.clear();
    console.log('[Piloterr] Cache cleared');
  }
}

let piloterrClient = null;

/**
 * Inizializza client Piloterr (singleton)
 */
export function initPiloterr(apiKey) {
  if (!apiKey) {
    console.warn('[Piloterr] No API key provided');
    return null;
  }
  
  if (!piloterrClient) {
    piloterrClient = new PiloterrClient(apiKey);
    console.log('[Piloterr] Client initialized');
  }
  
  return piloterrClient;
}

/**
 * Ottieni istanza client Piloterr
 */
export function getPiloterrClient() {
  if (!piloterrClient) {
    const apiKey = import.meta.env.VITE_PILOTERR_API_KEY;
    if (apiKey) {
      return initPiloterr(apiKey);
    }
    console.warn('[Piloterr] Client not initialized and no API key in env');
    return null;
  }
  return piloterrClient;
}

/**
 * Helper: cerca prezzo per codice OEM
 */
export async function getPriceByOEM(oemCode) {
  const client = getPiloterrClient();
  if (!client) {
    console.warn('[Piloterr] Client not available');
    return null;
  }

  try {
    const product = await client.searchByCode(oemCode);
    if (!product) {
      console.log(`[Piloterr] No product found for OEM: ${oemCode}`);
      return null;
    }

    return {
      price: product.price.value,
      currency: product.price.currency,
      inStock: product.availability.inStock,
      deliveryDays: product.availability.deliveryDays,
      brand: product.brand,
      name: product.name,
      images: product.images,
    };
  } catch (error) {
    console.error('[Piloterr] Error fetching price:', error);
    return null;
  }
}

export default {
  initPiloterr,
  getPiloterrClient,
  getPriceByOEM,
};
