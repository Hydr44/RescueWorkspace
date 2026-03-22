// electron/ipc-modules/system-log.js
// IPC handlers for System Log
const { BrowserWindow } = require('electron');

function registerSystemLogIpc(handleSafe, db) {
  handleSafe('log:add', (entry) => {
    // scrivi a DB
    db.prepare(`
      INSERT INTO system_log (ts, level, source, message, meta)
      VALUES (@ts,@level,@source,@message,@meta)
    `).run({
      ts: entry.ts || new Date().toISOString(),
      level: entry.level || 'info',
      source: entry.source || null,
      message: entry.message || '',
      meta: entry.meta ? JSON.stringify(entry.meta) : null,
    });

    // broadcast live a tutti i renderer aperti
    const payload = {
      ts: entry.ts || new Date().toISOString(),
      lvl: (entry.level || 'info').toUpperCase(),
      msg: entry.message || '',
      source: entry.source || null,
      meta: entry.meta || null,
    };
    BrowserWindow.getAllWindows().forEach(win => {
      try { win.webContents.send('log:append', payload); } catch {}
    });

    return { ok: true };
  });

  handleSafe('log:list', ({ level, limit = 200 } = {}) => {
    const rows = level
      ? db.prepare(`SELECT * FROM system_log WHERE level=? ORDER BY ts DESC LIMIT ?`).all(level, limit)
      : db.prepare(`SELECT * FROM system_log ORDER BY ts DESC LIMIT ?`).all(limit);
    // normalizza i campi per il renderer
    return rows.map(r => ({
      ts: r.ts,
      lvl: (r.level || 'info').toUpperCase(),
      msg: r.message,
      source: r.source || null,
      meta: r.meta ? JSON.parse(r.meta) : null,
    }));
  });

  handleSafe('log:clear', () => {
    db.prepare(`DELETE FROM system_log`).run();
    return { ok: true };
  });
}

module.exports = { registerSystemLogIpc };
