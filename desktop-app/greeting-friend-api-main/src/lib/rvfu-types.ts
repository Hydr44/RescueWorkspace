/**
 * Wrapper di risposta standardizzati per API RVFU
 * Basati sulle specifiche ACI/MIT VfuRestResponse<T>
 */

// ============================================================================
// TYPES BASE
// ============================================================================

export interface VfuRestResponse<T = any> {
  esito: {
    codice: 'OK' | 'KO';
    descrizione?: string;
    timestamp?: string;
  };
  payload?: T;
  errori?: VfuErrore[];
  metadata?: {
    requestId?: string;
    version?: string;
    timestamp?: string;
  };
}

export interface VfuErrore {
  codice: string;
  descrizione: string;
  campo?: string;
  dettagli?: Record<string, any>;
}

// ============================================================================
// WRAPPER SPECIFICI PER ENDPOINT
// ============================================================================

// Verifica Veicolo
export interface VerificaVeicoloRequest {
  targa?: string;
  telaio?: string;
  numeroTelaio?: string;
}

export interface VerificaVeicoloResponse {
  veicolo?: {
    targa: string;
    telaio: string;
    marca: string;
    modello: string;
    cilindrata?: number;
    potenza?: number;
    dataPrimaImmatricolazione?: string;
    statoPRA?: string;
    proprietario?: {
      nome: string;
      cognome: string;
      codiceFiscale: string;
      indirizzo?: string;
    };
  };
  trovato: boolean;
  messaggio?: string;
}

export type VfuVerificaVeicoloResponse = VfuRestResponse<VerificaVeicoloResponse>;

// Registrazione VFU
export interface RegistraVfuRequest {
  veicolo: {
    targa: string;
    telaio: string;
    marca: string;
    modello: string;
    cilindrata?: number;
    potenza?: number;
    dataPrimaImmatricolazione?: string;
  };
  conferente: {
    nome: string;
    cognome: string;
    codiceFiscale: string;
    indirizzo: string;
    telefono?: string;
    email?: string;
  };
  notePartiRifiuti?: string;
  dataConferimento: string;
  centroRaccolta: {
    codice: string;
    nome: string;
    indirizzo: string;
  };
}

export interface RegistraVfuResponse {
  vfu: {
    id: string;
    numeroVFU: string;
    stato: string;
    dataCreazione: string;
    fascicolo?: {
      id: string;
      numeroFascicolo: string;
      stato: string;
    };
  };
  messaggio: string;
}

export type VfuRegistraVfuResponse = VfuRestResponse<RegistraVfuResponse>;

// Generazione Certificato
export interface GeneraCertificatoRequest {
  vfuId: string;
  tipoCertificato: 'DIGITALE' | 'CARTACEO';
  note?: string;
}

export interface GeneraCertificatoResponse {
  certificato: {
    id: string;
    numeroCertificato: string;
    tipo: string;
    stato: string;
    dataGenerazione: string;
    urlDownload?: string;
    firma?: {
      richiesta: boolean;
      stato: string;
      urlFirma?: string;
    };
  };
  messaggio: string;
}

export type VfuGeneraCertificatoResponse = VfuRestResponse<GeneraCertificatoResponse>;

// Generazione Ricevuta
export interface GeneraRicevutaRequest {
  vfuId: string;
  tipoRicevuta: 'DIGITALE' | 'CARTACEO';
  note?: string;
}

export interface GeneraRicevutaResponse {
  ricevuta: {
    id: string;
    numeroRicevuta: string;
    tipo: string;
    stato: string;
    dataGenerazione: string;
    urlDownload?: string;
    firma?: {
      richiesta: boolean;
      stato: string;
      urlFirma?: string;
    };
  };
  messaggio: string;
}

export type VfuGeneraRicevutaResponse = VfuRestResponse<GeneraRicevutaResponse>;

// Gestione Documenti
export interface DocumentoVfu {
  id: string;
  nome: string;
  tipo: string;
  dimensione: number;
  dataCaricamento: string;
  stato: string;
  urlDownload?: string;
  firma?: {
    richiesta: boolean;
    stato: string;
    dataFirma?: string;
    firmatario?: string;
  };
}

export interface AllegaDocumentoRequest {
  vfuId: string;
  documento: {
    nome: string;
    tipo: string;
    contenuto: string; // base64
    dimensione: number;
  };
  descrizione?: string;
}

export interface AllegaDocumentoResponse {
  documento: DocumentoVfu;
  messaggio: string;
}

