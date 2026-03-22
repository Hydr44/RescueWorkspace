/**
 * Sincronizzazione automatica Magazzino Ricambi → Marketplace B2B
 */

import { createListing, updateListing, listMyListings } from './marketplace-b2b';
import { supabaseBrowser } from './supabase-browser';

async function getSparePartImagesUrls(sparePartId) {
  if (!sparePartId) return [];

  const { data, error } = await supabaseBrowser()
    .from('spare_part_images')
    .select('url,is_primary')
    .eq('spare_part_id', sparePartId)
    .order('is_primary', { ascending: false });

  if (error) {
    console.error('Errore caricamento immagini ricambio:', error);
    return [];
  }

  return (data || []).map(r => r.url).filter(Boolean);
}

function formatVehicleDetails(sparePart) {
  const parts = [];
  const make = sparePart?.source_vehicle_make;
  const model = sparePart?.source_vehicle_model;
  const year = sparePart?.source_vehicle_year;

  if (make || model || year) {
    parts.push(`Veicolo: ${[make, model].filter(Boolean).join(' ')}${year ? ` (${year})` : ''}`.trim());
  }

  if (sparePart?.source_vehicle_fuel) parts.push(`Alimentazione: ${sparePart.source_vehicle_fuel}`);
  if (sparePart?.source_vehicle_engine_code) parts.push(`Codice motore: ${sparePart.source_vehicle_engine_code}`);
  if (sparePart?.source_vehicle_plate) parts.push(`Targa: ${sparePart.source_vehicle_plate}`);
  if (sparePart?.source_vehicle_km) parts.push(`Km: ${sparePart.source_vehicle_km}`);
  if (sparePart?.source_vehicle_vin) parts.push(`VIN: ${sparePart.source_vehicle_vin}`);

  return parts.join('\n');
}

function buildMarketplaceDescription(sparePart, options = {}) {
  const base = (options.description || sparePart.description || '').trim();
  const fallback = `${sparePart.name} - Codice: ${sparePart.sku || sparePart.oem_code || 'N/A'}`;
  const vehicleDetails = formatVehicleDetails(sparePart);

  const desc = (base || fallback).trim();
  if (!vehicleDetails) return desc;

  return `${desc}\n\n${vehicleDetails}`.trim();
}

function normalizeImages(sparePart, imageUrlsFromDb = []) {
  if (imageUrlsFromDb.length > 0) return imageUrlsFromDb;

  if (Array.isArray(sparePart?.images)) {
    return sparePart.images
      .map(img => (typeof img === 'string' ? img : img?.url))
      .filter(Boolean);
  }

  return [];
}

/**
 * Pubblica un ricambio sul marketplace B2B
 * @param {string} orgId - ID organizzazione
 * @param {object} sparePart - Dati ricambio da spare_parts
 * @param {object} options - Opzioni pubblicazione
 */
