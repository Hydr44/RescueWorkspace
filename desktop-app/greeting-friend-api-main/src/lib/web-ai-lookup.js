/**
 * Web + AI Lookup Service v3
 * 
 * Chiama endpoint VPS per scraping server-side (no CORS).
 * Fallback: Electron IPC se disponibile.
 * Fonti: Google, eBay IT, AutoDoc
 */

import { logger } from './logger';

const OEM_LOOKUP_URL = 'https://rentri-test.rescuemanager.eu/api/oem-lookup';

/**
 * Cerca info su un codice OEM.
 * 1) Endpoint VPS (sempre disponibile, no CORS)
 * 2) Electron IPC fallback
 * Ritorna ARRAY di candidati con scoring.
 */
export async function searchWebWithAI(oemCode) {
  try {
    logger.info(`[Web AI] Ricerca OEM: ${oemCode}`);

    // 1. Prova endpoint VPS
    try {
      logger.info('[Web AI] Chiamo endpoint VPS...');
      const resp = await fetch(`${OEM_LOOKUP_URL}?code=${encodeURIComponent(oemCode)}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data?.candidates?.length > 0) {
          logger.info(`[Web AI] VPS: ${data.candidates.length} candidati in ${data.elapsed_ms}ms`);
          return data.candidates;
        }
        logger.warn('[Web AI] VPS: nessun candidato');
      } else {
        logger.warn(`[Web AI] VPS: HTTP ${resp.status}`);
      }
    } catch (vpsErr) {
      logger.warn(`[Web AI] VPS non raggiungibile: ${vpsErr.message}`);
    }

    // 2. Fallback: Electron IPC
    if (window.api?.spareParts?.oemLookup) {
      logger.info('[Web AI] Fallback: Electron IPC');
      const result = await window.api.spareParts.oemLookup(oemCode);
      if (result?.candidates?.length > 0) {
        logger.info(`[Web AI] IPC: ${result.candidates.length} candidati`);
        return result.candidates;
      }
    }

    logger.warn('[Web AI] Nessun risultato da nessuna fonte');
    return [];

  } catch (error) {
    logger.error('[Web AI] Errore:', error);
    return [];
  }
}