export type VfuAllegaDocumentoResponse = VfuRestResponse<AllegaDocumentoResponse>;

// Consultazione VFU
export interface ConsultaVfuRequest {
  pageNumber?: number;
  pageSize?: number;
  filtri?: {
    stato?: string;
    dataDa?: string;
    dataA?: string;
    targa?: string;
    telaio?: string;
    centroRaccolta?: string;
  };
}

export interface ConsultaVfuResponse {
  vfu: Array<{
    id: string;
    numeroVFU: string;
    targa: string;
    telaio: string;
    marca: string;
    modello: string;
    stato: string;
    dataCreazione: string;
    centroRaccolta: string;
    fascicolo?: {
      id: string;
      numeroFascicolo: string;
      stato: string;
    };
  }>;
  paginazione: {
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
  };
}

export type VfuConsultaVfuResponse = VfuRestResponse<ConsultaVfuResponse>;

// Dettaglio VFU
export interface DettaglioVfuResponse {
  vfu: {
    id: string;
    numeroVFU: string;
    targa: string;
    telaio: string;
    marca: string;
    modello: string;
    cilindrata?: number;
    potenza?: number;
    dataPrimaImmatricolazione?: string;
    stato: string;
    dataCreazione: string;
    dataUltimaModifica: string;
    conferente: {
      nome: string;
      cognome: string;
      codiceFiscale: string;
      indirizzo: string;
      telefono?: string;
      email?: string;
    };
    centroRaccolta: {
      codice: string;
      nome: string;
      indirizzo: string;
    };
    notePartiRifiuti?: string;
    fascicolo?: {
      id: string;
      numeroFascicolo: string;
      stato: string;
      dataCreazione: string;
      documenti: DocumentoVfu[];
    };
  };
}

export type VfuDettaglioVfuResponse = VfuRestResponse<DettaglioVfuResponse>;

// Firma Documenti
export interface InviaAlTabletRequest {
  documentoId: string;
  tipoFirma: 'FDR' | 'DIGITALE';
  note?: string;
}

export interface InviaAlTabletResponse {
  sessioneFirma: {
    id: string;
    documentoId: string;
    stato: string;
    dataCreazione: string;
    scadenza: string;
    urlFirma?: string;
  };
  messaggio: string;
}

export type VfuInviaAlTabletResponse = VfuRestResponse<InviaAlTabletResponse>;

export interface RecuperaFirmatoRequest {
  sessioneFirmaId: string;
}

export interface RecuperaFirmatoResponse {
  documento: DocumentoVfu;
  sessioneFirma: {
    id: string;
    stato: string;
    dataCompletamento: string;
  };
  messaggio: string;
}

export type VfuRecuperaFirmatoResponse = VfuRestResponse<RecuperaFirmatoResponse>;

// Operazioni VFU
export interface VerificaVfuRequest {
  vfuId: string;
  note?: string;
}

export interface VerificaVfuResponse {
  vfu: {
    id: string;
    stato: string;
    dataVerifica: string;
  };
  messaggio: string;
}

export type VfuVerificaVfuResponse = VfuRestResponse<VerificaVfuResponse>;

export interface InoltraStaRequest {
  vfuId: string;
  note?: string;
}

export interface InoltraStaResponse {
  vfu: {
    id: string;
    stato: string;
    dataInoltro: string;
  };
  messaggio: string;
}

export type VfuInoltraStaResponse = VfuRestResponse<InoltraStaResponse>;

export interface ChiudiFascicoloRequest {
  vfuId: string;
  note?: string;
}

export interface ChiudiFascicoloResponse {
  fascicolo: {
    id: string;
    stato: string;
    dataChiusura: string;
  };
  messaggio: string;
}

export type VfuChiudiFascicoloResponse = VfuRestResponse<ChiudiFascicoloResponse>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Verifica se una risposta è di successo
 */
export function isSuccessResponse<T>(response: VfuRestResponse<T>): boolean {
  return response.esito.codice === 'OK';
}

/**
 * Verifica se una risposta è di errore
 */
export function isErrorResponse<T>(response: VfuRestResponse<T>): boolean {
  return response.esito.codice === 'KO';
}

/**
 * Ottiene il messaggio di errore principale da una risposta
 */
export function getErrorMessage<T>(response: VfuRestResponse<T>): string {
  if (isSuccessResponse(response)) {
    return '';
  }
  
  if (response.errori && response.errori.length > 0) {
    return response.errori[0].descrizione;
  }
  
  return response.esito.descrizione || 'Errore sconosciuto';
}

