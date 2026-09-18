/**
 * PDF Generator — Preventivi RescueManager
 *
 * Layout B/N professionale stile preventivo italiano:
 *  - Intestazione con logo + dati fornitore (azienda)
 *  - Box destinatario (cliente)
 *  - Box dettagli preventivo (n., data, scadenza)
 *  - Tabella voci (piano, moduli, pacchetti, setup) con periodicità esplicita
 *  - Riepilogo: canone (listino → sconto → scontato → periodo contratto) + una tantum + totale primo pagamento
 *  - Note legali + footer paginato
 *
 * L'accettazione avviene online (link email / pagamento): nessun blocco timbro-firma.
 */

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { recurringForContract, packageLineTotal, DEFAULT_PRICING } = require('./quotePricing');

// ─── COSTANTI BRANDING ────────────────────────────────────────────────────────
const COMPANY = {
  name: 'RescueManager S.r.l.',
  street: 'Via dello Smeraldo 18',
  city: '93012 Gela (CL)',
  country: 'Italia',
  vat: '02176370852',
  capital: 'Euro 100,00 i.v.',
  pec: 'rescuemanager@legalmail.it',
  email: 'info@rescuemanager.eu',
  website: 'rescuemanager.eu',
  tagline: 'Software gestionale per autodemolitori',
};

// Variante del logo per stampa su fondo bianco: "RESCUE" scuro, "MANAGER" blu.
// (il logo principale ha "RESCUE" bianco e sparisce sulla carta)
const LOGO_PATH = path.join(__dirname, '..', 'assets', 'logo-preventivo.png');
const LOGO_FALLBACK_PATH = path.join(__dirname, '..', 'assets', 'logo-principale-a-colori.png');

const MODULE_LABELS = {
  trasporti: 'Soccorso & trasporti',
  tracking: 'Tracking GPS veicoli',
  calendario: 'Calendario operativo',
  clienti: 'Anagrafica clienti & CRM',
  mezzi: 'Anagrafica veicoli',
  piazzale: 'Custodia veicoli',
  autisti: 'Anagrafica autisti',
  ricambi: 'Magazzino ricambi',
  preventivi: 'Preventivi e vendite',
  report: 'Report e analytics',
  rvfu: 'Demolizioni RVFU (MIT)',
  rentri: 'Registro RENTRI rifiuti',
  fatturazione: 'Fatturazione elettronica SDI',
  contabilita: 'Contabilità',
  marketplace: 'Marketplace ricambi online',
};

const PLAN_LABELS = {
  starter: 'Starter',
  professional: 'Professional',
  business: 'Business',
  full: 'Full',
  flotta: 'Flotta',
  enterprise: 'Enterprise',
  custom: 'Personalizzato',
};

// Toni di grigio
const C = {
  black: '#000000',
  textPrimary: '#1a1a1a',
  textSecondary: '#555555',
  textMuted: '#999999',
  borderDark: '#333333',
  borderMid: '#999999',
  borderLight: '#cccccc',
  bgLight: '#f5f5f5',
  bgDark: '#e8e8e8',
};

const F = { regular: 'Helvetica', bold: 'Helvetica-Bold', italic: 'Helvetica-Oblique' };

// Helpers
let _nf;
try { _nf = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', useGrouping: 'always' }); }
catch (_) { _nf = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }); }
const fmt = (n) => _nf.format(Number(n) || 0);
const fmtDateLong = (d) => {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
};
const pct = (n) => {
  const v = Number(n) || 0;
  return Number.isInteger(v) ? `${v}%` : `${v.toFixed(1).replace('.', ',')}%`;
};

// ─── DOC HELPERS ────────────────────────────────────────────────────────────
function hr(doc, y, color = C.borderLight, thickness = 0.5) {
  doc.save().lineWidth(thickness).strokeColor(color)
     .moveTo(50, y).lineTo(545, y).stroke().restore();
}

