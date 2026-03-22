/**
 * Utility e helper functions per sistema RVFU
 * Funzioni di supporto per gestione dati, formattazione e conversioni
 */

import { 
  StatoVfuEnum, 
  StatoFascicoloEnum, 
  TipoDocumentoEnum,
  getStatoVfuDescription,
  getStatoFascicoloDescription,
  getTipoDocumentoDescription,
  getStatoVfuColor,
  canPerformAction,
  getNextPossibleStates,
  RVFU_CONSTANTS
} from './rvfu-enums';

// ============================================================================
// FORMATTAZIONE DATI
// ============================================================================

/**
 * Formatta una data per la visualizzazione italiana
 */
export function formatDateItalian(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('it-IT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Formatta una data e ora per la visualizzazione italiana
 */
export function formatDateTimeItalian(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('it-IT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formatta una data relativa (es. "2 giorni fa")
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays} giorno${diffDays > 1 ? 'i' : ''} fa`;
  } else if (diffHours > 0) {
    return `${diffHours} ora${diffHours > 1 ? 'e' : ''} fa`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minuto${diffMinutes > 1 ? 'i' : ''} fa`;
  } else {
    return 'Ora';
  }
}

/**
 * Formatta una dimensione file in formato leggibile
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Formatta un numero di telefono italiano
 */
export function formatPhoneNumber(phone: string): string {
  // Rimuove tutti i caratteri non numerici
  const cleaned = phone.replace(/\D/g, '');
  
  // Se inizia con +39, rimuove il prefisso
  const withoutPrefix = cleaned.startsWith('39') ? cleaned.substring(2) : cleaned;
  
  // Formatta come XXX XXX XXXX
  if (withoutPrefix.length === 10) {
    return `${withoutPrefix.substring(0, 3)} ${withoutPrefix.substring(3, 6)} ${withoutPrefix.substring(6)}`;
  }
  
  return phone; // Ritorna originale se non riconosciuto
}

/**
 * Formatta un codice fiscale con spazi
 */
export function formatCodiceFiscale(cf: string): string {
  if (cf.length !== 16) return cf;
  
  return `${cf.substring(0, 6)} ${cf.substring(6, 8)} ${cf.substring(8, 11)} ${cf.substring(11, 15)} ${cf.substring(15)}`;
}

/**
 * Formatta una targa italiana
 */
export function formatTarga(targa: string): string {
  // Rimuove spazi e converte in maiuscolo
  const cleaned = targa.replace(/\s/g, '').toUpperCase();
  
  // Formatta come XX XXX XX o XX XXXX XX
  if (cleaned.length === 7) {
    return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5)}`;
  } else if (cleaned.length === 8) {
    return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 6)} ${cleaned.substring(6)}`;
  }
  
  return targa;
}

// ============================================================================
// VALIDAZIONE DATI
// ============================================================================

/**
 * Valida un codice fiscale italiano
 */
export function validateCodiceFiscale(cf: string): boolean {
  if (!cf || cf.length !== 16) return false;
  
  const pattern = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
  return pattern.test(cf);
}

/**
 * Valida una targa italiana
 */
export function validateTarga(targa: string): boolean {
  if (!targa) return false;
  
  const cleaned = targa.replace(/\s/g, '').toUpperCase();
  
  // Formato vecchio: XX XXX XX
  const oldPattern = /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/;
  // Formato nuovo: XX XXXX XX
  const newPattern = /^[A-Z]{2}[0-9]{4}[A-Z]{2}$/;
  
  return oldPattern.test(cleaned) || newPattern.test(cleaned);
}

/**
 * Valida un telaio VIN
 */
export function validateTelaio(telaio: string): boolean {
  if (!telaio || telaio.length !== 17) return false;
  
  const pattern = /^[A-HJ-NPR-Z0-9]{17}$/;
  return pattern.test(telaio);
}

/**
 * Valida un indirizzo email
 */
