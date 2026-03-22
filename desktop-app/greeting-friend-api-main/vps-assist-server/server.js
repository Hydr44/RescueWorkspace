// VPS Assist Server — /api/assist/* endpoints
// Standalone Express server for assistance_requests (posizione cliente)
// Deployed on VPS via PM2, proxied by Nginx at assist.rescuemanager.eu

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// ── Config ──
const PORT = process.env.PORT || 3100;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ASSIST_PUBLIC_URL = process.env.ASSIST_PUBLIC_URL || 'https://rescuemanager.eu';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('[assist-server] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SELECT_FIELDS = 'id, org_id, phone, note, token, url, status, lat, lng, accuracy, created_at, updated_at, received_at, closed_at';

// ── Helpers ──
function generateToken() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

function buildAssistUrl(token) {
  return `${ASSIST_PUBLIC_URL.replace(/\/+$/, '')}/assist/${token}`;
}

function sanitizePhone(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/[^0-9+]/g, '').slice(0, 32);
}

function sanitizeNote(input) {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  return trimmed.length ? trimmed.slice(0, 1000) : null;
}

// ── App ──
const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'assist-server', uptime: process.uptime() });
});

// ── POST /api/assist/create ──
app.post('/api/assist/create', async (req, res) => {
  try {
    const { phone, note, orgId, createdBy } = req.body || {};

    if (!orgId) {
      return res.status(400).json({ ok: false, error: 'orgId mancante' });
    }

    const token = generateToken();
    const url = buildAssistUrl(token);

    const insertPayload = {
      org_id: orgId,
      phone: sanitizePhone(phone) || '',
      note: sanitizeNote(note),
      token,
      url,
      status: 'pending',
    };

    if (createdBy) insertPayload.created_by = createdBy;

    const { data, error } = await supabase
      .from('assistance_requests')
      .insert(insertPayload)
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      console.error('[assist:create] supabase error:', error);
      return res.status(500).json({ ok: false, error: error.message });
    }

    res.json({ ok: true, token, url, request: data });
  } catch (err) {
    console.error('[assist:create] error:', err);
    res.status(500).json({ ok: false, error: 'Errore interno' });
  }
});

// ── GET /api/assist/list ──
app.get('/api/assist/list', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const orgId = req.query.orgId;
    const status = req.query.status;

    let query = supabase
      .from('assistance_requests')
      .select(SELECT_FIELDS)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (orgId) query = query.eq('org_id', orgId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) {
      console.error('[assist:list] supabase error:', error);
      return res.status(500).json({ ok: false, error: error.message });
    }

    res.json({ ok: true, rows: data || [] });
  } catch (err) {
    console.error('[assist:list] error:', err);
    res.status(500).json({ ok: false, error: 'Errore interno' });
  }
});

// ── GET /api/assist/by-token/:token ──
app.get('/api/assist/by-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ ok: false, error: 'Token mancante' });

    const { data, error } = await supabase
      .from('assistance_requests')
      .select(SELECT_FIELDS)
      .eq('token', token)
      .maybeSingle();

    if (error) {
      console.error('[assist:by-token] supabase error:', error);
      return res.status(500).json({ ok: false, error: error.message });
    }

    if (!data) return res.status(404).json({ ok: false, error: 'Richiesta non trovata' });

    res.json({ ok: true, row: data });
  } catch (err) {
    console.error('[assist:by-token] error:', err);
    res.status(500).json({ ok: false, error: 'Errore interno' });
  }
});

// ── POST /api/assist/update ──
app.post('/api/assist/update', async (req, res) => {
  try {
    const { token, lat, lng, accuracy } = req.body || {};

    if (!token) return res.status(400).json({ ok: false, error: 'Token mancante' });
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ ok: false, error: 'Coordinate non valide' });
    }

    const { data, error } = await supabase
      .from('assistance_requests')
      .update({
        lat,
        lng,
        accuracy: typeof accuracy === 'number' ? accuracy : null,
        status: 'located',
        received_at: new Date().toISOString(),
      })
      .eq('token', token)
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      console.error('[assist:update] supabase error:', error);
      return res.status(500).json({ ok: false, error: error.message });
    }

    if (!data) return res.status(404).json({ ok: false, error: 'Richiesta non trovata' });

    res.json({ ok: true, row: data });
  } catch (err) {
    console.error('[assist:update] error:', err);
    res.status(500).json({ ok: false, error: 'Errore interno' });
  }
});

// ── POST /api/assist/close ──
app.post('/api/assist/close', async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ ok: false, error: 'Token mancante' });

    const { data, error } = await supabase
      .from('assistance_requests')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('token', token)
      .select('id')
      .single();

    if (error) {
      console.error('[assist:close] supabase error:', error);
      return res.status(500).json({ ok: false, error: error.message });
    }

    if (!data) return res.status(404).json({ ok: false, error: 'Richiesta non trovata' });

    res.json({ ok: true });
  } catch (err) {
    console.error('[assist:close] error:', err);
    res.status(500).json({ ok: false, error: 'Errore interno' });
  }
});

// ── POST /api/assist/delete ──
app.post('/api/assist/delete', async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ ok: false, error: 'Token mancante' });

    const { error } = await supabase
      .from('assistance_requests')
      .delete()
      .eq('token', token);

    if (error) {
      console.error('[assist:delete] supabase error:', error);
      return res.status(500).json({ ok: false, error: error.message });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[assist:delete] error:', err);
    res.status(500).json({ ok: false, error: 'Errore interno' });
  }
});

// ── Start ──
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[assist-server] Listening on 127.0.0.1:${PORT}`);
  console.log(`[assist-server] Supabase URL: ${SUPABASE_URL}`);
  console.log(`[assist-server] Public URL: ${ASSIST_PUBLIC_URL}`);
});
