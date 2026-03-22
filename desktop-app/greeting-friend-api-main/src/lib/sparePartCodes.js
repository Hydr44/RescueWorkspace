/**
 * Sistema generazione codici interni per ricambi
 * Formato: RM-{CATEGORIA}-{ANNO}-{PROGRESSIVO}
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Mappa categorie a codici brevi
 */
const CATEGORY_CODES = {
  'motore': 'MOT',
  'trasmissione': 'TRA',
  'carrozzeria': 'CAR',
  'elettronica': 'ELE',
  'freni': 'FRE',
  'sospensioni': 'SOS',
  'pneumatici': 'PNE',
  'accessori': 'ACC',
  'consumabili': 'CON',
  'interni': 'INT',
  'esterni': 'EST',
  'illuminazione': 'ILL',
  'climatizzazione': 'CLI',
  'scarico': 'SCA',
  'filtri': 'FIL',
  'default': 'GEN',
};

/**
 * Ottieni codice categoria da nome
 */
export function getCategoryCode(categoryName) {
  if (!categoryName) return 'GEN';
  
  const normalized = categoryName.toLowerCase().trim();
  
  // Cerca match esatto
  if (CATEGORY_CODES[normalized]) {
    return CATEGORY_CODES[normalized];
  }
  
  // Cerca match parziale
  for (const [key, code] of Object.entries(CATEGORY_CODES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return code;
    }
  }
  
  return 'GEN';
}

/**
 * Genera prossimo codice interno per ricambio
 * @param {string} orgId - ID organizzazione
 * @param {string} categoryName - Nome categoria (opzionale)
 * @returns {Promise<string>} Codice interno generato (es. RM-MOT-2026-00142)
 */
export async function generateInternalCode(orgId, categoryName = null) {
  const categoryCode = getCategoryCode(categoryName);
  
  try {
    const { data, error } = await supabase.rpc('next_spare_part_code', {
      p_org_id: orgId,
      p_category_code: categoryCode,
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[SparePartCodes] Error generating code:', error);
    
    // Fallback: genera codice temporaneo
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    return `RM-${categoryCode}-${year}-${random}`;
  }
}

/**
 * Valida formato codice interno
 */
export function isValidInternalCode(code) {
  if (!code) return false;
  // Formato: RM-XXX-YYYY-NNNNN
  const pattern = /^RM-[A-Z]{3}-\d{4}-\d{5}$/;
  return pattern.test(code);
}

/**
 * Estrai informazioni da codice interno
 */
export function parseInternalCode(code) {
  if (!isValidInternalCode(code)) return null;
  
  const parts = code.split('-');
  return {
    prefix: parts[0],
    category: parts[1],
    year: parseInt(parts[2]),
    number: parseInt(parts[3]),
  };
}

/**
 * Genera barcode EAN-13 da codice interno
 * Converte RM-MOT-2026-00142 → 2026001420XXX (con checksum)
 */
export function generateEAN13(internalCode) {
  if (!isValidInternalCode(internalCode)) return null;
  
  const parsed = parseInternalCode(internalCode);
  if (!parsed) return null;
  
  // Costruisci 12 cifre: YYYY (4) + NNNNN (5) + padding (3)
  const base = `${parsed.year}${parsed.number.toString().padStart(5, '0')}000`;
  
  // Calcola checksum EAN-13
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base[i]);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const checksum = (10 - (sum % 10)) % 10;
  
  return base + checksum;
}

/**
 * Formatta codice per display
 */
export function formatCode(code, type = 'internal') {
  if (!code) return '-';
  
  switch (type) {
    case 'internal':
      return code.toUpperCase();
    case 'oem':
      return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    case 'ean':
      // Formatta EAN-13: 1234567 890123 → 1 234567 890123
      if (code.length === 13) {
        return `${code[0]} ${code.slice(1, 7)} ${code.slice(7)}`;
      }
      return code;
    default:
      return code;
  }
}

export default {
  getCategoryCode,
  generateInternalCode,
  isValidInternalCode,
  parseInternalCode,
  generateEAN13,
  formatCode,
};
