/**
 * Backup per-cliente: per ogni org non-demo esporta le tabelle business
 * (org_id) in JSON, crea manifest + zip, carica su R2 in
 *   backups/<org_id>/<YYYY-MM-DD>/{<tabella>.json, manifest.json, backup.zip}
 * e applica la retention (cancella le cartelle-data più vecchie di N giorni).
 *
 * Le tabelle da esportare vengono da rpc list_backup_tables() (denylist SQL).
 * Le FOTO/allegati sono già su storage: qui salviamo i record, non i binari.
 */
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const archiver = require('archiver');
const { put, listKeys, deleteKeys } = require('./r2');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SCHEMA_VERSION = 1;
const RETENTION_DAYS = Number(process.env.BACKUP_RETENTION_DAYS || 30);
const PREFIX = process.env.BACKUP_PREFIX || 'backups';
const PAGE = 1000;

async function fetchAll(table, orgId) {
  const rows = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase.from(table).select('*').eq('org_id', orgId).range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

function zipBuffer(files) {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks = [];
    archive.on('data', (c) => chunks.push(c));
    archive.on('warning', (w) => console.warn('[backup] zip warning:', w.message));
    archive.on('error', reject);
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    files.forEach((f) => archive.append(f.data, { name: f.name }));
    archive.finalize();
  });
}

async function backupOrg(org, dateStr, tables) {
  const base = `${PREFIX}/${org.id}/${dateStr}`;
  const manifest = {
    org_id: org.id,
    org_name: org.name || null,
    date: dateStr,
    generated_at: new Date().toISOString(),
    schema_version: SCHEMA_VERSION,
    tables: [],
  };
  const files = [];

  for (const table of tables) {
    let rows;
    try {
      rows = await fetchAll(table, org.id);
    } catch (e) {
      console.warn(`[backup] ${org.id}/${table} skip: ${e.message}`);
      manifest.tables.push({ table, rows: 0, error: e.message });
      continue;
    }
    if (rows.length === 0) {
      manifest.tables.push({ table, rows: 0, bytes: 0 });
      continue; // niente file per tabelle vuote (manifest le registra comunque)
    }
    const json = JSON.stringify(rows);
    files.push({ name: `${table}.json`, data: json });
    manifest.tables.push({
      table,
      rows: rows.length,
      bytes: Buffer.byteLength(json),
      sha256: crypto.createHash('sha256').update(json).digest('hex'),
    });
  }

  const manifestJson = JSON.stringify(manifest, null, 2);
  files.push({ name: 'manifest.json', data: manifestJson });

  // File singoli + manifest
  await Promise.all(files.map((f) => put(`${base}/${f.name}`, f.data, 'application/json')));
  // Bundle zip (tutto in un click)
  const zip = await zipBuffer(files);
  await put(`${base}/backup.zip`, zip, 'application/zip');

  const rows = manifest.tables.reduce((n, t) => n + (t.rows || 0), 0);
  const bytes = manifest.tables.reduce((n, t) => n + (t.bytes || 0), 0);
  const nonEmpty = manifest.tables.filter((t) => t.rows > 0).length;
  return { org: org.name || org.id, tables: nonEmpty, rows, bytes, zipBytes: zip.length };
}

async function retention(orgId, keepDays) {
  const keys = await listKeys(`${PREFIX}/${orgId}/`);
  const cutoff = new Date(Date.now() - keepDays * 86400000).toISOString().slice(0, 10);
  const re = new RegExp(`^${PREFIX}/${orgId}/(\\d{4}-\\d{2}-\\d{2})/`);
  const toDelete = keys.filter((k) => {
    const m = k.match(re);
    return m && m[1] < cutoff;
  });
  if (toDelete.length) await deleteKeys(toDelete);
  return toDelete.length;
}

async function runBackup({ dry = false } = {}) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const { data: tablesArr, error: tErr } = await supabase.rpc('list_backup_tables');
  if (tErr) throw new Error('list_backup_tables: ' + tErr.message);
  const tables = tablesArr || [];

  const { data: orgs, error: oErr } = await supabase.from('orgs').select('id, name, is_demo');
  if (oErr) throw oErr;
  const targets = (orgs || []).filter((o) => o.is_demo !== true);

  console.log(`[backup] ${dateStr}: ${targets.length} org non-demo, ${tables.length} tabelle, dry=${dry}, retention=${RETENTION_DAYS}g`);
  if (dry) {
    console.log(`[backup] (dry) tabelle: ${tables.join(', ')}`);
    targets.forEach((o) => console.log(`[backup] (dry) org: ${o.name || o.id}`));
    return { date: dateStr, orgs: 0, dry: true, tables: tables.length };
  }

  let ok = 0;
  for (const org of targets) {
    try {
      const r = await backupOrg(org, dateStr, tables);
      const purged = await retention(org.id, RETENTION_DAYS);
      console.log(`[backup] ${r.org}: ${r.tables} tab, ${r.rows} righe, zip ${(r.zipBytes / 1024).toFixed(0)}KB${purged ? `, purge ${purged} obj` : ''}`);
      ok++;
    } catch (e) {
      console.error(`[backup] ${org.name || org.id} FALLITO: ${e.message}`);
    }
  }
  console.log(`[backup] Fatto. org ok=${ok}/${targets.length}, date=${dateStr}`);
  return { date: dateStr, orgs: ok, total: targets.length };
}

module.exports = { runBackup };
