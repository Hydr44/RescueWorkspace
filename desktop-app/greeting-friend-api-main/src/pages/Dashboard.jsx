/**
 * Dashboard Page
 * Pagina principale con overview completa e azioni rapide
 *
 * @author haxies
 * @created 2025
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiTruck, FiClock, FiCheckCircle, FiPlus, FiRefreshCw, 
  FiUsers, FiAlertCircle,
  FiFileText, FiActivity, FiMapPin, FiLink2, FiCopy, FiExternalLink, FiTrash2, FiX
} from "react-icons/fi";
import { supabaseBrowser } from "../lib/supabase-browser";
import { createAssistRequest, listAssistRequests } from "../lib/assist";
import { API } from "../lib/apiConfig";
import { useOrg } from "../context/OrgContext";
import { useQRCode } from "../hooks/useQRCode";
import OnboardingWizard from "../components/ui/OnboardingWizard";
import { KPICard, QuickAction, StatusBadge, DriverStatus } from "../components/ui/DashboardCards";

export default function Dashboard() {
  const navigate = useNavigate();
  const supabase = supabaseBrowser();
  const { orgId, orgName } = useOrg();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transports, setTransports] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [notes, setNotes] = useState(localStorage.getItem("rm-dashboard-notes") || "");
  const [savingNotes, setSavingNotes] = useState(false);
  
  // Contatori globali per le statistiche
  const [globalCounts, setGlobalCounts] = useState({
    total: 0,
    daFare: 0,
    inAttesa: 0,
    inCorso: 0,
    completati: 0,
    clients: 0,
    drivers: 0
  });
  
  // Posizione cliente
  const [assistList, setAssistList] = useState([]);
  const [assistLink, setAssistLink] = useState(null);
  const [assistDetail, setAssistDetail] = useState(null);
  const [assistOpen, setAssistOpen] = useState(false);
  const [assistError, setAssistError] = useState(null);
  const [assistLoading, setAssistLoading] = useState(false);
  const [assistQR, setAssistQR] = useState(null);
  const { generateQR, downloadQR } = useQRCode();

  // Carica dati iniziali
  useEffect(() => {
    loadDashboardData();
  }, [orgId]);

  const loadDashboardData = async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Carica trasporti recenti (per la lista)
      const { data: transportsData, error: transportsError } = await supabase
        .from("transports")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (transportsError) throw transportsError;

      // Carica contatori totali (per le statistiche) - TUTTI i trasporti
      const { data: transportsCounts, error: countsError } = await supabase
        .from("transports")
        .select("status")
        .eq("org_id", orgId);

      if (countsError) throw countsError;

      // Carica autisti
      const { data: driversData, error: driversError } = await supabase
        .from("staff_drivers")
        .select("*")
        .eq("org_id", orgId)
        .order("nome");

      if (driversError) throw driversError;

      // Carica contatori clienti
      const { count: clientsCount, error: clientsCountError } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId);

      if (clientsCountError) throw clientsCountError;

      setTransports(transportsData || []);
      setDrivers(driversData || []);
      
      // Aggiorna i contatori globali
      updateGlobalCounts(transportsCounts || [], clientsCount || 0, driversData?.length || 0);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const updateGlobalCounts = (transportsCounts, clientsCount, driversCount) => {
    const counts = {
      total: transportsCounts.length,
      daFare: transportsCounts.filter(t => t.status === "new" || t.status === "da fare").length,
      inAttesa: transportsCounts.filter(t => t.status === "assigned" || t.status === "in attesa").length,
      inCorso: transportsCounts.filter(t => t.status === "enroute" || t.status === "in corso").length,
      completati: transportsCounts.filter(t => t.status === "done" || t.status === "completato").length,
      clients: clientsCount,
      drivers: driversCount
    };
    setGlobalCounts(counts);
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      localStorage.setItem("rm-dashboard-notes", notes);
      // Simula delay per UX
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Error saving notes:", error);
    } finally {
      setSavingNotes(false);
    }
  };

  const loadAssistance = useCallback(async () => {
    if (!orgId) {
      setAssistList([]);
      setAssistLink(null);
      return;
    }

    try {
      setAssistLoading(true);
      setAssistError(null);

      let rows = [];
      if (globalThis.api?.assistance?.list) {
        rows = await globalThis.api.assistance.list({ orgId, limit: 50 });
      } else {
        const response = await listAssistRequests({ orgId, limit: 50 });
        rows = response?.rows || [];
      }

      setAssistList(rows);
    } catch (error) {
      console.error("Error loading assistance list:", error);
      if (typeof error?.message === "string") {
        setAssistError(error.message);
      } else {
        setAssistError("Impossibile caricare le richieste di posizione");
      }
    } finally {
      setAssistLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  useEffect(() => {
    loadAssistance();
    // Polling ogni 10s per aggiornare posizioni ricevute
    const interval = setInterval(loadAssistance, 10000);
    return () => clearInterval(interval);
  }, [loadAssistance]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!assistLink) {
        setAssistQR(null);
        return;
      }
      try {
        const qr = await generateQR(assistLink);
        if (!cancelled) setAssistQR(qr);
      } catch (error) {
        console.error("Error generating assist QR:", error);
        if (!cancelled) setAssistQR(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assistLink, generateQR]);

  // Funzioni per gestione posizione cliente
  const createAssistance = async () => {
    if (!orgId) {
      setAssistError("Seleziona prima un'organizzazione per poter richiedere la posizione.");
      return;
    }

    try {
      setAssistError(null);
      if (process.env.NODE_ENV === "development") {
        console.log("[Assist] createAssistance orgId:", orgId);
      }
      let token = null;
      let link = null;
      if (globalThis.api?.assistance?.create) {
        const created = await globalThis.api.assistance.create({ telefono: "", note: "", orgId });
        token = created?.token;
        link = created?.url || (token ? buildLocateLink(token) : null);
      } else {
        const response = await createAssistRequest({ phone: "", note: "", orgId });
        token = response?.token || response?.request?.token;
        link = response?.url || response?.request?.url || (token ? buildLocateLink(token) : null);
      }

      setAssistLink(link || null);

      if (token) {
        await loadAssistance();
      }
    } catch (error) {
      console.error("Error creating assistance:", error);
      const message = typeof error?.message === "string" ? error.message : "Impossibile creare la richiesta";
      setAssistError(message.includes("orgId") ? "Organizzazione non valida per la richiesta di posizione." : message);
    }
  };

  const copyAssistLink = async () => {
    const linkToCopy = assistLink || assistList[0]?.url || "";
    if (linkToCopy) {
      try {
        await navigator.clipboard.writeText(linkToCopy);
        // Potresti aggiungere un toast notification qui
      } catch (error) {
        console.error("Error copying link:", error);
      }
    }
  };

  const openAssistLinkExternal = () => {
    const linkToOpen = assistLink || assistList[0]?.url || null;
    if (linkToOpen) {
      globalThis.open(linkToOpen, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownloadAssistQR = async () => {
    const linkToDownload = assistLink || assistList[0]?.url || null;
    if (linkToDownload) {
      try {
        await downloadQR(linkToDownload, `assist-${assistList[0]?.token || "link"}`);
      } catch (error) {
        console.error("Error downloading assist QR:", error);
      }
    }
  };

  const openAssist = (assist) => {
    setAssistDetail(assist);
    setAssistOpen(true);
  };

  const deleteAssistance = async (assist) => {
    // Rimuovi subito dalla UI
    setAssistList(prev => prev.filter(a => a.id !== assist.id));
    if (assistDetail?.id === assist.id) {
      setAssistOpen(false);
      setAssistDetail(null);
    }
    if (assistLink === assist.url) {
      setAssistLink(null);
    }

    try {
      // Chiama API di eliminazione (IPC → VPS)
      if (globalThis.api?.assistance?.remove && assist.token) {
        await globalThis.api.assistance.remove(assist.token);
      } else if (assist.token) {
        // Fallback: chiama direttamente la VPS
        await fetch(`${API.ASSIST}/api/assist/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: assist.token }),
        });
      }
    } catch (error) {
      console.error("Error deleting assistance:", error);
    }
  };

  const buildLocateLink = (token) => {
    if (!token) return null;
    // La pagina assist è sul website (rescuemanager.eu), NON sul server API (assist.rescuemanager.eu)
    return `https://rescuemanager.eu/assist/${token}`;
  };

  // Calcola statistiche usando i contatori globali
  const stats = useMemo(() => {
    return {
      total: globalCounts.total,
      daFare: globalCounts.daFare,
      inAttesa: globalCounts.inAttesa,
      inCorso: globalCounts.inCorso,
      completati: globalCounts.completati,
      clients: globalCounts.clients,
      drivers: globalCounts.drivers
    };
  }, [globalCounts]);

  const recentTransports = useMemo(() => {
    return transports.slice(0, 6);
  }, [transports]);

  const availableDrivers = useMemo(() => {
    return drivers.filter(d => d.stato === "disponibile").length;
  }, [drivers]);

  // Handlers
  const handleViewTransport = (transport) => {
    navigate(`/trasporti/${transport.id}`);
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case "new-transport":
        navigate("/trasporti/new");
        break;
      case "new-client":
        navigate("/clienti/nuovo");
        break;
      case "new-quote":
        navigate("/preventivi/nuovo");
        break;
      case "calendar":
        navigate("/calendario");
        break;
      case "drivers":
        navigate("/autisti");
        break;
      case "reports":
        navigate("/report");
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="flex items-center justify-between">
          <div><div className="h-5 w-32 bg-[#243044] rounded mb-2" /><div className="h-3 w-48 bg-[#1a2536] rounded" /></div>
          <div className="flex gap-2"><div className="h-8 w-20 bg-[#1a2536] rounded-lg" /><div className="h-8 w-36 bg-blue-600/30 rounded-lg" /></div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
              <div className="h-2.5 w-16 bg-[#243044] rounded mb-3" />
              <div className="h-7 w-12 bg-[#243044] rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 bg-[#1a2536] rounded-2xl border border-[#243044] p-5">
            <div className="h-4 w-32 bg-[#243044] rounded mb-4" />
            {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-[#141c27] rounded-lg mb-2" />)}
          </div>
          <div className="space-y-4">
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4"><div className="h-3 w-24 bg-[#243044] rounded mb-3" /><div className="grid grid-cols-2 gap-2">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-[#141c27] rounded-lg" />)}</div></div>
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4"><div className="h-3 w-16 bg-[#243044] rounded mb-3" />{[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-[#141c27] rounded mb-2" />)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Alert organizzazione */}
      {!orgId && (
        <div className="bg-amber-500/10/5 rounded-xl border border-amber-500/15 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <FiAlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-amber-300">Nessuna organizzazione selezionata</div>
            </div>
            <button onClick={() => navigate("/settings")} className="text-[10px] text-amber-400/60 hover:text-amber-300 transition">
              Impostazioni →
            </button>
          </div>
        </div>
      )}

      {/* Onboarding Wizard */}
      {orgId && stats.total === 0 && stats.clients === 0 && (
        <OnboardingWizard stats={stats} />
      )}

      {/* ── Header compatto ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Dashboard</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
            {orgName ? ` · ${orgName}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition disabled:opacity-50"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 inline mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "..." : "Aggiorna"}
          </button>
          <button
            onClick={() => navigate("/report")}
            className="h-8 px-3.5 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition"
          >
            Report
          </button>
          <button
            onClick={() => navigate("/trasporti/new")}
            className="h-8 px-4 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-600/20"
          >
            <FiPlus className="w-3.5 h-3.5 inline mr-1" />
            Nuovo Trasporto
          </button>
        </div>
      </div>

      {/* ── KPI 4 colonne ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard title="Trasporti" value={stats.total} icon={FiTruck} color="blue" delta={null} />
        <KPICard title="Da fare" value={stats.daFare + stats.inAttesa} icon={FiClock} color="amber" delta={null} />
        <KPICard title="In corso" value={stats.inCorso} icon={FiActivity} color="blue" delta={null} />
        <KPICard title="Completati" value={stats.completati} icon={FiCheckCircle} color="green"
          delta={stats.total > 0 ? Math.round((stats.completati / stats.total) * 100) : 0} />
      </div>

      {/* ── Griglia principale: 2/3 trasporti + 1/3 colonna destra ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ═══ Colonna sinistra: Trasporti + Posizione ═══ */}
        <div className="lg:col-span-2 space-y-5">

          {/* Trasporti Recenti — lista inline come Design L */}
          <div className="bg-[#1a2536] rounded-2xl border border-[#243044] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#243044]">
              <h2 className="text-sm font-semibold text-slate-200">Trasporti Recenti</h2>
              <button
                onClick={() => navigate("/trasporti")}
                className="text-xs text-blue-400 font-medium hover:text-blue-300 transition no-underline"
              >
                Vedi tutti →
              </button>
            </div>

            {recentTransports.length > 0 ? (
              <div className="divide-y divide-[#243044]/50">
                {recentTransports.map((transport) => {
                  const st = transport.stato || transport.status || '';
                  const borderMap = {
                    'new': 'border-l-amber-500', 'da fare': 'border-l-amber-500',
                    'assigned': 'border-l-slate-500', 'in attesa': 'border-l-slate-500',
                    'enroute': 'border-l-blue-500', 'in corso': 'border-l-blue-500',
                    'done': 'border-l-emerald-500', 'completato': 'border-l-emerald-500',
                  };
                  const bl = borderMap[st] || 'border-l-slate-600';
                  return (
                    <div
                      key={transport.id}
                      className={`flex items-center gap-3 px-5 py-3.5 hover:bg-[#141c27] transition cursor-pointer border-l-[3px] ${bl}`}
                      onClick={() => handleViewTransport(transport)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-200 truncate">
                          {transport.cliente || transport.titolo || "Trasporto"}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate">
                          {transport.indirizzo_partenza || transport.pickup_address || "Nessun indirizzo"}
                        </div>
                      </div>
                      <StatusBadge status={st} size="sm" />
                      <span className="text-xs text-slate-500 w-16 text-right shrink-0">
                        {transport.created_at ? new Date(transport.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <FiTruck className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 text-sm mb-3">Nessun trasporto recente</p>
                <button
                  onClick={() => navigate("/trasporti/new")}
                  className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
                >
                  <FiPlus className="w-3.5 h-3.5 inline mr-1" />
                  Crea il primo trasporto
                </button>
              </div>
            )}
          </div>

          {/* Posizione Cliente */}
          <div className="bg-[#1a2536] rounded-2xl border border-[#243044] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#243044]">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-slate-200">Posizione Cliente</h2>
                {assistLoading && <span className="text-[10px] text-blue-400">Aggiornamento…</span>}
              </div>
              <button
                onClick={createAssistance}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition no-underline"
              >
                <FiLink2 className="w-3 h-3" />
                Richiedi
              </button>
            </div>

            <div className="p-5 space-y-4">
              {assistLink && (
                <div className="bg-blue-500/10/5 border border-blue-500/15 rounded-xl p-4 space-y-3">
                  <div className="text-xs text-blue-300">Invia questo link al cliente (SMS/WhatsApp):</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-[10px] bg-[#141c27] border border-[#243044] rounded px-2 py-1 break-all flex-1 min-w-0 text-slate-300">
                      {assistLink}
                    </code>
                    {(() => {
                      const current = assistList[0];
                      if (!current || current.status !== "located") return null;
                      return (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-1">
                          Posizione ricevuta{current.lat !== null ? ` (${current.lat.toFixed(5)}, ${current.lng.toFixed(5)})` : ''}
                        </span>
                      );
                    })()}
                    <button onClick={copyAssistLink} className="text-[10px] font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-1 hover:bg-blue-500/10/15 transition">
                      <FiCopy className="w-3 h-3 inline mr-1" />Copia
                    </button>
                    <button onClick={openAssistLinkExternal} className="text-[10px] font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-1 hover:bg-blue-500/10/15 transition">
                      <FiExternalLink className="w-3 h-3 inline mr-1" />Apri
                    </button>
                    <button onClick={handleDownloadAssistQR} disabled={!assistLink} className="text-[10px] font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-1 hover:bg-blue-500/10/15 transition disabled:opacity-50">
                      QR
                    </button>
                  </div>
                  {assistQR && (
                    <div className="flex items-center gap-3 mt-2">
                      <img src={assistQR} alt="QR" className="w-24 h-24 border border-[#243044] rounded-lg bg-[#1a2536]" />
                      <div className="text-[10px] text-slate-500 max-w-xs">Scansiona il QR code per aprire il link da un altro dispositivo.</div>
                    </div>
                  )}
                </div>
              )}

              {assistError && (
                <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  {assistError}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] text-slate-600 border-b border-[#243044]">
                      <th className="py-2.5 px-2 text-left font-medium">Creato</th>
                      <th className="py-2.5 px-2 text-left font-medium">Token</th>
                      <th className="py-2.5 px-2 text-center font-medium">Stato</th>
                      <th className="py-2.5 px-2 text-left font-medium">Posizione</th>
                      <th className="py-2.5 px-2 text-right font-medium">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assistLoading && assistList.length === 0 && (
                      <tr><td colSpan={5} className="py-6 text-center text-slate-500">
                        <FiRefreshCw className="w-4 h-4 mx-auto mb-2 animate-spin" />Caricamento…
                      </td></tr>
                    )}
                    {assistList.map((assist) => (
                      <tr key={assist.id || assist.token} className="border-b border-[#243044]/50 hover:bg-[#141c27]">
                        <td className="py-2.5 px-2 text-slate-400">{assist.created_at ? new Date(assist.created_at).toLocaleString() : '—'}</td>
                        <td className="py-2.5 px-2 font-mono text-slate-500">{assist.token}</td>
                        <td className="py-2.5 px-2 text-center">
                          <StatusBadge status={(() => { if (assist.status === 'located') return 'completato'; if (assist.status === 'closed') return 'in attesa'; return 'da fare'; })()} size="sm" />
                        </td>
                        <td className="py-2.5 px-2 text-slate-400">{assist.lat === null ? '—' : `${assist.lat.toFixed(5)}, ${assist.lng?.toFixed(5)}`}</td>
                        <td className="py-2.5 px-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => openAssist(assist)} className="px-2 py-1 text-[10px] text-slate-400 bg-white/10 border border-[#243044] rounded hover:bg-[#1a2536] transition">Dettagli</button>
                            <button onClick={() => deleteAssistance(assist)} className="px-1.5 py-1 text-red-400 bg-red-500/10 border border-red-500/20 rounded hover:bg-red-500/10/15 transition" title="Elimina">
                              <FiTrash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {assistList.length === 0 && !assistLoading && (
                      <tr><td colSpan={5} className="py-8 text-center text-slate-600">
                        <FiMapPin className="w-6 h-6 mx-auto mb-2 opacity-50" />
                        <p>Nessuna richiesta</p>
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Colonna destra: Alert + Azioni 2x2 + Flotta + Note ═══ */}
        <div className="space-y-4">

          {/* Alert */}
          {(stats.inAttesa > 0) && (
            <div className="bg-amber-500/10/5 rounded-xl border border-amber-500/15 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <FiAlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-medium text-amber-300">{stats.inAttesa} trasporti in attesa</div>
                </div>
                <button onClick={() => navigate("/trasporti")} className="text-[10px] text-amber-400/60 hover:text-amber-300 transition no-underline">
                  Verifica →
                </button>
              </div>
            </div>
          )}

          {/* Azioni Rapide 2x2 */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Azioni Rapide</h2>
            <div className="grid grid-cols-2 gap-2">
              <QuickAction icon={FiPlus} label="Trasporto" onClick={() => handleQuickAction("new-transport")} color="blue" />
              <QuickAction icon={FiUsers} label="Cliente" onClick={() => handleQuickAction("new-client")} color="green" />
              <QuickAction icon={FiFileText} label="Preventivo" onClick={() => handleQuickAction("new-quote")} color="amber" />
              <QuickAction icon={FiMapPin} label="Posizione" onClick={createAssistance} color="amber" />
            </div>
          </div>

          {/* Flotta */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Flotta</h2>
              <span className="text-[10px] text-emerald-400">{availableDrivers} online</span>
            </div>
            {drivers.length > 0 ? (
              <div className="space-y-2.5">
                {drivers.slice(0, 4).map((driver) => (
                  <DriverStatus key={driver.id} driver={driver} />
                ))}
                {drivers.length > 4 && (
                  <button onClick={() => navigate("/autisti")} className="w-full text-[10px] text-blue-400 hover:text-blue-300 transition mt-1 no-underline">
                    Vedi tutti ({drivers.length}) →
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <FiUsers className="w-5 h-5 text-slate-600 mx-auto mb-2" />
                <p className="text-[10px] text-slate-500">Nessun autista</p>
                <button onClick={() => navigate("/autisti/new")} className="text-[10px] text-blue-400 hover:text-blue-300 transition mt-1 no-underline">
                  Aggiungi →
                </button>
              </div>
            )}
          </div>

          {/* Note Rapide */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Note Rapide</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Promemoria..."
              rows={3}
              className="w-full px-3 py-2 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-300 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/30 resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-slate-600">{notes.length} car.</span>
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/10/15 transition disabled:opacity-50"
              >
                {savingNotes ? <FiRefreshCw className="w-3 h-3 animate-spin" /> : <FiCheckCircle className="w-3 h-3" />}
                {savingNotes ? "..." : "Salva"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Posizione Cliente */}
      {assistOpen && assistDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAssistOpen(false)} aria-label="Chiudi" />
          <div className="relative w-full max-w-md bg-[#1a2536] rounded-xl shadow-2xl border border-[#243044]">
            <div className="flex items-center justify-between p-4 border-b border-[#243044]">
              <div className="flex items-center gap-2">
                <FiMapPin className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-slate-200">Posizione Cliente</span>
                <span className="px-2 py-0.5 text-[10px] font-mono text-slate-500 bg-[#141c27] border border-[#243044] rounded">{assistDetail.token}</span>
              </div>
              <button onClick={() => setAssistOpen(false)} className="p-1 text-slate-500 hover:text-slate-300 transition">
                <FiX className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-2.5 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Creato:</span><span className="text-slate-300">{assistDetail.created_at ? new Date(assistDetail.created_at).toLocaleString() : "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Stato:</span><StatusBadge status={assistDetail.status} size="sm" /></div>
              <div className="flex justify-between"><span className="text-slate-500">Coordinate:</span><span className="text-slate-300">{assistDetail.lat === null ? "—" : `${assistDetail.lat}, ${assistDetail.lng}`}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Precisione:</span><span className="text-slate-300">{assistDetail.accuracy === null ? "—" : `${Math.round(assistDetail.accuracy)} m`}</span></div>
            </div>
            <div className="p-4 border-t border-[#243044] flex items-center justify-between">
              <div className="text-[10px] text-slate-600">
                {assistDetail.lat === null ? "Nessuna posizione" : `${assistDetail.lat.toFixed(5)}, ${assistDetail.lng?.toFixed(5)}`}
              </div>
              <div className="flex gap-1.5">
                {assistDetail.lat !== null && (
                  <a href={`https://www.google.com/maps?q=${assistDetail.lat},${assistDetail.lng}`} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-1 hover:bg-blue-500/10/15 transition no-underline">
                    <FiExternalLink className="w-3 h-3 inline mr-1" />Maps
                  </a>
                )}
                <button onClick={() => { const link = assistDetail.url || buildLocateLink(assistDetail.token); if (link) navigator.clipboard.writeText(link); }}
                  className="text-[10px] font-medium text-slate-400 bg-white/10 border border-[#243044] rounded px-2 py-1 hover:bg-[#1a2536] transition">
                  <FiCopy className="w-3 h-3 inline mr-1" />Copia
                </button>
                <button onClick={() => deleteAssistance(assistDetail)}
                  className="text-[10px] font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1 hover:bg-red-500/10/15 transition">
                  <FiTrash2 className="w-3 h-3 inline mr-1" />Elimina
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}