/**
 * Cron/Manual Routes
 * POST /api/cron/expire-demos
 * POST /api/cron/expire-quotes
 * GET  /api/cron/status
 */

const express = require('express');

module.exports = function createCronRouter(supabase) {
  const router = express.Router();

  /**
   * POST /api/cron/expire-demos
   * Scade demo account manualmente
   */
  router.post('/expire-demos', async (req, res) => {
    try {
      const { data, error } = await supabase.rpc('expire_demo_accounts');
      if (error) throw error;
      const count = data?.[0]?.expired_count || 0;
      res.json({ success: true, expired_count: count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/cron/expire-quotes
   * Scade preventivi manualmente
   */
  router.post('/expire-quotes', async (req, res) => {
    try {
      const { data, error } = await supabase.rpc('expire_quotes');
      if (error) throw error;
      const count = data?.[0]?.expired_count || 0;
      res.json({ success: true, expired_count: count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/cron/generate-followups
   * Scansiona lead e crea task lead_tasks per follow-up necessari.
   * Idempotente: non duplica task esistenti aperti (per lo stesso scope/lead/giorno).
   *
   * Regole:
   *  - Quote in stato sent/viewed da N giorni (default 3) → task "Follow-up preventivo {n}"
   *  - Demo/trial attivati da N giorni (default 5) → task "Check-up demo {company}"
   *  - Lead status=contacted da N giorni (default 7) senza altre attività → task "Richiamare {name}"
   *  - Appointments confermati senza outcome dopo 1 giorno → task "Aggiorna esito appuntamento"
   */
  router.post('/generate-followups', async (_req, res) => {
    try {
      // Carica settings
      const { data: settings } = await supabase
        .from('lead_automation_settings').select('*').eq('id', 1).single();

      const daysQuote = settings?.default_followup_after_quote_days || 3;
      const daysDemo = settings?.default_followup_after_demo_days || 5;
      const daysNoResp = settings?.default_followup_after_no_response_days || 7;

      const now = new Date();
      const cutoffQuote = new Date(now.getTime() - daysQuote * 86400000).toISOString();
      const cutoffDemo = new Date(now.getTime() - daysDemo * 86400000).toISOString();
      const cutoffNoResp = new Date(now.getTime() - daysNoResp * 86400000).toISOString();
      const yesterday = new Date(now.getTime() - 86400000).toISOString();

      const stats = { quote_followups: 0, demo_followups: 0, no_response_followups: 0, appointment_followups: 0, skipped_existing: 0 };

      // Helper: crea task solo se non esiste già un task aperto identico
      async function createIfMissing({ lead_id, title, description, due_at, priority = 'normal', metadata }) {
        const { data: existing } = await supabase
          .from('lead_tasks')
          .select('id')
          .eq('lead_id', lead_id)
          .eq('title', title)
          .in('status', ['open', 'in_progress'])
          .limit(1);
        if (existing && existing.length > 0) {
          stats.skipped_existing++;
          return null;
        }
        const { data, error } = await supabase
          .from('lead_tasks')
          .insert({ lead_id, title, description, due_at: due_at || null, priority, status: 'open' })
          .select().single();
        if (error) console.error('[CRON-FU] insert error:', error.message);
        return data;
      }

      // 1. Quote follow-up
      const { data: pendingQuotes } = await supabase
        .from('lead_quotes')
        .select('id, lead_id, quote_number, sent_at, monthly_total, plan_type')
        .in('status', ['sent', 'viewed'])
        .lt('sent_at', cutoffQuote);
      for (const q of pendingQuotes || []) {
        const c = await createIfMissing({
          lead_id: q.lead_id,
          title: `Follow-up preventivo ${q.quote_number}`,
          description: `Preventivo ${q.plan_type} (€${q.monthly_total}/mese) inviato da ${daysQuote}+ giorni senza accettazione`,
          due_at: now.toISOString(),
          priority: 'high',
          metadata: { quote_id: q.id, type: 'quote_followup' },
        });
        if (c) stats.quote_followups++;
      }

      // 2. Demo/trial follow-up
      const { data: activeDemos } = await supabase
        .from('lead_demos')
        .select('id, lead_id, activated_at, demo_type, expires_at, leads!lead_demos_lead_id_fkey(company,name)')
        .eq('status', 'active')
        .lt('activated_at', cutoffDemo);
      for (const d of activeDemos || []) {
        const leadName = d.leads?.company || d.leads?.name || 'lead';
        const c = await createIfMissing({
          lead_id: d.lead_id,
          title: `Check-up ${d.demo_type || 'demo'} ${leadName}`,
          description: `${d.demo_type || 'Demo'} attiva da ${daysDemo}+ giorni — verifica engagement e proponi conversione`,
          due_at: now.toISOString(),
          priority: 'normal',
          metadata: { demo_id: d.id, type: 'demo_followup' },
        });
        if (c) stats.demo_followups++;
      }

      // 3. No response follow-up
      const { data: silentLeads } = await supabase
        .from('leads')
        .select('id, name, company, last_activity_at, updated_at, first_contact_at')
        .eq('status', 'contacted')
        .lt('updated_at', cutoffNoResp)
        .or(`last_activity_at.is.null,last_activity_at.lt.${cutoffNoResp}`);
      for (const l of silentLeads || []) {
        const c = await createIfMissing({
          lead_id: l.id,
          title: `Richiamare ${l.company || l.name}`,
          description: `Nessuna attività da ${daysNoResp}+ giorni`,
          due_at: now.toISOString(),
          priority: 'normal',
          metadata: { type: 'no_response_followup' },
        });
        if (c) stats.no_response_followups++;
      }

      // 4. Appointments senza outcome
      const { data: pastApts } = await supabase
        .from('lead_appointments')
        .select('id, lead_id, title, scheduled_at')
        .eq('status', 'confirmed')
        .lt('scheduled_at', yesterday)
        .is('outcome', null)
        .is('meeting_notes', null);
      for (const a of pastApts || []) {
        const c = await createIfMissing({
          lead_id: a.lead_id,
          title: `Aggiorna esito: ${a.title}`,
          description: `Appuntamento del ${new Date(a.scheduled_at).toLocaleDateString('it-IT')} senza esito registrato`,
          due_at: now.toISOString(),
          priority: 'high',
          metadata: { appointment_id: a.id, type: 'appointment_outcome' },
        });
        if (c) stats.appointment_followups++;
      }

      res.json({ success: true, stats, settings_used: { daysQuote, daysDemo, daysNoResp } });
    } catch (err) {
      console.error('[CRON-FU] error:', err);
      res.status(500).json({ error: 'Errore interno', details: err.message });
    }
  });

  /**
   * GET /api/cron/status
   * Stato cron jobs e statistiche
   */
  router.get('/status', async (req, res) => {
    try {
      // Demo attive
      const { count: activeDemos } = await supabase
        .from('lead_demos')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');

      // Demo in scadenza (prossime 24h)
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { count: expiringDemos } = await supabase
        .from('lead_demos')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .lt('expires_at', tomorrow);

      // Preventivi in scadenza
      const tomorrowDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { count: expiringQuotes } = await supabase
        .from('lead_quotes')
        .select('id', { count: 'exact', head: true })
        .in('status', ['sent', 'viewed'])
        .lt('expiry_date', tomorrowDate);

      // Preventivi pending
      const { count: pendingQuotes } = await supabase
        .from('lead_quotes')
        .select('id', { count: 'exact', head: true })
        .in('status', ['sent', 'viewed']);

      res.json({
        success: true,
        stats: {
          active_demos: activeDemos || 0,
          expiring_demos_24h: expiringDemos || 0,
          pending_quotes: pendingQuotes || 0,
          expiring_quotes_24h: expiringQuotes || 0
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
