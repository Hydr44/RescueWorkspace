/**
 * Appointments Routes
 *
 * GET    /api/leads/:id/appointments              Lista appuntamenti lead
 * POST   /api/leads/:id/appointments              Crea appuntamento (proposed/confirmed)
 * GET    /api/leads/:id/appointments/:aid         Dettaglio
 * PUT    /api/leads/:id/appointments/:aid         Aggiorna
 * DELETE /api/leads/:id/appointments/:aid         Cancella (status=cancelled)
 * POST   /api/leads/:id/appointments/:aid/send    Invia email lead con link booking
 * POST   /api/leads/:id/appointments/:aid/confirm Admin conferma slot manualmente
 *
 * Endpoint pubblico (no auth):
 *   GET  /api/appointments/public/:public_uuid           Vede dettagli + slot proposti
 *   POST /api/appointments/public/:public_uuid/confirm   Lead sceglie slot
 *   POST /api/appointments/public/:public_uuid/cancel    Lead annulla
 *
 * Note ICS:
 *   Genera attachment .ics on-demand quando invia email (RFC 5545).
 */

const express = require('express');
const { sendEmail, buildBookingLinkEmail, buildAppointmentConfirmationEmail } = require('../lib/email');

function pad(n) { return n.toString().padStart(2, '0'); }
function fmtICSDate(d) {
  const dt = new Date(d);
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth()+1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}${pad(dt.getUTCSeconds())}Z`;
}

function buildICS({ uid, start, end, title, description, location, organizerEmail }) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RescueManager//Lead Appointments//IT',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}@rescuemanager.eu`,
    `DTSTAMP:${fmtICSDate(new Date())}`,
    `DTSTART:${fmtICSDate(start)}`,
    `DTEND:${fmtICSDate(end)}`,
    `SUMMARY:${title.replace(/[\r\n]/g, ' ')}`,
    description ? `DESCRIPTION:${description.replace(/[\r\n]/g, '\\n').slice(0, 500)}` : '',
    location ? `LOCATION:${location.replace(/[\r\n]/g, ' ')}` : '',
    `ORGANIZER;CN=RescueManager:mailto:${organizerEmail || 'info@rescuemanager.eu'}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${title}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

function fmtITDate(iso) {
  return new Date(iso).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtITTime(iso) {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

const TYPE_LABEL = {
  discovery_call: 'una chiamata conoscitiva',
  demo_call: 'una demo del software',
  follow_up: 'una chiamata di follow-up',
  onboarding: 'la sessione di onboarding',
  negotiation: 'una chiamata commerciale',
  contract_signing: 'la firma del contratto',
  custom: 'un incontro',
};

module.exports = function createAppointmentsRouter(supabase) {
  const router = express.Router();

  // ─── LISTA ────────────────────────────────────────────────────────
  router.get('/:id/appointments', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('lead_appointments')
        .select('*')
        .eq('lead_id', req.params.id)
        .order('scheduled_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true, appointments: data || [] });
    } catch (err) {
      res.status(500).json({ error: 'Errore interno', details: err.message });
    }
  });

  // ─── CREATE ───────────────────────────────────────────────────────
  router.post('/:id/appointments', async (req, res) => {
    try {
      const leadId = req.params.id;
      const {
        appointment_type = 'discovery_call',
        title,
        description,
        duration_minutes = 30,
        meeting_mode = 'video',
        meeting_url,
        meeting_phone,
        meeting_address,
        proposed_slots,
        scheduled_at,
        scheduled_until,
        booking_window_start,
        booking_window_end,
        assigned_to,
        related_quote_id,
        status,  // 'proposed' (default), 'confirmed' (manuale telefonico)
        staff_id,
      } = req.body;

      if (!title) return res.status(400).json({ error: 'title richiesto' });

      // Calcola scheduled_until se manca
      let endAt = scheduled_until;
      if (scheduled_at && !endAt) {
        const d = new Date(scheduled_at);
        d.setMinutes(d.getMinutes() + duration_minutes);
        endAt = d.toISOString();
      }

      const initialStatus = status || (scheduled_at ? 'confirmed' : 'proposed');

      const { data, error } = await supabase
        .from('lead_appointments')
        .insert({
          lead_id: leadId,
          appointment_type, title, description, duration_minutes,
          meeting_mode, meeting_url, meeting_phone, meeting_address,
          proposed_slots: proposed_slots || [],
          scheduled_at: scheduled_at || null,
          scheduled_until: endAt || null,
          booking_window_start: booking_window_start || null,
          booking_window_end: booking_window_end || null,
          status: initialStatus,
          assigned_to: assigned_to || staff_id || null,
          created_by: staff_id || null,
          related_quote_id: related_quote_id || null,
        })
        .select().single();

      if (error) return res.status(500).json({ error: error.message });

      // Log activity
      await supabase.rpc('log_lead_activity', {
        p_lead_id: leadId,
        p_type: initialStatus === 'confirmed' ? 'appointment_scheduled' : 'appointment_proposed',
        p_title: initialStatus === 'confirmed' ? `Appuntamento fissato: ${title}` : `Appuntamento proposto: ${title}`,
        p_description: scheduled_at ? `${fmtITDate(scheduled_at)} ${fmtITTime(scheduled_at)}` : 'In attesa di conferma slot',
        p_performed_by: staff_id || null,
        p_performed_by_type: 'staff',
        p_metadata: { appointment_id: data.id, scheduled_at, meeting_mode },
      });

      res.json({ success: true, appointment: data });
    } catch (err) {
      console.error('[APPTS] Create error:', err);
      res.status(500).json({ error: 'Errore interno', details: err.message });
    }
  });

  // ─── DETAIL ───────────────────────────────────────────────────────
  router.get('/:id/appointments/:aid', async (req, res) => {
    const { data, error } = await supabase
      .from('lead_appointments')
      .select('*')
      .eq('id', req.params.aid)
      .eq('lead_id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Appuntamento non trovato' });
    res.json({ success: true, appointment: data });
  });

  // ─── UPDATE ───────────────────────────────────────────────────────
  router.put('/:id/appointments/:aid', async (req, res) => {
    const allowed = [
      'title','description','duration_minutes','meeting_mode','meeting_url','meeting_phone','meeting_address',
      'proposed_slots','scheduled_at','scheduled_until','status','assigned_to','meeting_notes','outcome','next_steps',
      'cancellation_reason'
    ];
    const update = {};
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];

    // Auto-compute scheduled_until on update
    if (update.scheduled_at && !update.scheduled_until) {
      const dur = update.duration_minutes;
      if (dur) {
        const d = new Date(update.scheduled_at);
        d.setMinutes(d.getMinutes() + dur);
        update.scheduled_until = d.toISOString();
      }
    }

    const { data, error } = await supabase
      .from('lead_appointments')
      .update(update)
      .eq('id', req.params.aid)
      .eq('lead_id', req.params.id)
      .select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, appointment: data });
  });

  // ─── DELETE (soft = cancelled) ────────────────────────────────────
  router.delete('/:id/appointments/:aid', async (req, res) => {
    const { reason, staff_id } = req.body || {};
    const { data, error } = await supabase
      .from('lead_appointments')
      .update({ status: 'cancelled', cancellation_reason: reason || null })
      .eq('id', req.params.aid)
      .eq('lead_id', req.params.id)
      .select().single();
    if (error || !data) return res.status(500).json({ error: error?.message || 'not found' });

    await supabase.rpc('log_lead_activity', {
      p_lead_id: req.params.id,
      p_type: 'appointment_cancelled',
      p_title: `Appuntamento annullato: ${data.title}`,
      p_description: reason || null,
      p_performed_by: staff_id || null,
      p_performed_by_type: 'staff',
      p_metadata: { appointment_id: data.id },
    });
    res.json({ success: true });
  });

  // ─── SEND BOOKING EMAIL ───────────────────────────────────────────
  router.post('/:id/appointments/:aid/send', async (req, res) => {
    try {
      const { data: appt, error: aErr } = await supabase
        .from('lead_appointments').select('*')
        .eq('id', req.params.aid).eq('lead_id', req.params.id).single();
      if (aErr || !appt) return res.status(404).json({ error: 'Appuntamento non trovato' });

      const { data: lead, error: lErr } = await supabase
        .from('leads').select('*').eq('id', req.params.id).single();
      if (lErr || !lead) return res.status(404).json({ error: 'Lead non trovato' });
      if (!lead.email) return res.status(400).json({ error: 'Lead senza email' });

      const bookingUrl = `${process.env.SITE_URL || 'https://rescuemanager.eu'}/appointment/${appt.public_uuid}`;

      let subject, html, text, attachments = [];

      if (appt.status === 'confirmed' && appt.scheduled_at) {
        // Email di conferma con .ics — usa template brandato
        const ics = buildICS({
          uid: appt.id,
          start: appt.scheduled_at,
          end: appt.scheduled_until || appt.scheduled_at,
          title: appt.title,
          description: appt.description || '',
          location: appt.meeting_url || appt.meeting_address || appt.meeting_phone || '',
        });
        attachments = [{ filename: 'appuntamento.ics', content: ics, contentType: 'text/calendar' }];

        subject = `Appuntamento confermato — ${fmtITDate(appt.scheduled_at)} ore ${fmtITTime(appt.scheduled_at)}`;
        const built = buildAppointmentConfirmationEmail({
          name: lead.name,
          title: appt.title,
          scheduledAt: appt.scheduled_at,
          durationMinutes: appt.duration_minutes,
          meetingMode: appt.meeting_mode,
          meetingUrl: appt.meeting_url,
          meetingPhone: appt.meeting_phone,
          meetingAddress: appt.meeting_address,
          publicUrl: bookingUrl,
        });
        html = built.html;
        text = built.text;
      } else {
        // Booking link — usa template brandato
        subject = `Pianifichiamo ${TYPE_LABEL[appt.appointment_type] || 'un incontro'} — ${appt.title}`;
        const built = buildBookingLinkEmail({
          name: lead.name,
          companyName: lead.company,
          appointmentType: appt.appointment_type,
          duration: appt.duration_minutes,
          bookingUrl,
          customMessage: appt.description,
        });
        html = built.html;
        text = built.text;
      }

      await sendEmail({ to: lead.email, subject, html, text, attachments });

      // Log email_campaigns
      await supabase.from('email_campaigns').insert({
        lead_id: lead.id, to_email: lead.email, subject, body_html: html, body_text: text,
        status: 'sent', sent_at: new Date().toISOString(),
        custom_variables: { appointment_id: appt.id }
      });

      // Reminder flag
      const update = {};
      if (appt.status === 'confirmed') update.reminder_24h_sent = false;
      await supabase.from('lead_appointments').update(update).eq('id', appt.id);

      await supabase.rpc('log_lead_activity', {
        p_lead_id: lead.id,
        p_type: 'appointment_email_sent',
        p_title: `Email appuntamento inviata: ${appt.title}`,
        p_description: appt.status === 'confirmed' ? 'Conferma + .ics' : 'Booking link',
        p_performed_by_type: 'staff',
        p_metadata: { appointment_id: appt.id }
      });

      res.json({ success: true, booking_url: bookingUrl });
    } catch (err) {
      console.error('[APPTS] Send error:', err);
      res.status(500).json({ error: 'Errore invio', details: err.message });
    }
  });

  // ─── PUBLIC: vista appuntamento ───────────────────────────────────
  router.get('/appointments/public/:uuid', async (req, res) => {
    const { data, error } = await supabase
      .from('lead_appointments')
      .select(`
        id, public_uuid, appointment_type, title, description, duration_minutes,
        meeting_mode, meeting_url, meeting_phone, meeting_address,
        status, proposed_slots, scheduled_at, scheduled_until,
        booking_window_start, booking_window_end,
        booking_hours_start, booking_hours_end, booking_buffer_minutes,
        leads!lead_appointments_lead_id_fkey(name, company)
      `)
      .eq('public_uuid', req.params.uuid).single();
    if (error || !data) return res.status(404).json({ error: 'Appuntamento non trovato' });

    res.json({
      success: true,
      appointment: {
        public_uuid: data.public_uuid,
        type: data.appointment_type,
        title: data.title,
        description: data.description,
        duration_minutes: data.duration_minutes,
        meeting_mode: data.meeting_mode,
        meeting_url: data.meeting_url,
        meeting_phone: data.meeting_phone,
        meeting_address: data.meeting_address,
        status: data.status,
        proposed_slots: data.proposed_slots || [],
        scheduled_at: data.scheduled_at,
        scheduled_until: data.scheduled_until,
        booking_window_start: data.booking_window_start,
        booking_window_end: data.booking_window_end,
        lead_name: data.leads?.name,
        lead_company: data.leads?.company,
      }
    });
  });

  // ─── PUBLIC: lead conferma slot ───────────────────────────────────
  router.post('/appointments/public/:uuid/confirm', async (req, res) => {
    try {
      const { slot_start, slot_end } = req.body;
      if (!slot_start) return res.status(400).json({ error: 'slot_start richiesto' });

      const { data: appt, error } = await supabase
        .from('lead_appointments')
        .select('*, leads!lead_appointments_lead_id_fkey(*)')
        .eq('public_uuid', req.params.uuid).single();
      if (error || !appt) return res.status(404).json({ error: 'Appuntamento non trovato' });

      if (appt.status === 'cancelled') {
        return res.status(400).json({ error: 'Appuntamento già annullato' });
      }

      const startDate = new Date(slot_start);
      let endDate = slot_end ? new Date(slot_end) : new Date(startDate);
      if (!slot_end) endDate.setMinutes(endDate.getMinutes() + (appt.duration_minutes || 30));

      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip;
      const ua = req.headers['user-agent'] || null;

      await supabase.from('lead_appointments').update({
        status: appt.status === 'rescheduled' || appt.scheduled_at ? 'rescheduled' : 'confirmed',
        scheduled_at: startDate.toISOString(),
        scheduled_until: endDate.toISOString(),
        confirmed_by_lead_at: new Date().toISOString(),
        confirmation_ip: ip || null,
        confirmation_user_agent: ua,
        rescheduled_count: appt.scheduled_at ? (appt.rescheduled_count || 0) + 1 : 0,
      }).eq('id', appt.id);

      await supabase.rpc('log_lead_activity', {
        p_lead_id: appt.lead_id,
        p_type: 'appointment_confirmed_by_lead',
        p_title: `Lead ha confermato slot: ${appt.title}`,
        p_description: `${fmtITDate(startDate)} ${fmtITTime(startDate)}`,
        p_performed_by_type: 'lead',
        p_metadata: { appointment_id: appt.id, ip, slot_start }
      });

      res.json({ success: true, scheduled_at: startDate.toISOString() });
    } catch (err) {
      console.error('[APPTS] Public confirm error:', err);
      res.status(500).json({ error: 'Errore interno', details: err.message });
    }
  });

  // ─── PUBLIC: lead annulla ─────────────────────────────────────────
  router.post('/appointments/public/:uuid/cancel', async (req, res) => {
    const { reason } = req.body || {};
    const { data: appt, error } = await supabase
      .from('lead_appointments').select('id, lead_id, title').eq('public_uuid', req.params.uuid).single();
    if (error || !appt) return res.status(404).json({ error: 'Appuntamento non trovato' });

    await supabase.from('lead_appointments').update({
      status: 'cancelled',
      cancellation_reason: reason || 'Annullato dal lead'
    }).eq('id', appt.id);

    await supabase.rpc('log_lead_activity', {
      p_lead_id: appt.lead_id,
      p_type: 'appointment_cancelled_by_lead',
      p_title: `Lead ha annullato: ${appt.title}`,
      p_description: reason || null,
      p_performed_by_type: 'lead',
      p_metadata: { appointment_id: appt.id }
    });
    res.json({ success: true });
  });

  // ─── Settings (calendly URL + follow-up defaults) ─────────────────
  router.get('/appointments/settings', async (_req, res) => {
    const { data, error } = await supabase
      .from('lead_automation_settings').select('*').eq('id', 1).single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, settings: data || {} });
  });

  router.put('/appointments/settings', async (req, res) => {
    const allowed = [
      'calendly_url','google_calendar_book_url',
      'default_followup_after_quote_days','default_followup_after_demo_days','default_followup_after_no_response_days',
      'appointment_duration_default_minutes','appointment_buffer_minutes',
      'default_appointment_duration','booking_office_hours_start','booking_office_hours_end',
      'booking_buffer_minutes','reminder_24h_enabled','reminder_1h_enabled',
      'google_calendar_enabled','google_calendar_email',
    ];
    const update = {};
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];
    update.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('lead_automation_settings').upsert({ id: 1, ...update }, { onConflict: 'id' }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, settings: data });
  });

  // ─── First contact (primo contatto manuale lead) ────────────────────
  router.post('/:id/first-contact', async (req, res) => {
    try {
      const { contacted_at, method, notes, staff_id } = req.body;
      if (!method) return res.status(400).json({ error: 'method richiesto' });
      const at = contacted_at || new Date().toISOString();

      const { data: existing } = await supabase
        .from('leads').select('status').eq('id', req.params.id).single();

      const { data, error } = await supabase
        .from('leads')
        .update({
          first_contact_at: at,
          first_contact_method: method,
          first_contact_notes: notes || null,
          first_contact_by: staff_id || null,
          status: existing?.status === 'new' ? 'contacted' : existing?.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', req.params.id)
        .select().single();
      if (error) return res.status(500).json({ error: error.message });

      await supabase.from('lead_activities').insert({
        lead_id: req.params.id,
        activity_type: 'first_contact',
        title: `Primo contatto via ${method}`,
        description: notes || null,
        performed_by: staff_id || null,
        performed_by_type: 'staff',
        occurred_at: at,
        metadata: { method, notes },
      });

      res.json({ success: true, lead: data });
    } catch (err) {
      console.error('[APPTS] first-contact error:', err);
      res.status(500).json({ error: 'Errore interno', details: err.message });
    }
  });

  return router;
};
