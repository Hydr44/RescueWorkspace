#!/usr/bin/env node
'use strict';
/**
 * SDI Processor (server-side) — sostituisce il lavoro che faceva solo il desktop.
 *
 * 1) Applica le NOTIFICHE (RC/NS/MC/DT/AT) salvate da soap-rx in
 *    storage/<env>/notifiche/ allo stato della fattura in Supabase.
 * 2) Importa le FATTURE PASSIVE ricevute in storage/<env>/in/ (che soap-rx
 *    parsa + instrada nel .meta.json ma NON inserisce nel DB).
 *
 * env: test -> Supabase staging, prod -> Supabase prod (config /etc/sdi-ws).
 * Idempotente via marker per-file (.applied / .imported). Uso: [--once].
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('node:child_process');
const { createClient } = require('@supabase/supabase-js');

// Estrae l'XML FatturaPA dal file firmato .p7m (CAdES/DER).
function extractXml(p7mPath) {
  const args = ['smime', '-verify', '-noverify', '-inform', 'DER', '-in', p7mPath];
  const opt = { maxBuffer: 20 * 1024 * 1024 };
  try { return execFileSync('openssl', args, opt).toString('utf8'); }
  catch { try { return execFileSync('openssl', ['smime', '-verify', '-noverify', '-in', p7mPath], opt).toString('utf8'); } catch { return null; } }
}
if (globalThis.WebSocket === undefined) { try { globalThis.WebSocket = require('ws'); } catch { /* ok */ } }

const STORAGE = process.env.SDI_WS_STORAGE_DIR || '/opt/sdi-ws-server/storage';
const ENVS = [
  { env: 'test', cfg: '/etc/sdi-ws/supabase-test.json', provider: 'sdi_test' },
  { env: 'prod', cfg: '/etc/sdi-ws/supabase-prod.json', provider: 'sdi_prod' },
];
const INTERVAL_MS = Number(process.env.PROC_INTERVAL_MS || 60000);

const STATUS_MAP = { RC: 'delivered', NS: 'rejected', MC: 'not_delivered', DT: 'term_expired', AT: 'transmitted' };
const TIPO_LONG = { RC: 'RicevutaConsegna', NS: 'NotificaScarto', MC: 'NotificaMancataConsegna', DT: 'NotificaDecorrenzaTermini', AT: 'AttestazioneTrasmissioneFattura' };

