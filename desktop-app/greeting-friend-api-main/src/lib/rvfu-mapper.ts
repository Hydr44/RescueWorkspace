/**
 * Funzioni di mappatura per convertire dati locali in formato API RVFU
 */

import type {
  VFUCreateAsConcessionario,
  SoggettoVFUCreate,
  DistintaVFUCreate
} from './rvfu-types';

/**
 * Dati del form locale (da DemolizioneRVFUForm)
 */
export interface DemolitionFormData {
  // Veicolo
  targa: string;
  telaio: string;
  tipoVeicolo?: string; // default 'A' per autoveicolo
  
  // Intestatario (persona fisica)
  proprietario_nome?: string;
  proprietario_cognome?: string;
  proprietario_cf: string;
  proprietario_data_nascita?: string;
  proprietario_comune_nascita?: string;
  proprietario_provincia_nascita?: string;
  proprietario_indirizzo?: string;
  proprietario_numero_civico?: string;
  proprietario_cap?: string;
  proprietario_comune?: string;
  proprietario_provincia?: string;
  proprietario_telefono?: string;
  proprietario_email?: string;
  
  // Intestatario (persona giuridica)
  proprietario_ragione_sociale?: string;
  proprietario_tipo_persona?: 'PF' | 'PG';
  
  // Detentore (opzionale)
  detentore_cf?: string;
  detentore_nome?: string;
  detentore_cognome?: string;
  detentore_data_nascita?: string;
  detentore_comune_nascita?: string;
  detentore_provincia_nascita?: string;
  detentore_indirizzo?: string;
  detentore_numero_civico?: string;
  detentore_cap?: string;
  detentore_comune?: string;
  detentore_provincia?: string;
  
  // Demolizione
  demolizione_data?: string;
  demolizione_causale?: string;
  demolizione_osservazioni?: string;
  
  // Distinta documenti
  distinta_du?: string;
  distinta_cdc?: string;
  distinta_cdp?: string;
  distinta_foglio_c?: string;
  distinta_documento_intestatario?: boolean;
  distinta_documento_detentore?: boolean;
  distinta_targa_anteriore?: boolean;
  distinta_targa_posteriore?: boolean;
  distinta_targa_denuncia?: boolean;
  distinta_altro?: string;
  
  // Altro
  note_parti_rifiuti?: string;
  flag_consegna_forze_ordine?: 'S' | 'N';
  canale_no_pra?: boolean;
}

/**
 * Dati di lookup (comuni, province, stati esteri)
 */
export interface LookupData {
  comuniNascita?: Array<{ codice: string; denominazione: string }>;
  provinceNascita?: Array<{ codice: string; sigla: string }>;
  comuniResidenza?: Array<{ codice: string; denominazione: string }>;
  provinceResidenza?: Array<{ codice: string; sigla: string }>;
}

/**
 * Converte un codice comune/provincia da nome a codice ISTAT
 */
function findCodiceByDenominazione(
  denominazione: string | undefined,
  lookup: Array<{ codice: string; denominazione?: string; sigla?: string }> | undefined
): string | undefined {
  if (!denominazione || !lookup || lookup.length === 0) return undefined;
  
  const found = lookup.find(item => 
    item.denominazione?.toLowerCase() === denominazione.toLowerCase() ||
    item.sigla?.toLowerCase() === denominazione.toLowerCase()
  );
  
  return found?.codice;
}

/**
 * Costruisce un SoggettoVFUCreate da dati del form
 */
