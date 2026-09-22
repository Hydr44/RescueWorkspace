const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3400;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Switch sandbox <-> production via env (default: production).
// Le credenziali corrispondenti devono essere caricate dal .env.
const EBAY_ENV = (process.env.EBAY_ENVIRONMENT || 'production').toLowerCase();
const IS_SANDBOX = EBAY_ENV === 'sandbox';

const EBAY_OAUTH_URL = IS_SANDBOX
  ? 'https://auth.sandbox.ebay.com/oauth2/authorize'
  : 'https://auth.ebay.com/oauth2/authorize';
const EBAY_TOKEN_URL = IS_SANDBOX
  ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
  : 'https://api.ebay.com/identity/v1/oauth2/token';
const EBAY_API_BASE = IS_SANDBOX ? 'https://api.sandbox.ebay.com' : 'https://api.ebay.com';
const EBAY_IDENTITY_BASE = IS_SANDBOX ? 'https://apiz.sandbox.ebay.com' : 'https://apiz.ebay.com';

const REDIRECT_URI = process.env.EBAY_REDIRECT_URI || 'https://api.rescuemanager.eu/api/ebay/auth/callback';
const CLIENT_ID = process.env.EBAY_CLIENT_ID;
const CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET;

const pendingStates = new Map();

// CORS allowlist (restringe vs cors() aperto)
const ALLOWED_ORIGINS = new Set([
  'https://rescuemanager.eu',
  'https://www.rescuemanager.eu',
  'https://assist.rescuemanager.eu',
  'https://staging.rescuemanager.eu',
  'app://rse', 'app://./', 'app://.', 'app://-',
]);
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // server-to-server, eBay callback, curl
    if (ALLOWED_ORIGINS.has(origin)) return cb(null, true);
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
    if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return cb(null, true);
    if (origin.startsWith('app://')) return cb(null, true);
    return cb(new Error('Origin not allowed by CORS'));
  },
  credentials: false,
}));
app.use(express.json());

// Auth middleware: verifica Supabase JWT e carica orgIds da org_members.
// Applicato SOLO agli endpoint chiamati dal client desktop (publish/refresh/disconnect),
// non a /api/ebay/auth/* (callback OAuth) né /api/ebay/account-deletion (webhook eBay).
async function requireAuth(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const m = /^Bearer\s+(.+)$/i.exec(h);
    if (!m) return res.status(401).json({ error: 'Missing bearer token' });
    const token = m[1].trim();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    const userId = userData.user.id;
    const { data: memberships, error: memErr } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', userId);
    if (memErr) {
      console.error('[ebay-oauth] org_members lookup error:', memErr);
      return res.status(500).json({ error: 'Auth lookup failed' });
    }
    const orgIds = (memberships || []).map(m => m.org_id);
    if (!orgIds.length) {
      return res.status(403).json({ error: 'No organization membership' });
    }
    req.auth = { userId, orgIds, roles: memberships };
    next();
  } catch (err) {
    console.error('[ebay-oauth] requireAuth error:', err);
    res.status(500).json({ error: 'Auth internal error' });
  }
}

// ── Cross-org-strict helper ──
// Risolve org_id da body/query in modo SICURO:
//   - se il client passa un org_id, DEVE essere tra req.auth.orgIds → altrimenti 403
//   - se assente: default a req.auth.orgIds[0] SOLO se l'utente ha 1 org → altrimenti 400
// Sostituisce il pattern silent-fallback "(candidate && orgIds.includes(candidate)) ? candidate : orgIds[0]"
// che causava cross-org data corruption per utenti multi-org.
function resolveOrgIdStrict(req, source) {
  const src = source === 'query' ? (req.query || {}) : (req.body || {});
  const candidate = src.org_id || src.orgId;
  if (candidate) {
    if (!req.auth || !Array.isArray(req.auth.orgIds) || !req.auth.orgIds.includes(candidate)) {
      const err = new Error('org_id non autorizzato per questo utente');
      err.status = 403;
      throw err;
    }
    return candidate;
  }
  if (req.auth && Array.isArray(req.auth.orgIds) && req.auth.orgIds.length === 1) {
    return req.auth.orgIds[0];
  }
  const err = new Error("org_id richiesto (utente in più organizzazioni)");
  err.status = 400;
  throw err;
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ebay-oauth', timestamp: new Date().toISOString() });
});

