// routes-oem-lookup.js
// Endpoint OEM Lookup - scraping server-side (no CORS)
// Deploy: copiare in /opt/rentri-api/routes/oem-lookup.js
// Poi in server.js: app.use('/api/oem-lookup', require('./routes/oem-lookup'));

const express = require('express');
const https = require('https');
const http = require('http');
const router = express.Router();

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
];
function randomUA() { return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]; }

// ── Marche auto ──
const BRANDS = [
  'Alfa Romeo','Mercedes-Benz','Mercedes','Land Rover',
  'Volkswagen','VW','BMW','Audi','Fiat','Lancia','Ford','Opel','Renault',
  'Peugeot','Citroen','Citroën','Toyota','Honda','Nissan','Mazda',
  'Hyundai','Kia','Volvo','Seat','Skoda','Škoda','Porsche',
  'Mini','Jeep','Jaguar','Suzuki','Mitsubishi',
  'Subaru','Dacia','Smart','Maserati','Ferrari','Lamborghini',
  'Iveco','Piaggio','Ducati'
];

// ── Categorie ricambi ──
const CATEGORIES = {
  'paraurti|bumper|stoßfänger|stossfanger': 'Carrozzeria',
  'faro|fanale|headlight|scheinwerfer|proiettore|feux': 'Illuminazione',
  'specchio|specchietto|mirror|spiegel|retrovisore|rétroviseur': 'Carrozzeria',
  'portiera|door|porta|tür|porte': 'Carrozzeria',
  'cofano|hood|bonnet|motorhaube|capot': 'Carrozzeria',
  'parafango|fender|wing|kotflügel|aile': 'Carrozzeria',
  'griglia|grill|grille|calandra|kühlergrill': 'Carrozzeria',
  'spoiler|minigonna|modanatura|trim|zierleiste': 'Carrozzeria',
  'filtro|filter': 'Manutenzione',
  'pastiglie|pastiglia|disco freno|brake pad|brake disc|bremse|bremsbelag': 'Freni',
  'ammortizzatore|shock|absorber|stoßdämpfer|molla|spring|feder': 'Sospensioni',
  'motore|engine|motor|testata|head gasket': 'Motore',
  'cambio|gearbox|transmission|frizione|clutch|kupplung': 'Trasmissione',
  'radiatore|radiator|intercooler|kühler': 'Raffreddamento',
  'alternatore|alternator|motorino avviamento|starter|anlasser': 'Elettrico',
  'cerchio|wheel|rim|felge|pneumatico|tire|reifen': 'Ruote',
  'vetro|cristallo|parabrezza|windshield|windschutzscheibe|lunotto': 'Vetri',
  'sedile|seat|sitz|airbag|cintura|belt|gurt|cruscotto|dashboard': 'Interni',
  'pompa acqua|water pump|pompa olio|oil pump|pompa freno': 'Pompe',
  'centralina|ecu|control unit|steuergerät|sensore|sensor': 'Elettronica',
  'scarico|exhaust|auspuff|marmitta|muffler|catalizzatore|catalyst': 'Scarico',
  'turbina|turbo|turbocharger|turbolader|compressore': 'Sovralimentazione'
};

// ── Posizioni ──
const POSITIONS = {
  'anteriore|front|vorne|davanti|ant\\.': 'anteriore',
  'posteriore|rear|hinten|dietro|post\\.': 'posteriore',
  'destro|right|rechts|dx|droit': 'destro',
  'sinistro|left|links|sx|gauche': 'sinistro',
  'superiore|upper|top|obere': 'superiore',
  'inferiore|lower|bottom|untere': 'inferiore',
  'centrale|center|central|mitte': 'centrale'
};

