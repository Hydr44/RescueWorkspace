import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import logoUrl from "@/logos/logo-principale-a-colori.svg";
import ricambiSidebarIcon from "@/assets/icons/icons8/icons8-auto-50.png";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { signOutAndGo } from "@/lib/auth";
import { useOrg } from "@/context/OrgContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useDemo } from "@/hooks/useDemo";
import Toast from "./Toast";
import { useToastContext } from "@/context/ToastContext";
import { OAuthService } from "@/lib/oauth";
import "@/styles/header-fix.css";
import "@/styles/split-design.css";
import AiAssistantPanel from "./AiAssistantPanel";
import NotificationDropdown from "./NotificationDropdown";
import { useOnboarding } from "@/hooks/useOnboarding";

import {
  FiHome, FiTruck, FiCalendar,
  FiUser, FiLayers, FiMapPin, FiUsers,
  FiBarChart2, FiFileText, FiSettings,
  FiLogOut, FiShield,
  FiSearch, FiChevronRight, FiX, FiCommand, FiTrash2,
  FiNavigation, FiMenu, FiTerminal
} from "react-icons/fi";
import { MdRecycling } from "react-icons/md";
import PropTypes from "prop-types";

function RVFUSidebarIcon({ className }) {
  return <MdRecycling className={className} />;
}

function RicambiSidebarIcon({ className }) {
  return (
    <span
      className={`${className} inline-flex items-center justify-center rounded-md bg-white/10 border border-white/15 p-0.5`}
    >
      <img
        src={ricambiSidebarIcon}
        alt=""
        className="w-full h-full object-contain invert brightness-200 contrast-200 drop-shadow-[0_0_2px_rgba(0,0,0,0.65)]"
      />
    </span>
  );
}

