/**
 * Email Service - Lead API
 * Usa nodemailer con SMTP configurato in .env
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

/**
 * Invia email
 */
async function sendEmail({ to, subject, html, text, attachments }) {
  const transport = getTransporter();

  const result = await transport.sendMail({
    from: `"RescueManager" <${process.env.SMTP_FROM || 'info@rescuemanager.eu'}>`,
    to,
    subject,
    html,
    text: text || '',
    attachments: attachments || []
  });

  console.log(`[EMAIL] Sent to ${to}: ${subject} (${result.messageId})`);
  return result;
}

// ─── Shared Email Helpers ────────────────────────────────────────────────────

const EMAIL_FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif";
const EMAIL_BRAND_DARK = '#0f172a';
const EMAIL_BRAND_BLUE = '#2563eb';

function emailHeader(subtitle) {
  return `
<tr>
  <td style="background:${EMAIL_BRAND_DARK};padding:28px 40px;">
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td>
          <img src="https://rescuemanager.eu/assets/logos/logo-principale-a-colori.svg" alt="RescueManager" style="height:32px;width:auto;display:block;margin-bottom:${subtitle ? '8px' : '0'};" />
          ${subtitle ? `<p style="margin:0;font-family:${EMAIL_FONT};font-size:13px;color:rgba(255,255,255,0.55);letter-spacing:0.05em;text-transform:uppercase;">${subtitle}</p>` : ''}
        </td>
        <td align="right">
          <span style="font-family:${EMAIL_FONT};font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.1em;">rescuemanager.eu</span>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

function emailFooter() {
  return `
<tr>
  <td style="background:${EMAIL_BRAND_DARK};padding:24px 40px;border-top:3px solid ${EMAIL_BRAND_BLUE};">
    <p style="margin:0 0 8px;font-family:${EMAIL_FONT};font-size:12px;color:rgba(255,255,255,0.7);text-align:center;font-weight:600;">
      RescueManager S.r.l.
    </p>
    <p style="margin:0 0 8px;font-family:${EMAIL_FONT};font-size:11px;color:rgba(255,255,255,0.5);text-align:center;line-height:1.6;">
      Via dello Smeraldo 18, 93012 Gela (CL) &middot; Italia<br>
      P.IVA 02176370852 &middot; Capitale sociale &euro; 100,00<br>
      <a href="mailto:info@rescuemanager.eu" style="color:${EMAIL_BRAND_BLUE};text-decoration:none;">info@rescuemanager.eu</a>
      &nbsp;&middot;&nbsp;
      PEC <a href="mailto:rescuemanager@legalmail.it" style="color:${EMAIL_BRAND_BLUE};text-decoration:none;">rescuemanager@legalmail.it</a>
    </p>
    <p style="margin:0;font-family:${EMAIL_FONT};font-size:10px;color:rgba(255,255,255,0.35);text-align:center;">
      &copy; ${new Date().getFullYear()} RescueManager S.r.l. &middot;
      <a href="https://rescuemanager.eu" style="color:rgba(255,255,255,0.5);text-decoration:none;">rescuemanager.eu</a>
    </p>
  </td>
</tr>`;
}

function emailWrapper(content) {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>RescueManager</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:${EMAIL_FONT};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;">
      ${content}
    </table>
    <p style="margin:16px 0 0;font-family:${EMAIL_FONT};font-size:11px;color:#94a3b8;text-align:center;">
      Hai ricevuto questa email perché il tuo indirizzo è associato a un account RescueManager.
    </p>
  </td></tr>
</table>
</body>
</html>`;
}

function emailCtaButton(href, label) {
  return `
<table cellpadding="0" cellspacing="0" style="margin:28px 0;">
  <tr>
    <td style="background:${EMAIL_BRAND_BLUE};">
      <a href="${href}" style="display:block;padding:14px 32px;font-family:${EMAIL_FONT};font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em;">${label} &rarr;</a>
    </td>
  </tr>
</table>`;
}

function emailInfoRow(label, value) {
  return `
<tr>
  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-family:${EMAIL_FONT};font-size:13px;color:#64748b;width:130px;">${label}</td>
  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-family:${EMAIL_FONT};font-size:13px;color:#0f172a;font-weight:600;">${value}</td>
</tr>`;
}

// ─── Email Benvenuto Demo ─────────────────────────────────────────────────────

/**
 * Email Benvenuto Demo
 */
