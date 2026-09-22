/**
 * Ripristino da backup — ANALISI (read-only) e APPLY (transazionale).
 *
 * analyze(): legge il backup da R2 e lo confronta con i dati live, calcolando
 *   per tabella: reinserisci / aggiorna / elimina / invariati + campione delle
 *   righe che verrebbero eliminate. Non scrive nulla. Produce anche un planHash.
 * apply(): guardia (demo-first) → snapshot di sicurezza dei dati attuali su R2 →
 *   rpc restore_org (transazione, FK-off). Rifiuta se i dati sono cambiati dopo
 *   l'analisi (planHash diverso).
 */
const crypto = require('crypto');

const PAGE = 1000;
const IDENT_FIELDS = ['numero', 'number', 'name', 'nome', 'targa', 'plate', 'title', 'descrizione', 'ragione_sociale', 'created_at'];

function canonical(row) {
  const keys = Object.keys(row).sort();
  const o = {};
  for (const k of keys) o[k] = row[k];
  return JSON.stringify(o);
}
function pkKey(row, pk) {
  return pk.map((c) => String(row[c])).join('');
}
function shortHash(s) {
  return crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
}
function labelOf(row) {
  for (const f of IDENT_FIELDS) if (row[f] != null && row[f] !== '') return `${f}=${String(row[f]).slice(0, 40)}`;
  return `id=${row.id}`;
}