function box(doc, x, y, w, h, opts = {}) {
  const stroke = opts.stroke || C.borderMid;
  const fill = opts.fill;
  const lw = opts.lineWidth || 0.5;
  doc.save().lineWidth(lw).strokeColor(stroke);
  if (fill) doc.rect(x, y, w, h).fillAndStroke(fill, stroke);
  else doc.rect(x, y, w, h).stroke();
  doc.restore();
}

function label(doc, text, x, y, opts = {}) {
  doc.font(F.bold).fontSize(opts.size || 7).fillColor(opts.color || C.textMuted)
     .text(text.toUpperCase(), x, y, { characterSpacing: 0.5, ...opts });
}

// ─── HEADER ─────────────────────────────────────────────────────────────────
function drawHeader(doc) {
  // Logo (top-left)
  try {
    const logo = fs.existsSync(LOGO_PATH) ? LOGO_PATH : (fs.existsSync(LOGO_FALLBACK_PATH) ? LOGO_FALLBACK_PATH : null);
    if (logo) {
      doc.image(logo, 50, 44, { fit: [190, 38] });
    } else {
      doc.font(F.bold).fontSize(18).fillColor(C.black).text(COMPANY.name, 50, 50);
    }
  } catch (_) {
    doc.font(F.bold).fontSize(18).fillColor(C.black).text(COMPANY.name, 50, 50);
  }

  // Dati azienda (top-right)
  doc.font(F.bold).fontSize(10).fillColor(C.black)
     .text(COMPANY.name, 350, 45, { width: 195, align: 'right' });
  doc.font(F.regular).fontSize(8).fillColor(C.textSecondary)
     .text(COMPANY.street, 350, 60, { width: 195, align: 'right' })
     .text(`${COMPANY.city} — ${COMPANY.country}`, 350, 71, { width: 195, align: 'right' })
     .text(`P.IVA ${COMPANY.vat} — Cap. soc. ${COMPANY.capital}`, 350, 82, { width: 195, align: 'right' })
     .text(`PEC ${COMPANY.pec}`, 350, 93, { width: 195, align: 'right' });

  // Linea separatrice
  hr(doc, 115, C.borderDark, 1);
}

// ─── BOX DESTINATARIO + DETTAGLI ────────────────────────────────────────────
function drawClientAndDetails(doc, lead, quote) {
  const startY = 130;
  const boxH = 110;

  // Box "Spettabile" (sinistra)
  box(doc, 50, startY, 240, boxH, { stroke: C.borderDark, lineWidth: 0.8 });
  label(doc, 'Spettabile', 60, startY + 8);

  let y = startY + 22;
  doc.font(F.bold).fontSize(11).fillColor(C.black)
     .text(lead.company || lead.name || '—', 60, y, { width: 220 });
  y += 16;

  if (lead.company && lead.name) {
    doc.font(F.regular).fontSize(9).fillColor(C.textSecondary)
       .text(`c.a. ${lead.name}`, 60, y, { width: 220 });
    y += 12;
  }

  doc.font(F.regular).fontSize(9).fillColor(C.textPrimary);
  const addrParts = [lead.address_street, lead.address_city && `${lead.address_postal_code || ''} ${lead.address_city} (${lead.address_province || ''})`.trim()].filter(Boolean);
  if (addrParts.length) {
    addrParts.forEach((p) => {
      doc.text(p, 60, y, { width: 220 });
      y += 11;
    });
  }
  if (lead.vat_number) {
    doc.text(`P.IVA ${lead.vat_number}`, 60, y, { width: 220 });
    y += 11;
  }
  if (lead.codice_fiscale && lead.codice_fiscale !== lead.vat_number) {
    doc.text(`C.F. ${lead.codice_fiscale}`, 60, y, { width: 220 });
    y += 11;
  }
  if (lead.pec) {
    doc.fontSize(8).fillColor(C.textSecondary).text(`PEC ${lead.pec}`, 60, y, { width: 220 });
  }

  // Box dettagli preventivo (destra)
  box(doc, 305, startY, 240, boxH, { stroke: C.borderDark, lineWidth: 0.8 });
  label(doc, 'Preventivo n.', 315, startY + 8);
  doc.font(F.bold).fontSize(14).fillColor(C.black)
     .text(quote.quote_number || '—', 315, startY + 20);

  // Tabella interna dettagli (2 colonne)
  const detRows = [
    ['Data emissione', fmtDateLong(quote.quote_date || quote.created_at)],
    ['Validità', fmtDateLong(quote.expiry_date)],
    ['Modalità', quote.payment_method === 'card' ? 'Carta di credito' : quote.payment_method === 'bank_transfer' ? 'Bonifico bancario' : quote.payment_method === 'sepa' ? 'SEPA Direct Debit' : '—'],
    ['Durata contratto', quote.contract_duration === 'yearly' ? 'Annuale' : quote.contract_duration === 'biennial' ? 'Biennale' : 'Mensile'],
  ];

  let dy = startY + 45;
  detRows.forEach((row) => {
    doc.font(F.regular).fontSize(8).fillColor(C.textSecondary).text(row[0], 315, dy, { width: 105 });
    doc.font(F.bold).fontSize(9).fillColor(C.black).text(row[1], 420, dy, { width: 115, align: 'right' });
    dy += 13;
  });

  return startY + boxH + 20;
}

