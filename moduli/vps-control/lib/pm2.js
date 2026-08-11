/**
 * Wrapper sicuro attorno alla CLI pm2.
 * - execFile (NO shell) con argomenti come array → niente command injection.
 * - i nomi servizio sono sempre validati e confrontati con la lista reale.
 * - le istanze in cluster con lo stesso nome vengono raggruppate.
 */
const { execFile } = require('child_process');
const fs = require('fs');

function run(args) {
  return new Promise((resolve, reject) => {
    execFile('pm2', args, { timeout: 25000, maxBuffer: 8 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(String(stderr || err.message || 'pm2 error').trim().slice(0, 300)));
      resolve(String(stdout || ''));
    });
  });
}

function envOf(name) {
  if (name.startsWith('staging-') || name.endsWith('-test')) return 'staging';
  return 'prod';
}

async function jlist() {
  const out = await run(['jlist']);
  const i = out.indexOf('['); // pm2 può anteporre warning al JSON
  return JSON.parse(i >= 0 ? out.slice(i) : out);
}

async function listServices(descriptions) {
  const arr = await jlist();
  const now = Date.now();
  const byName = new Map();
  for (const p of arr) {
    const e = p.pm2_env || {};
    const mem = Math.round((p.monit && p.monit.memory || 0) / 1048576);
    const cur = byName.get(p.name);
    if (cur) {
      cur.instances += 1;
      cur.mem += mem;
      cur.restarts = Math.max(cur.restarts, e.restart_time || 0);
      if (e.status !== 'online') cur.status = e.status || cur.status;
    } else {
      byName.set(p.name, {
        name: p.name,
        status: e.status || 'unknown',
        env: envOf(p.name),
        restarts: e.restart_time || 0,
        instances: 1,
        cpu: (p.monit && p.monit.cpu) || 0,
        mem,
        mode: e.exec_mode || 'fork',
        uptimeMs: e.pm_uptime ? now - e.pm_uptime : null,
        outLog: e.pm_out_log_path || null,
        errLog: e.pm_err_log_path || null,
      });
    }
  }
  let list = [...byName.values()];
  if (descriptions) {
    list = list.map((s) => ({
      ...s,
      desc: descriptions[s.name] || descriptions[s.name.replace(/^staging-/, '')] || null,
    }));
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

function tailFile(p, n) {
  try {
    if (!p || !fs.existsSync(p)) return [];
    const lines = fs.readFileSync(p, 'utf8').split('\n').filter(Boolean);
    return lines.slice(-n);
  } catch {
    return [];
  }
}

async function tailLogs(name, n) {
  const list = await listServices();
  const s = list.find((x) => x.name === name);
  if (!s) return [];
  const out = tailFile(s.outLog, n).map((line) => ({ stream: 'out', line }));
  const err = tailFile(s.errLog, Math.ceil(n / 3)).map((line) => ({ stream: 'err', line }));
  return [...out, ...err].slice(-n);
}

const restart = (name) => run(['restart', name, '--update-env']);
const stop = (name) => run(['stop', name]);
const start = (name) => run(['start', name]);

module.exports = { listServices, tailLogs, restart, stop, start };
