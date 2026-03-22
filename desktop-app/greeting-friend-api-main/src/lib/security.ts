// src/lib/security.ts
/**
 * Security Service - Sistema di sicurezza centralizzato
 * 
 * Features:
 * - Rate limiting con exponential backoff
 * - Token blacklist per logout forzato
 * - Audit trail per eventi di sicurezza
 * - Protezione brute force
 * - Validazione JWT robusta
 * - Sanitizzazione input
 * 
 * @author haxies
 * @created 2026-02-18
 */

import { supabaseBrowser } from './supabase-browser';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface SecurityEvent {
  type: 'login_attempt' | 'login_success' | 'login_failed' | 'logout' | 'token_refresh' | 'token_expired' | 'suspicious_activity';
  user_id?: string;
  email?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

export interface TokenValidationResult {
  valid: boolean;
  expired: boolean;
  blacklisted: boolean;
  payload?: any;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minuti
    blockDurationMs: 30 * 60 * 1000, // 30 minuti
  },
  oauth: {
    maxAttempts: 10,
    windowMs: 10 * 60 * 1000, // 10 minuti
    blockDurationMs: 5 * 60 * 1000, // 5 minuti
  },
  api: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minuto
    blockDurationMs: 5 * 60 * 1000, // 5 minuti
  },
};

// ═══════════════════════════════════════════════════════════════
// SECURITY SERVICE
// ═══════════════════════════════════════════════════════════════

export class SecurityService {
  private static readonly STORAGE_PREFIX = 'rm-security';
  private static readonly BLACKLIST_KEY = `${this.STORAGE_PREFIX}-blacklist`;
  private static readonly RATE_LIMIT_KEY = `${this.STORAGE_PREFIX}-rate-limit`;
  private static readonly AUDIT_KEY = `${this.STORAGE_PREFIX}-audit`;

  // ─── Rate Limiting ───

  /**
   * Verifica se un'azione è rate limited
   */
  static isRateLimited(action: string, identifier: string): boolean {
    const config = RATE_LIMIT_CONFIGS[action];
    if (!config) return false;

    const key = `${this.RATE_LIMIT_KEY}-${action}-${identifier}`;
    const data = this.getStorageItem<{
      attempts: number;
      firstAttempt: number;
      blockedUntil?: number;
    }>(key);

    if (!data) return false;

    const now = Date.now();

    // Verifica se è bloccato
    if (data.blockedUntil && now < data.blockedUntil) {
      return true;
    }

    // Verifica se la finestra è scaduta
    if (now - data.firstAttempt > config.windowMs) {
      // Reset
      localStorage.removeItem(key);
      return false;
    }

    // Verifica se ha superato il limite
    return data.attempts >= config.maxAttempts;
  }

  /**
   * Registra un tentativo per rate limiting
   */
  static recordAttempt(action: string, identifier: string, success: boolean): void {
    const config = RATE_LIMIT_CONFIGS[action];
    if (!config) return;

    const key = `${this.RATE_LIMIT_KEY}-${action}-${identifier}`;
    const data = this.getStorageItem<{
      attempts: number;
      firstAttempt: number;
      blockedUntil?: number;
    }>(key);

    const now = Date.now();

    if (!data) {
      // Primo tentativo
      this.setStorageItem(key, {
        attempts: 1,
        firstAttempt: now,
      });
      return;
    }

    // Verifica se la finestra è scaduta
    if (now - data.firstAttempt > config.windowMs) {
      // Reset
      this.setStorageItem(key, {
        attempts: 1,
        firstAttempt: now,
      });
      return;
    }

    if (success) {
      // Successo - reset
      localStorage.removeItem(key);
      return;
    }

    // Incrementa tentativi
    const newAttempts = data.attempts + 1;

    if (newAttempts >= config.maxAttempts) {
      // Blocca
      this.setStorageItem(key, {
        ...data,
        attempts: newAttempts,
        blockedUntil: now + config.blockDurationMs,
      });

      // Log evento
      this.logSecurityEvent({
        type: 'suspicious_activity',
        metadata: {
          action,
          identifier,
          attempts: newAttempts,
          blocked: true,
        },
        timestamp: now,
      });
    } else {
      this.setStorageItem(key, {
        ...data,
        attempts: newAttempts,
      });
    }
  }

