// rvfu-handler.js — proxy token RVFU (ACI/MIT) per l'app desktop.
//
// Il client_secret OAuth vive SOLO qui (server), MAI nell'app distribuita.
// L'app invia solo `environment` (allowlist) + code/refresh_token: il server
// mappa environment→endpoint ACI e inietta il secret. Il client non sceglie
// l'URL upstream → niente SSRF / esfiltrazione del secret verso host arbitrari.
//
// 'formation' è sulla rete privata MIT, NON raggiungibile dal VPS: resta
// gestita in-app (main process della macchina dev in VPN). Qui solo production.

const https = require('https');

const ENVS = {
  production: {
    ssoBaseUrl: 'https://sso.ilportaledeltrasporto.it/sso',
    realmPath: '',
    clientId: process.env.RVFU_CLIENT_ID || 'AUTODEM.RESCUEMANAGER',
    clientSecret: process.env.RVFU_CLIENT_SECRET || '',
  },
};

const ALLOWED_REDIRECTS = new Set(['http://localhost/', 'https://localhost/']);

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(obj));
}

// POST all'access_token ACI col secret iniettato server-side.
function postToken(cfg, form) {
  return new Promise((resolve) => {
    const u = new URL(`${cfg.ssoBaseUrl}/oauth2${cfg.realmPath}/access_token`);
    const payload = new URLSearchParams(form).toString();
    const upReq = https.request({
      hostname: u.hostname,
      port: 443,
      path: u.pathname,
      method: 'POST',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (up) => {
      let data = '';
      up.on('data', (d) => { data += d; });
      up.on('end', () => resolve({ status: up.statusCode || 502, body: data }));
    });
    upReq.on('error', (e) => resolve({ status: 502, body: JSON.stringify({ error: 'upstream_error', message: e.message }) }));
    upReq.on('timeout', () => { upReq.destroy(); resolve({ status: 504, body: JSON.stringify({ error: 'upstream_timeout' }) }); });
    upReq.write(payload);
    upReq.end();
  });
}

function resolveCfg(environment) {
  // Solo 'production' è gestita lato VPS (vedi nota in testa al file).
  return environment === 'production' ? ENVS.production : null;
}

async function handleRvfuToken(req, res) {
  try {
    const { environment, code, redirectUri } = await readJsonBody(req);
    const cfg = resolveCfg(environment);
    if (!cfg) return sendJson(res, 400, { error: 'env_not_supported_here' });
    if (!code) return sendJson(res, 400, { error: 'missing_code' });
    const redirect = redirectUri || 'http://localhost/'; // manuale WS ACI 1.24 §5.3.3: HTTP
    if (!ALLOWED_REDIRECTS.has(redirect)) return sendJson(res, 400, { error: 'invalid_redirect_uri' });
    if (!cfg.clientSecret) return sendJson(res, 500, { error: 'server_secret_missing' });
    const r = await postToken(cfg, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirect,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
    });
    res.writeHead(r.status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(r.body);
  } catch (e) {
    sendJson(res, 500, { error: 'internal_error', message: e.message });
  }
}

async function handleRvfuRefresh(req, res) {
  try {
    const { environment, refreshToken } = await readJsonBody(req);
    const cfg = resolveCfg(environment);
    if (!cfg) return sendJson(res, 400, { error: 'env_not_supported_here' });
    if (!refreshToken) return sendJson(res, 400, { error: 'missing_refresh_token' });
    if (!cfg.clientSecret) return sendJson(res, 500, { error: 'server_secret_missing' });
    const r = await postToken(cfg, {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      scope: 'openid profile',
    });
    res.writeHead(r.status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(r.body);
  } catch (e) {
    sendJson(res, 500, { error: 'internal_error', message: e.message });
  }
}

module.exports = { handleRvfuToken, handleRvfuRefresh };
