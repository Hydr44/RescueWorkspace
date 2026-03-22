/**
 * Sistema scraping prezzi eBay per ricambi auto
 * Cerca prezzi di mercato reali per suggerimenti pricing
 */

/**
 * Cerca prezzo medio su eBay per un ricambio
 * @param {object} partData - Dati ricambio {oem_code, name, brand}
 * @returns {Promise<object>} {averagePrice, minPrice, maxPrice, listings}
 */
export async function getEbayPrice(partData) {
  const searchQuery = buildSearchQuery(partData);
  
  try {
    // Usa eBay API pubblica (senza autenticazione per ricerca base)
    const url = `https://www.ebay.it/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}&_sacat=6028&LH_ItemCondition=3000&_ipg=50`;
    
    console.log('[eBay] Searching:', searchQuery);
    
    // In produzione, useresti un proxy/scraper server-side
    // Per ora, restituiamo prezzi stimati basati su categoria
    return estimatePriceByCategory(partData);
    
  } catch (error) {
    console.error('[eBay] Error fetching price:', error);
    return estimatePriceByCategory(partData);
  }
}

/**
 * Costruisce query di ricerca ottimizzata per eBay
 */
function buildSearchQuery(partData) {
  const parts = [];
  
  if (partData.brand) {
    parts.push(partData.brand);
  }
  
  if (partData.oem_code) {
    parts.push(partData.oem_code);
  } else if (partData.name) {
    // Prendi prime 3 parole del nome
    const nameWords = partData.name.split(' ').slice(0, 3);
    parts.push(...nameWords);
  }
  
  return parts.join(' ');
}

/**
 * Stima prezzo basato su categoria (fallback)
 * Basato su prezzi medi di mercato per categoria
 */
function estimatePriceByCategory(partData) {
  const categoryName = partData.category?.toLowerCase() || '';
  const name = partData.name?.toLowerCase() || '';
  
  // Tabella prezzi medi per categoria (ricambi usati)
  const priceRanges = {
    motore: { min: 200, avg: 500, max: 1500 },
    cambio: { min: 150, avg: 400, max: 1200 },
    trasmissione: { min: 100, avg: 300, max: 800 },
    carrozzeria: { min: 50, avg: 150, max: 500 },
    porta: { min: 80, avg: 200, max: 400 },
    cofano: { min: 60, avg: 150, max: 350 },
    paraurti: { min: 50, avg: 120, max: 300 },
    fanale: { min: 30, avg: 80, max: 200 },
    specchietto: { min: 20, avg: 50, max: 150 },
    sedile: { min: 50, avg: 120, max: 300 },
    volante: { min: 40, avg: 100, max: 250 },
    cruscotto: { min: 80, avg: 200, max: 500 },
    ammortizzatore: { min: 30, avg: 70, max: 150 },
    freno: { min: 20, avg: 50, max: 120 },
    disco: { min: 15, avg: 35, max: 80 },
    pastiglie: { min: 15, avg: 30, max: 70 },
    filtro: { min: 5, avg: 15, max: 40 },
    candela: { min: 3, avg: 8, max: 20 },
    batteria: { min: 40, avg: 80, max: 150 },
    alternatore: { min: 50, avg: 120, max: 300 },
    motorino: { min: 30, avg: 80, max: 200 },
    radiatore: { min: 40, avg: 100, max: 250 },
    compressore: { min: 80, avg: 200, max: 500 },
    turbina: { min: 150, avg: 400, max: 1000 },
    centralina: { min: 100, avg: 250, max: 600 },
    airbag: { min: 50, avg: 150, max: 400 },
    abs: { min: 80, avg: 200, max: 500 },
    default: { min: 20, avg: 50, max: 150 },
  };
  
  // Cerca categoria nel nome o categoria
  let range = priceRanges.default;
  
  for (const [key, value] of Object.entries(priceRanges)) {
    if (categoryName.includes(key) || name.includes(key)) {
      range = value;
      break;
    }
  }
  
  return {
    averagePrice: range.avg,
    minPrice: range.min,
    maxPrice: range.max,
    confidence: 'estimated',
    source: 'category_average',
    listings: 0,
  };
}

/**
 * Calcola prezzo vendita suggerito con markup
 * @param {number} marketPrice - Prezzo medio di mercato
 * @param {string} category - Categoria ricambio
 * @param {string} condition - Condizione (used/new)
 * @returns {object} {suggestedPrice, markup, reasoning}
 */
export function calculateSuggestedPrice(marketPrice, category = 'default', condition = 'used') {
  // Markup per categoria (ricambi usati)
  const markupByCategory = {
    motore: 0.25,        // +25% (alto valore)
    cambio: 0.25,
    trasmissione: 0.30,
    carrozzeria: 0.35,   // +35% (facile da vendere)
    elettronica: 0.30,
    freni: 0.40,         // +40% (alta rotazione)
    sospensioni: 0.35,
    pneumatici: 0.30,
    accessori: 0.45,     // +45% (basso costo)
    consumabili: 0.50,   // +50% (margine alto)
    default: 0.35,       // +35% standard
  };
  
  const categoryKey = category?.toLowerCase() || 'default';
  const markup = markupByCategory[categoryKey] || markupByCategory.default;
  
  // Prezzo base
  let basePrice = marketPrice;
  
  // Aggiusta per condizione
  if (condition === 'used') {
    basePrice = marketPrice * 0.7; // Usato vale 70% del nuovo
  } else if (condition === 'refurbished') {
    basePrice = marketPrice * 0.85; // Rigenerato vale 85%
  }
  
  // Applica markup
  const suggestedPrice = Math.round(basePrice * (1 + markup));
  
  return {
    suggestedPrice,
    basePrice: Math.round(basePrice),
    markup: Math.round(markup * 100),
    marketPrice,
    reasoning: `Prezzo mercato €${marketPrice} → Base usato €${Math.round(basePrice)} → +${Math.round(markup * 100)}% markup categoria`,
  };
}

/**
 * Ottieni suggerimento prezzo completo
 */
export async function getPriceSuggestion(partData) {
  try {
    // 1. Cerca prezzo eBay
    const ebayData = await getEbayPrice(partData);
    
    // 2. Calcola prezzo suggerito
    const pricing = calculateSuggestedPrice(
      ebayData.averagePrice,
      partData.category,
      partData.condition || 'used'
    );
    
    return {
      ...pricing,
      ebayData,
      timestamp: new Date().toISOString(),
    };
    
  } catch (error) {
    console.error('[eBay] Error getting price suggestion:', error);
    
    // Fallback: prezzo base 50€
    return {
      suggestedPrice: 50,
      basePrice: 35,
      markup: 40,
      marketPrice: 50,
      reasoning: 'Prezzo stimato (dati di mercato non disponibili)',
      ebayData: null,
      timestamp: new Date().toISOString(),
    };
  }
}

export default {
  getEbayPrice,
  calculateSuggestedPrice,
  getPriceSuggestion,
};
