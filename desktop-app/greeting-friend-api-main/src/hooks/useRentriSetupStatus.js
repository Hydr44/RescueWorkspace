// src/hooks/useRentriSetupStatus.js
/**
 * Hook per verificare lo stato di configurazione RENTRI
 * Controlla se certificato, num_iscr_sito, ecc. sono configurati
 */

import { useState, useEffect } from "react";
import { supabaseBrowser } from "../lib/supabase-browser";
import rentriCert from "../lib/rentri-multi-cert";

export function useRentriSetupStatus(orgId, environment = 'demo') {
  const [status, setStatus] = useState({
    loading: true,
    isConfigured: false,
    hasCertificate: false,
    hasNumIscrSito: false,
    certificate: null,
    missingSteps: [],
    canTransmit: false,
  });

  useEffect(() => {
    if (!orgId) {
      setStatus({
        loading: false,
        isConfigured: false,
        hasCertificate: false,
        hasNumIscrSito: false,
        certificate: null,
        missingSteps: ['org_selection'],
        canTransmit: false,
      });
      return;
    }

    checkSetupStatus();
  }, [orgId, environment]);

  async function checkSetupStatus() {
    setStatus(prev => ({ ...prev, loading: true }));
    
    try {
      const missingSteps = [];
      let certificate = null;
      let hasCertificate = false;
      let hasNumIscrSito = false;

      // 1. Verifica certificato
      try {
        certificate = await rentriCert.getActiveCertificate(orgId, environment);
        hasCertificate = !!certificate;
      } catch (error) {
        console.log('[SETUP-STATUS] Certificato non trovato:', error.message);
        missingSteps.push('certificate');
      }

      // 2. Verifica num_iscr_sito
      if (certificate) {
        hasNumIscrSito = !!certificate.num_iscr_sito && certificate.num_iscr_sito.length >= 22;
        if (!hasNumIscrSito) {
          missingSteps.push('num_iscr_sito');
        }
      }

      // 3. Verifica se può trasmettere
      const canTransmit = hasCertificate && hasNumIscrSito;

      // 4. Stato completo
      const isConfigured = canTransmit;

      setStatus({
        loading: false,
        isConfigured,
        hasCertificate,
        hasNumIscrSito,
        certificate,
        missingSteps,
        canTransmit,
      });

    } catch (error) {
      console.error('[SETUP-STATUS] Errore verifica setup:', error);
      setStatus(prev => ({
        ...prev,
        loading: false,
        isConfigured: false,
        missingSteps: ['certificate', 'num_iscr_sito'],
      }));
    }
  }

  return {
    ...status,
    refresh: checkSetupStatus,
  };
}



