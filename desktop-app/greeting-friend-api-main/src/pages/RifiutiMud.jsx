// src/pages/RifiutiMud.jsx
/**
 * Gestione MUD (Modello Unico Dichiarazione) — Design L
 * Include generazione, revisione dati, export XML/PDF e invio MudComuni/ECOCERVED
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import {
  FiFileText, FiPlus, FiDownload, FiCalendar, FiRefreshCw,
  FiCheckCircle, FiClock, FiAlertCircle, FiEdit, FiTrash2,
  FiChevronLeft, FiSend, FiExternalLink, FiX, FiPrinter,
  FiDatabase, FiBarChart2, FiPackage, FiInfo, FiEye
} from "react-icons/fi";
// supabaseBrowser available if needed for direct DB queries

/* ─── Constants ─── */
const STATI_MUD = {
  bozza: { bg: "bg-slate-500/10", text: "text-slate-400", icon: FiClock, label: "Bozza" },
  in_completamento: { bg: "bg-blue-500/10", text: "text-blue-400", icon: FiEdit, label: "In Completamento" },
  completato: { bg: "bg-sky-500/10", text: "text-sky-400", icon: FiCheckCircle, label: "Completato" },
  trasmesso: { bg: "bg-blue-500/10", text: "text-blue-400", icon: FiSend, label: "Trasmesso" },
  accettato: { bg: "bg-sky-500/10", text: "text-sky-400", icon: FiCheckCircle, label: "Accettato" },
  rifiutato: { bg: "bg-red-500/10", text: "text-red-400", icon: FiAlertCircle, label: "Rifiutato" },
};

