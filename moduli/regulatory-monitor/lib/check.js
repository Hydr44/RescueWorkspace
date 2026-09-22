/**
 * Orchestrazione del controllo: per ogni fonte confronta lo stato corrente con
 * l'ultimo salvato e raccoglie le novità. Al PRIMO controllo di una fonte
 * registra solo la baseline (nessuna email, per evitare un flood iniziale).
 */
const SOURCES = require('../sources');
const { fetchHtml, extractLinks, extractText, parseChangelog, sha256 } = require('./fetcher');
const { getState, saveState, logEvent } = require('./store');
const { sendEmail, buildUpdateEmail } = require('./email');

// Modalità "a elenco" (un array ordinato di voci): links + changelog.
const LIST_MODES = new Set(['links', 'changelog']);

// Salva lo stato per le fonti a elenco e ritorna le voci NUOVE rispetto all'ultima volta.
async function saveItemsState(src, items, prev, now) {
  const prevList = Array.isArray(prev?.items) ? prev.items : null;
  const prevUrls = new Set(prevList ? prevList.map((i) => i.url) : []);
  const baseline = !prevList;
  const added = prevList ? items.filter((i) => !prevUrls.has(i.url)) : [];

  const sortedUrls = items.map((i) => i.url).sort((a, b) => a.localeCompare(b));
  await saveState({
    source_id: src.id, group_label: src.group, label: src.label, url: src.url,
    items,
    signature: sha256(sortedUrls.join('|')),
    last_checked_at: now,
    last_changed_at: added.length ? now : prev?.last_changed_at || null,
    last_error: null,
  });

  return { src, added, baseline };
}

async function checkSource(src) {
  const prev = await getState(src.id);
  const html = await fetchHtml(src.url);
  const now = new Date().toISOString();

  if (LIST_MODES.has(src.mode)) {
    const items =
      src.mode === 'changelog'
        ? parseChangelog(html, src.linkBase || src.url)
        : extractLinks(html, src.url, src.match, src.stripQuery);

    // 0 voci = pagina client-rendered o formato cambiato: non azzerare lo stato.
    if (items.length === 0) {
      console.warn(`[CHECK] ${src.id}: 0 voci estratte (formato/JS? vedi README)`);
      await saveState({
        source_id: src.id, group_label: src.group, label: src.label, url: src.url,
        last_checked_at: now, last_error: 'no_items_extracted',
      });
      return { src, added: [], baseline: false, note: 'no_items' };
    }

    return saveItemsState(src, items, prev, now);
  }

  // mode 'text'
  const text = extractText(html, src.selector);
  const sig = sha256(text);
  const baseline = !prev?.signature;
  const changed = !!(prev?.signature && prev.signature !== sig);

  await saveState({
    source_id: src.id, group_label: src.group, label: src.label, url: src.url,
    signature: sig,
    last_checked_at: now,
    last_changed_at: changed ? now : prev?.last_changed_at || null,
    last_error: null,
  });

  return { src, changed, baseline };
}

async function runCheck({ to }) {
  console.log(`[CHECK] Avvio controllo di ${SOURCES.length} fonti...`);
  const changes = [];

  for (const src of SOURCES) {
    try {
      const r = await checkSource(src);

      if (r.baseline) {
        console.log(`[CHECK] ${src.id}: baseline registrata (nessuna notifica)`);
        continue;
      }

      if (LIST_MODES.has(src.mode) && r.added?.length) {
        console.log(`[CHECK] ${src.id}: ${r.added.length} nuove voci`);
        changes.push({ group: src.group, label: src.label, url: src.url, added: r.added });
        await logEvent({
          source_id: src.id, group_label: src.group, label: src.label, url: src.url,
          added: r.added, summary: `${r.added.length} nuove voci`, detected_at: new Date().toISOString(),
        });
      } else if (src.mode === 'text' && r.changed) {
        console.log(`[CHECK] ${src.id}: contenuto pagina modificato`);
        changes.push({ group: src.group, label: src.label, url: src.url, added: [] });
        await logEvent({
          source_id: src.id, group_label: src.group, label: src.label, url: src.url,
          summary: 'contenuto pagina modificato', detected_at: new Date().toISOString(),
        });
      } else {
        console.log(`[CHECK] ${src.id}: nessuna novità`);
      }
    } catch (err) {
      console.error(`[CHECK] ${src.id}: errore — ${err.message}`);
      try {
        await saveState({
          source_id: src.id, group_label: src.group, label: src.label, url: src.url,
          last_checked_at: new Date().toISOString(), last_error: err.message,
        });
      } catch (e) {
        console.error(`[CHECK] ${src.id}: impossibile salvare l'errore — ${e.message}`);
      }
    }
  }

  if (changes.length) {
    const { subject, html, text } = buildUpdateEmail(changes);
    await sendEmail({ to, subject, html, text });
    console.log(`[CHECK] Notifica inviata a ${to} (${changes.length} font${changes.length === 1 ? 'e' : 'i'} con novità)`);
  } else {
    console.log('[CHECK] Nessuna novità — nessuna email inviata.');
  }

  return changes;
}

module.exports = { runCheck, checkSource };
