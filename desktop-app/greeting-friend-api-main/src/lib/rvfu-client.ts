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
  marca_modello?: string;
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
  radiato?: string;
  radiatoFlag?: boolean;
  forzabile?: boolean;
  vincoloOstativo?: string | null;
  ostativiEForzature?: Array<{ tipo?: string; descrizione?: string; forzabile?: boolean }> | null;
  causale?: string;
  cic?: string | null;
  pesoComplessivo?: string;
  tipoUtilizzoVeicolo?: string;
  destinazioneVeicolo?: string;
  regimeVeicolo?: string;
  proprietario?: {
    codiceFiscale?: string;
    cognome?: string;
    nome?: string;
    dataNascita?: string;
    tipoSoggettoEnum?: string;
    // Nascita
    comuneNascita?: string;
    codiceComuneNascita?: string;
    provinciaNascita?: string;
    codiceProvinciaNascita?: string;
    siglaProvinciaNascita?: string;
    statoEsteroNascita?: string;
    localitaEsteraNascita?: string;
    // Residenza
    comuneResidenza?: string;
    codiceComuneResidenza?: string;
    provinciaResidenza?: string;
    codiceProvinciaResidenza?: string;
    siglaProvinciaResidenza?: string;
    indirizzoResidenza?: string;
    numeroCivicoResidenza?: string;
    capResidenza?: string;
    dugResidenza?: string;
    toponimoResidenza?: string;
    indirizzo?: string;
  } | null;
  soggettoVeicolo?: any;
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

// Mappa di normalizzazione causale: converte vecchi valori stringa nei codici API corretti
const CAUSALE_NORMALIZE_MAP: Record<string, string> = {
  'DEMOLIZIONE': 'D',
  'ROTTAMAZIONE': 'D',
  'CESSAZIONE': 'D',
  'FURTO': 'D',
  'INCIDENTE': 'D',
  'SD DEMOLIZIONE': 'SD',
  'PA DEMOLIZIONE SU PROVVEDIMENTO PA': 'PA',
  'VEICOLI NON RICONOSCIUTI': 'NN',
};

function normalizeCausale(causale: string): string {
  if (!causale) return 'D';
  const upper = causale.trim().toUpperCase();
  return CAUSALE_NORMALIZE_MAP[upper] || causale;
}

