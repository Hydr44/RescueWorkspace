/**
 * Quote Routes
 * POST /api/leads/:id/quotes         - Crea preventivo
 * GET  /api/leads/:id/quotes         - Lista preventivi lead
 * GET  /api/leads/:id/quotes/:qid    - Dettaglio preventivo
 * PUT  /api/leads/:id/quotes/:qid    - Aggiorna preventivo
 * POST /api/leads/:id/quotes/:qid/send - Invia preventivo via email
 */

const express = require('express');
const { generateQuotePDF } = require('../lib/pdf');
const { sendEmail, buildQuoteEmail } = require('../lib/email');

// Prezzi default
const DEFAULT_PRICING = {
  plans: {
    starter: 19.99,
    flotta: 98.99,
    enterprise: 149.99,
    custom: 0
  },
  special_modules: {
    rvfu: 29.99,
    rentri: 29.99,
    fatturazione: 19.99
  },
  yearly_discount: 0.10
};

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
        staff_id
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
      const { data: quoteNumData } = await supabase.rpc('generate_quote_number');
      const quoteNumber = quoteNumData || `QUOTE-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

      // 3. Calcola prezzi
      const basePrice = custom_base_price ?? DEFAULT_PRICING.plans[plan_type] ?? 0;
      
      let specialModulesPrice = 0;
      for (const mod of special_modules) {
        if (mod === 'rvfu') specialModulesPrice += custom_rvfu_price ?? DEFAULT_PRICING.special_modules.rvfu;
        else if (mod === 'rentri') specialModulesPrice += custom_rentri_price ?? DEFAULT_PRICING.special_modules.rentri;
        else if (mod === 'fatturazione') specialModulesPrice += custom_fatturazione_price ?? DEFAULT_PRICING.special_modules.fatturazione;
      }

      const monthlySubtotal = basePrice + specialModulesPrice + customizations_price;
      const discountAmount = (monthlySubtotal * discount_percent) / 100;
      const monthlyTotal = monthlySubtotal - discountAmount;
      const yearlyTotal = monthlyTotal * 12 * (1 - DEFAULT_PRICING.yearly_discount);

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
          base_price: basePrice,
          special_modules_price: specialModulesPrice,
          customizations_price: customizations_price,
          discount_percent,
          discount_amount: discountAmount,
          monthly_total: monthlyTotal,
          yearly_total: yearlyTotal,
          setup_fee,
          custom_base_price: custom_base_price ?? null,
          custom_rvfu_price: custom_rvfu_price ?? null,
          custom_rentri_price: custom_rentri_price ?? null,
          custom_fatturazione_price: custom_fatturazione_price ?? null,
          contract_duration,
          payment_method,
          billing_frequency,
          special_terms,
          status: 'draft',
          quote_date: quoteDate.toISOString().split('T')[0],
          expiry_date: expiryDate.toISOString().split('T')[0],
          created_by: staff_id || null
        })
        .select()
        .single();

      if (quoteError) {
        return res.status(500).json({ error: 'Errore creazione preventivo', details: quoteError.message });
      }

      // 6. Genera PDF
      try {
        const pdfBuffer = await generateQuotePDF(quote, lead);
        
        // Upload PDF su Supabase Storage
        const pdfFileName = `quotes/${quote.id}/${quoteNumber}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(pdfFileName, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(pdfFileName);

          await supabase
            .from('lead_quotes')
            .update({ pdf_url: urlData.publicUrl })
            .eq('id', quote.id);

          quote.pdf_url = urlData.publicUrl;
        } else {
          console.error('[QUOTES] PDF upload error:', uploadError);
        }
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
   * Aggiorna preventivo (solo se draft)
   */
  router.put('/:id/quotes/:qid', async (req, res) => {
    try {
      const { data: existing, error: existError } = await supabase
        .from('lead_quotes')
        .select('status')
        .eq('id', req.params.qid)
        .single();

      if (existError || !existing) {
        return res.status(404).json({ error: 'Preventivo non trovato' });
      }

      if (existing.status !== 'draft') {
        return res.status(400).json({ error: 'Solo i preventivi in bozza possono essere modificati' });
      }

      const updateData = {};
      const allowedFields = [
        'plan_type', 'base_modules', 'special_modules', 'customizations',
        'base_price', 'special_modules_price', 'customizations_price',
        'discount_percent', 'discount_amount', 'monthly_total', 'yearly_total',
        'setup_fee', 'custom_base_price', 'custom_rvfu_price',
        'custom_rentri_price', 'custom_fatturazione_price',
        'contract_duration', 'payment_method', 'billing_frequency',
        'special_terms', 'expiry_date'
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      const { data: quote, error } = await supabase
        .from('lead_quotes')
        .update(updateData)
        .eq('id', req.params.qid)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
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

      // Genera PDF se non esiste
      if (!quote.pdf_url) {
        try {
          const pdfBuffer = await generateQuotePDF(quote, lead);
          const pdfFileName = `quotes/${quote.id}/${quote.quote_number}.pdf`;
          await supabase.storage
            .from('documents')
            .upload(pdfFileName, pdfBuffer, { contentType: 'application/pdf', upsert: true });

          const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(pdfFileName);

          quote.pdf_url = urlData.publicUrl;

          await supabase
            .from('lead_quotes')
            .update({ pdf_url: quote.pdf_url })
            .eq('id', quote.id);
        } catch (pdfErr) {
          console.error('[QUOTES] PDF error on send:', pdfErr.message);
        }
      }

      // Costruisci email
      const publicUrl = `https://rescuemanager.eu/quotes/${quote.public_uuid}`;
      const { html, text } = buildQuoteEmail({
        leadName: lead.name,
        quoteNumber: quote.quote_number,
        planType: quote.plan_type,
        monthlyTotal: quote.monthly_total,
        yearlyTotal: quote.yearly_total,
        expiryDate: quote.expiry_date,
        publicUrl,
        pdfUrl: quote.pdf_url,
        specialModules: quote.special_modules,
        baseModules: quote.base_modules,
        setupFee: quote.setup_fee,
        discountPercent: quote.discount_percent
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

  return router;
};
