/**
 * Componente Autocomplete per selezione clienti
 * Con dropdown, ricerca in tempo reale e caching
 */

import { useState, useRef, useEffect } from 'react';
import { FiSearch, FiX, FiLoader } from 'react-icons/fi';
import { useClientAutocomplete } from '../hooks/useClientAutocomplete';

export default function ClientAutocomplete({ 
  orgId, 
  onSelect, 
  placeholder = "Cerca cliente...",
  value = null,
  disabled = false 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(value);
  
  const { clients, loading } = useClientAutocomplete(orgId, searchTerm);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Sincronizza valore esterno
  useEffect(() => {
    setSelectedClient(value);
  }, [value]);

  // Chiudi dropdown quando clicchi fuori
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (client) => {
    setSelectedClient(client);
    setSearchTerm('');
    setIsOpen(false);
    onSelect?.(client);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedClient(null);
    setSearchTerm('');
    onSelect?.(null);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          <FiSearch className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          placeholder={selectedClient ? selectedClient.nome : placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          disabled={disabled}
          className="w-full pl-9 pr-10 py-2 bg-[#1a2536] border border-[#243044] rounded-lg text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors disabled:opacity-50"
        />

        {/* Clear button */}
        {selectedClient && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
            <FiLoader className="w-4 h-4 animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#141c27] border border-[#243044] rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {clients.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500 text-center">
              {searchTerm ? 'Nessun cliente trovato' : 'Inizia a digitare per cercare'}
            </div>
          ) : (
            <div className="divide-y divide-[#243044]">
              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleSelect(client)}
                  className="w-full px-4 py-2.5 text-left hover:bg-[#1a2536] transition-colors focus:outline-none focus:bg-[#1a2536]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-200">
                        {client.nome || client.codice}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {client.codice && `Cod: ${client.codice}`}
                        {client.phone && ` • ${client.phone}`}
                      </p>
                    </div>
                    {selectedClient?.id === client.id && (
                      <div className="ml-2 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected client info */}
      {selectedClient && !searchTerm && (
        <div className="mt-2 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs font-medium text-blue-300">
            {selectedClient.nome}
          </p>
          {selectedClient.phone && (
            <p className="text-xs text-blue-200/70 mt-0.5">
              {selectedClient.phone}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
