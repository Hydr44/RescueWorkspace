// src/lib/rentri-xfir.js
/**
 * Client API per xFIR digitali RENTRI
 * Endpoint: rentri-test.rescuemanager.eu/api/rentri (VPS)
 */

const RENTRI_BASE_URL = import.meta.env.VITE_RENTRI_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri';
const TIMEOUT = 30000;

class XFirError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'XFirError';
    this.status = status;
    this.details = details;
  }
}

async function xfirFetch(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const url = `${RENTRI_BASE_URL}${path}`;
    console.log(`[XFIR] ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new XFirError(errData.error || `HTTP ${response.status}`, response.status, errData.details);
    }

    // Per PDF/binary, restituiamo il blob
    const ct = response.headers.get('content-type') || '';
    if (ct.includes('application/pdf') || ct.includes('application/octet-stream')) {
      return { blob: await response.blob(), contentType: ct };
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') throw new XFirError('Timeout richiesta RENTRI', 408, null);
    throw error;
  }
}

// ═══════════════════════════════════════════
// FIR DIGITALI - Ciclo di vita
// ═══════════════════════════════════════════

/** Elenco FIR digitali da RENTRI */
export async function fetchXFirElenco({ orgId, numIscrSito, identificativoSoggetto, environment, page, pageSize, stati, codiceEer, dataCreazioneDa, dataCreazioneA }) {
  const params = new URLSearchParams();
  params.set('org_id', orgId);
  if (numIscrSito) params.set('num_iscr_sito', numIscrSito);
  if (identificativoSoggetto) params.set('identificativo_soggetto', identificativoSoggetto);
  if (environment) params.set('environment', environment);
  if (page) params.set('page', page);
  if (pageSize) params.set('page_size', pageSize);
  if (stati) params.set('stati', stati);
  if (codiceEer) params.set('codice_eer', codiceEer);
  if (dataCreazioneDa) params.set('data_creazione_da', dataCreazioneDa);
  if (dataCreazioneA) params.set('data_creazione_a', dataCreazioneA);
  return xfirFetch(`/fir/elenco?${params.toString()}`);
}

/** Dettaglio FIR digitale */
export async function fetchXFirDettaglio({ orgId, numeroFir, environment }) {
  const params = new URLSearchParams({ org_id: orgId, numero_fir: numeroFir });
  if (environment) params.set('environment', environment);
  return xfirFetch(`/fir/dettaglio?${params.toString()}`);
}

/** Azioni disponibili su un FIR */
export async function fetchXFirAzioni({ orgId, numeroFir, identificativoSoggetto, numIscrSito, environment }) {
  const params = new URLSearchParams({ org_id: orgId, numero_fir: numeroFir, identificativo_soggetto: identificativoSoggetto });
  if (numIscrSito) params.set('num_iscr_sito', numIscrSito);
  if (environment) params.set('environment', environment);
  return xfirFetch(`/fir/azioni?${params.toString()}`);
}

/** Modifica FIR (prima della firma) */
export async function modificaXFir({ orgId, numeroFir, datiFir, environment }) {
  return xfirFetch('/fir/modifica', {
    method: 'PUT',
    body: JSON.stringify({ org_id: orgId, numero_fir: numeroFir, dati_fir: datiFir, environment }),
  });
}

/** Aggiorna quantità rifiuto */
export async function aggiornaQuantita({ orgId, numeroFir, quantita, environment }) {
  return xfirFetch('/fir/quantita', {
    method: 'POST',
    body: JSON.stringify({ org_id: orgId, numero_fir: numeroFir, quantita, environment }),
  });
}

/** Aggiorna dati trasporto iniziale */
export async function aggiornaTrasporto({ orgId, numeroFir, datiTrasporto, environment }) {
  return xfirFetch('/fir/trasporto', {
    method: 'POST',
    body: JSON.stringify({ org_id: orgId, numero_fir: numeroFir, dati_trasporto: datiTrasporto, environment }),
  });
}

/** Rollback ultima firma */
export async function rollbackFirma({ orgId, numeroFir, environment }) {
  return xfirFetch('/fir/rollback-firma', {
    method: 'POST',
    body: JSON.stringify({ org_id: orgId, numero_fir: numeroFir, environment }),
  });
}

/** Acquisizione visibilità FIR per unità locale */
export async function acquisisciVisibilita({ orgId, numeroFir, numIscrSito, environment }) {
  return xfirFetch('/fir/acquisizione-visibilita', {
    method: 'POST',
    body: JSON.stringify({ org_id: orgId, numero_fir: numeroFir, num_iscr_sito: numIscrSito, environment }),
  });
}

/** Rilascio visibilità FIR */
export async function rilasciaVisibilita({ orgId, numeroFir, numIscrSito, environment }) {
  return xfirFetch('/fir/rilascio-visibilita', {
    method: 'POST',
    body: JSON.stringify({ org_id: orgId, numero_fir: numeroFir, num_iscr_sito: numIscrSito, environment }),
  });
}

/** Trasbordo parziale */
export async function trasbordoParziale({ orgId, numeroFir, datiTrasbordo, environment }) {
  return xfirFetch('/fir/trasbordo-parziale', {
    method: 'POST',
    body: JSON.stringify({ org_id: orgId, numero_fir: numeroFir, dati_trasbordo: datiTrasbordo, environment }),
  });
}

/** Trasbordo totale */
export async function trasbordoTotale({ orgId, numeroFir, datiTrasbordo, environment }) {
  return xfirFetch('/fir/trasbordo-totale', {
    method: 'POST',
    body: JSON.stringify({ org_id: orgId, numero_fir: numeroFir, dati_trasbordo: datiTrasbordo, environment }),
  });
}

/** Note annullamento */
export async function noteAnnullamento({ orgId, numeroFir, note, environment }) {
  return xfirFetch('/fir/note-annullamento', {
    method: 'POST',
    body: JSON.stringify({ org_id: orgId, numero_fir: numeroFir, note, environment }),
  });
}

/** Crea FIR digitale (vidimazione + dati in un passaggio) */
export async function creaXFir({ orgId, codiceBlocco, datiFir, environment }) {
  return xfirFetch('/fir/crea', {
    method: 'POST',
    body: JSON.stringify({ org_id: orgId, codice_blocco: codiceBlocco, dati_fir: datiFir, environment }),
  });
}

/** Calcolo hash per firma FIR */
export async function calcolaHashFir({ orgId, numeroFir, environment }) {
  return xfirFetch('/fir/hash', {
    method: 'POST',
    body: JSON.stringify({ org_id: orgId, numero_fir: numeroFir, environment }),
  });
}

/** Acquisizione firma (invio firma calcolata) */
export async function acquisizioneFirma({ orgId, numeroFir, firma, environment }) {
  return xfirFetch('/fir/acquisizione-firma', {
    method: 'POST',
    body: JSON.stringify({ org_id: orgId, numero_fir: numeroFir, firma, environment }),
  });
}

/** Annulla FIR */
export async function annullaFir({ orgId, numeroFir, note, environment }) {
  return xfirFetch('/fir/annulla', {
    method: 'POST',
    body: JSON.stringify({ org_id: orgId, numero_fir: numeroFir, note, environment }),
  });
}

// ═══════════════════════════════════════════
// xFIR File (ASiC-E container)
// ═══════════════════════════════════════════

/** Download file xFIR */
export async function downloadXFir({ orgId, numeroFir, environment }) {
  const params = new URLSearchParams({ org_id: orgId, numero_fir: numeroFir });
  if (environment) params.set('environment', environment);
  return xfirFetch(`/fir/xfir?${params.toString()}`);
}

/** Upload file xFIR */
export async function uploadXFir({ orgId, numeroFir, xfirBase64, numIscrSito, environment }) {
  return xfirFetch('/fir/xfir-upload', {
    method: 'POST',
    body: JSON.stringify({ org_id: orgId, numero_fir: numeroFir, xfir_base64: xfirBase64, num_iscr_sito: numIscrSito, environment }),
  });
}

/** Validazione file xFIR */
export async function validaXFir({ orgId, xfirBase64, environment }) {
  return xfirFetch('/fir/xfir-valida', {
    method: 'POST',
    body: JSON.stringify({ org_id: orgId, xfir_base64: xfirBase64, environment }),
  });
}

// ═══════════════════════════════════════════
// VIDIMAZIONE FIR
// ═══════════════════════════════════════════

/** Elenco blocchi FIR */
export async function fetchBlocchiFir({ orgId, identificativo, numIscrSito, codiceBlocco, ancheDisattivi, environment, page, pageSize }) {
  const params = new URLSearchParams({ org_id: orgId, identificativo });
  if (numIscrSito) params.set('num_iscr_sito', numIscrSito);
  if (codiceBlocco) params.set('codice_blocco', codiceBlocco);
  if (ancheDisattivi) params.set('anche_disattivi', 'true');
  if (environment) params.set('environment', environment);
  if (page) params.set('page', page);
  if (pageSize) params.set('page_size', pageSize);
  return xfirFetch(`/vidimazione/blocchi?${params.toString()}`);
}

/** Vidimazione nuovo FIR */
export async function vidimaFir({ orgId, codiceBlocco, environment }) {
  return xfirFetch('/vidimazione/vidima', {
    method: 'POST',
    body: JSON.stringify({ org_id: orgId, codice_blocco: codiceBlocco, environment }),
  });
}

/** Elenco FIR vidimati per blocco */
export async function fetchFirVidimati({ orgId, codiceBlocco, progressivoIniziale, progressivoFinale, environment, page, pageSize }) {
  const params = new URLSearchParams({ org_id: orgId, codice_blocco: codiceBlocco });
  if (progressivoIniziale) params.set('progressivo_iniziale', progressivoIniziale);
  if (progressivoFinale) params.set('progressivo_finale', progressivoFinale);
  if (environment) params.set('environment', environment);
  if (page) params.set('page', page);
  if (pageSize) params.set('page_size', pageSize);
  return xfirFetch(`/vidimazione/fir-vidimati?${params.toString()}`);
}

/** Dettaglio FIR vidimato */
export async function fetchDettaglioVidimazione({ orgId, codiceBlocco, progressivo, environment }) {
  const params = new URLSearchParams({ org_id: orgId, codice_blocco: codiceBlocco, progressivo });
  if (environment) params.set('environment', environment);
  return xfirFetch(`/vidimazione/dettaglio?${params.toString()}`);
}

/** PDF FIR vidimato */
export async function fetchPdfVidimazione({ orgId, codiceBlocco, progressivo, environment }) {
  const params = new URLSearchParams({ org_id: orgId, codice_blocco: codiceBlocco, progressivo });
  if (environment) params.set('environment', environment);
  return xfirFetch(`/vidimazione/pdf?${params.toString()}`);
}

/** Verifica esistenza numero FIR */
export async function verificaFir({ orgId, numeroFir, environment }) {
  const params = new URLSearchParams({ org_id: orgId, numero_fir: numeroFir });
  if (environment) params.set('environment', environment);
  return xfirFetch(`/vidimazione/verifica?${params.toString()}`);
}

/** Certificato vidimazione (per QR code) */
export async function fetchCertificatoVidimazione({ orgId, certificatoId, environment }) {
  const params = new URLSearchParams({ org_id: orgId, certificato_id: certificatoId });
  if (environment) params.set('environment', environment);
  return xfirFetch(`/vidimazione/certificato?${params.toString()}`);
}

// ═══════════════════════════════════════════
// COPIA CARTACEA FIR
// ═══════════════════════════════════════════

/** Upload copia cartacea FIR */
export async function uploadCopiaCartacea({ orgId, numIscrSito, fileBase64, nomeFile, mime, numeroFir, dataEmissione, note, produttore, environment }) {
  return xfirFetch('/copia-cartacea/upload', {
    method: 'POST',
    body: JSON.stringify({
      org_id: orgId, num_iscr_sito: numIscrSito, file_base64: fileBase64, nome_file: nomeFile,
      mime: mime || 'application/pdf', numero_fir: numeroFir, data_emissione: dataEmissione, note, produttore, environment
    }),
  });
}

/** Elenco copie cartacee caricate */
export async function fetchCopieCartacee({ orgId, numIscrSito, environment }) {
  const params = new URLSearchParams({ org_id: orgId, num_iscr_sito: numIscrSito });
  if (environment) params.set('environment', environment);
  return xfirFetch(`/copia-cartacea/elenco?${params.toString()}`);
}

/** Copie cartacee rese disponibili dal trasportatore */
export async function fetchCopieCartaceeDisponibili({ orgId, identificativoSoggetto, numeroFir, confermate, numIscrSito, environment }) {
  const params = new URLSearchParams({ org_id: orgId, identificativo_soggetto: identificativoSoggetto });
  if (numeroFir) params.set('numero_fir', numeroFir);
  if (confermate !== undefined) params.set('confermate', confermate);
  if (numIscrSito) params.set('num_iscr_sito', numIscrSito);
  if (environment) params.set('environment', environment);
  return xfirFetch(`/copia-cartacea/disponibili?${params.toString()}`);
}

/** Conferma presa visione copia cartacea */
export async function confermaCopiaCartacea({ orgId, identificativoSoggetto, identificativo, numIscrSito, ruolo, environment }) {
  return xfirFetch('/copia-cartacea/conferma', {
    method: 'PUT',
    body: JSON.stringify({ org_id: orgId, identificativo_soggetto: identificativoSoggetto, identificativo, num_iscr_sito: numIscrSito, ruolo, environment }),
  });
}

// ═══════════════════════════════════════════
// COPIA DIGITALE FIR
// ═══════════════════════════════════════════

/** Upload copia digitale (restituzione dal destinatario) */
export async function uploadCopiaDigitale({ orgId, numeroFir, xfirBase64, numIscrSito, note, environment }) {
  return xfirFetch('/copia-digitale/upload', {
    method: 'POST',
    body: JSON.stringify({ org_id: orgId, numero_fir: numeroFir, xfir_base64: xfirBase64, num_iscr_sito: numIscrSito, note, environment }),
  });
}

/** Elenco copie digitali caricate */
export async function fetchCopieDigitali({ orgId, numIscrSito, environment }) {
  const params = new URLSearchParams({ org_id: orgId, num_iscr_sito: numIscrSito });
  if (environment) params.set('environment', environment);
  return xfirFetch(`/copia-digitale/elenco?${params.toString()}`);
}

/** Copie digitali rese disponibili */
export async function fetchCopieDigitaliDisponibili({ orgId, identificativoSoggetto, environment }) {
  const params = new URLSearchParams({ org_id: orgId, identificativo_soggetto: identificativoSoggetto });
  if (environment) params.set('environment', environment);
  return xfirFetch(`/copia-digitale/disponibili?${params.toString()}`);
}

/** Conferma presa visione copia digitale */
export async function confermaCopiaDigitale({ orgId, identificativoSoggetto, identificativo, numIscrSito, ruolo, environment }) {
  return xfirFetch('/copia-digitale/conferma', {
    method: 'PUT',
    body: JSON.stringify({ org_id: orgId, identificativo_soggetto: identificativoSoggetto, identificativo, num_iscr_sito: numIscrSito, ruolo, environment }),
  });
}

// ═══════════════════════════════════════════
// STATI xFIR (costanti)
// ═══════════════════════════════════════════

export const STATI_XFIR = {
  InserimentoQuantita: { label: 'Inserimento Quantità', color: 'amber', icon: 'FiEdit' },
  InserimentoQuantitaTrasportoIniziale: { label: 'Ins. Quantità + Trasporto', color: 'amber', icon: 'FiEdit' },
  InserimentoTrasportoIniziale: { label: 'Ins. Trasporto Iniziale', color: 'amber', icon: 'FiTruck' },
  FirmaProduttoreTrasportatoreIniziale: { label: 'Firma Produttore + Trasportatore', color: 'blue', icon: 'FiPenTool' },
  FirmaTrasportatoreIniziale: { label: 'Firma Trasportatore Iniziale', color: 'blue', icon: 'FiPenTool' },
  FirmaProduttore: { label: 'Firma Produttore', color: 'blue', icon: 'FiPenTool' },
  InserimentoTrasportoSuccessivo: { label: 'Ins. Trasporto Successivo', color: 'amber', icon: 'FiTruck' },
  FirmaTrasportatoreSuccessivo: { label: 'Firma Trasportatore Successivo', color: 'blue', icon: 'FiPenTool' },
  FirmaAnnotazione: { label: 'Firma Annotazione', color: 'blue', icon: 'FiPenTool' },
  FirmaTrasbordoParziale: { label: 'Firma Trasbordo Parziale', color: 'blue', icon: 'FiPenTool' },
  FirmaTrasbordoTotale: { label: 'Firma Trasbordo Totale', color: 'blue', icon: 'FiPenTool' },
  FirmaSostaTecnica: { label: 'Firma Sosta Tecnica', color: 'blue', icon: 'FiPenTool' },
  InserimentoAccettazione: { label: 'In Attesa Accettazione', color: 'purple', icon: 'FiCheckCircle' },
  FirmaAccettazione: { label: 'Firma Accettazione', color: 'blue', icon: 'FiPenTool' },
  Accettato: { label: 'Accettato', color: 'emerald', icon: 'FiCheckCircle' },
  RespintoAccettatoParzialmente: { label: 'Respinto/Parziale', color: 'red', icon: 'FiXCircle' },
  FirmaDestinatarioSuccessivo: { label: 'Firma Destinatario Successivo', color: 'blue', icon: 'FiPenTool' },
  FirmaAccettazioneSuccessiva: { label: 'Firma Accettazione Successiva', color: 'blue', icon: 'FiPenTool' },
  FirmaAnnullamento: { label: 'Firma Annullamento', color: 'red', icon: 'FiXCircle' },
  Annullato: { label: 'Annullato', color: 'slate', icon: 'FiXCircle' },
};

export function getStatoXFir(stato) {
  return STATI_XFIR[stato] || { label: stato || 'Sconosciuto', color: 'slate', icon: 'FiHelpCircle' };
}

// ═══════════════════════════════════════════
// FIRMA DIGITALE REMOTA
// ═══════════════════════════════════════════

/** Firma completa FIR (hash + firma + invio in un passaggio sul VPS) */
export async function firmaCompletaFir({ orgId, numeroFir, environment }) {
  return xfirFetch('/firma/firma-completa', {
    method: 'POST',
    body: JSON.stringify({ org_id: orgId, numero_fir: numeroFir, environment }),
  });
}

/** Solo hash FIR (senza firmare) */
export async function richiestaHashFir({ orgId, numeroFir, environment }) {
  return xfirFetch('/firma/hash', {
    method: 'POST',
    body: JSON.stringify({ org_id: orgId, numero_fir: numeroFir, environment }),
  });
}

/** Verifica se i certificati firma remota sono configurati */
export async function verificaCertificatiFirma({ orgId, environment }) {
  const params = new URLSearchParams({ org_id: orgId });
  if (environment) params.set('environment', environment);
  return xfirFetch(`/firma/verifica?${params.toString()}`);
}

// ═══════════════════════════════════════════
// NOTIFICHE PUSH RENTRI
// ═══════════════════════════════════════════

/** Lista notifiche per organizzazione */
export async function fetchNotifiche({ orgId, stato, limit }) {
  const params = new URLSearchParams({ org_id: orgId });
  if (stato) params.set('stato', stato);
  if (limit) params.set('limit', String(limit));
  return xfirFetch(`/notifiche/lista?${params.toString()}`);
}

/** Segna notifica come elaborata */
export async function elaboraNotifica({ orgId, notificaId }) {
  return xfirFetch('/notifiche/elabora', {
    method: 'POST',
    body: JSON.stringify({ org_id: orgId, notifica_id: notificaId }),
  });
}
