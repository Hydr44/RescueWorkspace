// src/hooks/useRVFU.ts
// Hook personalizzato per gestire le operazioni RVFU

import { useState, useCallback } from 'react';
import { getRVFUClient, RVFUApiError } from '@/lib/rvfu-api';
import { RVFUValidator, ValidationResult } from '@/lib/rvfu-validation';
import { useToast } from './useToast';
import { logger } from '@/lib/logger';
import type {
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
  VFUSearchFilters,
  VFURadiatiSearchFilters,
  VeicoloSearchParams,
  DocumentoVFUCreate,
  CausaleVfuDto,
  ComuneIstat,
  ProvinciaIstat,
  StatoEsteroIstat,
  PageOfVFUBean
} from '@/lib/rvfu-types';

export interface RVFUState {
  loading: boolean;
  error: string | null;
  validation: ValidationResult | null;
  data: any;
}

export interface RVFUOperations {
  // VFU Operations
  registraVFUConcessionario: (data: VFUCreateAsConcessionario) => Promise<VFUBean | null>;
  registraVFUCR: (data: VFUCreateAsCR) => Promise<VFUBean | null>;
  getVFU: (idVFU: number) => Promise<VFUBean | null>;
  aggiornaVFU: (idVFU: number, data: VFUUpdate) => Promise<VFUBean | null>;
  annullaVFU: (idVFU: number, data: VFUElimina) => Promise<VFUBean | null>;
  conferisciVFU: (idVFU: number, data: VFUConferisci) => Promise<VFUBean | null>;
  prendiInCaricoVFU: (idVFU: number, data: VFUPrendiInCarico) => Promise<VFUBean | null>;
  demolisciVFU: (idVFU: number, data: VFUDemolisci) => Promise<VFUBean | null>;
  confermaRadiazioneVFU: (idVFU: number) => Promise<VFUBean | null>;
  cediVFU: (idVFU: number, data: VFUCedi) => Promise<VFUBean | null>;
  trasferisciVFU: (idVFU: number, data: VFUTrasferisci) => Promise<VFUBean | null>;
  
  // Search Operations
  cercaVFU: (filters?: VFUSearchFilters) => Promise<PageOfVFUBean | null>;
  cercaVFUPresaInCarico: (filters?: VFUSearchFilters) => Promise<PageOfVFUBean | null>;
  cercaVFURadiati: (filters?: VFURadiatiSearchFilters) => Promise<PageOfVFUBean | null>;
  cercaVFURottamazione: (filters?: VFUSearchFilters) => Promise<PageOfVFUBean | null>;
  cercaVeicolo: (params: VeicoloSearchParams) => Promise<any | null>;
  
  // Document Operations
  allegaDocumento: (idVFU: number, documento: DocumentoVFUCreate) => Promise<any | null>;
  scaricaDocumento: (params: any) => Promise<any | null>;
  getDocumentiVFU: (idVFU: number) => Promise<any[] | null>;
  
  // Utility Operations
  getCausali: () => Promise<CausaleVfuDto[] | null>;
  getCausalePerCodice: (codice: string) => Promise<CausaleVfuDto | null>;
  getComuni: (siglaProvincia: string, nomeComune?: string) => Promise<ComuneIstat[] | null>;
  getProvince: (sigla?: string) => Promise<ProvinciaIstat[] | null>;
  getStatiEsteri: (nome?: string) => Promise<StatoEsteroIstat[] | null>;
  
  // Validation
  validateVFUConcessionario: (data: VFUCreateAsConcessionario) => ValidationResult;
  validateVFUCR: (data: VFUCreateAsCR) => ValidationResult;
  
  // State Management
  clearError: () => void;
  clearValidation: () => void;
}

