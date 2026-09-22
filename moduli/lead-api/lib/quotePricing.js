/**
 * Calcolo prezzi preventivo — unica fonte per POST/PUT quotes.
 *
 * Modello:
 *  - Canone mensile di listino = piano + moduli speciali + personalizzazioni + pacchetti mensili
 *  - Sconto % → si applica SOLO al canone (mai alle voci una tantum)
 *  - Canone annuale = canone mensile scontato × 12 × (1 − 10%) (pagamento anticipato)
 *  - Una tantum = setup + pacchetti una tantum (prezzo pieno)
 *
 * Pacchetti (colonna lead_quotes.packages, jsonb):
 *  { key, name, description?, billing: 'one_time'|'monthly'|'note', price, quantity }
 *  'note' = voce informativa senza importo (es. visure PRA a consumo).
 */

const DEFAULT_PRICING = {
  plans: {
    starter: 179,
    professional: 279,
    business: 359,
    full: 449,
    // legacy
    flotta: 98.99,
    enterprise: 149.99,
    custom: 0,
  },
  special_modules: {
    rvfu: 29.99,
    rentri: 29.99,
    fatturazione: 19.99,
  },
  yearly_discount: 0.10,
  biennial_discount: 0.15,
};

const PACKAGE_BILLINGS = new Set(['one_time', 'monthly', 'note']);

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Normalizza l'array pacchetti in input (scarta voci senza nome, sanifica numeri). */
function normalizePackages(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => {
      if (!p || typeof p !== 'object') return null;
      const name = String(p.name || '').trim();
      if (!name) return null;
      const billing = PACKAGE_BILLINGS.has(p.billing) ? p.billing : 'one_time';
      return {
        key: String(p.key || 'custom'),
        name,
        description: p.description ? String(p.description).trim() : '',
        billing,
        price: billing === 'note' ? 0 : round2(Math.max(0, num(p.price))),
        quantity: billing === 'note' ? 1 : Math.max(1, Math.round(num(p.quantity, 1))),
      };
    })
    .filter(Boolean);
}

function packageLineTotal(p) {
  if (p.billing === 'note') return 0;
  return round2(num(p.price) * Math.max(1, num(p.quantity, 1)));
}

/**
 * @param {object} q  campi del preventivo (input POST/PUT già uniti all'esistente)
 * @returns {object} colonne calcolate da salvare
 */
function computeQuoteTotals(q) {
  const planType = q.plan_type || 'custom';
  const basePrice = q.custom_base_price !== undefined && q.custom_base_price !== null
    ? num(q.custom_base_price)
    : num(DEFAULT_PRICING.plans[planType], 0);

  const specialModules = Array.isArray(q.special_modules) ? q.special_modules : [];
  let specialModulesPrice = 0;
  for (const mod of specialModules) {
    if (mod === 'rvfu') specialModulesPrice += q.custom_rvfu_price ?? DEFAULT_PRICING.special_modules.rvfu;
    else if (mod === 'rentri') specialModulesPrice += q.custom_rentri_price ?? DEFAULT_PRICING.special_modules.rentri;
    else if (mod === 'fatturazione') specialModulesPrice += q.custom_fatturazione_price ?? DEFAULT_PRICING.special_modules.fatturazione;
  }
  specialModulesPrice = num(specialModulesPrice);

  const customizationsPrice = num(q.customizations_price);
  const packages = normalizePackages(q.packages);
  const packagesMonthly = round2(packages.filter((p) => p.billing === 'monthly').reduce((s, p) => s + packageLineTotal(p), 0));
  const packagesOneTime = round2(packages.filter((p) => p.billing === 'one_time').reduce((s, p) => s + packageLineTotal(p), 0));

  const discountPercent = Math.min(100, Math.max(0, num(q.discount_percent)));
  const monthlySubtotal = round2(basePrice + specialModulesPrice + customizationsPrice + packagesMonthly);
  const discountAmount = round2((monthlySubtotal * discountPercent) / 100);
  const monthlyTotal = round2(monthlySubtotal - discountAmount);
  const yearlyTotal = round2(monthlyTotal * 12 * (1 - DEFAULT_PRICING.yearly_discount));
  const biennialTotal = round2(monthlyTotal * 24 * (1 - DEFAULT_PRICING.biennial_discount));

  const setupFee = round2(Math.max(0, num(q.setup_fee)));
  const oneTimeTotal = round2(setupFee + packagesOneTime);

  return {
    base_price: round2(basePrice),
    special_modules_price: round2(specialModulesPrice),
    customizations_price: round2(customizationsPrice),
    discount_percent: discountPercent,
    discount_amount: discountAmount,
    monthly_total: monthlyTotal,
    yearly_total: yearlyTotal,
    setup_fee: setupFee,
    packages,
    one_time_total: oneTimeTotal,
    // Derivati (non salvati, utili a PDF/email)
    _monthly_subtotal: monthlySubtotal,
    _packages_monthly: packagesMonthly,
    _packages_one_time: packagesOneTime,
    _biennial_total: biennialTotal,
  };
}

/** Importo del periodo contrattuale (mensile/annuale/biennale) del canone scontato. */
function recurringForContract(quote) {
  const monthly = num(quote.monthly_total);
  if (quote.contract_duration === 'yearly') return num(quote.yearly_total) || round2(monthly * 12 * (1 - DEFAULT_PRICING.yearly_discount));
  if (quote.contract_duration === 'biennial') return round2(monthly * 24 * (1 - DEFAULT_PRICING.biennial_discount));
  return monthly;
}

module.exports = {
  DEFAULT_PRICING,
  normalizePackages,
  packageLineTotal,
  computeQuoteTotals,
  recurringForContract,
  round2,
};
