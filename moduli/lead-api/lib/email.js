/**
 * Email Service - Lead API
 * Usa nodemailer con SMTP configurato in .env
 *
 * L'HTML segue il modello unico RescueManager (desktop-design/email/email-template.js):
 * testata e piè di pagina nei blu della barra laterale, corpo chiaro, un solo
 * blu #005DFA, un solo pulsante per email, una informazione per riga.
 * Solo tabelle e stili in linea: è quello che Gmail e Outlook capiscono.
 */

const nodemailer = require('nodemailer');

// SMTP Transporter
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.resend.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
      user: process.env.SMTP_USER || 'resend',
      pass: process.env.SMTP_PASS || process.env.RESEND_API_KEY
    }
  });

  return transporter;
}

// Nome mostrato sicuro per l'header From (niente virgolette, virgole, a capo).
function fromDisplayName(name) {
  return String(name || '').replace(/["<>\r\n,;]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 64);
}
function validEmail(e) {
  return typeof e === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.trim()) ? e.trim() : null;
}

/**
 * Invia email.
 * senderName: nome dell'azienda quando l'email parte per conto di un cliente
 *   RescueManager. Il dominio resta il nostro, cambia solo il nome mostrato.
 * replyTo: indirizzo a cui devono arrivare le risposte (di norma l'email
 *   dell'azienda per cui scriviamo). Entrambi sono facoltativi.
 */
async function sendEmail({ to, subject, html, text, attachments, senderName, replyTo }) {
  const transport = getTransporter();
  const addr = process.env.SMTP_FROM || 'info@rescuemanager.eu';
  const perConto = fromDisplayName(senderName);
  const rispondiA = validEmail(replyTo);

  const result = await transport.sendMail({
    from: perConto ? `"${perConto} via RescueManager" <${addr}>` : `"RescueManager" <${addr}>`,
    ...(rispondiA ? { replyTo: rispondiA } : {}),
    to,
    subject,
    html,
    text: text || '',
    attachments: attachments || []
  });

  console.log(`[EMAIL] Sent to ${to}: ${subject} (${result.messageId})`);
  return result;
}

// ─── Modello email condiviso ─────────────────────────────────────────────────

const EMAIL_FONT = "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif";
const BRAND = '#005dfa';
const INK = '#161616';
const INK_2 = '#525252';
const INK_3 = '#8d8d8d';
const LINE = '#e0e0e0';
const PAPER = '#ffffff';
const CANVAS = '#f4f4f4';
const LOGO_URL = 'https://rescuemanager.eu/assets/logos/logo-principale-bianco.png';
// Testata e piè di pagina scuri: HEAD_BG è il blu della barra laterale
// dell'app, FOOT_BG il suo tono di testa e piede.
const HEAD_BG = '#0b3fb5';
const HEAD_TEXT = '#dbe6ff';
const FOOT_BG = '#062a7a';
const FOOT_TEXT = '#a9c2ff';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const p = (t, size = 15, color = INK, extra = '') => `<p style="margin:0 0 14px;font-family:${EMAIL_FONT};font-size:${size}px;line-height:1.6;color:${color};${extra}">${t}</p>`;

// Testata: logo bianco sul blu. Quando l'email parte per conto di un cliente di
// RescueManager, a destra si legge 'per conto di <azienda>'. Le email di questo
// modulo le manda RescueManager stessa, quindi qui 'sender' resta vuoto.
function emailHeader(sender) {
  return `<tr><td style="padding:22px 40px;background:${HEAD_BG};"><table cellpadding="0" cellspacing="0" width="100%"><tr>
<td><img src="${LOGO_URL}" alt="RescueManager" height="26" style="height:26px;width:auto;display:block;border:0;" /></td>
${sender ? `<td align="right" style="font-family:${EMAIL_FONT};font-size:13px;color:${HEAD_TEXT};">per conto di ${sender}</td>` : ''}
</tr></table></td></tr>`;
}

// Titolo e riga di contesto: il titolo dice cosa è successo, la riga sotto a
// chi o quando.
function emailTitle(title, sub) {
  return `<h1 style="margin:0 0 ${sub ? '4' : '20'}px;font-family:${EMAIL_FONT};font-size:22px;line-height:1.25;font-weight:600;letter-spacing:-0.01em;color:${INK};">${title}</h1>${sub ? `<p style="margin:0 0 20px;font-family:${EMAIL_FONT};font-size:14px;color:${INK_2};">${sub}</p>` : ''}`;
}

// Pulsante: uno solo per email, pieno, squadrato, testo normale.
function emailCtaButton(href, label) {
  return `<table cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr><td style="background:${BRAND};"><a href="${href}" style="display:block;padding:13px 28px;font-family:${EMAIL_FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${label}</a></td></tr></table>
<p style="margin:0 0 24px;font-family:${EMAIL_FONT};font-size:12px;line-height:1.6;color:${INK_3};">Se il pulsante non funziona, apri questo indirizzo: <a href="${href}" style="color:${BRAND};text-decoration:none;">${href}</a></p>`;
}

// Codice: grande, monospazio, in un riquadro con la barretta a sinistra.
function emailCodeBox(code, note = 'Vale per 10 minuti') {
  return `<table cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 24px;background:${CANVAS};border-left:3px solid ${BRAND};"><tr><td style="padding:18px 24px;">
<p style="margin:0 0 4px;font-family:${EMAIL_FONT};font-size:13px;color:${INK_2};">Codice</p>
<p style="margin:0;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:30px;font-weight:600;letter-spacing:0.18em;color:${INK};">${code}</p>
<p style="margin:6px 0 0;font-family:${EMAIL_FONT};font-size:12px;color:${INK_3};">${note}</p>
</td></tr></table>`;
}

// Righe etichetta e valore: come le schede dell'app, un dato per riga.
function emailInfoRows(rows) {
  return `<table cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 24px;border-top:1px solid ${LINE};">${rows.map(([l, v]) => `<tr>
<td style="padding:9px 0;border-bottom:1px solid ${LINE};font-family:${EMAIL_FONT};font-size:13px;color:${INK_2};width:150px;vertical-align:top;">${l}</td>
<td style="padding:9px 0;border-bottom:1px solid ${LINE};font-family:${EMAIL_FONT};font-size:13px;color:${INK};vertical-align:top;">${v}</td></tr>`).join('')}</table>`;
}

// Totale in evidenza (preventivi, pagamenti): etichetta sopra, cifra sotto.
function emailAmount(label, value) {
  return `<table cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td style="padding:12px 16px;background:${CANVAS};">
<p style="margin:0;font-family:${EMAIL_FONT};font-size:12px;color:${INK_2};">${label}</p>
<p style="margin:2px 0 0;font-family:${EMAIL_FONT};font-size:26px;font-weight:600;letter-spacing:-0.01em;color:${INK};">${value}</p>
</td></tr></table>`;
}

// Avviso: una riga con la barretta. Rosso solo per le scadenze passate.
function emailNotice(text, level = 'info') {
  const col = level === 'danger' ? '#da1e28' : BRAND;
  return `<table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;"><tr><td style="padding:10px 14px;background:${CANVAS};border-left:3px solid ${col};font-family:${EMAIL_FONT};font-size:13px;line-height:1.5;color:${INK};">${text}</td></tr></table>`;
}

// Piè di pagina: chi manda, perché la ricevi, come rispondere. Niente slogan.
// Quando l'email parte per conto di un cliente RescueManager lo dice a chiare lettere,
// subito prima del motivo per cui la ricevi.
function emailFooter(reason = 'Ricevi questa email perché hai un account RescueManager.', sender = '') {
  return `<tr><td style="padding:20px 40px 24px;background:${FOOT_BG};">
<p style="margin:0 0 4px;font-family:${EMAIL_FONT};font-size:12px;line-height:1.6;color:#ffffff;">RescueManager S.r.l., Gela</p>
${sender ? `<p style="margin:0 0 4px;font-family:${EMAIL_FONT};font-size:12px;line-height:1.6;color:#ffffff;">Questa email è inviata da RescueManager per conto di ${sender}${/[.?]$/.test(sender) ? '' : '.'}</p>` : ''}
<p style="margin:0 0 4px;font-family:${EMAIL_FONT};font-size:12px;line-height:1.6;color:${FOOT_TEXT};">${reason}</p>
<p style="margin:0;font-family:${EMAIL_FONT};font-size:12px;line-height:1.6;color:${FOOT_TEXT};">Per aiuto scrivi a <a href="mailto:info@rescuemanager.eu" style="color:#ffffff;text-decoration:none;">info@rescuemanager.eu</a></p>
</td></tr>`;
}

function emailWrapper(content, preheader = '') {
  return `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="color-scheme" content="light"><title>RescueManager</title></head>
<body style="margin:0;padding:0;background:${CANVAS};font-family:${EMAIL_FONT};">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:${CANVAS};">${preheader}</div>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:${PAPER};border:1px solid ${LINE};">${content}</table>
</td></tr></table></body></html>`;
}

/**
 * Costruisce l'email intera. body: una riga, un paragrafo.
 * Opzioni: sender, title, sub, code, codeNote, rows, amount, notice, cta,
 * note, reason, preheader.
 */
function brandedHtml(body, o = {}) {
  const ps = String(body || '').split('\n').map((l) => (l.trim() ? p(l) : '')).join('');
  const rows = Array.isArray(o.rows) ? o.rows.filter(Boolean) : null;
  const content = `${emailHeader(o.sender)}<tr><td style="padding:32px 40px 8px;">
${o.title ? emailTitle(o.title, o.sub) : ''}${ps}
${o.notice ? emailNotice(o.notice.text, o.notice.level) : ''}
${o.amount ? emailAmount(o.amount.label, o.amount.value) : ''}
${o.code ? emailCodeBox(o.code, o.codeNote) : ''}
${rows && rows.length ? emailInfoRows(rows) : ''}
${o.cta ? emailCtaButton(o.cta.href, o.cta.label) : ''}
${o.note ? p(o.note, 13, INK_2) : ''}
</td></tr>${emailFooter(o.reason, o.sender)}`;
  return emailWrapper(content, o.preheader || o.title || '');
}

// ─── Etichette condivise ─────────────────────────────────────────────────────

const PLAN_LABELS = {
  starter: 'Starter', professional: 'Professional', business: 'Business',
  full: 'Full', flotta: 'Flotta', enterprise: 'Enterprise', custom: 'Personalizzato',
};

// Nomi che il cliente riconosce, senza sigle inutili.
const MODULE_LABELS = {
  trasporti: 'Soccorso e trasporti',
  tracking: 'Posizione dei mezzi',
  calendario: 'Calendario',
  clienti: 'Clienti',
  mezzi: 'Mezzi',
  piazzale: 'Custodia veicoli',
  autisti: 'Autisti',
  ricambi: 'Ricambi',
  preventivi: 'Preventivi',
  report: 'Report',
  rvfu: 'Demolizione veicoli',
  rentri: 'Registri rifiuti RENTRI',
  fatturazione: 'Fatturazione elettronica',
};

const LOGIN_URL = 'https://rescuemanager.eu/login';

// Importi come li scrive un italiano: 1.788,00 euro (niente simbolo, si legge meglio).
function fmtEur(n) {
  const v = new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always',
  }).format(Number(n) || 0);
  return `${v} euro`;
}
function fmtDataLunga(iso) {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ─── Email account demo ──────────────────────────────────────────────────────

/**
 * Email Benvenuto Demo
 */
function buildDemoWelcomeEmail({ name, email, tempPassword, setupPasswordUrl, expiresAt, modules, companyName }) {
  const expiryStr = expiresAt ? fmtDataLunga(expiresAt) : null;
  const modulesList = (modules || []).map((m) => MODULE_LABELS[m] || m);

  const rows = [['Indirizzo per entrare', esc(email)]];
  if (!setupPasswordUrl && tempPassword) {
    rows.push(['Password temporanea', `<span style="font-family:ui-monospace,Menlo,Consolas,monospace;">${esc(tempPassword)}</span>`]);
  }
  if (expiryStr) rows.push(['La demo vale fino al', expiryStr]);
  if (modulesList.length) rows.push(['Cosa puoi provare', esc(modulesList.join(', '))]);

  const body = [
    `${companyName ? `L'account demo per ${esc(companyName)} è pronto.` : 'Il tuo account demo è pronto.'}`,
    setupPasswordUrl
      ? 'Scegli una password e potrai entrare dal sito e dall\'app desktop.'
      : 'Entra con l\'indirizzo e la password qui sotto: trovi tutto già pronto, con dati di esempio.',
  ].join('\n');

  const html = brandedHtml(body, {
    title: 'Il tuo account demo è pronto',
    sub: [companyName ? esc(companyName) : null, expiryStr ? `demo fino al ${expiryStr}` : null].filter(Boolean).join(', ') || null,
    preheader: 'Il tuo account demo è pronto',
    rows,
    cta: setupPasswordUrl
      ? { href: setupPasswordUrl, label: 'Scegli la password' }
      : { href: LOGIN_URL, label: 'Entra nella demo' },
    note: setupPasswordUrl
      ? 'Il collegamento vale per 24 ore. Se scade, chiedici di rimandartelo.'
      : 'Alla prima occasione cambia la password dalle impostazioni.',
    reason: 'Ricevi questa email perché hai chiesto una demo di RescueManager.',
  });

  const credText = setupPasswordUrl
    ? `Scegli la password: ${setupPasswordUrl}`
    : `Password temporanea: ${tempPassword}`;

  const text = [
    'Il tuo account demo è pronto.',
    '',
    `Indirizzo per entrare: ${email}`,
    credText,
    expiryStr ? `La demo vale fino al ${expiryStr}` : null,
    modulesList.length ? `Cosa puoi provare: ${modulesList.join(', ')}` : null,
    '',
    `Entra da ${LOGIN_URL}`,
    '',
    'RescueManager S.r.l., Gela',
    'Per aiuto scrivi a info@rescuemanager.eu',
  ].filter((l) => l !== null).join('\n');

  return { html, text };
}

// ─── Email preventivo ────────────────────────────────────────────────────────

/**
 * Email Preventivo
 * Riepilogo allineato al PDF: canone (listino → sconto → scontato), periodo
 * contrattuale, voci una tantum (setup + pacchetti), regime IVA esplicito.
 */
function buildQuoteEmail({ leadName, quoteNumber, planType, monthlyTotal, yearlyTotal, contractDuration, expiryDate, publicUrl, pdfUrl, specialModules, baseModules, setupFee, discountPercent, packages, oneTimeTotal, pricesIncludeVat }) {
  const expiryStr = fmtDataLunga(expiryDate);
  const planLabel = PLAN_LABELS[planType] || planType;
  const specialList = (specialModules || []).map((m) => MODULE_LABELS[m] || m).join(', ');

  const pkgs = Array.isArray(packages) ? packages : [];
  const lineTotal = (pk) => pk.billing === 'note' ? 0 : (Number(pk.price) || 0) * Math.max(1, Number(pk.quantity) || 1);
  const monthlyPkgs = pkgs.filter((pk) => pk.billing === 'monthly');
  const oneTimePkgs = pkgs.filter((pk) => pk.billing === 'one_time');
  const notePkgs = pkgs.filter((pk) => pk.billing === 'note');
  const setup = Number(setupFee) || 0;
  const oneTime = Number(oneTimeTotal) || (setup + oneTimePkgs.reduce((s, pk) => s + lineTotal(pk), 0));

  const isYearly = contractDuration === 'yearly';
  const isBiennial = contractDuration === 'biennial';
  const monthly = Number(monthlyTotal) || 0;
  const yearly = Number(yearlyTotal) || Math.round(monthly * 12 * 0.9 * 100) / 100;
  const biennial = Math.round(monthly * 24 * 0.85 * 100) / 100;
  const recurring = isYearly ? yearly : isBiennial ? biennial : monthly;
  const canoneLabel = isYearly ? 'Totale all\'anno' : isBiennial ? 'Totale per due anni' : 'Totale al mese';
  const ivaInclusa = pricesIncludeVat !== false;
  const vatLabel = ivaInclusa ? 'IVA inclusa' : 'IVA esclusa';

  const rows = [['Piano', esc(planLabel)]];
  if (specialList) rows.push(['Compreso', esc(specialList)]);
  monthlyPkgs.forEach((pk) => rows.push([esc(pk.name), `${fmtEur(lineTotal(pk))} al mese`]));
  if (discountPercent > 0) rows.push(['Sconto sul canone', `${discountPercent} per cento`]);
  if (setup > 0) rows.push(['Attivazione, una volta sola', fmtEur(setup)]);
  oneTimePkgs.forEach((pk) => rows.push([esc(pk.name), `${fmtEur(lineTotal(pk))}, una volta sola`]));
  notePkgs.forEach((pk) => rows.push([esc(pk.name), esc(pk.description || 'da concordare')]));
  if (isYearly || isBiennial) rows.push(['Equivale al mese a', fmtEur(recurring / (isYearly ? 12 : 24))]);
  if (oneTime > 0) rows.push(['Al primo pagamento', fmtEur(recurring + oneTime)]);
  rows.push(['Prezzi', ivaInclusa ? 'IVA inclusa' : 'IVA esclusa, in fattura si aggiunge il 22 per cento']);
  rows.push(['Valido fino al', expiryStr]);

  const body = [
    `Ecco il preventivo per RescueManager con il piano ${esc(planLabel)}.`,
    'Se va bene, accettalo dal pulsante e ti mandiamo il contratto.',
  ].join('\n');

  const html = brandedHtml(body, {
    title: `Preventivo ${esc(quoteNumber)}`,
    sub: [leadName ? esc(leadName) : null, `valido fino al ${expiryStr}`].filter(Boolean).join(', '),
    preheader: `Preventivo ${quoteNumber}`,
    amount: { label: `${canoneLabel}, ${vatLabel}`, value: fmtEur(recurring) },
    rows,
    cta: { href: publicUrl, label: 'Apri e accetta il preventivo' },
    note: pdfUrl
      ? `Trovi lo stesso preventivo in PDF a questo indirizzo: ${esc(pdfUrl)}. Per cambiare qualcosa rispondi a questa email.`
      : 'Per cambiare qualcosa rispondi a questa email.',
    reason: 'Ricevi questa email perché hai chiesto un preventivo a RescueManager.',
  });

  const text = [
    `Preventivo ${quoteNumber}`,
    '',
    `Piano: ${planLabel}`,
    `${canoneLabel}: ${fmtEur(recurring)}, ${vatLabel}`,
    oneTime > 0 ? `Al primo pagamento: ${fmtEur(recurring + oneTime)}` : null,
    `Valido fino al ${expiryStr}`,
    '',
    `Apri e accetta il preventivo: ${publicUrl}`,
    pdfUrl ? `Preventivo in PDF: ${pdfUrl}` : null,
    '',
    'RescueManager S.r.l., Gela',
    'Per aiuto scrivi a info@rescuemanager.eu',
  ].filter((l) => l !== null).join('\n');

  return { html, text };
}

// ─── Email account attivato ──────────────────────────────────────────────────

/**
 * Email Account Attivato
 */
function buildAccountActivatedEmail({ name, planType, modules, monthlyTotal, setupPasswordUrl, hasDemo }) {
  const planLabel = PLAN_LABELS[planType] || planType;
  const modulesList = (modules || []).map((m) => MODULE_LABELS[m] || m);

  const rows = [['Piano', esc(planLabel)], ['Canone', `${fmtEur(monthlyTotal)} al mese`]];
  if (modulesList.length) rows.push(['Cosa è compreso', esc(modulesList.join(', '))]);
  if (setupPasswordUrl) rows.push(['Primo passo', hasDemo ? 'Scegli una nuova password' : 'Scegli la password']);
  rows.push(['Poi', 'Completa i dati dell\'azienda: partita IVA, indirizzo, PEC e codice destinatario']);
  rows.push(['Infine', 'Inizia a lavorare con RescueManager']);

  const body = [
    'Il tuo account RescueManager è attivo.',
    hasDemo
      ? 'I dati della demo sono stati rimossi: da adesso lavori sui tuoi dati veri.'
      : 'Puoi configurarlo e iniziare a usarlo subito.',
  ].join('\n');

  const html = brandedHtml(body, {
    title: 'Il tuo account è attivo',
    sub: [name ? esc(name) : null, `${esc(planLabel)}, ${fmtEur(monthlyTotal)} al mese`].filter(Boolean).join(', '),
    preheader: 'Il tuo account è attivo',
    rows,
    cta: setupPasswordUrl
      ? { href: setupPasswordUrl, label: hasDemo ? 'Scegli la nuova password' : 'Scegli la password' }
      : { href: LOGIN_URL, label: 'Entra in RescueManager' },
    note: setupPasswordUrl
      ? `Quando avrai la password, entri da ${LOGIN_URL}`
      : 'Se hai bisogno di una mano per i primi passi, rispondi a questa email.',
    reason: 'Ricevi questa email perché hai attivato un account RescueManager.',
  });

  const text = [
    'Il tuo account RescueManager è attivo.',
    '',
    `Piano: ${planLabel}`,
    `Canone: ${fmtEur(monthlyTotal)} al mese`,
    '',
    setupPasswordUrl ? `Scegli la password: ${setupPasswordUrl}` : null,
    'Poi completa i dati dell\'azienda: partita IVA, indirizzo, PEC e codice destinatario.',
    '',
    `Entra da ${LOGIN_URL}`,
    '',
    'RescueManager S.r.l., Gela',
    'Per aiuto scrivi a info@rescuemanager.eu',
  ].filter((l) => l !== null).join('\n');

  return { html, text };
}

// ─── Email appuntamenti ──────────────────────────────────────────────────────

function fmtITDate(iso) {
  return new Date(iso).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtITTime(iso) {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

const APPT_TYPE_LABEL = {
  discovery_call: 'una chiamata conoscitiva',
  demo_call: 'una demo del software',
  follow_up: 'una chiamata di follow-up',
  onboarding: 'la sessione di onboarding',
  negotiation: 'una chiamata commerciale',
  contract_signing: 'la firma del contratto',
  training: 'una sessione di formazione',
  custom: 'un incontro',
};

// Come si svolge l'incontro, detto in italiano corrente.
function modeLabel(meetingMode) {
  if (meetingMode === 'video') return 'In videochiamata';
  if (meetingMode === 'phone') return 'Al telefono';
  return 'Di persona';
}

// Riga "dove": collegamento, numero o indirizzo, uno solo, quello che c'è.
function dovePair(meetingUrl, meetingPhone, meetingAddress) {
  if (meetingUrl) return ['Collegamento', `<a href="${meetingUrl}" style="color:${BRAND};text-decoration:none;">${esc(meetingUrl)}</a>`];
  if (meetingPhone) return ['Numero da chiamare', esc(meetingPhone)];
  if (meetingAddress) return ['Indirizzo', esc(meetingAddress)];
  return null;
}

/**
 * Invio booking link Calendly o pagina interna /appointment/[uuid]
 */
function buildBookingLinkEmail({ name, companyName, appointmentType, duration, bookingUrl, customMessage }) {
  const typeLabel = APPT_TYPE_LABEL[appointmentType] || 'un incontro';

  const rows = [['Di cosa si tratta', esc(typeLabel)], ['Quanto dura', `${duration} minuti`]];
  if (companyName) rows.push(['Azienda', esc(companyName)]);
  rows.push(['Come lo fissiamo', 'Scegli tu data e ora dal calendario']);

  const body = [
    `Vorremmo organizzare ${esc(typeLabel)}${companyName ? ` con ${esc(companyName)}` : ''}.`,
    'Scegli tu il momento che ti fa più comodo: il calendario mostra solo gli orari liberi.',
  ].join('\n');

  const html = brandedHtml(body, {
    title: 'Scegli quando vederci',
    sub: [name ? esc(name) : null, `${duration} minuti`].filter(Boolean).join(', '),
    preheader: 'Scegli quando vederci',
    notice: customMessage ? { text: esc(customMessage) } : null,
    rows,
    cta: { href: bookingUrl, label: 'Scegli data e ora' },
    note: 'Se nessun orario ti va bene, rispondi a questa email e ne troviamo un altro.',
    reason: 'Ricevi questa email perché hai chiesto informazioni su RescueManager.',
  });

  const text = [
    'Scegli quando vederci.',
    '',
    `Di cosa si tratta: ${typeLabel}`,
    `Quanto dura: ${duration} minuti`,
    customMessage || null,
    '',
    `Scegli data e ora: ${bookingUrl}`,
    '',
    'RescueManager S.r.l., Gela',
    'Per aiuto scrivi a info@rescuemanager.eu',
  ].filter((l) => l !== null).join('\n');

  return { html, text };
}

/**
 * Conferma appuntamento (con allegato ICS)
 */
function buildAppointmentConfirmationEmail({ name, title, scheduledAt, durationMinutes, meetingMode, meetingUrl, meetingPhone, meetingAddress, publicUrl }) {
  const dateStr = fmtITDate(scheduledAt);
  const timeStr = fmtITTime(scheduledAt);

  const rows = [['Argomento', esc(title)], ['Come', modeLabel(meetingMode)]];
  const dove = dovePair(meetingUrl, meetingPhone, meetingAddress);
  if (dove) rows.push(dove);
  rows.push(['Per spostarlo', 'Rispondi a questa email']);

  const body = [
    `L'appuntamento ${esc(title)} è confermato.`,
    'In allegato trovi il file da aprire per aggiungerlo al calendario.',
  ].join('\n');

  const html = brandedHtml(body, {
    title: `Appuntamento confermato per ${dateStr}`,
    sub: `Alle ${timeStr}, dura ${durationMinutes} minuti`,
    preheader: `Appuntamento confermato per ${dateStr}`,
    rows,
    cta: publicUrl ? { href: publicUrl, label: 'Apri la pagina dell\'appuntamento' } : null,
    note: publicUrl ? null : 'Se hai un imprevisto rispondi a questa email e lo spostiamo.',
    reason: 'Ricevi questa email perché hai fissato un appuntamento con RescueManager.',
  });

  const text = [
    `Appuntamento confermato per ${dateStr}`,
    `Alle ${timeStr}, dura ${durationMinutes} minuti`,
    '',
    `Argomento: ${title}`,
    `Come: ${modeLabel(meetingMode)}`,
    meetingUrl ? `Collegamento: ${meetingUrl}` : meetingPhone ? `Numero da chiamare: ${meetingPhone}` : meetingAddress ? `Indirizzo: ${meetingAddress}` : null,
    publicUrl ? `Pagina dell'appuntamento: ${publicUrl}` : null,
    '',
    'RescueManager S.r.l., Gela',
    'Per aiuto scrivi a info@rescuemanager.eu',
  ].filter((l) => l !== null).join('\n');

  return { html, text };
}

/**
 * Promemoria 24h prima
 */
function buildAppointmentReminderEmail({ name, title, scheduledAt, durationMinutes, meetingMode, meetingUrl, meetingPhone, meetingAddress, when = '24h' }) {
  const dateStr = fmtITDate(scheduledAt);
  const timeStr = fmtITTime(scheduledAt);
  const quando = when === '24h' ? 'domani' : when === '1h' ? 'tra un\'ora' : 'a breve';

  const rows = [['Argomento', esc(title)], ['Quando', `${dateStr}, alle ${timeStr}`], ['Quanto dura', `${durationMinutes} minuti`], ['Come', modeLabel(meetingMode)]];
  const dove = dovePair(meetingUrl, meetingPhone, meetingAddress);
  if (dove) rows.push(dove);

  const body = [
    `Ti ricordiamo l'appuntamento ${esc(title)}.`,
  ].join('\n');

  const html = brandedHtml(body, {
    title: 'Promemoria appuntamento',
    sub: `${dateStr}, alle ${timeStr}`,
    preheader: `Appuntamento ${quando} alle ${timeStr}`,
    notice: { text: `L'appuntamento è ${quando} alle ${timeStr}.` },
    rows,
    cta: meetingUrl ? { href: meetingUrl, label: 'Apri la videochiamata' } : null,
    note: 'Hai un imprevisto? Rispondi a questa email e lo spostiamo.',
    reason: 'Ricevi questa email perché hai fissato un appuntamento con RescueManager.',
  });

  const text = [
    'Promemoria appuntamento.',
    '',
    `Argomento: ${title}`,
    `Quando: ${dateStr}, alle ${timeStr}`,
    `Come: ${modeLabel(meetingMode)}`,
    meetingUrl ? `Collegamento: ${meetingUrl}` : meetingPhone ? `Numero da chiamare: ${meetingPhone}` : meetingAddress ? `Indirizzo: ${meetingAddress}` : null,
    '',
    'RescueManager S.r.l., Gela',
    'Per aiuto scrivi a info@rescuemanager.eu',
  ].filter((l) => l !== null).join('\n');

  return { html, text };
}

/**
 * Conferma slot scelto dal lead (notifica all'admin staff)
 */
function buildAppointmentBookedNotifyStaffEmail({ leadName, leadCompany, leadEmail, title, scheduledAt, adminUrl }) {
  const dateStr = fmtITDate(scheduledAt);
  const timeStr = fmtITTime(scheduledAt);

  const rows = [['Cliente', esc(leadName)]];
  if (leadCompany) rows.push(['Azienda', esc(leadCompany)]);
  rows.push(['Indirizzo email', esc(leadEmail)]);
  rows.push(['Appuntamento', esc(title)]);
  rows.push(['Quando', `${dateStr}, alle ${timeStr}`]);

  const html = brandedHtml(`${esc(leadName)} ha scelto data e ora per l'appuntamento.`, {
    title: 'Appuntamento prenotato dal cliente',
    sub: `${dateStr}, alle ${timeStr}`,
    preheader: 'Appuntamento prenotato dal cliente',
    rows,
    cta: adminUrl ? { href: adminUrl, label: 'Apri la scheda del cliente' } : null,
    reason: 'Ricevi questa email perché segui i contatti commerciali di RescueManager.',
  });

  const text = [
    'Appuntamento prenotato dal cliente.',
    '',
    `Cliente: ${leadName}`,
    leadCompany ? `Azienda: ${leadCompany}` : null,
    `Indirizzo email: ${leadEmail}`,
    `Appuntamento: ${title}`,
    `Quando: ${dateStr}, alle ${timeStr}`,
    adminUrl ? `Scheda del cliente: ${adminUrl}` : null,
  ].filter((l) => l !== null).join('\n');

  return { html, text };
}

// ─── Email link pagamento ────────────────────────────────────────────────────

/**
 * Email link pagamento — inviata al cliente DOPO che ha accettato un preventivo
 * con requires_approval=true e l'admin ha approvato l'accettazione.
 */
function buildPaymentLinkEmail({ leadName, quoteNumber, planType, monthlyTotal, yearlyTotal, contractDuration, checkoutUrl, expiryDate }) {
  const planLabel = (planType || '').charAt(0).toUpperCase() + (planType || '').slice(1);
  const isYearly = contractDuration === 'yearly';
  const isBiennial = contractDuration === 'biennial';
  const amount = isYearly ? yearlyTotal : isBiennial ? (monthlyTotal * 24 * 0.85) : monthlyTotal;
  const periodLabel = isYearly ? 'all\'anno' : isBiennial ? 'per due anni' : 'al mese';
  const expiryStr = expiryDate ? fmtDataLunga(expiryDate) : null;
  const formattedAmount = fmtEur(amount);

  const rows = [['Preventivo', esc(quoteNumber)]];
  if (planLabel) rows.push(['Piano', esc(planLabel)]);
  rows.push(['Pagamento', isYearly ? 'Una volta all\'anno' : isBiennial ? 'Una volta ogni due anni' : 'Ogni mese']);
  if (expiryStr) rows.push(['Valido fino al', expiryStr]);
  rows.push(['Come si paga', 'Con carta, su Stripe']);

  const body = [
    `Abbiamo registrato la tua accettazione del preventivo ${esc(quoteNumber)}.`,
    'Per attivare l\'abbonamento manca solo il pagamento.',
  ].join('\n');

  const html = brandedHtml(body, {
    title: `Preventivo ${esc(quoteNumber)} approvato`,
    sub: [leadName ? esc(leadName) : null, 'manca il pagamento'].filter(Boolean).join(', '),
    preheader: `Preventivo ${quoteNumber} approvato`,
    amount: { label: `Importo ${periodLabel}`, value: formattedAmount },
    rows,
    cta: { href: checkoutUrl, label: 'Vai al pagamento' },
    note: 'Appena il pagamento risulta registrato attiviamo l\'account e ti scriviamo.',
    reason: 'Ricevi questa email perché hai accettato un preventivo di RescueManager.',
  });

  const text = [
    `Preventivo ${quoteNumber} approvato.`,
    '',
    `Importo ${periodLabel}: ${formattedAmount}`,
    planLabel ? `Piano: ${planLabel}` : null,
    expiryStr ? `Valido fino al ${expiryStr}` : null,
    '',
    `Vai al pagamento: ${checkoutUrl}`,
    '',
    'RescueManager S.r.l., Gela',
    'Per aiuto scrivi a info@rescuemanager.eu',
  ].filter((l) => l !== null).join('\n');

  return { html, text };
}

module.exports = {
  sendEmail,
  brandedHtml,
  esc,
  buildDemoWelcomeEmail,
  buildQuoteEmail,
  buildAccountActivatedEmail,
  buildBookingLinkEmail,
  buildAppointmentConfirmationEmail,
  buildAppointmentReminderEmail,
  buildAppointmentBookedNotifyStaffEmail,
  buildPaymentLinkEmail,
};
