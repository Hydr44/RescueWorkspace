/**
 * PM2 — VPS Control API (istanza singola, fork).
 * Legge la config da /root/.env (VPS_CONTROL_TOKEN, SUPABASE_*).
 *
 * Avvio:
 *   cd /opt/vps-control && npm install --production
 *   pm2 start ecosystem.config.js && pm2 save
 */
module.exports = {
  apps: [
    {
      name: 'vps-control',
      script: './server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '150M',
      env: { NODE_ENV: 'production' },
      error_file: '/var/log/pm2/vps-control-error.log',
      out_file: '/var/log/pm2/vps-control-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
