import { useState, useEffect, useCallback } from 'react';
import { OAuthService } from '@/lib/oauth';
import { SecurityService } from '@/lib/security';

// Usa VPS OAuth proxy per evitare timeout di Vercel
const API_BASE = import.meta.env.VITE_API_BASE || 'https://oauth.rescuemanager.eu';

/**
 * Hook per gestire l'autenticazione degli operatori
 */
export function useOperatorAuth() {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentOperator, setCurrentOperator] = useState(null);

  // Carica operatori disponibili
  const loadOperators = useCallback(async (orgId) => {
    if (!orgId) {
      setError('Organizzazione non selezionata');
      return;
    }

    console.log('[useOperatorAuth] loadOperators called with orgId:', orgId);
    setLoading(true);
    setError(null);

    try {
      // Ottieni token OAuth
      const tokens = OAuthService.getTokens();
      const token = tokens?.access_token;
      if (!token) {
        throw new Error('Non autenticato SSO');
      }

      const url = `${API_BASE}/api/auth/operator/list?org_id=${orgId}`;
      console.log('[useOperatorAuth] Fetching operators from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('[useOperatorAuth] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('[useOperatorAuth] Operators response:', { success: data.success, count: data.operators?.length || 0 });
      if (data.success) {
        // Se success è true ma operators è undefined o null, significa che non ci sono operatori (non è un errore)
        const operatorsList = Array.isArray(data.operators) ? data.operators : [];
        console.log('[useOperatorAuth] Setting operators:', operatorsList);
        setOperators(operatorsList);
        // Se non ci sono operatori, non è un errore, è normale
        if (operatorsList.length === 0) {
          setError(null); // Pulisci eventuali errori precedenti
        }
      } else {
        console.error('[useOperatorAuth] Error in response:', data.error || 'Errore caricamento operatori');
        throw new Error(data.error || 'Errore caricamento operatori');
      }
    } catch (err) {
      setError(err.message || 'Errore caricamento operatori');
      setOperators([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login operatore
  const loginOperator = useCallback(async (operatorId, password, rememberDevice = true) => {
    setLoading(true);

    try {
      // Rate limiting check
      const identifier = `operator-${operatorId}`;
      if (SecurityService.isRateLimited('login', identifier)) {
        const remaining = SecurityService.getBlockTimeRemaining('login', identifier);
        const minutes = Math.ceil(remaining / 60000);
        throw new Error(`Troppi tentativi falliti. Riprova tra ${minutes} minuti.`);
      }

      const tokens = OAuthService.getTokens();
      const token = tokens?.access_token;
      if (!token) {
        throw new Error('Non autenticato SSO');
      }

      const response = await fetch(`${API_BASE}/api/auth/operator/login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operator_id: operatorId,
          password,
          remember_device: rememberDevice,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.session) {
        // Salva sessione operatore
        localStorage.setItem('operator_session', JSON.stringify(data.session));
        localStorage.setItem('operator_id', operatorId);
        
        // Salva nome operatore per visualizzazione in Shell
        if (data.operator) {
          const operatorName = data.operator.nome || data.operator.codice_operatore || 'Operatore';
          localStorage.setItem('operator_name', operatorName);
          console.log('[useOperatorAuth] Saved operator name to localStorage:', operatorName);
        }
        
        setCurrentOperator(data.operator);

        // Log successo e reset rate limit
        SecurityService.logSecurityEvent({
          type: 'login_success',
          user_id: tokens?.user?.id,
          email: tokens?.user?.email,
          metadata: { method: 'operator', operator_id: operatorId },
          timestamp: Date.now(),
        });
        SecurityService.recordAttempt('login', identifier, true);

        return { success: true, operator: data.operator, session: data.session };
      } else {
        throw new Error(data.error || 'Errore login operatore');
      }
    } catch (err) {
      setError(err.message || 'Errore login operatore');

      // Log fallimento e record attempt
      SecurityService.logSecurityEvent({
        type: 'login_failed',
        user_id: tokens?.user?.id,
        email: tokens?.user?.email,
        metadata: { method: 'operator', operator_id: operatorId, error: err.message },
        timestamp: Date.now(),
      });
      SecurityService.recordAttempt('login', identifier, false);

      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Crea primo operatore
  const createFirstOperator = useCallback(async (orgId, username, password) => {
    setLoading(true);
    setError(null);

    try {
      const tokens = OAuthService.getTokens();
      const token = tokens?.access_token;
      if (!token) {
        throw new Error('Non autenticato SSO');
      }

      const response = await fetch(`${API_BASE}/api/auth/operator/create-first`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          org_id: orgId,
          username,
          password,
          ruolo: 'admin',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.operator) {
        // Dopo la creazione, carica gli operatori
        await loadOperators(orgId);
        return { success: true, operator: data.operator };
      } else {
        throw new Error(data.error || 'Errore creazione operatore');
      }
    } catch (err) {
      setError(err.message || 'Errore creazione operatore');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadOperators]);

  // Verifica se c'è una sessione operatore attiva
  useEffect(() => {
    const sessionStr = localStorage.getItem('operator_session');
    const operatorId = localStorage.getItem('operator_id');
    
    if (sessionStr && operatorId) {
      try {
        const session = JSON.parse(sessionStr);
        // Verifica se la sessione è ancora valida
        if (session.expires_at && new Date(session.expires_at) > new Date()) {
          // Sessione valida, carica info operatore
          const operator = operators.find(op => op.id === operatorId);
          if (operator) {
            setCurrentOperator(operator);
          }
        } else {
          // Sessione scaduta, rimuovi
          localStorage.removeItem('operator_session');
          localStorage.removeItem('operator_id');
        }
      } catch (e) {
        localStorage.removeItem('operator_session');
        localStorage.removeItem('operator_id');
      }
    }
  }, [operators]);

  // Logout operatore
  const logoutOperator = useCallback(() => {
    localStorage.removeItem('operator_session');
    localStorage.removeItem('operator_id');
    localStorage.removeItem('operator_name');
    setCurrentOperator(null);
  }, []);

  return {
    operators,
    loading,
    error,
    currentOperator,
    loadOperators,
    loginOperator,
    createFirstOperator,
    logoutOperator,
  };
}
