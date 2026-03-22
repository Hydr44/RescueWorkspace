// src/lib/rentri-api.js
/**
 * Client API per integrazione RENTRI
 * Gateway: rentri-test.rescuemanager.eu/api/rentri (VPS)
 */
import { supabaseBrowser } from './supabase-browser';

const RENTRI_BASE_URL = import.meta.env.VITE_RENTRI_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri';
const DEFAULT_TIMEOUT = 30000;

/**
 * Legge l'ambiente RENTRI corrente da org_settings
 * @param {string} orgId
 * @returns {Promise<'demo'|'prod'>}
 */
export async function getRentriEnvironment(orgId) {
  if (!orgId) return 'demo';
  try {
    const supabase = supabaseBrowser();
    const { data } = await supabase
      .from('org_settings')
      .select('rentri_environment')
      .eq('org_id', orgId)
      .not('rentri_environment', 'is', null)
      .limit(1)
      .maybeSingle();
    return data?.rentri_environment || 'demo';
  } catch {
    return 'demo';
  }
}

class RentriError extends Error {
  constructor(message, response, data) {
    super(message);
    this.name = 'RentriError';
    this.response = response;
    this.data = data;
  }
}

/**
 * Wrapper fetch con gestione errori e timeout
 */
async function rentriFetch(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT);

  try {
    const url = `${RENTRI_BASE_URL}${path}`;
    console.log(`[RENTRI] ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new RentriError(
        errorData.message || `HTTP ${response.status}`,
        response,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new RentriError('Timeout: richiesta RENTRI troppo lenta', null, null);
    }
    
    throw error;
  }
}

// ==========================================
// REGISTRI
// ==========================================

/**
 * Fetch lista registri
 */
export async function fetchRegistri(filters = {}) {
  const params = new URLSearchParams();
  if (filters.anno) params.set('anno', filters.anno);
  if (filters.stato) params.set('stato', filters.stato);
  if (filters.tipo) params.set('tipo', filters.tipo);

  const query = params.toString() ? `?${params.toString()}` : '';
  return await rentriFetch(`/registri${query}`);
}

/**
 * Fetch dettaglio registro
 */
export async function fetchRegistro(id) {
  return await rentriFetch(`/registri/${id}`);
}

/**
 * Crea nuovo registro
 */
export async function createRegistro(data) {
  return await rentriFetch('/registri', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Aggiorna registro esistente
 */
export async function updateRegistro(id, data) {
  return await rentriFetch(`/registri/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Elimina registro
 */
export async function deleteRegistro(id) {
  return await rentriFetch(`/registri/${id}`, {
    method: 'DELETE',
  });
}

// ==========================================
// MOVIMENTI
// ==========================================

/**
 * Fetch movimenti di un registro
 */
export async function fetchMovimenti(registroId, filters = {}) {
  const params = new URLSearchParams();
  if (filters.dataFrom) params.set('data_from', filters.dataFrom);
  if (filters.dataTo) params.set('data_to', filters.dataTo);
  if (filters.tipoOperazione) params.set('tipo', filters.tipoOperazione);
  if (filters.codiceEER) params.set('codice_eer', filters.codiceEER);

  const query = params.toString() ? `?${params.toString()}` : '';
  return await rentriFetch(`/registri/${registroId}/movimenti${query}`);
}

/**
 * Crea movimento
 */
export async function createMovimento(registroId, data) {
  return await rentriFetch(`/registri/${registroId}/movimenti`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Aggiorna movimento
 */
export async function updateMovimento(registroId, movimentoId, data) {
  return await rentriFetch(`/registri/${registroId}/movimenti/${movimentoId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Elimina movimento
 */
export async function deleteMovimento(registroId, movimentoId) {
  return await rentriFetch(`/registri/${registroId}/movimenti/${movimentoId}`, {
    method: 'DELETE',
  });
}

/**
 * Trasmetti movimenti a RENTRI
 */
export async function trasmettiMovimenti(registroId, movimentiIds) {
  return await rentriFetch(`/registri/${registroId}/movimenti/trasmetti`, {
    method: 'POST',
    body: JSON.stringify({ movimenti_ids: movimentiIds }),
  });
}

// ==========================================
// FORMULARI (FIR)
// ==========================================

/**
 * Fetch lista formulari
 */
export async function fetchFormulari(filters = {}) {
  const params = new URLSearchParams();
  if (filters.anno) params.set('anno', filters.anno);
  if (filters.stato) params.set('stato', filters.stato);
  if (filters.dataFrom) params.set('data_from', filters.dataFrom);
  if (filters.dataTo) params.set('data_to', filters.dataTo);

  const query = params.toString() ? `?${params.toString()}` : '';
  return await rentriFetch(`/formulari${query}`);
}

/**
 * Fetch dettaglio formulario
 */
export async function fetchFormulario(id) {
  return await rentriFetch(`/formulari/${id}`);
}

/**
 * Crea nuovo formulario
 */
export async function createFormulario(data) {
  return await rentriFetch('/formulari', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Aggiorna formulario
 */
export async function updateFormulario(id, data) {
  return await rentriFetch(`/formulari/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Trasmetti formulario a RENTRI
 */
export async function trasmettiFormulario(id) {
  return await rentriFetch(`/formulari/${id}/trasmetti`, {
    method: 'POST',
  });
}

/**
 * Download PDF formulario
 */
export async function downloadFormularioPDF(id) {
  return await rentriFetch(`/formulari/${id}/pdf`);
}

// ==========================================
// VIDIMAZIONE FIR
// ==========================================

/**
 * Fetch blocchi FIR disponibili per vidimazione
 * @param {string} identificativo - Codice fiscale del soggetto
 * @param {object} filters - Filtri opzionali (codice_blocco, num_iscr_sito)
 */
export async function fetchBlocciFIR(identificativo, filters = {}) {
  const params = new URLSearchParams({ identificativo });
  if (filters.codice_blocco) params.set('codice_blocco', filters.codice_blocco);
  if (filters.num_iscr_sito) params.set('num_iscr_sito', filters.num_iscr_sito);

  return await rentriFetch(`/vidimazione-formulari?${params.toString()}`);
}

/**
 * Vidima un nuovo FIR in un blocco
 * @param {string} codiceBlocco - Codice del blocco in cui vidimare
 * @returns {Promise<{transazione_id: string}>} ID transazione asincrona
 */
export async function vidimaFIR(codiceBlocco) {
  return await rentriFetch(`/vidimazione-formulari/${codiceBlocco}`, {
    method: 'POST',
    timeout: 60000, // 60 secondi per operazioni asincrone
  });
}

/**
 * Verifica stato transazione vidimazione
 * @param {string} transazioneId - GUID della transazione
 */
export async function checkTransazioneStatus(transazioneId) {
  return await rentriFetch(`/vidimazione-formulari/${transazioneId}/status`);
}

/**
 * Recupera esito transazione vidimazione
 * @param {string} transazioneId - GUID della transazione
 */
export async function getTransazioneResult(transazioneId) {
  return await rentriFetch(`/vidimazione-formulari/verifica/result?transazione_id=${transazioneId}`);
}

/**
 * Fetch lista FIR vidimati in un blocco
 * @param {string} codiceBlocco - Codice del blocco
 * @param {object} filters - Filtri opzionali (progressivo_iniziale, progressivo_finale)
 */
export async function fetchFIRVidimati(codiceBlocco, filters = {}) {
  const params = new URLSearchParams();
  if (filters.progressivo_iniziale) params.set('progressivo_iniziale', filters.progressivo_iniziale);
  if (filters.progressivo_finale) params.set('progressivo_finale', filters.progressivo_finale);

  const query = params.toString() ? `?${params.toString()}` : '';
  return await rentriFetch(`/vidimazione-formulari/${codiceBlocco}${query}`);
}

/**
 * Fetch singolo FIR vidimato
 * @param {string} codiceBlocco - Codice del blocco
 * @param {number} progressivo - Numero progressivo del FIR
 */
export async function fetchFIRVidimato(codiceBlocco, progressivo) {
  return await rentriFetch(`/vidimazione-formulari/${codiceBlocco}/${progressivo}`);
}

/**
 * Download PDF di un FIR vidimato
 * @param {string} codiceBlocco - Codice del blocco
 * @param {number} progressivo - Numero progressivo del FIR
 */
export async function downloadFIRPDF(codiceBlocco, progressivo) {
  return await rentriFetch(`/vidimazione-formulari/${codiceBlocco}/${progressivo}/pdf`);
}

/**
 * Verifica esistenza numero FIR
 * @param {string} numeroFir - Numero FIR da verificare (formato: "XX XXXX XX")
 */
export async function verificaNumeroFIR(numeroFir) {
  return await rentriFetch(`/vidimazione-formulari/verifica/${encodeURIComponent(numeroFir)}`);
}

/**
 * Recupera certificato di vidimazione per verifica firma QR code
 * @param {string} certificatoId - ID del certificato
 */
export async function fetchCertificatoVidimazione(certificatoId) {
  return await rentriFetch(`/vidimazione-formulari/certificati/${certificatoId}`);
}

// ==========================================
// CODIFICHE
// ==========================================

/**
 * Lookup codifiche RENTRI
 */
export async function fetchCodifiche(tabella, params = {}) {
  const searchParams = new URLSearchParams(params);
  return await rentriFetch(`/codifiche/${tabella}?${searchParams.toString()}`);
}

/**
 * Fetch codici EER (Elenco Europeo Rifiuti)
 */
export async function fetchCodiciEER(searchTerm = '') {
  return await fetchCodifiche('CodiciEER', { search: searchTerm });
}

/**
 * Fetch unità di misura
 */
export async function fetchUnitaMisura() {
  return await fetchCodifiche('UnitaMisura');
}

/**
 * Fetch operazioni ammesse
 */
export async function fetchOperazioniAmmesse() {
  return await fetchCodifiche('OperazioniAmmesse');
}

// ==========================================
// STATUS & DIAGNOSTICA
// ==========================================

/**
 * Check status servizio RENTRI
 */
export async function checkRentriStatus(service = 'anagrafiche') {
  return await rentriFetch(`/status?service=${service}`);
}

/**
 * Test connessione completa
 */
export async function testConnessione() {
  const services = ['anagrafiche', 'codifiche', 'dati-registri', 'formulari'];
  const results = {};

  for (const service of services) {
    try {
      const status = await checkRentriStatus(service);
      results[service] = { ok: true, status };
    } catch (error) {
      results[service] = { ok: false, error: error.message };
    }
  }

  return results;
}

// ==========================================
// EXPORT
// ==========================================

export default {
  // Registri
  fetchRegistri,
  fetchRegistro,
  createRegistro,
  updateRegistro,
  deleteRegistro,
  
  // Movimenti
  fetchMovimenti,
  createMovimento,
  updateMovimento,
  deleteMovimento,
  trasmettiMovimenti,
  
  // Formulari
  fetchFormulari,
  fetchFormulario,
  createFormulario,
  updateFormulario,
  trasmettiFormulario,
  downloadFormularioPDF,
  
  // Vidimazione FIR
  fetchBlocciFIR,
  vidimaFIR,
  checkTransazioneStatus,
  getTransazioneResult,
  fetchFIRVidimati,
  fetchFIRVidimato,
  downloadFIRPDF,
  verificaNumeroFIR,
  fetchCertificatoVidimazione,
  
  // Codifiche
  fetchCodifiche,
  fetchCodiciEER,
  fetchUnitaMisura,
  fetchOperazioniAmmesse,
  
  // Status
  checkRentriStatus,
  testConnessione,
};

