/**
 * Sistema di validazione avanzato per RVFU
 * Basato su Zod per validazione runtime e TypeScript per type safety
 */

import { z } from 'zod';
import { StatoVfuEnum, TipoVeicoloEnum, TipoDocumentoEnum } from './rvfu-enums';

// ============================================================================
// SCHEMI DI VALIDAZIONE BASE
// ============================================================================

// Validazione targa italiana
export const targaSchema = z.string()
  .min(7, 'La targa deve essere di almeno 7 caratteri')
  .max(8, 'La targa non può superare gli 8 caratteri')
  .regex(/^[A-Z]{2}\d{3}[A-Z]{2}$|^[A-Z]{2}\d{4}[A-Z]{2}$/, 
    'Formato targa non valido (es. AB123CD o AB1234CD)');

// Validazione telaio
export const telaioSchema = z.string()
  .min(17, 'Il telaio deve essere di almeno 17 caratteri')
  .max(17, 'Il telaio deve essere esattamente di 17 caratteri')
  .regex(/^[A-HJ-NPR-Z\d]{17}$/, 
    'Formato telaio non valido (VIN standard)');

// Validazione codice fiscale
export const codiceFiscaleSchema = z.string()
  .length(16, 'Il codice fiscale deve essere di 16 caratteri')
  .regex(/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/, 
    'Formato codice fiscale non valido');

// Validazione email
export const emailSchema = z.string()
  .email('Formato email non valido')
  .optional()
  .or(z.literal(''));

// Validazione telefono
export const telefonoSchema = z.string()
  .regex(/^(\+39)?\d{9,10}$/, 
    'Formato telefono non valido (es. 1234567890 o +391234567890)')
  .optional()
  .or(z.literal(''));

// Validazione data
export const dataSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data non valido (YYYY-MM-DD)')
  .refine((date) => {
    const parsed = new Date(date);
    const now = new Date();
    return parsed <= now;
  }, 'La data non può essere futura');

// ============================================================================
// SCHEMI COMPOSTI
// ============================================================================

// Schema per dati veicolo
export const veicoloSchema = z.object({
  targa: targaSchema,
  telaio: telaioSchema,
  marca: z.string().min(1, 'La marca è obbligatoria').max(50, 'Marca troppo lunga'),
  modello: z.string().min(1, 'Il modello è obbligatorio').max(50, 'Modello troppo lungo'),
  cilindrata: z.number().min(0).max(10000).optional(),
  potenza: z.number().min(0).max(1000).optional(),
  dataPrimaImmatricolazione: dataSchema.optional(),
  tipoVeicolo: z.nativeEnum(TipoVeicoloEnum).optional()
});

// Schema per dati conferente
export const conferenteSchema = z.object({
  nome: z.string().min(1, 'Il nome è obbligatorio').max(50, 'Nome troppo lungo'),
  cognome: z.string().min(1, 'Il cognome è obbligatorio').max(50, 'Cognome troppo lungo'),
  codiceFiscale: codiceFiscaleSchema,
  indirizzo: z.string().min(1, 'L\'indirizzo è obbligatorio').max(200, 'Indirizzo troppo lungo'),
  telefono: telefonoSchema,
  email: emailSchema
});

// Schema per centro di raccolta
export const centroRaccoltaSchema = z.object({
  codice: z.string().min(1, 'Il codice centro è obbligatorio').max(20, 'Codice troppo lungo'),
  nome: z.string().min(1, 'Il nome centro è obbligatorio').max(100, 'Nome troppo lungo'),
  indirizzo: z.string().min(1, 'L\'indirizzo centro è obbligatorio').max(200, 'Indirizzo troppo lungo')
});

// Schema per documento
export const documentoSchema = z.object({
  nome: z.string().min(1, 'Il nome del documento è obbligatorio').max(100, 'Nome troppo lungo'),
  tipo: z.nativeEnum(TipoDocumentoEnum),
  dimensione: z.number().min(1, 'La dimensione deve essere maggiore di 0'),
  contenuto: z.string().min(1, 'Il contenuto del documento è obbligatorio'),
  descrizione: z.string().max(500, 'Descrizione troppo lunga').optional()
});

// ============================================================================
// SCHEMI PER FORM PRINCIPALI
// ============================================================================

// Schema per creazione VFU
export const creaVfuSchema = z.object({
  veicolo: veicoloSchema,
  conferente: conferenteSchema,
  centroRaccolta: centroRaccoltaSchema,
  dataConferimento: dataSchema,
  notePartiRifiuti: z.string().max(1000, 'Note troppo lunghe').optional(),
  documenti: z.array(documentoSchema).optional()
});

// Schema per aggiornamento VFU
export const aggiornaVfuSchema = z.object({
  id: z.string().uuid('ID VFU non valido'),
  stato: z.nativeEnum(StatoVfuEnum).optional(),
  notePartiRifiuti: z.string().max(1000, 'Note troppo lunghe').optional(),
  documenti: z.array(documentoSchema).optional()
});

// Schema per generazione certificato
export const generaCertificatoSchema = z.object({
  vfuId: z.string().uuid('ID VFU non valido'),
  tipoCertificato: z.enum(['DIGITALE', 'CARTACEO']),
  note: z.string().max(500, 'Note troppo lunghe').optional()
});

// Schema per generazione ricevuta
export const generaRicevutaSchema = z.object({
  vfuId: z.string().uuid('ID VFU non valido'),
  tipoRicevuta: z.enum(['DIGITALE', 'CARTACEO']),
  note: z.string().max(500, 'Note troppo lunghe').optional()
});

