// DEMO tracking mezzo lato cliente (per verifica + screen recording Apple).
// Crea un trasporto attivo + un link assist /track/{token} e SIMULA il carro
// attrezzi che si avvicina (inserisce punti in transport_tracking ogni 3s e fa
// scendere l'ETA). Apri il /track URL stampato nel browser e guardalo muoversi.
//
// PREREQUISITO: aver applicato la migration 20260619_assist_transport_link.sql.
//
//   node scripts/track-demo.mjs
//
// Cleanup automatico a fine corsa (o Ctrl-C).
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DESK = path.join(ROOT, 'desktop-app', 'greeting-friend-api-main');
const env = (f) => Object.fromEntries(
  (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '').split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); let v = l.slice(i + 1).trim(); if (/^["'].*["']$/.test(v)) v = v.slice(1, -1); return [l.slice(0, i).trim(), v]; }),
);
const staging = env(path.join(DESK, '.env.staging'));
const e2e = env(path.join(DESK, '.env.e2e'));
const URL = staging.VITE_SUPABASE_URL;
const SERVICE = e2e.SUPABASE_SERVICE_ROLE;
const EMAIL = e2e.E2E_EMAIL;
if (!URL || !SERVICE) { console.error('Mancano VITE_SUPABASE_URL (.env.staging) o SUPABASE_SERVICE_ROLE (.env.e2e)'); process.exit(1); }

const sb = createClient(URL, SERVICE, { auth: { persistSession: false } });
const TRACK_BASE = process.env.TRACK_BASE || 'http://localhost:3000';

// Risolvi org + user di test
const { data: prof } = await sb.from('profiles').select('id, current_org').eq('email', EMAIL).maybeSingle();
const UID = prof?.id;
const ORG = prof?.current_org;
if (!ORG) { console.error('Org del test user non trovata (esegui prima il seed E2E).'); process.exit(1); }

// Percorso: il mezzo parte ~3 km a nord del punto cliente (Milano) e si avvicina.
const PICKUP = { lat: 45.4642, lng: 9.1900 };
const START = { lat: 45.4910, lng: 9.1900 };
const TICKS = 20;
const STEP_MS = 3000;

const token = Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

// 1) Trasporto attivo
const { data: tr, error: trErr } = await sb.from('transports').insert({
  org_id: ORG, transport_type: 'soccorso_stradale', status: 'assigned', meta: {},
  customer_name: 'DEMO Cliente', pickup_address: 'Piazza Duomo, Milano',
  pickup_lat: PICKUP.lat, pickup_lng: PICKUP.lng,
  eta_pickup: new Date(Date.now() + 12 * 60000).toISOString(),
  created_by: UID,
}).select('id').single();
if (trErr) { console.error('insert transport:', trErr.message, '\n→ Hai applicato la migration? (transport_id)'); process.exit(1); }
const TRANSPORT = tr.id;

// 2) Link assist /track legato al trasporto
const { error: aErr } = await sb.from('assistance_requests').insert({
  org_id: ORG, token, url: `${TRACK_BASE}/track/${token}`, phone: '', status: 'pending',
  transport_id: TRANSPORT, created_by: UID,
});
if (aErr) { console.error('insert assist:', aErr.message, '\n→ Manca la colonna transport_id? Applica la migration.'); await cleanup(); process.exit(1); }

console.log('\n════════════════════════════════════════════════════════');
console.log('  APRI QUESTO LINK NEL BROWSER (è la pagina cliente):');
console.log(`  ${TRACK_BASE}/track/${token}`);
console.log('  (per la prod: https://rescuemanager.eu/track/' + token + ')');
console.log('  Il carro attrezzi si avvicinerà per ~1 minuto. Registra lo schermo.');
console.log('════════════════════════════════════════════════════════\n');

let stopping = false;
async function cleanup() {
  if (stopping) return; stopping = true;
  try {
    await sb.from('transport_tracking').delete().eq('transport_id', TRANSPORT);
    await sb.from('assistance_requests').delete().eq('token', token);
    await sb.from('transports').delete().eq('id', TRANSPORT);
    console.log('\n🧹 Demo ripulita (trasporto + tracking + link rimossi).');
  } catch (e) { console.warn('cleanup:', e.message); }
}
process.on('SIGINT', async () => { await cleanup(); process.exit(0); });

// 3) Muovi il mezzo verso il cliente
for (let i = 0; i <= TICKS; i++) {
  const f = i / TICKS;
  const lat = START.lat + (PICKUP.lat - START.lat) * f;
  const lng = START.lng + (PICKUP.lng - START.lng) * f;
  const heading = 180; // verso sud
  await sb.from('transport_tracking').insert({
    org_id: ORG, transport_id: TRANSPORT, latitude: lat, longitude: lng,
    heading, speed: 11, status: 'en_route', source: 'demo', recorded_at: new Date().toISOString(),
  });
  const etaMin = Math.max(1, Math.round(12 * (1 - f)));
  await sb.from('transports').update({ eta_pickup: new Date(Date.now() + etaMin * 60000).toISOString() }).eq('id', TRANSPORT);
  process.stdout.write(`\r  📍 mezzo in movimento… ${Math.round(f * 100)}%  ETA ~${etaMin} min   `);
  if (i < TICKS) await new Promise((r) => setTimeout(r, STEP_MS));
}
console.log('\n  ✅ Arrivato. Cleanup tra 5s…');
await new Promise((r) => setTimeout(r, 5000));
await cleanup();
