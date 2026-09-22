/**
 * gps-retention — conservazione delle posizioni GPS degli autisti.
 *
 * Perché esiste (registro difetti, privacy P1): la tabella `transport_tracking`
 * accumulava dal 28 maggio 2026 senza nessun termine di conservazione e senza
 * nessun lavoro di pulizia. Sono dati di localizzazione di lavoratori
 * dipendenti: vanno cancellati dopo un termine definito e dichiarato.
 *
 * Cosa cancella: i punti GPS più vecchi di RETENTION_DAYS. Nient'altro — non
 * tocca i trasporti, né gli autisti, né le foto.
 *
 * Cosa NON si rompe (verificato sul codice il 3 settembre 2026):
 *   · La mappa live del desktop usa SOLO l'ultimo punto per trasporto, come
 *     marcatore "dov'è adesso". Il percorso disegnato NON viene dai punti GPS:
 *     è la rotta calcolata da OSRM fra ritiro e consegna.
 *   · La pagina pubblica /track del cliente serve durante l'intervento, che
 *     dura minuti. Un punto vecchio di mesi appartiene a un lavoro chiuso.
 *   · La diagnostica GPS in Impostazioni guarda solo i punti registrati DA
 *     QUANDO parte la verifica, cioè secondi prima.
 *   · Nessuna chiave esterna, nessuna vista, nessuna funzione dipende da
 *     questa tabella.
 * Quello che si perde davvero è la possibilità di ricostruire a posteriori
 * dove si trovava un mezzo in un certo giorno. È una scelta di conservazione,
 * non un effetto collaterale.
 *
 * Avvio:
 *   npm run dry     → conta e basta, NON cancella (fallo la prima volta)
 *   npm run check   → esegue una volta e termina
 *   npm start       → resta attivo e gira ogni notte
 */

require('dotenv').config({ path: process.env.ENV_FILE || '/root/.env' });
require('dotenv').config(); // fallback .env locale (sviluppo)

const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Termine di conservazione. È una DECISIONE DEL TITOLARE, non un default
// tecnico: deve coincidere con quanto dichiarato nell'informativa privacy.
const RETENTION_DAYS = Number(process.env.GPS_RETENTION_DAYS || 90);

// Ogni notte alle 03:30, dopo il backup per-cliente delle 03:00.
const SCHEDULE = process.env.GPS_RETENTION_CRON || '30 3 * * *';
const DRY_RUN = String(process.env.DRY_RUN || '') === 'true';
const RUN_ONCE = String(process.env.RUN_ONCE || '') === 'true';

// Cancelliamo a blocchi: una DELETE unica su una tabella grande terrebbe un
// lock lungo e farebbe crescere il WAL senza motivo.
const BLOCCO = 1000;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('[gps-retention] Manca SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!Number.isFinite(RETENTION_DAYS) || RETENTION_DAYS < 1) {
  console.error(`[gps-retention] GPS_RETENTION_DAYS non valido: ${process.env.GPS_RETENTION_DAYS}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ora = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
const log = (...a) => console.log(`[gps-retention ${ora()}]`, ...a);

function limite() {
  const d = new Date();
  d.setDate(d.getDate() - RETENTION_DAYS);
  return d.toISOString();
}

async function quantiDaCancellare(soglia) {
  const { count, error } = await supabase
    .from('transport_tracking')
    .select('id', { count: 'exact', head: true })
    .lt('recorded_at', soglia);
  if (error) throw error;
  return count || 0;
}

async function esegui() {
  const soglia = limite();
  const totale = await quantiDaCancellare(soglia);

  log(`conservazione ${RETENTION_DAYS} giorni · soglia ${soglia}`);

  if (totale === 0) {
    log('nessun punto più vecchio della soglia: niente da fare');
    return { cancellati: 0, totale: 0 };
  }

  if (DRY_RUN) {
    log(`PROVA A VUOTO: ci sarebbero ${totale} punti da cancellare. Non cancello niente.`);
    return { cancellati: 0, totale };
  }

  let cancellati = 0;
  // Si ripete finché il blocco torna vuoto: ogni giro prende i più vecchi.
  for (;;) {
    const { data: righe, error: errSel } = await supabase
      .from('transport_tracking')
      .select('id')
      .lt('recorded_at', soglia)
      .order('recorded_at', { ascending: true })
      .limit(BLOCCO);
    if (errSel) throw errSel;
    if (!righe || righe.length === 0) break;

    const ids = righe.map((r) => r.id);
    const { error: errDel } = await supabase.from('transport_tracking').delete().in('id', ids);
    if (errDel) throw errDel;

    cancellati += ids.length;
    log(`cancellati ${cancellati}/${totale}`);
    if (righe.length < BLOCCO) break;
  }

  log(`fatto: ${cancellati} punti rimossi`);
  return { cancellati, totale };
}

async function giro() {
  try {
    await esegui();
  } catch (err) {
    // Non usciamo dal processo: pm2 lo riavvierebbe e il prossimo giro è fra
    // 24 ore comunque. Meglio un errore a log che un servizio che rimbalza.
    console.error(`[gps-retention ${ora()}] errore:`, err.message || err);
  }
}

if (RUN_ONCE || DRY_RUN) {
  giro().then(() => process.exit(0));
} else {
  log(`avviato · pianificazione "${SCHEDULE}" · conservazione ${RETENTION_DAYS} giorni`);
  cron.schedule(SCHEDULE, giro, { timezone: 'Europe/Rome' });
}
