/**
 * VFU State Machine - Gestione stati e transizioni workflow RVFU
 * 
 * Stati VFU:
 * - INSERITO: VFU appena registrato
 * - CONFERITO: Concessionario ha conferito a CR
 * - PRESO_IN_CARICO: CR ha preso in carico
 * - DA_RADIARE: Pronto per radiazione
 * - INVIATO_A_STA: Inviato a STA per radiazione
 * - IN_RADIAZIONE: STA ha preso in carico
 * - RADIATO: Radiato dal PRA
 * - DEMOLITO: Demolizione completata
 * - ANNULLATO: Annullato
 * - CEDUTO: Ceduto ad altro CR
 * - TRASFERITO: Trasferito
 * - VALIDATO: Validato
 */

/**
 * Normalizza lo stato VFU dal formato API ACI (con spazi e info aggiuntive)
 * al formato interno (con underscore, senza suffissi).
 * 
 * Es: "PRESO IN CARICO" → "PRESO_IN_CARICO"
 *     "CONFERITO da 02136780984" → "CONFERITO"
 *     "TRASFERITO a 12345678903" → "TRASFERITO"
 *     "INVIATO A STA" → "INVIATO_A_STA"
 */
export function normalizeStato(raw: string | null | undefined): string {
  if (!raw) return '';
  let s = raw.trim().toUpperCase();

  // Rimuovi suffissi " da ..." e " a ..." (es. CONFERITO da CF, TRASFERITO a CF)
  s = s.replace(/\s+(DA|A)\s+[A-Z0-9]+$/i, '');

  // Mappa spazi → underscore per i noti
  const SPACE_MAP: Record<string, string> = {
    'PRESO IN CARICO': 'PRESO_IN_CARICO',
    'DA RADIARE': 'DA_RADIARE',
    'INVIATO A STA': 'INVIATO_A_STA',
    'IN RADIAZIONE': 'IN_RADIAZIONE',
  };

  return SPACE_MAP[s] || s.replace(/\s+/g, '_');
}

export type VFUStato = 
  | 'INSERITO'
  | 'CONFERITO'
  | 'PRESO_IN_CARICO'
  | 'DA_RADIARE'
  | 'INVIATO_A_STA'
  | 'IN_RADIAZIONE'
  | 'RADIATO'
  | 'DEMOLITO'
  | 'ANNULLATO'
  | 'CEDUTO'
  | 'TRASFERITO'
  | 'VALIDATO';

export type VFUAzione = 
  | 'registra'
  | 'aggiorna'
  | 'annulla'
  | 'conferisci'
  | 'prendiInCarico'
  | 'chiudiFascicolo'
  | 'inoltraSTA'
  | 'confermaRadiazione'
  | 'generaCDR'
  | 'generaRicevuta'
  | 'demolisci'
  | 'cedi'
  | 'trasferisci'
  | 'allegaDocumento'
  | 'riapriFascicolo'
  | 'annullaInoltroSTA'
  | 'verificaVFU'
  | 'integra';

export interface AzioneDisponibile {
  azione: VFUAzione;
  label: string;
  descrizione: string;
  icon?: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  requiresConfirm?: boolean;
  modalType?: 'simple' | 'form' | 'selection';
}

export interface TransizioneStato {
  daStato: VFUStato[];
  aStato: VFUStato;
  azione: VFUAzione;
  descrizione: string;
}