export async function publishSparePartToMarketplace(orgId, sparePart, options = {}) {
  try {
    const imageUrls = await getSparePartImagesUrls(sparePart.id);

    const listingData = {
      spare_part_id: sparePart.id,
      title: sparePart.name, // Usa sempre name, non published_title
      description: buildMarketplaceDescription(sparePart, options),
      category: sparePart.category || 'Altro',
      
      // Dati veicolo (se disponibili)
      vehicle_brand: sparePart.source_vehicle_make || '',
      vehicle_model: sparePart.source_vehicle_model || '',
      vehicle_year: sparePart.source_vehicle_year || null,
      vin: sparePart.source_vehicle_vin || '',
      
      // Condizioni
      condition: sparePart.condition || 'usato',
      quality_grade: options.quality_grade || 'B',
      warranty_days: sparePart.warranty_months ? sparePart.warranty_months * 30 : 0,
      
      // Prezzo e disponibilità
      price: options.price || sparePart.sale_price || sparePart.price_sell || 0,
      quantity: sparePart.quantity || 1,
      available_quantity: sparePart.quantity || 1,
      
      // Immagini (converti formato se necessario)
      images: normalizeImages(sparePart, imageUrls),
      
      // Spedizione
      shipping_available: options.shipping_available !== false,
      shipping_cost: options.shipping_cost || null,
      pickup_only: options.pickup_only || false,
      pickup_address: options.pickup_address || '',
      
      // Stato e visibilità
      status: options.auto_publish ? 'active' : 'draft',
      visibility: options.visibility || 'public',
      
      // Tag (genera automaticamente da dati ricambio)
      tags: generateTags(sparePart),
      
      created_by: options.created_by
    };

    const { data, error } = await createListing(orgId, listingData);
    
    if (error) throw error;
    
    return { success: true, listing: data };
  } catch (err) {
    console.error('Errore pubblicazione marketplace:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Aggiorna annuncio marketplace quando ricambio viene modificato
 */
export async function syncSparePartToMarketplace(orgId, sparePartId, updates) {
  try {
    // Trova listing collegato a questo ricambio
    const { data: listings } = await listMyListings(orgId);
    const linkedListing = listings?.find(l => l.spare_part_id === sparePartId);
    
    if (!linkedListing) {
      return { success: false, error: 'Nessun annuncio collegato' };
    }

    // Aggiorna solo campi rilevanti
    const listingUpdates = {};
    
    if (updates.name) listingUpdates.title = updates.name;
    if (updates.description) listingUpdates.description = updates.description;
    if (updates.sale_price !== undefined) listingUpdates.price = updates.sale_price;
    if (updates.quantity !== undefined) {
      listingUpdates.quantity = updates.quantity;
      listingUpdates.available_quantity = updates.quantity;
    }
    if (updates.images) {
      listingUpdates.images = normalizeImages({ images: updates.images }, []);
    } else {
      const imageUrls = await getSparePartImagesUrls(sparePartId);
      if (imageUrls.length > 0) listingUpdates.images = imageUrls;
    }

    // Aggiorna anche i dati veicolo se presenti negli update
    if (updates.source_vehicle_make !== undefined) listingUpdates.vehicle_brand = updates.source_vehicle_make || '';
    if (updates.source_vehicle_model !== undefined) listingUpdates.vehicle_model = updates.source_vehicle_model || '';
    if (updates.source_vehicle_year !== undefined) listingUpdates.vehicle_year = updates.source_vehicle_year || null;
    if (updates.source_vehicle_vin !== undefined) listingUpdates.vin = updates.source_vehicle_vin || '';
    
    // Se quantità = 0, disattiva annuncio
    if (updates.quantity === 0) {
      listingUpdates.status = 'removed';
    }

    const { data, error } = await updateListing(linkedListing.id, listingUpdates);
    
    if (error) throw error;
    
    return { success: true, listing: data };
  } catch (err) {
    console.error('Errore sincronizzazione marketplace:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Rimuovi annuncio marketplace quando ricambio viene eliminato
 */
export async function removeSparePartFromMarketplace(orgId, sparePartId) {
  try {
    const { data: listings } = await listMyListings(orgId);
    const linkedListing = listings?.find(l => l.spare_part_id === sparePartId);
    
    if (!linkedListing) {
      return { success: true }; // Nessun annuncio da rimuovere
    }

    const { error } = await updateListing(linkedListing.id, { status: 'removed' });
    
    if (error) throw error;
    
    return { success: true };
  } catch (err) {
    console.error('Errore rimozione da marketplace:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Verifica se un ricambio è già pubblicato sul marketplace
 */
export async function isSparePartOnMarketplace(orgId, sparePartId) {
  try {
    const { data: listings } = await listMyListings(orgId);
    const linkedListing = listings?.find(l => l.spare_part_id === sparePartId && l.status === 'active');
    
    return {
      isPublished: !!linkedListing,
      listing: linkedListing
    };
  } catch (err) {
    console.error('Errore verifica marketplace:', err);
    return { isPublished: false, listing: null };
  }
}

/**
 * Genera tag automatici da dati ricambio
 */
function generateTags(sparePart) {
  const tags = [];
  
  if (sparePart.source_vehicle_make) tags.push(sparePart.source_vehicle_make);
  if (sparePart.source_vehicle_model) tags.push(sparePart.source_vehicle_model);
  if (sparePart.category) tags.push(sparePart.category);
  if (sparePart.oem_code) tags.push('OEM: ' + sparePart.oem_code);
  if (sparePart.condition === 'new') tags.push('nuovo');
  if (sparePart.warranty_months > 0) tags.push('garantito');
  if (sparePart.tecdoc_supplier) tags.push(sparePart.tecdoc_supplier);
  
  return tags.filter(Boolean).slice(0, 10); // Max 10 tag
}

/**
 * Sincronizzazione batch di ricambi
 */
export async function batchPublishToMarketplace(orgId, sparePartIds, options = {}) {
  const results = {
    success: [],
    failed: []
  };

  for (const partId of sparePartIds) {
    try {
      // Carica ricambio
      const { data: sparePart } = await supabaseBrowser()
        .from('spare_parts')
        .select('*')
        .eq('id', partId)
        .single();

      if (!sparePart) {
        results.failed.push({ partId, error: 'Ricambio non trovato' });
        continue;
      }

      const result = await publishSparePartToMarketplace(orgId, sparePart, options);
      
      if (result.success) {
        results.success.push({ partId, listing: result.listing });
      } else {
        results.failed.push({ partId, error: result.error });
      }
    } catch (err) {
      results.failed.push({ partId, error: err.message });
    }
  }

  return results;
}
