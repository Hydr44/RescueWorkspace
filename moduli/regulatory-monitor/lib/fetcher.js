/**
 * Fetch + estrazione contenuto dalle pagine normative.
 * Usa il fetch globale di Node (>=18) e cheerio per il parsing HTML.
 */
const cheerio = require('cheerio');
const crypto = require('node:crypto');

const UA =
  'RescueManager-RegWatch/1.0 (+https://rescuemanager.eu; info@rescuemanager.eu)';
const TIMEOUT_MS = 30000;

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'it-IT,it;q=0.9',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return await res.text();
}

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// Testo "generico" dei pulsanti (Leggi tutto, Scarica, ...): in questi casi
// l'anchor non è un titolo utile, meglio ricavarlo dallo slug dell'URL.
const GENERIC_TEXT_RE =
  /^(leggi|scarica|download|read more|vai|apri|continua|maggiori|dettagli|approfondisci|clicca|view|più|piu)\b/i;

function titleFromUrl(u) {
  try {
    const path = new URL(u).pathname.replace(/\/+$/, '');
    let seg = decodeURIComponent(path.split('/').findLast(Boolean) || '');
    seg = seg
      .replace(/\.(pdf|html?|aspx?|xml|zip)$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!seg) return u;
    return seg.charAt(0).toUpperCase() + seg.slice(1);
  } catch {
    return u;
  }
}

/**
 * Estrae un ARRAY ordinato [{ url, title }] dei link il cui href (risolto in
 * assoluto) contiene `match`. L'ordine segue il documento (in cima alle pagine
 * di news/manuali ci sono i più recenti) e va preservato: jsonb non conserva
 * l'ordine delle chiavi di un oggetto, quindi usiamo un array. Dedup per url
 * (tiene la prima occorrenza = più in alto). Scarta ancore, mailto e self-link.
 */
function extractLinks(html, pageUrl, match, stripQuery) {
  const $ = cheerio.load(html);
  const pageClean = pageUrl.split('#')[0];
  const seen = new Set();
  const items = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return;

    let abs;
    try {
      abs = new URL(href, pageUrl).toString();
    } catch {
      return;
    }
    // Per i portali Liferay l'URL del documento porta una query di redirect
    // enorme e volatile: con stripQuery teniamo solo path (.../content/id/NNN),
    // che è stabile e univoco — evita falsi "nuovo documento".
    let clean = abs.split('#')[0];
    if (stripQuery) clean = clean.split('?')[0];

    if (match && !clean.includes(match)) return;
    if (clean === pageClean) return; // ignora self-link
    if (seen.has(clean)) return;

    let title = $(el).text().replace(/\s+/g, ' ').trim();
    if (!title || title.length < 6 || GENERIC_TEXT_RE.test(title)) {
      title = titleFromUrl(clean);
    }
    if (!title) return;

    seen.add(clean);
    items.push({ url: clean, title });
  });

  return items;
}

/**
 * Restituisce il testo visibile normalizzato (eventualmente del solo
 * `selector`), pronto per l'hashing. Rimuove script/style/nav volatili.
 */
function extractText(html, selector) {
  const $ = cheerio.load(html);
  $('script, style, noscript, svg').remove();
  const root = selector && $(selector).length ? $(selector) : $('body');
  return root.text().replace(/\s+/g, ' ').trim();
}

/**
 * Parsifica un changelog markdown in stile RENTRI (api.rentri.gov.it).
 * Le voci di rilascio sono heading di 2° livello con una data, es:
 *   ## 🗓️ 19/05/2026
 *   ### formulari - v1.0.20260519
 *   ### Documentazione
 * Ritorna un ARRAY ordinato [{ url, title }] (più recenti in cima, come nel
 * file). `url` è univoco per rilascio (pagina changelog + ancora data), così
 * il diff per URL rileva i NUOVI rilasci. `linkBase` è la pagina human da
 * aprire (il .md è solo la sorgente dati).
 */
function parseChangelog(md, linkBase) {
  const dateRe = /^##\s+.*?(\d{2}\/\d{2}\/\d{4})/; // ## (emoji) DD/MM/YYYY
  const subRe = /^###\s+(.+?)\s*$/; //               ### servizio - vX  /  Documentazione
  const lines = md.split(/\r?\n/);
  const releases = [];
  let current = null;

  for (const line of lines) {
    const dm = dateRe.exec(line);
    if (dm) {
      if (current) releases.push(current);
      current = { date: dm[1], parts: [] };
      continue;
    }
    if (current) {
      const sm = subRe.exec(line);
      if (sm) {
        const part = sm[1].replace(/\s+/g, ' ').trim();
        if (part) current.parts.push(part);
      }
    }
  }
  if (current) releases.push(current);

  return releases.map((r) => {
    let detail = r.parts.join(', ');
    if (detail.length > 120) detail = detail.slice(0, 117) + '…';
    return {
      url: `${linkBase}#${r.date.replaceAll('/', '-')}`,
      title: `Rilascio ${r.date}${detail ? ' · ' + detail : ''}`,
    };
  });
}

module.exports = { fetchHtml, extractLinks, extractText, parseChangelog, sha256 };
