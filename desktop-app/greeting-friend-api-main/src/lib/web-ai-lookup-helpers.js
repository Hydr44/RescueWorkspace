/**
 * Helper functions per Web+AI Lookup
 * Generazione candidati multipli e sistema di scoring
 */

import { logger } from './logger';

/**
 * Genera multipli candidati possibili da info estratte
 */
export function generateCandidates(extractedInfo, oemCode) {
  const candidates = [];

  // Strategia 1: Combina marca + categoria più frequenti
  extractedInfo.brands.forEach(brand => {
    extractedInfo.categories.forEach(category => {
      const name = `${category} ${brand}`;
      candidates.push({
        name,
        description: `${category} compatibile con ${brand}`,
        oem_code: oemCode,
        category,
        vehicle_compatibility: {
          make: brand,
          model: null,
          year_from: null,
          year_to: null
        },
        _source: 'web_ai',
        _strategy: 'brand_category'
      });
    });
  });

  // Strategia 2: Usa titoli più rilevanti
  extractedInfo.titles.slice(0, 3).forEach((title, idx) => {
    const cleanTitle = cleanPartName(title, oemCode);
    const category = guessCategoryFromText(title);
    const brand = extractedInfo.brands[0] || null;

    if (cleanTitle && cleanTitle.length > 5) {
      candidates.push({
        name: cleanTitle,
        description: extractedInfo.snippets[idx] || cleanTitle,
        oem_code: oemCode,
        category,
        vehicle_compatibility: brand ? {
          make: brand,
          model: extractModelFromText(title, brand),
          year_from: extractYearFromText(title),
          year_to: null
        } : null,
        _source: 'web_ai',
        _strategy: 'title_based'
      });
    }
  });

  // Strategia 3: Pattern matching avanzato su snippet
  extractedInfo.snippets.forEach((snippet, idx) => {
    const matches = extractPartInfoFromSnippet(snippet, oemCode);
    if (matches && matches.name) {
      candidates.push({
        ...matches,
        oem_code: oemCode,
        _source: 'web_ai',
        _strategy: 'snippet_pattern'
      });
    }
  });

  logger.info(`[Candidates] Generati ${candidates.length} candidati grezzi`);
  return candidates;
}

/**
 * Ranking candidati con scoring
 */
export function rankCandidates(candidates, extractedInfo) {
  // Calcola score per ogni candidato
  const scored = candidates.map(candidate => {
    let score = 0;

    // Nome valido e sensato
    if (candidate.name && candidate.name.length > 10 && candidate.name.length < 100) {
      score += 20;
    }

    // Ha categoria
    if (candidate.category) score += 15;

    // Ha compatibilità veicolo
    if (candidate.vehicle_compatibility?.make) score += 15;
    if (candidate.vehicle_compatibility?.model) score += 10;
    if (candidate.vehicle_compatibility?.year_from) score += 5;

    // Descrizione presente
    if (candidate.description && candidate.description.length > 20) score += 10;

    // Strategia preferita (title_based è più affidabile)
    if (candidate._strategy === 'title_based') score += 15;
    if (candidate._strategy === 'snippet_pattern') score += 10;
    if (candidate._strategy === 'brand_category') score += 5;

    // Penalità per nomi troppo generici
    const genericWords = ['ricambio', 'auto', 'pezzo', 'parte', 'originale'];
    const nameWords = candidate.name.toLowerCase().split(/\s+/);
    const genericCount = nameWords.filter(w => genericWords.includes(w)).length;
    score -= genericCount * 5;

    // Bonus se marca è nelle top 3 più frequenti
    if (candidate.vehicle_compatibility?.make) {
      const brandIndex = extractedInfo.brands.indexOf(candidate.vehicle_compatibility.make);
      if (brandIndex === 0) score += 10;
      else if (brandIndex === 1) score += 5;
    }

    return {
      ...candidate,
      _score: Math.max(0, score)
    };
  });

  // Ordina per score decrescente
  scored.sort((a, b) => b._score - a._score);

  // Rimuovi duplicati (stesso nome)
  const unique = [];
  const seenNames = new Set();

  for (const candidate of scored) {
    const normalizedName = candidate.name.toLowerCase().trim();
    if (!seenNames.has(normalizedName)) {
      seenNames.add(normalizedName);
      unique.push(candidate);
    }
  }

  logger.info(`[Ranking] ${unique.length} candidati unici dopo deduplicazione`);
  return unique;
}

/**
 * Pulisce nome ricambio
 */
function cleanPartName(text, oemCode) {
  return text
    .replace(new RegExp(oemCode, 'gi'), '')
    .replace(/ricambio|auto|pezzo|parte|originale|oem/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/[*#]+/g, '')
    .trim()
    .substring(0, 100);
}

/**
 * Indovina categoria da testo
 */
function guessCategoryFromText(text) {
  const textLower = text.toLowerCase();
  
  const categoryMap = {
    'paraurti|bumper': 'Carrozzeria',
    'faro|fanale|light|headlight': 'Illuminazione',
    'specchio|mirror': 'Carrozzeria',
    'portiera|door': 'Carrozzeria',
    'cofano|hood|bonnet': 'Carrozzeria',
    'parafango|fender|wing': 'Carrozzeria',
    'filtro|filter': 'Manutenzione',
    'pastiglie|disco|brake|freno': 'Freni',
    'ammortizzatore|shock|suspension': 'Sospensioni',
    'motore|engine': 'Motore',
    'cambio|gearbox|transmission': 'Trasmissione',
    'radiatore|radiator': 'Raffreddamento',
    'alternatore|alternator': 'Elettrico',
    'batteria|battery': 'Elettrico',
    'cerchio|wheel|rim': 'Ruote'
  };

  for (const [keywords, category] of Object.entries(categoryMap)) {
    if (keywords.split('|').some(kw => textLower.includes(kw))) {
      return category;
    }
  }

  return null;
}

/**
 * Estrae modello da testo
 */
function extractModelFromText(text, brand) {
  if (!brand) return null;

  const patterns = [
    new RegExp(`${brand}\\s+([A-Z][a-z0-9\\s]+(?:Serie|Classe|Class)?\\s*[A-Z0-9]+)`, 'i'),
    new RegExp(`${brand}\\s+([A-Z][a-z]+)`, 'i')
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Estrae anno da testo
 */
function extractYearFromText(text) {
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    const year = Number.parseInt(yearMatch[0]);
    if (year >= 1980 && year <= new Date().getFullYear()) {
      return year;
    }
  }
  return null;
}

/**
 * Estrae info da snippet con pattern matching avanzato
 */
function extractPartInfoFromSnippet(snippet, oemCode) {
  // Pattern: "Paraurti anteriore per BMW Serie 3 E90 2005-2012"
  const pattern = /([A-Za-zàèéìòù\s]+(?:anteriore|posteriore|destro|sinistro)?)\s+(?:per|for|fits)?\s*([A-Z][a-z]+(?:\s+[A-Z0-9][a-z0-9]+)*)?/i;
  
  const match = snippet.match(pattern);
  if (!match) return null;

  const partName = match[1]?.trim();
  const vehicleInfo = match[2]?.trim();

  if (!partName || partName.length < 5) return null;

  return {
    name: cleanPartName(partName, oemCode),
    description: snippet.substring(0, 200),
    category: guessCategoryFromText(partName),
    vehicle_compatibility: vehicleInfo ? {
      make: vehicleInfo.split(/\s+/)[0],
      model: vehicleInfo,
      year_from: extractYearFromText(snippet),
      year_to: null
    } : null
  };
}
