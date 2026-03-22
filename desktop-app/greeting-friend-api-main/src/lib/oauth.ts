// src/lib/oauth.ts
import { supabaseBrowser } from './supabase-browser';
import { SecurityService } from './security';

export interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  created_at?: number; // Timestamp di creazione del token
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    current_org?: string;
    is_admin?: boolean;
    is_staff?: boolean;
    staff_role?: string;
  };
  supabase_session?: {
    hashed_token: string;
    type: string;
  } | null;
}

export interface OAuthUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  current_org?: string;
  is_admin?: boolean;
  is_staff?: boolean;
  staff_role?: string;
}

export class OAuthService {
  private static readonly OAUTH_BASE_URL = 'https://rescuemanager.eu'; // Usa dominio principale Vercel
  private static readonly REDIRECT_URI = 'http://localhost:3001/auth/callback';
  private static readonly APP_ID = 'desktop_app';
  private static readonly STORAGE_KEY = 'rm-oauth-tokens';

  /**
   * Avvia il flusso OAuth aprendo il browser
   */
  static async startOAuthFlow(): Promise<void> {
    try {
      // Rate limiting check
      const identifier = 'oauth-flow';
      if (SecurityService.isRateLimited('oauth', identifier)) {
        const remaining = SecurityService.getBlockTimeRemaining('oauth', identifier);
        const minutes = Math.ceil(remaining / 60000);
        throw new Error(`Troppi tentativi. Riprova tra ${minutes} minuti.`);
      }

      console.log('[OAuthService] Starting OAuth flow...');
      
      // Avvia server HTTP locale per callback tramite IPC
      if (typeof window !== 'undefined' && (window as any).api) {
        console.log('[OAuthService] Starting OAuth server via IPC...');
        const serverResult = await (window as any).api.oauth.startServer();
        console.log('[OAuthService] Server result:', serverResult);
        
        if (!serverResult.success) {
          console.error('[OAuthService] Server start failed:', serverResult.error);
          throw new Error(`Errore avvio server OAuth: ${serverResult.error}`);
        }
        
        console.log('[OAuthService] OAuth server started, callback URL:', serverResult.callbackUrl);
        
        // Genera state per sicurezza
        const state = this.generateState();
        console.log('[OAuthService] Generated state:', state);
        
        // Salva state per verifica
        localStorage.setItem('oauth_state', state);
        
        // Costruisci URL OAuth
        const oauthUrl = new URL(`${this.OAUTH_BASE_URL}/api/auth/oauth/desktop`);
        oauthUrl.searchParams.set('app_id', this.APP_ID);
        oauthUrl.searchParams.set('redirect_uri', serverResult.callbackUrl);
        oauthUrl.searchParams.set('state', state);
        
        console.log('[OAuthService] OAuth URL:', oauthUrl.toString());
        
        // Apri finestra popup Electron (piccola, dentro l'app)
        if ((window as any).api?.oauth?.openLoginWindow) {
          console.log('[OAuthService] Opening OAuth popup window...');
          (window as any).api.oauth.openLoginWindow(oauthUrl.toString());
        } else if ((window as any).api?.shellOpenExternal) {
          // Fallback: apri browser di sistema
          console.log('[OAuthService] Fallback: opening system browser...');
          (window as any).api.shellOpenExternal(oauthUrl.toString());
        } else {
          console.log('[OAuthService] Opening browser via window.open...');
          window.open(oauthUrl.toString(), '_blank', 'noopener,noreferrer');
        }
      } else {
        console.error('[OAuthService] window.api not available');
        throw new Error('Impossibile avviare OAuth server');
      }
      
    } catch (error) {
      console.error('[OAuthService] Error starting OAuth flow:', error);
      throw new Error('Impossibile avviare il flusso OAuth');
    }
  }

