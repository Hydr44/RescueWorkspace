/**
 * Convert Routes
 * POST /api/leads/convert - Conversione post-pagamento (chiamato da Stripe webhook)
 */

const express = require('express');
const { sendEmail, buildAccountActivatedEmail } = require('../lib/email');

module.exports = function createConvertRouter(supabase) {
  const router = express.Router();

  /**
   * POST /api/leads/convert
   * Conversione da demo a produzione dopo pagamento
   * Body: { quote_id, stripe_subscription_id, stripe_payment_intent_id }
   */
  router.post('/convert', async (req, res) => {
    try {
      const { quote_id, stripe_subscription_id, stripe_payment_intent_id } = req.body;

      if (!quote_id) {
        return res.status(400).json({ error: 'quote_id richiesto' });
      }

      // 1. Carica preventivo
      const { data: quote, error: quoteError } = await supabase
        .from('lead_quotes')
        .select('*')
        .eq('id', quote_id)
        .single();

      if (quoteError || !quote) {
        return res.status(404).json({ error: 'Preventivo non trovato' });
      }

      // 2. Carica lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', quote.lead_id)
        .single();

      if (leadError || !lead) {
        return res.status(404).json({ error: 'Lead non trovato' });
      }

      // 3. Aggiorna preventivo → paid
      await supabase
        .from('lead_quotes')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: stripe_payment_intent_id || null,
          stripe_subscription_id: stripe_subscription_id || null
        })
        .eq('id', quote.id);

      // 4. Architettura nuova: org_demo e org_prod sono SEMPRE separate.
      //    All'acquisto creiamo una nuova org pulita; la demo (se esiste)
      //    viene hard-deleted a fine flusso. L'utente Supabase è lo stesso
      //    (stessa email) — viene aggiunto come `org_members` della nuova org.
      const demoOrgIdToDelete = lead.demo_org_id || null;
      const hasDemo = !!demoOrgIdToDelete;

      // STEP 1: ottieni/crea utente Supabase (stessa email del lead)
      let userId = lead.demo_account_id || null;

      if (!userId && lead.email) {
        const tempPassword = generateConversionPassword();
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: lead.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name: lead.name, force_password_change: true }
        });

        if (authData?.user) {
          userId = authData.user.id;
        } else if (authError?.code === 'email_exists') {
          console.log('[CONVERT] User already exists, fetching by email:', lead.email);
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          userId = existingUsers?.users?.find(u => u.email === lead.email)?.id || null;
          if (userId) console.log('[CONVERT] Found existing user:', userId);
        } else if (authError) {
          console.error('[CONVERT] createUser error:', authError.message);
        }
      }

      if (!userId) {
        return res.status(500).json({ error: 'Errore creazione utente: impossibile creare o trovare utente' });
      }

      // STEP 2: crea SEMPRE una nuova org produzione (NO flip della demo)
      const allModules = [...(quote.base_modules || []), ...(quote.special_modules || [])];
      const { data: newOrg, error: orgError } = await supabase
        .from('orgs')
        .insert({
          name: lead.company || lead.name,
          is_demo: false,
          web_access_enabled: true,
          web_features: ['all'],
          desktop_access_enabled: true,
          desktop_modules: allModules,
          converted_from_lead_id: lead.id,
          created_by: userId
        })
        .select()
        .single();

      if (orgError) {
        return res.status(500).json({ error: 'Errore creazione organizzazione', details: orgError.message });
      }

      const targetOrgId = newOrg.id;
      const targetUserId = userId;

      // STEP 3: profilo (current_org → nuova org PRIMA del delete demo),
      //         org_members, operator
      await supabase.from('profiles').upsert({
        id: userId,
        email: lead.email,
        full_name: lead.name,
        current_org: newOrg.id,
        provider: 'email'
      });

      await supabase.from('org_members').upsert({
        org_id: newOrg.id,
        user_id: userId,
        role: 'owner'
      }, { onConflict: 'org_id,user_id' });

      const nameParts = (lead.name || '').trim().split(' ');
      const demoPasswordHash = '$2b$12$g4MkvgG7GkX0xRyVexVCfeJ9fIao/k5IvzDsHCC4l7ggxa88WVQ2e';
      await supabase.from('operators').upsert({
        org_id: newOrg.id,
        user_id: userId,
        nome: nameParts[0] || 'Utente',
        cognome: nameParts.slice(1).join(' ') || 'Nuovo',
        email: lead.email,
        ruolo: 'admin',
        attivo: true,
        codice_operatore: 'ADM001',
        password_hash: demoPasswordHash
      }, { onConflict: 'org_id,email' });

      // STEP 4: hard-delete della org demo (e tutti i suoi dati).
      // La funzione SQL `delete_org_cascade` rifiuta org non-demo per safety.
      // Errori qui sono loggati ma non bloccano la conversione (la prod è già
      // creata e attiva — la demo verrà rimossa al prossimo reset manuale).
      if (demoOrgIdToDelete) {
        const { error: deleteErr } = await supabase.rpc('delete_org_cascade', {
          target_org_id: demoOrgIdToDelete
        });
        if (deleteErr) {
          console.error('[CONVERT] delete_org_cascade error (non-fatal):', deleteErr.message);
        } else {
          console.log('[CONVERT] Demo org hard-deleted:', demoOrgIdToDelete);
        }
      }

      // 5. Aggiorna lead → converted. `demo_org_id` viene nullato da
      // delete_org_cascade ma lo settiamo qui esplicito anche nel caso il
      // delete sia fallito (così l'admin panel non mostra ref dangling).
      await supabase
        .from('leads')
        .update({
          status: 'converted',
          converted_at: new Date().toISOString(),
          demo_org_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      // 5.5. Copia dati aziendali del lead in company_settings
      if (targetOrgId) {
        try {
          await supabase.from('company_settings').upsert({
            org_id: targetOrgId,
            company_name: lead.company || lead.name || '',
            vat_number: lead.vat_number || null,
            codice_fiscale: lead.codice_fiscale || null,
            pec: lead.pec || null,
            phone: lead.phone || null,
            email: lead.email || null,
            address_street: lead.address_street || null,
            address_city: lead.address_city || null,
            address_province: lead.address_province || null,
            address_postal_code: lead.address_postal_code || null,
            address_country: 'IT',
            forma_giuridica: lead.forma_giuridica || null,
            codice_ateco: lead.codice_ateco || null,
            sdi_recipient_code: process.env.SDI_RECIPIENT_CODE || null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'org_id' });
          console.log('[CONVERT] company_settings aggiornato per org_id:', targetOrgId);
        } catch (csErr) {
          console.error('[CONVERT] company_settings upsert error:', csErr.message);
        }

        // 5.6. Aggiorna/crea org_subscriptions → active
        try {
          const periodEnd = new Date();
          if (quote.contract_duration === 'biennial') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 2);
          } else if (quote.contract_duration === 'yearly') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
          }

          await supabase.from('org_subscriptions').upsert({
            org_id: targetOrgId,
            status: 'active',
            plan: quote.plan_type || 'starter',
            billing_type: quote.billing_frequency || 'monthly',
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
            trial_end: null,
            stripe_subscription_id: stripe_subscription_id || null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'org_id' });
          console.log('[CONVERT] org_subscriptions aggiornato per org_id:', targetOrgId);
        } catch (subErr) {
          console.error('[CONVERT] org_subscriptions upsert error:', subErr.message);
        }
      }

      // 6. Genera link setup password
      let setupPasswordUrl = null;
      if (targetUserId && lead.email) {
        try {
          const { data: linkData } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: lead.email,
            options: {
              redirectTo: `${process.env.SITE_URL || 'https://rescuemanager.eu'}/set-password`
            }
          });
          setupPasswordUrl = linkData?.properties?.action_link || null;
          console.log('[CONVERT] Setup password link generato per:', lead.email);
        } catch (linkErr) {
          console.error('[CONVERT] generateLink error:', linkErr.message);
        }
      }

      // 7. Invia email conferma attivazione
      if (lead.email) {
        try {
          console.log('[CONVERT] Building activation email with params:', {
            name: lead.name,
            planType: quote.plan_type,
            monthlyTotal: quote.monthly_total,
            hasSetupUrl: !!setupPasswordUrl,
            hasDemo
          });

          const { html, text } = buildAccountActivatedEmail({
            name: lead.name,
            planType: quote.plan_type,
            modules: [...(quote.base_modules || []), ...(quote.special_modules || [])],
            monthlyTotal: quote.monthly_total,
            setupPasswordUrl,
            hasDemo
          });

          console.log('[CONVERT] Sending activation email to:', lead.email);
          await sendEmail({
            to: lead.email,
            subject: 'Account RescueManager Attivato!',
            html,
            text
          });
          console.log('[CONVERT] Activation email sent successfully');
        } catch (emailErr) {
          console.error('[CONVERT] Email error:', emailErr);
          console.error('[CONVERT] Email error stack:', emailErr.stack);
        }
      }

      res.json({
        success: true,
        message: 'Lead convertito con successo',
        org_id: targetOrgId,
        user_id: targetUserId,
        demo_deleted: hasDemo
      });

    } catch (err) {
      console.error('[CONVERT] Error:', err);
      res.status(500).json({ error: 'Errore interno', details: err.message });
    }
  });

  return router;
};

function generateConversionPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password + '!';
}
