/**
 * RENTRI API Server
 * Server Express sulla VPS per tutte le API RENTRI
 * Porta: 3003
 */

require('dotenv').config({ path: '/root/.env', override: true });

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.RENTRI_API_PORT || 3003;

// Configurazione Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('[RENTRI-API] Errore: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY richiesti');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Make supabase available to routes
app.set('supabase', supabase);

// ---------------------------------------------------------------------------
// CORS allowlist (hardening 2026-06)
// Sostituisce `origin: '*'`. Riflette l'origin solo se in allowlist o se
// matcha pattern noti (localhost / 127.0.0.1 / app://). credentials:false
// perche' l'auth e' bearer header, non cookie.
// ---------------------------------------------------------------------------
const ALLOWED_ORIGINS = new Set([
  'https://rescuemanager.eu',
  'https://www.rescuemanager.eu',
  'https://assist.rescuemanager.eu',
  'https://staging.rescuemanager.eu',
  'app://rse',
  'app://./',
  'app://.',
  'app://-'
]);

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.has(origin)) return cb(null, true);
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
    if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return cb(null, true);
    if (origin.startsWith('app://')) return cb(null, true);
    return cb(new Error('CORS denied'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// requireAuth — bearer JWT via Supabase (hardening 2026-06)
// Verifica Authorization: Bearer <token> con supabase.auth.getUser().
// Inietta req.user = { id, email } per i log e controllo membership.
// ---------------------------------------------------------------------------
async function requireAuth(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const m = h.match(/^Bearer\s+(.+)$/i);
    if (!m) {
      return res.status(401).json({ error: 'missing_bearer_token' });
    }
    const token = m[1].trim();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data || !data.user) {
      return res.status(401).json({ error: 'invalid_token' });
    }
    req.user = { id: data.user.id, email: data.user.email };
    req.authToken = token;
    return next();
  } catch (e) {
    console.error('[RENTRI-API] requireAuth error:', e?.message || e);
    return res.status(401).json({ error: 'auth_failed' });
  }
}

// ---------------------------------------------------------------------------
// resolveOrgIdStrict — leggi org_id da body/query/header, verifica membership.
// Fallback NON consentito: org_id mancante -> 400, membership mancante -> 403.
// Sostituisce il fail-open di require-not-demo.
// ---------------------------------------------------------------------------
async function resolveOrgIdStrict(req, res, next) {
  try {
    const orgId =
      (req.body && (req.body.org_id || req.body.orgId)) ||
      (req.query && (req.query.org_id || req.query.orgId)) ||
      req.headers['x-org-id'] ||
      req.headers['x-organization-id'];

    if (!orgId) {
      return res.status(400).json({ error: 'missing_org_id' });
    }
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'missing_user' });
    }

    const { data, error } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('org_id', orgId)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) {
      console.error('[RENTRI-API] resolveOrgIdStrict db error:', error.message);
      return res.status(500).json({ error: 'membership_lookup_failed' });
    }
    if (!data) {
      return res.status(403).json({ error: 'not_a_member_of_org' });
    }

    req.orgId = orgId;
    req.orgRole = data.role;
    return next();
  } catch (e) {
    console.error('[RENTRI-API] resolveOrgIdStrict error:', e?.message || e);
    return res.status(500).json({ error: 'org_resolution_failed' });
  }
}

// Middleware: blocca org demo per tutte le route RENTRI che fanno azioni
// reali verso AdE (firma, registrazione, trasmissione). `status` resta
// libero per health check. Mag 2026 — defense-in-depth oltre al check
// client desktop (useDemo.js).
const requireNotDemo = require('./lib/require-not-demo')(() => app.get('supabase'));

// ---------------------------------------------------------------------------
// Routes pubbliche (no auth) — health/status + webhook esterno AdE.
// Il webhook RENTRI e' esterno (chiamato da AdE), non puo' avere bearer JWT.
// Deve essere protetto a livello applicativo da HMAC / IP allowlist
// nel router stesso. Lo montiamo PRIMA di requireAuth.
// ---------------------------------------------------------------------------

// Health check (no auth, no demo guard)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'rentri-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// ---------------------------------------------------------------------------
// notificheRouter contiene 4 rotte: POST /webhook (esterno AdE, no bearer),
// GET /lista, POST /elabora, GET /health (uso interno autenticato).
//
// AUTH BYPASS FIX (audit 2026-06-18): in passato il router veniva montato 2
// volte (su /webhook e su /notifiche) come STESSA istanza, quindi accedendo
// a /api/rentri/notifiche/webhook/lista si bypassava requireAuth.
//
// Soluzione: UN SOLO mount del router (sotto requireAuth) + esenzione esplicita
// del path esatto /api/rentri/notifiche/webhook nel middleware di auth.
// ---------------------------------------------------------------------------
const notificheRouter = require('./routes/notifiche');

