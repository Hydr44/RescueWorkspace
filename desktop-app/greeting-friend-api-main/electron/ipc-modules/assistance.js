// electron/ipc-modules/assistance.js
// IPC handlers for Assistance (posizione cliente)

function registerAssistanceIpc(handleSafe, db, { _fetch, ASSIST_BASE }) {
  handleSafe('assistance:create', async ({ telefono = '', note = '', orgId = null } = {}) => {
    const payload = {
      phone: telefono,
      note,
      orgId
    };

    console.log('[IPC assistance:create] Request payload:', payload);

    const r = await _fetch(`${ASSIST_BASE}/api/assist/create`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await r.text();
    if (!r.ok) {
      console.error('[IPC assistance:create] Failed with status', r.status, 'body:', text);
      let message = `assist:create http ${r.status}`;
      try {
        const body = JSON.parse(text);
        if (body?.error) {
          message = body.error;
        } else if (typeof body === 'string') {
          message = `${message} - ${body}`;
        }
      } catch (parseError) {
        if (text) {
          message = `${message} - ${text}`;
        }
      }
      throw new Error(message);
    }
    let json;
    try {
      json = JSON.parse(text); // { ok, token, url, request }
    } catch (parseError) {
      console.error('[IPC assistance:create] Invalid JSON response:', text);
      throw new Error('assist:create invalid JSON response');
    }

    // opzionale: specchia nel DB locale
    try {
      db.prepare(`
        INSERT INTO help_requests (token, telefono, note, status, created_at, updated_at)
        VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(json.token, telefono, note);
    } catch {}

    return json.request; // id, token, status, ...
  });

  handleSafe('assistance:list', async ({ orgId = null, limit = 50 } = {}) => {
    try {
      const params = new URLSearchParams();
      if (orgId) params.set('orgId', orgId);
      params.set('limit', String(limit));
      const r = await _fetch(`${ASSIST_BASE}/api/assist/list?${params.toString()}`);
      if (!r.ok) throw new Error(`assist:list http ${r.status}`);
      const json = await r.json(); // { ok, rows: [...] }
      return json.rows;
    } catch (err) {
      // Fallback silenzioso se server non raggiungibile
      if (err.code === 'ENOTFOUND' || err.cause?.code === 'ENOTFOUND') {
        return [];
      }
      throw err;
    }
  });

  handleSafe('assistance:getByToken', async (token) => {
    const r = await _fetch(`${ASSIST_BASE}/api/assist/by-token/${encodeURIComponent(token)}`);
    if (!r.ok) throw new Error(`assist:getByToken http ${r.status}`);
    const json = await r.json(); // { ok, row }
    return json.row;
  });

  handleSafe('assistance:updateLocation', async (token, { lat, lng, accuracy }) => {
    const r = await _fetch(`${ASSIST_BASE}/api/assist/update`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ token, lat, lng, accuracy })
    });
    if (!r.ok) throw new Error(`assist:update http ${r.status}`);
    const json = await r.json(); // { ok, row }

    // opzionale: aggiorna cache locale
    try {
      db.prepare(`
        UPDATE help_requests
        SET lat=@lat, lng=@lng, accuracy=@accuracy, status='located',
            received_at=@received_at, updated_at=CURRENT_TIMESTAMP
        WHERE token=@token
      `).run({
        token,
        lat: json.row.lat,
        lng: json.row.lng,
        accuracy: json.row.accuracy ?? null,
        received_at: json.row.received_at ?? null,
      });
    } catch {}

    return json.row;
  });

  handleSafe('assistance:close', async (token) => {
    const r = await _fetch(`${ASSIST_BASE}/api/assist/close`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ token })
    });
    if (!r.ok) throw new Error(`assist:close http ${r.status}`);
    try {
      db.prepare(`UPDATE help_requests SET status='closed', updated_at=CURRENT_TIMESTAMP WHERE token=?`).run(token);
    } catch {}
    return { ok: true };
  });

  handleSafe('assistance:remove', async (token) => {
    // se l'API remota espone DELETE, usala; altrimenti fallback ad una close + delete locale
    try {
      const r = await _fetch(`${ASSIST_BASE}/api/assist/delete`, {
        method: 'POST', // o 'DELETE' se il server lo supporta
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ token })
      });
      if (!r.ok) throw new Error(`assist:delete http ${r.status}`);
    } catch (err) {
      // fallback: chiudi lato server (se non già chiusa)
      try {
        await _fetch(`${ASSIST_BASE}/api/assist/close`, {
          method: 'POST',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify({ token })
        });
      } catch {}
    }

    // rimuovi dalla cache locale se presente
    try { db.prepare(`DELETE FROM help_requests WHERE token=?`).run(token); } catch {}

    return { ok: true };
  });
}

module.exports = { registerAssistanceIpc };