/**
 * Ottiene tutti i messaggi di errore da una risposta
 */
export function getAllErrorMessages<T>(response: VfuRestResponse<T>): string[] {
  if (isSuccessResponse(response)) {
    return [];
  }
  
  const messages: string[] = [];
  
  if (response.esito.descrizione) {
    messages.push(response.esito.descrizione);
  }
  
  if (response.errori) {
    messages.push(...response.errori.map(err => err.descrizione));
  }
  
  return messages;
}

/**
 * Crea una risposta di successo
 */
export function createSuccessResponse<T>(
  payload: T,
  descrizione?: string,
  metadata?: VfuRestResponse<T>['metadata']
): VfuRestResponse<T> {
  return {
    esito: {
      codice: 'OK',
      descrizione,
      timestamp: new Date().toISOString()
    },
    payload,
    metadata
  };
}

/**
 * Crea una risposta di errore
 */
export function createErrorResponse<T>(
  errori: VfuErrore[],
  descrizione?: string,
  metadata?: VfuRestResponse<T>['metadata']
): VfuRestResponse<T> {
  return {
    esito: {
      codice: 'KO',
      descrizione,
      timestamp: new Date().toISOString()
    },
    errori,
    metadata
  };
}

/**
 * Crea un errore singolo
 */
export function createSingleError(
  codice: string,
  descrizione: string,
  campo?: string,
  dettagli?: Record<string, any>
): VfuErrore {
  return {
    codice,
    descrizione,
    campo,
    dettagli
  };
}

// ============================================================================
// ERROR CODES STANDARD
// ============================================================================

export const RVFU_ERROR_CODES = {
  // Errori di autenticazione
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  
  // Errori di validazione
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Errori di business
  VEHICLE_NOT_FOUND: 'VEHICLE_NOT_FOUND',
  VFU_ALREADY_EXISTS: 'VFU_ALREADY_EXISTS',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  
  // Errori di sistema
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  
  // Errori di firma
  SIGNATURE_SESSION_EXPIRED: 'SIGNATURE_SESSION_EXPIRED',
  SIGNATURE_FAILED: 'SIGNATURE_FAILED',
  SIGNATURE_NOT_FOUND: 'SIGNATURE_NOT_FOUND'
} as const;

export type RvfuErrorCode = keyof typeof RVFU_ERROR_CODES;

// ============================================================================
// TIPI COMPLETI PER API RVFU (dalla specifica OpenAPI)
// ============================================================================

// Tipi geografici
export interface ProvinciaIstat {
  codice: string;
  denominazione: string;
  sigla: string;
}

export interface ComuneIstat {
  codice: string;
  denominazione: string;
  provincia?: ProvinciaIstat;
}

export interface StatoEsteroIstat {
  codice: string;
  denominazione: string;
}

// Soggetto VFU
export interface SoggettoVFUCreate {
  codiceFiscale: string;
  nome?: string;
  cognome?: string;
  ragioneSociale?: string;
  tipoPersonaGiuridica?: string;
  dataNascita?: string;
  codiceComuneNascita?: string;
  codiceProvinciaNascita?: string;
  comuneNascita?: string;
  provinciaNascita?: string;
  statoNascita?: string;
  codiceStatoEsteroNascita?: string;
  localitaEsteraNascita?: string;
  codiceComuneResidenza?: string;
  codiceProvinciaResidenza?: string;
  comuneResidenza?: string;
  provinciaResidenza?: string;
  statoResidenza?: string;
  indirizzoResidenza?: string;
  numeroCivicoResidenza?: string;
  capResidenza?: string;
  dugResidenza?: string;
  toponimoResidenza?: string;
  codiceStatoEsteroResidenza?: string;
  localitaEsteraResidenza?: string;
}

export type SoggettoVFUUpdate = Partial<SoggettoVFUCreate>;