function buildDemoWelcomeEmail({ name, email, tempPassword, setupPasswordUrl, expiresAt, modules, companyName }) {
  const expiryStr = expiresAt 
    ? new Date(expiresAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Non specificata';

  const moduleLabels = {
    trasporti: 'Trasporti', tracking: 'Tracking GPS', calendario: 'Calendario',
    clienti: 'Clienti & CRM', mezzi: 'Mezzi', piazzale: 'Piazzale',
    autisti: 'Autisti', ricambi: 'Ricambi', preventivi: 'Preventivi',
    report: 'Report', rvfu: 'Demolizioni RVFU', rentri: 'RENTRI',
    fatturazione: 'Fatturazione Elettronica'
  };
  const modulesList = (modules || []).map(m => moduleLabels[m] || m);

  const body = `
${emailHeader('Il tuo account demo è pronto')}
<tr>
  <td style="padding:36px 40px 28px;">
    <p style="margin:0 0 6px;font-family:${EMAIL_FONT};font-size:11px;font-weight:700;color:${EMAIL_BRAND_BLUE};text-transform:uppercase;letter-spacing:0.1em;">Account Demo</p>
    <h1 style="margin:0 0 16px;font-family:${EMAIL_FONT};font-size:26px;font-weight:900;color:${EMAIL_BRAND_DARK};line-height:1.2;">
      Benvenuto${name ? ', ' + name.split(' ')[0] : ''}<span style="color:${EMAIL_BRAND_BLUE};">.</span>
    </h1>
    <p style="margin:0 0 28px;font-family:${EMAIL_FONT};font-size:15px;color:#475569;line-height:1.65;">
      Il tuo account demo RescueManager${companyName ? ` per <strong style="color:${EMAIL_BRAND_DARK};">${companyName}</strong>` : ''} è stato attivato con successo.
      Hai <strong>accesso completo</strong> per testare tutte le funzionalità incluse.
    </p>

    <!-- Credenziali Box -->
    <table cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border-left:4px solid ${EMAIL_BRAND_BLUE};margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 14px;font-family:${EMAIL_FONT};font-size:11px;font-weight:700;color:${EMAIL_BRAND_BLUE};text-transform:uppercase;letter-spacing:0.1em;">Credenziali di accesso</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          ${emailInfoRow('Email', email)}
          ${!setupPasswordUrl && tempPassword ? emailInfoRow('Password temporanea', `<code style="font-family:monospace;background:#e2e8f0;padding:2px 6px;">${tempPassword}</code>`) : ''}
          ${emailInfoRow('Scadenza demo', expiryStr)}
        </table>
        ${setupPasswordUrl ? `
        <p style="margin:16px 0 0;font-family:${EMAIL_FONT};font-size:12px;color:#64748b;">
          Devi impostare una password prima di accedere. Il link è valido per 24 ore.
        </p>` : ''}
      </td></tr>
    </table>

    ${setupPasswordUrl ? emailCtaButton(setupPasswordUrl, 'Imposta la tua Password') : emailCtaButton('https://rescuemanager.eu/login', 'Accedi alla Demo')}

    <!-- Moduli inclusi -->
    ${modulesList.length > 0 ? `
    <p style="margin:0 0 10px;font-family:${EMAIL_FONT};font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;">Moduli inclusi nella demo</p>
    <p style="margin:0 0 28px;font-family:${EMAIL_FONT};font-size:13px;color:#475569;line-height:1.7;">${modulesList.join(' &middot; ')}</p>` : ''}

    <p style="margin:0;font-family:${EMAIL_FONT};font-size:13px;color:#64748b;line-height:1.6;">
      Per qualsiasi domanda rispondi a questa email o scrivi a
      <a href="mailto:info@rescuemanager.eu" style="color:${EMAIL_BRAND_BLUE};text-decoration:none;">info@rescuemanager.eu</a>.
    </p>
  </td>
</tr>
${emailFooter()}`;

  const credText = setupPasswordUrl
    ? `Imposta la tua password: ${setupPasswordUrl}`
    : `Password temporanea: ${tempPassword}`;

  const text = `Benvenuto su RescueManager!\n\nGentile ${name},\n\nIl tuo account demo è pronto.\n\nCredenziali:\nEmail: ${email}\n${credText}\n\nScadenza: ${expiryStr}\nModuli: ${modulesList.join(', ')}\n\nAccedi: https://rescuemanager.eu/login\n\nRescueManager - rescuemanager.eu`;

  return { html: emailWrapper(body), text };
}

// ─── Email Preventivo ─────────────────────────────────────────────────────────

/**
 * Email Preventivo
 * Riepilogo allineato al PDF: canone (listino → sconto → scontato), periodo
 * contrattuale, voci una tantum (setup + pacchetti), regime IVA esplicito.
 */
function buildQuoteEmail({ leadName, quoteNumber, planType, monthlyTotal, yearlyTotal, contractDuration, expiryDate, publicUrl, pdfUrl, specialModules, baseModules, setupFee, discountPercent, packages, oneTimeTotal, pricesIncludeVat }) {
  const fmt = (n) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(n) || 0);
  const expiryStr = new Date(expiryDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

  const planLabels = { starter: 'Starter', professional: 'Professional', business: 'Business', full: 'Full', flotta: 'Flotta', enterprise: 'Enterprise', custom: 'Personalizzato' };
  const moduleLabels = { rvfu: 'Demolizioni RVFU', rentri: 'RENTRI', fatturazione: 'Fatturazione Elettronica' };
  const specialList = (specialModules || []).map(m => moduleLabels[m] || m).join(', ');

  const pkgs = Array.isArray(packages) ? packages : [];
  const lineTotal = (p) => p.billing === 'note' ? 0 : (Number(p.price) || 0) * Math.max(1, Number(p.quantity) || 1);
  const monthlyPkgs = pkgs.filter(p => p.billing === 'monthly');
  const oneTimePkgs = pkgs.filter(p => p.billing === 'one_time');
  const notePkgs = pkgs.filter(p => p.billing === 'note');
  const setup = Number(setupFee) || 0;
  const oneTime = Number(oneTimeTotal) || (setup + oneTimePkgs.reduce((s, p) => s + lineTotal(p), 0));

  const isYearly = contractDuration === 'yearly';
  const isBiennial = contractDuration === 'biennial';
  const monthly = Number(monthlyTotal) || 0;
  const yearly = Number(yearlyTotal) || Math.round(monthly * 12 * 0.9 * 100) / 100;
  const biennial = Math.round(monthly * 24 * 0.85 * 100) / 100;
  const recurring = isYearly ? yearly : isBiennial ? biennial : monthly;
  const periodLabel = isYearly ? '/anno' : isBiennial ? '/biennio' : '/mese';
  const canoneLabel = isYearly ? 'Canone annuale' : isBiennial ? 'Canone biennale' : 'Canone mensile';
  const vatLabel = pricesIncludeVat === false ? 'IVA esclusa (IVA 22% in fattura)' : 'IVA inclusa';

  const body = `
${emailHeader(`Preventivo ${quoteNumber}`)}
<tr>
  <td style="padding:36px 40px 28px;">
    <p style="margin:0 0 6px;font-family:${EMAIL_FONT};font-size:11px;font-weight:700;color:${EMAIL_BRAND_BLUE};text-transform:uppercase;letter-spacing:0.1em;">Preventivo Personalizzato</p>
    <h1 style="margin:0 0 16px;font-family:${EMAIL_FONT};font-size:26px;font-weight:900;color:${EMAIL_BRAND_DARK};line-height:1.2;">
      Ciao, ${leadName ? leadName.split(' ')[0] : 'caro cliente'}<span style="color:${EMAIL_BRAND_BLUE};">.</span>
    </h1>
    <p style="margin:0 0 28px;font-family:${EMAIL_FONT};font-size:15px;color:#475569;line-height:1.65;">
      Ecco il preventivo per il piano <strong style="color:${EMAIL_BRAND_DARK};">${planLabels[planType] || planType}</strong> di RescueManager.
      Il preventivo è valido fino al <strong>${expiryStr}</strong>.
    </p>

    <!-- Riepilogo economico -->
    <table cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border-left:4px solid ${EMAIL_BRAND_BLUE};margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 14px;font-family:${EMAIL_FONT};font-size:11px;font-weight:700;color:${EMAIL_BRAND_BLUE};text-transform:uppercase;letter-spacing:0.1em;">Riepilogo economico</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          ${emailInfoRow('Piano', planLabels[planType] || planType)}
          ${specialList ? emailInfoRow('Moduli speciali', specialList) : ''}
          ${monthlyPkgs.map(p => emailInfoRow(p.name, `${fmt(lineTotal(p))}/mese`)).join('')}
          ${discountPercent > 0 ? emailInfoRow('Sconto sul canone', `-${discountPercent}%`) : ''}
          ${setup > 0 ? emailInfoRow('Setup iniziale (una tantum)', fmt(setup)) : ''}
          ${oneTimePkgs.map(p => emailInfoRow(`${p.name} (una tantum)`, fmt(lineTotal(p)))).join('')}
          ${notePkgs.map(p => emailInfoRow(p.name, p.description || 'vedi preventivo')).join('')}
        </table>
        <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:14px;padding-top:14px;border-top:2px solid #e2e8f0;">
          <tr>
            <td style="font-family:${EMAIL_FONT};font-size:16px;font-weight:900;color:${EMAIL_BRAND_DARK};">${canoneLabel}</td>
            <td align="right" style="font-family:${EMAIL_FONT};font-size:22px;font-weight:900;color:${EMAIL_BRAND_BLUE};">${fmt(recurring)}<span style="font-size:13px;font-weight:400;color:#64748b;">${periodLabel}</span></td>
          </tr>
          ${(isYearly || isBiennial) ? `<tr>
            <td style="font-family:${EMAIL_FONT};font-size:12px;color:#94a3b8;padding-top:4px;">Equivalente mensile</td>
            <td align="right" style="font-family:${EMAIL_FONT};font-size:12px;color:#94a3b8;padding-top:4px;">${fmt(recurring / (isYearly ? 12 : 24))}/mese</td>
          </tr>` : ''}
          ${oneTime > 0 ? `<tr>
            <td style="font-family:${EMAIL_FONT};font-size:13px;font-weight:700;color:${EMAIL_BRAND_DARK};padding-top:10px;">Una tantum al primo pagamento</td>
            <td align="right" style="font-family:${EMAIL_FONT};font-size:15px;font-weight:700;color:${EMAIL_BRAND_DARK};padding-top:10px;">${fmt(oneTime)}</td>
          </tr>
          <tr>
            <td style="font-family:${EMAIL_FONT};font-size:12px;color:#64748b;padding-top:4px;">Totale al primo pagamento</td>
            <td align="right" style="font-family:${EMAIL_FONT};font-size:12px;color:#64748b;padding-top:4px;">${fmt(recurring + oneTime)}</td>
          </tr>` : ''}
          <tr>
            <td colspan="2" style="font-family:${EMAIL_FONT};font-size:11px;color:#94a3b8;padding-top:8px;">Prezzi ${vatLabel}.</td>
          </tr>
        </table>
      </td></tr>
    </table>

    ${emailCtaButton(publicUrl, 'Visualizza e Accetta il Preventivo')}

    ${pdfUrl ? `<p style="margin:-16px 0 28px;font-family:${EMAIL_FONT};font-size:13px;text-align:center;">
      <a href="${pdfUrl}" style="color:${EMAIL_BRAND_BLUE};text-decoration:none;font-size:13px;">Scarica il PDF del preventivo</a>
    </p>` : ''}

    <p style="margin:0;font-family:${EMAIL_FONT};font-size:13px;color:#64748b;line-height:1.6;">
      Per accettare il preventivo clicca il pulsante sopra. Per qualsiasi domanda rispondi a questa email o scrivi a
      <a href="mailto:info@rescuemanager.eu" style="color:${EMAIL_BRAND_BLUE};text-decoration:none;">info@rescuemanager.eu</a>.
    </p>
  </td>
</tr>
${emailFooter()}`;

  const text = `Preventivo ${quoteNumber}\n\nGentile ${leadName},\n\nPiano: ${planLabels[planType] || planType}\n${canoneLabel}: ${fmt(recurring)}${periodLabel}${oneTime > 0 ? `\nUna tantum al primo pagamento: ${fmt(oneTime)}` : ''}\nPrezzi ${vatLabel}.\nValidità: ${expiryStr}\n\nVisualizza: ${publicUrl}\n\nRescueManager - rescuemanager.eu`;

  return { html: emailWrapper(body), text };
}

// ─── Email Account Attivato ───────────────────────────────────────────────────

/**
 * Email Account Attivato
 */
function buildAccountActivatedEmail({ name, planType, modules, monthlyTotal, setupPasswordUrl, hasDemo }) {
  const fmt = (n) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n || 0);
  const planLabels = { starter: 'Starter', professional: 'Professional', business: 'Business', full: 'Full', flotta: 'Flotta', enterprise: 'Enterprise', custom: 'Personalizzato' };
  const firstName = name ? name.split(' ')[0] : 'caro utente';

  const body = `
${emailHeader('Account Attivato')}
<tr>
  <td style="padding:36px 40px 28px;">
    <p style="margin:0 0 6px;font-family:${EMAIL_FONT};font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.1em;">Attivazione completata</p>
    <h1 style="margin:0 0 16px;font-family:${EMAIL_FONT};font-size:26px;font-weight:900;color:${EMAIL_BRAND_DARK};line-height:1.2;">
      Benvenuto, ${firstName}<span style="color:${EMAIL_BRAND_BLUE};">!</span>
    </h1>
    <p style="margin:0 0 28px;font-family:${EMAIL_FONT};font-size:15px;color:#475569;line-height:1.65;">
      Il tuo account RescueManager è stato <strong style="color:#16a34a;">attivato con successo</strong>.
      ${hasDemo ? 'Il tuo account demo è stato convertito in account di produzione.' : 'Il tuo account è pronto per essere configurato.'}
    </p>

    <!-- Piano attivato -->
    <table cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border-left:4px solid #16a34a;margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 10px;font-family:${EMAIL_FONT};font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.1em;">Il tuo piano attivo</p>
        <p style="margin:0;font-family:${EMAIL_FONT};font-size:22px;font-weight:900;color:${EMAIL_BRAND_DARK};">
          ${planLabels[planType] || planType}
          <span style="font-size:16px;font-weight:600;color:#16a34a;"> &mdash; ${fmt(monthlyTotal)}/mese</span>
        </p>
      </td></tr>
    </table>

    <!-- Prossimi passi -->
    <table cellpadding="0" cellspacing="0" width="100%" style="background:#f1f5f9;border-radius:8px;margin-bottom:28px;">
      <tr><td style="padding:24px;">
        <p style="margin:0 0 16px;font-family:${EMAIL_FONT};font-size:13px;font-weight:700;color:${EMAIL_BRAND_DARK};text-transform:uppercase;letter-spacing:0.05em;">Prossimi passi</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          ${!hasDemo ? `
          <tr>
            <td style="padding:0 0 12px;vertical-align:top;width:24px;">
              <div style="width:20px;height:20px;border-radius:50%;background:${EMAIL_BRAND_BLUE};color:#fff;font-family:${EMAIL_FONT};font-size:11px;font-weight:700;text-align:center;line-height:20px;">1</div>
            </td>
            <td style="padding:0 0 12px 12px;">
              <p style="margin:0;font-family:${EMAIL_FONT};font-size:14px;font-weight:600;color:${EMAIL_BRAND_DARK};">Imposta la tua password</p>
              <p style="margin:4px 0 0;font-family:${EMAIL_FONT};font-size:13px;color:#64748b;line-height:1.5;">Clicca sul link qui sotto per impostare la tua password personale</p>
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding:0 0 12px;vertical-align:top;width:24px;">
              <div style="width:20px;height:20px;border-radius:50%;background:${EMAIL_BRAND_BLUE};color:#fff;font-family:${EMAIL_FONT};font-size:11px;font-weight:700;text-align:center;line-height:20px;">${hasDemo ? '1' : '2'}</div>
            </td>
            <td style="padding:0 0 12px 12px;">
              <p style="margin:0;font-family:${EMAIL_FONT};font-size:14px;font-weight:600;color:${EMAIL_BRAND_DARK};">Completa i dati aziendali</p>
              <p style="margin:4px 0 0;font-family:${EMAIL_FONT};font-size:13px;color:#64748b;line-height:1.5;">Verifica e completa P.IVA, indirizzo, PEC e codice destinatario SDI</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0;vertical-align:top;width:24px;">
              <div style="width:20px;height:20px;border-radius:50%;background:${EMAIL_BRAND_BLUE};color:#fff;font-family:${EMAIL_FONT};font-size:11px;font-weight:700;text-align:center;line-height:20px;">${hasDemo ? '2' : '3'}</div>
            </td>
            <td style="padding:0 0 0 12px;">
              <p style="margin:0;font-family:${EMAIL_FONT};font-size:14px;font-weight:600;color:${EMAIL_BRAND_DARK};">Inizia ad usare RescueManager</p>
              <p style="margin:4px 0 0;font-family:${EMAIL_FONT};font-size:13px;color:#64748b;line-height:1.5;">Accedi alla piattaforma e inizia a gestire la tua attività</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>

    ${setupPasswordUrl ? emailCtaButton(setupPasswordUrl, hasDemo ? 'Imposta nuova password' : 'Imposta la tua password') : ''}
    ${setupPasswordUrl ? `<div style="margin:20px 0;"></div>` : ''}
    ${emailCtaButton('https://rescuemanager.eu/login', 'Accedi a RescueManager')}

    <p style="margin:24px 0 0;font-family:${EMAIL_FONT};font-size:13px;color:#64748b;line-height:1.6;">
      ${hasDemo ? 'I dati demo sono stati rimossi. ' : ''}Grazie per aver scelto RescueManager! Per assistenza scrivi a
      <a href="mailto:info@rescuemanager.eu" style="color:${EMAIL_BRAND_BLUE};text-decoration:none;">info@rescuemanager.eu</a>.
    </p>
  </td>
</tr>
${emailFooter()}`;

  const textSteps = hasDemo 
    ? '1. Imposta nuova password (opzionale)\n2. Completa i dati aziendali\n3. Inizia ad usare RescueManager'
    : '1. Imposta la tua password\n2. Completa i dati aziendali\n3. Inizia ad usare RescueManager';

  const text = `Account RescueManager Attivato!\n\nGentile ${name},\n\nIl tuo account è stato attivato.\nPiano: ${planLabels[planType] || planType} - ${fmt(monthlyTotal)}/mese\n\nProssimi passi:\n${textSteps}\n\n${setupPasswordUrl ? `Imposta password: ${setupPasswordUrl}\n\n` : ''}Accedi: https://rescuemanager.eu/login\n\nRescueManager`;

  return { html: emailWrapper(body), text };
}

