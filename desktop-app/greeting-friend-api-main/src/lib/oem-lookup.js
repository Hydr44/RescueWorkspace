/**
 * OEM Lookup Service - Auto-compilazione dati ricambio da codice OEM
 * 
 * Interroga multiple fonti (TecDoc, cache locale, AI) per recuperare
 * automaticamente tutti i dati essenziali di un ricambio dato il codice OEM.
 * 
 * Flusso:
 * 1. Cerca in cache locale (external_parts_cache)
 * 2. Se non trovato, interroga TecDoc API
 * 3. Arricchisce con AI per descrizioni e categorizzazione
 * 4. Salva in cache per riutilizzo
 * 5. Ritorna dati pronti per compilare il form
 */

import { searchArticlesByNumber, getArticleDetailsById } from './tecdoc';
import { searchEbayByOEM } from './ebay-parts-lookup';
import { searchWebWithAI } from './web-ai-lookup';
import { supabaseBrowser } from './supabase-browser';
import { logger } from './logger';

/**
 * Cerca un ricambio in cache locale
 */
async function searchInCache(oemCode) {
  try {
    const { data, error } = await supabaseBrowser()
      .from('external_parts_cache')
      .select('*')
      .eq('oem_code', oemCode.toUpperCase())
      .order('last_sync', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    // Verifica se cache è ancora valida (max 30 giorni)
    if (data && data.expires_at) {
      const expiresAt = new Date(data.expires_at);
      if (expiresAt > new Date()) {
        logger.info(`[OEM Lookup] Cache hit per ${oemCode}`);
        return data.part_data;
      }
    }

    return null;
  } catch (error) {
    logger.error('[OEM Lookup] Errore ricerca cache:', error);
    return null;
  }
}

/**
 * Salva risultato in cache
 */
async function saveToCache(oemCode, partData, apiSource = 'tecdoc') {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Cache valida 30 giorni

    await supabaseBrowser()
      .from('external_parts_cache')
      .upsert({
        oem_code: oemCode.toUpperCase(),
        api_source: apiSource,
        part_data: partData,
        last_sync: new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      }, {
        onConflict: 'oem_code,api_source'
      });

    logger.info(`[OEM Lookup] Salvato in cache: ${oemCode}`);
  } catch (error) {
    logger.error('[OEM Lookup] Errore salvataggio cache:', error);
  }
}

/**
 * Normalizza dati TecDoc in formato compatibile con spare_parts
 */
function normalizeTecDocData(tecDocArticle) {
  if (!tecDocArticle) return null;

  const article = tecDocArticle.article || tecDocArticle;

  return {
    name: article.articleName || article.genericArticleName || 'Ricambio auto',
    description: article.articleDescription || article.genericArticleDescription || '',
    oem_code: article.articleNumber || article.oemNumber || '',
    ean_code: article.eanNumber || null,
    
    // Categoria
    category: article.genericArticleName || article.assemblyGroupName || null,
    
    // Marca/Fornitore
    tecdoc_supplier: article.brandName || article.supplierName || null,
    tecdoc_article_id: article.articleId || article.legacyArticleId || null,
    
    // Cross references (codici alternativi)
    cross_references: article.oeNumbers || article.crossReferences || [],
    
    // Compatibilità veicolo (se disponibile)
    vehicle_compatibility: article.vehicleInfo ? {
      make: article.vehicleInfo.manufacturerName,
      model: article.vehicleInfo.modelName,
      year_from: article.vehicleInfo.yearFrom,
      year_to: article.vehicleInfo.yearTo,
      engine_code: article.vehicleInfo.engineCode
    } : null,
    
    // Immagini
    images: article.images || article.imageUrls || [],
    
    // Specifiche tecniche
    technical_specs: article.attributes || article.criteria || [],
    
    // Prezzi suggeriti (se disponibili)
    suggested_price: article.price || null,
    
    // Metadata completa per riferimento
    _raw_tecdoc: article
  };
}

/**
 * Arricchisce i dati con AI per migliorare descrizione e categorizzazione
 */
