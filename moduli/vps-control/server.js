/**
 * RescueManager — VPS Control API
 *
 * Espone all'admin panel: stato servizi pm2, log, restart/stop/start, risorse,
 * backup. Progettata per stare dietro nginx (control.rescuemanager.eu) e in
 * ascolto SOLO su localhost. Protetta da bearer token (VPS_CONTROL_TOKEN).
 *
 * Sicurezza:
 *  - token confrontato in tempo costante; /health è l'unica rotta libera;
 *  - execFile su pm2 senza shell + nomi servizio validati vs lista reale;
 *  - non agisce mai su sé stessa (vps-control);
 *  - 'stop' richiede conferma esplicita (body.confirm === true);
 *  - ogni azione mutante è tracciata in vps_control_audit (attore + ip).
 *
 * Config da /root/.env: VPS_CONTROL_TOKEN, (VPS_CONTROL_PORT/HOST), SUPABASE_*.
 */
require('dotenv').config({ path: process.env.ENV_FILE || '/root/.env' });

const express = require('express');
const crypto = require('crypto');
const { listServices, tailLogs, restart, stop, start } = require('./lib/pm2');
const { audit, recentAudit } = require('./lib/audit');
const { resources, backups } = require('./lib/system');
const DESCRIPTIONS = require('./descriptions');

const PORT = Number(process.env.VPS_CONTROL_PORT) || 3910;
const HOST = process.env.VPS_CONTROL_HOST || '127.0.0.1';
const TOKEN = process.env.VPS_CONTROL_TOKEN || '';
const SELF = 'vps-control';
const NAME_RE = /^[a-zA-Z0-9_.-]+$/;

if (!TOKEN || TOKEN.length < 32) {
  console.error('[VPSCTL] VPS_CONTROL_TOKEN mancante o < 32 char. Esco.');
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: '64kb' }));

app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Actor');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

app.get('/health', (_req, res) => res.json({ ok: true, service: 'vps-control' }));

// Auth su tutto tranne /health
app.use((req, res, next) => {
  const h = req.headers.authorization || '';
  const tok = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!tok || !safeEqual(tok, TOKEN)) return res.status(401).json({ ok: false, error: 'unauthorized' });
  next();
});

const actorOf = (req) => String(req.headers['x-actor'] || (req.body && req.body.actor) || 'sconosciuto').slice(0, 120);
const ipOf = (req) => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '';

app.get('/api/services', async (_req, res) => {
  try { res.json({ ok: true, services: await listServices(DESCRIPTIONS) }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/api/resources', async (_req, res) => {
  try { res.json({ ok: true, resources: await resources() }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/api/backups', async (_req, res) => {
  try { res.json({ ok: true, backups: await backups() }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/api/audit', async (req, res) => {
  try { res.json({ ok: true, audit: await recentAudit(Math.min(200, Number(req.query.limit) || 50)) }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/api/services/:name/logs', async (req, res) => {
  const name = req.params.name;
  if (!NAME_RE.test(name)) return res.status(400).json({ ok: false, error: 'nome non valido' });
  try {
    const known = await listServices();
    if (!known.some((s) => s.name === name)) return res.status(404).json({ ok: false, error: 'servizio sconosciuto' });
    const lines = Math.min(500, Math.max(10, Number(req.query.lines) || 150));
    res.json({ ok: true, name, lines: await tailLogs(name, lines) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

async function doAction(req, res, action, fn) {
  const name = req.params.name;
  if (!NAME_RE.test(name)) return res.status(400).json({ ok: false, error: 'nome non valido' });
  if (name === SELF) return res.status(403).json({ ok: false, error: 'Non posso agire su me stesso (vps-control).' });
  const actor = actorOf(req);
  const ip = ipOf(req);
  try {
    const known = await listServices();
    if (!known.some((s) => s.name === name)) return res.status(404).json({ ok: false, error: 'servizio sconosciuto' });
    if (action === 'stop' && !(req.body && req.body.confirm === true)) {
      return res.status(428).json({ ok: false, needConfirm: true, error: 'Conferma esplicita richiesta per fermare un servizio.' });
    }
    const out = await fn(name);
    await audit({ actor, action, target: name, ok: true, detail: String(out || '').slice(0, 400), ip });
    res.json({ ok: true, action, name });
  } catch (e) {
    await audit({ actor, action, target: name, ok: false, detail: e.message, ip });
    res.status(500).json({ ok: false, error: e.message });
  }
}

app.post('/api/services/:name/restart', (req, res) => doAction(req, res, 'restart', restart));
app.post('/api/services/:name/stop', (req, res) => doAction(req, res, 'stop', stop));
app.post('/api/services/:name/start', (req, res) => doAction(req, res, 'start', start));

app.listen(PORT, HOST, () => console.log(`[VPSCTL] in ascolto su ${HOST}:${PORT}`));
