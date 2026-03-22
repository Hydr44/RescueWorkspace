// src/pages/RifiutiXFir.jsx
/**
 * Gestione FIR Digitali (xFIR) — Design L
 * Ciclo di vita completo dei formulari digitali RENTRI
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import {
  FiSearch, FiRefreshCw, FiDownload, FiEye, FiEdit,
  FiCheckCircle, FiClock, FiXCircle, FiPenTool,
  FiTruck, FiPackage, FiChevronLeft, FiChevronRight,
  FiAlertCircle, FiFileText, FiHash,
  FiCornerDownRight, FiRotateCcw, FiShield,
  FiPlus
} from "react-icons/fi";
import {
  fetchXFirElenco, fetchXFirDettaglio, fetchXFirAzioni,
  rollbackFirma,
  downloadXFir,
  fetchBlocchiFir, vidimaFir, fetchFirVidimati,
  fetchPdfVidimazione, verificaFir,
  getStatoXFir, STATI_XFIR
} from "../lib/rentri-xfir";
import { supabaseBrowser } from "../lib/supabase-browser";

/* ─── Helpers ─── */
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDateTime = (iso) => iso ? new Date(iso).toLocaleString("it-IT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const ICON_MAP = {
  FiEdit, FiPenTool, FiTruck, FiCheckCircle, FiXCircle, FiClock, FiPackage
};

