// routes/gocardless.js
// GoCardless (addebito SEPA) come 2° metodo di incasso accanto a Stripe/esterno.
// Aggiunto 2026-06 (workstream Preventivo→Pagamento→Attivazione).
//
// Due router (come calendly):
//   - createGoCardlessRouter(supabase)        → protetto x-api-key, su /api/leads
//   - createGoCardlessWebhookRouter(supabase) → pubblico (firma HMAC), su /webhooks
//
// MVP senza modifiche schema: il preventivo si ritrova dai metadata GoCardless
// (lead_id/quote_id) e si marca pagato con le colonne ESISTENTI di lead_quotes,
// esattamente come record-payment. I soldi si muovono SOLO su /charge (azione
// deliberata dell'operatore). Se GOCARDLESS_ACCESS_TOKEN manca, gli endpoint
// rispondono 503 e il server NON si rompe.
//
// SICUREZZA: token e webhook secret SOLO da env (/root/.env). Token live = soldi
// veri: per i test usare un token sandbox (GOCARDLESS_ENVIRONMENT=sandbox).

const express = require('express');
const crypto = require('crypto');

const TOKEN = process.env.GOCARDLESS_ACCESS_TOKEN || '';
const WEBHOOK_SECRET = process.env.GOCARDLESS_WEBHOOK_SECRET || '';
const ENV = (process.env.GOCARDLESS_ENVIRONMENT || 'sandbox').toLowerCase();

let _client = null;
function getClient() {
  if (!TOKEN) return null;
  if (_client) return _client;
  const { GoCardlessClient } = require('gocardless-nodejs');
  const { Environments } = require('gocardless-nodejs/constants');
  _client = new GoCardlessClient(TOKEN, ENV === 'live' ? Environments.Live : Environments.Sandbox);
  return _client;
}

function notConfigured(res) {
  return res.status(503).json({ error: 'GoCardless non configurato sul server (GOCARDLESS_ACCESS_TOKEN mancante).' });
}

// ─── Router PROTETTO (x-api-key) — montato su /api/leads ───────────────────
function createGoCardlessRouter(supabase) {
  const router = express.Router();

  // 1) Avvia mandato SEPA: crea un redirect flow → ritorna redirect_url.
  //    Il chiamante (admin panel) conserva redirect_flow_id + session_token
  //    e li ripassa a /complete dopo la firma del cliente.
  router.post('/:id/quotes/:qid/gocardless/redirect-flow', async (req, res) => {
    const client = getClient();
    if (!client) return notConfigured(res);
    try {
      const { id: leadId, qid: quoteId } = req.params;
      const { email, given_name, family_name, success_redirect_url } = req.body || {};
      if (!success_redirect_url) {
        return res.status(400).json({ error: 'success_redirect_url richiesto (dove tornare dopo la firma).' });
      }
      const sessionToken = crypto.randomBytes(16).toString('hex');
      const rf = await client.redirectFlows.create({
        description: `RescueManager — preventivo ${String(quoteId).slice(0, 8)}`,
        session_token: sessionToken,
        success_redirect_url,
        prefilled_customer: {
          email: email || undefined,
          given_name: given_name || undefined,
          family_name: family_name || undefined,
        },
        metadata: { lead_id: String(leadId), quote_id: String(quoteId) },
      });
      res.json({ success: true, redirect_url: rf.redirect_url, redirect_flow_id: rf.id, session_token: sessionToken });
    } catch (err) {
      console.error('[gocardless] redirect-flow error:', err.message);
      res.status(502).json({ error: 'Errore creazione mandato GoCardless', details: err.message });
    }
  });

  // 2) Completa il redirect flow → ottiene mandate_id + customer_id.
  router.post('/:id/quotes/:qid/gocardless/complete', async (req, res) => {
    const client = getClient();
    if (!client) return notConfigured(res);
    try {
      const { redirect_flow_id, session_token } = req.body || {};
      if (!redirect_flow_id || !session_token) {
        return res.status(400).json({ error: 'redirect_flow_id e session_token richiesti.' });
      }
      const rf = await client.redirectFlows.complete(redirect_flow_id, { session_token });
      res.json({
        success: true,
        mandate_id: rf.links && rf.links.mandate,
        customer_id: rf.links && rf.links.customer,
      });
    } catch (err) {
      console.error('[gocardless] complete error:', err.message);
      res.status(502).json({ error: 'Errore completamento mandato GoCardless', details: err.message });
    }
  });

  // 3) Addebito: crea il pagamento (primo addebito) e, se auto_renew, una
  //    subscription ricorrente. ⚠️ MUOVE SOLDI se il token è live. L'esito
  //    "pagato" arriva via webhook (SEPA è asincrono).
  router.post('/:id/quotes/:qid/gocardless/charge', async (req, res) => {
    const client = getClient();
    if (!client) return notConfigured(res);
    try {
      const { id: leadId, qid: quoteId } = req.params;
      const { mandate_id, amount, currency, auto_renew, interval_unit } = req.body || {};
      if (!mandate_id || !amount) {
        return res.status(400).json({ error: 'mandate_id e amount (in centesimi) richiesti.' });
      }
      const cents = Math.round(Number(amount));
      const cur = (currency || 'EUR').toUpperCase();
      const meta = { lead_id: String(leadId), quote_id: String(quoteId) };

      const payment = await client.payments.create({
        amount: cents,
        currency: cur,
        links: { mandate: mandate_id },
        metadata: meta,
      });

      let subscription = null;
      if (auto_renew) {
        subscription = await client.subscriptions.create({
          amount: cents,
          currency: cur,
          name: `RescueManager abbonamento ${String(quoteId).slice(0, 8)}`,
          interval_unit: interval_unit === 'yearly' ? 'yearly' : 'monthly',
          links: { mandate: mandate_id },
          metadata: meta,
        });
      }

      res.json({
        success: true,
        payment_id: payment.id,
        payment_status: payment.status,
        subscription_id: subscription ? subscription.id : null,
        note: 'Addebito creato. L\'esito "pagato" arriva via webhook (SEPA asincrono).',
      });
    } catch (err) {
      console.error('[gocardless] charge error:', err.message);
      res.status(502).json({ error: 'Errore addebito GoCardless', details: err.message });
    }
  });

  return router;
}

