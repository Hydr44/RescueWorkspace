// electron/email-service.js
// Servizio invio email via SMTP (nodemailer)

const nodemailer = require('nodemailer');

// Configurazione SMTP di default (IONOS)
const DEFAULT_SMTP = {
    host: 'smtp.ionos.com',
    port: 587,
    secure: false,
    auth: {
        user: 'noreply@rescuemanager.eu',
        pass: '',
    },
    from: '"RescueManager" <noreply@rescuemanager.eu>',
};

let _transporter = null;

/**
 * Crea o restituisce il transporter SMTP.
 * @param {object} smtpConfig - Override configurazione SMTP
 */
function getTransporter(smtpConfig = {}) {
    const cfg = { ...DEFAULT_SMTP, ...smtpConfig };
    if (!cfg.auth?.pass) {
        console.warn('[EMAIL] SMTP password non configurata');
        return null;
    }
    _transporter = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        auth: cfg.auth,
        tls: { rejectUnauthorized: false },
    });
    _transporter._fromAddress = cfg.from;
    return _transporter;
}

/**
 * Invia un'email.
 * @param {{ to: string, subject: string, html: string }} opts
 * @param {object} smtpConfig - Override SMTP (opzionale)
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
async function sendEmail({ to, subject, html }, smtpConfig) {
    try {
        const transporter = getTransporter(smtpConfig);
        if (!transporter) {
            return { success: false, error: 'SMTP non configurato — imposta la password nelle impostazioni' };
        }
        const info = await transporter.sendMail({
            from: transporter._fromAddress,
            to,
            subject,
            html,
        });
        console.log(`[EMAIL] Inviata a ${to}: "${subject}" — ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (err) {
        console.error('[EMAIL] Errore invio:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Verifica la connessione SMTP.
 * @param {object} smtpConfig
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
async function verifySmtp(smtpConfig) {
    try {
        const transporter = getTransporter(smtpConfig);
        if (!transporter) return { success: false, error: 'SMTP non configurato' };
        await transporter.verify();
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// ——— Template HTML email ———

function wrapTemplate(title, bodyHtml) {
    return `
<h2 style="margin:0 0 8px; font-size:20px; font-weight:700; color:#111827; text-align:center; font-family:'Inter',-apple-system,sans-serif;">
  ${title}
</h2>
${bodyHtml}
<div style="height:1px; background:#e5e7eb; margin:20px 0 16px;"></div>
<p style="margin:0; font-size:11px; color:#d1d5db; text-align:center; font-family:'Inter',-apple-system,sans-serif;">
  &copy; ${new Date().getFullYear()} RescueManager &middot;
  <a href="https://rescuemanager.eu" style="color:#9ca3af; text-decoration:none;">rescuemanager.eu</a>
</p>`;
}

/**
 * Template per scadenze veicoli.
 * @param {{ targa: string, modello: string, scadenze: string }[]} veicoli
 */
function templateScadenzeVeicoli(veicoli) {
    const rows = veicoli.map(v =>
        `<tr>
      <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; font-size:13px; color:#111827; font-family:'Inter',-apple-system,sans-serif;">
        <strong>${v.targa || '—'}</strong>
        <span style="color:#6b7280; margin-left:6px;">${v.modello || ''}</span>
      </td>
      <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; font-size:13px; color:#374151; font-family:'Inter',-apple-system,sans-serif;">
        ${v.scadenze || '—'}
      </td>
    </tr>`
    ).join('');

    const body = `
<p style="margin:0 0 16px; font-size:14px; color:#6b7280; text-align:center; font-family:'Inter',-apple-system,sans-serif;">
  I seguenti veicoli hanno scadenze da verificare.
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
       style="border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; margin-bottom:16px;">
  <thead>
    <tr style="background:#f9fafb;">
      <th style="padding:8px 12px; text-align:left; font-size:11px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; font-family:'Inter',-apple-system,sans-serif;">Veicolo</th>
      <th style="padding:8px 12px; text-align:left; font-size:11px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; font-family:'Inter',-apple-system,sans-serif;">Scadenze</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<p style="margin:0; font-size:12px; color:#9ca3af; text-align:center; font-family:'Inter',-apple-system,sans-serif;">
  Verifica le scadenze e aggiorna i documenti necessari.
</p>`;

    return wrapTemplate('Scadenze Veicoli', body);
}

/**
 * Template per eventi in scadenza (calendario).
 * @param {{ titolo: string, inizio: string, descrizione?: string }[]} eventi
 */
function templateScadenzeEventi(eventi) {
    const rows = eventi.map(e => {
        const data = e.inizio ? new Date(e.inizio).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
        return `<tr>
      <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; font-size:13px; color:#111827; font-family:'Inter',-apple-system,sans-serif;">
        <strong>${e.titolo}</strong>
        ${e.descrizione ? `<br/><span style="color:#6b7280; font-size:12px;">${e.descrizione}</span>` : ''}
      </td>
      <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; font-size:13px; color:#374151; font-family:'Inter',-apple-system,sans-serif;">
        ${data}
      </td>
    </tr>`;
    }).join('');

    const body = `
<p style="margin:0 0 16px; font-size:14px; color:#6b7280; text-align:center; font-family:'Inter',-apple-system,sans-serif;">
  Le seguenti scadenze si avvicinano.
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
       style="border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; margin-bottom:16px;">
  <thead>
    <tr style="background:#f9fafb;">
      <th style="padding:8px 12px; text-align:left; font-size:11px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; font-family:'Inter',-apple-system,sans-serif;">Evento</th>
      <th style="padding:8px 12px; text-align:left; font-size:11px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; font-family:'Inter',-apple-system,sans-serif;">Data</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>`;

    return wrapTemplate('Scadenze in Arrivo', body);
}

/**
 * Template per email di test.
 */
function templateTest() {
    const body = `
<p style="margin:0 0 16px; font-size:14px; line-height:1.6; color:#374151; text-align:center; font-family:'Inter',-apple-system,sans-serif;">
  Questa è un'email di test inviata da <strong style="color:#2563EB;">RescueManager</strong>.<br/>
  Se la ricevi, le notifiche email sono configurate correttamente.
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
       style="background-color:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; margin-bottom:16px;">
  <tr>
    <td style="padding:14px 18px; text-align:center;">
      <p style="margin:0; font-size:13px; color:#15803d; font-weight:600; font-family:'Inter',-apple-system,sans-serif;">
        Configurazione SMTP verificata con successo.
      </p>
    </td>
  </tr>
</table>`;

    return wrapTemplate('Email di Test', body);
}

module.exports = {
    sendEmail,
    verifySmtp,
    getTransporter,
    templateScadenzeVeicoli,
    templateScadenzeEventi,
    templateTest,
};