// ── Fetch con redirect ──
function fetchUrl(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: {
        'User-Agent': randomUA(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8,de;q=0.7',
        'Accept-Encoding': 'identity',
      },
      timeout: 10000,
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && maxRedirects > 0) {
        let rUrl = res.headers.location;
        if (rUrl.startsWith('/')) {
          const u = new URL(url);
          rUrl = `${u.protocol}//${u.host}${rUrl}`;
        }
        return fetchUrl(rUrl, maxRedirects - 1).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function strip(html) {
  return (html || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Traduzione EN→IT per parti auto ──
const PART_TRANSLATIONS = {
  'bumper': 'paraurti', 'bumper cover': 'copertura paraurti',
  'front bumper': 'paraurti anteriore', 'rear bumper': 'paraurti posteriore',
  'fender': 'parafango', 'hood': 'cofano', 'bonnet': 'cofano',
  'door': 'portiera', 'door panel': 'pannello portiera',
  'mirror': 'specchietto', 'side mirror': 'specchietto laterale', 'wing mirror': 'specchietto',
  'headlight': 'faro', 'headlamp': 'faro', 'tail light': 'fanale posteriore', 'taillight': 'fanale posteriore',
  'fog light': 'fendinebbia', 'fog lamp': 'fendinebbia',
  'grille': 'griglia', 'grill': 'griglia', 'radiator grille': 'griglia radiatore',
  'windshield': 'parabrezza', 'windscreen': 'parabrezza', 'rear window': 'lunotto',
  'brake disc': 'disco freno', 'brake rotor': 'disco freno', 'brake pad': 'pastiglia freno',
  'brake caliper': 'pinza freno', 'brake drum': 'tamburo freno',
  'shock absorber': 'ammortizzatore', 'shock': 'ammortizzatore',
  'spring': 'molla', 'coil spring': 'molla elicoidale', 'strut': 'montante ammortizzatore',
  'radiator': 'radiatore', 'intercooler': 'intercooler',
  'alternator': 'alternatore', 'starter': 'motorino avviamento', 'starter motor': 'motorino avviamento',
  'water pump': 'pompa acqua', 'oil pump': 'pompa olio', 'fuel pump': 'pompa carburante',
  'air filter': 'filtro aria', 'oil filter': 'filtro olio', 'fuel filter': 'filtro carburante',
  'spark plug': 'candela', 'ignition coil': 'bobina accensione',
  'clutch': 'frizione', 'clutch kit': 'kit frizione', 'flywheel': 'volano',
  'gearbox': 'cambio', 'transmission': 'trasmissione',
  'exhaust': 'scarico', 'muffler': 'marmitta', 'catalytic converter': 'catalizzatore',
  'turbo': 'turbina', 'turbocharger': 'turbina',
  'wheel': 'cerchio', 'rim': 'cerchio', 'tire': 'pneumatico', 'tyre': 'pneumatico',
  'seat': 'sedile', 'airbag': 'airbag', 'dashboard': 'cruscotto',
  'wiper': 'tergicristallo', 'wiper blade': 'spazzola tergicristallo',
  'belt': 'cinghia', 'timing belt': 'cinghia distribuzione', 'serpentine belt': 'cinghia servizi',
  'gasket': 'guarnizione', 'head gasket': 'guarnizione testata', 'seal': 'paraolio',
  'sensor': 'sensore', 'oxygen sensor': 'sonda lambda', 'abs sensor': 'sensore ABS',
  'control arm': 'braccio oscillante', 'tie rod': 'tirante sterzo', 'ball joint': 'giunto sferico',
  'cv joint': 'giunto omocinetico', 'axle': 'semiasse',
  'panel': 'pannello', 'trim': 'modanatura', 'cover': 'copertura', 'insert': 'inserto',
  'spoiler': 'spoiler', 'rocker panel': 'minigonna', 'side skirt': 'minigonna',
  'roof rail': 'barra tetto', 'roof rack': 'portapacchi',
  'battery': 'batteria', 'ecu': 'centralina', 'control unit': 'centralina',
  'thermostat': 'termostato', 'heater core': 'radiatore riscaldamento',
  'compressor': 'compressore', 'condenser': 'condensatore', 'evaporator': 'evaporatore',
  'lip splitter': 'splitter', 'splitter': 'splitter',
  'rotor': 'disco', 'disc': 'disco', 'pair': 'coppia',
};

// ── Analisi testo ──
function analyze(text, oemCode) {
  const tl = text.toLowerCase();

  // Marca
  let make = null;
  for (const b of BRANDS) {
    if (tl.includes(b.toLowerCase())) {
      make = b;
      if (make === 'VW') make = 'Volkswagen';
      if (make === 'Mercedes') make = 'Mercedes-Benz';
      break;
    }
  }

  // Modello
  let model = null;
  const NOT_MODELS = new Set([
    'bumper','cover','trim','panel','grille','grill','hood','fender','door',
    'mirror','light','lamp','brake','filter','gasket','seal','sensor','pump',
    'genuine','original','primed','front','rear','left','right','upper','lower',
    'insert','parts','part','deal','center','online','store','shop','order',
    'oem','pdc','lci','fits','ships','your','every','each','all','new','set',
    'disc','rotor','pair','kit','the','for','with','from','splitter','lip',
    'fog','used','auto','car','vehicle','item','brand','type','model'
  ]);
  if (make) {
    // 1. Codici chassis: E90, F30, G20, W204, etc.
    const chassisM = text.match(/\b([EFGW]\d{2,3})\b/);
    if (chassisM && !/^[EFG]\d{3}$/.test(chassisM[1])) {
      // Evita falsi positivi come E200, F150 che sono modelli non chassis
      model = chassisM[1];
    } else if (chassisM && /^[W]\d{3}$/.test(chassisM[1])) {
      model = chassisM[1]; // W-codes sono sempre chassis Mercedes
    }
    // 2. "Serie X", "Class X", "Classe"
    if (!model) {
      const serieM = text.match(/(?:serie|class[ea]?|series)\s*(\d[^\s,;)]*)/i);
      if (serieM) { model = 'Serie ' + serieM[1]; }
    }
    // 3. Modelli noti
    if (!model) {
      const knownModels = [
        'Golf','Polo','Passat','Tiguan','Touareg','T-Roc','T-Cross','Jetta','Caddy',
        'Punto','Panda','500','500X','500L','Tipo','Stilo','Bravo','Ducato','Doblo','Croma',
        'Focus','Fiesta','Mondeo','Kuga','Transit','EcoSport','Puma','Galaxy','S-Max',
        'Corsa','Astra','Insignia','Mokka','Zafira','Crossland','Grandland',
        'Clio','Megane','Scenic','Captur','Kadjar','Kangoo','Trafic','Master',
        'Giulietta','Giulia','Stelvio','Mito','159','147','156','166',
        'A1','A3','A4','A5','A6','A7','A8','Q2','Q3','Q5','Q7','Q8','TT','R8',
        'Cayenne','Macan','Boxster','Cayman','Panamera','911',
        'Cooper','Countryman','Clubman','Paceman',
        'Wrangler','Renegade','Compass','Cherokee','Grand Cherokee',
        'Qashqai','Juke','X-Trail','Micra','Leaf','Note','Navara',
        'Yaris','Corolla','RAV4','C-HR','Aygo','Land Cruiser','Hilux',
        'i10','i20','i30','Tucson','Kona','Santa Fe','ix35','ix20',
        'Sportage','Ceed','Niro','Picanto','Sorento','Stonic','Rio',
        'C3','C4','C5','Berlingo','Jumper','Jumpy','DS3','DS4','DS5','DS7',
        '108','208','308','508','2008','3008','5008','Partner','Expert','Boxer',
        'M3','M4','M5','M6','X1','X2','X3','X4','X5','X6','X7','Z4','i3',
        '316i','318i','320d','320i','325i','328i','330d','330i','335i','340i',
        '520d','520i','525d','530d','530i','535i','540i','550i',
        '116i','118d','118i','120d','120i','125i','130i','135i',
        'C180','C200','C220','C250','C300','C350','C63',
        'E200','E220','E250','E300','E350','E400','E63',
        'GLA','GLB','GLC','GLE','GLS','GLA200','GLC300',
        'Ypsilon','Delta','Musa','Thesis',
        'Ibiza','Leon','Ateca','Arona','Tarraco',
        'Fabia','Octavia','Superb','Kodiaq','Karoq','Kamiq','Scala',
        'V40','V60','V90','XC40','XC60','XC90','S60','S90',
        'Duster','Sandero','Logan','Spring','Jogger',
        'Fortwo','Forfour',
      ];
      // Modelli puramente numerici: solo per le marche corrette
      const numericModelBrands = {
        '108': 'Peugeot', '208': 'Peugeot', '308': 'Peugeot', '508': 'Peugeot',
        '2008': 'Peugeot', '3008': 'Peugeot', '5008': 'Peugeot',
        '500': 'Fiat', '500X': 'Fiat', '500L': 'Fiat',
        '147': 'Alfa Romeo', '156': 'Alfa Romeo', '159': 'Alfa Romeo', '166': 'Alfa Romeo',
        '911': 'Porsche',
      };
      for (const km of knownModels) {
        if (!tl.includes(km.toLowerCase())) continue;
        // Se modello numerico, verifica marca
        if (/^\d+[XL]?$/.test(km) && numericModelBrands[km] && numericModelBrands[km] !== make) continue;
        model = km; break;
      }
    }
    // 4. Fallback
    if (!model) {
      const ml = make.toLowerCase().replace(/-benz/i, '').replace(/-/g, '.').replace(/\s+/g, '.');
      const afterBrand = text.match(new RegExp(ml + '[\\s\\-]+([A-Z][a-z]{2,15})(?:[\\s,;(]|$)', 'i'));
      if (afterBrand && afterBrand[1] && !NOT_MODELS.has(afterBrand[1].toLowerCase())) {
        model = afterBrand[1].trim();
      }
    }
  }

  // Anni
  let yearFrom = null, yearTo = null;
  const rangeM = text.match(/((?:19|20)\d{2})\s*[-–]\s*((?:19|20)\d{2})/);
  if (rangeM) { yearFrom = parseInt(rangeM[1]); yearTo = parseInt(rangeM[2]); }
  else {
    const ym = text.match(/\b((?:19|20)\d{2})\b/);
    if (ym) { const y = parseInt(ym[1]); if (y >= 1985 && y <= 2027) yearFrom = y; }
  }

  // Categoria
  let category = null;
  for (const [pats, cat] of Object.entries(CATEGORIES)) {
    if (pats.split('|').some(p => tl.includes(p))) { category = cat; break; }
  }

  // Posizione
  const positions = [];
  for (const [pats, pos] of Object.entries(POSITIONS)) {
    if (pats.split('|').some(p => tl.includes(p))) positions.push(pos);
  }

  // ── Traduci parti EN→IT e costruisci nome italiano ──
  let partNameIT = null;
  // Cerca la traduzione più lunga che matcha (multi-word prima)
  const sortedTranslations = Object.entries(PART_TRANSLATIONS).sort((a, b) => b[0].length - a[0].length);
  for (const [en, it] of sortedTranslations) {
    if (tl.includes(en)) { partNameIT = it; break; }
  }

  // Costruisci nome italiano strutturato
  let name;
  const nameParts = [];
  if (partNameIT) {
    nameParts.push(partNameIT.charAt(0).toUpperCase() + partNameIT.slice(1));
  } else if (category) {
    nameParts.push(category);
  }
  if (positions.length && !partNameIT?.includes(positions[0])) {
    nameParts.push(positions.join(' '));
  }
  if (make) nameParts.push(make);
  if (model) nameParts.push(model);
  if (yearFrom && yearTo) nameParts.push(`(${yearFrom}-${yearTo})`);
  else if (yearFrom) nameParts.push(`(${yearFrom})`);

  if (nameParts.length >= 2) {
    name = nameParts.join(' ');
  } else {
    // Fallback: pulisci il testo originale
    name = text.split(/[|•\n\t]/)[0]
      .replace(new RegExp(oemCode, 'gi'), '')
      .replace(/\b\d{8,}\b/g, '')
      .replace(/https?:\S+/g, '')
      .replace(/[(){}\[\]<>#]/g, '')
      .replace(/\b(?:genuine|original|oem|new|buy|shop|order|free shipping|priced each|ships from|fits|replaces|your|every|discount|nationwide|delivery|guaranteed|up to|off on)\b/gi, '')
      .replace(/\s[-–]\s.*?(\.com|\.it|\.de|\.eu|Parts|eBay|Amazon|AliExpress).*$/i, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (name.length > 70) name = name.substring(0, 70).replace(/\s\w*$/, '');
    if (name.length < 6) name = 'Ricambio ' + oemCode;
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }

  return {
    name, category,
    position: positions.length > 0 ? positions.join(' ') : null,
    vehicle_compatibility: make ? { make, model, year_from: yearFrom, year_to: yearTo } : null,
  };
}

// ══════════════════════════════════════════════
//  FONTI SCRAPING
// ══════════════════════════════════════════════

async function scrapeEbay(code) {
  const url = `https://www.ebay.it/sch/i.html?_nkw=${encodeURIComponent(code)}&_sacat=131090&_sop=12`;
  console.log('[OEM] eBay fetch:', url);
  const html = await fetchUrl(url);
  const results = [];

  // Titoli
  const titleRx = /<(?:h3|span)[^>]*class="[^"]*s-item__title[^"]*"[^>]*>([\s\S]*?)<\/(?:h3|span)>/gi;
  const priceRx = /class="[^"]*s-item__price[^"]*"[^>]*>([\s\S]*?)<\//gi;
  const imgRx = /<img[^>]*src="(https:\/\/i\.ebayimg\.com\/[^"]+)"/gi;

  const titles = [], prices = [], images = [];
  let m;
  while ((m = titleRx.exec(html)) !== null) titles.push(strip(m[1]));
  while ((m = priceRx.exec(html)) !== null) prices.push(strip(m[1]));
  while ((m = imgRx.exec(html)) !== null) images.push(m[1]);

  for (let i = 0; i < Math.min(titles.length, 10); i++) {
    const t = titles[i];
    if (!t || t.length < 10 || /Risultati|Shop on eBay|Compra su eBay/i.test(t)) continue;
    const info = analyze(t, code);
    const pm = (prices[i] || '').match(/(\d+)[.,](\d{2})/);
    results.push({
      ...info, oem_code: code,
      description: t,
      image: images[i] || null,
      suggested_price: pm ? parseFloat(pm[1] + '.' + pm[2]) : null,
      _source: 'web_ai', _sourceSite: 'eBay',
    });
  }

  // Fallback: h3 con codice
  if (results.length === 0) {
    const h3Rx = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
    while ((m = h3Rx.exec(html)) !== null && results.length < 4) {
      const t = strip(m[1]);
      if (t.includes(code) && t.length > 15 && t.length < 200) {
        const info = analyze(t, code);
        results.push({ ...info, oem_code: code, description: t, image: null, suggested_price: null, _source: 'web_ai', _sourceSite: 'eBay' });
      }
    }
  }

  console.log(`[OEM] eBay: ${results.length} risultati`);
  return results;
}

function parseDDGHtml(html, code) {
  const results = [];
  const titleRx = /class="result__a"[^>]*>([^<]+)/gi;
  const snippetRx = /class="result__snippet"[^>]*>([\s\S]*?)(?:<\/a>|<\/td>)/gi;

  const titles = [], snippets = [];
  let m;
  while ((m = titleRx.exec(html)) !== null) {
    const t = strip(m[1]);
    if (t.length > 5) titles.push(t);
  }
  while ((m = snippetRx.exec(html)) !== null) {
    snippets.push(strip(m[1]));
  }

  for (let i = 0; i < Math.min(titles.length, 12); i++) {
    const t = titles[i];
    // Skip ads, pagine home generiche, siti spagnoli
    if (/^(Recambios|Búsqueda|Ayuda|Los Mejores|Más De|Auto Parts para|Recambios De Coche|AUTODOC Repuestos)/i.test(t)) continue;
    if (t.length < 12) continue;
    // Skip titoli che sono solo nomi di siti senza info specifiche
    if (/^(Catalogo ricambi|Negozio online|Ricambi auto online|Pezzi di ricambio originali)/i.test(t)) continue;

    const fullText = t + ' ' + (snippets[i] || '');
    const info = analyze(fullText, code);

    // SOLO se ha trovato marca o categoria specifica — altrimenti è generico
    const hasUsefulInfo = info.vehicle_compatibility?.make || info.category || 
      /bumper|fender|hood|door|mirror|grille|trim|cover|panel|lamp|light|brake|filter/i.test(fullText);
    
    if (hasUsefulInfo && info.name && info.name.length > 8 && info.name !== 'Ricambio ' + code) {
      results.push({
        ...info, oem_code: code,
        description: (snippets[i] || t).substring(0, 300),
        image: null, suggested_price: null,
        _source: 'web_ai', _sourceSite: 'DuckDuckGo',
      });
    }
  }
  return results;
}

async function scrapeDuckDuckGo(code) {
  // Cerca di capire la marca dal prefisso del codice OEM
  const brandPrefixes = {
    '511': 'BMW', '631': 'BMW', '413': 'BMW', '171': 'BMW',
    '1K0': 'Volkswagen', '5K0': 'Volkswagen', '3C0': 'Volkswagen',
    '8E0': 'Audi', '4F0': 'Audi', '8K0': 'Audi',
    '735': 'Fiat', '156': 'Alfa Romeo',
    '204': 'Mercedes', '212': 'Mercedes', 'A20': 'Mercedes',
    '620': 'Renault', '770': 'Renault',
    '966': 'Peugeot', '620': 'Peugeot',
  };
  const prefix = code.substring(0, 3);
  const guessedBrand = brandPrefixes[prefix] || null;

  // Query 1: solo codice OEM (risultati più specifici)
  const q1 = encodeURIComponent(code);
  // Query 2: codice + marca (se rilevata) o "part number"
  const q2extra = guessedBrand ? `${guessedBrand} ${code}` : `${code} part number`;
  const q2 = encodeURIComponent(q2extra);

  console.log(`[OEM] DuckDuckGo: query1="${code}" query2="${q2extra}"`);

  const [html1, html2] = await Promise.all([
    fetchUrl(`https://html.duckduckgo.com/html/?q=${q1}`),
    fetchUrl(`https://html.duckduckgo.com/html/?q=${q2}`),
  ]);

  const r1 = parseDDGHtml(html1, code);
  const r2 = parseDDGHtml(html2, code);

  // Unisci risultati, dedup per nome
  const all = [...r1, ...r2];
  const seen = new Set();
  const unique = [];
  for (const r of all) {
    const key = r.name.toLowerCase().substring(0, 40);
    if (!seen.has(key)) { seen.add(key); unique.push(r); }
  }

  console.log(`[OEM] DuckDuckGo: ${unique.length} risultati utili (q1: ${r1.length}, q2: ${r2.length})`);
  return unique;
}

async function scrapeAutoDoc(code) {
  const url = `https://www.autodoc.it/ricerca?search=${encodeURIComponent(code)}`;
  console.log('[OEM] AutoDoc fetch:', url);
  const html = await fetchUrl(url);
  const results = [];

  // JSON-LD
  const jsonRx = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = jsonRx.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1]);
      const items = data['@graph'] || (Array.isArray(data) ? data : [data]);
      for (const item of items) {
        if (item['@type'] === 'Product' && item.name) {
          const info = analyze(item.name + ' ' + (item.description || ''), code);
          results.push({
            ...info, oem_code: code,
            description: item.description || item.name,
            image: typeof item.image === 'string' ? item.image : (item.image?.url || null),
            suggested_price: item.offers?.price ? parseFloat(item.offers.price) : null,
            _source: 'web_ai', _sourceSite: 'AutoDoc',
          });
        }
      }
    } catch { /* ignore */ }
  }

  // Fallback: meta
  if (results.length === 0) {
    const titleM = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const descM = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
    const combined = strip(titleM?.[1] || '') + ' ' + (descM?.[1] || '');
    if (combined.length > 20) {
      const info = analyze(combined, code);
      if (info.name && info.name !== 'Ricambio ' + code && info.name.length > 10) {
        const imgM = html.match(/<img[^>]*src="(https:\/\/[^"]*(?:cdn|media|img)[^"]*\.(?:jpg|png|webp)[^"]*)"/i);
        results.push({
          ...info, oem_code: code,
          description: descM?.[1] || info.name,
          image: imgM?.[1] || null,
          suggested_price: null,
          _source: 'web_ai', _sourceSite: 'AutoDoc',
        });
      }
    }
  }

  console.log(`[OEM] AutoDoc: ${results.length} risultati`);
  return results;
}

