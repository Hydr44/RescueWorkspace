/**
 * Hook per gestione selezione multipla
 * 
 * Gestisce:
 * - Selezione/deselezione elementi
 * - Selezione tutto/nulla
 * - Contatore elementi selezionati
 * - Filtri su elementi selezionati
 */

import { useState, useCallback, useMemo } from "react";

export function useMultiSelect(items = [], getId = (item) => item?.id) {
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Controlla se un elemento è selezionato
  const isSelected = useCallback((item) => {
    const id = getId(item);
    return selectedIds.has(id);
  }, [selectedIds, getId]);

  // Controlla se tutti gli elementi visibili sono selezionati
  const isAllSelected = useMemo(() => {
    if (!items || items.length === 0) return false;
    return items.every(item => selectedIds.has(getId(item)));
  }, [items, selectedIds, getId]);

  // Controlla se alcuni elementi sono selezionati
  const isSomeSelected = useMemo(() => {
    if (!items || items.length === 0) return false;
    return items.some(item => selectedIds.has(getId(item))) && !isAllSelected;
  }, [items, selectedIds, getId, isAllSelected]);

  // Toggle selezione singolo elemento
  const toggleSelect = useCallback((item) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      const id = getId(item);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, [getId]);

  // Seleziona elemento
  const select = useCallback((item) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      newSet.add(getId(item));
      return newSet;
    });
  }, [getId]);

  // Deseleziona elemento
  const deselect = useCallback((item) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(getId(item));
      return newSet;
    });
  }, [getId]);

  // Seleziona tutti gli elementi visibili
  const selectAll = useCallback(() => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      items.forEach(item => newSet.add(getId(item)));
      return newSet;
    });
  }, [items, getId]);

  // Deseleziona tutti
  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Toggle seleziona tutto
  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      // Deseleziona tutti gli elementi visibili (mantiene quelli fuori vista)
      const visibleIds = new Set(items.map(getId));
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        visibleIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    } else {
      selectAll();
    }
  }, [isAllSelected, items, getId, selectAll]);

  // Ottieni elementi selezionati
  const selectedItems = useMemo(() => {
    return items.filter(item => selectedIds.has(getId(item)));
  }, [items, selectedIds, getId]);

  // Numero elementi selezionati
  const selectedCount = selectedIds.size;

  // Reset selezione
  const reset = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Seleziona per ID array
  const setSelected = useCallback((ids) => {
    setSelectedIds(new Set(Array.isArray(ids) ? ids : []));
  }, []);

  // Ottieni array di ID selezionati
  const getSelectedIds = useCallback(() => {
    return Array.from(selectedIds);
  }, [selectedIds]);

  return {
    // Stato
    selectedIds,
    selectedItems,
    selectedCount,
    isAllSelected,
    isSomeSelected,

    // Azioni
    isSelected,
    toggleSelect,
    select,
    deselect,
    selectAll,
    deselectAll,
    toggleSelectAll,
    reset,
    setSelected,
    getSelectedIds,
  };
}

