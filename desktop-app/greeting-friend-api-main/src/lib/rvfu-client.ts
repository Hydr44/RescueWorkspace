// src/lib/rvfu-client.ts
// Client API RVFU — Riscrittura pulita 02/03/2026
// Credenziali confermate da ACI Informatica
// Usa Bearer token diretto (da OIDC flow)

import { RVFUAuthService } from './rvfu-auth';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface VeicoloInfo {
  targa: string;
  tipoVeicolo: string;
  telaio?: string;
  marca?: string;
  modello?: string;
  cilindrata?: number;
  potenza?: number;
  annoImmatricolazione?: number;
  dataPrimaImmatricolazione?: string;
  dataImmatricolazione?: string;
  statoPRA?: string;
  obbligoIscrizionePRA?: string;
  obbligoIscrizionePraFlag?: boolean;
  radiabile?: string;
  radiabileFlag?: boolean;
  forzabile?: boolean;
  vincoloOstativo?: string;
  ostativiEForzature?: Array<{ tipo?: string; descrizione?: string; forzabile?: boolean }>;
  codiceFiscale?: string;
  cognome?: string;
  nome?: string;
  dataNascita?: string;
  comuneNascita?: string;
  provinciaNascita?: string;
  numeroTelaio?: string;
  numeroMotore?: string;
  colore?: string;
  alimentazione?: string;
  categoria?: string;
  note?: string;
  errori?: string[];
}

export interface VerificaVeicoloParams {
  causale: string;
  tipoVeicolo: string;
  codiceFiscale?: string;
  targa?: string;
  telaio?: string;
}

// Targhe di test ambiente formazione (confermate da ACI 26/02/2026)
export const TARGHE_TEST_FORMAZIONE = [
  'VA076AJ', 'VA185AJ', 'VA187AJ', 'VA189AJ',
  'VA205AJ', 'VA207AJ', 'VA209AJ',
];

// URL API per ambiente
const API_URLS = {
  formation: 'https://formazione.ilportaledeltrasporto.it/rvfu/sh',
  production: 'https://ilportaledeltrasporto.it/rvfu/sh',
} as const;

// ═══════════════════════════════════════════════════════════════
// CLIENT
// ═══════════════════════════════════════════════════════════════

export class RVFUClient {
  private readonly authService: RVFUAuthService;
  private readonly baseUrl: string;

  constructor(authService: RVFUAuthService, baseUrl: string) {
    this.authService = authService;
    this.baseUrl = baseUrl;
  }

  // ─── Core request method ────────────────────────────────────
  // Usa IPC apiCallDirect (main process con cookies iPlanetDirectoryPro)
  // Fallback a fetch diretto se Electron IPC non disponibile

