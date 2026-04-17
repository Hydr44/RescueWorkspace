// src/lib/rvfu-auth.ts
// Autenticazione OIDC per RVFU (ACI/MIT) — Riscrittura pulita 02/03/2026
// Credenziali confermate da ACI Informatica

export interface AuthTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  environment?: 'formation' | 'production';
}

// URL SSO per ambiente
const SSO_URLS = {
  formation: 'https://ssoformazione.ilportaledeltrasporto.it/sso',
  production: 'https://sso.ilportaledeltrasporto.it/sso',
} as const;

// Realm path richiesto da ACI (aggiornato 08/04/2026)
const REALM_PATH = '/realms/root/realms/pdtusers';

// Nome cookie sessione SSO (pdtsso-form sul nuovo server, iPlanetDirectoryPro sul vecchio)
const SSO_COOKIE_NAMES = ['pdtsso-form', 'iPlanetDirectoryPro'];

export class RVFUAuthService {
  private readonly config: AuthConfig;
  public tokens: AuthTokens | null = null;
  private readonly ssoBaseUrl: string;
  private sessionCookie: { name: string; value: string } | null = null;

  constructor(config: AuthConfig) {
    this.config = config;
    const env = config.environment || 'formation';
    this.ssoBaseUrl = SSO_URLS[env];
    this.tokens = this.loadTokens();
  }

  // ═══════════════════════════════════════════════════════════════
  // FLUSSO OIDC: authenticate → authorize → access_token
  // ═══════════════════════════════════════════════════════════════

  async authenticate(username: string, password: string): Promise<AuthTokens> {
    console.log('[RVFU Auth] Inizio OIDC:', { username, env: this.config.environment });

    try {
      this.saveCredentials(username, password);

      // Step 1: OpenAM /authenticate → tokenId + session cookie
      const { tokenId, sessionCookie } = await this.step1_authenticate(username, password);
      this.sessionCookie = sessionCookie;

      // Step 2: OAuth2 /authorize → authorization code
      const code = await this.step2_authorize(tokenId);

      // Step 3: OAuth2 /access_token → tokens
      const tokens = await this.step3_exchangeToken(code);

      this.tokens = tokens;
      this.saveTokens(tokens);
      this.dispatchEvent(tokens);

      console.log('[RVFU Auth] Autenticazione completata');
      return tokens;
    } catch (error: any) {
      console.error('[RVFU Auth] Autenticazione fallita:', error.message);
      throw new Error(`Autenticazione RVFU fallita: ${error.message}`);
    }
  }

  // Step 1: POST /sso/json/authenticate
  private async step1_authenticate(username: string, password: string): Promise<{ tokenId: string; sessionCookie: { name: string; value: string } | null }> {
    const url = `${this.ssoBaseUrl}/json${REALM_PATH}/authenticate`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OpenAM-Username': username,
        'X-OpenAM-Password': password,
        'Accept-API-Version': 'resource=2.0, protocol=1.0',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const text = await response.text();
      let msg = `HTTP ${response.status}`;
      try {
        const json = JSON.parse(text);
        msg = json.message || json.reason || msg;
      } catch { /* ignore */ }
      throw new Error(`Autenticazione fallita: ${msg}. Verifica username (DETO003001) e password.`);
    }

    // Cattura session cookie dalla risposta (pdtsso-form o iPlanetDirectoryPro)
    let sessionCookie: { name: string; value: string } | null = null;
    const setCookieHeader = response.headers.get('set-cookie') || '';
    for (const cookieName of SSO_COOKIE_NAMES) {
      const match = setCookieHeader.match(new RegExp(`${cookieName}=([^;]+)`));
      if (match) {
        sessionCookie = { name: cookieName, value: match[1] };
        console.log(`[RVFU Auth] Step 1: session cookie '${cookieName}' catturato`);
        break;
      }
    }

    const data = await response.json();
    console.log('[RVFU Auth] Step 1 response data:', JSON.stringify(data, null, 2).substring(0, 500));
    if (!data.tokenId) {
      console.error('[RVFU Auth] Step 1 ERRORE: tokenId mancante!', { data, keys: Object.keys(data || {}) });
      throw new Error('Risposta senza tokenId');
    }

