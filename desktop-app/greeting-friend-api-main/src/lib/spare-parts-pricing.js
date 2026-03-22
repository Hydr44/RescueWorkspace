// src/lib/spare-parts-pricing.js
import { supabase } from '@/integrations/supabase/client';

/**
 * Sistema di calcolo prezzi automatico per ricambi
 * Utilizza listini Quattroruote e regole personalizzate
 */

// Carica catalogo Quattroruote
export const loadQuattroruoteCatalog = async () => {
  try {
    const response = await fetch('/data/quattroruote-catalog.json');
    return await response.json();
  } catch (error) {
    console.error('Error loading Quattroruote catalog:', error);
    return null;
  }
};

// Trova prezzo listino per un ricambio
export const findListPrice = async (partName, make, model, year) => {
  const catalog = await loadQuattroruoteCatalog();
  if (!catalog) return null;

  try {
    const vehicle = catalog.catalog[make]?.[model]?.[`${year}-${year}`];
    if (!vehicle) return null;

    // Cerca per categoria
    for (const [category, parts] of Object.entries(vehicle.categories)) {
      for (const [partKey, price] of Object.entries(parts)) {
        if (partName.toLowerCase().includes(partKey.toLowerCase()) ||
            partKey.toLowerCase().includes(partName.toLowerCase())) {
          return price;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding list price:', error);
    return null;
  }
};

// Carica regole di prezzo per organizzazione
export const loadPriceRules = async (orgId) => {
  const { data, error } = await supabase
    .from('price_rules')
    .select('*')
    .eq('org_id', orgId)
    .eq('active', true)
    .order('priority', { ascending: false });

  if (error) {
    console.error('Error loading price rules:', error);
    return [];
  }

  return data || [];
};

// Applica regola di prezzo
export const applyPriceRule = (rule, partData) => {
  try {
    const { formula, condition_type, condition_value } = rule;
    
    // Verifica condizioni
    if (condition_type === 'category' && partData.category !== condition_value) {
      return null;
    }
    if (condition_type === 'condition' && partData.condition !== condition_value) {
      return null;
    }

    // Esegui formula
    const context = {
      list_price: partData.list_price || 0,
      cost: partData.cost_price || 0,
      condition: partData.condition,
      category: partData.category
    };

    // Sostituisci variabili nella formula
    let formulaToEval = formula;
    Object.keys(context).forEach(key => {
      formulaToEval = formulaToEval.replace(new RegExp(key, 'g'), context[key]);
    });

    // Valuta formula (sicuro)
    const result = eval(formulaToEval);
    return Math.round(result * 100) / 100; // Arrotonda a 2 decimali

  } catch (error) {
    console.error('Error applying price rule:', error);
    return null;
  }
};

// Calcola prezzo automatico per un ricambio
export const calculateAutoPrice = async (partData, orgId) => {
  try {
    // 1. Trova prezzo listino Quattroruote
    let listPrice = partData.list_price;
    if (!listPrice && partData.source_vehicle) {
      // Carica dati veicolo per trovare listino
      const { data: vehicle } = await supabase
        .from('vehicles_catalog')
        .select('make, model, year_from')
        .eq('id', partData.source_vehicle)
        .single();

      if (vehicle) {
        listPrice = await findListPrice(
          partData.name,
          vehicle.make,
          vehicle.model,
          vehicle.year_from
        );
      }
    }

    // 2. Carica regole di prezzo
    const priceRules = await loadPriceRules(orgId);
    
    // 3. Applica regole in ordine di priorità
    for (const rule of priceRules) {
      const calculatedPrice = applyPriceRule(rule, {
        ...partData,
        list_price: listPrice
      });
      
      if (calculatedPrice !== null) {
        return {
          price: calculatedPrice,
          rule: rule.name,
          list_price: listPrice,
          cost_price: partData.cost_price
        };
      }
    }

    // 4. Regola di default se nessuna regola applicabile
    const defaultPrice = Math.max(
      (listPrice || 0) * 0.65,
      (partData.cost_price || 0) * 1.25
    );

    return {
      price: Math.round(defaultPrice * 100) / 100,
      rule: 'Regola Default',
      list_price: listPrice,
      cost_price: partData.cost_price
    };

  } catch (error) {
    console.error('Error calculating auto price:', error);
    return {
      price: partData.cost_price ? partData.cost_price * 1.3 : 0,
      rule: 'Fallback',
      list_price: null,
      cost_price: partData.cost_price
    };
  }
};

// Aggiorna prezzo di un ricambio
export const updatePartPrice = async (partId, orgId) => {
  try {
    // Carica dati ricambio
    const { data: part, error: partError } = await supabase
      .from('spare_parts')
      .select('*')
      .eq('id', partId)
      .eq('org_id', orgId)
      .single();

    if (partError || !part) {
      throw new Error('Ricambio non trovato');
    }

    // Calcola nuovo prezzo
    const priceResult = await calculateAutoPrice(part, orgId);

    // Aggiorna ricambio
    const { error: updateError } = await supabase
      .from('spare_parts')
      .update({
        price_sell: priceResult.price,
        auto_price: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', partId);

    if (updateError) {
      throw updateError;
    }

    return priceResult;

  } catch (error) {
    console.error('Error updating part price:', error);
    throw error;
  }
};

// Aggiorna prezzi per batch
export const updateBatchPrices = async (batchId, orgId) => {
  try {
    // Carica batch
    const { data: batch, error: batchError } = await supabase
      .from('part_batches')
      .select('*')
      .eq('id', batchId)
      .eq('org_id', orgId)
      .single();

    if (batchError || !batch) {
      throw new Error('Batch non trovato');
    }

    // Calcola nuovo prezzo
    const priceResult = await calculateAutoPrice({
      name: batch.part_name,
      cost_price: batch.cost_price,
      list_price: batch.list_price,
      condition: batch.condition
    }, orgId);

    // Aggiorna batch
    const { error: updateError } = await supabase
      .from('part_batches')
      .update({
        sell_price: priceResult.price,
        updated_at: new Date().toISOString()
      })
      .eq('id', batchId);

    if (updateError) {
      throw updateError;
    }

    // Aggiorna anche il ricambio associato se esiste
    if (batch.part_id) {
      await updatePartPrice(batch.part_id, orgId);
    }

    return priceResult;

  } catch (error) {
    console.error('Error updating batch price:', error);
    throw error;
  }
};

// Aggiorna tutti i prezzi per una distinta
export const updateJobPrices = async (jobId, orgId) => {
  try {
    const { data: batches, error: batchesError } = await supabase
      .from('part_batches')
      .select('id')
      .eq('job_id', jobId)
      .eq('org_id', orgId);

    if (batchesError) {
      throw batchesError;
    }

    const results = [];
    for (const batch of batches) {
      try {
        const result = await updateBatchPrices(batch.id, orgId);
        results.push({ batchId: batch.id, success: true, result });
      } catch (error) {
        results.push({ batchId: batch.id, success: false, error: error.message });
      }
    }

    return results;

  } catch (error) {
    console.error('Error updating job prices:', error);
    throw error;
  }
};

// Simula calcolo prezzi per anteprima
export const previewPriceCalculation = async (partData, orgId) => {
  try {
    const priceResult = await calculateAutoPrice(partData, orgId);
    
    // Carica regole per mostrare tutte le opzioni
    const priceRules = await loadPriceRules(orgId);
    const allCalculations = [];

    for (const rule of priceRules) {
      const calculatedPrice = applyPriceRule(rule, {
        ...partData,
        list_price: priceResult.list_price
      });
      
      if (calculatedPrice !== null) {
        allCalculations.push({
          rule: rule.name,
          price: calculatedPrice,
          description: rule.description,
          priority: rule.priority
        });
      }
    }

    return {
      selected: priceResult,
      alternatives: allCalculations,
      list_price: priceResult.list_price
    };

  } catch (error) {
    console.error('Error previewing price calculation:', error);
    return {
      selected: { price: 0, rule: 'Errore' },
      alternatives: [],
      list_price: null
    };
  }
};

// Utility per formattare prezzi
export const formatPrice = (price) => {
  if (typeof price !== 'number') return '€0.00';
  return `€${price.toFixed(2)}`;
};

// Utility per calcolare margine
export const calculateMargin = (sellPrice, costPrice) => {
  if (!costPrice || costPrice === 0) return 0;
  return ((sellPrice - costPrice) / costPrice) * 100;
};

// Utility per calcolare markup
export const calculateMarkup = (sellPrice, costPrice) => {
  if (!costPrice || costPrice === 0) return 0;
  return ((sellPrice - costPrice) / sellPrice) * 100;
};