const StatoXFirBadge = ({ stato }) => {
  const info = getStatoXFir(stato);
  const colorMap = {
    amber: { bg: "bg-amber-500/10", text: "text-amber-400" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-400" },
    emerald: { bg: "bg-sky-500/10", text: "text-sky-400" },
    red: { bg: "bg-red-500/10", text: "text-red-400" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-400" },
    slate: { bg: "bg-slate-500/10", text: "text-slate-500" },
  };
  const c = colorMap[info.color] || colorMap.slate;
  const Icon = ICON_MAP[info.icon] || FiClock;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${c.bg} ${c.text}`}>
      <Icon className="w-3 h-3" />
      {info.label}
    </span>
  );
};

/* ─── Tabs ─── */
const TABS = [
  { id: "digitali", label: "FIR Digitali", icon: FiFileText },
  { id: "vidimazione", label: "Vidimazione", icon: FiShield },
  { id: "blocchi", label: "Blocchi FIR", icon: FiHash },
];

export default function RifiutiXFir() {
  const { orgId } = useOrg();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("digitali");
  // Config
  const [rentriConfig, setRentriConfig] = useState(null);

  // Read ?tab= from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['digitali', 'vidimazione', 'blocchi'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      const supabase = supabaseBrowser();
      const { data: cert } = await supabase
        .from("rentri_org_certificates")
        .select("cf_operatore, environment, num_iscr_sito")
        .eq("org_id", orgId)
        .eq("tipo_certificato", "interoperabilita")
        .eq("is_active", true)
        .eq("is_default", true)
        .maybeSingle();
      if (cert) setRentriConfig(cert);
    })();
  }, [orgId]);

  return (
    <div className="min-h-screen bg-[#141c27] p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <FiFileText className="w-5 h-5 text-blue-400" />
            FIR Digitali (xFIR)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestione completa del ciclo di vita dei formulari digitali RENTRI
          </p>
        </div>
        <div className="flex items-center gap-2">
          {rentriConfig && (
            <span className="text-[10px] px-2 py-1 rounded bg-blue-500/10 text-blue-400 font-medium">
              {rentriConfig.environment === "demo" ? "DEMO" : "PRODUZIONE"}
            </span>
          )}
          <button
            onClick={() => navigate("/rifiuti/xfir/nuovo")}
            className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5"
          >
            <FiPlus className="w-3.5 h-3.5" />
            Nuovo FIR Digitale
          </button>
          <button
            onClick={() => navigate("/rifiuti/formulari")}
            className="px-3 py-1.5 text-xs rounded-lg bg-[#1a2536] text-slate-300 hover:text-white border border-[#243044] hover:border-slate-600 transition-colors"
          >
            FIR Tradizionali
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-[#1a2536] rounded-lg p-1 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                active
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {!rentriConfig ? (
        <div className="bg-[#1a2536] rounded-xl border border-amber-500/20 p-8 text-center">
          <FiAlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-white mb-1">Configurazione RENTRI necessaria</h3>
          <p className="text-xs text-slate-400 mb-4">
            Per utilizzare i FIR digitali, configura prima il certificato RENTRI.
          </p>
          <button
            onClick={() => navigate("/rifiuti/certificati")}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Configura Certificati
          </button>
        </div>
      ) : (
        <>
          {activeTab === "digitali" && <TabFirDigitali orgId={orgId} config={rentriConfig} />}
          {activeTab === "vidimazione" && <TabVidimazione orgId={orgId} config={rentriConfig} />}
          {activeTab === "blocchi" && <TabBlocchi orgId={orgId} config={rentriConfig} />}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* TAB: FIR Digitali                                          */
/* ═══════════════════════════════════════════════════════════ */

function TabFirDigitali({ orgId, config }) {
  const [firs, setFirs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [filterStato, setFilterStato] = useState("all");
  const [page, setPage] = useState(1);
  const [paging, setPaging] = useState(null);
  const [selectedFir, setSelectedFir] = useState(null);
  const [dettaglio, setDettaglio] = useState(null);
  const [azioni, setAzioni] = useState(null);
  const [loadingDettaglio, setLoadingDettaglio] = useState(false);

  const loadFirs = useCallback(async () => {
    if (!orgId || !config) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchXFirElenco({
        orgId,
        numIscrSito: config.num_iscr_sito,
        identificativoSoggetto: !config.num_iscr_sito ? config.cf_operatore : undefined,
        environment: config.environment,
        page,
        pageSize: 25,
        stati: filterStato !== "all" ? filterStato : undefined,
      });
      setFirs(result.data || []);
      setPaging(result.paging || null);
    } catch (err) {
      console.error("[XFIR] Errore caricamento:", err);
      setError(err.message);
      setFirs([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, config, page, filterStato]);

  useEffect(() => { loadFirs(); }, [loadFirs]);

  const loadDettaglio = useCallback(async (numeroFir) => {
    setLoadingDettaglio(true);
    try {
      const [det, az] = await Promise.all([
        fetchXFirDettaglio({ orgId, numeroFir, environment: config.environment }),
        fetchXFirAzioni({ orgId, numeroFir, identificativoSoggetto: config.cf_operatore, numIscrSito: config.num_iscr_sito, environment: config.environment })
      ]);
      setDettaglio(det.data);
      setAzioni(az.data);
      setSelectedFir(numeroFir);
    } catch (err) {
      console.error("[XFIR] Errore dettaglio:", err);
      setDettaglio(null);
      setAzioni(null);
    } finally {
      setLoadingDettaglio(false);
    }
  }, [orgId, config]);

  const handleDownloadXFir = useCallback(async (numeroFir) => {
    try {
      const result = await downloadXFir({ orgId, numeroFir, environment: config.environment });
      if (result.blob) {
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `xfir-${numeroFir}.asice`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (result.data) {
        // File not ready - fetch FIR details to show accurate state
        let stato = 'sconosciuto';
        let firme = [];
        
        try {
          const dettaglio = await fetchXFirDettaglio({ orgId, numeroFir, environment: config.environment });
          if (dettaglio.data) {
            stato = dettaglio.data.stato || 'sconosciuto';
            firme = dettaglio.data.firme || [];
          }
        } catch (detErr) {
          console.warn('[XFIR] Could not fetch details:', detErr);
        }
        
        const firmeInfo = firme.length > 0 
          ? `\n\nFirme presenti: ${firme.map(f => `${f.ruolo} (${f.stato})`).join(', ')}`
          : '\n\nNessuna firma presente.';
        
        alert(
          ` File xFIR non disponibile\n\n` +
          `Il FIR "${numeroFir}" deve essere completato e firmato da tutti i soggetti prima di poter scaricare il file ASiC-E.\n\n` +
          `Stato FIR: ${stato}${firmeInfo}\n\n` +
          `Azioni necessarie:\n` +
          `1. Completa il FIR con tutti i dati richiesti\n` +
          `2. Firma il FIR come produttore/detentore\n` +
          `3. Attendi la firma del trasportatore\n` +
          `4. Attendi la firma del destinatario\n\n` +
          `Solo quando tutte le firme sono apposte, il file xFIR sarà disponibile per il download.`
        );
      }
    } catch (err) {
      alert("Errore download xFIR: " + err.message);
    }
  }, [orgId, config]);

  const handleRollback = useCallback(async (numeroFir) => {
    if (!confirm("Sei sicuro di voler annullare l'ultima firma?")) return;
    try {
      await rollbackFirma({ orgId, numeroFir, environment: config.environment });
      alert("Rollback firma completato");
      loadFirs();
      if (selectedFir === numeroFir) loadDettaglio(numeroFir);
    } catch (err) {
      alert("Errore rollback: " + err.message);
    }
  }, [orgId, config, loadFirs, loadDettaglio, selectedFir]);

  const filteredFirs = useMemo(() => {
    if (!q) return firs;
    const lq = q.toLowerCase();
    return firs.filter(f =>
      (f.numero_fir || "").toLowerCase().includes(lq) ||
      (f.codice_eer || "").toLowerCase().includes(lq) ||
      (f.produttore?.denominazione || "").toLowerCase().includes(lq) ||
      (f.destinatario?.denominazione || "").toLowerCase().includes(lq)
    );
  }, [firs, q]);


  return (
    <div className="flex gap-4">
      {/* Lista FIR */}
      <div className={`${selectedFir ? "w-1/2" : "w-full"} transition-all`}>
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
          {/* Toolbar */}
          <div className="p-3 border-b border-[#243044] flex items-center gap-2">
            <div className="relative flex-1">
              <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cerca FIR, CER, produttore..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#141c27] border border-[#243044] rounded-lg text-xs text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none"
              />
            </div>
            <select
              value={filterStato}
              onChange={(e) => { setFilterStato(e.target.value); setPage(1); }}
              className="px-2 py-1.5 bg-[#141c27] border border-[#243044] rounded-lg text-xs text-slate-300 focus:border-blue-500/50 focus:outline-none"
            >
              <option value="all">Tutti gli stati</option>
              {Object.entries(STATI_XFIR).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <button
              onClick={loadFirs}
              disabled={loading}
              className="p-1.5 rounded-lg bg-[#141c27] border border-[#243044] text-slate-400 hover:text-white hover:border-blue-500/50 transition-colors disabled:opacity-50"
              title="Aggiorna"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-3 mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
              <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#243044]">
                  <th className="px-3 py-2 text-left text-slate-500 font-medium">Numero FIR</th>
                  <th className="px-3 py-2 text-left text-slate-500 font-medium">CER</th>
                  <th className="px-3 py-2 text-left text-slate-500 font-medium">Stato</th>
                  <th className="px-3 py-2 text-left text-slate-500 font-medium">Produttore</th>
                  <th className="px-3 py-2 text-left text-slate-500 font-medium">Data</th>
                  <th className="px-3 py-2 text-right text-slate-500 font-medium">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {loading && firs.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">Caricamento...</td></tr>
                ) : filteredFirs.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                    {error ? "Errore nel caricamento" : "Nessun FIR digitale trovato. Usa la sezione Vidimazione per creare nuovi FIR."}
                  </td></tr>
                ) : (
                  filteredFirs.map((fir) => (
                    <tr
                      key={fir.numero_fir || fir.id}
                      onClick={() => loadDettaglio(fir.numero_fir)}
                      className={`border-b border-[#243044]/50 hover:bg-[#141c27] cursor-pointer transition-colors ${
                        selectedFir === fir.numero_fir ? "bg-blue-500/5 border-l-2 border-l-blue-500" : ""
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        <span className="text-white font-mono text-[11px]">{fir.numero_fir || "—"}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-slate-300">{fir.dati_partenza?.rifiuto?.codice_eer || fir.codice_eer || "—"}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatoXFirBadge stato={fir.stato} />
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-slate-400 truncate block max-w-[160px]">
                          {fir.dati_partenza?.produttore?.denominazione || (typeof fir.produttore === 'string' ? fir.produttore : fir.produttore?.denominazione) || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">
                        {fmtDate(fir.data_creazione || fir.created_at)}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); loadDettaglio(fir.numero_fir); }}
                            className="p-1 text-slate-500 hover:text-blue-400 transition-colors"
                            title="Dettaglio"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownloadXFir(fir.numero_fir); }}
                            className="p-1 text-slate-500 hover:text-sky-400 transition-colors"
                            title="Download xFIR"
                          >
                            <FiDownload className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paging */}
          {paging && paging.pageCount > 1 && (
            <div className="px-3 py-2 border-t border-[#243044] flex items-center justify-between text-xs text-slate-500">
              <span>Pagina {paging.page || page} di {paging.pageCount} ({paging.totalRecords} totali)</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="p-1 rounded hover:bg-[#141c27] disabled:opacity-30">
                  <FiChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= (paging.pageCount || 1)}
                  className="p-1 rounded hover:bg-[#141c27] disabled:opacity-30">
                  <FiChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pannello Dettaglio */}
      {selectedFir && (
        <div className="w-1/2">
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden sticky top-4">
            {/* Header dettaglio */}
            <div className="p-3 border-b border-[#243044] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <FiFileText className="w-4 h-4 text-blue-400" />
                  FIR {selectedFir}
                </h3>
                {dettaglio && <StatoXFirBadge stato={dettaglio.stato} />}
              </div>
              <button onClick={() => { setSelectedFir(null); setDettaglio(null); setAzioni(null); }}
                className="p-1 text-slate-500 hover:text-white transition-colors">
                <FiXCircle className="w-4 h-4" />
              </button>
            </div>

            {loadingDettaglio ? (
              <div className="p-8 text-center text-slate-500 text-xs">Caricamento dettaglio...</div>
            ) : dettaglio ? (
              <div className="p-3 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Dati Partenza */}
                {dettaglio.dati_partenza && (
                  <DetailSection title="Dati Partenza" icon={FiPackage}>
                    {dettaglio.dati_partenza.produttore && (
                      <DetailRow label="Produttore" value={dettaglio.dati_partenza.produttore.denominazione || dettaglio.dati_partenza.produttore.num_iscr_sito} />
                    )}
                    {dettaglio.dati_partenza.destinatario && (
                      <DetailRow label="Destinatario" value={dettaglio.dati_partenza.destinatario.denominazione || dettaglio.dati_partenza.destinatario.codice_fiscale} />
                    )}
                    {dettaglio.dati_partenza.rifiuto && (
                      <>
                        <DetailRow label="Codice EER" value={dettaglio.dati_partenza.rifiuto.codice_eer} />
                        <DetailRow label="Stato Fisico" value={dettaglio.dati_partenza.rifiuto.stato_fisico} />
                        {dettaglio.dati_partenza.rifiuto.quantita && (
                          <DetailRow label="Quantità" value={`${dettaglio.dati_partenza.rifiuto.quantita.valore} ${dettaglio.dati_partenza.rifiuto.quantita.unita_misura}`} />
                        )}
                      </>
                    )}
                    {dettaglio.dati_partenza.trasportatori?.length > 0 && (
                      <DetailRow label="Trasportatore" value={dettaglio.dati_partenza.trasportatori[0].denominazione || dettaglio.dati_partenza.trasportatori[0].codice_fiscale} />
                    )}
                  </DetailSection>
                )}

                {/* Dati Trasporto */}
                {dettaglio.dati_trasporto_partenza && (
                  <DetailSection title="Trasporto Iniziale" icon={FiTruck}>
                    {dettaglio.dati_trasporto_partenza.conducente && (
                      <DetailRow label="Conducente" value={`${dettaglio.dati_trasporto_partenza.conducente.nome || ""} ${dettaglio.dati_trasporto_partenza.conducente.cognome || ""}`} />
                    )}
                    <DetailRow label="Targa" value={dettaglio.dati_trasporto_partenza.targa_automezzo} />
                    <DetailRow label="Inizio Trasporto" value={fmtDateTime(dettaglio.dati_trasporto_partenza.data_ora_inizio_trasporto)} />
                  </DetailSection>
                )}

                {/* Firme */}
                {dettaglio.firme?.length > 0 && (
                  <DetailSection title="Firme Digitali" icon={FiPenTool}>
                    {dettaglio.firme.map((firma, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs py-0.5">
                        <FiCheckCircle className="w-3 h-3 text-sky-400 flex-shrink-0" />
                        <span className="text-slate-300">{firma.soggetto || firma.identificativo_utente || `Firma ${i + 1}`}</span>
                        <span className="text-slate-500 text-[10px] ml-auto">{fmtDateTime(firma.data)}</span>
                      </div>
                    ))}
                  </DetailSection>
                )}

                {/* Azioni disponibili */}
                {azioni && (
                  <DetailSection title="Azioni Disponibili" icon={FiCornerDownRight}>
                    <div className="flex flex-wrap gap-1.5">
                      {azioni.azioni_disponibili?.length > 0 ? (
                        azioni.azioni_disponibili.map((az, i) => (
                          <button key={i}
                            className="px-2 py-1 text-[10px] rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors font-medium">
                            {az.replaceAll("_", " ")}
                          </button>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">Nessuna azione disponibile</span>
                      )}
                    </div>
                  </DetailSection>
                )}

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-[#243044]">
                  <button
                    onClick={() => handleDownloadXFir(selectedFir)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors font-medium"
                  >
                    <FiDownload className="w-3 h-3" /> Scarica xFIR
                  </button>
                  <button
                    onClick={() => handleRollback(selectedFir)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors font-medium"
                  >
                    <FiRotateCcw className="w-3 h-3" /> Rollback Firma
                  </button>
                  <button
                    onClick={() => loadDettaglio(selectedFir)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-lg bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 transition-colors font-medium"
                  >
                    <FiRefreshCw className="w-3 h-3" /> Aggiorna
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">Seleziona un FIR per vedere i dettagli</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* TAB: Vidimazione                                           */
/* ═══════════════════════════════════════════════════════════ */

function TabVidimazione({ orgId, config }) {
  const [firVidimati, setFirVidimati] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [codiceBlocco, setCodiceBlocco] = useState("");
  const [blocchi, setBlocchi] = useState([]);
  const [vidimando, setVidimando] = useState(false);
  const [verificaNumero, setVerificaNumero] = useState("");
  const [verificaResult, setVerificaResult] = useState(null);
  const [verificaLoading, setVerificaLoading] = useState(false);

  // Carica blocchi all'avvio
  useEffect(() => {
    if (!orgId || !config) return;
    (async () => {
      try {
        const result = await fetchBlocchiFir({
          orgId,
          identificativo: config.cf_operatore,
          environment: config.environment,
        });
        setBlocchi(result.data || []);
        if (result.data?.length > 0 && !codiceBlocco) {
          setCodiceBlocco(result.data[0].codice_blocco || result.data[0].codiceBlocco || "");
        }
      } catch (err) {
        console.error("[XFIR] Errore caricamento blocchi:", err);
      }
    })();
  }, [orgId, config]);

  // Carica FIR vidimati per blocco selezionato
  const loadVidimati = useCallback(async () => {
    if (!codiceBlocco) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFirVidimati({ orgId, codiceBlocco, environment: config.environment });
      setFirVidimati(result.data || []);
    } catch (err) {
      setError(err.message);
      setFirVidimati([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, config, codiceBlocco]);

  useEffect(() => { if (codiceBlocco) loadVidimati(); }, [codiceBlocco, loadVidimati]);

  const handleVidima = useCallback(async () => {
    if (!codiceBlocco) return alert("Seleziona un blocco");
    if (!confirm(`Vuoi vidimare un nuovo FIR nel blocco ${codiceBlocco}?`)) return;
    setVidimando(true);
    try {
      const result = await vidimaFir({ orgId, codiceBlocco, environment: config.environment });
      const transId = result.transazione_id || result.data?.transazione_id || 'N/A';
      const numeroFir = result.numero_fir || result.data?.numero_fir;
      
      // Success feedback
      const successMsg = numeroFir 
        ? ` FIR vidimato con successo!\n\nNumero FIR: ${numeroFir}\nTransazione: ${transId}\n\nIl FIR è ora disponibile nella lista dei FIR vidimati.`
        : ` Vidimazione completata!\n\nTransazione: ${transId}\n\nAggiorna la lista per vedere il nuovo FIR.`;
      
      alert(successMsg);
      
      // Reload data
      await loadVidimati();
    } catch (err) {
      alert(` Errore vidimazione\n\n${err.message}\n\nVerifica che il blocco abbia FIR disponibili e riprova.`);
    } finally {
      setVidimando(false);
    }
  }, [orgId, config, codiceBlocco, loadVidimati]);

  const handleVerifica = useCallback(async () => {
    if (!verificaNumero) return;
    setVerificaLoading(true);
    setVerificaResult(null);
    try {
      const result = await verificaFir({ orgId, numeroFir: verificaNumero, environment: config.environment });
      setVerificaResult(result.data);
    } catch (err) {
      setVerificaResult({ error: err.message });
    } finally {
      setVerificaLoading(false);
    }
  }, [orgId, config, verificaNumero]);

  const handlePdf = useCallback(async (cb, prog) => {
    try {
      const result = await fetchPdfVidimazione({ orgId, codiceBlocco: cb, progressivo: prog, environment: config.environment });
      if (result.blob) {
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `fir-vidimato-${cb}-${prog}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (result.data) {
        alert("PDF non ancora disponibile per questo FIR vidimato.\n\nIl PDF viene generato dopo la vidimazione completa.");
      } else {
        alert("PDF non disponibile per questo FIR.");
      }
    } catch (err) {
      alert("Errore download PDF: " + err.message);
    }
  }, [orgId, config]);

  return (
    <div className="space-y-4">
      {/* Vidimazione rapida + Verifica */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vidimazione */}
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <FiPlus className="w-4 h-4 text-blue-400" />
            Vidima Nuovo FIR
          </h3>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-slate-500 mb-1 block">Blocco FIR</label>
              <select
                value={codiceBlocco}
                onChange={(e) => setCodiceBlocco(e.target.value)}
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-xs text-white focus:border-blue-500/50 focus:outline-none"
              >
                <option value="">Seleziona blocco...</option>
                {blocchi.map((b) => (
                  <option key={b.codice_blocco || b.codiceBlocco} value={b.codice_blocco || b.codiceBlocco}>
                    {b.codice_blocco || b.codiceBlocco} — {b.numero_fir_vidimati || 0} FIR vidimati
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleVidima}
              disabled={!codiceBlocco || vidimando}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              {vidimando ? <FiRefreshCw className="w-3 h-3 animate-spin" /> : <FiShield className="w-3 h-3" />}
              Vidima
            </button>
          </div>
        </div>

        {/* Verifica esistenza FIR */}
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <FiSearch className="w-4 h-4 text-blue-400" />
            Verifica Numero FIR
          </h3>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-slate-500 mb-1 block">Numero FIR</label>
              <input
                type="text"
                value={verificaNumero}
                onChange={(e) => setVerificaNumero(e.target.value)}
                placeholder="Es: BCDFL 000001 BF"
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-xs text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none font-mono"
              />
            </div>
            <button
              onClick={handleVerifica}
              disabled={!verificaNumero || verificaLoading}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              {verificaLoading ? <FiRefreshCw className="w-3 h-3 animate-spin" /> : <FiSearch className="w-3 h-3" />}
              Verifica
            </button>
          </div>
          {verificaResult && (
            <div className={`mt-3 p-2 rounded-lg text-xs ${
              verificaResult.error
                ? "bg-red-500/10 border border-red-500/20 text-red-400"
                : "bg-sky-500/10 border border-sky-500/20 text-sky-400"
            }`}>
              {verificaResult.error ? (
                <span className="flex items-center gap-1"><FiXCircle className="w-3 h-3" /> {verificaResult.error}</span>
              ) : (
                <span className="flex items-center gap-1"><FiCheckCircle className="w-3 h-3" /> FIR trovato — Soggetto: {verificaResult.codice_fiscale_soggetto || "—"}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lista FIR vidimati */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
        <div className="p-3 border-b border-[#243044] flex items-center justify-between">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <FiHash className="w-4 h-4 text-slate-400" />
            FIR Vidimati {codiceBlocco && `— Blocco ${codiceBlocco}`}
          </h3>
          <button onClick={loadVidimati} disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors">
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {error && (
          <div className="mx-3 mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <FiAlertCircle className="w-3.5 h-3.5" /> {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#243044]">
                <th className="px-3 py-2 text-left text-slate-500 font-medium">Progressivo</th>
                <th className="px-3 py-2 text-left text-slate-500 font-medium">Numero FIR</th>
                <th className="px-3 py-2 text-left text-slate-500 font-medium">Soggetto</th>
                <th className="px-3 py-2 text-left text-slate-500 font-medium">Data Rilascio</th>
                <th className="px-3 py-2 text-left text-slate-500 font-medium">Stato</th>
                <th className="px-3 py-2 text-right text-slate-500 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">Caricamento...</td></tr>
              ) : firVidimati.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                  {!codiceBlocco ? "Seleziona un blocco" : "Nessun FIR vidimato in questo blocco"}
                </td></tr>
              ) : (
                firVidimati.map((fir, idx) => (
                  <tr key={fir.progressivo || idx} className="border-b border-[#243044]/50 hover:bg-[#141c27] transition-colors">
                    <td className="px-3 py-2.5 text-white font-mono">{fir.progressivo || idx + 1}</td>
                    <td className="px-3 py-2.5 text-blue-400 font-mono text-[11px]">{fir.numero_fir || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-400">{fir.codice_fiscale_soggetto || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500">{fmtDate(fir.data_rilascio || fir.data_creazione)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        fir.annullato ? "bg-red-500/10 text-red-400" : "bg-sky-500/10 text-sky-400"
                      }`}>
                        {fir.annullato ? <FiXCircle className="w-3 h-3" /> : <FiCheckCircle className="w-3 h-3" />}
                        {fir.annullato ? "Annullato" : "Attivo"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => handlePdf(codiceBlocco, fir.progressivo)}
                        className="p-1 text-slate-500 hover:text-blue-400 transition-colors"
                        title="Scarica PDF"
                      >
                        <FiDownload className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* TAB: Blocchi FIR                                           */
/* ═══════════════════════════════════════════════════════════ */

function TabBlocchi({ orgId, config }) {
  const [blocchi, setBlocchi] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ancheDisattivi, setAncheDisattivi] = useState(false);

  const loadBlocchi = useCallback(async () => {
    if (!orgId || !config) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchBlocchiFir({
        orgId,
        identificativo: config.cf_operatore,
        ancheDisattivi,
        environment: config.environment,
      });
      setBlocchi(result.data || []);
    } catch (err) {
      setError(err.message);
      setBlocchi([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, config, ancheDisattivi]);

  useEffect(() => { loadBlocchi(); }, [loadBlocchi]);

  return (
    <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
      <div className="p-3 border-b border-[#243044] flex items-center justify-between">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <FiHash className="w-4 h-4 text-blue-400" />
          Blocchi Virtuali FIR
        </h3>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={ancheDisattivi}
              onChange={(e) => setAncheDisattivi(e.target.checked)}
              className="rounded accent-blue-500 w-3 h-3"
            />
            Mostra disattivi
          </label>
          <button onClick={loadBlocchi} disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors">
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-3 mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
          <FiAlertCircle className="w-3.5 h-3.5" /> {error}
        </div>
      )}

      <div className="p-3">
        {loading ? (
          <div className="py-8 text-center text-slate-500 text-xs">Caricamento blocchi...</div>
        ) : blocchi.length === 0 ? (
          <div className="py-8 text-center">
            <FiHash className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-xs text-slate-500 mb-2">Nessun blocco FIR trovato</p>
            <p className="text-[10px] text-slate-600">I blocchi si creano dal portale RENTRI nella sezione Interoperabilità / Gestione blocchi virtuali dei FIR</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {blocchi.map((blocco) => {
              const codice = blocco.codice_blocco || blocco.codiceBlocco;
              const usati = blocco.numero_fir_vidimati || 0;
              const attivo = !blocco.disattivo;

              return (
                <div key={codice} className={`rounded-lg border p-3 transition-colors ${
                  attivo
                    ? "border-[#243044] bg-[#141c27] hover:border-blue-500/30"
                    : "border-slate-700/30 bg-slate-800/20 opacity-60"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-mono font-medium text-white">{codice}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      attivo ? "bg-sky-500/10 text-sky-400" : "bg-slate-500/10 text-slate-500"
                    }`}>
                      {attivo ? "Attivo" : "Disattivato"}
                    </span>
                  </div>

                  {/* Info FIR vidimati */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span>{usati} FIR vidimati</span>
                      {blocco.data_ultimo_utilizzo && (
                        <span>Ultimo uso: {fmtDate(blocco.data_ultimo_utilizzo)}</span>
                      )}
                    </div>
                    <div className="h-1.5 bg-[#1a2536] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all bg-blue-500"
                        style={{ width: `${Math.min(100, usati * 2)}%` }}
                      />
                    </div>
                  </div>

                  {blocco.num_iscr_sito && (
                    <p className="text-[10px] text-slate-500 truncate">Sito: {blocco.num_iscr_sito}</p>
                  )}
                  {blocco.descrizione && (
                    <p className="text-[10px] text-slate-600 truncate">{blocco.descrizione}</p>
                  )}
                  {blocco.denominazione_soggetto && (
                    <p className="text-[10px] text-slate-600 truncate">{blocco.denominazione_soggetto}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 pb-3">
        <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/10 text-[10px] text-slate-500">
          <strong className="text-blue-400">Info:</strong> I blocchi virtuali FIR si creano dal portale RENTRI (
          <a href="https://www.rentri.gov.it" target="_blank" rel="noreferrer" className="text-blue-400 underline">rentri.gov.it</a>
          ) nella sezione Interoperabilità → Gestione blocchi virtuali dei FIR. Ogni blocco contiene un set di numeri FIR vidimabili.
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* Componenti condivisi                                       */
/* ═══════════════════════════════════════════════════════════ */

function DetailSection({ title, icon: Icon, children }) {
  return (
    <div className="bg-[#141c27] rounded-lg border border-[#243044] p-2.5">
      <h4 className="text-[11px] font-medium text-slate-300 mb-2 flex items-center gap-1.5">
        <Icon className="w-3 h-3 text-blue-400" />
        {title}
      </h4>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-300 text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}