export function validateEmail(email: string): boolean {
  if (!email) return true; // Email opzionale
  
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

/**
 * Valida un numero di telefono italiano
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return true; // Telefono opzionale
  
  const cleaned = phone.replace(/\D/g, '');
  
  // Rimuove prefisso +39 se presente
  const withoutPrefix = cleaned.startsWith('39') ? cleaned.substring(2) : cleaned;
  
  // Deve essere di 10 cifre
  return withoutPrefix.length === 10;
}

// ============================================================================
// CONVERSIONI DATI
// ============================================================================

/**
 * Converte un oggetto Date in stringa ISO per le API
 */
export function dateToISOString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Converte una stringa ISO in oggetto Date
 */
export function isoStringToDate(isoString: string): Date {
  return new Date(isoString);
}

/**
 * Converte una data in formato YYYY-MM-DD per input HTML
 */
export function dateToInputFormat(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converte una stringa da input HTML in Date
 */
export function inputFormatToDate(inputString: string): Date {
  return new Date(inputString + 'T00:00:00');
}

/**
 * Converte un file in base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Converte base64 in Blob
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

// ============================================================================
// GESTIONE STATI E TRANSIZIONI
// ============================================================================

/**
 * Ottiene le azioni disponibili per uno stato VFU
 */
export function getAvailableActions(stato: StatoVfuEnum): string[] {
  const actions: string[] = [];
  
  if (canPerformAction(stato, 'trasferire')) actions.push('trasferire');
  if (canPerformAction(stato, 'prendere_in_carico')) actions.push('prendere_in_carico');
  if (canPerformAction(stato, 'validare')) actions.push('validare');
  if (canPerformAction(stato, 'generare_certificato')) actions.push('generare_certificato');
  if (canPerformAction(stato, 'generare_ricevuta')) actions.push('generare_ricevuta');
  if (canPerformAction(stato, 'inviare_sta')) actions.push('inviare_sta');
  if (canPerformAction(stato, 'radiare')) actions.push('radiare');
  if (canPerformAction(stato, 'demolire')) actions.push('demolire');
  if (canPerformAction(stato, 'chiudere_fascicolo')) actions.push('chiudere_fascicolo');
  
  return actions;
}

/**
 * Ottiene la descrizione di un'azione
 */
export function getActionDescription(action: string): string {
  const descriptions: Record<string, string> = {
    'trasferire': 'Trasferisci VFU',
    'prendere_in_carico': 'Prendi in carico',
    'validare': 'Valida VFU',
    'generare_certificato': 'Genera Certificato',
    'generare_ricevuta': 'Genera Ricevuta',
    'inviare_sta': 'Invia a STA',
    'radiare': 'Radia veicolo',
    'demolire': 'Demolisci veicolo',
    'chiudere_fascicolo': 'Chiudi fascicolo'
  };
  
  return descriptions[action] || action;
}

/**
 * Ottiene il colore per un'azione
 */
export function getActionColor(action: string): string {
  const colors: Record<string, string> = {
    'trasferire': 'bg-blue-500 hover:bg-blue-600',
    'prendere_in_carico': 'bg-green-500 hover:bg-green-600',
    'validare': 'bg-emerald-500 hover:bg-emerald-600',
    'generare_certificato': 'bg-purple-500 hover:bg-purple-600',
    'generare_ricevuta': 'bg-indigo-500 hover:bg-indigo-600',
    'inviare_sta': 'bg-orange-500 hover:bg-orange-600',
    'radiare': 'bg-red-500 hover:bg-red-600',
    'demolire': 'bg-gray-500 hover:bg-gray-600',
    'chiudere_fascicolo': 'bg-slate-500 hover:bg-slate-600'
  };
  
  return colors[action] || 'bg-gray-500 hover:bg-gray-600';
}

// ============================================================================
// GESTIONE ERRORI
// ============================================================================

/**
 * Crea un messaggio di errore user-friendly
 */
export function createErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  
  return 'Si è verificato un errore imprevisto';
}

/**
 * Crea un messaggio di successo
 */
export function createSuccessMessage(action: string, entity: string): string {
  const messages: Record<string, string> = {
    'created': ` creato con successo`,
    'updated': ` aggiornato con successo`,
    'deleted': ` eliminato con successo`,
    'saved': ` salvato con successo`,
    'sent': ` inviato con successo`,
    'generated': ` generato con successo`,
    'uploaded': ` caricato con successo`,
    'downloaded': ` scaricato con successo`
  };
  
  return `${entity}${messages[action] || ' elaborato con successo'}`;
}

// ============================================================================
// GESTIONE PAGINAZIONE
// ============================================================================

/**
 * Calcola i parametri di paginazione
 */
export function calculatePagination(
  pageNumber: number,
  pageSize: number,
  totalElements: number
) {
  const totalPages = Math.ceil(totalElements / pageSize);
  const hasNext = pageNumber < totalPages;
  const hasPrevious = pageNumber > 1;
  
  return {
    pageNumber,
    pageSize,
    totalElements,
    totalPages,
    hasNext,
    hasPrevious,
    startIndex: (pageNumber - 1) * pageSize + 1,
    endIndex: Math.min(pageNumber * pageSize, totalElements)
  };
}

/**
 * Genera un array di numeri di pagina per la UI
 */
export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): number[] {
  const pages: number[] = [];
  const half = Math.floor(maxVisible / 2);
  
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
}

// ============================================================================
// GESTIONE FILTRI
// ============================================================================

/**
 * Crea un oggetto filtri per le API
 */
export function createApiFilters(filters: any): Record<string, any> {
  const apiFilters: Record<string, any> = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      apiFilters[key] = value;
    }
  });
  
  return apiFilters;
}

/**
 * Crea un oggetto filtri per la UI
 */
export function createUIFilters(apiFilters: Record<string, any>): any {
  const uiFilters: any = {};
  
  Object.entries(apiFilters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      uiFilters[key] = value;
    }
  });
  
  return uiFilters;
}

// ============================================================================
// GESTIONE STORAGE
// ============================================================================

/**
 * Salva dati nel localStorage con gestione errori
 */
export function saveToLocalStorage(key: string, data: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Errore nel salvataggio localStorage:', error);
    return false;
  }
}

/**
 * Carica dati dal localStorage con gestione errori
 */
export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Errore nel caricamento localStorage:', error);
    return defaultValue;
  }
}

/**
 * Rimuove dati dal localStorage
 */
export function removeFromLocalStorage(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Errore nella rimozione localStorage:', error);
    return false;
  }
}

// ============================================================================
// GESTIONE DEBOUNCE
// ============================================================================

/**
 * Crea una funzione debounced
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Crea una funzione throttled
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const UTILITY_CONSTANTS = {
  // Formati data
  DATE_FORMATS: {
    ITALIAN: 'DD/MM/YYYY',
    ISO: 'YYYY-MM-DD',
    DISPLAY: 'DD MMMM YYYY'
  },
  
  // Limiti
  MAX_FILE_SIZE: RVFU_CONSTANTS.MAX_FILE_SIZE,
  MAX_TEXT_LENGTH: 1000,
  MAX_DESCRIPTION_LENGTH: 500,
  
  // Timeout
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 1000,
  
  // Paginazione
  DEFAULT_PAGE_SIZE: RVFU_CONSTANTS.DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE: RVFU_CONSTANTS.MAX_PAGE_SIZE
} as const;