// Schema per allegare documento
export const allegaDocumentoSchema = z.object({
  vfuId: z.string().uuid('ID VFU non valido'),
  documento: documentoSchema,
  descrizione: z.string().max(500, 'Descrizione troppo lunga').optional()
});

// Schema per invio a tablet (firma)
export const inviaAlTabletSchema = z.object({
  documentoId: z.string().uuid('ID documento non valido'),
  tipoFirma: z.enum(['FDR', 'DIGITALE']),
  note: z.string().max(500, 'Note troppo lunghe').optional()
});

// Schema per filtri di ricerca
export const filtriRicercaSchema = z.object({
  stato: z.nativeEnum(StatoVfuEnum).optional(),
  dataDa: dataSchema.optional(),
  dataA: dataSchema.optional(),
  targa: targaSchema.optional(),
  telaio: telaioSchema.optional(),
  centroRaccolta: z.string().max(20).optional(),
  pageNumber: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20)
});

// ============================================================================
// VALIDATORI CUSTOM
// ============================================================================

/**
 * Valida che la data di conferimento non sia futura
 */
export const validaDataConferimento = (data: string) => {
  const dataConferimento = new Date(data);
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);
  
  if (dataConferimento > oggi) {
    return 'La data di conferimento non può essere futura';
  }
  return null;
};

/**
 * Valida che la cilindrata sia coerente con il tipo di veicolo
 */
export const validaCilindrata = (cilindrata: number | undefined, tipoVeicolo: string) => {
  if (!cilindrata) return null;
  
  const limiti: Record<string, { min: number; max: number }> = {
    [TipoVeicoloEnum.AUTOVEICOLO]: { min: 500, max: 8000 },
    [TipoVeicoloEnum.MOTOVEICOLO]: { min: 50, max: 2000 },
    [TipoVeicoloEnum.CICLOMOTORE]: { min: 25, max: 150 },
    [TipoVeicoloEnum.RIMORCHIO]: { min: 0, max: 0 },
    [TipoVeicoloEnum.SEMIRIMORCHIO]: { min: 0, max: 0 }
  };
  
  const limite = limiti[tipoVeicolo];
  if (limite && (cilindrata < limite.min || cilindrata > limite.max)) {
    return `La cilindrata per ${tipoVeicolo} deve essere tra ${limite.min} e ${limite.max} cc`;
  }
  
  return null;
};

/**
 * Valida che la potenza sia coerente con la cilindrata
 */
export const validaPotenza = (potenza: number | undefined, cilindrata: number | undefined) => {
  if (!potenza || !cilindrata) return null;
  
  const rapporto = potenza / cilindrata;
  if (rapporto > 0.15) {
    return 'Il rapporto potenza/cilindrata sembra troppo alto';
  }
  
  return null;
};

/**
 * Valida che il codice fiscale corrisponda ai dati anagrafici
 */
export const validaCodiceFiscaleAnagrafica = (
  codiceFiscale: string,
  nome: string,
  cognome: string,
  dataNascita?: string
) => {
  // Implementazione semplificata - in produzione usare una libreria specifica
  const cfNome = codiceFiscale.substring(3, 6);
  const cfCognome = codiceFiscale.substring(0, 3);
  
  // Controlli base (implementazione semplificata)
  if (cfNome !== nome.substring(0, 3).toUpperCase()) {
    return 'Il codice fiscale non corrisponde al nome';
  }
  
  if (cfCognome !== cognome.substring(0, 3).toUpperCase()) {
    return 'Il codice fiscale non corrisponde al cognome';
  }
  
  return null;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Valida un oggetto con uno schema Zod
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors };
    }
    return { success: false, errors: ['Errore di validazione sconosciuto'] };
  }
}

/**
 * Valida un campo specifico
 */
export function validateField<T>(
  schema: z.ZodSchema<T>,
  value: unknown,
  fieldName: string
): { valid: boolean; error?: string } {
  try {
    schema.parse(value);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { 
        valid: false, 
        error: `${fieldName}: ${firstError.message}` 
      };
    }
    return { valid: false, error: `${fieldName}: Errore di validazione` };
  }
}

/**
 * Valida in modo asincrono (per chiamate API)
 */
export async function validateAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: string[] }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(validateWithSchema(schema, data));
    }, 0);
  });
}

/**
 * Sanitizza i dati per l'invio alle API
 */
export function sanitizeForApi<T>(data: T): T {
  if (typeof data === 'string') {
    return data.trim() as T;
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeForApi) as T;
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = {} as T;
    for (const [key, value] of Object.entries(data)) {
      (sanitized as any)[key] = sanitizeForApi(value);
    }
    return sanitized;
  }
  
  return data;
}

// ============================================================================
// TYPES DERIVATI
// ============================================================================

export type CreaVfuData = z.infer<typeof creaVfuSchema>;
export type AggiornaVfuData = z.infer<typeof aggiornaVfuSchema>;
export type GeneraCertificatoData = z.infer<typeof generaCertificatoSchema>;
export type GeneraRicevutaData = z.infer<typeof generaRicevutaSchema>;
export type AllegaDocumentoData = z.infer<typeof allegaDocumentoSchema>;
export type InviaAlTabletData = z.infer<typeof inviaAlTabletSchema>;
export type FiltriRicercaData = z.infer<typeof filtriRicercaSchema>;
export type VeicoloData = z.infer<typeof veicoloSchema>;
export type ConferenteData = z.infer<typeof conferenteSchema>;
export type CentroRaccoltaData = z.infer<typeof centroRaccoltaSchema>;
export type DocumentoData = z.infer<typeof documentoSchema>;