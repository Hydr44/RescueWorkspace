import { useEffect, useRef } from 'react';
import { FiUser, FiChevronRight, FiLoader } from 'react-icons/fi';
import { useOperatorAuth } from '@/hooks/useOperatorAuth';
import { useOrg } from '@/context/OrgContext';

/**
 * Componente per la selezione dell'operatore
 * Design moderno con gradienti e animazioni
 */
export default function OperatorSelection({ onSelectOperator, onCreateFirst }) {
  const { operators, loading, error, loadOperators } = useOperatorAuth();
  const { orgId, loading: orgLoading } = useOrg();
  const lastLoadedOrgId = useRef(null);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    // Attendi che OrgContext carichi l'orgId
    if (orgId && !orgLoading) {
      // Evita chiamate multiple per lo stesso orgId
      if (lastLoadedOrgId.current !== orgId) {
        console.log('[OperatorSelection] OrgId from OrgContext:', orgId);
        lastLoadedOrgId.current = orgId;
        hasLoadedOnce.current = true;
        console.log('[OperatorSelection] Calling loadOperators with orgId:', orgId);
        loadOperators(orgId).catch(err => {
          console.error('[OperatorSelection] Error loading operators:', err);
        });
      } else {
        console.log('[OperatorSelection] Already loaded operators for orgId:', orgId);
      }
    } else if (!orgLoading && !orgId && !hasLoadedOnce.current) {
      // Solo log di debug, non warning - è normale durante il caricamento iniziale
      console.log('[OperatorSelection] Waiting for orgId from OrgContext...');
    }
    // Rimuovi loadOperators dalle dipendenze per evitare loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, orgLoading]);

  // Mostra loading se: 1) stiamo caricando operatori, 2) OrgContext sta caricando, 3) non abbiamo ancora orgId
  if ((loading && operators.length === 0) || orgLoading || (!orgId && !hasLoadedOnce.current)) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FiLoader className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-sm text-slate-400">Caricamento operatori...</p>
      </div>
    );
  }

  if (error && operators.length === 0) {
    return (
      <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-center">
        <p className="text-red-400 text-sm font-medium mb-2">
          Errore caricamento operatori
        </p>
        <p className="text-red-600 text-xs">{error}</p>
      </div>
    );
  }

  // Se non ci sono operatori, mostra il pulsante per crearne uno
  // Mostra se:
  // 1. Abbiamo finito di caricare (hasLoadedOnce.current === true)
  // 2. Non stiamo caricando (!loading)
  // 3. Non ci sono operatori (operators.length === 0)
  // 4. Non c'è errore o l'errore è "Nessun operatore" (che è normale)
  const shouldShowCreateFirst = 
    hasLoadedOnce.current && 
    !loading && 
    operators.length === 0 && 
    (!error || error.includes('Nessun operatore') || error.includes('non trovato'));
  
  if (shouldShowCreateFirst) {
    console.log('[OperatorSelection] No operators found, showing create first button', { 
      hasLoadedOnce: hasLoadedOnce.current, 
      loading, 
      operatorsCount: operators.length, 
      error 
    });
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-4">
            <FiUser className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">
            Nessun operatore disponibile
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            Crea il primo operatore per iniziare
          </p>
          <button
            onClick={onCreateFirst}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors"
          >
            Crea Primo Operatore
          </button>
        </div>
      </div>
    );
  }
  
  // Se c'è un errore ma non stiamo caricando, mostra l'errore
  if (error && !loading && hasLoadedOnce.current && !shouldShowCreateFirst) {
    console.error('[OperatorSelection] Error loading operators:', error);
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-2">
          Seleziona Operatore
        </h3>
        <p className="text-sm text-slate-400">
          Scegli l'operatore con cui accedere
        </p>
      </div>

      <div className="space-y-2">
        {operators.map((operator) => (
          <button
            key={operator.id}
            onClick={() => onSelectOperator(operator)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-[#1a2536] border border-[#243044] hover:border-blue-500/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                {operator.nome?.[0]?.toUpperCase() || operator.codice_operatore?.[0]?.toUpperCase() || 'O'}
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-200">
                  {operator.nome || operator.codice_operatore || 'Operatore'}
                </p>
                <p className="text-xs text-slate-500">
                  {operator.ruolo || operator.codice_operatore || 'Operatore'}
                </p>
              </div>
            </div>
            <FiChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
