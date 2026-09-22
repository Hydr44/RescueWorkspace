/**
 * PM2 — Client Backup (istanza singola, fork).
 * Config da /root/.env (SUPABASE_* + R2_*). Avvio:
 *   cd /opt/client-backup && npm install --production
 *   pm2 start ecosystem.config.js && pm2 save
 */
module.exports = {
  apps: [{
    name: 'client-backup',
    script: './server.js',
    cwd: __dirname,
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '400M',
    env: { NODE_ENV: 'production' },
    error_file: '/var/log/pm2/client-backup-error.log',
    out_file: '/var/log/pm2/client-backup-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }],
};
