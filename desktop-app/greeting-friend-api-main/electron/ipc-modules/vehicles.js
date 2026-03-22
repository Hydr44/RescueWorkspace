// electron/ipc-modules/vehicles.js
// IPC handlers for Vehicles CRUD

function registerVehiclesIpc(handleSafe, db) {
  handleSafe('vehicles:list', () =>
    db.prepare(`SELECT * FROM vehicles ORDER BY id DESC`).all()
  );

  handleSafe('vehicles:create', (p) => {
    const info = db.prepare(`
      INSERT INTO vehicles (targa,telaio,modello,stato,scadenze,note)
      VALUES (@targa,@telaio,@modello,@stato,@scadenze,@note)
    `).run({
      targa: p.targa || '',
      telaio: p.telaio || '',
      modello: p.modello || '',
      stato: p.stato || 'disponibile',
      scadenze: p.scadenze || '',
      note: p.note || '',
    });
    return db.prepare(`SELECT * FROM vehicles WHERE id=?`).get(info.lastInsertRowid);
  });

  handleSafe('vehicles:update', (id, patch) => {
    const cur = db.prepare(`SELECT * FROM vehicles WHERE id=?`).get(id);
    if (!cur) throw new Error('Mezzo non trovato');
    db.prepare(`
      UPDATE vehicles
      SET targa=@targa, telaio=@telaio, modello=@modello, stato=@stato, scadenze=@scadenze, note=@note
      WHERE id=@id
    `).run({ ...cur, ...patch, id });
    return db.prepare(`SELECT * FROM vehicles WHERE id=?`).get(id);
  });

  handleSafe('vehicles:remove', (id) => {
    db.prepare(`DELETE FROM vehicles WHERE id=?`).run(id);
    return { ok:true };
  });
}

module.exports = { registerVehiclesIpc };