function buildSoggettoVFUCreate(
  formData: DemolitionFormData,
  tipoSoggetto: 'intestatario' | 'detentore',
  lookupData: LookupData = {}
): SoggettoVFUCreate {
  const prefix = tipoSoggetto === 'intestatario' ? 'proprietario' : 'detentore';
  const isPersonaGiuridica = formData.proprietario_tipo_persona === 'PG';
  
  // Codici ISTAT
  const codiceComuneNascita = findCodiceByDenominazione(
    formData[`${prefix}_comune_nascita` as keyof DemolitionFormData] as string,
    lookupData.comuniNascita
  );
  
  const codiceProvinciaNascita = findCodiceByDenominazione(
    formData[`${prefix}_provincia_nascita` as keyof DemolitionFormData] as string,
    lookupData.provinceNascita
  );
  
  const codiceComuneResidenza = findCodiceByDenominazione(
    formData[`${prefix}_comune` as keyof DemolitionFormData] as string,
    lookupData.comuniResidenza
  );
  
  const codiceProvinciaResidenza = findCodiceByDenominazione(
    formData[`${prefix}_provincia` as keyof DemolitionFormData] as string,
    lookupData.provinceResidenza
  );
  
  const soggetto: SoggettoVFUCreate = {
    codiceFiscale: formData[`${prefix}_cf` as keyof DemolitionFormData] as string || '',
    tipoPersonaGiuridica: isPersonaGiuridica ? 'PG' : 'PF',
  };
  
  if (isPersonaGiuridica) {
    // Persona giuridica
    soggetto.ragioneSociale = formData.proprietario_ragione_sociale;
  } else {
    // Persona fisica
    soggetto.nome = formData[`${prefix}_nome` as keyof DemolitionFormData] as string;
    soggetto.cognome = formData[`${prefix}_cognome` as keyof DemolitionFormData] as string;
    soggetto.dataNascita = formData[`${prefix}_data_nascita` as keyof DemolitionFormData] as string;
    
    // Nascita
    if (codiceComuneNascita) {
      soggetto.codiceComuneNascita = codiceComuneNascita;
    }
    if (codiceProvinciaNascita) {
      soggetto.codiceProvinciaNascita = codiceProvinciaNascita;
    }
    if (formData[`${prefix}_comune_nascita` as keyof DemolitionFormData]) {
      soggetto.comuneNascita = formData[`${prefix}_comune_nascita` as keyof DemolitionFormData] as string;
    }
    if (formData[`${prefix}_provincia_nascita` as keyof DemolitionFormData]) {
      soggetto.provinciaNascita = formData[`${prefix}_provincia_nascita` as keyof DemolitionFormData] as string;
    }
  }
  
  // Residenza
  if (codiceComuneResidenza) {
    soggetto.codiceComuneResidenza = codiceComuneResidenza;
  }
  if (codiceProvinciaResidenza) {
    soggetto.codiceProvinciaResidenza = codiceProvinciaResidenza;
  }
  if (formData[`${prefix}_comune` as keyof DemolitionFormData]) {
    soggetto.comuneResidenza = formData[`${prefix}_comune` as keyof DemolitionFormData] as string;
  }
  if (formData[`${prefix}_provincia` as keyof DemolitionFormData]) {
    soggetto.provinciaResidenza = formData[`${prefix}_provincia` as keyof DemolitionFormData] as string;
  }
  
  soggetto.indirizzoResidenza = formData[`${prefix}_indirizzo` as keyof DemolitionFormData] as string;
  soggetto.numeroCivicoResidenza = formData[`${prefix}_numero_civico` as keyof DemolitionFormData] as string;
  soggetto.capResidenza = formData[`${prefix}_cap` as keyof DemolitionFormData] as string;
  
  return soggetto;
}

/**
 * Costruisce una DistintaVFUCreate da dati del form
 */
function buildDistintaVFUCreate(formData: DemolitionFormData): DistintaVFUCreate {
  return {
    du: (formData.distinta_du as any) || 'ASSENTE',
    cdc: (formData.distinta_cdc as any) || 'ASSENTE',
    cdp: (formData.distinta_cdp as any) || 'ASSENTE',
    foglioC: (formData.distinta_foglio_c as any) || 'ASSENTE',
    documentoIntestatario: formData.distinta_documento_intestatario || false,
    documentoDetentore: formData.distinta_documento_detentore || false,
    targaAnteriore: formData.distinta_targa_anteriore || false,
    targaPosteriore: formData.distinta_targa_posteriore || false,
    targaDenuncia: formData.distinta_targa_denuncia || false,
    altro: formData.distinta_altro,
  };
}

/**
 * Converte i dati del form locale in VFUCreateAsConcessionario per l'API RVFU
 */
