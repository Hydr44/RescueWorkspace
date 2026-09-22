const http = require('http');
const https = require('https');
const { URL } = require('url');
require('dotenv').config({ path: '/root/.env' });
const { handleExchange } = require('./exchange-handler');
const { handleVerify, handleRefresh } = require('./auth-handlers');
const { handleOperatorList } = require('./operator-handler');
const { handleCreateFirst } = require('./operator-create-handler');
const { handleOperatorLogin } = require('./operator-login-handler');
const { handleDriverProvision } = require('./driver-provision-handler');

// --- Integrazione Redis ---
const redis = require('rescuemanager-shared/redis-client');


const PORT = 3005;
const VERCEL_URL = 'https://rescuemanager.eu';

// CORS allowlist (sostituisce wildcard '*')
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

function isOriginAllowed(origin) {
  if (!origin) return true; // server-to-server / Electron packaged (no Origin header)
  if (ALLOWED_ORIGINS.has(origin)) return true;
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return true;
  if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return true;
  if (origin.startsWith('app://')) return true;
  return false;
}

function applyCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (isOriginAllowed(origin)) {
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return true;
  }
  return false;
}

// Funzione per generare HTML redirect
function generateHtmlRedirect(redirectUrl) {
  const escapedUrl = redirectUrl
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
  
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0;url=${escapedUrl}">
  <title>Reindirizzamento OAuth...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      backdrop-filter: blur(10px);
    }
    .spinner {
      border: 3px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top: 3px solid white;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    a {
      color: white;
      text-decoration: underline;
    }
  </style>
  <script>
    (function() {
      console.log('[OAuth Redirect] Page loaded');
      console.log('[OAuth Redirect] Target URL:', ${JSON.stringify(redirectUrl)});
      try {
        window.location.href = ${JSON.stringify(redirectUrl)};
        console.log('[OAuth Redirect] window.location.href set');
      } catch (e) {
        console.error('[OAuth Redirect] Error setting href:', e);
      }
      setTimeout(function() {
        try {
          window.location.replace(${JSON.stringify(redirectUrl)});
          console.log('[OAuth Redirect] window.location.replace called');
        } catch (e) {
          console.error('[OAuth Redirect] Error with replace:', e);
        }
      }, 50);
    })();
  </script>
</head>
<body>
  <div class="container">
    <h2>Reindirizzamento in corso...</h2>
    <div class="spinner"></div>
    <p>Se non vieni reindirizzato automaticamente, <a href="${escapedUrl}">clicca qui</a>.</p>
  </div>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] Request: ${req.method} ${req.url}`);
  
  // CORS allowlist (sostituisce wildcard '*')
  const corsOk = applyCorsHeaders(req, res);
  if (!corsOk) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'CORS denied' }));
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Health check endpoint (per UptimeRobot / monitoring)
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'oauth-proxy-server',
      port: PORT,
      uptime_sec: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Gestisci endpoint OAuth desktop
  if (req.url && req.url.startsWith('/api/auth/oauth/desktop')) {
    try {
      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const appId = urlObj.searchParams.get('app_id');
      const redirectUri = urlObj.searchParams.get('redirect_uri');
      const state = urlObj.searchParams.get('state');
      
      if (!appId || !redirectUri || !state) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing required parameters' }));
        return;
      }
      
      if (appId !== 'desktop_app') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid app_id' }));
        return;
      }
      
      if (!redirectUri.startsWith('desktop://') && !redirectUri.startsWith('http://localhost:') && !redirectUri.startsWith('http://127.0.0.1:')) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid redirect_uri' }));
        return;
      }
      
      const stateCode = `state_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const oauthParams = {
        app_id: appId,
        redirect_uri: redirectUri,
        state: state,
        state_code: stateCode,
        expires_at: Date.now() + 10 * 60 * 1000
      };
      
      const encodedParams = Buffer.from(JSON.stringify(oauthParams)).toString('base64');
      
      // --- Redis Session Opzionale ---
      redis.safeSet(`oauth:state:${stateCode}`, JSON.stringify(oauthParams), { ex: 600 }).catch(re => console.warn("[Redis] Errore cache state", re.message));
      // --- Fine Redis ---

      const loginUrl = `${VERCEL_URL}/auth/oauth/desktop?params=${encodedParams}`;
      
      const html = generateHtmlRedirect(loginUrl);
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(html);
      
    } catch (error) {
      console.error('Error processing OAuth request:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }
  
  // Gestisci endpoint exchange
  if (req.url && req.url.startsWith('/api/auth/oauth/exchange')) {
    handleExchange(req, res);
    return;
  }
  
  // Gestisci endpoint verify
  if (req.url && req.url.startsWith('/api/auth/verify')) {
    handleVerify(req, res);
    return;
  }
  
  // Gestisci endpoint refresh
  if (req.url && req.url.startsWith('/api/auth/refresh')) {
    handleRefresh(req, res);
    return;
  }
  // Gestisci endpoint operator list
  if (req.url && req.url.startsWith("/api/auth/operator/list")) {
    handleOperatorList(req, res);
    return;
  }

  // Gestisci endpoint create first operator
  if (req.url && req.url.startsWith("/api/auth/operator/create-first")) {
    handleCreateFirst(req, res);
    return;
  }

  // Gestisci endpoint operator login
  if (req.url && req.url.startsWith("/api/auth/operator/login")) {
    handleOperatorLogin(req, res);
    return;
  }

  if (req.url && req.url.startsWith("/api/auth/driver/provision")) {
    handleDriverProvision(req, res);
    return;
  }

  // FIX: rimosso fallback proxy generico (dead code rotto: 'url' non definito).
  // Nessuna route ha fatto match -> 404 esplicito.
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`OAuth Proxy Server listening on http://127.0.0.1:${PORT}`);
});
