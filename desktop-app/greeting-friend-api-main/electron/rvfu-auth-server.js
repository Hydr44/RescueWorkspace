// electron/rvfu-auth-server.js
const { createServer } = require('http');
const { URL } = require('url');

class RVFUAuthServer {
  constructor() {
    this.server = null;
    this.port = 3002; // Porta diversa da OAuth server (3001)
    this.callbackHandler = null;
    this.pendingAuthParams = null; // Salva i parametri per il POST
  }

  /**
   * Avvia il server HTTP locale per RVFU OAuth callback
   * @param {Object} authParams - Parametri per il POST a /authorize
   * @param {string} authParams.authorizeEndpoint - URL endpoint /authorize
   * @param {Object} authParams.params - Parametri del form (scope, response_type, client_id, csrf, redirect_uri, etc.)
   */
  start(authParams, callback) {
    return new Promise((resolve, reject) => {
      if (this.server) {
        // Server già avviato, aggiorna solo i parametri
        this.pendingAuthParams = authParams;
        this.callbackHandler = callback;
        resolve();
        return;
      }

      this.pendingAuthParams = authParams;
      this.callbackHandler = callback;

      this.server = createServer((req, res) => {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        
        // Servi la pagina HTML con form POST
        if (url.pathname === '/authorize') {
          if (!this.pendingAuthParams) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Auth parameters not set');
            return;
          }

          // Crea form HTML che fa POST a /authorize
          const formFields = Object.entries(this.pendingAuthParams.params)
            .map(([key, value]) => `<input type="hidden" name="${key}" value="${this.escapeHtml(value)}" />`)
            .join('\n      ');

          const interceptUrl = `http://localhost:${this.port}/intercept`;
          const callbackUrl = `http://localhost:${this.port}/auth/callback`;
          
          const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Autorizzazione RVFU</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      padding: 50px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
    }
    .loading {
      font-size: 18px;
      margin-top: 100px;
    }
    .info {
      margin-top: 30px;
      padding: 20px;
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      font-size: 14px;
    }
    .info a {
      color: #4ecdc4;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="loading">Autorizzazione in corso...</div>
  <div class="info">
    <p><strong>⚠️ IMPORTANTE:</strong></p>
    <p>Dopo il login, verrai reindirizzato a <strong>https://localhost/</strong></p>
    <p>Quando vedi l'URL nella barra degli indirizzi, apri questa pagina per inserire il codice:</p>
    <p><a href="${interceptUrl}" target="_blank">${interceptUrl}</a></p>
    <p>(Si aprirà automaticamente in una nuova scheda)</p>
  </div>
  <form id="authForm" method="POST" action="${this.escapeHtml(this.pendingAuthParams.authorizeEndpoint)}">
      ${formFields}
  </form>
  <script>
    // Apri la pagina di intercettazione in una nuova scheda dopo 2 secondi
    setTimeout(function() {
      window.open(${JSON.stringify(interceptUrl)}, '_blank');
    }, 2000);
    
    console.log('[RVFU Auth] Form ready, auto-submitting...');
    // Auto-submit il form quando la pagina si carica
    document.getElementById('authForm').submit();
  </script>
</body>
</html>`;

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(html);
          return;
        }

        // Servi la pagina HTML con form POST che fa l'autorizzazione
        if (url.pathname === '/authorize') {
          if (!this.pendingAuthParams) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Auth parameters not set');
            return;
          }

          // Crea form HTML che fa POST a /authorize
          const formFields = Object.entries(this.pendingAuthParams.params)
            .map(([key, value]) => `<input type="hidden" name="${key}" value="${this.escapeHtml(value)}" />`)
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  <form id="authForm" method="POST" action="${this.escapeHtml(this.pendingAuthParams.authorizeEndpoint)}">
      ${formFields}
  </form>
  <script>
    console.log('[RVFU Auth] Form ready, auto-submitting...');
    console.log('[RVFU Auth] Action:', ${JSON.stringify(this.pendingAuthParams.authorizeEndpoint)});
    console.log('[RVFU Auth] Note: Cookie iPlanetDirectoryPro should be sent automatically from Electron session');
    // Auto-submit il form quando la pagina si carica
    // Il cookie iPlanetDirectoryPro dovrebbe essere inviato automaticamente dalla sessione Electron
    setTimeout(() => {
      document.getElementById('authForm').submit();
    }, 500); // Piccolo delay per assicurarsi che i cookie siano disponibili
  </script>
</body>
</html>`;

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(html);
          return;
        }

        // Servi una pagina che intercetta redirect a https://localhost/
        // Quando l'utente viene reindirizzato a https://localhost/, questa pagina
        // si apre e permette di inserire manualmente il codice o intercettare l'URL
        if (url.pathname === '/intercept') {
          const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Intercetta Codice RVFU</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      padding: 50px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
    }
    .container {
      background: rgba(255,255,255,0.1);
      padding: 30px;
      border-radius: 10px;
      backdrop-filter: blur(10px);
      max-width: 600px;
      margin: 0 auto;
    }
    .input-group {
      margin: 20px 0;
    }
    .input-group input {
      padding: 12px;
      font-size: 16px;
      border: none;
      border-radius: 5px;
      width: 100%;
      max-width: 500px;
      margin: 10px 0;
    }
    .input-group button {
      padding: 12px 30px;
      font-size: 16px;
      background: #4ecdc4;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      margin-top: 10px;
    }
    .input-group button:hover {
      background: #45b8b0;
    }
    .instructions {
      background: rgba(255,255,255,0.05);
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
      text-align: left;
    }
    .instructions ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    .instructions li {
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>🔐 Intercetta Codice di Autorizzazione</h2>
    <p>Se sei stato reindirizzato a <strong>https://localhost/</strong>, segui questi passaggi:</p>
    
    <div class="instructions">
      <ol>
        <li>Copia l'URL completo dalla barra degli indirizzi del browser (dovrebbe contenere <code>?code=...</code>)</li>
        <li>Incolla l'URL qui sotto e clicca "Continua"</li>
        <li>Oppure, se vedi solo il codice, incollalo qui</li>
      </ol>
    </div>
    
    <div class="input-group">
      <input type="text" id="codeInput" placeholder="Incolla qui l'URL completo (es: https://localhost/?code=XXX...) o solo il codice" />
      <br />
      <button onclick="handleCode()">Continua</button>
    </div>
  </div>
  
  <script>
    const callbackUrl = ${JSON.stringify(`http://localhost:${this.port}/auth/callback`)};
    
    // Estrai code/error dall'URL corrente se presente (potrebbe essere già qui)
    const currentUrl = window.location.href;
    if (currentUrl.includes('code=') || currentUrl.includes('error=')) {
      // Reindirizza automaticamente al server locale
      const url = new URL(currentUrl);
      const newUrl = callbackUrl + '?' + url.searchParams.toString();
      window.location.href = newUrl;
    }
    
    function handleCode() {
      const input = document.getElementById('codeInput');
      const value = input.value.trim();
      
      if (!value) {
        alert('Per favore inserisci l\'URL o il codice di autorizzazione');
        return;
      }
      
      let redirectUrl = callbackUrl;
      if (value.includes('localhost') || value.includes('http')) {
        // È un URL, estrai i parametri query
        try {
          const url = new URL(value);
          redirectUrl = callbackUrl + '?' + url.searchParams.toString();
        } catch (e) {
          // Se non è un URL valido, prova a estrarre code= o error=
          const codeMatch = value.match(/[?&]code=([^&]+)/);
          const errorMatch = value.match(/[?&]error=([^&]+)/);
          if (codeMatch) {
            redirectUrl = callbackUrl + '?code=' + encodeURIComponent(codeMatch[1]);
          } else if (errorMatch) {
            redirectUrl = callbackUrl + '?error=' + encodeURIComponent(errorMatch[1]);
          } else {
            // Assumiamo sia solo il codice
            redirectUrl = callbackUrl + '?code=' + encodeURIComponent(value);
          }
        }
      } else if (value.includes('code=') || value.includes('error=')) {
        // Contiene già parametri query
        redirectUrl = callbackUrl + (value.startsWith('?') ? value : '?' + value);
      } else {
        // Assumiamo sia solo il codice
        redirectUrl = callbackUrl + '?code=' + encodeURIComponent(value);
      }
      
      console.log('[RVFU Intercept] Redirecting to:', redirectUrl);
      window.location.href = redirectUrl;
    }
    
    // Permetti anche Enter per inviare
    document.getElementById('codeInput').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        handleCode();
      }
    });
  </script>
</body>
</html>`;
          
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(html);
          return;
        }
        
        // Intercetta callback da SSO (redirect a https://localhost/)
        // Il server SSO reindirizzerà a https://localhost/?code=XXX o ?error=XXX
        // Intercettiamo questo e lo passiamo all'app
        if (url.pathname === '/auth/callback') {
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');
          const errorDescription = url.searchParams.get('error_description');
          const state = url.searchParams.get('state');

          // Mostra pagina di successo
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>RVFU Auth Success</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 50px;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                }
                .success { 
                  background: rgba(255,255,255,0.1);
                  padding: 30px;
                  border-radius: 10px;
                  backdrop-filter: blur(10px);
                }
              </style>
            </head>
            <body>
              <div class="success">
                <h2>✅ Autorizzazione Completata!</h2>
                <p>Puoi chiudere questa finestra e tornare all'applicazione.</p>
              </div>
              <script>
                setTimeout(() => {
                  try { window.close(); } catch (e) {}
                }, 2000);
              </script>
            </body>
            </html>
          `);

          // Notifica l'app desktop
          if (this.callbackHandler) {
            const callbackUrl = `http://localhost:${this.port}${req.url}`;
            console.log('[RVFU Auth Server] Callback received:', callbackUrl);
            this.callbackHandler({ code, error, errorDescription, state, url: callbackUrl });
          }
          return;
        }

        // Pagina non trovata
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      });

      this.server.listen(this.port, 'localhost', () => {
        console.log(`RVFU Auth server started on http://localhost:${this.port}`);
        resolve();
      });

      this.server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${this.port} is in use, trying ${this.port + 1}`);
          this.port++;
          this.start(authParams, callback);
        } else {
          reject(err);
        }
      });
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
      this.pendingAuthParams = null;
    }
  }

  /**
   * Ottiene l'URL della pagina di autorizzazione
   */
  getAuthorizePageUrl() {
    return `http://localhost:${this.port}/authorize`;
  }

  /**
   * Escape HTML per sicurezza
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }
}

module.exports = RVFUAuthServer;