// ─── Email Appuntamenti ───────────────────────────────────────────────────────

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

/**
 * Invio booking link Calendly o pagina interna /appointment/[uuid]
 */
function buildBookingLinkEmail({ name, companyName, appointmentType, duration, bookingUrl, customMessage }) {
  const typeLabel = APPT_TYPE_LABEL[appointmentType] || 'un incontro';
  const body = `
${emailHeader('Pianifichiamo l\'incontro')}
<tr>
  <td style="padding:36px 40px 28px;">
    <p style="margin:0 0 6px;font-family:${EMAIL_FONT};font-size:11px;font-weight:700;color:${EMAIL_BRAND_BLUE};text-transform:uppercase;letter-spacing:0.1em;">Prenota uno slot</p>
    <h1 style="margin:0 0 16px;font-family:${EMAIL_FONT};font-size:26px;font-weight:900;color:${EMAIL_BRAND_DARK};line-height:1.2;">
      Ciao${name ? ' ' + name.split(' ')[0] : ''}<span style="color:${EMAIL_BRAND_BLUE};">.</span>
    </h1>
    <p style="margin:0 0 24px;font-family:${EMAIL_FONT};font-size:15px;color:#475569;line-height:1.65;">
      Vorremmo organizzare <strong>${typeLabel}</strong> di <strong>${duration} minuti</strong>${companyName ? ` con <strong style="color:${EMAIL_BRAND_DARK};">${companyName}</strong>` : ''}.
      Scegli tu il momento che ti fa più comodo dal calendario qui sotto.
    </p>

    ${customMessage ? `
    <table cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border-left:4px solid ${EMAIL_BRAND_BLUE};margin-bottom:24px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0;font-family:${EMAIL_FONT};font-size:14px;color:#334155;line-height:1.6;">${customMessage}</p>
      </td></tr>
    </table>` : ''}

    ${emailCtaButton(bookingUrl, 'Scegli data e ora')}

    <p style="margin:24px 0 0;font-family:${EMAIL_FONT};font-size:13px;color:#94a3b8;line-height:1.6;">
      Se preferisci possiamo concordare un altro orario via email o telefono. Rispondi pure a questa email per qualsiasi richiesta.
    </p>
  </td>
</tr>
${emailFooter()}`;

  const text = `Ciao ${name || ''}, prenota ${typeLabel} di ${duration} min: ${bookingUrl}${customMessage ? '\n\n' + customMessage : ''}`;
  return { html: emailWrapper(body), text };
}

