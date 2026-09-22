/**
 * RescueManager — Regulatory Monitor (VPS)
 *
 * Controlla periodicamente le fonti ufficiali RENTRI, SDI/FatturaPA e RVFU e
 * invia una email quando vengono pubblicate nuove note, manuali o specifiche.
 *
 * Pianificazione: node-cron (default ogni giorno alle 08:00 Europe/Rome).
 * Notifiche: email via nodemailer/Resend (info@rescuemanager.eu).
 * Stato: Supabase (regulatory_monitor_state / _events).
 *
 * IMPORTANTE: eseguire una sola istanza (PM2 instances:1, exec_mode 'fork'),
 * altrimenti il cron parte su più worker e duplica le email.
 *
 * Variabili: vedi .env.example. Riusa SUPABASE_* e SMTP_* da /root/.env.
 */
require('dotenv').config({ path: process.env.ENV_FILE || '/root/.env' });

const TO = process.env.MONITOR_EMAIL_TO || 'info@rescuemanager.eu';
const SCHEDULE = process.env.MONITOR_SCHEDULE || '0 8 * * *';
const TZ = process.env.MONITOR_TZ || 'Europe/Rome';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[REGWATCH] Mancano SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Esco.');
  process.exit(1);
}

const cron = require('node-cron');
const { runCheck } = require('./lib/check');

async function main() {
  // Esecuzione singola (test manuale / "npm run check"): controlla ed esce.
  if (process.env.RUN_ONCE === 'true') {
    try {
      await runCheck({ to: TO });
      process.exit(0);
    } catch (err) {
      console.error('[REGWATCH] Errore nel controllo:', err);
      process.exit(1);
    }
    return;
  }

  if (!cron.validate(SCHEDULE)) {
    console.error(`[REGWATCH] MONITOR_SCHEDULE non valido: "${SCHEDULE}". Esco.`);
    process.exit(1);
  }

  console.log(`[REGWATCH] Avviato. Schedule "${SCHEDULE}" (${TZ}). Notifiche a ${TO}.`);

  if (process.env.MONITOR_RUN_ON_START === 'true') {
    console.log('[REGWATCH] Controllo iniziale (MONITOR_RUN_ON_START)...');
    runCheck({ to: TO }).catch((e) => console.error('[REGWATCH] Errore controllo iniziale:', e.message));
  }

  cron.schedule(
    SCHEDULE,
    () => {
      console.log(`[REGWATCH] Tick ${new Date().toISOString()}`);
      runCheck({ to: TO }).catch((e) => console.error('[REGWATCH] Errore controllo:', e.message));
    },
    { timezone: TZ }
  );
}

main().catch((e) => {
  console.error('[REGWATCH] Errore fatale:', e);
  process.exit(1);
});
