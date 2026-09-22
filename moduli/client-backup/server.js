/**
 * RescueManager — Client Backup (VPS)
 *
 * Ogni notte esporta i dati di ogni organizzazione (non-demo) e li salva su R2
 * in una cartella per cliente e per data, con retention. Gemello di
 * regulatory-monitor / usage-alerts (stessa infra pm2 + node-cron).
 *
 * Istanza singola (fork). Config da /root/.env: SUPABASE_* + R2_*.
 * Override: BACKUP_SCHEDULE, BACKUP_TZ, BACKUP_RETENTION_DAYS, BACKUP_PREFIX.
 *
 * Test:  npm run dry   (elenca org/tabelle, NON scrive su R2)
 *        npm run run-once  (esegue subito il backup completo)
 */
require('dotenv').config({ path: process.env.ENV_FILE || '/root/.env' });

const SCHEDULE = process.env.BACKUP_SCHEDULE || '0 3 * * *';
const TZ = process.env.BACKUP_TZ || 'Europe/Rome';

const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'].filter((k) => !process.env[k]);
if (missing.length) {
  console.error('[backup] Variabili mancanti: ' + missing.join(', ') + '. Esco.');
  process.exit(1);
}

const cron = require('node-cron');
const { runBackup } = require('./lib/backup');

async function main() {
  if (process.env.RUN_ONCE === 'true') {
    try {
      await runBackup({ dry: process.env.DRY_RUN === 'true' });
      process.exit(0);
    } catch (e) {
      console.error('[backup] Errore:', e);
      process.exit(1);
    }
    return;
  }

  if (!cron.validate(SCHEDULE)) {
    console.error(`[backup] BACKUP_SCHEDULE non valido: "${SCHEDULE}". Esco.`);
    process.exit(1);
  }

  console.log(`[backup] Avviato. Schedule "${SCHEDULE}" (${TZ}).`);
  if (process.env.BACKUP_RUN_ON_START === 'true') {
    runBackup({ dry: false }).catch((e) => console.error('[backup] Errore avvio:', e.message));
  }

  cron.schedule(
    SCHEDULE,
    () => {
      console.log(`[backup] Tick ${new Date().toISOString()}`);
      runBackup({ dry: false }).catch((e) => console.error('[backup] Errore:', e.message));
    },
    { timezone: TZ }
  );
}

main().catch((e) => {
  console.error('[backup] Errore fatale:', e);
  process.exit(1);
});
