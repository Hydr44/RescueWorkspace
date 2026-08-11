/**
 * PM2 — Usage Alerts (istanza singola).
 *
 * IMPORTANTE: instances:1 + fork. In cluster il cron partirebbe su più worker
 * e invierebbe email duplicate. Va eseguito in UN SOLO ambiente (produzione).
 *
 * Credenziali (SUPABASE_*, SMTP_*) e override (USAGE_ALERTS_*) sono lette da
 * /root/.env dal server stesso — qui non serve replicarle.
 *
 * Avvio una tantum sul VPS:
 *   cd /opt/usage-alerts && npm install --production
 *   pm2 start ecosystem.config.js && pm2 save
 */
module.exports = {
  apps: [
    {
      name: 'usage-alerts',
      script: './server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/pm2/usage-alerts-error.log',
      out_file: '/var/log/pm2/usage-alerts-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
