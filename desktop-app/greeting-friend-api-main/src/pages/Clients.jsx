/**
 * Clients Page — Design L aligned
 * Lista clienti con KPI, filtri, paginazione, bulk actions, CSV export
 * Dettaglio cliente → ClientDetail.jsx (pagina separata)
 * Form nuovo/modifica → ClientNew.jsx (pagina separata)
 *
 * @author haxies
 * @created 2025
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrg } from "@/context/OrgContext";
import { supabaseBrowser } from "@/lib/supabase-browser";
import {
  FiPlus, FiEdit, FiEye, FiTrash2, FiSearch, FiRefreshCw,
  FiUsers, FiDownload, FiAlertCircle, FiX, FiChevronLeft,
  FiChevronRight, FiUser, FiBriefcase
} from "react-icons/fi";

/* ─── Helpers ─── */
const EUR = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "€ 0,00";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
};

const s2c = (r) => ({
  id: r.id,
  orgId: r.org_id,
  nome: r.nome ?? r.name ?? "",
  cognome: r.surname ?? null,
  telefono: r.phone ?? null,
  email: r.email ?? null,
  piva: r.piva ?? r.vat ?? null,
  indirizzo: r.indirizzo ?? r.address ?? null,
  note: r.note ?? r.notes ?? null,
  number: r.number ?? null,
  codice: r.codice ?? null,
  isCompany: r.is_company ?? false,
  createdAt: r.created_at,
});

const PER_PAGE = 25;

