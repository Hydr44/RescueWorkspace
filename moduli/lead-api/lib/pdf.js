/**
 * PDF Generator - Lead API
 * Genera PDF preventivi con PDFKit
 */

const PDFDocument = require('pdfkit');

const MODULE_LABELS = {
  trasporti: 'Trasporti',
  tracking: 'Tracking GPS',
  calendario: 'Calendario',
  clienti: 'Clienti & CRM',
  mezzi: 'Mezzi',
  piazzale: 'Piazzale',
  autisti: 'Autisti',
  ricambi: 'Ricambi',
  preventivi: 'Preventivi',
  report: 'Report',
  rvfu: 'Demolizioni RVFU',
  rentri: 'RENTRI',
  fatturazione: 'Fatturazione Elettronica & Contabilità'
};

const PLAN_LABELS = {
  starter: 'Starter',
  flotta: 'Flotta',
  enterprise: 'Enterprise',
  custom: 'Custom'
};

function fmt(n) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

/**
 * Genera PDF preventivo
 * @param {Object} quote - Record dalla tabella lead_quotes
 * @param {Object} lead - Record dalla tabella leads
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateQuotePDF(quote, lead) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ─── Header ───
      doc.rect(0, 0, 595.28, 100).fill('#0f172a');

      // Logo
      const logoPath = require('path').join(__dirname, '../assets/logo-principale-a-colori.png');
      doc.image(logoPath, 50, 25, { height: 28 });
      
      doc.fontSize(12).fillColor('#bfdbfe').text('Software Gestionale per Autodemolizioni', 50, 60);
      doc.fontSize(10).fillColor('#bfdbfe').text(`Preventivo ${quote.quote_number}`, 50, 78);

      // ─── Info Azienda (destra) ───
      doc.fontSize(9).fillColor('#dbeafe');
      doc.text('RescueManager di Scozzarini Emmanuel', 350, 30, { align: 'right', width: 200 });
      doc.text('P.IVA: 02166430856', 350, 44, { align: 'right', width: 200 });
      doc.text('info@rescuemanager.eu', 350, 58, { align: 'right', width: 200 });
      doc.text('rescuemanager.eu', 350, 72, { align: 'right', width: 200 });

      // ─── Info Cliente ───
      doc.fillColor('#333333');
      doc.fontSize(11).text('Destinatario', 50, 120, { underline: true });
      doc.fontSize(10);
      let y = 138;
      doc.text(`Nome: ${lead.name || ''}`, 50, y); y += 16;
      if (lead.company) { doc.text(`Azienda: ${lead.company}`, 50, y); y += 16; }
      if (lead.email) { doc.text(`Email: ${lead.email}`, 50, y); y += 16; }
      if (lead.phone) { doc.text(`Tel: ${lead.phone}`, 50, y); y += 16; }

      // ─── Info Preventivo (destra) ───
      doc.fontSize(11).text('Dettagli Preventivo', 350, 120, { underline: true, width: 200 });
      doc.fontSize(10);
      doc.text(`Numero: ${quote.quote_number}`, 350, 138);
      doc.text(`Data: ${new Date(quote.quote_date).toLocaleDateString('it-IT')}`, 350, 154);
      doc.text(`Scadenza: ${new Date(quote.expiry_date).toLocaleDateString('it-IT')}`, 350, 170);
      doc.text(`Durata: ${quote.contract_duration === 'yearly' ? 'Annuale' : quote.contract_duration === 'biennial' ? 'Biennale' : 'Mensile'}`, 350, 186);

      y = Math.max(y, 210) + 10;

      // ─── Separatore ───
      doc.moveTo(50, y).lineTo(545, y).stroke('#e5e7eb');
      y += 20;

      // ─── Piano Selezionato ───
      doc.fontSize(13).fillColor('#1e40af').text('Piano Selezionato', 50, y);
      y += 22;

      doc.fontSize(16).fillColor('#10b981').text(
        `${PLAN_LABELS[quote.plan_type] || quote.plan_type} — ${fmt(quote.base_price)}/mese`,
        50, y
      );
      y += 28;

      // ─── Moduli Base ───
      doc.fontSize(11).fillColor('#333333').text('Moduli Base Inclusi:', 50, y);
      y += 18;

      const baseModules = quote.base_modules || [];
      const cols = 2;
      const colWidth = 240;

      for (let i = 0; i < baseModules.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const xPos = 60 + col * colWidth;
        const yPos = y + row * 16;

        doc.fontSize(9).fillColor('#555555');
        doc.text(`✓  ${MODULE_LABELS[baseModules[i]] || baseModules[i]}`, xPos, yPos);
      }

      y += Math.ceil(baseModules.length / cols) * 16 + 12;

      // ─── Moduli Speciali ───
      const specialModules = quote.special_modules || [];
      if (specialModules.length > 0) {
        doc.fontSize(11).fillColor('#333333').text('Moduli Speciali:', 50, y);
        y += 18;

        for (const mod of specialModules) {
          let price = 0;
          if (mod === 'rvfu') price = quote.custom_rvfu_price || 29.99;
          else if (mod === 'rentri') price = quote.custom_rentri_price || 29.99;
          else if (mod === 'fatturazione') price = quote.custom_fatturazione_price || 19.99;

          doc.fontSize(9).fillColor('#555555');
          doc.text(`+  ${MODULE_LABELS[mod] || mod}`, 60, y);
          doc.text(fmt(price) + '/mese', 400, y, { align: 'right', width: 145 });
          y += 16;
        }
        y += 8;
      }

      // ─── Personalizzazioni ───
      if (quote.customizations) {
        doc.fontSize(11).fillColor('#333333').text('Personalizzazioni:', 50, y);
        y += 18;
        doc.fontSize(9).fillColor('#555555').text(quote.customizations, 60, y, { width: 400 });
        y += doc.heightOfString(quote.customizations, { width: 400 }) + 8;

        if (quote.customizations_price > 0) {
          doc.text(`Costo personalizzazioni: ${fmt(quote.customizations_price)}/mese`, 60, y);
          y += 16;
        }
        y += 8;
      }

      // Check page break
      if (y > 620) {
        doc.addPage();
        y = 50;
      }

      // ─── Riepilogo Prezzi ───
      doc.moveTo(50, y).lineTo(545, y).stroke('#e5e7eb');
      y += 16;

      doc.fontSize(13).fillColor('#1e40af').text('Riepilogo Economico', 50, y);
      y += 24;

      const priceRows = [
        ['Piano Base', fmt(quote.base_price) + '/mese'],
      ];

      if (quote.special_modules_price > 0) {
        priceRows.push(['Moduli Speciali', fmt(quote.special_modules_price) + '/mese']);
      }

      if (quote.customizations_price > 0) {
        priceRows.push(['Personalizzazioni', fmt(quote.customizations_price) + '/mese']);
      }

      if (quote.discount_percent > 0) {
        priceRows.push([`Sconto (${quote.discount_percent}%)`, `-${fmt(quote.discount_amount)}`]);
      }

      if (quote.setup_fee > 0) {
        priceRows.push(['Setup iniziale (una tantum)', fmt(quote.setup_fee)]);
      }

      for (const [label, value] of priceRows) {
        doc.fontSize(10).fillColor('#555555').text(label, 50, y);
        doc.fontSize(10).fillColor('#333333').text(value, 400, y, { align: 'right', width: 145 });
        y += 18;
      }

      // Totale
      doc.moveTo(50, y).lineTo(545, y).stroke('#10b981');
      y += 10;

      doc.fontSize(14).fillColor('#10b981').text('Totale Mensile', 50, y);
      doc.fontSize(14).fillColor('#10b981').text(fmt(quote.monthly_total) + '/mese', 400, y, { align: 'right', width: 145 });
      y += 22;

      if (quote.yearly_total) {
        doc.fontSize(10).fillColor('#666666').text('Totale Annuale (-10% sconto)', 50, y);
        doc.fontSize(10).fillColor('#666666').text(fmt(quote.yearly_total) + '/anno', 400, y, { align: 'right', width: 145 });
        y += 18;
      }

      // ─── Condizioni ───
      if (quote.special_terms) {
        y += 16;
        doc.fontSize(11).fillColor('#333333').text('Condizioni Speciali:', 50, y);
        y += 18;
        doc.fontSize(9).fillColor('#555555').text(quote.special_terms, 60, y, { width: 480 });
        y += doc.heightOfString(quote.special_terms, { width: 480 }) + 8;
      }

      // ─── Note legali ───
      if (y > 680) { doc.addPage(); y = 50; }

      y += 20;
      doc.moveTo(50, y).lineTo(545, y).stroke('#e5e7eb');
      y += 12;

      doc.fontSize(8).fillColor('#999999');
      doc.text('Questo preventivo è valido fino alla data di scadenza indicata. I prezzi sono IVA esclusa.', 50, y, { width: 500 });
      y += 12;
      doc.text('Il servizio è soggetto ai Termini e Condizioni disponibili su rescuemanager.eu/terms.', 50, y, { width: 500 });
      y += 12;
      doc.text(`Preventivo generato il ${new Date().toLocaleDateString('it-IT')} — RescueManager di Scozzarini Emmanuel — P.IVA 02166430856`, 50, y, { width: 500 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateQuotePDF };
