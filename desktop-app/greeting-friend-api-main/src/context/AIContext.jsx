// src/context/AIContext.jsx
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useOrg } from './OrgContext';
import { supabaseBrowser } from '@/lib/supabase-browser';

const AIContext = createContext(null);

export const AIContextProvider = ({ children }) => {
  const { orgId } = useOrg();
  const [pageContext, setPageContext] = useState({
    moduleName: null,        // es: "Fatture", "Clienti", "Trasporti"
    action: null,            // es: "create", "edit", "view", "list"
    formData: {},            // dati del form corrente
    emptyFields: [],         // campi vuoti che potrebbero essere compilati
    suggestions: {},         // suggerimenti per campo
    metadata: {},            // metadati aggiuntivi (es: cliente selezionato, prodotti disponibili)
  });

  const [companyData, setCompanyData] = useState(null);

  // Carica dati azienda una volta
  const loadCompanyData = useCallback(async () => {
    if (!orgId || companyData) return;
    
    try {
      const supabase = supabaseBrowser();
      
      // Carica dati organizzazione
      const { data: org } = await supabase
        .from('orgs')
        .select('*')
        .eq('id', orgId)
        .single();

      // Prova a caricare settings azienda (tabella potrebbe non esistere)
      let settings = null;
      try {
        const { data: s, error: sErr } = await supabase
          .from('org_settings')
          .select('*')
          .eq('org_id', orgId)
          .single();
        if (!sErr) settings = s;
      } catch (_) {
        // org_settings non esiste ancora, ignora
      }

      setCompanyData({
        org,
        settings,
        name: settings?.company_name || org?.name,
        vat: settings?.vat || org?.vat,
        taxCode: settings?.tax_code || org?.tax_code,
        address: settings?.address || org?.address,
        regimeFiscale: settings?.regime_fiscale,
      });
    } catch (error) {
      console.error('[AIContext] Errore caricamento dati azienda:', error);
    }
  }, [orgId, companyData]);

  // Aggiorna contesto pagina corrente
  const updatePageContext = useCallback((updates) => {
    setPageContext(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Resetta contesto quando si cambia pagina
  const resetPageContext = useCallback(() => {
    setPageContext({
      moduleName: null,
      action: null,
      formData: {},
      emptyFields: [],
      suggestions: {},
      metadata: {},
    });
  }, []);

  // Costruisce il context completo da inviare all'AI
  const buildAIContext = useCallback(() => {
    const context = {
      company: companyData,
      page: {
        module: pageContext.moduleName,
        action: pageContext.action,
      },
      form: {
        currentData: pageContext.formData,
        emptyFields: pageContext.emptyFields,
        suggestions: pageContext.suggestions,
      },
      metadata: pageContext.metadata,
    };

    return context;
  }, [companyData, pageContext]);

  const value = useMemo(() => ({
    pageContext,
    companyData,
    updatePageContext,
    resetPageContext,
    loadCompanyData,
    buildAIContext,
  }), [pageContext, companyData, updatePageContext, resetPageContext, loadCompanyData, buildAIContext]);

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};

AIContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAIContext = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAIContext must be used within AIContextProvider');
  }
  return context;
};
