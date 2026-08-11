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
const { execFile } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const { listServices, tailLogs, restart, stop, start } = require('./lib/pm2');
const { audit, recentAudit } = require('./lib/audit');
const { resources, backups } = require('./lib/system');
const r2 = require('./lib/r2');
const restore = require('./lib/restore');
const DESCRIPTIONS = require('./descriptions');

const RESTORE_ALLOW_PROD = process.env.RESTORE_ALLOW_PROD === 'true';

const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

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

// ── Backup per-cliente (R2): elenco, download firmato, esegui ora ──
const ORG_RE = /^[a-f0-9-]{36}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const FILE_RE = /^[\w.-]+$/;

app.get('/api/backups/clients', async (_req, res) => {
  if (!r2.configured()) return res.json({ ok: true, clients: [], lastRun: null, totalBytes: 0, note: 'R2 non configurato' });
  try {
    const objs = await r2.listAll('backups/');
    const byOrg = new Map();
    for (const o of objs) {
      const m = o.key.match(/^backups\/([^/]+)\/(\d{4}-\d{2}-\d{2})\/(.+)$/);
      if (!m) continue;
      const [, org, date, file] = m;
      if (!byOrg.has(org)) byOrg.set(org, new Map());
      const dates = byOrg.get(org);
      if (!dates.has(date)) dates.set(date, { date, files: 0, bytes: 0, hasZip: false });
      const d = dates.get(date);
      d.files += 1; d.bytes += o.size; if (file === 'backup.zip') d.hasZip = true;
    }
    const orgIds = [...byOrg.keys()];
    let nameMap = new Map();
    if (supabase && orgIds.length) {
      const { data: orgs } = await supabase.from('orgs').select('id, name').in('id', orgIds);
      nameMap = new Map((orgs || []).map((o) => [o.id, o.name]));
    }
    const clients = orgIds.map((org) => {
      const dates = [...byOrg.get(org).values()].sort((a, b) => b.date.localeCompare(a.date));
      return { org_id: org, name: nameMap.get(org) || org, dates, last: dates[0] || null, totalBytes: dates.reduce((n, d) => n + d.bytes, 0) };
    }).sort((a, b) => String(b.last && b.last.date).localeCompare(String(a.last && a.last.date)));
    const lastRun = clients.reduce((mx, c) => (c.last && c.last.date > mx ? c.last.date : mx), '');
    res.json({ ok: true, clients, lastRun: lastRun || null, totalBytes: clients.reduce((n, c) => n + c.totalBytes, 0) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/api/backups/download', async (req, res) => {
  if (!r2.configured()) return res.status(503).json({ ok: false, error: 'R2 non configurato' });
  const org = String(req.query.org || '');
  const date = String(req.query.date || '');
  const file = String(req.query.file || 'backup.zip');
  if (!ORG_RE.test(org) || !DATE_RE.test(date) || !FILE_RE.test(file)) {
    return res.status(400).json({ ok: false, error: 'parametri non validi' });
  }
  try {
    const url = await r2.presign(`backups/${org}/${date}/${file}`, 120);
    res.json({ ok: true, url, expiresIn: 120 });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/backups/run', (req, res) => {
  const actor = actorOf(req);
  try {
    const child = execFile('node', ['server.js'], {
      cwd: '/opt/client-backup',
      env: { ...process.env, RUN_ONCE: 'true' },
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    audit({ actor, action: 'backup_run', target: 'client-backup', ok: true, detail: 'manuale', ip: ipOf(req) });
    res.json({ ok: true, started: true });
  } catch (e) {
    audit({ actor, action: 'backup_run', target: 'client-backup', ok: false, detail: e.message, ip: ipOf(req) });
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ── Ripristino da backup: analisi (read-only) e apply (transazionale) ──
function restoreParams(req, res) {
  const org = String((req.body && req.body.org) || '');
  const date = String((req.body && req.body.date) || '');
  const mode = String((req.body && req.body.mode) || 'merge');
  const tables = Array.isArray(req.body && req.body.tables) ? req.body.tables : null;
  if (!ORG_RE.test(org) || !DATE_RE.test(date)) { res.status(400).json({ ok: false, error: 'parametri non validi' }); return null; }
  if (!['merge', 'mirror'].includes(mode)) { res.status(400).json({ ok: false, error: 'modalità non valida' }); return null; }
  if (!r2.configured() || !supabase) { res.status(503).json({ ok: false, error: 'R2/DB non configurato' }); return null; }
  return { org, date, mode, tables };
}

app.post('/api/backups/restore/analyze', async (req, res) => {
  const p = restoreParams(req, res); if (!p) return;
  try {
    const result = await restore.analyze({ supabase, r2, ...p });
    res.json({ ok: true, ...result });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/backups/restore/apply', async (req, res) => {
  const p = restoreParams(req, res); if (!p) return;
  const planHash = String((req.body && req.body.planHash) || '');
  const actor = actorOf(req);
  const ip = ipOf(req);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  try {
    const result = await restore.apply({ supabase, r2, ...p, planHash, allowProd: RESTORE_ALLOW_PROD, stamp });
    await audit({ actor, action: `restore_${p.mode}`, target: `${p.org}@${p.date}`, ok: true, detail: JSON.stringify(result.totals).slice(0, 300), ip });
    res.json({ ok: true, ...result });
  } catch (e) {
    if (e.code === 'prod_locked') { await audit({ actor, action: `restore_${p.mode}`, target: `${p.org}@${p.date}`, ok: false, detail: 'prod_locked', ip }); return res.status(403).json({ ok: false, error: e.message, code: e.code }); }
    if (e.code === 'plan_stale') return res.status(409).json({ ok: false, error: e.message, code: e.code });
    await audit({ actor, action: `restore_${p.mode}`, target: `${p.org}@${p.date}`, ok: false, detail: e.message, ip });
    res.status(500).json({ ok: false, error: e.message });
  }
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
