// src/components/spare-parts/OEMLookupButton.jsx
import { useState } from 'react';
import PropTypes from 'prop-types';
import { FiSearch, FiLoader, FiCheckCircle, FiAlertCircle, FiZap } from 'react-icons/fi';
import { lookupByOEM, applyLookupDataToForm, isValidOEMCode } from '@/lib/oem-lookup';
import { logger } from '@/lib/logger';

/**
 * Bottone intelligente per ricerca e auto-compilazione da codice OEM
 * 
 * Quando l'utente inserisce un codice OEM, questo componente:
 * 1. Valida il codice
 * 2. Interroga TecDoc API
 * 3. Compila automaticamente tutti i campi del form
 * 4. Mostra feedback visivo del processo
 */
export default function OEMLookupButton({ oemCode, onDataFound, disabled, className }) {
  const [searching, setSearching] = useState(false);
  const [lastResult, setLastResult] = useState(null); // 'success' | 'not_found' | 'error'

  const handleLookup = async () => {
    if (!oemCode || !isValidOEMCode(oemCode)) {
      setLastResult('error');
      return;
    }

    setSearching(true);
    setLastResult(null);

    try {
      logger.info(`[OEM Lookup Button] Ricerca per: ${oemCode}`);
      
      const data = await lookupByOEM(oemCode);

      if (data) {
        setLastResult('success');
        onDataFound(data);
        logger.info('[OEM Lookup Button] Dati trovati e applicati');
      } else {
        setLastResult('not_found');
        logger.warn('[OEM Lookup Button] Nessun dato trovato');
      }
    } catch (error) {
      setLastResult('error');
      logger.error('[OEM Lookup Button] Errore ricerca:', error);
    } finally {
      setSearching(false);
    }
  };

  const getButtonStyle = () => {
    if (lastResult === 'success') {
      return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20';
    }
    if (lastResult === 'not_found') {
      return 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20';
    }
    if (lastResult === 'error') {
      return 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20';
    }
    return 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20';
  };

  const getIcon = () => {
    if (searching) return <FiLoader className="w-4 h-4 animate-spin" />;
    if (lastResult === 'success') return <FiCheckCircle className="w-4 h-4" />;
    if (lastResult === 'not_found') return <FiAlertCircle className="w-4 h-4" />;
    if (lastResult === 'error') return <FiAlertCircle className="w-4 h-4" />;
    return <FiZap className="w-4 h-4" />;
  };

  const getLabel = () => {
    if (searching) return 'Ricerca in corso...';
    if (lastResult === 'success') return 'Dati trovati!';
    if (lastResult === 'not_found') return 'Non trovato';
    if (lastResult === 'error') return 'Errore';
    return 'Cerca da OEM';
  };

  const isDisabled = disabled || searching || !oemCode || !isValidOEMCode(oemCode);

  return (
    <button
      type="button"
      onClick={handleLookup}
      disabled={isDisabled}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg border
        text-sm font-medium transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${getButtonStyle()}
        ${className || ''}
      `}
      title={isDisabled ? 'Inserisci un codice OEM valido' : 'Cerca e compila automaticamente i dati del ricambio'}
    >
      {getIcon()}
      <span>{getLabel()}</span>
    </button>
  );
}

OEMLookupButton.propTypes = {
  oemCode: PropTypes.string,
  onDataFound: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

OEMLookupButton.defaultProps = {
  oemCode: '',
  disabled: false,
  className: ''
};