// ─── TITOLO PREVENTIVO ─────────────────────────────────────────────────────
function drawTitle(doc, quote, y) {
  doc.font(F.bold).fontSize(16).fillColor(C.black)
     .text(quote.quote_title || `Offerta commerciale ${PLAN_LABELS[quote.plan_type] || ''}`.trim(), 50, y, { width: 495 });
  y += 22;
  if (quote.special_terms) {
    doc.font(F.italic).fontSize(9).fillColor(C.textSecondary)
       .text(quote.special_terms, 50, y, { width: 495, lineGap: 2 });
    y += doc.heightOfString(quote.special_terms, { width: 495 }) + 8;
  }
  return y + 8;
}

// ─── TABELLA VOCI ──────────────────────────────────────────────────────────
// Colonne tabella (x position + width)
const COLS = {
  desc:   { x: 55,  w: 255 },
  qty:    { x: 315, w: 30,  align: 'right' },
  unit:   { x: 350, w: 85,  align: 'right' },
  amount: { x: 440, w: 100, align: 'right' },
};
const TABLE_X = 50;
const TABLE_W = 495;
const PERIOD_LABEL = { monthly: 'al mese', one_time: 'una tantum', note: '' };

function ensureSpace(doc, y, needed) {
  if (y + needed > 760) {
    doc.addPage();
    drawHeader(doc);
    return 130;
  }
  return y;
}

function drawTableHeader(doc, y) {
  const headerH = 22;
  box(doc, TABLE_X, y, TABLE_W, headerH, { fill: C.bgDark, stroke: C.borderDark, lineWidth: 0.8 });
  doc.font(F.bold).fontSize(8).fillColor(C.black);
  doc.text('DESCRIZIONE', COLS.desc.x, y + 8, { characterSpacing: 0.5 });
  doc.text('Q.TÀ', COLS.qty.x, y + 8, { width: COLS.qty.w, align: 'right', characterSpacing: 0.5 });
  doc.text('PREZZO UNIT.', COLS.unit.x, y + 8, { width: COLS.unit.w, align: 'right', characterSpacing: 0.5 });
  doc.text('IMPORTO', COLS.amount.x, y + 8, { width: COLS.amount.w, align: 'right', characterSpacing: 0.5 });
  return y + headerH;
}