// Targhe di test ambiente formazione (confermate da ACI 26/02/2026)
export const TARGHE_TEST_FORMAZIONE = [
  // Trattori (tipoVeicolo T) — registrazione confermata funzionante
  'AG004557', 'AG004559', 'AG004561', 'AG004563',
  // Autoveicoli con CF NTSPRM71L20H501B — ricerca veicolo funzionante
  'VA189AJ', 'VA227AJ', 'VA229AJ', 'VA231AJ',
  // Altre targhe ambiente formazione (da verificare)
  'VA076AJ', 'VA185AJ', 'VA187AJ', 'VA205AJ', 'VA207AJ', 'VA209AJ',
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

  /** Root domain (es. https://formazione.ilportaledeltrasporto.it) senza path RVFU */
  private get rootUrl(): string {
    try {
      const u = new URL(this.baseUrl);
      return `${u.protocol}//${u.host}`;
    } catch {
      return this.baseUrl.replace(/\/rvfu\/sh$/, '');
    }
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

        // apiCallDirect resolve() restituisce direttamente il dato parsato (JSON o stringa).
        // Gli errori (4xx/5xx) vengono gestiti con reject() dall'IPC handler.
        // Se il risultato ha statusCode, è un wrapper legacy — estraiamo il body.
        if (result && typeof result === 'object' && 'statusCode' in result && 'body' in result) {
          // Formato wrapper legacy: { statusCode, body, headers }
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
              return retry;
            }
            throw new Error(`RVFU API ${result.statusCode}: Sessione scaduta. Effettua nuovamente il login.`);
          }
          if (result.statusCode >= 400) {
            throw new Error(`RVFU API ${result.statusCode}: ${String(result.body).substring(0, 200)}`);
          }
          return typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
        }

        // Formato diretto: apiCallDirect restituisce il dato parsato
        return result;
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
    if (params.causale) searchParams.causale = normalizeCausale(params.causale);
    if (params.tipoVeicolo) searchParams.tipoVeicolo = params.tipoVeicolo;
    if (params.targa) searchParams.targa = params.targa;
    if (params.telaio) searchParams.telaio = params.telaio;
    if (params.codiceFiscale) searchParams.codiceFiscale = params.codiceFiscale;

    console.log('[RVFU Client] verificaVeicolo:', searchParams);

    const response = await this.makeRequest('/cr/veicolo', {
      method: 'GET',
      params: searchParams,
    });

    console.log('[RVFU Client] verificaVeicolo RAW response:', JSON.stringify(response, null, 2)?.substring(0, 1000));

    // Esito check
    const esito = response?.esito;
    if (esito && esito.responseStatus !== 'OK') {
      console.error('[RVFU Client] verificaVeicolo esito non OK:', esito);
      const errorMsg = esito.message || 'Errore nella ricerca veicolo';
      throw new Error(`${errorMsg} (codice: ${esito.code || 'N/A'})`);
    }

    const veicolo = response?.result || response?.payload || response;
    if (!veicolo || (!veicolo.targa && !veicolo.telaio)) {
      console.warn('[RVFU Client] verificaVeicolo: veicolo non trovato o senza targa/telaio');
      return null;
    }

    // soggettoVeicolo è popolato solo se codiceFiscale è stato fornito nella ricerca
    const soggetto = veicolo.soggettoVeicolo || veicolo.intestatario || veicolo.detentore || null;

    // L'API ACI restituisce marca+modello insieme nel campo "modello" (es. "NISSAN K12 H H01   MICRA ")
    // Estraiamo marca come prima parola, il resto è modello
    let marca = '';
    let modello = veicolo.modello || '';
    if (modello && !veicolo.marca) {
      const parts = modello.trim().split(/\s+/);
      marca = parts[0] || '';
      modello = parts.slice(1).join(' ').trim() || modello;
    } else {
      marca = veicolo.marca || '';
    }

    // Fix formato data: "2023-06-23T00:00:00" → "2023-06-23" per input type="date"
    const fixDate = (d: string | null | undefined): string => {
      if (!d) return '';
      return d.includes('T') ? d.split('T')[0] : d;
    };

    // radiabile/radiato: l'API restituisce "SI"/"NO", normalizziamo
    const isRadiabile = veicolo.radiabile === 'SI' || veicolo.radiabile === 'S' || veicolo.radiabileFlag === true;
    const isRadiato = veicolo.radiato === 'SI' || veicolo.radiato === 'S' || veicolo.radiatoFlag === true;

    return {
      targa: veicolo.targa || '',
      tipoVeicolo: veicolo.tipoVeicolo || params.tipoVeicolo || '',
      telaio: veicolo.telaio || '',
      marca,
      modello,
      marca_modello: (veicolo.modello || '').trim(),
      cilindrata: veicolo.cilindrata,
      potenza: veicolo.potenza,
      annoImmatricolazione: veicolo.annoImmatricolazione,
      dataPrimaImmatricolazione: fixDate(veicolo.dataPrimaImmatricolazione),
      dataImmatricolazione: fixDate(veicolo.dataImmatricolazione),
      statoPRA: veicolo.statoPRA,
      obbligoIscrizionePRA: veicolo.obbligoIscrizionePRA || (veicolo.obbligoIscrizionePraFlag ? 'S' : 'N'),
      obbligoIscrizionePraFlag: veicolo.obbligoIscrizionePraFlag === true || veicolo.obbligoIscrizionePRA === 'S',
      radiabile: isRadiabile ? 'S' : 'N',
      radiabileFlag: isRadiabile,
      radiato: isRadiato ? 'S' : 'N',
      radiatoFlag: isRadiato,
      forzabile: veicolo.forzabile,
      vincoloOstativo: veicolo.vincoloOstativo === 'NO' ? null : veicolo.vincoloOstativo,
      ostativiEForzature: veicolo.ostativiEForzature,
      causale: veicolo.causale,
      cic: veicolo.cic,
      pesoComplessivo: veicolo.pesoComplessivo,
      tipoUtilizzoVeicolo: veicolo.tipoUtilizzoVeicolo,
      destinazioneVeicolo: veicolo.destinazioneVeicolo,
      regimeVeicolo: veicolo.regimeVeicolo,
      // Soggetto/intestatario (null se non fornito CF nella ricerca)
      // L'API ACI restituisce provincia/comune come oggetti nested:
      //   provinciaResidenza: { codice: "058", denominazione: "ROMA", sigla: "RM" }
      //   comuneResidenza: { codice: "091", denominazione: "ROMA" }
      proprietario: soggetto ? {
        codiceFiscale: soggetto.codiceFiscale,
        cognome: soggetto.cognome,
        nome: soggetto.nome,
        dataNascita: fixDate(soggetto.dataNascita),
        tipoSoggettoEnum: soggetto.tipoSoggettoEnum,
        // Nascita — possono essere null, stringhe o oggetti
        comuneNascita: typeof soggetto.comuneNascita === 'object' ? soggetto.comuneNascita?.denominazione : soggetto.comuneNascita,
        codiceComuneNascita: typeof soggetto.comuneNascita === 'object' ? soggetto.comuneNascita?.codice : undefined,
        provinciaNascita: typeof soggetto.provinciaNascita === 'object' ? soggetto.provinciaNascita?.denominazione : soggetto.provinciaNascita,
        codiceProvinciaNascita: typeof soggetto.provinciaNascita === 'object' ? soggetto.provinciaNascita?.codice : undefined,
        siglaProvinciaNascita: typeof soggetto.provinciaNascita === 'object' ? soggetto.provinciaNascita?.sigla : undefined,
        statoEsteroNascita: soggetto.statoEsteroNascita,
        localitaEsteraNascita: soggetto.localitaEsteraNascita,
        // Residenza — sempre oggetti nested dall'ACI
        comuneResidenza: typeof soggetto.comuneResidenza === 'object' ? soggetto.comuneResidenza?.denominazione : soggetto.comuneResidenza,
        codiceComuneResidenza: typeof soggetto.comuneResidenza === 'object' ? soggetto.comuneResidenza?.codice : undefined,
        provinciaResidenza: typeof soggetto.provinciaResidenza === 'object' ? soggetto.provinciaResidenza?.denominazione : soggetto.provinciaResidenza,
        codiceProvinciaResidenza: typeof soggetto.provinciaResidenza === 'object' ? soggetto.provinciaResidenza?.codice : undefined,
        siglaProvinciaResidenza: typeof soggetto.provinciaResidenza === 'object' ? soggetto.provinciaResidenza?.sigla : undefined,
        // Indirizzo residenza
        indirizzoResidenza: soggetto.indirizzoResidenza,
        numeroCivicoResidenza: soggetto.numeroCivicoResidenza,
        capResidenza: soggetto.capResidenza,
        dugResidenza: soggetto.dugResidenza,
        toponimoResidenza: soggetto.toponimoResidenza,
        indirizzo: soggetto.indirizzo || soggetto.indirizzoResidenza,
      } : null,
      soggettoVeicolo: soggetto,
      codiceFiscale: soggetto?.codiceFiscale,
      numeroTelaio: veicolo.telaio || '',
      colore: veicolo.colore,
      alimentazione: veicolo.alimentazione,
      categoria: veicolo.categoria,
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
    const params = this.buildListFilters(filters);
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
    return this.makeRequest(`/cr/VFU/${idVFU}`, {
      method: 'GET',
    });
  }

  /**
   * POST /cr/genera/certificatoRottamazione — Genera CDR
   */
  async generaCDR(idVFU: number): Promise<any> {
    return this.makeRequest(`/cr/genera/certificatoRottamazione/${idVFU}`, {
      method: 'POST',
    });
  }

  /**
   * POST /cr/genera/ricevutaPresaInCarico — Genera ricevuta
   */
  async generaRicevuta(idVFU: number): Promise<any> {
    return this.makeRequest(`/cr/genera/ricevutaPresaInCarico/${idVFU}`, {
      method: 'POST',
    });
  }

  /**
   * POST /cr/allega/documentoVFU — Allega documento al fascicolo
   */
  async allegaDocumento(idVFU: number, payload: any): Promise<any> {
    return this.makeRequest(`/cr/allega/documentoVFU/${idVFU}`, {
      method: 'POST',
      body: payload,
    });
  }

  /**
   * GET /cr/documentoVFU — Dettaglio fascicolo documenti
   */
  async downloadDocumento(params: { idAci?: number; idFascicolo?: number; progressivoDocumento?: number }): Promise<any> {
    const qp: Record<string, string> = {};
    if (params.idAci !== undefined) qp.idAci = String(params.idAci);
    if (params.idFascicolo !== undefined) qp.idFascicolo = String(params.idFascicolo);
    if (params.progressivoDocumento !== undefined) qp.progressivoDocumento = String(params.progressivoDocumento);
    return this.makeRequest('/cr/documentoVFU', {
      method: 'GET',
      params: qp,
    });
  }

  /**
   * PUT /cr/verifica/VFU/{idVFU}/{causale} — Verifica VFU (PRESO_IN_CARICO → VALIDATO)
   */
  async verificaVFU(idVFU: number, causale: string): Promise<any> {
    return this.makeRequest(`/cr/verifica/VFU/${idVFU}/${causale}`, {
      method: 'PUT',
    });
  }

  /**
   * GET /cr/verifica/fascicolo/{idFascicolo} — Verifica fascicolo (legacy)
   */
  async verificaFascicolo(idFascicolo: number): Promise<any> {
    return this.makeRequest(`/cr/verifica/fascicolo/${idFascicolo}`, {
      method: 'GET',
    });
  }

  /**
   * POST /cr/inoltraSTA/VFU — Inoltra a STA per radiazione
   */
  async inoltraSTA(codiceSTA: string, idVFUList: number[]): Promise<any> {
    return this.makeRequest(`/cr/inoltraSTA/VFU/${codiceSTA}`, {
      method: 'PUT',
      body: idVFUList,
    });
  }

  /**
   * POST /cr/chiudi/fascicolo — Chiudi fascicolo
   */
  async chiudiFascicolo(idVFU: number): Promise<any> {
    return this.makeRequest(`/cr/chiudi/fascicolo/${idVFU}`, {
      method: 'PUT',
    });
  }

  /**
   * POST /cr/prendiInCarico/VFU — Prendi in carico VFU conferito
   */
  async prendiInCarico(idVFU: number, payload?: any): Promise<any> {
    return this.makeRequest(`/cr/prendiInCarico/VFU/${idVFU}`, {
      method: 'PUT',
      body: payload,
    });
  }

  /**
   * GET /cr/consultaPresaInCarico/VFU — Lista VFU da prendere in carico
   */
  async consultaPresaInCarico(filters: any = {}): Promise<any> {
    return this.makeRequest('/cr/consultaPresaInCarico/VFU', {
      method: 'GET',
      params: this.buildListFilters(filters),
    });
  }

  /**
   * GET /cr/agenziaSTA/{codiceAgenzia} — Ricerca agenzia STA
   */
  async ricercaAgenziaSTA(codiceAgenzia: string): Promise<any> {
    return this.makeRequest(`/cr/agenziaSTA/${encodeURIComponent(codiceAgenzia)}`, {
      method: 'GET',
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // VEICOLO — Causali
  // ═══════════════════════════════════════════════════════════════

  /** GET /cr/causali — Lista causali */
  async getCausali(): Promise<any> {
    return this.makeRequest('/cr/causali', { method: 'GET' });
  }

  /** GET /cr/causalePerCodice/{codiceCausale} — Causale per codice */
  async getCausalePerCodice(codiceCausale: string): Promise<any> {
    return this.makeRequest(`/cr/causalePerCodice/${codiceCausale}`, { method: 'GET' });
  }

  // ═══════════════════════════════════════════════════════════════
  // VFU — Operazioni sul veicolo fuori uso
  // ═══════════════════════════════════════════════════════════════

  /** PUT /cr/VFU/{idVFU} — Modifica VFU */
  async aggiornaVFU(idVFU: number, payload: any): Promise<any> {
    return this.makeRequest(`/cr/VFU/${idVFU}`, { method: 'PUT', body: payload });
  }

  /** PUT /cr/annulla/VFU/{idVFU} — Annulla VFU */
  async annullaVFU(idVFU: number, payload?: any): Promise<any> {
    return this.makeRequest(`/cr/annulla/VFU/${idVFU}`, { method: 'PUT', body: payload });
  }

  /** PUT /cr/annullaInoltroSTA/VFU/{idVFU} — Annulla inoltro STA */
  async annullaInoltroSTA(idVFU: number): Promise<any> {
    return this.makeRequest(`/cr/annullaInoltroSTA/VFU/${idVFU}`, { method: 'PUT' });
  }

  /** PUT /cr/cedi/VFU/{idVFU} — Cedi VFU */
  async cediVFU(idVFU: number, payload: any): Promise<any> {
    return this.makeRequest(`/cr/cedi/VFU/${idVFU}`, { method: 'PUT', body: payload });
  }

  /** PUT /cr/confermaRadiazioneVFU/VFU/{idVFU} — Conferma radiazione */
  async confermaRadiazione(idVFU: number): Promise<any> {
    return this.makeRequest(`/cr/confermaRadiazioneVFU/VFU/${idVFU}`, { method: 'PUT' });
  }

  /** PUT /cr/demolisci/VFU/{idVFU} — Segna come demolito */
  async demolisciVFU(idVFU: number, payload: any): Promise<any> {
    return this.makeRequest(`/cr/demolisci/VFU/${idVFU}`, { method: 'PUT', body: payload });
  }

  /** POST /cr/filtroDatiDU/VFU/{idVFU}/{filterValue} — Switch filtro dati DU */
  async filtroDatiDU(idVFU: number, filterValue: boolean): Promise<any> {
    return this.makeRequest(`/cr/filtroDatiDU/VFU/${idVFU}/${filterValue}`, { method: 'POST' });
  }

  /** PUT /cr/trasferisci/VFU/{idVFU} — Trasferisci VFU */
  async trasferisciVFU(idVFU: number, payload: any): Promise<any> {
    return this.makeRequest(`/cr/trasferisci/VFU/${idVFU}`, { method: 'PUT', body: payload });
  }

  /** PUT /cr/integra/VFU/{idVFU} — Integra dati richiesti da STA */
  async integraVFU(idVFU: number, payload: any): Promise<any> {
    return this.makeRequest(`/cr/integra/VFU/${idVFU}`, { method: 'PUT', body: payload });
  }

  // ═══════════════════════════════════════════════════════════════
  // VFU — Consultazioni
  // ═══════════════════════════════════════════════════════════════

  private buildListFilters(filters: any): Record<string, string> {
    const params: Record<string, string> = {};
    const keys = [
      'targa', 'telaio', 'tipoVeicolo', 'statoVFU', 'obbligoIscrizionePRA',
      'codiceFiscaleRitiro', 'codiceAgenziaSTA', 'notePartiRifiuti', 'includiDemoliti',
      'dataInserimentoDa', 'dataInserimentoA', 'dataRitiroDa', 'dataRitiroA',
      'dataConferimentoDa', 'dataConferimentoA', 'dataPresaInCaricoDa', 'dataPresaInCaricoA',
      'dataRadiazioneDa', 'dataRadiazioneA', 'dataNotificaInoltroSTADa', 'dataNotificaInoltroSTAA',
      'dataAggiornamentoDa', 'dataAggiornamentoA', 'targaOTelaio', 'obbligoIscrizionePra',
      'pageNumber', 'pageSize', 'paged', 'offset', 'sort.sorted', 'sort.unsorted', 'unpaged',
    ];
    for (const k of keys) {
      if (filters[k] !== undefined && filters[k] !== null && filters[k] !== '') {
        params[k] = String(filters[k]);
      }
    }
    return params;
  }

  /** GET /cr/consultaRadiati/VFU — Lista VFU radiati */
  async consultaRadiati(filters: any = {}): Promise<any> {
    return this.makeRequest('/cr/consultaRadiati/VFU', { method: 'GET', params: this.buildListFilters(filters) });
  }

  /** GET /cr/consultaRichiestaIntegrazione/VFU — Lista richieste integrazione STA */
  async consultaRichiestaIntegrazione(filters: any = {}): Promise<any> {
    return this.makeRequest('/cr/consultaRichiestaIntegrazione/VFU', { method: 'GET', params: this.buildListFilters(filters) });
  }

  /** GET /cr/consultaRottamazione/VFU — Lista VFU in rottamazione */
  async consultaRottamazione(filters: any = {}): Promise<any> {
    return this.makeRequest('/cr/consultaRottamazione/VFU', { method: 'GET', params: this.buildListFilters(filters) });
  }

  /** GET /cr/storico/VFU — Storico VFU */
  async storicoVFU(filters: any = {}): Promise<any> {
    return this.makeRequest('/cr/storico/VFU', { method: 'GET', params: this.buildListFilters(filters) });
  }

  // ═══════════════════════════════════════════════════════════════
  // VFU — Export XLSX
  // ═══════════════════════════════════════════════════════════════

  /** GET /cr/export/VFU — Export XLSX lista VFU */
  async exportVFU(filters: any = {}): Promise<any> {
    return this.makeRequest('/cr/export/VFU', { method: 'GET', params: this.buildListFilters(filters) });
  }

  /** GET /cr/exportPresaInCarico/VFU — Export XLSX presa in carico */
  async exportPresaInCarico(filters: any = {}): Promise<any> {
    return this.makeRequest('/cr/exportPresaInCarico/VFU', { method: 'GET', params: this.buildListFilters(filters) });
  }

  /** GET /cr/exportRadiati/VFU — Export XLSX radiati */
  async exportRadiati(filters: any = {}): Promise<any> {
    return this.makeRequest('/cr/exportRadiati/VFU', { method: 'GET', params: this.buildListFilters(filters) });
  }

  /** GET /cr/exportRottamazione/VFU — Export XLSX rottamazione */
  async exportRottamazione(filters: any = {}): Promise<any> {
    return this.makeRequest('/cr/exportRottamazione/VFU', { method: 'GET', params: this.buildListFilters(filters) });
  }

  // ═══════════════════════════════════════════════════════════════
  // VFU — Stampa PDF
  // ═══════════════════════════════════════════════════════════════

  /** GET /cr/stampa/VFU — Stampa PDF lista VFU */
  async stampaVFU(filters: any = {}): Promise<any> {
    return this.makeRequest('/cr/stampa/VFU', { method: 'GET', params: this.buildListFilters(filters) });
  }

  /** GET /cr/stampaPresaInCarico/VFU — Stampa PDF presa in carico */
  async stampaPresaInCarico(filters: any = {}): Promise<any> {
    return this.makeRequest('/cr/stampaPresaInCarico/VFU', { method: 'GET', params: this.buildListFilters(filters) });
  }

  /** GET /cr/stampaRadiati/VFU — Stampa PDF radiati */
  async stampaRadiati(filters: any = {}): Promise<any> {
    return this.makeRequest('/cr/stampaRadiati/VFU', { method: 'GET', params: this.buildListFilters(filters) });
  }

  /** GET /cr/stampaRottamazione/VFU — Stampa PDF rottamazione */
  async stampaRottamazione(filters: any = {}): Promise<any> {
    return this.makeRequest('/cr/stampaRottamazione/VFU', { method: 'GET', params: this.buildListFilters(filters) });
  }

  // ═══════════════════════════════════════════════════════════════
  // DELEGA
  // ═══════════════════════════════════════════════════════════════

  /** GET /cr/consulta/delega — Lista deleghe */
  async consultaDeleghe(filters: any = {}): Promise<any> {
    const params: Record<string, string> = {};
    if (filters.codiceFiscale) params.codiceFiscale = filters.codiceFiscale;
    if (filters.statoDelega) params.statoDelega = filters.statoDelega;
    if (filters.dataInizioDa) params.dataInizioDa = filters.dataInizioDa;
    if (filters.dataInizioA) params.dataInizioA = filters.dataInizioA;
    if (filters.dataFineDa) params.dataFineDa = filters.dataFineDa;
    if (filters.dataFineA) params.dataFineA = filters.dataFineA;
    if (filters.pageNumber !== undefined) params.pageNumber = String(filters.pageNumber);
    if (filters.pageSize !== undefined) params.pageSize = String(filters.pageSize);
    return this.makeRequest('/cr/consulta/delega', { method: 'GET', params });
  }

  /** POST /cr/delega — Inserisci nuova delega */
  async inserisciDelega(payload: any): Promise<any> {
    return this.makeRequest('/cr/delega', { method: 'POST', body: payload });
  }

  /** GET /cr/delega/{idDelega} — Dettaglio delega */
  async dettaglioDelega(idDelega: number): Promise<any> {
    return this.makeRequest(`/cr/delega/${idDelega}`, { method: 'GET' });
  }

  /** PUT /cr/delega/{idDelega} — Aggiorna delega */
  async aggiornaDelega(idDelega: number, payload: any): Promise<any> {
    return this.makeRequest(`/cr/delega/${idDelega}`, { method: 'PUT', body: payload });
  }

  /** DELETE /cr/delega/{idDelega} — Annulla delega */
  async eliminaDelega(idDelega: number): Promise<any> {
    return this.makeRequest(`/cr/delega/${idDelega}`, { method: 'DELETE' });
  }

  /** PUT /cr/revoca/delega/{idDelega} — Revoca delega */
  async revocaDelega(idDelega: number, payload?: any): Promise<any> {
    return this.makeRequest(`/cr/revoca/delega/${idDelega}`, { method: 'PUT', body: payload });
  }

  /** GET /cr/stampa/delega — Stampa PDF deleghe */
  async stampaDeleghe(filters: any = {}): Promise<any> {
    const params: Record<string, string> = {};
    if (filters.codiceFiscale) params.codiceFiscale = filters.codiceFiscale;
    if (filters.statoDelega) params.statoDelega = filters.statoDelega;
    if (filters.pageNumber !== undefined) params.pageNumber = String(filters.pageNumber);
    if (filters.pageSize !== undefined) params.pageSize = String(filters.pageSize);
    return this.makeRequest('/cr/stampa/delega', { method: 'GET', params });
  }

  // ═══════════════════════════════════════════════════════════════
  // FASCICOLO
  // ═══════════════════════════════════════════════════════════════

  /** GET /cr/consulta/documentoVFU/{idVFU} — Lista documenti fascicolo */
  async consultaDocumenti(idVFU: number): Promise<any> {
    return this.makeRequest(`/cr/consulta/documentoVFU/${idVFU}`, { method: 'GET' });
  }

  /** POST /cr/documentoVFU — Elimina documento */
  async eliminaDocumento(payload: any): Promise<any> {
    return this.makeRequest('/cr/documentoVFU', { method: 'POST', body: payload });
  }

  /** PUT /cr/documentoVFU — Sostituisci documento */
  async sostituisciDocumento(payload: any): Promise<any> {
    return this.makeRequest('/cr/documentoVFU', { method: 'PUT', body: payload });
  }

  /** GET /cr/fascicolo/{idFascicolo} — Dettaglio fascicolo */
  async dettaglioFascicoloById(idFascicolo: number): Promise<any> {
    return this.makeRequest(`/cr/fascicolo/${idFascicolo}`, { method: 'GET' });
  }

  /** POST /cr/genera/postillaCdr/{idVFU} — Genera postilla CDR */
  async generaPostillaCdr(idVFU: number, payload: any): Promise<any> {
    return this.makeRequest(`/cr/genera/postillaCdr/${idVFU}`, { method: 'POST', body: payload });
  }

  /** PUT /cr/inviaAlTablet/{idFascicolo} — Invia documenti al tablet */
  async inviaAlTablet(idFascicolo: number): Promise<any> {
    return this.makeRequest(`/cr/inviaAlTablet/${idFascicolo}`, { method: 'PUT' });
  }

  /** PUT /cr/riapri/fascicolo/{idVFU} — Riapri fascicolo */
  async riapriFascicolo(idVFU: number): Promise<any> {
    return this.makeRequest(`/cr/riapri/fascicolo/${idVFU}`, { method: 'PUT' });
  }

  /** DELETE /cr/cartellaFirma/{idCartella} — Annulla e clona cartella firma */
  async annullaCartellaFirma(idCartella: number): Promise<any> {
    return this.makeRequest(`/cr/cartellaFirma/${idCartella}`, { method: 'DELETE' });
  }

  // ═══════════════════════════════════════════════════════════════
  // IMPRESA — Gestione VFU
  // ═══════════════════════════════════════════════════════════════

  /** GET /cr/VFU/{idVFU}/sediTrasferimento — Sedi trasferimento per un VFU */
  async sediTrasferimento(idVFU: number, filters: any = {}): Promise<any> {
    const params: Record<string, string> = {};
    if (filters.codiceProvincia) params.codiceProvincia = filters.codiceProvincia;
    if (filters.pageNumber !== undefined) params.pageNumber = String(filters.pageNumber);
    if (filters.pageSize !== undefined) params.pageSize = String(filters.pageSize);
    return this.makeRequest(`/cr/VFU/${idVFU}/sediTrasferimento`, { method: 'GET', params });
  }

  /** GET /cr/consulta/centroRaccolta — Lista centri raccolta */
  async consultaCentroRaccolta(filters: any = {}): Promise<any> {
    const params: Record<string, string> = {};
    if (filters.codiceProvincia) params.codiceProvincia = filters.codiceProvincia;
    if (filters.pageNumber !== undefined) params.pageNumber = String(filters.pageNumber);
    if (filters.pageSize !== undefined) params.pageSize = String(filters.pageSize);
    return this.makeRequest('/cr/consulta/centroRaccolta', { method: 'GET', params });
  }

  /** GET /cr/consulta/concessionario — Lista concessionari delegabili */
  async consultaConcessionario(codiceFiscale: string): Promise<any> {
    return this.makeRequest('/cr/consulta/concessionario', {
      method: 'GET',
      params: { codiceFiscale },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITY
  // ═══════════════════════════════════════════════════════════════

  /** GET /utility/detail/utente — Dettaglio utente corrente */
  async getDettaglioUtente(): Promise<any> {
    return this.makeRequest('/utility/detail/utente', { method: 'GET' });
  }

  /** GET /utility/provincia — Lista province */
  async getProvince(sigla?: string): Promise<any> {
    const params: Record<string, string> = {};
    if (sigla) params.sigla = sigla;
    return this.makeRequest('/utility/provincia', { method: 'GET', params });
  }

  /** GET /utility/comune — Lista comuni per provincia */
  async getComuni(siglaProvincia: string, nomeComune?: string): Promise<any> {
    const params: Record<string, string> = { siglaProvincia };
    if (nomeComune) params.nomeComune = nomeComune;
    return this.makeRequest('/utility/comune', { method: 'GET', params });
  }

  /** GET /utility/provincia/{codiceDtt}/comune — Comuni correnti per provincia */
  async getComuniPerProvincia(codiceDtt: string): Promise<any> {
    return this.makeRequest(`/utility/provincia/${codiceDtt}/comune`, { method: 'GET' });
  }

  /** GET /utility/statiEsteri — Lista stati esteri */
  async getStatiEsteri(): Promise<any> {
    return this.makeRequest('/utility/statiEsteri', { method: 'GET' });
  }

  /** GET /utility/statoEstero — Ricerca stato estero */
  async ricercaStatoEstero(nome?: string): Promise<any> {
    const params: Record<string, string> = {};
    if (nome) params.nome = nome;
    return this.makeRequest('/utility/statoEstero', { method: 'GET', params });
  }

  // ═══════════════════════════════════════════════════════════════
  // MONITORAGGIO
  // ═══════════════════════════════════════════════════════════════

  /** GET /mon/status/up — Health check */
  async checkStatus(): Promise<any> {
    return this.makeRequest('/mon/status/up', { method: 'GET' });
  }

  // ═══════════════════════════════════════════════════════════════
  // PAGOPA — Nuovo Sistema Pagamenti (SpecificheWS-NuovoSistemaPagamenti-1.14)
  // Base path: /pagamenti/sh/v1/... e /anagrafica/sh/v1/...
  // ═══════════════════════════════════════════════════════════════

  /**
   * Request con base path assoluto (non /rvfu/sh).
   * Usato per PagoPA (/pagamenti/sh/v1) e Anagrafica (/anagrafica/sh/v1).
   */
  private async makeRequestAbsolute(
    absolutePath: string,
    options: { method?: string; params?: Record<string, string>; body?: any } = {}
  ): Promise<any> {
    const url = new URL(`${this.rootUrl}${absolutePath}`);

    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      }
    }

    const headers: Record<string, string> = { 'Accept': 'application/json' };

    try {
      headers['Authorization'] = this.authService.getAuthHeader();
    } catch {
      throw new Error('Token RVFU non disponibile. Effettua il login.');
    }

    if (options.body) headers['Content-Type'] = 'application/json';

    const method = options.method || 'GET';
    const bodyStr = options.body
      ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
      : undefined;

    console.log(`[RVFU Client PagoPA] ${method} ${url.pathname}${url.search}`);

    const electronApi = typeof globalThis.window !== 'undefined' ? (globalThis.window as any).api : null;
    if (electronApi?.rvfu?.apiCallDirect) {
      const result = await electronApi.rvfu.apiCallDirect({ method, url: url.toString(), headers, body: bodyStr });
      if (result && typeof result === 'object' && 'statusCode' in result && 'body' in result) {
        if (result.statusCode >= 400) throw new Error(`PagoPA API ${result.statusCode}: ${String(result.body).substring(0, 200)}`);
        return typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
      }
      return result;
    }

    const response = await fetch(url.toString(), { method, headers, body: bodyStr, credentials: 'include' });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`PagoPA API ${response.status}: ${text.substring(0, 200)}`);
    }
    const ct = response.headers.get('Content-Type') || '';
    return ct.includes('application/json') ? response.json() : response.text();
  }

  // ─── 4.1 Gestione Tariffario ────────────────────────────────

  /** GET /pagamenti/sh/v1/catalogo/tariffario — Ricerca tipo tariffario */
  async ricercaTipoTariffario(params?: { codiceTipoTariffario?: string; codiceProvincia?: string; siglaProvincia?: string }): Promise<any> {
    const p: Record<string, string> = {};
    if (params?.codiceTipoTariffario) p.codiceTipoTariffario = params.codiceTipoTariffario;
    if (params?.codiceProvincia) p.codiceProvincia = params.codiceProvincia;
    if (params?.siglaProvincia) p.siglaProvincia = params.siglaProvincia;
    return this.makeRequestAbsolute('/pagamenti/sh/v1/catalogo/tariffario', { method: 'GET', params: p });
  }

  /** GET /pagamenti/sh/v1/catalogo/corrispondenzatariffe — Corrispondenza tariffe nuove/vecchie */
  async corrispondenzaTariffe(codiceTipoTariffario: string, params?: { codicePraticaMctc?: string; vecchioCodTariffa?: string; nuovoCodTariffa?: string }): Promise<any> {
    const p: Record<string, string> = { codiceTipoTariffario };
    if (params?.codicePraticaMctc) p.codicePraticaMctc = params.codicePraticaMctc;
    if (params?.vecchioCodTariffa) p.vecchioCodTariffa = params.vecchioCodTariffa;
    if (params?.nuovoCodTariffa) p.nuovoCodTariffa = params.nuovoCodTariffa;
    return this.makeRequestAbsolute('/pagamenti/sh/v1/catalogo/corrispondenzatariffe', { method: 'GET', params: p });
  }

  /** GET /pagamenti/sh/v1/catalogo/elencocompleto — Catalogo completo pratiche/tariffe (cacheable, max 1x/giorno) */
  async catalogoPraticheTariffeCompleto(): Promise<any> {
    return this.makeRequestAbsolute('/pagamenti/sh/v1/catalogo/elencocompleto', { method: 'GET' });
  }

  // ─── 4.2 Gestione Cassetto Pagamenti ─────────────────────────

  /** POST /pagamenti/sh/v1/cassetto/inserimentoSpontaneo — Inserimento richieste pagamento (ASINCRONO) */
  async inserimentoPagamentoAsync(payload: any): Promise<any> {
    return this.makeRequestAbsolute('/pagamenti/sh/v1/cassetto/inserimentoSpontaneo', { method: 'POST', body: payload });
  }

  /** POST /pagamenti/sh/v1/cassetto/inserimentospontaneosync — Inserimento richieste pagamento (SINCRONO) */
  async inserimentoPagamentoSync(payload: any): Promise<any> {
    return this.makeRequestAbsolute('/pagamenti/sh/v1/cassetto/inserimentospontaneosync', { method: 'POST', body: payload });
  }

  /** GET /pagamenti/sh/v1/cassetto/ricerca/richiestaPagamento — Ricerca richieste pagamento */
  async ricercaRichiestePagamento(params?: Record<string, string>): Promise<any> {
    return this.makeRequestAbsolute('/pagamenti/sh/v1/cassetto/ricerca/richiestaPagamento', { method: 'GET', params });
  }

  /** PUT /pagamenti/sh/v1/cassetto/cancellarichiesta/{idRichiesta} — Cancella richiesta non pagata */
  async cancellaRichiestaPagamento(idRichiesta: number): Promise<any> {
    return this.makeRequestAbsolute(`/pagamenti/sh/v1/cassetto/cancellarichiesta/${idRichiesta}`, { method: 'PUT' });
  }

  /** GET /pagamenti/sh/v1/cassetto/stampaavvisopagamento/{id} — PDF avviso pagamento (base64) */
  async stampaAvvisoPagamento(idRichiestaPagamento: number): Promise<any> {
    return this.makeRequestAbsolute(`/pagamenti/sh/v1/cassetto/stampaavvisopagamento/${idRichiestaPagamento}`, { method: 'GET' });
  }

  /** GET /pagamenti/sh/v1/cassetto/stamparicevutatelematica/{id} — PDF ricevuta pagamento (base64) */
  async stampaRicevutaPagamento(idRichiestaPagamento: number): Promise<any> {
    return this.makeRequestAbsolute(`/pagamenti/sh/v1/cassetto/stamparicevutatelematica/${idRichiestaPagamento}`, { method: 'GET' });
  }

  /** POST /pagamenti/sh/v1/cassetto/abbinamento/abilita/automatico/{idRichiesta}/{flag} — Modifica flag abbinamento */
  async modificaFlagAbbinamento(idRichiesta: number, flagAbbinamentoAutomatico: 'S' | 'N'): Promise<any> {
    return this.makeRequestAbsolute(`/pagamenti/sh/v1/cassetto/abbinamento/abilita/automatico/${idRichiesta}/${flagAbbinamentoAutomatico}`, { method: 'POST' });
  }

  /** GET /pagamenti/sh/v1/cassetto/saldo — Verifica pagamenti (totale richieste pagata per tariffa) */
  async verificaPagamenti(params: { codiceTipoPratica?: string; codiceTipoTariffario: string; codiceTipoPraticaMctc?: string }): Promise<any> {
    const p: Record<string, string> = { codiceTipoTariffario: params.codiceTipoTariffario };
    if (params.codiceTipoPratica) p.codiceTipoPratica = params.codiceTipoPratica;
    if (params.codiceTipoPraticaMctc) p.codiceTipoPraticaMctc = params.codiceTipoPraticaMctc;
    return this.makeRequestAbsolute('/pagamenti/sh/v1/cassetto/saldo', { method: 'GET', params: p });
  }

  /** POST /pagamenti/sh/v1/cassetto/inserimentospontaneosync/contoterzi — Inserimento pagamento conto terzi */
  async inserimentoPagamentoContoTerzi(payload: any): Promise<any> {
    return this.makeRequestAbsolute('/pagamenti/sh/v1/cassetto/inserimentospontaneosync/contoterzi', { method: 'POST', body: payload });
  }

  /** GET /pagamenti/sh/v1/cassetto/saldoCompleto — Saldo completo cassetto */
  async saldoCompleto(): Promise<any> {
    return this.makeRequestAbsolute('/pagamenti/sh/v1/cassetto/saldoCompleto', { method: 'GET' });
  }

  /** GET /pagamenti/sh/v1/cassetto/richiestePagate — Ricerca richieste pagate pronte per abbinamento */
  async ricercaRichiestePagate(params?: { codiceTariffa?: string; codiceTipoTariffario?: string; flagAbbinamentoAutomatico?: string }): Promise<any> {
    const p: Record<string, string> = {};
    if (params?.codiceTariffa) p.codiceTariffa = params.codiceTariffa;
    if (params?.codiceTipoTariffario) p.codiceTipoTariffario = params.codiceTipoTariffario;
    if (params?.flagAbbinamentoAutomatico) p.flagAbbinamentoAutomatico = params.flagAbbinamentoAutomatico;
    return this.makeRequestAbsolute('/pagamenti/sh/v1/cassetto/richiestePagate', { method: 'GET', params: p });
  }

  // ─── 4.3 Gestione Anagrafica PagoPA ──────────────────────────

  /** GET /anagrafica/sh/v1/elencoProvincieValide — Province valide */
  async pagopaProvinceValide(): Promise<any> {
    return this.makeRequestAbsolute('/anagrafica/sh/v1/elencoProvincieValide', { method: 'GET' });
  }

  /** GET /anagrafica/sh/v1/elencoProvincieValideByDate/{data} — Province valide a data */
  async pagopaProvinceValideByDate(dataValidita: string): Promise<any> {
    return this.makeRequestAbsolute(`/anagrafica/sh/v1/elencoProvincieValideByDate/${dataValidita}`, { method: 'GET' });
  }

  /** GET /anagrafica/sh/v1/elencoComuniValidi/{codiceProvincia} — Comuni validi */
  async pagopaComuniValidi(codiceProvincia: string): Promise<any> {
    return this.makeRequestAbsolute(`/anagrafica/sh/v1/elencoComuniValidi/${codiceProvincia}`, { method: 'GET' });
  }

  /** GET /anagrafica/sh/v1/elencoComuniValidiByData/{codiceProvincia}/{data} — Comuni validi a data */
  async pagopaComuniValidiByDate(codiceProvincia: string, dataValidita: string): Promise<any> {
    return this.makeRequestAbsolute(`/anagrafica/sh/v1/elencoComuniValidiByData/${codiceProvincia}/${dataValidita}`, { method: 'GET' });
  }

  /** GET /anagrafica/sh/v1/elencoStatiValidi — Stati validi */
  async pagopaStatiValidi(): Promise<any> {
    return this.makeRequestAbsolute('/anagrafica/sh/v1/elencoStatiValidi', { method: 'GET' });
  }

  /** GET /anagrafica/sh/v1/elencoStatiValidiByData/{data} — Stati validi a data */
  async pagopaStatiValidiByDate(dataValidita: string): Promise<any> {
    return this.makeRequestAbsolute(`/anagrafica/sh/v1/elencoStatiValidiByData/${dataValidita}`, { method: 'GET' });
  }

  // ─── 4.4 Riscatto Voucher ────────────────────────────────────

  /** POST /pagamenti/sh/v1/cassetto/adesioneriscatto — Inserimento adesione riscatto voucher */
  async inserimentoAdesioneVoucher(payload: { codiceTariffa: string; codiceTipoTariffario: string }): Promise<any> {
    return this.makeRequestAbsolute('/pagamenti/sh/v1/cassetto/adesioneriscatto', { method: 'POST', body: payload });
  }

  /** PUT /pagamenti/sh/v1/cassetto/adesioneriscatto/{progressivo}/revoca — Revoca adesione voucher */
  async revocaAdesioneVoucher(progressivo: number): Promise<any> {
    return this.makeRequestAbsolute(`/pagamenti/sh/v1/cassetto/adesioneriscatto/${progressivo}/revoca`, { method: 'PUT' });
  }

  /** GET /pagamenti/sh/v1/cassetto/adesioneriscatto — Ricerca adesioni voucher */
  async ricercaAdesioniVoucher(params?: { codiceTariffa?: string; codiceTipoTariffario?: string; progressivo?: string }): Promise<any> {
    const p: Record<string, string> = {};
    if (params?.codiceTariffa) p.codiceTariffa = params.codiceTariffa;
    if (params?.codiceTipoTariffario) p.codiceTipoTariffario = params.codiceTipoTariffario;
    if (params?.progressivo) p.progressivo = params.progressivo;
    return this.makeRequestAbsolute('/pagamenti/sh/v1/cassetto/adesioneriscatto', { method: 'GET', params: p });
  }

  /** GET /pagamenti/sh/v1/cassetto/codiceriscatto/verifica — Verifica codice riscatto voucher */
  async verificaCodiceRiscattoVoucher(codiceFiscale: string, codiceRiscatto: string): Promise<any> {
    return this.makeRequestAbsolute('/pagamenti/sh/v1/cassetto/codiceriscatto/verifica', {
      method: 'GET', params: { codiceFiscale, codiceRiscatto },
    });
  }

  /** PUT /pagamenti/sh/v1/cassetto/codiceriscatto/finalizza — Finalizza riscatto voucher */
  async finalizzaRiscattoVoucher(payload: { codiceFiscale: string; codiceRiscatto: string }): Promise<any> {
    return this.makeRequestAbsolute('/pagamenti/sh/v1/cassetto/codiceriscatto/finalizza', { method: 'PUT', body: payload });
  }

  // ─── 4.5 Disaggregazione IUV ─────────────────────────────────

  /** PUT /pagamenti/sh/v1/cassetto/disaggrega/{idRichiesta} — Disaggrega IUV da richiesta */
  async disaggregaIUV(idRichiesta: number): Promise<any> {
    return this.makeRequestAbsolute(`/pagamenti/sh/v1/cassetto/disaggrega/${idRichiesta}`, { method: 'PUT' });
  }

  /** GET /pagamenti/sh/v1/cassetto/ricerca/disaggregati — Ricerca IUV disaggregati */
  async ricercaIUVDisaggregati(): Promise<any> {
    return this.makeRequestAbsolute('/pagamenti/sh/v1/cassetto/ricerca/disaggregati', { method: 'GET' });
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
