// src/components/ShellSplit.jsx
import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  FiHome, FiTruck, FiCalendar, FiUsers, FiFileText, 
  FiSettings, FiMapPin, FiLayers, FiMoon, FiSun, FiMenu
} from "react-icons/fi";
import { useOrg } from "@/context/OrgContext";
import "@/styles/split-design.css";
import PropTypes from "prop-types";

export default function ShellSplit({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("rm-dark-mode");
    return stored === "true";
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem("rm-sidebar-collapsed");
    return stored === "true";
  });
  
  const { orgName } = useOrg();
  const location = useLocation();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("rm-dark-mode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("rm-sidebar-collapsed", sidebarCollapsed);
  }, [sidebarCollapsed]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Determina il titolo della pagina dalla route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/" || path === "/dashboard") return "Dashboard";
    if (path.includes("/trasporti")) return "Trasporti";
    if (path.includes("/clienti")) return "Clienti";
    if (path.includes("/calendario")) return "Calendario";
    if (path.includes("/preventivi")) return "Preventivi";
    if (path.includes("/piazzale")) return "Piazzale";
    if (path.includes("/mezzi")) return "Mezzi";
    if (path.includes("/autisti")) return "Autisti";
    if (path.includes("/impostazioni")) return "Impostazioni";
    return "RescueManager";
  };

  const navSections = [
    {
      title: "Operativo",
      items: [
        { path: "/", icon: FiHome, label: "Dashboard" },
        { path: "/trasporti", icon: FiTruck, label: "Trasporti" },
        { path: "/calendario", icon: FiCalendar, label: "Calendario" },
        { path: "/piazzale", icon: FiMapPin, label: "Piazzale" },
      ]
    },
    {
      title: "Anagrafiche",
      items: [
        { path: "/clienti", icon: FiUsers, label: "Clienti" },
        { path: "/preventivi", icon: FiFileText, label: "Preventivi" },
        { path: "/mezzi", icon: FiLayers, label: "Mezzi" },
      ]
    },
    {
      title: "Impostazioni",
      items: [
        { path: "/impostazioni", icon: FiSettings, label: "Impostazioni" },
      ]
    }
  ];

  return (
    <div className="shell-container">
      {/* LEFT SIDE - Sidebar Scura */}
      <aside className={`sidebar-split ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-split-header">
          <div className="sidebar-split-logo">
            <div className="sidebar-split-logo-icon">R</div>
            <span className="sidebar-split-logo-text">RescueManager</span>
          </div>
          <button
            onClick={toggleSidebar}
            style={{
              position: "absolute",
              right: "0.5rem",
              top: "1.5rem",
              background: "transparent",
              border: "none",
              color: "var(--text-left)",
              cursor: "pointer",
              padding: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title={sidebarCollapsed ? "Espandi sidebar" : "Comprimi sidebar"}
          >
            <FiMenu size={18} />
          </button>
        </div>

        <nav className="sidebar-split-nav">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <div className="nav-section-title">{section.title}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => 
                    `nav-item-split ${isActive ? "active" : ""}`
                  }
                  end={item.path === "/"}
                  title={sidebarCollapsed ? item.label : ""}
                >
                  <item.icon />
                  <span className="nav-item-split-text">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Theme Toggle */}
        <div className="sidebar-split-footer">
          <button 
            className="theme-toggle-btn"
            onClick={toggleDarkMode}
            title={darkMode ? "Attiva modalità chiara" : "Attiva modalità scura"}
          >
            {darkMode ? <FiSun /> : <FiMoon />}
            <span className="theme-toggle-text">{darkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </div>
      </aside>

      {/* RIGHT SIDE - Content Area */}
      <main className="content-split">
        <header className="content-split-header">
          <h1 className="content-split-title">{getPageTitle()}</h1>
          <p className="content-split-subtitle">
            {orgName || "RescueManager"}
          </p>
        </header>

        <div className="content-split-body">
          {children}
        </div>
      </main>
    </div>
  );
}

ShellSplit.propTypes = {
  children: PropTypes.node.isRequired,
};