export interface SoggettoVFU {
  idSoggetto: number;
  idVFU: number;
  codiceFiscale: string;
  nome?: string;
  cognome?: string;
  ragioneSociale?: string;
  tipoPersonaGiuridica?: string;
  dataNascita?: string;
  comuneNascita?: ComuneIstat;
  provinciaNascita?: ProvinciaIstat;
  comuneResidenza?: ComuneIstat;
  provinciaResidenza?: ProvinciaIstat;
  statoEsteroNascita?: StatoEsteroIstat;
  statoEsteroResidenza?: StatoEsteroIstat;
  indirizzoResidenza?: string;
  numeroCivicoResidenza?: string;
  capResidenza?: string;
  dugResidenza?: string;
  toponimoResidenza?: string;
  localitaEsteraNascita?: string;
  localitaEsteraResidenza?: string;
  tipoSoggetto?: string;
  tipoSoggettoEnum?: 'INTESTATARIO' | 'DETENTORE' | 'DETENTORE_RAPPRESENTANTE' | 'INTESTATARIO_FORZATO';
  dataInserimento?: string;
  dataUltimoAggiornamento?: string;
  matricolaInserimento?: string;
  matricolaAggiornamento?: string;
  badgeUtenteAggiornamento?: string;
}

// Distinta documenti
export interface DistintaVFUCreate {
  du: 'ASSENTE' | 'DENUNCIA' | 'DOCUMENTO' | 'VERBALE';
  cdc: 'ASSENTE' | 'DENUNCIA' | 'DOCUMENTO' | 'VERBALE';
  cdp: 'ASSENTE' | 'DENUNCIA' | 'DOCUMENTO';
  foglioC: 'ASSENTE' | 'DENUNCIA' | 'DOCUMENTO';
  documentoIntestatario: boolean;
  documentoDetentore: boolean;
  targaAnteriore: boolean;
  targaPosteriore: boolean;
  targaDenuncia: boolean;
  altro?: string;
}

export interface DistintaVFUUpdate {
  du?: 'ASSENTE' | 'DENUNCIA' | 'DOCUMENTO' | 'VERBALE';
  cdc?: 'ASSENTE' | 'DENUNCIA' | 'DOCUMENTO' | 'VERBALE';
  cdp?: 'ASSENTE' | 'DENUNCIA' | 'DOCUMENTO';
  foglioC?: 'ASSENTE' | 'DENUNCIA' | 'DOCUMENTO';
  documentoIntestatario?: boolean;
  documentoDetentore?: boolean;
  targaAnteriore?: boolean;
  targaPosteriore?: boolean;
  targaDenuncia?: boolean;
  altro?: string;
}

export interface DistintaVfu {
  du?: string;
  cdc?: string;
  cdp?: string;
  foglioC?: string;
  documentoIntestatario?: boolean;
  documentoDetentore?: boolean;
  targaAnteriore?: boolean;
  targaPosteriore?: boolean;
  targaDenuncia?: boolean;
  altro?: string;
  distintaWarnings?: string[];
}

// Documento VFU
export interface DocumentoVFUCreate {
  tipoDocumento?: string;
  nome?: string;
  contenuto?: string;
  descrizione?: string;
}

export interface DocumentoVFU {
  idDocumento?: number;
  idVFU?: number;
  tipoDocumento?: string;
  tipoDocumentoEnum?: string;
  nome?: string;
  url?: string;
  dimensione?: number;
  dataCaricamento?: string;
  dataUltimoAggiornamento?: string;
  stato?: string;
}

// Causale VFU
export interface CausaleVfuDto {
  codice: string;
  descrizione: string;
}

// VFU Create (Concessionario)
export interface VFUCreateAsConcessionario {
  targa: string;
  telaio: string;
  tipoVeicolo: string;
  flagConsegnaForzeOrdine: string;
  intestatario: SoggettoVFUCreate;
  detentore?: SoggettoVFUCreate;
  detentoreRappresentante?: SoggettoVFUCreate;
  distinta?: DistintaVFUCreate;
  canaleNoPra?: boolean;
  cic?: string;
  noteAggiuntive?: string;
  notePartiRifiuti?: string;
  documentoDelega?: DocumentoVFUCreate;
}

// VFU Create (Centro Raccolta)
export interface VFUCreateAsCR {
  targa: string;
  telaio: string;
  tipoVeicolo: string;
  flagConsegnaForzeOrdine: string;
  forzaRegistrazione: string;
  intestatario: SoggettoVFUCreate;
  detentore?: SoggettoVFUCreate;
  detentoreRappresentante?: SoggettoVFUCreate;
  distinta?: DistintaVFUCreate;
  canaleNoPra?: boolean;
  cic?: string;
  causale?: string;
  noteAggiuntive?: string;
  notePartiRifiuti?: string;
  documentoDelega?: DocumentoVFUCreate;
}

