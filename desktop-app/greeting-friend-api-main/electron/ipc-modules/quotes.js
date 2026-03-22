// electron/ipc-modules/quotes.js
// IPC handlers for Quotes (Preventivi) CRUD

/* ===================== Helpers (QUOTES mapping) ===================== */
const rowToQuote = (row) => {
  if (!row) return null;
  let righe = [];
  try { 
    righe = JSON.parse(row.voci || '[]'); 
  } catch (err) { 
    console.warn('Failed to parse voci JSON, using empty array:', err.message);
    righe = []; 
  }
  return {
    id: row.id,
    numero: row.numero || '',
    cliente: row.cliente || '',
    importo: Number(row.importo || 0),
    valuta: row.valuta || 'EUR',
    stato: row.stato || 'bozza',
    righe,
    note: row.note || '',
    data: row.data || new Date().toISOString().slice(0, 10),
    scontoPerc: Number(row.sconto_perc ?? 0),
    ivaPerc: Number(row.iva_perc ?? 22),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

const quoteToRow = (p) => ({
  numero: p.numero || null,
  cliente: p.cliente || '',
  importo: Number(p.importo || 0),
  valuta: p.valuta || 'EUR',
  stato: p.stato || 'bozza',
  voci: JSON.stringify(p.righe || []),
  note: p.note || '',
  data: p.data || new Date().toISOString().slice(0, 10),
  sconto_perc: Number(p.scontoPerc ?? 0),
  iva_perc: Number(p.ivaPerc ?? 22),
});

function registerQuotesIpc(handleSafe, db) {
  handleSafe('quotes:list', () => {
    const rows = db.prepare(`SELECT * FROM quotes ORDER BY id DESC`).all();
    return rows.map(rowToQuote);
  });

  handleSafe('quotes:create', (p) => {
    const data = quoteToRow(p);
    const info = db.prepare(`
      INSERT INTO quotes (numero, cliente, importo, valuta, stato, voci, note, data, sconto_perc, iva_perc)
      VALUES (@numero,@cliente,@importo,@valuta,@stato,@voci,@note,@data,@sconto_perc,@iva_perc)
    `).run(data);
    const row = db.prepare(`SELECT * FROM quotes WHERE id=?`).get(info.lastInsertRowid);
    return rowToQuote(row);
  });

  handleSafe('quotes:update', (id, patch) => {
    const cur = db.prepare(`SELECT * FROM quotes WHERE id=?`).get(id);
    if (!cur) throw new Error('Preventivo non trovato');
    const mergedFE = { ...rowToQuote(cur), ...patch };
    const upd = quoteToRow(mergedFE);
    db.prepare(`
      UPDATE quotes
      SET numero=@numero, cliente=@cliente, importo=@importo, valuta=@valuta,
          stato=@stato, voci=@voci, note=@note, data=@data, sconto_perc=@sconto_perc, iva_perc=@iva_perc
      WHERE id=@id
    `).run({ ...upd, id });
    const row = db.prepare(`SELECT * FROM quotes WHERE id=?`).get(id);
    return rowToQuote(row);
  });

  handleSafe('quotes:remove', (id) => {
    db.prepare(`DELETE FROM quotes WHERE id=?`).run(id);
    return { ok:true };
  });
}

module.exports = { registerQuotesIpc, rowToQuote, quoteToRow };
