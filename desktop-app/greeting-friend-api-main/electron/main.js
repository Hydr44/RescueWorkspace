// electron/main.js
/**
 * RescueManager Desktop Application
 * @author haxies
 * @created 2025
 * Electron main process entry point
 */
/* eslint-disable no-console */

// Initialize Sentry for error tracking (main process)
const Sentry = require("@sentry/electron/main");

Sentry.init({
  dsn: "https://06cbf7995d244424b5b2b5ef90541636@errors.rescuemanager.eu/1",
  environment: process.env.NODE_ENV || "production",
  release: require("../package.json").version,
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Filter sensitive data
    if (event.request) {
      delete event.request.cookies;
    }
    return event;
  },
});

const path = require("path");
const { app, BrowserWindow, shell, session, protocol } = require("electron");
const { registerIpc } = require("./ipc");

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
if (!global.__RM_BOOTSTRAPPED__) global.__RM_BOOTSTRAPPED__ = true;

// Registra protocollo desktop:// per OAuth callback
app.setAsDefaultProtocolClient('desktop');

let win;

// Controlla se l'utente era già autenticato (flag salvato al login)
const fs = require('fs');
const authFlagPath = path.join(app.getPath('userData'), '.authenticated');
const wasAuthenticated = fs.existsSync(authFlagPath);

function createWindow() {
  const startWidth = wasAuthenticated ? 1200 : 900;
  const startHeight = wasAuthenticated ? 800 : 620;
  const startMinW = wasAuthenticated ? 960 : 800;
  const startMinH = wasAuthenticated ? 600 : 500;

  win = new BrowserWindow({
    width: startWidth,
    height: startHeight,
    minWidth: startMinW,
    minHeight: startMinH,
    backgroundColor: "#0b1224",
    title: "RescueManager",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: !isDev,          // Sandboxing attivo in produzione
      devTools: isDev,          // DevTools solo in sviluppo
      webSecurity: !isDev,      // CORS enforcement attivo in produzione
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    // Gestione OAuth callback
    if (url.startsWith('desktop://auth/callback')) {
      // Invia il callback alla finestra principale
      win.webContents.send('oauth-callback', url);
      return { action: "deny" };
    }

    // Apri altri URL esternamente
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Gestione protocollo desktop:// quando l'app è già aperta
  app.on('open-url', (event, url) => {
    if (url.startsWith('desktop://auth/callback')) {
      event.preventDefault();
      if (win && !win.isDestroyed()) {
        win.webContents.send('oauth-callback', url);
        win.focus();
      }
    }
  });

  // OAuth server ora gestito tramite IPC

  if (isDev) {
    const url = process.env.VITE_DEV_SERVER_URL;
    win.loadURL(url);
    win.webContents.once("dom-ready", () => {
      try { win.webContents.openDevTools({ mode: "detach" }); } catch { }
    });
  } else {
    const indexPath = path.join(__dirname, "../dist/index.html");
    win.loadFile(indexPath);
  }

  win.once("ready-to-show", () => { if (win) win.show(); });
  win.on("closed", () => { win = null; });
}

function bootstrap() {
  console.log("📂 UserData path:", app.getPath("userData"));

  if (isDev) {
    const apiOrigin = process.env.API_ORIGIN || "undefined";
    console.log(`🔑 API_ORIGIN: ${apiOrigin}`);
    console.log("🔧 Dev mode: webSecurity/sandbox disabilitati, DevTools attivi");
  }

  const { ipcMain } = require('electron');

  // Apri finestra popup Electron per OAuth login (invece del browser di sistema)
  let oauthWindow = null;
  
  ipcMain.handle('oauth:open-login-window', (event, url) => {
    return new Promise((resolve) => {
      // Se esiste già una finestra OAuth, chiudila e creane una nuova
      if (oauthWindow && !oauthWindow.isDestroyed()) {
        oauthWindow.close();
        oauthWindow = null;
      }

      oauthWindow = new BrowserWindow({
        width: 480,
        height: 680,
        parent: win,
        modal: false,
        resizable: true,
        minimizable: false,
        maximizable: false,
        title: 'Accedi — RescueManager',
        backgroundColor: '#141c27',
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: true,
        },
      });

      oauthWindow.setMenuBarVisibility(false);

      // Monitora i cambi di URL — quando arriva il callback localhost, intercetta
      oauthWindow.webContents.on('will-navigate', (navEvent, navUrl) => {
        if (navUrl.includes('localhost:3001/auth/callback') || navUrl.includes('127.0.0.1:3001/auth/callback')) {
          navEvent.preventDefault();
          // Invia callback alla finestra principale
          if (win && !win.isDestroyed()) {
            win.webContents.send('oauth-callback', navUrl);
          }
          oauthWindow.close();
          resolve({ success: true, callbackReceived: true });
        }
      });

      // Monitora anche redirect (per SPA che usano window.location)
      oauthWindow.webContents.on('will-redirect', (navEvent, navUrl) => {
        if (navUrl.includes('localhost:3001/auth/callback') || navUrl.includes('127.0.0.1:3001/auth/callback')) {
          navEvent.preventDefault();
          if (win && !win.isDestroyed()) {
            win.webContents.send('oauth-callback', navUrl);
          }
          oauthWindow.close();
          resolve({ success: true, callbackReceived: true });
        }
      });

      oauthWindow.on('closed', () => {
        oauthWindow = null;
        resolve({ success: false, callbackReceived: false, error: 'Finestra chiusa dall\'utente' });
      });

      oauthWindow.loadURL(url);
    });
  });

  // Resize finestra dopo login (da 900x620 a 1200x800) + salva flag
  ipcMain.handle('window:resize-after-login', () => {
    if (win && !win.isDestroyed()) {
      win.setMinimumSize(960, 600);
      win.setSize(1200, 800, true); // animate=true
      win.center();
      // Salva flag per prossimo avvio
      try { fs.writeFileSync(authFlagPath, '1'); } catch { }
      return { success: true };
    }
    return { success: false };
  });

  // Rimuovi flag al logout
  ipcMain.handle('window:resize-for-login', () => {
    if (win && !win.isDestroyed()) {
      win.setMinimumSize(800, 500);
      win.setSize(900, 620, true);
      win.center();
      try { fs.unlinkSync(authFlagPath); } catch { }
      return { success: true };
    }
    return { success: false };
  });

  registerIpc();
  createWindow();

  // Gestione protocollo desktop:// all'avvio dell'app
  const args = process.argv.slice(1);
  const url = args.find(arg => arg.startsWith('desktop://'));
  if (url && url.startsWith('desktop://auth/callback')) {
    if (win && !win.isDestroyed()) {
      win.webContents.send('oauth-callback', url);
    }
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();
else {
  app.on("second-instance", () => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
  app.whenReady().then(bootstrap);
}

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
process.on("unhandledRejection", (r) => console.error("UNHANDLED REJECTION:", r));
process.on("uncaughtException", (e) => console.error("UNCAUGHT EXCEPTION:", e));

app.setAboutPanelOptions?.({
  applicationName: "RescueManager",
  applicationVersion: app.getVersion(),
});