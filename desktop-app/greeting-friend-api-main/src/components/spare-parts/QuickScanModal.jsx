/**
 * Modale fullscreen per scansione rapida codici ricambi
 * Supporta scanner USB (emula tastiera) e input manuale
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiSearch, FiLoader, FiPackage, FiCreditCard } from 'react-icons/fi';
import { lookupByCode } from '@/lib/tecdoc';

export default function QuickScanModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [lastScanned, setLastScanned] = useState([]);
  const inputRef = useRef(null);

  // Auto-focus input quando modale si apre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Listener per scanner USB (emula tastiera con Enter finale)
  useEffect(() => {
    if (!isOpen) return;

    let buffer = '';
    let timeout = null;

    const handleKeyPress = (e) => {
      // Ignora se focus è su altro input
      if (document.activeElement !== inputRef.current) return;

      if (e.key === 'Enter') {
        if (buffer.length > 0) {
          handleSearch(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
        
        // Reset buffer dopo 100ms di inattività
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          buffer = '';
        }, 100);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      clearTimeout(timeout);
    };
  }, [isOpen]);

  const handleSearch = async (searchCode) => {
    const trimmedCode = (searchCode || code).trim().toUpperCase();
    if (!trimmedCode) return;

    setSearching(true);
    setError(null);

    try {
      // Cerca con TecDoc
      const result = await lookupByCode(trimmedCode);
      
      if (!result || !result.articles || result.articles.length === 0) {
        setError(`Nessun ricambio trovato per codice: ${trimmedCode}`);
        setSearching(false);
        return;
      }

      // Prendi primo articolo trovato
      const article = result.articles[0];
      const partName = article.articleName || article.name || article.genericArticleName || 'Ricambio';
      
      // Aggiungi a storico scansioni
      setLastScanned(prev => [
        { code: trimmedCode, name: partName, timestamp: Date.now() },
        ...prev.slice(0, 4),
      ]);

      // Naviga a SparePartQuickAdd con codice scansionato
      // La pagina caricherà automaticamente TecDoc + IA + eBay pricing
      navigate(`/ricambi-mvp/quick-add?code=${encodeURIComponent(trimmedCode)}`);
      
      // Reset e chiudi
      setCode('');
      setError(null);
      onClose();

    } catch (err) {
      console.error('[QuickScan] Search error:', err);
      setError(err.message || 'Errore durante la ricerca');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(code);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="bg-[#1a2536] rounded-t-2xl border border-[#243044] border-b-0 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <FiCreditCard className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Scansione Rapida</h2>
              <p className="text-xs text-slate-500">Scansiona o inserisci codice OEM/EAN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#141c27] border border-[#243044] flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-[#1e2b3d] transition"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Input Area */}
        <div className="bg-[#1a2536] border-x border-[#243044] px-6 py-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Scansiona barcode o digita codice..."
                className="w-full h-16 px-6 pr-16 text-lg border-2 border-blue-500/30 rounded-xl bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition"
                disabled={searching}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={searching || !code.trim()}
                className="absolute right-2 top-2 h-12 px-6 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {searching ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    Ricerca...
                  </>
                ) : (
                  <>
                    <FiSearch className="w-4 h-4" />
                    Cerca
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 flex items-start gap-3">
                <FiX className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-400">Ricambio non trovato</p>
                  <p className="text-xs text-red-400/70 mt-1">{error}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <FiCreditCard className="w-4 h-4" />
              <span>Scanner USB rilevato automaticamente. Premi Enter dopo la scansione.</span>
            </div>
          </form>
        </div>

        {/* Storico Scansioni */}
        {lastScanned.length > 0 && (
          <div className="bg-[#1a2536] rounded-b-2xl border border-[#243044] border-t-0 px-6 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3">Ultime Scansioni</p>
            <div className="space-y-2">
              {lastScanned.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(item.code)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-[#141c27] border border-[#243044] hover:border-blue-500/30 hover:bg-[#1e2b3d] transition text-left"
                >
                  <FiPackage className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-300 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{item.code}</p>
                  </div>
                  <span className="text-[10px] text-slate-600">
                    {new Date(item.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Shortcut Hints */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-600">
          <span><kbd className="px-2 py-1 rounded bg-[#1a2536] border border-[#243044] font-mono">ESC</kbd> Chiudi</span>
          <span><kbd className="px-2 py-1 rounded bg-[#1a2536] border border-[#243044] font-mono">Enter</kbd> Cerca</span>
        </div>
      </div>
    </div>
  );
}
