// electron/ipc-modules/spare-parts.js
// OEM Lookup via main process - bypassa CORS, ottiene HTML reale
const https = require('https');
const http = require('http');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ── Brands e categorie ──
const BRANDS = [
  'BMW','Mercedes-Benz','Mercedes','Audi','Volkswagen','VW',
  'Fiat','Alfa Romeo','Lancia','Ford','Opel','Renault',
  'Peugeot','Citroen','Toyota','Honda','Nissan','Mazda',
  'Hyundai','Kia','Volvo','Seat','Skoda','Porsche',
  'Mini','Jeep','Land Rover','Jaguar','Suzuki','Mitsubishi',
  'Subaru','Dacia','Smart','Maserati','Ferrari','Lamborghini'
];

const CATEGORIES = {
  'paraurti|bumper|stossfanger|stoßfänger': 'Carrozzeria',
  'faro|fanale|headlight|scheinwerfer|proiettore': 'Illuminazione',
  'specchio|specchietto|mirror|spiegel|retrovisore': 'Carrozzeria',
  'portiera|door|porta|tür': 'Carrozzeria',
  'cofano|hood|bonnet|motorhaube': 'Carrozzeria',
  'parafango|fender|wing|kotflügel': 'Carrozzeria',
  'griglia|grill|grille|calandra|kühlergrill': 'Carrozzeria',
  'spoiler|minigonna|modanatura|trim|zierleiste': 'Carrozzeria',
  'filtro|filter': 'Manutenzione',
  'pastiglie|pastiglia|disco freno|brake|bremse': 'Freni',
  'ammortizzatore|shock|molla|spring|stoßdämpfer': 'Sospensioni',
  'motore|engine|motor|testata': 'Motore',
  'cambio|gearbox|transmission|frizione|clutch': 'Trasmissione',
  'radiatore|radiator|intercooler': 'Raffreddamento',
  'alternatore|alternator|motorino|starter': 'Elettrico',
  'cerchio|wheel|rim|felge': 'Ruote',
  'vetro|cristallo|parabrezza|windshield|lunotto': 'Vetri',
  'sedile|seat|airbag|cintura|cruscotto': 'Interni'
};

const POSITIONS = {
  'anteriore|front|vorne|davanti|ant\\.': 'anteriore',
  'posteriore|rear|hinten|dietro|post\\.': 'posteriore',
  'destro|right|rechts|dx': 'destro',
  'sinistro|left|links|sx': 'sinistro',
  'superiore|upper|top|sopra|obere': 'superiore',
  'inferiore|lower|bottom|sotto|untere': 'inferiore',
  'centrale|center|central|centro|mitte': 'centrale'
};

/**
 * Fetch URL con follow redirect (fino a 5)
 */
