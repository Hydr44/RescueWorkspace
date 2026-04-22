// electron/ipc-modules/rvfu.js
// Modulo RVFU: login OAuth, CDSSO, persistent API window, cookie management
// Estratto da ipc.js per ridurre la complessità del file monolitico.

const { BrowserWindow, session, net } = require('electron');
const path = require('path');

// ===== RVFU Auth Server =====
const RVFUAuthServer = require('../rvfu-auth-server');
let rvfuAuthServer = null;

/**
 * Registra tutti gli IPC handler RVFU.
 * @param {Function} handleSafe - wrapper IPC con error handling
 */
function registerRvfuIpc(handleSafe) {
  // === Stato locale del modulo (era scope di registerIpc in ipc.js) ===
  // ===== SOLUZIONE 1: FINESTRA UNICA PER LOGIN E API CALLS =====
  // Funzione helper per ottenere/creare la finestra unica RVFU
  // Questa finestra viene usata sia per il login OAuth che per le API calls
  // Vantaggio: stessa finestra = stessa sessione = cookie sempre disponibili
  // NOTA: Deve essere definita PRIMA di essere usata
  const getOrCreateRVFUWindow = () => {
    if (persistentApiWindow && !persistentApiWindow.isDestroyed()) {
      console.log('[RVFU IPC] ✅ Finestra unica RVFU già esistente, riutilizzo');
      return persistentApiWindow;
    }

    const defaultSession = session.defaultSession;

    console.log('[RVFU IPC] 🆕 Creazione finestra unica RVFU (per login e API calls)...');

    persistentApiWindow = new BrowserWindow({
      show: true, // ✅ Mostra la finestra per debug e per vedere il CDSSO
      width: 1400,
      height: 900,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false, // Necessario per SSO RVFU con VPN
        devTools: true, // Apri DevTools automaticamente per debug
        session: defaultSession, // Usa la sessione default (condivisa) per avere i cookie SSO
      },
    });

    // Gestisci chiusura
    persistentApiWindow.on('closed', () => {
      console.log('[RVFU IPC] Finestra unica RVFU chiusa');
      persistentApiWindow = null;
      apiWindowReady = false;
      // Rifiuta tutte le richieste in attesa
      for (const [id, pending] of pendingRequests.entries()) {
        pending.reject(new Error('RVFU window was closed'));
      }
      pendingRequests.clear();
    });

    return persistentApiWindow;
  };

  // ===== RVFU OAuth Authorization Window =====
  // SOLUZIONE 1: Usa la finestra unica per il login OAuth
  // Questo assicura che i cookie siano sempre disponibili nella stessa finestra
  handleSafe('rvfu:open-auth-window', async ({ authUrl, redirectUri, tokenId, authorizeParams, authorizeEndpoint, sessionCookie }) => {
    return new Promise((resolve, reject) => {
      // sessionCookie: { name: 'pdtsso-form', value: '...' } dal nuovo server ACI
      const ssoCookieName = sessionCookie?.name || 'iPlanetDirectoryPro';
      const ssoCookieValue = sessionCookie?.value || tokenId;
      console.log('[RVFU IPC] Opening Electron BrowserWindow for RVFU auth:', {
        hasAuthUrl: !!authUrl,
        redirectUri,
        hasTokenId: !!tokenId,
        hasParams: !!authorizeParams,
        hasAuthorizeEndpoint: !!authorizeEndpoint,
        ssoCookieName,
      });

      // Estrai il dominio SSO dall'authorizeEndpoint o dall'authUrl
      // IMPORTANTE: Deve essere dichiarato PRIMA di essere utilizzato negli handler webRequest
      let ssoDomain = 'ssoformazione.ilportaledeltrasporto.it';
      let finalAuthorizeEndpoint = authorizeEndpoint || authUrl;

      if (authorizeEndpoint) {
        try {
          const url = new URL(authorizeEndpoint);
          ssoDomain = url.hostname;
          finalAuthorizeEndpoint = authorizeEndpoint;
        } catch (e) {
          console.warn('[RVFU IPC] Could not parse authorizeEndpoint, using default domain');
        }
      } else if (authUrl) {
        try {
          const url = new URL(authUrl);
          ssoDomain = url.hostname;
          finalAuthorizeEndpoint = url.origin + url.pathname;
        } catch (e) {
          console.warn('[RVFU IPC] Could not parse authUrl, using default domain');
        }
      }

      console.log('[RVFU IPC] SSO Domain determined:', ssoDomain);
      console.log('[RVFU IPC] Final authorize endpoint:', finalAuthorizeEndpoint);

      // ===== SOLUZIONE 1: USA FINESTRA UNICA PER LOGIN =====
      // Invece di creare una nuova finestra per il login, usa la finestra persistente
      // Questo assicura che i cookie siano sempre disponibili nella stessa finestra
      const rvfuWindow = getOrCreateRVFUWindow();

      // Mostra la finestra per il login
      rvfuWindow.show();
      rvfuWindow.setSize(800, 700);
      rvfuWindow.center();

      // Usa la finestra unica come authWindow
      const authWindow = rvfuWindow;

      console.log('[RVFU IPC] ✅ Usando finestra unica RVFU per login OAuth');

      // Intercetta le richieste HTTP per verificare e forzare l'invio del cookie
      const ses = authWindow.webContents.session;

      // Intercetta le richieste prima che vengano inviate
      ses.webRequest.onBeforeSendHeaders(
        {
          urls: [`https://${ssoDomain}/*`],
        },
        (details, callback) => {
          // Log dettagliato - questi appaiono nella console del processo main (Terminale)
          console.log('\n=== [RVFU IPC] Intercepting HTTP Request ===');
          console.log('[RVFU IPC] URL:', details.url);
          console.log('[RVFU IPC] Method:', details.method);
          console.log('[RVFU IPC] Resource Type:', details.resourceType);
          console.log('[RVFU IPC] Existing Cookie header:', details.requestHeaders['Cookie'] || '(none)');

          // Forza SEMPRE l'aggiunta del cookie per richieste a /oauth2/authorize
          if (tokenId && details.url.includes('/oauth2/authorize')) {
            const existingCookie = details.requestHeaders['Cookie'] || '';
            const hasCookie = existingCookie.includes(`${ssoCookieName}=`) || existingCookie.includes('iPlanetDirectoryPro=') || existingCookie.includes('pdtsso-form=');

            if (!hasCookie) {
              console.log(`[RVFU IPC] ⚠ Cookie ${ssoCookieName} MISSING - Adding it now!`);
              details.requestHeaders['Cookie'] = existingCookie
                ? `${existingCookie}; ${ssoCookieName}=${ssoCookieValue}`
                : `${ssoCookieName}=${ssoCookieValue}`;
              console.log('[RVFU IPC] ✓ Cookie added. New Cookie header (first 150 chars):',
                details.requestHeaders['Cookie'].substring(0, 150) + '...');
            } else {
              console.log(`[RVFU IPC] ✓ Cookie ${ssoCookieName} already present in request`);
            }
          }

          console.log('[RVFU IPC] Final Cookie header length:', (details.requestHeaders['Cookie'] || '').length);
          console.log('=== [RVFU IPC] End Interception ===\n');

          callback({ requestHeaders: details.requestHeaders });
        }
      );

      // Intercetta le risposte per debug
      ses.webRequest.onCompleted(
        {
          urls: [`https://${ssoDomain}/*`],
        },
        (details) => {
          console.log('\n=== [RVFU IPC] HTTP Response ===');
          console.log('[RVFU IPC] URL:', details.url);
          console.log('[RVFU IPC] Status:', details.statusCode, details.statusLine);
          console.log('=== [RVFU IPC] End Response ===\n');

          // Se è una richiesta a /oauth2/authorize, controlla se ha un redirect
          if (details.url.includes('/oauth2/authorize')) {
            if (details.statusCode === 302 || details.statusCode === 301) {
              console.log('[RVFU IPC] ✓ Redirect detected (expected for OAuth authorization)');
            } else if (details.statusCode === 200) {
              console.warn('[RVFU IPC] ⚠ Got 200 OK instead of redirect - might be login page!');
            }
          }
        }
      );

      // Intercetta gli errori
      ses.webRequest.onErrorOccurred(
        {
          urls: [`https://${ssoDomain}/*`],
        },
        (details) => {
          console.error('\n=== [RVFU IPC] HTTP Error ===');
          console.error('[RVFU IPC] URL:', details.url);
          console.error('[RVFU IPC] Error:', details.error);
          console.error('=== [RVFU IPC] End Error ===\n');
        }
      );

      // Abilita DevTools per debug
      authWindow.webContents.openDevTools({ mode: 'detach' });

      // IMPORTANTE: Imposta il cookie iPlanetDirectoryPro PRIMA di caricare qualsiasi pagina
      // Questo permette al portale di riconoscere l'utente già autenticato
      // Secondo il manuale, chiamando /authenticate prima, NON dovrebbe apparire la pagina di login
      if (tokenId) {
        // Prova diverse varianti di dominio per il cookie
        // IMPORTANTE: Secondo documentazione ForgeRock, il cookie deve essere impostato sul dominio parent
        // per funzionare su tutti i sottodomini (es. .ilportaledeltrasporto.it)
        const cookieVariants = [
          // Dominio parent (per funzionare su tutti i sottodomini)
          {
            url: 'https://ilportaledeltrasporto.it',
            domain: '.ilportaledeltrasporto.it', // ✅ Punto iniziale per cross-subdomain
            path: '/',
          },
          // Dominio SSO specifico
          {
            url: `https://${ssoDomain}`,
            domain: ssoDomain,
            path: '/',
          },
          {
            url: `https://${ssoDomain}/sso`,
            domain: ssoDomain,
            path: '/sso',
          },
          {
            url: `https://${ssoDomain}/sso/`,
            domain: ssoDomain,
            path: '/sso',
          },
          // Dominio API (formazione.ilportaledeltrasporto.it)
          {
            url: 'https://formazione.ilportaledeltrasporto.it',
            domain: '.ilportaledeltrasporto.it', // ✅ Stesso dominio parent
            path: '/',
          },
        ];

        console.log(`\n=== [RVFU IPC] Setting ${ssoCookieName} Cookie ===`);
        console.log('[RVFU IPC] Domain:', ssoDomain);
        console.log('[RVFU IPC] Cookie name:', ssoCookieName);
        console.log('[RVFU IPC] Cookie value length:', ssoCookieValue.length);
        console.log('[RVFU IPC] Cookie value preview:', ssoCookieValue.substring(0, 50) + '...');

        // Imposta il cookie per tutte le varianti possibili
        const cookiePromises = cookieVariants.map(variant => {
          const cookie = {
            url: variant.url,
            name: ssoCookieName,
            value: ssoCookieValue,
            domain: variant.domain,
            path: variant.path,
            secure: true,
            httpOnly: true, // httpOnly significa che JS non può leggere, ma il browser lo invia comunque
            // Rimuoviamo sameSite - Electron gestirà automaticamente la compatibilità
          };

          // Imposta il cookie sia per la sessione della finestra auth che per la sessione default condivisa
          const defaultSession = session.defaultSession;

          return Promise.all([
            // Cookie per la finestra auth
            authWindow.webContents.session.cookies.set(cookie).then(() => {
              console.log('[RVFU IPC] Cookie set for authWindow:', variant.url);
              return authWindow.webContents.session.cookies.get({ url: variant.url });
            }),
            // Cookie per la sessione default condivisa (IMPORTANTE per la finestra API persistente)
            defaultSession.cookies.set(cookie).then(() => {
              console.log('[RVFU IPC] Cookie set for defaultSession:', variant.url);
              return defaultSession.cookies.get({ url: variant.url });
            })
          ]).then(([authCookies, defaultCookies]) => {
            const authCookie = authCookies.find(c => c.name === ssoCookieName);
            const defaultCookie = defaultCookies.find(c => c.name === ssoCookieName);

            if (authCookie) {
              console.log('[RVFU IPC] ✓ Cookie verified for authWindow:', variant.url);
            } else {
              console.warn('[RVFU IPC] ⚠ Cookie NOT found for authWindow:', variant.url);
            }

            if (defaultCookie) {
              console.log('[RVFU IPC] ✓ Cookie verified for defaultSession:', variant.url, {
                name: defaultCookie.name,
                valueMatch: defaultCookie.value === tokenId ? 'YES' : 'NO',
                domain: defaultCookie.domain,
                path: defaultCookie.path,
                httpOnly: defaultCookie.httpOnly,
                secure: defaultCookie.secure,
              });
            } else {
              console.warn('[RVFU IPC] ⚠ Cookie NOT found for defaultSession:', variant.url);
            }

            return authCookie || defaultCookie; // Ritorna almeno uno se presente
          })
            .catch((error) => {
              console.error('[RVFU IPC] Error setting cookie for', variant.url, ':', error.message);
              return null;
            });
        });

        Promise.all(cookiePromises)
          .then((results) => {
            const successCount = results.filter(r => r !== null).length;
            console.log('[RVFU IPC] Cookie setup completed:', successCount, 'out of', cookieVariants.length, 'variants succeeded');
            if (successCount === 0) {
              console.error('[RVFU IPC] ⚠⚠⚠ NO COOKIES WERE SET! This will cause login prompt!');
            }
            console.log('=== [RVFU IPC] End Cookie Setup ===\n');

            // Aspetta un po' per assicurarsi che i cookie siano disponibili
            setTimeout(() => {
              console.log('[RVFU IPC] Loading authorize page...');
              loadAuthorizePage();
            }, 500);
          })
          .catch((error) => {
            console.error('[RVFU IPC] Error setting cookies:', error);
            // Procedi comunque - il csrf parameter dovrebbe aiutare
            loadAuthorizePage();
          });
      } else {
        console.warn('[RVFU IPC] No tokenId provided, loading authorize page without cookie');
        loadAuthorizePage();
      }

      function loadAuthorizePage() {
        if (authorizeParams && finalAuthorizeEndpoint) {
          // Usa il server HTTP locale per servire una pagina HTML che fa il POST
          // Questo garantisce che la pagina abbia un'origine valida e i cookie vengano inviati
          if (!rvfuAuthServer) {
            rvfuAuthServer = new RVFUAuthServer();
          }

          const authServerParams = {
            authorizeEndpoint: finalAuthorizeEndpoint,
            params: authorizeParams,
          };

          // Callback handler per quando riceviamo il redirect
          const authCallback = ({ code, error, errorDescription, state, url: callbackUrl }) => {
            if (error) {
              console.error('[RVFU IPC] OAuth error from callback:', { error, errorDescription });
              authWindow.close();
              reject(new Error(`OAuth error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`));
            } else if (code) {
              console.log('[RVFU IPC] Authorization code received:', code.substring(0, 20) + '...');
              authWindow.close();
              resolve({ code, state });
            }
          };

          // Avvia il server se non è già avviato
          console.log('[RVFU IPC] Starting local HTTP server for authorize page...');
          rvfuAuthServer.start(authServerParams, authCallback).then(() => {
            // Server avviato, carica la pagina che fa POST
            const authorizePageUrl = rvfuAuthServer.getAuthorizePageUrl();
            console.log('[RVFU IPC] ✓ Local server started. Loading authorize page from:', authorizePageUrl);
            console.log('[RVFU IPC] This page will POST to:', finalAuthorizeEndpoint);
            authWindow.loadURL(authorizePageUrl);
          }).catch((error) => {
            console.error('[RVFU IPC] Error starting auth server:', error);
            // Fallback: usa about:blank con HTML iniettato
            loadAuthorizePageFallback();
          });
        } else if (authUrl) {
          authWindow.loadURL(authUrl);
        }
      }

      function loadAuthorizePageFallback() {
        // Fallback: usa about:blank con HTML iniettato
        console.log('[RVFU IPC] Using fallback: about:blank with injected HTML');

        const formFields = Object.entries(authorizeParams)
          .map(([key, value]) => {
            const escapedValue = String(value)
              .replace(/&/g, '&amp;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
            return `<input type="hidden" name="${key}" value="${escapedValue}" />`;
          })
          .join('\n      ');

        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Autorizzazione RVFU</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      padding: 50px; 
      background: #1a1a1a; 
      color: white;
      text-align: center;
    }
    .loading {
      font-size: 18px;
      margin-top: 100px;
    }
  </style>
</head>
<body>
  <div class="loading">Autorizzazione in corso...</div>
  <form id="authForm" method="POST" action="${finalAuthorizeEndpoint.replace(/"/g, '&quot;')}">
      ${formFields}
  </form>
  <script>
    console.log('[RVFU Auth] Form ready, submitting...');
    document.getElementById('authForm').submit();
  </script>
</body>
</html>`;

        authWindow.loadURL('about:blank');
        authWindow.webContents.once('did-finish-load', () => {
          authWindow.webContents.executeJavaScript(`
            document.open();
            document.write(${JSON.stringify(html)});
            document.close();
          `).catch(err => {
            console.error('[RVFU IPC] Error injecting HTML:', err);
          });
        });
      }

      // Intercetta il redirect a https://localhost/
      authWindow.webContents.on('will-redirect', (event, navigationUrl) => {
        console.log('[RVFU IPC] Redirect detected:', navigationUrl);
        handleRedirect(navigationUrl, event);
      });

      authWindow.webContents.on('did-navigate', (event, navigationUrl) => {
        console.log('[RVFU IPC] Navigation completed:', navigationUrl);
        handleRedirect(navigationUrl);
      });

      authWindow.webContents.on('did-finish-load', () => {
        const currentUrl = authWindow.webContents.getURL();
        console.log('[RVFU IPC] Page finished loading:', currentUrl);
        handleRedirect(currentUrl);
      });

      function handleRedirect(navigationUrl, event) {
        // Controlla se l'URL contiene localhost con code o error
        if (navigationUrl.includes('localhost') && (navigationUrl.includes('code=') || navigationUrl.includes('error='))) {
          console.log('[RVFU IPC] Redirect match detected!');
          if (event) event.preventDefault();

          try {
            const url = new URL(navigationUrl);
            const code = url.searchParams.get('code');
            const error = url.searchParams.get('error');

            if (error) {
              const errorDescription = url.searchParams.get('error_description');
              console.error('[RVFU IPC] OAuth error:', { error, errorDescription });
              authWindow.close();
              reject(new Error(`OAuth error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`));
            } else if (code) {
              console.log('[RVFU IPC] Authorization code received:', code.substring(0, 20) + '...');
              authWindow.close();
              resolve({ code, state: url.searchParams.get('state') });
            }
          } catch (urlError) {
            console.error('[RVFU IPC] Error parsing redirect URL:', urlError);
          }
        }
      }

      // Gestisci la chiusura della finestra
      authWindow.on('closed', () => {
        reject(new Error('Authorization window was closed by user'));
      });

      // Timeout di sicurezza (5 minuti)
      setTimeout(() => {
        if (!authWindow.isDestroyed()) {
          authWindow.close();
          reject(new Error('Authorization timeout'));
        }
      }, 5 * 60 * 1000);
    });
  });

  // ===== SOLUZIONE 1: FINESTRA UNICA PER LOGIN E API CALLS =====
  // Manteniamo una finestra BrowserWindow unica per login OAuth e API calls
  // Vantaggio: stessa finestra = stessa sessione = cookie sempre disponibili
  let persistentApiWindow = null;
  let apiWindowReady = false;
  const pendingRequests = new Map();

  // Funzione helper per inizializzare la finestra persistente (riutilizzabile)
  // NOTA: Ora usa getOrCreateRVFUWindow() per riutilizzare la finestra unica
  const initPersistentApiWindow = async () => {
    if (persistentApiWindow && !persistentApiWindow.isDestroyed() && apiWindowReady) {
      console.log('[RVFU IPC API] Finestra persistente già aperta e pronta');
      return true;
    }

    console.log('[RVFU IPC API] Inizializzazione finestra API persistente...');

    // Usa getOrCreateRVFUWindow() per riutilizzare la finestra unica
    const window = getOrCreateRVFUWindow();

    // Se la finestra esiste già ma non è pronta, continua con l'inizializzazione
    if (window !== persistentApiWindow) {
      // La finestra è stata creata da getOrCreateRVFUWindow()
      persistentApiWindow = window;
    }

    // Mostra la finestra se non è già visibile
    if (!persistentApiWindow.isVisible()) {
      persistentApiWindow.show();
      persistentApiWindow.center();
    }

    // Apri DevTools automaticamente per vedere i cookie e le richieste
    persistentApiWindow.webContents.openDevTools({ mode: 'bottom' });

    // ✅ FIX CRITICO: Imposta User-Agent identico a Chrome (senza "Electron")
    // Molti portali/filtri bloccano user-agent "automation-like" con 403
    const chromeUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
    persistentApiWindow.webContents.setUserAgent(chromeUserAgent);
    const ses = persistentApiWindow.webContents.session;
    ses.setUserAgent(chromeUserAgent);
    console.log('[RVFU IPC API] ✅ User-Agent impostato a Chrome (senza Electron):', chromeUserAgent);

    // ✅ Intercetta TUTTE le richieste API per aggiungere il cookie iPlanetDirectoryPro se manca
    // Questo risolve il problema che il cookie non viene inviato automaticamente con fetch

    // Intercetta le richieste API (non solo CDSSO)
    // IMPORTANTE: Usa un pattern più ampio per intercettare tutte le richieste a formazione.ilportaledeltrasporto.it
    ses.webRequest.onBeforeSendHeaders(
      {
        urls: ['https://formazione.ilportaledeltrasporto.it/*'],
      },
      async (details, callback) => {
        // Log tutte le richieste per debug
        console.log('[RVFU IPC API] 🔍 Intercettazione richiesta:', {
          url: details.url.substring(0, 150),
          method: details.method,
          hasCookie: !!(details.requestHeaders['Cookie'] || details.requestHeaders['cookie'])
        });

        // Recupera il session cookie SSO (pdtsso-form o iPlanetDirectoryPro) dalla sessione
        const ssoCookies = await session.defaultSession.cookies.get({ domain: 'ssoformazione.ilportaledeltrasporto.it' });
        const parentCookies = await session.defaultSession.cookies.get({ domain: '.ilportaledeltrasporto.it' });
        const allSessionCookies = [...ssoCookies, ...parentCookies];
        const ssoCookie = allSessionCookies.find(c => c.name === 'pdtsso-form') || allSessionCookies.find(c => c.name === 'iPlanetDirectoryPro');

        if (ssoCookie) {
          const existingCookie = details.requestHeaders['Cookie'] || details.requestHeaders['cookie'] || '';
          if (!existingCookie.includes(ssoCookie.name)) {
            const cookieHeader = `${ssoCookie.name}=${ssoCookie.value}`;
            const newCookieHeader = existingCookie
              ? `${existingCookie}; ${cookieHeader}`
              : cookieHeader;
            details.requestHeaders['Cookie'] = newCookieHeader;
            console.log(`[RVFU IPC API] ✅ Cookie ${ssoCookie.name} aggiunto alla richiesta API:`, details.url.substring(0, 100));
          } else {
            console.log(`[RVFU IPC API] ✓ Cookie ${ssoCookie.name} già presente nella richiesta`);
          }
        } else {
          console.warn('[RVFU IPC API] ⚠️ Cookie SSO NON trovato nella sessione per richiesta:', details.url.substring(0, 100));
        }

        callback({ requestHeaders: details.requestHeaders });
      }
    );

    // ✅ Intercetta le richieste POST al CDSSO per aggiungere il cookie iPlanetDirectoryPro
    // ✅ FIX: Intercetta anche http:// (non solo https://) per il form CDSSO
    ses.webRequest.onBeforeSendHeaders(
      {
        urls: [
          'https://formazione.ilportaledeltrasporto.it/agent/cdsso-oauth2*',
          'http://formazione.ilportaledeltrasporto.it/agent/cdsso-oauth2*',
          'http://formazione.ilportaledeltrasporto.it:80/agent/cdsso-oauth2*'
        ],
      },
      async (details, callback) => {
        console.log('\n=== [RVFU IPC API] Intercettazione POST CDSSO ===');
        console.log('[RVFU IPC API] URL:', details.url);
        console.log('[RVFU IPC API] Method:', details.method);

        // Recupera TUTTI i cookie dalla sessione per formazione.ilportaledeltrasporto.it
        const allCookies = await session.defaultSession.cookies.get({ domain: 'formazione.ilportaledeltrasporto.it' });
        const ssoCookies = await session.defaultSession.cookies.get({ domain: 'ssoformazione.ilportaledeltrasporto.it' });
        const parentCookies = await session.defaultSession.cookies.get({ domain: '.ilportaledeltrasporto.it' });

        console.log('[RVFU IPC API] 🔍 Cookie disponibili nella sessione:');
        console.log('[RVFU IPC API]   - formazione.ilportaledeltrasporto.it:', allCookies.length);
        console.log('[RVFU IPC API]   - ssoformazione.ilportaledeltrasporto.it:', ssoCookies.length);
        console.log('[RVFU IPC API]   - .ilportaledeltrasporto.it:', parentCookies.length);

        // Cerca i cookie importanti (pdtsso-form ha priorità su iPlanetDirectoryPro)
        const allSsoCookies = [...ssoCookies, ...parentCookies];
        const SSO_COOKIE_NAMES = ['pdtsso-form', 'iPlanetDirectoryPro'];
        const ssoCookieFound = allSsoCookies.find(c => SSO_COOKIE_NAMES.includes(c.name));
        const amFilterCookie = allCookies.find(c => c.name === 'amFilterCDSSORequest');

        const existingCookie = details.requestHeaders['Cookie'] || '';
        let cookieHeader = existingCookie;

        // Aggiungi session cookie SSO se mancante
        if (ssoCookieFound && !existingCookie.includes(ssoCookieFound.name)) {
          const ssoHeader = `${ssoCookieFound.name}=${ssoCookieFound.value}`;
          cookieHeader = cookieHeader ? `${cookieHeader}; ${ssoHeader}` : ssoHeader;
          console.log(`[RVFU IPC API] ✅ Aggiungo cookie ${ssoCookieFound.name} al POST CDSSO`);
        } else if (ssoCookieFound) {
          console.log(`[RVFU IPC API] ✓ Cookie ${ssoCookieFound.name} già presente nel POST`);
        } else {
          console.warn('[RVFU IPC API] ⚠️ Cookie SSO NON trovato per POST CDSSO!');
        }

        // Aggiungi amFilterCDSSORequest se presente (richiesto da ForgeRock)
        if (amFilterCookie && !existingCookie.includes('amFilterCDSSORequest')) {
          const amFilterHeader = `amFilterCDSSORequest=${amFilterCookie.value}`;
          cookieHeader = cookieHeader ? `${cookieHeader}; ${amFilterHeader}` : amFilterHeader;
          console.log('[RVFU IPC API] ✅ Aggiungo cookie amFilterCDSSORequest al POST CDSSO');
        } else if (amFilterCookie) {
          console.log('[RVFU IPC API] ✓ Cookie amFilterCDSSORequest già presente nel POST');
        } else {
          console.warn('[RVFU IPC API] ⚠️ Cookie amFilterCDSSORequest NON trovato (potrebbe essere necessario)');
        }

        details.requestHeaders['Cookie'] = cookieHeader;

        console.log('[RVFU IPC API] Cookie header length:', cookieHeader.length);
        console.log('[RVFU IPC API] Cookie header preview:', cookieHeader.substring(0, 200) + '...');
        console.log('=== [RVFU IPC API] Fine Intercettazione POST CDSSO ===\n');

        callback({ requestHeaders: details.requestHeaders });
      }
    );

    // ✅ Intercetta anche le RISPOSTE per vedere i cookie impostati dal server
    // ✅ FIX: Intercetta anche http:// (non solo https://) per il form CDSSO
    ses.webRequest.onHeadersReceived(
      {
        urls: [
          'https://formazione.ilportaledeltrasporto.it/agent/cdsso-oauth2*',
          'http://formazione.ilportaledeltrasporto.it/agent/cdsso-oauth2*',
          'http://formazione.ilportaledeltrasporto.it:80/agent/cdsso-oauth2*'
        ],
      },
      (details, callback) => {
        console.log('\n=== [RVFU IPC API] Risposta POST CDSSO ===');
        console.log('[RVFU IPC API] Status:', details.statusCode);
        console.log('[RVFU IPC API] Response headers:', Object.keys(details.responseHeaders || {}));

        // ✅ Se è un redirect 302, estrai l'URL di destinazione
        if (details.statusCode === 302 || details.statusCode === 301) {
          const locationHeader = details.responseHeaders['Location'] || details.responseHeaders['location'] || [];
          const redirectUrl = Array.isArray(locationHeader) ? locationHeader[0] : locationHeader;
          if (redirectUrl) {
            // ✅ FASE 1: Normalizza URL rimuovendo :443 se presente (porta HTTPS standard)
            const normalizedRedirectUrl = redirectUrl.replace(/:443\//g, '/').replace(/:443$/, '');

            console.log('[RVFU IPC API] ✅ Redirect rilevato! Location:', redirectUrl);
            if (redirectUrl !== normalizedRedirectUrl) {
              console.log('[RVFU IPC API] 🔧 URL normalizzato (rimosso :443):', normalizedRedirectUrl);
            }
            console.log('[RVFU IPC API] ✅ Il CDSSO è stato completato con successo!');

            // ✅ FASE 2: Salva URL normalizzato per uso nel retry
            // Cerca la richiesta pending associata (ultima richiesta pending dovrebbe essere quella corrente)
            if (pendingRequests.size > 0) {
              // Prendi tutte le richieste pending e trova quella più recente
              const allPending = Array.from(pendingRequests.values());
              const lastPending = allPending[allPending.length - 1];
              if (lastPending) {
                // Salva URL normalizzato nella richiesta pending
                // ✅ FIX: Assicurati che originalRequest esista e abbia tutte le proprietà necessarie
                if (!lastPending.originalRequest) {
                  lastPending.originalRequest = {
                    method: lastPending.method || 'GET',
                    url: lastPending.url || '',
                    headers: lastPending.headers || {},
                    body: lastPending.body || null
                  };
                }
                lastPending.originalRequest._cdssoRedirectUrl = normalizedRedirectUrl;
                console.log('[RVFU IPC API] ✅ URL redirect normalizzato salvato per retry:', normalizedRedirectUrl);
                console.log('[RVFU IPC API] 🔍 Debug: lastPending.originalRequest salvato:', {
                  hasOriginalRequest: !!lastPending.originalRequest,
                  hasRedirectUrl: !!lastPending.originalRequest._cdssoRedirectUrl,
                  redirectUrl: lastPending.originalRequest._cdssoRedirectUrl
                });

                // ✅ FIX CRITICO: Salva l'URL anche in TUTTE le richieste pending che hanno originalRequest
                // Questo assicura che l'URL sia disponibile anche se la richiesta viene recuperata in modo diverso
                for (const [requestId, pending] of pendingRequests.entries()) {
                  if (pending.originalRequest && !pending.originalRequest._cdssoRedirectUrl) {
                    pending.originalRequest._cdssoRedirectUrl = normalizedRedirectUrl;
                    console.log('[RVFU IPC API] 🔧 URL redirect salvato anche in pending request:', requestId);
                  }
                }
              } else {
                console.warn('[RVFU IPC API] ⚠️ Nessuna richiesta pending trovata per salvare URL redirect');
              }
            } else {
              console.warn('[RVFU IPC API] ⚠️ Nessuna richiesta pending disponibile per salvare URL redirect');
            }
          }
        }

        // Cerca cookie Set-Cookie nella risposta
        const setCookieHeaders = details.responseHeaders['Set-Cookie'] || details.responseHeaders['set-cookie'] || [];
        if (setCookieHeaders.length > 0) {
          console.log('[RVFU IPC API] 🍪 Cookie impostati dal server:', setCookieHeaders);

          // ✅ FIX: Verifica cookie critici impostati dal server
          const hasAmAuthJwt = setCookieHeaders.some((cookie) => cookie.includes('am-auth-jwt'));
          const hasAgentAuthnTxX = setCookieHeaders.some((cookie) => cookie.includes('agent-authn-tx-x-'));
          const hasAmlbcookie = setCookieHeaders.some((cookie) => cookie.includes('amlbcookie'));
          const hasAgentAuthnTx = setCookieHeaders.some((cookie) => cookie.includes('agent-authn-tx-'));

          console.log('[RVFU IPC API] 🔍 Cookie critici nella risposta CDSSO:', {
            hasAmAuthJwt: hasAmAuthJwt,
            hasAgentAuthnTxX: hasAgentAuthnTxX,
            hasAmlbcookie: hasAmlbcookie,
            hasAgentAuthnTx: hasAgentAuthnTx,
            totalCookies: setCookieHeaders.length
          });

          if (hasAmAuthJwt) {
            console.log('[RVFU IPC API] ✅ Cookie am-auth-jwt trovato! CDSSO completato con successo!');
          }
          if (!hasAgentAuthnTxX) {
            console.warn('[RVFU IPC API] ⚠️ Cookie agent-authn-tx-x-* NON impostato dal server!');
            console.warn('[RVFU IPC API] ⚠️ Questo potrebbe causare 403 Forbidden');
          }
          if (!hasAmlbcookie) {
            console.warn('[RVFU IPC API] ⚠️ Cookie amlbcookie NON impostato dal server!');
            console.warn('[RVFU IPC API] ⚠️ Questo potrebbe causare 403 Forbidden (sticky session)');
          }
        } else {
          console.log('[RVFU IPC API] ⚠️ Nessun cookie impostato dal server nella risposta');
        }

        console.log('=== [RVFU IPC API] Fine Risposta POST CDSSO ===\n');

        callback({ responseHeaders: details.responseHeaders });
      }
    );

    // ⚠️ IMPORTANTE: Imposta il listener PRIMA di caricare qualsiasi pagina
    // Intercetta console.log per catturare le risposte
    persistentApiWindow.webContents.on('console-message', async (event, level, message, line, sourceId) => {
      // Log TUTTI i messaggi per debug (almeno quelli che contengono "API" o "RVFU")
      if (message.includes('API') || message.includes('RVFU') || message.includes('Response')) {
        console.log('[RVFU IPC API] Console message intercettato:', {
          level,
          messageLength: message.length,
          messagePreview: message.substring(0, 300),
          hasAPIResponse: message.includes('API Response:'),
          fullMessage: message // Log completo per debug
        });
      }

      if (message.includes('API Response:')) {
        try {
          // Estrai il JSON dalla stringa del messaggio
          // Il formato è: "API Response: {...}"
          const jsonStr = message.substring(message.indexOf('API Response:') + 'API Response:'.length).trim();
          console.log('[RVFU IPC API] Parsing JSON response:', {
            jsonStrLength: jsonStr.length,
            jsonStrPreview: jsonStr.substring(0, 200)
          });

          const result = JSON.parse(jsonStr);

          const requestId = result.id;
          console.log('[RVFU IPC API] Risposta ricevuta per requestId:', requestId);

          const pending = pendingRequests.get(requestId);

          if (pending) {
            console.log('[RVFU IPC API] ✅ Richiesta trovata, elaborando risposta...');
            // ✅ FIX: NON rimuovere la richiesta finché non è completato il CDSSO
            // La rimuoveremo dopo il retry se il CDSSO non è necessario, o dopo il retry se è necessario
            // clearTimeout(pending.timeout); // Rimuoviamo il timeout solo se non è CDSSO

            if (result.success) {
              if (result.data && result.data._html) {
                // SECONDO FORGEROCK: Se è CDSSO, naviga nella finestra persistente al form CDSSO
                // Submit automatico, attendi completamento, riprova richiesta originale
                if (result.data._cdsso && result.data._cdssoNavigate && result.data._idToken && result.data._formAction) {
                  console.log('[RVFU IPC API] 🔐 CDSSO rilevato - navigazione nella finestra persistente secondo ForgeRock...');

                  // ✅ IMPORTANTE: NON rimuovere la richiesta da pendingRequests finché non è completato il CDSSO
                  // Questo permette di salvare l'URL redirect quando viene intercettata la risposta POST CDSSO

                  // ✅ IMPORTANTE: Recupera l'URL originale dalla richiesta pending PRIMA di qualsiasi altro uso
                  // Usa una variabile locale per evitare problemi di scope/TDZ
                  // ✅ FIX: Se pending.originalRequest esiste, usalo direttamente (preserva _cdssoRedirectUrl se salvato)
                  const originalRequestData = pending.originalRequest || {
                    url: result.data._originalUrl || pending.url || '',
                    method: pending.method || 'GET',
                    headers: pending.headers || {},
                    body: pending.body || null
                  };

                  // ✅ FIX: Assicurati che _cdssoRedirectUrl sia presente se è stato salvato
                  if (pending.originalRequest && pending.originalRequest._cdssoRedirectUrl && !originalRequestData._cdssoRedirectUrl) {
                    originalRequestData._cdssoRedirectUrl = pending.originalRequest._cdssoRedirectUrl;
                    console.log('[RVFU IPC API] 🔧 URL redirect recuperato per originalRequestData:', originalRequestData._cdssoRedirectUrl);
                  }

                  const idToken = result.data._idToken;
                  const formAction = result.data._formAction;

                  console.log('[RVFU IPC API] 🔐 id_token disponibile, lunghezza:', idToken.length);
                  console.log('[RVFU IPC API] 🔐 Form action:', formAction);
                  console.log('[RVFU IPC API] 🔐 URL originale:', originalRequestData.url);

                  // SECONDO FORGEROCK: Naviga nella finestra persistente al form CDSSO
                  // IMPORTANTE: Secondo ForgeRock, il cookie amFilterCDSSORequest viene impostato dal Java Agent
                  // quando si naviga direttamente all'URL che genera il form CDSSO (non tramite fetch)
                  // Quindi dobbiamo prima navigare all'URL che genera il form, poi fare il POST
                  if (persistentApiWindow && !persistentApiWindow.isDestroyed()) {
                    console.log('[RVFU IPC API] 🔐 Navigazione nella finestra persistente al form CDSSO...');

                    // ✅ Mostra la finestra se non è già visibile
                    if (!persistentApiWindow.isVisible()) {
                      persistentApiWindow.show();
                      persistentApiWindow.center();
                    }

                    // ✅ SECONDO FORGEROCK: Il cookie amFilterCDSSORequest viene impostato dal Java Agent
                    // quando si naviga realmente all'URL originale che genera il form CDSSO.
                    // Dobbiamo navigare realmente (non fetch) e intercettare le richieste per aggiungere gli header di autenticazione.
                    console.log('[RVFU IPC API] 🔐 STEP 1: Navigazione all\'URL originale per ottenere cookie amFilterCDSSORequest...');
                    console.log('[RVFU IPC API] 🔐 URL originale:', originalRequestData.url);
                    console.log('[RVFU IPC API] 🔐 Method:', originalRequestData.method);
                    console.log('[RVFU IPC API] 🔐 Has Authorization header:', !!(originalRequestData.headers && originalRequestData.headers.Authorization));

                    // ✅ Verifica cookie PRIMA della navigazione
                    const cookiesBefore = await session.defaultSession.cookies.get({ domain: 'formazione.ilportaledeltrasporto.it' });
                    console.log('[RVFU IPC API] 🔍 Cookie PRIMA navigazione:', {
                      count: cookiesBefore.length,
                      names: cookiesBefore.map(c => c.name),
                      hasAmFilter: cookiesBefore.some(c => c.name === 'amFilterCDSSORequest'),
                      hasIPlanet: cookiesBefore.some(c => c.name === 'iPlanetDirectoryPro')
                    });

                    // ✅ Intercetta le richieste HTTP per aggiungere gli header di autenticazione durante la navigazione
                    const ses = persistentApiWindow.webContents.session;
                    const urlToIntercept = new URL(originalRequestData.url);
                    const interceptUrlPattern = `${urlToIntercept.protocol}//${urlToIntercept.host}${urlToIntercept.pathname}*`;

                    console.log('[RVFU IPC API] 🔐 Pattern URL da intercettare:', interceptUrlPattern);

                    // ✅ FASE 3: Intercetta anche le RISPOSTE per vedere se il cookie amFilterCDSSORequest viene impostato
                    let responseInterceptor = null;
                    try {
                      responseInterceptor = ses.webRequest.onHeadersReceived(
                        {
                          urls: [interceptUrlPattern],
                        },
                        (details, callback) => {
                          console.log('[RVFU IPC API] 🔍 FASE 3: Intercettazione risposta navigazione all\'URL originale...');
                          console.log('[RVFU IPC API] 🔍 URL:', details.url);
                          console.log('[RVFU IPC API] 🔍 Status:', details.statusCode);

                          // Cerca cookie Set-Cookie nella risposta
                          const setCookieHeaders = details.responseHeaders['Set-Cookie'] || details.responseHeaders['set-cookie'] || [];
                          if (setCookieHeaders.length > 0) {
                            console.log('[RVFU IPC API] 🍪 FASE 3: Cookie impostati durante navigazione:', setCookieHeaders);

                            // Verifica se è stato impostato il cookie amFilterCDSSORequest
                            const hasAmFilter = setCookieHeaders.some((cookie) => cookie.includes('amFilterCDSSORequest'));
                            if (hasAmFilter) {
                              console.log('[RVFU IPC API] ✅ FASE 3: Cookie amFilterCDSSORequest trovato durante navigazione!');
                            } else {
                              console.warn('[RVFU IPC API] ⚠️ FASE 3: Cookie amFilterCDSSORequest NON trovato durante navigazione');
                              console.warn('[RVFU IPC API] ⚠️ FASE 3: Questo potrebbe essere il problema!');
                            }
                          } else {
                            console.warn('[RVFU IPC API] ⚠️ FASE 3: Nessun cookie impostato durante navigazione');
                          }

                          callback({ responseHeaders: details.responseHeaders });
                        }
                      );
                    } catch (e) {
                      console.warn('[RVFU IPC API] ⚠️ Errore creazione response interceptor:', e);
                    }

                    // Intercetta le richieste all'URL originale per aggiungere gli header di autenticazione
                    let interceptor = null;
                    try {
                      interceptor = ses.webRequest.onBeforeSendHeaders(
                        {
                          urls: [interceptUrlPattern],
                        },
                        (details, callback) => {
                          console.log('[RVFU IPC API] 🔐 Intercettazione richiesta navigazione all\'URL originale...');
                          console.log('[RVFU IPC API] 🔐 URL:', details.url);
                          console.log('[RVFU IPC API] 🔐 Method:', details.method);

                          // ✅ FIX CRITICO: NON aggiungere Authorization header!
                          // Il ForgeRock Web Agent usa cookie CDSSO, NON Bearer token.
                          // Il Bearer header confonde il Web Agent → 403 Forbidden.
                          if (originalRequestData.headers) {
                            Object.entries(originalRequestData.headers).forEach(([key, value]) => {
                              if (key === 'Authorization') {
                                console.log('[RVFU IPC API] ⚠️ Header Authorization SALTATO (Web Agent usa solo cookie CDSSO)');
                                return; // Skip Authorization header
                              }
                              if (value && !details.requestHeaders[key]) {
                                details.requestHeaders[key] = String(value);
                                console.log('[RVFU IPC API] ✅ Header aggiunto:', key, '=', String(value).substring(0, 50) + '...');
                              }
                            });
                          }

                          callback({ requestHeaders: details.requestHeaders });
                        }
                      );

                      // Naviga realmente all'URL originale (questo permetterà al Java Agent di impostare il cookie)
                      await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                          persistentApiWindow.webContents.removeListener('did-finish-load', onLoad);
                          persistentApiWindow.webContents.removeListener('did-fail-load', onFail);
                          if (interceptor) {
                            try {
                              interceptor.dispose();
                            } catch (e) {
                              console.warn('[RVFU IPC API] ⚠️ Errore dispose interceptor:', e);
                            }
                          }
                          if (responseInterceptor) {
                            try {
                              responseInterceptor.dispose();
                            } catch (e) {
                              console.warn('[RVFU IPC API] ⚠️ Errore dispose response interceptor:', e);
                            }
                          }
                          reject(new Error('Timeout navigazione all\'URL originale'));
                        }, 10000);

                        const onLoad = () => {
                          clearTimeout(timeout);
                          persistentApiWindow.webContents.removeListener('did-finish-load', onLoad);
                          persistentApiWindow.webContents.removeListener('did-fail-load', onFail);
                          if (interceptor) {
                            try {
                              interceptor.dispose();
                            } catch (e) {
                              console.warn('[RVFU IPC API] ⚠️ Errore dispose interceptor:', e);
                            }
                          }
                          if (responseInterceptor) {
                            try {
                              responseInterceptor.dispose();
                            } catch (e) {
                              console.warn('[RVFU IPC API] ⚠️ Errore dispose response interceptor:', e);
                            }
                          }
                          const currentUrl = persistentApiWindow.webContents.getURL();
                          console.log('[RVFU IPC API] ✅ Pagina caricata dopo navigazione, URL:', currentUrl);
                          resolve();
                        };

                        const onFail = (event, errorCode, errorDescription) => {
                          clearTimeout(timeout);
                          persistentApiWindow.webContents.removeListener('did-finish-load', onLoad);
                          persistentApiWindow.webContents.removeListener('did-fail-load', onFail);
                          if (interceptor) {
                            try {
                              interceptor.dispose();
                            } catch (e) {
                              console.warn('[RVFU IPC API] ⚠️ Errore dispose interceptor:', e);
                            }
                          }
                          if (responseInterceptor) {
                            try {
                              responseInterceptor.dispose();
                            } catch (e) {
                              console.warn('[RVFU IPC API] ⚠️ Errore dispose response interceptor:', e);
                            }
                          }
                          console.warn('[RVFU IPC API] ⚠️ Errore navigazione:', errorDescription);
                          // Non rifiutare, potrebbe essere un redirect o un errore normale
                          resolve();
                        };

                        persistentApiWindow.webContents.once('did-finish-load', onLoad);
                        persistentApiWindow.webContents.once('did-fail-load', onFail);
                        persistentApiWindow.loadURL(originalRequestData.url);
                      });

                      // Attendi un po' per assicurarsi che il cookie sia impostato
                      await new Promise(resolve => setTimeout(resolve, 2000));

                      // ✅ Verifica se il cookie amFilterCDSSORequest è stato impostato
                      // E anche se il cookie am-auth-jwt è presente (indica CDSSO già completato)
                      const cookiesAfter = await session.defaultSession.cookies.get({ domain: 'formazione.ilportaledeltrasporto.it' });
                      // ✅ FIX: Verifica cookie critici dopo navigazione (come in Chrome)
                      const cookieNamesAfter = cookiesAfter.map(c => c.name);
                      const hasAgentAuthnTxX = cookieNamesAfter.some(name => name.startsWith('agent-authn-tx-x-'));
                      const hasAmlbcookie = cookieNamesAfter.includes('amlbcookie');
                      const hasAgentAuthnTx = cookieNamesAfter.some(name => name.startsWith('agent-authn-tx-'));

                      console.log('[RVFU IPC API] 🔍 Cookie DOPO navigazione:', {
                        count: cookiesAfter.length,
                        names: cookieNamesAfter,
                        hasAmFilter: cookiesAfter.some(c => c.name === 'amFilterCDSSORequest'),
                        hasAmAuthJwt: cookiesAfter.some(c => c.name === 'am-auth-jwt'),
                        hasIPlanet: cookiesAfter.some(c => c.name === 'iPlanetDirectoryPro'),
                        hasAgentAuthnTxX: hasAgentAuthnTxX,
                        hasAmlbcookie: hasAmlbcookie,
                        hasAgentAuthnTx: hasAgentAuthnTx
                      });

                      // ⚠️ Avvisa se mancano cookie critici
                      if (!hasAgentAuthnTxX) {
                        console.warn('[RVFU IPC API] ⚠️ Cookie agent-authn-tx-x-* NON trovato dopo navigazione!');
                        console.warn('[RVFU IPC API] ⚠️ Questo potrebbe causare 403 Forbidden');
                      }
                      if (!hasAmlbcookie) {
                        console.warn('[RVFU IPC API] ⚠️ Cookie amlbcookie NON trovato dopo navigazione!');
                        console.warn('[RVFU IPC API] ⚠️ Questo potrebbe causare 403 Forbidden (sticky session)');
                      }

                      const amFilterCookie = cookiesAfter.find(c => c.name === 'amFilterCDSSORequest');
                      const amAuthJwtCookie = cookiesAfter.find(c => c.name === 'am-auth-jwt');

                      if (amFilterCookie) {
                        console.log('[RVFU IPC API] ✅ Cookie amFilterCDSSORequest trovato dopo navigazione!');
                        console.log('[RVFU IPC API] 🔍 Valore cookie (primi 100 char):', amFilterCookie.value.substring(0, 100) + '...');
                      } else {
                        console.warn('[RVFU IPC API] ⚠️ Cookie amFilterCDSSORequest ancora non trovato dopo navigazione');
                        console.log('[RVFU IPC API] ℹ️ FASE 4 - Secondo ForgeRock, questo cookie è temporaneo e viene rimosso dopo CDSSO');
                        console.log('[RVFU IPC API] ℹ️ FASE 4 - Se il CDSSO è già completato (cookie am-auth-jwt presente), questo cookie non è necessario');

                        // ✅ FASE 4: NON creare il cookie manualmente se non è stato impostato dal server
                        // Secondo ForgeRock, questo cookie dovrebbe essere impostato dal Java Agent durante la navigazione iniziale
                        // Se non è presente, significa che il server non lo ha impostato, quindi non dovremmo crearlo manualmente
                        // Il valore placeholder potrebbe causare 403 Forbidden
                        console.log('[RVFU IPC API] 🔍 FASE 4 - Verificando se esiste un cookie amFilterCDSSORequest con valore placeholder da rimuovere...');

                        try {
                          // Verifica se c'è un cookie amFilterCDSSORequest con valore placeholder
                          const allCookiesForDomain = await session.defaultSession.cookies.get({
                            domain: 'formazione.ilportaledeltrasporto.it'
                          });
                          const existingAmFilter = allCookiesForDomain.find(c => c.name === 'amFilterCDSSORequest');

                          if (existingAmFilter) {
                            if (existingAmFilter.value === 'cdsso-request') {
                              console.warn('[RVFU IPC API] ⚠️ FASE 4 - Cookie amFilterCDSSORequest trovato con valore placeholder!');
                              console.warn('[RVFU IPC API] ⚠️ FASE 4 - Rimuovendo cookie amFilterCDSSORequest con valore placeholder (potrebbe causare 403)...');
                              try {
                                await session.defaultSession.cookies.remove(
                                  'https://formazione.ilportaledeltrasporto.it/',
                                  'amFilterCDSSORequest'
                                );
                                console.log('[RVFU IPC API] ✅ FASE 4 - Cookie amFilterCDSSORequest con valore placeholder rimosso');
                              } catch (removeError) {
                                console.error('[RVFU IPC API] ❌ FASE 4 - Errore rimozione cookie amFilterCDSSORequest:', removeError);
                              }
                            } else {
                              console.log('[RVFU IPC API] ✅ FASE 4 - Cookie amFilterCDSSORequest esistente con valore valido (non placeholder):', {
                                value: existingAmFilter.value,
                                valueLength: existingAmFilter.value.length,
                                valuePrefix: existingAmFilter.value.substring(0, 50) + '...',
                                domain: existingAmFilter.domain,
                                path: existingAmFilter.path
                              });
                            }
                          } else {
                            console.log('[RVFU IPC API] ℹ️ FASE 4 - Cookie amFilterCDSSORequest non trovato (normale dopo CDSSO completato)');
                          }
                        } catch (cookieError) {
                          console.error('[RVFU IPC API] ❌ FASE 4 - Errore verifica cookie amFilterCDSSORequest:', cookieError);
                        }
                      }

                      // ✅ Se il cookie am-auth-jwt è presente, il CDSSO è già completato!
                      if (amAuthJwtCookie) {
                        console.log('[RVFU IPC API] ✅ Cookie am-auth-jwt trovato! CDSSO già completato!');
                        console.log('[RVFU IPC API] 🔍 Saltando iniezione form CDSSO e riprovando direttamente la richiesta originale...');

                        // ✅ FIX CRITICO: Salva l'URL redirect dall'URL corrente o normalizza l'URL originale
                        const currentUrlAfterNav = persistentApiWindow.webContents.getURL();
                        if (currentUrlAfterNav && currentUrlAfterNav.includes('formazione.ilportaledeltrasporto.it') &&
                          !currentUrlAfterNav.includes('/agent/cdsso-oauth2') &&
                          !currentUrlAfterNav.includes('ssoformazione')) {
                          // L'URL corrente è già l'URL redirect dopo CDSSO
                          const normalizedCurrentUrl = currentUrlAfterNav.replace(/:443\//g, '/').replace(/:443$/, '');
                          if (!originalRequestData._cdssoRedirectUrl) {
                            originalRequestData._cdssoRedirectUrl = normalizedCurrentUrl;
                            console.log('[RVFU IPC API] 🔧 URL redirect salvato dall\'URL corrente dopo navigazione:', normalizedCurrentUrl);
                          }
                        } else {
                          // Normalizza l'URL originale e usalo come URL redirect
                          const normalizedOriginalUrl = originalRequestData.url.replace(/:443\//g, '/').replace(/:443$/, '');
                          if (!originalRequestData._cdssoRedirectUrl) {
                            originalRequestData._cdssoRedirectUrl = normalizedOriginalUrl;
                            console.log('[RVFU IPC API] 🔧 URL redirect salvato normalizzando URL originale:', normalizedOriginalUrl);
                          }
                        }

                        // ✅ Salva l'URL redirect anche in pending.originalRequest
                        if (pending.originalRequest) {
                          if (!pending.originalRequest._cdssoRedirectUrl && originalRequestData._cdssoRedirectUrl) {
                            pending.originalRequest._cdssoRedirectUrl = originalRequestData._cdssoRedirectUrl;
                            console.log('[RVFU IPC API] 🔧 URL redirect salvato anche in pending.originalRequest (dopo navigazione):', originalRequestData._cdssoRedirectUrl);
                          }
                        }

                        // Salta l'iniezione del form e riprova direttamente la richiesta originale
                        // (il codice dopo questo blocco gestirà il retry)
                        // Ma dobbiamo uscire da questo blocco per evitare di iniettare il form
                        // Impostiamo un flag per indicare che il CDSSO è già completato
                        originalRequestData._cdssoAlreadyCompleted = true;
                      }
                    } catch (navError) {
                      console.error('[RVFU IPC API] ❌ Errore durante navigazione all\'URL originale:', navError);
                      if (interceptor) {
                        try {
                          interceptor.dispose();
                        } catch (e) {
                          console.warn('[RVFU IPC API] ⚠️ Errore dispose interceptor:', e);
                        }
                      }
                      console.warn('[RVFU IPC API] ⚠️ Procedo comunque con iniezione form CDSSO');
                    }

                    // ✅ Verifica URL corrente della finestra persistente
                    const currentUrl = persistentApiWindow.webContents.getURL();
                    console.log('[RVFU IPC API] 🔍 URL corrente finestra persistente:', currentUrl);

                    // Se la pagina corrente non è su formazione.ilportaledeltrasporto.it, naviga alla home
                    if (!currentUrl.includes('formazione.ilportaledeltrasporto.it')) {
                      console.log('[RVFU IPC API] 🔄 Navigazione alla home RVFU per stabilire sessione...');
                      await new Promise((resolve) => {
                        const onLoad = () => {
                          persistentApiWindow.webContents.removeListener('did-finish-load', onLoad);
                          resolve();
                        };
                        persistentApiWindow.webContents.once('did-finish-load', onLoad);
                        persistentApiWindow.loadURL('https://formazione.ilportaledeltrasporto.it/');
                      });
                      await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                    // ✅ Verifica se il CDSSO è già completato (cookie am-auth-jwt presente)
                    // Se sì, saltiamo l'iniezione del form e riproviamo direttamente la richiesta originale
                    const cookiesBeforeForm = await session.defaultSession.cookies.get({ domain: 'formazione.ilportaledeltrasporto.it' });
                    const hasAmAuthJwtBefore = cookiesBeforeForm.some(c => c.name === 'am-auth-jwt');

                    if (hasAmAuthJwtBefore || originalRequestData._cdssoAlreadyCompleted) {
                      console.log('[RVFU IPC API] ✅ CDSSO già completato (cookie am-auth-jwt presente), saltando iniezione form...');
                      console.log('[RVFU IPC API] 🔄 Riprovando direttamente la richiesta originale...');

                      // ✅ FIX CRITICO: Se il CDSSO è già completato, salva l'URL redirect dall'URL corrente
                      // o normalizza l'URL originale per usarlo come URL redirect
                      const currentUrl = persistentApiWindow.webContents.getURL();
                      if (currentUrl && currentUrl.includes('formazione.ilportaledeltrasporto.it') &&
                        !currentUrl.includes('/agent/cdsso-oauth2') &&
                        !currentUrl.includes('ssoformazione')) {
                        // L'URL corrente è già l'URL redirect dopo CDSSO
                        const normalizedCurrentUrl = currentUrl.replace(/:443\//g, '/').replace(/:443$/, '');
                        if (!originalRequestData._cdssoRedirectUrl) {
                          originalRequestData._cdssoRedirectUrl = normalizedCurrentUrl;
                          console.log('[RVFU IPC API] 🔧 URL redirect salvato dall\'URL corrente (CDSSO già completato):', normalizedCurrentUrl);
                        }
                      } else {
                        // Normalizza l'URL originale e usalo come URL redirect
                        const normalizedOriginalUrl = originalRequestData.url.replace(/:443\//g, '/').replace(/:443$/, '');
                        if (!originalRequestData._cdssoRedirectUrl) {
                          originalRequestData._cdssoRedirectUrl = normalizedOriginalUrl;
                          console.log('[RVFU IPC API] 🔧 URL redirect salvato normalizzando URL originale (CDSSO già completato):', normalizedOriginalUrl);
                        }
                      }

                      // ✅ Salva l'URL redirect anche in pending.originalRequest
                      if (pending.originalRequest) {
                        if (!pending.originalRequest._cdssoRedirectUrl && originalRequestData._cdssoRedirectUrl) {
                          pending.originalRequest._cdssoRedirectUrl = originalRequestData._cdssoRedirectUrl;
                          console.log('[RVFU IPC API] 🔧 URL redirect salvato anche in pending.originalRequest:', originalRequestData._cdssoRedirectUrl);
                        }
                      }

                      // Salta l'iniezione del form e vai direttamente al retry
                      // Il codice dopo questo blocco gestirà il retry automaticamente
                    } else {
                      // ✅ SECONDO FORGEROCK: Ora inietta il form CDSSO nella pagina corrente e fai il POST
                      // Questo garantisce che i cookie di sessione (incluso amFilterCDSSORequest) siano disponibili
                      console.log('[RVFU IPC API] 🔐 STEP 2: Iniezione form CDSSO nella pagina corrente...');
                      console.log('[RVFU IPC API] 🔐 Form action:', formAction);
                      console.log('[RVFU IPC API] 🔐 ID token length:', idToken.length);
                      console.log('[RVFU IPC API] 🔐 ID token prefix:', idToken.substring(0, 50) + '...');

                      // ✅ IMPORTANTE: Verifica e imposta il session cookie SSO PRIMA del POST
                      // Il cookie deve essere disponibile per formazione.ilportaledeltrasporto.it
                      const apiDomain = 'formazione.ilportaledeltrasporto.it';
                      const ssoDomain = 'ssoformazione.ilportaledeltrasporto.it';

                      // Recupera il cookie dalla sessione (pdtsso-form ha priorità)
                      const cookies = await session.defaultSession.cookies.get({ domain: ssoDomain });
                      const parentCookiesCSSSO = await session.defaultSession.cookies.get({ domain: '.ilportaledeltrasporto.it' });
                      const allCdsso = [...cookies, ...parentCookiesCSSSO];
                      const ssoCookieCdsso = allCdsso.find(c => c.name === 'pdtsso-form') || allCdsso.find(c => c.name === 'iPlanetDirectoryPro');

                      if (ssoCookieCdsso) {
                        console.log(`[RVFU IPC API] 🔐 Cookie ${ssoCookieCdsso.name} trovato nella sessione, impostazione per dominio API...`);

                        // Imposta il cookie per il dominio API (formazione.ilportaledeltrasporto.it)
                        try {
                          await session.defaultSession.cookies.set({
                            url: `https://${apiDomain}/`,
                            name: ssoCookieCdsso.name,
                            value: ssoCookieCdsso.value,
                            domain: '.ilportaledeltrasporto.it',
                            path: '/',
                            secure: true,
                            httpOnly: true,
                            sameSite: 'lax'
                          });
                          console.log(`[RVFU IPC API] ✅ Cookie ${ssoCookieCdsso.name} impostato per dominio API prima del CDSSO`);
                        } catch (cookieError) {
                          console.error('[RVFU IPC API] ❌ Errore impostazione cookie per dominio API:', cookieError);
                        }
                      } else {
                        console.warn('[RVFU IPC API] ⚠️ Cookie SSO NON trovato nella sessione!');
                      }

                      // ✅ Intercetta TUTTI i console.log durante la navigazione CDSSO
                      const cdssoLogs = [];
                      const logInterceptor = (event, level, message, line, sourceId) => {
                        if (message && (message.includes('CDSSO') || message.includes('RVFU') || message.includes('agent'))) {
                          cdssoLogs.push({ level, message, line, sourceId, timestamp: new Date().toISOString() });
                          console.log('[RVFU IPC API] 📋 Log intercettato:', message.substring(0, 200));
                        }
                      };
                      persistentApiWindow.webContents.on('console-message', logInterceptor);

                      // ✅ Intercetta anche gli eventi di navigazione per log dettagliati
                      const navigationLogs = [];
                      const navigationLogger = (event, url) => {
                        navigationLogs.push({ url, timestamp: new Date().toISOString() });
                        console.log('[RVFU IPC API] 🔄 Navigazione CDSSO:', url);
                      };
                      persistentApiWindow.webContents.on('did-navigate', navigationLogger);

                      // Inietta il form nella pagina corrente e lo invia automaticamente
                      await persistentApiWindow.webContents.executeJavaScript(`
                      (function() {
                        // ✅ Salva log prima della navigazione
                        window.__rvfuCdssoLogs = window.__rvfuCdssoLogs || [];
                        window.__rvfuCdssoLogs.push('Inizio iniezione form CDSSO');
                        
                        // Rimuovi eventuali form CDSSO precedenti
                        const existingForm = document.getElementById('rvfu-cdsso-form');
                        if (existingForm) {
                          existingForm.remove();
                          window.__rvfuCdssoLogs.push('Form CDSSO precedente rimosso');
                        }
                        
                        // Crea il form CDSSO
                        const form = document.createElement('form');
                        form.id = 'rvfu-cdsso-form';
                        form.method = 'POST';
                        form.action = ${JSON.stringify(formAction)};
                        form.style.display = 'none';
                        
                        // Aggiungi l'id_token
                        const idTokenInput = document.createElement('input');
                        idTokenInput.type = 'hidden';
                        idTokenInput.name = 'id_token';
                        idTokenInput.value = ${JSON.stringify(idToken)};
                        form.appendChild(idTokenInput);
                        
                        // Aggiungi il form al body
                        document.body.appendChild(form);
                        window.__rvfuCdssoLogs.push('Form CDSSO aggiunto al body');
                        
                        // ✅ Log dettagliati PRIMA del submit
                        console.log('[RVFU CDSSO] ========== INIZIO CDSSO ==========');
                        console.log('[RVFU CDSSO] Form creato, submit in corso...');
                        console.log('[RVFU CDSSO] Form action ORIGINALE (NON normalizzato):', ${JSON.stringify(formAction)});
                        console.log('[RVFU CDSSO] ⚠️ IMPORTANTE: Usando URL esatto dal form per preservare flow CDSSO');
                        console.log('[RVFU CDSSO] ID token length:', ${idToken.length});
                        console.log('[RVFU CDSSO] ID token prefix:', ${JSON.stringify(idToken.substring(0, 50))} + '...');
                        console.log('[RVFU CDSSO] Cookie disponibili:', document.cookie ? document.cookie.split(';').length : 0);
                        console.log('[RVFU CDSSO] Has iPlanetDirectoryPro:', document.cookie ? document.cookie.includes('iPlanetDirectoryPro') : false);
                        console.log('[RVFU CDSSO] Current URL:', window.location.href);
                        console.log('[RVFU CDSSO] Form method:', form.method);
                        console.log('[RVFU CDSSO] Form action starts with http://:', ${JSON.stringify(formAction)}.startsWith('http://'));
                        console.log('[RVFU CDSSO] Form action contains :80:', ${JSON.stringify(formAction)}.includes(':80'));
                        window.__rvfuCdssoLogs.push('Log dettagliati prima del submit');
                        
                        // Invia il form
                        window.__rvfuCdssoLogs.push('Submit form in corso...');
                        console.log('[RVFU CDSSO] ⚡ SUBMIT FORM CDSSO...');
                        form.submit();
                        window.__rvfuCdssoLogs.push('Form submit chiamato');
                        console.log('[RVFU CDSSO] ========== FINE CDSSO SUBMIT ==========');
                        
                        return window.__rvfuCdssoLogs;
                      })();
                    `).then(logs => {
                        console.log('[RVFU IPC API] 📋 Log dalla pagina prima del submit:', logs);
                      }).catch(err => {
                        console.error('[RVFU IPC API] ❌ Errore iniezione form CDSSO:', err);
                      });

                      // Apri DevTools per vedere il processo
                      persistentApiWindow.webContents.openDevTools({ mode: 'bottom' });

                      // ✅ Attendi che il form CDSSO venga inviato e la navigazione completi
                      // Il form viene inviato dalla pagina corrente, quindi i cookie sono disponibili
                      await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                          persistentApiWindow.webContents.removeListener('did-finish-load', onLoad);
                          persistentApiWindow.webContents.removeListener('did-fail-load', onFail);
                          persistentApiWindow.webContents.removeListener('did-navigate', onNavigate);
                          persistentApiWindow.webContents.removeListener('did-navigate-in-page', onNavigateInPage);
                          console.warn('[RVFU IPC API] ⚠️ Timeout navigazione CDSSO (30s) - considerando completato');
                          // Anche se timeout, proviamo comunque a riprovare la richiesta
                          resolve();
                        }, 30000); // 30 secondi timeout

                        let formSubmitted = false;
                        let cdssoCompleted = false;

                        // Listener per quando la pagina finisce di caricare (dopo il POST)
                        const onLoad = () => {
                          const currentUrl = persistentApiWindow.webContents.getURL();
                          console.log('[RVFU IPC API] 📄 Pagina caricata dopo CDSSO, URL:', currentUrl);
                          console.log('[RVFU IPC API] 📋 Log intercettati durante navigazione:', cdssoLogs.length);
                          console.log('[RVFU IPC API] 🔄 Navigazioni rilevate:', navigationLogs.length);

                          // ✅ Recupera i log salvati nella pagina (se disponibili)
                          persistentApiWindow.webContents.executeJavaScript(`
                          (function() {
                            return {
                              savedLogs: window.__rvfuCdssoLogs || [],
                              currentUrl: window.location.href,
                              cookieString: document.cookie || '',
                              cookieCount: document.cookie ? document.cookie.split(';').filter(c => c.trim()).length : 0
                            };
                          })();
                        `).then(savedData => {
                            console.log('[RVFU IPC API] 📋 Log salvati nella pagina:', savedData.savedLogs);
                            // ✅ FIX: Verifica cookie critici dopo CDSSO (come in Chrome)
                            const cookieString = savedData.cookieString || '';
                            const cookieNames = cookieString.split(';').map(c => c.split('=')[0].trim()).filter(Boolean);
                            const hasAgentAuthnTxX = cookieNames.some(name => name.startsWith('agent-authn-tx-x-'));
                            const hasAmlbcookie = cookieNames.includes('amlbcookie');
                            const hasAgentAuthnTx = cookieNames.some(name => name.startsWith('agent-authn-tx-'));

                            console.log('[RVFU IPC API] 🍪 Cookie dopo CDSSO:', {
                              count: savedData.cookieCount,
                              hasIPlanet: cookieString.includes('iPlanetDirectoryPro'),
                              hasAmAuthJwt: cookieString.includes('am-auth-jwt'),
                              hasAgentAuthnTxX: hasAgentAuthnTxX,
                              hasAmlbcookie: hasAmlbcookie,
                              hasAgentAuthnTx: hasAgentAuthnTx,
                              cookieNames: cookieNames,
                              cookieString: cookieString.substring(0, 200) + '...'
                            });

                            // ⚠️ Avvisa se mancano cookie critici
                            if (!hasAgentAuthnTxX) {
                              console.warn('[RVFU IPC API] ⚠️ Cookie agent-authn-tx-x-* NON trovato dopo CDSSO!');
                              console.warn('[RVFU IPC API] ⚠️ Questo potrebbe causare 403 Forbidden');
                            }
                            if (!hasAmlbcookie) {
                              console.warn('[RVFU IPC API] ⚠️ Cookie amlbcookie NON trovato dopo CDSSO!');
                              console.warn('[RVFU IPC API] ⚠️ Questo potrebbe causare 403 Forbidden (sticky session)');
                            }
                          }).catch(err => {
                            console.warn('[RVFU IPC API] ⚠️ Impossibile recuperare log salvati:', err.message);
                          });

                          // ✅ SECONDO FORGEROCK: Dopo il POST, il server potrebbe restituire HTML invece di redirect
                          // Verifica il contenuto della pagina per capire se il CDSSO è completato
                          persistentApiWindow.webContents.executeJavaScript(`
                          (function() {
                            const bodyText = document.body ? document.body.innerText : '';
                            const bodyHTML = document.body ? document.body.innerHTML.substring(0, 1000) : '';
                            const title = document.title || '';
                            const hasForm = document.forms && document.forms.length > 0;
                            const hasError = bodyText.toLowerCase().includes('error') || 
                                           bodyText.toLowerCase().includes('forbidden') ||
                                           bodyText.toLowerCase().includes('403') ||
                                           bodyText.toLowerCase().includes('access denied');
                            const hasSuccess = bodyText.toLowerCase().includes('success') ||
                                             bodyText.toLowerCase().includes('completato') ||
                                             bodyText.toLowerCase().includes('autenticato');
                            
                            // ✅ Verifica se c'è un redirect automatico o un meta refresh
                            const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
                            const hasRedirect = metaRefresh || 
                                              bodyHTML.includes('window.location') ||
                                              bodyHTML.includes('location.href') ||
                                              bodyHTML.includes('location.replace');
                            
                            return {
                              url: window.location.href,
                              title: title,
                              bodyText: bodyText.substring(0, 500),
                              bodyHTML: bodyHTML,
                              hasForm: hasForm,
                              formCount: document.forms ? document.forms.length : 0,
                              hasError: hasError,
                              hasSuccess: hasSuccess,
                              hasRedirect: hasRedirect,
                              metaRefresh: metaRefresh ? metaRefresh.content : null,
                              cookieCount: document.cookie ? document.cookie.split(';').filter(c => c.trim()).length : 0,
                              hasIPlanetCookie: document.cookie ? document.cookie.includes('iPlanetDirectoryPro') : false,
                              cookieString: document.cookie || ''
                            };
                          })();
                        `).then(pageInfo => {
                            console.log('[RVFU IPC API] 📄 ========== ANALISI PAGINA DOPO CDSSO ==========');
                            console.log('[RVFU IPC API] 📄 URL:', pageInfo.url);
                            console.log('[RVFU IPC API] 📄 Title:', pageInfo.title);
                            console.log('[RVFU IPC API] 📄 Body text (primi 500 char):', pageInfo.bodyText);
                            console.log('[RVFU IPC API] 📄 Has form:', pageInfo.hasForm, '(count:', pageInfo.formCount + ')');
                            console.log('[RVFU IPC API] 📄 Has error:', pageInfo.hasError);
                            console.log('[RVFU IPC API] 📄 Has success:', pageInfo.hasSuccess);
                            console.log('[RVFU IPC API] 📄 Has redirect:', pageInfo.hasRedirect);
                            if (pageInfo.metaRefresh) {
                              console.log('[RVFU IPC API] 📄 Meta refresh:', pageInfo.metaRefresh);
                            }
                            console.log('[RVFU IPC API] 📄 Cookie count:', pageInfo.cookieCount);
                            console.log('[RVFU IPC API] 📄 Has iPlanetDirectoryPro:', pageInfo.hasIPlanetCookie);
                            console.log('[RVFU IPC API] 📄 Cookie string (primi 200 char):', pageInfo.cookieString.substring(0, 200));
                            console.log('[RVFU IPC API] 📄 ============================================');

                            // Se la pagina è tornata a formazione.ilportaledeltrasporto.it (non /agent/cdsso-oauth2), il CDSSO è completato
                            if (currentUrl.includes('formazione.ilportaledeltrasporto.it') &&
                              !currentUrl.includes('/agent/cdsso-oauth2')) {
                              console.log('[RVFU IPC API] ✅ CDSSO completato - pagina tornata a RVFU');
                              cdssoCompleted = true;
                              clearTimeout(timeout);
                              persistentApiWindow.webContents.removeListener('did-finish-load', onLoad);
                              persistentApiWindow.webContents.removeListener('did-fail-load', onFail);
                              persistentApiWindow.webContents.removeListener('did-navigate', onNavigate);
                              persistentApiWindow.webContents.removeListener('did-navigate-in-page', onNavigateInPage);
                              resolve();
                            } else if (currentUrl.includes('/agent/cdsso-oauth2')) {
                              // Se siamo ancora su /agent/cdsso-oauth2, verifica se c'è un errore o se il CDSSO è completato
                              if (pageInfo.hasError) {
                                console.error('[RVFU IPC API] ❌ Errore nella pagina CDSSO:', pageInfo.bodyText);
                                // Non risolviamo ancora, potrebbe essere un errore temporaneo
                              } else if (pageInfo.hasIPlanetCookie && !pageInfo.hasForm) {
                                // Se c'è il cookie iPlanetDirectoryPro e non c'è un form, il CDSSO potrebbe essere completato
                                console.log('[RVFU IPC API] ✅ Cookie iPlanetDirectoryPro presente, CDSSO probabilmente completato');
                                // Aspetta un po' per vedere se c'è un redirect automatico
                                setTimeout(() => {
                                  const newUrl = persistentApiWindow.webContents.getURL();
                                  if (newUrl !== currentUrl) {
                                    console.log('[RVFU IPC API] ✅ Redirect automatico rilevato:', newUrl);
                                    cdssoCompleted = true;
                                    clearTimeout(timeout);
                                    persistentApiWindow.webContents.removeListener('did-finish-load', onLoad);
                                    persistentApiWindow.webContents.removeListener('did-fail-load', onFail);
                                    persistentApiWindow.webContents.removeListener('did-navigate', onNavigate);
                                    persistentApiWindow.webContents.removeListener('did-navigate-in-page', onNavigateInPage);
                                    resolve();
                                  }
                                }, 3000);
                              }
                            }
                          }).catch(err => {
                            console.error('[RVFU IPC API] ❌ Errore lettura informazioni pagina:', err);
                          });
                        };

                        // Listener per navigazione completa (dopo il POST)
                        const onNavigate = (event, url) => {
                          console.log('[RVFU IPC API] 🔄 Navigazione rilevata:', url);

                          if (url && url.includes('/agent/cdsso-oauth2')) {
                            console.log('[RVFU IPC API] 🔐 POST CDSSO inviato a:', url);
                            formSubmitted = true;
                          } else if (formSubmitted && url &&
                            url.includes('formazione.ilportaledeltrasporto.it') &&
                            !url.includes('/agent/cdsso-oauth2')) {
                            // Dopo il POST, se la navigazione va a formazione.ilportaledeltrasporto.it, il CDSSO è completato
                            console.log('[RVFU IPC API] ✅ Navigazione CDSSO completata, URL finale:', url);
                            cdssoCompleted = true;
                            clearTimeout(timeout);
                            persistentApiWindow.webContents.removeListener('did-finish-load', onLoad);
                            persistentApiWindow.webContents.removeListener('did-fail-load', onFail);
                            persistentApiWindow.webContents.removeListener('did-navigate', onNavigate);
                            persistentApiWindow.webContents.removeListener('did-navigate-in-page', onNavigateInPage);
                            resolve();
                          }
                        };

                        // Listener per navigazione in-page (hash change, etc.)
                        const onNavigateInPage = (event, url) => {
                          console.log('[RVFU IPC API] 🔄 Navigazione in-page:', url);
                        };

                        const onFail = (event, errorCode, errorDescription, validatedURL) => {
                          console.log('[RVFU IPC API] ⚠️ did-fail-load:', {
                            errorCode,
                            errorDescription,
                            validatedURL,
                            formSubmitted
                          });

                          // ERR_ABORTED (-3) può essere normale dopo un POST redirect
                          if (errorCode === -3 && formSubmitted) {
                            console.log('[RVFU IPC API] ⚠️ Navigazione interrotta dopo POST (potrebbe essere normale)');
                            // Aspettiamo un po' e poi risolviamo (il CDSSO potrebbe essere completato)
                            setTimeout(() => {
                              if (!cdssoCompleted) {
                                console.log('[RVFU IPC API] ✅ CDSSO probabilmente completato (ERR_ABORTED dopo POST)');
                                clearTimeout(timeout);
                                persistentApiWindow.webContents.removeListener('did-finish-load', onLoad);
                                persistentApiWindow.webContents.removeListener('did-fail-load', onFail);
                                persistentApiWindow.webContents.removeListener('did-navigate', onNavigate);
                                persistentApiWindow.webContents.removeListener('did-navigate-in-page', onNavigateInPage);
                                resolve();
                              }
                            }, 3000);
                          } else if (errorCode !== -3) {
                            // Altri errori sono problematici
                            clearTimeout(timeout);
                            persistentApiWindow.webContents.removeListener('did-finish-load', onLoad);
                            persistentApiWindow.webContents.removeListener('did-fail-load', onFail);
                            persistentApiWindow.webContents.removeListener('did-navigate', onNavigate);
                            persistentApiWindow.webContents.removeListener('did-navigate-in-page', onNavigateInPage);
                            console.error('[RVFU IPC API] ❌ Errore navigazione CDSSO:', errorCode, errorDescription);
                            reject(new Error(`Navigazione CDSSO fallita: ${errorDescription} (code: ${errorCode})`));
                          }
                        };

                        // Attendi la navigazione dopo il POST
                        persistentApiWindow.webContents.on('did-navigate', onNavigate);
                        persistentApiWindow.webContents.on('did-navigate-in-page', onNavigateInPage);

                        // Attendi che la pagina finisca di caricare dopo il POST
                        persistentApiWindow.webContents.on('did-finish-load', onLoad);

                        // Attendi eventuali errori
                        persistentApiWindow.webContents.on('did-fail-load', onFail);

                        // Attendi un po' per dare tempo al form di essere inviato
                        setTimeout(() => {
                          if (!formSubmitted) {
                            console.log('[RVFU IPC API] ⚠️ Form CDSSO potrebbe non essere stato inviato, verificando...');
                            persistentApiWindow.webContents.executeJavaScript(`
                            (function() {
                              const form = document.getElementById('rvfu-cdsso-form');
                              if (form) {
                                console.log('[RVFU CDSSO] Form trovato, submit manuale...');
                                form.submit();
                                return true;
                              }
                              return false;
                            })();
                          `).then(submitted => {
                              if (submitted) {
                                console.log('[RVFU IPC API] ✅ Form CDSSO inviato manualmente');
                              } else {
                                console.warn('[RVFU IPC API] ⚠️ Form CDSSO non trovato nella pagina');
                              }
                            }).catch(err => console.error('[RVFU IPC API] Errore submit manuale:', err));
                          }
                        }, 2000);
                      });
                    } // Fine blocco else (iniezione form CDSSO)

                    // Dopo il CDSSO (o se già completato), riprova la richiesta originale
                    console.log('[RVFU IPC API] 🔄 Riprova richiesta originale dopo CDSSO...');

                    // ✅ FASE 4: DEBUG COMPLETO - Verifica tutti i cookie, token, URL, header
                    console.log('\n=== [RVFU IPC API] FASE 4: DEBUG COMPLETO 403 FORBIDDEN ===');

                    // 1. Verifica tutti i cookie presenti
                    try {
                      const allCookies = await session.defaultSession.cookies.get({
                        domain: '.ilportaledeltrasporto.it'
                      });
                      console.log('[RVFU IPC API] 🔍 FASE 4 - Tutti i cookie:', {
                        count: allCookies.length,
                        cookies: allCookies.map(c => ({
                          name: c.name,
                          domain: c.domain,
                          path: c.path,
                          secure: c.secure,
                          httpOnly: c.httpOnly,
                          sameSite: c.sameSite,
                          valueLength: c.value.length,
                          valuePrefix: c.value.substring(0, 50) + (c.value.length > 50 ? '...' : ''),
                          expirationDate: c.expirationDate ? new Date(c.expirationDate * 1000).toISOString() : null
                        }))
                      });

                      // Verifica cookie specifici
                      const iPlanetCookie = allCookies.find(c => c.name === 'iPlanetDirectoryPro');
                      const amAuthJwtCookie = allCookies.find(c => c.name === 'am-auth-jwt');
                      const amFilterCookie = allCookies.find(c => c.name === 'amFilterCDSSORequest');

                      console.log('[RVFU IPC API] 🔍 FASE 4 - Cookie critici:', {
                        iPlanetDirectoryPro: iPlanetCookie ? {
                          domain: iPlanetCookie.domain,
                          path: iPlanetCookie.path,
                          valueLength: iPlanetCookie.value.length,
                          valuePrefix: iPlanetCookie.value.substring(0, 50) + '...'
                        } : 'NON TROVATO',
                        amAuthJwt: amAuthJwtCookie ? {
                          domain: amAuthJwtCookie.domain,
                          path: amAuthJwtCookie.path,
                          valueLength: amAuthJwtCookie.value.length,
                          valuePrefix: amAuthJwtCookie.value.substring(0, 50) + '...'
                        } : 'NON TROVATO',
                        amFilterCDSSORequest: amFilterCookie ? {
                          domain: amFilterCookie.domain,
                          path: amFilterCookie.path,
                          value: amFilterCookie.value,
                          valueLength: amFilterCookie.value.length
                        } : 'NON TROVATO'
                      });
                    } catch (cookieError) {
                      console.error('[RVFU IPC API] ❌ FASE 4 - Errore verifica cookie:', cookieError);
                    }

                    // 2. Verifica token idToken
                    try {
                      const authHeader = originalRequestData.headers?.Authorization || originalRequest.headers?.Authorization;
                      if (authHeader) {
                        const token = authHeader.replace('Bearer ', '');
                        const parts = token.split('.');
                        if (parts.length === 3) {
                          try {
                            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
                            const exp = payload.exp ? new Date(payload.exp * 1000) : null;
                            const now = new Date();
                            const isExpired = exp ? exp < now : false;
                            const expiresIn = exp ? Math.floor((exp.getTime() - now.getTime()) / 1000) : null;

                            // ✅ FASE 4: Debug completo del token con tutti i claim
                            const allClaims = Object.keys(payload).reduce((acc, key) => {
                              if (key === 'exp' || key === 'iat' || key === 'auth_time') {
                                acc[key] = payload[key] ? new Date(payload[key] * 1000).toISOString() : null;
                              } else if (typeof payload[key] === 'object' && payload[key] !== null) {
                                acc[key] = JSON.stringify(payload[key]).substring(0, 200) + '...';
                              } else {
                                acc[key] = payload[key];
                              }
                              return acc;
                            }, {});

                            console.log('[RVFU IPC API] 🔍 FASE 4 - Token idToken:', {
                              exp: exp?.toISOString(),
                              now: now.toISOString(),
                              isExpired,
                              expiresIn: expiresIn !== null ? `${expiresIn}s` : null,
                              aud: payload.aud,
                              iss: payload.iss,
                              sub: payload.sub ? payload.sub.substring(0, 50) + '...' : null,
                              iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
                              tokenLength: token.length,
                              tokenPrefix: token.substring(0, 50) + '...',
                              allClaims: allClaims
                            });

                            // ✅ FASE 4: Verifica audience del token
                            const expectedAud = 'formazioneAgent'; // Secondo documentazione ForgeRock
                            if (payload.aud && payload.aud !== expectedAud) {
                              console.warn('[RVFU IPC API] ⚠️ FASE 4 - Token idToken ha audience diversa da quella attesa!', {
                                expected: expectedAud,
                                actual: payload.aud,
                                note: 'Questo potrebbe causare 403 Forbidden se il server verifica l\'audience'
                              });
                            } else if (payload.aud === expectedAud) {
                              console.log('[RVFU IPC API] ✅ FASE 4 - Token idToken ha audience corretta:', payload.aud);
                            }

                            // ✅ FASE 4: Verifica altri claim importanti
                            if (payload.azp && payload.azp !== 'formazioneAgent') {
                              console.warn('[RVFU IPC API] ⚠️ FASE 4 - Token idToken ha azp diverso:', {
                                azp: payload.azp,
                                expected: 'formazioneAgent'
                              });
                            }

                            if (isExpired) {
                              console.error('[RVFU IPC API] ❌ FASE 4 - Token idToken SCADUTO! Questo potrebbe causare 403 Forbidden');
                            } else if (expiresIn !== null && expiresIn < 60) {
                              console.warn('[RVFU IPC API] ⚠️ FASE 4 - Token idToken scade tra meno di 60 secondi:', expiresIn, 's');
                            }
                          } catch (parseError) {
                            console.error('[RVFU IPC API] ❌ FASE 4 - Errore parsing token:', parseError);
                          }
                        } else {
                          console.warn('[RVFU IPC API] ⚠️ FASE 4 - Token idToken non ha formato JWT valido (parti:', parts.length, ')');
                        }
                      } else {
                        console.warn('[RVFU IPC API] ⚠️ FASE 4 - Header Authorization non presente');
                      }
                    } catch (tokenError) {
                      console.error('[RVFU IPC API] ❌ FASE 4 - Errore verifica token:', tokenError);
                    }

                    // 3. Verifica URL retry
                    console.log('[RVFU IPC API] 🔍 FASE 4 - URL retry:', {
                      originalUrl: originalRequestData.url || originalRequest.url,
                      redirectUrl: originalRequestData._cdssoRedirectUrl || originalRequest._cdssoRedirectUrl,
                      currentUrl: persistentApiWindow.webContents.getURL(),
                      urlsMatch: (originalRequestData.url || originalRequest.url) === persistentApiWindow.webContents.getURL(),
                      redirectUrlUsed: !!(originalRequestData._cdssoRedirectUrl || originalRequest._cdssoRedirectUrl)
                    });

                    console.log('=== [RVFU IPC API] Fine FASE 4: DEBUG COMPLETO ===\n');

                    // Salva i parametri della richiesta originale per il retry
                    // ✅ IMPORTANTE: Se pending.originalRequest esiste, usalo direttamente (contiene _cdssoRedirectUrl se salvato)
                    // Altrimenti, crea un nuovo oggetto ma preserva _cdssoRedirectUrl se presente in pending
                    const originalRequest = pending.originalRequest || {
                      method: pending.method,
                      url: pending.url,
                      headers: pending.headers,
                      body: pending.body
                    };

                    // ✅ FIX: Se _cdssoRedirectUrl è stato salvato in pending.originalRequest, assicuriamoci che sia presente
                    // ✅ FIX CRITICO: Se originalRequest è lo stesso oggetto di pending.originalRequest, l'URL dovrebbe già essere presente
                    // Se non lo è, copialo
                    if (pending.originalRequest) {
                      if (originalRequest === pending.originalRequest) {
                        // Sono lo stesso oggetto, l'URL dovrebbe già essere presente
                        if (originalRequest._cdssoRedirectUrl) {
                          console.log('[RVFU IPC API] ✅ URL redirect già presente in originalRequest:', originalRequest._cdssoRedirectUrl);
                        } else {
                          console.warn('[RVFU IPC API] ⚠️ originalRequest è lo stesso oggetto ma _cdssoRedirectUrl non è presente');
                        }
                      } else {
                        // Sono oggetti diversi, copia l'URL se presente
                        if (pending.originalRequest._cdssoRedirectUrl && !originalRequest._cdssoRedirectUrl) {
                          originalRequest._cdssoRedirectUrl = pending.originalRequest._cdssoRedirectUrl;
                          console.log('[RVFU IPC API] 🔧 URL redirect copiato da pending.originalRequest:', originalRequest._cdssoRedirectUrl);
                        }
                      }
                    }

                    // ✅ FIX AGGIUNTIVO: Cerca l'URL anche in tutte le richieste pending (fallback)
                    if (!originalRequest._cdssoRedirectUrl) {
                      for (const [otherRequestId, otherPending] of pendingRequests.entries()) {
                        if (otherPending.originalRequest && otherPending.originalRequest._cdssoRedirectUrl) {
                          originalRequest._cdssoRedirectUrl = otherPending.originalRequest._cdssoRedirectUrl;
                          console.log('[RVFU IPC API] 🔧 URL redirect recuperato da altra richiesta pending:', otherRequestId, originalRequest._cdssoRedirectUrl);
                          break;
                        }
                      }
                    }

                    // ✅ FASE 2: Usa URL dal redirect CDSSO se disponibile (normalizzato, senza :443)
                    const retryUrl = originalRequest._cdssoRedirectUrl || originalRequest.url;
                    if (originalRequest._cdssoRedirectUrl) {
                      console.log('[RVFU IPC API] 🔧 Usando URL dal redirect CDSSO per retry:', originalRequest._cdssoRedirectUrl);
                      console.log('[RVFU IPC API] 🔍 URL originale (non usato):', originalRequest.url);
                    } else {
                      console.log('[RVFU IPC API] ⚠️ URL dal redirect CDSSO non disponibile, usando URL originale:', originalRequest.url);
                      console.log('[RVFU IPC API] 🔍 Debug: pending.originalRequest?', !!pending.originalRequest);
                      console.log('[RVFU IPC API] 🔍 Debug: pending.originalRequest._cdssoRedirectUrl?', !!(pending.originalRequest && pending.originalRequest._cdssoRedirectUrl));
                      // ✅ Debug aggiuntivo: verifica tutte le richieste pending
                      console.log('[RVFU IPC API] 🔍 Debug: Tutte le richieste pending:', Array.from(pendingRequests.keys()));
                      for (const [otherRequestId, otherPending] of pendingRequests.entries()) {
                        if (otherPending.originalRequest && otherPending.originalRequest._cdssoRedirectUrl) {
                          console.log('[RVFU IPC API] 🔍 Debug: Richiesta', otherRequestId, 'ha _cdssoRedirectUrl:', otherPending.originalRequest._cdssoRedirectUrl);
                        }
                      }
                    }

                    // ✅ IMPORTANTE: Dopo il redirect del CDSSO, la finestra persistente è già sulla pagina corretta
                    // Attendiamo che la pagina finisca di caricare e verifichiamo se contiene già la risposta JSON
                    console.log('[RVFU IPC API] 🔄 Verifica se la pagina corrente contiene già la risposta dopo CDSSO...');
                    const currentUrlAfterCdsso = persistentApiWindow.webContents.getURL();
                    console.log('[RVFU IPC API] 🔍 URL corrente dopo CDSSO:', currentUrlAfterCdsso);

                    // ✅ Usa retryUrl (che può essere l'URL dal redirect) per il confronto
                    // Se la finestra è già sull'URL corretto dopo il redirect del CDSSO, prova a leggere la risposta dalla pagina
                    if (currentUrlAfterCdsso.includes(retryUrl.split('?')[0])) {
                      console.log('[RVFU IPC API] ✅ Finestra già sull\'URL originale dopo CDSSO, leggendo risposta dalla pagina...');

                      // ✅ IMPORTANTE: Attendi che la pagina finisca di caricare dopo il redirect del CDSSO
                      // Il redirect potrebbe richiedere più tempo per completarsi
                      await new Promise((resolve) => {
                        let loadCount = 0;
                        const maxLoads = 3; // Aspetta fino a 3 caricamenti (per gestire redirect multipli)

                        const onLoad = () => {
                          loadCount++;
                          const currentUrl = persistentApiWindow.webContents.getURL();
                          console.log('[RVFU IPC API] 📄 Pagina caricata dopo CDSSO (load #' + loadCount + '):', currentUrl);

                          // Se abbiamo raggiunto il numero massimo di caricamenti o la pagina è stabile, risolvi
                          if (loadCount >= maxLoads || !persistentApiWindow.webContents.isLoading()) {
                            persistentApiWindow.webContents.removeListener('did-finish-load', onLoad);
                            // Attendi un po' per assicurarsi che eventuali script/redirect siano completati
                            setTimeout(() => {
                              resolve();
                            }, 2000);
                          }
                        };

                        persistentApiWindow.webContents.on('did-finish-load', onLoad);

                        // Se la pagina è già caricata, aspetta comunque un po' per eventuali redirect
                        if (persistentApiWindow.webContents.isLoading() === false) {
                          setTimeout(() => {
                            persistentApiWindow.webContents.removeListener('did-finish-load', onLoad);
                            resolve();
                          }, 2000);
                        }
                      });

                      // ✅ Verifica i cookie dopo il caricamento completo
                      const cookiesAfterLoad = await session.defaultSession.cookies.get({ domain: 'formazione.ilportaledeltrasporto.it' });
                      // ✅ FIX: Verifica cookie critici dopo CDSSO (come in Chrome)
                      const cookieNamesAfterLoad = cookiesAfterLoad.map(c => c.name);
                      const hasAgentAuthnTxX = cookieNamesAfterLoad.some(name => name.startsWith('agent-authn-tx-x-'));
                      const hasAmlbcookie = cookieNamesAfterLoad.includes('amlbcookie');
                      const hasAgentAuthnTx = cookieNamesAfterLoad.some(name => name.startsWith('agent-authn-tx-'));

                      console.log('[RVFU IPC API] 🔍 Cookie DOPO caricamento completo:', {
                        count: cookiesAfterLoad.length,
                        names: cookieNamesAfterLoad,
                        hasAmFilter: cookiesAfterLoad.some(c => c.name === 'amFilterCDSSORequest'),
                        hasAmAuthJwt: cookiesAfterLoad.some(c => c.name === 'am-auth-jwt'),
                        hasIPlanet: cookiesAfterLoad.some(c => c.name === 'iPlanetDirectoryPro'),
                        hasAgentAuthnTxX: hasAgentAuthnTxX,
                        hasAmlbcookie: hasAmlbcookie,
                        hasAgentAuthnTx: hasAgentAuthnTx
                      });

                      // ⚠️ Avvisa se mancano cookie critici
                      if (!hasAgentAuthnTxX) {
                        console.warn('[RVFU IPC API] ⚠️ Cookie agent-authn-tx-x-* NON trovato dopo CDSSO!');
                        console.warn('[RVFU IPC API] ⚠️ Questo potrebbe causare 403 Forbidden');
                      }
                      if (!hasAmlbcookie) {
                        console.warn('[RVFU IPC API] ⚠️ Cookie amlbcookie NON trovato dopo CDSSO!');
                        console.warn('[RVFU IPC API] ⚠️ Questo potrebbe causare 403 Forbidden (sticky session)');
                      }

                      // Prova a leggere la risposta JSON dalla pagina
                      // ✅ IMPORTANTE: Dopo il redirect del CDSSO, la pagina potrebbe contenere già la risposta JSON
                      try {
                        const pageContent = await persistentApiWindow.webContents.executeJavaScript(`
                          (function() {
                            try {
                              // ✅ DEBUG: Verifica il contenuto della pagina
                              const bodyText = document.body ? document.body.innerText : '';
                              const bodyHTML = document.body ? document.body.innerHTML : '';
                              const title = document.title || '';
                              const url = window.location.href;
                              
                              console.log('[RVFU Page Reader] 🔍 Analisi pagina:', {
                                url: url,
                                title: title,
                                bodyTextLength: bodyText.length,
                                bodyHTMLLength: bodyHTML.length,
                                hasError: bodyText.toLowerCase().includes('forbidden') || bodyText.toLowerCase().includes('403'),
                                hasJSON: bodyText.includes('{') && bodyText.includes('}')
                              });
                              
                              // ✅ Se la pagina contiene "Forbidden" o "403", non è la risposta corretta
                              if (bodyText.toLowerCase().includes('forbidden') || bodyText.toLowerCase().includes('403') || title.includes('403')) {
                                console.log('[RVFU Page Reader] ⚠️ Pagina contiene errore 403 Forbidden');
                                return { success: false, reason: 'Page contains 403 Forbidden error', bodyText: bodyText.substring(0, 500) };
                              }
                              
                              // ✅ Prova a estrarre JSON dal testo (potrebbe essere JSON puro)
                              const jsonMatch = bodyText.match(/\\{[\\s\\S]*\\}/);
                              if (jsonMatch) {
                                try {
                                  const json = JSON.parse(jsonMatch[0]);
                                  console.log('[RVFU Page Reader] ✅ JSON trovato nel bodyText!');
                                  return { success: true, data: json, source: 'bodyText' };
                                } catch (e) {
                                  console.log('[RVFU Page Reader] ⚠️ JSON non valido nel bodyText:', e.message);
                                }
                              }
                              
                              // ✅ Prova a estrarre JSON dall'HTML (potrebbe essere in un tag <pre>)
                              const jsonMatchHTML = bodyHTML.match(/<pre[^>]*>([\\s\\S]*?)<\\/pre>/i);
                              if (jsonMatchHTML) {
                                try {
                                  const json = JSON.parse(jsonMatchHTML[1]);
                                  console.log('[RVFU Page Reader] ✅ JSON trovato nel tag <pre>!');
                                  return { success: true, data: json, source: 'preTag' };
                                } catch (e) {
                                  console.log('[RVFU Page Reader] ⚠️ JSON non valido nel tag <pre>:', e.message);
                                }
                              }
                              
                              // ✅ Prova a cercare JSON in script tags
                              const scriptTags = document.querySelectorAll('script');
                              for (let script of scriptTags) {
                                if (script.textContent) {
                                  const scriptMatch = script.textContent.match(/\\{[\\s\\S]*\\}/);
                                  if (scriptMatch) {
                                    try {
                                      const json = JSON.parse(scriptMatch[0]);
                                      console.log('[RVFU Page Reader] ✅ JSON trovato in script tag!');
                                      return { success: true, data: json, source: 'scriptTag' };
                                    } catch (e) {
                                      // Non è JSON valido
                                    }
                                  }
                                }
                              }
                              
                              console.log('[RVFU Page Reader] ⚠️ Nessun JSON trovato nella pagina');
                              return { success: false, reason: 'No JSON found in page', bodyText: bodyText.substring(0, 500), title: title };
                            } catch (e) {
                              console.error('[RVFU Page Reader] ❌ Errore:', e);
                              return { success: false, error: e.message };
                            }
                          })();
                        `);

                        if (pageContent.success && pageContent.data) {
                          console.log('[RVFU IPC API] ✅ Risposta JSON trovata nella pagina dopo CDSSO!');
                          console.log('[RVFU IPC API] 🔍 Fonte:', pageContent.source);
                          // ✅ Rimuovi la richiesta quando viene risolta dopo CDSSO
                          pendingRequests.delete(requestId);
                          clearTimeout(pending.timeout);
                          pending.resolve(pageContent.data);
                          return;
                        } else {
                          console.log('[RVFU IPC API] ⚠️ Nessun JSON trovato nella pagina, procedendo con fetch retry...');
                          console.log('[RVFU IPC API] 🔍 Motivo:', pageContent.reason || pageContent.error);
                        }
                      } catch (readError) {
                        console.warn('[RVFU IPC API] ⚠️ Errore lettura risposta dalla pagina:', readError);
                        // Procedi con il fetch retry
                      }
                    }

                    // Attendi un po' per assicurarsi che il CDSSO sia completato e la pagina sia caricata
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    // ✅ IMPORTANTE: Verifica e imposta i cookie necessari PRIMA del retry
                    // Il cookie iPlanetDirectoryPro potrebbe non essere disponibile per il dominio API
                    const apiDomain = 'formazione.ilportaledeltrasporto.it';
                    const ssoDomain = 'ssoformazione.ilportaledeltrasporto.it';

                    // Recupera i cookie dalla sessione
                    const [apiCookies, ssoCookies, parentCookies] = await Promise.all([
                      session.defaultSession.cookies.get({ domain: apiDomain }),
                      session.defaultSession.cookies.get({ domain: ssoDomain }),
                      session.defaultSession.cookies.get({ domain: '.ilportaledeltrasporto.it' })
                    ]);

                    const amAuthJwtCookie = apiCookies.find(c => c.name === 'am-auth-jwt');
                    const iPlanetCookie = [...ssoCookies, ...parentCookies].find(c => c.name === 'iPlanetDirectoryPro');

                    if (!amAuthJwtCookie) {
                      console.warn('[RVFU IPC API] ⚠️ Cookie am-auth-jwt NON trovato dopo CDSSO!');
                      pending.reject(new Error('CDSSO completato ma cookie am-auth-jwt non trovato'));
                      return;
                    }

                    // ✅ IMPORTANTE: Assicurati che iPlanetDirectoryPro sia disponibile per il dominio API
                    if (iPlanetCookie) {
                      console.log('[RVFU IPC API] 🔐 Cookie iPlanetDirectoryPro trovato, verificando disponibilità per dominio API...');

                      // Verifica se il cookie è già disponibile per il dominio API
                      const apiIPlanetCookie = apiCookies.find(c => c.name === 'iPlanetDirectoryPro');

                      if (!apiIPlanetCookie) {
                        console.log('[RVFU IPC API] 🔐 Cookie iPlanetDirectoryPro non disponibile per dominio API, impostazione...');

                        try {
                          // Imposta il cookie per il dominio API (usando dominio parent per condivisione cross-subdomain)
                          await session.defaultSession.cookies.set({
                            url: `https://${apiDomain}/`,
                            name: 'iPlanetDirectoryPro',
                            value: iPlanetCookie.value,
                            domain: '.ilportaledeltrasporto.it', // Dominio parent per condivisione cross-subdomain
                            path: '/',
                            secure: true,
                            httpOnly: true,
                            sameSite: 'lax'
                          });
                          console.log('[RVFU IPC API] ✅ Cookie iPlanetDirectoryPro impostato per dominio API');
                        } catch (cookieError) {
                          console.warn('[RVFU IPC API] ⚠️ Errore impostazione cookie iPlanetDirectoryPro:', cookieError);
                        }
                      } else {
                        console.log('[RVFU IPC API] ✅ Cookie iPlanetDirectoryPro già disponibile per dominio API');
                      }
                    } else {
                      console.warn('[RVFU IPC API] ⚠️ Cookie iPlanetDirectoryPro NON trovato nella sessione!');
                    }

                    // ✅ NUOVO APPROCCIO: Riprova la richiesta originale usando fetch dalla pagina stessa
                    // Questo garantisce che i cookie della sessione browser (inclusi httpOnly) vengano inviati automaticamente
                    // perché il fetch viene fatto dalla stessa pagina che ha completato il CDSSO
                    try {
                      // ✅ FASE 2: Usa URL dal redirect CDSSO se disponibile (normalizzato, senza :443)
                      const retryUrlForLog = originalRequest._cdssoRedirectUrl || originalRequest.url;
                      console.log('[RVFU IPC API] 🔄 Retry richiesta originale via fetch dalla pagina (dopo CDSSO):', retryUrlForLog);
                      if (originalRequest._cdssoRedirectUrl) {
                        console.log('[RVFU IPC API] 🔧 Usando URL dal redirect CDSSO per retry:', originalRequest._cdssoRedirectUrl);
                        console.log('[RVFU IPC API] 🔍 URL originale (non usato):', originalRequest.url);
                      }
                      console.log('[RVFU IPC API] ✅ Cookie am-auth-jwt trovato dopo CDSSO, procedendo con retry via fetch dalla pagina');

                      // Crea un nuovo requestId per il retry
                      const retryRequestId = Date.now().toString() + Math.random().toString(36).substring(7);

                      // Timeout per il retry
                      const retryTimeout = setTimeout(() => {
                        if (pendingRequests.has(retryRequestId)) {
                          pendingRequests.delete(retryRequestId);
                          // ✅ Rimuovi anche la richiesta originale quando il retry va in timeout
                          pendingRequests.delete(requestId);
                          clearTimeout(pending.timeout);
                          pending.reject(new Error('Retry timeout dopo CDSSO'));
                        }
                      }, 30000);

                      // Salva la richiesta retry
                      const retryPending = {
                        resolve: (data) => {
                          clearTimeout(retryTimeout);
                          pendingRequests.delete(retryRequestId);
                          // ✅ Rimuovi anche la richiesta originale quando il retry viene risolto
                          pendingRequests.delete(requestId);
                          clearTimeout(pending.timeout);
                          pending.resolve(data);
                        },
                        reject: (error) => {
                          clearTimeout(retryTimeout);
                          pendingRequests.delete(retryRequestId);
                          // ✅ Rimuovi anche la richiesta originale quando il retry viene rifiutato
                          pendingRequests.delete(requestId);
                          clearTimeout(pending.timeout);
                          pending.reject(error);
                        },
                        timeout: retryTimeout,
                        originalRequest: originalRequest
                      };

                      pendingRequests.set(retryRequestId, retryPending);

                      // Prepara i dati per il retry
                      // ✅ FASE 2: Usa URL dal redirect CDSSO se disponibile (normalizzato, senza :443)
                      const retryUrl = originalRequest._cdssoRedirectUrl || originalRequest.url;
                      const retryHeaders = { ...originalRequest.headers };

                      // ✅ FIX (2026-02-18): Usa il bearerToken originale (aud: AUTODEM.RESCUEMANAGER)
                      // Il flusso corretto è:
                      //   - Cookie CDSSO (am-auth-jwt, iPlanetDirectoryPro) → per il Web Agent ForgeRock
                      //   - Bearer id_token (aud: AUTODEM.RESCUEMANAGER) → per il backend Java
                      // PRIMA il codice usava am-auth-jwt (aud: formazioneAgent) come Bearer → SBAGLIATO
                      // Il manuale dice: "Authorization: Bearer {id_token}" dove id_token è dal login OAuth2
                      if (originalRequest.bearerToken) {
                        retryHeaders.Authorization = `Bearer ${originalRequest.bearerToken}`;
                        console.log('[RVFU IPC API Retry] ✅ FASE 5 - Bearer id_token originale (aud: AUTODEM.RESCUEMANAGER) impostato');
                      } else if (originalRequest.headers?.Authorization) {
                        retryHeaders.Authorization = originalRequest.headers.Authorization;
                        console.log('[RVFU IPC API Retry] ✅ FASE 5 - Usando Authorization header originale dalla richiesta');
                      } else {
                        console.warn('[RVFU IPC API Retry] ⚠️ FASE 5 - Nessun bearerToken disponibile per il retry');
                      }

                      if (!retryHeaders.Authorization) {
                        console.warn('[RVFU IPC API Retry] ⚠️ Header Authorization non disponibile dopo tutti i tentativi!');
                      }

                      if (originalRequest._cdssoRedirectUrl) {
                        console.log('[RVFU IPC API Retry] 🔧 Usando URL dal redirect CDSSO per retry:', originalRequest._cdssoRedirectUrl);
                        console.log('[RVFU IPC API Retry] 🔍 URL originale (non usato):', originalRequest.url);
                      } else {
                        console.log('[RVFU IPC API Retry] ⚠️ URL dal redirect CDSSO non disponibile, usando URL originale:', originalRequest.url);
                      }

                      // ✅ FASE 7: Usa fetch dalla finestra persistente invece di navigazione browser
                      // La navigazione browser viene interpretata come richiesta di pagina web, non come API REST
                      // Usando fetch dalla finestra persistente, facciamo una vera chiamata API REST con tutti i cookie
                      console.log('[RVFU IPC API] 🔄 FASE 7 - Retry via fetch dalla finestra persistente (invece di navigazione)...');
                      console.log('[RVFU IPC API] 🔄 Questo garantisce che tutti i cookie della sessione browser (inclusi httpOnly) vengano inviati automaticamente');
                      console.log('[RVFU IPC API] 🔄 E che la richiesta sia interpretata come API REST, non come navigazione browser');

                      // ✅ FIX (2026-02-18): Includi Bearer id_token (aud: AUTODEM.RESCUEMANAGER)
                      // Il flusso corretto: cookie CDSSO per Web Agent + Bearer per backend
                      const fetchHeaders = {
                        'Accept': 'application/json, text/json, */*',
                        'X-Requested-With': 'XMLHttpRequest'
                      };
                      // Aggiungi Bearer token se disponibile
                      if (retryHeaders.Authorization) {
                        fetchHeaders['Authorization'] = retryHeaders.Authorization;
                        console.log('[RVFU IPC API] ✅ FASE 7 - Bearer token incluso nel fetch (CDSSO cookies + Bearer)');
                      }

                      // Rimuovi header undefined
                      Object.keys(fetchHeaders).forEach(key => {
                        if (!fetchHeaders[key]) {
                          delete fetchHeaders[key];
                        }
                      });

                      console.log('[RVFU IPC API] 🔍 FASE 7 - Header per fetch:', fetchHeaders);

                      // ✅ FASE 7: Usa executeJavaScript per fare fetch dalla finestra persistente
                      // Questo permette di usare i cookie della sessione browser (inclusi httpOnly)
                      // IMPORTANTE: Assicurati che la finestra sia caricata prima di eseguire JavaScript
                      console.log('[RVFU IPC API] 🔍 FASE 7 - Verifica stato finestra persistente:', {
                        exists: !!persistentApiWindow,
                        isDestroyed: persistentApiWindow?.isDestroyed(),
                        isLoading: persistentApiWindow?.webContents?.isLoading(),
                        currentURL: persistentApiWindow?.webContents?.getURL()
                      });

                      // Attendi che la finestra sia pronta (non in caricamento)
                      if (persistentApiWindow && !persistentApiWindow.isDestroyed() && persistentApiWindow.webContents.isLoading()) {
                        console.log('[RVFU IPC API] ⏳ FASE 7 - Attendo che la finestra finisca di caricare...');
                        await new Promise((resolve) => {
                          const onLoad = () => {
                            persistentApiWindow.webContents.removeListener('did-finish-load', onLoad);
                            persistentApiWindow.webContents.removeListener('did-fail-load', onFail);
                            resolve();
                          };
                          const onFail = () => {
                            persistentApiWindow.webContents.removeListener('did-finish-load', onLoad);
                            persistentApiWindow.webContents.removeListener('did-fail-load', onFail);
                            resolve(); // Risolvi comunque per non bloccare
                          };
                          persistentApiWindow.webContents.once('did-finish-load', onLoad);
                          persistentApiWindow.webContents.once('did-fail-load', onFail);
                          // Timeout di sicurezza
                          setTimeout(resolve, 5000);
                        });
                        console.log('[RVFU IPC API] ✅ FASE 7 - Finestra pronta per executeJavaScript');
                      }

                      try {
                        console.log('[RVFU IPC API] 🔄 FASE 7 - Eseguendo executeJavaScript per fetch...');
                        const fetchResult = await persistentApiWindow.webContents.executeJavaScript(`
                          (async () => {
                            try {
                              console.log('[RVFU IPC API] 🔄 FASE 7 - Eseguendo fetch dalla finestra persistente...');
                              console.log('[RVFU IPC API] 🔍 URL:', ${JSON.stringify(retryUrl)});
                              console.log('[RVFU IPC API] 🔍 Headers:', ${JSON.stringify(fetchHeaders)});
                              console.log('[RVFU IPC API] 🔍 Method:', ${JSON.stringify(originalRequest.method || 'GET')});
                              console.log('[RVFU IPC API] 🔍 Body:', ${originalRequest.body ? JSON.stringify(originalRequest.body) : 'null'});
                              
                              const response = await fetch(${JSON.stringify(retryUrl)}, {
                                method: ${JSON.stringify(originalRequest.method || 'GET')},
                                headers: ${JSON.stringify(fetchHeaders)},
                                credentials: 'include', // IMPORTANTE: Invia cookie automaticamente
                                body: ${originalRequest.body ? JSON.stringify(originalRequest.body) : 'null'}
                              });
                              
                              console.log('[RVFU IPC API] 🔍 FASE 7 - Risposta fetch:', {
                                status: response.status,
                                statusText: response.statusText,
                                ok: response.ok,
                                contentType: response.headers.get('content-type')
                              });
                              
                              const contentType = response.headers.get('content-type') || '';
                              const isJSON = contentType.includes('application/json') || contentType.includes('text/json');
                              
                              let data;
                              if (isJSON) {
                                data = await response.json();
                                console.log('[RVFU IPC API] ✅ FASE 7 - Risposta JSON ricevuta');
                              } else {
                                const text = await response.text();
                                console.log('[RVFU IPC API] ⚠️ FASE 7 - Risposta non JSON, tipo:', contentType);
                                // Se è HTML, prova a parsare info utili
                                if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                                  data = { _html: true, _text: text.substring(0, 1000), _fullText: text };
                                  console.log('[RVFU IPC API] ⚠️ FASE 7 - Risposta HTML ricevuta (potrebbe essere errore)');
                                } else {
                                  data = text;
                                }
                              }
                              
                              return {
                                success: response.ok,
                                status: response.status,
                                statusText: response.statusText,
                                data: data,
                                headers: Object.fromEntries(response.headers.entries())
                              };
                            } catch (error) {
                              console.error('[RVFU IPC API] ❌ FASE 7 - Errore fetch:', error);
                              return {
                                success: false,
                                error: error.message,
                                stack: error.stack
                              };
                            }
                          })()
                        `);

                        console.log('[RVFU IPC API] ✅ FASE 7 - Risposta fetch ricevuta:', {
                          success: fetchResult?.success,
                          status: fetchResult?.status,
                          statusText: fetchResult?.statusText,
                          hasData: !!fetchResult?.data,
                          hasError: !!fetchResult?.error,
                          dataType: fetchResult?.data ? (fetchResult.data._html ? 'HTML' : typeof fetchResult.data) : 'null'
                        });

                        // ✅ FASE 7: Anche se il fetch restituisce 403, restituiamo i dati per analisi
                        // Il problema potrebbe essere che il server restituisce 403 anche con fetch
                        if (fetchResult && fetchResult.data) {
                          // Se è HTML con errore 403, loggiamo i dettagli
                          if (fetchResult.data._html && fetchResult.status === 403) {
                            console.warn('[RVFU IPC API] ⚠️ FASE 7 - Fetch restituito 403 Forbidden (HTML):', {
                              status: fetchResult.status,
                              statusText: fetchResult.statusText,
                              htmlPreview: fetchResult.data._text?.substring(0, 200)
                            });
                            // Procedi con la navigazione come fallback per ora
                            console.log('[RVFU IPC API] 🔄 FASE 7 - Fallback a navigazione browser (403 ricevuto anche con fetch)...');
                          } else if (fetchResult.success && fetchResult.data) {
                            console.log('[RVFU IPC API] ✅ FASE 7 - Fetch completato con successo!');
                            // ✅ Rimuovi la richiesta quando viene risolta
                            pendingRequests.delete(retryRequestId);
                            pendingRequests.delete(requestId);
                            clearTimeout(pending.timeout);
                            clearTimeout(retryTimeout);
                            pending.resolve(fetchResult.data);
                            return;
                          } else {
                            console.warn('[RVFU IPC API] ⚠️ FASE 7 - Fetch fallito:', {
                              error: fetchResult?.error,
                              status: fetchResult?.status,
                              statusText: fetchResult?.statusText,
                              hasData: !!fetchResult?.data,
                              dataType: fetchResult?.data ? (fetchResult.data._html ? 'HTML' : typeof fetchResult.data) : 'null'
                            });
                            // Procedi con la navigazione come fallback
                            console.log('[RVFU IPC API] 🔄 FASE 7 - Fallback a navigazione browser...');
                          }
                        } else {
                          console.warn('[RVFU IPC API] ⚠️ FASE 7 - Fetch fallito (nessun dato):', {
                            error: fetchResult?.error,
                            status: fetchResult?.status,
                            statusText: fetchResult?.statusText
                          });
                          // Procedi con la navigazione come fallback
                          console.log('[RVFU IPC API] 🔄 FASE 7 - Fallback a navigazione browser...');
                        }
                      } catch (fetchError) {
                        console.error('[RVFU IPC API] ❌ FASE 7 - Errore executeJavaScript fetch:', {
                          message: fetchError.message,
                          stack: fetchError.stack,
                          name: fetchError.name
                        });
                        // Procedi con la navigazione come fallback
                        console.log('[RVFU IPC API] 🔄 FASE 7 - Fallback a navigazione browser...');
                      }

                      // ✅ FALLBACK: Naviga direttamente all'URL se fetch fallisce
                      // Intercetta le richieste per aggiungere gli header di autenticazione
                      const ses = persistentApiWindow.webContents.session;
                      const urlToIntercept = new URL(retryUrl);
                      const interceptUrlPattern = `${urlToIntercept.protocol}//${urlToIntercept.host}${urlToIntercept.pathname}*`;

                      // ✅ FASE 4: Intercetta richiesta retry per vedere tutti gli header inviati
                      let retryResponseInterceptor = null;
                      let interceptor = null;
                      try {
                        // ✅ FASE 4: Intercetta risposta per debug completo (PRIMA dell'interceptor richiesta)
                        retryResponseInterceptor = ses.webRequest.onHeadersReceived(
                          {
                            urls: [interceptUrlPattern],
                          },
                          (details, callback) => {
                            console.log('[RVFU IPC API] 🔍 FASE 4 - Risposta retry navigazione intercettata:', {
                              url: details.url,
                              statusCode: details.statusCode,
                              statusLine: details.statusLine,
                              responseHeaders: {
                                'Set-Cookie': details.responseHeaders['Set-Cookie'] || details.responseHeaders['set-cookie'] || [],
                                'Content-Type': details.responseHeaders['Content-Type'] || details.responseHeaders['content-type'] || [],
                                'Location': details.responseHeaders['Location'] || details.responseHeaders['location'] || [],
                                'WWW-Authenticate': details.responseHeaders['WWW-Authenticate'] || details.responseHeaders['www-authenticate'] || []
                              }
                            });

                            callback({ responseHeaders: details.responseHeaders });
                          }
                        );

                        // ✅ FASE 4: Intercetta richiesta per debug completo E aggiungi header Authorization (UNICO interceptor)
                        interceptor = ses.webRequest.onBeforeSendHeaders(
                          {
                            urls: [interceptUrlPattern],
                          },
                          (details, callback) => {
                            // ✅ FASE 4: Debug completo della richiesta PRIMA di modificare gli header
                            const cookieHeader = details.requestHeaders['Cookie'] || '';
                            const cookies = cookieHeader.split(';').map(c => c.trim()).filter(Boolean);

                            // Analizza i cookie per trovare duplicati e valori completi
                            const cookieMap = new Map();
                            const cookieDetails = [];
                            cookies.forEach(cookie => {
                              const [name, ...valueParts] = cookie.split('=');
                              const value = valueParts.join('=');
                              if (name) {
                                if (cookieMap.has(name)) {
                                  console.warn(`[RVFU IPC API] ⚠️ FASE 4 - Cookie duplicato trovato: ${name}`);
                                }
                                cookieMap.set(name, value);
                                cookieDetails.push({
                                  name: name,
                                  valueLength: value.length,
                                  valuePrefix: value.substring(0, 100) + (value.length > 100 ? '...' : ''),
                                  fullValue: name === 'am-auth-jwt' || name === 'amFilterCDSSORequest' || name === 'iPlanetDirectoryPro' ? value : undefined
                                });
                              }
                            });

                            // ✅ FASE 4: Verifica se amFilterCDSSORequest ha valore placeholder e rimuovilo se necessario
                            // Secondo ForgeRock, questo cookie dovrebbe essere impostato dal Java Agent durante la navigazione iniziale
                            // Se ha valore placeholder, potrebbe causare 403 Forbidden
                            if (cookieMap.has('amFilterCDSSORequest')) {
                              const amFilterValue = cookieMap.get('amFilterCDSSORequest');
                              if (amFilterValue === 'cdsso-request') {
                                console.warn('[RVFU IPC API] ⚠️ FASE 4 - Cookie amFilterCDSSORequest ha valore placeholder!');
                                console.warn('[RVFU IPC API] ⚠️ FASE 4 - Rimuovendo cookie amFilterCDSSORequest con valore placeholder...');
                                cookieMap.delete('amFilterCDSSORequest');
                                console.log('[RVFU IPC API] ✅ FASE 4 - Cookie amFilterCDSSORequest rimosso (valore placeholder non valido)');
                              } else {
                                console.log('[RVFU IPC API] ✅ FASE 4 - Cookie amFilterCDSSORequest ha valore valido (non placeholder):', {
                                  valueLength: amFilterValue.length,
                                  valuePrefix: amFilterValue.substring(0, 50) + '...'
                                });
                              }
                            }

                            // ✅ FASE 4: Estrai e decodifica il token per verificare l'audience
                            let tokenAudience = null;
                            let tokenIssuer = null;
                            let tokenSubject = null;
                            if (details.requestHeaders['Authorization']) {
                              try {
                                const authHeader = details.requestHeaders['Authorization'];
                                const token = authHeader.replace('Bearer ', '');
                                const parts = token.split('.');
                                if (parts.length === 3) {
                                  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
                                  tokenAudience = payload.aud;
                                  tokenIssuer = payload.iss;
                                  tokenSubject = payload.sub;
                                }
                              } catch (e) {
                                // Ignora errori di parsing token
                              }
                            }

                            // ✅ LOG PER CONFRONTO CON BROWSER REALE: Header e Cookie Names (anonimizzati)
                            const requestHeadersForComparison = {};
                            Object.keys(details.requestHeaders).forEach(key => {
                              const value = details.requestHeaders[key];
                              if (key === 'Authorization') {
                                requestHeadersForComparison[key] = value ? 'Bearer [TOKEN_ANONIMIZZATO]' : 'NON PRESENTE';
                              } else if (key === 'Cookie') {
                                requestHeadersForComparison[key] = `[${cookieHeader.length} caratteri, ${cookies.length} cookie]`;
                              } else {
                                requestHeadersForComparison[key] = value || 'NON PRESENTE';
                              }
                            });

                            console.log('\n=== [RVFU IPC API] 📋 CONFRONTO CON BROWSER REALE ===');
                            console.log('[RVFU IPC API] 📋 Richiesta nostra (anonimizzata):');
                            console.log('[RVFU IPC API] 📋 URL:', details.url);
                            console.log('[RVFU IPC API] 📋 Method:', details.method);
                            console.log('[RVFU IPC API] 📋 Request Headers:', JSON.stringify(requestHeadersForComparison, null, 2));
                            console.log('[RVFU IPC API] 📋 Cookie Names:', Array.from(cookieMap.keys()));
                            console.log('[RVFU IPC API] 📋 Cookie Count:', Array.from(cookieMap.keys()).length);
                            console.log('[RVFU IPC API] 📋 Token Info:', {
                              audience: tokenAudience,
                              issuer: tokenIssuer,
                              subject: tokenSubject ? tokenSubject.substring(0, 20) + '...' : null,
                              expectedAudience: 'formazioneAgent',
                              audienceMatch: tokenAudience === 'formazioneAgent'
                            });
                            console.log('=== [RVFU IPC API] Fine CONFRONTO ===\n');

                            console.log('[RVFU IPC API] 🔍 FASE 4 - Richiesta retry navigazione intercettata:', {
                              url: details.url,
                              method: details.method,
                              headers: {
                                Authorization: details.requestHeaders['Authorization'] ?
                                  details.requestHeaders['Authorization'].substring(0, 50) + '...' : 'NON PRESENTE',
                                Cookie: cookieHeader.length > 0 ?
                                  `[${cookieHeader.length} caratteri totali, ${cookies.length} cookie]` : 'NON PRESENTE',
                                'User-Agent': details.requestHeaders['User-Agent'],
                                'Accept': details.requestHeaders['Accept'],
                                'Referer': details.requestHeaders['Referer'],
                                'Origin': details.requestHeaders['Origin']
                              },
                              tokenInfo: {
                                audience: tokenAudience,
                                issuer: tokenIssuer,
                                subject: tokenSubject ? tokenSubject.substring(0, 50) + '...' : null,
                                expectedAudience: 'formazioneAgent',
                                audienceMatch: tokenAudience === 'formazioneAgent'
                              },
                              cookieCount: cookies.length,
                              cookieNames: Array.from(cookieMap.keys()),
                              cookieDetails: cookieDetails,
                              hasDuplicates: cookies.length !== cookieMap.size,
                              duplicateCount: cookies.length - cookieMap.size
                            });

                            // ✅ FASE 4: Avvisa se l'audience non corrisponde
                            if (tokenAudience && tokenAudience !== 'formazioneAgent') {
                              console.warn('[RVFU IPC API] ⚠️ FASE 4 - Token ha audience diversa da quella attesa!', {
                                expected: 'formazioneAgent',
                                actual: tokenAudience,
                                warning: 'Questo potrebbe causare 403 Forbidden se il server verifica l\'audience'
                              });
                            }

                            // ✅ FIX: Rimuovi cookie duplicati e placeholder dal Cookie header
                            const removedCount = cookies.length - cookieMap.size;
                            if (removedCount > 0) {
                              console.warn(`[RVFU IPC API] ⚠️ FASE 4 - Rimozione ${removedCount} cookie (duplicati o placeholder)`);
                              const uniqueCookies = Array.from(cookieMap.entries()).map(([name, value]) => `${name}=${value}`);
                              details.requestHeaders['Cookie'] = uniqueCookies.join('; ');
                              console.log('[RVFU IPC API] ✅ FASE 4 - Cookie header dopo pulizia:', {
                                originalCount: cookies.length,
                                newCount: uniqueCookies.length,
                                removedCount: removedCount,
                                newCookieHeader: details.requestHeaders['Cookie'].substring(0, 500) + '...',
                                cookieNames: Array.from(cookieMap.keys())
                              });
                            }

                            console.log('[RVFU IPC API Retry] 🔐 Intercettazione richiesta navigazione per retry...');
                            console.log('[RVFU IPC API Retry] 🔐 URL:', details.url);

                            // ✅ FIX (2026-02-18): MANTENERE il Bearer id_token!
                            // Il flusso corretto richiede ENTRAMBI:
                            //   1. Cookie CDSSO → per il Web Agent ForgeRock (nella sessione browser)
                            //   2. Bearer id_token (aud: AUTODEM.RESCUEMANAGER) → per il backend Java
                            // Se il Bearer non è presente ma abbiamo il bearerToken originale, aggiungiamolo
                            if (!details.requestHeaders['Authorization'] && originalRequest.bearerToken) {
                              details.requestHeaders['Authorization'] = `Bearer ${originalRequest.bearerToken}`;
                              console.log('[RVFU IPC API Retry] ✅ Bearer id_token (aud: AUTODEM.RESCUEMANAGER) AGGIUNTO alla richiesta');
                            } else if (details.requestHeaders['Authorization']) {
                              console.log('[RVFU IPC API Retry] ✅ Bearer header già presente, mantenuto');
                            }

                            // ✅ FASE 6: Aggiungi header Accept per richiedere JSON invece di HTML
                            // Il server potrebbe restituire HTML di default se non viene specificato Accept: application/json
                            if (!details.requestHeaders['Accept'] || !details.requestHeaders['Accept'].includes('application/json')) {
                              details.requestHeaders['Accept'] = 'application/json, text/json, */*';
                              console.log('[RVFU IPC API Retry] ✅ Header Accept aggiunto per richiedere JSON');
                            }

                            // ✅ FASE 6: Aggiungi header X-Requested-With per indicare richiesta AJAX/API
                            // Alcuni server richiedono questo header per distinguere richieste API da navigazione browser
                            if (!details.requestHeaders['X-Requested-With']) {
                              details.requestHeaders['X-Requested-With'] = 'XMLHttpRequest';
                              console.log('[RVFU IPC API Retry] ✅ Header X-Requested-With aggiunto');
                            }

                            console.log('[RVFU IPC API Retry] 🔍 Header finali richiesta:', {
                              Authorization: details.requestHeaders['Authorization'] ? 'Presente' : 'Mancante',
                              Accept: details.requestHeaders['Accept'],
                              'X-Requested-With': details.requestHeaders['X-Requested-With'],
                              'Content-Type': details.requestHeaders['Content-Type'],
                              'User-Agent': details.requestHeaders['User-Agent']?.substring(0, 50) + '...'
                            });

                            callback({ requestHeaders: details.requestHeaders });
                          }
                        );

                        // Naviga all'URL con gli header di autenticazione
                        const extraHeaders = retryHeaders.Authorization
                          ? `Authorization: ${retryHeaders.Authorization}\r\n`
                          : '';

                        if (extraHeaders) {
                          console.log('[RVFU IPC API Retry] 🔐 Navigazione con header Authorization');
                          persistentApiWindow.webContents.loadURL(retryUrl, { extraHeaders });
                        } else {
                          persistentApiWindow.webContents.loadURL(retryUrl);
                        }

                        // Aspetta che la pagina carichi
                        await new Promise((resolve) => {
                          const timeout = setTimeout(() => {
                            if (interceptor) {
                              try {
                                interceptor.dispose();
                              } catch (e) { }
                            }
                            if (retryResponseInterceptor) {
                              try {
                                retryResponseInterceptor.dispose();
                              } catch (e) { }
                            }
                            resolve();
                          }, 15000);

                          const onLoad = () => {
                            clearTimeout(timeout);
                            persistentApiWindow.webContents.removeListener('did-finish-load', onLoad);
                            if (interceptor) {
                              try {
                                interceptor.dispose();
                              } catch (e) { }
                            }
                            if (retryResponseInterceptor) {
                              try {
                                retryResponseInterceptor.dispose();
                              } catch (e) { }
                            }
                            resolve();
                          };

                          persistentApiWindow.webContents.once('did-finish-load', onLoad);
                        });

                        // Attendi un po' per assicurarsi che eventuali script/redirect siano completati
                        await new Promise(resolve => setTimeout(resolve, 2000));

                        // ✅ FASE 4: Leggi la risposta dalla pagina con debug completo
                        const pageContent = await persistentApiWindow.webContents.executeJavaScript(`
                          (function() {
                            try {
                              const bodyText = document.body ? document.body.innerText : '';
                              const bodyHTML = document.body ? document.body.innerHTML : '';
                              const title = document.title || '';
                              const url = window.location.href;
                              
                              // ✅ FASE 4: Debug completo della pagina
                              const debugInfo = {
                                url: url,
                                title: title,
                                bodyTextLength: bodyText.length,
                                bodyHTMLLength: bodyHTML.length,
                                bodyTextPreview: bodyText.substring(0, 500),
                                bodyHTMLPreview: bodyHTML.substring(0, 500),
                                hasForbidden: bodyText.toLowerCase().includes('forbidden') || bodyText.toLowerCase().includes('403') || title.includes('403'),
                                hasError: bodyText.toLowerCase().includes('error') || bodyHTML.toLowerCase().includes('error'),
                                hasJson: bodyText.includes('{') && bodyText.includes('}'),
                                statusCode: document.querySelector('h1, h2, .error, .status') ? 
                                  (document.querySelector('h1, h2, .error, .status').innerText || '') : ''
                              };
                              
                              console.log('[RVFU Page Reader] 🔍 FASE 4 - Debug completo pagina:', JSON.stringify(debugInfo, null, 2));
                              
                              // ✅ Se la pagina contiene "Forbidden" o "403", non è la risposta corretta
                              if (bodyText.toLowerCase().includes('forbidden') || bodyText.toLowerCase().includes('403') || title.includes('403')) {
                                return { 
                                  success: false, 
                                  reason: 'Page contains 403 Forbidden error',
                                  debugInfo: debugInfo
                                };
                              }
                              
                              // ✅ Prova a estrarre JSON dal testo
                              const jsonMatch = bodyText.match(/\\{[\\s\\S]*\\}/);
                              if (jsonMatch) {
                                try {
                                  const json = JSON.parse(jsonMatch[0]);
                                  return { success: true, data: json, source: 'bodyText' };
                                } catch (e) {}
                              }
                              
                              // ✅ Prova a estrarre JSON dall'HTML
                              const jsonMatchHTML = bodyHTML.match(/<pre[^>]*>([\\s\\S]*?)<\\/pre>/i);
                              if (jsonMatchHTML) {
                                try {
                                  const json = JSON.parse(jsonMatchHTML[1]);
                                  return { success: true, data: json, source: 'preTag' };
                                } catch (e) {}
                              }
                              
                              // ✅ Prova a cercare JSON in script tags
                              const scriptTags = document.querySelectorAll('script');
                              for (let script of scriptTags) {
                                if (script.textContent) {
                                  const scriptMatch = script.textContent.match(/\\{[\\s\\S]*\\}/);
                                  if (scriptMatch) {
                                    try {
                                      const json = JSON.parse(scriptMatch[0]);
                                      return { success: true, data: json, source: 'scriptTag' };
                                    } catch (e) {}
                                  }
                                }
                              }
                              
                              return { success: false, reason: 'No JSON found in page' };
                            } catch (e) {
                              return { success: false, error: e.message };
                            }
                          })();
                        `);

                        if (pageContent.success && pageContent.data) {
                          console.log('[RVFU IPC API Retry] ✅ Risposta JSON trovata nella pagina dopo navigazione!');
                          console.log('[RVFU IPC API Retry] 🔍 Fonte:', pageContent.source);
                          // ✅ Rimuovi la richiesta quando viene risolta dopo retry navigazione
                          pendingRequests.delete(requestId);
                          clearTimeout(pending.timeout);
                          pending.resolve({
                            success: true,
                            status: 200,
                            statusText: 'OK',
                            headers: {},
                            data: pageContent.data
                          });
                          return;
                        } else {
                          // ✅ FASE 4: Debug completo dell'errore
                          console.error('[RVFU IPC API Retry] ❌ Nessun JSON trovato nella pagina dopo navigazione:', pageContent.reason || pageContent.error);
                          if (pageContent.debugInfo) {
                            console.log('[RVFU IPC API Retry] 🔍 FASE 4 - Debug completo errore pagina:', {
                              url: pageContent.debugInfo.url,
                              title: pageContent.debugInfo.title,
                              bodyTextPreview: pageContent.debugInfo.bodyTextPreview,
                              bodyHTMLPreview: pageContent.debugInfo.bodyHTMLPreview,
                              hasForbidden: pageContent.debugInfo.hasForbidden,
                              hasError: pageContent.debugInfo.hasError,
                              hasJson: pageContent.debugInfo.hasJson,
                              statusCode: pageContent.debugInfo.statusCode
                            });
                          }

                          // ✅ FASE 4: Prova a leggere il contenuto completo della pagina per capire meglio l'errore
                          try {
                            const fullPageContent = await persistentApiWindow.webContents.executeJavaScript(`
                              (function() {
                                return {
                                  bodyText: document.body ? document.body.innerText : '',
                                  bodyHTML: document.body ? document.body.innerHTML : '',
                                  title: document.title || '',
                                  url: window.location.href,
                                  allText: document.documentElement ? document.documentElement.innerText : ''
                                };
                              })();
                            `);

                            console.log('[RVFU IPC API Retry] 🔍 FASE 4 - Contenuto completo pagina errore:', {
                              url: fullPageContent.url,
                              title: fullPageContent.title,
                              bodyTextLength: fullPageContent.bodyText.length,
                              bodyHTMLLength: fullPageContent.bodyHTML.length,
                              allTextLength: fullPageContent.allText.length,
                              bodyText: fullPageContent.bodyText.substring(0, 1000),
                              bodyHTML: fullPageContent.bodyHTML.substring(0, 1000)
                            });
                          } catch (pageError) {
                            console.error('[RVFU IPC API Retry] ❌ Errore lettura contenuto pagina:', pageError);
                          }

                          // ✅ Rimuovi la richiesta quando viene rifiutata dopo retry navigazione
                          pendingRequests.delete(requestId);
                          clearTimeout(pending.timeout);
                          pending.reject(new Error(`Retry fallito dopo CDSSO: ${pageContent.reason || pageContent.error || 'Nessun JSON trovato'}`));
                          return;
                        }
                      } catch (navError) {
                        console.error('[RVFU IPC API Retry] ❌ Errore durante navigazione per retry:', navError);
                        if (interceptor) {
                          try {
                            interceptor.dispose();
                          } catch (e) { }
                        }
                        if (retryRequestInterceptor) {
                          try {
                            retryRequestInterceptor.dispose();
                          } catch (e) { }
                        }
                        if (retryResponseInterceptor) {
                          try {
                            retryResponseInterceptor.dispose();
                          } catch (e) { }
                        }
                        // ✅ Rimuovi la richiesta quando viene rifiutata dopo errore retry CDSSO
                        pendingRequests.delete(requestId);
                        clearTimeout(pending.timeout);
                        pending.reject(new Error(`Errore retry dopo CDSSO: ${navError.message}`));
                        return;
                      }

                      console.log('[RVFU IPC API] ✅ Retry richiesta inviata via fetch dalla pagina, in attesa risposta...');
                      // La risposta verrà gestita dal listener console-message esistente
                    } catch (retryError) {
                      console.error('[RVFU IPC API] ❌ Errore durante retry via fetch dalla pagina:', retryError);
                      // ✅ Rimuovi la richiesta quando viene rifiutata dopo errore retry
                      pendingRequests.delete(requestId);
                      clearTimeout(pending.timeout);
                      pending.reject(new Error(`CDSSO completato ma retry fallito: ${retryError.message}`));
                    }
                    return;
                  } else {
                    console.error('[RVFU IPC API] ❌ Finestra persistente non disponibile per CDSSO');
                    // ✅ Rimuovi la richiesta quando viene rifiutata (finestra non disponibile)
                    pendingRequests.delete(requestId);
                    clearTimeout(pending.timeout);
                    pending.reject(new Error('Finestra persistente non disponibile per completare CDSSO'));
                    return;
                  }
                }

                // Se è CDSSO ma richiede re-autenticazione (non navigazione)
                if (result.data._cdsso && result.data._requiresReauth) {
                  console.log('[RVFU IPC API] ⚠️ CDSSO rilevato - richiede re-autenticazione');
                  // ✅ Rimuovi la richiesta quando viene rifiutata (richiede re-auth)
                  pendingRequests.delete(requestId);
                  clearTimeout(pending.timeout);
                  pending.reject(new Error(
                    result.data._cdssoMessage ||
                    'CDSSO richiesto. È necessario rifare login RVFU per continuare.'
                  ));
                  return;
                }
                // Se è CDSSO e ha fatto retry, potrebbe essere ancora in corso
                if (result.data._cdssoRetried) {
                  console.log('[RVFU IPC API] ⚠️ CDSSO retry completato ma ancora HTML');
                  // ✅ Rimuovi la richiesta quando viene rifiutata (retry fallito)
                  pendingRequests.delete(requestId);
                  clearTimeout(pending.timeout);
                  pending.reject(new Error(
                    `CDSSO non completato automaticamente. ` +
                    `Il server ha restituito HTML invece di JSON dopo il retry. ` +
                    `\n\nSoluzione: Rifai login RVFU per aggiornare i cookie di sessione.`
                  ));
                  return;
                }
                console.log('[RVFU IPC API] ❌ Risposta HTML (CDSSO error)');
                // ✅ Rimuovi la richiesta quando viene rifiutata (HTML invece di JSON)
                pendingRequests.delete(requestId);
                clearTimeout(pending.timeout);
                pending.reject(new Error(
                  `Il server ha restituito HTML invece di JSON (Status: ${result.status}). ` +
                  `Probabile problema CDSSO. ` +
                  `\n\nSoluzione: Rifai login RVFU per aggiornare i cookie di sessione.`
                ));
              } else if (!result.ok) {
                console.log('[RVFU IPC API] ❌ Risposta non OK:', result.status, result.statusText);
                // ✅ Rimuovi la richiesta solo quando viene risolta o rifiutata (non CDSSO)
                pendingRequests.delete(requestId);
                clearTimeout(pending.timeout);
                pending.reject(new Error(`API call failed: ${result.status} ${result.statusText}`));
              } else {
                console.log('[RVFU IPC API] ✅ Risposta OK, risolvendo promise');
                // ✅ Rimuovi la richiesta solo quando viene risolta o rifiutata (non CDSSO)
                pendingRequests.delete(requestId);
                clearTimeout(pending.timeout);
                pending.resolve(result.data);
              }
            } else {
              console.log('[RVFU IPC API] ❌ Risposta con error:', result.error);
              // ✅ Rimuovi la richiesta solo quando viene risolta o rifiutata (non CDSSO)
              pendingRequests.delete(requestId);
              clearTimeout(pending.timeout);
              pending.reject(new Error(result.error || 'API call failed'));
            }
          } else {
            console.warn('[RVFU IPC API] ⚠️ Richiesta non trovata per requestId:', requestId);
            console.log('[RVFU IPC API] Richieste in attesa:', Array.from(pendingRequests.keys()));
          }
        } catch (parseError) {
          console.error('[RVFU IPC API] ❌ Errore parsing JSON:', parseError);
          console.error('[RVFU IPC API] Messaggio originale:', message.substring(0, 500));
        }
      }
    });

    // Verifica i cookie SSO disponibili nella sessione
    // ✅ Usa session.defaultSession direttamente (già importato all'inizio del file)
    session.defaultSession.cookies.get({ domain: 'ssoformazione.ilportaledeltrasporto.it' })
      .then((cookies) => {
        console.log('[RVFU IPC API] Cookie SSO disponibili nella sessione:', cookies.length);
        const ssoCookie = cookies.find(c => c.name === 'iPlanetDirectoryPro');
        if (ssoCookie) {
          console.log('[RVFU IPC API] ✅ Cookie iPlanetDirectoryPro trovato nella sessione!');
        } else {
          console.warn('[RVFU IPC API] ⚠️ Cookie iPlanetDirectoryPro NON trovato nella sessione');
        }
      })
      .catch(err => console.error('[RVFU IPC API] Errore nel recupero cookie:', err));

    // Carica prima la pagina SSO per stabilire la sessione, poi la pagina proxy
    const ssoUrl = 'https://ssoformazione.ilportaledeltrasporto.it/sso/';
    const ssoDomain = 'ssoformazione.ilportaledeltrasporto.it';
    console.log('[RVFU IPC API] 📍 STEP 1: Verifica cookie SSO e caricamento pagina SSO...', ssoUrl);

    return new Promise((resolve, reject) => {
      // ⚠️ IMPORTANTE: Verifica e imposta il cookie iPlanetDirectoryPro PRIMA di caricare la pagina
      // ✅ Usa session.defaultSession direttamente (già importato all'inizio del file)
      const defaultSession = session.defaultSession;

      defaultSession.cookies.get({ domain: ssoDomain })
        .then(async (cookies) => {
          console.log('[RVFU IPC API] 🔍 Cookie SSO PRIMA del caricamento:', {
            count: cookies.length,
            cookies: cookies.map(c => ({ name: c.name, domain: c.domain, httpOnly: c.httpOnly, value: c.value.substring(0, 20) + '...' }))
          });

          const iPlanetCookie = cookies.find(c => c.name === 'iPlanetDirectoryPro');

          if (!iPlanetCookie) {
            console.warn('[RVFU IPC API] ⚠️ Cookie iPlanetDirectoryPro NON TROVATO nella sessione!');
            console.warn('[RVFU IPC API] ⚠️ La finestra persistente potrebbe non funzionare senza cookie SSO.');
            console.warn('[RVFU IPC API] 💡 Assicurati di aver fatto login prima di usare le API.');
          } else {
            console.log('[RVFU IPC API] ✅ Cookie iPlanetDirectoryPro trovato nella sessione!');

            // Imposta il cookie esplicitamente per la finestra persistente
            // IMPORTANTE: Imposta il cookie sia per il dominio SSO che per il dominio API
            try {
              // Cookie per dominio SSO
              await defaultSession.cookies.set({
                url: `https://${ssoDomain}/sso/`,
                name: 'iPlanetDirectoryPro',
                value: iPlanetCookie.value,
                domain: ssoDomain,
                path: '/',
                secure: true,
                httpOnly: true,
              });
              console.log('[RVFU IPC API] ✅ Cookie iPlanetDirectoryPro impostato per dominio SSO');

              // FIX: Imposta anche per il dominio API (formazione.ilportaledeltrasporto.it)
              // Il cookie deve essere disponibile anche per le chiamate API
              const apiDomain = 'formazione.ilportaledeltrasporto.it';
              await defaultSession.cookies.set({
                url: `https://${apiDomain}/`,
                name: 'iPlanetDirectoryPro',
                value: iPlanetCookie.value,
                domain: apiDomain,
                path: '/',
                secure: true,
                httpOnly: true,
              });
              console.log('[RVFU IPC API] ✅ Cookie iPlanetDirectoryPro impostato per dominio API');

              // Prova anche con dominio parent (.ilportaledeltrasporto.it) per condivisione cross-subdomain
              try {
                await defaultSession.cookies.set({
                  url: `https://ilportaledeltrasporto.it/`,
                  name: 'iPlanetDirectoryPro',
                  value: iPlanetCookie.value,
                  domain: '.ilportaledeltrasporto.it', // Dominio parent con punto iniziale
                  path: '/',
                  secure: true,
                  httpOnly: true,
                });
                console.log('[RVFU IPC API] ✅ Cookie iPlanetDirectoryPro impostato per dominio parent (.ilportaledeltrasporto.it)');
              } catch (parentError) {
                console.warn('[RVFU IPC API] ⚠️ Impossibile impostare cookie per dominio parent:', parentError.message);
              }
            } catch (cookieError) {
              console.error('[RVFU IPC API] ⚠️ Errore impostazione cookie:', cookieError);
              // Continua comunque - il cookie potrebbe essere già presente
            }
          }

          // ✅ IMPORTANTE: Verifica se il cookie iPlanetDirectoryPro è già disponibile nella sessione
          // Se è disponibile, significa che il login è già stato fatto e possiamo usarlo
          const existingCookies = await session.defaultSession.cookies.get({ domain: ssoDomain });
          const existingIPlanetCookie = existingCookies.find(c => c.name === 'iPlanetDirectoryPro');

          // ✅ Verifica anche il dominio parent per vedere se il cookie è condiviso
          const parentCookies = await session.defaultSession.cookies.get({ domain: '.ilportaledeltrasporto.it' });
          const parentIPlanetCookie = parentCookies.find(c => c.name === 'iPlanetDirectoryPro');

          if (existingIPlanetCookie) {
            console.log('[RVFU IPC API] ✅ Cookie iPlanetDirectoryPro già presente nella sessione dopo login!');
            console.log('[RVFU IPC API] 🔍 Cookie details:', {
              name: existingIPlanetCookie.name,
              domain: existingIPlanetCookie.domain,
              path: existingIPlanetCookie.path,
              secure: existingIPlanetCookie.secure,
              httpOnly: existingIPlanetCookie.httpOnly,
              valueLength: existingIPlanetCookie.value.length,
              valuePrefix: existingIPlanetCookie.value.substring(0, 50) + '...'
            });

            // ✅ IMPORTANTE: Se il cookie è solo per ssoDomain, copialo anche per il dominio parent
            // Questo garantisce che sia disponibile per formazione.ilportaledeltrasporto.it
            if (!parentIPlanetCookie && existingIPlanetCookie.domain !== '.ilportaledeltrasporto.it') {
              console.log('[RVFU IPC API] 🔄 Cookie presente solo per SSO domain, copiando per dominio parent...');
              try {
                await session.defaultSession.cookies.set({
                  url: 'https://formazione.ilportaledeltrasporto.it/',
                  name: 'iPlanetDirectoryPro',
                  value: existingIPlanetCookie.value,
                  domain: '.ilportaledeltrasporto.it', // Dominio parent per condivisione cross-subdomain
                  path: '/',
                  secure: true,
                  httpOnly: true,
                  sameSite: 'lax'
                });
                console.log('[RVFU IPC API] ✅ Cookie iPlanetDirectoryPro copiato per dominio parent (.ilportaledeltrasporto.it)');
              } catch (cookieError) {
                console.error('[RVFU IPC API] ❌ Errore copia cookie per dominio parent:', cookieError);
              }
            } else if (parentIPlanetCookie) {
              console.log('[RVFU IPC API] ✅ Cookie iPlanetDirectoryPro già presente per dominio parent!');
            }
          } else {
            console.warn('[RVFU IPC API] ⚠️ Cookie iPlanetDirectoryPro NON trovato nella sessione dopo login!');
            console.warn('[RVFU IPC API] ⚠️ Questo potrebbe causare problemi con le API calls!');
            console.warn('[RVFU IPC API] 💡 Assicurati di aver fatto login prima di usare le API.');
          }

          // ✅ IMPORTANTE: Carica prima la pagina SSO per stabilire la sessione, poi la pagina API
          // Questo assicura che il cookie iPlanetDirectoryPro sia disponibile e che la sessione SSO sia attiva
          const ssoPageUrl = `https://${ssoDomain}/sso/`;
          console.log('[RVFU IPC API] 📍 STEP 2: Caricamento pagina SSO per stabilire sessione:', ssoPageUrl);
          persistentApiWindow.loadURL(ssoPageUrl);

          // Listener per quando la pagina SSO è caricata
          persistentApiWindow.webContents.once('did-finish-load', () => {
            const currentUrl = persistentApiWindow.webContents.getURL();
            console.log('[RVFU IPC API] ✅ Pagina SSO caricata:', currentUrl);

            // Dopo aver caricato la pagina SSO, carica la pagina RVFU per stabilire la sessione completa
            const rvfuBaseUrl = 'https://formazione.ilportaledeltrasporto.it/';
            console.log('[RVFU IPC API] 📍 STEP 3: Caricamento pagina RVFU per stabilire sessione API:', rvfuBaseUrl);
            persistentApiWindow.loadURL(rvfuBaseUrl);

            // Listener per quando la pagina RVFU è caricata
            persistentApiWindow.webContents.once('did-finish-load', () => {
              const finalUrl = persistentApiWindow.webContents.getURL();
              console.log('[RVFU IPC API] ✅ Pagina RVFU caricata:', finalUrl);
              console.log('[RVFU IPC API] ✅ Sessione SSO stabilita');

              // Inietta JavaScript per gestire le chiamate API direttamente
              // Ora abbiamo una pagina con l'origine corretta, quindi i cookie dovrebbero funzionare
              // ✅ Aggiungi un indicatore visivo che la finestra è pronta
              persistentApiWindow.webContents.executeJavaScript(`
              (function() {
                // ✅ Aggiungi indicatore visivo che la finestra è pronta (verifica se esiste già)
                let indicator = document.getElementById('rvfu-api-indicator');
                if (!indicator) {
                  indicator = document.createElement('div');
                  indicator.id = 'rvfu-api-indicator';
                  indicator.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #0f0; color: #000; padding: 10px; text-align: center; font-weight: bold; z-index: 999999; font-family: monospace;';
                  document.body.appendChild(indicator);
                }
                indicator.textContent = '✅ RVFU API Proxy - Finestra Persistente PRONTA';
                
                // Crea un listener globale per le chiamate API
                window.__rvfuApiProxy = {
                  handleRequest: async function(requestId, method, url, headers, body) {
                    // FIX: Usa JSON.stringify per evitare errori di sintassi con caratteri speciali nell'URL
                    console.log('[RVFU API Proxy] 📤 Richiesta ricevuta:', JSON.stringify({ requestId, method, url: url ? url.substring(0, 100) : null }));
                    
                    // DEBUG: Verifica cookie disponibili nella pagina
                    console.log('[RVFU API Proxy] 🔍 Cookie disponibili nella pagina:', {
                      cookieString: document.cookie || 'NESSUN COOKIE',
                      cookieCount: document.cookie ? document.cookie.split(';').filter(c => c.trim()).length : 0,
                      hasIPlanetCookie: document.cookie ? document.cookie.includes('iPlanetDirectoryPro') : false,
                      url: window.location.href,
                      origin: window.location.origin
                    });
                    
                    // DEBUG: Verifica headers Authorization
                    console.log('[RVFU API Proxy] 🔍 Headers richiesta:', {
                      hasAuthorization: !!(headers && headers.Authorization),
                      authorizationPrefix: headers && headers.Authorization ? headers.Authorization.substring(0, 30) + '...' : 'NONE',
                      allHeaders: headers || {}
                    });
                    
                    try {
                      let response;
                      
                      try {
                        response = await fetch(url, {
                          method,
                          headers: headers || {},
                          body: body || undefined,
                          credentials: 'include', // IMPORTANTE: Invia cookie automaticamente dalla sessione
                          redirect: 'follow' // Seguiamo i redirect automaticamente
                        });
                      } catch (fetchError) {
                        console.error('[RVFU API Proxy] ❌ Errore fetch iniziale:', fetchError);
                        throw fetchError;
                      }
                      
                      // Verifica che la risposta sia valida
                      if (!response || response.status === 0) {
                        throw new Error('Risposta non valida o errore di rete (status: 0)');
                      }
                      
                      const contentType = response.headers.get('content-type') || '';
                      const isJSON = contentType.includes('application/json');
                      
                      let data;
                      if (isJSON) {
                        data = await response.json();
                      } else {
                        const text = await response.text();
                        
                        // Se riceviamo HTML con form CDSSO, secondo ForgeRock dobbiamo navigare nella finestra
                        // persistente al form CDSSO, submit automatico, e riprovare la richiesta
                        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                          // Controlla se è il form CDSSO
                          if (text.includes('/agent/cdsso-oauth2') && text.includes('name="id_token"')) {
                            console.log('[RVFU API Proxy] 🔐 Rilevato form CDSSO secondo ForgeRock - navigazione nella finestra persistente...');
                            
                            try {
                              // Estrai l'id_token e l'action dal form (dal testo COMPLETO, non troncato)
                              const idTokenMatch = text.match(/name="id_token"\\s+value="([^"]+)"/) || text.match(/name="id_token" value="([^"]+)"/);
                              const formActionMatch = text.match(/action="([^"]+)"/);
                              
                              if (idTokenMatch && formActionMatch) {
                                const idToken = idTokenMatch[1];
                                let formAction = formActionMatch[1];
                                
                                // ✅ FIX CRITICO: NON normalizzare l'URL del form action!
                                // Il server si aspetta esattamente l'URL indicato nel form (anche se è http://...:80)
                                // La normalizzazione rompe il flow CDSSO e impedisce l'impostazione dei cookie corretti
                                // Solo se non inizia con http/https, aggiungi il dominio base
                                if (!formAction.startsWith('http://') && !formAction.startsWith('https://')) {
                                  formAction = 'https://formazione.ilportaledeltrasporto.it' + (formAction.startsWith('/') ? formAction : '/' + formAction);
                                }
                                
                                console.log('[RVFU API Proxy] 🔐 Estratto id_token, lunghezza:', idToken.length);
                                console.log('[RVFU API Proxy] 🔐 Form action ORIGINALE (NON normalizzato):', formAction);
                                console.log('[RVFU API Proxy] ⚠️ IMPORTANTE: Usando URL esatto dal form per preservare flow CDSSO');
                                
                                // SECONDO FORGEROCK: Naviga nella finestra persistente al form CDSSO
                                // Questo permette al CDSSO di completarsi nella stessa finestra
                                // e i cookie vengono aggiornati automaticamente
                                data = { 
                                  _html: true, 
                                  _text: text.substring(0, 1000), 
                                  _cdsso: true,
                                  _cdssoMessage: 'CDSSO rilevato. Completamento automatico nella finestra persistente...',
                                  _requiresReauth: false, // Non richiede re-login, solo CDSSO
                                  _idToken: idToken, // ✅ Passa id_token completo per navigazione
                                  _formAction: formAction, // ✅ Passa form action normalizzato
                                  _cdssoNavigate: true // ✅ Flag per indicare che serve navigazione
                                };
                              } else {
                                throw new Error('Impossibile estrarre id_token o form action dal form CDSSO');
                              }
                            } catch (cdssoError) {
                              console.error('[RVFU API Proxy] ❌ Errore durante handling CDSSO:', cdssoError);
                              data = { 
                                _html: true, 
                                _text: text.substring(0, 1000), 
                                _cdsso: true,
                                _cdssoMessage: 'Errore durante completamento CDSSO: ' + cdssoError.message,
                                _requiresReauth: true
                              };
                            }
                          } else {
                            // HTML normale, non CDSSO
                            data = { _html: true, _text: text.substring(0, 1000) };
                          }
                        } else {
                          data = text;
                        }
                      }
                      
                      // Invia risultato via console.log (intercettato da Electron)
                      // Usa un formato più semplice per evitare problemi con console-message
                      const responseJson = JSON.stringify({
                        id: requestId,
                        success: true,
                        status: response.status,
                        statusText: response.statusText,
                        ok: response.ok,
                        headers: Array.from(response.headers.entries()).reduce((acc, [key, value]) => { acc[key] = value; return acc; }, {}),
                        data
                      });
                      
                      console.log('[RVFU API Proxy] 📤 Invio risposta:', responseJson.substring(0, 200) + '...');
                      console.log('API Response:', responseJson);
                    } catch (error) {
                      console.error('[RVFU API Proxy] Errore:', error);
                      console.log('API Response:', JSON.stringify({
                        id: requestId,
                        success: false,
                        error: error.message,
                        stack: error.stack
                      }));
                    }
                  }
                };
                
                // Listener per messaggi dal processo main
                window.addEventListener('message', async (event) => {
                  if (!event.data || typeof event.data !== 'object') return;
                  
                  const { id, method, url, headers, body } = event.data;
                  
                  if (!id || !method || !url) return;
                  
                  // Usa il proxy globale
                  window.__rvfuApiProxy.handleRequest(id, method, url, headers, body);
                });
                
                console.log('[RVFU API Proxy] ✅ Proxy inizializzato (pagina RVFU)');
                console.log('[RVFU API Proxy] ℹ️ Sessione SSO stabilita, cookie disponibili');
                
                // ✅ Aggiorna indicatore visivo (usa la variabile già dichiarata sopra)
                indicator = document.getElementById('rvfu-api-indicator');
                if (indicator) {
                  indicator.textContent = '✅ RVFU API Proxy - PRONTO per ricevere richieste';
                  indicator.style.background = '#0f0';
                } else {
                  // Se l'indicatore non esiste, crealo
                  indicator = document.createElement('div');
                  indicator.id = 'rvfu-api-indicator';
                  indicator.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #0f0; color: #000; padding: 10px; text-align: center; font-weight: bold; z-index: 999999; font-family: monospace;';
                  indicator.textContent = '✅ RVFU API Proxy - PRONTO per ricevere richieste';
                  document.body.appendChild(indicator);
                }
              })();
            `).then(() => {
                console.log('[RVFU IPC API] ✅ JavaScript iniettato nella pagina vuota');

                // Verifica cookie FINALE
                defaultSession.cookies.get({ domain: ssoDomain })
                  .then((cookies) => {
                    const ssoCookie = cookies.find(c => c.name === 'iPlanetDirectoryPro');
                    console.log('[RVFU IPC API] 🔍 Cookie FINALE:', {
                      count: cookies.length,
                      hasIPlanetCookie: !!ssoCookie,
                      iPlanetCookie: ssoCookie ? {
                        name: ssoCookie.name,
                        domain: ssoCookie.domain,
                        httpOnly: ssoCookie.httpOnly,
                        secure: ssoCookie.secure,
                        value: ssoCookie.value.substring(0, 30) + '...'
                      } : null,
                      note: 'I cookie httpOnly vengono inviati automaticamente anche da about:blank se nella sessione'
                    });
                  })
                  .catch(err => console.error('[RVFU IPC API] Errore recupero cookie:', err));

                apiWindowReady = true;
                resolve(true);
              }).catch((error) => {
                console.error('[RVFU IPC API] Errore iniezione JavaScript:', error);
                reject(error);
              });
            });
          });
        })
        .catch(err => {
          console.error('[RVFU IPC API] Errore recupero cookie:', err);
          // Carica comunque la pagina vuota
          persistentApiWindow.loadURL('about:blank');

          persistentApiWindow.webContents.once('did-finish-load', () => {
            // Inietta comunque il JavaScript
            persistentApiWindow.webContents.executeJavaScript(`
              window.__rvfuApiProxy = {
                handleRequest: async function(requestId, method, url, headers, body) {
                  try {
                    const response = await fetch(url, {
                      method,
                      headers: headers || {},
                      body: body || undefined,
                      credentials: 'include'
                    });
                    const contentType = response.headers.get('content-type') || '';
                    const isJSON = contentType.includes('application/json');
                    let data = isJSON ? await response.json() : await response.text();
                    if (typeof data === 'string' && (data.trim().startsWith('<!DOCTYPE') || data.trim().startsWith('<html'))) {
                      data = { _html: true, _text: data.substring(0, 1000) };
                    }
                    console.log('API Response:', JSON.stringify({ id: requestId, success: true, status: response.status, statusText: response.statusText, ok: response.ok, data }));
                  } catch (error) {
                    console.log('API Response:', JSON.stringify({ id: requestId, success: false, error: error.message }));
                  }
                }
              };
              window.addEventListener('message', async (event) => {
                if (event.data && typeof event.data === 'object' && event.data.id && event.data.method && event.data.url) {
                  window.__rvfuApiProxy.handleRequest(event.data.id, event.data.method, event.data.url, event.data.headers, event.data.body);
                }
              });
            `).then(() => {
              apiWindowReady = true;
              resolve(true);
            }).catch(reject);
          });
        });

      persistentApiWindow.webContents.once('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('[RVFU IPC API] ❌ Errore caricamento pagina SSO:', errorDescription);
        apiWindowReady = false;
        reject(new Error(`Failed to load SSO page: ${errorDescription}`));
      });
    });

    // ⚠️ NOTA: Il listener console-message è già stato impostato PRIMA (riga ~1200)
    // Non serve impostarlo di nuovo qui - questo era un duplicato

    // Gestisci chiusura
    persistentApiWindow.on('closed', () => {
      console.log('[RVFU IPC API] Finestra persistente chiusa');
      persistentApiWindow = null;
      apiWindowReady = false;
      // Rifiuta tutte le richieste in attesa
      for (const [id, pending] of pendingRequests.entries()) {
        pending.reject(new Error('API window was closed'));
      }
      pendingRequests.clear();
    });

    // Apri DevTools per debug (opzionale)
    // persistentApiWindow.webContents.openDevTools({ mode: 'detach' });

    return true;
  };

  // Apre/riutilizza una finestra BrowserWindow persistente per le chiamate API
  handleSafe('rvfu:init-api-window', async () => {
    try {
      await initPersistentApiWindow();
      return { success: true, alreadyOpen: false };
    } catch (error) {
      console.error('[RVFU IPC API] Errore inizializzazione finestra:', error);
      return { success: false, error: error.message };
    }
  });

  // Apre una finestra per completare il CDSSO manualmente
  handleSafe('rvfu:open-cdsso-window', async ({ url, message }) => {
    const { BrowserWindow } = require('electron');
    const defaultSession = session.defaultSession;

    console.log('[RVFU IPC] Apertura finestra CDSSO:', { url, message });

    const cdssoWindow = new BrowserWindow({
      width: 800,
      height: 700,
      show: true,
      modal: false, // Non modale, così l'utente può interagire
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false,
        session: defaultSession, // Usa sessione condivisa per avere i cookie
      },
    });

    // Mostra messaggio all'utente
    if (message) {
      console.log('[RVFU IPC] Messaggio CDSSO:', message);
    }

    // Carica la pagina CDSSO
    // Se l'URL contiene già l'id_token nel form, il form verrà submitato automaticamente
    // Altrimenti, l'utente dovrà interagire manualmente
    cdssoWindow.loadURL(url);

    // Apri DevTools per debug
    cdssoWindow.webContents.openDevTools({ mode: 'detach' });

    // Log quando la finestra viene chiusa
    cdssoWindow.on('closed', () => {
      console.log('[RVFU IPC] Finestra CDSSO chiusa. L\'utente può ora riprovare la richiesta originale.');
    });

    return { success: true, windowId: cdssoWindow.id };
  });

  // Chiude la finestra persistente (chiamato al logout)
  handleSafe('rvfu:close-api-window', async () => {
    if (persistentApiWindow && !persistentApiWindow.isDestroyed()) {
      console.log('[RVFU IPC API] Chiusura finestra persistente...');
      persistentApiWindow.close();
      persistentApiWindow = null;
      apiWindowReady = false;
      // Rifiuta tutte le richieste in attesa
      for (const [id, pending] of pendingRequests.entries()) {
        pending.reject(new Error('API window was closed by logout'));
      }
      pendingRequests.clear();
    }
    return { success: true };
  });

  // ✅ Token exchange nel main process (ha VPN, può raggiungere SSO direttamente)
  // Il renderer NON può fare fetch a ssoformazione.ilportaledeltrasporto.it (no VPN)
  handleSafe('rvfu:exchange-token', async ({ code, clientId, clientSecret, redirectUri, ssoBaseUrl }) => {
    if (!code || !clientId || !clientSecret || !redirectUri || !ssoBaseUrl) {
      throw new Error('rvfu:exchange-token: code, clientId, clientSecret, redirectUri, ssoBaseUrl sono richiesti');
    }

    console.log('[RVFU IPC Exchange] 🔄 Token exchange via net.request (main process):', {
      ssoBaseUrl,
      clientId,
      codePrefix: code.substring(0, 20) + '...',
    });

    const tokenUrl = `${ssoBaseUrl}/oauth2/realms/root/realms/pdtusers/access_token`;
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    const body = params.toString();

    return new Promise((resolve, reject) => {
      const urlObj = new URL(tokenUrl);
      const request = net.request({
        method: 'POST',
        url: tokenUrl,
      });

      request.setHeader('Content-Type', 'application/x-www-form-urlencoded');

      let responseData = Buffer.alloc(0);

      request.on('response', (response) => {
        console.log('[RVFU IPC Exchange] 📥 Risposta token exchange:', {
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
          contentType: response.headers['content-type'],
        });

        response.on('data', (chunk) => {
          responseData = Buffer.concat([responseData, chunk]);
        });

        response.on('end', () => {
          try {
            const text = responseData.toString('utf-8');
            console.log('[RVFU IPC Exchange] 📄 Risposta body (primi 200 char):', text.substring(0, 200));

            if (response.statusCode !== 200) {
              reject(new Error(`Token exchange fallito: HTTP ${response.statusCode} - ${text.substring(0, 100)}`));
              return;
            }

            const data = JSON.parse(text);
            console.log('[RVFU IPC Exchange] ✅ Token exchange riuscito!', {
              hasAccessToken: !!data.access_token,
              hasIdToken: !!data.id_token,
              hasRefreshToken: !!data.refresh_token,
              accessTokenLength: data.access_token?.length,
              idTokenLength: data.id_token?.length,
              expiresIn: data.expires_in,
            });

            const expiresIn = data.expires_in ? (data.expires_in * 1000) : (24 * 60 * 60 * 1000);
            resolve({
              idToken: data.id_token,
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
              expiresAt: Date.now() + expiresIn,
            });
          } catch (err) {
            reject(new Error(`Token exchange: errore parsing risposta: ${err.message}`));
          }
        });
      });

      request.on('error', (err) => {
        console.error('[RVFU IPC Exchange] ❌ Errore net.request:', err);
        reject(new Error(`Token exchange net.request error: ${err.message}`));
      });

      request.write(body);
      request.end();
    });
  });

  // ✅ NUOVO APPROCCIO: Usa net.request direttamente dal processo main
  // Questo garantisce che i cookie della sessione vengano sempre inviati
  // IMPORTANTE: Prima naviga la finestra persistente all'URL per stabilire sessione
  handleSafe('rvfu:api-call-direct', async (params) => {
    const { method, url, headers, body } = params || {};

    if (!method || !url) {
      throw new Error(`rvfu:api-call-direct: method and url are required. Received: ${JSON.stringify({ method, url, params })}`);
    }

    console.log('[RVFU IPC API Direct] 🔄 Richiesta via net.request:', {
      method,
      url: url.substring(0, 100),
      hasAuth: !!(headers && headers.Authorization),
      hasBody: !!body
    });

    // ✅ FIX CRITICO: Le API REST richiedono SOLO Bearer id_token, NON sessione/CDSSO
    // Manuale SpecificheWS-GestioneDemolitori1.25.md, sezione 5.3 punto 7:
    // "Il Client chiama l'API Gateway passando l'IDToken (Bearer) nel Header Authorization."
    // La navigazione finestra attiva il CDSSO che è per il portale web UI, NON per le API REST.
    const isAPIRest = url.includes('/demolitori-aci-ws/rest/') ||
      url.includes('/agenzia/') ||
      url.includes('/cr/');

    if (isAPIRest) {
      console.log('[RVFU IPC API Direct] ✅ API REST rilevata - solo Bearer id_token, NO navigazione finestra, NO CDSSO');
    } else {
      // Solo per UI/CDSSO: naviga la finestra persistente
      console.log('[RVFU IPC API Direct] ⚠️ Endpoint UI rilevato - navigazione finestra per CDSSO');
      if (!persistentApiWindow || persistentApiWindow.isDestroyed() || !apiWindowReady) {
        console.log('[RVFU IPC API Direct] ⚠️ Finestra persistente non disponibile, inizializzazione...');
        await initPersistentApiWindow();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      try {
        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.warn('[RVFU IPC API Direct] ⚠️ Timeout navigazione, continuo...');
            resolve();
          }, 15000);

          const onFinishLoad = () => {
            clearTimeout(timeout);
            persistentApiWindow.webContents.removeListener('did-finish-load', onFinishLoad);
            persistentApiWindow.webContents.removeListener('did-fail-load', onFailLoad);
            console.log('[RVFU IPC API Direct] ✅ Finestra navigata');
            setTimeout(resolve, 1000);
          };

          const onFailLoad = () => {
            clearTimeout(timeout);
            persistentApiWindow.webContents.removeListener('did-finish-load', onFinishLoad);
            persistentApiWindow.webContents.removeListener('did-fail-load', onFailLoad);
            resolve();
          };

          persistentApiWindow.webContents.once('did-finish-load', onFinishLoad);
          persistentApiWindow.webContents.once('did-fail-load', onFailLoad);

          const extraHeaders = headers && headers.Authorization
            ? `Authorization: ${headers.Authorization}\r\n`
            : '';

          if (extraHeaders) {
            persistentApiWindow.webContents.loadURL(url, { extraHeaders });
          } else {
            persistentApiWindow.webContents.loadURL(url);
          }
        });
      } catch (error) {
        console.warn('[RVFU IPC API Direct] ⚠️ Errore navigazione finestra:', error);
      }
    }

    return new Promise((resolve, reject) => {
      const requestUrl = new URL(url);
      const domain = requestUrl.hostname;

      // ✅ FIX: Il Web Agent ForgeRock intercetta TUTTE le richieste su formazione.ilportaledeltrasporto.it
      // e richiede il cookie iPlanetDirectoryPro. Senza questo cookie, redirige al CDSSO.
      // Per API REST: inviamo iPlanetDirectoryPro (per passare il Web Agent) + Bearer token (per il backend).
      const isAPIRestRequest = url.includes('/demolitori-aci-ws/rest/') ||
        url.includes('/agenzia/') ||
        url.includes('/cr/');

      // Recupera cookie da tutti i domini (serve iPlanetDirectoryPro per il Web Agent)
      Promise.all([
        session.defaultSession.cookies.get({ domain }),
        session.defaultSession.cookies.get({ domain: 'ssoformazione.ilportaledeltrasporto.it' }),
        session.defaultSession.cookies.get({ domain: '.ilportaledeltrasporto.it' })
      ]).then(([domainCookies, ssoCookies, parentCookies]) => {

        const allCookies = [...domainCookies, ...ssoCookies, ...parentCookies];
        // ✅ FIX 13/04/2026: Cerca entrambi i cookie (pdtsso-form ha priorità, poi iPlanetDirectoryPro)
        const SSO_COOKIE_NAMES = ['pdtsso-form', 'iPlanetDirectoryPro'];
        const ssoCookie = allCookies.find(c => SSO_COOKIE_NAMES.includes(c.name));

        console.log('[RVFU IPC API Direct] 🔍 Cookie disponibili:', {
          domain: domain,
          totalCookies: allCookies.length,
          ssoCookieFound: ssoCookie ? ssoCookie.name : 'NONE',
          isAPIRest: isAPIRestRequest,
          cookieNames: allCookies.map(c => c.name)
        });

        // ✅ FIX 02/03/2026: Usa session.defaultSession per invio automatico cookies
        // net.request con session gestisce domain matching, path, httpOnly, secure correttamente
        let cookieHeader = ''; // Non serve più - la session li invia automaticamente
        if (ssoCookie) {
          console.log(`[RVFU IPC API Direct] ✅ Cookie SSO '${ssoCookie.name}' trovato - session lo invierà automaticamente`);
        } else {
          console.warn('[RVFU IPC API Direct] ⚠️ Cookie SSO (pdtsso-form o iPlanetDirectoryPro) NON trovato nella session!');
        }

        const request = net.request({
          method: method,
          url: url,
          session: session.defaultSession, // ← Invia cookies automaticamente
        });

        // Aggiungi gli header
        if (headers) {
          Object.entries(headers).forEach(([key, value]) => {
            if (value) {
              request.setHeader(key, String(value));
              // Log dettagliato per Authorization header e verifica scadenza token
              if (key.toLowerCase() === 'authorization') {
                const authValue = String(value);
                const tokenValue = authValue.replace('Bearer ', '');

                // Verifica se il token è scaduto decodificando il JWT
                let tokenInfo = null;
                if (tokenValue.startsWith('eyJ')) {
                  try {
                    const parts = tokenValue.split('.');
                    if (parts.length === 3) {
                      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
                      const exp = payload.exp ? new Date(payload.exp * 1000) : null;
                      const now = new Date();
                      const isExpired = exp ? exp < now : false;
                      const expiresIn = exp ? Math.floor((exp.getTime() - now.getTime()) / 1000) : null;

                      tokenInfo = {
                        exp: exp?.toISOString(),
                        now: now.toISOString(),
                        isExpired,
                        expiresIn,
                        iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : null
                      };

                      if (isExpired) {
                        console.error('[RVFU IPC API Direct] ❌ TOKEN JWT SCADUTO!', tokenInfo);
                      } else if (expiresIn && expiresIn < 300) {
                        console.warn('[RVFU IPC API Direct] ⚠️ Token JWT scade tra', expiresIn, 'secondi');
                      } else {
                        console.log('[RVFU IPC API Direct] ✅ Token JWT valido, scade tra', expiresIn, 'secondi');
                      }
                    }
                  } catch (e) {
                    console.warn('[RVFU IPC API Direct] ⚠️ Impossibile decodificare JWT:', e.message);
                  }
                }

                const isJWT = tokenValue.startsWith('eyJ');
                console.log('[RVFU IPC API Direct] 🔐 Authorization header:', {
                  prefix: authValue.substring(0, 20) + '...',
                  length: authValue.length,
                  isBearer: authValue.startsWith('Bearer '),
                  tokenLength: tokenValue.length,
                  tokenType: isJWT ? 'id_token (JWT)' : 'access_token (opaque)',
                  tokenInfo
                });
              }
            }
          });
        }

        // 🧪 TEST 3: Aggiungi cookie header + Bearer Token insieme
        // Il server potrebbe richiedere sia Bearer Token che cookie di sessione
        if (cookieHeader) {
          request.setHeader('Cookie', cookieHeader);
          console.log('[RVFU IPC API Direct] 🧪 TEST 3: Cookie header aggiunto, lunghezza:', cookieHeader.length);
          console.log('[RVFU IPC API Direct] 🧪 TEST 3: Usando Bearer Token + Cookie insieme');
        }

        // ✅ Timeout per evitare hang infiniti (30 secondi)
        const REQUEST_TIMEOUT_MS = 30000;
        const requestTimeout = setTimeout(() => {
          console.error(`[RVFU IPC API Direct] ❌ TIMEOUT ${REQUEST_TIMEOUT_MS}ms - la richiesta ${method} non ha ricevuto risposta`);
          try { request.abort(); } catch (e) { /* ignore */ }
          reject(new Error(`Timeout: il server non ha risposto entro ${REQUEST_TIMEOUT_MS / 1000} secondi per ${method} ${url.substring(0, 80)}`));
        }, REQUEST_TIMEOUT_MS);

        // ✅ Gestione redirect — per POST non seguire redirect (perde il body)
        request.on('redirect', (statusCode, redirectMethod, redirectUrl) => {
          console.warn('[RVFU IPC API Direct] ⚠️ REDIRECT ricevuto:', { statusCode, redirectMethod, redirectUrl: redirectUrl?.substring(0, 150), originalMethod: method });
          if (method === 'POST' || method === 'PUT') {
            clearTimeout(requestTimeout);
            console.error(`[RVFU IPC API Direct] ❌ Redirect su ${method} — NON seguo (perderebbe il body). Probabile CDSSO.`);
            reject(new Error(`Il server ha rediretto la richiesta ${method} (${statusCode}). Possibile sessione scaduta — rifai login RVFU.`));
          } else {
            console.log('[RVFU IPC API Direct] ↪️ Seguo redirect per', method);
            request.followRedirect();
          }
        });

        // Gestisci la risposta
        let responseData = Buffer.alloc(0);
        let isJSON = false;

        request.on('response', (response) => {
          clearTimeout(requestTimeout);
          const contentType = response.headers['content-type'] || '';
          isJSON = contentType.includes('application/json');

          console.log('[RVFU IPC API Direct] 📥 Risposta ricevuta:', {
            statusCode: response.statusCode,
            statusMessage: response.statusMessage,
            contentType,
            isJSON,
            headers: Object.keys(response.headers),
            wwwAuthenticate: response.headers['www-authenticate'] || 'none',
            allHeaders: JSON.stringify(response.headers).substring(0, 500)
          });

          response.on('data', (chunk) => {
            responseData = Buffer.concat([responseData, chunk]);
          });

          response.on('end', () => {
            try {
              const dataString = responseData.toString('utf-8');

              // Se è HTML o 401, potrebbe essere un CDSSO o un problema di autenticazione
              if (response.statusCode === 401 || (!isJSON && (dataString.trim().startsWith('<!DOCTYPE') || dataString.trim().startsWith('<html')))) {
                console.log('[RVFU IPC API Direct] ⚠️ Risposta HTML/401 ricevuta (potrebbe essere CDSSO o token scaduto)');
                console.log('[RVFU IPC API Direct] 🔍 Status Code:', response.statusCode);
                console.log('[RVFU IPC API Direct] 🔍 Content-Type:', response.headers['content-type']);
                console.log('[RVFU IPC API Direct] 🔍 Location header:', response.headers['location'] || 'none');
                console.log('[RVFU IPC API Direct] 🔍 Contenuto risposta (primi 2000 caratteri):', dataString.substring(0, 2000));

                // Cerca pattern CDSSO nella risposta HTML
                const hasCdssoForm = dataString.includes('/agent/cdsso-oauth2') || dataString.includes('cdsso-oauth2');
                const hasIdToken = dataString.includes('id_token') || dataString.includes('idToken');
                const hasFormPost = dataString.includes('form_post') || dataString.includes('form-post');

                console.log('[RVFU IPC API Direct] 🔍 Pattern CDSSO trovati:', {
                  hasCdssoForm,
                  hasIdToken,
                  hasFormPost,
                  responseLength: dataString.length
                });

                // Controlla se è un form CDSSO
                if (hasCdssoForm && hasIdToken) {
                  console.log('[RVFU IPC API Direct] 🔐 Form CDSSO rilevato nella risposta');

                  // Estrai informazioni CDSSO con pattern più flessibili
                  const idTokenPatterns = [
                    /name=["']id_token["'][\s]*value=["']([^"']+)["']/i,
                    /name=["']idToken["'][\s]*value=["']([^"']+)["']/i,
                    /id_token["']?\s*[:=]\s*["']([^"']+)["']/i,
                    /"id_token"\s*:\s*"([^"]+)"/i
                  ];

                  const formActionPatterns = [
                    /action=["']([^"']*cdsso[^"']*)["']/i,
                    /action=["']([^"']*agent[^"']*)["']/i,
                    /formAction["']?\s*[:=]\s*["']([^"']+)["']/i
                  ];

                  let idToken = null;
                  let formAction = null;

                  for (const pattern of idTokenPatterns) {
                    const match = dataString.match(pattern);
                    if (match && match[1]) {
                      idToken = match[1];
                      console.log('[RVFU IPC API Direct] ✅ id_token estratto:', idToken.substring(0, 50) + '...');
                      break;
                    }
                  }

                  for (const pattern of formActionPatterns) {
                    const match = dataString.match(pattern);
                    if (match && match[1]) {
                      formAction = match[1];
                      console.log('[RVFU IPC API Direct] ✅ formAction estratto:', formAction);
                      break;
                    }
                  }

                  // Se non trovato nel form, cerca nell'URL di redirect
                  if (!formAction) {
                    const redirectMatch = dataString.match(/redirect.*?["']([^"']*cdsso[^"']*)["']/i);
                    if (redirectMatch && redirectMatch[1]) {
                      formAction = redirectMatch[1];
                    } else {
                      formAction = 'http://formazione.ilportaledeltrasporto.it:80/agent/cdsso-oauth2';
                    }
                  }

                  // ✅ FIX CRITICO: NON normalizzare formAction!
                  // Solo se non inizia con http/https, aggiungi il dominio base
                  if (formAction && !formAction.startsWith('http://') && !formAction.startsWith('https://')) {
                    if (formAction.startsWith('/')) {
                      formAction = 'https://formazione.ilportaledeltrasporto.it' + formAction;
                    } else {
                      formAction = 'https://formazione.ilportaledeltrasporto.it/' + formAction;
                    }
                  }
                  // ✅ NON convertire http:// in https:// e NON rimuovere :80
                  // Il server si aspetta esattamente l'URL indicato nel form

                  if (idToken && formAction) {
                    console.log('[RVFU IPC API Direct] ✅ CDSSO completo, id_token e formAction trovati');
                    reject(new Error(`CDSSO_REQUIRED:${JSON.stringify({ idToken, formAction, originalUrl: url })}`));
                    return;
                  } else {
                    console.warn('[RVFU IPC API Direct] ⚠️ Pattern CDSSO trovati ma id_token o formAction non estratti correttamente');
                  }
                }

                // Se è 401, analizza meglio la risposta
                if (response.statusCode === 401) {
                  // Cerca informazioni utili nella risposta HTML
                  const hasLoginForm = dataString.includes('login') || dataString.includes('username') || dataString.includes('password');
                  const hasError = dataString.includes('error') || dataString.includes('Error') || dataString.includes('unauthorized');

                  console.error('[RVFU IPC API Direct] ❌ 401 Unauthorized - Analisi risposta:');
                  console.error('[RVFU IPC API Direct]   - Ha form di login:', hasLoginForm);
                  console.error('[RVFU IPC API Direct]   - Ha messaggio di errore:', hasError);
                  console.error('[RVFU IPC API Direct]   - Possibili cause:');
                  console.error('[RVFU IPC API Direct]     1. Token JWT scaduto o non valido');
                  console.error('[RVFU IPC API Direct]     2. Token non presente nell\'header Authorization');
                  console.error('[RVFU IPC API Direct]     3. Server richiede CDSSO (ma form non trovato)');
                  console.error('[RVFU IPC API Direct]     4. Cookie di sessione non validi');

                  // Se c'è un form di login, potrebbe essere che il server richiede re-autenticazione
                  if (hasLoginForm) {
                    reject(new Error(`401 Unauthorized: Il server richiede re-autenticazione. La sessione potrebbe essere scaduta.\n\nSoluzione: Rifai login RVFU per ottenere un nuovo token e aggiornare i cookie di sessione.`));
                  } else {
                    reject(new Error(`401 Unauthorized: Il server ha rifiutato la richiesta. Possibili cause:\n- Token JWT scaduto o non valido\n- Token mancante nell'header Authorization\n- Server richiede CDSSO\n- Cookie di sessione non validi\n\nSoluzione: Rifai login RVFU per ottenere un nuovo token.`));
                  }
                  return;
                }

                reject(new Error(`Il server ha restituito HTML invece di JSON (Status: ${response.statusCode}). Probabile problema CDSSO.\n\nSoluzione: Rifai login RVFU per aggiornare i cookie di sessione.`));
                return;
              }

              // Prova a parsare come JSON se indicato
              let data;
              if (isJSON) {
                data = JSON.parse(dataString);
              } else {
                data = dataString;
              }

              if (response.statusCode >= 200 && response.statusCode < 300) {
                console.log('[RVFU IPC API Direct] ✅ Richiesta completata con successo');
                resolve(data);
              } else {
                // Estrai dettagli errore dal body per diagnostica
                let errorDetail = '';
                if (typeof data === 'object' && data !== null) {
                  errorDetail = data?.esito?.message || data?.message || JSON.stringify(data).substring(0, 300);
                } else if (typeof data === 'string') {
                  errorDetail = data.substring(0, 300);
                }
                console.error('[RVFU IPC API Direct] ❌ Errore nella risposta:', response.statusCode, response.statusMessage, errorDetail);
                reject(new Error(`API call failed: ${response.statusCode} ${response.statusMessage}${errorDetail ? ' — ' + errorDetail : ''}`));
              }
            } catch (error) {
              console.error('[RVFU IPC API Direct] ❌ Errore parsing risposta:', error);
              reject(error);
            }
          });
        });

        request.on('error', (error) => {
          // ✅ FIX: Logga dettagli completi dell'errore per diagnosi
          const errorDetails = {
            message: error?.message,
            code: error?.code,
            errno: error?.errno,
            syscall: error?.syscall,
            hostname: error?.hostname,
            address: error?.address,
            port: error?.port,
            stack: error?.stack?.substring(0, 500),
          };

          console.error('[RVFU IPC API Direct] ❌ Errore richiesta (net.request):', errorDetails);

          // ✅ FIX: Se è ERR_NAME_NOT_RESOLVED, fornisci suggerimenti specifici
          if (error?.message?.includes('ERR_NAME_NOT_RESOLVED') || error?.code === 'ENOTFOUND') {
            const urlObj = new URL(url);
            console.error('[RVFU IPC API Direct] 🔍 DIAGNOSI DNS:', {
              hostname: urlObj.hostname,
              domain: urlObj.hostname,
              possibleCauses: [
                'VPN ACI/MIT non attiva o non configurata correttamente',
                'DNS non risolve il dominio (solo rete interna ACI/MIT)',
                'Dominio raggiungibile solo da rete interna ACI/MIT',
                'Verifica che la VPN sia connessa e che il DNS risolva il dominio',
              ],
              suggestion: 'Verifica la connessione VPN e che il dominio sia raggiungibile dalla tua rete',
            });
          }

          clearTimeout(requestTimeout);
          // ✅ FIX: Crea errore con dettagli completi
          const enhancedError = new Error(`rvfu:api-call-direct: ${error?.message || 'Unknown error'}${error?.code ? ` (${error.code})` : ''}`);
          enhancedError.code = error?.code;
          enhancedError.errno = error?.errno;
          enhancedError.syscall = error?.syscall;
          enhancedError.hostname = error?.hostname;
          reject(enhancedError);
        });

        // Invia il body se presente
        if (body) {
          const bodyBuffer = Buffer.from(typeof body === 'string' ? body : JSON.stringify(body), 'utf-8');
          console.log(`[RVFU IPC API Direct] 📤 Invio body: ${bodyBuffer.length} bytes, method: ${method}`);
          request.write(bodyBuffer);
        }

        console.log(`[RVFU IPC API Direct] 📤 request.end() — in attesa risposta...`);
        request.end();
      }).catch((error) => {
        console.error('[RVFU IPC API Direct] ❌ Errore preparazione richiesta:', error);
        reject(error);
      });
    });
  });

  // NOTA: handleSafe passa solo gli args (non event), quindi params è il primo argomento
  handleSafe('rvfu:api-call', async (params) => {
    // Assicuriamoci che la finestra persistente sia aperta
    if (!persistentApiWindow || persistentApiWindow.isDestroyed() || !apiWindowReady) {
      console.log('[RVFU IPC API] Finestra persistente non disponibile, inizializzazione...');
      await initPersistentApiWindow();
      // Aspetta un po' per assicurarsi che sia pronta
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // params viene passato come oggetto, destrutturiamo qui
    const { method, url, headers, body, bearerToken } = params || {};

    if (!method || !url) {
      throw new Error(`rvfu:api-call: method and url are required. Received: ${JSON.stringify({ method, url, params })}`);
    }

    // ✅ FIX (2026-02-18): Il bearerToken è il id_token originale con aud: AUTODEM.RESCUEMANAGER
    // Viene passato dal renderer per essere usato come Bearer header nel retry dopo CDSSO
    if (bearerToken) {
      console.log('[RVFU IPC API] ✅ bearerToken ricevuto dal renderer (aud: AUTODEM.RESCUEMANAGER), length:', bearerToken.length);
    }

    return new Promise((resolve, reject) => {
      const requestId = Date.now().toString() + Math.random().toString(36).substring(7);

      // Timeout
      const timeout = setTimeout(() => {
        if (pendingRequests.has(requestId)) {
          const pending = pendingRequests.get(requestId);
          pendingRequests.delete(requestId);
          pending.reject(new Error('API call timeout (30s)'));
        }
      }, 30000);

      // Salva la richiesta in attesa (con timeout per poterlo cancellare)
      // Salva anche i parametri originali per eventuale retry dopo CDSSO
      pendingRequests.set(requestId, {
        resolve,
        reject,
        url,
        timeout,
        method,
        headers,
        body,
        bearerToken, // ✅ NUOVO: token id_token originale per Bearer nel retry
        originalRequest: {
          method,
          url,
          headers,
          body,
          bearerToken // ✅ NUOVO: salvato anche in originalRequest
        }
      });

      // Invia la richiesta alla finestra persistente

      // Serializza tutto in modo sicuro per evitare errori di sintassi
      const messageData = {
        id: requestId,
        method: method,
        url: url,
        headers: headers || {},
        body: body || null
      };
      const messageDataJson = JSON.stringify(messageData);

      // FIX: Usa un approccio più sicuro per evitare errori di sintassi con caratteri speciali nell'URL
      // Serializza due volte per creare una stringa JavaScript valida, poi usa String.fromCharCode per evitare problemi di escape
      const escapedJson = JSON.stringify(messageDataJson);

      persistentApiWindow.webContents.executeJavaScript(`
        (function() {
          try {
            // Assegna la stringa JSON a una variabile per evitare problemi di interpolazione
            const jsonString = ${escapedJson};
            const data = JSON.parse(jsonString);
            window.postMessage(data, '*');
          } catch (e) {
            console.error('[RVFU IPC API] Errore parsing dati:', e);
            console.error('[RVFU IPC API] Stringa JSON:', ${escapedJson});
          }
        })();
      `).catch(err => {
        if (pendingRequests.has(requestId)) {
          pendingRequests.delete(requestId);
          clearTimeout(timeout);
          reject(err);
        }
      });
    });
  });

}

module.exports = { registerRvfuIpc };
