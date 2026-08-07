// moduli/messaging/server.js
// RescueManager — Messaging Service
// Notifiche trasporti + OTP firma via WhatsApp Cloud API (account CENTRALE
// RescueManager: il nome azienda va nel testo del messaggio).
//
// Endpoint:
//   GET  /health
//   POST /api/messaging/transport-notify   (Bearer utente | X-Internal-Key)
//   POST /api/messaging/otp/send           (Bearer utente)
//   POST /api/messaging/otp/verify         (Bearer utente)
//   POST /api/messaging/test               (solo X-Internal-Key — invio di prova)
//   GET  /webhook/whatsapp                 (verifica challenge Meta)
//   POST /webhook/whatsapp                 (eventi Meta, firma X-Hub-Signature-256 validata)
//
// Segreti SOLO in /root/.env sul VPS. Niente valori reali nel repo.

require('dotenv').config({ path: process.env.ENV_FILE || '/root/.env' });
require('dotenv').config(); // fallback .env locale (sviluppo)

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const wa = require('./whatsapp');
const otp = require('./otp');
const { brandedHtml, esc } = require('./email-template');

const PORT = process.env.MESSAGING_PORT || process.env.PORT || 3120;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Chiavi interne accettate per X-Internal-Key (server-to-server / trigger DB).
// VPS_API_KEY = condivisa altri servizi; MESSAGING_TRIGGER_KEY = dedicata al trigger.
const INTERNAL_KEYS = [process.env.VPS_API_KEY, process.env.MESSAGING_TRIGGER_KEY].filter(Boolean);
const APP_SECRET = process.env.WHATSAPP_APP_SECRET || '';
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || '';
const TPL_STATO = process.env.WHATSAPP_TEMPLATE_STATO || 'aggiornamento_soccorsi';
const TPL_OTP = process.env.WHATSAPP_TEMPLATE_OTP || 'codice_firma';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('[messaging] Manca SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── Email OTP (Resend) — per firma da concessionaria/officina ──
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const OTP_EMAIL_FROM = process.env.OTP_EMAIL_FROM || 'RescueManager <firma@rescuemanager.eu>';

function maskEmail(e) {
  const [u, d] = String(e || '').split('@');
  if (!d) return '***';
  return `${(u || '').slice(0, 2)}***@${d}`;
}

// Nome firmatario per tipo (per il saluto quando manca il nome esplicito).
function signerLabel(type) {
  if (type === 'dealer') return 'concessionaria';
  if (type === 'workshop') return 'officina';
  return 'cliente';
}
// Display-name sicuro per l'header From (niente virgole/virgolette/controlli).
function fromDisplayName(orgName) {
  const clean = String(orgName || '').replace(/["<>\r\n,;]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 64);
  return clean || 'RescueManager';
}

/**
 * Invia l'OTP di firma via email (concessionaria/officina), brandizzato
 * RescueManager e contestualizzato: chi chiede la firma (azienda di soccorso),
 * per quale veicolo/trasporto e a cosa serve il codice.
 * ctx = { signerType, signerName, orgName, transportNumber, vehicle, plate }.
 */
async function sendOtpEmail(to, code, ctx = {}) {
  if (!RESEND_API_KEY) throw new Error('resend_not_configured');
  const { signerType, signerName, orgName, transportNumber, vehicle, plate } = ctx;
  const azienda = orgName ? `<strong>${esc(orgName)}</strong>` : "L'azienda di soccorso";
  const saluto = signerName ? esc(signerName) : signerLabel(signerType);

  const body = [
    `Gentile ${saluto},`,
    `${azienda} ti chiede di firmare elettronicamente la <strong>consegna del veicolo</strong>.`,
    `Per confermare la firma, comunica all'operatore il codice di verifica qui sotto.`,
  ].join('\n');

  const infoRows = [];
  if (orgName) infoRows.push({ label: 'Azienda', value: orgName });
  if (transportNumber) infoRows.push({ label: 'Pratica', value: transportNumber });
  if (vehicle) infoRows.push({ label: 'Veicolo', value: vehicle });
  if (plate) infoRows.push({ label: 'Targa', value: plate });

  const html = brandedHtml(body, {
    subtitle: 'Firma consegna veicolo',
    code,
    infoRows,
    footerNote: "Il codice è valido 10 minuti e conferma esclusivamente la tua firma sulla consegna del veicolo. Se non hai richiesto tu questa firma, ignora questa email.",
  });

  const addr = (OTP_EMAIL_FROM.match(/<([^>]+)>/) || [null, OTP_EMAIL_FROM])[1].trim();
  const from = orgName ? `"${fromDisplayName(orgName)}" <${addr}>` : OTP_EMAIL_FROM;
  const subject = orgName ? `Firma consegna veicolo — ${fromDisplayName(orgName)}` : 'Firma consegna veicolo — codice di verifica';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`resend_${res.status}: ${txt.slice(0, 200)}`);
  }
}

// Stati notificabili al cliente (scelta "solo chiave": niente 'assigned').
const STATO_LABEL = {
  new: 'Preso in carico',
  enroute: 'In viaggio',
  done: 'Completato',
  cancelled: 'Annullato',
};
const NOTIFIABLE = new Set(Object.keys(STATO_LABEL));

// ── Helpers ──
function toE164(raw) {
  if (!raw) return null;
  const p = String(raw).replace(/[^\d+]/g, '');
  if (!p) return null;
  if (p.startsWith('+')) return p;
  if (p.startsWith('00')) return '+' + p.slice(2);
  if (p.startsWith('39')) return '+' + p;
  if (p.startsWith('0') || p.startsWith('3')) return '+39' + p; // numero IT senza prefisso
  return '+' + p;
}
function maskPhone(p) {
  if (!p) return '';
  return p.length <= 4 ? '****' : '****' + p.slice(-4);
}
function numeroTrasporto(t) {
  if (t?.number != null) return `TR${String(t.number).padStart(4, '0')}`;
  return `#${String(t?.id || '').slice(0, 6)}`;
}

async function loadTransport(transportId) {
  const { data, error } = await supabase
    .from('transports')
    .select('id, number, status, org_id, customer_name, customer_phone, client_id, meta, languages, client:clients!client_id(nome, phone)')
    .eq('id', transportId)
    .maybeSingle();
  if (error) throw new Error('transport_load_failed: ' + error.message);
  return data;
}
async function loadOrgCompany(orgId) {
  const { data } = await supabase
    .from('org_settings').select('value').eq('org_id', orgId).eq('key', 'company').maybeSingle();
  return data?.value || {};
}

// ── Contatore d'uso 'sms' (Fase 2) — BEST-EFFORT ──
// Conta 1 per messaggio effettivamente inviato (WhatsApp/OTP). È solo misura,
// mai bloccante: se increment_usage manca su prod o fallisce, logga e prosegue.
// NON deve MAI far fallire l'invio sottostante.
async function countSms(orgId, amount = 1) {
  if (!orgId || !(amount > 0)) return;
  try {
    await supabase.rpc('increment_usage', { p_org_id: orgId, p_metric: 'sms', p_amount: amount });
  } catch (e) {
    console.warn('[usage] increment_usage sms fallito (best-effort):', e.message || e);
  }
}

// Carica anche i campi "pesanti" del consenso (firma, condizioni) per il sigillo.
async function loadTransportFull(transportId) {
  const { data, error } = await supabase
    .from('transports')
    .select('id, number, status, org_id, customer_name, customer_phone, client_id, meta, signed_at, vehicle_conditions, signature_url, client:clients!client_id(nome, phone)')
    .eq('id', transportId)
    .maybeSingle();
  if (error) throw new Error('transport_load_failed: ' + error.message);
  return data;
}

function clientIp(req) {
  const xf = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xf || req.socket?.remoteAddress || null;
}

// Hash del CONTENUTO FIRMATO (forma canonica deterministica): qualsiasi modifica
// successiva ai campi firmati produce un hash diverso → manomissione rilevabile
// (requisito di integrità della firma elettronica avanzata).
function computeDocHash(t) {
  const canonical = JSON.stringify({
    transport_id: t.id,
    numero: numeroTrasporto(t),
    org_id: t.org_id,
    firmatario: t.client?.nome || t.customer_name || null,
    signed_at: t.signed_at || null,
    vehicle_conditions: t.vehicle_conditions || null,
    signature_url: t.signature_url || null,
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

// ── App ──
const app = express();
const CORS_ALLOWED = new Set([
  'https://rescuemanager.eu',
  'https://www.rescuemanager.eu',
  'https://staging.rescuemanager.eu',
  'https://assist.rescuemanager.eu',
]);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // mobile/native o link diretti: no Origin
    if (CORS_ALLOWED.has(origin)) return cb(null, true);
    if (origin.startsWith('http://localhost:')) return cb(null, true);
    if (origin.startsWith('app://') || origin.startsWith('file://')) return cb(null, true);
    return cb(new Error('CORS blocked'));
  },
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Key'],
}));
app.use(express.json({ limit: '1mb', verify: (req, _res, buf) => { req.rawBody = buf; } }));

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'messaging-server', uptime: process.uptime() });
});

