// electron/ipc-modules/admin.js
// IPC handlers for Admin (creazione account Auth)

function registerAdminIpc(handleSafe, { _fetch, API_ORIGIN, ADMIN_SECRET }) {
  handleSafe('admin:createUser', async (payload = {}) => {
    const url = `${API_ORIGIN}/api/admin/create-user`;
    if (!payload?.email) throw new Error('email mancante');
    if (!payload?.orgId) throw new Error('orgId mancante');

    const headers = { 'Content-Type': 'application/json' };
    if (ADMIN_SECRET) headers['x-admin-secret'] = ADMIN_SECRET;

    // timeout 15s per evitare hung IPC
    const ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    const to = ctrl ? setTimeout(() => ctrl.abort(), 15000) : null;

    console.log(`➡️  admin:create-user → ${url} (org=${payload.orgId}, email=${payload.email})`);

    try {
      const r = await _fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: String(payload.email).trim().toLowerCase(),
          password: payload.password,
          orgId: payload.orgId,
          nome: payload.nome,
          ruolo: payload.ruolo,
        }),
        ...(ctrl ? { signal: ctrl.signal } : {}),
      });

      const text = await r.text();
      let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }

      if (!r.ok) {
        const err = new Error(json?.error || `HTTP ${r.status}`);
        err.status = r.status;
        err.body = json;
        throw err;
      }
      console.log(`✅ admin:create-user ok: ${json?.id || '(no id)'}`);
      return json;
    } catch (e) {
      if (e?.name === 'AbortError') throw new Error('timeout chiamando Admin API');
      throw e;
    } finally {
      if (to) clearTimeout(to);
    }
  });
}

module.exports = { registerAdminIpc };
