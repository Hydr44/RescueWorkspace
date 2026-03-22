// electron/oauth-server.js
const { createServer } = require('http');
const { URL } = require('url');

class OAuthServer {
  constructor() {
    this.server = null;
    this.port = 3001;
    this.callbackHandler = null;
    this.currentHost = 'localhost'; // Host corrente (localhost o 127.0.0.1)
  }

  /**
   * Prova ad avviare il server su un host specifico
   */
  tryStartOnHost(host, callback, resolve, reject) {
    if (this.server) {
      resolve();
      return;
    }

    this.callbackHandler = callback;

    this.server = createServer((req, res) => {
        const timestamp = new Date().toISOString();
        console.log(`[OAuthServer] [${timestamp}] Received request: ${req.method} ${req.url}`);
        console.log(`[OAuthServer] [${timestamp}] Request headers:`, JSON.stringify(req.headers, null, 2));
        
        // Endpoint di test per verificare che il server sia raggiungibile
        if (req.url === '/test' || req.url === '/test/') {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('OAuth Server is running!');
          console.log(`[OAuthServer] Test endpoint called - server is reachable`);
          return;
        }
        
        if (req.url && req.url.startsWith('/auth/callback')) {
          // Gestisci callback OAuth
          const currentHost = this.currentHost || host || '127.0.0.1';
          const url = `http://${currentHost}:${this.port}${req.url}`;
          console.log(`[OAuthServer] OAuth callback detected, URL: ${url}`);
          console.log(`[OAuthServer] Full request URL: ${req.url}`);
          const urlObj = new URL(req.url, `http://${currentHost}:${this.port}`);
          console.log(`[OAuthServer] Query params:`, urlObj.searchParams.toString());
          
          // Invia risposta al browser
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>OAuth Success</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 20px;
                  background: linear-gradient(135deg, #f9fafb 0%, #e0e7ff 30%, #f3e8ff 100%);
                  color: #1f2937;
                }
                .success { 
                  background: rgba(255, 255, 255, 0.8);
                  backdrop-filter: blur(16px);
                  -webkit-backdrop-filter: blur(16px);
                  padding: 40px;
                  border-radius: 24px;
                  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                  border: 1px solid rgba(255, 255, 255, 0.2);
                  max-width: 400px;
                  width: 100%;
                  text-align: center;
                }
                .icon {
                  width: 64px;
                  height: 64px;
                  margin: 0 auto 24px;
                  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
                }
                .icon svg {
                  width: 32px;
                  height: 32px;
                  color: white;
                }
                h2 {
                  font-size: 24px;
                  font-weight: 600;
                  margin-bottom: 12px;
                  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  background-clip: text;
                }
                p {
                  color: #6b7280;
                  margin-bottom: 24px;
                  line-height: 1.6;
                }
                .spinner {
                  border: 3px solid rgba(99, 102, 241, 0.2);
                  border-radius: 50%;
                  border-top: 3px solid #6366f1;
                  width: 40px;
                  height: 40px;
                  animation: spin 1s linear infinite;
                  margin: 20px auto;
                }
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                small {
                  color: #9ca3af;
                  font-size: 14px;
                }
                @media (prefers-color-scheme: dark) {
                  body {
                    background: linear-gradient(135deg, #111827 0%, #1e293b 30%, #312e81 100%);
                    color: #f9fafb;
                  }
                  .success {
                    background: rgba(31, 41, 55, 0.8);
                    border-color: rgba(255, 255, 255, 0.1);
                  }
                  h2 {
                    background: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                  }
                  p {
                    color: #d1d5db;
                  }
                  small {
                    color: #9ca3af;
                  }
                }
              </style>
            </head>
            <body>
              <div class="success">
                <div class="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2>Autenticazione Completata</h2>
                <p>Puoi chiudere questa finestra e tornare all'applicazione.</p>
                <div class="spinner"></div>
                <p><small>Reindirizzamento in corso...</small></p>
              </div>
              <script>
                // Chiudi la finestra dopo 3 secondi (con fallback)
                setTimeout(() => {
                  try {
                    window.close();
                  } catch (e) {
                    // Fallback: mostra messaggio se non può chiudere
                    document.querySelector('.success').innerHTML = '<div class="icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg></div><h2>Autenticazione Completata</h2><p>Puoi chiudere manualmente questa finestra.</p>';
                  }
                }, 3000);
              </script>
            </body>
            </html>
          `);
          
          // Notifica l'app desktop
          if (this.callbackHandler) {
            console.log('[OAuthServer] === OAUTH SERVER CALLBACK ===');
            console.log('[OAuthServer] Sending OAuth callback to desktop app:', url);
            try {
              this.callbackHandler(url);
              console.log('[OAuthServer] Callback handler invoked successfully');
            } catch (err) {
              console.error('[OAuthServer] Error invoking callback handler:', err);
            }
          } else {
            console.error('[OAuthServer] No callback handler registered!');
          }
        } else {
          // Pagina non trovata
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
      });

      this.server.listen(this.port, host, () => {
        console.log(`[OAuthServer] OAuth server started on http://${host}:${this.port}`);
        console.log(`[OAuthServer] Server listening for OAuth callbacks...`);
        console.log(`[OAuthServer] Server address:`, this.server.address());
        this.currentHost = host;
        resolve();
      });

      this.server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`[OAuthServer] Port ${this.port} is in use, trying ${this.port + 1}`);
          this.port++;
          this.tryStartOnHost(host, callback, resolve, reject);
        } else if (host === 'localhost') {
          // Fallback a 127.0.0.1 se localhost non funziona
          console.log(`[OAuthServer] Failed to start on localhost, trying 127.0.0.1...`);
          console.log(`[OAuthServer] Error:`, err.message);
          this.server = null;
          this.tryStartOnHost('127.0.0.1', callback, resolve, reject);
        } else {
          console.error(`[OAuthServer] Server error:`, err);
          reject(err);
        }
      });
      
      // Log quando il server è in ascolto
      this.server.on('listening', () => {
        console.log(`[OAuthServer] Server is now listening on ${host}:${this.port}`);
      });
  }

  /**
   * Avvia il server HTTP locale per OAuth callback
   */
  start(callback) {
    return new Promise((resolve, reject) => {
      // Prova prima localhost (preferito per Supabase), poi 127.0.0.1 come fallback
      this.tryStartOnHost('localhost', callback, resolve, reject);
    });
  }

  /**
   * Ferma il server HTTP
   */
  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
      this.callbackHandler = null;
    }
  }

  /**
   * Ottiene l'URL di callback
   */
  getCallbackUrl() {
    // Usa l'host corrente (localhost o 127.0.0.1)
    const host = this.currentHost || 'localhost';
    return `http://${host}:${this.port}/auth/callback`;
  }
}

module.exports = OAuthServer;