// VFU Update
export interface VFUUpdate {
  intestatario?: SoggettoVFUUpdate;
  detentore?: SoggettoVFUUpdate;
  detentoreRappresentante?: SoggettoVFUUpdate;
  distinta?: DistintaVFUUpdate;
  noteAggiuntive?: string;
  notePartiRifiuti?: string;
  dataBonifica?: string;
  dataDistruzioneDocumenti?: string;
  dataDistruzioneTarga?: string;
  numeroTargheDistrutte?: number;
  flagRitornaRadiato?: string;
}

// VFU Bean (Response)
export interface VFUBean {
  idVFU: number;
  targa: string;
  telaio: string;
  tipoVeicolo?: string;
  causale?: string;
  descrizioneCausale?: string;
  statoVFU?: string;
  statoVfuEnum?: 'ANNULLATO' | 'CEDUTO' | 'CONFERITO' | 'DA_RADIARE' | 'DEMOLITO' | 'INSERITO' | 'INVIATO_A_STA' | 'IN_RADIAZIONE' | 'PRESO_IN_CARICO' | 'RADIATO' | 'TRASFERITO' | 'VALIDATO';
  flagConsegnaForzeOrdine?: string;
  obbligoIscrizionePRA?: string;
  dataRegistrazione?: string;
  dataRitiro?: string;
  dataConferimento?: string;
  dataPresaInCarico?: string;
  dataDemolizione?: string;
  dataBonifica?: string;
  dataRadiazione?: string;
  dataNotificaInoltroSTA?: string;
  dataChiusuraFascicolo?: string;
  dataUltimoAggiornamento?: string;
  dataStatoVFU?: string;
  dataEmissioneCertificato?: string;
  dataEmissioneRicevuta?: string;
  dataCancellazioneArchivi?: string;
  dataDistruzioneDocumenti?: string;
  dataDistruzioneTarga?: string;
  intestatario?: SoggettoVFU;
  detentore?: SoggettoVFU;
  detentoreRappresentante?: SoggettoVFU;
  distinta?: DistintaVfu;
  noteAggiuntive?: string;
  notePartiRifiuti?: string;
  idFascicolo?: number;
  statoFascicolo?: string;
  statoFascicoloEnum?: 'CHIUSO' | 'INSERITO' | 'INTEGRAZIONE';
  idCertificato?: number;
  codiceCertificato?: string;
  idRicevuta?: number;
  codiceRicevuta?: string;
  codiceAgenziaSTA?: string;
  agenziaSTA?: any;
  impresaRitiro?: any;
  impresaConferimento?: any;
  impresaTrasferimento?: any;
  codiceFiscaleRitiro?: string;
  codiceFiscaleConferimento?: string;
  codiceFiscaleTrasferimento?: string;
  matricolaRitiro?: string;
  matricolaConferimento?: string;
  matricolaSedeRitiro?: string;
  matricolaSedeConferimento?: string;
  matricolaSedeTrasferimento?: string;
  matricolaRegistrazione?: string;
  matricolaAggiornamento?: string;
  motivoEliminazione?: string;
  motivoTrasferimento?: string;
  destinazioneVeicolo?: string;
  numeroTargheDistrutte?: number;
  filtroDatiDu?: boolean;
  fabbrica?: string;
  cic?: string;
  flagTipoRegime?: string;
  flagArchivioProvenienza?: string;
  tipoUtilizzoVeicolo?: string;
}

// Altri tipi VFU
export interface VFUElimina {
  motivoEliminazione: string;
}

export interface VFUConferisci {
  codiceFiscaleImpresa: string;
  matricolaSedeImpresa: string;
  dataRitiro?: string;
  generaCdr?: boolean;
}

export interface VFUDemolisci {
  dataDemolizione?: string;
  dataBonifica?: string;
  dataDistruzioneDocumenti?: string;
  dataDistruzioneTarga?: string;
  numeroTargheDistrutte?: number;
}

export interface VFUPrendiInCarico {
  dataPresaInCarico: string;
}

export interface VFUTrasferisci {
  sedeImpresa: string;
  motivoTrasferimento: string;
}

export interface VFUCedi {
  // Vuoto per ora
}

// Conferimento VFU a CR (Concessionario)
export interface VFUConferisci {
  codiceFiscaleImpresa: string;
  matricolaSedeImpresa: string;
  dataRitiro?: string;
  generaCdr?: boolean;
}

// Annullamento VFU (Concessionario)
export interface VFUElimina {
  motivoEliminazione: string;
}

