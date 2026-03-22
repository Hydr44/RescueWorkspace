// electron/ipc-modules/autisti.js
// IPC handlers for Autisti (Drivers) CRUD

function registerAutistiIpc(handleSafe, db) {
  handleSafe('autisti:list', () =>
    db.prepare(`SELECT * FROM autisti ORDER BY id DESC`).all()
  );

  handleSafe('autisti:create', (p) => {
    const info = db.prepare(`
      INSERT INTO autisti (nome,telefono,stato,patente,note)
      VALUES (@nome,@telefono,@stato,@patente,@note)
    `).run({
      nome: p.nome,
      telefono: p.telefono || '',
      stato: p.stato || 'offline',
      patente: p.patente || '',
      note: p.note || '',
    });
    return db.prepare(`SELECT * FROM autisti WHERE id=?`).get(info.lastInsertRowid);
  });

  handleSafe('autisti:update', (id, patch) => {
    const cur = db.prepare(`SELECT * FROM autisti WHERE id=?`).get(id);
    if (!cur) throw new Error('Autista non trovato');
    db.prepare(`
      UPDATE autisti
      SET nome=@nome, telefono=@telefono, stato=@stato, patente=@patente, note=@note
      WHERE id=@id
    `).run({ ...cur, ...patch, id });
    return db.prepare(`SELECT * FROM autisti WHERE id=?`).get(id);
  });

  handleSafe('autisti:remove', (id) => {
    db.prepare(`DELETE FROM autisti WHERE id=?`).run(id);
    return { ok:true };
  });
}

module.exports = { registerAutistiIpc };
