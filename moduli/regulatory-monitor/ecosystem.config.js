/**
 * PM2 — Regulatory Monitor (istanza singola).
 *
 * IMPORTANTE: instances:1 + fork. In cluster il cron partirebbe su più worker
 * e invierebbe email duplicate. Va eseguito in UN SOLO ambiente (di norma
 * produzione) per lo stesso motivo.
 *
 * `cwd: __dirname` rende la config indipendente dal path assoluto di deploy.
 * Credenziali (SUPABASE_*, SMTP_*) e override (MONITOR_*) sono lette da
 * /root/.env dal server stesso — qui non serve replicarle.
 *
 * Avvio una tantum sul VPS:
 *   cd <path>/moduli/regulatory-monitor && npm install --production
 *   pm2 start ecosystem.config.js && pm2 save
 */
module.exports = {
  apps: [
    {
      name: 'regulatory-monitor',
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
      error_file: '/var/log/pm2/regulatory-monitor-error.log',
      out_file: '/var/log/pm2/regulatory-monitor-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
