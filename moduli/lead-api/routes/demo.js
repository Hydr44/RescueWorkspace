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
        special_modules = [],
        // v2 (Mag 2026): distinzione tipo demo + seed dati.
        // - demo_type: 'showcase' | 'trial' | 'pilot'
        // - seed_data: se true chiama public.seed_demo_data(org_id) per popolare
        //   clienti/autisti/mezzi/trasporti/fatture/ricambi/piazzale demo.
        demo_type = null,
        seed_data = false,
        seed_profile = null,
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

      // 3. Crea utente auth in Supabase. Se la mail esiste già (lead in
      //    conversione tornato dopo demo cancellata, oppure lead duplicato)
      //    riusiamo l'utente esistente invece di errare. Con la nuova
      //    architettura (org_demo separata da org_prod) un utente può avere
      //    più org: questo è il caso normale, non più un edge case.
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

      console.log('[DEMO] createUser response:', JSON.stringify({ authData, authError }, null, 2));

      let userId = null;
      let reusedExistingUser = false;

      if (authData?.user?.id) {
        userId = authData.user.id;
      } else if (authError && (authError.code === 'email_exists'
                               || (authError.message || '').includes('already been registered')
                               || (authError.message || '').includes('already exists'))) {
        // Utente già in auth: recupero per email
        console.log('[DEMO] User exists, fetching by email:', lead.email);
        const { data: existingUsers, error: listErr } = await supabase.auth.admin.listUsers();
        if (listErr) {
          return res.status(500).json({ error: 'Errore lookup utente esistente', details: listErr.message });
        }
        const found = existingUsers?.users?.find(u => u.email === lead.email);
        if (!found?.id) {
          return res.status(500).json({ error: 'Utente già registrato ma non recuperabile da listUsers' });
        }
        userId = found.id;
        reusedExistingUser = true;
        console.log('[DEMO] Reusing existing user:', userId);
      } else if (authError) {
        console.error('[DEMO] Auth error:', authError);
        return res.status(500).json({ error: 'Errore creazione utente', details: authError.message });
      } else {
        console.error('[DEMO] Invalid authData:', authData);
        return res.status(500).json({ error: 'Errore creazione utente', details: 'authData.user.id is null or undefined' });
      }

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
          converted_from_lead_id: leadId,
          created_by: userId
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

      // (rimosso upsert su `org_modules` table: era legacy/dannoso. Il
      // CHECK constraint accetta solo 5 valori billing, non i nomi UI.
      // La fonte canonica è `orgs.desktop_modules` già aggiornato sopra,
      // letto da useSubscription nel desktop.)

      // 6b. Seed dati demo se richiesto (showcase/pilot).
      // La funzione SQL `public.seed_demo_data(p_org_id)` è idempotente
      // (ON CONFLICT su prefisso DEMO-), quindi anche se la chiamiamo due
      // volte non duplica. Errore qui non blocca: la demo può essere usata
      // comunque, il seed è "nice to have".
      let seedAppliedCounters = null;
      if (seed_data === true) {
        try {
          const { data: counters, error: seedErr } = await supabase.rpc('seed_demo_data', { p_org_id: org.id });
          if (seedErr) {
            console.error('[DEMO] seed_demo_data error (non-fatal):', seedErr.message);
          } else {
            seedAppliedCounters = Array.isArray(counters) ? counters[0] : counters;
            console.log('[DEMO] Seed applicato:', seedAppliedCounters);
          }
        } catch (seedCatch) {
          console.error('[DEMO] seed_demo_data exception (non-fatal):', seedCatch.message);
        }
      }

      // 7. Crea record lead_demos. Includiamo demo_type e sample_data_loaded
      // se le colonne esistono (gestito gracefully — l'insert ignora chiavi
      // ignote se Postgrest le marca? No, fallisce. Quindi facciamo un
      // payload "safe" e proviamo l'estensione separatamente).
      const leadDemoPayload = {
        lead_id: leadId,
        demo_account_id: userId,
        demo_org_id: org.id,
        duration_days,
        modules_enabled: allModules,
        status: 'active',
        activated_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        sample_data_loaded: seed_data === true,
        created_by: req.body.staff_id || null
      };
      if (demo_type) leadDemoPayload.demo_type = demo_type;
      if (seed_profile) leadDemoPayload.seed_profile = seed_profile;

      let { data: demo, error: demoError } = await supabase
        .from('lead_demos')
        .insert(leadDemoPayload)
        .select()
        .single();

      // Fallback: se colonne demo_type/seed_profile non esistono ancora in
      // DB, ritenta senza quelle chiavi (codice 42703 = undefined_column).
      if (demoError && /column .* does not exist|42703/i.test(demoError.message || '')) {
        console.warn('[DEMO] lead_demos extended cols mancanti, retry senza demo_type/seed_profile:', demoError.message);
        delete leadDemoPayload.demo_type;
        delete leadDemoPayload.seed_profile;
        const retry = await supabase.from('lead_demos').insert(leadDemoPayload).select().single();
        demo = retry.data; demoError = retry.error;
      }

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

      // 9. Crea/aggiorna company_settings con tutti i dati dal lead
      await supabase
        .from('company_settings')
        .upsert({
          org_id: org.id,
          created_by: userId,
          company_name: company_name || lead.company || '',
          vat_number: vat_number || lead.vat_number || null,
          codice_fiscale: lead.codice_fiscale || null,
          pec: lead.pec || null,
          forma_giuridica: lead.forma_giuridica || null,
          codice_ateco: lead.codice_ateco || null,
          phone: phone || lead.phone || null,
          email: lead.email,
          address_street: address || lead.address_street || null,
          address_city: city || lead.address_city || null,
          address_province: province || lead.address_province || null,
          address_postal_code: postal_code || lead.address_postal_code || null,
          address_country: 'IT',
          sdi_recipient_code: process.env.SDI_RECIPIENT_CODE || null
        }, { onConflict: 'org_id' });

      // 9b. Crea org_subscriptions (trial)
      await supabase
        .from('org_subscriptions')
        .upsert({
          org_id: org.id,
          status: 'trial',
          plan: 'demo',
          trial_end: expiresAt.toISOString(),
          current_period_end: expiresAt.toISOString()
        }, { onConflict: 'org_id' });

      // 9c. Crea operatore default per l'utente demo
      const nameParts = (lead.name || '').trim().split(' ');
      const operatorNome = nameParts[0] || 'Utente';
      const operatorCognome = nameParts.slice(1).join(' ') || 'Demo';
      // Hash statico placeholder — il login avviene sempre via OAuth Supabase, non via password
      const demoPasswordHash = '$2b$12$g4MkvgG7GkX0xRyVexVCfeJ9fIao/k5IvzDsHCC4l7ggxa88WVQ2e';
      await supabase
        .from('operators')
        .upsert({
          org_id: org.id,
          user_id: userId,
          nome: operatorNome,
          cognome: operatorCognome,
          email: lead.email,
          ruolo: 'admin',
          attivo: true,
          codice_operatore: 'ADM001',
          password_hash: demoPasswordHash
        }, { onConflict: 'org_id,email' });

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
          // Se l'utente esisteva già la tempPassword generata NON è stata
          // applicata (la sua password resta quella precedente). In quel
          // caso lo staff deve usare il setup_password_url o "resend recovery".
          temp_password: reusedExistingUser ? null : tempPassword,
          reused_existing_user: reusedExistingUser,
          expires_at: expiresAt.toISOString(),
          modules: allModules,
          duration_days,
          demo_type: demo_type || null,
          seed_applied: seed_data === true,
          seed_counters: seedAppliedCounters,
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
   * PATCH /api/leads/:id/demo/modules
   * Aggiorna i moduli abilitati su una demo attiva. Modifica in atomico:
   *   - orgs.desktop_modules    (consumato da useOrgFeatures legacy)
   *   - org_modules table       (consumato da useSubscription canonico)
   *   - lead_demos.modules_enabled (storico per metriche)
   *
   * Body: { modules: ['trasporti','sdi',...] }
   */
  router.patch('/:id/demo/modules', async (req, res) => {
    try {
      const leadId = req.params.id;
      const { modules } = req.body || {};

      if (!Array.isArray(modules)) {
        return res.status(400).json({ error: 'modules[] richiesto' });
      }

      // 1. Trova la demo attiva del lead
      const { data: demo, error: demoErr } = await supabase
        .from('lead_demos')
        .select('id, demo_org_id, expires_at, status')
        .eq('lead_id', leadId)
        .eq('status', 'active')
        .order('activated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (demoErr) return res.status(500).json({ error: demoErr.message });
      if (!demo) return res.status(404).json({ error: 'Nessuna demo attiva trovata per questo lead' });

      const orgId = demo.demo_org_id;
      const expiresAt = demo.expires_at;

      // 2. Aggiorna orgs.desktop_modules
      await supabase
        .from('orgs')
        .update({ desktop_modules: modules })
        .eq('id', orgId);

      // (Rimosso sync su `org_modules` table: legacy. La fonte canonica
      // è `orgs.desktop_modules` aggiornata sopra. useSubscription nel
      // desktop legge da lì.)

      // 4. lead_demos.modules_enabled (storico)
      await supabase
        .from('lead_demos')
        .update({ modules_enabled: modules, updated_at: new Date().toISOString() })
        .eq('id', demo.id);

      res.json({ success: true, modules, org_id: orgId, demo_id: demo.id });
    } catch (err) {
      console.error('[DEMO modules] Error:', err);
      res.status(500).json({ error: 'Errore interno', details: err.message });
    }
  });

  /**
   * GET /api/leads/:id/demo/activity
   * Statistiche utilizzo demo: ultimo accesso, conteggi dati creati.
   * Risposta:
   *   {
   *     last_sign_in_at,           // da auth.admin.getUserById (Supabase nativo)
   *     created_at_user,
   *     counts: { clients, transports, vehicles, invoices, quotes, ... }
   *   }
   */
  router.get('/:id/demo/activity', async (req, res) => {
    try {
      const leadId = req.params.id;

      // 1. Demo attiva
      const { data: demo } = await supabase
        .from('lead_demos')
        .select('demo_account_id, demo_org_id, activated_at, expires_at, modules_enabled, status')
        .eq('lead_id', leadId)
        .order('activated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!demo) return res.status(404).json({ error: 'Nessuna demo trovata per questo lead' });

      // 2. auth.users (Supabase popola automaticamente last_sign_in_at)
      let authMeta = null;
      try {
        const { data: authData, error: authErr } = await supabase.auth.admin.getUserById(demo.demo_account_id);
        if (!authErr && authData?.user) {
          authMeta = {
            email: authData.user.email,
            last_sign_in_at: authData.user.last_sign_in_at,
            created_at: authData.user.created_at,
            confirmed_at: authData.user.confirmed_at,
          };
        }
      } catch (e) {
        console.warn('[DEMO activity] getUserById fail:', e.message);
      }

      // 3. Conteggi tabelle org-scoped (defensive: alcune potrebbero mancare)
      const orgId = demo.demo_org_id;
      const tablesToCount = [
        'clients', 'transports', 'vehicles', 'invoices', 'quotes',
        'rentri_formulari', 'rvfu_cases', 'spare_parts', 'drivers'
      ];

      const counts = {};
      await Promise.all(tablesToCount.map(async (t) => {
        try {
          const { count, error } = await supabase
            .from(t)
            .select('id', { count: 'exact', head: true })
            .eq('org_id', orgId);
          if (!error) counts[t] = count || 0;
        } catch { /* tabella non esiste in questo schema, ignora */ }
      }));

      res.json({
        success: true,
        demo: {
          activated_at: demo.activated_at,
          expires_at: demo.expires_at,
          status: demo.status,
          modules_enabled: demo.modules_enabled,
        },
        auth: authMeta,
        counts,
      });
    } catch (err) {
      console.error('[DEMO activity] Error:', err);
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

  /**
   * POST /api/leads/:id/resend-recovery-link
   * Genera e invia nuovo link di recovery password
   */
  router.post('/:id/resend-recovery-link', async (req, res) => {
    try {
      const { demo_account_id } = req.body;
      
      const { data: lead } = await supabase
        .from('leads')
        .select('email, name')
        .eq('id', req.params.id)
        .single();

      if (!lead || !lead.email) {
        return res.status(404).json({ error: 'Lead non trovato o senza email' });
      }

      // Genera nuovo link recovery
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: lead.email,
        options: {
          redirectTo: `${process.env.SITE_URL || 'https://rescuemanager.eu'}/set-password`
        }
      });

      if (linkError) {
        return res.status(500).json({ error: 'Errore generazione link', details: linkError.message });
      }

      const setupPasswordUrl = linkData?.properties?.action_link;

      // Invia email
      const { sendEmail, buildDemoWelcomeEmail } = require('../lib/email');
      const { html, text } = buildDemoWelcomeEmail({
        name: lead.name,
        email: lead.email,
        tempPassword: null,
        setupPasswordUrl,
        expiresAt: null,
        modules: [],
        companyName: null
      });

      await sendEmail({
        to: lead.email,
        subject: 'RescueManager - Imposta la tua password',
        html,
        text
      });

      res.json({ success: true, message: 'Link inviato con successo' });

    } catch (err) {
      console.error('[DEMO] Resend recovery link error:', err);
      res.status(500).json({ error: 'Errore interno', details: err.message });
    }
  });

  /**
   * POST /api/leads/:id/deactivate-demo
   * Disattiva una demo attiva
   */
  router.post('/:id/deactivate-demo', async (req, res) => {
    try {
      const { demo_id } = req.body;

      // Aggiorna stato demo
      const { error: demoError } = await supabase
        .from('lead_demos')
        .update({ status: 'cancelled' })
        .eq('id', demo_id);

      if (demoError) {
        return res.status(500).json({ error: 'Errore aggiornamento demo', details: demoError.message });
      }

      // Recupera info demo per aggiornare org e lead
      const { data: demo } = await supabase
        .from('lead_demos')
        .select('demo_org_id, lead_id')
        .eq('id', demo_id)
        .single();

      if (demo) {
        // Aggiorna org (imposta scadenza a ora)
        await supabase
          .from('orgs')
          .update({ demo_expires_at: new Date().toISOString() })
          .eq('id', demo.demo_org_id);

        // Aggiorna lead
        await supabase
          .from('leads')
          .update({ demo_expires_at: new Date().toISOString() })
          .eq('id', demo.lead_id);
      }

      res.json({ success: true, message: 'Demo disattivata' });

    } catch (err) {
      console.error('[DEMO] Deactivate error:', err);
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