function drawItemsTable(doc, quote, y) {
  const baseModules = quote.base_modules || [];
  const specialModules = quote.special_modules || [];
  const packages = Array.isArray(quote.packages) ? quote.packages : [];

  y = drawTableHeader(doc, y);

  // Riga: piano base (prezzo di listino mensile, prima dello sconto)
  const planLabel = `Piano ${PLAN_LABELS[quote.plan_type] || quote.plan_type}`;
  const basePrice = quote.custom_base_price !== null && quote.custom_base_price !== undefined
    ? Number(quote.custom_base_price)
    : Number(quote.base_price) || 0;

  const modList = baseModules.map((m) => MODULE_LABELS[m] || m);
  let modDesc = modList.join(' · ');
  if (modList.length > 6) {
    modDesc = modList.slice(0, 6).join(' · ') + ` e altri ${modList.length - 6} moduli`;
  }
  y = drawRow(doc, y, planLabel, modDesc, 1, basePrice, basePrice, 'monthly');

  // Righe: moduli speciali
  for (const mod of specialModules) {
    const priceMap = {
      rvfu: quote.custom_rvfu_price ?? DEFAULT_PRICING.special_modules.rvfu,
      rentri: quote.custom_rentri_price ?? DEFAULT_PRICING.special_modules.rentri,
      fatturazione: quote.custom_fatturazione_price ?? DEFAULT_PRICING.special_modules.fatturazione,
    };
    const p = Number(priceMap[mod] ?? 0);
    y = drawRow(doc, y, `Modulo ${MODULE_LABELS[mod] || mod}`, 'Modulo aggiuntivo', 1, p, p, 'monthly');
  }

  // Riga: personalizzazioni
  if (quote.customizations && Number(quote.customizations_price) > 0) {
    y = drawRow(doc, y, 'Personalizzazioni', quote.customizations, 1, Number(quote.customizations_price), Number(quote.customizations_price), 'monthly');
  }

  // Righe: pacchetti mensili (fanno parte del canone)
  for (const p of packages.filter((x) => x.billing === 'monthly')) {
    y = drawRow(doc, y, p.name, p.description || 'Servizio aggiuntivo', p.quantity || 1, Number(p.price), packageLineTotal(p), 'monthly');
  }

  // Riga: setup (una tantum)
  if (Number(quote.setup_fee) > 0) {
    y = drawRow(doc, y, 'Setup iniziale', quote.setup_description || 'Configurazione, import dati, formazione', 1, Number(quote.setup_fee), Number(quote.setup_fee), 'one_time');
  }

  // Righe: pacchetti una tantum
  for (const p of packages.filter((x) => x.billing === 'one_time')) {
    y = drawRow(doc, y, p.name, p.description || 'Servizio una tantum', p.quantity || 1, Number(p.price), packageLineTotal(p), 'one_time');
  }

  // Righe: voci informative (senza importo, es. visure a consumo)
  for (const p of packages.filter((x) => x.billing === 'note')) {
    y = drawRow(doc, y, p.name, p.description || '', null, null, null, 'note');
  }

  return y;
}

function drawRow(doc, y, title, description, qty, unitPrice, total, period) {
  const titleH = doc.font(F.bold).fontSize(10).heightOfString(title, { width: COLS.desc.w });
  const descH = description
    ? doc.font(F.regular).fontSize(8).heightOfString(description, { width: COLS.desc.w })
    : 0;
  const rowH = Math.max(27, titleH + descH + 11);

  y = ensureSpace(doc, y, rowH + 4);
  // Se siamo su una pagina nuova, ridisegna l'intestazione tabella
  if (y === 130) y = drawTableHeader(doc, y);

  box(doc, TABLE_X, y, TABLE_W, rowH, { stroke: C.borderLight, lineWidth: 0.4 });

  doc.font(F.bold).fontSize(10).fillColor(C.black)
     .text(title, COLS.desc.x, y + 6, { width: COLS.desc.w });

  if (description) {
    doc.font(F.regular).fontSize(8).fillColor(C.textSecondary)
       .text(description, COLS.desc.x, y + 6 + titleH + 2, { width: COLS.desc.w });
  }

  if (period === 'note') {
    doc.font(F.italic).fontSize(8).fillColor(C.textMuted)
       .text('voce informativa', COLS.unit.x, y + (rowH - 8) / 2, { width: COLS.unit.w + COLS.amount.w + 5, align: 'right' });
    return y + rowH;
  }

  // Colonne prezzo: importo + periodicità su seconda riga piccola
  const priceY = y + (rowH - 18) / 2;
  doc.font(F.regular).fontSize(10).fillColor(C.textPrimary)
     .text(String(qty), COLS.qty.x, priceY, { width: COLS.qty.w, align: 'right' });
  doc.text(fmt(unitPrice), COLS.unit.x, priceY, { width: COLS.unit.w, align: 'right' });
  doc.font(F.bold).text(fmt(total), COLS.amount.x, priceY, { width: COLS.amount.w, align: 'right' });
  doc.font(F.regular).fontSize(7).fillColor(C.textMuted)
     .text(PERIOD_LABEL[period] || '', COLS.amount.x, priceY + 12, { width: COLS.amount.w, align: 'right' });

  return y + rowH;
}

