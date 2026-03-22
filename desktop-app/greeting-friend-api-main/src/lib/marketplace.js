// src/lib/marketplace.js
// Gestione connessioni e pubblicazioni marketplace (eBay, Subito, Shopify)
import { supabaseBrowser } from '@/lib/supabase-browser';
const supabase = supabaseBrowser();

// ─── Piattaforme supportate ───
export const PLATFORMS = {
  ebay: {
    id: 'ebay',
    name: 'eBay',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    description: 'Pubblica ricambi su eBay Italia',
    fields: [
      { key: 'app_id', label: 'App ID (Client ID)', type: 'text', required: true },
      { key: 'cert_id', label: 'Cert ID (Client Secret)', type: 'password', required: true },
      { key: 'dev_id', label: 'Dev ID', type: 'text', required: true },
      { key: 'oauth_token', label: 'OAuth Token', type: 'password', required: false, hint: 'Generato automaticamente dopo il login' },
      { key: 'refresh_token', label: 'Refresh Token', type: 'password', required: false },
      { key: 'sandbox', label: 'Modalità Sandbox', type: 'checkbox', required: false },
    ],
    oauthUrl: 'https://auth.ebay.com/oauth2/authorize',
    apiBase: 'https://api.ebay.com',
    sandboxApiBase: 'https://api.sandbox.ebay.com',
  },
  subito: {
    id: 'subito',
    name: 'Subito.it',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    description: 'Esporta annunci per Subito.it (CSV/XML)',
    fields: [
      { key: 'account_email', label: 'Email Account Subito', type: 'email', required: true },
      { key: 'export_format', label: 'Formato Export', type: 'select', options: ['csv', 'xml'], required: true },
      { key: 'auto_region', label: 'Regione', type: 'text', required: false },
      { key: 'auto_city', label: 'Città', type: 'text', required: false },
    ],
    // Subito non ha API pubblica — usiamo export CSV/XML
    supportsDirectPublish: false,
  },
  shopify: {
    id: 'shopify',
    name: 'Shopify',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    description: 'Sincronizza con il negozio Shopify del cliente',
    fields: [
      { key: 'shop_domain', label: 'Dominio Negozio', type: 'text', required: true, placeholder: 'mionegozio.myshopify.com' },
    ],
    oauthUrl: null, // Costruito dinamicamente con shop_domain
    apiVersion: '2024-01',
  },
};

// ─── Connessioni ───

/**
 * Carica tutte le connessioni marketplace di un'org
 */
export async function getConnections(orgId) {
  const { data, error } = await supabase
    .from('marketplace_connections')
    .select('*')
    .eq('org_id', orgId)
    .order('platform');
  return { data: data || [], error };
}

/**
 * Carica una connessione specifica
 */
export async function getConnection(orgId, platform) {
  const { data, error } = await supabase
    .from('marketplace_connections')
    .select('*')
    .eq('org_id', orgId)
    .eq('platform', platform)
    .maybeSingle();
  return { data, error };
}

/**
 * Salva/aggiorna una connessione marketplace
 */
export async function saveConnection(orgId, platform, credentials, metadata = {}) {
  const { data, error } = await supabase
    .from('marketplace_connections')
    .upsert({
      org_id: orgId,
      platform,
      credentials,
      status: 'connected',
      last_auth_at: new Date().toISOString(),
      metadata,
    }, { onConflict: 'org_id,platform' })
    .select()
    .single();
  return { data, error };
}

/**
 * Disconnetti un marketplace
 */
export async function disconnectPlatform(orgId, platform) {
  const { error } = await supabase
    .from('marketplace_connections')
    .update({ status: 'disconnected', credentials: {} })
    .eq('org_id', orgId)
    .eq('platform', platform);
  return { error };
}

// ─── Listings ───

/**
 * Carica i listing di un ricambio su tutti i marketplace
 */
export async function getPartListings(partId) {
  const { data, error } = await supabase
    .from('marketplace_listings')
    .select('*, marketplaces(name, display_name)')
    .eq('part_id', partId);
  return { data: data || [], error };
}

/**
 * Pubblica un ricambio su un marketplace
 * @param {string} marketplaceId - ID del marketplace configurato
 * @param {string} partId - ID del ricambio
 * @param {object} payload - Dati specifici per il marketplace
 */
