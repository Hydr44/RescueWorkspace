/**
 * Enum ufficiali RVFU basati sulle specifiche ACI/MIT
 * Versione: 1.17-1.20
 */

// ============================================================================
// STATI VFU (Veicoli Fuori Uso)
// ============================================================================

export enum StatoVfuEnum {
  CONFERITO = 'CONFERITO',
  TRASFERITO = 'TRASFERITO', 
  PRESO_IN_CARICO = 'PRESO_IN_CARICO',
  VALIDATO = 'VALIDATO',
  DA_RADIARE = 'DA_RADIARE',
  INVIATO_A_STA = 'INVIATO_A_STA',
  RADIATO = 'RADIATO',
  DEMOLITO = 'DEMOLITO'
}

// ============================================================================
// STATI FASCICOLO
// ============================================================================

export enum StatoFascicoloEnum {
  INSERITO = 'I',
  CHIUSO = 'C', 
  INTEGRAZIONE = 'S'
}

// ============================================================================
// TIPI DOCUMENTO
// ============================================================================

export enum TipoDocumentoEnum {
  CERTIFICATO = 'C',
  RICEVUTA = 'R',
  ALLEGATO = 'A',
  FOTO_VEICOLO = 'F',
  DOCUMENTO_IDENTITA = 'D'
}

// ============================================================================
// TIPI VEICOLO
// ============================================================================

export enum TipoVeicoloEnum {
  AUTOVEICOLO = 'AUTOVEICOLO',
  MOTOVEICOLO = 'MOTOVEICOLO',
  CICLOMOTORE = 'CICLOMOTORE',
  RIMORCHIO = 'RIMORCHIO',
  SEMIRIMORCHIO = 'SEMIRIMORCHIO'
}

// ============================================================================
// STATI CERTIFICATO
// ============================================================================

export enum StatoCertificatoEnum {
  DA_GENERARE = 'DA_GENERARE',
  GENERATO = 'GENERATO',
  FIRMATO = 'FIRMATO',
  INVIATO = 'INVIATO'
}

// ============================================================================
// STATI RICEVUTA
// ============================================================================

export enum StatoRicevutaEnum {
  DA_GENERARE = 'DA_GENERARE',
  GENERATA = 'GENERATA', 
  FIRMATA = 'FIRMATA',
  INVIATA = 'INVIATA'
}

// ============================================================================
// TIPI ALLEGATO
// ============================================================================

export enum TipoAllegatoEnum {
  FOTO_VEICOLO = 'FOTO_VEICOLO',
  DOCUMENTO_IDENTITA = 'DOCUMENTO_IDENTITA',
  LIBRETTO_CIRCOLAZIONE = 'LIBRETTO_CIRCOLAZIONE',
  CERTIFICATO_PROPRIETA = 'CERTIFICATO_PROPRIETA',
  ALTRO = 'ALTRO'
}

// ============================================================================
// STATI FIRMA
// ============================================================================

