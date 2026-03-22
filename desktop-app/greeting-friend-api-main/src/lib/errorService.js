/**
 * ErrorService
 * Gestisce gli errori con codici e mostra ErrorDisplay automaticamente
 */

const ERROR_DATABASE = {
  // Database Errors
  'DB-SYNC-1001': {
    code: 'DB-SYNC-1001',
    title: 'Errore connessione database',
    message: 'Impossibile sincronizzare con il database',
    severity: 'high',
    solution: 'Verifica la connessione internet. Se il problema persiste, contatta il supporto.',
    docLink: 'https://rescuemanager.eu/prodotto/docs/errori#DB-SYNC-1001'
  },
  'DB-SYNC-1002': {
    code: 'DB-SYNC-1002',
    title: 'Timeout query database',
    message: 'La query al database ha superato il tempo limite',
    severity: 'medium',
    solution: 'Riprova l\'operazione. Se il problema persiste, chiudi e riapri l\'app.',
    docLink: 'https://rescuemanager.eu/prodotto/docs/errori#DB-SYNC-1002'
  },
  'DB-QUERY-1003': {
    code: 'DB-QUERY-1003',
    title: 'Query database non valida',
    message: 'La query inviata al database non è valida',
    severity: 'high',
    solution: 'Aggiorna l\'app all\'ultima versione disponibile dalla sezione Impostazioni.',
    docLink: 'https://rescuemanager.eu/prodotto/docs/errori#DB-QUERY-1003'
  },
  'DB-PERM-1004': {
    code: 'DB-PERM-1004',
    title: 'Permessi insufficienti',
    message: 'Non hai i permessi necessari per questa operazione',
    severity: 'critical',
    solution: 'Contatta l\'amministratore della tua organizzazione per ottenere i permessi necessari.',
    docLink: 'https://rescuemanager.eu/prodotto/docs/errori#DB-PERM-1004'
  },

  // OAuth Errors
  'OAUTH-AUTH-2001': {
    code: 'OAUTH-AUTH-2001',
    title: 'Token scaduto',
    message: 'Il token di autenticazione è scaduto',
    severity: 'medium',
    solution: 'Effettua di nuovo il login dal menu utente. La sessione scade dopo 1 ora di inattività.',
    docLink: 'https://rescuemanager.eu/prodotto/docs/errori#OAUTH-AUTH-2001'
  },
  'OAUTH-AUTH-2002': {
    code: 'OAUTH-AUTH-2002',
    title: 'Token non valido',
    message: 'Il token di autenticazione non è valido',
    severity: 'high',
    solution: 'Esegui logout dal menu utente e rieffettua il login.',
    docLink: 'https://rescuemanager.eu/prodotto/docs/errori#OAUTH-AUTH-2002'
  },
  'OAUTH-AUTH-2003': {
    code: 'OAUTH-AUTH-2003',
    title: 'Errore server OAuth',
    message: 'Il server di autenticazione è temporaneamente non disponibile',
    severity: 'high',
    solution: 'Riprova tra qualche minuto.',
    docLink: 'https://rescuemanager.eu/prodotto/docs/errori#OAUTH-AUTH-2003'
  },
  'OAUTH-CALL-2004': {
    code: 'OAUTH-CALL-2004',
    title: 'Callback OAuth fallito',
    message: 'Il callback di autenticazione non è riuscito',
    severity: 'medium',
    solution: 'Rimuovi la cache del browser e riprova il login.',
    docLink: 'https://rescuemanager.eu/prodotto/docs/errori#OAUTH-CALL-2004'
  },

  // Sync Errors
  'SYNC-PULL-3001': {
    code: 'SYNC-PULL-3001',
    title: 'Errore download dati',
    message: 'Impossibile scaricare i dati dal server',
    severity: 'medium',
    solution: 'Verifica la connessione internet. I dati rimangono salvati localmente.',
    docLink: 'https://rescuemanager.eu/prodotto/docs/errori#SYNC-PULL-3001'
  },
  'SYNC-PUSH-3002': {
    code: 'SYNC-PUSH-3002',
    title: 'Errore upload dati',
    message: 'Impossibile caricare i dati sul server',
    severity: 'high',
    solution: 'Riprova l\'upload. I dati sono salvati localmente.',
    docLink: 'https://rescuemanager.eu/prodotto/docs/errori#SYNC-PUSH-3002'
  },
  'SYNC-CONF-3003': {
    code: 'SYNC-CONF-3003',
    title: 'Conflitto dati',
    message: 'I dati locali entrano in conflitto con quelli del server',
    severity: 'high',
    solution: 'Contatta il supporto per risoluzione manuale.',
    docLink: 'https://rescuemanager.eu/prodotto/docs/errori#SYNC-CONF-3003'
  },
  'SYNC-NET-3004': {
    code: 'SYNC-NET-3004',
    title: 'Timeout sincronizzazione',
    message: 'La sincronizzazione ha superato il tempo limite',
    severity: 'medium',
    solution: 'Riprova più tardi o verifica la connessione.',
    docLink: 'https://rescuemanager.eu/prodotto/docs/errori#SYNC-NET-3004'
  },

  // RVFU Errors
  'RVFU-AUTH-4001': {
    code: 'RVFU-AUTH-4001',
    title: 'Credenziali RVFU non valide',
    message: 'Le credenziali MIT/RVFU non sono valide',
    severity: 'critical',
    solution: 'Verifica le credenziali nella sezione Impostazioni → RVFU.',
    docLink: 'https://rescuemanager.eu/prodotto/docs/errori#RVFU-AUTH-4001'
  },
  'RVFU-IMPORT-4002': {
    code: 'RVFU-IMPORT-4002',
    title: 'Errore import dati RVFU',
    message: 'Impossibile importare i dati RVFU',
    severity: 'high',
    solution: 'Controlla il formato dei dati secondo le specifiche MIT.',
    docLink: 'https://rescuemanager.eu/prodotto/docs/errori#RVFU-IMPORT-4002'
  },
  'RVFU-DOC-4003': {
    code: 'RVFU-DOC-4003',
    title: 'Documento RVFU non valido',
    message: 'Il documento non rispetta il formato richiesto',
    severity: 'high',
    solution: 'Verifica il formato del documento secondo specifiche MIT.',
    docLink: 'https://rescuemanager.eu/prodotto/docs/errori#RVFU-DOC-4003'
  },
  'RVFU-SYNC-4004': {
    code: 'RVFU-SYNC-4004',
    title: 'Errore sincronizzazione MIT',
    message: 'Impossibile sincronizzare con il server MIT',
    severity: 'high',
    solution: 'Il server MIT è temporaneamente non disponibile. Riprova tra qualche ora.',
    docLink: 'https://rescuemanager.eu/prodotto/docs/errori#RVFU-SYNC-4004'
  },

  // Fatturazione Errors
  'FATT-SDI-5001': {
    code: 'FATT-SDI-5001',
    title: 'Errore invio fattura SDI',
    message: 'Impossibile inviare la fattura al Sistema di Interscambio',
    severity: 'high',
    solution: 'Verifica la connessione con SDI e che il codice destinatario sia valido.',
    docLink: 'https://rescuemanager.eu/prodotto/docs/errori#FATT-SDI-5001'
  },
  'FATT-XML-5002': {
    code: 'FATT-XML-5002',
    title: 'XML fattura non valido',
    message: 'Il formato XML della fattura non è valido',
    severity: 'high',
    solution: 'Correggi i dati della fattura. Verifica CF, PIVA e altri campi obbligatori.',
    docLink: 'https://rescuemanager.eu/prodotto/docs/errori#FATT-XML-5002'
  },
  'FATT-CF-5003': {
    code: 'FATT-CF-5003',
    title: 'Codice fiscale non valido',
    message: 'Il codice fiscale del destinatario non è valido',
    severity: 'high',
    solution: 'Verifica il codice fiscale del destinatario.',
    docLink: 'https://rescuemanager.eu/prodotto/docs/errori#FATT-CF-5003'
  },
  'FATT-SIGN-5004': {
    code: 'FATT-SIGN-5004',
    title: 'Errore firma digitale',
    message: 'Impossibile firmare digitalmente la fattura',
    severity: 'critical',
    solution: 'Riconfigura la firma digitale nella sezione Impostazioni → Fatturazione.',
    docLink: 'https://rescuemanager.eu/prodotto/docs/errori#FATT-SIGN-5004'
  }
};

