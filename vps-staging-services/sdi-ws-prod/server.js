'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./lib/sdi-config');
const storage = require('./lib/storage');
const soapRx = require('./lib/soap-rx');
const { getSupabase } = require('./lib/supabase');
const requireNotDemo = require('./lib/require-not-demo')(getSupabase);

const PORT = Number.parseInt(process.env.PORT || '3007', 10);
const HOST = process.env.HOST || '127.0.0.1';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(morgan('combined'));

// ── CORS allowlist (security audit) ──
// Prima il server NON aveva CORS. Whitelist: prod, staging, assist, desktop
// Electron (app://, file://, localhost/127.0.0.1). Le richieste server-to-server
// del desktop Node (no browser context) non mandano Origin → passano.
const ALLOWED_ORIGINS = new Set([
  'https://rescuemanager.eu',
  'https://www.rescuemanager.eu',
  'https://assist.rescuemanager.eu',
  'https://staging.rescuemanager.eu',
  'app://rse',
  'app://./',
  'app://.',
  'app://-',
]);
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.has(origin)) return cb(null, true);
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
    if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return cb(null, true);
    if (origin.startsWith('app://')) return cb(null, true);
    if (origin.startsWith('file://')) return cb(null, true);
    return cb(new Error('CORS denied'));
  },
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/api/status', require('./routes/status'));

// Body parser PRIMA del middleware demo-check e dell'auth (servono req.body)
app.use(express.json({ limit: '15mb' }));

// ── Auth middleware (security audit) ──
// Bearer JWT Supabase: la sessione del desktop Electron viene inoltrata via
// Authorization: Bearer <access_token>. Risolve org_id "trusted" da
// org_members e lo inietta in req.auth. Tutte le rotte /api/sdi/* tranne
// /health e /api/status devono usarlo.
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      return res.status(401).json({ ok: false, error: 'Non autorizzato' });
    }
    let supabase;
    try {
      supabase = getSupabase();
    } catch (e) {
      // Fail-closed: se Supabase non configurato, no auth possibile.
      return res.status(503).json({ ok: false, error: 'auth backend non disponibile' });
    }
    const { data: userData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !userData?.user) {
      return res.status(401).json({ ok: false, error: 'Sessione non valida' });
    }
    const userId = userData.user.id;
    const { data: memberships, error: memErr } = await supabase
      .from('org_members').select('org_id')
      .eq('user_id', userId);
    if (memErr) {
      console.error('[sdi-ws-server] memberships lookup error:', memErr.message);
      return res.status(503).json({ ok: false, error: 'errore lookup membership' });
    }
    const orgIds = (memberships || []).map(m => m.org_id).filter(Boolean);
    if (orgIds.length === 0) {
      return res.status(403).json({ ok: false, error: 'Nessuna organizzazione associata' });
    }
    req.auth = { userId, orgIds, primaryOrgId: orgIds[0] };
    next();
  } catch (err) {
    console.error('[sdi-ws-server] auth middleware error:', err.message);
    return res.status(500).json({ ok: false, error: 'Errore autenticazione' });
  }
}

// ── resolveOrgIdStrict ──
// IGNORA qualsiasi org_id passato dal client se non è tra le membership del
// chiamante. Sostituisce silent-fallback pattern per evitare cross-tenant leak.
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

// Iniettore: dopo requireAuth, calcola org_id strict e lo SOVRASCRIVE in
// req.body.org_id così le route sottostanti (tx-from-db, inbox, ecc.) usano
// SEMPRE il valore derivato dal JWT, mai quello del client. Log per audit.
function injectTrustedOrgId(req, res, next) {
  try {
    const orgId = resolveOrgIdStrict(req);
    if (!req.body || typeof req.body !== 'object') req.body = {};
    req.body.org_id = orgId;
    req.trustedOrgId = orgId;
    console.log(`[sdi-ws-server] audit user=${req.auth.userId} org=${orgId} ${req.method} ${req.originalUrl}`);
    next();
  } catch (e) {
    return res.status(e.status || 400).json({ ok: false, error: e.message });
  }
}

// Variante per route GET dove org_id può essere in query (es. inbox list)
function injectTrustedOrgIdQuery(req, res, next) {
  try {
    const orgId = resolveOrgIdStrict(req, 'query');
    if (!req.query) req.query = {};
    req.query.org_id = orgId;
    req.trustedOrgId = orgId;
    console.log(`[sdi-ws-server] audit user=${req.auth.userId} org=${orgId} ${req.method} ${req.originalUrl}`);
    next();
  } catch (e) {
    return res.status(e.status || 400).json({ ok: false, error: e.message });
  }
}

// Rate limiters per gli endpoint costosi (firma + invio SdI)
const signLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 req/min/IP per la firma automatica
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate limit superato (firma)' },
});
const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60, // 60 req/min/IP per send-from-db
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate limit superato (send)' },
});

// TX da DB: invoice_ids+org_id -> Supabase -> XML -> firma OpenAPI -> SdI -> update DB
// (sostituisce il vecchio /api/sdi-sftp/send del canale SFTP)
// BLOCCATA per org demo (defense-in-depth oltre al check client desktop).
// AUTH: bearer JWT + org_id derivato da membership (mai dal body).
app.use(
  '/api/sdi/send-from-db',
  sendLimiter,
  requireAuth,
  injectTrustedOrgId,
  requireNotDemo,
  require('./routes/tx-from-db')
);

// Inbox ricezione: fatture passive + notifiche (sostituisce polling file SFTP).
// AUTH: bearer JWT obbligatorio. La route legge/serve file che vanno scoped
// per org via .meta.json (vedi routes/inbox.js): req.trustedOrgId è
// disponibile per il filtro.
app.use(
  '/api/sdi/inbox',
  requireAuth,
  injectTrustedOrgIdQuery,
  require('./routes/inbox')
);

// TX automatico: XML non firmato -> firma OpenAPI CAdES -> invio SdI
app.use(
  '/api/sdi/tx-auto',
  signLimiter,
  requireAuth,
  injectTrustedOrgId,
  requireNotDemo,
  require('./routes/tx-auto')
);

// TX unificato (file gia' firmato): UNICO endpoint pubblico per la trasmissione
app.use(
  '/api/sdi/tx',
  requireAuth,
  injectTrustedOrgId,
  requireNotDemo,
  require('./routes/tx-unified')
);

// SOAP RX custom (sostituisce node-soap che crashava sul parsing WSDL/XSD).
// UNICO endpoint pubblico per la ricezione: POST /soap/sdi
// NB: /soap/sdi è protetto a livello nginx tramite mTLS (ssl_verify_client on
// con CA SdI). Non aggiungiamo bearer auth qui perché chi chiama è SdI, non
// il desktop.
soapRx.attach(app, PORT);

// GET / ridotto: prima esponeva la mappa completa degli endpoint pubblicamente.
app.get('/', (req, res) => {
  res.type('text/plain').send(`SDI Web Service Server env=${config.env}`);
});

app.use((err, req, res, next) => {
  console.error('[sdi-ws-server] error:', err);
  res.status(500).json({ error: 'internal', message: err.message });
});

storage.ensureDirs();
app.listen(PORT, HOST, () => {
  console.log(`[sdi-ws-server] listening on http://${HOST}:${PORT} env=${config.env}`);
  console.log(`[sdi-ws-server] public endpoints: POST /api/sdi/tx  +  POST /soap/sdi`);
});
