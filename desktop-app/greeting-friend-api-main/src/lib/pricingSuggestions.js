/**
 * Sistema di suggerimenti prezzi per ricambi
 * Combina Piloterr AutoDoc + markup automatico + storico prezzi
 */

import { getPiloterrClient } from './piloterr';
import { supabase } from '@/integrations/supabase/client';

/**
 * Calcola prezzo suggerito per un ricambio
 * @param {object} sparePart - Dati ricambio {oem_code, ean_code, category, current_price}
 * @param {object} options - Opzioni {markupPercent, forceRefresh}
 * @returns {Promise<object>} Suggerimento prezzo completo
 */
export async function calculatePriceSuggestion(sparePart, options = {}) {
  const {
    markupPercent = 30,
    forceRefresh = false,
  } = options;

  const result = {
    autodocPrice: null,
    ebayPrice: null,
    suggestedPrice: null,
    markup: markupPercent,
    confidence: 'low',
    sources: [],
    availability: null,
    deliveryDays: null,
    lastCheck: null,
  };

  // 1. Controlla cache DB (se non forceRefresh)
  if (!forceRefresh && sparePart.id) {
    const cached = await getCachedPricing(sparePart.id);
    if (cached && isCacheValid(cached.last_price_check)) {
      console.log('[Pricing] Using cached data');
      return {
        autodocPrice: cached.suggested_price_autodoc,
        ebayPrice: cached.suggested_price_ebay,
        suggestedPrice: cached.price || calculateFinalPrice(cached.suggested_price_autodoc, markupPercent),
        markup: cached.price_markup_percent || markupPercent,
        confidence: 'medium',
        sources: ['cache'],
        availability: cached.autodoc_availability,
        deliveryDays: cached.autodoc_delivery_days,
        lastCheck: cached.last_price_check,
      };
    }
  }

  // 2. Cerca prezzo su Piloterr AutoDoc
  const piloterrClient = getPiloterrClient();
  if (piloterrClient && sparePart.oem_code) {
    try {
      const product = await piloterrClient.searchByCode(sparePart.oem_code);
      if (product && product.price.value > 0) {
        result.autodocPrice = product.price.value;
        result.availability = product.availability;
        result.deliveryDays = product.availability.deliveryDays;
        result.sources.push('autodoc');
        result.confidence = 'high';
        
        console.log(`[Pricing] AutoDoc price for ${sparePart.oem_code}: €${product.price.value}`);
      }
    } catch (error) {
      console.error('[Pricing] Piloterr error:', error);
    }
  }

  // 3. TODO: Scraping eBay (implementazione futura)
  // result.ebayPrice = await scrapeEbayPrice(sparePart.oem_code);

  // 4. Calcola prezzo finale suggerito
  const basePrice = result.autodocPrice || sparePart.current_price || 0;
  if (basePrice > 0) {
    result.suggestedPrice = calculateFinalPrice(basePrice, markupPercent);
  }

  // 5. Salva in cache DB
  if (sparePart.id) {
    await savePricingCache(sparePart.id, result, markupPercent);
  }

  result.lastCheck = new Date().toISOString();
  return result;
}

/**
 * Calcola prezzo finale con markup
 */
function calculateFinalPrice(basePrice, markupPercent) {
  if (!basePrice || basePrice <= 0) return null;
  const markup = 1 + (markupPercent / 100);
  return Math.round(basePrice * markup * 100) / 100;
}

/**
 * Verifica se cache è ancora valida (24 ore)
 */
function isCacheValid(lastCheck) {
  if (!lastCheck) return false;
  const cacheAge = Date.now() - new Date(lastCheck).getTime();
  const maxAge = 24 * 60 * 60 * 1000; // 24 ore
  return cacheAge < maxAge;
}

/**
 * Recupera pricing da cache DB
 */
async function getCachedPricing(sparePartId) {
  try {
    const { data, error } = await supabase
      .from('spare_parts')
      .select('suggested_price_autodoc, suggested_price_ebay, price, price_markup_percent, last_price_check, autodoc_availability, autodoc_delivery_days')
      .eq('id', sparePartId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[Pricing] Cache read error:', error);
    return null;
  }
}

/**
 * Salva pricing in cache DB
 */
async function savePricingCache(sparePartId, pricingResult, markupPercent) {
  try {
    const { error } = await supabase
      .from('spare_parts')
      .update({
        suggested_price_autodoc: pricingResult.autodocPrice,
        suggested_price_ebay: pricingResult.ebayPrice,
        price_markup_percent: markupPercent,
        last_price_check: new Date().toISOString(),
        autodoc_availability: pricingResult.availability,
        autodoc_delivery_days: pricingResult.deliveryDays,
      })
      .eq('id', sparePartId);

    if (error) throw error;
    console.log('[Pricing] Cache saved for spare part:', sparePartId);
  } catch (error) {
    console.error('[Pricing] Cache save error:', error);
  }
}

/**
 * Ottieni markup suggerito per categoria
 */
export function getDefaultMarkupByCategory(category) {
  const markupMap = {
    'motore': 35,
    'trasmissione': 35,
    'carrozzeria': 40,
    'elettronica': 45,
    'freni': 30,
    'sospensioni': 30,
    'pneumatici': 25,
    'accessori': 50,
    'consumabili': 40,
  };

  const normalizedCategory = category?.toLowerCase() || '';
  for (const [key, markup] of Object.entries(markupMap)) {
    if (normalizedCategory.includes(key)) {
      return markup;
    }
  }

  return 30; // Default
}

/**
 * Batch update prezzi per lista ricambi
 */
export async function batchUpdatePricing(sparePartIds, options = {}) {
  const results = {
    updated: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  for (const id of sparePartIds) {
    try {
      const { data: sparePart, error } = await supabase
        .from('spare_parts')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !sparePart) {
        results.skipped++;
        continue;
      }

      const pricing = await calculatePriceSuggestion(sparePart, {
        ...options,
        forceRefresh: true,
      });

      if (pricing.suggestedPrice) {
        await supabase
          .from('spare_parts')
          .update({ price: pricing.suggestedPrice })
          .eq('id', id);
        
        results.updated++;
      } else {
        results.skipped++;
      }

      // Rate limiting: 7 req/sec per Premium plan
      await new Promise(resolve => setTimeout(resolve, 150));

    } catch (error) {
      results.failed++;
      results.errors.push({ id, error: error.message });
      console.error(`[Pricing] Batch update failed for ${id}:`, error);
    }
  }

  return results;
}

/**
 * Trova ricambi con prezzi obsoleti (>7 giorni)
 */
export async function findStalePrice(limit = 50) {
  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - 7);

  try {
    const { data, error } = await supabase
      .from('spare_parts')
      .select('id, name, oem_code, last_price_check')
      .or(`last_price_check.is.null,last_price_check.lt.${staleDate.toISOString()}`)
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[Pricing] Error finding stale prices:', error);
    return [];
  }
}

export default {
  calculatePriceSuggestion,
  getDefaultMarkupByCategory,
  batchUpdatePricing,
  findStalePrice,
};
