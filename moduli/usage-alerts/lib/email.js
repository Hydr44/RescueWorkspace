/**
 * Invio email via nodemailer (gateway SMTP Resend) — stesse credenziali degli
 * altri servizi VPS (SMTP_* in /root/.env). Builder dedicato per l'avviso
 * "superamento morbido" dei limiti d'uso, indirizzato al cliente.
 */
const nodemailer = require('nodemailer');

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif";
const DARK = '#0f172a';
const BLUE = '#2563eb';
const AMBER = '#d97706';
const RED = '#dc2626';

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.resend.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
      user: process.env.SMTP_USER || 'resend',
      pass: process.env.SMTP_PASS || process.env.RESEND_API_KEY,
    },
  });
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const transport = getTransporter();
  const from = process.env.SMTP_FROM || 'info@rescuemanager.eu';
  const result = await transport.sendMail({
    from: `"RescueManager" <${from}>`,
    to,
    replyTo: from,
    subject,
    html,
    text: text || '',
    headers: {
      'List-Unsubscribe': `<mailto:${from}?subject=stop-avvisi-utilizzo>`,
    },
  });
  console.log(`[EMAIL] Inviata a ${to}: ${subject} (${result.messageId})`);
  return result;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * org: { name }
 * c:   { label, threshold(80|100), usedStr, maxStr, pct }
 */
function buildUsageAlertEmail(org, c) {
  const over = c.threshold >= 100;
  const accent = over ? RED : AMBER;
  const orgName = org && org.name ? esc(org.name) : 'la tua organizzazione';
  const labelLc = esc(String(c.label).toLowerCase());
  const subject = over ? `Limite raggiunto: ${c.label}` : `Stai per esaurire: ${c.label}`;

  const intro = over
    ? `hai raggiunto il limite incluso nel tuo piano per ${labelLc}.`
    : `il tuo utilizzo di ${labelLc} ha raggiunto l'${c.pct}% del limite del piano.`;
  const reassure = over
    ? 'Il servizio continua a funzionare senza interruzioni: puoi aggiungere un pacchetto o passare a un piano superiore quando vuoi.'
    : 'Ti avvisiamo in anticipo così puoi valutare per tempo un pacchetto aggiuntivo o un upgrade. Nessun blocco.';

  const html = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:${FONT};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;"><tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;">
    <tr><td style="background:${DARK};padding:24px 32px;">
      <p style="margin:0;font-family:${FONT};font-size:18px;font-weight:900;color:#ffffff;">RescueManager <span style="color:${BLUE};">·</span> Utilizzo del piano</p>
      <p style="margin:6px 0 0;font-family:${FONT};font-size:12px;color:rgba(255,255,255,0.55);">${orgName}</p>
    </td></tr>
    <tr><td style="padding:28px 32px;">
      <p style="margin:0 0 16px;font-family:${FONT};font-size:15px;color:#475569;line-height:1.6;">Ciao, ${intro}</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-left:4px solid ${accent};margin:0 0 20px;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0;font-family:${FONT};font-size:11px;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:0.08em;">${esc(c.label)}</p>
          <p style="margin:6px 0 0;font-family:${FONT};font-size:22px;font-weight:800;color:${DARK};">${c.pct}%</p>
          <p style="margin:4px 0 0;font-family:${FONT};font-size:13px;color:#64748b;">${esc(c.usedStr)} di ${esc(c.maxStr)}</p>
        </td></tr>
      </table>
      <p style="margin:0 0 22px;font-family:${FONT};font-size:14px;color:#475569;line-height:1.6;">${reassure}</p>
      <a href="https://rescuemanager.eu/dashboard/billing" style="display:inline-block;background:${BLUE};color:#ffffff;text-decoration:none;font-family:${FONT};font-size:14px;font-weight:600;padding:11px 22px;">Gestisci il piano</a>
    </td></tr>
    <tr><td style="background:${DARK};padding:16px 32px;border-top:3px solid ${BLUE};">
      <p style="margin:0;font-family:${FONT};font-size:11px;color:rgba(255,255,255,0.4);text-align:center;">© ${new Date().getFullYear()} RescueManager — avviso automatico sull'utilizzo del piano</p>
    </td></tr>
  </table>
</td></tr></table></body></html>`;

  const text =
    `RescueManager — Utilizzo del piano${org && org.name ? ` (${org.name})` : ''}\n\n` +
    `${over ? 'Limite raggiunto' : 'Stai per esaurire'}: ${c.label}\n` +
    `${c.usedStr} di ${c.maxStr} (${c.pct}%)\n\n` +
    `${over ? 'Il servizio continua a funzionare senza interruzioni.' : 'Nessun blocco, è solo un avviso in anticipo.'}\n` +
    `Gestisci il piano: https://rescuemanager.eu/dashboard/billing\n`;

  return { subject, html, text };
}

module.exports = { sendEmail, buildUsageAlertEmail };