function readStoredUser() {
  try {
    // Prima controlla OAuth
    const tokens = localStorage.getItem("rm-oauth-tokens");
    if (tokens) {
      const parsed = JSON.parse(tokens);
      if (parsed?.user) {
        return parsed.user;
      }
    }
    
    // Fallback a Supabase
    const raw = localStorage.getItem("rm-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const s = parsed?.currentSession ?? parsed ?? null;
    return s?.user ?? null;
  } catch {
    return null;
  }
}

export default function Shell({ children }) {
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState(() => readStoredUser());
  const navigate = useNavigate();
  const location = useLocation();
  const { isComplete, loading: onboardingLoading } = useOnboarding();

  const [appearance, setAppearance] = useState(() => {
    try {
      const stored = localStorage.getItem("rm-appearance");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Redirect to setup if not complete — solo su pagine non escluse
  useEffect(() => {
    if (onboardingLoading) return;
    if (isComplete) return;

    // Fallback: controlla direttamente localStorage per evitare race condition
    // (Shell e SetupWizard hanno istanze separate di useOnboarding, lo stato
    //  React di Shell potrebbe non aver ricevuto ancora l'aggiornamento)
    try {
      const stored = localStorage.getItem("rm-onboarding-progress");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.checks?.skipped) return; // Già skippato, non redirectare
      }
    } catch { /* ignore */ }

    const path = location.pathname;
    const excluded = ['/setup', '/login', '/auth-callback', '/settings', '/diagnostica'];
    if (excluded.some(p => path.startsWith(p))) return;

    console.log('[Shell] Setup not complete, redirecting to /setup');
    navigate('/setup', { replace: true });
  }, [isComplete, onboardingLoading, location.pathname, navigate]);
  const [globalSearch, setGlobalSearch] = useState("");
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [counts, setCounts] = useState({
    clients: 0,
    transports: 0,
    quotes: 0
  });
  const [appVersion, setAppVersion] = useState('2.4.1');
  const [orgPiva, setOrgPiva] = useState('');
  const [syncStatus, setSyncStatus] = useState('checking');
  const { toast, hideToast } = useToastContext();

  const { orgName, orgId, isAdmin } = useOrg();
  const { activeModules, plan, statusInfo, daysLeft } = useSubscription();
  const { isDemo } = useDemo();
  const supabase = supabaseBrowser();

  // Carica versione app, P.IVA org e Sync status
  useEffect(() => {
    // Versione app da package.json (fallback a 2.4.1)
    try {
      const version = window.__APP_VERSION__ || '2.4.1';
      console.log('[Shell] App version:', version);
      setAppVersion(version);
    } catch (e) {
      console.error('[Shell] Error getting app version:', e);
      setAppVersion('2.4.1');
    }

    // P.IVA org da Supabase
    if (orgId) {
      supabase
        .from('org_settings')
        .select('value')
        .eq('org_id', orgId)
        .eq('key', 'company')
        .maybeSingle()
        .then(({ data, error }) => {
          if (data?.value?.vat) {
            console.log('[Shell] Setting P.IVA:', data.value.vat);
            setOrgPiva(data.value.vat);
          }
        })
        .catch((err) => {
          console.error('[Shell] Error fetching P.IVA:', err);
        });
    }

    // Sync status check
    const checkSync = async () => {
      try {
        const session = await supabase.auth.getSession();
        const status = session?.data?.session ? 'ok' : 'offline';
        console.log('[Shell] Sync status:', status);
        setSyncStatus(status);
      } catch (e) {
        console.error('[Shell] Error checking sync:', e);
        setSyncStatus('error');
      }
    };
    checkSync();
    const syncInterval = setInterval(checkSync, 30000); // Check ogni 30s
    return () => clearInterval(syncInterval);
  }, [orgId, supabase]);

  // Deriva modalità sidebar e densità interfaccia dalle impostazioni Appearance
  const sidebarMode = appearance.sidebar === "collapsed" ? "collapsed" : "expanded";
  const density = appearance.density === "compact" ? "compact" : "comfortable";

  // Toggle sidebar collapse
  const toggleSidebar = () => {
    const newAppearance = {
      ...appearance,
      sidebar: sidebarMode === "collapsed" ? "expanded" : "collapsed"
    };
    setAppearance(newAppearance);
    localStorage.setItem("rm-appearance", JSON.stringify(newAppearance));
    window.dispatchEvent(new CustomEvent("rm-appearance-change", { detail: newAppearance }));
  };

  // Genera breadcrumb basato sulla route corrente
  const generateBreadcrumb = (pathname) => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumb = [{ label: 'Dashboard', path: '/', icon: FiHome }];
    
    // Rileva UUID (standard format)
    const isUUID = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
    
    // Label leggibili per contesto (quando il segmento precedente è X, il UUID diventa Y)
    const detailLabelMap = {
      'clienti': 'Dettaglio',
      'trasporti': 'Dettaglio',
      'demolizioni': 'Dettaglio',
      'demolizioni-rvfu': 'Dettaglio',
      'mezzi': 'Dettaglio',
      'piazzale': 'Dettaglio',
      'autisti': 'Dettaglio',
      'ricambi': 'Dettaglio',
      'preventivi': 'Dettaglio',
      'fatture': 'Dettaglio',
      'utenti': 'Dettaglio',
      'registri': 'Dettaglio',
      'movimenti': 'Dettaglio',
      'formulari': 'Dettaglio',
      'xfir': 'Dettaglio',
      'certificati': 'Dettaglio',
    };

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Mappa segmenti a label leggibili
      const labelMap = {
        'clienti': 'Clienti',
        'trasporti': 'Trasporti',
        'demolizioni': 'Demolizioni',
        'demolizioni-rvfu': 'Demolizioni RVFU',
        'calendario': 'Calendario',
        'mezzi': 'Mezzi',
        'piazzale': 'Piazzale',
        'autisti': 'Autisti',
        'ricambi': 'Ricambi',
        'report': 'Report',
        'preventivi': 'Preventivi',
        'fatture': 'Fatture',
        'utenti': 'Utenti',
        'settings': 'Impostazioni',
        'nuovo': 'Nuovo',
        'new': 'Nuovo',
        'modifica': 'Modifica',
        'rifiuti': 'Rifiuti',
        'registri': 'Registri',
        'movimenti': 'Movimenti',
        'formulari': 'Formulari',
        'xfir': 'xFIR',
        'certificati': 'Certificati',
        'setup': 'Configurazione',
        'mud': 'MUD',
        'trasmissioni': 'Trasmissioni',
        'vendite': 'Vendite',
        'ordini': 'Ordini',
        'dashboard': 'Dashboard',
        'pagamenti': 'Pagamenti',
      };
      
      // Se è un UUID, usa label contestuale basata sul segmento precedente
      if (isUUID(segment)) {
        const prevSegment = index > 0 ? segments[index - 1] : '';
        const label = detailLabelMap[prevSegment] || 'Dettaglio';
        breadcrumb.push({ label, path: currentPath });
      } else {
        const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
        breadcrumb.push({ label, path: currentPath });
      }
    });
    
    return breadcrumb;
  };

  const breadcrumb = generateBreadcrumb(location.pathname);

  // Funzione di ricerca globale
  const performGlobalSearch = async (query) => {
    if (!query.trim() || !orgId) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchTerm = query.trim().toLowerCase();
      
      // Ricerca in parallelo su tutte le tabelle
      const [clientsResult, transportsResult, quotesResult] = await Promise.all([
        supabase
          .from("clients")
          .select("id, nome, codice, phone, email")
          .eq("org_id", orgId)
          .or(`nome.ilike.%${searchTerm}%,codice.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
          .limit(5),
        
        supabase
          .from("transports")
          .select("id, customer_name, pickup_address, dropoff_address, client:clients(nome)")
          .eq("org_id", orgId)
          .or(`customer_name.ilike.%${searchTerm}%,pickup_address.ilike.%${searchTerm}%,dropoff_address.ilike.%${searchTerm}%`)
          .limit(5),
        
        supabase
          .from("quotes")
          .select("id, cliente, descrizione")
          .eq("org_id", orgId)
          .or(`cliente.ilike.%${searchTerm}%,descrizione.ilike.%${searchTerm}%`)
          .limit(5)
      ]);

      const results = [];
      
      // Processa risultati clienti
      if (clientsResult.data) {
        clientsResult.data.forEach(client => {
          results.push({
            id: client.id,
            type: 'client',
            title: client.nome,
            subtitle: client.codice || client.email || client.phone,
            url: `/clienti/nuovo?id=${client.id}`,
            icon: FiUser
          });
        });
      }
      
      // Processa risultati trasporti
      if (transportsResult.data) {
        transportsResult.data.forEach(transport => {
          const title = transport.client?.nome || transport.customer_name || "Trasporto";
          const subtitleParts = [transport.pickup_address, transport.dropoff_address].filter(Boolean);
          const subtitle = subtitleParts.length ? subtitleParts.join(" → ") : "Dettagli indirizzi non disponibili";
          results.push({
            id: transport.id,
            type: 'transport',
            title,
            subtitle,
            url: `/trasporti/${transport.id}`,
            icon: FiTruck
          });
        });
      }
      
      // Processa risultati preventivi
      if (quotesResult.data) {
        quotesResult.data.forEach(quote => {
          results.push({
            id: quote.id,
            type: 'quote',
            title: quote.cliente,
            subtitle: quote.descrizione,
            url: `/preventivi/nuovo?id=${quote.id}`,
            icon: FiFileText
          });
        });
      }
      
      setSearchResults(results.slice(0, 10)); // Limita a 10 risultati
    } catch (error) {
      console.error("Error performing global search:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Carica contatori per indicatori di stato
  useEffect(() => {
    if (!orgId) return;
    
    const loadCounts = async () => {
      try {
        const [clientsResult, transportsResult, quotesResult] = await Promise.all([
          supabase.from("clients").select("id", { count: "exact", head: true }).eq("org_id", orgId),
          supabase.from("transports").select("id", { count: "exact", head: true }).eq("org_id", orgId),
          supabase.from("quotes").select("id", { count: "exact", head: true }).eq("org_id", orgId)
        ]);
        
        setCounts({
          clients: clientsResult.count || 0,
          transports: transportsResult.count || 0,
          quotes: quotesResult.count || 0,
        });
      } catch (error) {
        console.error("Error loading counts:", error);
      }
    };
    
    loadCounts();
  }, [orgId, supabase]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (globalSearch.trim()) {
        performGlobalSearch(globalSearch);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [globalSearch, orgId]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      // Escape per chiudere sidebar o ricerca
      if (e.key === "Escape") {
        if (showGlobalSearch) {
          setShowGlobalSearch(false);
          setGlobalSearch("");
        } else {
          setOpen(false);
        }
      }
      
      // Cmd/Ctrl + K per aprire ricerca globale
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowGlobalSearch(true);
        // Focus sul campo di ricerca dopo il prossimo render
        setTimeout(() => {
          const searchInput = document.getElementById("global-search-input");
          if (searchInput) searchInput.focus();
        }, 0);
      }
    };
    
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showGlobalSearch]);


  // Ascolta le modifiche di Appearance (tema/densità/sidebar) provenienti dai Settings
  useEffect(() => {
    const handler = (e) => {
      if (e.detail) {
        setAppearance(e.detail);
      }
    };
    window.addEventListener("rm-appearance-change", handler);
    return () => window.removeEventListener("rm-appearance-change", handler);
  }, []);



  useEffect(() => {
    // Verifica OAuth
    if (OAuthService.isAuthenticated()) {
      const tokens = localStorage.getItem("rm-oauth-tokens");
      if (tokens) {
        try {
          const parsed = JSON.parse(tokens);
          if (parsed?.user) {
            setMe(parsed.user);
          }
        } catch {}
      }
    } else {
      // Verifica Supabase
      setMe(readStoredUser());
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setMe(session?.user ?? null);
      });
      return () => sub?.subscription?.unsubscribe?.();
    }
  }, [supabase]);

  useEffect(() => {
    try {
      if (!location.pathname.startsWith("/login")) {
        localStorage.setItem("rm-last-route", location.pathname + location.search);
      }
    } catch {}
  }, [location.pathname, location.search]);

  // Classi derivate da sidebar / densità
  const isSetupPage = location.pathname === '/setup';

  if (isSetupPage) {
    return (
      <div className="flex flex-col h-screen bg-[#0c1420]">
        <main className="flex-1 overflow-auto">{children}</main>
        <Toast
          show={toast.show}
          text={toast.text}
          type={toast.type}
          duration={toast.duration}
          onClose={hideToast}
        />
      </div>
    );
  }

  const sidebarWidthClass = sidebarMode === "collapsed" ? "w-20" : "w-[250px]";
  const contentMarginClass = sidebarMode === "collapsed" ? "md:ml-20" : "md:ml-[250px]";
  const contentPaddingClass = density === "compact" ? "p-2 md:p-3" : "p-4 md:p-6";

  return (
    <div className="h-screen w-screen bg-[#141c27] text-slate-200 flex flex-col">
     {/* Wrapper sidebar + content */}
     <div className="flex flex-1 min-h-0">
      {/* Backdrop mobile */}
      <div
        className={`fixed inset-0 z-30 bg-black/40 md:hidden transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed z-40 inset-y-0 left-0 ${sidebarWidthClass} transform transition-all duration-300 ease-out
                    border-r border-white/5 bg-[#0c1929]
                    will-change-transform
                    flex flex-col
                    ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Brand */}
        <div className="h-20 px-3 flex items-center justify-center border-b border-white/5 flex-shrink-0">
          <img src={logoUrl} alt="" className={sidebarMode === "collapsed" ? "h-12 w-auto object-contain" : "h-14 w-auto object-contain"} draggable={false} />
        </div>

        {/* Org switcher */}
        <div className="px-4 py-3 border-b border-white/5 flex-shrink-0">
          <Link
            to="/settings"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/[0.08] transition no-underline"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[9px] font-semibold flex-shrink-0">
              {(orgName || 'O').substring(0, 2).toUpperCase()}
            </div>
            {sidebarMode !== "collapsed" && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white/80 truncate">{orgName || 'Organizzazione'}</div>
                <div className="text-[10px] text-white/25">{plan?.label || "Nessun piano"}</div>
              </div>
            )}
          </Link>
        </div>

        {/* Nav - Scrollabile, occupa lo spazio rimanente */}
        <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto min-h-0">
              <Section title="Operativo" collapsed={sidebarMode === "collapsed"}>
                <SideLink to="/"            icon={FiHome}      label="Dashboard"   onClick={() => setOpen(false)} collapsed={sidebarMode === "collapsed"} />
                <SideLink to="/trasporti"   icon={FiTruck}     label="Trasporti"   onClick={() => setOpen(false)} count={counts.transports} collapsed={sidebarMode === "collapsed"} />
                <SideLink to="/tracking"    icon={FiNavigation} label="Tracking GPS" onClick={() => setOpen(false)} collapsed={sidebarMode === "collapsed"} />
                {activeModules.rvfu && (
                  <SideLink to="/demolizioni-rvfu" icon={RVFUSidebarIcon}  label="Demolizioni RVFU" onClick={() => setOpen(false)} collapsed={sidebarMode === "collapsed"} />
                )}
                {activeModules.rentri && (
                  <SideLink to="/rifiuti"     icon={FiTrash2}    label="Rifiuti RENTRI" onClick={() => setOpen(false)} collapsed={sidebarMode === "collapsed"} />
                )}
                <SideLink to="/calendario"  icon={FiCalendar}  label="Calendario"  onClick={() => setOpen(false)} collapsed={sidebarMode === "collapsed"} />
              </Section>

          <Section title="Anagrafiche" collapsed={sidebarMode === "collapsed"}>
            <SideLink to="/clienti"   icon={FiUser}    label="Clienti"  onClick={() => setOpen(false)} count={counts.clients} collapsed={sidebarMode === "collapsed"} />
            <SideLink to="/mezzi"     icon={FiLayers}  label="Mezzi"    onClick={() => setOpen(false)} collapsed={sidebarMode === "collapsed"} />
            {activeModules.piazzale && (
              <SideLink to="/piazzale"  icon={FiMapPin}  label="Piazzale" onClick={() => setOpen(false)} collapsed={sidebarMode === "collapsed"} />
            )}
            <SideLink to="/autisti"   icon={FiUsers}   label="Autisti"  onClick={() => setOpen(false)} collapsed={sidebarMode === "collapsed"} />
            {activeModules.ricambi && (
              <SideLink to="/ricambi"   icon={RicambiSidebarIcon} label="Ricambi"  onClick={() => setOpen(false)} collapsed={sidebarMode === "collapsed"} />
            )}
          </Section>

          <Section title="Vendite" collapsed={sidebarMode === "collapsed"}>
            <SideLink to="/vendite/preventivi"   icon={FiFileText}     label="Preventivi"  onClick={() => setOpen(false)} count={counts.quotes} collapsed={sidebarMode === "collapsed"} />
          </Section>

          <Section title="Analisi" collapsed={sidebarMode === "collapsed"}>
            <SideLink to="/report"     icon={FiBarChart2} label="Report"      onClick={() => setOpen(false)} collapsed={sidebarMode === "collapsed"} />
            {activeModules.sdi && (
              <SideLink to="/fatture"    icon={FiFileText}  label="Fatture"     onClick={() => setOpen(false)} collapsed={sidebarMode === "collapsed"} />
            )}
          </Section>

          {activeModules.contabilita && (
            <Section title="Contabilità" collapsed={sidebarMode === "collapsed"}>
              <SideLink to="/contabilita" icon={FiFileText} label="Dashboard Contabile" onClick={() => setOpen(false)} collapsed={sidebarMode === "collapsed"} />
              <SideLink to="/contabilita/movimenti" icon={FiFileText} label="Movimenti Contabili" onClick={() => setOpen(false)} collapsed={sidebarMode === "collapsed"} />
              <SideLink to="/contabilita/piano-conti" icon={FiFileText} label="Piano dei Conti" onClick={() => setOpen(false)} collapsed={sidebarMode === "collapsed"} />
            </Section>
          )}

          <Section title="Sistema" collapsed={sidebarMode === "collapsed"}>
            {isAdmin && (
              <>
                <SideLink to="/utenti" icon={FiUsers} label="Utenti & Ruoli" onClick={() => setOpen(false)} collapsed={sidebarMode === "collapsed"} />
                <SideLink to="/diagnostica" icon={FiTerminal}  label="Diagnostica"   onClick={() => setOpen(false)} collapsed={sidebarMode === "collapsed"} />
              </>
            )}
            <SideLink to="/settings" icon={FiSettings}  label="Impostazioni"   onClick={() => setOpen(false)} collapsed={sidebarMode === "collapsed"} />
          </Section>
        </nav>

        {/* User Card - Bottom */}
        {me && (
          <div className="flex-shrink-0 border-t border-white/5 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0 shadow-lg shadow-blue-500/20">
                {(me.user_metadata?.full_name || me.full_name || me.email || 'U').charAt(0).toUpperCase()}
              </div>
              {sidebarMode !== "collapsed" && (
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white/70 truncate">
                    {me.user_metadata?.full_name || me.full_name || me.email || 'Utente'}
                  </div>
                  <div className="text-[10px] text-white/25 truncate">
                    {me.email || ''}
                  </div>
                </div>
              )}
              <button
                onClick={() => signOutAndGo("/login?reason=logout")}
                className="w-4 h-4 text-white/15 hover:text-red-400 transition flex-shrink-0"
                title="Esci"
              >
                <FiLogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Toggle Sidebar Button - Bottom */}
        <div className="flex-shrink-0 border-t border-white/5 px-4 py-3">
          <button
            onClick={toggleSidebar}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition text-white/70 hover:text-white ${sidebarMode === "collapsed" ? "justify-center" : ""}`}
            title={sidebarMode === "collapsed" ? "Espandi sidebar" : "Comprimi sidebar"}
          >
            <FiMenu className="w-4 h-4 flex-shrink-0" />
            {sidebarMode !== "collapsed" && <span className="text-xs">Comprimi</span>}
          </button>
        </div>
      </aside>

      {/* Contenuto */}
      <div className={`flex-1 flex flex-col ${contentMarginClass} min-h-0`}>
        {/* Topbar */}
        <header className="top-bar-fixed h-12 min-h-[3rem] max-h-[3rem] flex-shrink-0 flex items-center justify-between px-6 border-b border-[#243044] bg-[#1a2536] sticky top-0 z-20">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <button
              className="md:hidden inline-flex items-center justify-center h-8 w-8 rounded-lg border border-[#243044] hover:bg-white/5 text-slate-400"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
            
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-1 text-sm" aria-label="Breadcrumb">
              {breadcrumb.map((item, index) => (
                <div key={item.path} className="flex items-center">
                  {index > 0 && (
                    <FiChevronRight className="w-3.5 h-3.5 text-slate-600 mx-1" />
                  )}
                  {index === breadcrumb.length - 1 ? (
                    <span className="font-medium text-slate-300 truncate">
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      to={item.path}
                      className="text-slate-500 hover:text-slate-300 truncate transition-colors"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Ricerca Globale */}
            <button
              onClick={() => setShowGlobalSearch(true)}
              className="flex items-center gap-2 h-8 px-3 text-xs text-slate-500 bg-[#141c27] border border-[#243044] rounded-xl hover:border-blue-500/30 transition"
            >
              <FiSearch className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerca...</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 ml-2 text-[9px] text-slate-600">
                <FiCommand className="w-2.5 h-2.5" />K
              </kbd>
            </button>

            {/* Notifiche */}
            <NotificationDropdown />
          </div>
        </header>

        {/* Banner Demo */}
        {isDemo && (
          <div className="bg-amber-500/15 border-b border-amber-500/25 px-6 py-2 flex items-center justify-center gap-3 flex-shrink-0">
            <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">Modalità Demo</span>
            <span className="text-amber-300/70 text-xs">Stai esplorando RescueManager con dati di esempio. Le funzioni di invio SDI, RENTRI e RVFU sono disabilitate.</span>
          </div>
        )}
        <main className={`${contentPaddingClass} overflow-auto flex-1`}>{children}</main>
      </div>
     </div>
     {/* end wrapper sidebar + content */}

      {/* ═══════════ STATUS BAR SaaS ═══════════ */}
      <footer className="h-8 bg-[#0c1929] border-t border-[#1a2d45] flex items-center justify-between px-5 flex-shrink-0 text-[10px] z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/10 animate-pulse" />
            <span className="text-emerald-400 font-medium">Online</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <FiShield className="w-3 h-3 text-blue-400" />
            <span className={`text-${statusInfo?.color || 'blue'}-300 font-medium`}>{plan?.label || "—"}{daysLeft != null && daysLeft <= 30 ? ` · ${daysLeft}g` : ""}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-white/20">{orgName || 'Organizzazione'}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-white/40">Sync: <span className={syncStatus === 'ok' ? 'text-emerald-400 font-semibold' : syncStatus === 'checking' ? 'text-yellow-400' : 'text-red-400'}>{syncStatus === 'ok' ? 'OK' : syncStatus === 'checking' ? '...' : 'ERR'}</span></span>
          <div className="w-px h-3 bg-white/10" />
          {orgPiva && (
            <span className="text-blue-300 font-semibold" title={`P.IVA: ${orgPiva}`}>
              P.IVA: <span className="text-blue-200 font-mono">{orgPiva}</span>
            </span>
          )}
          {orgPiva && <div className="w-px h-3 bg-white/10" />}
          {isDemo ? (
            <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded bg-amber-500/15 text-amber-400 border border-amber-500/25 leading-none animate-pulse">Demo</span>
          ) : (
            <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded bg-amber-500/15 text-amber-400 border border-amber-500/25 leading-none">Beta</span>
          )}
          <div className="w-px h-3 bg-white/10" />
          <span className="text-white/40 font-mono">v{appVersion}</span>
        </div>
      </footer>

      {/* Modal Ricerca Globale */}
      {showGlobalSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowGlobalSearch(false); setGlobalSearch(""); }}
            onKeyDown={(e) => { if (e.key === "Escape") { setShowGlobalSearch(false); setGlobalSearch(""); } }}
            role="button"
            tabIndex={0}
            aria-label="Chiudi ricerca"
          />
          
          <div className="relative w-full max-w-2xl bg-[#1a2536] rounded-xl shadow-2xl border border-[#243044]">
            <div className="flex items-center gap-3 p-4 border-b border-[#243044]">
              <FiSearch className="w-5 h-5 text-slate-500" />
              <input
                id="global-search-input"
                type="text"
                placeholder="Cerca clienti, trasporti, preventivi..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="flex-1 text-lg bg-transparent border-none outline-none text-slate-100 placeholder-slate-500"
                autoFocus
              />
              <button
                onClick={() => { setShowGlobalSearch(false); setGlobalSearch(""); }}
                className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3 text-slate-500">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span>Ricerca in corso...</span>
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="p-2">
                  {searchResults.map((result) => {
                    const Icon = result.icon;
                    return (
                      <Link
                        key={`${result.type}-${result.id}`}
                        to={result.url}
                        onClick={() => { setShowGlobalSearch(false); setGlobalSearch(""); }}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group no-underline"
                      >
                        <div className="w-8 h-8 bg-[#141c27] border border-[#243044] rounded-lg flex items-center justify-center group-hover:border-blue-500/30 transition-colors">
                          <Icon className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-200 truncate">{result.title}</div>
                          <div className="text-sm text-slate-500 truncate">{result.subtitle}</div>
                        </div>
                        <div className="text-xs text-slate-600 uppercase font-medium">
                          {(() => {
                            switch (result.type) {
                              case 'client': return 'Cliente';
                              case 'transport': return 'Trasporto';
                              case 'quote': return 'Preventivo';
                              default: return result.type;
                            }
                          })()}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : globalSearch.trim() ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center text-slate-500">
                    <FiSearch className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nessun risultato trovato</p>
                    <p className="text-sm">Prova con termini diversi</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center text-slate-500">
                    <FiSearch className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Inizia a digitare per cercare</p>
                    <p className="text-sm">Clienti, trasporti, preventivi...</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-3 border-t border-[#243044] bg-[#141c27] rounded-b-xl">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-[#1a2536] border border-[#243044] rounded text-xs">↵</kbd>
                    Seleziona
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-[#1a2536] border border-[#243044] rounded text-xs">Esc</kbd>
                    Chiudi
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <FiCommand className="w-3 h-3" />
                  <kbd className="px-1.5 py-0.5 bg-[#1a2536] border border-[#243044] rounded text-xs">K</kbd>
                  <span>per aprire</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        text={toast.text}
        type={toast.type}
        duration={toast.duration}
        onClose={hideToast}
      />
      <AiAssistantPanel />
    </div>
  );
}

function Section({ title, children, collapsed }) {
  return (
    <div>
      {!collapsed && (
        <div className="px-3 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-blue-300/30">
          {title}
        </div>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SideLink({ to, label, icon: Icon, onClick, count, collapsed }) {
  const end = to === "/";
  return (
    <NavLink to={to} end={end} onClick={onClick}>
      {({ isActive }) => (
        <div
          className={[
            "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-150",
            collapsed ? "justify-center" : "",
            isActive
              ? "font-medium bg-blue-600/20 text-white border border-blue-500/20"
              : "text-white/35 hover:text-white/80 hover:bg-white/5 border border-transparent",
          ].join(" ")}
          aria-current={isActive ? "page" : undefined}
          title={collapsed ? label : ""}
        >
          {Icon && <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : ''}`} />}
          {!collapsed && <span className="truncate flex-1">{label}</span>}
          
          {!collapsed && count !== undefined && count > 0 && (
            <span className={[
              "text-[9px] px-1.5 py-0.5 rounded-md font-medium",
              isActive 
                ? "bg-emerald-500/10 text-white" 
                : "bg-emerald-500/20 text-emerald-300"
            ].join(" ")}>
              {count > 99 ? "99+" : count}
            </span>
          )}
        </div>
      )}
    </NavLink>
  );
}

// PropTypes
Shell.propTypes = {
  children: PropTypes.node.isRequired
};

Section.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

SideLink.propTypes = {
  to: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  onClick: PropTypes.func,
  count: PropTypes.number
};