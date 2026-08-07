/**
 * Dataset condiviso: dati realistici e coerenti usati in tutte le scene,
 * così il racconto è continuo (stesso cliente, targa, autista, prezzi...).
 */

export const ORG = {
  name: "Autosoccorso Bianchi SRL",
  initials: "AB",
  plan: "Full",
  piva: "01234567890",
  operator: "Marco Bianchi",
  operatorInitials: "MB",
};

export const DRIVER = {
  name: "Luca Ferrari",
  initials: "LF",
  vehicle: "Iveco Daily — Carro attrezzi",
  plate: "GH456KL",
};

// --- Soccorso stradale ---
export const SOCCORSO = {
  number: "TR0042",
  type: "Soccorso Stradale",
  client: "Giulia Conti",
  phone: "+39 340 118 2245",
  intervento: "Traino",
  motivo: "Panne meccanica",
  targa: "EJ204RT",
  modello: "Volkswagen Golf",
  convenzione: "ACI",
  pratica: "ACI-2026-4471",
  partenza: "A14 uscita Ancona Nord",
  arrivo: "Officina Centrale, Via Marconi 12 — Ancona",
  km: 18,
  prezzo: "€ 148,00",
  eta: "12 min",
  distanza: "3,4 km",
};

// --- Demolizione / VFU ---
export const VFU = {
  id: "VFU-2026-000318",
  targa: "FH582NX",
  telaio: "ZFA31200003219477",
  tipo: "Autoveicolo",
  pra: true,
  marca: "Fiat Panda 1.2",
  intestatario: "Rossi Mario",
  causale: "SD — Demolizione",
  pesoIngresso: 980,
  pesoCarcassa: 720,
  cerCarico: "16 01 04*",
};

/**
 * Fasi lavorazione VFU realmente VISIBILI nella pipeline dell'app
 * (le fasi smontaggio/pesatura/radiazione sono in HIDDEN_STEP_CODES:
 * gestite dal wizard Spedizione FIFO, non mostrate qui).
 */
export const VFU_STEPS = [
  { code: "accettazione", label: "Accettazione", icon: "truck", days: null },
  { code: "messa_in_sicurezza", label: "Messa in sicurezza", icon: "shield", days: 3 },
  { code: "bonifica", label: "Bonifica ambientale", icon: "droplet", days: 5 },
  { code: "fatturazione", label: "Fatturazione", icon: "euro", days: null },
  { code: "completato", label: "Completato", icon: "checkCircle", days: null },
] as const;

// --- Anagrafica: nuovo cliente (azienda / officina convenzionata) ---
export const CLIENTE = {
  tipo: "Azienda",
  ragioneSociale: "Officina Meccanica Adriatica SRL",
  piva: "02765430889",
  cf: "02765430889",
  sdi: "M5UXCR1",
  pec: "adriatica@pec.it",
  email: "amministrazione@officinaadriatica.it",
  telefono: "+39 071 2841 556",
  referente: "Andrea Marchetti",
  indirizzo: "Via dell'Industria 24",
  citta: "Ancona (AN)",
  cap: "60131",
  convenzione: "Officina — sconto 10%",
};

// --- Magazzino ricambi: nuovo ricambio + righe esistenti ---
export const RICAMBIO = {
  codice: "1K0615301AA",
  descrizione: "Disco freno anteriore ventilato Ø312",
  categoria: "Freni",
  ubicazione: "Scaffale B-12",
  quantita: 8,
  prezzoAcq: "€ 32,50",
  prezzoVen: "€ 58,00",
  compatibile: "VW Golf VII · Audi A3 8V",
  marca: "Brembo",
};

export const MAGAZZINO = [
  { codice: "5Q0615601B", desc: "Pastiglie freno posteriori", ubi: "B-08", qta: 14, prezzo: "€ 41,00" },
  { codice: "04E115561H", desc: "Filtro olio motore", ubi: "A-03", qta: 26, prezzo: "€ 9,90" },
  { codice: "1J0129620", desc: "Filtro aria abitacolo", ubi: "A-05", qta: 11, prezzo: "€ 14,50" },
] as const;

// --- Contabilità: movimento di prima nota + saldi + ultimi movimenti ---
export const MOVIMENTO = {
  tipo: "Incasso",
  conto: "Banca — Intesa Sanpaolo",
  data: "04/08/2026",
  importo: "€ 180,56",
  cliente: "Giulia Conti",
  causale: "Incasso fattura 128/2026 — soccorso TR0042",
  metodo: "Bonifico",
};

export const SALDI = {
  cassaPrima: "€ 1.240,00",
  bancaPrima: "€ 18.430,20",
  bancaDopo: "€ 18.610,76",
};

export const PRIMA_NOTA = [
  { data: "03/08", causale: "Pagamento carburante flotta", conto: "Cassa", segno: "-", importo: "€ 90,00" },
  { data: "02/08", causale: "Incasso fattura 126/2026", conto: "Banca", segno: "+", importo: "€ 305,00" },
  { data: "01/08", causale: "Canone RENTRI", conto: "Banca", segno: "-", importo: "€ 12,20" },
] as const;

/** CER prodotti dalla bonifica (esplosione reale). */
export const VFU_CER = [
  { code: "16 01 07*", label: "Filtri dell'olio", danger: true },
  { code: "16 06 01*", label: "Batterie al piombo", danger: true },
  { code: "13 02 05*", label: "Oli minerali motore", danger: true },
  { code: "16 01 13*", label: "Liquidi per freni", danger: true },
  { code: "16 01 14*", label: "Antigelo pericoloso", danger: true },
  { code: "16 01 03", label: "Pneumatici fuori uso", danger: false },
  { code: "16 01 17", label: "Metalli ferrosi", danger: false },
  { code: "16 01 20", label: "Vetro", danger: false },
] as const;
