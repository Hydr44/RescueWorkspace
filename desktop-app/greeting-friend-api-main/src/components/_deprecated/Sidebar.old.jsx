// src/components/Shell.jsx
import { useEffect, useState, useMemo } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import {
  FiHome, FiTruck, FiCalendar, FiBell, FiUser, FiUsers,
  FiBox, FiMapPin, FiBarChart2, FiClipboard, FiShield, FiSettings,
  FiMenu, FiX, FiFileText
} from "react-icons/fi";

const isElectron = typeof window !== "undefined" && !!window.api;

const SECTIONS = [
  {
    label: "OPERATIVO",
    items: [
      { to: "/",           icon: FiHome,      label: "Dashboard", exact: true },
      { to: "/trasporti",  icon: FiTruck,     label: "Trasporti" },
      { to: "/demolizioni", icon: FiShield,   label: "Demolizioni" },
      { to: "/calendario", icon: FiCalendar,  label: "Calendario" },
    ],
  },
  {
    label: "ANAGRAFICHE",
    items: [
      { to: "/clienti",   icon: FiUser,     label: "Clienti" },
      { to: "/mezzi",     icon: FiBox,      label: "Mezzi" },
      { to: "/piazzale",  icon: FiMapPin,   label: "Piazzale" },
      { to: "/autisti",   icon: FiUsers,    label: "Autisti" },
    ],
  },
  {
    label: "ANALISI & FATTURAZIONE",
    items: [
      { to: "/report",      icon: FiBarChart2, label: "Report" },
      { to: "/preventivi",  icon: FiClipboard, label: "Preventivi" },
      { to: "/fatture",     icon: FiFileText,  label: "Fatture" },
    ],
  },
  {
    label: "SISTEMA",
    items: [
      { to: "/utenti",     icon: FiUsers,    label: "Utenti & Ruoli" },
      { to: "/settings",   icon: FiSettings, label: "Impostazioni" },
    ],
  },
];

function NavItem({ to, icon: Icon, label, exact, badgeCount }) {
  const location = useLocation();
  const isActive = exact ? location.pathname === to
                         : (to === "/" ? location.pathname === "/" : location.pathname.startsWith(to));
  const base =
    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const active = "bg-indigo-600 text-white shadow-sm";
  const idle   = "text-indigo-300 hover:text-white hover:bg-white/5";

  return (
    <NavLink to={to} className={`${base} ${isActive ? active : idle}`} aria-current={isActive ? "page" : undefined}>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
      {badgeCount > 0 && (
        <span className="ml-auto inline-flex items-center justify-center rounded-full bg-indigo-500/20 text-indigo-100 text-[11px] px-2 py-0.5">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      )}
    </NavLink>
  );
}

export default function Shell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [company, setCompany] = useState({ name: "RescueManager", logoUrl: null });

  // badge notifiche non lette (se IPC disponibile)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (isElectron && window.api?.notifications?.list) {
          const rows = await window.api.notifications.list();
          const unread = (rows || []).filter(r => !r.letto).length;
          if (alive) setUnreadNotif(unread);
        }
      } catch { /* ignore */ }
    })();
    return () => { alive = false; };
  }, []);

  // logo / nome azienda dal Settings (IPC o localStorage)
  useEffect(() => {
    (async () => {
      try {
        let data = {};
        if (isElectron && window.api?.settings?.getAll) {
          data = await window.api.settings.getAll();
        } else {
          data = JSON.parse(localStorage.getItem("settings") || "{}");
        }
        const c = data?.company || {};
        setCompany({
          name: c.name || "RescueManager",
          logoUrl: c.logoUrl || null,
        });
      } catch { /* ignore */ }
    })();
  }, []);

  // nav con badge risolto
  const sections = useMemo(() => {
    return SECTIONS.map(sec => ({
      ...sec,
      items: sec.items.map(it => ({
        ...it,
        _badge: it.badge === "notifications" ? unreadNotif : 0,
      })),
    }));
  }, [unreadNotif]);

  const SidebarInner = (
    <>
      <Link to="/" className="flex items-center gap-3 px-4 h-14 border-b border-white/10">
        {company.logoUrl ? (
          <img src={company.logoUrl} alt="Logo" className="h-10 w-10 rounded-md object-contain bg-white p-1" />
        ) : (
          <div className="h-10 w-10 rounded-md bg-indigo-600/20 ring-1 ring-indigo-500/30" />
        )}
        <div className="font-semibold tracking-tight">{company.name || "RescueManager"}</div>
        <div className="ml-auto text-xs text-gray-400">v0.1.0</div>
      </Link>

      <nav className="p-3 space-y-6">
        {sections.map((sec) => (
          <div key={sec.label}>
            <div className="px-2 mb-2 text-[11px] font-medium tracking-wider text-indigo-300/70">
              {sec.label}
            </div>
            <div className="space-y-1">
              {sec.items.map((it) => (
                <NavItem key={it.to} to={it.to} icon={it.icon} label={it.label} exact={it.exact} badgeCount={it._badge} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto p-3 text-[11px] text-indigo-200/70">
        © {new Date().getFullYear()} RescueManager
      </div>
    </>
  );

  return (
    <div className="h-screen w-screen bg-gray-900 text-gray-100 flex">
      {/* SIDEBAR desktop */}
      <aside className="hidden md:flex w-72 shrink-0 bg-gray-950/70 backdrop-blur border-r border-white/10 flex-col">
        {SidebarInner}
      </aside>

      {/* DRAWER mobile */}
      <div className="md:hidden">
        <header className="h-14 flex items-center gap-2 border-b border-white/10 px-3">
          <button
            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-indigo-300 hover:bg-white/5 focus:ring-2 focus:ring-indigo-500"
            onClick={() => setMobileOpen(true)}
            aria-label="Apri menu"
          >
            <FiMenu className="h-5 w-5" /> Menu
          </button>
          <div className="font-semibold">{company.name || "RescueManager"}</div>
          <div className="ml-auto text-xs text-indigo-300">{unreadNotif > 0 ? `${unreadNotif} notifiche` : ""}</div>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-72 bg-gray-950/95 backdrop-blur border-r border-white/10 flex flex-col">
              <div className="h-14 flex items-center justify-between px-3 border-b border-white/10">
                <div className="font-semibold px-1">{company.name || "RescueManager"}</div>
                <button className="btn btn-ghost px-2" onClick={() => setMobileOpen(false)} aria-label="Chiudi menu">
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              {SidebarInner}
            </div>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* top bar desktop */}
        <header className="hidden md:flex h-14 items-center border-b border-white/10 px-4">
          <div className="font-semibold">RescueManager</div>
          <div className="ml-auto text-sm text-indigo-200/80">Operatore</div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-4">{children}</div>
        </main>
      </div>
    </div>
  );
}