/**
 * Conferma appuntamento (con allegato ICS)
 */
function buildAppointmentConfirmationEmail({ name, title, scheduledAt, durationMinutes, meetingMode, meetingUrl, meetingPhone, meetingAddress, publicUrl }) {
  const dateStr = fmtITDate(scheduledAt);
  const timeStr = fmtITTime(scheduledAt);
  const modeLabel = meetingMode === 'video' ? 'Videochiamata' : meetingMode === 'phone' ? 'Telefono' : 'In presenza';

  const meetingBlock = meetingUrl ? `
    <tr>
      <td style="padding:8px 0;font-family:${EMAIL_FONT};font-size:13px;color:#64748b;width:130px;">Link</td>
      <td style="padding:8px 0;font-family:${EMAIL_FONT};font-size:13px;"><a href="${meetingUrl}" style="color:${EMAIL_BRAND_BLUE};text-decoration:none;font-weight:600;">${meetingUrl}</a></td>
    </tr>` : meetingPhone ? `
    <tr>
      <td style="padding:8px 0;font-family:${EMAIL_FONT};font-size:13px;color:#64748b;width:130px;">Telefono</td>
      <td style="padding:8px 0;font-family:${EMAIL_FONT};font-size:13px;color:#0f172a;font-weight:600;">${meetingPhone}</td>
    </tr>` : meetingAddress ? `
    <tr>
      <td style="padding:8px 0;font-family:${EMAIL_FONT};font-size:13px;color:#64748b;width:130px;">Indirizzo</td>
      <td style="padding:8px 0;font-family:${EMAIL_FONT};font-size:13px;color:#0f172a;font-weight:600;">${meetingAddress}</td>
    </tr>` : '';

  const body = `
${emailHeader('Appuntamento confermato')}
<tr>
  <td style="padding:36px 40px 28px;">
    <p style="margin:0 0 6px;font-family:${EMAIL_FONT};font-size:11px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:0.1em;">Confermato</p>
    <h1 style="margin:0 0 16px;font-family:${EMAIL_FONT};font-size:26px;font-weight:900;color:${EMAIL_BRAND_DARK};line-height:1.2;">
      A presto${name ? ', ' + name.split(' ')[0] : ''}<span style="color:${EMAIL_BRAND_BLUE};">.</span>
    </h1>
    <p style="margin:0 0 24px;font-family:${EMAIL_FONT};font-size:15px;color:#475569;line-height:1.65;">
      Il tuo appuntamento <strong style="color:${EMAIL_BRAND_DARK};">${title}</strong> è confermato.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:24px;">
      <tr><td style="padding:24px;">
        <p style="margin:0 0 4px;font-family:${EMAIL_FONT};font-size:11px;font-weight:700;color:${EMAIL_BRAND_BLUE};text-transform:uppercase;letter-spacing:0.1em;">Data</p>
        <p style="margin:0 0 16px;font-family:${EMAIL_FONT};font-size:18px;font-weight:700;color:${EMAIL_BRAND_DARK};text-transform:capitalize;">${dateStr}</p>
        <p style="margin:0 0 4px;font-family:${EMAIL_FONT};font-size:11px;font-weight:700;color:${EMAIL_BRAND_BLUE};text-transform:uppercase;letter-spacing:0.1em;">Ora</p>
        <p style="margin:0 0 16px;font-family:${EMAIL_FONT};font-size:18px;font-weight:700;color:${EMAIL_BRAND_DARK};">${timeStr} &middot; ${durationMinutes} min</p>

        <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #e2e8f0;padding-top:12px;margin-top:8px;">
          <tr>
            <td style="padding:8px 0;font-family:${EMAIL_FONT};font-size:13px;color:#64748b;width:130px;">Modalità</td>
            <td style="padding:8px 0;font-family:${EMAIL_FONT};font-size:13px;color:#0f172a;font-weight:600;">${modeLabel}</td>
          </tr>
          ${meetingBlock}
        </table>
      </td></tr>
    </table>

    <p style="margin:0 0 16px;font-family:${EMAIL_FONT};font-size:13px;color:#64748b;line-height:1.6;">
      Trovi il file <strong>.ics</strong> in allegato per aggiungere l'appuntamento al tuo calendario (Google, Outlook, Apple).
    </p>

    ${publicUrl ? `
    <p style="margin:24px 0 0;font-family:${EMAIL_FONT};font-size:12px;color:#94a3b8;text-align:center;">
      Hai bisogno di riprogrammare? <a href="${publicUrl}" style="color:${EMAIL_BRAND_BLUE};">Apri pagina appuntamento</a>
    </p>` : ''}
  </td>
</tr>
${emailFooter()}`;

  const text = `Appuntamento confermato: ${title}\n${dateStr} alle ${timeStr} · ${durationMinutes} min\n${modeLabel}${meetingUrl ? ' · ' + meetingUrl : meetingPhone ? ' · ' + meetingPhone : meetingAddress ? ' · ' + meetingAddress : ''}\n\n${publicUrl ? 'Dettagli: ' + publicUrl : ''}`;
  return { html: emailWrapper(body), text };
}

