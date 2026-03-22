// electron/notification-checker.js
// Controlla periodicamente scadenze e invia email di notifica

const { sendEmail, templateScadenzeVeicoli, templateScadenzeEventi } = require('./email-service');

let _interval = null;
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // ogni 6 ore

/**
 * Avvia il checker periodico.
 * @param {import('better-sqlite3').Database} db
 */
function startChecker(db) {
    if (_interval) return;
    console.log('[NOTIF-CHECKER] Avviato (intervallo: 6h)');

    // Prima esecuzione dopo 30 secondi (per non rallentare il boot)
    setTimeout(() => runCheck(db), 30_000);

    _interval = setInterval(() => runCheck(db), CHECK_INTERVAL_MS);
}

function stopChecker() {
    if (_interval) {
        clearInterval(_interval);
        _interval = null;
        console.log('[NOTIF-CHECKER] Fermato');
    }
}

/**
 * Esegue il controllo scadenze.
 * @param {import('better-sqlite3').Database} db
 */
async function runCheck(db) {
    console.log('[NOTIF-CHECKER] Controllo scadenze in corso...');

    try {
        // Leggi preferenze utente
        const prefs = getNotificationPrefs(db);
        if (!prefs || !prefs.email) {
            console.log('[NOTIF-CHECKER] Nessun email configurato — skip');
            return;
        }

        const smtpConfig = getSmtpConfig(db);
        if (!smtpConfig?.auth?.pass) {
            console.log('[NOTIF-CHECKER] SMTP non configurato — skip');
            return;
        }

        const results = [];

        // 1. Scadenze veicoli (se abilitato)
        if (prefs.emailTypes?.scadenzeVeicoli !== false) {
            const r = await checkScadenzeVeicoli(db, prefs.email, smtpConfig);
            if (r) results.push(r);
        }

        // 2. Scadenze eventi calendario (se abilitato)
        if (prefs.emailTypes?.scadenzeEventi !== false) {
            const r = await checkScadenzeEventi(db, prefs.email, smtpConfig);
            if (r) results.push(r);
        }

        console.log(`[NOTIF-CHECKER] Completato — ${results.length} email inviate`);
    } catch (err) {
        console.error('[NOTIF-CHECKER] Errore:', err.message);
    }
}

/**
 * Controlla veicoli con scadenze e invia email riepilogo.
 * Non invia se già inviata oggi per lo stesso tipo.
 */
async function checkScadenzeVeicoli(db, to, smtpConfig) {
    // Evita duplicati: controlla se già inviata oggi
    if (alreadySentToday(db, 'scadenze_veicoli')) return null;

    // Prendi tutti i veicoli con scadenze non vuote
    const veicoli = db.prepare(
        `SELECT targa, modello, scadenze FROM vehicles WHERE scadenze IS NOT NULL AND scadenze != '' ORDER BY targa`
    ).all();

    if (!veicoli.length) return null;

    const html = templateScadenzeVeicoli(veicoli);
    const result = await sendEmail(
        { to, subject: 'Scadenze Veicoli — RescueManager', html },
        smtpConfig
    );

    if (result.success) {
        logEmailSent(db, 'scadenze_veicoli', to);
        // Crea notifica in-app
        createNotification(db, 'Riepilogo scadenze veicoli', `Email inviata a ${to} con ${veicoli.length} veicoli`, 'info');
    }

    return result;
}

/**
 * Controlla eventi di tipo "scadenza" nei prossimi 7 giorni.
 */
async function checkScadenzeEventi(db, to, smtpConfig) {
    if (alreadySentToday(db, 'scadenze_eventi')) return null;

    const oggi = new Date().toISOString().slice(0, 10);
    const tra7gg = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const eventi = db.prepare(
        `SELECT titolo, inizio, descrizione FROM events
     WHERE tipo = 'scadenza' AND date(inizio) BETWEEN date(?) AND date(?)
     ORDER BY inizio`
    ).all(oggi, tra7gg);

    if (!eventi.length) return null;

    const html = templateScadenzeEventi(eventi);
    const result = await sendEmail(
        { to, subject: 'Scadenze in Arrivo — RescueManager', html },
        smtpConfig
    );

    if (result.success) {
        logEmailSent(db, 'scadenze_eventi', to);
        createNotification(db, 'Scadenze in arrivo', `Email inviata a ${to} con ${eventi.length} eventi`, 'info');
    }

    return result;
}

// ——— Helpers DB ———

function getNotificationPrefs(db) {
    try {
        const row = db.prepare(`SELECT value FROM app_settings WHERE key = 'notification_prefs'`).get();
        return row ? JSON.parse(row.value) : null;
    } catch { return null; }
}

function getSmtpConfig(db) {
    try {
        const row = db.prepare(`SELECT value FROM app_settings WHERE key = 'smtp_config'`).get();
        if (!row) return null;
        const cfg = JSON.parse(row.value);
        return {
            host: cfg.host || 'smtp.ionos.com',
            port: cfg.port || 587,
            secure: cfg.secure || false,
            auth: { user: cfg.user || 'noreply@rescuemanager.eu', pass: cfg.pass || '' },
            from: cfg.from || '"RescueManager" <noreply@rescuemanager.eu>',
        };
    } catch { return null; }
}

function alreadySentToday(db, type) {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const row = db.prepare(
            `SELECT 1 FROM email_log WHERE type = ? AND date(sent_at) = date(?) LIMIT 1`
        ).get(type, today);
        return !!row;
    } catch { return false; }
}

function logEmailSent(db, type, to) {
    try {
        db.prepare(`INSERT INTO email_log (type, recipient, sent_at) VALUES (?, ?, datetime('now'))`).run(type, to);
    } catch (e) { console.error('[NOTIF-CHECKER] Log email error:', e.message); }
}

function createNotification(db, titolo, messaggio, livello) {
    try {
        db.prepare(`INSERT INTO notifications (titolo, messaggio, livello, letto) VALUES (?, ?, ?, 0)`).run(titolo, messaggio, livello);
    } catch (e) { console.error('[NOTIF-CHECKER] Notifica error:', e.message); }
}

module.exports = { startChecker, stopChecker, runCheck };
