/**
 * PM2 — gps-retention (istanza singola).
 *
 * IMPORTANTE: instances:1 + fork. In cluster il cron partirebbe su piu worker
 * e cancellerebbe in parallelo sugli stessi blocchi.
 *
 * Credenziali (SUPABASE_*) lette da /root/.env dal server stesso.
 * Il termine di conservazione si imposta li: GPS_RETENTION_DAYS=90
 *
 * Avvio una tantum sul VPS:
 *   cd /opt/gps-retention && npm install --production
 *   npm run dry                      # PRIMA: conta e basta, non cancella
 *   pm2 start ecosystem.config.js && pm2 save
 */
module.exports = {
  apps: [
    {
      name: 'gps-retention',
      script: './server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: { NODE_ENV: 'production' },
      error_file: '/var/log/pm2/gps-retention-error.log',
      out_file: '/var/log/pm2/gps-retention-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
