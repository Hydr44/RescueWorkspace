/**
 * Quotes List Page
 * Gestione lista preventivi con filtri e azioni CRUD
 * 
 * @author haxies
 * @created 2025
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiCopy, FiTrash2, FiPrinter, FiPlus, FiFileText, FiEdit, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useOrg } from "@/context/OrgContext";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useMultiSelect } from "@/hooks/useMultiSelect";
import MultiSelectActions from "@/components/ui/MultiSelectActions";
import SelectableCheckbox from "@/components/ui/SelectableCheckbox";

/* ---------- Helpers ---------- */
const supabase = supabaseBrowser();
const EURO = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
const parseNum = (v) => (isNaN(parseFloat(v)) ? 0 : parseFloat(v));
const formatEuro = (n) => EURO.format(Number.isFinite(n) ? n : 0);
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const tableMissing = (e) =>
  String(e?.message || "").includes("Could not find the table") ||
  e?.code === "PGRST205" || e?.status === 404;

/* ---------- Totals ---------- */
function computeTotals(q) {
  const righe = q.righe || q.voci || [];
  const subTot = righe.reduce((s, r) => s + parseNum(r.qty) * parseNum(r.prezzo), 0);
  const scontoVal = round2(subTot * (parseNum(q.scontoPerc) / 100));
  const imponibile = round2(subTot - scontoVal);
  const ivaVal = round2(imponibile * (parseNum(q.ivaPerc) / 100));
  const tot = round2(imponibile + ivaVal);
  return { subTot: round2(subTot), scontoVal, ivaVal, tot };
}

