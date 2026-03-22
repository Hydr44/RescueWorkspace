// src/lib/plans.js
/**
 * Configurazione piani RescueManager v2.4.1
 * 
 * Piani: Starter, Professional, Business, Full
 * Moduli: SDI, RVFU, RENTRI, Contabilità
 */

export const PLANS = {
  starter: {
    id: "starter",
    label: "Starter",
    monthlyPrice: 179,
    yearlyPrice: 1800,
    maxModules: 1,
    description: "Base completo + 1 modulo a scelta",
    color: "blue",
  },
  professional: {
    id: "professional",
    label: "Professional",
    monthlyPrice: 279,
    yearlyPrice: 2800,
    maxModules: 2,
    description: "Base completo + 2 moduli a scelta",
    color: "indigo",
  },
  business: {
    id: "business",
    label: "Business",
    monthlyPrice: 359,
    yearlyPrice: 3600,
    maxModules: 3,
    description: "Base completo + 3 moduli a scelta",
    color: "purple",
  },
  full: {
    id: "full",
    label: "Full",
    monthlyPrice: 449,
    yearlyPrice: 4500,
    maxModules: 4,
    description: "Base completo + tutti i moduli inclusi",
    color: "emerald",
  },
};

export const MODULES = {
  sdi: {
    id: "sdi",
    label: "Fatturazione Elettronica SDI",
    shortLabel: "SDI",
    description: "Invio e ricezione fatture elettroniche via SDI-SFTP",
    icon: "FiFileText",
  },
  rvfu: {
    id: "rvfu",
    label: "Registro Veicoli Fuori Uso (MIT)",
    shortLabel: "RVFU",
    description: "Integrazione API MIT per demolizioni veicoli",
    icon: "FiTruck",
  },
  rentri: {
    id: "rentri",
    label: "Registro Elettronico Tracciabilità Rifiuti",
    shortLabel: "RENTRI",
    description: "Registri, FIR, MUD e sincronizzazione portale RENTRI",
    icon: "FiShield",
  },
  contabilita: {
    id: "contabilita",
    label: "Contabilità",
    shortLabel: "Contabilità",
    description: "Prima nota, piano dei conti e partita doppia",
    icon: "FiDollarSign",
  },
};

export const SUBSCRIPTION_STATUS = {
  active: { label: "Attivo", color: "emerald" },
  trial: { label: "Trial", color: "amber" },
  past_due: { label: "Scaduto", color: "red" },
  canceled: { label: "Cancellato", color: "red" },
  expired: { label: "Scaduto", color: "red" },
  inactive: { label: "Inattivo", color: "slate" },
};

/**
 * Controlla se un abbonamento è valido (attivo o trial non scaduto)
 */
export function isSubscriptionValid(subscription) {
  if (!subscription) return false;

  const { status, current_period_end, trial_end } = subscription;

  // Status attivo
  if (status === "active") {
    if (current_period_end) {
      return new Date(current_period_end) > new Date();
    }
    return true;
  }

  // Trial
  if (status === "trial") {
    const end = trial_end || current_period_end;
    if (end) {
      return new Date(end) > new Date();
    }
    return true;
  }

  return false;
}

/**
 * Calcola giorni rimanenti
 */
export function daysRemaining(subscription) {
  if (!subscription) return 0;
  const end = subscription.current_period_end || subscription.trial_end;
  if (!end) return null;
  return Math.max(0, Math.ceil((new Date(end) - Date.now()) / 86400000));
}
