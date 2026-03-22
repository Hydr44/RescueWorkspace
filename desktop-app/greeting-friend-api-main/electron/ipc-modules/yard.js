// electron/ipc-modules/yard.js
// IPC handlers for Yard (custodia) CRUD

function registerYardIpc(handleSafe, db) {
  handleSafe('yard:list', () =>
    db.prepare(`SELECT * FROM yard_items ORDER BY id DESC`).all()
  );

  handleSafe('yard:create', (p) => {
    const info = db.prepare(`
      INSERT INTO yard_items (categoria,targa,telaio,marca_modello,posizione,stato,ingressodata,uscita_prevista,uscita_effettiva,condizioni_in,condizioni_out,foto,note)
      VALUES (@categoria,@targa,@telaio,@marca_modello,@posizione,@stato,@ingressodata,@uscita_prevista,@uscita_effettiva,@condizioni_in,@condizioni_out,@foto,@note)
    `).run({
      categoria: p.categoria || 'generico',
      targa: p.targa || '',
      telaio: p.telaio || '',
      marca_modello: p.marca_modello || '',
      posizione: p.posizione || '',
      stato: p.stato || 'in_custodia',
      ingressodata: p.ingressodata || null,
      uscita_prevista: p.uscita_prevista || null,
      uscita_effettiva: p.uscita_effettiva || null,
      condizioni_in: p.condizioni_in || '',
      condizioni_out: p.condizioni_out || '',
      foto: p.foto ? JSON.stringify(p.foto) : '[]',
      note: p.note || '',
    });
    return db.prepare(`SELECT * FROM yard_items WHERE id=?`).get(info.lastInsertRowid);
  });

  handleSafe('yard:update', (id, patch) => {
    const cur = db.prepare(`SELECT * FROM yard_items WHERE id=?`).get(id);
    if (!cur) throw new Error('Elemento piazzale non trovato');
    const next = { ...cur, ...patch, id };
    if (Object.prototype.hasOwnProperty.call(patch, 'foto')) {
      next.foto = JSON.stringify(patch.foto || []);
    }
    db.prepare(`
      UPDATE yard_items
      SET categoria=@categoria, targa=@targa, telaio=@telaio, marca_modello=@marca_modello, posizione=@posizione,
          stato=@stato, ingressodata=@ingressodata, uscita_prevista=@uscita_prevista, uscita_effettiva=@uscita_effettiva,
          condizioni_in=@condizioni_in, condizioni_out=@condizioni_out, foto=@foto, note=@note
      WHERE id=@id
    `).run(next);
    return db.prepare(`SELECT * FROM yard_items WHERE id=?`).get(id);
  });

  handleSafe('yard:remove', (id) => {
    db.prepare(`DELETE FROM yard_items WHERE id=?`).run(id);
    return { ok:true };
  });
}

module.exports = { registerYardIpc };