class ErrorService {
  constructor() {
    this.errorDatabase = ERROR_DATABASE;
    this.subscribers = [];
  }

  /**
   * Registra un subscriber per notificare errori
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notifica tutti i subscriber
   */
  notify(errorInfo) {
    this.subscribers.forEach(callback => callback(errorInfo));
  }

  /**
   * Ottieni informazioni su un errore dal codice
   */
  getErrorInfo(code) {
    return this.errorDatabase[code] || null;
  }

  /**
   * Mostra un errore
   */
  showError(code, additionalInfo = {}) {
    const errorInfo = this.getErrorInfo(code);
    
    if (errorInfo) {
      // Combina info dal database con info aggiuntive
      const fullErrorInfo = {
        ...errorInfo,
        ...additionalInfo
      };
      
      console.error(' Errore:', code, fullErrorInfo);
      this.notify(fullErrorInfo);
    } else {
      // Errore sconosciuto
      console.error(' Errore sconosciuto:', code);
      this.notify({
        code: code || 'UNKNOWN',
        title: 'Errore',
        message: additionalInfo.message || 'Si è verificato un errore sconosciuto',
        severity: 'medium',
        solution: 'Contatta il supporto con il codice errore.',
        docLink: 'https://rescuemanager.eu/prodotto/docs/errori'
      });
    }
  }

