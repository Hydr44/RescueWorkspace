/**
 * Dashboard Autodemolitori - Command Center
 * Dashboard specifica per il settore autodemolizioni
 * Focus: VFU Pipeline, RENTRI Compliance, Ricambi, Attività
 * 
 * @author Cascade AI
 * @created 2026-03-29
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import { useOrg } from "../context/OrgContext";
import { useDashboardData } from "../hooks/useDashboardData";
import { createAssistRequest } from "../lib/assist";

// Componenti Dashboard
import AlertBar from "../components/dashboard/AlertBar";
import VFUPipelineWidget from "../components/dashboard/VFUPipelineWidget";
import RENTRIComplianceWidget from "../components/dashboard/RENTRIComplianceWidget";
import SparePartsWidget from "../components/dashboard/SparePartsWidget";
import QuickActionsGrid from "../components/dashboard/QuickActionsGrid";
import ActivityFeed from "../components/dashboard/ActivityFeed";

export default function DashboardNew() {
  const navigate = useNavigate();
  const { orgId, orgName } = useOrg();
  const { data, loading, refresh } = useDashboardData(orgId);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleLocateClient = async () => {
    if (!orgId) {
      alert("Seleziona prima un'organizzazione");
      return;
    }

    try {
      await createAssistRequest({ phone: "", note: "", orgId });
      await refresh();
    } catch (error) {
      console.error("Error creating assistance:", error);
      alert("Errore nella creazione della richiesta di posizione");
    }
  };

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-5 w-32 bg-[#243044] mb-2" />
            <div className="h-3 w-48 bg-[#1a2536]" />
          </div>
          <div className="h-8 w-36 bg-blue-600/30" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#1a2536] border border-[#243044] p-6 h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Alert organizzazione */}
      {!orgId && (
        <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <FiAlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-amber-300">Nessuna organizzazione selezionata</div>
            </div>
            <button onClick={() => navigate("/settings")} className="text-xs text-amber-400 hover:text-amber-300 transition">
              Impostazioni →
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Dashboard Autodemolitori</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
            {orgName ? ` · ${orgName}` : ''}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] hover:bg-[#1e2b3d] transition disabled:opacity-50"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 inline mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "..." : "Aggiorna"}
        </button>
      </div>

      {/* Alert Bar - Critici */}
      {orgId && <AlertBar alerts={data.alerts} />}

      {/* Layout principale: 3 colonne */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Colonna 1: VFU Pipeline (2 colonne) */}
        <div className="lg:col-span-2">
          <VFUPipelineWidget pipeline={data.vfuPipeline} />
        </div>

        {/* Colonna 2: RENTRI Compliance */}
        <div>
          <RENTRIComplianceWidget compliance={data.rentriCompliance} />
        </div>
      </div>

      {/* Seconda riga: Ricambi + Azioni + Attività */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Ricambi */}
        <div>
          <SparePartsWidget spareParts={data.spareParts} />
        </div>

        {/* Azioni Rapide */}
        <div>
          <QuickActionsGrid onLocateClient={handleLocateClient} />
        </div>

        {/* Attività Recenti */}
        <div>
          <ActivityFeed activities={data.recentActivity} />
        </div>
      </div>

      {/* Info Footer */}
      <div className="text-center py-4 border-t border-[#243044]">
        <p className="text-xs text-slate-600">
          Dashboard specifica per autodemolitori · VFU Pipeline · RENTRI Compliance · Ricambi
        </p>
      </div>
    </div>
  );
}
