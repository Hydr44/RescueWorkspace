// src/lib/permissions.js
// Sistema permessi granulari per RescueManager SaaS
// Ruoli: owner > admin > manager > operator > viewer

/**
 * Gerarchia ruoli (dal più alto al più basso)
 */
export const ROLES = {
  owner:    { level: 100, label: "Proprietario",  color: "red",     desc: "Accesso completo, gestione billing e eliminazione org" },
  admin:    { level: 80,  label: "Amministratore", color: "purple",  desc: "Gestione team, impostazioni azienda, tutti i moduli" },
  manager:  { level: 60,  label: "Responsabile",   color: "blue",    desc: "Gestione operativa, fatture, clienti, trasporti" },
  operator: { level: 40,  label: "Operatore",      color: "emerald", desc: "Operazioni quotidiane, inserimento dati" },
  viewer:   { level: 20,  label: "Visualizzatore",  color: "slate",   desc: "Solo lettura, nessuna modifica" },
};

export const ROLE_OPTIONS = Object.entries(ROLES).map(([key, val]) => ({
  value: key,
  label: val.label,
  desc: val.desc,
  color: val.color,
  level: val.level,
}));

/**
 * Permessi per area funzionale
 * Ogni permesso ha un livello minimo richiesto
 */
const PERMISSIONS = {
  // Settings tabs
  "settings.profile":        20,  // tutti
  "settings.organization":   40,  // operator+
  "settings.company":        80,  // admin+
  "settings.team":           80,  // admin+
  "settings.billing":       100,  // solo owner
  "settings.integrations":   80,  // admin+
  "settings.rifiuti":        60,  // manager+
  "settings.appearance":     40,  // operator+
  "settings.notifications":  20,  // tutti
  "settings.marketplace":    80,  // admin+
  "settings.data":           80,  // admin+
  "settings.general":        80,  // admin+
  "settings.security":       80,  // admin+
  "settings.templates":      60,  // manager+

  // Azioni team
  "team.invite":             80,  // admin+
  "team.remove":             80,  // admin+
  "team.changeRole":        100,  // solo owner (non puoi promuovere sopra il tuo livello)
  "team.view":               60,  // manager+

  // Fatture
  "invoices.create":         40,  // operator+
  "invoices.edit":           40,  // operator+
  "invoices.delete":         60,  // manager+
  "invoices.send_sdi":       60,  // manager+
  "invoices.view":           20,  // tutti

  // Trasporti
  "transports.create":       40,
  "transports.edit":         40,
  "transports.delete":       60,
  "transports.view":         20,

  // Clienti
  "clients.create":          40,
  "clients.edit":            40,
  "clients.delete":          60,
  "clients.view":            20,

  // Piazzale / Ricambi
  "yard.manage":             40,
  "spare_parts.manage":      40,

  // Demolizioni
  "demolitions.manage":      60,

  // Rifiuti RENTRI
  "rentri.manage":           60,

  // Dati & Export
  "data.export":             60,
  "data.import":             80,
  "data.backup":             80,

  // Org management
  "org.edit":                80,
  "org.delete":             100,
};

/**
 * Controlla se un ruolo ha un determinato permesso
 * @param {string|null} role - Ruolo utente (owner, admin, manager, operator, viewer)
 * @param {string} permission - Chiave permesso (es. "settings.team")
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  if (!role) return false;
  const roleInfo = ROLES[role.toLowerCase()];
  if (!roleInfo) return false;
  const requiredLevel = PERMISSIONS[permission];
  if (requiredLevel === undefined) return false;
  return roleInfo.level >= requiredLevel;
}

/**
 * Controlla se un ruolo è almeno di un certo livello
 * @param {string|null} role
 * @param {string} minRole - Ruolo minimo richiesto
 * @returns {boolean}
 */
export function hasRole(role, minRole) {
  if (!role) return false;
  const userLevel = ROLES[role.toLowerCase()]?.level ?? 0;
  const minLevel = ROLES[minRole.toLowerCase()]?.level ?? 999;
  return userLevel >= minLevel;
}

/**
 * Ritorna il livello numerico di un ruolo
 */
export function roleLevel(role) {
  return ROLES[(role || "").toLowerCase()]?.level ?? 0;
}

/**
 * Ritorna label e colore per un ruolo
 */
export function roleInfo(role) {
  return ROLES[(role || "").toLowerCase()] || ROLES.viewer;
}

/**
 * Filtra una lista di tab/sezioni in base al ruolo
 * @param {Array<{key: string, requiredPermission?: string}>} tabs
 * @param {string|null} role
 * @returns {Array} tab visibili
 */
export function filterTabsByRole(tabs, role) {
  return tabs.filter(tab => {
    if (!tab.requiredPermission) return true;
    return hasPermission(role, tab.requiredPermission);
  });
}

/**
 * Ruoli che un dato ruolo può assegnare (non puoi promuovere sopra il tuo livello)
 */
export function assignableRoles(currentRole) {
  const myLevel = roleLevel(currentRole);
  return ROLE_OPTIONS.filter(r => r.level < myLevel);
}
