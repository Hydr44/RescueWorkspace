/**
 * RescueManager — Usage Alerts (VPS)
 *
 * Ogni giorno confronta il consumo di ciascuna organizzazione con i limiti
 * effettivi del piano e invia un'email di avviso "superamento morbido" quando
 * una metrica raggiunge l'80% e il 100%. NESSUN blocco: è solo un avviso.
 *
 * Metriche monitorate: archivio (storage), compilazioni automatiche, SMS,
 * budget Consulente IA. Anti-doppione via tabella `usage_alerts`
 * (una email per org × metrica × soglia × mese).
 *
 * Pianificazione: node-cron (default ogni giorno 07:00 Europe/Rome).
 * Notifiche: email via nodemailer (gateway SMTP Resend), come gli altri servizi.
 * Dati: Supabase prod (service_role, bypassa RLS).
 *
 * IMPORTANTE: una sola istanza (PM2 instances:1, fork), altrimenti il cron
 * parte su più worker e duplica gli invii.
 *
 * Variabili: riusa SUPABASE_* e SMTP_* da /root/.env (vedi .env.example).
 */
require('dotenv').config({ path: process.env.ENV_FILE || '/root/.env' });

const SCHEDULE = process.env.USAGE_ALERTS_SCHEDULE || '0 7 * * *';
const TZ = process.env.USAGE_ALERTS_TZ || 'Europe/Rome';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[USAGE] Mancano SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Esco.');
  process.exit(1);
}

const cron = require('node-cron');
const { runCheck } = require('./lib/check');

async function main() {
  // Esecuzione singola (test manuale / "npm run check" / "npm run dry"): controlla ed esce.
  if (process.env.RUN_ONCE === 'true') {
    try {
      await runCheck({ dry: process.env.DRY_RUN === 'true' });
      process.exit(0);
    } catch (err) {
      console.error('[USAGE] Errore nel controllo:', err);
      process.exit(1);
    }
    return;
  }

  if (!cron.validate(SCHEDULE)) {
    console.error(`[USAGE] USAGE_ALERTS_SCHEDULE non valido: "${SCHEDULE}". Esco.`);
    process.exit(1);
  }

  console.log(`[USAGE] Avviato. Schedule "${SCHEDULE}" (${TZ}).`);

  if (process.env.USAGE_ALERTS_RUN_ON_START === 'true') {
    console.log('[USAGE] Controllo iniziale (USAGE_ALERTS_RUN_ON_START)...');
    runCheck({ dry: false }).catch((e) => console.error('[USAGE] Errore controllo iniziale:', e.message));
  }

  cron.schedule(
    SCHEDULE,
    () => {
      console.log(`[USAGE] Tick ${new Date().toISOString()}`);
      runCheck({ dry: false }).catch((e) => console.error('[USAGE] Errore controllo:', e.message));
    },
    { timezone: TZ }
  );
}

main().catch((e) => {
  console.error('[USAGE] Errore fatale:', e);
  process.exit(1);
});