// Mappa transizioni
export const TRANSIZIONI: TransizioneStato[] = [
  { daStato: ['INSERITO'], aStato: 'ANNULLATO', azione: 'annulla', descrizione: 'Annulla VFU prima del conferimento' },
  { daStato: ['INSERITO'], aStato: 'CONFERITO', azione: 'conferisci', descrizione: 'Conferisci VFU a CR (Concessionario)' },
  { daStato: ['CONFERITO'], aStato: 'PRESO_IN_CARICO', azione: 'prendiInCarico', descrizione: 'Prendi in carico VFU conferito' },
  { daStato: ['PRESO_IN_CARICO', 'DA_RADIARE'], aStato: 'INVIATO_A_STA', azione: 'inoltraSTA', descrizione: 'Inoltra a STA per radiazione' },
  { daStato: ['INVIATO_A_STA'], aStato: 'DA_RADIARE', azione: 'annullaInoltroSTA', descrizione: 'Annulla inoltro a STA' },
  { daStato: ['INVIATO_A_STA'], aStato: 'IN_RADIAZIONE', azione: 'confermaRadiazione', descrizione: 'STA conferma radiazione (automatico)' },
  { daStato: ['IN_RADIAZIONE'], aStato: 'RADIATO', azione: 'confermaRadiazione', descrizione: 'Conferma radiazione completata' },
  { daStato: ['PRESO_IN_CARICO'], aStato: 'VALIDATO', azione: 'verificaVFU', descrizione: 'Verifica VFU (fascicolo chiuso) → VALIDATO' },
  { daStato: ['VALIDATO', 'RADIATO'], aStato: 'DEMOLITO', azione: 'demolisci', descrizione: 'Segna come demolito' },
  { daStato: ['PRESO_IN_CARICO'], aStato: 'CEDUTO', azione: 'cedi', descrizione: 'Cedi VFU ad altro soggetto' },
  { daStato: ['PRESO_IN_CARICO'], aStato: 'TRASFERITO', azione: 'trasferisci', descrizione: 'Trasferisci VFU ad altra sede' },
];

/**
 * Ottiene le azioni disponibili per uno stato VFU
 */
