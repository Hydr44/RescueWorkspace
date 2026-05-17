/**
 * Calendly Integration
 *
 * 1. POST /api/leads/:id/appointments/calendly-invite
 *    Invia link Calendly al lead usando il template brandato + crea appointment
 *    placeholder (status='proposed', source='calendly', meeting_url=calendlyUrl).
 *
 * 2. POST /api/webhooks/calendly (no auth via api-key, verifica firma Calendly)
 *    Riceve eventi da Calendly:
 *      - invitee.created  → aggiorna appointment con scheduled_at + meeting_url +
 *                          status='confirmed' + invia email conferma brandata
 *      - invitee.canceled → status='cancelled' + log
 *
 *    Configurazione Calendly:
 *      1. https://calendly.com/integrations/webhooks
 *      2. Crea webhook con URL: https://api.rescuemanager.eu/lead-api/api/webhooks/calendly
 *      3. Eventi: invitee.created, invitee.canceled
 *      4. Salva signing_key in env CALENDLY_WEBHOOK_SECRET
 */

const express = require('express');
const crypto = require('node:crypto');
const { sendEmail, buildBookingLinkEmail, buildAppointmentConfirmationEmail } = require('../lib/email');

const CALENDLY_SECRET = process.env.CALENDLY_WEBHOOK_SECRET || '';

function isValidCalendlyPayload(parsed) {
  // Fallback validation quando manca signing_key (piani trial Calendly).
  // Verifica struttura: deve avere event valido + payload con almeno email invitee.
  if (!parsed || typeof parsed !== 'object') return false;
  if (typeof parsed.event !== 'string') return false;
  if (!['invitee.created', 'invitee.canceled', 'invitee.rescheduled'].includes(parsed.event)) return false;
  const p = parsed.payload;
  if (!p || typeof p !== 'object') return false;
  // Calendly include sempre invitee con email (nella struttura più recente)
  const email = p?.invitee?.email || p?.scheduled_event?.invitees?.[0]?.email || p?.email;
  return typeof email === 'string' && email.includes('@');
}

function verifyCalendlySignature(rawBody, signatureHeader) {
  if (!CALENDLY_SECRET) {
    console.warn('[calendly-webhook] CALENDLY_WEBHOOK_SECRET non configurato — uso fallback structural validation');
    return 'fallback';
  }
  if (!signatureHeader) return false;
  try {
    // Calendly signature format: "t=<timestamp>,v1=<hmac_hex>"
    const parts = Object.fromEntries(
      signatureHeader.split(',').map(p => {
        const [k, v] = p.split('=');
        return [k, v];
      })
    );
    if (!parts.t || !parts.v1) return false;
    const payload = `${parts.t}.${rawBody}`;
    const expected = crypto.createHmac('sha256', CALENDLY_SECRET).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(parts.v1), Buffer.from(expected));
  } catch (e) {
    console.error('[calendly-webhook] signature error:', e.message);
    return false;
  }
}

// Router AUTENTICATO — montato sotto /api/leads
function createCalendlyAuthRouter(supabase) {
  const router = express.Router();

  // ─── 1. Invia link Calendly (autenticato via x-api-key) ───────────────
  router.post('/:id/appointments/calendly-invite', async (req, res) => {
    try {
      const leadId = req.params.id;
      const { custom_message, duration, staff_id } = req.body;

      // Carica settings + lead
      const [{ data: settings }, { data: lead }] = await Promise.all([
        supabase.from('lead_automation_settings').select('calendly_url,appointment_duration_default_minutes').eq('id', 1).maybeSingle(),
        supabase.from('leads').select('id,name,email,company').eq('id', leadId).single(),
      ]);

      const calendlyUrl = settings?.calendly_url;
      if (!calendlyUrl) {
        return res.status(400).json({ error: 'URL Calendly non configurato. Impostalo in Settings → Calendly.' });
      }
      if (!lead?.email) {
        return res.status(400).json({ error: 'Lead senza email' });
      }

      const apptDuration = duration || settings?.appointment_duration_default_minutes || 30;

      // Crea appointment placeholder
      const { data: appt, error: apptErr } = await supabase.from('lead_appointments').insert({
        lead_id: leadId,
        appointment_type: 'demo_call',
        title: 'Demo RescueManager (Calendly)',
        description: `Link Calendly inviato il ${new Date().toLocaleString('it-IT')} — in attesa di prenotazione`,
        duration_minutes: apptDuration,
        meeting_mode: 'video',
        meeting_url: calendlyUrl,
        status: 'proposed',
        external_provider: 'calendly',
        created_by: staff_id || null,
      }).select().single();
      if (apptErr) return res.status(500).json({ error: apptErr.message });

      // Build email con template brandato
      const built = buildBookingLinkEmail({
        name: lead.name,
        companyName: lead.company,
        appointmentType: 'demo_call',
        duration: apptDuration,
        bookingUrl: calendlyUrl,
        customMessage: custom_message,
      });

      await sendEmail({ to: lead.email, subject: 'Prenota la demo RescueManager', html: built.html, text: built.text });

      // Log email_campaigns
      await supabase.from('email_campaigns').insert({
        lead_id: leadId,
        to_email: lead.email,
        subject: 'Prenota la demo RescueManager',
        body_html: built.html,
        body_text: built.text,
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_by: staff_id || null,
      });

      res.json({ success: true, appointment: appt });
    } catch (err) {
      console.error('[calendly-invite] error:', err);
      res.status(500).json({ error: 'Errore interno', details: err.message });
    }
  });

  return router;
}

