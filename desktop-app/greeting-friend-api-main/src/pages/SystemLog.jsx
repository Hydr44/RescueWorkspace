// src/pages/SystemLog.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { FiTrash2, FiRefreshCcw, FiDownload, FiCopy, FiSearch, FiChevronDown, FiAlertCircle, FiInfo } from "react-icons/fi";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";

const isElectron = typeof window !== "undefined" && !!window.api;

/* ----------------------------- API detection ----------------------------- */
// Prova più possibili “canali” IPC esposti dal preload
function detectLogAPI() {
  const cand = [
    window.api?.log,
    window.api?.systemLog,
    window.api?.logger,
    // alcuni preload espongono i metodi direttamente su window.api
    (window.api && typeof window.api.listLogs === "function" && {
      list: window.api.listLogs, clear: window.api.clearLogs, onAppend: window.api.onLogAppend
    }) || null,
  ].filter(Boolean);
  return cand[0] || null;
}

const hasLogAPI = isElectron && !!detectLogAPI();

// Fallback in browser: usa localStorage "dev:syslog"
const browserLogAPI = {
  async list() {
    try { return JSON.parse(localStorage.getItem("dev:syslog") || "[]"); } catch { return []; }
  },
  async clear() {
    try { localStorage.setItem("dev:syslog", "[]"); } catch {}
    return { ok: true };
  },
  async append(entry) {
    try {
      const cur = JSON.parse(localStorage.getItem("dev:syslog") || "[]");
      cur.push(entry);
      localStorage.setItem("dev:syslog", JSON.stringify(cur).slice(0, 5_000_000)); // evita crescite infinite
    } catch {}
  }
};

/* ------------------------------ Normalizzazione ------------------------------ */
function toEntry(raw) {
  // Stringa → {ts,lvl,msg}
  if (typeof raw === "string") {
    return { ts: new Date().toISOString(), lvl: "INFO", msg: raw };
  }
  // {msg | message}, {lvl | level | severity}, {ts | timestamp | date}
  const msg = raw?.msg ?? raw?.message ?? raw?.text ?? "";
  const lvl = (raw?.lvl ?? raw?.level ?? raw?.severity ?? "INFO").toString().toUpperCase();
  const tsRaw = raw?.ts ?? raw?.timestamp ?? raw?.date ?? Date.now();
  let ts;
  try {
    if (typeof tsRaw === "number") ts = new Date(tsRaw).toISOString();
    else ts = new Date(tsRaw).toISOString();
  } catch {
    ts = new Date().toISOString();
  }
  return { ts, lvl, msg };
}

function formatLine(l) {
  const ts = l.ts || "";
  const up = (l.lvl || "INFO").toUpperCase();
  const msg = l.msg || "";
  return `${ts} [${up}] ${msg}`;
}

