// electron/ipc-modules/sdi.js
// IPC: fogli di stile ufficiali Agenzia delle Entrate per la visualizzazione
// "a norma" delle fatture elettroniche (FatturaPA / ordinaria / semplificata).
//
// Strategia anti-bug:
//  1) cache locale in userData (offline-first, TTL 30 giorni)
//  2) download ufficiale (più URL candidati, primo 200 valido)
//  3) se la rete fallisce ma esiste una cache (anche scaduta) → usa quella
//  4) se tutto fallisce → ritorna null (il renderer userà il generatore legacy)

const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 giorni

// URL ufficiali. Più candidati per resilienza a cambi di path/versione AdE.
const SOURCES = {
  ordinaria: [
    'https://www.fatturapa.gov.it/export/documenti/fatturapa/v1.4/Foglio_di_stile_fattura_ordinaria_ver1.2.3.xsl',
    'https://www.fatturapa.gov.it/export/documenti/fatturapa/v1.2.1/Foglio_di_stile_fatturaordinaria_v1.2.1.xsl',
  ],
  pa: [
    'https://www.fatturapa.gov.it/export/documenti/fatturapa/v1.4/Foglio_di_stile_fatturaPA_v1.2.3.xsl',
    'https://www.fatturapa.gov.it/export/documenti/fatturapa/v1.2.1/Foglio_di_stile_fatturaPA_v1.2.1.xsl',
  ],
  semplificata: [
    'https://www.fatturapa.gov.it/export/documenti/fatturapa/v1.4/Foglio_di_stile_VFSM10_v1.0.2.xsl',
    'https://www.fatturapa.gov.it/export/documenti/fatturapa/v1.2.1/Foglio_di_stile_fattura_semplificata_v1.0.xsl',
  ],
};

function cacheDir() {
  const dir = path.join(app.getPath('userData'), 'sdi-xslt');
  try { fs.mkdirSync(dir, { recursive: true }); } catch { /* ignore */ }
  return dir;
}

function cacheFile(kind) {
  return path.join(cacheDir(), `${kind}.xsl`);
}

function readCache(kind) {
  try {
    const f = cacheFile(kind);
    const st = fs.statSync(f);
    const xsl = fs.readFileSync(f, 'utf8');
    if (!xsl || !xsl.includes('xsl:stylesheet')) return null;
    return { xsl, ageMs: Date.now() - st.mtimeMs };
  } catch { return null; }
}

function writeCache(kind, xsl) {
  try { fs.writeFileSync(cacheFile(kind), xsl, 'utf8'); } catch { /* ignore */ }
}

async function download(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
    if (!res.ok) return null;
    const txt = await res.text();
    // Validazione minima: deve essere un foglio di stile XSLT
    if (!txt || !txt.includes('xsl:stylesheet')) return null;
    return txt;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function registerSdiIpc(handleSafe) {
  // payload: { kind: 'ordinaria' | 'pa' | 'semplificata' }
  // ritorna: { xsl, source } | null
  handleSafe('sdi:get-stylesheet', async ({ kind } = {}) => {
    const k = ['ordinaria', 'pa', 'semplificata'].includes(kind) ? kind : 'ordinaria';

    const cached = readCache(k);
    if (cached && cached.ageMs < TTL_MS) {
      return { xsl: cached.xsl, source: 'cache' };
    }

    for (const url of SOURCES[k]) {
      const xsl = await download(url);
      if (xsl) {
        writeCache(k, xsl);
        return { xsl, source: 'network' };
      }
    }

    // Rete KO: meglio una cache scaduta che niente
    if (cached) return { xsl: cached.xsl, source: 'stale' };
    return null;
  });
}

module.exports = { registerSdiIpc };
