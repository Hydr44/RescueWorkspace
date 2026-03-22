/**
 * Sistema di numerazione documenti RVFU
 * Basato sulle specifiche ACI/MIT per certificati e ricevute
 */

import { RVFU_CONSTANTS } from '../lib/rvfu-enums';

// ============================================================================
// TYPES
// ============================================================================

export interface NumerazioneDocumento {
  numero: string;
  tipo: 'CERTIFICATO' | 'RICEVUTA';
  dataGenerazione: string;
  centroRaccolta: string;
  sequenziale: number;
}

export interface ParametriNumerazione {
  centroRaccolta: string;
  dataGenerazione: string;
  tipoDocumento: 'CERTIFICATO' | 'RICEVUTA';
  sequenziale?: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Formatta una data nel formato YYYYMMDD
 */
export function formatDateForNumerazione(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Genera il codice centro di raccolta per la numerazione
 */
export function generateCentroRaccoltaCode(centroRaccolta: string): string {
  // Rimuove spazi e caratteri speciali, converte in maiuscolo
  return centroRaccolta
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .substring(0, 8)
    .padEnd(8, '0');
}

/**
 * Genera il codice sequenziale per la numerazione
 */
export function generateSequenzialeCode(sequenziale: number): string {
  return String(sequenziale).padStart(5, '0');
}

/**
 * Genera il codice anno per la numerazione
 */
export function generateAnnoCode(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return String(d.getFullYear()).substring(2); // Ultimi 2 cifre dell'anno
}

// ============================================================================
// NUMERAZIONE CERTIFICATI
// ============================================================================

/**
 * Genera numerazione per Certificato di Rottamazione
 * Formato: YYYYMMDD-CD-PPPPPPPP-AAAAA
 * 
 * YYYYMMDD = Data di generazione
 * CD = Codice tipo documento (Certificato Digitale)
 * PPPPPPPP = Codice centro di raccolta (8 caratteri)
 * AAAAA = Codice sequenziale (5 cifre)
 */
export function generaNumerazioneCertificato(params: ParametriNumerazione): NumerazioneDocumento {
  const {
    centroRaccolta,
    dataGenerazione,
    sequenziale = 1
  } = params;

  const dataFormatted = formatDateForNumerazione(dataGenerazione);
  const centroCode = generateCentroRaccoltaCode(centroRaccolta);
  const sequenzialeCode = generateSequenzialeCode(sequenziale);

  const numero = `${dataFormatted}-${RVFU_CONSTANTS.CERTIFICATO_PREFIX}-${centroCode}-${sequenzialeCode}`;

  return {
    numero,
    tipo: 'CERTIFICATO',
    dataGenerazione: dataFormatted,
    centroRaccolta: centroCode,
    sequenziale
  };
}

/**
 * Genera numerazione per Certificato Cartaceo
 * Formato: YYYYMMDD-CC-PPPPPPPP-AAAAA
 * 
 * CC = Codice tipo documento (Certificato Cartaceo)
 */
export function generaNumerazioneCertificatoCartaceo(params: ParametriNumerazione): NumerazioneDocumento {
  const {
    centroRaccolta,
    dataGenerazione,
    sequenziale = 1
  } = params;

  const dataFormatted = formatDateForNumerazione(dataGenerazione);
  const centroCode = generateCentroRaccoltaCode(centroRaccolta);
  const sequenzialeCode = generateSequenzialeCode(sequenziale);

  const numero = `${dataFormatted}-CC-${centroCode}-${sequenzialeCode}`;

  return {
    numero,
    tipo: 'CERTIFICATO',
    dataGenerazione: dataFormatted,
    centroRaccolta: centroCode,
    sequenziale
  };
}

// ============================================================================
// NUMERAZIONE RICEVUTE
// ============================================================================

/**
 * Genera numerazione per Ricevuta di Presa in Carico
 * Formato: YYYYMMDD-RD-PPPPPPPP-AAAAA
 * 
 * YYYYMMDD = Data di generazione
 * RD = Codice tipo documento (Ricevuta Digitale)
 * PPPPPPPP = Codice centro di raccolta (8 caratteri)
 * AAAAA = Codice sequenziale (5 cifre)
 */
export function generaNumerazioneRicevuta(params: ParametriNumerazione): NumerazioneDocumento {
  const {
    centroRaccolta,
    dataGenerazione,
    sequenziale = 1
  } = params;

  const dataFormatted = formatDateForNumerazione(dataGenerazione);
  const centroCode = generateCentroRaccoltaCode(centroRaccolta);
  const sequenzialeCode = generateSequenzialeCode(sequenziale);

  const numero = `${dataFormatted}-${RVFU_CONSTANTS.RICEVUTA_PREFIX}-${centroCode}-${sequenzialeCode}`;

  return {
    numero,
    tipo: 'RICEVUTA',
    dataGenerazione: dataFormatted,
    centroRaccolta: centroCode,
    sequenziale
  };
}

/**
 * Genera numerazione per Ricevuta Cartacea
 * Formato: YYYYMMDD-RC-PPPPPPPP-AAAAA
 * 
 * RC = Codice tipo documento (Ricevuta Cartacea)
 */
export function generaNumerazioneRicevutaCartacea(params: ParametriNumerazione): NumerazioneDocumento {
  const {
    centroRaccolta,
    dataGenerazione,
    sequenziale = 1
  } = params;

  const dataFormatted = formatDateForNumerazione(dataGenerazione);
  const centroCode = generateCentroRaccoltaCode(centroRaccolta);
  const sequenzialeCode = generateSequenzialeCode(sequenziale);

  const numero = `${dataFormatted}-RC-${centroCode}-${sequenzialeCode}`;

  return {
    numero,
    tipo: 'RICEVUTA',
    dataGenerazione: dataFormatted,
    centroRaccolta: centroCode,
    sequenziale
  };
}

// ============================================================================
// GENERATORE UNIVERSALE
// ============================================================================

/**
 * Genera numerazione per qualsiasi tipo di documento
 */
export function generaNumerazioneDocumento(
  tipoDocumento: 'CERTIFICATO' | 'RICEVUTA',
  tipoFormato: 'DIGITALE' | 'CARTACEO',
  params: ParametriNumerazione
): NumerazioneDocumento {
  if (tipoDocumento === 'CERTIFICATO') {
    return tipoFormato === 'DIGITALE' 
      ? generaNumerazioneCertificato(params)
      : generaNumerazioneCertificatoCartaceo(params);
  } else {
    return tipoFormato === 'DIGITALE'
      ? generaNumerazioneRicevuta(params)
      : generaNumerazioneRicevutaCartacea(params);
  }
}

// ============================================================================
// PARSER E VALIDATORI
// ============================================================================

/**
 * Parsa una numerazione esistente per estrarre le informazioni
 */
export function parseNumerazioneDocumento(numero: string): Partial<NumerazioneDocumento> | null {
  try {
    // Formato: YYYYMMDD-TT-PPPPPPPP-AAAAA
    const parts = numero.split('-');
    
    if (parts.length !== 4) {
      return null;
    }

    const [dataStr, tipoStr, centroStr, sequenzialeStr] = parts;

    // Valida formato data
    if (!/^\d{8}$/.test(dataStr)) {
      return null;
    }

    // Valida formato tipo
    if (!/^[A-Z]{2}$/.test(tipoStr)) {
      return null;
    }

    // Valida formato centro
    if (!/^[A-Z0-9]{8}$/.test(centroStr)) {
      return null;
    }

    // Valida formato sequenziale
    if (!/^\d{5}$/.test(sequenzialeStr)) {
      return null;
    }

    // Determina tipo documento
    let tipo: 'CERTIFICATO' | 'RICEVUTA';
    if (tipoStr === 'CD' || tipoStr === 'CC') {
      tipo = 'CERTIFICATO';
    } else if (tipoStr === 'RD' || tipoStr === 'RC') {
      tipo = 'RICEVUTA';
    } else {
      return null;
    }

    // Converte data
    const year = parseInt(dataStr.substring(0, 4));
    const month = parseInt(dataStr.substring(4, 6)) - 1;
    const day = parseInt(dataStr.substring(6, 8));
    const dataGenerazione = new Date(year, month, day).toISOString();

    return {
      numero,
      tipo,
      dataGenerazione,
      centroRaccolta: centroStr,
      sequenziale: parseInt(sequenzialeStr)
    };
  } catch (error) {
    return null;
  }
}

/**
 * Valida una numerazione documento
 */
export function validaNumerazioneDocumento(numero: string): boolean {
  const parsed = parseNumerazioneDocumento(numero);
  return parsed !== null;
}

/**
 * Ottiene il prossimo numero sequenziale per un centro e tipo
 */
export function getProssimoSequenziale(
  centroRaccolta: string,
  tipoDocumento: 'CERTIFICATO' | 'RICEVUTA',
  tipoFormato: 'DIGITALE' | 'CARTACEO',
  numerazioniEsistenti: string[]
): number {
  const centroCode = generateCentroRaccoltaCode(centroRaccolta);
  const tipoCode = tipoDocumento === 'CERTIFICATO' 
    ? (tipoFormato === 'DIGITALE' ? 'CD' : 'CC')
    : (tipoFormato === 'DIGITALE' ? 'RD' : 'RC');

  // Filtra le numerazioni per questo centro e tipo
  const numerazioniFiltrate = numerazioniEsistenti.filter(num => {
    const parsed = parseNumerazioneDocumento(num);
    return parsed && 
           parsed.centroRaccolta === centroCode && 
           parsed.tipo === tipoDocumento;
  });

  // Trova il numero sequenziale più alto
  let maxSequenziale = 0;
  numerazioniFiltrate.forEach(num => {
    const parsed = parseNumerazioneDocumento(num);
    if (parsed && parsed.sequenziale) {
      maxSequenziale = Math.max(maxSequenziale, parsed.sequenziale);
    }
  });

  return maxSequenziale + 1;
}

// ============================================================================
// UTILITY PER UI
// ============================================================================

/**
 * Formatta una numerazione per la visualizzazione
 */
export function formatNumerazioneForDisplay(numero: string): string {
  const parsed = parseNumerazioneDocumento(numero);
  if (!parsed) return numero;

  const { dataGenerazione, tipo, sequenziale } = parsed;
  const data = new Date(dataGenerazione).toLocaleDateString('it-IT');
  
  return `${numero} (${data}, ${tipo}, seq. ${sequenziale})`;
}

/**
 * Ottiene il colore per il tipo di documento
 */
export function getTipoDocumentoColor(tipo: 'CERTIFICATO' | 'RICEVUTA'): string {
  return tipo === 'CERTIFICATO' 
    ? 'bg-blue-100 text-blue-800 border-blue-200'
    : 'bg-green-100 text-green-800 border-green-200';
}

/**
 * Ottiene l'icona per il tipo di documento
 */
export function getTipoDocumentoIcon(tipo: 'CERTIFICATO' | 'RICEVUTA'): string {
  return tipo === 'CERTIFICATO' ? '📄' : '📋';
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const NUMERAZIONE_CONSTANTS = {
  // Formati supportati
  FORMATI_SUPPORTATI: ['CD', 'CC', 'RD', 'RC'],
  
  // Lunghezze
  LUNGHEZZA_DATA: 8,
  LUNGHEZZA_TIPO: 2,
  LUNGHEZZA_CENTRO: 8,
  LUNGHEZZA_SEQUENZIALE: 5,
  
  // Separatori
  SEPARATORE: '-',
  
  // Pattern regex
  PATTERN_NUMERAZIONE: /^\d{8}-[A-Z]{2}-[A-Z0-9]{8}-\d{5}$/
} as const;
