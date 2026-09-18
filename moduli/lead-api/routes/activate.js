/**
 * Activation Routes — attivazione manuale account post-pagamento
 *
 * POST /api/leads/:id/quotes/:qid/record-payment
 *   Registra un pagamento esterno (bonifico/contanti/assegno) su un preventivo.
 *   Marca quote.status='paid' e activation_pending=true (resta in attesa di attivazione).
 *
 * POST /api/leads/:id/quotes/:qid/activate
 *   Attiva manualmente l'account: crea org + member + subscription + (opt) trial.
 *   L'admin sceglie: moduli, durata trial (unit/quantity/unlimited), invio email benvenuto.
 *
 * GET  /api/leads/pending-activations
 *   Lista preventivi pagati in attesa di attivazione (per bell admin).
 */

const express = require('express');
const { sendEmail, buildAccountActivatedEmail } = require('../lib/email');

const VALID_TRIAL_UNITS = ['days', 'weeks', 'months', 'years', 'unlimited'];
const VALID_EXTERNAL_PAYMENT_METHODS = ['bank_transfer', 'cash', 'check', 'other_card', 'manual_free', 'offline'];

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < 14; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  return pwd + '!';
}

function computeTrialExpiry(unit, quantity, start = new Date()) {
  if (unit === 'unlimited') return null;
  if (!quantity || quantity <= 0) return null;
  const d = new Date(start);
  switch (unit) {
    case 'days':   d.setDate(d.getDate() + quantity); return d;
    case 'weeks':  d.setDate(d.getDate() + quantity * 7); return d;
    case 'months': d.setMonth(d.getMonth() + quantity); return d;
    case 'years':  d.setFullYear(d.getFullYear() + quantity); return d;
    default: return null;
  }
}