// ─── TOTALI + NOTE (affiancati: note a sinistra, riepilogo a destra) ───────
const TOT_X = 290;
const TOT_W = 255;
const NOTES_W = 225;
const ROW_H = 14;

function buildTotalsRows(quote) {
  const monthly = Number(quote.monthly_total) || 0;
  const discountPct = Number(quote.discount_percent) || 0;
  const discountAmt = Number(quote.discount_amount) || 0;
  const monthlyList = monthly + discountAmt; // canone mensile di listino (prima dello sconto)
  const yearly = Number(quote.yearly_total) || Math.round(monthly * 12 * (1 - DEFAULT_PRICING.yearly_discount) * 100) / 100;
  const biennial = Math.round(monthly * 24 * (1 - DEFAULT_PRICING.biennial_discount) * 100) / 100;
  const setup = Number(quote.setup_fee) || 0;
  const packages = Array.isArray(quote.packages) ? quote.packages : [];
  const oneTimePkgs = packages.filter((p) => p.billing === 'one_time');
  const oneTime = Number(quote.one_time_total) || (setup + oneTimePkgs.reduce((s, p) => s + packageLineTotal(p), 0));
  const isYearly = quote.contract_duration === 'yearly';
  const isBiennial = quote.contract_duration === 'biennial';
  const isMonthly = !isYearly && !isBiennial;
  const recurring = recurringForContract(quote);
  const periodWord = isYearly ? 'anno' : isBiennial ? 'biennio' : 'mese';

  // rows: { kind: 'label'|'row'|'gap', text, value, bold, muted }
  const rows = [];
  rows.push({ kind: 'label', text: 'Canone' });
  if (discountPct > 0) {
    rows.push({ kind: 'row', text: 'Canone mensile di listino', value: fmt(monthlyList), muted: true });
    rows.push({ kind: 'row', text: `Sconto ${pct(discountPct)}${quote.discount_reason ? ` (${quote.discount_reason})` : ''}`, value: `- ${fmt(discountAmt)}` });
    rows.push({ kind: 'row', text: 'Canone mensile scontato', value: fmt(monthly), bold: isMonthly });
  } else {
    rows.push({ kind: 'row', text: 'Canone mensile', value: fmt(monthly), bold: isMonthly });
  }
  if (isYearly) {
    rows.push({ kind: 'row', text: `Canone annuale (12 mesi, -${Math.round(DEFAULT_PRICING.yearly_discount * 100)}%)`, value: fmt(yearly), bold: true });
    rows.push({ kind: 'row', text: `Sconto pagamento anticipato · pari a ${fmt(yearly / 12)}/mese`, muted: true, small: true });
  } else if (isBiennial) {
    rows.push({ kind: 'row', text: `Canone biennale (24 mesi, -${Math.round(DEFAULT_PRICING.biennial_discount * 100)}%)`, value: fmt(biennial), bold: true });
    rows.push({ kind: 'row', text: `Sconto pagamento anticipato · pari a ${fmt(biennial / 24)}/mese`, muted: true, small: true });
  }

  if (oneTime > 0) {
    rows.push({ kind: 'gap' });
    rows.push({ kind: 'label', text: 'Una tantum (solo al primo pagamento)' });
    if (setup > 0) rows.push({ kind: 'row', text: 'Setup iniziale', value: fmt(setup) });
    for (const p of oneTimePkgs) {
      rows.push({ kind: 'row', text: p.quantity > 1 ? `${p.name} × ${p.quantity}` : p.name, value: fmt(packageLineTotal(p)) });
    }
    rows.push({ kind: 'row', text: 'Totale una tantum', value: fmt(oneTime), bold: true });
  }

  const grandTotal = recurring + oneTime;
  const grand = {
    label: oneTime > 0 ? 'TOTALE PRIMO PAGAMENTO' : 'TOTALE OFFERTA',
    value: fmt(grandTotal),
    lines: oneTime > 0
      ? [`Canone ${fmt(recurring)}/${periodWord} + una tantum ${fmt(oneTime)}`, `Periodi successivi: ${fmt(recurring)}/${periodWord}`]
      : [`Canone ${fmt(recurring)} ogni ${periodWord}`],
    vat: quote.prices_include_vat === false
      ? 'Importi IVA esclusa: verrà applicata IVA 22% in fattura.'
      : 'Importi IVA inclusa.',
  };

  return { rows, grand };
}