  private async makeRequest(
    endpoint: string,
    options: { method?: string; params?: Record<string, string>; body?: any } = {}
  ): Promise<any> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      }
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    try {
      headers['Authorization'] = this.authService.getAuthHeader();
    } catch {
      throw new Error('Token RVFU non disponibile. Effettua il login.');
    }

    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    const method = options.method || 'GET';
    const bodyStr = options.body
      ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
      : undefined;

    console.log(`[RVFU Client] ${method} ${url.pathname}${url.search}`);

    // Prova IPC apiCallDirect (main process invia iPlanetDirectoryPro cookie automaticamente)
    const electronApi = typeof globalThis.window !== 'undefined' ? (globalThis.window as any).api : null;
    if (electronApi?.rvfu?.apiCallDirect) {
      try {
        const result = await electronApi.rvfu.apiCallDirect({
          method,
          url: url.toString(),
          headers,
          body: bodyStr,
        });

        // apiCallDirect restituisce { statusCode, body, headers }
        if (result.statusCode === 401 || result.statusCode === 403) {
          console.warn(`[RVFU Client] ${result.statusCode} via IPC — tentativo re-autenticazione...`);
          const newTokens = await this.authService.reAuthenticate();
          if (newTokens) {
            headers['Authorization'] = this.authService.getAuthHeader();
            const retry = await electronApi.rvfu.apiCallDirect({
              method,
              url: url.toString(),
              headers,
              body: bodyStr,
            });
            if (retry.statusCode >= 400) {
              throw new Error(`RVFU API ${retry.statusCode}: ${String(retry.body).substring(0, 200)}`);
            }
            return typeof retry.body === 'string' ? JSON.parse(retry.body) : retry.body;
          }
          throw new Error(`RVFU API ${result.statusCode}: Sessione scaduta. Effettua nuovamente il login.`);
        }

        if (result.statusCode >= 400) {
          throw new Error(`RVFU API ${result.statusCode}: ${String(result.body).substring(0, 200)}`);
        }

        return typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
      } catch (err: any) {
        // Se IPC fallisce per motivi tecnici, logga e rilancia
        console.error('[RVFU Client] IPC apiCallDirect error:', err.message);
        throw err;
      }
    }

    // Fallback: fetch diretto (senza cookies — potrebbe ricevere 401)
    console.warn('[RVFU Client] IPC non disponibile, fetch diretto (senza iPlanetDirectoryPro cookie)');
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: bodyStr,
      credentials: 'include',
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`RVFU API ${response.status}: ${text.substring(0, 200)}`);
    }

    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }

  // ─── API Methods ────────────────────────────────────────────

  /**
   * GET /cr/veicolo — Verifica veicolo prima di registrarlo come VFU
   */
  async verificaVeicolo(params: VerificaVeicoloParams): Promise<VeicoloInfo | null> {
    const searchParams: Record<string, string> = {};
    if (params.causale) searchParams.causale = params.causale;
    if (params.tipoVeicolo) searchParams.tipoVeicolo = params.tipoVeicolo;
    if (params.targa) searchParams.targa = params.targa;
    if (params.telaio) searchParams.telaio = params.telaio;
    if (params.codiceFiscale) searchParams.codiceFiscale = params.codiceFiscale;

    console.log('[RVFU Client] verificaVeicolo:', searchParams);

    const response = await this.makeRequest('/cr/veicolo', {
      method: 'GET',
      params: searchParams,
    });

    const veicolo = response?.result || response?.payload || response;
    if (!veicolo || (!veicolo.targa && !veicolo.telaio)) {
      return null;
    }

    const soggetto = veicolo.intestatario || veicolo.detentore || {};
    const v = veicolo.veicolo || veicolo;

    return {
      targa: veicolo.targa || '',
      tipoVeicolo: veicolo.tipoVeicolo || params.tipoVeicolo || '',
      telaio: veicolo.telaio || '',
      marca: v.marca,
      modello: v.modello,
      cilindrata: v.cilindrata,
      potenza: v.potenza,
      annoImmatricolazione: v.annoImmatricolazione,
      dataPrimaImmatricolazione: v.dataPrimaImmatricolazione,
      dataImmatricolazione: v.dataImmatricolazione,
      statoPRA: v.statoPRA,
      obbligoIscrizionePRA: veicolo.obbligoIscrizionePRA,
      obbligoIscrizionePraFlag: veicolo.obbligoIscrizionePRA === 'S',
      radiabile: v.radiabile,
      radiabileFlag: v.radiabile === 'S',
      forzabile: v.forzabile,
      vincoloOstativo: v.vincoloOstativo,
      ostativiEForzature: v.ostativiEForzature,
      codiceFiscale: soggetto.codiceFiscale || veicolo.codiceFiscale,
      cognome: soggetto.cognome || veicolo.cognome,
      nome: soggetto.nome || veicolo.nome,
      dataNascita: soggetto.dataNascita || veicolo.dataNascita,
      comuneNascita: soggetto.comuneNascita,
      provinciaNascita: soggetto.provinciaNascita,
      numeroTelaio: veicolo.telaio || '',
      numeroMotore: v.numeroMotore,
      colore: v.colore,
      alimentazione: v.alimentazione,
      categoria: v.categoria,
      note: veicolo.noteAggiuntive || veicolo.note,
    };
  }

  /**
   * POST /cr/VFU — Registra VFU (Centro di Raccolta)
   */
  async registraVFUConcessionario(payload: any): Promise<any> {
    console.log('[RVFU Client] registraVFU');
    return this.makeRequest('/cr/VFU', {
      method: 'POST',
      body: payload,
    });
  }

  /**
   * GET /cr/consulta/VFU — Lista VFU registrati
   */
  async consultaVFUConcessionario(filters: any = {}): Promise<any> {
    const params: Record<string, string> = {};
    if (filters.pageNumber !== undefined) params.pageNumber = String(filters.pageNumber);
    if (filters.pageSize !== undefined) params.pageSize = String(filters.pageSize);
    if (filters.paged !== undefined) params.paged = String(filters.paged);
    if (filters.targa) params.targa = filters.targa;
    if (filters.telaio) params.telaio = filters.telaio;
    if (filters.statoVFU) params.statoVFU = filters.statoVFU;

    console.log('[RVFU Client] consultaVFU:', params);
    return this.makeRequest('/cr/consulta/VFU', {
      method: 'GET',
      params,
    });
  }

  /**
   * GET /cr/VFU — Dettaglio singolo VFU
   */
  async dettaglioVFU(idVFU: number): Promise<any> {
    return this.makeRequest(`/cr/VFU`, {
      method: 'GET',
      params: { idVFU: String(idVFU) },
    });
  }

  /**
   * POST /cr/genera/certificatoRottamazione — Genera CDR
   */
  async generaCDR(idVFU: number): Promise<any> {
    return this.makeRequest('/cr/genera/certificatoRottamazione', {
      method: 'POST',
      body: { idVFU },
    });
  }

  /**
   * POST /cr/genera/ricevutaPresaInCarico — Genera ricevuta
   */
  async generaRicevuta(idVFU: number): Promise<any> {
    return this.makeRequest('/cr/genera/ricevutaPresaInCarico', {
      method: 'POST',
      body: { idVFU },
    });
  }

  /**
   * POST /cr/allega/documentoVFU — Allega documento al fascicolo
   */
  async allegaDocumento(payload: any): Promise<any> {
    return this.makeRequest('/cr/allega/documentoVFU', {
      method: 'POST',
      body: payload,
    });
  }

  /**
   * GET /cr/documentoVFU — Dettaglio fascicolo documenti
   */
  async dettaglioFascicolo(idVFU: number): Promise<any> {
    return this.makeRequest('/cr/documentoVFU', {
      method: 'GET',
      params: { idVFU: String(idVFU) },
    });
  }

  /**
   * PUT /cr/verifica/VFU — Verifica VFU
   */
  async verificaVFU(idVFU: number): Promise<any> {
    return this.makeRequest('/cr/verifica/VFU', {
      method: 'PUT',
      body: { idVFU },
    });
  }

  /**
   * POST /cr/inoltraSTA/VFU — Inoltra a STA per radiazione
   */
  async inoltraSTA(idVFU: number, idAgenzia: number): Promise<any> {
    return this.makeRequest('/cr/inoltraSTA/VFU/', {
      method: 'POST',
      body: { idVFU, idAgenzia },
    });
  }

  /**
   * POST /cr/chiudi/fascicolo — Chiudi fascicolo
   */
  async chiudiFascicolo(idVFU: number): Promise<any> {
    return this.makeRequest('/cr/chiudi/fascicolo', {
      method: 'POST',
      body: { idVFU },
    });
  }

  /**
   * POST /cr/prendiInCarico/VFU — Prendi in carico VFU conferito
   */
  async prendiInCarico(idVFU: number): Promise<any> {
    return this.makeRequest('/cr/prendiInCarico/VFU', {
      method: 'POST',
      body: { idVFU },
    });
  }

  /**
   * GET /cr/consultaPresaInCarico/VFU — Lista VFU da prendere in carico
   */
  async consultaPresaInCarico(filters: any = {}): Promise<any> {
    const params: Record<string, string> = {};
    if (filters.pageNumber !== undefined) params.pageNumber = String(filters.pageNumber);
    if (filters.pageSize !== undefined) params.pageSize = String(filters.pageSize);
    return this.makeRequest('/cr/consultaPresaInCarico/VFU', {
      method: 'GET',
      params,
    });
  }

  /**
   * GET /cr/agenziaSTA — Ricerca agenzia STA
   */
  async ricercaAgenziaSTA(params: Record<string, string> = {}): Promise<any> {
    return this.makeRequest('/cr/agenziaSTA', {
      method: 'GET',
      params,
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════

/**
 * Crea un'istanza di RVFUClient
 * Mantiene compatibilità con il vecchio createRVFUClient(authService, env, useBrowserWindow)
 */
export function createRVFUClient(
  authService: RVFUAuthService | { isAuthenticated: () => boolean; getAuthHeader: () => string; refreshTokens: () => Promise<any> },
  environment: 'formation' | 'production' = 'formation',
  _useBrowserWindow?: boolean
): RVFUClient {
  const baseUrl = API_URLS[environment];
  console.log('[RVFU Client] Creato:', { baseUrl, environment });

  // Se authService è un adapter (non RVFUAuthService), wrappalo
  if (authService instanceof RVFUAuthService) {
    return new RVFUClient(authService, baseUrl);
  }

  // Adapter: crea un wrapper compatibile
  const adapter = authService as any;
  const wrappedService = {
    getAuthHeader: () => adapter.getAuthHeader(),
    reAuthenticate: async () => {
      try {
        await adapter.refreshTokens();
        return true;
      } catch {
        return null;
      }
    },
  } as unknown as RVFUAuthService;

  return new RVFUClient(wrappedService, baseUrl);
}
