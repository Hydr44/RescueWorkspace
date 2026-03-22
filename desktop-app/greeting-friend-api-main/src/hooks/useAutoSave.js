/**
 * Hook per auto-save con feedback visivo
 * Salva automaticamente i dati con debounce e mostra stato sincronizzazione
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabaseBrowser } from '../lib/supabase-browser';

export function useAutoSave(table, recordId, orgId) {
  const [saveState, setSaveState] = useState('idle'); // idle, saving, success, error
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState(null);
  
  const supabase = supabaseBrowser();
  const debounceTimer = useRef(null);
  const successTimer = useRef(null);

  // Salva dati
  const save = useCallback(async (data) => {
    try {
      setSaveState('saving');
      setError(null);

      // Valida che abbiamo i dati necessari
      if (!table || !recordId || !orgId) {
        throw new Error('Missing required parameters for save');
      }

      // Se è un nuovo record (recordId = 'new'), fai insert
      if (recordId === 'new') {
        const { data: result, error: insertError } = await supabase
          .from(table)
          .insert({ ...data, org_id: orgId })
          .select()
          .single();

        if (insertError) throw insertError;

        setSaveState('success');
        setLastSaved(new Date());

        // Reset success state dopo 2 secondi
        if (successTimer.current) clearTimeout(successTimer.current);
        successTimer.current = setTimeout(() => {
          setSaveState('idle');
        }, 2000);

        return result;
      }

      // Altrimenti fai update
      const { data: result, error: updateError } = await supabase
        .from(table)
        .update(data)
        .eq('id', recordId)
        .eq('org_id', orgId)
        .select()
        .single();

      if (updateError) throw updateError;

      setSaveState('success');
      setLastSaved(new Date());

      // Reset success state dopo 2 secondi
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => {
        setSaveState('idle');
      }, 2000);

      return result;
    } catch (err) {
      if (isDev) console.error('[useAutoSave] Error:', err);
      setError(err.message);
      setSaveState('error');

      // Reset error state dopo 3 secondi
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => {
        setSaveState('idle');
      }, 3000);

      throw err;
    }
  }, [table, recordId, orgId, supabase]);

  // Debounced save
  const debouncedSave = useCallback((data) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      save(data);
    }, 1000); // Salva dopo 1 secondo di inattività
  }, [save]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  return {
    saveState,
    lastSaved,
    error,
    save,
    debouncedSave
  };
}

/**
 * Hook per validazione real-time
 */
export function useRealTimeValidation(data, validator) {
  const [validationErrors, setValidationErrors] = useState({});
  const validationTimer = useRef(null);

  useEffect(() => {
    if (validationTimer.current) {
      clearTimeout(validationTimer.current);
    }

    validationTimer.current = setTimeout(() => {
      if (validator) {
        const errors = validator(data);
        setValidationErrors(errors.errors || {});
      }
    }, 300);

    return () => {
      if (validationTimer.current) clearTimeout(validationTimer.current);
    };
  }, [data, validator]);

  return {
    validationErrors,
    isValid: Object.keys(validationErrors).length === 0
  };
}