    console.log('[RVFU Auth] Step 1 OK: tokenId ricevuto');
    return { tokenId: data.tokenId, sessionCookie };
  }

  // Step 2: POST /sso/oauth2/authorize → code (via redirect)
  private async step2_authorize(tokenId: string): Promise<string> {
    // Prova BrowserWindow Electron (gestisce redirect cross-origin)
    const electronApi = typeof globalThis.window !== 'undefined' ? (globalThis.window as any).api : null;
    if (electronApi?.rvfu?.openAuthWindow) {
      return this.step2_viaBrowserWindow(tokenId, electronApi.rvfu.openAuthWindow);
    }

    // Fallback: chiamata diretta (funziona se Electron ha webSecurity: false)
    return this.step2_direct(tokenId);
  }

  private async step2_viaBrowserWindow(tokenId: string, openAuthWindow: Function): Promise<string> {
    const authorizeParams = {
      scope: 'openid profile',
      response_type: 'code',
      client_id: this.config.clientId,
      csrf: tokenId,
      redirect_uri: this.config.redirectUri,
      state: 'rvfu_auth',
      nonce: `n${Date.now()}`,
      decision: 'allow',
    };

    console.log('[RVFU Auth] Step 2: BrowserWindow /authorize');
    const result = await openAuthWindow({
      authorizeEndpoint: `${this.ssoBaseUrl}/oauth2${REALM_PATH}/authorize`,
      redirectUri: this.config.redirectUri,
      tokenId,
      authorizeParams,
      sessionCookie: this.sessionCookie,
    });

    if (!result?.code) throw new Error('Nessun authorization code ricevuto dalla finestra browser');
    console.log('[RVFU Auth] Step 2 OK: code ricevuto');
    return result.code;
  }

  private async step2_direct(tokenId: string): Promise<string> {
    const params = new URLSearchParams({
      scope: 'openid profile',
      response_type: 'code',
      client_id: this.config.clientId,
      csrf: tokenId,
      redirect_uri: this.config.redirectUri,
      state: 'rvfu_auth',
      nonce: `n${Date.now()}`,
      decision: 'allow',
    });

    // Usa il session cookie catturato da Step 1, con fallback a iPlanetDirectoryPro=tokenId
    const cookieHeader = this.sessionCookie
      ? `${this.sessionCookie.name}=${this.sessionCookie.value}`
      : `iPlanetDirectoryPro=${tokenId}`;

    const response = await fetch(`${this.ssoBaseUrl}/oauth2${REALM_PATH}/authorize`, {
      method: 'POST',
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      credentials: 'include',
      redirect: 'manual',
    });

    // Estrai code dal Location header (redirect 302)
    const location = response.headers.get('Location');
    if (location) {
      try {
        const redirectUrl = location.startsWith('http') ? new URL(location) : new URL(location, this.ssoBaseUrl);
        const code = redirectUrl.searchParams.get('code');
        if (code) {
          console.log('[RVFU Auth] Step 2 OK: code dal Location header');
          return code;
        }
      } catch { /* ignore parse error */ }
    }

    throw new Error(`Authorize fallito (status ${response.status}). Verifica client_id e redirect_uri registrati con ACI.`);
  }

  // Step 3: POST /sso/oauth2/access_token
  private async step3_exchangeToken(code: string): Promise<AuthTokens> {
    // Prova IPC (main process può avere VPN)
    const electronApi = typeof globalThis.window !== 'undefined' ? (globalThis.window as any).api : null;
    if (electronApi?.rvfu?.exchangeToken) {
      console.log('[RVFU Auth] Step 3: token exchange via IPC');
      const result = await electronApi.rvfu.exchangeToken({
        code,
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
        redirectUri: this.config.redirectUri,
        ssoBaseUrl: this.ssoBaseUrl,
      });
      console.log('[RVFU Auth] Step 3 OK: tokens ricevuti');
      return result as AuthTokens;
    }

    // Fallback: fetch diretto
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    const response = await fetch(`${this.ssoBaseUrl}/oauth2${REALM_PATH}/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Token exchange fallito: ${response.status} - ${text.substring(0, 100)}`);
    }

    const data = await response.json();
    const expiresIn = data.expires_in ? data.expires_in * 1000 : 24 * 60 * 60 * 1000;

    console.log('[RVFU Auth] Step 3 OK: tokens ricevuti');
    return {
      idToken: data.id_token,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + expiresIn,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // REFRESH / LOGOUT / TOKEN MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  async refreshTokens(): Promise<AuthTokens> {
    if (!this.tokens?.refreshToken) throw new Error('No refresh token');

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.tokens.refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    const response = await fetch(`${this.ssoBaseUrl}/oauth2${REALM_PATH}/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Token refresh fallito: ${response.status} - ${text.substring(0, 100)}`);
    }

    const data = await response.json();
    const expiresIn = data.expires_in ? data.expires_in * 1000 : 24 * 60 * 60 * 1000;

    const newTokens: AuthTokens = {
      idToken: data.id_token,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + expiresIn,
    };

    this.tokens = newTokens;
    this.saveTokens(newTokens);
    return newTokens;
  }

  async logout(): Promise<void> {
    if (this.tokens?.idToken) {
      try {
        const params = new URLSearchParams({
          id_token_hint: this.tokens.idToken,
          client_id: this.config.clientId,
        });
        await fetch(`${this.ssoBaseUrl}/oauth2/connect/endSession?${params}`, {
          method: 'GET',
          redirect: 'manual',
        });
      } catch {
        // Ignora errori logout server (redirect a localhost è normale)
      }
    }

    this.tokens = null;
    this.clearTokens();
    this.dispatchEvent(null);
  }

  async reAuthenticate(): Promise<AuthTokens | null> {
    const creds = this.loadCredentials();
    if (!creds) return null;
    try {
      return await this.authenticate(creds.username, creds.password);
    } catch {
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════

  isAuthenticated(): boolean {
    if (!this.tokens) this.tokens = this.loadTokens();
    if (this.tokens && this.tokens.expiresAt <= Date.now()) {
      this.tokens = null;
      this.clearTokens();
      return false;
    }
    return !!this.tokens && this.tokens.expiresAt > Date.now();
  }

  getTokens(): AuthTokens | null {
    if (!this.tokens) this.tokens = this.loadTokens();
    if (this.tokens && this.tokens.expiresAt <= Date.now()) {
      this.tokens = null;
      this.clearTokens();
      return null;
    }
    return this.tokens;
  }

  // Sezione 5.3 punto 7: "Il Client chiama l'API Gateway passando l'IDToken (Bearer)"
  getAuthHeader(): string {
    if (!this.tokens) this.tokens = this.loadTokens();

    const token = this.tokens?.idToken || this.tokens?.accessToken;

    if (!token) throw new Error('Nessun token disponibile. Effettua il login RVFU.');
    return `Bearer ${token}`;
  }

  // ═══════════════════════════════════════════════════════════════
  // STORAGE (sessionStorage)
  // ═══════════════════════════════════════════════════════════════

  private saveTokens(tokens: AuthTokens): void {
    if (typeof globalThis.window !== 'undefined') {
      globalThis.window.sessionStorage.setItem('rvfu_tokens', JSON.stringify(tokens));
    }
  }

  private loadTokens(): AuthTokens | null {
    if (typeof globalThis.window !== 'undefined') {
      const stored = globalThis.window.sessionStorage.getItem('rvfu_tokens');
      if (stored) {
        try { return JSON.parse(stored); } catch { return null; }
      }
    }
    return null;
  }

  private clearTokens(): void {
    if (typeof globalThis.window !== 'undefined') {
      globalThis.window.sessionStorage.removeItem('rvfu_tokens');
      globalThis.window.sessionStorage.removeItem('rvfu_credentials');
    }
  }

  private saveCredentials(username: string, password: string): void {
    if (typeof globalThis.window !== 'undefined') {
      globalThis.window.sessionStorage.setItem('rvfu_credentials', JSON.stringify({ username, password }));
    }
  }

  private loadCredentials(): { username: string; password: string } | null {
    if (typeof globalThis.window !== 'undefined') {
      const stored = globalThis.window.sessionStorage.getItem('rvfu_credentials');
      if (stored) {
        try { return JSON.parse(stored); } catch { return null; }
      }
    }
    return null;
  }

  private dispatchEvent(tokens: AuthTokens | null): void {
    if (typeof globalThis.window !== 'undefined') {
      globalThis.window.dispatchEvent(new CustomEvent('rvfu-tokens-updated', {
        detail: { tokens, isAuthenticated: !!tokens },
      }));
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURAZIONI AMBIENTE
// Credenziali confermate da ACI Informatica (26/02/2026)
// ═══════════════════════════════════════════════════════════════

export const RVFU_AUTH_CONFIG_FORMATION: AuthConfig = {
  clientId: import.meta.env.VITE_RVFU_CLIENT_ID || 'AUTODEM.RESCUEMANAGER',
  clientSecret: import.meta.env.VITE_RVFU_CLIENT_SECRET || 'e3abea315f8d7acffca73941c6a0de2197068d15',
  redirectUri: import.meta.env.VITE_RVFU_REDIRECT_URI || 'https://localhost/',
  scope: 'openid profile',
  environment: 'formation',
};

export const RVFU_AUTH_CONFIG_PRODUCTION: AuthConfig = {
  clientId: import.meta.env.VITE_RVFU_CLIENT_ID_PROD || '',
  clientSecret: import.meta.env.VITE_RVFU_CLIENT_SECRET_PROD || '',
  redirectUri: import.meta.env.VITE_RVFU_REDIRECT_URI_PROD || '',
  scope: 'openid profile',
  environment: 'production',
};
