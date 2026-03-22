/**
 * Routes: Trasmissioni RENTRI + Polling Transazioni Asincrone
 * Mount su: /api/rentri
 * Endpoints esposti:
 *   GET  /trasmissioni            - lista trasmissioni per org
 *   POST /trasmissioni/:id/retry  - retry trasmissione fallita
 *   GET  /transazioni/:id/status  - stato transazione asincrona
 *   GET  /transazioni/:id/result  - risultato transazione asincrona
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/* ─── Helper: chiama RENTRI con JWT dal VPS ─── */
async function callRentriJWT(orgId, environment, method, path, body = null) {
  const { generateRentriJWT } = require('./jwt-helper');
  const baseUrl = environment === 'prod'
    ? 'https://api.rentri.gov.it'
    : 'https://demoapi.rentri.gov.it';

  const jwt = await generateRentriJWT(orgId, environment, method, path, body);

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.message || `HTTP ${res.status}`), { status: res.status, data });
  return data;
}

/* ══════════════════════════════════════════════════════════
   TRASMISSIONI - lista e retry
   ══════════════════════════════════════════════════════════ */

/**
 * GET /api/rentri/trasmissioni
 * Lista trasmissioni per l'organizzazione con filtri opzionali
 */
router.get('/trasmissioni', async (req, res) => {
  try {
    const { org_id, stato, tipo, limit = 100 } = req.query;
    if (!org_id) return res.status(400).json({ error: 'org_id mancante' });

    let query = supabase
      .from('rentri_trasmissioni')
      .select('*')
      .eq('org_id', org_id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (stato && stato !== 'all') query = query.eq('stato', stato);
    if (tipo && tipo !== 'all') query = query.eq('tipo', tipo);

    const { data, error } = await query;
    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error('[RENTRI-TRASMISSIONI] Errore lista:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/rentri/trasmissioni/:id/retry
 * Ripete una trasmissione fallita
 */
router.post('/trasmissioni/:id/retry', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: t, error } = await supabase
      .from('rentri_trasmissioni')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !t) return res.status(404).json({ error: 'Trasmissione non trovata' });

    const maxRetries = t.max_retries ?? 3;
    const retryCount = t.retry_count ?? 0;
    if (retryCount >= maxRetries) {
      return res.status(400).json({ error: `Massimo retry raggiunto (${maxRetries})` });
    }

    await supabase
      .from('rentri_trasmissioni')
      .update({
        stato: 'pending',
        retry_count: retryCount + 1,
        next_retry_at: null,
        errore: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    res.json({ success: true, message: 'Retry schedulato', retry_count: retryCount + 1 });
  } catch (err) {
    console.error('[RENTRI-TRASMISSIONI] Errore retry:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   TRANSAZIONI ASINCRONE - stato e risultato
   ══════════════════════════════════════════════════════════ */

/**
 * GET /api/rentri/transazioni/:transazione_id/status
 * Verifica stato transazione asincrona su RENTRI
 */
router.get('/transazioni/:transazione_id/status', async (req, res) => {
  try {
    const { transazione_id } = req.params;
    const { org_id, environment = 'demo', service = 'dati-registri' } = req.query;
    if (!org_id) return res.status(400).json({ error: 'org_id mancante' });

    const path = `/${service}/v1.0/${transazione_id}/status`;
    const result = await callRentriJWT(org_id, environment, 'GET', path);

    // Aggiorna stato in DB se terminata
    if (result.stato === 'completata' || result.stato === 'errore') {
      await supabase
        .from('rentri_trasmissioni')
        .update({
          stato: result.stato === 'completata' ? 'completed' : 'error',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('transazione_id', transazione_id)
        .eq('org_id', org_id);
    }

    res.json(result);
  } catch (err) {
    console.error('[RENTRI-TRANSAZIONI] Errore status:', err);
    res.status(err.status || 500).json({ error: err.message, details: err.data });
  }
});

/**
 * GET /api/rentri/transazioni/:transazione_id/result
 * Recupera risultato finale transazione asincrona
 */
router.get('/transazioni/:transazione_id/result', async (req, res) => {
  try {
    const { transazione_id } = req.params;
    const { org_id, environment = 'demo', service = 'dati-registri' } = req.query;
    if (!org_id) return res.status(400).json({ error: 'org_id mancante' });

    const path = `/${service}/v1.0/${transazione_id}/result`;
    const result = await callRentriJWT(org_id, environment, 'GET', path);

    const esito = result.esito === 'OK' ? 'completed' : 'error';
    await supabase
      .from('rentri_trasmissioni')
      .update({
        stato: esito,
        response: result,
        errore: esito === 'error' ? (result.messaggio || 'Errore RENTRI') : null,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('transazione_id', transazione_id)
      .eq('org_id', org_id);

    res.json(result);
  } catch (err) {
    console.error('[RENTRI-TRANSAZIONI] Errore result:', err);
    res.status(err.status || 500).json({ error: err.message, details: err.data });
  }
});

module.exports = router;