// Sede Impresa VFU (per Centri di Raccolta)
export interface SedeImpresaVfu {
  idSedeOperativa?: string;
  codiceFiscale?: string;
  denominazioneSociale?: string;
  matricolaSede?: string;
  sedeImpresa?: string;
  tipoSocieta?: string;
  tipoImpresaGestioneVFU?: string;
  tipoSedeOperativa?: string;
  indirizzoSede?: string;
  provinciaSedeOperativa?: string;
  indirizzoResidenza?: string;
  toponimoResidenza?: string;
  civicoResidenza?: string;
  capResidenza?: string;
  comuneResidenza?: string;
  provinciaResidenza?: string;
  localitaEsteraResidenza?: string;
  statoEsteroResidenza?: string;
  indirizzoTelematico?: string;
  postaCertificata?: string;
}

export interface FascicoloVFU {
  idFascicolo: number;
  idVFU: number;
  statoFascicolo?: string;
  statoFascicoloEnum?: 'CHIUSO' | 'INSERITO' | 'INTEGRAZIONE';
  dataCreazioneFascicolo?: string;
  dataChiusuraFascicolo?: string;
  dataUltimoAggiornamento?: string;
  listaDocumenti?: DocumentoVFU[];
  matricolaInserimento?: string;
  badgeUtenteAggiornamento?: string;
}

// Ricerca e paginazione
export interface Pageable {
  pageNumber?: number;
  pageSize?: number;
  offset?: number;
  paged?: boolean;
  unpaged?: boolean;
  sort?: Sort;
}

export interface Sort {
  sorted?: boolean;
  unsorted?: boolean;
}

export interface PageOfVFUBean {
  content?: VFUBean[];
  totalElements?: number;
  totalPages?: number;
  size?: number;
  number?: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
  numberOfElements?: number;
  pageable?: Pageable;
  sort?: Sort;
}

export interface VFUSearchFilters {
  targa?: string;
  telaio?: string;
  tipoVeicolo?: string;
  statoVFU?: string;
  dataInserimentoDa?: string;
  dataInserimentoA?: string;
  dataRitiroDa?: string;
  dataRitiroA?: string;
  dataConferimentoDa?: string;
  dataConferimentoA?: string;
  dataPresaInCaricoDa?: string;
  dataPresaInCaricoA?: string;
  dataRadiazioneDa?: string;
  dataRadiazioneA?: string;
  dataNotificaInoltroSTADa?: string;
  dataNotificaInoltroSTAA?: string;
  codiceFiscaleCR?: string;
  obbligoIscrizionePRA?: string;
  notePartiRifiuti?: boolean;
  pageNumber?: number;
  pageSize?: number;
  offset?: number;
  paged?: boolean;
  unpaged?: boolean;
}

export interface VFURadiatiSearchFilters extends VFUSearchFilters {
  codiceAgenziaSTA?: string;
  includiDemoliti?: boolean;
}

export interface VeicoloSearchParams {
  targa?: string;
  telaio?: string;
  tipoVeicolo?: string;
}

// Configurazione
export interface RVFUConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export type RVFUResponse<T> = VfuRestResponse<T>;

// Delega
export interface DelegaCreate {
  codiceFiscaleCR: string;
  matricolaSedeOperativa?: string;
  dataScadenza?: string;
  note?: string;
}

export interface DelegaUpdate {
  dataScadenza?: string;
  note?: string;
}

export interface DelegaRevoca {
  motivoRevoca: string;
}

export interface Delega {
  idDelega: number;
  codiceFiscaleConcessionario: string;
  codiceFiscaleCR: string;
  matricolaSedeOperativa?: string;
  dataCreazione: string;
  dataScadenza?: string;
  stato?: string;
  note?: string;
  sedeOperativa?: any;
}

// Veicolo
export interface Veicolo {
  targa?: string;
  telaio?: string;
  tipoVeicolo?: string;
  modello?: string;
  causale?: string;
  dataImmatricolazione?: string;
  dataRegistrazione?: string;
  destinazioneVeicolo?: string;
  enteConferimento?: string;
  enteRitiro?: string;
  forzabile?: boolean;
  obbligoIscrizionePRA?: string;
  obbligoIscrizionePraFlag?: boolean;
  ostativiEForzature?: any[];
  pesoComplessivo?: string;
  radiabile?: string;
  radiabileFlag?: boolean;
  radiato?: string;
  radiatoFlag?: boolean;
  regimeVeicolo?: string;
  soggettoVeicolo?: SoggettoVFU;
  statoVFU?: string;
  tipoUtilizzoVeicolo?: string;
  vincoloOstativo?: string;
}