export enum StatoFirmaEnum {
  NON_RICHIESTA = 'NON_RICHIESTA',
  RICHIESTA = 'RICHIESTA',
  IN_CORSO = 'IN_CORSO',
  COMPLETATA = 'COMPLETATA',
  ERRORE = 'ERRORE',
  SCADUTA = 'SCADUTA'
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Ottiene la descrizione leggibile di uno stato VFU
 */
export function getStatoVfuDescription(stato: StatoVfuEnum): string {
  const descriptions: Record<StatoVfuEnum, string> = {
    [StatoVfuEnum.CONFERITO]: 'Conferito',
    [StatoVfuEnum.TRASFERITO]: 'Trasferito',
    [StatoVfuEnum.PRESO_IN_CARICO]: 'Preso in carico',
    [StatoVfuEnum.VALIDATO]: 'Validato',
    [StatoVfuEnum.DA_RADIARE]: 'Da radiare',
    [StatoVfuEnum.INVIATO_A_STA]: 'Inviato a STA',
    [StatoVfuEnum.RADIATO]: 'Radiato',
    [StatoVfuEnum.DEMOLITO]: 'Demolito'
  };
  return descriptions[stato] || stato;
}

/**
 * Ottiene la descrizione leggibile di uno stato fascicolo
 */
export function getStatoFascicoloDescription(stato: StatoFascicoloEnum): string {
  const descriptions: Record<StatoFascicoloEnum, string> = {
    [StatoFascicoloEnum.INSERITO]: 'Inserito',
    [StatoFascicoloEnum.CHIUSO]: 'Chiuso',
    [StatoFascicoloEnum.INTEGRAZIONE]: 'Integrazione'
  };
  return descriptions[stato] || stato;
}

/**
 * Ottiene la descrizione leggibile di un tipo documento
 */
export function getTipoDocumentoDescription(tipo: TipoDocumentoEnum): string {
  const descriptions: Record<TipoDocumentoEnum, string> = {
    [TipoDocumentoEnum.CERTIFICATO]: 'Certificato di Rottamazione',
    [TipoDocumentoEnum.RICEVUTA]: 'Ricevuta di Presa in Carico',
    [TipoDocumentoEnum.ALLEGATO]: 'Allegato',
    [TipoDocumentoEnum.FOTO_VEICOLO]: 'Foto Veicolo',
    [TipoDocumentoEnum.DOCUMENTO_IDENTITA]: 'Documento Identità'
  };
  return descriptions[tipo] || tipo;
}

/**
 * Ottiene il colore per uno stato VFU (per UI)
 */
export function getStatoVfuColor(stato: StatoVfuEnum): string {
  const colors: Record<StatoVfuEnum, string> = {
    [StatoVfuEnum.CONFERITO]: 'bg-blue-100 text-blue-800',
    [StatoVfuEnum.TRASFERITO]: 'bg-yellow-100 text-yellow-800',
    [StatoVfuEnum.PRESO_IN_CARICO]: 'bg-green-100 text-green-800',
    [StatoVfuEnum.VALIDATO]: 'bg-emerald-100 text-emerald-800',
    [StatoVfuEnum.DA_RADIARE]: 'bg-orange-100 text-orange-800',
    [StatoVfuEnum.INVIATO_A_STA]: 'bg-purple-100 text-purple-800',
    [StatoVfuEnum.RADIATO]: 'bg-red-100 text-red-800',
    [StatoVfuEnum.DEMOLITO]: 'bg-gray-100 text-gray-800'
  };
  return colors[stato] || 'bg-gray-100 text-gray-800';
}

/**
 * Verifica se uno stato VFU permette determinate azioni
 */
export function canPerformAction(stato: StatoVfuEnum, action: string): boolean {
  const allowedActions: Record<StatoVfuEnum, string[]> = {
    [StatoVfuEnum.CONFERITO]: ['trasferire', 'prendere_in_carico'],
    [StatoVfuEnum.TRASFERITO]: ['prendere_in_carico'],
    [StatoVfuEnum.PRESO_IN_CARICO]: ['validare', 'generare_certificato', 'generare_ricevuta'],
    [StatoVfuEnum.VALIDATO]: ['inviare_sta', 'generare_certificato'],
    [StatoVfuEnum.DA_RADIARE]: ['radiare'],
    [StatoVfuEnum.INVIATO_A_STA]: ['chiudere_fascicolo'],
    [StatoVfuEnum.RADIATO]: ['demolire'],
    [StatoVfuEnum.DEMOLITO]: []
  };
  
  return allowedActions[stato]?.includes(action) || false;
}

/**
 * Ottiene gli stati successivi possibili da uno stato VFU
 */
export function getNextPossibleStates(stato: StatoVfuEnum): StatoVfuEnum[] {
  const transitions: Record<StatoVfuEnum, StatoVfuEnum[]> = {
    [StatoVfuEnum.CONFERITO]: [StatoVfuEnum.TRASFERITO, StatoVfuEnum.PRESO_IN_CARICO],
    [StatoVfuEnum.TRASFERITO]: [StatoVfuEnum.PRESO_IN_CARICO],
    [StatoVfuEnum.PRESO_IN_CARICO]: [StatoVfuEnum.VALIDATO],
    [StatoVfuEnum.VALIDATO]: [StatoVfuEnum.INVIATO_A_STA],
    [StatoVfuEnum.DA_RADIARE]: [StatoVfuEnum.RADIATO],
    [StatoVfuEnum.INVIATO_A_STA]: [StatoVfuEnum.RADIATO],
    [StatoVfuEnum.RADIATO]: [StatoVfuEnum.DEMOLITO],
    [StatoVfuEnum.DEMOLITO]: []
  };
  
  return transitions[stato] || [];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const RVFU_CONSTANTS = {
  // Numerazioni documenti
  CERTIFICATO_PREFIX: 'CD',
  RICEVUTA_PREFIX: 'RD',
  
  // Formati data
  DATE_FORMAT: 'YYYYMMDD',
  
  // Limiti
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['pdf', 'jpg', 'jpeg', 'png'],
  
  // Timeout
  FIRMA_TIMEOUT: 30 * 60 * 1000, // 30 minuti
  API_TIMEOUT: 30 * 1000, // 30 secondi
  
  // Paginazione
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
} as const;

// ============================================================================
// TYPES
// ============================================================================

export type StatoVfu = keyof typeof StatoVfuEnum;
export type StatoFascicolo = keyof typeof StatoFascicoloEnum;
export type TipoDocumento = keyof typeof TipoDocumentoEnum;
export type TipoVeicolo = keyof typeof TipoVeicoloEnum;
export type StatoCertificato = keyof typeof StatoCertificatoEnum;
export type StatoRicevuta = keyof typeof StatoRicevutaEnum;
export type TipoAllegato = keyof typeof TipoAllegatoEnum;
export type StatoFirma = keyof typeof StatoFirmaEnum;
