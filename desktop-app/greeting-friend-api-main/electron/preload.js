// electron/preload.js

const { contextBridge, ipcRenderer, shell, clipboard } = require('electron');

/* ------------------------ Helpers base ------------------------ */
// IPC invoker with consistent signature
const ch = (name) => (...args) => ipcRenderer.invoke(name, ...args);

// Deep-freeze to avoid runtime tampering from renderer
const deepFreeze = (obj) => {
  try { Object.freeze(obj); } catch { }
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v && typeof v === 'object' && !Object.isFrozen(v)) deepFreeze(v);
  }
  return obj;
};

/* ------------------------ API IPC esposte --------------------- */
const api = {
  transports: { list: ch('transports:list'), create: ch('transports:create'), update: ch('transports:update'), remove: ch('transports:remove') },
  clients: { list: ch('clients:list'), create: ch('clients:create'), update: ch('clients:update'), remove: ch('clients:remove') },
  autisti: { list: ch('autisti:list'), create: ch('autisti:create'), update: ch('autisti:update'), remove: ch('autisti:remove') },
  vehicles: { list: ch('vehicles:list'), create: ch('vehicles:create'), update: ch('vehicles:update'), remove: ch('vehicles:remove') },
  yard: { list: ch('yard:list'), create: ch('yard:create'), update: ch('yard:update'), remove: ch('yard:remove') },
  events: { list: ch('events:list'), create: ch('events:create'), update: ch('events:update'), remove: ch('events:remove') },
  quotes: { list: ch('quotes:list'), create: ch('quotes:create'), update: ch('quotes:update'), remove: ch('quotes:remove') },
  notifications: { list: ch('notifications:list'), create: ch('notifications:create'), update: ch('notifications:update'), remove: ch('notifications:remove'), getEmailPrefs: ch('notifications:get-email-prefs'), saveEmailPrefs: ch('notifications:save-email-prefs'), getSmtp: ch('notifications:get-smtp'), saveSmtp: ch('notifications:save-smtp'), testSmtp: ch('notifications:test-smtp'), checkNow: ch('notifications:check-now'), emailLog: ch('notifications:email-log') },
  users: { list: ch('users:list'), create: ch('users:create'), update: ch('users:update'), remove: ch('users:remove') },
  log: { add: ch('log:add'), list: ch('log:list') },
  reports: { summary: ch('reports:summary'), exportTransports: ch('reports:export:transports') },
  print: { quotePdf: ch('print:quote-pdf') },

  assistance: {
    create: ch('assistance:create'),
    list: ch('assistance:list'),
    getByToken: ch('assistance:getByToken'),
    updateLocation: ch('assistance:updateLocation'),
    close: ch('assistance:close'),
  },

  admin: {
    // ponte sicuro per creare account dall'app desktop (evita CORS)
    createUser: ch('admin:createUser'),
  },

  // Utility lato renderer (no IPC necessario)
  shellOpenExternal: (url) => { try { if (url) shell.openExternal(String(url)); } catch { } },
  clipboard: { writeText: async (text) => { try { clipboard.writeText(String(text ?? '')); return true; } catch { return false; } } },

  // OAuth callback handler
  onOAuthCallback: (callback) => {
    console.log('[Preload] === OAUTH CALLBACK REGISTRATION ===');
    ipcRenderer.on('oauth-callback', (event, url) => {
      console.log('[Preload] === OAUTH CALLBACK RECEIVED ===');
      console.log('[Preload] URL received:', url);
      console.log('[Preload] Calling callback function...');
      try {
        callback(url);
        console.log('[Preload] Callback function executed successfully');
      } catch (err) {
        console.error('[Preload] Error in callback function:', err);
      }
    });
  },

  // Window management
  window: {
    resizeAfterLogin: () => ipcRenderer.invoke('window:resize-after-login'),
    resizeForLogin: () => ipcRenderer.invoke('window:resize-for-login'),
  },

  // OAuth server management
  oauth: {
    startServer: () => ipcRenderer.invoke('oauth:start-server'),
    stopServer: () => ipcRenderer.invoke('oauth:stop-server'),
    getCallbackUrl: () => ipcRenderer.invoke('oauth:get-callback-url'),
    openLoginWindow: (url) => ipcRenderer.invoke('oauth:open-login-window', url),
  },

  // Spare Parts OEM Lookup (via main process - no CORS)
  spareParts: {
    oemLookup: (oemCode) => ipcRenderer.invoke('spare-parts:oem-lookup', oemCode),
  },

  // RVFU OAuth authorization window
  rvfu: {
    openAuthWindow: (params) => ipcRenderer.invoke('rvfu:open-auth-window', params),
    // API call via BrowserWindow persistente (per cookie di sessione) - VECCHIO APPROCCIO
    apiCall: (params) => ipcRenderer.invoke('rvfu:api-call', params),
    // ✅ NUOVO: API call via net.request direttamente dal processo main (più robusto)
    apiCallDirect: (params) => ipcRenderer.invoke('rvfu:api-call-direct', params),
    // Inizializza finestra API persistente (chiamata dopo login)
    initApiWindow: () => ipcRenderer.invoke('rvfu:init-api-window'),
    // Chiude finestra API persistente (chiamata al logout)
    closeApiWindow: () => ipcRenderer.invoke('rvfu:close-api-window'),
    // Apre finestra CDSSO per completamento manuale
    openCdssoWindow: (params) => ipcRenderer.invoke('rvfu:open-cdsso-window', params),
    // ✅ Token exchange nel main process (ha VPN, il renderer non può raggiungere SSO)
    exchangeToken: (params) => ipcRenderer.invoke('rvfu:exchange-token', params),
  },
};

/* ------------------ Config per chiamate HTTP admin ------------- */
/**
 * Imposta qui l’origine dell’API “web” (Next.js).
 * Priorità:
 *  - variabili d’ambiente (consigliato in produzione)
 *  - valore di default (tuo VPS)
 *
 * Esempio avvio dev:
 *   API_ORIGIN=https://rescuemanager.eu ADMIN_API_SECRET=3490791892 VITE_DEV_SERVER_URL=http://localhost:5173 npm run dev
 */
const API_ORIGIN_RAW =
  process.env.API_ORIGIN ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://rescuemanager.eu';

// normalizza: toString + rimuove slash finale
const API_ORIGIN = String(API_ORIGIN_RAW || '').replace(/\/+$/, '');

/* ------------------------ Info ambiente ------------------------ */
const env = { isElectron: true };

// Info di runtime per debug (senza segreti)
const RUNTIME = {
  apiOrigin: API_ORIGIN,
  devServer: process.env.VITE_DEV_SERVER_URL || null,
};

/* ----------------------- Expose to renderer -------------------- */
try {
  contextBridge.exposeInMainWorld('api', deepFreeze(api));
  contextBridge.exposeInMainWorld('env', Object.freeze(env));
  contextBridge.exposeInMainWorld('__RUNTIME__', Object.freeze(RUNTIME));
} catch { /* no-op */ }