// Lista di prefissi esenti da requireAuth (path esatti, no wildcard sub-route).
const AUTH_EXEMPT_PATHS = new Set([
  '/api/rentri/notifiche/webhook',
  '/api/rentri/status',
]);

function requireAuthExceptExempt(req, res, next) {
  if (AUTH_EXEMPT_PATHS.has(req.path)) return next();
  return requireAuth(req, res, next);
}

// Status pubblico (anche pre-auth) — mounted prima di app.use('/api', ...)
app.use('/api/rentri', require('./routes/status'));

// ---------------------------------------------------------------------------
// Da qui in poi: TUTTI gli /api/* richiedono bearer JWT, eccetto i path
// esenti in AUTH_EXEMPT_PATHS (webhook AdE).
// Hardening 2026-06: requireAuth + resolveOrgIdStrict prima di requireNotDemo.
// ---------------------------------------------------------------------------
app.use('/api', requireAuthExceptExempt);

// Da qui in avanti applichiamo org strict + guard demo (escluso webhook).
function resolveOrgIdStrictExceptExempt(req, res, next) {
  if (AUTH_EXEMPT_PATHS.has(req.path)) return next();
  return resolveOrgIdStrict(req, res, next);
}
function requireNotDemoExceptExempt(req, res, next) {
  if (AUTH_EXEMPT_PATHS.has(req.path)) return next();
  return requireNotDemo(req, res, next);
}
app.use('/api/rentri', resolveOrgIdStrictExceptExempt, requireNotDemoExceptExempt);
app.use('/api/rentri', require('./routes/codifiche'));
app.use('/api/rentri', require('./routes/formulari'));
app.use('/api/rentri', require('./routes/registri'));
app.use('/api/rentri', require('./routes/movimenti'));
app.use('/api/rentri', require('./routes/anagrafiche'));
app.use('/api/rentri', require('./routes/mud'));
app.use('/api/rentri', require('./routes/ai-validate'));
app.use('/api/rentri', require('./routes/limiti'));
app.use('/api/rentri', require('./routes/blocchi'));
app.use('/api/rentri', require('./routes/certificati'));
app.use('/api/rentri', require('./routes/xfir'));
// notificheRouter montato UNA SOLA volta su /api/rentri/notifiche.
// La rotta POST /webhook al suo interno e' esente da auth via AUTH_EXEMPT_PATHS
// (vedi requireAuthExceptExempt + resolveOrgIdStrictExceptExempt sopra).
app.use('/api/rentri/notifiche', notificheRouter);
app.use('/api/rentri/firma', requireNotDemo, require('./routes/firma'));
app.use('/api/rentri', require('./routes/trasmissioni'));

// Routes - Vision AI (require auth + org)
app.use('/api/vision', resolveOrgIdStrict, require('./routes/vision'));
app.use('/api/ai', resolveOrgIdStrict, require('./routes/ai-assist'));

// Routes - Monitoring e Maintenance (require auth; admin/internal)
app.use('/api/monitoring', require('./routes/monitoring'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/feature-flags', require('./routes/feature-flags'));
app.use('/api/version', require('./routes/version'));
// OEM Lookup - scraping server-side per ricambi auto (auth required)
app.use('/api/oem-lookup', require('./routes/oem-lookup'));

// Error handling
app.use((err, req, res, next) => {
  console.error('[RENTRI-API] ERROR:', err);
  // CORS denied -> 403
  if (err && /CORS denied/i.test(err.message || '')) {
    return res.status(403).json({ error: 'cors_denied' });
  }
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`[RENTRI-API] Server avviato sulla porta ${PORT}`);
  console.log(`[RENTRI-API] Health check: http://localhost:${PORT}/health`);
  console.log(`[RENTRI-API] Status API: http://localhost:${PORT}/api/rentri/status`);
  console.log(`[RENTRI-API] Routes disponibili:`);
  console.log(`  - /api/rentri/status`);
  console.log(`  - /api/rentri/codifiche`);
  console.log(`  - /api/rentri/formulari (FIR)`);
  console.log(`  - /api/rentri/registri`);
  console.log(`  - /api/rentri/movimenti`);
  console.log(`  - /api/rentri/siti`);
  console.log(`  - /api/rentri/mud`);
});
