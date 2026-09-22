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
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));

// ─── Auth Middleware (VPS API Key) ───
const VPS_API_KEY = process.env.VPS_API_KEY || process.env.SDI_API_KEY;

function requireApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== VPS_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: invalid API key' });
  }
  next();
}

// Protect all /api routes (eccetto webhooks pubblici, montati su /webhooks)
app.use('/api', requireApiKey);

// ─── Public webhooks (no api-key, verifica firma upstream) ───
const { createCalendlyWebhookRouter } = require('./routes/calendly');
app.use('/webhooks', createCalendlyWebhookRouter(supabase));
app.use('/webhooks', require('./routes/gocardless').createGoCardlessWebhookRouter(supabase));

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
const activateRoutes = require('./routes/activate');
const emailRoutes = require('./routes/email');
const appointmentsRoutes = require('./routes/appointments');
const { createCalendlyAuthRouter } = require('./routes/calendly');

app.use('/api/leads', demoRoutes(supabase));
app.use('/api/leads', quotesRoutes(supabase));
app.use('/api/leads', convertRoutes(supabase));
app.use('/api/leads', activateRoutes(supabase));
app.use('/api/leads', require('./routes/gocardless').createGoCardlessRouter(supabase));
app.use('/api/leads', emailRoutes(supabase));
app.use('/api/leads', appointmentsRoutes(supabase));
app.use('/api/leads', createCalendlyAuthRouter(supabase));
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

// Follow-up: ogni giorno alle 8:30 (prima dell'inizio lavoro)
cron.schedule('30 8 * * 1-5', async () => {
  console.log('[CRON] Generating follow-up tasks...');
  try {
    // Chiama direttamente la logica via fetch interno (riusa stessa key)
    const r = await fetch(`http://localhost:${PORT}/api/cron/generate-followups`, {
      method: 'POST',
      headers: { 'x-api-key': VPS_API_KEY, 'Content-Type': 'application/json' },
    });
    const data = await r.json();
    if (data.success) {
      console.log(`[CRON-FU] Created: ${JSON.stringify(data.stats)}`);
    } else {
      console.error('[CRON-FU] Failed:', data.error);
    }
  } catch (err) {
    console.error('[CRON-FU] Error:', err.message);
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