// ─── Router PUBBLICO (webhook, firma HMAC) — montato su /webhooks ──────────
function verifySignature(rawBody, signatureHeader) {
  if (!WEBHOOK_SECRET || !signatureHeader || !rawBody) return false;
  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(signatureHeader)));
  } catch {
    return false;
  }
}

// Marca il preventivo PAGATO come fa record-payment (colonne esistenti).
async function markQuotePaid(supabase, quoteId, leadId, { paymentId, amountCents, mandateId }) {
  const { data: quote } = await supabase
    .from('lead_quotes').select('*').eq('id', quoteId).single();
  if (!quote) { console.warn('[gocardless-webhook] quote non trovato:', quoteId); return; }
  if (quote.status === 'activated' || quote.paid_at) return; // idempotente

  await supabase.from('lead_quotes').update({
    status: 'paid',
    paid_at: new Date().toISOString(),
    activation_pending: true,
    external_payment_reference: paymentId || null,
    external_payment_amount: amountCents != null ? amountCents / 100 : quote.monthly_total,
    external_payment_date: new Date().toISOString().split('T')[0],
    external_payment_notes: `GoCardless${mandateId ? ' (mandato ' + mandateId + ')' : ''}`,
    external_payment_recorded_at: new Date().toISOString(),
  }).eq('id', quoteId);

  try {
    await supabase.rpc('log_lead_activity', {
      p_lead_id: leadId || quote.lead_id,
      p_type: 'payment_received',
      p_title: 'Pagamento GoCardless ricevuto',
      p_description: `Importo: €${amountCents != null ? (amountCents / 100).toFixed(2) : quote.monthly_total} — ${paymentId || ''}`,
      p_performed_by: null,
      p_performed_by_type: 'system',
      p_metadata: { provider: 'gocardless', payment_id: paymentId, mandate_id: mandateId },
      p_related_quote_id: quoteId,
    });
  } catch (e) { console.warn('[gocardless-webhook] log_lead_activity:', e.message); }
  // F5: pagamento ok → lead in coda Revisione (guardato + idempotente).
  await supabase.from('leads').update({ status: 'in_verifica' }).eq('id', leadId || quote.lead_id).in('status', ['quote_sent','trattativa']);
  console.log('[gocardless-webhook] quote', quoteId, 'marcato paid');
}

function createGoCardlessWebhookRouter(supabase) {
  const router = express.Router();

  router.post('/gocardless', async (req, res) => {
    const sig = req.headers['webhook-signature'];
    const raw = req.rawBody; // catturato da express.json({ verify }) in server.js
    if (!verifySignature(raw, sig)) {
      console.warn('[gocardless-webhook] firma non valida');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    let events = [];
    try { events = (JSON.parse(raw.toString('utf8')) || {}).events || []; }
    catch { return res.status(400).json({ error: 'Invalid JSON' }); }

    const client = getClient();
    for (const ev of events) {
      try {
        if (ev.resource_type === 'payments' && ev.action === 'paid') {
          const paymentId = ev.links && ev.links.payment;
          let leadId = null, quoteId = null, amountCents = null, mandateId = null;
          if (client && paymentId) {
            const p = await client.payments.find(paymentId);
            quoteId = p.metadata && p.metadata.quote_id;
            leadId = p.metadata && p.metadata.lead_id;
            amountCents = p.amount;
            mandateId = p.links && p.links.mandate;
          }
          if (quoteId) await markQuotePaid(supabase, quoteId, leadId, { paymentId, amountCents, mandateId });
          else console.warn('[gocardless-webhook] payments.paid senza quote_id nei metadata:', paymentId);
        } else if (ev.resource_type === 'payments' && (ev.action === 'failed' || ev.action === 'cancelled')) {
          console.warn('[gocardless-webhook] pagamento', ev.action, ev.links && ev.links.payment);
        } else {
          // mandates.*, subscriptions.*, ... → log per ora
          console.log('[gocardless-webhook] evento', ev.resource_type, ev.action);
        }
      } catch (e) {
        console.error('[gocardless-webhook] processing error:', e.message);
      }
    }
    res.status(200).json({ received: true });
  });

  return router;
}

module.exports = { createGoCardlessRouter, createGoCardlessWebhookRouter };
