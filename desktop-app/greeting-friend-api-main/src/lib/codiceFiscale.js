// src/lib/codiceFiscale.js
// Utility per calcolo Codice Fiscale italiano

const MONTHS = {
  1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E', 6: 'H',
  7: 'L', 8: 'M', 9: 'P', 10: 'R', 11: 'S', 12: 'T'
};

const ODD_MAP = {
  '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
  'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
  'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
  'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
};

const EVEN_MAP = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
  'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
  'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25
};

const CHECK_CHAR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function extractConsonants(str) {
  return str.toUpperCase().replace(/[^BCDFGHJKLMNPQRSTVWXYZ]/g, '');
}

function extractVowels(str) {
  return str.toUpperCase().replace(/[^AEIOU]/g, '');
}

function computeSurname(surname) {
  const cons = extractConsonants(surname);
  const vows = extractVowels(surname);
  let result = (cons + vows + 'XXX').substring(0, 3);
  return result;
}

function computeName(name) {
  const cons = extractConsonants(name);
  const vows = extractVowels(name);
  
  if (cons.length >= 4) {
    // Se ci sono 4+ consonanti, prendi 1°, 3°, 4°
    return cons[0] + cons[2] + cons[3];
  }
  
  let result = (cons + vows + 'XXX').substring(0, 3);
  return result;
}

function computeDate(birthDate, gender) {
  // birthDate = "YYYY-MM-DD" or Date object
  const d = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const year = d.getFullYear() % 100; // ultime 2 cifre
  const month = d.getMonth() + 1;
  let day = d.getDate();
  
  if (gender.toUpperCase() === 'F') {
    day += 40;
  }
  
  const yy = String(year).padStart(2, '0');
  const mm = MONTHS[month];
  const dd = String(day).padStart(2, '0');
  
  return yy + mm + dd;
}

function computeChecksum(partial) {
  let sum = 0;
  for (let i = 0; i < partial.length; i++) {
    const char = partial[i];
    if (i % 2 === 0) {
      // dispari (1-indexed)
      sum += ODD_MAP[char] || 0;
    } else {
      // pari
      sum += EVEN_MAP[char] || 0;
    }
  }
  return CHECK_CHAR[sum % 26];
}

/**
 * Calcola il codice fiscale italiano
 * @param {Object} data - { surname, name, birthDate, birthPlace, gender }
 * @param {string} data.surname - Cognome
 * @param {string} data.name - Nome
 * @param {string|Date} data.birthDate - Data di nascita (YYYY-MM-DD o Date)
 * @param {string} data.birthPlace - Codice catastale comune (es. H501 per Roma)
 * @param {string} data.gender - 'M' o 'F'
 * @returns {string} Codice fiscale
 */
export function calcolaCodiceFiscale({ surname, name, birthDate, birthPlace, gender }) {
  if (!surname || !name || !birthDate || !birthPlace || !gender) {
    throw new Error("Tutti i campi sono obbligatori per calcolare il codice fiscale");
  }
  
  const surnameCode = computeSurname(surname);
  const nameCode = computeName(name);
  const dateCode = computeDate(birthDate, gender);
  const placeCode = birthPlace.toUpperCase().substring(0, 4).padEnd(4, 'X');
  
  const partial = surnameCode + nameCode + dateCode + placeCode;
  const checksum = computeChecksum(partial);
  
  return partial + checksum;
}

/**
 * Verifica se un codice fiscale è formalmente valido
 * @param {string} cf - Codice fiscale da verificare
 * @returns {boolean}
 */
export function validaCodiceFiscale(cf) {
  if (!cf || cf.length !== 16) return false;
  
  const partial = cf.substring(0, 15);
  const expectedCheck = computeChecksum(partial);
  
  return cf[15] === expectedCheck;
}