export function useRVFU(): RVFUOperations & RVFUState {
  const [state, setState] = useState<RVFUState>({
    loading: false,
    error: null,
    validation: null,
    data: null
  });

  const { showSuccess, showError, showWarning } = useToast();
  const client = getRVFUClient();

  // === UTILITY FUNCTIONS ===

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setValidation = useCallback((validation: ValidationResult | null) => {
    setState(prev => ({ ...prev, validation }));
  }, []);

  const setData = useCallback((data: any) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  const handleError = useCallback((error: any, operation: string) => {
    logger.error(`RVFU ${operation} error:`, error);
    
    let errorMessage = 'Errore sconosciuto';
    
    if (error instanceof RVFUApiError) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    setError(errorMessage);
    showError(`Errore durante ${operation}: ${errorMessage}`);
  }, [showError]);

  const handleSuccess = useCallback((message: string, data?: any) => {
    setError(null);
    setValidation(null);
    if (data) {
      setData(data);
    }
    showSuccess(message);
  }, [showSuccess]);

  const handleValidation = useCallback((validation: ValidationResult, operation: string) => {
    setValidation(validation);
    
    if (validation.errors.length > 0) {
      const errorMessage = validation.errors.map(e => e.message).join(', ');
      setError(errorMessage);
      showError(`Errori di validazione per ${operation}: ${errorMessage}`);
    }
    
    if (validation.warnings.length > 0) {
      const warningMessage = validation.warnings.map(w => w.message).join(', ');
      showWarning(`Avvisi per ${operation}: ${warningMessage}`);
    }
  }, [showError, showWarning]);

  // === VFU OPERATIONS ===

  const registraVFUConcessionario = useCallback(async (data: VFUCreateAsConcessionario): Promise<VFUBean | null> => {
    try {
      setLoading(true);
      setError(null);

      // Validazione
      const validation = RVFUValidator.validateVFUConcessionario(data);
      if (!validation.isValid) {
        handleValidation(validation, 'registrazione VFU Concessionario');
        return null;
      }

      const result = await client.registraVFUConcessionario(data);
      handleSuccess('VFU registrato con successo come Concessionario', result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'registrazione VFU Concessionario');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError, handleSuccess, handleValidation]);

  const registraVFUCR = useCallback(async (data: VFUCreateAsCR): Promise<VFUBean | null> => {
    try {
      setLoading(true);
      setError(null);

      // Validazione
      const validation = RVFUValidator.validateVFUCR(data);
      if (!validation.isValid) {
        handleValidation(validation, 'registrazione VFU CR');
        return null;
      }

      const result = await client.registraVFUCR(data);
      handleSuccess('VFU registrato con successo come Centro di Raccolta', result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'registrazione VFU CR');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError, handleSuccess, handleValidation]);

  const getVFU = useCallback(async (idVFU: number): Promise<VFUBean | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.getVFU(idVFU);
      setData(result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'recupero VFU');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError]);

  const aggiornaVFU = useCallback(async (idVFU: number, data: VFUUpdate): Promise<VFUBean | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.aggiornaVFU(idVFU, data);
      handleSuccess('VFU aggiornato con successo', result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'aggiornamento VFU');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError, handleSuccess]);

  const annullaVFU = useCallback(async (idVFU: number, data: VFUElimina): Promise<VFUBean | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.annullaVFU(idVFU, data);
      handleSuccess('VFU annullato con successo', result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'annullamento VFU');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError, handleSuccess]);

  const conferisciVFU = useCallback(async (idVFU: number, data: VFUConferisci): Promise<VFUBean | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.conferisciVFU(idVFU, data);
      handleSuccess('VFU conferito con successo', result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'conferimento VFU');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError, handleSuccess]);

  const prendiInCaricoVFU = useCallback(async (idVFU: number, data: VFUPrendiInCarico): Promise<VFUBean | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.prendiInCaricoVFU(idVFU, data);
      handleSuccess('VFU preso in carico con successo', result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'presa in carico VFU');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError, handleSuccess]);

  const demolisciVFU = useCallback(async (idVFU: number, data: VFUDemolisci): Promise<VFUBean | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.demolisciVFU(idVFU, data);
      handleSuccess('VFU demolito con successo', result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'demolizione VFU');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError, handleSuccess]);

  const confermaRadiazioneVFU = useCallback(async (idVFU: number): Promise<VFUBean | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.confermaRadiazioneVFU(idVFU);
      handleSuccess('Radiazione VFU confermata con successo', result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'conferma radiazione VFU');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError, handleSuccess]);

  const cediVFU = useCallback(async (idVFU: number, data: VFUCedi): Promise<VFUBean | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.cediVFU(idVFU, data);
      handleSuccess('VFU ceduto con successo', result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'cessione VFU');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError, handleSuccess]);

  const trasferisciVFU = useCallback(async (idVFU: number, data: VFUTrasferisci): Promise<VFUBean | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.trasferisciVFU(idVFU, data);
      handleSuccess('VFU trasferito con successo', result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'trasferimento VFU');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError, handleSuccess]);

  // === SEARCH OPERATIONS ===

  const cercaVFU = useCallback(async (filters: VFUSearchFilters = {}): Promise<PageOfVFUBean | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.cercaVFU(filters);
      setData(result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'ricerca VFU');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError]);

  const cercaVFUPresaInCarico = useCallback(async (filters: VFUSearchFilters = {}): Promise<PageOfVFUBean | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.cercaVFUPresaInCarico(filters);
      setData(result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'ricerca VFU presa in carico');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError]);

  const cercaVFURadiati = useCallback(async (filters: VFURadiatiSearchFilters = {}): Promise<PageOfVFUBean | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.cercaVFURadiati(filters);
      setData(result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'ricerca VFU radiati');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError]);

  const cercaVFURottamazione = useCallback(async (filters: VFUSearchFilters = {}): Promise<PageOfVFUBean | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.cercaVFURottamazione(filters);
      setData(result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'ricerca VFU rottamazione');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError]);

  const cercaVeicolo = useCallback(async (params: VeicoloSearchParams): Promise<any | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.cercaVeicolo(params);
      setData(result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'ricerca veicolo');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError]);

  // === DOCUMENT OPERATIONS ===

  const allegaDocumento = useCallback(async (idVFU: number, documento: DocumentoVFUCreate): Promise<any | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.allegaDocumento(idVFU, documento);
      handleSuccess('Documento allegato con successo', result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'allegato documento');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError, handleSuccess]);

  const scaricaDocumento = useCallback(async (params: any): Promise<any | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.scaricaDocumento(params);
      setData(result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'download documento');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError]);

  const getDocumentiVFU = useCallback(async (idVFU: number): Promise<any[] | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.getDocumentiVFU(idVFU);
      setData(result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'recupero documenti VFU');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError]);

  // === UTILITY OPERATIONS ===

  const getCausali = useCallback(async (): Promise<CausaleVfuDto[] | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.getCausali();
      setData(result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'recupero causali');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError]);

  const getCausalePerCodice = useCallback(async (codice: string): Promise<CausaleVfuDto | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.getCausalePerCodice(codice);
      setData(result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'recupero causale per codice');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError]);

  const getComuni = useCallback(async (siglaProvincia: string, nomeComune?: string): Promise<ComuneIstat[] | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.getComuni(siglaProvincia, nomeComune);
      setData(result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'recupero comuni');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError]);

  const getProvince = useCallback(async (sigla?: string): Promise<ProvinciaIstat[] | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.getProvince(sigla);
      setData(result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'recupero province');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError]);

  const getStatiEsteri = useCallback(async (nome?: string): Promise<StatoEsteroIstat[] | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.getStatiEsteri(nome);
      setData(result.result);
      return result.result;
    } catch (error) {
      handleError(error, 'recupero stati esteri');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, handleError]);

  // === VALIDATION OPERATIONS ===

  const validateVFUConcessionario = useCallback((data: VFUCreateAsConcessionario): ValidationResult => {
    return RVFUValidator.validateVFUConcessionario(data);
  }, []);

  const validateVFUCR = useCallback((data: VFUCreateAsCR): ValidationResult => {
    return RVFUValidator.validateVFUCR(data);
  }, []);

  // === STATE MANAGEMENT ===

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearValidation = useCallback(() => {
    setValidation(null);
  }, []);

  return {
    // State
    ...state,
    
    // VFU Operations
    registraVFUConcessionario,
    registraVFUCR,
    getVFU,
    aggiornaVFU,
    annullaVFU,
    conferisciVFU,
    prendiInCaricoVFU,
    demolisciVFU,
    confermaRadiazioneVFU,
    cediVFU,
    trasferisciVFU,
    
    // Search Operations
    cercaVFU,
    cercaVFUPresaInCarico,
    cercaVFURadiati,
    cercaVFURottamazione,
    cercaVeicolo,
    
    // Document Operations
    allegaDocumento,
    scaricaDocumento,
    getDocumentiVFU,
    
    // Utility Operations
    getCausali,
    getCausalePerCodice,
    getComuni,
    getProvince,
    getStatiEsteri,
    
    // Validation
    validateVFUConcessionario,
    validateVFUCR,
    
    // State Management
    clearError,
    clearValidation
  };
}