/**
 * Promemoria 24h prima
 */
function buildAppointmentReminderEmail({ name, title, scheduledAt, durationMinutes, meetingMode, meetingUrl, meetingPhone, meetingAddress, when = '24h' }) {
  const dateStr = fmtITDate(scheduledAt);
  const timeStr = fmtITTime(scheduledAt);
  const whenLabel = when === '24h' ? 'Domani' : when === '1h' ? 'Tra un\'ora' : 'A breve';
  const modeLabel = meetingMode === 'video' ? 'Videochiamata' : meetingMode === 'phone' ? 'Telefono' : 'In presenza';

  const meetingLink = meetingUrl ? `<p style="margin:0 0 16px;font-family:${EMAIL_FONT};font-size:14px;"><a href="${meetingUrl}" style="color:${EMAIL_BRAND_BLUE};font-weight:700;text-decoration:none;">Apri link meeting &rarr;</a></p>` : '';

  const body = `
${emailHeader('Promemoria appuntamento')}
<tr>
  <td style="padding:36px 40px 28px;">
    <p style="margin:0 0 6px;font-family:${EMAIL_FONT};font-size:11px;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:0.1em;">${whenLabel}</p>
    <h1 style="margin:0 0 16px;font-family:${EMAIL_FONT};font-size:26px;font-weight:900;color:${EMAIL_BRAND_DARK};line-height:1.2;">
      Promemoria appuntamento<span style="color:${EMAIL_BRAND_BLUE};">.</span>
    </h1>
    <p style="margin:0 0 24px;font-family:${EMAIL_FONT};font-size:15px;color:#475569;line-height:1.65;">
      Buongiorno${name ? ' ' + name.split(' ')[0] : ''}, ti ricordiamo l'appuntamento <strong>${title}</strong>:
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="background:#fffbeb;border-left:4px solid #f59e0b;margin-bottom:24px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 6px;font-family:${EMAIL_FONT};font-size:13px;color:#92400e;text-transform:capitalize;">${dateStr}</p>
        <p style="margin:0 0 8px;font-family:${EMAIL_FONT};font-size:24px;font-weight:900;color:${EMAIL_BRAND_DARK};">${timeStr}</p>
        <p style="margin:0;font-family:${EMAIL_FONT};font-size:13px;color:#64748b;">${durationMinutes} min &middot; ${modeLabel}</p>
      </td></tr>
    </table>

    ${meetingLink}
    ${meetingPhone ? `<p style="margin:0 0 8px;font-family:${EMAIL_FONT};font-size:13px;color:#475569;">Chiamaci al: <strong>${meetingPhone}</strong></p>` : ''}
    ${meetingAddress ? `<p style="margin:0 0 8px;font-family:${EMAIL_FONT};font-size:13px;color:#475569;">${meetingAddress}</p>` : ''}

    <p style="margin:24px 0 0;font-family:${EMAIL_FONT};font-size:12px;color:#94a3b8;line-height:1.6;">
      Hai un imprevisto? Rispondi a questa email per riprogrammare.
    </p>
  </td>
</tr>
${emailFooter()}`;

  const text = `Promemoria: ${title} - ${dateStr} alle ${timeStr}${meetingUrl ? '\nLink: ' + meetingUrl : ''}`;
  return { html: emailWrapper(body), text };
}

