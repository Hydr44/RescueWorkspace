/**
 * RescueManager Lead Management API - VPS Server
 * 
 * Gestisce operazioni pesanti per i lead:
 * - Attivazione demo account (crea utente + org)
 * - Creazione preventivi (+ PDF)
 * - Invio email preventivi
 * - Conversione post-pagamento
 * - Cron job scadenze
 * 
 * Porta: 3006
 * Auth: x-api-key header (VPS_API_KEY)
 */

require('dotenv').config({ path: '/root/.env' });
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.LEAD_API_PORT || 3006;

// ─── Supabase Admin Client ───
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Middleware ───
app.use(cors());
app.use(express.json());

// ─── Auth Middleware (VPS API Key) ───
const VPS_API_KEY = process.env.VPS_API_KEY || process.env.SDI_API_KEY;

function requireApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== VPS_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: invalid API key' });
  }
  next();
}

// Protect all /api routes
app.use('/api', requireApiKey);

// ─── Health Check ───
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'lead-api',
    port: PORT,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ─── Routes ───
const demoRoutes = require('./routes/demo');
const quotesRoutes = require('./routes/quotes');
const convertRoutes = require('./routes/convert');
const cronRoutes = require('./routes/cron');

app.use('/api/leads', demoRoutes(supabase));
app.use('/api/leads', quotesRoutes(supabase));
app.use('/api/leads', convertRoutes(supabase));
app.use('/api/cron', cronRoutes(supabase));

// ─── Cron Jobs ───

// Scadenza demo: ogni ora
cron.schedule('0 * * * *', async () => {
  console.log('[CRON] Checking expired demos...');
  try {
    const { data, error } = await supabase.rpc('expire_demo_accounts');
    if (error) throw error;
    const count = data?.[0]?.expired_count || 0;
    if (count > 0) console.log(`[CRON] Expired ${count} demo accounts`);
  } catch (err) {
    console.error('[CRON] Error expiring demos:', err.message);
  }
});

// Scadenza preventivi: ogni giorno alle 9:00
cron.schedule('0 9 * * *', async () => {
  console.log('[CRON] Checking expired quotes...');
  try {
    const { data, error } = await supabase.rpc('expire_quotes');
    if (error) throw error;
    const count = data?.[0]?.expired_count || 0;
    if (count > 0) console.log(`[CRON] Expired ${count} quotes`);
  } catch (err) {
    console.error('[CRON] Error expiring quotes:', err.message);
  }
});

// ─── Error Handler ───
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ─── Start ───
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[LEAD-API] Server running on port ${PORT}`);
  console.log(`[LEAD-API] API Key configured: ${VPS_API_KEY ? 'yes' : 'NO - WARNING!'}`);
});
