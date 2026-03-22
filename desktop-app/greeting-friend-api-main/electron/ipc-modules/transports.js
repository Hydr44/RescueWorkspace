// electron/ipc-modules/transports.js
// IPC handlers for Transports CRUD

function registerTransportsIpc(handleSafe, db) {
  handleSafe('transports:list', () =>
    db.prepare(`SELECT * FROM transports ORDER BY id DESC`).all()
  );

  handleSafe('transports:create', (p) => {
    const info = db.prepare(`
      INSERT INTO transports (cliente, indirizzo, stato, orario, autista, mezzo, note)
      VALUES (@cliente,@indirizzo,@stato,@orario,@autista,@mezzo,@note)
    `).run({
      cliente: p.cliente,
      indirizzo: p.indirizzo,
      stato: p.stato ?? 'da fare',
      orario: p.orario || null,
      autista: p.autista || null,
      mezzo: p.mezzo || null,
      note: p.note || null,
    });
    return db.prepare(`SELECT * FROM transports WHERE id=?`).get(info.lastInsertRowid);
  });

  handleSafe('transports:update', (id, patch) => {
    const cols = ['cliente','indirizzo','stato','orario','autista','mezzo','note'];
    const set = [];
    const params = { id };
    for (const k of cols) {
      if (Object.prototype.hasOwnProperty.call(patch, k)) {
        set.push(`${k}=@${k}`);
        params[k] = patch[k];
      }
    }
    if (set.length) {
      db.prepare(`UPDATE transports SET ${set.join(', ')} WHERE id=@id`).run(params);
    }
    return db.prepare(`SELECT * FROM transports WHERE id=?`).get(id);
  });

  handleSafe('transports:remove', (id) => {
    db.prepare(`DELETE FROM transports WHERE id=?`).run(id);
    return { ok:true };
  });
}

module.exports = { registerTransportsIpc };
