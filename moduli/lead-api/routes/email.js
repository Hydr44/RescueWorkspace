/**
 * Email Routes — invio on-demand
 *
 * GET  /api/leads/email/templates           Lista template
 * POST /api/leads/email/templates           Crea template
 * PUT  /api/leads/email/templates/:tid      Aggiorna template
 * DELETE /api/leads/email/templates/:tid    Elimina (non-system)
 *
 * POST /api/leads/:id/email/send            Invia email al lead (template+vars o custom)
 * GET  /api/leads/:id/email/campaigns       Storico email inviate al lead
 */

const express = require('express');
const { sendEmail } = require('../lib/email');

function interpolate(str, vars) {
  if (!str) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] !== undefined && vars[k] !== null) ? String(vars[k]) : '');
}

module.exports = function createEmailRouter(supabase) {
  const router = express.Router();

  // ─── Templates CRUD ────────────────────────────────────────────────
  router.get('/email/templates', async (req, res) => {
    const { category, active } = req.query;
    let q = supabase.from('email_templates').select('*').order('category').order('name');
    if (category) q = q.eq('category', category);
    if (active === 'true') q = q.eq('is_active', true);
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, templates: data || [] });
  });

  router.post('/email/templates', async (req, res) => {
    const { name, slug, category, subject, body_html, body_text, variables, created_by } = req.body;
    if (!name || !subject || !body_html) {
      return res.status(400).json({ error: 'name, subject, body_html richiesti' });
    }
    const { data, error } = await supabase
      .from('email_templates')
      .insert({ name, slug, category: category || 'custom', subject, body_html, body_text, variables, created_by })
      .select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, template: data });
  });

  router.put('/email/templates/:tid', async (req, res) => {
    const allowed = ['name', 'category', 'subject', 'body_html', 'body_text', 'variables', 'is_active'];
    const update = {};
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];
    update.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('email_templates')
      .update(update).eq('id', req.params.tid).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, template: data });
  });

  router.delete('/email/templates/:tid', async (req, res) => {
    const { data: tpl } = await supabase.from('email_templates').select('is_system').eq('id', req.params.tid).single();
    if (tpl?.is_system) return res.status(400).json({ error: 'Template di sistema non eliminabili' });
    const { error } = await supabase.from('email_templates').delete().eq('id', req.params.tid);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // ─── Send email on-demand ──────────────────────────────────────────
  // Body:
  //   template_slug?: string         — se presente usa template
  //   subject?: string               — override subject
  //   body_html?: string             — custom body (se no template)
  //   body_text?: string
  //   variables?: object             — vars custom da iniettare
  //   related_quote_id?: uuid
  //   schedule_at?: ISO string       — se presente, schedula invece di inviare subito
  //   attachments?: [{filename,url}]
  //   staff_id: uuid
  router.post('/:id/email/send', async (req, res) => {
    try {
      const leadId = req.params.id;
      const {
        template_slug,
        subject: customSubject,
        body_html: customHtml,
        body_text: customText,
        variables = {},
        related_quote_id,
        schedule_at,
        staff_id
      } = req.body;

      const { data: lead, error: lErr } = await supabase
        .from('leads').select('*').eq('id', leadId).single();
      if (lErr || !lead) return res.status(404).json({ error: 'Lead non trovato' });
      if (!lead.email) return res.status(400).json({ error: 'Lead senza email' });

      if (lead.email_unsubscribed_at) {
        return res.status(400).json({ error: 'Lead ha cancellato la subscription email' });
      }

      // Vars di base
      const baseVars = {
        lead_name: lead.name,
        lead_email: lead.email,
        company: lead.company || '',
        ...variables
      };

      let subject, html, text, templateId = null;

      if (template_slug) {
        const { data: tpl, error: tErr } = await supabase
          .from('email_templates')
          .select('*').eq('slug', template_slug).eq('is_active', true).single();
        if (tErr || !tpl) return res.status(404).json({ error: 'Template non trovato' });
        templateId = tpl.id;
        subject = customSubject || interpolate(tpl.subject, baseVars);
        html = interpolate(tpl.body_html, baseVars);
        text = interpolate(tpl.body_text || '', baseVars);
      } else if (customHtml) {
        subject = customSubject || 'Comunicazione RescueManager';
        html = interpolate(customHtml, baseVars);
        text = interpolate(customText || customHtml.replace(/<[^>]+>/g, ''), baseVars);
      } else {
        return res.status(400).json({ error: 'template_slug o body_html richiesto' });
      }

      // Schedula o invia subito
      if (schedule_at) {
        const { data: campaign, error: cErr } = await supabase.from('email_campaigns').insert({
          lead_id: leadId,
          template_id: templateId,
          to_email: lead.email,
          subject, body_html: html, body_text: text,
          status: 'scheduled',
          scheduled_at: schedule_at,
          custom_variables: variables,
          related_quote_id: related_quote_id || null,
          sent_by: staff_id || null
        }).select().single();
        if (cErr) return res.status(500).json({ error: cErr.message });

        return res.json({ success: true, message: 'Email schedulata', campaign });
      }

      // Send now
      try {
        await sendEmail({ to: lead.email, subject, html, text });
      } catch (sendErr) {
        await supabase.from('email_campaigns').insert({
          lead_id: leadId, template_id: templateId,
          to_email: lead.email, subject, body_html: html, body_text: text,
          status: 'failed', failed_at: new Date().toISOString(),
          failure_reason: sendErr.message,
          related_quote_id: related_quote_id || null, sent_by: staff_id || null
        });
        return res.status(500).json({ error: 'Invio fallito', details: sendErr.message });
      }

      const { data: campaign } = await supabase.from('email_campaigns').insert({
        lead_id: leadId, template_id: templateId,
        to_email: lead.email, subject, body_html: html, body_text: text,
        status: 'sent', sent_at: new Date().toISOString(),
        custom_variables: variables,
        related_quote_id: related_quote_id || null,
        sent_by: staff_id || null
      }).select().single();

      await supabase.rpc('log_lead_activity', {
        p_lead_id: leadId,
        p_type: 'email_sent',
        p_title: `Email inviata: ${subject}`,
        p_description: template_slug ? `Template: ${template_slug}` : 'Email custom',
        p_performed_by: staff_id || null,
        p_performed_by_type: 'staff',
        p_metadata: { campaign_id: campaign?.id, template_slug },
        p_related_quote_id: related_quote_id || null
      });

      res.json({ success: true, message: 'Email inviata', campaign });
    } catch (err) {
      console.error('[EMAIL] send error:', err);
      res.status(500).json({ error: 'Errore interno', details: err.message });
    }
  });

  // ─── Storico email per lead ────────────────────────────────────────
  router.get('/:id/email/campaigns', async (req, res) => {
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('lead_id', req.params.id)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, campaigns: data || [] });
  });

  return router;
};
