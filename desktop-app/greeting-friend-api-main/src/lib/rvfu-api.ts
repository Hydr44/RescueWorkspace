// src/lib/rvfu-api.ts
// Client API per il Registro Veicoli Fuoriuso (RVFU)

import { logger } from './logger.js';

// Tipi importati
import type {
  RVFUConfig,
  RVFUResponse,
  VFUBean,
  VFUCreateAsConcessionario,
  VFUCreateAsCR,
  VFUConferisci,
  VFUDemolisci,
  VFUElimina,
  VFUTrasferisci,
  VFUPrendiInCarico,
  VFUCedi,
  VFUUpdate,
  DocumentoVFU,
  DocumentoVFUCreate,
  FascicoloVFU,
  Veicolo,
  CausaleVfuDto,
  ComuneIstat,
  ProvinciaIstat,
  StatoEsteroIstat,
  PageOfVFUBean,
  Delega,
  DelegaCreate,
  DelegaUpdate,
  DelegaRevoca
} from './rvfu-types';

export class RVFUClient {
  private config: RVFUConfig;
  private baseHeaders: Record<string, string>;

  constructor(config: RVFUConfig) {
    this.config = {
      timeout: 30000,
      ...config
    };
    
    this.baseHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.config.apiKey) {
      this.baseHeaders['Authorization'] = `Bearer ${this.config.apiKey}`;
    }
  }

  // === METODI PRINCIPALI VFU ===

  /**
   * Registra un nuovo VFU come Concessionario
   */
  async registraVFUConcessionario(data: VFUCreateAsConcessionario): Promise<RVFUResponse<VFUBean>> {
    return this.makeRequest<VFUBean>('POST', '/rest/concessionario/VFU', data);
  }

  /**
   * Registra un nuovo VFU come Centro di Raccolta
   */
  async registraVFUCR(data: VFUCreateAsCR): Promise<RVFUResponse<VFUBean>> {
    return this.makeRequest<VFUBean>('POST', '/rest/cr/VFU', data);
  }

  /**
   * Recupera dettagli di un VFU
   */
  async getVFU(idVFU: number): Promise<RVFUResponse<VFUBean>> {
    return this.makeRequest<VFUBean>('GET', `/rest/cr/VFU/${idVFU}`);
  }

  /**
   * Aggiorna un VFU esistente
   */
  async aggiornaVFU(idVFU: number, data: VFUUpdate): Promise<RVFUResponse<VFUBean>> {
    return this.makeRequest<VFUBean>('PUT', `/rest/cr/VFU/${idVFU}`, data);
  }

  /**
   * Annulla un VFU
   */
  async annullaVFU(idVFU: number, data: VFUElimina): Promise<RVFUResponse<VFUBean>> {
    return this.makeRequest<VFUBean>('PUT', `/rest/cr/annulla/VFU/${idVFU}`, data);
  }

  /**
   * Conferisce un VFU a un CR
   */
  async conferisciVFU(idVFU: number, data: VFUConferisci): Promise<RVFUResponse<VFUBean>> {
    return this.makeRequest<VFUBean>('PUT', `/rest/concessionario/conferisci/VFU/${idVFU}`, data);
  }

  /**
   * Prende in carico un VFU
   */
  async prendiInCaricoVFU(idVFU: number, data: VFUPrendiInCarico): Promise<RVFUResponse<VFUBean>> {
    return this.makeRequest<VFUBean>('PUT', `/rest/cr/prendiInCarico/VFU/${idVFU}`, data);
  }

  /**
   * Demolisce un VFU
   */
  async demolisciVFU(idVFU: number, data: VFUDemolisci): Promise<RVFUResponse<VFUBean>> {
    return this.makeRequest<VFUBean>('PUT', `/rest/cr/demolisci/VFU/${idVFU}`, data);
  }

  /**
   * Conferma radiazione VFU
   */
  async confermaRadiazioneVFU(idVFU: number): Promise<RVFUResponse<VFUBean>> {
    return this.makeRequest<VFUBean>('PUT', `/rest/cr/confermaRadiazioneVFU/VFU/${idVFU}`);
  }

  /**
   * Cede un VFU
   */
  async cediVFU(idVFU: number, data: VFUCedi): Promise<RVFUResponse<VFUBean>> {
    return this.makeRequest<VFUBean>('PUT', `/rest/cr/cedi/VFU/${idVFU}`, data);
  }

  /**
   * Trasferisce un VFU
   */
  async trasferisciVFU(idVFU: number, data: VFUTrasferisci): Promise<RVFUResponse<VFUBean>> {
    return this.makeRequest<VFUBean>('PUT', `/rest/cr/trasferisci/VFU/${idVFU}`, data);
  }

  // === RICERCA E CONSULTAZIONE ===

  /**
   * Cerca VFU con filtri
   */
  async cercaVFU(filters: VFUSearchFilters = {}): Promise<RVFUResponse<PageOfVFUBean>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    const url = queryString ? `/rest/cr/consulta/VFU?${queryString}` : '/rest/cr/consulta/VFU';
    
    return this.makeRequest<PageOfVFUBean>('GET', url);
  }

  /**
   * Cerca VFU per presa in carico
   */
  async cercaVFUPresaInCarico(filters: VFUSearchFilters = {}): Promise<RVFUResponse<PageOfVFUBean>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    const url = queryString ? `/rest/cr/consultaPresaInCarico/VFU?${queryString}` : '/rest/cr/consultaPresaInCarico/VFU';
    
    return this.makeRequest<PageOfVFUBean>('GET', url);
  }

  /**
   * Cerca VFU radiati
   */
  async cercaVFURadiati(filters: VFURadiatiSearchFilters = {}): Promise<RVFUResponse<PageOfVFUBean>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    const url = queryString ? `/rest/cr/consultaRadiati/VFU?${queryString}` : '/rest/cr/consultaRadiati/VFU';
    
    return this.makeRequest<PageOfVFUBean>('GET', url);
  }

  /**
   * Cerca VFU per rottamazione
   */
  async cercaVFURottamazione(filters: VFUSearchFilters = {}): Promise<RVFUResponse<PageOfVFUBean>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    const url = queryString ? `/rest/cr/consultaRottamazione/VFU?${queryString}` : '/rest/cr/consultaRottamazione/VFU';
    
    return this.makeRequest<PageOfVFUBean>('GET', url);
  }

  // === VEICOLI ===

  /**
   * Cerca informazioni veicolo
   */
  async cercaVeicolo(params: VeicoloSearchParams): Promise<RVFUResponse<Veicolo>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return this.makeRequest<Veicolo>('GET', `/rest/cr/veicolo?${queryString}`);
  }

  /**
   * Ottiene lista causali
   */
  async getCausali(): Promise<RVFUResponse<CausaleVfuDto[]>> {
    return this.makeRequest<CausaleVfuDto[]>('GET', '/rest/cr/causali');
  }

  /**
   * Ottiene causale per codice
   */
  async getCausalePerCodice(codiceCausale: string): Promise<RVFUResponse<CausaleVfuDto>> {
    return this.makeRequest<CausaleVfuDto>('GET', `/rest/cr/causalePerCodice/${codiceCausale}`);
  }

  // === DOCUMENTI ===

  /**
   * Allega documento a VFU
   */
  async allegaDocumento(idVFU: number, documento: DocumentoVFUCreate): Promise<RVFUResponse<DocumentoVFU>> {
    return this.makeRequest<DocumentoVFU>('POST', `/rest/cr/allega/documentoVFU/${idVFU}`, documento);
  }

  /**
   * Scarica documento VFU
   */
  async scaricaDocumento(params: DocumentoDownloadParams): Promise<RVFUResponse<DocumentoVFU>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return this.makeRequest<DocumentoVFU>('GET', `/rest/cr/documentoVFU?${queryString}`);
  }

  /**
   * Ottiene lista documenti VFU
   */
  async getDocumentiVFU(idVFU: number): Promise<RVFUResponse<DocumentoVFU[]>> {
    return this.makeRequest<DocumentoVFU[]>('GET', `/rest/cr/consulta/documentoVFU/${idVFU}`);
  }

  // === FASCICOLI ===

  /**
   * Ottiene dettagli fascicolo
   */
  async getFascicolo(idFascicolo: number): Promise<RVFUResponse<FascicoloVFU>> {
    return this.makeRequest<FascicoloVFU>('GET', `/rest/cr/fascicolo/${idFascicolo}`);
  }

  /**
   * Chiude fascicolo
   */
  async chiudiFascicolo(idVFU: number): Promise<RVFUResponse<FascicoloVFU>> {
    return this.makeRequest<FascicoloVFU>('PUT', `/rest/cr/chiudi/fascicolo/${idVFU}`);
  }

  /**
   * Riapre fascicolo
   */
  async riapriFascicolo(idVFU: number): Promise<RVFUResponse<FascicoloVFU>> {
    return this.makeRequest<FascicoloVFU>('PUT', `/rest/cr/riapri/fascicolo/${idVFU}`);
  }

  /**
   * Verifica fascicolo
   */
  async verificaFascicolo(idFascicolo: number): Promise<RVFUResponse<boolean>> {
    return this.makeRequest<boolean>('GET', `/rest/cr/verifica/fascicolo/${idFascicolo}`);
  }

  // === DELEGHE ===

  /**
   * Crea nuova delega
   */
  async creaDelega(data: DelegaCreate): Promise<RVFUResponse<Delega>> {
    return this.makeRequest<Delega>('POST', '/rest/cr/delega', data);
  }

  /**
   * Ottiene dettagli delega
   */
  async getDelega(idDelega: number): Promise<RVFUResponse<Delega>> {
    return this.makeRequest<Delega>('GET', `/rest/cr/delega/${idDelega}`);
  }

  /**
   * Aggiorna delega
   */
  async aggiornaDelega(idDelega: number, data: DelegaUpdate): Promise<RVFUResponse<Delega>> {
    return this.makeRequest<Delega>('PUT', `/rest/cr/delega/${idDelega}`, data);
  }

  /**
   * Revoca delega
   */
  async revocaDelega(idDelega: number, data: DelegaRevoca): Promise<RVFUResponse<Delega>> {
    return this.makeRequest<Delega>('PUT', `/rest/cr/revoca/delega/${idDelega}`, data);
  }

  /**
   * Elimina delega
   */
  async eliminaDelega(idDelega: number): Promise<RVFUResponse<Delega>> {
    return this.makeRequest<Delega>('DELETE', `/rest/cr/delega/${idDelega}`);
  }

  /**
   * Cerca deleghe
   */
  async cercaDeleghe(filters: DelegaSearchFilters = {}): Promise<RVFUResponse<PageOfDelega>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    const url = queryString ? `/rest/cr/consulta/delega?${queryString}` : '/rest/cr/consulta/delega';
    
    return this.makeRequest<PageOfDelega>('GET', url);
  }

  // === UTILITY ===

  /**
   * Ottiene lista comuni
   */
  async getComuni(siglaProvincia: string, nomeComune?: string, data?: string): Promise<RVFUResponse<ComuneIstat[]>> {
    const params = new URLSearchParams();
    params.append('siglaProvincia', siglaProvincia);
    
    if (nomeComune) params.append('nomeComune', nomeComune);
    if (data) params.append('data', data);

    const queryString = params.toString();
    return this.makeRequest<ComuneIstat[]>('GET', `/rest/utility/comune?${queryString}`);
  }

  /**
   * Ottiene lista province
   */
  async getProvince(sigla?: string, data?: string): Promise<RVFUResponse<ProvinciaIstat[]>> {
    const params = new URLSearchParams();
    
    if (sigla) params.append('sigla', sigla);
    if (data) params.append('data', data);

    const queryString = params.toString();
    return this.makeRequest<ProvinciaIstat[]>('GET', `/rest/utility/provincia?${queryString}`);
  }

  /**
   * Ottiene lista stati esteri
   */
  async getStatiEsteri(nome?: string, data?: string): Promise<RVFUResponse<StatoEsteroIstat[]>> {
    const params = new URLSearchParams();
    
    if (nome) params.append('nome', nome);
    if (data) params.append('data', data);

    const queryString = params.toString();
    return this.makeRequest<StatoEsteroIstat[]>('GET', `/rest/utility/statoEstero?${queryString}`);
  }

  /**
   * Ottiene dettagli utente corrente
   */
  async getUtenteCorrente(): Promise<RVFUResponse<UtenteProfilatoMctc>> {
    return this.makeRequest<UtenteProfilatoMctc>('GET', '/rest/utility/detail/utente');
  }

  // === METODO PRINCIPALE PER LE RICHIESTE ===

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<RVFUResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: this.baseHeaders,
      signal: AbortSignal.timeout(this.config.timeout!),
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      logger.info(`RVFU API Request: ${method} ${url}`, { data });
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: RVFUResponse<T> = await response.json();
      
      logger.info(`RVFU API Response: ${method} ${url}`, { 
        status: result.esito.responseStatus,
        code: result.esito.code,
        message: result.esito.message 
      });

      if (result.esito.responseStatus === 'KO') {
        throw new RVFUApiError(result.esito.message, result.esito.code);
      }

      return result;
    } catch (error) {
      logger.error(`RVFU API Error: ${method} ${url}`, error);
      
      if (error instanceof RVFUApiError) {
        throw error;
      }
      
      throw new RVFUApiError(
        error instanceof Error ? error.message : 'Errore sconosciuto',
        'NETWORK_ERROR',
        error
      );
    }
  }
}

