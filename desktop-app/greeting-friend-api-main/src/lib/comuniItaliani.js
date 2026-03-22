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
 * Cerca comuni per nome (con auto-completamento)
 * @param {string} query - Nome del comune da cercare
 * @returns {Promise<Array>} Array di comuni con nome, provincia, codice catastale
 */
export async function searchComuni(query) {
  if (!query || query.length < 2) return [];

  const comuni = await loadComuni();
  const normalizedQuery = query.toLowerCase().trim();

  return comuni
    .filter(c => c.nome.toLowerCase().includes(normalizedQuery))
    .slice(0, 10) // Limita a 10 risultati
    .map(c => ({
      nome: c.nome,
      provincia: c.provincia?.nome || '',
      sigla: c.provincia?.sigla || '',
      codiceCatastale: c.codiceCatastale,
      cap: c.cap?.[0] || '', // Primo CAP disponibile
      zona: c.zona?.nome || '',
      displayName: `${c.nome} (${c.provincia?.sigla || ''})`,
    }));
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