/**
 * Conferma slot scelto dal lead (notifica all'admin staff)
 */
function buildAppointmentBookedNotifyStaffEmail({ leadName, leadCompany, leadEmail, title, scheduledAt, adminUrl }) {
  const dateStr = fmtITDate(scheduledAt);
  const timeStr = fmtITTime(scheduledAt);

  const body = `
${emailHeader('Slot scelto dal lead')}
<tr>
  <td style="padding:36px 40px 28px;">
    <p style="margin:0 0 6px;font-family:${EMAIL_FONT};font-size:11px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:0.1em;">Nuova prenotazione</p>
    <h1 style="margin:0 0 16px;font-family:${EMAIL_FONT};font-size:24px;font-weight:900;color:${EMAIL_BRAND_DARK};line-height:1.2;">
      ${leadName} ha confermato lo slot<span style="color:${EMAIL_BRAND_BLUE};">.</span>
    </h1>

    <table cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;margin-bottom:24px;">
      <tr><td style="padding:20px 24px;">
        ${emailInfoRow('Cliente', leadName + (leadCompany ? ` · ${leadCompany}` : ''))}
        ${emailInfoRow('Email', leadEmail)}
        ${emailInfoRow('Appuntamento', title)}
        ${emailInfoRow('Quando', `${dateStr}, ${timeStr}`)}
      </td></tr>
    </table>

    ${adminUrl ? emailCtaButton(adminUrl, 'Apri nel pannello admin') : ''}
  </td>
</tr>
${emailFooter()}`;

  const text = `${leadName} ha scelto lo slot: ${title} - ${dateStr} ${timeStr}\n${leadEmail}${adminUrl ? '\n' + adminUrl : ''}`;
  return { html: emailWrapper(body), text };
}