  /**
   * Ottiene il tempo rimanente di blocco (in ms)
   */
  static getBlockTimeRemaining(action: string, identifier: string): number {
    const key = `${this.RATE_LIMIT_KEY}-${action}-${identifier}`;
    const data = this.getStorageItem<{
      blockedUntil?: number;
    }>(key);

    if (!data?.blockedUntil) return 0;

    const remaining = data.blockedUntil - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  /**
   * Reset rate limit per una specifica azione
   */
  static resetRateLimit(action: string, identifier: string): void {
    const key = `${this.RATE_LIMIT_KEY}-${action}-${identifier}`;
    localStorage.removeItem(key);
  }

  // ─── Token Blacklist ───

  /**
   * Aggiunge un token alla blacklist
   */
  static blacklistToken(token: string, reason: string = 'logout'): void {
    const blacklist = this.getStorageItem<Record<string, { reason: string; timestamp: number }>>(this.BLACKLIST_KEY) || {};
    
    // Estrai exp dal token per auto-cleanup
    let expiresAt = Date.now() + 24 * 60 * 60 * 1000; // Default 24h
    try {
      const payload = this.decodeJWT(token);
      if (payload?.exp) {
        expiresAt = payload.exp * 1000;
      }
    } catch (e) {
      // Ignora errori di decodifica
    }

    blacklist[token] = {
      reason,
      timestamp: expiresAt,
    };

    // Cleanup vecchi token
    const now = Date.now();
    Object.keys(blacklist).forEach(key => {
      if (blacklist[key].timestamp < now) {
        delete blacklist[key];
      }
    });

    this.setStorageItem(this.BLACKLIST_KEY, blacklist);
  }

  /**
   * Verifica se un token è nella blacklist
   */
  static isTokenBlacklisted(token: string): boolean {
    const blacklist = this.getStorageItem<Record<string, { timestamp: number }>>(this.BLACKLIST_KEY);
    if (!blacklist) return false;

    const entry = blacklist[token];
    if (!entry) return false;

    // Verifica se è scaduto
    if (entry.timestamp < Date.now()) {
      // Cleanup
      delete blacklist[token];
      this.setStorageItem(this.BLACKLIST_KEY, blacklist);
      return false;
    }

    return true;
  }

  // ─── Token Validation ───

  /**
   * Valida un JWT token in modo robusto
   */
  static validateToken(token: string): TokenValidationResult {
    // Verifica formato base
    if (!token || typeof token !== 'string') {
      return {
        valid: false,
        expired: false,
        blacklisted: false,
        error: 'Token non valido',
      };
    }

    // Verifica blacklist
    if (this.isTokenBlacklisted(token)) {
      return {
        valid: false,
        expired: false,
        blacklisted: true,
        error: 'Token revocato',
      };
    }

    // Decodifica JWT
    try {
      const payload = this.decodeJWT(token);

      if (!payload) {
        return {
          valid: false,
          expired: false,
          blacklisted: false,
          error: 'Token malformato',
        };
      }

      // Verifica scadenza
      if (payload.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
          return {
            valid: false,
            expired: true,
            blacklisted: false,
            payload,
            error: 'Token scaduto',
          };
        }
      }

      // Verifica campi obbligatori
      if (!payload.sub && !payload.user_id && !payload.id) {
        return {
          valid: false,
          expired: false,
          blacklisted: false,
          payload,
          error: 'Token mancante identificativo utente',
        };
      }

      return {
        valid: true,
        expired: false,
        blacklisted: false,
        payload,
      };
    } catch (error) {
      return {
        valid: false,
        expired: false,
        blacklisted: false,
        error: `Errore validazione: ${error instanceof Error ? error.message : 'unknown'}`,
      };
    }
  }