// ── Scoring ──
function scoreAndRank(candidates, code) {
  const scored = candidates.map(c => {
    let score = 0;
    if (c.name && c.name.length > 15 && c.name !== 'Ricambio ' + code) score += 25;
    if (c.name && c.name.length > 30) score += 10;
    if (c.category) score += 15;
    if (c.position) score += 10;
    if (c.vehicle_compatibility?.make) score += 15;
    if (c.vehicle_compatibility?.model) score += 20;
    if (c.vehicle_compatibility?.year_from) score += 10;
    if (c.image) score += 10;
    if (c.suggested_price) score += 5;

    const bad = ['ricambio','auto','pezzo','parte','search','cerca','risultat','accessori','moto','shop','compra','acquista','prezzo'];
    const words = c.name.toLowerCase().split(/\s+/);
    score -= words.filter(w => bad.includes(w)).length * 10;

    if (c.description?.includes(code)) score += 5;
    return { ...c, _score: Math.max(0, score) };
  });

  scored.sort((a, b) => b._score - a._score);

  const unique = [];
  const seen = new Set();
  for (const c of scored) {
    const key = c.name.toLowerCase().replace(/\s+/g, ' ').trim().substring(0, 50);
    if (!seen.has(key)) { seen.add(key); unique.push(c); }
  }
  return unique;
}

