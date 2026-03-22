// src/components/ClientSearchModal.jsx
import { useState, useEffect, useRef } from "react";
import { FiSearch, FiX, FiUser, FiPhone, FiMail, FiFileText, FiMapPin } from "react-icons/fi";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function ClientSearchModal({ isOpen, onClose, onSelect, orgId }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const searchInputRef = useRef(null);
  const scrollRef = useRef(null);

  const SUPABASE_BATCH_SIZE = 20;

  // Focus input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 100);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Search clients
  useEffect(() => {
    if (!orgId || !isOpen) return;

    const timeoutId = setTimeout(() => {
      searchClients();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, orgId, isOpen, page]);

  async function searchClients(resetPage = false) {
    if (!orgId) return;

    setLoading(true);

    try {
      let query = supabaseBrowser()
        .from("clients")
        .select("id, codice, nome, phone, email, piva, indirizzo, is_company, number")
        .eq("org_id", orgId);

      // Add search filters
      if (searchTerm.trim()) {
        query = query.or(
          `codice.ilike.%${searchTerm}%,nome.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );
      }

      // Add pagination
      const from = resetPage ? 0 : page * SUPABASE_BATCH_SIZE;
      const to = from + SUPABASE_BATCH_SIZE - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) {
        console.error("Error searching clients:", error);
        setClients([]);
        return;
      }

      if (resetPage) {
        setClients(data || []);
        setPage(1);
      } else {
        setClients(prev => [...prev, ...(data || [])]);
        setPage(prev => prev + 1);
      }

      setHasMore((data || []).length === SUPABASE_BATCH_SIZE);

    } catch (e) {
      console.error("Error searching clients:", e);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }

  function handleLoadMore() {
    if (!loading && hasMore) {
      searchClients();
    }
  }

  function handleSelect(client) {
    onSelect(client);
    onClose();
  }

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setClients([]);
      setPage(0);
      setHasMore(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        className="bg-[#141c27] rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#243044] ">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FiUser className="text-blue-500" /> Cerca Cliente
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-400  p-2 rounded-lg hover:bg-[#141c27] "
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-[#243044] ">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setClients([]);
                setPage(0);
                setHasMore(true);
              }}
              placeholder="Cerca per codice, nome, telefono o email..."
              className="w-full pl-10 pr-4 py-2 border border-[#243044] rounded-lg bg-[#1a2536]  focus:ring-2 ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        {/* Results */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4"
        >
          {loading && clients.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-500">Caricamento...</div>
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <FiFileText size={48} className="mb-4 opacity-50" />
              <p className="text-center">
                {searchTerm.trim() 
                  ? "Nessun cliente trovato" 
                  : "Inizia a digitare per cercare clienti"}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleSelect(client)}
                    className="w-full p-4 text-left border border-[#243044] rounded-lg hover:bg-[#141c27]  hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <FiUser className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-200 truncate">
                          {client.nome}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                          {(client.number || client.codice) && (
                            <span className="flex items-center gap-1 font-mono">
                              {client.number ? `CL${String(client.number).padStart(4, '0')}` : client.codice}
                            </span>
                          )}
                          {client.phone && (
                            <span className="flex items-center gap-1">
                              <FiPhone size={12} /> {client.phone}
                            </span>
                          )}
                          {client.email && (
                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                              <FiMail size={12} /> {client.email}
                            </span>
                          )}
                          {client.piva && (
                            <span className="flex items-center gap-1">
                              P.IVA: {client.piva}
                            </span>
                          )}
                        </div>
                        {client.indirizzo && (
                          <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                            <FiMapPin size={12} /> {client.indirizzo}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-blue-600 px-2 py-1 rounded bg-blue-500/10">
                        {client.is_company ? "Azienda" : "Persona"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="mt-4 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="btn btn-outline text-sm"
                  >
                    {loading ? "Caricamento..." : "Carica altri"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#243044]  p-4 text-xs text-slate-500">
          <p>Suggerimento: Puoi cercare per codice, nome, telefono o email</p>
        </div>
      </div>
    </div>
  );
}