export function getAzioniDisponibili(stato: string | null | undefined, fascicoloStato?: string): AzioneDisponibile[] {
  if (!stato) return [];
  
  const statoNorm = normalizeStato(stato);
  const azioni: AzioneDisponibile[] = [];

  // Azioni disponibili per ogni stato
  switch (statoNorm) {
    case 'INSERITO':
      azioni.push({
        azione: 'aggiorna',
        label: 'Modifica dati',
        descrizione: 'Aggiorna i dati del VFU',
        icon: 'FiEdit',
        variant: 'info',
      });
      azioni.push({
        azione: 'allegaDocumento',
        label: 'Allega documento',
        descrizione: 'Allega un documento al fascicolo',
        icon: 'FiPaperclip',
        variant: 'info',
      });
      azioni.push({
        azione: 'chiudiFascicolo',
        label: 'Chiudi fascicolo',
        descrizione: 'Chiudi il fascicolo per procedere con radiazione',
        icon: 'FiCheckCircle',
        variant: 'success',
        requiresConfirm: true,
      });
      azioni.push({
        azione: 'generaRicevuta',
        label: 'Genera ricevuta',
        descrizione: 'Genera ricevuta di presa in carico (PDF per cliente)',
        icon: 'FiFileText',
        variant: 'primary',
      });
      azioni.push({
        azione: 'annulla',
        label: 'Annulla VFU',
        descrizione: 'Annulla il VFU',
        icon: 'FiX',
        variant: 'danger',
        requiresConfirm: true,
        modalType: 'form',
      });
      break;

    case 'CONFERITO':
      azioni.push({
        azione: 'prendiInCarico',
        label: 'Prendi in carico',
        descrizione: 'Prendi in carico il VFU conferito',
        icon: 'FiTruck',
        variant: 'success',
        modalType: 'form',
      });
      break;

    case 'PRESO_IN_CARICO':
      azioni.push({
        azione: 'generaRicevuta',
        label: 'Genera ricevuta',
        descrizione: 'Genera ricevuta di presa in carico (PDF per cliente)',
        icon: 'FiFileText',
        variant: 'primary',
      });
      azioni.push({
        azione: 'generaCDR',
        label: 'Genera CDR',
        descrizione: 'Genera Certificato Di Rottamazione',
        icon: 'FiAward',
        variant: 'primary',
      });
      azioni.push({
        azione: 'allegaDocumento',
        label: 'Allega documento',
        descrizione: 'Allega un documento al fascicolo',
        icon: 'FiPaperclip',
        variant: 'info',
      });
      azioni.push({
        azione: 'chiudiFascicolo',
        label: 'Chiudi fascicolo',
        descrizione: 'Chiudi il fascicolo (richiede CDR + ricevuta)',
        icon: 'FiCheckCircle',
        variant: 'success',
        requiresConfirm: true,
      });
      azioni.push({
        azione: 'verificaVFU',
        label: 'Verifica VFU',
        descrizione: 'Verifica VFU per validazione (richiede fascicolo chiuso)',
        icon: 'FiCheckCircle',
        variant: 'success',
        requiresConfirm: true,
      });
      azioni.push({
        azione: 'aggiorna',
        label: 'Modifica dati',
        descrizione: 'Aggiorna i dati del VFU (es. dataBonifica)',
        icon: 'FiEdit',
        variant: 'info',
        requiresConfirm: true,
        modalType: 'form',
      });
      azioni.push({
        azione: 'annulla',
        label: 'Annulla VFU',
        descrizione: 'Annulla il VFU',
        icon: 'FiX',
        variant: 'danger',
        requiresConfirm: true,
        modalType: 'form',
      });
      azioni.push({
        azione: 'cedi',
        label: 'Cedi VFU',
        descrizione: 'Cedi il VFU ad altro soggetto',
        icon: 'FiUserPlus',
        variant: 'info',
        modalType: 'form',
      });
      azioni.push({
        azione: 'trasferisci',
        label: 'Trasferisci VFU',
        descrizione: 'Trasferisci a altra sede',
        icon: 'FiShuffle',
        variant: 'info',
        modalType: 'selection',
      });
      break;

    case 'DA_RADIARE':
      azioni.push({
        azione: 'inoltraSTA',
        label: 'Inoltra a STA',
        descrizione: 'Inoltra a STA per radiazione PRA',
        icon: 'FiSend',
        variant: 'primary',
        requiresConfirm: true,
        modalType: 'selection',
      });
      break;

    case 'INVIATO_A_STA':
      azioni.push({
        azione: 'annullaInoltroSTA',
        label: 'Annulla inoltro STA',
        descrizione: 'Annulla l\'inoltro a STA',
        icon: 'FiX',
        variant: 'warning',
        requiresConfirm: true,
      });
      break;

    case 'IN_RADIAZIONE':
      azioni.push({
        azione: 'confermaRadiazione',
        label: 'Conferma radiazione',
        descrizione: 'Conferma che la radiazione è completata',
        icon: 'FiCheckCircle',
        variant: 'success',
        requiresConfirm: true,
      });
      break;

    case 'RADIATO':
      azioni.push({
        azione: 'generaCDR',
        label: 'Genera CDR',
        descrizione: 'Genera Certificato Di Rottamazione (PDF per cliente)',
        icon: 'FiAward',
        variant: 'primary',
      });
      azioni.push({
        azione: 'demolisci',
        label: 'Segna come demolito',
        descrizione: 'Segna il veicolo come demolito',
        icon: 'FiTrash2',
        variant: 'warning',
        modalType: 'form',
      });
      break;

    case 'DEMOLITO':
      azioni.push({
        azione: 'inoltraSTA',
        label: 'Inoltra a STA',
        descrizione: 'Inoltra a STA per radiazione PRA (solo veicoli PRA)',
        icon: 'FiSend',
        variant: 'primary',
        requiresConfirm: true,
        modalType: 'selection',
      });
      break;

    case 'VALIDATO':
      azioni.push({
        azione: 'demolisci',
        label: 'Segna come demolito',
        descrizione: 'Registra la demolizione del veicolo',
        icon: 'FiTrash2',
        variant: 'warning',
        requiresConfirm: true,
        modalType: 'form',
      });
      azioni.push({
        azione: 'generaCDR',
        label: 'Genera CDR',
        descrizione: 'Genera Certificato Di Rottamazione (se non ancora generato)',
        icon: 'FiAward',
        variant: 'primary',
      });
      azioni.push({
        azione: 'generaRicevuta',
        label: 'Genera ricevuta',
        descrizione: 'Genera ricevuta di presa in carico',
        icon: 'FiFileText',
        variant: 'info',
      });
      azioni.push({
        azione: 'aggiorna',
        label: 'Modifica dati',
        descrizione: 'Aggiorna i dati del VFU',
        icon: 'FiEdit',
        variant: 'info',
        requiresConfirm: true,
        modalType: 'form',
      });
      break;

    case 'ANNULLATO':
    case 'CEDUTO':
    case 'TRASFERITO':
      // Stati terminali - nessuna azione standard
      break;
  }

  // Azioni fascicolo
  if (fascicoloStato === 'CHIUSO' && ['INSERITO', 'PRESO_IN_CARICO'].includes(statoNorm)) {
    azioni.push({
      azione: 'riapriFascicolo',
      label: 'Riapri fascicolo',
      descrizione: 'Riapri il fascicolo per modifiche',
      icon: 'FiUnlock',
      variant: 'warning',
      requiresConfirm: true,
    });
  }

  return azioni;
}

