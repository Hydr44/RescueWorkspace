// src/lib/comuniItaliani.js
// Database comuni italiani con codici catastali
// Fonte: https://github.com/matteocontrini/comuni-json

let comuniCache = null;

/**
 * Carica i comuni italiani dal dataset GitHub
 */
async function loadComuni() {
  if (comuniCache) return comuniCache;

  try {
    const response = await fetch('https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json');
    if (!response.ok) throw new Error('Errore caricamento comuni');
    
    comuniCache = await response.json();
    return comuniCache;
  } catch (error) {
    console.error('Errore caricamento comuni:', error);
    return [];
  }
}

/**
 * Cerca comuni per nome con ranking corretto:
 *   1. match esatto del nome (priorità massima)
 *   2. nome che inizia con la query
 *   3. parola del nome che inizia con la query (es. "San " + query)
 *   4. includes generico (priorità bassa)
 *
 * Esempio: query "gela" → "Gela" (esatto, in cima) > "Genova" no > "Argelato" (include) in fondo.
 *
 * @param {string} query - Nome del comune da cercare
 * @returns {Promise<Array>} Array di comuni con nome, provincia, codice catastale, CAP
 */
export async function searchComuni(query) {
  if (!query || query.length < 2) return [];

  const comuni = await loadComuni();
  const q = query.toLowerCase().trim();

  const scored = [];
  for (const c of comuni) {
    const nome = (c.nome || '').toLowerCase();
    if (!nome.includes(q)) continue;
    let score;
    if (nome === q) score = 0;                             // match esatto
    else if (nome.startsWith(q)) score = 1;                // inizia con
    else if (nome.split(/[\s-']/).some(w => w.startsWith(q))) score = 2; // parola che inizia
    else score = 3;                                        // include generico
    scored.push({ c, score, len: nome.length });
  }

  // Ordina per score, poi per lunghezza (più corto = più "puro" match)
  scored.sort((a, b) => a.score - b.score || a.len - b.len);

  return scored.slice(0, 10).map(({ c }) => ({
    nome: c.nome,
    provincia: c.provincia?.nome || '',
    sigla: c.provincia?.sigla || '',
    codiceCatastale: c.codiceCatastale,
    cap: c.cap?.[0] || '',
    zona: c.zona?.nome || '',
    displayName: `${c.nome} (${c.provincia?.sigla || ''})`,
  }));
}

/**
 * Cerca un comune per nome esatto (case-insensitive) e/o sigla provincia.
 * Utile come fallback quando Google Places non restituisce CAP/provincia.
 *
 * @param {string} name - Nome città
 * @param {string} [provinceSigla] - Sigla provincia (es. "CL") per disambiguare
 * @returns {Promise<Object|null>}
 */
export async function findComuneExact(name, provinceSigla) {
  if (!name) return null;
  const comuni = await loadComuni();
  const target = name.toLowerCase().trim();
  const sigla = (provinceSigla || '').toUpperCase().trim();

  // Filtra match esatto sul nome
  const matches = comuni.filter(c => (c.nome || '').toLowerCase() === target);
  if (matches.length === 0) return null;
  if (matches.length === 1) {
    const c = matches[0];
    return {
      nome: c.nome,
      provincia: c.provincia?.nome || '',
      sigla: c.provincia?.sigla || '',
      codiceCatastale: c.codiceCatastale,
      cap: c.cap?.[0] || '',
    };
  }
  // Più match (es. omonimi): preferisci quello con sigla provincia se data
  if (sigla) {
    const c = matches.find(m => (m.provincia?.sigla || '').toUpperCase() === sigla);
    if (c) {
      return {
        nome: c.nome,
        provincia: c.provincia?.nome || '',
        sigla: c.provincia?.sigla || '',
        codiceCatastale: c.codiceCatastale,
        cap: c.cap?.[0] || '',
      };
    }
  }
  const c = matches[0];
  return {
    nome: c.nome,
    provincia: c.provincia?.nome || '',
    sigla: c.provincia?.sigla || '',
    codiceCatastale: c.codiceCatastale,
    cap: c.cap?.[0] || '',
  };
}

/**
 * Trova un comune per codice catastale
 * @param {string} codiceCatastale - Codice catastale (es. H501)
 * @returns {Promise<Object|null>} Dati del comune o null
 */
export async function getComuneByCode(codiceCatastale) {
  if (!codiceCatastale) return null;

  const comuni = await loadComuni();
  const comune = comuni.find(c => c.codiceCatastale === codiceCatastale.toUpperCase());

  if (!comune) return null;

  return {
    nome: comune.nome,
    provincia: comune.provincia?.nome || '',
    sigla: comune.provincia?.sigla || '',
    codiceCatastale: comune.codiceCatastale,
    cap: comune.cap?.[0] || '',
  };
}

/**
 * Trova un comune per nome esatto
 * @param {string} nomeComune - Nome del comune
 * @returns {Promise<Object|null>} Dati del comune o null
 */
export async function getComuneByName(nomeComune) {
  if (!nomeComune) return null;

  const comuni = await loadComuni();
  const normalized = nomeComune.toLowerCase().trim();
  const comune = comuni.find(c => c.nome.toLowerCase() === normalized);

  if (!comune) return null;

  return {
    nome: comune.nome,
    provincia: comune.provincia?.nome || '',
    sigla: comune.provincia?.sigla || '',
    codiceCatastale: comune.codiceCatastale,
    cap: comune.cap?.[0] || '',
  };
}
