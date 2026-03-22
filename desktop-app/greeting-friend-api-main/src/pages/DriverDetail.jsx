/**
 * DriverDetail — Dettaglio autista
 * Mostra info, stato, disponibilita, patenti, preferenze, trasporti recenti
 *
 * Route: /autisti/:id
 */

import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import {
  FiArrowLeft, FiEdit, FiTrash2, FiUser, FiPhone,
  FiCalendar, FiTruck, FiAlertCircle,
  FiShield, FiTag, FiFileText
} from "react-icons/fi";

/* ─── Helpers ─── */
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const DAYS = [
  { key: "lun", label: "Lun" },
  { key: "mar", label: "Mar" },
  { key: "mer", label: "Mer" },
  { key: "gio", label: "Gio" },
  { key: "ven", label: "Ven" },
  { key: "sab", label: "Sab" },
  { key: "dom", label: "Dom" },
];

const STATUS_MAP = {
  disponibile: { label: "Disponibile", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  occupato:    { label: "Occupato",    cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  offline:     { label: "Offline",     cls: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  non_disponibile: { label: "Non Disponibile", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const TRANSPORT_STATUS = {
  pending:     { label: "In attesa",  cls: "bg-amber-500/10 text-amber-400" },
  assigned:    { label: "Assegnato",  cls: "bg-blue-500/10 text-blue-400" },
  in_progress: { label: "In corso",   cls: "bg-indigo-500/10 text-indigo-400" },
  completed:   { label: "Completato", cls: "bg-emerald-500/10 text-emerald-400" },
  cancelled:   { label: "Annullato",  cls: "bg-red-500/10 text-red-400" },
};

const Avatar = ({ name, size = "lg" }) => {
  const initials = name?.trim()
    ? name.split(" ").map(p => p[0]?.toUpperCase()).slice(0, 2).join("")
    : "AU";
  const sz = size === "lg" ? "w-14 h-14 text-lg" : "w-8 h-8 text-xs";
  return (
    <div className={`${sz} shrink-0 rounded-full bg-blue-600 text-white grid place-items-center font-semibold`}>
      {initials}
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value, mono }) => (
  <div className="flex items-start gap-3 py-2">
    <div className="w-7 h-7 bg-[#141c27] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="w-3.5 h-3.5 text-slate-500" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{label}</div>
      <div className={`text-sm text-slate-200 mt-0.5 ${mono ? "font-mono" : ""}`}>{value || "—"}</div>
    </div>
  </div>
);

export default function DriverDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();

  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentTransports, setRecentTransports] = useState([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Load driver
  useEffect(() => {
    if (!orgId || !id) return;
    (async () => {
      setLoading(true);
      try {
        const { data, error: err } = await supabase
          .from("staff_drivers")
          .select("*")
          .eq("id", id)
          .eq("org_id", orgId)
          .single();
        if (err) throw err;
        setDriver(data);
      } catch (err) {
        console.error("Error loading driver:", err);
        setError("Autista non trovato o errore di caricamento.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, orgId, supabase]);

  // Load recent transports for this driver
  useEffect(() => {
    if (!orgId || !driver) return;
    const driverName = `${driver.nome || ""}${driver.cognome ? ` ${driver.cognome}` : ""}`.trim();
    if (!driverName) return;

    (async () => {
      try {
        const { data } = await supabase
          .from("transports")
          .select("id, number, customer_name, status, pickup_address, created_at")
          .eq("org_id", orgId)
          .or(`driver_id.eq.${id},notes.ilike.%${driverName}%`)
          .order("created_at", { ascending: false })
          .limit(10);
        setRecentTransports(data || []);
      } catch (err) {
        console.error("Error loading transports:", err);
      }
    })();
  }, [driver, orgId, id, supabase]);

  const handleDelete = async () => {
    try {
      const { error: err } = await supabase.from("staff_drivers").delete().eq("id", id).eq("org_id", orgId);
      if (err) throw err;
      navigate("/autisti");
    } catch (err) {
      console.error("Error deleting:", err);
      alert("Errore durante l'eliminazione.");
    }
  };

  // Parse patenti
  const patenti = useMemo(() => {
    if (!driver) return [];
    if (Array.isArray(driver.patenti) && driver.patenti.length > 0) return driver.patenti;
    if (driver.patente) return driver.patente.split(",").map(s => s.trim()).filter(Boolean);
    return [];
  }, [driver]);

  // Parse disp
  const disp = useMemo(() => {
    if (!driver?.disp) return { lun: true, mar: true, mer: true, gio: true, ven: true, sab: false, dom: false };
    return driver.disp;
  }, [driver]);

  const giorniDisponibili = Object.values(disp).filter(Boolean).length;

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-8 w-20 bg-[#1a2536] rounded-lg" />
          <div><div className="h-5 w-40 bg-[#243044] rounded mb-2" /><div className="h-3 w-56 bg-[#1a2536] rounded" /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-[#1a2536] rounded-xl border border-[#243044] p-5 h-80" />
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5 h-80" />
        </div>
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate("/autisti")} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          <FiArrowLeft className="w-4 h-4" /> Autisti
        </button>
        <div className="bg-red-500/5 rounded-xl border border-red-500/15 px-5 py-4 flex items-center gap-3">
          <FiAlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-sm text-red-400">{error || "Autista non trovato"}</span>
        </div>
      </div>
    );
  }

  const d = driver;
  const fullName = `${d.nome || ""}${d.cognome ? ` ${d.cognome}` : ""}`.trim() || "N/A";
  const statusCfg = STATUS_MAP[d.stato] || STATUS_MAP.offline;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/autisti")} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#1a2536] rounded-lg transition-colors">
            <FiArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <Avatar name={fullName} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-slate-100">{fullName}</h1>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${statusCfg.cls}`}>
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {d.telefono || "Nessun telefono"}
                {patenti.length > 0 && ` \u00b7 Patente: ${patenti.join(", ")}`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/autisti/${id}/modifica`)}
            className="h-8 px-3 text-xs font-medium text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors flex items-center gap-1.5"
          >
            <FiEdit className="w-3.5 h-3.5" /> Modifica
          </button>
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="h-8 px-3 text-xs font-medium text-red-400 bg-red-500/5 border border-red-500/15 rounded-lg hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
          >
            <FiTrash2 className="w-3.5 h-3.5" /> Elimina
          </button>
        </div>
      </div>

      {/* Layout 2 colonne */}
      <div className="grid grid-cols-3 gap-4">
        {/* Colonna principale */}
        <div className="col-span-2 space-y-4">

          {/* Info Base */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FiUser className="w-3.5 h-3.5 text-blue-400" /> Informazioni
            </h2>
            <div className="grid grid-cols-2 gap-x-6">
              <InfoRow icon={FiUser} label="Nome" value={fullName} />
              <InfoRow icon={FiPhone} label="Telefono" value={d.telefono} />
              <InfoRow icon={FiShield} label="Patente" value={patenti.length > 0 ? patenti.join(", ") : "—"} />
              <InfoRow icon={FiTruck} label="Assegnati Oggi" value={String(d.assegnati_oggi || 0)} />
            </div>
          </div>

          {/* Disponibilita Settimanale */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FiCalendar className="w-3.5 h-3.5 text-emerald-400" /> Disponibilita Settimanale
              <span className="ml-auto text-[10px] text-slate-500 normal-case tracking-normal">{giorniDisponibili}/7 giorni</span>
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map(day => (
                <div
                  key={day.key}
                  className={`h-10 rounded-lg border text-xs font-medium flex items-center justify-center ${
                    disp[day.key]
                      ? "bg-blue-600/15 text-blue-400 border-blue-500/20"
                      : "text-slate-600 border-[#243044] bg-[#141c27]"
                  }`}
                >
                  {day.label}
                </div>
              ))}
            </div>
          </div>

          {/* Preferenze Mezzo */}
          {d.preferenze && d.preferenze.length > 0 && (
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FiTruck className="w-3.5 h-3.5 text-amber-400" /> Preferenze Mezzo
              </h2>
              <div className="flex flex-wrap gap-2">
                {d.preferenze.map(pref => (
                  <span key={pref} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {pref}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {d.tags && d.tags.length > 0 && (
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FiTag className="w-3.5 h-3.5 text-purple-400" /> Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {d.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Trasporti Recenti */}
          {recentTransports.length > 0 && (
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#243044]">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FiTruck className="w-3.5 h-3.5 text-blue-400" /> Trasporti Recenti ({recentTransports.length})
                </h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-[#243044]">
                    <th className="py-2 px-5 text-left font-medium">#</th>
                    <th className="py-2 px-5 text-left font-medium">Cliente</th>
                    <th className="py-2 px-5 text-left font-medium">Indirizzo</th>
                    <th className="py-2 px-5 text-center font-medium">Stato</th>
                    <th className="py-2 px-5 text-right font-medium">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#243044]/50">
                  {recentTransports.map(t => {
                    const sCfg = TRANSPORT_STATUS[t.status] || { label: t.status, cls: "bg-slate-500/10 text-slate-400" };
                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-[#141c27] transition-colors cursor-pointer"
                        onClick={() => navigate(`/trasporti/${t.id}`)}
                      >
                        <td className="py-2.5 px-5 text-xs text-slate-400 font-mono">
                          {t.number ? `#${t.number}` : "—"}
                        </td>
                        <td className="py-2.5 px-5 text-xs text-slate-200">{t.customer_name || "—"}</td>
                        <td className="py-2.5 px-5 text-xs text-slate-400 truncate max-w-[200px]">{t.pickup_address || "—"}</td>
                        <td className="py-2.5 px-5 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${sCfg.cls}`}>
                            {sCfg.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-5 text-xs text-slate-500 text-right">{fmtDate(t.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Stato */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Stato Corrente</h2>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                d.stato === "disponibile" ? "bg-emerald-500 animate-pulse" :
                d.stato === "occupato" ? "bg-amber-500" : "bg-slate-500"
              }`} />
              <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border ${statusCfg.cls}`}>
                {statusCfg.label}
              </span>
            </div>
          </div>

          {/* Riepilogo */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Riepilogo</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Assegnati oggi</span>
                <span className="text-sm font-semibold text-slate-200">{d.assegnati_oggi || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Disponibilita</span>
                <span className="text-sm font-semibold text-slate-200">{giorniDisponibili}/7 gg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Patenti</span>
                <span className="text-sm text-slate-200">{patenti.length > 0 ? patenti.join(", ") : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Trasporti recenti</span>
                <span className="text-sm font-semibold text-slate-200">{recentTransports.length}</span>
              </div>
            </div>
          </div>

          {/* Note */}
          {d.note && (
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FiFileText className="w-3.5 h-3.5" /> Note
              </h2>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{d.note}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Metadati</h2>
            <div className="space-y-2 text-[10px] text-slate-500">
              <div className="flex justify-between"><span>ID</span><span className="font-mono text-slate-400">{d.id ? String(d.id).slice(0, 8) : '—'}...</span></div>
              <div className="flex justify-between"><span>Creato</span><span>{fmtDate(d.created_at)}</span></div>
              {d.updated_at && <div className="flex justify-between"><span>Aggiornato</span><span>{fmtDate(d.updated_at)}</span></div>}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm delete modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirmDelete(false)} />
          <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-5">
            <div className="text-sm font-semibold text-slate-200 mb-1.5">Eliminare autista?</div>
            <div className="text-xs text-slate-400 mb-5">
              Sei sicuro di voler eliminare <strong className="text-slate-200">{fullName}</strong>? L'azione non e reversibile.
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowConfirmDelete(false)} className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors">
                Annulla
              </button>
              <button onClick={handleDelete} className="h-8 px-3 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                Conferma Eliminazione
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
