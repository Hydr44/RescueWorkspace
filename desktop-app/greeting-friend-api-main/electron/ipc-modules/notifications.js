// electron/ipc-modules/notifications.js
// IPC handlers for Notifications CRUD + Email preferences + SMTP

const { sendEmail, verifySmtp, templateTest } = require('../email-service');
const { runCheck } = require('../notification-checker');

function registerNotificationsIpc(handleSafe, db) {

  // ===== CRUD Notifiche In-App =====

  handleSafe('notifications:list', () =>
    db.prepare(`SELECT * FROM notifications ORDER BY id DESC`).all()
  );

  handleSafe('notifications:create', (p) => {
    const info = db.prepare(`
      INSERT INTO notifications (titolo, messaggio, livello, letto)
      VALUES (@titolo,@messaggio,@livello,@letto)
    `).run({
      titolo: p.titolo,
      messaggio: p.messaggio || '',
      livello: p.livello || 'info',
      letto: p.letto ? 1 : 0,
    });
    return db.prepare(`SELECT * FROM notifications WHERE id=?`).get(info.lastInsertRowid);
  });

  handleSafe('notifications:update', (id, patch) => {
    const cur = db.prepare(`SELECT * FROM notifications WHERE id=?`).get(id);
    if (!cur) throw new Error('Notifica non trovata');
    db.prepare(`
      UPDATE notifications
      SET titolo=@titolo, messaggio=@messaggio, livello=@livello, letto=@letto
      WHERE id=@id
    `).run({
      ...cur,
      ...patch,
      id,
      letto: patch.letto != null ? (patch.letto ? 1 : 0) : cur.letto,
    });
    return db.prepare(`SELECT * FROM notifications WHERE id=?`).get(id);
  });

  handleSafe('notifications:remove', (id) => {
    db.prepare(`DELETE FROM notifications WHERE id=?`).run(id);
    return { ok: true };
  });

  // ===== Preferenze Notifiche Email =====

  handleSafe('notifications:get-email-prefs', () => {
    try {
      const row = db.prepare(`SELECT value FROM app_settings WHERE key = 'notification_prefs'`).get();
      return row ? JSON.parse(row.value) : getDefaultPrefs();
    } catch {
      return getDefaultPrefs();
    }
  });

  handleSafe('notifications:save-email-prefs', (prefs) => {
    const json = JSON.stringify(prefs);
    db.prepare(`
      INSERT INTO app_settings (key, value, updated_at) VALUES ('notification_prefs', ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `).run(json);
    return { ok: true };
  });

  // ===== Configurazione SMTP =====

  handleSafe('notifications:get-smtp', () => {
    try {
      const row = db.prepare(`SELECT value FROM app_settings WHERE key = 'smtp_config'`).get();
      if (!row) return getDefaultSmtp();
      const cfg = JSON.parse(row.value);
      // Non restituire la password in chiaro al renderer
      return { ...cfg, pass: cfg.pass ? '••••••••' : '' };
    } catch {
      return getDefaultSmtp();
    }
  });

  handleSafe('notifications:save-smtp', (cfg) => {
    // Se la password è mascherata, mantieni quella precedente
    if (cfg.pass === '••••••••') {
      try {
        const row = db.prepare(`SELECT value FROM app_settings WHERE key = 'smtp_config'`).get();
        if (row) {
          const old = JSON.parse(row.value);
          cfg.pass = old.pass;
        }
      } catch { /* noop */ }
    }
    const json = JSON.stringify(cfg);
    db.prepare(`
      INSERT INTO app_settings (key, value, updated_at) VALUES ('smtp_config', ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `).run(json);
    return { ok: true };
  });

  // ===== Test / Verifica SMTP =====

  handleSafe('notifications:test-smtp', async (cfg) => {
    // Se la password è mascherata, leggi quella salvata
    if (cfg.pass === '••••••••') {
      try {
        const row = db.prepare(`SELECT value FROM app_settings WHERE key = 'smtp_config'`).get();
        if (row) {
          const old = JSON.parse(row.value);
          cfg.pass = old.pass;
        }
      } catch { /* noop */ }
    }

    const smtpConfig = {
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure || false,
      auth: { user: cfg.user, pass: cfg.pass },
      from: cfg.from || `"RescueManager" <${cfg.user}>`,
    };

    // Verifica connessione
    const verify = await verifySmtp(smtpConfig);
    if (!verify.success) return verify;

    // Invia email di test
    const html = templateTest();
    const result = await sendEmail(
      { to: cfg.testTo || cfg.user, subject: 'Email di Test — RescueManager', html },
      smtpConfig
    );

    if (result.success) {
      db.prepare(`INSERT INTO email_log (type, recipient, sent_at) VALUES ('test', ?, datetime('now'))`)
        .run(cfg.testTo || cfg.user);
    }

    return result;
  });

  // ===== Check manuale scadenze =====

  handleSafe('notifications:check-now', async () => {
    await runCheck(db);
    return { ok: true };
  });

  // ===== Log email inviate =====

  handleSafe('notifications:email-log', () => {
    return db.prepare(`SELECT * FROM email_log ORDER BY sent_at DESC LIMIT 50`).all();
  });
}

function getDefaultPrefs() {
  return {
    email: '',
    emailEnabled: false,
    emailTypes: {
      scadenzeVeicoli: true,
      scadenzeEventi: true,
    },
  };
}

function getDefaultSmtp() {
  return {
    host: 'smtp.ionos.com',
    port: 587,
    secure: false,
    user: 'noreply@rescuemanager.eu',
    pass: '',
    from: '"RescueManager" <noreply@rescuemanager.eu>',
  };
}

module.exports = { registerNotificationsIpc };
