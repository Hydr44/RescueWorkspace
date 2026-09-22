// moduli/messaging/otp.js
// OTP firma trasporto. Codici in Upstash Redis (TTL nativo) — niente tabella DB.
// Sicurezza: in Redis salviamo solo l'HASH del codice (mai in chiaro), con
// contatore tentativi e scadenza. La verifica consuma il codice.

const { Redis } = require('@upstash/redis');
const crypto = require('crypto');

// Redis.fromEnv() legge UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.
const redis = Redis.fromEnv();

const TTL_SECONDS = 600;     // 10 minuti
const MAX_ATTEMPTS = 5;

function genCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}
function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}
function key(transportId) {
  return `otp:transport:${transportId}`;
}

/**
 * Genera un OTP per il trasporto, lo salva (hash) e restituisce il codice in
 * chiaro da inviare. `info` = { recipient, channel, signer_type, signer_name }:
 * canale 'whatsapp'|'email', tipo firmatario 'customer'|'dealer'|'workshop'.
 * Retro-compat: se `info` è una stringa la trattiamo come telefono WhatsApp.
 */
async function createOtp(transportId, info) {
  const norm = (typeof info === 'string') ? { recipient: info, channel: 'whatsapp' } : (info || {});
  const code = genCode();
  const rec = {
    h: hashCode(code),
    attempts: 0,
    recipient: norm.recipient || null,
    channel: norm.channel || 'whatsapp',
    signer_type: norm.signer_type || 'customer',
    signer_name: norm.signer_name || null,
  };
  await redis.set(key(transportId), rec, { ex: TTL_SECONDS });
  return code;
}

/** Verifica l'OTP. Su successo lo elimina e restituisce i dati del firmatario. */
async function verifyOtp(transportId, code) {
  const raw = await redis.get(key(transportId));
  if (!raw) return { ok: false, reason: 'expired' };
  const rec = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if ((rec.attempts || 0) >= MAX_ATTEMPTS) {
    await redis.del(key(transportId));
    return { ok: false, reason: 'too_many_attempts' };
  }
  if (rec.h !== hashCode(code)) {
    rec.attempts = (rec.attempts || 0) + 1;
    await redis.set(key(transportId), rec, { ex: TTL_SECONDS });
    return { ok: false, reason: 'invalid', attempts: rec.attempts };
  }
  await redis.del(key(transportId));
  const channel = rec.channel || 'whatsapp';
  return {
    ok: true,
    recipient: rec.recipient || rec.phone || null,
    phone: channel === 'whatsapp' ? (rec.recipient || rec.phone || null) : null,
    channel,
    signer_type: rec.signer_type || 'customer',
    signer_name: rec.signer_name || null,
  };
}

module.exports = { createOtp, verifyOtp };
