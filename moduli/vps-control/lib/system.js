/**
 * Risorse di sistema (CPU/RAM/disco/uptime) e stato backup.
 * Solo comandi di lettura via execFile (no shell).
 */
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

function sh(cmd, args) {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout: 10000, maxBuffer: 2 * 1024 * 1024 }, (err, stdout) =>
      resolve(err ? '' : String(stdout || '').trim())
    );
  });
}

async function resources() {
  const [mem, disk, load, up, cpu] = await Promise.all([
    sh('free', ['-m']),
    sh('df', ['-h', '/']),
    sh('cat', ['/proc/loadavg']),
    sh('uptime', ['-p']),
    sh('nproc', []),
  ]);
  const m = (mem.split('\n')[1] || '').trim().split(/\s+/);
  const d = (disk.split('\n')[1] || '').trim().split(/\s+/);
  return {
    cpuCores: Number(cpu) || null,
    load: load.split(' ')[0] || null,
    ramTotalMb: Number(m[1]) || null,
    ramUsedMb: Number(m[2]) || null,
    diskTotal: d[1] || null,
    diskUsed: d[2] || null,
    diskUsePct: Number(String(d[4] || '').replace('%', '')) || null,
    uptime: up || null,
  };
}

function dirSize(p) {
  return sh('du', ['-sh', p]).then((o) => o.split('\t')[0] || null);
}

async function backups() {
  const items = [];

  // 1) Backup DB gestito da Supabase (statico — è la rete di sicurezza vera)
  items.push({
    key: 'supabase',
    name: 'Database — Supabase (prod)',
    status: 'ok',
    managed: true,
    note: 'Backup automatico giornaliero gestito da Supabase, con point-in-time recovery.',
  });

  // 2) Dump manuali in /root/backups
  let dumps = [];
  try {
    const base = '/root/backups';
    if (fs.existsSync(base)) {
      const entries = fs.readdirSync(base, { withFileTypes: true }).filter((e) => e.isDirectory());
      dumps = await Promise.all(
        entries.map(async (e) => {
          const full = path.join(base, e.name);
          let mtime = null;
          try { mtime = fs.statSync(full).mtime.toISOString(); } catch {}
          return { name: e.name, size: await dirSize(full), mtime };
        })
      );
      dumps.sort((a, b) => (a.mtime < b.mtime ? 1 : -1));
    }
  } catch {}
  items.push({
    key: 'vps_dumps',
    name: 'Dump manuali VPS',
    status: dumps.length ? 'warn' : 'off',
    count: dumps.length,
    last: dumps[0] ? dumps[0].mtime : null,
    entries: dumps.slice(0, 12),
    note: 'Snapshot occasionali del DB in /root/backups (manuali, prima di interventi importanti).',
  });

  // 3) Backup locale studio (Mac) — informativo, non verificabile dal VPS
  items.push({
    key: 'local',
    name: 'Backup locale studio (Mac)',
    status: 'ok',
    external: true,
    note: 'rsync + launchd ogni 10 minuti sul Mac dello studio (60 snapshot con hardlink, ~10 ore).',
  });

  // 4) Backup per-cliente su R2 (LIVE)
  items.push({
    key: 'per_client',
    name: 'Backup per-cliente su R2',
    status: 'ok',
    note: 'Attivo: export notturno (03:00) dei dati di ogni org non-demo su R2 — backups/<org_id>/<data>/ (JSON per tabella + manifest + zip), retention 30 giorni.',
  });

  // 5) R2 / Cloudflare
  const r2 = process.env.R2_ACCOUNT_ID && !/your_/.test(String(process.env.R2_ACCOUNT_ID));
  items.push({
    key: 'r2',
    name: 'R2 / Cloudflare (oggetti)',
    status: r2 ? 'ok' : 'off',
    note: r2 ? 'Configurato.' : 'Storage oggetti non configurato (credenziali placeholder).',
  });

  return items;
}

module.exports = { resources, backups };
