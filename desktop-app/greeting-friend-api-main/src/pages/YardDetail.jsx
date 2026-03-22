/**
 * YardDetail — Dettaglio mezzo nel piazzale
 * Mostra info complete, pratica, date, condizioni, foto
 *
 * Route: /piazzale/:id
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import {
  FiArrowLeft, FiEdit, FiTrash2, FiTruck, FiMapPin,
  FiCalendar, FiHash, FiKey, FiShield, FiAlertCircle,
  FiClock, FiFileText, FiImage
} from "react-icons/fi";

/* ─── Helpers ─── */
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const getDaysInYard = (dataIngresso) => {
  if (!dataIngresso) return "—";
  const days = Math.floor((Date.now() - new Date(dataIngresso).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Oggi";
  if (days === 1) return "1 giorno";
  return `${days} giorni`;
};

const TAG_MAP = {
  sequestro:    { label: "Sequestro",    cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  confisca:     { label: "Confisca",     cls: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  demolizione:  { label: "Demolizione",  cls: "bg-slate-500/10 text-slate-300 border-slate-500/20" },
  vendita:      { label: "Vendita",      cls: "bg-green-500/10 text-green-400 border-green-500/20" },
  manutenzione: { label: "Manutenzione", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  attesa:       { label: "Attesa",       cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
};

const STATUS_MAP = {
  attivo:          { label: "Attivo",        cls: "bg-emerald-500/10 text-emerald-400" },
  in_manutenzione: { label: "Manutenzione",  cls: "bg-blue-500/10 text-blue-400" },
  venduto:         { label: "Venduto",       cls: "bg-purple-500/10 text-purple-400" },
  demolito:        { label: "Demolito",      cls: "bg-slate-500/10 text-slate-300" },
  rimosso:         { label: "Rimosso",       cls: "bg-red-500/10 text-red-400" },
  rilasciato:      { label: "Rilasciato",    cls: "bg-cyan-500/10 text-cyan-400" },
};

const Badge = ({ map, value }) => {
  const cfg = map[value] || { label: value || "—", cls: "bg-slate-500/10 text-slate-400" };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${cfg.cls}`}>{cfg.label}</span>;
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

export default function YardDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (!orgId || !id) return;
    (async () => {
      setLoading(true);
      try {
        const { data, error: err } = await supabase
          .from("yard_vehicles")
          .select("*")
          .eq("id", id)
          .eq("org_id", orgId)
          .single();
        if (err) throw err;
        setVehicle(data);
      } catch (err) {
        console.error("Error loading yard vehicle:", err);
        setError("Mezzo non trovato o errore di caricamento.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, orgId, supabase]);

  const handleDelete = async () => {
    try {
      const { error: err } = await supabase.from("yard_vehicles").delete().eq("id", id).eq("org_id", orgId);
      if (err) throw err;
      navigate("/piazzale");
    } catch (err) {
      console.error("Error deleting:", err);
      alert("Errore durante l'eliminazione.");
    }
  };

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

  if (error || !vehicle) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate("/piazzale")} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          <FiArrowLeft className="w-4 h-4" /> Piazzale
        </button>
        <div className="bg-red-500/5 rounded-xl border border-red-500/15 px-5 py-4 flex items-center gap-3">
          <FiAlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-sm text-red-400">{error || "Mezzo non trovato"}</span>
        </div>
      </div>
    );
  }

  const v = vehicle;
  const tagCfg = TAG_MAP[v.tag] || { label: v.tag || "—", cls: "bg-slate-500/10 text-slate-400 border-slate-500/20" };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/piazzale")} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#1a2536] rounded-lg transition-colors">
            <FiArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#141c27] rounded-xl flex items-center justify-center border border-[#243044]">
              <FiTruck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-slate-100">{v.targa || "Senza targa"}</h1>
                <Badge map={TAG_MAP} value={v.tag} />
                <Badge map={STATUS_MAP} value={v.stato} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {v.marca && v.modello ? `${v.marca} ${v.modello}` : v.marca || v.modello || "—"}
                {v.data_ingresso && ` \u00b7 In piazzale da ${getDaysInYard(v.data_ingresso)}`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/piazzale/${id}/modifica`)}
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

          {/* Info Veicolo */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FiTruck className="w-3.5 h-3.5 text-blue-400" /> Informazioni Veicolo
            </h2>
            <div className="grid grid-cols-2 gap-x-6">
              <InfoRow icon={FiHash} label="Targa" value={v.targa} mono />
              <InfoRow icon={FiHash} label="Telaio" value={v.telaio} mono />
              <InfoRow icon={FiTruck} label="Marca" value={v.marca} />
              <InfoRow icon={FiTruck} label="Modello" value={v.modello} />
            </div>
          </div>

          {/* Ubicazione */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FiMapPin className="w-3.5 h-3.5 text-emerald-400" /> Ubicazione
            </h2>
            <div className="grid grid-cols-2 gap-x-6">
              <InfoRow icon={FiMapPin} label="Zona" value={v.zona} />
              <InfoRow icon={FiMapPin} label="Posizione" value={v.posizione} />
              <InfoRow icon={FiKey} label="Numero Chiave" value={v.numero_chiave} mono />
            </div>
          </div>

          {/* Pratica */}
          {(v.tag === "sequestro" || v.tag === "confisca" || v.numero_pratica) && (
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FiShield className="w-3.5 h-3.5 text-amber-400" /> Pratica
              </h2>
              <div className="grid grid-cols-2 gap-x-6">
                <InfoRow icon={FiFileText} label="Numero Pratica" value={v.numero_pratica} mono />
                <InfoRow icon={FiShield} label="Autorita Competente" value={v.autorita_competente} />
                <InfoRow icon={FiCalendar} label="Data Sequestro" value={fmtDate(v.data_sequestro)} />
                <InfoRow icon={FiCalendar} label="Data Confisca" value={fmtDate(v.data_confisca)} />
                <InfoRow icon={FiCalendar} label="Scadenza Pratica" value={fmtDate(v.scadenza_pratica)} />
              </div>
            </div>
          )}

          {/* Condizioni */}
          {(v.condizioni_iniziali || v.condizioni_finali) && (
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FiFileText className="w-3.5 h-3.5 text-purple-400" /> Condizioni
              </h2>
              {v.condizioni_iniziali && (
                <div className="mb-3">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1">Condizioni Iniziali</div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap bg-[#141c27] rounded-lg p-3 border border-[#243044]">{v.condizioni_iniziali}</p>
                </div>
              )}
              {v.condizioni_finali && (
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1">Condizioni Finali</div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap bg-[#141c27] rounded-lg p-3 border border-[#243044]">{v.condizioni_finali}</p>
                </div>
              )}
            </div>
          )}

          {/* Foto */}
          {v.foto && v.foto.length > 0 && (
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FiImage className="w-3.5 h-3.5 text-cyan-400" /> Foto ({v.foto.length})
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {v.foto.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-lg overflow-hidden border border-[#243044] hover:border-blue-500/40 transition-colors">
                    <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Date */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FiCalendar className="w-3.5 h-3.5 text-blue-400" /> Date
            </h2>
            <div className="space-y-1">
              <InfoRow icon={FiCalendar} label="Data Ingresso" value={fmtDate(v.data_ingresso)} />
              <InfoRow icon={FiClock} label="Permanenza" value={getDaysInYard(v.data_ingresso)} />
              {v.data_rilascio && <InfoRow icon={FiCalendar} label="Data Rilascio" value={fmtDate(v.data_rilascio)} />}
              {v.data_uscita && <InfoRow icon={FiCalendar} label="Data Uscita" value={fmtDate(v.data_uscita)} />}
            </div>
          </div>

          {/* Tag & Stato */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Stato Corrente</h2>
            <div className="space-y-3">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5">Tag</div>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border ${tagCfg.cls}`}>
                  {tagCfg.label}
                </span>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5">Stato</div>
                <Badge map={STATUS_MAP} value={v.stato} />
              </div>
            </div>
          </div>

          {/* Note */}
          {v.note && (
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Note</h2>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{v.note}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Metadati</h2>
            <div className="space-y-2 text-[10px] text-slate-500">
              <div className="flex justify-between"><span>ID</span><span className="font-mono text-slate-400">{v.id?.slice(0, 8)}...</span></div>
              <div className="flex justify-between"><span>Creato</span><span>{fmtDate(v.created_at)}</span></div>
              {v.updated_at && <div className="flex justify-between"><span>Aggiornato</span><span>{fmtDate(v.updated_at)}</span></div>}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm delete modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirmDelete(false)} />
          <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-5">
            <div className="text-sm font-semibold text-slate-200 mb-1.5">Rimuovi dal piazzale</div>
            <div className="text-xs text-slate-400 mb-5">
              Sei sicuro di voler rimuovere <strong className="text-slate-200">{v.targa}</strong> dal piazzale? L'azione non e reversibile.
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
