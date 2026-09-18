/**
 * Demo Account Routes
 * POST /api/leads/:id/activate-demo
 * GET  /api/leads/:id/demo
 * POST /api/leads/:id/extend-demo
 */

const express = require('express');
const { sendEmail, buildDemoWelcomeEmail } = require('../lib/email');

module.exports = function createDemoRouter(supabase) {
  const router = express.Router();

  /**
   * POST /api/leads/:id/activate-demo
   * Crea account demo: utente auth + org + lead_demos record
   */
  router.post('/:id/activate-demo', async (req, res) => {
    try {
      const leadId = req.params.id;
      const {
        company_name,
        vat_number,
        phone,
        address,
        city,
        province,
        postal_code,
        duration_days = 7,
        modules = ['trasporti', 'tracking', 'calendario', 'clienti', 'mezzi', 'piazzale', 'autisti', 'ricambi', 'preventivi', 'report'],
        special_modules = []
      } = req.body;

      // 1. Carica lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError || !lead) {
        return res.status(404).json({ error: 'Lead non trovato' });
      }

      if (!lead.email) {
        return res.status(400).json({ error: 'Lead senza email: impossibile creare account demo' });
      }

      // Check se ha già un demo attivo
      if (lead.demo_org_id) {
        const { data: existingDemo } = await supabase
          .from('lead_demos')
          .select('*')
          .eq('lead_id', leadId)
          .eq('status', 'active')
          .single();

        if (existingDemo) {
          return res.status(400).json({ 
            error: 'Demo già attivo per questo lead',
            demo: existingDemo
          });
        }
      }

      // 2. Genera password temporanea
      const tempPassword = generateTempPassword();

      // 3. Crea utente auth in Supabase
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: lead.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: lead.name,
          is_demo: true,
          force_password_change: true
        }
      });

      if (authError) {
        // Se utente esiste già, prova a recuperarlo
        if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
          return res.status(400).json({ 
            error: 'Utente già registrato con questa email. Controlla se esiste già un account.',
            details: authError.message
          });
        }
        return res.status(500).json({ error: 'Errore creazione utente', details: authError.message });
      }

      const userId = authData.user.id;

      // 4. Crea organizzazione demo
      const allModules = [...modules, ...special_modules];
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + duration_days);

      const { data: org, error: orgError } = await supabase
        .from('orgs')
        .insert({
          name: company_name || lead.company || `Demo - ${lead.name}`,
          is_demo: true,
          demo_expires_at: expiresAt.toISOString(),
          web_access_enabled: true,
          web_features: ['quotes_view'],
          desktop_access_enabled: true,
          desktop_modules: allModules,
          converted_from_lead_id: leadId
        })
        .select()
        .single();

      if (orgError) {
        // Cleanup: elimina utente auth
        await supabase.auth.admin.deleteUser(userId);
        return res.status(500).json({ error: 'Errore creazione organizzazione', details: orgError.message });
      }

      // 5. Crea profilo utente
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: lead.email,
          full_name: lead.name,
          current_org: org.id,
          provider: 'email'
        });

      if (profileError) {
        console.error('[DEMO] Profile creation error:', profileError);
      }

      // 6. Associa utente a org (org_members)
      const { error: memberError } = await supabase
        .from('org_members')
        .insert({
          org_id: org.id,
          user_id: userId,
          role: 'owner'
        });

      if (memberError) {
        console.error('[DEMO] Member creation error:', memberError);
      }

      // 7. Crea record lead_demos
      const { data: demo, error: demoError } = await supabase
        .from('lead_demos')
        .insert({
          lead_id: leadId,
          demo_account_id: userId,
          demo_org_id: org.id,
          duration_days,
          modules_enabled: allModules,
          status: 'active',
          activated_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          created_by: req.body.staff_id || null
        })
        .select()
        .single();

      if (demoError) {
        console.error('[DEMO] Demo record creation error:', demoError);
      }

      // 8. Aggiorna lead
      await supabase
        .from('leads')
        .update({
          status: 'demo_active',
          demo_account_id: userId,
          demo_org_id: org.id,
          demo_expires_at: expiresAt.toISOString(),
          demo_modules: allModules,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      // 9. Crea company_settings se forniti dati aziendali
      if (company_name || vat_number) {
        await supabase
          .from('company_settings')
          .insert({
            org_id: org.id,
            company_name: company_name || lead.company || '',
            vat_number: vat_number || null,
            phone: phone || lead.phone || null,
            email: lead.email,
            address_street: address || null,
            address_city: city || null,
            address_province: province || null,
            address_postal_code: postal_code || null,
            address_country: 'IT'
          });
      }

      // 10. Genera link impostazione password
      let setupPasswordUrl = null;
      try {
        const { data: linkData } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: lead.email,
          options: {
            redirectTo: `${process.env.SITE_URL || 'https://rescuemanager.eu'}/set-password`
          }
        });
        setupPasswordUrl = linkData?.properties?.action_link || null;
      } catch (linkErr) {
        console.error('[DEMO] generateLink error:', linkErr.message);
      }

      // 11. Invia email benvenuto demo
      try {
        const { html, text } = buildDemoWelcomeEmail({
          name: lead.name,
          email: lead.email,
          tempPassword: setupPasswordUrl ? null : tempPassword,
          setupPasswordUrl,
          expiresAt,
          modules: allModules,
          companyName: company_name || lead.company
        });

        await sendEmail({
          to: lead.email,
          subject: 'Benvenuto su RescueManager - Il tuo account demo è pronto!',
          html,
          text
        });
      } catch (emailErr) {
        console.error('[DEMO] Email send error:', emailErr.message);
        // Non blocchiamo per errore email
      }

      res.json({
        success: true,
        message: 'Demo attivato con successo',
        demo: {
          id: demo?.id,
          user_id: userId,
          org_id: org.id,
          email: lead.email,
          temp_password: tempPassword,
          expires_at: expiresAt.toISOString(),
          modules: allModules,
          duration_days
        }
      });

    } catch (err) {
      console.error('[DEMO] Activate error:', err);
      res.status(500).json({ error: 'Errore interno', details: err.message });
    }
  });

  /**
   * GET /api/leads/:id/demo
   * Stato demo per un lead
   */
  router.get('/:id/demo', async (req, res) => {
    try {
      const { data: demos, error } = await supabase
        .from('lead_demos')
        .select('*')
        .eq('lead_id', req.params.id)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ success: true, demos: demos || [] });
    } catch (err) {
      res.status(500).json({ error: 'Errore interno', details: err.message });
    }
  });

  /**
   * POST /api/leads/:id/extend-demo
   * Estendi demo di N giorni
   */
  router.post('/:id/extend-demo', async (req, res) => {
    try {
      const { extra_days = 7 } = req.body;

      const { data: demo, error: demoError } = await supabase
        .from('lead_demos')
        .select('*')
        .eq('lead_id', req.params.id)
        .eq('status', 'active')
        .single();

      if (demoError || !demo) {
        return res.status(404).json({ error: 'Nessuna demo attiva trovata' });
      }

      const newExpiry = new Date(demo.expires_at);
      newExpiry.setDate(newExpiry.getDate() + extra_days);

      // Aggiorna lead_demos
      await supabase
        .from('lead_demos')
        .update({ expires_at: newExpiry.toISOString() })
        .eq('id', demo.id);

      // Aggiorna org
      await supabase
        .from('orgs')
        .update({ demo_expires_at: newExpiry.toISOString() })
        .eq('id', demo.demo_org_id);

      // Aggiorna lead
      await supabase
        .from('leads')
        .update({ demo_expires_at: newExpiry.toISOString() })
        .eq('id', req.params.id);

      res.json({
        success: true,
        message: `Demo estesa di ${extra_days} giorni`,
        new_expires_at: newExpiry.toISOString()
      });

    } catch (err) {
      res.status(500).json({ error: 'Errore interno', details: err.message });
    }
  });

  return router;
};

// ─── Helpers ───

function generateTempPassword() {
  const adjectives = ['Quick', 'Smart', 'Fast', 'Bright', 'Swift', 'Bold', 'Sharp', 'Clean'];
  const nouns = ['Tiger', 'Eagle', 'Rocket', 'Storm', 'Flash', 'Wolf', 'Hawk', 'Star'];
  const numbers = Math.floor(Math.random() * 900) + 100;
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}${noun}${numbers}!`;
}