/**
 * Email link pagamento — inviata al cliente DOPO che ha accettato un preventivo
 * con requires_approval=true e l'admin ha approvato l'accettazione.
 */
function buildPaymentLinkEmail({ leadName, quoteNumber, planType, monthlyTotal, yearlyTotal, contractDuration, checkoutUrl, expiryDate }) {
  const planLabel = (planType || '').charAt(0).toUpperCase() + (planType || '').slice(1);
  const isYearly = contractDuration === 'yearly';
  const isBiennial = contractDuration === 'biennial';
  const amount = isYearly ? yearlyTotal : isBiennial ? (monthlyTotal * 24 * 0.85) : monthlyTotal;
  const periodLabel = isYearly ? 'annuale' : isBiennial ? 'biennale' : 'mensile';
  const periodPrefix = isYearly ? 'anno' : isBiennial ? '2 anni' : 'mese';
  const expiryStr = expiryDate ? new Date(expiryDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) : null;
  const formattedAmount = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount || 0);

  const body = `
${emailHeader('Approvazione confermata')}
<tr>
  <td style="padding:36px 40px 28px;">
    <p style="margin:0 0 6px;font-family:${EMAIL_FONT};font-size:11px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:0.1em;">Approvato</p>
    <h1 style="margin:0 0 16px;font-family:${EMAIL_FONT};font-size:26px;font-weight:900;color:${EMAIL_BRAND_DARK};line-height:1.2;">
      Procedi al pagamento${leadName ? ', ' + leadName.split(' ')[0] : ''}<span style="color:${EMAIL_BRAND_BLUE};">.</span>
    </h1>
    <p style="margin:0 0 24px;font-family:${EMAIL_FONT};font-size:15px;color:#475569;line-height:1.65;">
      Abbiamo confermato la tua accettazione del preventivo <strong style="color:${EMAIL_BRAND_DARK};">${quoteNumber}</strong>.
      Per attivare l'abbonamento ${planLabel ? 'piano <strong>' + planLabel + '</strong>' : ''} completa il pagamento sicuro tramite il link qui sotto.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:24px;">
      <tr><td style="padding:24px;">
        <p style="margin:0 0 4px;font-family:${EMAIL_FONT};font-size:11px;font-weight:700;color:${EMAIL_BRAND_BLUE};text-transform:uppercase;letter-spacing:0.1em;">Importo ${periodLabel}</p>
        <p style="margin:0 0 14px;font-family:${EMAIL_FONT};font-size:32px;font-weight:900;color:${EMAIL_BRAND_DARK};line-height:1;">${formattedAmount}<span style="font-size:14px;font-weight:600;color:#64748b;"> / ${periodPrefix}</span></p>
        <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #e2e8f0;padding-top:12px;margin-top:8px;">
          ${emailInfoRow('Preventivo', quoteNumber)}
          ${planLabel ? emailInfoRow('Piano', planLabel) : ''}
          ${emailInfoRow('Periodo', periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1))}
          ${expiryStr ? emailInfoRow('Valido fino al', expiryStr) : ''}
        </table>
      </td></tr>
    </table>

    ${emailCtaButton(checkoutUrl, 'Procedi al pagamento sicuro')}

    <p style="margin:24px 0 8px;font-family:${EMAIL_FONT};font-size:13px;color:#475569;line-height:1.6;">
      Il pagamento avviene su <strong>Stripe</strong>, piattaforma certificata PCI-DSS Level 1.
      Una volta completato riceverai conferma immediata e il tuo account verrà attivato dal nostro team.
    </p>
    <p style="margin:0;font-family:${EMAIL_FONT};font-size:12px;color:#94a3b8;line-height:1.6;">
      Hai domande? Rispondi a questa email o scrivici a <a href="mailto:info@rescuemanager.eu" style="color:${EMAIL_BRAND_BLUE};text-decoration:none;">info@rescuemanager.eu</a>.
    </p>
  </td>
</tr>
${emailFooter()}`;

  const text = `Preventivo ${quoteNumber} approvato.\nImporto: ${formattedAmount} / ${periodPrefix}\nProcedi al pagamento: ${checkoutUrl}`;
  return { html: emailWrapper(body), text };
}

module.exports = {
  sendEmail,
  buildDemoWelcomeEmail,
  buildQuoteEmail,
  buildAccountActivatedEmail,
  buildBookingLinkEmail,
  buildAppointmentConfirmationEmail,
  buildAppointmentReminderEmail,
  buildAppointmentBookedNotifyStaffEmail,
  buildPaymentLinkEmail,
};