export function mapFormDataToVFUCreate(
  formData: DemolitionFormData,
  lookupData: LookupData = {}
): VFUCreateAsConcessionario {
  // Validazione campi obbligatori
  if (!formData.targa) {
    throw new Error('Targa è obbligatoria');
  }
  if (!formData.telaio) {
    throw new Error('Telaio è obbligatorio');
  }
  if (!formData.proprietario_cf) {
    throw new Error('Codice fiscale intestatario è obbligatorio');
  }
  
  const payload: VFUCreateAsConcessionario = {
    targa: formData.targa.trim().toUpperCase(),
    telaio: formData.telaio.trim().toUpperCase(),
    tipoVeicolo: formData.tipoVeicolo || 'A', // Default autoveicolo
    flagConsegnaForzeOrdine: formData.flag_consegna_forze_ordine || 'N',
    intestatario: buildSoggettoVFUCreate(formData, 'intestatario', lookupData),
  };
  
  // Detentore (opzionale)
  if (formData.detentore_cf) {
    payload.detentore = buildSoggettoVFUCreate(formData, 'detentore', lookupData);
  }
  
  // Distinta documenti
  payload.distinta = buildDistintaVFUCreate(formData);
  
  // Note
  if (formData.demolizione_osservazioni) {
    payload.noteAggiuntive = formData.demolizione_osservazioni;
  }
  if (formData.note_parti_rifiuti) {
    payload.notePartiRifiuti = formData.note_parti_rifiuti;
  }
  
  // Altri campi opzionali
  if (formData.canale_no_pra !== undefined) {
    payload.canaleNoPra = formData.canale_no_pra;
  }
  
  return payload;
}

/**
 * Converte dati da meta JSONB a DemolitionFormData (per edit)
 */
export function mapMetaToFormData(meta: any): Partial<DemolitionFormData> {
  if (!meta || typeof meta !== 'object') return {};
  
  const rvfu = meta.rvfu || {};
  const intestatario = meta.intestatario || meta.owner || {};
  
  return {
    tipoVeicolo: rvfu.tipoVeicolo || 'A',
    flag_consegna_forze_ordine: rvfu.flagConsegnaForzeOrdine || 'N',
    canale_no_pra: rvfu.canaleNoPra || false,
    proprietario_cf: intestatario.codiceFiscale || intestatario.cf || '',
    proprietario_nome: intestatario.nome || '',
    proprietario_cognome: intestatario.cognome || '',
    proprietario_data_nascita: intestatario.dataNascita || intestatario.birth_date || '',
    proprietario_comune_nascita: intestatario.comuneNascita || '',
    proprietario_provincia_nascita: intestatario.provinciaNascita || '',
    proprietario_indirizzo: intestatario.indirizzoResidenza || intestatario.address || '',
    proprietario_numero_civico: intestatario.numeroCivicoResidenza || '',
    proprietario_cap: intestatario.capResidenza || intestatario.cap || '',
    proprietario_comune: intestatario.comuneResidenza || intestatario.city || '',
    proprietario_provincia: intestatario.provinciaResidenza || intestatario.province || '',
    proprietario_ragione_sociale: intestatario.ragioneSociale || '',
    proprietario_tipo_persona: intestatario.tipoPersonaGiuridica === 'PG' ? 'PG' : 'PF',
    demolizione_osservazioni: rvfu.noteAggiuntive || '',
    note_parti_rifiuti: rvfu.notePartiRifiuti || '',
    distinta_du: rvfu.distinta?.du || 'ASSENTE',
    distinta_cdc: rvfu.distinta?.cdc || 'ASSENTE',
    distinta_cdp: rvfu.distinta?.cdp || 'ASSENTE',
    distinta_foglio_c: rvfu.distinta?.foglioC || 'ASSENTE',
    distinta_documento_intestatario: rvfu.distinta?.documentoIntestatario || false,
    distinta_documento_detentore: rvfu.distinta?.documentoDetentore || false,
    distinta_targa_anteriore: rvfu.distinta?.targaAnteriore || false,
    distinta_targa_posteriore: rvfu.distinta?.targaPosteriore || false,
    distinta_targa_denuncia: rvfu.distinta?.targaDenuncia || false,
    distinta_altro: rvfu.distinta?.altro || '',
  };
}

