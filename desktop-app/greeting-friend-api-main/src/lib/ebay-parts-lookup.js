/**
 * eBay Parts Lookup Service
 * 
 * Cerca ricambi auto su eBay usando l'API Browse
 * Ottimo fallback per TecDoc quando i codici non sono nel catalogo
 * Usa le credenziali OAuth già salvate in marketplace_connections
 */

import { logger } from './logger';
import { getConnection } from './marketplace';

const EBAY_API_BASE = 'https://api.ebay.com/buy/browse/v1';

/**
 * Ottiene access token eBay OAuth dalle credenziali salvate
 */
async function getEbayAccessToken(orgId) {
  try {
    // Recupera connessione eBay da marketplace_connections
    const { data: connection, error } = await getConnection(orgId, 'ebay');
    
    if (error || !connection) {
      logger.warn('[eBay Lookup] Connessione eBay non trovata');
      return null;
    }

    // Usa il token OAuth già salvato
    if (connection.credentials?.oauth_token) {
      logger.info('[eBay Lookup] Uso token OAuth esistente');
      return connection.credentials.oauth_token;
    }

    // Se non c'è oauth_token, prova con app_id/cert_id per generarne uno nuovo
    const { app_id, cert_id } = connection.credentials || {};
    
    if (!app_id || !cert_id) {
      logger.warn('[eBay Lookup] Credenziali eBay incomplete');
      return null;
    }

    logger.info('[eBay Lookup] Genero nuovo token con app_id/cert_id');
    const credentials = btoa(`${app_id}:${cert_id}`);
    
    const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
    });

    if (!response.ok) {
      throw new Error(`eBay OAuth error: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    logger.error('[eBay Lookup] Errore OAuth:', error);
    return null;
  }
}

/**
 * Cerca ricambi su eBay per codice OEM
 */
export async function searchEbayByOEM(oemCode, orgId) {
  try {
    const token = await getEbayAccessToken(orgId);
    if (!token) {
      logger.warn('[eBay Lookup] Token non disponibile');
      return null;
    }

    // Cerca su eBay Motors (categoria 6000 = eBay Motors)
    const query = encodeURIComponent(`${oemCode} auto parts`);
    const url = `${EBAY_API_BASE}/item_summary/search?q=${query}&category_ids=6000&limit=10`;

    logger.info(`[eBay Lookup] Ricerca: ${oemCode}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_IT' // eBay Italia
      }
    });

    if (!response.ok) {
      throw new Error(`eBay API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.itemSummaries || data.itemSummaries.length === 0) {
      logger.info(`[eBay Lookup] Nessun risultato per ${oemCode}`);
      return null;
    }

    logger.info(`[eBay Lookup] Trovati ${data.itemSummaries.length} risultati`);

    // Prendi il primo risultato più rilevante
    const firstItem = data.itemSummaries[0];

    return normalizeEbayItem(firstItem, oemCode);

  } catch (error) {
    logger.error('[eBay Lookup] Errore ricerca:', error);
    return null;
  }
}

/**
 * Normalizza item eBay in formato compatibile con spare_parts
 */
function normalizeEbayItem(item, oemCode) {
  // Estrai marca/modello dal titolo se possibile
  const title = item.title || '';
  const vehicleMatch = extractVehicleFromTitle(title);

  return {
    name: cleanTitle(title),
    description: item.shortDescription || title,
    oem_code: oemCode,
    
    // Categoria (prova a dedurre dal titolo)
    category: extractCategoryFromTitle(title),
    
    // Prezzo suggerito (converti da eBay price)
    suggested_price: item.price?.value ? parseFloat(item.price.value) : null,
    
    // Veicolo compatibile (se trovato nel titolo)
    vehicle_compatibility: vehicleMatch,
    
    // Immagini
    images: item.image?.imageUrl ? [item.image.imageUrl] : [],
    
    // Condizione
    condition: mapEbayCondition(item.condition),
    
    // Metadata eBay
    _ebay_item_id: item.itemId,
    _ebay_url: item.itemWebUrl,
    _source: 'ebay'
  };
}

/**
 * Pulisce il titolo eBay rimuovendo caratteri inutili
 */
function cleanTitle(title) {
  return title
    .replace(/\s+/g, ' ')
    .replace(/[*#]+/g, '')
    .trim()
    .substring(0, 100); // Max 100 caratteri
}

/**
 * Estrae marca/modello dal titolo eBay
 */
function extractVehicleFromTitle(title) {
  const titleLower = title.toLowerCase();
  
  // Pattern comuni: "per BMW Serie 3", "for Fiat Punto", "fits VW Golf"
  const patterns = [
    /(?:per|for|fits)\s+([a-z]+)\s+([a-z0-9\s]+?)(?:\s|$)/i,
    /([a-z]+)\s+([a-z0-9\s]+?)\s+(?:e90|e46|mk\d)/i
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      return {
        make: match[1].trim(),
        model: match[2].trim(),
        year_from: null,
        year_to: null
      };
    }
  }

  // Cerca solo marca
  const brands = ['BMW', 'Audi', 'VW', 'Volkswagen', 'Mercedes', 'Fiat', 'Alfa Romeo', 'Lancia', 'Ford', 'Opel', 'Renault', 'Peugeot', 'Citroen'];
  for (const brand of brands) {
    if (titleLower.includes(brand.toLowerCase())) {
      return {
        make: brand,
        model: null,
        year_from: null,
        year_to: null
      };
    }
  }

  return null;
}

/**
 * Estrae categoria dal titolo
 */
function extractCategoryFromTitle(title) {
  const titleLower = title.toLowerCase();
  
  const categoryMap = {
    'paraurti|bumper': 'Carrozzeria',
    'faro|fanale|headlight|light': 'Illuminazione',
    'specchio|mirror': 'Carrozzeria',
    'portiera|door|sportello': 'Carrozzeria',
    'cofano|hood|bonnet': 'Carrozzeria',
    'parafango|fender|wing': 'Carrozzeria',
    'filtro|filter': 'Manutenzione',
    'pastiglie|disco|brake|freno': 'Freni',
    'ammortizzatore|shock|suspension': 'Sospensioni',
    'motore|engine|motor': 'Motore',
    'cambio|gearbox|transmission': 'Trasmissione',
    'radiatore|radiator': 'Raffreddamento',
    'alternatore|alternator': 'Elettrico',
    'batteria|battery': 'Elettrico',
    'cerchio|wheel|rim': 'Ruote',
    'pneumatico|tire|tyre': 'Ruote'
  };

  for (const [keywords, category] of Object.entries(categoryMap)) {
    const patterns = keywords.split('|');
    if (patterns.some(p => titleLower.includes(p))) {
      return category;
    }
  }

  return null;
}

/**
 * Mappa condizione eBay a condizione spare_parts
 */
function mapEbayCondition(ebayCondition) {
  if (!ebayCondition) return 'used';
  
  const condition = ebayCondition.toLowerCase();
  
  if (condition.includes('new') || condition.includes('nuovo')) return 'new';
  if (condition.includes('refurbished') || condition.includes('ricondizionato')) return 'refurbished';
  if (condition.includes('damaged') || condition.includes('danneggiato')) return 'damaged';
  
  return 'used';
}

/**
 * Cerca ricambi multipli su eBay
 */
export async function searchEbayMultiple(oemCodes) {
  const results = [];
  
  for (const code of oemCodes) {
    try {
      const data = await searchEbayByOEM(code);
      results.push({ code, data, success: !!data });
      
      // Rate limiting: 1 richiesta al secondo
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      results.push({ code, data: null, success: false, error: error.message });
    }
  }
  
  return results;
}