/* --------------------------------- Pagina --------------------------------- */
export default function SystemLog() {
  const { orgId } = useOrg();
  const supabase = supabaseBrowser();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState("ALL"); // ALL | INFO | WARN | ERROR
  const [q, setQ] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [polling, setPolling] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [useSupabase, setUseSupabase] = useState(true);

  const endRef = useRef(null);
  const api = hasLogAPI ? detectLogAPI() : browserLogAPI;

  // Carica lista (tollerante a formati diversi)
  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.list();
      // Se l’API restituisce {entries: [...]}
      const arr = Array.isArray(data) ? data : (Array.isArray(data?.entries) ? data.entries : []);
      setLogs(arr.map(toEntry));
    } catch (err) {
      console.error("log.list error", err);
      alert("Errore caricando i log");
    } finally {
      setLoading(false);
    }
  };

  // init + subscribe / polling
  useEffect(() => {
    let unsub = null;
    let timer = null;

    (async () => {
      await loadLogs();

      // real-time: canali conosciuti
      try {
        if (isElectron) {
          // se l’oggetto API ha onAppend nativa
          if (api?.onAppend && typeof api.onAppend === "function") {
            unsub = api.onAppend((entry) => setLogs(prev => [...prev, toEntry(entry)]));
            return;
          }
          // eventi “generici” dal preload
          const on = window.api?.on;
          const off = window.api?.off;
          const candidates = ["log:append", "logger:append", "system:log"];
          if (typeof on === "function") {
            const handler = (_evt, entry) => setLogs(prev => [...prev, toEntry(entry)]);
            candidates.forEach(ev => { try { on(ev, handler); } catch {} });
            unsub = () => candidates.forEach(ev => { try { off?.(ev, handler); } catch {} });
            return;
          }
        }

        // Fallback: polling ogni 3s
        setPolling(true);
        timer = setInterval(loadLogs, 3000);
      } catch {
        setPolling(true);
        timer = setInterval(loadLogs, 3000);
      }
    })();

    return () => {
      if (typeof unsub === "function") try { unsub(); } catch {}
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // In ambiente browser: cattura errori JS per avere qualcosa da vedere
  useEffect(() => {
    if (isElectron) return;
    const onErr = (e) => browserLogAPI.append(toEntry({ level: "ERROR", message: String(e?.message || e), timestamp: Date.now() }));
    const onRej = (e) => browserLogAPI.append(toEntry({ level: "ERROR", message: "UnhandledRejection: " + String(e?.reason || e), timestamp: Date.now() }));
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);

  // auto-scroll a fondo
  useEffect(() => {
    if (!autoScroll) return;
    const t = setTimeout(() => endRef.current?.scrollIntoView({ block: "end" }), 0);
    return () => clearTimeout(t);
  }, [logs, autoScroll]);

  const clearLogs = async () => {
    if (!confirm("Vuoi davvero svuotare i log?")) return;
    try {
      if (typeof api.clear === "function") await api.clear();
      setLogs([]);
    } catch (err) {
      console.error("log.clear error", err);
      alert("Errore svuotando i log");
    }
  };

  const filtered = useMemo(() => {
    let l = logs;
    if (level !== "ALL") l = l.filter((x) => (x.lvl || "").toUpperCase() === level);
    if (q.trim()) {
      const qq = q.toLowerCase();
      l = l.filter((x) =>
        (x.msg || "").toLowerCase().includes(qq) ||
        (x.ts || "").toLowerCase().includes(qq) ||
        (x.lvl || "").toLowerCase().includes(qq)
      );
    }
    return l;
  }, [logs, level, q]);

  const stats = useMemo(() => {
    const total = logs.length;
    const errors = logs.filter(l => (l.lvl || "").toUpperCase() === "ERROR").length;
    const warnings = logs.filter(l => (l.lvl || "").toUpperCase() === "WARN").length;
    const infos = logs.filter(l => (l.lvl || "").toUpperCase() === "INFO").length;
    return { total, errors, warnings, infos };
  }, [logs]);

  const exportTxt = () => {
    const lines = filtered.map(formatLine).join("\n");
    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "system.log.txt";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copyAll = async () => {
    try {
      const lines = filtered.map(formatLine).join("\n");
      await navigator.clipboard.writeText(lines);
      alert("Log copiati negli appunti");
    } catch {
      alert("Copia non riuscita");
    }
  };

  function levelChip(lvl) {
    const up = (lvl || "").toUpperCase();
    const cls =
      up === "WARN" ? "chip chip-amber" :
      up === "ERROR" ? "chip chip-red" :
      "chip chip-emerald";
    return <span className={cls}>[{up || "INFO"}]</span>;
  }

  // chiudi menu livello cliccando fuori
  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => {
      const trg = e.target.closest?.("[data-level-menu]");
      if (!trg) setMenuOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [menuOpen]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Log di sistema</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <FiSearch className="absolute left-2 top-2.5 text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca…"
              className="pl-8 pr-3 h-10 w-56 rounded-lg border border-[#243044] bg-[#1a2536] outline-none focus:ring-2 ring-blue-500/40 text-sm"
            />
          </div>

          {/* filtro livello */}
          <div className="relative" data-level-menu>
            <button
              className="btn btn-outline h-10"
              onClick={() => setMenuOpen(v => !v)}
              title="Filtra livello"
            >
              <FiChevronDown /> Livello: {level}
            </button>
            <div className={`absolute right-0 mt-1 w-44 rounded-md border border-[#243044] bg-[#1a2536]  z-10 ${menuOpen ? "" : "hidden"}`}>
              {["ALL", "INFO", "WARN", "ERROR"].map((s) => (
                <button
                  key={s}
                  className="w-full text-left px-3 py-2 hover:bg-[#141c27]"
                  onClick={() => { setLevel(s); setMenuOpen(false); }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-outline" onClick={loadLogs}>
            <FiRefreshCcw className="h-4 w-4" />
            Aggiorna
          </button>

          <button className="btn btn-outline" onClick={copyAll} title="Copia i log filtrati">
            <FiCopy className="h-4 w-4" />
            Copia
          </button>

          <button className="btn btn-outline" onClick={exportTxt} title="Esporta TXT">
            <FiDownload className="h-4 w-4" />
            Esporta
          </button>

          <button className="btn btn-outline btn-outline-red" onClick={clearLogs} title="Svuota log">
            <FiTrash2 className="h-4 w-4" />
            Svuota
          </button>
        </div>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#243044] bg-[#1a2536] p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <FiInfo className="h-4 w-4" />
            <span>Totale</span>
          </div>
          <div className="text-2xl font-semibold">{stats.total}</div>
        </div>
        <div className="rounded-xl border border-[#243044] bg-[#1a2536] p-4">
          <div className="flex items-center gap-2 text-sm text-emerald-600 mb-1">
            <FiInfo className="h-4 w-4" />
            <span>Info</span>
          </div>
          <div className="text-2xl font-semibold text-emerald-600">{stats.infos}</div>
        </div>
        <div className="rounded-xl border border-[#243044] bg-[#1a2536] p-4">
          <div className="flex items-center gap-2 text-sm text-amber-600 mb-1">
            <FiAlertCircle className="h-4 w-4" />
            <span>Warning</span>
          </div>
          <div className="text-2xl font-semibold text-amber-600">{stats.warnings}</div>
        </div>
        <div className="rounded-xl border border-[#243044] bg-[#1a2536] p-4">
          <div className="flex items-center gap-2 text-sm text-red-600 mb-1">
            <FiAlertCircle className="h-4 w-4" />
            <span>Errori</span>
          </div>
          <div className="text-2xl font-semibold text-red-600">{stats.errors}</div>
        </div>
      </div>

      {/* Stato polling/autoscroll */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
          />
          Auto-scroll
        </label>
        {polling && <span>Aggiornamento automatico ogni 3s (polling)</span>}
        {loading && <span>Caricamento…</span>}
        <span className="ml-auto">Filtrati: {filtered.length} / {logs.length}</span>
      </div>

      {/* Log viewer */}
      <div className="rounded-xl border border-[#243044] bg-black text-slate-200 p-4 font-mono text-xs overflow-auto max-h-[60vh]">
        {!loading && filtered.length === 0 && (
          <div className="text-slate-500">Nessun log presente.</div>
        )}
        {filtered.map((l, i) => (
          <div key={i} className="py-0.5 flex items-start gap-2 hover:bg-[#141c27]/50">
            <span className="text-slate-500 shrink-0">{l.ts || ""}</span>
            {levelChip(l.lvl)}
            <span className="whitespace-pre-wrap break-words">{l.msg || ""}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}