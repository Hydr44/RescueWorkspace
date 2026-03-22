// electron/ipc-modules/clients.js
// IPC handlers for Clients CRUD

function registerClientsIpc(handleSafe, db) {
  handleSafe('clients:list', () =>
    db.prepare(`SELECT * FROM clients ORDER BY id DESC`).all()
  );

  handleSafe('clients:create', (p) => {
    const info = db.prepare(`
      INSERT INTO clients (nome,telefono,email,piva,indirizzo,note)
      VALUES (@nome,@telefono,@email,@piva,@indirizzo,@note)
    `).run({
      nome: p.nome,
      telefono: p.telefono || '',
      email: p.email || '',
      piva: p.piva || '',
      indirizzo: p.indirizzo || '',
      note: p.note || '',
    });
    return db.prepare(`SELECT * FROM clients WHERE id=?`).get(info.lastInsertRowid);
  });

  handleSafe('clients:update', (id, patch) => {
    const cur = db.prepare(`SELECT * FROM clients WHERE id=?`).get(id);
    if (!cur) throw new Error('Client not found');
    const next = { ...cur, ...patch, id };
    db.prepare(`
      UPDATE clients
      SET nome=@nome, telefono=@telefono, email=@email, piva=@piva, indirizzo=@indirizzo, note=@note
      WHERE id=@id
    `).run(next);
    return db.prepare(`SELECT * FROM clients WHERE id=?`).get(id);
  });

  handleSafe('clients:remove', (id) => {
    db.prepare(`DELETE FROM clients WHERE id=?`).run(id);
    return { ok:true };
  });
}

module.exports = { registerClientsIpc };
