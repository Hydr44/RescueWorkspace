/**
 * Fonti normative ufficiali monitorate.
 *
 * mode 'links': estrae gli <a> il cui href (assoluto) contiene `match`,
 *   costruendo una mappa { url -> titolo }. Le voci NUOVE rispetto all'ultimo
 *   controllo diventano la notifica ("nuovo manuale / nuova nota"). Ideale per
 *   pagine server-rendered con elenchi di link puliti (RENTRI, FatturaPA).
 *
 * mode 'text': normalizza il testo visibile (eventualmente del solo `selector`)
 *   e ne calcola un hash. Qualsiasi variazione genera una notifica. Fallback
 *   per pagine prive di una lista di link affidabile.
 *
 * Nota: per le pagine client-rendered (caricate via JS) l'estrazione link può
 * restituire 0 voci — in quel caso il monitor non azzera lo stato e logga un
 * warning, così sai che quella fonte va riconfigurata (vedi README).
 */
module.exports = [
  // ── RENTRI ──────────────────────────────────────────────────────────────
  {
    id: 'rentri-novita',
    group: 'RENTRI',
    label: 'RENTRI · Novità',
    url: 'https://www.rentri.gov.it/news',
    mode: 'links',
    match: '/news/',
  },
  {
    id: 'rentri-manuali',
    group: 'RENTRI',
    label: 'RENTRI · Manuali, guide e decreti',
    url: 'https://www.rentri.gov.it/decreti-direttoriali/istruzioni-manuali-e-guide-sintetiche',
    mode: 'links',
    match: '/decreti-direttoriali/istruzioni-manuali-e-guide-sintetiche/',
  },
  {
    // Changelog tecnico delle API di Interoperabilità (PRODUZIONE). Il contenuto
    // sta nel .md grezzo (la pagina /docs?page=... è client-rendered/inutile).
    // mode 'changelog' parsifica i rilasci `## 🗓️ DD/MM/YYYY`: ogni nuovo
    // rilascio = una voce → email + elenco in admin panel.
    id: 'rentri-changelog-prod',
    group: 'RENTRI',
    label: 'RENTRI · Changelog API Interoperabilità (produzione)',
    url: 'https://api.rentri.gov.it/docs/changelog-prod.md',
    linkBase: 'https://api.rentri.gov.it/docs?page=changelog-prod',
    mode: 'changelog',
  },

  // ── SDI / FatturaPA ─────────────────────────────────────────────────────
  {
    id: 'sdi-documentazione',
    group: 'SDI / FatturaPA',
    label: 'SDI · Documentazione Sistema di Interscambio (specifiche tecniche)',
    url: 'https://www.fatturapa.gov.it/it/norme-e-regole/DocumentazioneSDI/',
    mode: 'links',
    match: '/export/documenti/',
  },
  {
    id: 'sdi-novita',
    group: 'SDI / FatturaPA',
    label: 'SDI · Novità',
    url: 'https://www.fatturapa.gov.it/it/news/index.html',
    mode: 'links',
    match: '/it/news/',
  },

  // ── RVFU (Registro Veicoli Fuori Uso) ────────────────────────────────────
  // Pagina "Documenti" del Portale del Trasporto (Liferay, server-rendered):
  // memorandum di rilascio, informative e certificati. `match: '/content/id/'`
  // prende solo i documenti veri; `stripQuery` rimuove la query di redirect
  // volatile. NB: è la pagina dell'anno corrente più recente — quando uscirà
  // l'anno nuovo, aggiornare l'URL all'eventuale nuova pagina.
  {
    id: 'rvfu-documenti',
    group: 'RVFU',
    label: 'RVFU · Portale del Trasporto — Documenti',
    url: 'https://www.ilportaledeltrasporto.it/web/ptr/78',
    mode: 'links',
    match: '/content/id/',
    stripQuery: true,
  },
];
