/**
 * AccountingDashboard — Design L aligned
 * Dashboard contabile: bilancio, scadenzario, registri IVA, prima nota
 *
 * Route: /contabilita
 */

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import {
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiFileText,
  FiCalendar, FiAlertCircle, FiX, FiChevronRight,
  FiBookOpen, FiCreditCard, FiRefreshCw, FiArrowUpRight,
  FiArrowDownRight, FiClock, FiCheckCircle, FiAlertTriangle
} from "react-icons/fi";

/* ─── Helpers ─── */
const EUR = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
};
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtMonth = (iso) => iso ? new Date(iso).toLocaleDateString("it-IT", { month: "long", year: "numeric" }) : "—";

const MONTHS_IT = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

export default function AccountingDashboard() {
  const navigate = useNavigate();
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Data
  const [entries, setEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [invoiceDues, setInvoiceDues] = useState([]);

  // Periodo
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  useEffect(() => {
    if (orgId) loadAll();
  }, [orgId, year]); // eslint-disable-line

  async function loadAll() {
    try {
      setRefreshing(true);
      setError(null);

      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const [entriesRes, accountsRes, invoicesRes, duesRes] = await Promise.all([
        supabase
          .from("accounting_entries")
          .select("*")
          .eq("org_id", orgId)
          .gte("accounting_date", startDate)
          .lte("accounting_date", endDate)
          .order("accounting_date", { ascending: false }),
        supabase
          .from("chart_of_accounts")
          .select("*")
          .eq("org_id", orgId)
          .eq("is_active", true)
          .order("code"),
        supabase
          .from("invoices")
          .select("id, number, date, total, payment_status, customer_name, sdi_status, meta")
          .eq("org_id", orgId)
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: false }),
        supabase
          .from("invoice_due")
          .select("*, invoice:invoices!inner(id, number, customer_name, total, org_id)")
          .eq("invoice.org_id", orgId)
          .order("due_date", { ascending: true }),
      ]);

      if (entriesRes.error) throw entriesRes.error;
      if (accountsRes.error) throw accountsRes.error;

      setEntries(entriesRes.data || []);
      setAccounts(accountsRes.data || []);
      setInvoices(invoicesRes.data || []);
      setInvoiceDues(duesRes.data || []);
    } catch (err) {
      console.error("Errore caricamento dashboard contabile:", err);
      setError("Errore caricamento dati contabili.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // ── Calcoli bilancio ──
  const bilancio = useMemo(() => {
    const accountMap = {};
    accounts.forEach(a => { accountMap[a.code] = a; });

    let totaleDare = 0;
    let totaleAvere = 0;
    let ricavi = 0;
    let costi = 0;
    let ivaDebito = 0;
    let ivaCredito = 0;

    // Saldi per conto
    const saldi = {};

    entries.forEach(e => {
      const d = Number(e.debit_amount || 0);
      const c = Number(e.credit_amount || 0);
      totaleDare += d;
      totaleAvere += c;

      const acc = accountMap[e.account_code];
      const cat = acc?.category || "";

      if (cat === "revenue") ricavi += c - d;
      if (cat === "expense") costi += d - c;
      if (e.account_code === "2001") ivaDebito += c - d;
      if (e.account_code === "2002") ivaCredito += d - c;

      if (!saldi[e.account_code]) {
        saldi[e.account_code] = { code: e.account_code, name: e.account_name || acc?.name || e.account_code, category: cat, dare: 0, avere: 0 };
      }
      saldi[e.account_code].dare += d;
      saldi[e.account_code].avere += c;
    });

    const utile = ricavi - costi;
    const ivaLiquidazione = ivaDebito - ivaCredito;
    const isBalanced = Math.abs(totaleDare - totaleAvere) < 0.01;

    // Top conti per saldo
    const topConti = Object.values(saldi)
      .map(s => ({ ...s, saldo: Math.abs(s.dare - s.avere) }))
      .sort((a, b) => b.saldo - a.saldo)
      .slice(0, 8);

    return { totaleDare, totaleAvere, ricavi, costi, utile, ivaDebito, ivaCredito, ivaLiquidazione, isBalanced, topConti };
  }, [entries, accounts]);

  // ── Andamento mensile ──
  const monthlyTrend = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i, label: MONTHS_IT[i], ricavi: 0, costi: 0
    }));

    const accountMap = {};
    accounts.forEach(a => { accountMap[a.code] = a; });

    entries.forEach(e => {
      if (!e.accounting_date) return;
      const m = new Date(e.accounting_date).getMonth();
      const acc = accountMap[e.account_code];
      const cat = acc?.category || "";
      const d = Number(e.debit_amount || 0);
      const c = Number(e.credit_amount || 0);
      if (cat === "revenue") months[m].ricavi += c - d;
      if (cat === "expense") months[m].costi += d - c;
    });

    const maxVal = Math.max(...months.map(m => Math.max(m.ricavi, m.costi)), 1);
    return { months, maxVal };
  }, [entries, accounts]);

  // ── Scadenzario ──
  const scadenzario = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

    // From invoice_due
    const scadute = invoiceDues.filter(d => d.due_date < today && d.status !== "paid");
    const inScadenza = invoiceDues.filter(d => d.due_date >= today && d.due_date <= in30 && d.status !== "paid");
    const future = invoiceDues.filter(d => d.due_date > in30 && d.status !== "paid");

    // Also from invoices without due dates
    const unpaidInvoices = invoices.filter(i =>
      i.payment_status !== "paid" && i.payment_status !== "cancelled"
    );

    const totaleScaduto = scadute.reduce((s, d) => s + Number(d.amount || 0), 0);
    const totaleInScadenza = inScadenza.reduce((s, d) => s + Number(d.amount || 0), 0);
    const totaleFuturo = future.reduce((s, d) => s + Number(d.amount || 0), 0);

    return { scadute, inScadenza, future, totaleScaduto, totaleInScadenza, totaleFuturo, unpaidInvoices };
  }, [invoiceDues, invoices]);

  // ── Registri IVA ──
  const registriIVA = useMemo(() => {
    const vendite = entries.filter(e => e.document_type === "invoice" && e.account_code === "2001");
    const acquisti = entries.filter(e =>
      (e.document_type === "foreign_invoice" || e.document_type === "purchase") && e.account_code === "2002"
    );

    const totaleVendite = vendite.reduce((s, e) => s + Number(e.credit_amount || 0) - Number(e.debit_amount || 0), 0);
    const totaleAcquisti = acquisti.reduce((s, e) => s + Number(e.debit_amount || 0) - Number(e.credit_amount || 0), 0);

    return { vendite, acquisti, totaleVendite, totaleAcquisti };
  }, [entries]);

  // ── Fatture stats ──
  const invoiceStats = useMemo(() => {
    const total = invoices.length;
    const paid = invoices.filter(i => i.payment_status === "paid").length;
    const pending = invoices.filter(i => i.payment_status === "pending").length;
    const overdue = invoices.filter(i => i.payment_status === "overdue").length;
    const totalAmount = invoices.reduce((s, i) => s + Number(i.total || 0), 0);
    const paidAmount = invoices.filter(i => i.payment_status === "paid").reduce((s, i) => s + Number(i.total || 0), 0);

    return { total, paid, pending, overdue, totalAmount, paidAmount };
  }, [invoices]);

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div><div className="h-5 w-56 bg-[#243044] rounded mb-1.5" /><div className="h-3 w-80 bg-[#1a2536] rounded" /></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-[#1a2536] rounded-xl border border-[#243044]" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 bg-[#1a2536] rounded-xl border border-[#243044]" />
          <div className="h-64 bg-[#1a2536] rounded-xl border border-[#243044]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Contabilità</h1>
          <p className="text-xs text-slate-500 mt-0.5">Panoramica contabile {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="h-8 px-2 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 outline-none">
            {[currentYear, currentYear - 1, currentYear - 2].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={loadAll} disabled={refreshing}
            className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition disabled:opacity-50">
            <FiRefreshCw className={`w-3.5 h-3.5 inline mr-1 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "..." : "Aggiorna"}
          </button>
        </div>
      </div>

      {/* ── Errore ── */}
      {error && (
        <div className="bg-red-500/5 rounded-xl border border-red-500/15 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <FiAlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-xs text-red-400 flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300"><FiX className="w-3 h-3" /></button>
          </div>
        </div>
      )}

      {/* ── KPI principali ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Ricavi */}
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <FiTrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <FiArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-semibold text-slate-100">{EUR(bilancio.ricavi)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Ricavi {year}</div>
        </div>

        {/* Costi */}
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-red-500/30 transition">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <FiTrendingDown className="w-4 h-4 text-red-400" />
            </div>
            <FiArrowDownRight className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-lg font-semibold text-slate-100">{EUR(bilancio.costi)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Costi {year}</div>
        </div>

        {/* Utile/Perdita */}
        <div className={`bg-[#1a2536] rounded-xl border p-4 transition ${bilancio.utile >= 0 ? "border-emerald-500/30" : "border-red-500/30"}`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bilancio.utile >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
              <FiDollarSign className={`w-4 h-4 ${bilancio.utile >= 0 ? "text-emerald-400" : "text-red-400"}`} />
            </div>
          </div>
          <div className={`text-lg font-semibold ${bilancio.utile >= 0 ? "text-emerald-400" : "text-red-400"}`}>{EUR(bilancio.utile)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{bilancio.utile >= 0 ? "Utile" : "Perdita"} {year}</div>
        </div>

        {/* IVA Liquidazione */}
        <div className={`bg-[#1a2536] rounded-xl border p-4 transition ${bilancio.ivaLiquidazione >= 0 ? "border-amber-500/30" : "border-blue-500/30"}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <FiCreditCard className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className={`text-lg font-semibold ${bilancio.ivaLiquidazione >= 0 ? "text-amber-400" : "text-blue-400"}`}>
            {EUR(Math.abs(bilancio.ivaLiquidazione))}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            IVA {bilancio.ivaLiquidazione >= 0 ? "da versare" : "a credito"}
          </div>
        </div>
      </div>

      {/* ── Riga 2: Andamento + Scadenzario ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Andamento mensile (mini bar chart) */}
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#243044]">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Andamento Mensile</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-[10px] text-slate-500">Ricavi</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400" /><span className="text-[10px] text-slate-500">Costi</span></div>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-end gap-1 h-32">
              {monthlyTrend.months.map((m, i) => {
                const hR = monthlyTrend.maxVal > 0 ? (m.ricavi / monthlyTrend.maxVal) * 100 : 0;
                const hC = monthlyTrend.maxVal > 0 ? (m.costi / monthlyTrend.maxVal) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${m.label}: Ricavi ${EUR(m.ricavi)}, Costi ${EUR(m.costi)}`}>
                    <div className="w-full flex gap-px justify-center" style={{ height: "100px", alignItems: "flex-end" }}>
                      <div className="w-[5px] rounded-t bg-emerald-500/60 transition-all" style={{ height: `${Math.max(hR, 2)}%` }} />
                      <div className="w-[5px] rounded-t bg-red-500/60 transition-all" style={{ height: `${Math.max(hC, 2)}%` }} />
                    </div>
                    <span className="text-[8px] text-slate-600">{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scadenzario */}
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#243044]">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scadenzario</h3>
            <button onClick={() => navigate("/fatture")} className="text-[10px] text-blue-400 hover:text-blue-300 transition flex items-center gap-0.5">
              Vedi tutte <FiChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-5 space-y-3">
            {/* Scadute */}
            {scadenzario.scadute.length > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/15">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <FiAlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-red-400">{scadenzario.scadute.length} scadenze scadute</div>
                  <div className="text-[10px] text-red-400/70">Totale: {EUR(scadenzario.totaleScaduto)}</div>
                </div>
              </div>
            )}

            {/* In scadenza */}
            {scadenzario.inScadenza.length > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <FiClock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-amber-400">{scadenzario.inScadenza.length} in scadenza (30gg)</div>
                  <div className="text-[10px] text-amber-400/70">Totale: {EUR(scadenzario.totaleInScadenza)}</div>
                </div>
              </div>
            )}

            {/* Future */}
            {scadenzario.future.length > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/15">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <FiCalendar className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-blue-400">{scadenzario.future.length} scadenze future</div>
                  <div className="text-[10px] text-blue-400/70">Totale: {EUR(scadenzario.totaleFuturo)}</div>
                </div>
              </div>
            )}

            {scadenzario.scadute.length === 0 && scadenzario.inScadenza.length === 0 && scadenzario.future.length === 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                <FiCheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-400">Nessuna scadenza in sospeso</span>
              </div>
            )}

            {/* Prossime scadenze dettaglio */}
            {scadenzario.inScadenza.slice(0, 3).map((d, i) => (
              <div key={d.id || i} className="flex items-center justify-between py-1.5 border-t border-[#243044]/40 first:border-0">
                <div className="min-w-0">
                  <div className="text-xs text-slate-300 truncate">{d.invoice?.customer_name || "—"}</div>
                  <div className="text-[10px] text-slate-600">Fatt. {d.invoice?.number || "—"} · Scad. {fmtDate(d.due_date)}</div>
                </div>
                <div className="text-xs font-medium text-amber-400 flex-shrink-0 ml-3">{EUR(d.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Riga 3: Registri IVA + Fatture ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Registri IVA */}
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#243044]">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registri IVA</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[#141c27] border border-[#243044]">
                <div className="text-[10px] text-slate-500 mb-1">IVA Vendite (debito)</div>
                <div className="text-sm font-semibold text-amber-400">{EUR(bilancio.ivaDebito)}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{registriIVA.vendite.length} registrazioni</div>
              </div>
              <div className="p-3 rounded-lg bg-[#141c27] border border-[#243044]">
                <div className="text-[10px] text-slate-500 mb-1">IVA Acquisti (credito)</div>
                <div className="text-sm font-semibold text-blue-400">{EUR(bilancio.ivaCredito)}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{registriIVA.acquisti.length} registrazioni</div>
              </div>
            </div>
            <div className={`p-3 rounded-lg border ${bilancio.ivaLiquidazione >= 0 ? "bg-amber-500/5 border-amber-500/15" : "bg-blue-500/5 border-blue-500/15"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500">Liquidazione IVA</div>
                  <div className={`text-sm font-semibold ${bilancio.ivaLiquidazione >= 0 ? "text-amber-400" : "text-blue-400"}`}>
                    {EUR(Math.abs(bilancio.ivaLiquidazione))}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                  bilancio.ivaLiquidazione >= 0 ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
                }`}>
                  {bilancio.ivaLiquidazione >= 0 ? "Da versare" : "A credito"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fatture overview */}
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#243044]">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fatture {year}</h3>
            <button onClick={() => navigate("/fatture")} className="text-[10px] text-blue-400 hover:text-blue-300 transition flex items-center gap-0.5">
              Gestisci <FiChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[#141c27] border border-[#243044]">
                <div className="text-[10px] text-slate-500 mb-1">Fatturato</div>
                <div className="text-sm font-semibold text-slate-100">{EUR(invoiceStats.totalAmount)}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#141c27] border border-[#243044]">
                <div className="text-[10px] text-slate-500 mb-1">Incassato</div>
                <div className="text-sm font-semibold text-emerald-400">{EUR(invoiceStats.paidAmount)}</div>
              </div>
            </div>
            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-slate-500">Tasso incasso</span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {invoiceStats.totalAmount > 0 ? Math.round((invoiceStats.paidAmount / invoiceStats.totalAmount) * 100) : 0}%
                </span>
              </div>
              <div className="h-1.5 bg-[#243044] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${invoiceStats.totalAmount > 0 ? (invoiceStats.paidAmount / invoiceStats.totalAmount) * 100 : 0}%` }} />
              </div>
            </div>
            {/* Stats row */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-slate-500">Pagate: {invoiceStats.paid}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[10px] text-slate-500">In attesa: {invoiceStats.pending}</span>
              </div>
              {invoiceStats.overdue > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-[10px] text-slate-500">Scadute: {invoiceStats.overdue}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Riga 4: Saldi per conto (bilancio di verifica) ── */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#243044]">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bilancio di Verifica — Top Conti</h3>
          <button onClick={() => navigate("/contabilita/movimenti")} className="text-[10px] text-blue-400 hover:text-blue-300 transition flex items-center gap-0.5">
            Tutti i movimenti <FiChevronRight className="w-3 h-3" />
          </button>
        </div>
        {bilancio.topConti.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#141c27]">
                  <th className="px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Conto</th>
                  <th className="px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Categoria</th>
                  <th className="px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">Dare</th>
                  <th className="px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">Avere</th>
                  <th className="px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243044]/60">
                {bilancio.topConti.map(c => {
                  const saldo = c.dare - c.avere;
                  return (
                    <tr key={c.code} className="hover:bg-[#141c27]/60 transition-colors">
                      <td className="px-4 py-2">
                        <div className="text-xs font-medium text-slate-200">{c.code}</div>
                        <div className="text-[10px] text-slate-600">{c.name}</div>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          c.category === "asset" ? "bg-blue-500/10 text-blue-400" :
                          c.category === "liability" ? "bg-red-500/10 text-red-400" :
                          c.category === "revenue" ? "bg-emerald-500/10 text-emerald-400" :
                          c.category === "expense" ? "bg-amber-500/10 text-amber-400" :
                          "bg-[#243044] text-slate-500"
                        }`}>
                          {c.category === "asset" ? "Attività" :
                           c.category === "liability" ? "Passività" :
                           c.category === "revenue" ? "Ricavi" :
                           c.category === "expense" ? "Costi" :
                           c.category || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-right text-slate-300">{EUR(c.dare)}</td>
                      <td className="px-4 py-2 text-xs text-right text-slate-300">{EUR(c.avere)}</td>
                      <td className={`px-4 py-2 text-xs text-right font-medium ${saldo >= 0 ? "text-slate-200" : "text-red-400"}`}>
                        {EUR(Math.abs(saldo))} {saldo < 0 ? "A" : "D"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <FiBookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Nessun movimento contabile per {year}</p>
          </div>
        )}
      </div>

      {/* ── Quick links ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Movimenti", desc: "Prima nota", icon: FiFileText, path: "/contabilita/movimenti", color: "blue" },
          { label: "Piano Conti", desc: "Gestione conti", icon: FiBookOpen, path: "/contabilita/piano-conti", color: "emerald" },
          { label: "Fatture", desc: "Emissione e gestione", icon: FiCreditCard, path: "/fatture", color: "amber" },
          { label: "Nuovo Movimento", desc: "Registra operazione", icon: FiFileText, path: "/contabilita/movimenti/new", color: "purple" },
        ].map(link => (
          <button key={link.path} onClick={() => navigate(link.path)}
            className={`bg-[#1a2536] rounded-xl border border-[#243044] p-4 text-left hover:border-${link.color}-500/30 transition group`}>
            <div className={`w-8 h-8 rounded-lg bg-${link.color}-500/10 flex items-center justify-center mb-2`}>
              <link.icon className={`w-4 h-4 text-${link.color}-400`} />
            </div>
            <div className="text-xs font-medium text-slate-200">{link.label}</div>
            <div className="text-[10px] text-slate-600">{link.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