async function fetchLive(supabase, table, orgId) {
  const rows = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase.from(table).select('*').eq('org_id', orgId).range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

// Tabelle presenti nel backup (file <table>.json), da R2.
async function backupTables(r2, org, date) {
  const keys = await r2.listAll(`backups/${org}/${date}/`);
  return keys
    .map((o) => o.key.split('/').pop())
    .filter((f) => f.endsWith('.json') && f !== 'manifest.json')
    .map((f) => f.slice(0, -5));
}
async function readBackupTable(r2, org, date, table) {
  return JSON.parse(await r2.getText(`backups/${org}/${date}/${table}.json`));
}

async function analyze({ supabase, r2, org, date, mode, tables }) {
  const pkMap = (await supabase.rpc('backup_table_pks')).data || {};
  const present = await backupTables(r2, org, date);
  const list = tables && tables.length ? present.filter((t) => tables.includes(t)) : present;

  const out = [];
  for (const table of list) {
    const pk = pkMap[table];
    if (!pk) { out.push({ table, skipped: 'nessuna PK', insert: 0, update: 0, delete: 0, unchanged: 0 }); continue; }
    const backupRows = await readBackupTable(r2, org, date, table);
    const liveRows = await fetchLive(supabase, table, org);

    const backupByKey = new Map(backupRows.map((r) => [pkKey(r, pk), r]));
    const liveByKey = new Map(liveRows.map((r) => [pkKey(r, pk), r]));

    let insert = 0, update = 0, unchanged = 0;
    for (const [k, br] of backupByKey) {
      const lr = liveByKey.get(k);
      if (!lr) insert += 1;
      else if (canonical(br) !== canonical(lr)) update += 1;
      else unchanged += 1;
    }
    const deleteRows = [];
    for (const [k, lr] of liveByKey) if (!backupByKey.has(k)) deleteRows.push(lr);

    out.push({
      table, pk,
      insert, update, unchanged,
      delete: deleteRows.length,
      backupRows: backupRows.length,
      liveRows: liveRows.length,
      deleteSample: deleteRows.slice(0, 12).map((r) => ({ id: r.id != null ? String(r.id) : pkKey(r, pk), label: labelOf(r) })),
      deleteKeys: deleteRows.map((r) => pkKey(r, pk)).sort(),
    });
  }

  const totals = out.reduce((a, t) => ({
    insert: a.insert + t.insert, update: a.update + t.update, delete: a.delete + t.delete, unchanged: a.unchanged + t.unchanged,
  }), { insert: 0, update: 0, delete: 0, unchanged: 0 });

  // planHash: lega l'apply a ciò che è stato mostrato (mode + per tabella conteggi + chiavi da eliminare).
  const planBasis = JSON.stringify({
    org, date, mode,
    t: out.map((t) => ({ table: t.table, i: t.insert, u: t.update, d: mode === 'mirror' ? t.deleteKeys : [] })),
  });
  const planHash = shortHash(planBasis);

  // In 'merge' le eliminazioni non avvengono: azzero il conteggio mostrato come "eliminazioni effettive".
  const effectiveDeletes = mode === 'mirror' ? totals.delete : 0;
  return { mode, tables: out, totals: { ...totals, effectiveDeletes }, planHash };
}

// Snapshot di sicurezza dei dati ATTUALI (prima di applicare) → R2, così il restore è reversibile.
async function safetySnapshot({ supabase, r2, org, date, tables, stamp }) {
  const base = `backups/${org}/_pre-restore/${stamp}`;
  const manifest = { org_id: org, kind: 'pre-restore', from_backup: date, generated_at: new Date().toISOString(), tables: [] };
  for (const table of tables) {
    const rows = await fetchLive(supabase, table, org);
    if (rows.length) await r2.put(`${base}/${table}.json`, JSON.stringify(rows), 'application/json');
    manifest.tables.push({ table, rows: rows.length });
  }
  await r2.put(`${base}/manifest.json`, JSON.stringify(manifest, null, 2), 'application/json');
  return base;
}

// Ordine topologico (genitori → figli) delle tabelle, dal grafo FK.
async function topoOrder(supabase, tables) {
  const edges = (await supabase.rpc('backup_fk_edges')).data || [];
  const set = new Set(tables);
  const parents = new Map(tables.map((t) => [t, new Set()]));
  for (const e of edges) if (set.has(e.child) && set.has(e.parent)) parents.get(e.child).add(e.parent);
  const order = [];
  const placed = new Set();
  let guard = 0;
  while (order.length < tables.length && guard++ < tables.length + 5) {
    for (const t of tables) {
      if (placed.has(t)) continue;
      if ([...parents.get(t)].every((p) => placed.has(p))) { order.push(t); placed.add(t); }
    }
  }
  for (const t of tables) if (!placed.has(t)) order.push(t); // eventuali cicli in coda
  return order;
}

async function apply({ supabase, r2, org, date, mode, tables, planHash, allowProd, stamp }) {
  // 1. Guardia: org demo? (staging/demo-first). Su prod solo se allowProd.
  const { data: orgRow } = await supabase.from('orgs').select('id, name, is_demo').eq('id', org).maybeSingle();
  if (!orgRow) throw new Error('org inesistente');
  if (!orgRow.is_demo && !allowProd) {
    const err = new Error('Ripristino su org di produzione non ancora abilitato (solo demo). Abilitare RESTORE_ALLOW_PROD.');
    err.code = 'prod_locked';
    throw err;
  }

  // 2. Ricalcola il piano: se i dati sono cambiati dopo l'analisi, rifiuta.
  const fresh = await analyze({ supabase, r2, org, date, mode, tables });
  if (planHash && fresh.planHash !== planHash) {
    const err = new Error('I dati sono cambiati dopo l\'analisi: rilancia l\'analisi prima di applicare.');
    err.code = 'plan_stale';
    throw err;
  }
  const affected = fresh.tables.filter((t) => !t.skipped).map((t) => t.table);

  // 3. Snapshot di sicurezza dello stato attuale.
  const snapshot = await safetySnapshot({ supabase, r2, org, date, tables: affected, stamp });

  // 4. Costruisci payload + ordine FK-safe (genitori→figli) e applica in transazione.
  const ordered = await topoOrder(supabase, affected);
  const payload = {};
  for (const table of ordered) payload[table] = await readBackupTable(r2, org, date, table);
  const { data: report, error } = await supabase.rpc('restore_org', { p_org_id: org, p_mode: mode, p_payload: payload, p_tables: ordered });
  if (error) throw new Error('restore_org: ' + error.message);

  return { ok: true, org: orgRow.name, mode, snapshot, report, totals: fresh.totals };
}

module.exports = { analyze, apply };