function computeSubscriptionEnd(contractDuration, start = new Date()) {
  const d = new Date(start);
  if (contractDuration === 'biennial') d.setFullYear(d.getFullYear() + 2);
  else if (contractDuration === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

module.exports = function createActivateRouter(supabase) {
  const router = express.Router();

  // ─── Pending activations (per bell admin) ──────────────────────────────
  router.get('/pending-activations', async (_req, res) => {
    try {
      const { data, error } = await supabase
        .from('lead_quotes')
        .select(`
          id, quote_number, plan_type, monthly_total, yearly_total,
          status, paid_at, activation_pending, activated_at,
          external_payment_method, external_payment_reference, external_payment_amount,
          base_modules, special_modules, contract_duration,
          lead:lead_id ( id, name, email, company, phone )
        `)
        .eq('activation_pending', true)
        .is('activated_at', null)
        .order('paid_at', { ascending: false, nullsFirst: false });

      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true, pending: data || [] });
    } catch (err) {
      res.status(500).json({ error: 'Errore interno', details: err.message });
    }
  });

  // ─── Record external payment (bonifico/cash/check) ─────────────────────
  router.post('/:id/quotes/:qid/record-payment', async (req, res) => {
    try {
      const { id: leadId, qid: quoteId } = req.params;
      const {
        payment_method,
        payment_reference,
        payment_amount,
        payment_date,
        notes,
        staff_id
      } = req.body;

      if (!payment_method || !VALID_EXTERNAL_PAYMENT_METHODS.includes(payment_method)) {
        return res.status(400).json({
          error: `payment_method richiesto: ${VALID_EXTERNAL_PAYMENT_METHODS.join(', ')}`
        });
      }

      const { data: quote, error: qErr } = await supabase
        .from('lead_quotes')
        .select('*')
        .eq('id', quoteId)
        .eq('lead_id', leadId)
        .single();

      if (qErr || !quote) {
        return res.status(404).json({ error: 'Preventivo non trovato' });
      }

      if (quote.status === 'activated') {
        return res.status(400).json({ error: 'Preventivo già attivato' });
      }

      const { data: updated, error: uErr } = await supabase
        .from('lead_quotes')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          activation_pending: true,
          external_payment_method: payment_method,
          external_payment_reference: payment_reference || null,
          external_payment_amount: payment_amount || quote.monthly_total,
          external_payment_date: payment_date || new Date().toISOString().split('T')[0],
          external_payment_notes: notes || null,
          external_payment_recorded_by: staff_id || null,
          external_payment_recorded_at: new Date().toISOString()
        })
        .eq('id', quoteId)
        .select()
        .single();

      if (uErr) return res.status(500).json({ error: uErr.message });

      // F5: pagamento registrato → lead in coda Revisione (guardato + idempotente).
      await supabase.from('leads').update({ status: 'in_verifica' }).eq('id', leadId).in('status', ['quote_sent','trattativa']);

      // Log activity
      await supabase.rpc('log_lead_activity', {
        p_lead_id: leadId,
        p_type: 'payment_received',
        p_title: `Pagamento esterno registrato (${payment_method})`,
        p_description: `Importo: €${payment_amount || quote.monthly_total} — Rif: ${payment_reference || '—'}`,
        p_performed_by: staff_id || null,
        p_performed_by_type: 'staff',
        p_metadata: { payment_method, payment_reference, payment_amount },
        p_related_quote_id: quoteId
      });

      res.json({
        success: true,
        message: 'Pagamento registrato. Procedi all\'attivazione manuale.',
        quote: updated
      });
    } catch (err) {
      console.error('[ACTIVATE] record-payment error:', err);
      res.status(500).json({ error: 'Errore interno', details: err.message });
    }
  });

  // ─── Activate account ──────────────────────────────────────────────────
  //
  // Body:
  //   modules: string[]               — moduli da abilitare (override quote)
  //   trial_unit: 'days'|'weeks'|'months'|'years'|'unlimited'|null
  //   trial_quantity: int|null
  //   send_welcome_email: boolean     — invia email benvenuto
  //   custom_email_subject: string?   — override subject
  //   custom_email_body: string?      — override body (HTML)
  //   email_template_slug: string?    — usa template specifico
  //   skip_payment_check: boolean     — attivazione senza pagamento (es. gratis)
  //   staff_id: uuid
  //
  router.post('/:id/quotes/:qid/activate', async (req, res) => {
    try {
      const { id: leadId, qid: quoteId } = req.params;
      const {
        modules: customModules,
        trial_unit = null,
        trial_quantity = null,
        send_welcome_email = true,
        custom_email_subject,
        custom_email_body,
        email_template_slug,
        skip_payment_check = false,
        billing_frequency_override,
        contract_duration_override,
        staff_id
      } = req.body;

      if (trial_unit && !VALID_TRIAL_UNITS.includes(trial_unit)) {
        return res.status(400).json({
          error: `trial_unit non valido: ${VALID_TRIAL_UNITS.join(', ')}`
        });
      }

      // 1. Carica quote + lead
      const { data: quote, error: qErr } = await supabase
        .from('lead_quotes')
        .select('*')
        .eq('id', quoteId)
        .eq('lead_id', leadId)
        .single();

      if (qErr || !quote) return res.status(404).json({ error: 'Preventivo non trovato' });

      if (quote.status === 'activated' || quote.activated_at) {
        return res.status(400).json({ error: 'Preventivo già attivato' });
      }

      if (!skip_payment_check && quote.status !== 'paid') {
        return res.status(400).json({
          error: 'Preventivo non pagato. Registra pagamento prima oppure usa skip_payment_check.'
        });
      }

      const { data: lead, error: lErr } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (lErr || !lead) return res.status(404).json({ error: 'Lead non trovato' });
      if (!lead.email) return res.status(400).json({ error: 'Lead senza email' });

      // 2. Determina moduli finali
      const allModules = customModules && customModules.length
        ? customModules
        : [...(quote.base_modules || []), ...(quote.special_modules || [])];

      // 3. Crea o recupera utente
      let userId = lead.demo_account_id;
      let isNewUser = false;

      if (!userId) {
        const tempPwd = generateTempPassword();
        const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
          email: lead.email,
          password: tempPwd,
          email_confirm: true,
          user_metadata: {
            full_name: lead.name,
            force_password_change: true
          }
        });

        if (authData?.user) {
          userId = authData.user.id;
          isNewUser = true;
        } else if (authErr?.code === 'email_exists' || authErr?.message?.includes('already')) {
          const { data: list } = await supabase.auth.admin.listUsers();
          userId = list?.users?.find(u => u.email === lead.email)?.id;
        } else if (authErr) {
          return res.status(500).json({ error: 'Errore creazione utente', details: authErr.message });
        }
      }

      if (!userId) {
        return res.status(500).json({ error: 'Impossibile determinare utente target' });
      }

      // 4. Crea o aggiorna org
      let orgId = lead.demo_org_id;

      if (orgId) {
        // Promuovi demo org a produzione
        await supabase
          .from('orgs')
          .update({
            is_demo: false,
            demo_expires_at: null,
            web_access_enabled: true,
            web_features: ['all'],
            desktop_access_enabled: true,
            desktop_modules: allModules,
            name: lead.company || lead.name
          })
          .eq('id', orgId);

        await supabase
          .from('lead_demos')
          .update({ status: 'converted' })
          .eq('lead_id', leadId)
          .eq('status', 'active');
      } else {
        const { data: newOrg, error: orgErr } = await supabase
          .from('orgs')
          .insert({
            name: lead.company || lead.name,
            is_demo: false,
            web_access_enabled: true,
            web_features: ['all'],
            desktop_access_enabled: true,
            desktop_modules: allModules,
            converted_from_lead_id: leadId,
            created_by: userId
          })
          .select()
          .single();

        if (orgErr) return res.status(500).json({ error: 'Errore creazione org', details: orgErr.message });
        orgId = newOrg.id;
      }

      // 5. Profilo + org_members + operator
      await supabase.from('profiles').upsert({
        id: userId,
        email: lead.email,
        full_name: lead.name,
        current_org: orgId,
        provider: 'email'
      }, { onConflict: 'id' });

      await supabase.from('org_members').upsert({
        org_id: orgId,
        user_id: userId,
        role: 'owner'
      }, { onConflict: 'org_id,user_id' });

      const nameParts = (lead.name || '').trim().split(' ');
      await supabase.from('operators').upsert({
        org_id: orgId,
        user_id: userId,
        nome: nameParts[0] || 'Utente',
        cognome: nameParts.slice(1).join(' ') || '—',
        email: lead.email,
        ruolo: 'admin',
        attivo: true,
        codice_operatore: 'ADM001',
        password_hash: '$2b$12$g4MkvgG7GkX0xRyVexVCfeJ9fIao/k5IvzDsHCC4l7ggxa88WVQ2e'
      }, { onConflict: 'org_id,email' });

      // 6. Copia anagrafica lead → org_settings.key='company' (JSONB)
      try {
        const companyData = {
          company_name: lead.company || lead.name || '',
          vat: lead.vat_number || null,
          piva: lead.vat_number || null,
          tax_code: lead.codice_fiscale || null,
          pec: lead.pec || null,
          phone: lead.phone || null,
          email: lead.email || null,
          forma_giuridica: lead.forma_giuridica || null,
          codice_ateco: lead.codice_ateco || null,
          address: {
            street: lead.address_street || null,
            city: lead.address_city || null,
            province: lead.address_province || null,
            zip: lead.address_postal_code || null,
            country: 'IT'
          }
        };

        await supabase.from('org_settings').upsert({
          org_id: orgId,
          key: 'company',
          value: companyData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'org_id,key' });
      } catch (e) {
        console.error('[ACTIVATE] org_settings upsert error:', e.message);
      }

      // 7. Subscription
      const trialExpiry = computeTrialExpiry(trial_unit, trial_quantity);
      const isTrialActive = !!(trial_unit && (trial_unit === 'unlimited' || trialExpiry));
      const subEnd = computeSubscriptionEnd(contract_duration_override || quote.contract_duration);

      // billing_type = TIPO di pagamento (stripe|manual|trial), NON la frequenza.
      // La frequenza (annuale/mensile) è già in current_period_end + nel preventivo.
      // NB: org_subscriptions NON ha la colonna current_period_start.
      const { error: subErr } = await supabase.from('org_subscriptions').upsert({
        org_id: orgId,
        status: isTrialActive ? 'trial' : 'active',
        plan: quote.plan_type || 'starter',
        billing_type: quote.external_payment_method ? 'manual' : 'stripe',
        current_period_end: subEnd.toISOString(),
        trial_end: trialExpiry ? trialExpiry.toISOString() : null,
        last_payment_date: (quote.paid_at || new Date().toISOString()).slice(0, 10),
        stripe_subscription_id: quote.stripe_subscription_id || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'org_id' });
      if (subErr) console.error('[ACTIVATE] org_subscriptions upsert error:', subErr.message);

      // 7b. Org modules (allowlist esplicita)
      try {
        // Pulisce e reinserisce
        await supabase.from('org_modules').delete().eq('org_id', orgId);
        if (allModules.length) {
          const rows = allModules.map(m => ({ org_id: orgId, module_code: m, enabled: true }));
          await supabase.from('org_modules').insert(rows);
        }
      } catch (e) {
        console.error('[ACTIVATE] org_modules error:', e.message);
      }

      // 8. Aggiorna lead
      await supabase.from('leads').update({
        status: 'converted',
        lifecycle_stage: 'customer',
        demo_account_id: userId,
        demo_org_id: orgId,
        converted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', leadId);

      // 9. Marca quote attivato
      await supabase.from('lead_quotes').update({
        status: 'activated',
        activated_at: new Date().toISOString(),
        activated_by: staff_id || null,
        activation_pending: false,
        activation_notes: req.body.activation_notes || null
      }).eq('id', quoteId);

      // 10. Trial record (se applicabile)
      if (isTrialActive) {
        await supabase.from('lead_demos').insert({
          lead_id: leadId,
          demo_account_id: userId,
          demo_org_id: orgId,
          duration_days: trial_unit === 'unlimited' ? 36500 :
            (trialExpiry ? Math.ceil((trialExpiry - new Date()) / 86400000) : 0),
          trial_unit,
          trial_quantity,
          modules_enabled: allModules,
          status: 'active',
          expires_at: trialExpiry ? trialExpiry.toISOString() : null,
          related_quote_id: quoteId
        });
      }

      // 11. Setup password link
      let setupPasswordUrl = null;
      if (isNewUser) {
        try {
          const { data: linkData } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: lead.email,
            options: {
              redirectTo: `${process.env.SITE_URL || 'https://rescuemanager.eu'}/set-password`
            }
          });
          setupPasswordUrl = linkData?.properties?.action_link || null;
        } catch (e) {
          console.error('[ACTIVATE] generateLink error:', e.message);
        }
      }

      // 12. Email benvenuto (se richiesto)
      let emailSent = false;
      if (send_welcome_email && lead.email) {
        try {
          let subject, html, text;

          if (custom_email_body) {
            subject = custom_email_subject || 'Account RescueManager attivato';
            html = custom_email_body
              .replace(/\{\{lead_name\}\}/g, lead.name || '')
              .replace(/\{\{setup_password_url\}\}/g, setupPasswordUrl || '')
              .replace(/\{\{plan_type\}\}/g, quote.plan_type || '');
            text = html.replace(/<[^>]+>/g, '');
          } else if (email_template_slug) {
            const { data: tpl } = await supabase
              .from('email_templates')
              .select('*')
              .eq('slug', email_template_slug)
              .eq('is_active', true)
              .single();
            if (tpl) {
              const interp = (s) => (s || '')
                .replace(/\{\{lead_name\}\}/g, lead.name || '')
                .replace(/\{\{setup_password_url\}\}/g, setupPasswordUrl || '')
                .replace(/\{\{plan_type\}\}/g, quote.plan_type || '')
                .replace(/\{\{quote_number\}\}/g, quote.quote_number || '');
              subject = custom_email_subject || interp(tpl.subject);
              html = interp(tpl.body_html);
              text = interp(tpl.body_text || '');
            }
          }

          if (!html) {
            const built = buildAccountActivatedEmail({
              name: lead.name,
              planType: quote.plan_type,
              modules: allModules,
              monthlyTotal: quote.monthly_total,
              setupPasswordUrl,
              hasDemo: !!lead.demo_org_id
            });
            subject = custom_email_subject || 'Account RescueManager Attivato!';
            html = built.html;
            text = built.text;
          }

          await sendEmail({ to: lead.email, subject, html, text });
          emailSent = true;

          // Log email_campaigns
          await supabase.from('email_campaigns').insert({
            lead_id: leadId,
            to_email: lead.email,
            subject, body_html: html, body_text: text,
            status: 'sent',
            sent_at: new Date().toISOString(),
            sent_by: staff_id || null,
            related_quote_id: quoteId
          });
        } catch (emailErr) {
          console.error('[ACTIVATE] Email error:', emailErr.message);
        }
      }

      // 13. Activity log
      await supabase.rpc('log_lead_activity', {
        p_lead_id: leadId,
        p_type: 'account_activated',
        p_title: 'Account attivato manualmente',
        p_description: `Piano: ${quote.plan_type} — Moduli: ${allModules.length} — Trial: ${trial_unit ? `${trial_quantity || ''} ${trial_unit}` : 'nessuno'}${emailSent ? ' — Email inviata' : ''}`,
        p_performed_by: staff_id || null,
        p_performed_by_type: 'staff',
        p_metadata: { modules: allModules, trial_unit, trial_quantity, email_sent: emailSent },
        p_related_quote_id: quoteId
      });

      // 14. Marca altre quote attive come 'superseded' (questa è quella scelta)
      await supabase.from('lead_quotes')
        .update({ status: 'superseded' })
        .eq('lead_id', leadId)
        .neq('id', quoteId)
        .in('status', ['draft', 'sent', 'viewed', 'accepted']);

      res.json({
        success: true,
        message: 'Account attivato con successo',
        org_id: orgId,
        user_id: userId,
        setup_password_url: setupPasswordUrl,
        email_sent: emailSent,
        trial_active: isTrialActive,
        trial_expires_at: trialExpiry?.toISOString() || null
      });
    } catch (err) {
      console.error('[ACTIVATE] activate error:', err);
      res.status(500).json({ error: 'Errore interno', details: err.message });
    }
  });

  return router;
};