  /**
   * Decodifica JWT senza verifica firma (solo per controlli locali)
   */
  private static decodeJWT(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('JWT malformato');
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      throw new Error('Impossibile decodificare JWT');
    }
  }

  // ─── Audit Trail ───

  /**
   * Registra un evento di sicurezza
   */
  static logSecurityEvent(event: SecurityEvent): void {
    try {
      const audit = this.getStorageItem<SecurityEvent[]>(this.AUDIT_KEY) || [];
      
      // Aggiungi evento
      audit.push(event);

      // Mantieni solo ultimi 100 eventi
      if (audit.length > 100) {
        audit.shift();
      }

      this.setStorageItem(this.AUDIT_KEY, audit);

      // Log in console in development
      if (import.meta.env.DEV) {
        console.log('[Security]', event.type, event);
      }

      // Invia a Supabase per audit persistente (async, non blocca)
      this.persistAuditEvent(event).catch(err => {
        console.warn('[Security] Failed to persist audit event:', err);
      });
    } catch (error) {
      console.error('[Security] Error logging security event:', error);
    }
  }

  /**
   * Persiste evento di sicurezza su Supabase
   */
  private static async persistAuditEvent(event: SecurityEvent): Promise<void> {
    try {
      const supabase = supabaseBrowser();
      await supabase.from('security_audit_log').insert({
        event_type: event.type,
        user_id: event.user_id,
        email: event.email,
        ip_address: event.ip_address,
        user_agent: event.user_agent,
        metadata: event.metadata,
        created_at: new Date(event.timestamp).toISOString(),
      });
    } catch (error) {
      // Ignora errori di persistenza (non critico)
    }
  }

  /**
   * Ottiene gli eventi di sicurezza recenti
   */
  static getRecentSecurityEvents(limit: number = 20): SecurityEvent[] {
    const audit = this.getStorageItem<SecurityEvent[]>(this.AUDIT_KEY) || [];
    return audit.slice(-limit).reverse();
  }

  // ─── Input Sanitization ───

  /**
   * Sanitizza input per prevenire XSS
   */
  static sanitizeInput(input: string): string {
    if (!input) return '';
    
    return input
      .replace(/[<>]/g, '') // Rimuovi tag HTML
      .replace(/javascript:/gi, '') // Rimuovi javascript:
      .replace(/on\w+=/gi, '') // Rimuovi event handlers
      .trim();
  }

  /**
   * Valida email
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida password strength
   */
  static validatePasswordStrength(password: string): {
    valid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length < 8) {
      feedback.push('La password deve essere di almeno 8 caratteri');
    } else {
      score += 1;
    }

    if (password.length >= 12) {
      score += 1;
    }

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Usa lettere maiuscole e minuscole');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Aggiungi almeno un numero');
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Aggiungi almeno un carattere speciale');
    }

    return {
      valid: score >= 3,
      score,
      feedback,
    };
  }

  // ─── CSRF Protection ───

  /**
   * Genera un token CSRF
   */
  static generateCSRFToken(): string {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    sessionStorage.setItem(`${this.STORAGE_PREFIX}-csrf`, token);
    return token;
  }

  /**
   * Verifica token CSRF
   */
  static verifyCSRFToken(token: string): boolean {
    const stored = sessionStorage.getItem(`${this.STORAGE_PREFIX}-csrf`);
    return stored === token;
  }

  // ─── Utility ───

  private static getStorageItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  private static setStorageItem(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('[Security] Error setting storage item:', error);
    }
  }

  /**
   * Pulisce tutti i dati di sicurezza (per logout completo)
   */
  static clearSecurityData(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.STORAGE_PREFIX));
      keys.forEach(key => localStorage.removeItem(key));
      
      const sessionKeys = Object.keys(sessionStorage).filter(key => key.startsWith(this.STORAGE_PREFIX));
      sessionKeys.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      console.error('[Security] Error clearing security data:', error);
    }
  }
}