// ── Auth ──
async function userOrgIds(token) {
  const { data, error } = await supabase.auth.getUser(token);
  const user = data?.user;
  if (error || !user) return null;
  const { data: rows } = await supabase.from('org_members').select('org_id').eq('user_id', user.id);
  return { userId: user.id, orgIds: (rows || []).map((r) => r.org_id) };
}
async function requireCaller(req, res, next) {
  try {
    const internal = req.headers['x-internal-key'];
    if (internal && INTERNAL_KEYS.includes(internal)) {
      req.caller = { internal: true, orgIds: [] };
      return next();
    }
    const m = (req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
    if (!m) return res.status(401).json({ error: 'unauthorized' });
    const info = await userOrgIds(m[1].trim());
    if (!info) return res.status(401).json({ error: 'invalid_token' });
    req.caller = { internal: false, ...info };
    next();
  } catch (e) {
    res.status(500).json({ error: 'auth_error', detail: String(e.message || e) });
  }
}
function callerCanAccessOrg(req, orgId) {
  return req.caller.internal || req.caller.orgIds.includes(orgId);
}

// ── Notifica creazione / cambio stato ──
app.post('/api/messaging/transport-notify', requireCaller, async (req, res) => {
  try {
    const { transport_id, status: statusOverride } = req.body || {};
    if (!transport_id) return res.status(400).json({ error: 'missing_transport_id' });
    const t = await loadTransport(transport_id);
    if (!t) return res.status(404).json({ error: 'transport_not_found' });
    if (!callerCanAccessOrg(req, t.org_id)) return res.status(403).json({ error: 'forbidden' });

    const status = statusOverride || t.status;
    if (!NOTIFIABLE.has(status)) return res.json({ ok: true, skipped: 'status_not_notifiable', status });

    const to = toE164(t.customer_phone || t.client?.phone);
    if (!to) return res.json({ ok: true, skipped: 'no_phone' });

    const company = await loadOrgCompany(t.org_id);
    const azienda = company.company_name || 'La tua azienda di trasporti';
    const aziendaTel = toE164(company.phone) || '—';

    // Lingue richieste dal trasporto (transports.languages), sanificate;
    // default ['it']. Si invia UN messaggio per lingua (come da UI desktop/mobile).
    const ALLOWED = ['it', 'de', 'en'];
    const reqLangs = Array.isArray(t.languages) ? t.languages : [];
    const toSend = ALLOWED.filter((l) => reqLangs.includes(l));
    if (!toSend.length) toSend.push('it');

    const components = wa.notifyComponents({
      azienda, telefono: aziendaTel, stato: STATO_LABEL[status], numero: numeroTrasporto(t),
    });

    // Invio per-lingua indipendente: se una lingua fallisce (es. template non
    // approvato su Meta in quella lingua) le altre partono comunque.
    const results = [];
    for (const lang of toSend) {
      try {
        const r = await wa.sendTemplate(to, TPL_STATO, lang, components);
        results.push({ lang, ok: true, sid: r?.messages?.[0]?.id || null });
      } catch (err) {
        console.error(`[notify] lingua ${lang} fallita:`, err.message, err.details?.error?.message || '');
        results.push({ lang, ok: false, error: String(err.message || err) });
      }
    }
    const sentLangs = results.filter((r) => r.ok).map((r) => r.lang);
    console.log(`[notify] ${numeroTrasporto(t)} -> ${maskPhone(to)} stato=${status} richieste=${toSend.join(',')} inviate=${sentLangs.join(',') || 'nessuna'}`);
    // Contatore d'uso: 1 per messaggio effettivamente inviato (una per lingua).
    if (sentLangs.length > 0) await countSms(t.org_id, sentLangs.length);
    res.json({ ok: sentLangs.length > 0, to: maskPhone(to), status, results });
  } catch (e) {
    console.error('[notify] error:', e.message, e.details || '');
    res.status(502).json({ error: 'send_failed', detail: String(e.message || e) });
  }
});

// ── OTP firma: invio ──
app.post('/api/messaging/otp/send', requireCaller, async (req, res) => {
  try {
    const { transport_id, phone, email, channel, signer_type, signer_name } = req.body || {};
    if (!transport_id) return res.status(400).json({ error: 'missing_transport_id' });
    const t = await loadTransport(transport_id);
    if (!t) return res.status(404).json({ error: 'transport_not_found' });
    if (!callerCanAccessOrg(req, t.org_id)) return res.status(403).json({ error: 'forbidden' });

    const ch = channel === 'email' ? 'email' : 'whatsapp';
    const signerType = ['customer', 'dealer', 'workshop'].includes(signer_type) ? signer_type : 'customer';

    // Canale EMAIL (firma concessionaria/officina)
    if (ch === 'email') {
      const to = String(email || '').trim();
      if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return res.status(400).json({ error: 'no_email' });
      const code = await otp.createOtp(transport_id, { recipient: to, channel: 'email', signer_type: signerType, signer_name: signer_name || null });
      // Contesto per l'email: azienda di soccorso + veicolo/pratica.
      const company = await loadOrgCompany(t.org_id).catch(() => ({}));
      const sd = (t.meta && t.meta.service_data && typeof t.meta.service_data === 'object' && !Array.isArray(t.meta.service_data)) ? t.meta.service_data : {};
      await sendOtpEmail(to, code, {
        signerType,
        signerName: signer_name || null,
        orgName: company.company_name || company.name || null,
        transportNumber: numeroTrasporto(t),
        vehicle: sd.marca_modello || null,
        plate: sd.targa || null,
      });
      console.log(`[otp] send(email) ${numeroTrasporto(t)} -> ${maskEmail(to)} type=${signerType} org=${company.company_name || '-'}`);
      await countSms(t.org_id, 1); // 1 messaggio OTP effettivamente inviato
      return res.json({ ok: true, to: maskEmail(to), channel: 'email' });
    }

    // Canale WHATSAPP (cliente) — comportamento storico
    const to = toE164(phone || t.customer_phone || t.client?.phone);
    if (!to) return res.status(400).json({ error: 'no_phone' });
    const code = await otp.createOtp(transport_id, { recipient: to, channel: 'whatsapp', signer_type: signerType, signer_name: signer_name || null });
    await wa.sendTemplate(to, TPL_OTP, 'it', wa.otpComponents(code));
    console.log(`[otp] send ${numeroTrasporto(t)} -> ${maskPhone(to)} type=${signerType}`);
    await countSms(t.org_id, 1); // 1 messaggio OTP effettivamente inviato
    res.json({ ok: true, to: maskPhone(to), channel: 'whatsapp' });
  } catch (e) {
    console.error('[otp send] error:', e.message, e.details || '');
    res.status(502).json({ error: 'otp_send_failed', detail: String(e.message || e) });
  }
});

// ── OTP firma: verifica ──
app.post('/api/messaging/otp/verify', requireCaller, async (req, res) => {
  try {
    const { transport_id, code } = req.body || {};
    if (!transport_id || !code) return res.status(400).json({ error: 'missing_params' });
    const t = await loadTransport(transport_id);
    if (!t) return res.status(404).json({ error: 'transport_not_found' });
    if (!callerCanAccessOrg(req, t.org_id)) return res.status(403).json({ error: 'forbidden' });

    const v = await otp.verifyOtp(transport_id, String(code).trim());
    if (!v.ok) return res.status(400).json({ ok: false, reason: v.reason });

    // Sigillo: ricarico il contenuto firmato, ne calcolo l'hash (integrita') e
    // salvo l'audit. Esito su transports.meta (niente migration).
    const full = await loadTransportFull(transport_id);
    if (!full) return res.status(404).json({ error: 'transport_not_found' });
    const docHash = computeDocHash(full);
    const signatureOtp = {
      channel: v.channel,                                       // 'whatsapp' | 'email'
      phone: v.channel === 'whatsapp' ? v.recipient : null,
      email: v.channel === 'email' ? v.recipient : null,
      signer_type: v.signer_type || 'customer',                 // 'customer' | 'dealer' | 'workshop'
      signer_name: v.signer_name || full.client?.nome || full.customer_name || null,
      verified_at: new Date().toISOString(),
      doc_hash: docHash,
      doc_hash_alg: 'sha256',
      audit: { ip: clientIp(req) },
    };
    const meta = { ...(full.meta || {}), signature_otp: signatureOtp };
    // NON rispondere ok se il sigillo non viene scritto: l'OTP è già stato
    // consumato (redis.del), quindi un fallimento silenzioso perderebbe la
    // firma legale mostrando "verificata" all'operatore.
    const { error: sealErr } = await supabase.from('transports').update({ meta }).eq('id', transport_id).select('id').maybeSingle();
    if (sealErr) throw sealErr;
    const masked = v.channel === 'email' ? maskEmail(v.recipient) : maskPhone(v.recipient);
    console.log(`[otp] verify OK ${numeroTrasporto(full)} ${v.channel}:${masked} type=${v.signer_type} hash=${docHash.slice(0, 12)}`);
    res.json({ ok: true, doc_hash: docHash });
  } catch (e) {
    console.error('[otp verify] error:', e.message);
    res.status(500).json({ error: 'otp_verify_failed', detail: String(e.message || e) });
  }
});

// ── Invio di prova (solo internal key) ──
app.post('/api/messaging/test', requireCaller, async (req, res) => {
  if (!req.caller.internal) return res.status(403).json({ error: 'internal_only' });
  try {
    const { to, template, components, language } = req.body || {};
    if (!to || !template) return res.status(400).json({ error: 'missing_params' });
    const result = await wa.sendTemplate(toE164(to), template, language || 'it', components);
    res.json({ ok: true, result });
  } catch (e) {
    res.status(502).json({ error: 'send_failed', detail: String(e.message || e), data: e.details });
  }
});

// ── Webhook Meta ──
app.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) return res.status(200).send(challenge);
  return res.sendStatus(403);
});

function validSignature(req) {
  if (!APP_SECRET) return true; // non configurato: non blocchiamo (ma logghiamo a parte)
  const sig = req.headers['x-hub-signature-256'] || '';
  const expected = 'sha256=' + crypto
    .createHmac('sha256', APP_SECRET)
    .update(req.rawBody || Buffer.from(''))
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

app.post('/webhook/whatsapp', (req, res) => {
  if (!validSignature(req)) {
    console.warn('[webhook] firma X-Hub-Signature-256 non valida');
    return res.sendStatus(401);
  }
  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    for (const s of value?.statuses || []) console.log(`[webhook] status ${s.id} = ${s.status}`);
    for (const m of value?.messages || []) console.log(`[webhook] inbound da ${maskPhone(m.from)} type=${m.type}`);
  } catch (e) {
    console.warn('[webhook] parse error', e.message);
  }
  res.sendStatus(200); // sempre 200: Meta ritenta se non riceve 200
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[messaging] in ascolto su 127.0.0.1:${PORT} (templates: ${TPL_STATO}, ${TPL_OTP})`);
});
