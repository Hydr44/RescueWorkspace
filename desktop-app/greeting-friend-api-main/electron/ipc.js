// electron/ipc.js
/* Centralized, safe IPC handlers with try/catch to avoid UnhandledPromiseRejection
   + idempotent registration guard for dev hot-reloads
*/
const { ipcMain, BrowserWindow } = require('electron');

const { initDb } = require('./db');
const { registerAllCrudIpc } = require('./ipc-modules');

// ===== Assist server base URL + fetch shim =====
// Le API /api/assist/* sono sulla VPS (assist-server PM2)
const ASSIST_BASE = process.env.ASSIST_BASE || 'https://assist.rescuemanager.eu';
console.log('🔌 Assist API base:', ASSIST_BASE);
const _fetch = (typeof fetch === 'function')
  ? fetch
  // node < 18
  : (...args) => require('node-fetch')(...args);

// ===== Admin API config (creazione account) =====
const API_ORIGIN = (process.env.API_ORIGIN ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://rescuemanager.eu').replace(/\/$/, '');
const ADMIN_SECRET = (process.env.ADMIN_API_SECRET ||
  process.env.NEXT_PUBLIC_ADMIN_API_SECRET || '').trim();

// ===== OAuth Server =====
const OAuthServer = require('./oauth-server');
let oauthServer = null;

let _registered = false;

function registerIpc() {
  // Idempotent guard (evita doppie registrazioni in dev)
  if (_registered) return;
  _registered = true;

  const db = initDb();

  // helper per handler con error handling uniforme + removeHandler per idempotenza
  const handleSafe = (channel, fn) => {
    try { ipcMain.removeHandler(channel); } catch { }
    ipcMain.handle(channel, async (_event, ...args) => {
      try {
        return await fn(...args);
      } catch (err) {
        console.error(`❌ IPC "${channel}" failed:`, err);
        throw new Error(`${channel}: ${err?.message || 'errore'}`);
      }
    });
  };

  // ===== Register all CRUD/business IPC handlers from modules =====
  registerAllCrudIpc(handleSafe, db, { _fetch, API_ORIGIN, ADMIN_SECRET, ASSIST_BASE });

  // ===== OAuth Server Handlers =====
  ipcMain.handle('oauth:start-server', async () => {
    try {
      console.log('[IPC] oauth:start-server called');
      if (!oauthServer) {
        console.log('[IPC] Creating new OAuth server instance...');
        oauthServer = new OAuthServer();
        await oauthServer.start((url) => {
          console.log('[IPC] === OAUTH CALLBACK RECEIVED ===');
          console.log('[IPC] OAuth callback URL:', url);
          // Invia callback alla finestra principale
          const mainWindow = BrowserWindow.getAllWindows()[0];
          if (mainWindow && !mainWindow.isDestroyed()) {
            console.log('[IPC] Sending callback to renderer process...');
            mainWindow.webContents.send('oauth-callback', url);
            console.log('[IPC] Callback sent to renderer process');
          } else {
            console.error('[IPC] Main window not found or destroyed');
          }
        });
        console.log('[IPC] OAuth server started successfully');
      } else {
        console.log('[IPC] OAuth server already running');
      }
      const callbackUrl = oauthServer.getCallbackUrl();
      console.log('[IPC] Returning callback URL:', callbackUrl);
      return { success: true, callbackUrl };
    } catch (error) {
      console.error('[IPC] Error starting OAuth server:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('oauth:stop-server', async () => {
    try {
      if (oauthServer) {
        oauthServer.stop();
        oauthServer = null;
      }
      return { success: true };
    } catch (error) {
      console.error('Error stopping OAuth server:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('oauth:get-callback-url', async () => {
    try {
      if (oauthServer) {
        return { success: true, callbackUrl: oauthServer.getCallbackUrl() };
      } else {
        return { success: false, error: 'OAuth server not started' };
      }
    } catch (error) {
      console.error('Error getting OAuth callback URL:', error);
      return { success: false, error: error.message };
    }
  });


  // ===== Register RVFU IPC handlers (OAuth, CDSSO, API calls) =====
  const { registerRvfuIpc } = require('./ipc-modules/rvfu');
  registerRvfuIpc(handleSafe);

  // ===== Avvia il notification checker periodico =====
  const { startChecker } = require('./notification-checker');
  startChecker(db);

}

module.exports = { registerIpc };
