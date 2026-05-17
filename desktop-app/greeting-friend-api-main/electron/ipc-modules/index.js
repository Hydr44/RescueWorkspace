// electron/ipc-modules/index.js
// Central registry for all modular IPC handlers

const { registerTransportsIpc } = require('./transports');
const { registerClientsIpc } = require('./clients');
const { registerAutistiIpc } = require('./autisti');
const { registerVehiclesIpc } = require('./vehicles');
const { registerYardIpc } = require('./yard');
const { registerEventsIpc } = require('./events');
const { registerQuotesIpc } = require('./quotes');
const { registerNotificationsIpc } = require('./notifications');
const { registerUsersIpc } = require('./users');
const { registerAdminIpc } = require('./admin');
const { registerSystemLogIpc } = require('./system-log');
const { registerReportsIpc } = require('./reports');
const { registerAssistanceIpc } = require('./assistance');
const { registerSparePartsIpc } = require('./spare-parts');
const { registerSdiIpc } = require('./sdi');

/**
 * Register all CRUD/business IPC handlers.
 * @param {Function} handleSafe - Safe IPC handler wrapper
 * @param {object} db - SQLite database instance
 * @param {object} deps - External dependencies (_fetch, API_ORIGIN, ADMIN_SECRET, ASSIST_BASE)
 */
function registerAllCrudIpc(handleSafe, db, deps) {
  registerTransportsIpc(handleSafe, db);
  registerClientsIpc(handleSafe, db);
  registerAutistiIpc(handleSafe, db);
  registerVehiclesIpc(handleSafe, db);
  registerYardIpc(handleSafe, db);
  registerEventsIpc(handleSafe, db);
  registerQuotesIpc(handleSafe, db);
  registerNotificationsIpc(handleSafe, db);
  registerUsersIpc(handleSafe, db);
  registerAdminIpc(handleSafe, deps);
  registerSystemLogIpc(handleSafe, db);
  registerReportsIpc(handleSafe, db);
  registerAssistanceIpc(handleSafe, db, deps);
  registerSparePartsIpc(handleSafe);
  registerSdiIpc(handleSafe);
}

module.exports = { registerAllCrudIpc };