function enrichWithAI(partData) {
  // Se manca descrizione, genera una descrizione intelligente
  if (!partData.description && partData.name) {
    const category = partData.category || '';
    const supplier = partData.tecdoc_supplier || '';
    
    partData.description = `${partData.name}${supplier ? ` - ${supplier}` : ''}${category ? ` (${category})` : ''}`;
    
    // Aggiungi info compatibilità se disponibile
    if (partData.vehicle_compatibility) {
      const vc = partData.vehicle_compatibility;
      partData.description += `\n\nCompatibile con: ${vc.make} ${vc.model}`;
      if (vc.year_from || vc.year_to) {
        partData.description += ` (${vc.year_from || '?'}-${vc.year_to || '?'})`;
      }
    }
  }

  // Suggerisci categoria se mancante
  if (!partData.category && partData.name) {
    const name = partData.name.toLowerCase();
    
    // Categorizzazione intelligente basata su parole chiave
    if (name.includes('paraurti') || name.includes('bumper')) {
      partData.category = 'Carrozzeria';
    } else if (name.includes('faro') || name.includes('fanale') || name.includes('light')) {
      partData.category = 'Illuminazione';
    } else if (name.includes('specchio') || name.includes('specchietto') || name.includes('mirror')) {
      partData.category = 'Carrozzeria';
    } else if (name.includes('filtro') || name.includes('filter')) {
      partData.category = 'Manutenzione';
    } else if (name.includes('pastiglie') || name.includes('disco') || name.includes('brake')) {
      partData.category = 'Freni';
    } else if (name.includes('ammortizzatore') || name.includes('shock')) {
      partData.category = 'Sospensioni';
    } else if (name.includes('motore') || name.includes('engine')) {
      partData.category = 'Motore';
    }
  }

  return partData;
}

/**
 * Cerca e recupera dati completi di un ricambio da codice OEM
 * 
 * @param {string} oemCode - Codice OEM del ricambio
 * @param {object} options - Opzioni ricerca
 * @param {string} options.orgId - ID organizzazione (per credenziali eBay)
 * @returns {Promise<object|null>} Dati ricambio pronti per compilare form
 */
export async function lookupByOEM(oemCode, options = {}) {
  if (!oemCode || typeof oemCode !== 'string') {
    throw new Error('Codice OEM non valido');
  }

  const cleanCode = oemCode.trim().toUpperCase();
  const { orgId } = options;
  
  logger.info(`[OEM Lookup] Ricerca per codice: ${cleanCode}`);

  try {
    // 1. Cerca in cache
    if (!options.skipCache) {
      const cached = await searchInCache(cleanCode);
      if (cached) {
        logger.info(`[OEM Lookup] Trovato in cache`);
        return enrichWithAI(cached);
      }
    }

    // 2. Cerca su TecDoc
    logger.info(`[OEM Lookup] Interrogo TecDoc API...`);
    const tecDocResponse = await searchArticlesByNumber(cleanCode);

    // Debug: log risposta completa
    logger.info(`[OEM Lookup] TecDoc response:`, tecDocResponse);

    // TecDoc può ritornare diversi formati: array, oggetto con .articles, o null
    let tecDocResults = null;
    if (Array.isArray(tecDocResponse)) {
      tecDocResults = tecDocResponse;
    } else if (tecDocResponse && Array.isArray(tecDocResponse.articles)) {
      tecDocResults = tecDocResponse.articles;
    } else if (tecDocResponse && tecDocResponse.article) {
      tecDocResults = [tecDocResponse.article];
    }

    if (!tecDocResults || tecDocResults.length === 0) {
      logger.warn(`[OEM Lookup] TecDoc: nessun risultato per ${cleanCode}`);
      
      // 2b. Prova con Web + AI (cerca su internet e analizza)
      logger.info(`[OEM Lookup] Provo con ricerca Web + AI...`);
      const webAICandidates = await searchWebWithAI(cleanCode);
      
      if (webAICandidates && webAICandidates.length > 0) {
        logger.info(`[OEM Lookup] Web+AI: trovati ${webAICandidates.length} candidati`);
        
        // Ritorna array di candidati per selezione utente
        // Il form mostrerà un modale con le opzioni
        return {
          _type: 'multiple_candidates',
          _source: 'web_ai',
          candidates: webAICandidates.map(c => enrichWithAI(c))
        };
      }
      
      logger.warn(`[OEM Lookup] Web+AI: nessun candidato trovato`);
      
      // 2c. Prova con eBay come ultimo tentativo
      logger.info(`[OEM Lookup] Provo con eBay...`);
      const ebayData = await searchEbayByOEM(cleanCode, orgId);
      
      if (ebayData) {
        logger.info(`[OEM Lookup] eBay: trovato "${ebayData.name}"`);
        
        // Arricchisci e salva in cache
        const enrichedEbay = enrichWithAI(ebayData);
        await saveToCache(cleanCode, enrichedEbay, 'ebay');
        
        return enrichedEbay;
      }
      
      // 2c. Ultimo fallback: crea dati base dal codice OEM
      logger.warn(`[OEM Lookup] eBay: nessun risultato`);
      logger.info(`[OEM Lookup] Creo dati base dal codice OEM`);
      
      const fallbackData = {
        name: `Ricambio ${cleanCode}`,
        description: `Ricambio auto - Codice OEM: ${cleanCode}`,
        oem_code: cleanCode,
        category: null,
        _source: 'fallback'
      };
      
      return enrichWithAI(fallbackData);
    }

    // Prendi il primo risultato (più rilevante)
    const firstResult = tecDocResults[0];
    
    if (!firstResult) {
      logger.warn(`[OEM Lookup] Risultato vuoto per ${cleanCode}`);
      return null;
    }
    
    // 3. Se disponibile, recupera dettagli completi
    let detailedData = firstResult;
    const articleId = firstResult.articleId || firstResult.legacyArticleId || firstResult.id;
    
    if (articleId) {
      try {
        const details = await getArticleDetailsById(articleId);
        if (details) {
          detailedData = { ...firstResult, ...details };
        }
      } catch (error) {
        logger.warn('[OEM Lookup] Impossibile recuperare dettagli articolo:', error);
        // Continua con dati base
      }
    }

    // 4. Normalizza dati
    const normalizedData = normalizeTecDocData(detailedData);
    
    // 5. Arricchisci con AI
    const enrichedData = enrichWithAI(normalizedData);

    // 6. Salva in cache
    await saveToCache(cleanCode, enrichedData, 'tecdoc');

    logger.info(`[OEM Lookup] Dati recuperati con successo per ${cleanCode}`);
    return enrichedData;

  } catch (error) {
    logger.error('[OEM Lookup] Errore durante ricerca:', error);
    throw error;
  }
}