function fetchUrl(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
        'Accept-Encoding': 'identity',
      },
      timeout: 8000,
    }, (res) => {
      // Follow redirects
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && maxRedirects > 0) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
          const u = new URL(url);
          redirectUrl = `${u.protocol}//${u.host}${redirectUrl}`;
        }
        return fetchUrl(redirectUrl, maxRedirects - 1).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function stripTags(html) {
  return (html || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

// ── Analisi testo ──
function analyzeText(text, oemCode) {
  const tl = text.toLowerCase();

  let make = null;
  for (const b of BRANDS) {
    if (tl.includes(b.toLowerCase())) {
      make = b;
      if (make === 'VW') make = 'Volkswagen';
      if (make === 'Mercedes') make = 'Mercedes-Benz';
      break;
    }
  }

  let model = null;
  if (make) {
    const ml = make.toLowerCase().replace('-benz', '').replace('-', '.');
    const pats = [
      new RegExp(`${ml}[\\s-]+((?:serie|class[ea]?)\\s*\\d[\\w]*)`, 'i'),
      new RegExp(`${ml}[\\s-]+([A-Z]\\d{2,3}[a-z]?)\\b`, 'i'),
      new RegExp(`${ml}[\\s-]+(\\d{3}[a-z]?)\\b`, 'i'),
      new RegExp(`${ml}[\\s-]+([A-Z][a-z]{2,15})(?:[\\s,;(]|$)`, 'i'),
      /\(([A-Z]\d{2,3})\)/,
    ];
    for (const p of pats) {
      const m = text.match(p);
      if (m && m[1] && m[1].length >= 2 && m[1].length <= 30) {
        model = m[1].trim();
        break;
      }
    }
  }

  const years = [];
  const rangeM = text.match(/((?:19|20)\d{2})\s*[-–]\s*((?:19|20)\d{2})/);
  if (rangeM) { years.push(parseInt(rangeM[1]), parseInt(rangeM[2])); }
  else {
    const ym = text.match(/\b((?:19|20)\d{2})\b/);
    if (ym) { const y = parseInt(ym[1]); if (y >= 1985 && y <= 2027) years.push(y); }
  }

  let category = null;
  for (const [pats, cat] of Object.entries(CATEGORIES)) {
    if (pats.split('|').some(p => tl.includes(p))) { category = cat; break; }
  }

  const positions = [];
  for (const [pats, pos] of Object.entries(POSITIONS)) {
    if (pats.split('|').some(p => tl.includes(p))) { positions.push(pos); }
  }

  // Build clean name
  let name = text.split(/[|•\n]/)[0]
    .replace(new RegExp(oemCode, 'gi'), '')
    .replace(/\b(?:oem|originale|nuovo|new|compatib\w+|ricambio|spare|part|auto|car|pezzo|acquist\w+|compra|buy|shop|search|cerca)\b/gi, '')
    .replace(/\b\d{8,}\b/g, '')
    .replace(/https?:\S+/g, '')
    .replace(/[(){}\[\]]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (name.length > 90) name = name.substring(0, 90).replace(/\s\w*$/, '');

  if (name.length < 6) {
    const parts = [];
    if (category) parts.push(category);
    if (positions.length) parts.push(positions.join(' '));
    if (make) parts.push(make);
    if (model) parts.push(model);
    name = parts.join(' ') || `Ricambio ${oemCode}`;
  }

  name = name.charAt(0).toUpperCase() + name.slice(1);

  return {
    name, category,
    position: positions.length > 0 ? positions.join(' ') : null,
    vehicle_compatibility: make ? { make, model, year_from: years[0] || null, year_to: years[1] || null } : null,
  };
}

// ── Scrape eBay IT ──
async function scrapeEbayIT(oemCode) {
  const url = `https://www.ebay.it/sch/i.html?_nkw=${encodeURIComponent(oemCode)}&_sacat=131090&_sop=12`;
  console.log(`[OEM] eBay IT: ${url}`);
  const html = await fetchUrl(url);
  const results = [];

  // eBay titoli: class="s-item__title"
  const titleRegex = /<(?:h3|span)[^>]*class="[^"]*s-item__title[^"]*"[^>]*>([\s\S]*?)<\/(?:h3|span)>/gi;
  const priceRegex = /class="[^"]*s-item__price[^"]*"[^>]*>([\s\S]*?)<\//gi;
  const imgRegex = /<img[^>]*class="[^"]*s-item__image-img[^"]*"[^>]*src="([^"]+)"/gi;

  const titles = [], prices = [], images = [];

  let m;
  while ((m = titleRegex.exec(html)) !== null) titles.push(stripTags(m[1]));
  while ((m = priceRegex.exec(html)) !== null) prices.push(stripTags(m[1]));
  while ((m = imgRegex.exec(html)) !== null) images.push(m[1]);

  for (let i = 0; i < Math.min(titles.length, 8); i++) {
    const title = titles[i];
    if (!title || title.length < 10 || title.includes('Risultati') || title.includes('Shop on eBay')) continue;

    const info = analyzeText(title, oemCode);
    const priceStr = prices[i] || '';
    const priceMatch = priceStr.match(/(\d+)[.,](\d{2})/);
    const price = priceMatch ? parseFloat(`${priceMatch[1]}.${priceMatch[2]}`) : null;

    results.push({
      ...info,
      oem_code: oemCode,
      description: title,
      image: images[i] || null,
      suggested_price: price,
      _source: 'web_ai',
      _sourceSite: 'eBay IT',
    });
  }

  console.log(`[OEM] eBay IT: ${results.length} risultati`);
  return results;
}

// ── Scrape Google ──
async function scrapeGoogle(oemCode) {
  const q = encodeURIComponent(`${oemCode} ricambio auto OEM`);
  const url = `https://www.google.com/search?q=${q}&hl=it&num=8`;
  console.log(`[OEM] Google: ${url}`);
  const html = await fetchUrl(url);
  const results = [];

  // Google search results: <h3 class="...">Title</h3> followed by snippet
  const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
  const snippetRegex = /<div[^>]*class="[^"]*VwiC3b[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;

  const h3s = [], snippets = [];
  let m;
  while ((m = h3Regex.exec(html)) !== null) h3s.push(stripTags(m[1]));
  while ((m = snippetRegex.exec(html)) !== null) snippets.push(stripTags(m[1]));

  // Combina titoli e snippet
  for (let i = 0; i < Math.min(h3s.length, 6); i++) {
    const title = h3s[i];
    if (!title || title.length < 8) continue;
    // Skip titoli che sono solo URL o nomi di siti
    if (/^(www\.|http|google|traduz)/i.test(title)) continue;

    const fullText = `${title} ${snippets[i] || ''}`;
    const info = analyzeText(fullText, oemCode);

    // Solo se ha trovato qualcosa di utile
    if (info.name && info.name.length > 8 && info.name !== `Ricambio ${oemCode}`) {
      results.push({
        ...info,
        oem_code: oemCode,
        description: snippets[i] || title,
        image: null,
        suggested_price: null,
        _source: 'web_ai',
        _sourceSite: 'Google',
      });
    }
  }

  console.log(`[OEM] Google: ${results.length} risultati`);
  return results;
}

// ── Scrape AutoDoc ──
async function scrapeAutoDoc(oemCode) {
  const url = `https://www.autodoc.it/ricerca?search=${encodeURIComponent(oemCode)}`;
  console.log(`[OEM] AutoDoc: ${url}`);
  const html = await fetchUrl(url);
  const results = [];

  // JSON-LD
  const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1]);
      const items = data['@graph'] || (Array.isArray(data) ? data : [data]);
      for (const item of items) {
        if (item['@type'] === 'Product' && item.name) {
          const info = analyzeText(item.name + ' ' + (item.description || ''), oemCode);
          results.push({
            ...info,
            oem_code: oemCode,
            description: item.description || item.name,
            image: typeof item.image === 'string' ? item.image : (item.image?.url || null),
            suggested_price: item.offers?.price ? parseFloat(item.offers.price) : null,
            _source: 'web_ai',
            _sourceSite: 'AutoDoc',
          });
        }
      }
    } catch { /* ignore */ }
  }

  // Fallback: meta title + description
  if (results.length === 0) {
    const titleM = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const descM = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
    const combined = `${stripTags(titleM?.[1] || '')} ${descM?.[1] || ''}`;

    if (combined.length > 20) {
      const info = analyzeText(combined, oemCode);
      if (info.name && info.name !== `Ricambio ${oemCode}` && info.name.length > 10) {
        // Cerca immagini prodotto
        const imgM = html.match(/<img[^>]*src="(https:\/\/[^"]*(?:cdn|media|img)[^"]*\.(?:jpg|png|webp)[^"]*)"/i);
        results.push({
          ...info,
          oem_code: oemCode,
          description: descM?.[1] || info.name,
          image: imgM?.[1] || null,
          suggested_price: null,
          _source: 'web_ai',
          _sourceSite: 'AutoDoc',
        });
      }
    }
  }

  console.log(`[OEM] AutoDoc: ${results.length} risultati`);
  return results;
}