// Router PUBBLICO — montato su /webhooks (NO api-key, ma verifica HMAC Calendly)
function createCalendlyWebhookRouter(supabase) {
  const router = express.Router();

  // ─── 2. Webhook Calendly (pubblico, firma HMAC) ───────────────────────
  // NOTA: app.use(express.json()) globale ha già parsato req.body in oggetto.
  // Per verifica HMAC firma (quando signing_key disponibile in piani Teams+)
  // serve riserializzare il body — accettabile perché Calendly stesso usa JSON.stringify
  // dei valori, ma in produzione enterprise andrebbe spostato il webhook PRIMA di express.json().
  router.post('/calendly', async (req, res) => {
    const event = req.body;
    const sig = req.headers['calendly-webhook-signature'];

    let sigCheck = 'fallback';
    if (CALENDLY_SECRET) {
      const rawBody = JSON.stringify(event);
      sigCheck = verifyCalendlySignature(rawBody, sig);
      if (sigCheck === false) {
        console.warn('[calendly-webhook] signature invalida');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    } else {
      console.warn('[calendly-webhook] CALENDLY_WEBHOOK_SECRET non configurato — fallback structural validation');
    }

    if (!event || typeof event !== 'object') {
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    // Quando manca signing_key (piani trial), verifica struttura payload come fallback
    if (sigCheck === 'fallback' && !isValidCalendlyPayload(event)) {
      console.warn('[calendly-webhook] fallback structural validation failed');
      return res.status(400).json({ error: 'Invalid payload structure' });
    }

    const eventType = event?.event;
    const payload = event?.payload;
    if (!eventType || !payload) {
      return res.status(400).json({ error: 'Malformed event' });
    }

    console.log('[calendly-webhook] received:', eventType);

    try {
      if (eventType === 'invitee.created') {
        await handleInviteeCreated(supabase, payload);
      } else if (eventType === 'invitee.canceled') {
        await handleInviteeCanceled(supabase, payload);
      } else {
        console.log('[calendly-webhook] ignored event type:', eventType);
      }
      res.json({ received: true });
    } catch (err) {
      console.error('[calendly-webhook] processing error:', err);
      // Restituiamo 200 comunque per non far ritentare in loop a Calendly
      res.json({ received: true, error: err.message });
    }
  });

  return router;
}

module.exports = { createCalendlyAuthRouter, createCalendlyWebhookRouter };

// ──────────────────────────────────────────────────────────────────────
async function handleInviteeCreated(supabase, payload) {
  // payload contiene: invitee.email, invitee.name, event_type, event (con start_time, end_time, location)
  const invitee = payload?.invitee || payload?.scheduled_event?.invitees?.[0] || {};
  const eventData = payload?.scheduled_event || payload?.event || {};
  const inviteeEmail = invitee.email || payload.email;
  const startTime = eventData.start_time || payload.event_start_time;
  const endTime = eventData.end_time || payload.event_end_time;
  const eventUri = eventData.uri || payload.event_uri;
  const joinUrl = eventData.location?.join_url || eventData.location?.location || null;
  const eventTypeName = eventData.name || 'Demo';

  if (!inviteeEmail) {
    console.warn('[calendly-webhook] invitee.created senza email');
    return;
  }
  if (!startTime) {
    console.warn('[calendly-webhook] invitee.created senza start_time');
    return;
  }

  // Trova lead per email
  const { data: lead } = await supabase
    .from('leads')
    .select('id, name, email, company')
    .ilike('email', inviteeEmail)
    .maybeSingle();

  if (!lead) {
    console.warn('[calendly-webhook] nessun lead per email:', inviteeEmail);
    // Salva comunque un log activity senza lead_id sarà skipped
    return;
  }

  // Trova appointment placeholder Calendly per questo lead
  const { data: existing } = await supabase
    .from('lead_appointments')
    .select('id, status, scheduled_at')
    .eq('lead_id', lead.id)
    .eq('external_provider', 'calendly')
    .in('status', ['proposed', 'pending_lead_booking', 'rescheduled'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const updateData = {
    scheduled_at: startTime,
    scheduled_until: endTime || null,
    status: 'confirmed',
    meeting_url: joinUrl || undefined,
    external_event_id: eventUri || null,
    confirmed_by_lead_at: new Date().toISOString(),
  };

  let apptId;
  if (existing) {
    await supabase.from('lead_appointments').update(updateData).eq('id', existing.id);
    apptId = existing.id;
  } else {
    // Crea nuovo appointment (lead ha prenotato Calendly direttamente, magari fuori dal flow admin)
    const { data: newAppt } = await supabase.from('lead_appointments').insert({
      lead_id: lead.id,
      appointment_type: 'demo_call',
      title: eventTypeName,
      duration_minutes: endTime ? Math.round((new Date(endTime) - new Date(startTime)) / 60000) : 30,
      meeting_mode: 'video',
      external_provider: 'calendly',
      ...updateData,
    }).select('id').single();
    apptId = newAppt?.id;
  }

  // Log activity per la timeline lead (visibile in admin)
  try {
    await supabase.from('lead_activities').insert({
      lead_id: lead.id,
      activity_type: 'appointment_confirmed_by_lead',
      title: `Cliente ha prenotato Calendly — ${new Date(startTime).toLocaleDateString('it-IT', { day:'2-digit', month:'short' })} ore ${new Date(startTime).toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' })}`,
      description: `Slot scelto via Calendly: ${eventTypeName}`,
      performed_by_type: 'lead',
      related_quote_id: null,
      metadata: { appointment_id: apptId, start_time: startTime, calendly_event_uri: eventUri, join_url: joinUrl },
    });
  } catch (e) {
    console.warn('[calendly-webhook] activity log failed:', e.message);
  }

  // Aggiorna lead.last_activity_at
  try {
    await supabase.from('leads').update({
      last_activity_at: new Date().toISOString(),
    }).eq('id', lead.id);
  } catch {}

  // Invia email conferma brandata al cliente
  if (lead.email) {
    try {
      const built = buildAppointmentConfirmationEmail({
        name: lead.name,
        title: eventTypeName,
        scheduledAt: startTime,
        durationMinutes: endTime ? Math.round((new Date(endTime) - new Date(startTime)) / 60000) : 30,
        meetingMode: 'video',
        meetingUrl: joinUrl,
        publicUrl: null,
      });
      await sendEmail({
        to: lead.email,
        subject: `Appuntamento confermato — ${new Date(startTime).toLocaleDateString('it-IT', { day:'2-digit', month:'long' })}`,
        html: built.html,
        text: built.text,
      });

      await supabase.from('email_campaigns').insert({
        lead_id: lead.id,
        to_email: lead.email,
        subject: `Appuntamento confermato`,
        body_html: built.html,
        body_text: built.text,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('[calendly-webhook] conferma email error:', e.message);
    }
  }

  console.log('[calendly-webhook] appointment processed:', apptId, 'for lead:', lead.id);
}

async function handleInviteeCanceled(supabase, payload) {
  const invitee = payload?.invitee || payload?.scheduled_event?.invitees?.[0] || {};
  const eventData = payload?.scheduled_event || payload?.event || {};
  const inviteeEmail = invitee.email || payload.email;
  const eventUri = eventData.uri || payload.event_uri;
  const cancelReason = payload.cancel_reason || payload.canceled_by || 'Annullato via Calendly';

  if (!inviteeEmail) return;

  const { data: lead } = await supabase
    .from('leads').select('id, name').ilike('email', inviteeEmail).maybeSingle();
  if (!lead) return;

  // Trova appointment per event_uri se possibile, altrimenti per lead+calendly
  let q = supabase.from('lead_appointments').select('id, title')
    .eq('lead_id', lead.id).eq('external_provider', 'calendly');
  if (eventUri) q = q.eq('external_event_id', eventUri);
  const { data: appts } = await q.order('created_at', { ascending: false }).limit(1);
  const appt = appts?.[0];
  if (!appt) return;

  await supabase.from('lead_appointments').update({
    status: 'cancelled',
    cancellation_reason: cancelReason,
  }).eq('id', appt.id);

  await supabase.from('lead_activities').insert({
    lead_id: lead.id,
    activity_type: 'appointment_cancelled_by_lead',
    title: `Cliente ha cancellato via Calendly: ${appt.title}`,
    description: cancelReason,
    performed_by_type: 'lead',
    metadata: { appointment_id: appt.id, event_uri: eventUri },
  });

  console.log('[calendly-webhook] cancelled appointment:', appt.id);
}