  /**
   * Gestisce il redirect dalla desktop app
   */
  static async handleOAuthCallback(url: string): Promise<OAuthTokens | null> {
    try {
      console.log('[OAuthService] Handling OAuth callback, URL:', url);
      
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      const state = urlObj.searchParams.get('state');
      
      console.log('[OAuthService] Extracted params:', { code: code ? 'present' : 'missing', state: state ? 'present' : 'missing' });
      
      if (!code || !state) {
        throw new Error('Parametri OAuth mancanti');
      }
      
      // Verifica state
      const savedState = localStorage.getItem('oauth_state');
      console.log('[OAuthService] Saved state:', savedState ? 'present' : 'missing');
      
      if (!savedState) {
        throw new Error('State non trovato - callback già elaborato');
      }
      
      if (state !== savedState) {
        console.error('[OAuthService] State mismatch:', { received: state, saved: savedState });
        throw new Error('State non corrispondente');
      }
      
      console.log('[OAuthService] State verified, exchanging code for tokens...');
      
      // Pulisci state immediatamente per evitare elaborazioni multiple
      localStorage.removeItem('oauth_state');
      
      // Scambia code per token
      const tokens = await this.exchangeCodeForTokens(code);
      console.log('[OAuthService] Tokens received:', tokens ? 'success' : 'failed');
      
      // Salva token
      this.saveTokens(tokens);
      console.log('[OAuthService] Tokens saved to localStorage');
      
      // Trigger immediate OrgContext refresh
      window.dispatchEvent(new CustomEvent('oauth-tokens-saved'));
      
      // Crea sessione Supabase reale per RLS (auth.uid())
      console.log('[OAuthService] ========== SUPABASE SESSION CREATION ==========');
      console.log('[OAuthService] supabase_session from exchange:', tokens.supabase_session ? 'present' : 'missing');
      console.log('[OAuthService] hashed_token:', tokens.supabase_session?.hashed_token ? tokens.supabase_session.hashed_token.substring(0, 20) + '...' : 'NULL');
      console.log('[OAuthService] type:', tokens.supabase_session?.type || 'NULL');
      
      if (tokens.supabase_session?.hashed_token) {
        try {
          const supabase = supabaseBrowser();
          console.log('[OAuthService] Calling verifyOtp with token_hash...');
          
          const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
            token_hash: tokens.supabase_session.hashed_token,
            type: 'magiclink',
          });
          
          console.log('[OAuthService] verifyOtp result:');
          console.log('[OAuthService] - error:', otpError ? JSON.stringify(otpError) : 'null');
          console.log('[OAuthService] - data.session:', otpData?.session ? 'YES' : 'NO');
          console.log('[OAuthService] - data.user:', otpData?.user ? otpData.user.id : 'NO');
          
          if (otpError) {
            console.error('[OAuthService] ❌ Supabase session creation FAILED:', otpError.message);
            console.error('[OAuthService] Error details:', otpError);
          } else if (otpData?.session) {
            console.log('[OAuthService] ✅ Supabase RLS session created successfully!');
            console.log('[OAuthService] Session user:', otpData.session.user.id);
            console.log('[OAuthService] Access token prefix:', otpData.session.access_token.substring(0, 20) + '...');
            
            // Verifica che la sessione sia effettivamente attiva
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            console.log('[OAuthService] Current session after verifyOtp:', currentSession ? 'ACTIVE' : 'NULL');
            
            // CRITICAL: Aspetta che la sessione sia salvata in localStorage
            // Il client Supabase salva la sessione in modo asincrono
            console.log('[OAuthService] Waiting 500ms for session to persist in localStorage...');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Verifica di nuovo che la sessione sia ancora attiva
            const { data: { session: persistedSession } } = await supabase.auth.getSession();
            console.log('[OAuthService] Session after 500ms delay:', persistedSession ? 'ACTIVE' : 'NULL');
            
            if (!persistedSession) {
              console.error('[OAuthService] ❌ Session lost after delay - localStorage persistence failed!');
            }
          } else {
            console.warn('[OAuthService] ⚠️ verifyOtp succeeded but no session returned');
          }
        } catch (sessErr) {
          console.error('[OAuthService] ❌ Supabase session exception:', sessErr);
          console.error('[OAuthService] Exception details:', sessErr instanceof Error ? sessErr.message : sessErr);
        }
      } else {
        console.warn('[OAuthService] ⚠️ No hashed_token from server - cannot create Supabase session');
      }
      console.log('[OAuthService] ========== END SUPABASE SESSION CREATION ==========');
      
