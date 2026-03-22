/**
 * Sales Module API Client
 * Gestione preventivi, ordini, listini
 */

import { supabaseBrowser } from './supabase-browser';

// Helper per ottenere il client Supabase
const getSupabase = () => supabaseBrowser();

// ============================================================================
// PREVENTIVI (Quotes)
// ============================================================================

/**
 * Genera prossimo numero preventivo
 */
export async function getNextQuoteNumber(orgId) {
  const { data, error } = await getSupabase().rpc('next_quote_number', {
    p_org_id: orgId
  });
  
  if (error) throw error;
  return data;
}

/**
 * Lista preventivi
 */
export async function listQuotes(orgId, filters = {}) {
  let query = getSupabase()
    .from('sales_quotes')
    .select(`
      *,
      client:clients(id, nome, piva, email, phone),
      items:sales_quote_items(*)
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.client_id) {
    query = query.eq('client_id', filters.client_id);
  }
  
  if (filters.from_date) {
    query = query.gte('issue_date', filters.from_date);
  }
  
  if (filters.to_date) {
    query = query.lte('issue_date', filters.to_date);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}

/**
 * Dettaglio preventivo
 */
export async function getQuote(quoteId) {
  const { data, error } = await getSupabase()
    .from('sales_quotes')
    .select(`
      *,
      client:clients(*),
      items:sales_quote_items(*),
      converted_order:sales_orders(id, order_number, status)
    `)
    .eq('id', quoteId)
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Crea preventivo
 */
export async function createQuote(orgId, quoteData) {
  const { items, ...quote } = quoteData;
  
  // Genera numero preventivo
  const quoteNumber = await getNextQuoteNumber(orgId);
  
  // Inserisci preventivo
  const { data: newQuote, error: quoteError } = await getSupabase()
    .from('sales_quotes')
    .insert({
      ...quote,
      org_id: orgId,
      quote_number: quoteNumber,
      created_by: (await getSupabase().auth.getUser()).data.user?.id
    })
    .select()
    .single();
  
  if (quoteError) throw quoteError;
  
  // Inserisci righe
  if (items && items.length > 0) {
    const { error: itemsError } = await getSupabase()
      .from('sales_quote_items')
      .insert(
        items.map((item, idx) => ({
          ...item,
          quote_id: newQuote.id,
          sort_order: idx
        }))
      );
    
    if (itemsError) throw itemsError;
  }
  
  return newQuote;
}

/**
 * Aggiorna preventivo
 */
export async function updateQuote(quoteId, updates) {
  const { items, ...quoteUpdates } = updates;
  
  // Aggiorna preventivo
  const { data, error } = await getSupabase()
    .from('sales_quotes')
    .update(quoteUpdates)
    .eq('id', quoteId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Se ci sono righe, sostituiscile
  if (items) {
    // Elimina righe esistenti
    await getSupabase()
      .from('sales_quote_items')
      .delete()
      .eq('quote_id', quoteId);
    
    // Inserisci nuove righe
    if (items.length > 0) {
      await getSupabase()
        .from('sales_quote_items')
        .insert(
          items.map((item, idx) => ({
            ...item,
            quote_id: quoteId,
            sort_order: idx
          }))
        );
    }
  }
  
  return data;
}

/**
 * Elimina preventivo
 */
export async function deleteQuote(quoteId) {
  const { error } = await getSupabase()
    .from('sales_quotes')
    .delete()
    .eq('id', quoteId);
  
  if (error) throw error;
}

/**
 * Invia preventivo (cambia stato a sent)
 */
export async function sendQuote(quoteId) {
  const { data, error } = await getSupabase()
    .from('sales_quotes')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString()
    })
    .eq('id', quoteId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Accetta preventivo
 */
export async function acceptQuote(quoteId) {
  const { data, error } = await getSupabase()
    .from('sales_quotes')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString()
    })
    .eq('id', quoteId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================================================
// ORDINI (Orders)
// ============================================================================

/**
 * Genera prossimo numero ordine
 */
export async function getNextOrderNumber(orgId) {
  const { data, error } = await getSupabase().rpc('next_order_number', {
    p_org_id: orgId
  });
  
  if (error) throw error;
  return data;
}

/**
 * Lista ordini
 */
export async function listOrders(orgId, filters = {}) {
  let query = getSupabase()
    .from('sales_orders')
    .select(`
      *,
      client:clients(id, nome, piva, email, phone),
      items:sales_order_items(*),
      quote:sales_quotes(id, quote_number),
      invoice:invoices(id, number)
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.client_id) {
    query = query.eq('client_id', filters.client_id);
  }
  
  if (filters.from_date) {
    query = query.gte('order_date', filters.from_date);
  }
  
  if (filters.to_date) {
    query = query.lte('order_date', filters.to_date);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}

/**
 * Dettaglio ordine
 */
export async function getOrder(orderId) {
  const { data, error } = await getSupabase()
    .from('sales_orders')
    .select(`
      *,
      client:clients(*),
      items:sales_order_items(*),
      quote:sales_quotes(id, quote_number),
      invoice:invoices(id, number, total, sdi_status)
    `)
    .eq('id', orderId)
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Crea ordine
 */
export async function createOrder(orgId, orderData) {
  const { items, ...order } = orderData;
  
  // Genera numero ordine
  const orderNumber = await getNextOrderNumber(orgId);
  
  // Inserisci ordine
  const { data: newOrder, error: orderError } = await getSupabase()
    .from('sales_orders')
    .insert({
      ...order,
      org_id: orgId,
      order_number: orderNumber,
      created_by: (await getSupabase().auth.getUser()).data.user?.id
    })
    .select()
    .single();
  
  if (orderError) throw orderError;
  
  // Inserisci righe
  if (items && items.length > 0) {
    const { error: itemsError } = await getSupabase()
      .from('sales_order_items')
      .insert(
        items.map((item, idx) => ({
          ...item,
          order_id: newOrder.id,
          sort_order: idx
        }))
      );
    
    if (itemsError) throw itemsError;
  }
  
  return newOrder;
}

/**
 * Aggiorna ordine
 */
export async function updateOrder(orderId, updates) {
  const { items, ...orderUpdates } = updates;
  
  const { data, error } = await getSupabase()
    .from('sales_orders')
    .update(orderUpdates)
    .eq('id', orderId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Se ci sono righe, sostituiscile
  if (items) {
    await getSupabase()
      .from('sales_order_items')
      .delete()
      .eq('order_id', orderId);
    
    if (items.length > 0) {
      await getSupabase()
        .from('sales_order_items')
        .insert(
          items.map((item, idx) => ({
            ...item,
            order_id: orderId,
            sort_order: idx
          }))
        );
    }
  }
  
  return data;
}

/**
 * Elimina ordine
 */
export async function deleteOrder(orderId) {
  const { error } = await getSupabase()
    .from('sales_orders')
    .delete()
    .eq('id', orderId);
  
  if (error) throw error;
}

/**
 * Converti preventivo in ordine
 */
export async function convertQuoteToOrder(quoteId) {
  // Carica preventivo con righe
  const quote = await getQuote(quoteId);
  
  if (!quote) throw new Error('Preventivo non trovato');
  if (quote.status === 'converted') throw new Error('Preventivo già convertito');
  
  // Crea ordine da preventivo
  const orderData = {
    client_id: quote.client_id,
    quote_id: quote.id,
    subtotal: quote.subtotal,
    discount_amount: quote.discount_amount,
    tax_amount: quote.tax_amount,
    total: quote.total,
    notes: quote.notes,
    items: quote.items.map(item => ({
      item_type: item.item_type,
      item_id: item.item_id,
      description: item.description,
      sku: item.sku,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percent: item.discount_percent,
      tax_rate: item.tax_rate,
      line_total: item.line_total,
      notes: item.notes
    }))
  };
  
  const newOrder = await createOrder(quote.org_id, orderData);
  
  // Aggiorna preventivo con riferimento ordine
  await getSupabase()
    .from('sales_quotes')
    .update({
      converted_to_order_id: newOrder.id,
      converted_at: new Date().toISOString(),
      status: 'accepted'
    })
    .eq('id', quoteId);
  
  return newOrder;
}

/**
 * Cambia stato ordine
 */
export async function updateOrderStatus(orderId, newStatus) {
  const updates = { status: newStatus };
  
  if (newStatus === 'confirmed') {
    updates.confirmed_at = new Date().toISOString();
  } else if (newStatus === 'delivered') {
    updates.delivered_at = new Date().toISOString();
  } else if (newStatus === 'cancelled') {
    updates.cancelled_at = new Date().toISOString();
  }
  
  const { data, error } = await getSupabase()
    .from('sales_orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================================================
// LISTINI (Price Lists)
// ============================================================================

/**
 * Lista listini
 */
export async function listPriceLists(orgId) {
  const { data, error } = await getSupabase()
    .from('price_lists')
    .select('*')
    .eq('org_id', orgId)
    .order('is_default', { ascending: false })
    .order('name');
  
  if (error) throw error;
  return data;
}

/**
 * Ottieni prezzo da listino
 */
export async function getPrice(orgId, itemType, itemId, clientId = null, quantity = 1) {
  // TODO: Implementare logica complessa:
  // 1. Cerca listino specifico cliente
  // 2. Altrimenti usa listino default
  // 3. Cerca prezzo specifico prodotto
  // 4. Altrimenti calcola con markup
  
  // Per ora: listino base
  const { data: defaultList } = await getSupabase()
    .from('price_lists')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_default', true)
    .single();
  
  if (!defaultList) return null;
  
  // Cerca prezzo specifico
  const { data: priceItem } = await getSupabase()
    .from('price_list_items')
    .select('*')
    .eq('price_list_id', defaultList.id)
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .lte('min_quantity', quantity)
    .order('min_quantity', { ascending: false })
    .limit(1)
    .single();
  
  if (priceItem) return priceItem.unit_price;
  
  // Altrimenti calcola con markup su costo
  if (itemType === 'spare_part') {
    const { data: part } = await getSupabase()
      .from('spare_parts')
      .select('purchase_price')
      .eq('id', itemId)
      .single();
    
    if (part && part.purchase_price) {
      const markup = defaultList.markup_percent || 30;
      return part.purchase_price * (1 + markup / 100);
    }
  }
  
  return null;
}

/**
 * Calcola totali preventivo/ordine
 */
export function calculateTotals(items) {
  const subtotal = items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100);
    return sum + lineTotal;
  }, 0);
  
  const taxAmount = items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100);
    const lineTax = lineTotal * (item.tax_rate || 22) / 100;
    return sum + lineTax;
  }, 0);
  
  const total = subtotal + taxAmount;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax_amount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}

/**
 * Riserva stock per ordine
 */
export async function reserveStock(orderId) {
  const order = await getOrder(orderId);
  
  for (const item of order.items) {
    if (item.item_type === 'spare_part' && item.item_id) {
      // Aggiorna stato ricambio a "reserved"
      await getSupabase()
        .from('spare_parts')
        .update({ status: 'reserved' })
        .eq('id', item.item_id);
      
      // Marca riga come riservata
      await getSupabase()
        .from('sales_order_items')
        .update({ reserved: true })
        .eq('id', item.id);
    }
  }
}

/**
 * Scarica stock per ordine consegnato
 */
export async function fulfillStock(orderId) {
  const order = await getOrder(orderId);
  
  for (const item of order.items) {
    if (item.item_type === 'spare_part' && item.item_id) {
      // Aggiorna stato ricambio a "sold"
      await getSupabase()
        .from('spare_parts')
        .update({ status: 'sold' })
        .eq('id', item.item_id);
      
      // Marca riga come picked/packed
      await getSupabase()
        .from('sales_order_items')
        .update({ picked: true, packed: true })
        .eq('id', item.id);
    }
  }
}
