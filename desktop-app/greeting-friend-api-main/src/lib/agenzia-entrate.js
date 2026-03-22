// src/lib/agenzia-entrate.js
// API Agenzia delle Entrate - Verifica P.IVA e Codice Fiscale
// Servizio GRATUITO pubblico

import { supabaseBrowser } from './supabase-browser';

// Configurazione (da variabili d'ambiente)
const AGENZIA_ENTRATE_BASE_URL = import.meta.env.VITE_AGENZIA_ENTRATE_API_URL || 'https://api.agenziaentrate.gov.it';
const AGENZIA_ENTRATE_OAUTH_URL = import.meta.env.VITE_AGENZIA_ENTRATE_OAUTH_URL || 'https://api.agenziaentrate.gov.it/oauth';
const AGENZIA_ENTRATE_CLIENT_ID = import.meta.env.VITE_AGENZIA_ENTRATE_CLIENT_ID;
const AGENZIA_ENTRATE_CLIENT_SECRET = import.meta.env.VITE_AGENZIA_ENTRATE_CLIENT_SECRET;

// Cache token OAuth (in-memory)
let oauthTokenCache = {
  token: null,
  expiresAt: null
};

/**
 * Ottiene token OAuth2 da Agenzia delle Entrate
 * @returns {Promise<string|null>} Access token o null
 */