/* ─── Component ─── */
export default function Clients() {
  const navigate = useNavigate();
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();

  /* state */
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all | company | private
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Aggregati (preventivi + trasporti count per cliente)
  const [quoteCounts, setQuoteCounts] = useState({});
  const [transportCounts, setTransportCounts] = useState({});

  /* ─── Fetch ─── */
  useEffect(() => {
    if (orgId) loadAll();
  }, [orgId]); // eslint-disable-line

  async function loadAll() {
    try {
      setRefreshing(true);
      setError(null);

      const [clientsRes, quotesRes, transportsRes] = await Promise.all([
        supabase
          .from("clients")
          .select("id, org_id, nome, phone, email, piva, indirizzo, notes, created_at, number, codice, is_company")
          .eq("org_id", orgId)
          .order("created_at", { ascending: false }),
        supabase
          .from("quotes")
          .select("id, client_id, cliente, importo")
          .eq("org_id", orgId)
          .then(r => r)
          .catch(() => ({ data: [], error: null })),
        supabase
          .from("transports")
          .select("id, client_id")
          .eq("org_id", orgId)
          .then(r => r)
          .catch(() => ({ data: [], error: null })),
      ]);

      if (clientsRes.error) throw clientsRes.error;

      const mapped = (clientsRes.data || []).map(s2c);
      setClients(mapped);

      // Aggregate quote counts
      const qc = {};
      (quotesRes.data || []).forEach(q => {
        const cid = q.client_id;
        if (cid) {
          if (!qc[cid]) qc[cid] = { count: 0, total: 0 };
          qc[cid].count += 1;
          qc[cid].total += Number(q.importo || 0);
        }
      });
      setQuoteCounts(qc);

      // Aggregate transport counts
      const tc = {};
      (transportsRes.data || []).forEach(t => {
        const cid = t.client_id;
        if (cid) {
          tc[cid] = (tc[cid] || 0) + 1;
        }
      });
      setTransportCounts(tc);
    } catch (err) {
      console.error("Errore caricamento clienti:", err);
      setError("Errore caricamento clienti.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /* ─── Realtime ─── */
  useEffect(() => {
    if (!orgId) return;
    const ch = supabase
      .channel(`clients-rt:${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "clients", filter: `org_id=eq.${orgId}` }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orgId]); // eslint-disable-line

  /* ─── Filter + Search ─── */
  const filtered = useMemo(() => {
    let result = clients;

    if (filterType === "company") result = result.filter(c => c.isCompany || (c.piva && c.piva.trim()));
    else if (filterType === "private") result = result.filter(c => !c.isCompany && (!c.piva || !c.piva.trim()));

    const s = searchTerm.trim().toLowerCase();
    if (s) {
      result = result.filter(c =>
        (c.nome || "").toLowerCase().includes(s) ||
        (c.telefono || "").toLowerCase().includes(s) ||
        (c.email || "").toLowerCase().includes(s) ||
        (c.piva || "").toLowerCase().includes(s) ||
        (c.indirizzo || "").toLowerCase().includes(s) ||
        (c.codice || "").toLowerCase().includes(s)
      );
    }
    return result;
  }, [clients, filterType, searchTerm]);

  /* ─── KPI ─── */
  const kpi = useMemo(() => {
    const total = clients.length;
    const companies = clients.filter(c => c.isCompany || (c.piva && c.piva.trim())).length;
    const privates = total - companies;
    const withQuotes = clients.filter(c => quoteCounts[c.id]?.count > 0).length;
    return { total, companies, privates, withQuotes };
  }, [clients, quoteCounts]);

  /* ─── Pagination ─── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, currentPage]);

  /* ─── Delete ─── */
  async function deleteClient(id) {
    try {
      const { error: err } = await supabase.from("clients").delete().eq("id", id).eq("org_id", orgId);
      if (err) {
        if (err.code === "23503" || err.message?.includes("foreign key")) {
          setError("Impossibile eliminare: ci sono preventivi o trasporti collegati.");
        } else {
          throw err;
        }
      } else {
        setClients(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error("Errore eliminazione:", err);
      setError("Errore eliminazione cliente.");
    } finally {
      setShowDeleteConfirm(null);
    }
  }

  /* ─── CSV Export ─── */
  async function exportCSV() {
    setExporting(true);
    try {
      const headers = ["Codice", "Nome", "Telefono", "Email", "P.IVA", "Indirizzo", "Note"];
      const rows = filtered.map(c => [
        c.number ? `CL${String(c.number).padStart(4, "0")}` : (c.codice || c.id?.slice(0, 8)),
        c.nome || "",
        c.telefono || "",
        c.email || "",
        c.piva || "",
        c.indirizzo || "",
        c.note || "",
      ]);
      const csv = [headers.join(","), ...rows.map(r => r.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `clienti_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
    } catch (err) {
      console.error("Errore export:", err);
    } finally {
      setExporting(false);
    }
  }

  /* ─── Client code display ─── */
  const clientCode = (c) => c.number ? `CL${String(c.number).padStart(4, "0")}` : (c.codice || c.id?.slice(0, 8) || "—");
  const isCompany = (c) => c.isCompany || (c.piva && c.piva.trim());

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div><div className="h-5 w-40 bg-[#243044] rounded mb-1.5" /><div className="h-3 w-64 bg-[#1a2536] rounded" /></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-[#1a2536] rounded-xl border border-[#243044]" />)}
        </div>
        <div className="h-10 bg-[#1a2536] rounded-xl border border-[#243044]" />
        <div className="h-80 bg-[#1a2536] rounded-xl border border-[#243044]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Header compatto ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Clienti</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gestione anagrafica clienti</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadAll} disabled={refreshing}
            className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition disabled:opacity-50">
            <FiRefreshCw className={`w-3.5 h-3.5 inline mr-1 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "..." : "Aggiorna"}
          </button>
          <button onClick={exportCSV} disabled={exporting || filtered.length === 0}
            className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition disabled:opacity-50">
            <FiDownload className="w-3.5 h-3.5 inline mr-1" />
            CSV
          </button>
          <button onClick={() => navigate("/clienti/nuovo")}
            className="h-8 px-3.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-600/20">
            <FiPlus className="w-3.5 h-3.5 inline mr-1" />
            Nuovo
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-blue-500/30 transition">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
            <FiUsers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-semibold text-slate-100">{kpi.total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Totale Clienti</div>
        </div>
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-purple-500/30 transition">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mb-2">
            <FiBriefcase className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-semibold text-slate-100">{kpi.companies}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Aziende</div>
        </div>
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-emerald-500/30 transition">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2">
            <FiUser className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-semibold text-slate-100">{kpi.privates}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Privati</div>
        </div>
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-amber-500/30 transition">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2">
            <FiEye className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-semibold text-slate-100">{kpi.withQuotes}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Con Preventivi</div>
        </div>
      </div>

      {/* ── Toolbar filtri ── */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044] px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 w-3 h-3" />
            <input type="text" placeholder="Cerca nome, email, telefono, P.IVA..." value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full h-7 pl-7 pr-3 text-[11px] border border-[#243044] rounded-md bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/30 outline-none transition" />
          </div>
          <div className="flex items-center bg-[#141c27] rounded-lg border border-[#243044] p-0.5">
            {[
              { key: "all", label: "Tutti" },
              { key: "company", label: "Aziende" },
              { key: "private", label: "Privati" },
            ].map(f => (
              <button key={f.key}
                onClick={() => { setFilterType(f.key); setCurrentPage(1); }}
                className={`h-6 px-2.5 text-[10px] font-medium rounded-md transition ${
                  filterType === f.key
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}>
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-600">{filtered.length} clienti</span>
        </div>
      </div>

      {/* ── Errore ── */}
      {error && (
        <div className="bg-red-500/5 rounded-xl border border-red-500/15 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <FiAlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-xs text-red-400 flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300"><FiX className="w-3 h-3" /></button>
          </div>
        </div>
      )}

      {/* ── Tabella ── */}
      {filtered.length > 0 ? (
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#141c27]">
                  <th className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Codice</th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Cliente</th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Contatti</th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">P.IVA / CF</th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">Prev.</th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">Trasp.</th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243044]/60">
                {paginatedClients.map(client => {
                  const qc = quoteCounts[client.id];
                  const tc = transportCounts[client.id] || 0;
                  const company = isCompany(client);
                  return (
                    <tr key={client.id} className="hover:bg-[#141c27]/60 transition-colors">
                      <td className="px-3 py-2">
                        <span className="text-[10px] font-mono text-slate-500">{clientCode(client)}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${
                            company ? "bg-purple-500/15 text-purple-400" : "bg-blue-500/15 text-blue-400"
                          }`}>
                            {(client.nome || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-slate-200 truncate max-w-[180px]">{client.nome || "—"}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`inline-flex px-1 py-px rounded text-[9px] font-medium ${
                                company ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
                              }`}>
                                {company ? "Azienda" : "Privato"}
                              </span>
                              {client.indirizzo && (
                                <span className="text-[10px] text-slate-600 truncate max-w-[120px]">{client.indirizzo}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="space-y-0.5">
                          {client.telefono && <div className="text-xs text-slate-300">{client.telefono}</div>}
                          {client.email && <div className="text-[10px] text-slate-500 truncate max-w-[160px]">{client.email}</div>}
                          {!client.telefono && !client.email && <span className="text-[10px] text-slate-600">—</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-xs text-slate-400 font-mono">{client.piva || "—"}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {qc ? (
                          <div>
                            <div className="text-xs font-medium text-blue-400">{qc.count}</div>
                            <div className="text-[9px] text-slate-600">{EUR(qc.total)}</div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs font-medium ${tc > 0 ? "text-emerald-400" : "text-slate-600"}`}>
                          {tc || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/clienti/${client.id}`)}
                            className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition"
                            title="Dettaglio">
                            <FiEye className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => navigate(`/clienti/${client.id}/modifica`)}
                            className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition"
                            title="Modifica">
                            <FiEdit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(client.id)}
                            className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Elimina">
                            <FiTrash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginazione */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-[#243044]">
              <span className="text-[10px] text-slate-500">
                {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, filtered.length)} di {filtered.length}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500">{currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                  className="w-6 h-6 flex items-center justify-center rounded border border-[#243044] bg-[#141c27] text-slate-400 disabled:opacity-30 hover:bg-[#1e2b3d] transition">
                  <FiChevronLeft className="w-3 h-3" />
                </button>
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                  className="w-6 h-6 flex items-center justify-center rounded border border-[#243044] bg-[#141c27] text-slate-400 disabled:opacity-30 hover:bg-[#1e2b3d] transition">
                  <FiChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-[#1a2536] rounded-xl border border-[#243044]">
          <FiUsers className="w-10 h-10 text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-400 mb-1">
            {searchTerm ? "Nessun cliente trovato" : "Nessun cliente presente"}
          </p>
          <p className="text-[10px] text-slate-600 mb-4">
            {searchTerm ? "Prova a modificare i termini di ricerca" : "Inizia creando il tuo primo cliente"}
          </p>
          {!searchTerm && (
            <button onClick={() => navigate("/clienti/nuovo")}
              className="h-7 px-3 text-[10px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
              <FiPlus className="w-3 h-3 inline mr-1" /> Nuovo Cliente
            </button>
          )}
        </div>
      )}

      {/* ── Dialog conferma eliminazione ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm border-none cursor-pointer"
            onClick={() => setShowDeleteConfirm(null)} aria-label="Chiudi" type="button" />
          <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-5">
            <div className="text-sm font-semibold text-slate-200 mb-1.5">Conferma eliminazione</div>
            <div className="text-xs text-slate-400 mb-5">Sei sicuro di voler eliminare questo cliente? L&apos;azione non può essere annullata.</div>
            <div className="flex justify-end gap-2">
              <button className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition"
                onClick={() => setShowDeleteConfirm(null)}>Annulla</button>
              <button className="h-8 px-3 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                onClick={() => deleteClient(showDeleteConfirm)}>Elimina</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