// ══════════════════════════════════════════════
//  ENDPOINT
// ══════════════════════════════════════════════

// GET /api/oem-lookup?code=51117897147
router.get('/', async (req, res) => {
  const code = (req.query.code || '').trim();
  if (!code || code.length < 5) {
    return res.status(400).json({ error: 'Parametro code mancante o troppo corto' });
  }

  console.log(`\n[OEM Lookup] ========== Ricerca: ${code} ==========`);
  const start = Date.now();

  try {
    const sources = await Promise.allSettled([
      scrapeEbay(code),
      scrapeDuckDuckGo(code),
      scrapeAutoDoc(code),
    ]);

    const all = [];
    const names = ['eBay', 'DuckDuckGo', 'AutoDoc'];
    sources.forEach((r, i) => {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        all.push(...r.value);
      } else {
        console.warn(`[OEM] ${names[i]} errore:`, r.reason?.message || 'nessun dato');
      }
    });

    const ranked = scoreAndRank(all, code);
    const elapsed = Date.now() - start;

    console.log(`[OEM Lookup] ${ranked.length} candidati in ${elapsed}ms (top: ${ranked[0]?._score || 0})`);

    res.json({
      code,
      candidates: ranked.slice(0, 8),
      sources: names.map((n, i) => ({
        name: n,
        status: sources[i].status === 'fulfilled' ? 'ok' : 'error',
        count: sources[i].status === 'fulfilled' ? (sources[i].value?.length || 0) : 0,
      })),
      elapsed_ms: elapsed,
    });
  } catch (err) {
    console.error('[OEM Lookup] Errore:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