// ── Score e ranking ──
function scoreAndRank(candidates, oemCode) {
  const scored = candidates.map(c => {
    let score = 0;
    if (c.name && c.name.length > 15 && c.name !== `Ricambio ${oemCode}`) score += 25;
    if (c.name && c.name.length > 30) score += 10;
    if (c.category) score += 15;
    if (c.position) score += 10;
    if (c.vehicle_compatibility?.make) score += 15;
    if (c.vehicle_compatibility?.model) score += 20;
    if (c.vehicle_compatibility?.year_from) score += 10;
    if (c.image) score += 10;
    if (c.suggested_price) score += 5;

    const genericWords = ['ricambio', 'auto', 'pezzo', 'parte', 'search', 'cerca', 'risultat', 'accessori', 'moto', 'shop'];
    const nameWords = c.name.toLowerCase().split(/\s+/);
    const gc = nameWords.filter(w => genericWords.includes(w)).length;
    score -= gc * 10;

    if (c.description?.includes(oemCode)) score += 5;

    return { ...c, _score: Math.max(0, score) };
  });

  scored.sort((a, b) => b._score - a._score);

  const unique = [];
  const seen = new Set();
  for (const c of scored) {
    const key = c.name.toLowerCase().replace(/\s+/g, ' ').trim().substring(0, 40);
    if (!seen.has(key)) { seen.add(key); unique.push(c); }
  }

  return unique;
}

/**
 * Registra IPC handlers per spare parts OEM lookup
 */
function registerSparePartsIpc(handleSafe) {
  handleSafe('spare-parts:oem-lookup', async (oemCode) => {
    console.log(`[OEM Lookup] Ricerca per: ${oemCode}`);

    const sources = await Promise.allSettled([
      scrapeEbayIT(oemCode),
      scrapeGoogle(oemCode),
      scrapeAutoDoc(oemCode),
    ]);

    const all = [];
    const sourceNames = ['eBay IT', 'Google', 'AutoDoc'];

    sources.forEach((r, i) => {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        all.push(...r.value);
        console.log(`[OEM] ${sourceNames[i]}: ${r.value.length} risultati`);
      } else {
        console.warn(`[OEM] ${sourceNames[i]}: errore -`, r.reason?.message || 'nessun dato');
      }
    });

    if (all.length === 0) {
      console.warn(`[OEM] Nessun risultato per ${oemCode}`);
      return { candidates: [], code: oemCode };
    }

    const ranked = scoreAndRank(all, oemCode);
    console.log(`[OEM] ${ranked.length} candidati finali (top score: ${ranked[0]?._score})`);

    return { candidates: ranked.slice(0, 8), code: oemCode };
  });
}

module.exports = { registerSparePartsIpc };