  /**
   * Gestisce errori da API/network
   */
  handleNetworkError(error, context = '') {
    let errorCode = 'UNKNOWN';
    
    if (error.message) {
      // Determina codice errore dal messaggio
      if (error.message.includes('Failed to fetch')) {
        errorCode = 'DB-SYNC-1001';
      } else if (error.message.includes('timeout')) {
        errorCode = 'DB-SYNC-1002';
      } else if (error.message.includes('401')) {
        errorCode = 'OAUTH-AUTH-2001';
      } else if (error.message.includes('403')) {
        errorCode = 'DB-PERM-1004';
      }
    }
    
    this.showError(errorCode, {
      message: error.message || 'Errore di connessione',
      context
    });
  }

  /**
   * Gestisce errori da database/query
   */
  handleDatabaseError(error, context = '') {
    let errorCode = 'DB-QUERY-1003';
    
    if (error.code === 'PGRST301' || error.code === 'PGRST302') {
      errorCode = 'DB-SYNC-1002'; // Timeout
    } else if (error.code === 'PGRST401') {
      errorCode = 'OAUTH-AUTH-2001'; // Unauthorized
    } else if (error.code === 'PGRST403') {
      errorCode = 'DB-PERM-1004'; // Forbidden
    }
    
    this.showError(errorCode, {
      message: error.message,
      context
    });
  }
}

// Singleton
export const errorService = new ErrorService();

// Helpers per uso comune
export const showError = (code, info = {}) => {
  errorService.showError(code, info);
};

export const handleError = (error, context = '') => {
  if (error.code) {
    // È già un errore con codice
    errorService.showError(error.code, { message: error.message, context });
  } else if (error.message) {
    // Network error
    errorService.handleNetworkError(error, context);
  } else {
    // Database error
    errorService.handleDatabaseError(error, context);
  }
};

