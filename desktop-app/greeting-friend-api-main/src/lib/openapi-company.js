// src/lib/openapi-company.js
// OpenAPI.it - Company IT API
// Verifica P.IVA, ragione sociale, indirizzo, codice SDI, PEC

import { supabaseBrowser } from './supabase-browser';

const OPENAPI_API_KEY = import.meta.env.VITE_OPENAPI_API_KEY;
const OPENAPI_EMAIL = import.meta.env.VITE_OPENAPI_EMAIL; // Email account OpenAPI.it (opzionale, per OAuth)
// URL base da specifica OpenAPI: https://console.openapi.com/oas/it/company.openapi.json
const OPENAPI_BASE_URL = 'https://company.openapi.com';
const OPENAPI_OAUTH_URL = 'https://oauth.openapi.it';
// Sandbox: https://test.company.openapi.com (per test)

// Cache token OAuth (in-memory, si resetta al refresh pagina)
let oauthTokenCache = {
  token: null,
  expiresAt: null
};

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
      console.warn('[OpenAPI Company] Errore lettura cache:', error);
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
      console.log('[OpenAPI Company] Cache scaduta, eliminata');
      return null;
    }
    
    console.log('[OpenAPI Company] Dati da cache database');
    return data.company_data;
  } catch (error) {
    console.warn('[OpenAPI Company] Errore accesso cache:', error);
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
    
    console.log('[OpenAPI Company] Dati salvati in cache database');
  } catch (error) {
    console.warn('[OpenAPI Company] Errore salvataggio cache:', error);
    // Non bloccare se la cache fallisce
  }
}

/**
 * Ottiene token OAuth da OpenAPI.it
 * Specifica: https://console.openapi.com/oas/it/oauth.openapi.json
 * @returns {Promise<string|null>} Token OAuth o null
 */