      // Ferma il server HTTP tramite IPC
      if (typeof window !== 'undefined' && (window as any).api) {
        console.log('[OAuthService] Stopping OAuth server...');
        await (window as any).api.oauth.stopServer();
      }
      
      // Log successo
      SecurityService.logSecurityEvent({
        type: 'login_success',
        user_id: tokens.user.id,
        email: tokens.user.email,
        metadata: { method: 'oauth' },
        timestamp: Date.now(),
      });

      // Reset rate limit on success
      SecurityService.recordAttempt('oauth', 'oauth-flow', true);

      return tokens;
      
    } catch (error) {
      console.error('[OAuthService] Error handling OAuth callback:', error);
      
      // Log fallimento
      SecurityService.logSecurityEvent({
        type: 'login_failed',
        metadata: { method: 'oauth', error: error instanceof Error ? error.message : 'unknown' },
        timestamp: Date.now(),
      });

      // Record failed attempt
      SecurityService.recordAttempt('oauth', 'oauth-flow', false);
      // Ferma il server HTTP tramite IPC
      if (typeof window !== 'undefined' && (window as any).api) {
        await (window as any).api.oauth.stopServer();
      }
      return null;
    }
  }

  /**
   * Scambia OAuth code per access token
   */
  private static async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    try {
      console.log('[OAuthService] Exchanging code for tokens...');
      console.log('[OAuthService] Exchange URL:', `${this.OAUTH_BASE_URL}/api/auth/oauth/exchange`);
      console.log('[OAuthService] Code:', code);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 secondi
      
      const response = await fetch(`${this.OAUTH_BASE_URL}/api/auth/oauth/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          app_id: this.APP_ID
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('[OAuthService] Exchange response status:', response.status);
      console.log('[OAuthService] Exchange response ok:', response.ok);
      
      if (!response.ok) {
        let errorMessage = 'Errore durante lo scambio del codice';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.error('[OAuthService] Exchange error:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('[OAuthService] Exchange data received:', data.success ? 'success' : 'failed');
      
      if (!data.success) {
        throw new Error(data.error || 'Scambio codice fallito');
      }

      console.log('[OAuthService] Tokens received successfully');
      return data;
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('[OAuthService] Exchange timeout after 120 seconds');
        throw new Error('Timeout: il server non ha risposto in tempo. Riprova.');
      }
      console.error('[OAuthService] Exchange error:', error.message || error);
      throw error;
    }
  }

  // Cache per evitare richieste ripetute
  private static verifyCache: {
    token: string;
    user: OAuthUser;
    expiresAt: number;
  } | null = null;

  /**
   * Verifica se l'access token è valido
   */
  static async verifyToken(): Promise<OAuthUser | null> {
    try {
      const tokens = this.getTokens();
      if (!tokens) {
        this.verifyCache = null;
        return null;
      }

      // Validazione robusta con SecurityService
      const validation = SecurityService.validateToken(tokens.access_token);
      if (!validation.valid) {
        if (validation.blacklisted) {
          console.warn('[OAuth] Token blacklisted');
          this.verifyCache = null;
          return null;
        }
        if (validation.expired) {
          // Token scaduto, prova refresh
          const refreshed = await this.refreshToken();
          if (refreshed) {
            return this.verifyToken();
          }
          this.verifyCache = null;
          return null;
        }
        console.warn('[OAuth] Token validation failed:', validation.error);
        this.verifyCache = null;
        return null;
      }
      
      // Verifica cache (valida per 30 secondi)
      if (this.verifyCache && 
          this.verifyCache.token === tokens.access_token &&
          this.verifyCache.expiresAt > Date.now()) {
        return this.verifyCache.user;
      }
      
      // Verifica JWT localmente prima di chiamare il server
      try {
        // Decodifica JWT senza verifica (solo per controllare exp)
        const parts = tokens.access_token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            // Token scaduto, prova refresh
            const refreshed = await this.refreshToken();
            if (refreshed) {
              return this.verifyToken();
            }
            this.verifyCache = null;
            return null;
          }
        }
      } catch (e) {
        // Ignora errori di decodifica JWT
      }
      
      const response = await fetch(`${this.OAUTH_BASE_URL}/api/auth/verify?token=${tokens.access_token}`);
      
      if (!response.ok) {
        // Token non valido, prova refresh
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return this.verifyToken();
        }
        this.verifyCache = null;
        return null;
      }

      const data = await response.json();
      
      // Salva in cache
      if (data.user) {
        this.verifyCache = {
          token: tokens.access_token,
          user: data.user,
          expiresAt: Date.now() + 30000 // 30 secondi
        };
      }
      
      return data.user;
      
    } catch (error) {
      console.error('[OAuth] Error verifying token:', error);
      this.verifyCache = null;
      return null;
    }
  }

  /**
   * Refresh dell'access token
   */
  static async refreshToken(): Promise<boolean> {
    try {
      const tokens = this.getTokens();
      if (!tokens?.refresh_token) {
        return false;
      }

      const response = await fetch(`${this.OAUTH_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: tokens.refresh_token
        })
      });

      if (!response.ok) {
        // Invalida cache se refresh fallisce
        this.verifyCache = null;
        return false;
      }

      const data = await response.json();
      
      // Invalida cache quando si aggiorna il token
      this.verifyCache = null;
      
      if (data.success) {
        // Aggiorna token salvati
        const updatedTokens = {
          ...tokens,
          access_token: data.access_token,
          expires_in: data.expires_in
        };
        this.saveTokens(updatedTokens);
        return true;
      }

      return false;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Logout e pulizia token
   */
  static async logout(): Promise<void> {
    try {
      const tokens = this.getTokens();
      
      // Blacklist token corrente
      if (tokens?.access_token) {
        SecurityService.blacklistToken(tokens.access_token, 'user_logout');
      }

      // Log logout
      SecurityService.logSecurityEvent({
        type: 'logout',
        user_id: tokens?.user?.id,
        email: tokens?.user?.email,
        timestamp: Date.now(),
      });

      // Pulisci token locali
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem('oauth_state');
      
      // Pulisci cache verify
      this.verifyCache = null;
      
      // Pulisci dati di sicurezza
      SecurityService.clearSecurityData();
      
      // Pulisci sessione Supabase
      const supabase = supabaseBrowser();
      await supabase.auth.signOut();
      
    } catch (error) {
      // Ignora errori durante logout
    }
  }

  /**
   * Ottiene i token salvati
   */
  static getTokens(): OAuthTokens | null {
    try {
      const tokens = localStorage.getItem(this.STORAGE_KEY);
      if (tokens) {
        return JSON.parse(tokens);
      }
      return null;
    } catch (error) {
      console.error('[OAuth] Error getting tokens:', error);
      return null;
    }
  }

  /**
   * Salva i token
   */
  private static saveTokens(tokens: OAuthTokens): void {
    try {
      // Aggiungi timestamp di creazione
      const tokensWithTimestamp = {
        ...tokens,
        created_at: Date.now()
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tokensWithTimestamp));
    } catch (error) {
      console.error('[OAuth] Error saving tokens:', error);
    }
  }

  /**
   * Genera state casuale per sicurezza
   */
  private static generateState(): string {
    // Usa crypto.getRandomValues per state più sicuro
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verifica se l'utente è autenticato
   */
  static isAuthenticated(): boolean {
    const tokens = this.getTokens();
    
    if (!tokens || !tokens.access_token) {
      return false;
    }
    
    // Verifica scadenza token (solo se created_at esiste)
    if (tokens.created_at) {
      const now = Date.now();
      const expiresAt = tokens.created_at + (tokens.expires_in * 1000);
      
      if (now >= expiresAt) {
        // Pulisci token scaduto
        localStorage.removeItem(this.STORAGE_KEY);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Ottiene l'utente corrente
   */
  static async getCurrentUser(): Promise<OAuthUser | null> {
    if (!this.isAuthenticated()) {
      return null;
    }
    return await this.verifyToken();
  }

  /**
   * Registra listener per OAuth callback (Electron) - DEPRECATO
   * Ora usiamo server HTTP locale
   */
  static registerOAuthCallback(callback: (url: string) => void): void {
    // Non più necessario con server HTTP locale
  }
}
