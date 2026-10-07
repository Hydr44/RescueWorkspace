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
/**
 * La pagina di passaggio fra l'app e l'accesso.
 *
 * NON DOVREBBE VEDERLA NESSUNO. La risposta e' un 302 vero, quindi il browser
 * salta diritto alla pagina d'accesso senza disegnare niente: era proprio quello
 * il difetto segnalato il 07/10/2026, una schermata che compare un istante fra il
 * tocco su «Accedi» e il modulo. La destinazione e' un normale indirizzo https su
 * Vercel — non uno schema dell'app — quindi il reindirizzamento del server basta
 * e il giro di JavaScript che c'era prima non serviva.
 *
 * Questo corpo resta come rete: i browser lo ignorano quando seguono il 302, e si
 * vede solo se qualcosa impedisce il salto. In quel caso deve essere RescueManager,
 * non una schermata qualunque.
 *
 * COSA C'ERA PRIMA, per non rifarlo: sfondo
 * `linear-gradient(135deg,#667eea,#764ba2)` — il viola sfumato gia' bocciato —
 * angoli a 10, vetro sfocato, e il titolo «Reindirizzamento OAuth...». Fuori dalla
 * grammatica del prodotto, che vuole spigoli vivi, un solo blu e nessun gradiente;
 * e «OAuth» e' una parola che a un autista non dice niente.
 */
function generateHtmlRedirect(redirectUrl) {
  const perHtml = String(redirectUrl)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RescueManager</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: #0A1119;
      color: #E2E8F0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 15px;
      line-height: 1.5;
    }
    .riquadro {
      width: 100%;
      max-width: 360px;
      background: #141C27;
      border: 1px solid #243044;
      padding: 28px 24px;
    }
    .marchio {
      font-size: 17px;
      font-weight: 800;
      letter-spacing: 0.02em;
      margin: 0 0 20px;
    }
    .marchio span { color: #005DFA; }
    h1 { font-size: 19px; line-height: 1.3; font-weight: 600; margin: 0 0 6px; }
    p { margin: 0; color: #94A3B8; font-size: 14px; }
    .tasto {
      display: block;
      margin-top: 20px;
      padding: 14px 16px;
      background: #005DFA;
      color: #fff;
      text-align: center;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
    }
  </style>
</head>
<body>
  <div class="riquadro">
    <p class="marchio">RESCUE<span>MANAGER</span></p>
    <h1>Ti porto alla pagina di accesso</h1>
    <p>Se non succede da solo, continua da qui.</p>
    <a class="tasto" href="${perHtml}">Continua</a>
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
      
      // OGNI APP E' LEGATA AL SUO SCHEMA DI RITORNO.
      //
      // Prima erano due controlli separati: `appId` doveva essere esattamente
      // `desktop_app`, e la lista dei ritorni ammessi era PIATTA — un solo
      // elenco per tutti. Aggiungendoci `rescuemanager://` per far entrare il
      // telefono, anche il desktop avrebbe potuto usarlo: un allargamento che
      // non serve a nessuno.
      //
      // Adesso ogni app dichiara chi e' e puo' tornare SOLO dove le spetta: il
      // telefono non puo' farsi consegnare un codice su un indirizzo del
      // desktop, e viceversa.
      //
      // `rescuemanager://` e' lo schema dell'app telefono
      // (RescueMobile/app.config.js). Il telefono non puo' ricevere il codice
      // su un server locale come fa Electron (`http://localhost:3001/...`):
      // sul telefono e' il sistema operativo a riconsegnarlo all'app.
      //
      // ATTENZIONE (corretto l'08/10/2026): questo giro NON ha il PKCE. Il
      // `flowType: 'pkce'` del client Supabase riguarda solo i flussi di
      // Supabase (signInWithOAuth, magic link), non questo scambio custom, che
      // chiede solo `{ code, app_id }` e `app_id` e' una costante pubblica. Su
      // iOS il ritorno passa dentro ASWebAuthenticationSession e un'altra app
      // non lo riceve; su Android qualunque app che dichiari `rescuemanager://`
      // potrebbe ricevere il redirect e scambiare il codice per prima. La
      // protezione vera e' un `code_verifier` generato dall'app e verificato
      // allo scambio (o il ritorno via App Links https): e' in lista, non c'e'.
      const RITORNI_AMMESSI = {
        desktop_app: ['desktop://', 'http://localhost:', 'http://127.0.0.1:'],
        mobile_app: ['rescuemanager://'],
      };

      const ammessi = RITORNI_AMMESSI[appId];
      if (!ammessi) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid app_id' }));
        return;
      }

      if (!ammessi.some((p) => redirectUri.startsWith(p))) {
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
        // 5 minuti, non 10: e' quanto dicono il disegno (08-errore-scaduto) e
        // l'app. Un collegamento ancora vivo qui mentre l'app ha gia' detto
        // «scaduto» confonde: la pagina si aprirebbe quando l'app ha gia'
        // rinunciato. Stessa cifra nella rotta del sito
        // (website/src/app/api/auth/oauth/desktop/route.ts).
        expires_at: Date.now() + 5 * 60 * 1000
      };
      
      const encodedParams = Buffer.from(JSON.stringify(oauthParams)).toString('base64');
      
      // --- Redis Session Opzionale ---
      // La copia vive quanto il collegamento: 300 secondi, gli stessi 5 minuti
      // di `expires_at` qui sopra. Oggi nessuno la rilegge, ma se restasse a
      // 10 minuti sarebbe un collegamento "vivo" lato server quando la pagina
      // lo ha gia' dichiarato scaduto.
      redis.safeSet(`oauth:state:${stateCode}`, JSON.stringify(oauthParams), { ex: 300 }).catch(re => console.warn("[Redis] Errore cache state", re.message));
      // --- Fine Redis ---

      // Dal 07/10/2026 la pagina di accesso e' `/accesso` (website/src/app/accesso):
      // una sola per sito, computer e telefono, che riconosce da sola da dove
      // arriva. `/auth/oauth/desktop` resta sul sito ma non e' piu' la
      // destinazione. `params` viaggia intatto, nella stessa query di prima.
      const loginUrl = `${VERCEL_URL}/accesso?params=${encodedParams}`;
      
      // 302, non 200+HTML: il browser salta diritto e la pagina non si disegna.
      // Il corpo resta come rete per il caso in cui il salto non avvenga.
      res.writeHead(302, {
        'Location': loginUrl,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(generateHtmlRedirect(loginUrl));
      
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
