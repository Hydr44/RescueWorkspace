// Template email brandizzato RescueManager — port CommonJS dell'helper canonico
// del sito (website/src/lib/email-template.ts), allineato anche a
// moduli/lead-api/lib/email.js e moduli/regulatory-monitor/lib/email.js.
// Header scuro con logo, card bianca, box codice, righe info, footer barra blu.
// Layout 100% table (email-safe: Gmail/Outlook/Apple Mail).

const EMAIL_FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif";
const BRAND_DARK = '#0f172a';
const BRAND_BLUE = '#2563eb';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function emailHeader(subtitle) {
  return `
<tr>
  <td style="background:${BRAND_DARK};padding:28px 40px;">
    <table cellpadding="0" cellspacing="0" width="100%"><tr>
      <td>
        <img src="https://rescuemanager.eu/assets/logos/logo-principale-a-colori.svg" alt="RescueManager" style="height:32px;width:auto;display:block;margin-bottom:${subtitle ? '8px' : '0'};" />
        ${subtitle ? `<p style="margin:0;font-family:${EMAIL_FONT};font-size:13px;color:rgba(255,255,255,0.55);letter-spacing:0.05em;text-transform:uppercase;">${esc(subtitle)}</p>` : ''}
      </td>
      <td align="right"><span style="font-family:${EMAIL_FONT};font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.1em;">rescuemanager.eu</span></td>
    </tr></table>
  </td>
</tr>`;
}

function emailFooter() {
  return `
<tr>
  <td style="background:${BRAND_DARK};padding:20px 40px;border-top:3px solid ${BRAND_BLUE};">
    <p style="margin:0;font-family:${EMAIL_FONT};font-size:11px;color:rgba(255,255,255,0.4);text-align:center;">
      &copy; ${new Date().getFullYear()} RescueManager &mdash; Software Gestionale<br>
      <a href="https://rescuemanager.eu" style="color:${BRAND_BLUE};text-decoration:none;">rescuemanager.eu</a>
      &nbsp;&middot;&nbsp;
      <a href="mailto:info@rescuemanager.eu" style="color:rgba(255,255,255,0.4);text-decoration:none;">info@rescuemanager.eu</a>
    </p>
  </td>
</tr>`;
}

function emailCodeBox(code) {
  return `
<table cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border-left:4px solid ${BRAND_BLUE};margin:8px 0 24px;"><tr>
  <td style="padding:20px 24px;text-align:center;">
    <p style="margin:0 0 6px;font-family:${EMAIL_FONT};font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;">Codice di verifica</p>
    <p style="margin:0;font-family:monospace;font-size:32px;font-weight:700;letter-spacing:0.3em;color:${BRAND_DARK};">${esc(code)}</p>
  </td>
</tr></table>`;
}

function emailInfoRow(label, value) {
  return `
<tr>
  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-family:${EMAIL_FONT};font-size:13px;color:#64748b;width:140px;">${esc(label)}</td>
  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-family:${EMAIL_FONT};font-size:13px;color:#0f172a;font-weight:600;">${esc(value)}</td>
</tr>`;
}

function emailWrapper(content) {
  return `<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>RescueManager</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:${EMAIL_FONT};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;"><tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;">${content}</table>
  <p style="margin:16px 0 0;font-family:${EMAIL_FONT};font-size:11px;color:#94a3b8;text-align:center;">Hai ricevuto questa email da RescueManager.</p>
</td></tr></table>
</body></html>`;
}

/**
 * Costruisce l'HTML brandizzato da un body testuale (una riga = un paragrafo).
 * opts: { subtitle, code, infoRows:[{label,value}], footerNote }.
 * I paragrafi supportano <strong> (già HTML): passa testo già "escapato" dove serve.
 */
function brandedHtml(bodyText, opts = {}) {
  const paragraphs = String(bodyText || '').split('\n').map((line) => {
    if (line.trim() === '') return '';
    return `<p style="margin:0 0 14px;font-family:${EMAIL_FONT};font-size:15px;color:#475569;line-height:1.65;">${line}</p>`;
  }).join('\n');

  const infoTable = opts.infoRows && opts.infoRows.length
    ? `<table cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border-left:4px solid ${BRAND_BLUE};margin:8px 0 24px;"><tr><td style="padding:16px 24px;"><table cellpadding="0" cellspacing="0" width="100%">${opts.infoRows.map((r) => emailInfoRow(r.label, r.value)).join('')}</table></td></tr></table>`
    : '';

  const content = `
${emailHeader(opts.subtitle)}
<tr><td style="padding:36px 40px;">
${paragraphs}
${opts.code ? emailCodeBox(opts.code) : ''}
${infoTable}
${opts.footerNote ? `<p style="margin:20px 0 0;font-family:${EMAIL_FONT};font-size:12px;color:#94a3b8;line-height:1.6;">${opts.footerNote}</p>` : ''}
</td></tr>
${emailFooter()}`;

  return emailWrapper(content);
}

module.exports = { brandedHtml, esc, BRAND_DARK, BRAND_BLUE };
