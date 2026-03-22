/**
 * Marketplace B2B - Vendita/Acquisto ricambi tra demolitori
 * Sistema interno per creare una rete di scambio ricambi
 */

import { supabaseBrowser } from './supabase-browser';

const getSupabase = () => supabaseBrowser();

// ============================================================================
// LISTINGS (Annunci)
// ============================================================================

/**
 * Lista annunci marketplace con filtri
 */
export async function listMarketplaceListings(filters = {}) {
  let query = getSupabase()
    .from('marketplace_listings')
    .select(`
      *,
      org:orgs(id, name, city, province),
      spare_part:spare_parts(id, name, sku, category)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (filters.search) {
    query = query.textSearch('search_vector', filters.search, {
      type: 'websearch',
      config: 'italian'
    });
  }

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  if (filters.vehicle_brand) {
    query = query.ilike('vehicle_brand', `%${filters.vehicle_brand}%`);
  }

  if (filters.vehicle_model) {
    query = query.ilike('vehicle_model', `%${filters.vehicle_model}%`);
  }

  if (filters.min_price) {
    query = query.gte('price', filters.min_price);
  }

  if (filters.max_price) {
    query = query.lte('price', filters.max_price);
  }

  if (filters.condition) {
    query = query.eq('condition', filters.condition);
  }

  if (filters.shipping_available !== undefined) {
    query = query.eq('shipping_available', filters.shipping_available);
  }

  if (filters.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }

  const { data, error } = await query;
  return { data: data || [], error };
}

/**
 * Ottieni dettaglio annuncio
 */
export async function getMarketplaceListing(listingId) {
  const { data, error } = await getSupabase()
    .from('marketplace_listings')
    .select(`
      *,
      org:orgs(id, name, city, province, phone, email),
      spare_part:spare_parts(id, name, sku, category, description),
      stats:marketplace_org_stats!org_id(average_rating, total_reviews, verified_seller)
    `)
    .eq('id', listingId)
    .single();

  return { data, error };
}

/**
 * Lista annunci della propria org
 */
export async function listMyListings(orgId, status = null) {
  let query = getSupabase()
    .from('marketplace_listings')
    .select('*, spare_parts!spare_part_id(id, name, internal_code, oem_code)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  return { data: data || [], error };
}

/**
 * Crea nuovo annuncio
 */
export async function createListing(orgId, listingData) {
  const payload = {
    org_id: orgId,
    spare_part_id: listingData.spare_part_id || null,
    title: listingData.title,
    description: listingData.description,
    category: listingData.category,
    vehicle_brand: listingData.vehicle_brand,
    vehicle_model: listingData.vehicle_model,
    vehicle_year: listingData.vehicle_year,
    vin: listingData.vin,
    condition: listingData.condition || 'usato',
    quality_grade: listingData.quality_grade,
    warranty_days: listingData.warranty_days || 0,
    price: listingData.price,
    quantity: listingData.quantity || 1,
    available_quantity: listingData.available_quantity || listingData.quantity || 1,
    images: listingData.images || [],
    shipping_available: listingData.shipping_available !== false,
    shipping_cost: listingData.shipping_cost || null,
    pickup_only: listingData.pickup_only || false,
    pickup_address: listingData.pickup_address,
    status: listingData.status || 'draft',
    visibility: listingData.visibility || 'public',
    tags: listingData.tags || [],
    expires_at: listingData.expires_at,
    created_by: listingData.created_by
  };

  const { data, error } = await getSupabase()
    .from('marketplace_listings')
    .insert(payload)
    .select()
    .single();

  return { data, error };
}

/**
 * Aggiorna annuncio
 */
export async function updateListing(listingId, updates) {
  const { data, error } = await getSupabase()
    .from('marketplace_listings')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', listingId)
    .select()
    .single();

  return { data, error };
}

/**
 * Pubblica annuncio (da draft ad active)
 */
export async function publishListing(listingId) {
  return updateListing(listingId, {
    status: 'active',
    published_at: new Date().toISOString()
  });
}

/**
 * Rimuovi annuncio
 */
export async function removeListing(listingId) {
  return updateListing(listingId, { status: 'removed' });
}

/**
 * Incrementa contatore visualizzazioni
 */
export async function incrementListingViews(listingId) {
  const { error } = await getSupabase()
    .rpc('increment_listing_views', { listing_id: listingId });
  return { error };
}

// ============================================================================
// OFFERS (Offerte)
// ============================================================================

/**
 * Lista offerte ricevute (per venditore)
 */
export async function listReceivedOffers(orgId, status = null) {
  let query = getSupabase()
    .from('marketplace_offers')
    .select(`
      *,
      listing:marketplace_listings(id, title, price, images),
      buyer_org:orgs!buyer_org_id(id, name, city, province)
    `)
    .eq('marketplace_listings.org_id', orgId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  return { data: data || [], error };
}

/**
 * Lista offerte inviate (per acquirente)
 */
export async function listSentOffers(orgId, status = null) {
  let query = getSupabase()
    .from('marketplace_offers')
    .select(`
      *,
      listing:marketplace_listings(id, title, price, images, org:orgs(name))
    `)
    .eq('buyer_org_id', orgId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  return { data: data || [], error };
}

/**
 * Ottieni dettaglio offerta
 */
export async function getOffer(offerId) {
  const { data, error } = await getSupabase()
    .from('marketplace_offers')
    .select(`
      *,
      listing:marketplace_listings(*),
      buyer_org:orgs!buyer_org_id(id, name, city, province, phone, email)
    `)
    .eq('id', offerId)
    .single();

  return { data, error };
}

/**
 * Crea nuova offerta
 */
export async function createOffer(buyerOrgId, offerData) {
  const payload = {
    listing_id: offerData.listing_id,
    buyer_org_id: buyerOrgId,
    buyer_user_id: offerData.buyer_user_id,
    quantity: offerData.quantity || 1,
    offered_price: offerData.offered_price,
    message: offerData.message,
    include_shipping: offerData.include_shipping !== false,
    pickup_preferred: offerData.pickup_preferred || false,
    payment_method: offerData.payment_method,
    expires_at: offerData.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };

  const { data, error } = await getSupabase()
    .from('marketplace_offers')
    .insert(payload)
    .select()
    .single();

  return { data, error };
}

/**
 * Accetta offerta
 */
export async function acceptOffer(offerId, sellerResponse = null) {
  const { data, error } = await getSupabase()
    .from('marketplace_offers')
    .update({
      status: 'accepted',
      seller_response: sellerResponse,
      accepted_at: new Date().toISOString()
    })
    .eq('id', offerId)
    .select()
    .single();

  return { data, error };
}

/**
 * Rifiuta offerta
 */
export async function rejectOffer(offerId, sellerResponse = null) {
  const { data, error } = await getSupabase()
    .from('marketplace_offers')
    .update({
      status: 'rejected',
      seller_response: sellerResponse,
      rejected_at: new Date().toISOString()
    })
    .eq('id', offerId)
    .select()
    .single();

  return { data, error };
}

/**
 * Controproposta
 */
export async function counterOffer(offerId, counterPrice, sellerResponse) {
  const { data, error } = await getSupabase()
    .from('marketplace_offers')
    .update({
      counter_offer_price: counterPrice,
      seller_response: sellerResponse,
      updated_at: new Date().toISOString()
    })
    .eq('id', offerId)
    .select()
    .single();

  return { data, error };
}

/**
 * Cancella offerta (solo acquirente)
 */
export async function cancelOffer(offerId) {
  const { data, error } = await getSupabase()
    .from('marketplace_offers')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', offerId)
    .select()
    .single();

  return { data, error };
}

// ============================================================================
// MESSAGES (Messaggistica)
// ============================================================================

/**
 * Lista conversazioni (threads)
 */
export async function listConversations(orgId) {
  const { data, error } = await getSupabase()
    .from('marketplace_messages')
    .select(`
      thread_id,
      listing:marketplace_listings(id, title),
      sender_org:orgs!sender_org_id(id, name),
      recipient_org:orgs!recipient_org_id(id, name),
      message,
      is_read,
      created_at
    `)
    .or(`sender_org_id.eq.${orgId},recipient_org_id.eq.${orgId}`)
    .is('parent_message_id', null)
    .order('created_at', { ascending: false });

  return { data: data || [], error };
}

/**
 * Lista messaggi di un thread
 */
export async function listThreadMessages(threadId) {
  const { data, error } = await getSupabase()
    .from('marketplace_messages')
    .select(`
      *,
      sender_org:orgs!sender_org_id(id, name),
      sender_user:auth.users!sender_user_id(id, email)
    `)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  return { data: data || [], error };
}

/**
 * Invia messaggio
 */
export async function sendMessage(senderOrgId, messageData) {
  const isFirstMessage = !messageData.thread_id;
  
  const payload = {
    listing_id: messageData.listing_id,
    offer_id: messageData.offer_id,
    sender_org_id: senderOrgId,
    sender_user_id: messageData.sender_user_id,
    recipient_org_id: messageData.recipient_org_id,
    message: messageData.message,
    attachments: messageData.attachments || [],
    thread_id: messageData.thread_id || null,
    parent_message_id: messageData.parent_message_id || null
  };

  const { data, error } = await getSupabase()
    .from('marketplace_messages')
    .insert(payload)
    .select()
    .single();

  if (data && isFirstMessage) {
    await getSupabase()
      .from('marketplace_messages')
      .update({ thread_id: data.id })
      .eq('id', data.id);
    data.thread_id = data.id;
  }

  return { data, error };
}

/**
 * Segna messaggi come letti
 */
export async function markMessagesAsRead(threadId, recipientOrgId) {
  const { error } = await getSupabase()
    .from('marketplace_messages')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('thread_id', threadId)
    .eq('recipient_org_id', recipientOrgId)
    .eq('is_read', false);

  return { error };
}

/**
 * Conta messaggi non letti
 */
export async function countUnreadMessages(orgId) {
  const { count, error } = await getSupabase()
    .from('marketplace_messages')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_org_id', orgId)
    .eq('is_read', false);

  return { count: count || 0, error };
}

// ============================================================================
// FAVORITES (Preferiti)
// ============================================================================

/**
 * Lista annunci preferiti
 */
export async function listFavorites(orgId) {
  const { data, error } = await getSupabase()
    .from('marketplace_favorites')
    .select(`
      *,
      listing:marketplace_listings(*, org:orgs(name))
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  return { data: data || [], error };
}

/**
 * Aggiungi ai preferiti
 */
export async function addFavorite(orgId, listingId, userId = null, notes = null) {
  const { data, error } = await getSupabase()
    .from('marketplace_favorites')
    .insert({
      org_id: orgId,
      user_id: userId,
      listing_id: listingId,
      notes
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Rimuovi dai preferiti
 */
export async function removeFavorite(orgId, listingId) {
  const { error } = await getSupabase()
    .from('marketplace_favorites')
    .delete()
    .eq('org_id', orgId)
    .eq('listing_id', listingId);

  return { error };
}

/**
 * Verifica se annuncio è nei preferiti
 */
export async function isFavorite(orgId, listingId) {
  const { data, error } = await getSupabase()
    .from('marketplace_favorites')
    .select('id')
    .eq('org_id', orgId)
    .eq('listing_id', listingId)
    .maybeSingle();

  return { isFavorite: !!data, error };
}

// ============================================================================
// REVIEWS (Recensioni)
// ============================================================================

/**
 * Lista recensioni di un'org
 */
export async function listOrgReviews(orgId) {
  const { data, error } = await getSupabase()
    .from('marketplace_reviews')
    .select(`
      *,
      reviewer_org:orgs!reviewer_org_id(id, name),
      listing:marketplace_listings(id, title)
    `)
    .eq('reviewed_org_id', orgId)
    .order('created_at', { ascending: false });

  return { data: data || [], error };
}

/**
 * Crea recensione
 */
export async function createReview(reviewerOrgId, reviewData) {
  const payload = {
    listing_id: reviewData.listing_id,
    offer_id: reviewData.offer_id,
    order_id: reviewData.order_id,
    reviewer_org_id: reviewerOrgId,
    reviewed_org_id: reviewData.reviewed_org_id,
    rating: reviewData.rating,
    review_text: reviewData.review_text,
    quality_rating: reviewData.quality_rating,
    communication_rating: reviewData.communication_rating,
    delivery_rating: reviewData.delivery_rating
  };

  const { data, error } = await getSupabase()
    .from('marketplace_reviews')
    .insert(payload)
    .select()
    .single();

  return { data, error };
}

/**
 * Rispondi a recensione
 */
export async function respondToReview(reviewId, response) {
  const { data, error } = await getSupabase()
    .from('marketplace_reviews')
    .update({
      response,
      response_at: new Date().toISOString()
    })
    .eq('id', reviewId)
    .select()
    .single();

  return { data, error };
}

// ============================================================================
// ORG STATS (Statistiche Reputazione)
// ============================================================================

/**
 * Ottieni statistiche org
 */
export async function getOrgStats(orgId) {
  const { data, error } = await getSupabase()
    .from('marketplace_org_stats')
    .select('*')
    .eq('org_id', orgId)
    .maybeSingle();

  return { data, error };
}

/**
 * Lista top venditori
 */
export async function listTopSellers(limit = 10) {
  const { data, error } = await getSupabase()
    .from('marketplace_org_stats')
    .select(`
      *,
      org:orgs(id, name, city, province)
    `)
    .gte('average_rating', 4.0)
    .gte('total_reviews', 5)
    .order('average_rating', { ascending: false })
    .order('sold_items_count', { ascending: false })
    .limit(limit);

  return { data: data || [], error };
}

// ============================================================================
// UTILITY
// ============================================================================

/**
 * Categorie ricambi disponibili
 */
export const SPARE_PART_CATEGORIES = [
  'Motore',
  'Trasmissione',
  'Sospensioni',
  'Freni',
  'Elettronica',
  'Carrozzeria',
  'Interni',
  'Illuminazione',
  'Climatizzazione',
  'Scarico',
  'Altro'
];

/**
 * Condizioni ricambi
 */
export const CONDITIONS = [
  { value: 'nuovo', label: 'Nuovo' },
  { value: 'usato', label: 'Usato' },
  { value: 'ricondizionato', label: 'Ricondizionato' },
  { value: 'per_ricambi', label: 'Per Ricambi' }
];

/**
 * Gradi qualità
 */
export const QUALITY_GRADES = [
  { value: 'A', label: 'A - Ottimo', color: 'text-green-400' },
  { value: 'B', label: 'B - Buono', color: 'text-yellow-400' },
  { value: 'C', label: 'C - Discreto', color: 'text-orange-400' }
];
