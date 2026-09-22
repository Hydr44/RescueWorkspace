// PM2 staging per il messaging-server.
// Gira con cwd /opt/staging; pm2 inietta il Supabase STAGING (da
// /opt/staging/.env.staging). Le credenziali WhatsApp + MESSAGING_TRIGGER_KEY
// arrivano da /root/.env via dotenv nel server.js (dotenv NON sovrascrive le env
// gia' impostate da pm2, quindi SUPABASE_URL resta quello staging).
//
// Avvio:  pm2 start /opt/staging/moduli/messaging/ecosystem.staging.config.js
const fs = require('fs');

const env = {};
try {
  const raw = fs.readFileSync('/opt/staging/.env.staging', 'utf8');
  raw.split('\n').forEach((line) => {
    const t = line.trim();
    if (t && !t.startsWith('#')) {
      const [k, ...v] = t.split('=');
      if (k && v.length) env[k.trim()] = v.join('=').trim();
    }
  });
} catch (e) {
  console.error('[staging ecosystem] impossibile leggere /opt/staging/.env.staging:', e.message);
}

module.exports = {
  apps: [
    {
      name: 'staging-messaging-server',
      script: './moduli/messaging/server.js',
      cwd: '/opt/staging',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'staging',
        MESSAGING_PORT: 4120,
        SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
      },
    },
  ],
};
