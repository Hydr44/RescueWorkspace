// electron/ipc-modules/events.js
// IPC handlers for Events (Calendario) CRUD

function registerEventsIpc(handleSafe, db) {
  handleSafe('events:list', (range) => {
    if (range?.from && range?.to) {
      return db
        .prepare(`SELECT * FROM events WHERE inizio >= ? AND inizio < ? ORDER BY inizio ASC`)
        .all(range.from, range.to);
    }
    return db.prepare(`SELECT * FROM events ORDER BY inizio DESC`).all();
  });

  handleSafe('events:create', (p) => {
    const info = db.prepare(`
      INSERT INTO events (titolo,inizio,fine,tipo,descrizione,meta)
      VALUES (@titolo,@inizio,@fine,@tipo,@descrizione,@meta)
    `).run({
      titolo: p.titolo,
      inizio: p.inizio,
      fine: p.fine || null,
      tipo: p.tipo || null,
      descrizione: p.descrizione || '',
      meta: p.meta ? JSON.stringify(p.meta) : null,
    });
    return db.prepare(`SELECT * FROM events WHERE id=?`).get(info.lastInsertRowid);
  });

  handleSafe('events:update', (id, patch) => {
    const cur = db.prepare(`SELECT * FROM events WHERE id=?`).get(id);
    if (!cur) throw new Error('Evento non trovato');
    const next = { ...cur, ...patch, id };
    if (Object.prototype.hasOwnProperty.call(patch, 'meta')) {
      next.meta = patch.meta ? JSON.stringify(patch.meta) : null;
    }
    db.prepare(`
      UPDATE events
      SET titolo=@titolo, inizio=@inizio, fine=@fine, tipo=@tipo, descrizione=@descrizione, meta=@meta
      WHERE id=@id
    `).run(next);
    return db.prepare(`SELECT * FROM events WHERE id=?`).get(id);
  });

  handleSafe('events:remove', (id) => {
    db.prepare(`DELETE FROM events WHERE id=?`).run(id);
    return { ok:true };
  });
}

module.exports = { registerEventsIpc };
