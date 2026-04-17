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
  | 'annullaInoltroSTA';

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
  { daStato: ['PRESO_IN_CARICO', 'RADIATO'], aStato: 'DEMOLITO', azione: 'demolisci', descrizione: 'Segna come demolito' },
  { daStato: ['PRESO_IN_CARICO'], aStato: 'CEDUTO', azione: 'cedi', descrizione: 'Cedi VFU ad altro soggetto' },
  { daStato: ['PRESO_IN_CARICO'], aStato: 'TRASFERITO', azione: 'trasferisci', descrizione: 'Trasferisci VFU ad altra sede' },
];

/**
 * Ottiene le azioni disponibili per uno stato VFU
 */
export function getAzioniDisponibili(stato: VFUStato | string | null | undefined, fascicoloStato?: string): AzioneDisponibile[] {
  if (!stato) return [];
  
  const statoNorm = (stato as string).toUpperCase();
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
        azione: 'allegaDocumento',
        label: 'Allega documento',
        descrizione: 'Allega un documento al fascicolo',
        icon: 'FiPaperclip',
        variant: 'info',
      });
      azioni.push({
        azione: 'chiudiFascicolo',
        label: 'Chiudi fascicolo',
        descrizione: 'Chiudi il fascicolo per procedere',
        icon: 'FiCheckCircle',
        variant: 'success',
        requiresConfirm: true,
      });
      azioni.push({
        azione: 'inoltraSTA',
        label: 'Inoltra a STA',
        descrizione: 'Inoltra a STA per radiazione PRA',
        icon: 'FiSend',
        variant: 'primary',
        requiresConfirm: true,
        modalType: 'selection',
      });
      azioni.push({
        azione: 'generaRicevuta',
        label: 'Genera ricevuta',
        descrizione: 'Genera ricevuta di presa in carico',
        icon: 'FiFileText',
        variant: 'info',
      });
      azioni.push({
        azione: 'demolisci',
        label: 'Segna come demolito',
        descrizione: 'Segna il veicolo come demolito',
        icon: 'FiTrash2',
        variant: 'warning',
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
      // Nessuna azione disponibile per VFU demoliti
      break;

    case 'ANNULLATO':
    case 'CEDUTO':
    case 'TRASFERITO':
    case 'VALIDATO':
      // Stati terminali o speciali - nessuna azione standard
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
export function isAzioneDisponibile(stato: VFUStato | string | null | undefined, azione: VFUAzione): boolean {
  const azioni = getAzioniDisponibili(stato);
  return azioni.some(a => a.azione === azione);
}

/**
 * Ottiene il badge color per uno stato
 */
export function getStatoBadgeColor(stato: VFUStato | string | null | undefined): string {
  if (!stato) return 'gray';
  
  const statoNorm = (stato as string).toUpperCase();
  
  switch (statoNorm) {
    case 'INSERITO':
      return 'blue';
    case 'CONFERITO':
      return 'cyan';
    case 'PRESO_IN_CARICO':
      return 'indigo';
    case 'DA_RADIARE':
      return 'purple';
    case 'INVIATO_A_STA':
      return 'violet';
    case 'IN_RADIAZIONE':
      return 'fuchsia';
    case 'RADIATO':
      return 'green';
    case 'DEMOLITO':
      return 'emerald';
    case 'ANNULLATO':
      return 'red';
    case 'CEDUTO':
      return 'orange';
    case 'TRASFERITO':
      return 'amber';
    case 'VALIDATO':
      return 'teal';
    default:
      return 'gray';
  }
}

/**
 * Ottiene la label italiana per uno stato
 */
export function getStatoLabel(stato: VFUStato | string | null | undefined): string {
  if (!stato) return 'N/A';
  
  const statoNorm = (stato as string).toUpperCase();
  
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
export function getWorkflowProgress(stato: VFUStato | string | null | undefined): number {
  if (!stato) return 0;
  
  const statoNorm = (stato as string).toUpperCase();
  
  const progressMap: Record<string, number> = {
    INSERITO: 10,
    CONFERITO: 20,
    PRESO_IN_CARICO: 30,
    DA_RADIARE: 40,
    INVIATO_A_STA: 50,
    IN_RADIAZIONE: 70,
    RADIATO: 85,
    DEMOLITO: 100,
    ANNULLATO: 0,
    CEDUTO: 50,
    TRASFERITO: 50,
    VALIDATO: 100,
  };
  
  return progressMap[statoNorm] || 0;
}

/**
 * Ottiene i passi del workflow con indicazione dello step corrente
 */
export function getWorkflowSteps(statoCorrente: VFUStato | string | null | undefined) {
  const statoNorm = statoCorrente ? (statoCorrente as string).toUpperCase() : '';
  
  const steps = [
    { stato: 'INSERITO', label: 'Inserito', order: 1 },
    { stato: 'PRESO_IN_CARICO', label: 'In carico', order: 2 },
    { stato: 'INVIATO_A_STA', label: 'Inviato STA', order: 3 },
    { stato: 'IN_RADIAZIONE', label: 'In radiazione', order: 4 },
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