function totalsHeight(rows, grand) {
  let h = 0;
  for (const r of rows) h += r.kind === 'label' ? 11 : r.kind === 'gap' ? 6 : (r.bold ? ROW_H + 3 : ROW_H);
  h += 4 + 7 + 16 + grand.lines.length * 10 + 12 + 6;
  return h;
}

function drawTotals(doc, quote, y) {
  const { rows, grand } = buildTotalsRows(quote);
  let cur = y;
  for (const r of rows) {
    if (r.kind === 'label') { label(doc, r.text, TOT_X, cur, { size: 7 }); cur += 11; continue; }
    if (r.kind === 'gap') { cur += 6; continue; }
    rowTotal(doc, cur, r.text, r.value, r);
    cur += r.bold ? ROW_H + 3 : ROW_H;
  }

  // ── Totale
  cur += 4;
  doc.save().lineWidth(1.5).strokeColor(C.black)
     .moveTo(TOT_X, cur).lineTo(TOT_X + TOT_W, cur).stroke().restore();
  cur += 7;
  doc.font(F.bold).fontSize(11).fillColor(C.black)
     .text(grand.label, TOT_X, cur, { width: 175, lineBreak: false })
     .text(grand.value, TOT_X + 175, cur, { width: TOT_W - 175, align: 'right', lineBreak: false });
  cur += 16;
  doc.font(F.regular).fontSize(7.5).fillColor(C.textSecondary);
  for (const l of grand.lines) {
    doc.text(l, TOT_X, cur, { width: TOT_W, align: 'right', lineBreak: false });
    cur += 10;
  }
  cur += 2;
  doc.font(F.bold).fontSize(7.5).fillColor(C.textPrimary)
     .text(grand.vat, TOT_X, cur, { width: TOT_W, align: 'right', lineBreak: false });
  return cur + 12;
}

function rowTotal(doc, y, label_, value_, opts = {}) {
  const color = opts.muted ? C.textSecondary : C.textPrimary;
  const size = opts.small ? 7.5 : opts.bold ? 10.5 : 9;
  doc.font(opts.bold ? F.bold : (opts.small ? F.italic : F.regular)).fontSize(size).fillColor(color)
     .text(label_, TOT_X, y, { width: value_ ? TOT_W - 85 : TOT_W, lineBreak: false });
  if (value_) {
    doc.text(value_, TOT_X + TOT_W - 85, y, { width: 85, align: 'right', lineBreak: false });
  }
}

