// electron/db.js
const path = require('path');
const { app } = require('electron');
const Database = require('better-sqlite3');

let db;

function initDb() {
  if (db) return db;
  const dbPath = path.join(app.getPath('userData'), 'rescue.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // --- TRANSPORTS ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS transports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente TEXT NOT NULL,
      indirizzo TEXT NOT NULL,
      stato TEXT NOT NULL DEFAULT 'da fare',  -- da fare | in corso | completato | in attesa
      orario TEXT,
      autista TEXT,
      mezzo TEXT,
      note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_transports_stato ON transports(stato);
    CREATE INDEX IF NOT EXISTS idx_transports_created ON transports(created_at);
    CREATE TRIGGER IF NOT EXISTS transports_updated_at
    AFTER UPDATE ON transports FOR EACH ROW
    BEGIN
      UPDATE transports SET updated_at = datetime('now') WHERE id = OLD.id;
    END;
  `);

  // --- CLIENTS ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      telefono TEXT,
      email TEXT,
      piva TEXT,
      indirizzo TEXT,
      note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_clients_nome ON clients(nome);
    CREATE TRIGGER IF NOT EXISTS clients_updated_at
    AFTER UPDATE ON clients FOR EACH ROW
    BEGIN
      UPDATE clients SET updated_at = datetime('now') WHERE id = OLD.id;
    END;
  `);

  // --- AUTISTI ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS autisti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      telefono TEXT,
      stato TEXT NOT NULL DEFAULT 'offline',  -- disponibile | occupato | offline
      patente TEXT,                           -- string semplice (es: "B,C")
      note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_autisti_stato ON autisti(stato);
    CREATE TRIGGER IF NOT EXISTS autisti_updated_at
    AFTER UPDATE ON autisti FOR EACH ROW
    BEGIN
      UPDATE autisti SET updated_at = datetime('now') WHERE id = OLD.id;
    END;
  `);

  // --- VEHICLES (Mezzi) ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      targa TEXT,
      telaio TEXT,
      modello TEXT,
      stato TEXT NOT NULL DEFAULT 'disponibile', -- disponibile | officina | fermo
      scadenze TEXT, -- es: "Ass. 10/2025; Revisione 03/2026"
      note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_vehicles_stato ON vehicles(stato);
    CREATE TRIGGER IF NOT EXISTS vehicles_updated_at
    AFTER UPDATE ON vehicles FOR EACH ROW
    BEGIN
      UPDATE vehicles SET updated_at = datetime('now') WHERE id = OLD.id;
    END;
  `);

  // --- YARD (custodia piazzale) ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS yard_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categoria TEXT NOT NULL DEFAULT 'generico', -- sequestro | confisca | incidente | generico
      targa TEXT,
      telaio TEXT,
      marca_modello TEXT,
      posizione TEXT,       -- es: "Fila B, posto 12"
      stato TEXT NOT NULL DEFAULT 'in_custodia', -- in_custodia | rilasciato
      ingressodata TEXT,    -- datetime/ISO
      uscita_prevista TEXT,
      uscita_effettiva TEXT,
      condizioni_in TEXT,   -- testo libero
      condizioni_out TEXT,  -- testo libero
      foto JSON,            -- array di path/uri (string JSON)
      note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_yard_items_stato ON yard_items(stato);
    CREATE TRIGGER IF NOT EXISTS yard_items_updated_at
    AFTER UPDATE ON yard_items FOR EACH ROW
    BEGIN
      UPDATE yard_items SET updated_at = datetime('now') WHERE id = OLD.id;
    END;
  `);

  // --- CALENDAR EVENTS ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titolo TEXT NOT NULL,
      inizio TEXT NOT NULL,
      fine TEXT,
      tipo TEXT,         -- es: "turno", "promemoria", "scadenza", "transport"
      descrizione TEXT,
      meta JSON,         -- extra (JSON)
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_events_inizio ON events(inizio);
    CREATE TRIGGER IF NOT EXISTS events_updated_at
    AFTER UPDATE ON events FOR EACH ROW
    BEGIN
      UPDATE events SET updated_at = datetime('now') WHERE id = OLD.id;
    END;
  `);

  // --- QUOTES (Preventivi) ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT,         -- es. "PR-2025-0012"
      cliente TEXT NOT NULL,
      importo REAL NOT NULL DEFAULT 0,
      valuta TEXT NOT NULL DEFAULT 'EUR',
      stato  TEXT NOT NULL DEFAULT 'bozza', -- bozza | inviato | accettato | rifiutato | fatturato
      voci   JSON,          -- righe (JSON)
      note   TEXT,
      data   TEXT,
      sconto_perc REAL DEFAULT 0,
      iva_perc REAL DEFAULT 22,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_quotes_stato ON quotes(stato);
    CREATE INDEX IF NOT EXISTS idx_quotes_data ON quotes(data);
    CREATE TRIGGER IF NOT EXISTS quotes_updated_at
    AFTER UPDATE ON quotes FOR EACH ROW
    BEGIN
      UPDATE quotes SET updated_at = datetime('now') WHERE id = OLD.id;
    END;
  `);

  // Migrazioni idempotenti (in caso di vecchi DB)
  try { db.exec(`ALTER TABLE quotes ADD COLUMN data TEXT`); } catch (_) { }
  try { db.exec(`ALTER TABLE quotes ADD COLUMN sconto_perc REAL DEFAULT 0`); } catch (_) { }
  try { db.exec(`ALTER TABLE quotes ADD COLUMN iva_perc REAL DEFAULT 22`); } catch (_) { }
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_quotes_data ON quotes(data)`); } catch (_) { }

  // --- NOTIFICATIONS ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titolo TEXT NOT NULL,
      messaggio TEXT,
      livello TEXT NOT NULL DEFAULT 'info', -- info | warn | error | success
      letto INTEGER NOT NULL DEFAULT 0,     -- 0/1
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_letto ON notifications(letto);
  `);

  // --- USERS ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE,
      ruolo TEXT NOT NULL DEFAULT 'operatore', -- admin | operatore | autista
      stato TEXT NOT NULL DEFAULT 'attivo',    -- attivo | sospeso
      hash TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TRIGGER IF NOT EXISTS users_updated_at
    AFTER UPDATE ON users FOR EACH ROW
    BEGIN
      UPDATE users SET updated_at = datetime('now') WHERE id = OLD.id;
    END;
  `);

  // --- SYSTEM LOG ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT DEFAULT (datetime('now')),
      level TEXT NOT NULL DEFAULT 'info', -- info | warn | error
      source TEXT,
      message TEXT,
      meta JSON
    );
    CREATE INDEX IF NOT EXISTS idx_system_log_ts ON system_log(ts);
    CREATE INDEX IF NOT EXISTS idx_system_log_level ON system_log(level);
  `);

  // --- HELP REQUESTS (assist) ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS help_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE,
      telefono TEXT,
      note TEXT,
      status TEXT NOT NULL DEFAULT 'pending',   -- pending | located | closed
      lat REAL,
      lng REAL,
      accuracy REAL,
      received_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests(status);
    CREATE INDEX IF NOT EXISTS idx_help_requests_token ON help_requests(token);
    CREATE TRIGGER IF NOT EXISTS help_requests_updated_at
    AFTER UPDATE ON help_requests FOR EACH ROW
    BEGIN
      UPDATE help_requests SET updated_at = datetime('now') WHERE id = OLD.id;
    END;
  `);

  // --- EMAIL LOG (tracking invii) ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,       -- es: "scadenze_veicoli", "scadenze_eventi", "test"
      recipient TEXT NOT NULL,
      sent_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_email_log_type ON email_log(type);
    CREATE INDEX IF NOT EXISTS idx_email_log_sent ON email_log(sent_at);
  `);

  // --- APP SETTINGS (configurazioni generiche key-value JSON) ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  return db;
}

module.exports = { initDb };