app.get('/api/ebay/auth/start', (req, res) => {
  const { org_id } = req.query;
  
  if (!org_id) {
    return res.status(400).send('Missing org_id parameter');
  }

  const state = crypto.randomBytes(32).toString('hex');
  pendingStates.set(state, { org_id, timestamp: Date.now() });

  setTimeout(() => pendingStates.delete(state), 10 * 60 * 1000);

  // Scope minimi per RescueManager — pubblicazione, ordini, identificazione utente
  // (l'identità serve al matching del Marketplace Account Deletion e per personalizzare la UI).
  const scopes = [
    'https://api.ebay.com/oauth/api_scope',
    'https://api.ebay.com/oauth/api_scope/sell.inventory',
    'https://api.ebay.com/oauth/api_scope/sell.marketing',
    'https://api.ebay.com/oauth/api_scope/sell.account',
    'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
    'https://api.ebay.com/oauth/api_scope/commerce.identity.readonly'
  ].join(' ');

  const authUrl = `${EBAY_OAUTH_URL}?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}&state=${state}`;

  res.redirect(authUrl);
});

app.get('/api/ebay/auth/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    console.error('eBay OAuth error:', error, error_description);
    return res.send(`
      <html>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h1 style="color: #dc2626;">❌ Connessione eBay fallita</h1>
          <p style="color: #6b7280;">${error_description || error}</p>
          <p style="margin-top: 20px;">Puoi chiudere questa finestra e riprovare.</p>
        </body>
      </html>
    `);
  }

  if (!code || !state) {
    return res.status(400).send('Missing code or state');
  }

  const stateData = pendingStates.get(state);
  if (!stateData) {
    return res.status(400).send('Invalid or expired state');
  }

  pendingStates.delete(state);
  const { org_id } = stateData;

  try {
    const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    
    const tokenResponse = await axios.post(
      EBAY_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authHeader}`
        }
      }
    );

    const { access_token, refresh_token, expires_in, token_type } = tokenResponse.data;

    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Fetch identità eBay (username + userId) — utile per matching Account Deletion
    let ebay_user_id = null;
    let ebay_username = null;
    try {
      const idRes = await axios.get(
        `${EBAY_IDENTITY_BASE}/commerce/identity/v1/user/`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      ebay_user_id = idRes.data?.userId || null;
      ebay_username = idRes.data?.username || null;
    } catch (e) {
      console.warn('[ebay-oauth] identity fetch failed:', e.response?.data || e.message);
    }

    const { error: dbError } = await supabase
      .from('marketplace_connections')
      .upsert({
        org_id,
        platform: 'ebay',
        credentials: {
          access_token,
          refresh_token,
          token_type,
          expires_at: expiresAt,
          environment: EBAY_ENV,
          marketplace: 'EBAY_IT',
          ebay_user_id,
          username: ebay_username,
        },
        status: 'connected',
        last_auth_at: new Date().toISOString(),
        last_sync_at: new Date().toISOString()
      }, {
        onConflict: 'org_id,platform'
      });

    if (dbError) {
      console.error('DB error:', dbError);
      throw dbError;
    }

    res.send(`
      <html>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h1 style="color: #10b981;">✅ Account eBay collegato con successo!</h1>
          <p style="color: #6b7280; margin-top: 20px;">Puoi chiudere questa finestra e tornare a RescueManager.</p>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `);

  } catch (err) {
    console.error('Token exchange error:', err.response?.data || err.message);
    res.send(`
      <html>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h1 style="color: #dc2626;">❌ Errore durante il collegamento</h1>
          <p style="color: #6b7280;">${err.message}</p>
          <p style="margin-top: 20px;">Puoi chiudere questa finestra e riprovare.</p>
        </body>
      </html>
    `);
  }
});

app.post('/api/ebay/refresh-token', requireAuth, async (req, res) => {
  let org_id;
  try { org_id = resolveOrgIdStrict(req); }
  catch (e) { return res.status(e.status || 400).json({ error: e.message }); }

  try {
    const { data: connection, error: fetchError } = await supabase
      .from('marketplace_connections')
      .select('credentials')
      .eq('org_id', org_id)
      .eq('platform', 'ebay')
      .single();

    if (fetchError || !connection) {
      return res.status(404).json({ error: 'eBay connection not found' });
    }

    const { refresh_token } = connection.credentials;

    const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    
    const tokenResponse = await axios.post(
      EBAY_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authHeader}`
        }
      }
    );

    const { access_token, expires_in } = tokenResponse.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    const updatedCredentials = {
      ...connection.credentials,
      access_token,
      expires_at: expiresAt
    };

    const { error: updateError } = await supabase
      .from('marketplace_connections')
      .update({
        credentials: updatedCredentials,
        last_sync: new Date().toISOString()
      })
      .eq('org_id', org_id)
      .eq('platform', 'ebay');

    if (updateError) throw updateError;

    res.json({ success: true, access_token, expires_at: expiresAt });

  } catch (err) {
    console.error('Refresh token error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUBBLICAZIONE eBay ───
// Pubblica un ricambio su eBay usando Inventory API (Sell API)
app.post('/api/ebay/publish', requireAuth, async (req, res) => {
  const { spare_part } = req.body || {};
  let org_id;
  try { org_id = resolveOrgIdStrict(req); }
  catch (e) { return res.status(e.status || 400).json({ error: e.message }); }

  if (!spare_part) {
    return res.status(400).json({ error: 'Missing spare_part' });
  }

  try {
    // 1. Recupera token eBay
    const { data: connection, error: fetchError } = await supabase
      .from('marketplace_connections')
      .select('credentials')
      .eq('org_id', org_id)
      .eq('platform', 'ebay')
      .single();

    if (fetchError || !connection) {
      return res.status(404).json({ error: 'eBay connection not found. Connect eBay first in Settings.' });
    }

    let { access_token, refresh_token, expires_at } = connection.credentials;

    // 2. Refresh token se scaduto
    if (expires_at && new Date(expires_at) < new Date()) {
      console.log('[eBay Publish] Token scaduto, refresh in corso...');
      const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
      const tokenResponse = await axios.post(
        EBAY_TOKEN_URL,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refresh_token
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${authHeader}`
          }
        }
      );
      access_token = tokenResponse.data.access_token;
      const newExpiresAt = new Date(Date.now() + tokenResponse.data.expires_in * 1000).toISOString();

      await supabase
        .from('marketplace_connections')
        .update({
          credentials: { ...connection.credentials, access_token, expires_at: newExpiresAt },
          last_sync_at: new Date().toISOString()
        })
        .eq('org_id', org_id)
        .eq('platform', 'ebay');
    }

    const isSandbox = connection.credentials.environment === 'sandbox';
    const apiBase = isSandbox ? 'https://api.sandbox.ebay.com' : 'https://api.ebay.com';

    // 3. Crea/aggiorna Inventory Item
    const sku = spare_part.internal_code || spare_part.oem_code || spare_part.id;
    const condition = spare_part.condition === 'new' ? 'NEW' : 
                      spare_part.condition === 'refurbished' ? 'SELLER_REFURBISHED' : 'USED_EXCELLENT';

    const inventoryItem = {
      condition: condition,
      product: {
        title: (spare_part.name || '').substring(0, 80),
        description: spare_part.description || spare_part.name || '',
        aspects: {}
      },
      locale: 'it_IT',
      availability: {
        shipToLocationAvailability: {
          quantity: spare_part.quantity || 1
        }
      }
    };

    // Aggiungi immagini se disponibili
    if (spare_part.images && spare_part.images.length > 0) {
      inventoryItem.product.imageUrls = spare_part.images.filter(Boolean).slice(0, 12);
    }

    // Aggiungi aspetti base (eBay assegnerà categoria automaticamente)
    if (spare_part.brand) {
      inventoryItem.product.aspects['Brand'] = [spare_part.brand];
    }
    if (spare_part.oem_code) {
      inventoryItem.product.aspects['Manufacturer Part Number'] = [spare_part.oem_code];
    }

    console.log(`[eBay Publish] Creating inventory item SKU: ${sku}`);
    
    const inventoryRes = await axios.put(
      `${apiBase}/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`,
      inventoryItem,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
          'Content-Language': 'it-IT'
        }
      }
    );

    console.log(`[eBay Publish] Inventory item created/updated: ${inventoryRes.status}`);

    // 4. Crea/aggiorna Inventory Location (necessario per Item.Country)
    const locationKey = 'default_location';
    try {
      await axios.post(
        `${apiBase}/sell/inventory/v1/location/${locationKey}`,
        {
          location: {
            address: {
              addressLine1: spare_part.address || 'Via Roma 1',
              city: spare_part.city || 'Roma',
              stateOrProvince: spare_part.province || 'RM',
              postalCode: spare_part.postal_code || '00100',
              country: 'IT'
            }
          },
          name: 'Magazzino Ricambi',
          merchantLocationStatus: 'ENABLED',
          locationTypes: ['WAREHOUSE']
        },
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
            'Content-Language': 'it-IT'
          }
        }
      );
      console.log(`[eBay Publish] Location created: ${locationKey}`);
    } catch (locErr) {
      // 400 con 25803 = already exists, 204/409 = ok
      const locErrId = locErr.response?.data?.errors?.[0]?.errorId;
      if (locErrId === 25803 || locErr.response?.status === 409 || locErr.response?.status === 204) {
        console.log(`[eBay Publish] Location already exists: ${locationKey}`);
      } else {
        console.warn('[eBay Publish] Location error:', JSON.stringify(locErr.response?.data || locErr.message));
      }
    }

    // 5. Crea Offer
    const offer = {
      sku: sku,
      marketplaceId: 'EBAY_IT',
      format: 'FIXED_PRICE',
      listingDescription: spare_part.description || spare_part.name || '',
      availableQuantity: spare_part.quantity || 1,
      pricingSummary: {
        price: {
          value: String(spare_part.price_sell || spare_part.price || 0),
          currency: 'EUR'
        }
      },
      merchantLocationKey: locationKey,
    };

    let offerId;
    
    // Elimina vecchie offer per questo SKU (potrebbero avere categoria sbagliata)
    try {
      const existingOffers = await axios.get(
        `${apiBase}/sell/inventory/v1/offer?sku=${encodeURIComponent(sku)}`,
        { headers: { 'Authorization': `Bearer ${access_token}` } }
      );
      const existing = existingOffers.data.offers?.[0];
      if (existing) {
        console.log(`[eBay Publish] Deleting old offer ${existing.offerId}...`);
        await axios.delete(
          `${apiBase}/sell/inventory/v1/offer/${existing.offerId}`,
          { headers: { 'Authorization': `Bearer ${access_token}` } }
        );
        console.log(`[eBay Publish] Old offer deleted`);
      }
    } catch (delErr) {
      console.log(`[eBay Publish] No old offer to delete`);
    }
    
    // Crea nuova offer con categoria corretta
    const offerRes = await axios.post(
      `${apiBase}/sell/inventory/v1/offer`,
      offer,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
          'Content-Language': 'it-IT'
        }
      }
    );
    offerId = offerRes.data.offerId;
    console.log(`[eBay Publish] New offer created: ${offerId}`);

    // 5. Pubblica Offer
    const publishRes = await axios.post(
      `${apiBase}/sell/inventory/v1/offer/${offerId}/publish`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const listingId = publishRes.data.listingId;
    console.log(`[eBay Publish] ✅ Published! Listing ID: ${listingId}`);

    // 6. Salva listing ID nel DB
    await supabase
      .from('marketplace_listings')
      .upsert({
        org_id,
        spare_part_id: spare_part.id,
        title: spare_part.name,
        price: spare_part.price_sell || spare_part.price || 0,
        quantity: spare_part.quantity || 1,
        status: 'active',
        images: spare_part.images || [],
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    res.json({
      success: true,
      listingId,
      offerId,
      sku,
      ebayUrl: isSandbox
        ? `https://www.sandbox.ebay.it/itm/${listingId}`
        : `https://www.ebay.it/itm/${listingId}`
    });

  } catch (err) {
    console.error('[eBay Publish] Error:', err.response?.data || err.message);
    const ebayErrors = err.response?.data?.errors;
    res.status(500).json({
      error: 'eBay publish failed',
      details: ebayErrors || err.message
    });
  }
});

// ─── Marketplace Account Deletion (eBay GDPR compliance) ───
//
// eBay richiede che ogni applicazione fornisca un endpoint per ricevere notifiche
// quando un utente eBay cancella il proprio account. Setup:
//
// 1) Verifica iniziale (GET):
//    eBay invia GET ?challenge_code=XXX → calcola SHA-256 di
//    (challenge_code + verification_token + endpoint_url) e ritorna
//    { challengeResponse: "<hash hex lowercase>" } con Content-Type application/json.
//
// 2) Notifica deletion (POST):
//    eBay invia un body JSON con metadata + notification.data.userId / username.
//    Dobbiamo rispondere con HTTP 200 in <3 secondi. Nel body è incluso anche un
//    `notification.notificationId` univoco — utile per deduplica.
//
// Docs: https://developer.ebay.com/marketplace-account-deletion
const ACCOUNT_DELETION_TOKEN = process.env.EBAY_ACCOUNT_DELETION_TOKEN || '';
const ACCOUNT_DELETION_ENDPOINT = process.env.EBAY_ACCOUNT_DELETION_ENDPOINT
  || 'https://api.rescuemanager.eu/api/ebay/account-deletion';

app.get('/api/ebay/account-deletion', (req, res) => {
  const challengeCode = req.query.challenge_code;
  if (!challengeCode) {
    return res.status(400).json({ error: 'Missing challenge_code' });
  }
  if (!ACCOUNT_DELETION_TOKEN) {
    console.error('[ebay-deletion] EBAY_ACCOUNT_DELETION_TOKEN not configured');
    return res.status(500).json({ error: 'Verification token not configured' });
  }
  const hash = crypto.createHash('sha256');
  hash.update(challengeCode);
  hash.update(ACCOUNT_DELETION_TOKEN);
  hash.update(ACCOUNT_DELETION_ENDPOINT);
  const challengeResponse = hash.digest('hex');
  res.set('Content-Type', 'application/json');
  res.json({ challengeResponse });
});

app.post('/api/ebay/account-deletion', async (req, res) => {
  // Rispondi SUBITO 200 — eBay ha timeout di 3 secondi.
  res.sendStatus(200);

  try {
    const body = req.body || {};
    const notification = body.notification || {};
    const data = notification.data || {};
    const userId = data.userId || null;
    const username = data.username || null;
    const eiasToken = data.eiasToken || null;
    const notificationId = notification.notificationId || null;
    const eventDate = notification.eventDate || null;

    console.log('[ebay-deletion] Received account deletion notification', {
      notificationId, userId, username, eventDate,
    });

    // Trova le connessioni Supabase legate a questo userId eBay e segnale come deletion-required.
    // (lo username eBay viene salvato nelle credentials al momento del primo OAuth se disponibile —
    // ad oggi salviamo solo access_token/refresh_token, quindi facciamo best-effort)
    if (userId) {
      try {
        const { data: matches, error } = await supabase
          .from('marketplace_connections')
          .select('id, org_id, credentials')
          .eq('platform', 'ebay');
        if (!error && matches?.length) {
          const ids = matches
            .filter(c => {
              const cred = c.credentials || {};
              return cred.ebay_user_id === userId || cred.username === username;
            })
            .map(c => c.id);
          if (ids.length) {
            await supabase
              .from('marketplace_connections')
              .update({
                status: 'deletion_required',
                credentials: {},
                last_sync_at: new Date().toISOString(),
              })
              .in('id', ids);
            console.log(`[ebay-deletion] Marked ${ids.length} connection(s) for deletion`);
          }
        }
      } catch (e) {
        console.error('[ebay-deletion] DB cleanup error:', e.message);
      }
    }

    // Audit log persistente (opzionale — crea la tabella se non esiste)
    try {
      await supabase.from('ebay_account_deletions').insert({
        notification_id: notificationId,
        ebay_user_id: userId,
        username,
        eias_token: eiasToken,
        event_date: eventDate,
        raw_payload: body,
      });
    } catch (e) {
      // Tabella opzionale — log e basta
      if (!String(e.message || '').includes('does not exist')) {
        console.warn('[ebay-deletion] audit log error:', e.message);
      }
    }
  } catch (err) {
    console.error('[ebay-deletion] handler error:', err.message);
  }
});

app.post('/api/ebay/disconnect', requireAuth, async (req, res) => {
  let org_id;
  try { org_id = resolveOrgIdStrict(req); }
  catch (e) { return res.status(e.status || 400).json({ error: e.message }); }

  try {
    const { error } = await supabase
      .from('marketplace_connections')
      .delete()
      .eq('org_id', org_id)
      .eq('platform', 'ebay');

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error('Disconnect error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ eBay OAuth server running on port ${PORT}`);
  console.log(`📍 Redirect URI: ${REDIRECT_URI}`);
  console.log(`🔑 Client ID: ${CLIENT_ID?.substring(0, 20)}...`);
});