function buildNotes(quote) {
  const notes = [];
  if (quote.contract_duration === 'yearly' || quote.contract_duration === 'biennial') {
    notes.push(`Contratto vincolante per la durata indicata (${quote.contract_duration === 'yearly' ? 'annuale' : 'biennale'}). Rinnovo tacito salvo disdetta con preavviso di 30 giorni.`);
  }
  if (Number(quote.discount_percent) > 0) {
    notes.push('Lo sconto si applica al canone ricorrente; le voci una tantum sono a prezzo pieno.');
  }
  if (quote.terms_and_conditions) notes.push(quote.terms_and_conditions);
  notes.push('Offerta valida fino alla data di scadenza indicata. Accettazione tramite il link ricevuto via email oppure con il pagamento del primo canone.');
  notes.push(quote.prices_include_vat === false
    ? 'Prezzi in Euro, IVA esclusa: l\'IVA 22% verrà applicata in fattura. Imposte e tasse aggiuntive a carico del Cliente.'
    : 'Prezzi in Euro, IVA inclusa.');
  notes.push(`Foro competente: Caltanissetta. Condizioni generali su ${COMPANY.website}/terms-of-use.`);
  return notes;
}

function notesHeight(doc, notes) {
  doc.font(F.regular).fontSize(7.5);
  let h = 12 + 6;
  for (const n of notes) h += doc.heightOfString(`• ${n}`, { width: NOTES_W, lineGap: 1.5 }) + 3;
  return h;
}

function drawNotes(doc, quote, y) {
  const notes = buildNotes(quote);
  label(doc, 'Note e condizioni', 50, y, { size: 7 });
  y += 12;
  box(doc, 50, y, NOTES_W, 1, { stroke: C.borderDark, lineWidth: 0.8 });
  y += 6;
  doc.font(F.regular).fontSize(7.5).fillColor(C.textPrimary);
  for (const n of notes) {
    doc.text(`• ${n}`, 50, y, { width: NOTES_W, lineGap: 1.5 });
    y = doc.y + 3;
  }
  return y;
}

function drawTotalsAndNotes(doc, quote, y) {
  const { rows, grand } = buildTotalsRows(quote);
  const needed = Math.max(totalsHeight(rows, grand), notesHeight(doc, buildNotes(quote))) + 16;
  y = ensureSpace(doc, y + 14, needed);
  const endTotals = drawTotals(doc, quote, y);
  const endNotes = drawNotes(doc, quote, y);
  return Math.max(endTotals, endNotes);
}

// ─── FOOTER ─────────────────────────────────────────────────────────────────
// Single-line footer compatto (~6.5pt) per stare garantito in una riga.
// Disegnato su tutte le pagine reali tramite bufferedPageRange.
function drawFooter(doc) {
  const range = doc.bufferedPageRange();
  const totalPages = range.count;
  for (let i = range.start; i < range.start + totalPages; i++) {
    doc.switchToPage(i);
    // Il footer sta sotto il margine inferiore: azzera il margine sulla pagina
    // corrente, altrimenti pdfkit aggiunge una pagina vuota per ogni riga.
    doc.page.margins.bottom = 0;

    const footerY = 790;
    doc.save().lineWidth(0.5).strokeColor(C.borderLight)
       .moveTo(50, footerY).lineTo(545, footerY).stroke().restore();

    // Singola riga su 495 (full width) — font 6.5pt
    doc.font(F.regular).fontSize(6.5).fillColor(C.textMuted)
       .text(
         `${COMPANY.name} · ${COMPANY.street}, ${COMPANY.city} · P.IVA ${COMPANY.vat} · Cap. soc. ${COMPANY.capital} · ${COMPANY.email} · ${COMPANY.website}`,
         50, footerY + 5, { width: 460, align: 'left', lineBreak: false }
       );

    doc.text(`${i + 1} / ${totalPages}`, 510, footerY + 5, { width: 35, align: 'right' });
  }
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
async function generateQuotePDF(quote, lead) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 60, left: 50, right: 50 },
        bufferPages: true,
        info: {
          Title: `Preventivo ${quote.quote_number}`,
          Author: COMPANY.name,
          Subject: `Offerta commerciale per ${lead.company || lead.name}`,
          Creator: COMPANY.name,
        },
      });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      drawHeader(doc);
      let y = drawClientAndDetails(doc, lead, quote);
      y = drawTitle(doc, quote, y);
      y = drawItemsTable(doc, quote, y);
      drawTotalsAndNotes(doc, quote, y);

      drawFooter(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateQuotePDF };
