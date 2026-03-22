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
  <td style="background:${EMAIL_BRAND_DARK};padding:20px 40px;border-top:3px solid ${EMAIL_BRAND_BLUE};">
    <p style="margin:0;font-family:${EMAIL_FONT};font-size:11px;color:rgba(255,255,255,0.4);text-align:center;">
      &copy; ${new Date().getFullYear()} RescueManager &mdash; Software Gestionale per Autodemolizioni<br>
      <a href="https://rescuemanager.eu" style="color:${EMAIL_BRAND_BLUE};text-decoration:none;">rescuemanager.eu</a>
      &nbsp;&middot;&nbsp;
      <a href="mailto:info@rescuemanager.eu" style="color:rgba(255,255,255,0.4);text-decoration:none;">info@rescuemanager.eu</a>
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
          ⚠️ Devi impostare una password prima di accedere. Il link è valido per 24 ore.
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
 */
function buildQuoteEmail({ leadName, quoteNumber, planType, monthlyTotal, yearlyTotal, expiryDate, publicUrl, pdfUrl, specialModules, baseModules, setupFee, discountPercent }) {
  const fmt = (n) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n || 0);
  const expiryStr = new Date(expiryDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

  const planLabels = { starter: 'Starter', flotta: 'Flotta', enterprise: 'Enterprise', custom: 'Custom' };
  const moduleLabels = { rvfu: 'Demolizioni RVFU', rentri: 'RENTRI', fatturazione: 'Fatturazione Elettronica' };
  const specialList = (specialModules || []).map(m => moduleLabels[m] || m).join(', ');

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
          ${discountPercent > 0 ? emailInfoRow('Sconto applicato', `-${discountPercent}%`) : ''}
          ${setupFee > 0 ? emailInfoRow('Setup (una tantum)', fmt(setupFee)) : ''}
        </table>
        <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:14px;padding-top:14px;border-top:2px solid #e2e8f0;">
          <tr>
            <td style="font-family:${EMAIL_FONT};font-size:16px;font-weight:900;color:${EMAIL_BRAND_DARK};">Totale Mensile</td>
            <td align="right" style="font-family:${EMAIL_FONT};font-size:22px;font-weight:900;color:${EMAIL_BRAND_BLUE};">${fmt(monthlyTotal)}<span style="font-size:13px;font-weight:400;color:#64748b;">/mese</span></td>
          </tr>
          ${yearlyTotal ? `<tr>
            <td style="font-family:${EMAIL_FONT};font-size:12px;color:#94a3b8;padding-top:4px;">Fatturazione annuale</td>
            <td align="right" style="font-family:${EMAIL_FONT};font-size:12px;color:#94a3b8;padding-top:4px;">${fmt(yearlyTotal)}/anno</td>
          </tr>` : ''}
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

  const text = `Preventivo ${quoteNumber}\n\nGentile ${leadName},\n\nPiano: ${planLabels[planType] || planType}\nTotale Mensile: ${fmt(monthlyTotal)}/mese\nValidità: ${expiryStr}\n\nVisualizza: ${publicUrl}\n\nRescueManager - rescuemanager.eu`;

  return { html: emailWrapper(body), text };
}

// ─── Email Account Attivato ───────────────────────────────────────────────────

/**
 * Email Account Attivato
 */
function buildAccountActivatedEmail({ name, planType, modules, monthlyTotal, setupPasswordUrl, hasDemo }) {
  const fmt = (n) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n || 0);
  const planLabels = { starter: 'Starter', flotta: 'Flotta', enterprise: 'Enterprise', custom: 'Custom' };
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

module.exports = {
  sendEmail,
  buildDemoWelcomeEmail,
  buildQuoteEmail,
  buildAccountActivatedEmail
};
