// src/pages/DashboardSplit.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiTruck, FiCheckCircle, FiClock, FiDollarSign, FiPlus, FiUsers } from "react-icons/fi";
import { supabaseBrowser } from "../lib/supabase-browser";
import { useOrg } from "../context/OrgContext";
import { useSubscription } from "../hooks/useSubscription";
import "../styles/split-design.css";

export default function DashboardSplit() {
  const navigate = useNavigate();
  const supabase = supabaseBrowser();
  const { orgId, orgName } = useOrg();
  const { activeModules, plan } = useSubscription();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    inCorso: 0,
    completati: 0,
    fatturato: 0
  });

  useEffect(() => {
    loadStats();
  }, [orgId]);

  const loadStats = async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Carica statistiche trasporti
      const { data: transports } = await supabase
        .from("transports")
        .select("status, prezzo")
        .eq("org_id", orgId);

      if (transports) {
        const total = transports.length;
        const inCorso = transports.filter(t => t.status === "in_corso").length;
        const completati = transports.filter(t => t.status === "completato").length;
        const fatturato = transports
          .filter(t => t.status === "completato")
          .reduce((sum, t) => sum + (parseFloat(t.prezzo) || 0), 0);

        setStats({ total, inCorso, completati, fatturato });
      }
    } catch (error) {
      console.error("Errore caricamento stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: "var(--text-right-muted)" }}>Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Subscription Card */}
      <div className="card-split">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="section-title">Abbonamento</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--neutral-900)" }}>
                Piano {plan || "Professional"}
              </h2>
              <span className="badge-split active">Attivo</span>
            </div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-right-muted)" }}>
              Rinnovo: 26 aprile 2026
            </p>
          </div>
          <a 
            href="#" 
            style={{ 
              fontSize: "0.875rem", 
              color: "var(--brand-primary)", 
              fontWeight: 700,
              textDecoration: "none"
            }}
          >
            Gestisci →
          </a>
        </div>

        {/* Moduli Attivi */}
        {activeModules && activeModules.length > 0 && (
          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-right)" }}>
            <div className="section-title">Moduli Attivi</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {activeModules.map((mod) => (
                <span key={mod} className="badge-split module">
                  {mod.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Trasporti Totali</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-trend">↑ 12% vs mese scorso</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">In Corso</div>
          <div className="stat-value">{stats.inCorso}</div>
          <div className="stat-trend">↑ 3 oggi</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Completati</div>
          <div className="stat-value">{stats.completati}</div>
          <div className="stat-trend">↑ 95% successo</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Fatturato</div>
          <div className="stat-value">€{(stats.fatturato / 1000).toFixed(1)}k</div>
          <div className="stat-trend">↑ 18% vs mese scorso</div>
        </div>
      </div>

      {/* Azioni Rapide */}
      <div className="section-title">Azioni Rapide</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <button
          onClick={() => navigate("/trasporti/nuovo")}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "1rem",
            border: "1px solid var(--border-right)",
            background: "var(--bg-right)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            textAlign: "left"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--brand-primary)";
            e.currentTarget.style.transform = "translateX(4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-right)";
            e.currentTarget.style.transform = "translateX(0)";
          }}
        >
          <div style={{
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--neutral-100)",
            border: "1px solid var(--border-right)",
            marginRight: "0.75rem"
          }}>
            <FiPlus style={{ width: "18px", height: "18px", color: "var(--neutral-600)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--neutral-900)", marginBottom: "0.125rem" }}>
              Nuovo Trasporto
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-right-muted)" }}>
              Crea un nuovo intervento
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate("/clienti/nuovo")}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "1rem",
            border: "1px solid var(--border-right)",
            background: "var(--bg-right)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            textAlign: "left"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--brand-primary)";
            e.currentTarget.style.transform = "translateX(4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-right)";
            e.currentTarget.style.transform = "translateX(0)";
          }}
        >
          <div style={{
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--neutral-100)",
            border: "1px solid var(--border-right)",
            marginRight: "0.75rem"
          }}>
            <FiUsers style={{ width: "18px", height: "18px", color: "var(--neutral-600)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--neutral-900)", marginBottom: "0.125rem" }}>
              Nuovo Cliente
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-right-muted)" }}>
              Aggiungi all'anagrafica
            </div>
          </div>
        </button>
      </div>

      {/* Info */}
      <div className="card-split">
        <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--neutral-900)", marginBottom: "0.5rem" }}>
          🎨 Design Split Implementato
        </h3>
        <p style={{ fontSize: "0.875rem", color: "var(--text-right-muted)", lineHeight: 1.5 }}>
          Questo è un esempio di dashboard con il nuovo design split (sidebar scura + content chiaro/scuro).
          Prova a cliccare il bottone "Dark Mode" nella sidebar per vedere il tema scuro!
        </p>
      </div>
    </div>
  );
}