function clientFor(cfgPath) {
  const c = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const url = c.url || c.SUPABASE_URL;
  const key = c.serviceKey || c.SUPABASE_SERVICE_ROLE_KEY || c.service_role_key;
  if (!url || !key) throw new Error('config Supabase incompleta: ' + cfgPath);
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
const markDone = (p) => { try { fs.writeFileSync(p, ''); } catch { /* ok */ } };

function tipoNotifica(name) { const m = name.match(/_(RC|NS|MC|AT|DT|NE|EC|SE|MT)_/); return m ? m[1] : null; }
function nomeFileFromNotif(name, xml) {
  const m = xml && xml.match(/<NomeFile>([^<]+)<\/NomeFile>/i);
  if (m) return m[1].trim();
  const mm = name.match(/(IT[A-Z0-9]+_[A-Z0-9]+)_(?:RC|NS|MC|AT|DT|NE|EC|SE|MT)_/);
  return mm ? `${mm[1]}.xml.p7m` : null;
}
function estraiErrori(xml) {
  const out = []; const re = /<Errore>([\s\S]*?)<\/Errore>/g; let m;
  while ((m = re.exec(xml)) !== null) {
    const blk = m[1];
    const g = (t) => { const mm = blk.match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`)); return mm ? mm[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim() : null; };
    out.push({ codice: g('Codice'), descrizione: g('Descrizione'), suggerimento: g('Suggerimento') });
  }
  return out;
}

async function processNotifiche(sb, dir) {
  let applied = 0, files;
  try { files = fs.readdirSync(dir); } catch { return 0; }
  for (const f of files) {
    if (!f.endsWith('.xml') || f.includes('RAW_')) continue;
    const marker = path.join(dir, f + '.applied');
    if (fs.existsSync(marker)) continue;
    const tipo = tipoNotifica(f);
    if (!tipo || !STATUS_MAP[tipo]) { markDone(marker); continue; } // NE/EC/SE/MT: nessun cambio stato
    let xml = ''; try { xml = fs.readFileSync(path.join(dir, f), 'utf8'); } catch { continue; }
    const nomeFile = nomeFileFromNotif(f, xml);
    if (!nomeFile) { markDone(marker); continue; }
    const { data: inv } = await sb.from('invoices').select('id,sdi_status,meta').eq('provider_ext_id', nomeFile).limit(1);
    if (!inv || !inv.length) continue; // fattura non ancora nel DB: riprova al prossimo giro
    const row = inv[0];
    const key = `sdi_${TIPO_LONG[tipo]}_received_at`;
    if (!(row.meta && row.meta[key])) {
      const meta = Object.assign({}, row.meta || {});
      meta[key] = new Date().toISOString();
      if (tipo === 'NS') {
        const e = estraiErrori(xml)[0];
        if (e) { meta.sdi_rejection_code = e.codice; meta.sdi_rejection_description = e.descrizione; meta.sdi_rejection_suggestion = e.suggerimento; }
      }
      // Salva l'XML della notifica per il download dall'admin (punto 1).
      meta.sdi_notifiche = Object.assign({}, meta.sdi_notifiche || {});
      meta.sdi_notifiche[tipo] = { tipo, tipo_lungo: TIPO_LONG[tipo], at: meta[key], xml };
      const { error } = await sb.from('invoices').update({ sdi_status: STATUS_MAP[tipo], meta }).eq('id', row.id);
      if (error) { console.error(`[notif] update fail ${nomeFile}: ${error.message}`); continue; }
      applied++; console.log(`[notif] ${nomeFile} ${tipo} -> ${STATUS_MAP[tipo]}`);
    }
    markDone(marker);
  }
  return applied;
}

async function processIncoming(sb, dir, provider) {
  let imported = 0, files;
  try { files = fs.readdirSync(dir); } catch { return 0; }
  for (const f of files) {
    if (!f.endsWith('.meta.json')) continue;
    const marker = path.join(dir, f + '.imported');
    if (fs.existsSync(marker)) continue;
    let m; try { m = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { continue; }
    const id = m.identificativo_sdi, org = m.org_id, d = m.invoice_data;
    if (!id || !org || !d) { markDone(marker); continue; }
    const nomeFile = f.replace(/\.meta\.json$/, '').replace(/^.*?__/, '');
    const dup1 = await sb.from('invoices').select('id').eq('org_id', org).filter('meta->sdi->trasmissione->>identificativo_sdi', 'eq', String(id)).limit(1);
    const dup2 = (dup1.data && dup1.data.length) ? { data: [1] } : await sb.from('invoices').select('id').eq('provider_ext_id', nomeFile).limit(1);
    if ((dup1.data && dup1.data.length) || (dup2.data && dup2.data.length)) { markDone(marker); continue; } // già presente
    // Estrai l'XML FatturaPA dal .p7m firmato (per download + PDF conforme AdE).
    const p7mPath = path.join(dir, f.replace(/\.meta\.json$/, ''));
    const sdiXml = fs.existsSync(p7mPath) ? extractXml(p7mPath) : null;
    const meta = {
      sdi: { trasmissione: { identificativo_sdi: String(id), nome_file: nomeFile }, documento: { tipo_documento: d.tipo_documento } },
      source: { type: 'soap_rx_import' },
      sdi_environment: provider === 'sdi_prod' ? 'PROD' : 'TEST',
      invoice_data: d,
      sdi_xml: sdiXml || undefined,
    };
    const payload = {
      org_id: org, direction: 'passive', sdi_status: 'received',
      number: d.numero || nomeFile, date: d.data || null, total: d.importo || 0,
      customer_name: d.cedente_name || null, customer_vat: d.cedente_vat || null, customer_tax_code: d.cedente_cf || null,
      provider_ext_id: nomeFile, provider_id: provider, meta,
    };
    const { error } = await sb.from('invoices').insert(payload);
    if (error) { console.error(`[in] insert fail ${nomeFile}: ${error.message}`); continue; }
    imported++; console.log(`[in] importata passiva ${d.numero} (${d.cedente_name}) org=${org}`);
    markDone(marker);
  }
  return imported;
}

async function runOnce() {
  for (const { env, cfg, provider } of ENVS) {
    let sb; try { sb = clientFor(cfg); } catch (e) { console.error(`[${env}] ${e.message}`); continue; }
    const base = path.join(STORAGE, env);
    try {
      const n = await processNotifiche(sb, path.join(base, 'notifiche'));
      const i = await processIncoming(sb, path.join(base, 'in'), provider);
      if (n || i) console.log(`[${env}] notifiche=${n} passive_importate=${i}`);
    } catch (e) { console.error(`[${env}] errore: ${e.message}`); }
  }
}

(async () => {
  await runOnce();
  if (process.argv.includes('--once')) { process.exit(0); }
  setInterval(() => { runOnce().catch((e) => console.error('loop:', e.message)); }, INTERVAL_MS);
  console.log(`[sdi-processor] avviato, intervallo ${INTERVAL_MS}ms`);
})();
