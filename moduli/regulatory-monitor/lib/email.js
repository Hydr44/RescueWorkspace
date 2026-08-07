/**
 * Invio email via nodemailer (gateway SMTP Resend) — stesse credenziali degli
 * altri servizi VPS. Builder dedicato per la notifica "aggiornamento normativo".
 */
const nodemailer = require('nodemailer');

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif";
const DARK = '#0f172a';
const BLUE = '#2563eb';

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
  const result = await transport.sendMail({
    from: `"RescueManager · Aggiornamenti normativi" <${process.env.SMTP_FROM || 'info@rescuemanager.eu'}>`,
    to,
    subject,
    html,
    text: text || '',
  });
  console.log(`[EMAIL] Inviata a ${to}: ${subject} (${result.messageId})`);
  return result;
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * changes: [{ group, label, url, added: [{ title, url }] }]
 *   - added presente e non vuoto -> elenco delle nuove voci
 *   - added vuoto -> notifica "contenuto pagina cambiato" (mode text)
 */
function buildUpdateEmail(changes) {
  const totalNew = changes.reduce((n, c) => n + (c.added ? c.added.length : 0), 0);
  const groups = changes.map((c) => c.group).filter((v, i, a) => a.indexOf(v) === i);

  const subject =
    totalNew > 0
      ? `📋 Aggiornamenti normativi: ${totalNew} ${totalNew === 1 ? 'nuova voce' : 'nuove voci'} (${groups.join(', ')})`
      : `📋 Aggiornamento normativo rilevato (${groups.join(', ')})`;

  const blocks = changes
    .map((c) => {
      const body =
        c.added && c.added.length
          ? `<ul style="margin:8px 0 0;padding-left:18px;">${c.added
              .map(
                (a) =>
                  `<li style="margin:0 0 6px;font-family:${FONT};font-size:14px;color:${DARK};line-height:1.5;"><a href="${esc(
                    a.url
                  )}" style="color:${BLUE};text-decoration:none;font-weight:600;">${esc(a.title)}</a></li>`
              )
              .join('')}</ul>`
          : `<p style="margin:8px 0 0;font-family:${FONT};font-size:13px;color:#475569;">Il contenuto della pagina è cambiato. <a href="${esc(
              c.url
            )}" style="color:${BLUE};">Apri la pagina</a> per vedere cosa è stato aggiornato.</p>`;

      return `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-left:4px solid ${BLUE};margin-bottom:18px;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0;font-family:${FONT};font-size:11px;font-weight:700;color:${BLUE};text-transform:uppercase;letter-spacing:0.08em;">${esc(c.group)}</p>
          <p style="margin:4px 0 0;font-family:${FONT};font-size:15px;font-weight:700;color:${DARK};">${esc(c.label)}</p>
          ${body}
          <p style="margin:10px 0 0;"><a href="${esc(c.url)}" style="font-family:${FONT};font-size:12px;color:#64748b;text-decoration:none;">${esc(c.url)}</a></p>
        </td></tr>
      </table>`;
    })
    .join('');

  const html = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:${FONT};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;"><tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;">
    <tr><td style="background:${DARK};padding:24px 32px;">
      <p style="margin:0;font-family:${FONT};font-size:18px;font-weight:900;color:#ffffff;">RescueManager <span style="color:${BLUE};">·</span> Aggiornamenti normativi</p>
      <p style="margin:6px 0 0;font-family:${FONT};font-size:12px;color:rgba(255,255,255,0.55);">Monitoraggio automatico · RENTRI · SDI/FatturaPA · RVFU</p>
    </td></tr>
    <tr><td style="padding:28px 32px;">
      <p style="margin:0 0 20px;font-family:${FONT};font-size:14px;color:#475569;line-height:1.6;">Sono state rilevate novità sulle fonti ufficiali monitorate. Dettaglio qui sotto.</p>
      ${blocks}
      <p style="margin:24px 0 0;font-family:${FONT};font-size:12px;color:#94a3b8;line-height:1.6;">Controllo eseguito automaticamente dal monitor sul VPS. Se una voce risulta già nota, ignorala.</p>
    </td></tr>
    <tr><td style="background:${DARK};padding:16px 32px;border-top:3px solid ${BLUE};">
      <p style="margin:0;font-family:${FONT};font-size:11px;color:rgba(255,255,255,0.4);text-align:center;">© ${new Date().getFullYear()} RescueManager — monitor normativo automatico</p>
    </td></tr>
  </table>
</td></tr></table></body></html>`;

  const text =
    `RescueManager — Aggiornamenti normativi\n\n` +
    changes
      .map((c) => {
        const lines =
          c.added && c.added.length
            ? c.added.map((a) => `  - ${a.title}\n    ${a.url}`).join('\n')
            : `  Contenuto pagina modificato: ${c.url}`;
        return `[${c.group}] ${c.label}\n${lines}`;
      })
      .join('\n\n') +
    `\n\n--\nMonitor normativo automatico sul VPS.`;

  return { subject, html, text };
}

module.exports = { sendEmail, buildUpdateEmail };