/**
 * Verifica se un'azione è disponibile per uno stato
 */
export function isAzioneDisponibile(stato: string | null | undefined, azione: VFUAzione): boolean {
  const azioni = getAzioniDisponibili(stato);
  return azioni.some(a => a.azione === azione);
}

export interface StatoColorClasses {
  bg: string;
  bgLight: string;
  text: string;
  border: string;
  ring: string;
  badge: string;
  name: string;
}

const STATO_COLORS: Record<string, StatoColorClasses> = {
  INSERITO: {
    bg: 'bg-blue-600', bgLight: 'bg-blue-600/20', text: 'text-blue-400',
    border: 'border-blue-500/30', ring: 'ring-blue-500',
    badge: 'bg-blue-600/20 text-blue-400 border border-blue-500/30', name: 'blue',
  },
  CONFERITO: {
    bg: 'bg-cyan-600', bgLight: 'bg-cyan-600/20', text: 'text-cyan-400',
    border: 'border-cyan-500/30', ring: 'ring-cyan-500',
    badge: 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30', name: 'cyan',
  },
  PRESO_IN_CARICO: {
    bg: 'bg-indigo-600', bgLight: 'bg-indigo-600/20', text: 'text-indigo-400',
    border: 'border-indigo-500/30', ring: 'ring-indigo-500',
    badge: 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30', name: 'indigo',
  },
  DA_RADIARE: {
    bg: 'bg-purple-600', bgLight: 'bg-purple-600/20', text: 'text-purple-400',
    border: 'border-purple-500/30', ring: 'ring-purple-500',
    badge: 'bg-purple-600/20 text-purple-400 border border-purple-500/30', name: 'purple',
  },
  INVIATO_A_STA: {
    bg: 'bg-violet-600', bgLight: 'bg-violet-600/20', text: 'text-violet-400',
    border: 'border-violet-500/30', ring: 'ring-violet-500',
    badge: 'bg-violet-600/20 text-violet-400 border border-violet-500/30', name: 'violet',
  },
  IN_RADIAZIONE: {
    bg: 'bg-fuchsia-600', bgLight: 'bg-fuchsia-600/20', text: 'text-fuchsia-400',
    border: 'border-fuchsia-500/30', ring: 'ring-fuchsia-500',
    badge: 'bg-fuchsia-600/20 text-fuchsia-400 border border-fuchsia-500/30', name: 'fuchsia',
  },
  RADIATO: {
    bg: 'bg-green-600', bgLight: 'bg-green-600/20', text: 'text-green-400',
    border: 'border-green-500/30', ring: 'ring-green-500',
    badge: 'bg-green-600/20 text-green-400 border border-green-500/30', name: 'green',
  },
  DEMOLITO: {
    bg: 'bg-emerald-600', bgLight: 'bg-emerald-600/20', text: 'text-emerald-400',
    border: 'border-emerald-500/30', ring: 'ring-emerald-500',
    badge: 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30', name: 'emerald',
  },
  ANNULLATO: {
    bg: 'bg-red-600', bgLight: 'bg-red-600/20', text: 'text-red-400',
    border: 'border-red-500/30', ring: 'ring-red-500',
    badge: 'bg-red-600/20 text-red-400 border border-red-500/30', name: 'red',
  },
  CEDUTO: {
    bg: 'bg-orange-600', bgLight: 'bg-orange-600/20', text: 'text-orange-400',
    border: 'border-orange-500/30', ring: 'ring-orange-500',
    badge: 'bg-orange-600/20 text-orange-400 border border-orange-500/30', name: 'orange',
  },
  TRASFERITO: {
    bg: 'bg-amber-600', bgLight: 'bg-amber-600/20', text: 'text-amber-400',
    border: 'border-amber-500/30', ring: 'ring-amber-500',
    badge: 'bg-amber-600/20 text-amber-400 border border-amber-500/30', name: 'amber',
  },
  VALIDATO: {
    bg: 'bg-teal-600', bgLight: 'bg-teal-600/20', text: 'text-teal-400',
    border: 'border-teal-500/30', ring: 'ring-teal-500',
    badge: 'bg-teal-600/20 text-teal-400 border border-teal-500/30', name: 'teal',
  },
};

