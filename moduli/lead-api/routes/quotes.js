/**
 * Quote Routes
 * POST /api/leads/:id/quotes         - Crea preventivo
 * GET  /api/leads/:id/quotes         - Lista preventivi lead
 * GET  /api/leads/:id/quotes/:qid    - Dettaglio preventivo
 * PUT  /api/leads/:id/quotes/:qid    - Aggiorna preventivo (solo draft) — ricalcola totali e rigenera PDF
 * POST /api/leads/:id/quotes/:qid/send - Invia preventivo via email (PDF sempre rigenerato)
 *
 * I totali sono calcolati SOLO qui (lib/quotePricing.js): il client manda i campi
 * di input (prezzi custom, sconto, pacchetti…) e il server salva le colonne derivate.
 */

const express = require('express');
const { generateQuotePDF } = require('../lib/pdf');
const { sendEmail, buildQuoteEmail, buildPaymentLinkEmail } = require('../lib/email');
const { computeQuoteTotals } = require('../lib/quotePricing');

const SITE_URL = () => process.env.SITE_URL || 'https://rescuemanager.eu';

/** Genera il PDF, lo carica sul bucket privato e aggiorna pdf_url (proxy del sito). */
async function regeneratePdf(supabase, quote, lead) {
  const pdfBuffer = await generateQuotePDF(quote, lead);
  const pdfFileName = `quotes/${quote.id}/${quote.quote_number}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(pdfFileName, pdfBuffer, { contentType: 'application/pdf', upsert: true });
  if (uploadError) throw new Error(uploadError.message || 'upload fallito');

  const proxyUrl = `${SITE_URL()}/api/quotes/${quote.public_uuid}/pdf`;
  await supabase.from('lead_quotes').update({ pdf_url: proxyUrl }).eq('id', quote.id);
  quote.pdf_url = proxyUrl;
  return proxyUrl;
}

module.exports = function createQuotesRouter(supabase) {
  const router = express.Router();

  /**
   * POST /api/leads/:id/quotes
   * Crea nuovo preventivo per un lead
   */
  router.post('/:id/quotes', async (req, res) => {
    try {
      const leadId = req.params.id;
      const {
        plan_type = 'starter',
        base_modules = ['trasporti', 'tracking', 'calendario', 'clienti', 'mezzi', 'piazzale', 'autisti', 'ricambi', 'preventivi', 'report'],
        special_modules = [],
        customizations,
        customizations_price = 0,
        discount_percent = 0,
        setup_fee = 0,
        contract_duration = 'monthly',
        payment_method = 'card',
        billing_frequency = 'monthly',
        special_terms,
        expiry_days = 30,
        // Prezzi custom (override dei default)
        custom_base_price,
        custom_rvfu_price,
        custom_rentri_price,
        custom_fatturazione_price,
        // Pacchetti / servizi extra + regime IVA dei prezzi indicati
        packages = [],
        prices_include_vat = true,
        // v2 fields
        quote_title,
        internal_notes,
        terms_and_conditions,
        auto_activate_on_payment = false,
        requires_approval = false,
        discount_reason,
        trial_unit,
        trial_quantity,
        includes_onboarding = false,
        onboarding_hours,
        includes_training = false,
        training_hours,
        includes_data_import = false,
        sla_response_hours,
        setup_description,
        internal_reference,
        staff_id,
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

      // 2. Genera numero preventivo
      // Numerazione: PR01/26, PR02/26, ... (progressivo per anno)
      const { data: quoteNumData } = await supabase.rpc('generate_quote_number');
      const yy = String(new Date().getFullYear()).slice(-2);
      const quoteNumber = quoteNumData || `PR${String(Math.floor(Math.random() * 99) + 1).padStart(2, '0')}/${yy}`;

      // 3. Calcola prezzi (unica fonte)
      const totals = computeQuoteTotals({
        plan_type, special_modules, customizations_price, discount_percent, setup_fee,
        custom_base_price, custom_rvfu_price, custom_rentri_price, custom_fatturazione_price,
        packages,
      });

      // 4. Date
      const quoteDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiry_days);

      // 5. Inserisci preventivo
      const { data: quote, error: quoteError } = await supabase
        .from('lead_quotes')
        .insert({
          lead_id: leadId,
          quote_number: quoteNumber,
          plan_type,
          base_modules,
          special_modules,
          customizations,
          base_price: totals.base_price,
          special_modules_price: totals.special_modules_price,
          customizations_price: totals.customizations_price,
          discount_percent: totals.discount_percent,
          discount_amount: totals.discount_amount,
          monthly_total: totals.monthly_total,
          yearly_total: totals.yearly_total,
          setup_fee: totals.setup_fee,
          packages: totals.packages,
          one_time_total: totals.one_time_total,
          prices_include_vat: prices_include_vat !== false,
          custom_base_price: custom_base_price ?? null,
          custom_rvfu_price: custom_rvfu_price ?? null,
          custom_rentri_price: custom_rentri_price ?? null,
          custom_fatturazione_price: custom_fatturazione_price ?? null,
          contract_duration,
          payment_method,
          billing_frequency,
          special_terms,
          // v2 fields
          quote_title: quote_title || null,
          internal_notes: internal_notes || null,
          terms_and_conditions: terms_and_conditions || null,
          auto_activate_on_payment,
          requires_approval,
          discount_reason: discount_reason || null,
          trial_unit: trial_unit || null,
          trial_quantity: trial_quantity || null,
          includes_onboarding,
          onboarding_hours: onboarding_hours || null,
          includes_training,
          training_hours: training_hours || null,
          includes_data_import,
          sla_response_hours: sla_response_hours || null,
          setup_description: setup_description || null,
          internal_reference: internal_reference || null,
          // Se requires_approval=true il preventivo non può essere inviato/accettato
          // finché un owner non l'approva (POST /approve)
          status: requires_approval ? 'pending_approval' : 'draft',
          quote_date: quoteDate.toISOString().split('T')[0],
          expiry_date: expiryDate.toISOString().split('T')[0],
          created_by: staff_id || null
        })
        .select()
        .single();

      if (quoteError) {
        return res.status(500).json({ error: 'Errore creazione preventivo', details: quoteError.message });
      }

      // 6. Genera PDF + upload bucket Supabase (privato)
      // L'URL pubblico restituito è il nostro proxy https://rescuemanager.eu/api/quotes/<uuid>/pdf
      // (no link Supabase esposto ai clienti)
      try {
        await regeneratePdf(supabase, quote, lead);
      } catch (pdfErr) {
        console.error('[QUOTES] PDF generation error:', pdfErr.message);
      }

      res.json({
        success: true,
        message: 'Preventivo creato con successo',
        quote
      });

    } catch (err) {
      console.error('[QUOTES] Create error:', err);
      res.status(500).json({ error: 'Errore interno', details: err.message });
    }
  });

  /**
   * GET /api/leads/:id/quotes
   * Lista preventivi per un lead
   */
  router.get('/:id/quotes', async (req, res) => {
    try {
      const { data: quotes, error } = await supabase
        .from('lead_quotes')
        .select('*')
        .eq('lead_id', req.params.id)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ success: true, quotes: quotes || [] });
    } catch (err) {
      res.status(500).json({ error: 'Errore interno', details: err.message });
    }
  });

  /**
   * GET /api/leads/:id/quotes/:qid
   * Dettaglio preventivo
   */
  router.get('/:id/quotes/:qid', async (req, res) => {
    try {
      const { data: quote, error } = await supabase
        .from('lead_quotes')
        .select('*, lead_quote_modifications(*)')
        .eq('id', req.params.qid)
        .eq('lead_id', req.params.id)
        .single();

      if (error || !quote) {
        return res.status(404).json({ error: 'Preventivo non trovato' });
      }

      res.json({ success: true, quote });
    } catch (err) {
      res.status(500).json({ error: 'Errore interno', details: err.message });
    }
  });

  /**
   * PUT /api/leads/:id/quotes/:qid
   * Aggiorna preventivo (solo se draft). I totali vengono sempre ricalcolati
   * lato server dai campi di input e il PDF rigenerato.
   */
  router.put('/:id/quotes/:qid', async (req, res) => {
    try {
      const { data: existing, error: existError } = await supabase
        .from('lead_quotes')
        .select('*')
        .eq('id', req.params.qid)
        .eq('lead_id', req.params.id)
        .single();

      if (existError || !existing) {
        return res.status(404).json({ error: 'Preventivo non trovato' });
      }

      if (existing.status !== 'draft') {
        return res.status(400).json({ error: 'Solo i preventivi in bozza possono essere modificati' });
      }

      // Campi di INPUT modificabili (le colonne derivate non si accettano dal client)
      const inputFields = [
        'plan_type', 'base_modules', 'special_modules', 'customizations', 'customizations_price',
        'discount_percent', 'discount_reason', 'setup_fee', 'setup_description',
        'custom_base_price', 'custom_rvfu_price', 'custom_rentri_price', 'custom_fatturazione_price',
        'packages', 'prices_include_vat',
        'contract_duration', 'payment_method', 'billing_frequency',
        'special_terms', 'terms_and_conditions', 'internal_notes', 'quote_title', 'expiry_date',
        'trial_unit', 'trial_quantity',
        'includes_onboarding', 'onboarding_hours', 'includes_training', 'training_hours',
        'includes_data_import', 'sla_response_hours', 'internal_reference',
      ];

      const updateData = {};
      for (const field of inputFields) {
        if (req.body[field] !== undefined) updateData[field] = req.body[field];
      }
      if ('prices_include_vat' in updateData) updateData.prices_include_vat = updateData.prices_include_vat !== false;

      const merged = { ...existing, ...updateData };
      const totals = computeQuoteTotals(merged);
      Object.assign(updateData, {
        base_price: totals.base_price,
        special_modules_price: totals.special_modules_price,
        customizations_price: totals.customizations_price,
        discount_percent: totals.discount_percent,
        discount_amount: totals.discount_amount,
        monthly_total: totals.monthly_total,
        yearly_total: totals.yearly_total,
        setup_fee: totals.setup_fee,
        packages: totals.packages,
        one_time_total: totals.one_time_total,
        updated_at: new Date().toISOString(),
      });

      const { data: quote, error } = await supabase
        .from('lead_quotes')
        .update(updateData)
        .eq('id', req.params.qid)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // PDF allineato ai nuovi dati
      try {
        const { data: lead } = await supabase.from('leads').select('*').eq('id', req.params.id).single();
        if (lead) await regeneratePdf(supabase, quote, lead);
      } catch (pdfErr) {
        console.error('[QUOTES] PDF regeneration error on update:', pdfErr.message);
      }

      res.json({ success: true, quote });
    } catch (err) {
      res.status(500).json({ error: 'Errore interno', details: err.message });
    }
  });

  /**
   * POST /api/leads/:id/quotes/:qid/send
   * Invia preventivo via email al lead
   */
  router.post('/:id/quotes/:qid/send', async (req, res) => {
    try {
      // Carica preventivo
      const { data: quote, error: quoteError } = await supabase
        .from('lead_quotes')
        .select('*')
        .eq('id', req.params.qid)
        .eq('lead_id', req.params.id)
        .single();

      if (quoteError || !quote) {
        return res.status(404).json({ error: 'Preventivo non trovato' });
      }

      // Carica lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (leadError || !lead) {
        return res.status(404).json({ error: 'Lead non trovato' });
      }

      if (!lead.email) {
        return res.status(400).json({ error: 'Lead senza email' });
      }

      // PDF sempre rigenerato all'invio: così riflette dati lead/preventivo correnti
      try {
        await regeneratePdf(supabase, quote, lead);
      } catch (pdfErr) {
        console.error('[QUOTES] PDF error on send:', pdfErr.message);
      }

      // Costruisci email
      const publicUrl = `${SITE_URL()}/quotes/${quote.public_uuid}`;
      const { html, text } = buildQuoteEmail({
        leadName: lead.name,
        quoteNumber: quote.quote_number,
        planType: quote.plan_type,
        monthlyTotal: quote.monthly_total,
        yearlyTotal: quote.yearly_total,
        contractDuration: quote.contract_duration,
        expiryDate: quote.expiry_date,
        publicUrl,
        pdfUrl: quote.pdf_url,
        specialModules: quote.special_modules,
        baseModules: quote.base_modules,
        setupFee: quote.setup_fee,
        discountPercent: quote.discount_percent,
        packages: quote.packages || [],
        oneTimeTotal: quote.one_time_total,
        pricesIncludeVat: quote.prices_include_vat !== false,
      });

      // Invia email
      await sendEmail({
        to: lead.email,
        subject: `Preventivo RescueManager - ${quote.quote_number}`,
        html,
        text
      });

      // Aggiorna status
      await supabase
        .from('lead_quotes')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', quote.id);

      // Aggiorna lead status
      await supabase
        .from('leads')
        .update({
          status: 'quote_sent',
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      res.json({
        success: true,
        message: `Preventivo inviato a ${lead.email}`,
        public_url: publicUrl
      });

    } catch (err) {
      console.error('[QUOTES] Send error:', err);
      res.status(500).json({ error: 'Errore interno', details: err.message });
    }
  });

  /**
   * POST /api/leads/:id/quotes/:qid/send-payment-link
   * Invia email brandata cliente con link Stripe pagamento.
   * Body: { checkout_url, staff_id? }
   * Usato dopo che admin approva accept cliente su preventivi requires_approval.
   */
  router.post('/:id/quotes/:qid/send-payment-link', async (req, res) => {
    try {
      const { checkout_url, staff_id } = req.body;
      if (!checkout_url) return res.status(400).json({ error: 'checkout_url richiesto' });

      const { data: quote, error: qErr } = await supabase
        .from('lead_quotes').select('*').eq('id', req.params.qid).eq('lead_id', req.params.id).single();
      if (qErr || !quote) return res.status(404).json({ error: 'Preventivo non trovato' });

      const { data: lead, error: lErr } = await supabase
        .from('leads').select('*').eq('id', req.params.id).single();
      if (lErr || !lead) return res.status(404).json({ error: 'Lead non trovato' });
      if (!lead.email) return res.status(400).json({ error: 'Lead senza email' });

      const { html, text } = buildPaymentLinkEmail({
        leadName: lead.name,
        quoteNumber: quote.quote_number,
        planType: quote.plan_type,
        monthlyTotal: quote.monthly_total,
        yearlyTotal: quote.yearly_total,
        contractDuration: quote.contract_duration,
        checkoutUrl: checkout_url,
        expiryDate: quote.expiry_date,
      });

      await sendEmail({
        to: lead.email,
        subject: `Approvato — Procedi al pagamento del preventivo ${quote.quote_number}`,
        html, text,
      });

      // Log email_campaigns
      await supabase.from('email_campaigns').insert({
        lead_id: lead.id, to_email: lead.email,
        subject: `Approvato — Procedi al pagamento del preventivo ${quote.quote_number}`,
        body_html: html, body_text: text,
        status: 'sent', sent_at: new Date().toISOString(),
        sent_by: staff_id || null,
        related_quote_id: quote.id,
      });

      res.json({ success: true, message: 'Email link pagamento inviata' });
    } catch (err) {
      console.error('[QUOTES] send-payment-link error:', err);
      res.status(500).json({ error: 'Errore interno', details: err.message });
    }
  });

  return router;
};