// === CLASSI DI ERRORE ===

export class RVFUApiError extends Error {
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: string;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', details?: any) {
    super(message);
    this.name = 'RVFUApiError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// === INTERFACCE PER I FILTRI ===

export interface VFUSearchFilters {
  codiceFiscaleRitiro?: string;
  dataConferimentoDa?: string;
  dataConferimentoA?: string;
  dataInserimentoDa?: string;
  dataInserimentoA?: string;
  dataNotificaInoltroSTADa?: string;
  dataNotificaInoltroSTAA?: string;
  dataPresaInCaricoDa?: string;
  dataPresaInCaricoA?: string;
  dataRadiazioneDa?: string;
  dataRadiazioneA?: string;
  dataRitiroDa?: string;
  dataRitiroA?: string;
  notePartiRifiuti?: boolean;
  obbligoIscrizionePRA?: string;
  offset?: number;
  pageNumber?: number;
  pageSize?: number;
  paged?: boolean;
  sort?: {
    sorted?: boolean;
    unsorted?: boolean;
  };
  statoVFU?: string;
  targa?: string;
  telaio?: string;
  tipoVeicolo?: string;
  unpaged?: boolean;
}

export interface VFURadiatiSearchFilters extends VFUSearchFilters {
  codiceAgenziaSTA?: string;
  includiDemoliti?: boolean;
}

export interface VeicoloSearchParams {
  causale: string;
  tipoVeicolo: string;
  targa?: string;
  telaio?: string;
  codiceFiscale?: string;
  cic?: string;
  canaleNoPra?: boolean;
  cicOTelaio?: boolean;
  ciclomotore?: boolean;
  targaOTelaio?: boolean;
}

export interface DocumentoDownloadParams {
  idAci?: number;
  idFascicolo?: number;
  progressivoDocumento?: number;
}

export interface DelegaSearchFilters {
  codiceFiscale?: string;
  dataInizioDa?: string;
  dataInizioA?: string;
  dataFineDa?: string;
  dataFineA?: string;
  statoDelega?: string;
  offset?: number;
  pageNumber?: number;
  pageSize?: number;
  paged?: boolean;
  sort?: {
    sorted?: boolean;
    unsorted?: boolean;
  };
  unpaged?: boolean;
}

// === INTERFACCE AGGIUNTIVE ===

export interface PageOfDelega {
  content: Delega[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  pageable: Pageable;
  size: number;
  sort: Sort;
  totalElements: number;
  totalPages: number;
}

export interface Pageable {
  offset: number;
  pageNumber: number;
  pageSize: number;
  paged: boolean;
  sort: Sort;
  unpaged: boolean;
}

export interface Sort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface UtenteProfilatoMctc {
  codiceFiscaleImpresa: string;
  desc: string;
  matricola: string;
  profili: string[];
  sedeImpresa: string;
}

// === ISTANZA GLOBALE ===

let rvfuClient: RVFUClient | null = null;

export function getRVFUClient(): RVFUClient {
  if (!rvfuClient) {
    const config: RVFUConfig = {
      baseUrl: import.meta.env.VITE_RVFU_BASE_URL || 'http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80',
      apiKey: import.meta.env.VITE_RVFU_API_KEY,
      timeout: 30000,
    };
    
    rvfuClient = new RVFUClient(config);
  }
  
  return rvfuClient;
}

export function setRVFUClient(client: RVFUClient): void {
  rvfuClient = client;
}
