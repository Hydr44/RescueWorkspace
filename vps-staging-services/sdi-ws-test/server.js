'use strict';

const express = require('express');
const morgan = require('morgan');
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

// NB: CORS NON installato di proposito. Questo servizio e' server-to-server:
// il desktop Electron lo chiama dal main process (fetch nativo, niente browser),
// e SdI lo chiama via mTLS sul SOAP. Nessuna origin del browser deve mai
// raggiungerlo. Se in futuro servisse, aggiungere allowlist esplicita
// (mai cors() aperto).

app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Body parser PRIMA dei middleware auth (serve req.body per resolveOrgIdStrict).
app.use(express.json({ limit: '15mb' }));

/**
 * Middleware auth: estrae bearer JWT Supabase, lo verifica, e calcola
 * gli orgIds del chiamante via org_members. Setta req.auth =
 * { userId, orgIds: string[], primaryOrgId } per gli handler downstream.
 *
 * Pre-hardening il servizio era completamente aperto: chiunque conoscesse
 * l'URL :3007 poteva inviare/firmare fatture per qualsiasi org (la firma
 * Namirial ha un costo per chiamata, e l'invio SdI e' irrevocabile).
 *
 * /health e /soap/* sono pubblici by design:
 *   - /health: probe k8s/uptime, nessun dato sensibile
 *   - /soap/sdi: chiamato da SdI con mTLS (auth e' la client cert verificata
 *     da nginx con ssl_verify_client on)
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      return res.status(401).json({ error: 'unauthorized', message: 'Bearer token mancante' });
    }
    const supabase = getSupabase();
    const { data: userData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !userData?.user) {
      return res.status(401).json({ error: 'unauthorized', message: 'Sessione non valida' });
    }
    const userId = userData.user.id;
    const { data: memberships, error: memErr } = await supabase
      .from('org_members').select('org_id')
      .eq('user_id', userId);
    if (memErr) {
      console.error('[sdi-ws-server] org_members query error:', memErr.message);
      return res.status(500).json({ error: 'auth_lookup_failed' });
    }
    const orgIds = (memberships || []).map(m => m.org_id).filter(Boolean);
    if (orgIds.length === 0) {
      return res.status(403).json({ error: 'no_org', message: 'Nessuna organizzazione associata' });
    }
    req.auth = { userId, orgIds, primaryOrgId: orgIds[0] };
    next();
  } catch (err) {
    console.error('[sdi-ws-server] requireAuth error:', err.message);
    return res.status(500).json({ error: 'auth_error', message: err.message });
  }
}

/**
 * Risolve org_id dal contesto request (body, query) MA verifica sempre che
 * appartenga a req.auth.orgIds. Sostituisce qualsiasi org_id passato dal
 * client con quello derivato dal token (defense-in-depth contro IDOR).
 *
 *   - se il client passa un org_id: DEVE essere tra req.auth.orgIds, altrimenti 403
 *   - se assente e l'utente ha 1 org: default automatico
 *   - se assente e l'utente ha N org: 400 (client deve esplicitare)
 *
 * Riscrive req.body.org_id e req.query.org_id col valore validato cosi' che
 * le route esistenti (tx-from-db, tx-auto, tx-unified, inbox) continuino a
 * leggere org_id dalle solite sorgenti senza modifiche.
 */
function resolveOrgIdStrict(req, res, next) {
  try {
    const fromBody = req.body && (req.body.org_id || req.body.orgId);
    const fromQuery = req.query && (req.query.org_id || req.query.orgId);
    const candidate = fromBody || fromQuery || null;
    let orgId;
    if (candidate) {
      if (!req.auth.orgIds.includes(candidate)) {
        return res.status(403).json({ error: 'forbidden', message: 'org_id non autorizzato per questo utente' });
      }
      orgId = candidate;
    } else if (req.auth.orgIds.length === 1) {
      orgId = req.auth.orgIds[0];
    } else {
      return res.status(400).json({ error: 'org_id_required', message: 'Specificare org_id (utente in piu organizzazioni)' });
    }
    // Riscrivi sorgenti (route downstream leggono da li').
    if (req.body && typeof req.body === 'object') req.body.org_id = orgId;
    if (req.query && typeof req.query === 'object') req.query.org_id = orgId;
    req.auth.resolvedOrgId = orgId;
    next();
  } catch (err) {
    console.error('[sdi-ws-server] resolveOrgIdStrict error:', err.message);
    return res.status(500).json({ error: 'org_resolve_error' });
  }
}

