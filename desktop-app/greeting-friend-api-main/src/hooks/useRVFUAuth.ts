// src/hooks/useRVFUAuth.ts
// Hook React per gestione autenticazione RVFU

import { useState, useEffect, useCallback } from 'react';
import { RVFUAuthService, RVFU_AUTH_CONFIG_FORMATION, RVFU_AUTH_CONFIG_PRODUCTION, AuthTokens } from '@/lib/rvfu-auth';

export interface RVFUAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokens: AuthTokens | null;
}

export interface RVFUAuthActions {
  login: (username: string, password: string) => Promise<void>; // Login con credenziali (secondo specifiche ACI)
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  clearError: () => void;
  reloadState: () => void; // Forza il reload dello stato dallo storage
  authService: RVFUAuthService; // Espone l'istanza di RVFUAuthService per uso diretto
}

export function useRVFUAuth(environment: 'formation' | 'production' = 'formation'): RVFUAuthState & RVFUAuthActions {
  const [state, setState] = useState<RVFUAuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    tokens: null,
  });

  const [authService] = useState(() => {
    const config = environment === 'formation' 
      ? { ...RVFU_AUTH_CONFIG_FORMATION, environment: 'formation' }
      : { ...RVFU_AUTH_CONFIG_PRODUCTION, environment: 'production' };
    return new RVFUAuthService(config);
  });

  // Funzione per caricare i token dallo storage
  const loadTokensFromStorage = useCallback((forceReload: boolean = false) => {
    try {
      // Se forceReload è true, forza il servizio a ricaricare i token dal storage
      if (forceReload) {
        // Resetta i token nel servizio per forzare il reload
        (authService as any).tokens = null;
      }
      
      // isAuthenticated() carica automaticamente i token se non sono già caricati
      const isAuth = authService.isAuthenticated();
      if (isAuth) {
        // Usa getTokens() che ricarica se necessario
        const tokens = authService.getTokens?.() || authService.tokens;
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          tokens,
          isLoading: false,
        }));
        console.log('[useRVFUAuth] Token caricati:', { hasTokens: !!tokens, forceReload });
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          tokens: null,
          isLoading: false,
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Errore caricamento token: ${error.message}`,
        isLoading: false,
        isAuthenticated: false,
        tokens: null,
      }));
      return false;
    }
  }, [authService]);

  // Carica token esistenti al mount e quando cambia la chiave di storage
  useEffect(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    loadTokensFromStorage();

    // Ascolta eventi personalizzati per sincronizzazione immediata tra componenti
    const tokenUpdateListener = (event: CustomEvent) => {
      console.log('[useRVFUAuth] Evento rvfu-tokens-updated ricevuto, ricaricando token...');
      loadTokensFromStorage();
    };
    
    // Ascolta cambiamenti nello storage (per sincronizzare tra componenti)
    const storageListener = () => {
      loadTokensFromStorage();
    };
    
    // Polling per verificare cambiamenti nello storage (fallback per componenti che non usano lo stesso hook)
    // Questo è importante perché quando il login viene fatto da un componente separato (RVFULogin),
    // i token vengono salvati nello storage ma l'istanza del servizio in questo componente potrebbe non vederli
    // Inoltre, gestisce il refresh automatico del token quando è vicino alla scadenza
    const storagePoll = setInterval(() => {
      const currentAuthenticated = authService.isAuthenticated();
      const currentTokens = authService.getTokens?.() || authService.tokens;
      
      // Refresh automatico: se il token scade tra meno di 5 minuti, rinfrescalo automaticamente
      if (currentTokens && currentTokens.expiresAt) {
        const timeUntilExpiry = currentTokens.expiresAt - Date.now();
        const fiveMinutes = 5 * 60 * 1000; // 5 minuti in millisecondi
        
        if (timeUntilExpiry > 0 && timeUntilExpiry < fiveMinutes) {
          console.log('[useRVFUAuth] Token in scadenza tra poco, refresh automatico...', {
            timeUntilExpiry: Math.round(timeUntilExpiry / 1000 / 60) + ' minuti'
          });
          
          // Refresh automatico in background (non blocca l'UI)
          authService.refreshTokens().catch(error => {
            console.error('[useRVFUAuth] Errore refresh automatico token:', error);
          });
        }
      }
      
      setState(prev => {
        // Se lo stato di autenticazione è cambiato, aggiorna
        if (prev.isAuthenticated !== currentAuthenticated) {
          console.log('[useRVFUAuth] Stato autenticazione cambiato:', { 
            from: prev.isAuthenticated, 
            to: currentAuthenticated,
            hasTokens: !!currentTokens,
          });
          return {
            ...prev,
            isAuthenticated: currentAuthenticated,
            tokens: currentTokens,
          };
        }
        // Se è autenticato ma i token sono cambiati, aggiorna comunque
        if (currentAuthenticated && currentTokens && prev.tokens?.idToken !== currentTokens.idToken) {
          console.log('[useRVFUAuth] Token aggiornati');
          return {
            ...prev,
            tokens: currentTokens,
          };
        }
        return prev;
      });
    }, 500); // Controlla ogni 500ms per reattività migliore

    window.addEventListener('rvfu-tokens-updated', tokenUpdateListener as EventListener);
    window.addEventListener('storage', storageListener);
    
    return () => {
      window.removeEventListener('rvfu-tokens-updated', tokenUpdateListener as EventListener);
      window.removeEventListener('storage', storageListener);
      clearInterval(storagePoll);
    };
  }, [authService, loadTokensFromStorage]);

  // Login con credenziali (secondo specifiche ACI/MIT)
  const login = useCallback(async (username: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const tokens = await authService.authenticate(username, password);
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        tokens,
        isLoading: false,
      }));
      console.log('[useRVFUAuth] Login completato');
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Login fallito: ${error.message}`,
        isLoading: false,
        isAuthenticated: false,
        tokens: null,
      }));
      throw error;
    }
  }, [authService]);

  // Logout
  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Chiudi la finestra API persistente prima del logout
      if (typeof window !== 'undefined' && (window as any).api?.rvfu?.closeApiWindow) {
        try {
          console.log('[useRVFUAuth] Chiusura finestra API persistente...');
          await (window as any).api.rvfu.closeApiWindow();
        } catch (error) {
          console.error('[useRVFUAuth] Errore chiusura finestra API:', error);
          // Continua comunque con il logout
        }
      }
      
      await authService.logout();
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        tokens: null,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Logout fallito: ${error.message}`,
        isLoading: false,
      }));
    }
  }, [authService]);

  // Refresh tokens
  const refreshTokens = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const tokens = await authService.refreshTokens();
      setState(prev => ({
        ...prev,
        tokens,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Refresh token fallito: ${error.message}`,
        isLoading: false,
        isAuthenticated: false,
        tokens: null,
      }));
    }
  }, [authService]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Reload state from storage (forza il reload immediato)
  const reloadState = useCallback(() => {
    console.log('[useRVFUAuth] Forzato reload dello stato dallo storage');
    loadTokensFromStorage(true); // Passa true per forzare il reload
  }, [loadTokensFromStorage]);

  return {
    ...state,
    login,
    logout,
    refreshTokens,
    clearError,
    reloadState,
    authService, // Espone l'istanza di RVFUAuthService per uso diretto
  };
}
