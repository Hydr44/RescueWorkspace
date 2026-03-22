// electron/ipc-modules/users.js
// IPC handlers for Users CRUD

function registerUsersIpc(handleSafe, db) {
  handleSafe('users:list', () =>
    db.prepare(`SELECT id,nome,email,ruolo,stato,created_at,updated_at FROM users ORDER BY id DESC`).all()
  );

  handleSafe('users:create', (p) => {
    const info = db.prepare(`
      INSERT INTO users (nome,email,ruolo,stato,hash)
      VALUES (@nome,@email,@ruolo,@stato,@hash)
    `).run({
      nome: p.nome,
      email: p.email || null,
      ruolo: p.ruolo || 'operatore',
      stato: p.stato || 'attivo',
      hash: p.hash || null,
    });
    return db.prepare(`SELECT id,nome,email,ruolo,stato,created_at,updated_at FROM users WHERE id=?`).get(info.lastInsertRowid);
  });

  handleSafe('users:update', (id, patch) => {
    const cur = db.prepare(`SELECT * FROM users WHERE id=?`).get(id);
    if (!cur) throw new Error('Utente non trovato');
    db.prepare(`
      UPDATE users SET nome=@nome, email=@email, ruolo=@ruolo, stato=@stato, hash=@hash
      WHERE id=@id
    `).run({ ...cur, ...patch, id });
    return db.prepare(`SELECT id,nome,email,ruolo,stato,created_at,updated_at FROM users WHERE id=?`).get(id);
  });

  handleSafe('users:remove', (id) => {
    db.prepare(`DELETE FROM users WHERE id=?`).run(id);
    return { ok:true };
  });
}

module.exports = { registerUsersIpc };