async function getOAuthToken() {
  // Se abbiamo un token valido in cache, usalo
  if (oauthTokenCache.token && oauthTokenCache.expiresAt && Date.now() < oauthTokenCache.expiresAt) {
    return oauthTokenCache.token;
  }

  if (!AGENZIA_ENTRATE_CLIENT_ID || !AGENZIA_ENTRATE_CLIENT_SECRET) {
    console.warn('[Agenzia Entrate] Credenziali OAuth non configurate');
    return null;
  }

  try {
    // Crea Basic Auth header (client_id:client_secret in base64)
    const basicAuth = btoa(`${AGENZIA_ENTRATE_CLIENT_ID}:${AGENZIA_ENTRATE_CLIENT_SECRET}`);
    
    const response = await fetch(`${AGENZIA_ENTRATE_OAUTH_URL}/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials&scope=verifica-piva verifica-cf'
    });

    if (!response.ok) {
      console.error('[Agenzia Entrate] Errore ottenimento token OAuth:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    // Salva token in cache
    oauthTokenCache.token = data.access_token;
    // Assume scadenza in 1 ora (3600 secondi) se non specificato
    const expiresIn = data.expires_in || 3600;
    oauthTokenCache.expiresAt = Date.now() + (expiresIn * 1000) - 60000; // -1 minuto per sicurezza
    
    console.log('[Agenzia Entrate] Token OAuth ottenuto con successo');
    return oauthTokenCache.token;
  } catch (error) {
    console.error('[Agenzia Entrate] Errore ottenimento token OAuth:', error);
    return null;
  }
}

/**
 * Ottiene dati azienda dalla cache database
 * @param {string} vatCode - P.IVA normalizzata
 * @returns {Promise<Object|null>} Dati azienda o null se non in cache o scaduta
 */
async function getCachedCompanyData(vatCode) {
  try {
    const supabase = supabaseBrowser();
    const { data, error } = await supabase
      .from('company_cache')
      .select('company_data, expires_at')
      .eq('vat_code', vatCode)
      .maybeSingle();
    
    if (error) {
      console.warn('[Agenzia Entrate] Errore lettura cache:', error);
      return null;
    }
    
    if (!data) {
      return null;
    }
    
    // Verifica se cache è scaduta
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      // Elimina cache scaduta
      await supabase
        .from('company_cache')
        .delete()
        .eq('vat_code', vatCode);
      console.log('[Agenzia Entrate] Cache scaduta, eliminata');
      return null;
    }
    
    console.log('[Agenzia Entrate] Dati da cache database');
    return data.company_data;
  } catch (error) {
    console.warn('[Agenzia Entrate] Errore accesso cache:', error);
    return null;
  }
}

/**
 * Salva dati azienda nella cache database
 * @param {string} vatCode - P.IVA normalizzata
 * @param {Object} companyData - Dati azienda da salvare
 * @returns {Promise<void>}
 */
async function setCachedCompanyData(vatCode, companyData) {
  try {
    const supabase = supabaseBrowser();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 giorni
    
    await supabase
      .from('company_cache')
      .upsert({
        vat_code: vatCode,
        company_data: companyData,
        expires_at: expiresAt.toISOString()
      }, {
        onConflict: 'vat_code'
      });
    
    console.log('[Agenzia Entrate] Dati salvati in cache database');
  } catch (error) {
    console.warn('[Agenzia Entrate] Errore salvataggio cache:', error);
  }
}

/**
 * Verifica Partita IVA tramite API Agenzia delle Entrate
 * @param {string} vatCode - P.IVA (con o senza prefisso IT)
 * @returns {Promise<Object|null>} Dati azienda o null se non trovata
 */
export async function getCompanyData(vatCode) {
  if (!vatCode) return null;

  // Normalizza P.IVA (rimuovi spazi e prefisso IT)
  const cleanVat = String(vatCode).trim().replace(/\s+/g, '').replace(/^IT/i, '');

  if (cleanVat.length < 11) {
    console.warn('[Agenzia Entrate] P.IVA troppo corta:', cleanVat);
    return null;
  }

  // 1. Verifica cache database
  const cached = await getCachedCompanyData(cleanVat);
  if (cached) {
    return cached;
  }
  
  // 2. Verifica cache localStorage (fallback)
  const localStorageKey = `agenzia_entrate_cache_${cleanVat}`;
  try {
    const cachedLocal = localStorage.getItem(localStorageKey);
    if (cachedLocal) {
      const parsed = JSON.parse(cachedLocal);
      if (parsed.expiresAt > Date.now()) {
        console.log('[Agenzia Entrate] Dati da cache localStorage');
        return parsed.data;
      } else {
        localStorage.removeItem(localStorageKey);
      }
    }
  } catch (error) {
    // Ignora errori localStorage
  }

  // 3. Ottieni token OAuth
  const token = await getOAuthToken();
  if (!token) {
    console.warn('[Agenzia Entrate] Impossibile ottenere token OAuth');
    return null;
  }

  try {
    // 4. Chiama API verifica P.IVA
    const response = await fetch(`${AGENZIA_ENTRATE_BASE_URL}/verifica-piva`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        partitaIva: cleanVat
      })
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('[Agenzia Entrate] P.IVA non trovata:', cleanVat);
        return null;
      }
      if (response.status === 401) {
        console.error('[Agenzia Entrate] Token OAuth non valido o scaduto');
        // Prova a rigenerare token
        oauthTokenCache.token = null;
        const newToken = await getOAuthToken();
        if (newToken) {
          // Riprova con nuovo token
          return getCompanyData(vatCode);
        }
        return null;
      }
      if (response.status === 429) {
        console.error('[Agenzia Entrate] Limite richieste superato (rate limiting)');
        return null;
      }
      console.error('[Agenzia Entrate] Errore HTTP:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    // 5. Normalizza risposta
    const companyData = {
      vat: cleanVat,
      taxCode: data.codiceFiscale || null,
      denomination: data.denominazione || null,
      name: data.denominazione || (data.nome && data.cognome ? `${data.nome} ${data.cognome}` : null),
      status: data.status || 'unknown',
      active: data.status === 'attiva',
      // Dati NON disponibili da Agenzia Entrate (lasciare null)
      street: null,
      city: null,
      province: null,
      zip: null,
      codiceDestinatario: null,
      pec: null,
      sdiCode: null
    };
    
    // 6. Salva in cache
    if (companyData) {
      await setCachedCompanyData(cleanVat, companyData);
      
      // Cache localStorage (24 ore)
      try {
        localStorage.setItem(localStorageKey, JSON.stringify({
          data: companyData,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 ore
        }));
      } catch (error) {
        // Ignora errori localStorage
      }
    }
    
    return companyData;
  } catch (error) {
    console.error('[Agenzia Entrate] Errore verifica P.IVA:', error);
    return null;
  }
}

/**
 * Verifica Codice Fiscale tramite API Agenzia delle Entrate
 * @param {string} codiceFiscale - Codice Fiscale
 * @param {Object} datiAnagrafici - Dati anagrafici per verifica
 * @returns {Promise<Object>} { valid: boolean, corrispondenza: boolean, messaggio: string }
 */
export async function verifyCodiceFiscale(codiceFiscale, datiAnagrafici = {}) {
  if (!codiceFiscale) {
    return { valid: false, corrispondenza: false, messaggio: 'Codice fiscale non fornito' };
  }

  const token = await getOAuthToken();
  if (!token) {
    return { valid: false, corrispondenza: false, messaggio: 'Impossibile ottenere token OAuth' };
  }

  try {
    const response = await fetch(`${AGENZIA_ENTRATE_BASE_URL}/verifica-cf`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        codiceFiscale: codiceFiscale,
        nome: datiAnagrafici.nome || null,
        cognome: datiAnagrafici.cognome || null,
        dataNascita: datiAnagrafici.dataNascita || null,
        sesso: datiAnagrafici.sesso || null,
        comuneNascita: datiAnagrafici.comuneNascita || null
      })
    });

    if (!response.ok) {
      return { valid: false, corrispondenza: false, messaggio: `Errore HTTP: ${response.status}` };
    }

    const data = await response.json();
    return {
      valid: data.valid || false,
      corrispondenza: data.corrispondenza || false,
      messaggio: data.messaggio || 'Verifica completata'
    };
  } catch (error) {
    console.error('[Agenzia Entrate] Errore verifica CF:', error);
    return { valid: false, corrispondenza: false, messaggio: 'Errore durante la verifica' };
  }
}

/**
 * Auto-compila form cliente/fattura con dati da P.IVA
 * @param {string} vatCode - P.IVA (con o senza prefisso IT)
 * @returns {Promise<Object>} Dati formattati per auto-compilazione
 */
export async function autoFillFromPIVA(vatCode) {
  if (!vatCode) return null;
  
  const companyData = await getCompanyData(vatCode);
  
  if (!companyData) return null;
  
  return {
    // Dati cliente
    name: companyData.name || companyData.denomination || '',
    denomination: companyData.denomination || companyData.name || '',
    taxCode: companyData.taxCode || '',
    vat: companyData.vat || vatCode,
    
    // Indirizzo (NON disponibile da Agenzia Entrate - lasciare vuoto)
    street: '',
    zip: '',
    city: '',
    province: '',
    
    // SDI (NON disponibile da Agenzia Entrate - lasciare vuoto)
    codiceDestinatario: '',
    pec: '',
    
    // Stato (per warning)
    status: companyData.status || null,
    active: companyData.active !== false
  };
}

/**
 * Verifica validità P.IVA e stato
 * @param {string} vatCode - P.IVA (con o senza prefisso IT)
 * @returns {Promise<Object>} { valid: boolean, status: string, denomination?: string, error?: string }
 */
export async function validatePIVA(vatCode) {
  if (!vatCode) {
    return { valid: false, error: 'P.IVA non fornita' };
  }

  const companyData = await getCompanyData(vatCode);
  
  if (!companyData) {
    return { valid: false, error: 'P.IVA non trovata nel database Agenzia delle Entrate' };
  }

  return {
    valid: true,
    status: companyData.status || 'unknown',
    denomination: companyData.denomination || companyData.name || null,
    active: companyData.active
  };
}