export async function publishListing(marketplaceId, partId, payload = {}) {
  const { data, error } = await supabase
    .from('marketplace_listings')
    .upsert({
      marketplace_id: marketplaceId,
      part_id: partId,
      status: 'PUBLISHED',
      payload,
      last_sync: new Date().toISOString(),
    }, { onConflict: 'marketplace_id,part_id' })
    .select()
    .single();
  return { data, error };
}

/**
 * Rimuovi un listing
 */
export async function removeListing(listingId) {
  const { error } = await supabase
    .from('marketplace_listings')
    .update({ status: 'DELETED' })
    .eq('id', listingId);
  return { error };
}

// ─── Export per Subito.it ───

/**
 * Genera CSV per Subito.it da un array di ricambi
 * @param {Array} parts - Array di ricambi con immagini
 * @param {object} config - { region, city }
 * @returns {string} CSV content
 */
export function generateSubitoCSV(parts, config = {}) {
  const headers = [
    'Titolo', 'Descrizione', 'Prezzo', 'Categoria', 'Condizione',
    'Regione', 'Città', 'Immagine1', 'Immagine2', 'Immagine3',
    'CodiceOEM', 'Marca', 'Modello', 'Anno',
  ];

  const rows = parts.map(part => [
    part.published_title || part.name,
    (part.published_description || part.description || '').replace(/"/g, '""'),
    part.price_sell || 0,
    'Ricambi Auto',
    part.condition === 'new' ? 'Nuovo' : 'Usato',
    config.region || '',
    config.city || '',
    part.images?.[0]?.url || '',
    part.images?.[1]?.url || '',
    part.images?.[2]?.url || '',
    part.oem_code || '',
    part.source_vehicle_make || '',
    part.source_vehicle_model || '',
    part.source_vehicle_year || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Scarica il CSV come file
 */
export function downloadCSV(csvContent, filename = 'subito_export.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
}

// ─── Helpers per costruire payload marketplace ───

/**
 * Costruisce il payload eBay da un ricambio
 */
export function buildEbayPayload(part, images = []) {
  return {
    title: (part.published_title || part.name || '').substring(0, 80),
    description: part.published_description || part.description || '',
    price: { value: String(part.price_sell || 0), currency: 'EUR' },
    condition: part.condition === 'new' ? 'NEW' : 'USED_EXCELLENT',
    categoryId: '6028', // eBay: Auto Parts & Accessories
    listingPolicies: {},
    images: images.map(img => img.url).filter(Boolean),
    itemSpecifics: [
      part.oem_code && { name: 'Numero di riferimento OE/OEM', value: part.oem_code },
      part.source_vehicle_make && { name: 'Marca veicolo', value: part.source_vehicle_make },
      part.source_vehicle_model && { name: 'Modello veicolo', value: part.source_vehicle_model },
      part.source_vehicle_year && { name: 'Anno veicolo', value: String(part.source_vehicle_year) },
      part.warranty_months > 0 && { name: 'Garanzia', value: `${part.warranty_months} mesi` },
    ].filter(Boolean),
    shippingOptions: part.free_shipping
      ? [{ shippingServiceCode: 'IT_Spedizione', freeShipping: true }]
      : part.shipping_cost
        ? [{ shippingServiceCode: 'IT_Spedizione', shippingCost: { value: String(part.shipping_cost), currency: 'EUR' } }]
        : [],
  };
}

/**
 * Costruisce il payload Shopify da un ricambio
 */
export function buildShopifyPayload(part, images = []) {
  return {
    product: {
      title: part.published_title || part.name || '',
      body_html: `<p>${part.published_description || part.description || ''}</p>`,
      vendor: part.tecdoc_supplier || part.source_vehicle_make || '',
      product_type: 'Ricambio Auto',
      tags: [
        part.source_vehicle_make,
        part.source_vehicle_model,
        part.oem_code,
        part.condition === 'new' ? 'Nuovo' : 'Usato',
      ].filter(Boolean).join(', '),
      variants: [{
        price: String(part.price_sell || 0),
        sku: part.internal_code || part.oem_code || '',
        inventory_quantity: part.quantity || 1,
        weight: part.shipping_weight_kg || part.weight_kg || 0,
        weight_unit: 'kg',
        requires_shipping: true,
      }],
      images: images.map(img => ({ src: img.url, alt: img.alt_text || part.name })),
    },
  };
}