const StatoBadge = ({ stato }) => {
  const c = STATI_MUD[stato] || STATI_MUD.bozza;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${c.bg} ${c.text}`}>
      <Icon className="w-3 h-3" /> {c.label}
    </span>
  );
};

/* ─── Sezioni filiera VFU (RENTRI): un MUD per (org, anno, sezione) ─── */
const SEZIONI_FILIERA = {
  AUT: { label: "AUT", desc: "Autodemolitore — veicoli fuori uso", icon: FiDatabase },
  ROT: { label: "ROT", desc: "Rottamatore — carcasse/parti metalliche", icon: FiPackage },
  FRA: { label: "FRA", desc: "Frantumatore — frantumazione finale", icon: FiBarChart2 },
};
const ORDINE_SEZIONI = ["AUT", "ROT", "FRA"];

/* ─── Helpers ─── */
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtQty = (n) => n != null ? Number(n).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00";

export default function RifiutiMud() {
  const { orgId } = useOrg();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mudList, setMudList] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 1);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [sendingId, setSendingId] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 6000);
  }, []);

  const anni = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => y - 1 - i);
  }, []);

  // Sezioni filiera presenti tra i MUD dell'anno (un MUD per sezione).
  const [activeSez, setActiveSez] = useState("AUT");
  const sezioniPresenti = useMemo(() => {
    const set = new Set(mudList.map((m) => m.sezione || "AUT"));
    return ORDINE_SEZIONI.filter((s) => set.has(s));
  }, [mudList]);
  useEffect(() => {
    if (sezioniPresenti.length && !sezioniPresenti.includes(activeSez)) {
      setActiveSez(sezioniPresenti[0]);
    }
  }, [sezioniPresenti, activeSez]);
  const visibleMud = useMemo(
    () => mudList.filter((m) => (m.sezione || "AUT") === activeSez),
    [mudList, activeSez]
  );

  useEffect(() => {
    if (orgId) loadMud();
  }, [orgId, selectedYear]); // eslint-disable-line

  async function loadMud() {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_RENTRI_API_URL || "https://rentri-test.rescuemanager.eu/api/rentri";
      const response = await fetch(`${apiUrl}/mud?org_id=${orgId}&anno=${selectedYear}`);
      if (response.ok) {
        const data = await response.json();
        setMudList(data.mud || []);
      } else {
        setMudList([]);
      }
    } catch (error) {
      console.error("Errore caricamento MUD:", error);
      setMudList([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneraMud() {
    setGenerating(true);
    try {
      const apiUrl = import.meta.env.VITE_RENTRI_API_URL || "https://rentri-test.rescuemanager.eu/api/rentri";
      const response = await fetch(`${apiUrl}/mud`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          anno: selectedYear,
          data_inizio: `${selectedYear}-01-01`,
          data_fine: `${selectedYear}-12-31`,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Errore generazione MUD");
      {
        const sezGen = result.aggregazione?.sezioni_generate?.join(", ") || "—";
        const skipMsg = result.skip?.length
          ? ` (saltate: ${result.skip.map((s) => s.sezione).join(", ")} già esistenti)`
          : "";
        showToast("success",
          `MUD ${selectedYear} generato — sezioni: ${sezGen}. ` +
          `${result.aggregazione?.movimenti || 0} movimenti, ` +
          `${result.aggregazione?.registri || 0} registri, ${result.aggregazione?.formulari || 0} formulari, ` +
          `${fmtQty(result.aggregazione?.totale_quantita)} kg.${skipMsg}`
        );
      }
      await loadMud();
    } catch (error) {
      console.error("Errore generazione MUD:", error);
      showToast("error", `Errore generazione: ${error?.message || "Errore sconosciuto"}`);
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateXML(mudId) {
    try {
      const apiUrl = import.meta.env.VITE_RENTRI_API_URL || "https://rentri-test.rescuemanager.eu/api/rentri";
      const response = await fetch(`${apiUrl}/mud/${mudId}?action=generate-xml`, {
        method: "POST", headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Errore generazione XML");
      const xmlContent = atob(result.xml);
      const blob = new Blob([xmlContent], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename || `MUD_${selectedYear}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("success", "XML MUD scaricato");
    } catch (error) {
      console.error("Errore generazione XML:", error);
      showToast("error", `Errore XML: ${error?.message}`);
    }
  }

  async function handleGeneratePDF(mudId) {
    try {
      const apiUrl = import.meta.env.VITE_RENTRI_API_URL || "https://rentri-test.rescuemanager.eu/api/rentri";
      const response = await fetch(`${apiUrl}/mud/${mudId}?action=generate-pdf`, {
        method: "POST", headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Errore generazione PDF");
      const htmlContent = atob(result.html);
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename || `MUD_${selectedYear}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("success", "PDF MUD scaricato");
    } catch (error) {
      console.error("Errore generazione PDF:", error);
      showToast("error", `Errore PDF: ${error?.message}`);
    }
  }

  async function handleDeleteMud(mudId) {
    try {
      const apiUrl = import.meta.env.VITE_RENTRI_API_URL || "https://rentri-test.rescuemanager.eu/api/rentri";
      const response = await fetch(`${apiUrl}/mud/${mudId}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Errore eliminazione");
      }
      setMudList(prev => prev.filter(m => m.id !== mudId));
      setConfirmDelete(null);
      showToast("success", "MUD eliminato");
    } catch (error) {
      console.error("Errore eliminazione MUD:", error);
      showToast("error", `Errore: ${error?.message}`);
    }
  }

  async function handleInvioMudComuni(mudId) {
    setSendingId(mudId);
    try {
      const apiUrl = import.meta.env.VITE_RENTRI_API_URL || "https://rentri-test.rescuemanager.eu/api/rentri";
      const response = await fetch(`${apiUrl}/mud/${mudId}/invio-mudcomuni`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Errore invio MudComuni");

      if (result.success) {
        showToast("success",
          result.protocollo
            ? `MUD inviato a MudComuni! Protocollo: ${result.protocollo}`
            : "MUD inviato a MudComuni con successo!"
        );
        await loadMud();
      } else if (result.redirect_url) {
        showToast("info", "Apertura portale MudComuni...");
        globalThis.open(result.redirect_url, "_blank");
      } else {
        throw new Error(result.error || "Risposta non valida");
      }
    } catch (error) {
      console.error("Errore invio MudComuni:", error);
      showToast("error", `Errore invio: ${error?.message}`);
    } finally {
      setSendingId(null);
    }
  }

  /* ─── KPI ─── */
  const stats = useMemo(() => {
    const bozze = mudList.filter(m => m.stato === "bozza" || m.stato === "in_completamento").length;
    const completati = mudList.filter(m => m.stato === "completato").length;
    const trasmessi = mudList.filter(m => m.stato === "trasmesso" || m.stato === "accettato").length;
    const totQty = mudList.reduce((sum, m) => sum + (m.totale_quantita || 0), 0);
    return { bozze, completati, trasmessi, totQty };
  }, [mudList]);

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="h-8 w-8 bg-[#243044] rounded-lg" /><div className="h-5 w-64 bg-[#243044] rounded" /></div>
          <div className="flex gap-2"><div className="h-8 w-24 bg-[#243044] rounded-lg" /><div className="h-8 w-32 bg-[#243044] rounded-lg" /></div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-[#1a2536] rounded-xl border border-[#243044]" />)}
        </div>
        <div className="h-48 bg-[#1a2536] rounded-xl border border-[#243044]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 max-w-sm flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-xs font-medium shadow-lg transition-all ${
          toast.type === "success" ? "bg-sky-500/15 border-sky-500/30 text-sky-300" :
          toast.type === "error" ? "bg-red-500/15 border-red-500/30 text-red-300" :
          "bg-blue-500/15 border-blue-500/30 text-blue-300"
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === "success" ? <FiCheckCircle className="w-3.5 h-3.5 shrink-0" /> : toast.type === "error" ? <FiAlertCircle className="w-3.5 h-3.5 shrink-0" /> : <FiInfo className="w-3.5 h-3.5 shrink-0" />}
            <span>{toast.msg}</span>
          </div>
          <button onClick={() => setToast(null)} className="p-0.5 hover:opacity-70 shrink-0"><FiX className="w-3 h-3" /></button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/rifiuti")}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#243044] bg-[#1a2536] text-slate-400 hover:bg-[#1e2b3d] transition">
            <FiChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">MUD — Modello Unico Dichiarazione</h1>
            <p className="text-[10px] text-slate-500 mt-0.5">Dichiarazioni annuali rifiuti · Comunicazione Rifiuti Speciali</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number.parseInt(e.target.value))}
            className="px-3 py-2 text-xs bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 focus:ring-1 focus:ring-blue-500/30 outline-none transition">
            {anni.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
          <button onClick={handleGeneraMud} disabled={generating}
            className="h-8 px-3 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-sm shadow-blue-600/20">
            {generating
              ? <><FiRefreshCw className="w-3.5 h-3.5 inline mr-1 animate-spin" /> Generazione...</>
              : <><FiPlus className="w-3.5 h-3.5 inline mr-1" /> Genera MUD {selectedYear}</>}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-slate-500/30 transition">
          <div className="w-8 h-8 rounded-lg bg-slate-500/10 flex items-center justify-center mb-2">
            <FiClock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-semibold text-slate-100">{stats.bozze}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Bozze / In completamento</div>
        </div>
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-sky-500/30 transition">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center mb-2">
            <FiCheckCircle className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-semibold text-slate-100">{stats.completati}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Completati</div>
        </div>
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-blue-500/30 transition">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
            <FiSend className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-semibold text-slate-100">{stats.trasmessi}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Trasmessi / Accettati</div>
        </div>
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-amber-500/30 transition">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2">
            <FiPackage className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-semibold text-slate-100">{fmtQty(stats.totQty)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">kg totali dichiarati</div>
        </div>
      </div>

      {/* ── Info MudComuni ── */}
      <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3 flex items-start gap-3">
        <FiInfo className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-slate-300 mb-1">
            <span className="font-medium text-blue-400">Invio telematico MudComuni</span> — Il MUD va presentato entro il 30 aprile di ogni anno tramite il portale ECOCERVED/MudComuni.
          </p>
          <p className="text-[10px] text-slate-500">
            Genera il MUD, revisiona i dati aggregati, poi usa il pulsante "Invia a MudComuni" per la trasmissione telematica. In alternativa puoi scaricare l'XML e caricarlo manualmente su{" "}
            <a href="https://www.mudcomuni.it" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-0.5">
              mudcomuni.it <FiExternalLink className="w-2.5 h-2.5" />
            </a>
          </p>
        </div>
      </div>

      {/* ── Lista MUD ── */}
      {mudList.length === 0 ? (
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-8 text-center">
          <FiFileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500 mb-1">Nessun MUD per l'anno {selectedYear}</p>
          <p className="text-[10px] text-slate-600 mb-4">Genera il MUD aggregando automaticamente movimenti, registri e formulari trasmessi</p>
          <button onClick={handleGeneraMud} disabled={generating}
            className="h-8 px-3 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            <FiPlus className="w-3.5 h-3.5 inline mr-1" /> Genera MUD {selectedYear}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Tab sezioni filiera (un MUD per sezione) */}
          {sezioniPresenti.length > 0 && (
            <div className="flex items-center gap-1.5 border-b border-[#243044] pb-2">
              {sezioniPresenti.map((s) => {
                const meta = SEZIONI_FILIERA[s];
                const Icon = meta?.icon || FiDatabase;
                const active = activeSez === s;
                return (
                  <button
                    key={s}
                    onClick={() => setActiveSez(s)}
                    title={meta?.desc}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-slate-200 hover:bg-[#243044]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {meta?.label || s}
                  </button>
                );
              })}
            </div>
          )}
          {visibleMud.map((mud) => {
            const isExpanded = expandedId === mud.id;
            return (
              <div key={mud.id} className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden hover:border-[#2d3d56] transition">
                {/* Card Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5 mb-3">
                        <h3 className="text-sm font-semibold text-slate-200">MUD {mud.anno}</h3>
                        <span className="text-[10px] font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded" title={SEZIONI_FILIERA[mud.sezione || "AUT"]?.desc}>
                          {SEZIONI_FILIERA[mud.sezione || "AUT"]?.label || mud.sezione || "AUT"}
                        </span>
                        <StatoBadge stato={mud.stato} />
                        {mud.numero_protocollo && (
                          <span className="text-[10px] text-sky-400 font-mono bg-sky-500/10 px-1.5 py-0.5 rounded">
                            Prot. {mud.numero_protocollo}
                          </span>
                        )}
                      </div>

                      {/* KPI row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="bg-[#141c27]/50 rounded-lg px-3 py-2">
                          <p className="text-[10px] text-slate-500">Movimenti</p>
                          <p className="text-sm font-semibold text-slate-200">{mud.totale_movimenti || 0}</p>
                        </div>
                        <div className="bg-[#141c27]/50 rounded-lg px-3 py-2">
                          <p className="text-[10px] text-slate-500">Registri</p>
                          <p className="text-sm font-semibold text-slate-200">{mud.totale_registri || 0}</p>
                        </div>
                        <div className="bg-[#141c27]/50 rounded-lg px-3 py-2">
                          <p className="text-[10px] text-slate-500">Formulari</p>
                          <p className="text-sm font-semibold text-slate-200">{mud.totale_formulari || 0}</p>
                        </div>
                        <div className="bg-[#141c27]/50 rounded-lg px-3 py-2">
                          <p className="text-[10px] text-slate-500">Quantità Totale</p>
                          <p className="text-sm font-semibold text-slate-200">{fmtQty(mud.totale_quantita)} kg</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-slate-500">
                        <span className="inline-flex items-center gap-1"><FiCalendar className="w-3 h-3" /> {fmtDate(mud.data_inizio)} — {fmtDate(mud.data_fine)}</span>
                        {mud.created_at && <span>Generato: {fmtDate(mud.created_at)}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 ml-4">
                      <button onClick={() => setExpandedId(isExpanded ? null : mud.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#243044] transition" title="Dettagli sezioni">
                        <FiEye className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                      <button onClick={() => handleGenerateXML(mud.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-blue-500/10 transition" title="Scarica XML">
                        <FiDownload className="w-3.5 h-3.5 text-blue-400" />
                      </button>
                      <button onClick={() => handleGeneratePDF(mud.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-blue-500/10 transition" title="Scarica PDF">
                        <FiPrinter className="w-3.5 h-3.5 text-blue-400" />
                      </button>
                      {(mud.stato === "completato" || mud.stato === "bozza" || mud.stato === "in_completamento") && (
                        <button onClick={() => handleInvioMudComuni(mud.id)} disabled={sendingId === mud.id}
                          className="h-7 px-2.5 text-[10px] font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition disabled:opacity-50 inline-flex items-center gap-1"
                          title="Invia a MudComuni/ECOCERVED">
                          {sendingId === mud.id
                            ? <FiRefreshCw className="w-3 h-3 animate-spin" />
                            : <FiSend className="w-3 h-3" />}
                          MudComuni
                        </button>
                      )}
                      {(mud.stato === "bozza" || mud.stato === "in_completamento") && (
                        <button onClick={() => setConfirmDelete(mud.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-500/10 transition" title="Elimina">
                          <FiTrash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded: Sezioni MUD */}
                {isExpanded && (
                  <div className="border-t border-[#243044] px-5 py-4 space-y-3">
                    <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Sezione filiera</h4>

                    {(() => {
                      const meta = SEZIONI_FILIERA[mud.sezione || "AUT"] || SEZIONI_FILIERA.AUT;
                      const Icon = meta.icon;
                      return (
                        <div className="bg-[#141c27]/50 border border-[#243044] rounded-lg p-3.5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                              <Icon className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-300">Sezione {meta.label}</p>
                              <p className="text-[10px] text-slate-500">{meta.desc}</p>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {mud.totale_movimenti || 0} mov · {mud.totale_registri || 0} reg · {mud.totale_formulari || 0} FIR
                          </span>
                        </div>
                      );
                    })()}

                    {/* Riepilogo codici EER */}
                    {mud.riepilogo_eer && Array.isArray(mud.riepilogo_eer) && mud.riepilogo_eer.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Riepilogo per Codice EER</h4>
                        <div className="bg-[#141c27] rounded-lg border border-[#243044] overflow-hidden">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-[#141c27]">
                                <th className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Codice EER</th>
                                <th className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Descrizione</th>
                                <th className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">Carico (kg)</th>
                                <th className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">Scarico (kg)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#243044]/60">
                              {mud.riepilogo_eer.map((eer, i) => (
                                <tr key={i} className="hover:bg-[#1a2536]/50">
                                  <td className="px-3 py-1.5 text-xs font-mono text-blue-400">{eer.codice}</td>
                                  <td className="px-3 py-1.5 text-xs text-slate-400">{eer.descrizione || "—"}</td>
                                  <td className="px-3 py-1.5 text-xs text-teal-400 text-right">{fmtQty(eer.carico)}</td>
                                  <td className="px-3 py-1.5 text-xs text-amber-400 text-right">{fmtQty(eer.scarico)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Link portale MudComuni */}
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-[10px] text-slate-600">
                        Per upload manuale: scarica XML → carica su portale MudComuni
                      </p>
                      <a href="https://www.mudcomuni.it" target="_blank" rel="noopener noreferrer"
                        className="h-7 px-2.5 text-[10px] font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-md hover:bg-blue-500/15 transition inline-flex items-center gap-1">
                        <FiExternalLink className="w-3 h-3" /> Apri MudComuni
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Scadenza reminder ── */}
      {selectedYear === new Date().getFullYear() - 1 && (
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3 flex items-start gap-3">
          <FiAlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-amber-300 font-medium">Scadenza presentazione MUD</p>
            <p className="text-[10px] text-slate-500">
              Il MUD per l'anno {selectedYear} va presentato entro il <span className="text-amber-400 font-medium">30 aprile {selectedYear + 1}</span> tramite il portale MudComuni/ECOCERVED.
              La mancata presentazione comporta sanzioni da €2.600 a €15.500.
            </p>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm border-none cursor-pointer"
            onClick={() => setConfirmDelete(null)} aria-label="Chiudi" type="button" />
          <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-5">
            <div className="text-sm font-semibold text-slate-200 mb-1.5">Elimina MUD</div>
            <div className="text-xs text-slate-400 mb-3">Sei sicuro di voler eliminare questo MUD? I dati aggregati verranno persi.</div>
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2 mb-5">
              <div className="flex items-start gap-2">
                <FiAlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-[10px] text-amber-400">I movimenti e registri originali non verranno eliminati.</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)}
                className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition">
                Annulla
              </button>
              <button onClick={() => handleDeleteMud(confirmDelete)}
                className="h-8 px-3 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition">
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