const DEFAULT_COLORS: StatoColorClasses = {
  bg: 'bg-gray-600', bgLight: 'bg-gray-600/20', text: 'text-gray-400',
  border: 'border-gray-500/30', ring: 'ring-gray-500',
  badge: 'bg-gray-600/20 text-gray-400 border border-gray-500/30', name: 'gray',
};

/**
 * Ottiene le classi CSS statiche per uno stato (safe per Tailwind purging)
 */
export function getStatoColors(stato: string | null | undefined): StatoColorClasses {
  if (!stato) return DEFAULT_COLORS;
  const statoNorm = normalizeStato(stato);
  return STATO_COLORS[statoNorm] || DEFAULT_COLORS;
}

/**
 * Ottiene il badge color per uno stato (backward compat — restituisce il nome colore)
 */
export function getStatoBadgeColor(stato: string | null | undefined): string {
  return getStatoColors(stato).name;
}

/**
 * Ottiene la label italiana per uno stato
 */
export function getStatoLabel(stato: string | null | undefined): string {
  if (!stato) return 'N/A';
  
  const statoNorm = normalizeStato(stato);
  
  const labels: Record<string, string> = {
    INSERITO: 'Inserito',
    CONFERITO: 'Conferito',
    PRESO_IN_CARICO: 'Preso in carico',
    DA_RADIARE: 'Da radiare',
    INVIATO_A_STA: 'Inviato a STA',
    IN_RADIAZIONE: 'In radiazione',
    RADIATO: 'Radiato',
    DEMOLITO: 'Demolito',
    ANNULLATO: 'Annullato',
    CEDUTO: 'Ceduto',
    TRASFERITO: 'Trasferito',
    VALIDATO: 'Validato',
  };
  
  return labels[statoNorm] || stato;
}

/**
 * Ottiene lo step del workflow (0-100)
 */
export function getWorkflowProgress(stato: string | null | undefined): number {
  if (!stato) return 0;
  
  const statoNorm = normalizeStato(stato);
  
  const progressMap: Record<string, number> = {
    INSERITO: 10,
    CONFERITO: 15,
    PRESO_IN_CARICO: 25,
    VALIDATO: 35,
    DA_RADIARE: 45,
    INVIATO_A_STA: 60,
    IN_RADIAZIONE: 70,
    RADIATO: 85,
    DEMOLITO: 100,
    ANNULLATO: 0,
    CEDUTO: 50,
    TRASFERITO: 50,
  };
  
  return progressMap[statoNorm] || 0;
}

/**
 * Ottiene i passi del workflow con indicazione dello step corrente
 */
export function getWorkflowSteps(statoCorrente: string | null | undefined) {
  const statoNorm = statoCorrente ? normalizeStato(statoCorrente) : '';
  
  const steps = [
    { stato: 'INSERITO', label: 'Inserito', order: 1 },
    { stato: 'PRESO_IN_CARICO', label: 'In carico', order: 2 },
    { stato: 'DA_RADIARE', label: 'Da radiare', order: 3 },
    { stato: 'INVIATO_A_STA', label: 'Inviato STA', order: 4 },
    { stato: 'RADIATO', label: 'Radiato', order: 5 },
    { stato: 'DEMOLITO', label: 'Demolito', order: 6 },
  ];
  
  const currentIndex = steps.findIndex(s => s.stato === statoNorm);
  
  return steps.map((step, idx) => ({
    ...step,
    isCurrent: step.stato === statoNorm,
    isCompleted: currentIndex >= 0 && idx < currentIndex,
    isPending: currentIndex >= 0 && idx > currentIndex,
  }));
}