/* ---------- Print / PDF ---------- */
function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
}
function printQuote(q) {
  const righe = q.righe || q.voci || [];
  const { subTot, scontoVal, ivaVal, tot } = computeTotals(q);
  const rowsHtml = righe.map(r => `<tr><td>${escapeHtml(r.desc)}</td><td style="text-align:right">${r.qty}</td><td style="text-align:right">${formatEuro(r.prezzo)}</td><td style="text-align:right">${formatEuro(parseNum(r.qty) * parseNum(r.prezzo))}</td></tr>`).join("");
  const w = window.open("", "_blank", "width=1024,height=768");
  if (!w) return;
  w.document.write(`<html><head><meta charset="utf-8"/><title>${escapeHtml(q.numero || "")}</title><style>body{font-family:system-ui,sans-serif;padding:24px;color:#111}h1{font-size:20px;margin:0 0 4px}.muted{color:#666}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:8px;border-bottom:1px solid #eee;font-size:13px}.tot{width:280px;margin-left:auto;margin-top:12px}.tot td{border:none;padding:4px 0}</style></head><body><h1>Preventivo ${escapeHtml(q.numero || "")}</h1><div class="muted">Data: ${q.data || ""} — Cliente: ${escapeHtml(q.cliente || "")}</div><table><thead><tr><th>Descrizione</th><th style="text-align:right">Qtà</th><th style="text-align:right">Prezzo</th><th style="text-align:right">Totale</th></tr></thead><tbody>${rowsHtml || '<tr><td colspan="4" class="muted">Nessuna riga</td></tr>'}</tbody></table><table class="tot"><tr><td style="text-align:right">Subtotale</td><td style="text-align:right">${formatEuro(subTot)}</td></tr><tr><td style="text-align:right">Sconto (${q.scontoPerc || 0}%)</td><td style="text-align:right">-${formatEuro(scontoVal)}</td></tr><tr><td style="text-align:right">IVA (${q.ivaPerc || 0}%)</td><td style="text-align:right">${formatEuro(ivaVal)}</td></tr><tr><td style="text-align:right;font-weight:600">Totale</td><td style="text-align:right;font-weight:600">${formatEuro(tot)}</td></tr></table><script>window.print();</script></body></html>`);
  w.document.close(); w.focus();
}
async function printOrExportPDF(q) {
  try {
    if (window.api?.print?.quotePdf) {
      const righe = q.righe || q.voci || [];
      const { subTot, scontoVal, ivaVal, tot } = computeTotals(q);
      const rowsHtml = righe.map(r => `<tr><td>${escapeHtml(r.desc)}</td><td style="text-align:right">${r.qty}</td><td style="text-align:right">${formatEuro(r.prezzo)}</td><td style="text-align:right">${formatEuro(parseNum(r.qty) * parseNum(r.prezzo))}</td></tr>`).join("");
      const html = `<html><head><meta charset="utf-8"/><title>${escapeHtml(q.numero || "Preventivo")}</title><style>body{font-family:system-ui,sans-serif;padding:24px;color:#111}h1{font-size:20px;margin:0 0 4px}.muted{color:#666}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:8px;border-bottom:1px solid #eee;font-size:13px}.tot{width:280px;margin-left:auto;margin-top:12px}.tot td{border:none;padding:4px 0}</style></head><body><h1>Preventivo ${escapeHtml(q.numero || "")}</h1><div class="muted">Data: ${q.data || ""} — Cliente: ${escapeHtml(q.cliente || "")}</div><table><thead><tr><th>Descrizione</th><th style="text-align:right">Qtà</th><th style="text-align:right">Prezzo</th><th style="text-align:right">Totale</th></tr></thead><tbody>${rowsHtml || '<tr><td colspan="4" class="muted">Nessuna riga</td></tr>'}</tbody></table><table class="tot"><tr><td style="text-align:right">Subtotale</td><td style="text-align:right">${formatEuro(subTot)}</td></tr><tr><td style="text-align:right">Sconto (${q.scontoPerc || 0}%)</td><td style="text-align:right">-${formatEuro(scontoVal)}</td></tr><tr><td style="text-align:right">IVA (${q.ivaPerc || 0}%)</td><td style="text-align:right">${formatEuro(ivaVal)}</td></tr><tr><td style="text-align:right;font-weight:600">Totale</td><td style="text-align:right;font-weight:600">${formatEuro(tot)}</td></tr></table>${q.note ? `<p style="margin-top:12px"><b>Note:</b> ${escapeHtml(q.note)}</p>` : ""}</body></html>`;
      const b64 = await window.api.print.quotePdf({ html });
      const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const blob = new Blob([bin], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const safe = String(q.numero || "preventivo").replace(/[^a-z0-9\-_.]/gi, "_") + ".pdf";
      const a = document.createElement("a"); a.href = url; a.download = safe; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
  } catch (e) { console.error("quotePdf failed, fallback to window.print", e); }
  printQuote(q);
}

/* ---------- Status map ---------- */
const STATUS_MAP = {
  bozza:     { label: "Bozza",     cls: "bg-slate-500/10 text-slate-300" },
  inviato:   { label: "Inviato",   cls: "bg-yellow-500/10 text-yellow-400" },
  accettato: { label: "Accettato", cls: "bg-green-500/10 text-green-400" },
  rifiutato: { label: "Rifiutato", cls: "bg-red-500/10 text-red-400" },
  fatturato: { label: "Fatturato", cls: "bg-blue-500/10 text-blue-400" },
};
const Badge = ({ k }) => {
  const c = STATUS_MAP[k] || STATUS_MAP.bozza;
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${c.cls}`}>{c.label}</span>;
};

/* ---------- Mapping helper (camel ⇄ snake) ---------- */
const s2q = (r) => ({
  id: r.id, orgId: r.org_id, clientId: r.client_id ?? null,
  cliente: r.cliente ?? "", numero: r.numero ?? "", data: r.data ?? null,
  importo: Number(r.importo ?? 0), stato: r.stato ?? "bozza", valuta: r.valuta ?? "EUR",
  voci: Array.isArray(r.voci) ? r.voci : (() => { try { return JSON.parse(r.voci || "[]"); } catch { return []; } })(),
  note: r.note ?? "", scontoPerc: r.sconto_perc ?? 0, ivaPerc: r.iva_perc ?? 22,
});

/* ---------- Skeleton row ---------- */
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-3 py-2"><div className="w-4 h-4 bg-[#243044] rounded" /></td>
    <td className="px-3 py-2"><div className="h-3 w-20 bg-[#243044] rounded" /></td>
    <td className="px-3 py-2"><div className="h-3 w-16 bg-[#243044] rounded" /></td>
    <td className="px-3 py-2"><div className="h-3 w-28 bg-[#243044] rounded" /></td>
    <td className="px-3 py-2"><div className="h-3 w-16 bg-[#243044] rounded" /></td>
    <td className="px-3 py-2"><div className="h-3 w-14 bg-[#243044] rounded" /></td>
    <td className="px-3 py-2"><div className="h-3 w-20 bg-[#243044] rounded" /></td>
  </tr>
);

/* ===================================================== */

export default function Quotes() {
  const navigate = useNavigate();
  const { orgId } = useOrg();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("tutti");
  const [page, setPage] = useState(1);
  const perPage = 20;

  // confirm
  const [confirm, setConfirm] = useState(null);

  // feature flag se tabella quotes manca
  const [quotesEnabled, setQuotesEnabled] = useState(true);

  /* ---------- Fetch ---------- */
  useEffect(() => {
    if (!orgId) { setRows([]); setLoading(false); return; }
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("quotes")
          .select("id, org_id, client_id, cliente, numero, data, importo, stato, valuta, voci, note, sconto_perc, iva_perc")
          .eq("org_id", orgId)
          .order("data", { ascending: false, nullsFirst: false })
          .order("id", { ascending: false });
        if (error) throw error;
        setRows((data || []).map(s2q));
        setQuotesEnabled(true);
      } catch (e) {
        if (tableMissing(e)) {
          console.warn("[quotes] tabella non trovata → fallback localStorage");
          try { const d = JSON.parse(localStorage.getItem("dev:quotes") || "[]"); setRows(d.map(s2q)); } catch { setRows([]); }
          setQuotesEnabled(false);
        } else {
          console.error("quotes load failed", e);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [orgId]);

  /* ---------- Realtime ---------- */
  useEffect(() => {
    if (!orgId || !quotesEnabled) return;
    const ch = supabase.channel(`quotes-rt:${orgId}`).on(
      "postgres_changes",
      { event: "*", schema: "public", table: "quotes", filter: `org_id=eq.${orgId}` },
      async () => {
        const { data } = await supabase
          .from("quotes")
          .select("id, org_id, client_id, cliente, numero, data, importo, stato, valuta, voci, note, sconto_perc, iva_perc")
          .eq("org_id", orgId)
          .order("data", { ascending: false, nullsFirst: false })
          .order("id", { ascending: false });
        setRows((data || []).map(s2q));
      }
    );
    ch.subscribe();
    return () => supabase.removeChannel(ch);
  }, [orgId, quotesEnabled]);

  /* ---------- Filter ---------- */
  const filtered = useMemo(() => {
    let l = rows;
    if (tab !== "tutti") l = l.filter(r => r.stato === tab);
    if (q.trim()) {
      const qq = q.toLowerCase();
      l = l.filter(r => (r.cliente || "").toLowerCase().includes(qq) || (r.numero || "").toLowerCase().includes(qq));
    }
    return l;
  }, [rows, q, tab]);

  /* ---------- Tab counts ---------- */
  const counts = useMemo(() => {
    const c = { tutti: rows.length, bozza: 0, inviato: 0, accettato: 0, rifiutato: 0, fatturato: 0 };
    rows.forEach(r => { if (c[r.stato] !== undefined) c[r.stato]++; });
    return c;
  }, [rows]);

  /* ---------- Pagination ---------- */
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  /* ---------- Multi-select ---------- */
  const ms = useMultiSelect(paginated);

  /* ---------- Delete ---------- */
  const elimina = async (id) => {
    try {
      if (quotesEnabled && orgId) {
        await supabase.from("quotes").delete().eq("id", id).eq("org_id", orgId);
      }
      setRows(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error("quotes.remove failed", e);
    }
    setConfirm(null);
  };

  const bulkDelete = async () => {
    const ids = ms.getSelectedIds();
    if (!ids.length) return;
    try {
      if (quotesEnabled && orgId) {
        await supabase.from("quotes").delete().in("id", ids).eq("org_id", orgId);
      }
      setRows(prev => prev.filter(r => !ids.includes(r.id)));
      ms.reset();
    } catch (e) {
      console.error("bulk delete failed", e);
    }
    setConfirm(null);
  };

  /* ---------- CSV export ---------- */
  const exportCSV = (items) => {
    const headers = ["Numero", "Data", "Cliente", "Stato", "Totale"];
    const csvRows = items.map(r => {
      const { tot } = computeTotals({ ...r, righe: r.voci || [] });
      return [r.numero || "", r.data || "", r.cliente || "", r.stato || "", tot];
    });
    const csv = [headers, ...csvRows].map(row => row.map(c => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `preventivi_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  /* ---------- Tabs config ---------- */
  const TABS = [
    { key: "tutti", label: "Tutti" },
    { key: "bozza", label: "Bozza" },
    { key: "inviato", label: "Inviati" },
    { key: "accettato", label: "Accettati" },
    { key: "rifiutato", label: "Rifiutati" },
    { key: "fatturato", label: "Fatturati" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Preventivi</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gestisci i preventivi della tua organizzazione</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-3.5 h-3.5" />
            <input
              value={q}
              onChange={e => { setQ(e.target.value); setPage(1); }}
              placeholder="Cerca numero, cliente..."
              className="pl-9 pr-3 py-1.5 w-64 text-xs bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none"
            />
          </div>
          <button
            onClick={() => navigate("/preventivi/nuovo")}
            disabled={!orgId}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            <FiPlus className="w-3.5 h-3.5" />
            Nuovo Preventivo
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {TABS.map(t => {
          const cnt = counts[t.key] || 0;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(1); ms.reset(); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                active ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" : "text-slate-400 hover:text-slate-200 hover:bg-[#1a2536] border border-transparent"
              }`}
            >
              {t.label}
              {cnt > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${active ? "bg-blue-500/20 text-blue-300" : "bg-[#243044] text-slate-500"}`}>
                  {cnt}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Multi-select actions */}
      {ms.selectedCount > 0 && (
        <MultiSelectActions
          count={ms.selectedCount}
          onClear={ms.reset}
          actions={[
            {
              label: "Esporta CSV",
              icon: FiFileText,
              onClick: () => exportCSV(ms.selectedItems),
            },
            {
              label: "Elimina",
              icon: FiTrash2,
              variant: "danger",
              onClick: () => setConfirm({ type: "bulk" }),
            },
          ]}
        />
      )}

      {/* Table */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#243044]">
              <th className="px-3 py-2 text-left w-8">
                <SelectableCheckbox
                  checked={ms.isAllSelected}
                  indeterminate={ms.isSomeSelected}
                  onChange={ms.toggleSelectAll}
                />
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Numero</th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Data</th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Totale</th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Stato</th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#243044]/50">
            {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

            {!loading && paginated.map(r => {
              const { tot } = computeTotals({ ...r, righe: r.voci || [] });
              return (
                <tr key={r.id} className="hover:bg-[#141c27] transition-colors group">
                  <td className="px-3 py-2">
                    <SelectableCheckbox
                      checked={ms.isSelected(r)}
                      onChange={() => ms.toggleSelect(r)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => navigate(`/preventivi/${r.id}`)}
                      className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {r.numero || `#${r.id}`}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400">{r.data || "—"}</td>
                  <td className="px-3 py-2 text-xs text-slate-200 truncate max-w-[200px]">{r.cliente || "—"}</td>
                  <td className="px-3 py-2 text-xs text-slate-200 text-right font-medium">{formatEuro(tot)}</td>
                  <td className="px-3 py-2"><Badge k={r.stato} /></td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => navigate(`/preventivi/${r.id}`)} className="p-1 text-slate-400 hover:text-blue-400 transition-colors" title="Modifica">
                        <FiEdit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => navigate(`/preventivi/nuovo?duplicate=${r.id}`)} className="p-1 text-slate-400 hover:text-slate-200 transition-colors" title="Duplica">
                        <FiCopy className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => printOrExportPDF({ ...r, righe: r.voci || [] })} className="p-1 text-slate-400 hover:text-green-400 transition-colors" title="Stampa/PDF">
                        <FiPrinter className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setConfirm({ type: "single", id: r.id, label: r.numero || `#${r.id}` })} className="p-1 text-slate-400 hover:text-red-400 transition-colors" title="Elimina">
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <FiFileText className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium mb-1">Nessun preventivo</p>
            <p className="text-xs mb-4">
              {q.trim() ? "Nessun risultato per la ricerca" : "Crea il tuo primo preventivo"}
            </p>
            {!q.trim() && (
              <button
                onClick={() => navigate("/preventivi/nuovo")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <FiPlus className="w-3.5 h-3.5" />
                Nuovo Preventivo
              </button>
            )}
          </div>
        )}

        {/* Pagination footer */}
        {!loading && filtered.length > perPage && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-[#243044] text-xs text-slate-500">
            <span>{filtered.length} preventivi · pagina {safePage}/{totalPages}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1} className="p-1 rounded hover:bg-[#243044] disabled:opacity-30 transition-colors">
                <FiChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p;
                if (totalPages <= 5) p = i + 1;
                else if (safePage <= 3) p = i + 1;
                else if (safePage >= totalPages - 2) p = totalPages - 4 + i;
                else p = safePage - 2 + i;
                return (
                  <button key={p} onClick={() => setPage(p)} className={`px-2 py-0.5 rounded text-xs transition-colors ${safePage === p ? "bg-blue-600 text-white" : "hover:bg-[#243044]"}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="p-1 rounded hover:bg-[#243044] disabled:opacity-30 transition-colors">
                <FiChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirm(null)} />
          <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-4">
            <div className="font-medium mb-2">
              {confirm.type === "bulk" ? `Elimina ${ms.selectedCount} preventivi` : "Elimina preventivo"}
            </div>
            <div className="text-xs text-slate-400 mb-4">
              {confirm.type === "bulk"
                ? `Sei sicuro di voler eliminare ${ms.selectedCount} preventivi selezionati? Questa azione non può essere annullata.`
                : `Sei sicuro di voler eliminare il preventivo "${confirm.label}"? Questa azione non può essere annullata.`}
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1.5 text-xs text-slate-300 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors" onClick={() => setConfirm(null)}>Annulla</button>
              <button className="px-3 py-1.5 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors" onClick={() => confirm.type === "bulk" ? bulkDelete() : elimina(confirm.id)}>Elimina</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}