/**
 * Audit log per ogni operazione TX/inbox: chi ha fatto cosa.
 * Importante perche' firma+invio costano soldi su Namirial e sono irrevocabili.
 * Loggiamo su stdout (PM2 raccoglie in /opt/sdi-ws-server/logs/*-out.log).
 */
function auditLog(req, res, next) {
  const userId = req.auth?.userId || '-';
  const orgId = req.auth?.resolvedOrgId || '-';
  console.log(`[sdi-audit] user=${userId} org=${orgId} method=${req.method} path=${req.originalUrl}`);
  next();
}

// Status: protetto da auth (in chiaro rivela versioni, config interno).
app.use('/api/status', requireAuth, require('./routes/status'));

// Tutti gli endpoint /api/sdi/* richiedono bearer JWT Supabase valido e
// resolveOrgIdStrict (org_id derivato dal token, mai dal client).

// TX da DB: invoice_ids+org_id -> Supabase -> XML -> firma OpenAPI -> SdI -> update DB
// (sostituisce il vecchio /api/sdi-sftp/send del canale SFTP)
// BLOCCATA per org demo (defense-in-depth oltre al check client desktop).
app.use('/api/sdi/send-from-db', requireAuth, resolveOrgIdStrict, auditLog, requireNotDemo, require('./routes/tx-from-db'));

// Inbox ricezione: fatture passive + notifiche (sostituisce polling file SFTP).
// org_id filter ora derivato dal token, non dal client (pre-hardening era
// query string trustless).
app.use('/api/sdi/inbox', requireAuth, resolveOrgIdStrict, auditLog, require('./routes/inbox'));

// TX automatico: XML non firmato -> firma OpenAPI CAdES -> invio SdI
app.use('/api/sdi/tx-auto', requireAuth, resolveOrgIdStrict, auditLog, requireNotDemo, require('./routes/tx-auto'));

// TX unificato (file gia' firmato): UNICO endpoint pubblico per la trasmissione
app.use('/api/sdi/tx', requireAuth, resolveOrgIdStrict, auditLog, requireNotDemo, require('./routes/tx-unified'));

// SOAP RX custom (sostituisce node-soap che crashava sul parsing WSDL/XSD).
// UNICO endpoint pubblico per la ricezione: POST /soap/sdi
soapRx.attach(app, PORT);

// Manifest endpoint /: pre-hardening esponeva tutto l'inventario API in chiaro,
// utile per debug ma anche per ricognizione di un attaccante. Ora:
//   - in production rispondiamo solo 'SDI WS' senza dettagli
//   - in dev/test l'inventario serve, ma richiediamo bearer auth
function manifestText() {
  return [
    'SDI Web Service Server',
    `env: ${config.env}`,
    '',
    'I 2 endpoint pubblici (1 per direzione):',
    '  POST /api/sdi/tx    -> trasmette al SdI (body: {tipo:"file"|"notifica",nomeFile,contenutoBase64})',
    '  POST /soap/sdi      <- ricezione da SdI (SOAP, routing automatico via SOAPAction)',
    '',
    'Endpoint interni (instradati automaticamente, NON registrare in accreditamento):',
    '  POST /soap/RicezioneFatture',
    '  POST /soap/TrasmissioneFatture',
    '  POST /api/sdi/tx/invia-file',
    '  POST /api/sdi/tx/invia-notifica',
    '',
    'Debug / metadati:',
    '  GET  /health',
    '  GET  /api/status',
    '  GET  /soap/RicezioneFatture?wsdl',
    '  GET  /soap/TrasmissioneFatture?wsdl'
  ].join('\n');
}

if (process.env.NODE_ENV === 'production' && config.env === 'prod') {
  // Production: niente info disclosure.
  app.get('/', (req, res) => res.type('text/plain').send('SDI WS'));
} else {
  // Test/staging: manifest visibile solo dietro bearer auth.
  app.get('/', requireAuth, (req, res) => res.type('text/plain').send(manifestText()));
}

app.use((err, req, res, next) => {
  console.error('[sdi-ws-server] error:', err);
  res.status(500).json({ error: 'internal', message: err.message });
});

storage.ensureDirs();
app.listen(PORT, HOST, () => {
  console.log(`[sdi-ws-server] listening on http://${HOST}:${PORT} env=${config.env}`);
  console.log(`[sdi-ws-server] public endpoints: POST /api/sdi/tx  +  POST /soap/sdi`);
});