/**
 * Cerca ricambi multipli da array di codici OEM
 * Utile per import massivo o distinte di smontaggio
 */
export async function lookupMultipleOEM(oemCodes, options = {}) {
  const results = [];
  const errors = [];

  for (const code of oemCodes) {
    try {
      const data = await lookupByOEM(code, options);
      results.push({ code, data, success: !!data });
    } catch (error) {
      errors.push({ code, error: error.message });
      results.push({ code, data: null, success: false, error: error.message });
    }

    // Rate limiting: pausa tra richieste per non sovraccaricare API
    if (!options.skipDelay) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return {
    results,
    errors,
    successCount: results.filter(r => r.success).length,
    totalCount: oemCodes.length
  };
}

/**
 * Applica i dati recuperati al form state del ricambio
 * 
 * @param {object} lookupData - Dati da lookupByOEM
 * @param {object} currentFormData - Form state attuale
 * @returns {object} Form state aggiornato
 */
export function applyLookupDataToForm(lookupData, currentFormData = {}) {
  if (!lookupData) return currentFormData;

  const updated = { ...currentFormData };

  // Compila solo campi vuoti (non sovrascrive dati già inseriti)
  if (!updated.name && lookupData.name) {
    updated.name = lookupData.name;
  }

  if (!updated.description && lookupData.description) {
    updated.description = lookupData.description;
  }

  if (!updated.oem_code && lookupData.oem_code) {
    updated.oem_code = lookupData.oem_code;
  }

  if (!updated.ean_code && lookupData.ean_code) {
    updated.ean_code = lookupData.ean_code;
  }

  if (!updated.category && lookupData.category) {
    updated.category = lookupData.category;
  }

  if (!updated.tecdoc_supplier && lookupData.tecdoc_supplier) {
    updated.tecdoc_supplier = lookupData.tecdoc_supplier;
  }

  if (!updated.tecdoc_article_id && lookupData.tecdoc_article_id) {
    updated.tecdoc_article_id = lookupData.tecdoc_article_id;
  }

  // Cross references
  if (lookupData.cross_references && lookupData.cross_references.length > 0) {
    updated.cross_references = lookupData.cross_references.join(', ');
  }

  // Compatibilità veicolo
  if (lookupData.vehicle_compatibility) {
    const vc = lookupData.vehicle_compatibility;
    if (!updated.source_vehicle_make && vc.make) {
      updated.source_vehicle_make = vc.make;
    }
    if (!updated.source_vehicle_model && vc.model) {
      updated.source_vehicle_model = vc.model;
    }
    if (!updated.source_vehicle_year && vc.year_from) {
      updated.source_vehicle_year = vc.year_from;
    }
    if (!updated.source_vehicle_engine_code && vc.engine_code) {
      updated.source_vehicle_engine_code = vc.engine_code;
    }
  }

  // Prezzo suggerito
  if (lookupData.suggested_price && !updated.price_sell) {
    updated.price_sell = lookupData.suggested_price;
  }

  // Metadata per riferimento
  updated._lookup_source = 'tecdoc';
  updated._lookup_timestamp = new Date().toISOString();

  return updated;
}

/**
 * Valida se un codice OEM ha formato valido
 */
export function isValidOEMCode(code) {
  if (!code || typeof code !== 'string') return false;
  
  const cleaned = code.trim();
  
  // OEM codes tipicamente: 5-20 caratteri alfanumerici
  if (cleaned.length < 3 || cleaned.length > 30) return false;
  
  // Deve contenere almeno un numero o lettera
  if (!/[a-zA-Z0-9]/.test(cleaned)) return false;
  
  return true;
}