async function getOAuthToken() {
  // Se abbiamo un token valido in cache, usalo
  if (oauthTokenCache.token && oauthTokenCache.expiresAt && Date.now() < oauthTokenCache.expiresAt) {
    return oauthTokenCache.token;
  }

  if (!OPENAPI_API_KEY) {
    console.warn('[OpenAPI Company] API key non configurata');
    return null;
  }

  // Se non c'è email, prova a usare la chiave direttamente come token
  // (potrebbe essere già un token OAuth valido)
  if (!OPENAPI_EMAIL) {
    console.warn('[OpenAPI Company] Email non configurata, provo a usare la chiave come token diretto');
    return OPENAPI_API_KEY;
  }

  try {
    // Crea Basic Auth header (email:APIKey in base64)
    // Specifica OAuth: https://console.openapi.com/oas/it/oauth.openapi.json
    const basicAuth = btoa(`${OPENAPI_EMAIL}:${OPENAPI_API_KEY}`);
    
    // Endpoint OAuth: POST /token
    // Body: { scopes: [...], ttl: number }
    // Risposta: { token: string, scopes: [...], expire: number, success: boolean }
    const response = await fetch(`${OPENAPI_OAUTH_URL}/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        scopes: [
          'GET:company.openapi.com/IT-start',
          'GET:company.openapi.com/IT-advanced'
        ],
        ttl: 3600 // 1 ora in secondi (max 1 anno secondo specifica)
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[OpenAPI Company] Errore ottenimento token OAuth:', response.status, response.statusText, errorData);
      // Fallback: prova a usare la chiave direttamente
      return OPENAPI_API_KEY;
    }

    const data = await response.json();
    
    // Formato risposta OAuth: { token: string, scopes: [...], expire: number, success: boolean }
    if (data.token && data.success) {
      // Salva in cache
      oauthTokenCache.token = data.token;
      // expire è un timestamp UNIX in secondi
      oauthTokenCache.expiresAt = (data.expire * 1000) - 60000; // -1 minuto per sicurezza
      console.log('[OpenAPI Company] Token OAuth ottenuto con successo, scade:', new Date(data.expire * 1000).toLocaleString());
      return data.token;
    }

    console.warn('[OpenAPI Company] Risposta OAuth non valida:', data);
    // Fallback: prova a usare la chiave direttamente
    return OPENAPI_API_KEY;
  } catch (error) {
    console.error('[OpenAPI Company] Errore fetch token OAuth:', error);
    // Fallback: prova a usare la chiave direttamente
    return OPENAPI_API_KEY;
  }
}

/**
 * Recupera dati azienda da P.IVA usando Company IT
 * @param {string} vatCode - P.IVA (con o senza prefisso IT)
 * @param {string} level - Livello dati: 'start' (default) o 'advanced'
 * @returns {Promise<Object|null>} Dati azienda o null
 */
export async function getCompanyData(vatCode, level = 'start') {
  if (!vatCode) return null;
  
  if (!OPENAPI_API_KEY) {
    console.warn('[OpenAPI Company] API key non configurata');
    return null;
  }

  // Normalizza P.IVA (rimuovi spazi e prefisso IT)
  const cleanVat = String(vatCode).trim().replace(/\s+/g, '').replace(/^IT/i, '');

  if (cleanVat.length < 11) {
    console.warn('[OpenAPI Company] P.IVA troppo corta:', cleanVat);
    return null;
  }

  try {
    // Ottieni token OAuth (o usa chiave direttamente se è già un token)
    const token = await getOAuthToken();
    
    if (!token) {
      console.warn('[OpenAPI Company] Impossibile ottenere token OAuth');
      return null;
    }

    // Endpoint Company IT da specifica OpenAPI
    // Documentazione: https://console.openapi.com/oas/it/company.openapi.json
    // Endpoint: /IT-start/{vatCode} o /IT-advanced/{vatCode}
    const endpoint = level === 'advanced' 
      ? `${OPENAPI_BASE_URL}/IT-advanced/${cleanVat}`
      : `${OPENAPI_BASE_URL}/IT-start/${cleanVat}`;
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        // P.IVA non trovata
        console.log('[OpenAPI Company] P.IVA non trovata:', cleanVat);
        return null;
      }
      if (response.status === 401) {
        console.error('[OpenAPI Company] API key non valida o scaduta');
        return null;
      }
      if (response.status === 402) {
        console.error('[OpenAPI Company] Credito insufficiente nel wallet');
        return null;
      }
      if (response.status === 429) {
        console.error('[OpenAPI Company] Limite richieste superato');
        return null;
      }
      console.error('[OpenAPI Company] Errore HTTP:', response.status, response.statusText);
      return null;
    }

    const responseData = await response.json();
    
    // Formato risposta OpenAPI: { data: [...], success: boolean, message: string, error: integer }
    if (!responseData.success || !responseData.data || responseData.data.length === 0) {
      console.log('[OpenAPI Company] Nessun dato trovato:', responseData.message || 'P.IVA non trovata');
      return null;
    }
    
    // Prendi il primo risultato (dovrebbe essere uno solo per P.IVA)
    const data = responseData.data[0];
    
    // Debug: log struttura risposta
    console.log('[OpenAPI Company] Risposta API completa:', JSON.stringify(data, null, 2));
    console.log('[OpenAPI Company] companyStatus:', data.companyStatus);
    console.log('[OpenAPI Company] activityStatus:', data.companyStatus?.activityStatus || data.activityStatus);
    
    // Normalizza risposta secondo specifica OpenAPI
    // La struttura dipende dal livello (start vs advanced)
    // Per IT-start: può avere companyDetails O direttamente companyName, address, etc.
    // Dalla risposta reale: companyName è direttamente in data, non in companyDetails
    const companyDetails = data.companyDetails || {};
    const address = data.address || {};
    const pec = data.pec || {};
    
    // Se companyName è direttamente in data (non in companyDetails)
    const companyName = data.companyName || companyDetails.companyName || companyDetails.denomination || companyDetails.name || null;
    
    // Stato (da companyStatus o direttamente da data)
    // OpenAPI.it può restituire activityStatus in italiano ("ATTIVA", "SOSPESA", "CESSAZIONE") 
    // o in inglese ("ACTIVE", "SUSPENDED", "CEASED")
    const rawActivityStatus = data.companyStatus?.activityStatus || data.activityStatus || 'ATTIVA';
    const activityStatus = String(rawActivityStatus).toUpperCase();
    
    // Mappa valori italiani a inglesi per compatibilità
    const statusMap = {
      'ATTIVA': 'ACTIVE',
      'SOSPESA': 'SUSPENDED',
      'CESSAZIONE': 'CEASED',
      'INATTIVA': 'INACTIVE',
      'ACTIVE': 'ACTIVE',
      'SUSPENDED': 'SUSPENDED',
      'CEASED': 'CEASED',
      'INACTIVE': 'INACTIVE'
    };
    
    const normalizedStatus = statusMap[activityStatus] || 'ACTIVE';
    const isActive = normalizedStatus === 'ACTIVE';
    
    console.log('[OpenAPI Company] activityStatus raw:', rawActivityStatus);
    console.log('[OpenAPI Company] activityStatus normalizzato:', normalizedStatus, 'active:', isActive);
    
    const companyData = {
      // Dati identificativi (da companyDetails o direttamente da data)
      vat: data.vatCode || companyDetails.vatCode || companyDetails.vat || cleanVat,
      taxCode: data.taxCode || companyDetails.taxCode || companyDetails.codiceFiscale || null,
      denomination: companyName, // Usa companyName mappato sopra
      legalForm: companyDetails.legalForm || data.legalForm || null,
      
      // Indirizzo (da address o direttamente da data.address)
      address: address.registeredOffice || address || data.address?.registeredOffice || null,
      street: address.registeredOffice?.streetName || 
              address.registeredOffice?.street || 
              data.address?.registeredOffice?.streetName ||
              address.streetName || address.via || null,
      city: address.registeredOffice?.town || 
            data.address?.registeredOffice?.town ||
            address.town || address.city || address.citta || null,
      province: address.registeredOffice?.province || 
                data.address?.registeredOffice?.province ||
                address.province || address.provincia || null,
      zip: address.registeredOffice?.zipCode || 
           data.address?.registeredOffice?.zipCode ||
           address.zipCode || address.zip || address.cap || null,
      
      // SDI e PEC (da pec o direttamente da data)
      sdiCode: data.sdiCode || pec.sdiCode || data.codiceSDI || data.codiceDestinatario || null,
      pec: data.pec || pec.pec || pec.email || data.domicilioDigitale || null,
      
      // Stato (normalizzato)
      status: normalizedStatus.toLowerCase(), // Normalizza in minuscolo per compatibilità
      active: isActive,
      
      // Dati aggiuntivi
      ateco: data.atecoClassification?.ateco2025?.[0]?.code || data.atecoClassification?.ateco2022?.[0]?.code || data.ateco || null,
      rea: companyDetails.rea || data.rea || null,
      
      // Dati formattati per il form (compatibilità)
      name: companyName, // Usa companyName mappato sopra
      codiceDestinatario: data.sdiCode || pec.sdiCode || data.codiceSDI || data.codiceDestinatario || null
    };
    
    // Salva in cache (database e localStorage)
    if (companyData) {
      await setCachedCompanyData(cleanVat, companyData);
      
      // Cache localStorage (24 ore)
      try {
        const localStorageKey = `openapi_cache_${cleanVat}`;
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
    console.error('[OpenAPI Company] Errore fetch:', error);
    return null;
  }
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
    return { valid: false, error: 'P.IVA non trovata nel database OpenAPI' };
  }

  return {
    valid: true,
    status: companyData.status || 'unknown',
    denomination: companyData.denomination || null,
    active: companyData.active !== false
  };
}

/**
 * Recupera solo codice destinatario SDI da P.IVA
 * @param {string} vatCode - P.IVA (con o senza prefisso IT)
 * @returns {Promise<string|null>} Codice destinatario o null
 */
export async function getCodiceDestinatario(vatCode) {
  if (!vatCode) return null;
  
  const companyData = await getCompanyData(vatCode);
  
  return companyData?.sdiCode || companyData?.codiceDestinatario || null;
}

/**
 * Recupera solo PEC da P.IVA
 * @param {string} vatCode - P.IVA (con o senza prefisso IT)
 * @returns {Promise<string|null>} PEC o null
 */
export async function getPEC(vatCode) {
  if (!vatCode) return null;
  
  const companyData = await getCompanyData(vatCode);
  
  return companyData?.pec || null;
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
  
  // Debug: verifica dati disponibili
  console.log('[OpenAPI Company] autoFillFromPIVA - companyData:', {
    denomination: companyData.denomination,
    name: companyData.name,
    taxCode: companyData.taxCode,
    street: companyData.street,
    codiceDestinatario: companyData.codiceDestinatario,
    pec: companyData.pec
  });
  
  return {
    // Dati cliente
    name: companyData.denomination || companyData.name || '',
    denomination: companyData.denomination || companyData.name || '', // Aggiunto per il modal
    taxCode: companyData.taxCode || '',
    vat: companyData.vat || vatCode,
    
    // Indirizzo
    street: companyData.street || companyData.address?.street || '',
    zip: companyData.zip || companyData.address?.zip || '',
    city: companyData.city || companyData.address?.city || '',
    province: companyData.province || companyData.address?.province || '',
    
    // SDI
    codiceDestinatario: companyData.sdiCode || companyData.codiceDestinatario || '',
    pec: companyData.pec || '',
    
    // Stato (per warning)
    status: companyData.status || null,
    active: companyData.active !== false
  };
}
