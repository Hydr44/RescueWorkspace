// moduli/messaging/whatsapp.js
// Client minimale per WhatsApp Cloud API (Meta). Account CENTRALE RescueManager.
// Invio messaggi "template" (gli unici ammessi per i business-initiated).
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api

const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v25.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN = process.env.WHATSAPP_TOKEN;

function graphUrl() {
  return `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;
}

/**
 * Invia un messaggio template.
 * @param {string} to - destinatario E.164 senza '+'? No: Meta accetta con o senza '+', usiamo E.164 con '+'.
 * @param {string} template - nome del template approvato
 * @param {string} languageCode - es. 'it'
 * @param {Array}  components - componenti (body/button/header) con i parametri
 */
async function sendTemplate(to, template, languageCode, components) {
  if (!PHONE_NUMBER_ID || !TOKEN) throw new Error('whatsapp_not_configured');
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: template,
      language: { code: languageCode || 'it' },
      ...(components && components.length ? { components } : {}),
    },
  };
  const res = await fetch(graphUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || `HTTP ${res.status}`;
    const e = new Error(`whatsapp_send_failed: ${msg}`);
    e.details = json;
    throw e;
  }
  return json; // { messaging_product, contacts, messages: [{ id }] }
}

/**
 * Componenti per il template "aggiornamento_soccorsi" (Utility, it/de/en).
 * HEADER: {{1}} = azienda (es. "Auto assistance Merano").
 * BODY:   {{1}} = telefono azienda · {{2}} = stato · {{3}} = numero trasporto.
 * (Il nome cliente non è più usato dal template.)
 */
function notifyComponents({ azienda, telefono, stato, numero }) {
  return [
    { type: 'header', parameters: [{ type: 'text', text: String(azienda || '') }] },
    {
      type: 'body',
      parameters: [
        { type: 'text', text: String(telefono || '') },
        { type: 'text', text: String(stato || '') },
        { type: 'text', text: String(numero || '') },
      ],
    },
  ];
}

/**
 * Componenti per il template "codice_firma" (Authentication, bottone Copy code).
 * Il codice va sia nel body sia nel bottone (formato richiesto da Meta per gli
 * authentication template). Se il bottone fosse di tipo diverso, va adeguato il
 * sub_type.
 */
function otpComponents(code) {
  const c = String(code);
  return [
    { type: 'body', parameters: [{ type: 'text', text: c }] },
    { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: c }] },
  ];
}

module.exports = { sendTemplate, notifyComponents, otpComponents };
