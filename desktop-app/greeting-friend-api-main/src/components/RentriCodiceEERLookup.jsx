// src/components/RentriCodiceEERLookup.jsx
/**
 * Componente Lookup Codici EER RENTRI
 * Autocompletamento con ricerca full-text e cache locale
 */

import { useState, useEffect, useRef } from "react";
import { FiSearch, FiAlertTriangle, FiX, FiCheck } from "react-icons/fi";
import { supabase } from "../lib/supabase";

export default function RentriCodiceEERLookup({ 
  value, 
  onChange, 
  onSelect,
  placeholder = "Cerca codice EER...",
  disabled = false,
  showDetails = true 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedEER, setSelectedEER] = useState(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Carica dettagli codice EER se value è fornito
  useEffect(() => {
    if (value && value !== searchTerm) {
      loadEERDetails(value);
    }
  }, [value]);

  // Chiudi dropdown quando si clicca fuori
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadEERDetails(codice) {
    try {
      const { data, error } = await supabase
        .from("rentri_codifiche_cache")
        .select("*")
        .eq("tabella", "CodiciEER")
        .eq("codice", codice)
        .single();

      if (error) throw error;
      if (data) {
        setSelectedEER(data);
        setSearchTerm(codice);
      }
    } catch (error) {
      console.error("[EER_LOOKUP] Errore caricamento dettagli:", error);
    }
  }

  async function searchEER(query) {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Usa funzione RPC per ricerca ottimizzata
      const { data, error } = await supabase
        .rpc("search_codici_eer", {
          search_query: query,
          limit_count: 20
        });

      if (error) throw error;
      setResults(data || []);
      setShowDropdown(true);
    } catch (error) {
      console.error("[EER_LOOKUP] Errore ricerca:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e) {
    const query = e.target.value;
    setSearchTerm(query);
    setSelectedIndex(-1);
    
    if (onChange) {
      onChange(query);
    }

    // Debounce search
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      searchEER(query);
    }, 300);
  }

  const searchTimeout = useRef(null);

  function handleSelectEER(eer) {
    setSearchTerm(eer.codice);
    setSelectedEER(eer);
    setShowDropdown(false);
    
    if (onChange) {
      onChange(eer.codice);
    }
    
    if (onSelect) {
      onSelect(eer);
    }
  }

  function handleClear() {
    setSearchTerm("");
    setSelectedEER(null);
    setResults([]);
    setShowDropdown(false);
    
    if (onChange) {
      onChange("");
    }
    
    if (onSelect) {
      onSelect(null);
    }
    
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (!showDropdown || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelectEER(results[selectedIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        break;
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Input Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-10 py-2 text-sm bg-[#1a2536] border border-[#243044] rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        {/* Loading spinner */}
        {loading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {/* Clear button */}
        {searchTerm && !disabled && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[#1a2536] border border-[#243044] rounded-lg shadow-xl max-h-80 overflow-auto">
          {results.map((eer, index) => (
            <button
              key={eer.codice}
              onClick={() => handleSelectEER(eer)}
              className={`w-full px-4 py-3 text-left hover:bg-[#243044] transition-colors border-b border-[#243044] last:border-b-0 ${
                index === selectedIndex ? 'bg-[#243044]' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-semibold text-blue-400">
                      {eer.codice}
                    </span>
                    {eer.pericoloso && (
                      <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400 flex items-center gap-1">
                        <FiAlertTriangle className="w-3 h-3" />
                        Pericoloso
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 mb-1">
                    {eer.descrizione}
                  </p>
                  {eer.categoria && (
                    <p className="text-xs text-slate-500">
                      {eer.categoria}
                    </p>
                  )}
                  {eer.hp_codes && eer.hp_codes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {eer.hp_codes.map(hp => (
                        <span 
                          key={hp}
                          className="px-1.5 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-xs text-orange-400"
                        >
                          {hp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected EER Details */}
      {showDetails && selectedEER && (
        <div className="mt-3 p-3 bg-[#141c27] border border-[#243044] rounded-lg">
          <div className="flex items-start gap-3">
            <FiCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-sm font-semibold text-blue-400">
                  {selectedEER.codice}
                </span>
                {selectedEER.pericoloso && (
                  <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400 flex items-center gap-1">
                    <FiAlertTriangle className="w-3 h-3" />
                    Rifiuto Pericoloso
                  </span>
                )}
              </div>
              
              <p className="text-sm text-slate-300 mb-2">
                {selectedEER.descrizione}
              </p>
              
              {selectedEER.descrizione_estesa && (
                <p className="text-xs text-slate-500 mb-2">
                  {selectedEER.descrizione_estesa}
                </p>
              )}
              
              {selectedEER.categoria && (
                <div className="mb-2">
                  <span className="text-xs text-slate-500">Categoria: </span>
                  <span className="text-xs text-slate-400">{selectedEER.categoria}</span>
                </div>
              )}
              
              {selectedEER.stato_fisico && (
                <div className="mb-2">
                  <span className="text-xs text-slate-500">Stato Fisico: </span>
                  <span className="text-xs text-slate-400">{selectedEER.stato_fisico}</span>
                </div>
              )}
              
              {selectedEER.hp_codes && selectedEER.hp_codes.length > 0 && (
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Classi di Pericolo:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedEER.hp_codes.map(hp => (
                      <span 
                        key={hp}
                        className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-xs text-orange-400"
                      >
                        {hp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {showDropdown && !loading && searchTerm.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[#1a2536] border border-[#243044] rounded-lg shadow-xl p-4 text-center">
          <p className="text-sm text-slate-500">
            Nessun codice EER trovato per "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
}
