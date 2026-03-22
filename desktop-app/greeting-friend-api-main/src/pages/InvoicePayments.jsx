// src/pages/InvoicePayments.jsx
// UI Gestione Pagamenti Fatture — conforme normativa italiana
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import { FiArrowLeft, FiPlus, FiTrash2, FiDollarSign, FiCheck, FiAlertCircle, FiBell, FiSend } from "react-icons/fi";
import { createReminder, getReminders, markReminderSent } from "@/lib/invoiceReminders";

const EUR = (v) => (isFinite(Number(v)) ? Number(v).toFixed(2) + " €" : "—");
const inputBase = "input border border-[#243044] rounded-md w-full px-3 py-2 bg-[#1a2536] placeholder-slate-600 outline-none focus:ring-1 ring-blue-500/40 text-sm";

const PAYMENT_METHODS = [
  { v: "transfer", l: "Bonifico bancario" },
  { v: "cash", l: "Contanti" },
  { v: "check", l: "Assegno" },
  { v: "card", l: "Carta di pagamento" },
  { v: "riba", l: "Ri.Ba." },
  { v: "paypal", l: "PayPal" },
];

export default function InvoicePayments() {
  const { id } = useParams();
  const nav = useNavigate();
  const { orgId } = useOrg();
  const supabase = supabaseBrowser();

  const [inv, setInv] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  // Solleciti
  const [reminders, setReminders] = useState([]);
  const [creatingReminder, setCreatingReminder] = useState(false);

  // Form nuovo pagamento
  const [showForm, setShowForm] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newMethod, setNewMethod] = useState("transfer");
  const [newRef, setNewRef] = useState("");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    if (id && orgId) { load(); loadReminders(); }
  }, [id, orgId]);

  async function load() {
    setLoading(true);
    try {
      const [invRes, payRes] = await Promise.all([
        supabase.from("invoices").select("id, number, date, total, customer_name, payment_status, sdi_status").eq("id", id).single(),
        supabase.from("invoice_payments").select("*").eq("invoice_id", id).order("payment_date", { ascending: false }),
      ]);
      if (invRes.error) throw invRes.error;
      setInv(invRes.data);
      setPayments(payRes.data || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadReminders() {
    try {
      const data = await getReminders(id);
      setReminders(data);
    } catch {}
  }

  async function handleCreateReminder() {
    setCreatingReminder(true);
    try {
      await createReminder(id, orgId);
      setInfo("Sollecito creato");
      await loadReminders();
    } catch (e) {
      setErr(e.message);
    } finally {
      setCreatingReminder(false);
    }
  }

  async function handleMarkSent(reminderId) {
    try {
      await markReminderSent(reminderId);
      setInfo("Sollecito segnato come inviato");
      await loadReminders();
    } catch (e) {
      setErr(e.message);
    }
  }

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const remaining = inv ? Number(inv.total || 0) - totalPaid : 0;

  async function addPayment() {
    const amount = Number(newAmount);
    if (!amount || amount <= 0) { setErr("Importo deve essere > 0"); return; }
    if (amount > remaining + 0.01) { setErr("Importo supera il residuo da pagare"); return; }
    if (!newDate) { setErr("Data pagamento obbligatoria"); return; }

    setSaving(true);
    setErr("");
    try {
      const { error } = await supabase.from("invoice_payments").insert({
        invoice_id: id,
        org_id: orgId,
        amount,
        payment_date: newDate,
        payment_method: newMethod,
        reference_number: newRef || null,
        notes: newNotes || null,
      });
      if (error) throw error;

      // Aggiorna stato pagamento fattura
      const newTotalPaid = totalPaid + amount;
      const newStatus = newTotalPaid >= Number(inv.total) - 0.01 ? "paid" : "partial";
      await supabase.from("invoices").update({ payment_status: newStatus }).eq("id", id);

      setInfo("Pagamento registrato con successo");
      setShowForm(false);
      setNewAmount("");
      setNewRef("");
      setNewNotes("");
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deletePayment(paymentId) {
    if (!confirm("Eliminare questo pagamento?")) return;
    try {
      const { error } = await supabase.from("invoice_payments").delete().eq("id", paymentId);
      if (error) throw error;

      // Ricalcola stato
      const newPayments = payments.filter(p => p.id !== paymentId);
      const newTotalPaid = newPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
      const newStatus = newTotalPaid <= 0 ? "pending" : newTotalPaid >= Number(inv.total) - 0.01 ? "paid" : "partial";
      await supabase.from("invoices").update({ payment_status: newStatus }).eq("id", id);

      setInfo("Pagamento eliminato");
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  const statusBadge = (s) => {
    if (s === "paid") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (s === "partial") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    if (s === "overdue") return "bg-red-500/20 text-red-400 border-red-500/30";
    return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  };
  const statusLabel = (s) => {
    if (s === "paid") return "Pagata";
    if (s === "partial") return "Parziale";
    if (s === "overdue") return "Scaduta";
    return "Da pagare";
  };

  if (loading) return <div className="p-8 text-slate-400">Caricamento...</div>;
  if (!inv) return <div className="p-8 text-red-400">Fattura non trovata</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => nav(-1)} className="p-2 hover:bg-[#243044] rounded-lg transition-colors">
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Pagamenti — Fattura {inv.number || "—"}</h1>
          <p className="text-sm text-slate-400">{inv.customer_name} — {inv.date ? new Date(inv.date).toLocaleDateString("it-IT") : "—"}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusBadge(inv.payment_status)}`}>
          {statusLabel(inv.payment_status)}
        </span>
      </div>

      {/* Riepilogo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Totale fattura</div>
          <div className="text-lg font-semibold">{EUR(inv.total)}</div>
        </div>
        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Pagato</div>
          <div className="text-lg font-semibold text-emerald-400">{EUR(totalPaid)}</div>
        </div>
        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Residuo</div>
          <div className={`text-lg font-semibold ${remaining > 0 ? "text-amber-400" : "text-emerald-400"}`}>{EUR(remaining)}</div>
        </div>
      </div>

      {/* Barra progresso */}
      <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-4">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>Progresso pagamento</span>
          <span>{inv.total > 0 ? Math.min(100, Math.round((totalPaid / inv.total) * 100)) : 0}%</span>
        </div>
        <div className="w-full bg-[#243044] rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all"
            style={{ width: `${inv.total > 0 ? Math.min(100, (totalPaid / inv.total) * 100) : 0}%` }}
          />
        </div>
      </div>

      {/* Messaggi */}
      {err && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
          <FiAlertCircle className="text-red-400 mt-0.5 shrink-0" />
          <span className="text-sm text-red-400">{err}</span>
        </div>
      )}
      {info && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-start gap-2">
          <FiCheck className="text-emerald-400 mt-0.5 shrink-0" />
          <span className="text-sm text-emerald-400">{info}</span>
        </div>
      )}

      {/* Storico pagamenti */}
      <div className="bg-[#1a2536] border border-[#243044] rounded-xl">
        <div className="flex items-center justify-between p-4 border-b border-[#243044]">
          <h2 className="font-semibold flex items-center gap-2"><FiDollarSign /> Storico pagamenti</h2>
          {remaining > 0.01 && (
            <button
              onClick={() => { setShowForm(true); setErr(""); setInfo(""); setNewAmount(remaining.toFixed(2)); }}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
            >
              <FiPlus className="w-4 h-4" /> Registra pagamento
            </button>
          )}
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nessun pagamento registrato</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-[#243044]">
                <th className="text-left px-4 py-2">Data</th>
                <th className="text-left px-4 py-2">Metodo</th>
                <th className="text-left px-4 py-2">Riferimento</th>
                <th className="text-right px-4 py-2">Importo</th>
                <th className="text-right px-4 py-2">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-[#243044]/50 hover:bg-[#141c27] transition-colors">
                  <td className="px-4 py-3 text-sm">{new Date(p.payment_date).toLocaleDateString("it-IT")}</td>
                  <td className="px-4 py-3 text-sm">{PAYMENT_METHODS.find(m => m.v === p.payment_method)?.l || p.payment_method || "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{p.reference_number || p.notes || "—"}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-emerald-400">{EUR(p.amount)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => deletePayment(p.id)} className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 transition-colors">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form nuovo pagamento */}
      {showForm && (
        <div className="bg-[#1a2536] border border-blue-500/30 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-blue-400 flex items-center gap-2"><FiPlus /> Nuovo pagamento</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Importo *</label>
              <input type="number" step="0.01" className={inputBase} value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Data pagamento *</label>
              <input type="date" className={inputBase} value={newDate} onChange={e => setNewDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Metodo pagamento</label>
              <select className={inputBase} value={newMethod} onChange={e => setNewMethod(e.target.value)}>
                {PAYMENT_METHODS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Riferimento (n. bonifico, assegno...)</label>
              <input className={inputBase} value={newRef} onChange={e => setNewRef(e.target.value)} placeholder="Opzionale" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Note</label>
            <input className={inputBase} value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Opzionale" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={addPayment} disabled={saving} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              {saving ? "Salvataggio..." : "Registra pagamento"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-[#243044] hover:bg-[#2d3b50] rounded-lg text-sm transition-colors">
              Annulla
            </button>
          </div>
        </div>
      )}
      {/* Solleciti */}
      <div className="bg-[#1a2536] border border-[#243044] rounded-xl">
        <div className="flex items-center justify-between p-4 border-b border-[#243044]">
          <h2 className="font-semibold flex items-center gap-2"><FiBell /> Solleciti di pagamento</h2>
          {remaining > 0.01 && (
            <button
              onClick={handleCreateReminder}
              disabled={creatingReminder}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <FiPlus className="w-4 h-4" /> {creatingReminder ? "Creazione..." : "Nuovo sollecito"}
            </button>
          )}
        </div>

        {reminders.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nessun sollecito registrato</div>
        ) : (
          <div className="divide-y divide-[#243044]/50">
            {reminders.map((r) => (
              <div key={r.id} className="p-4 hover:bg-[#141c27] transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      r.reminder_type === 'first' ? 'bg-blue-500/20 text-blue-400' :
                      r.reminder_type === 'second' ? 'bg-amber-500/20 text-amber-400' :
                      r.reminder_type === 'third' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {r.reminder_type === 'first' ? '1° sollecito' :
                       r.reminder_type === 'second' ? '2° sollecito' :
                       r.reminder_type === 'third' ? '3° sollecito' : 'Diffida legale'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      r.status === 'sent' ? 'bg-emerald-500/20 text-emerald-400' :
                      r.status === 'acknowledged' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {r.status === 'sent' ? 'Inviato' : r.status === 'acknowledged' ? 'Ricevuto' : 'Da inviare'}
                    </span>
                    <span className="text-xs text-slate-500">{new Date(r.reminder_date).toLocaleDateString('it-IT')}</span>
                  </div>
                  {r.status === 'pending' && (
                    <button
                      onClick={() => handleMarkSent(r.id)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded transition-colors"
                    >
                      <FiSend className="w-3 h-3" /> Segna inviato
                    </button>
                  )}
                </div>
                {r.notes && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{r.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
