/**
 * AccountingEntryNew — Design L aligned
 * Pagina dedicata per creazione/modifica movimenti contabili
 *
 * Routes:
 *   /contabilita/movimenti/new     → nuovo movimento
 *   /contabilita/movimenti/:id     → modifica movimento esistente
 */

import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import {
  FiArrowLeft, FiSave, FiGlobe, FiAlertCircle, FiX,
  FiFileText, FiInfo, FiCheckCircle
} from "react-icons/fi";
import {
  generateAccountingEntriesForForeignInvoice,
  saveAccountingEntries,
  createSelfInvoiceForSDI
} from "@/lib/accounting";

/* ─── Helpers ─── */
const inputCls = "w-full h-9 px-3 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/30 outline-none transition";
const selectCls = inputCls;
const labelCls = "block text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5";
const isoToday = () => new Date().toISOString().split("T")[0];
const EUR = (v) => Number.isFinite(Number(v)) ? Number(v).toFixed(2) + " €" : "—";

const EMPTY_FORM = {
  accounting_date: isoToday(),
  account_code: "", description: "", reference: "",
  debit_amount: "", credit_amount: "",
  is_foreign_invoice: false,
  supplier_name: "", supplier_country: "", supplier_vat: "",
  invoice_number: "", invoice_date: "",
  invoice_total: "", invoice_imponibile: "", invoice_iva: "",
  document_type: "",
};

export default function AccountingEntryNew() {
  const navigate = useNavigate();
  const { id } = useParams();
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();

  const isEditing = !!id;

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  // Carica conti
  useEffect(() => {
    if (orgId) loadAccounts();
  }, [orgId]); // eslint-disable-line

  // Carica movimento esistente se editing
  useEffect(() => {
    if (orgId && id) loadEntry();
  }, [orgId, id]); // eslint-disable-line

  async function loadAccounts() {
    try {
      const { data, error: err } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .order("code");
      if (err) throw err;
      setAccounts(data || []);
    } catch (err) {
      console.error("Errore caricamento conti:", err);
    }
  }

  async function loadEntry() {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("accounting_entries")
        .select("*")
        .eq("id", id)
        .eq("org_id", orgId)
        .single();
      if (err) throw err;
      if (!data) { setError("Movimento non trovato"); return; }
      setFormData({
        ...EMPTY_FORM,
        accounting_date: data.accounting_date || isoToday(),
        account_code: data.account_code || "",
        description: data.description || "",
        reference: data.reference || "",
        debit_amount: data.debit_amount || "",
        credit_amount: data.credit_amount || "",
      });
    } catch (err) {
      console.error("Errore caricamento movimento:", err);
      setError("Errore caricamento movimento.");
    } finally {
      setLoading(false);
    }
  }

  const setField = (k, v) => setFormData(prev => ({ ...prev, [k]: v }));

  // Conto selezionato
  const selectedAccount = useMemo(
    () => accounts.find(a => a.code === formData.account_code),
    [accounts, formData.account_code]
  );

  // Salva
  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // ── Fattura passiva estera ──
      if (formData.is_foreign_invoice) {
        if (!formData.supplier_name || !formData.invoice_number || !formData.invoice_total || !formData.document_type) {
          setError("Compila tutti i campi obbligatori per la fattura passiva estera");
          setSaving(false);
          return;
        }
        if (!['TD17', 'TD18', 'TD19'].includes(formData.document_type)) {
          setError("Seleziona un tipo documento valido (TD17, TD18 o TD19)");
          setSaving(false);
          return;
        }

        let imponibile = Number(formData.invoice_imponibile || 0);
        let iva = Number(formData.invoice_iva || 0);
        const totale = Number(formData.invoice_total || 0);
        if (imponibile === 0 && totale > 0) imponibile = iva > 0 ? totale - iva : totale;
        if (iva === 0 && totale > imponibile) iva = totale - imponibile;

        const invoiceData = {
          supplier_name: formData.supplier_name,
          supplier_country: formData.supplier_country || "",
          supplier_vat: formData.supplier_vat || "",
          invoice_number: formData.invoice_number,
          invoice_date: formData.invoice_date || formData.accounting_date,
          invoice_total: totale,
          invoice_imponibile: imponibile,
          invoice_iva: iva,
          document_type: formData.document_type,
        };

        const accountingEntries = await generateAccountingEntriesForForeignInvoice(invoiceData, orgId);
        if (accountingEntries.length > 0) await saveAccountingEntries(accountingEntries);

        // Autofattura SDI per TD18/TD19
        let createdInvoice = null;
        if (formData.document_type === 'TD18' || formData.document_type === 'TD19') {
          try {
            const { data: orgData } = await supabase
              .from('orgs')
              .select('name, vat, address, zip, city, province, country, tax_code, regime_fiscale, sdi_code, pec')
              .eq('id', orgId).single();
            if (orgData) {
              const companyData = {
                name: orgData.name, vat: orgData.vat, address: orgData.address,
                zip: orgData.zip, zipCode: orgData.zip, city: orgData.city,
                province: orgData.province, country: orgData.country || 'IT',
                taxCode: orgData.tax_code, regimeFiscale: orgData.regime_fiscale || 'RF01',
                sdiCode: orgData.sdi_code, codiceDestinatario: orgData.sdi_code, pec: orgData.pec,
              };
              createdInvoice = await createSelfInvoiceForSDI(invoiceData, companyData, orgId);
            }
          } catch (invoiceError) {
            console.error('Errore creazione autofattura SDI (non bloccante):', invoiceError);
          }
        }

        if (createdInvoice) {
          setSuccess(`Movimenti generati e fattura ${createdInvoice.number} creata per SDI.`);
          setTimeout(() => navigate(`/fatture/${createdInvoice.id}`), 1500);
        } else {
          setSuccess("Movimenti contabili generati con successo.");
          setTimeout(() => navigate("/contabilita/movimenti"), 1200);
        }
        return;
      }

      // ── Movimento manuale ──
      if (!formData.account_code || (!formData.debit_amount && !formData.credit_amount)) {
        setError("Seleziona un conto e inserisci un importo Dare o Avere");
        setSaving(false);
        return;
      }

      const entryData = {
        org_id: orgId,
        document_type: "manual",
        document_id: null,
        accounting_date: formData.accounting_date,
        account_code: formData.account_code,
        account_name: selectedAccount?.name || "",
        debit_amount: Number(formData.debit_amount || 0),
        credit_amount: Number(formData.credit_amount || 0),
        description: formData.description || "",
        reference: formData.reference || "",
      };

      if (isEditing) {
        const { error: err } = await supabase
          .from("accounting_entries").update(entryData).eq("id", id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from("accounting_entries").insert(entryData);
        if (err) throw err;
      }

      setSuccess(isEditing ? "Movimento aggiornato." : "Movimento salvato.");
      setTimeout(() => navigate("/contabilita/movimenti"), 1000);
    } catch (err) {
      console.error("Errore salvataggio:", err);
      setError("Errore salvataggio: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-[#243044] rounded-lg" />
          <div><div className="h-5 w-48 bg-[#243044] rounded mb-1" /><div className="h-3 w-32 bg-[#1a2536] rounded" /></div>
        </div>
        <div className="h-64 bg-[#1a2536] rounded-xl border border-[#243044]" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/contabilita/movimenti")}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a2536] border border-[#243044] text-slate-400 hover:text-slate-200 hover:bg-[#1e2b3d] transition">
            <FiArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">
              {isEditing ? "Modifica Movimento" : "Nuovo Movimento"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing ? `ID: ${id}` : "Registrazione in partita doppia"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/contabilita/movimenti")}
            className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition">
            Annulla
          </button>
          <button onClick={handleSave} disabled={saving}
            className="h-8 px-4 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-600/20 disabled:opacity-50">
            <FiSave className="w-3.5 h-3.5 inline mr-1" />
            {saving ? "Salvataggio..." : isEditing ? "Aggiorna" : "Salva"}
          </button>
        </div>
      </div>

      {/* ── Messaggi ── */}
      {error && (
        <div className="bg-red-500/5 rounded-xl border border-red-500/15 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <FiAlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-xs text-red-400 flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300"><FiX className="w-3 h-3" /></button>
          </div>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/5 rounded-xl border border-emerald-500/15 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <FiCheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-xs text-emerald-400">{success}</span>
          </div>
        </div>
      )}

      {/* ── Tipo movimento toggle ── */}
      {!isEditing && (
        <div className="flex gap-2">
          <button onClick={() => setField("is_foreign_invoice", false)}
            className={`h-8 px-4 rounded-lg text-xs font-medium border transition ${
              !formData.is_foreign_invoice
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-[#1a2536] text-slate-400 border-[#243044] hover:bg-[#1e2b3d]"
            }`}>
            <FiFileText className="w-3.5 h-3.5 inline mr-1.5" />
            Movimento Manuale
          </button>
          <button onClick={() => setField("is_foreign_invoice", true)}
            className={`h-8 px-4 rounded-lg text-xs font-medium border transition ${
              formData.is_foreign_invoice
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-[#1a2536] text-slate-400 border-[#243044] hover:bg-[#1e2b3d]"
            }`}>
            <FiGlobe className="w-3.5 h-3.5 inline mr-1.5" />
            Fattura Passiva Estera
          </button>
        </div>
      )}

      {/* ── Form ── */}
      {formData.is_foreign_invoice ? (
        <>
          {/* Card info */}
          <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3">
            <div className="flex items-start gap-2.5">
              <FiInfo className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-blue-400 font-medium mb-0.5">Fattura Passiva Estera</p>
                <p className="text-[10px] text-blue-400/70">
                  Inserisci i dati della fattura ricevuta da un fornitore estero. Il sistema genererà automaticamente
                  i movimenti contabili (Costi, IVA a credito, Debiti verso fornitori) e, per TD18/TD19, l'autofattura SDI.
                </p>
              </div>
            </div>
          </div>

          {/* Card: Tipo e Date */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#243044]">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Documento</h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Tipo Documento *</label>
                <select value={formData.document_type} onChange={(e) => setField("document_type", e.target.value)} className={selectCls}>
                  <option value="">Seleziona tipo</option>
                  <option value="TD17">TD17 — Fatt. passiva estera</option>
                  <option value="TD18">TD18 — Autofattura intraUE</option>
                  <option value="TD19">TD19 — Autofattura non resid.</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Data Contabile *</label>
                <input type="date" value={formData.accounting_date} onChange={(e) => setField("accounting_date", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>N. Fattura *</label>
                <input type="text" value={formData.invoice_number} onChange={(e) => setField("invoice_number", e.target.value)} placeholder="INV-2024-001" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Card: Fornitore */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#243044]">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fornitore Estero</h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className={labelCls}>Ragione Sociale *</label>
                <input type="text" value={formData.supplier_name} onChange={(e) => setField("supplier_name", e.target.value)} placeholder="ACME Corporation" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Paese</label>
                <input type="text" value={formData.supplier_country} onChange={(e) => setField("supplier_country", e.target.value)} placeholder="DE, FR, US" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>P.IVA Fornitore</label>
                <input type="text" value={formData.supplier_vat} onChange={(e) => setField("supplier_vat", e.target.value.toUpperCase())} placeholder="DE123456789" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Data Fattura</label>
                <input type="date" value={formData.invoice_date} onChange={(e) => setField("invoice_date", e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Card: Importi */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#243044]">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Importi</h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Totale Fattura € *</label>
                <input type="number" step="0.01" value={formData.invoice_total} onChange={(e) => setField("invoice_total", e.target.value)} placeholder="0.00" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Imponibile €</label>
                <input type="number" step="0.01" value={formData.invoice_imponibile} onChange={(e) => setField("invoice_imponibile", e.target.value)} placeholder="Calcolato auto" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>IVA €</label>
                <input type="number" step="0.01" value={formData.invoice_iva} onChange={(e) => setField("invoice_iva", e.target.value)} placeholder="Calcolata auto" className={inputCls} />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Card: Dati Movimento */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#243044]">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dati Movimento</h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Data Contabile *</label>
                <input type="date" value={formData.accounting_date} onChange={(e) => setField("accounting_date", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Conto *</label>
                <select value={formData.account_code} onChange={(e) => setField("account_code", e.target.value)} className={selectCls}>
                  <option value="">Seleziona conto</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.code}>{a.code} — {a.name}</option>
                  ))}
                </select>
                {selectedAccount && (
                  <p className="text-[10px] text-slate-600 mt-1">
                    Categoria: {selectedAccount.category || "—"} · {selectedAccount.subcategory || "—"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Card: Importi */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#243044]">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Importi</h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Dare €</label>
                <input type="number" step="0.01" value={formData.debit_amount}
                  onChange={(e) => setFormData(p => ({ ...p, debit_amount: e.target.value, credit_amount: "" }))}
                  placeholder="0.00" className={inputCls} />
                <p className="text-[10px] text-slate-600 mt-1">Addebito sul conto</p>
              </div>
              <div>
                <label className={labelCls}>Avere €</label>
                <input type="number" step="0.01" value={formData.credit_amount}
                  onChange={(e) => setFormData(p => ({ ...p, credit_amount: e.target.value, debit_amount: "" }))}
                  placeholder="0.00" className={inputCls} />
                <p className="text-[10px] text-slate-600 mt-1">Accredito sul conto</p>
              </div>
            </div>
          </div>

          {/* Card: Dettagli */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#243044]">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dettagli</h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Descrizione</label>
                <input type="text" value={formData.description} onChange={(e) => setField("description", e.target.value)} placeholder="Descrizione del movimento" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Riferimento</label>
                <input type="text" value={formData.reference} onChange={(e) => setField("reference", e.target.value)} placeholder="FATT/001/2024" className={inputCls} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Footer actions (mobile friendly) ── */}
      <div className="flex items-center justify-between pt-2 pb-4">
        <button onClick={() => navigate("/contabilita/movimenti")}
          className="text-xs text-slate-500 hover:text-slate-300 transition">
          <FiArrowLeft className="w-3 h-3 inline mr-1" /> Torna alla lista
        </button>
        <button onClick={handleSave} disabled={saving}
          className="h-9 px-5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-600/20 disabled:opacity-50">
          <FiSave className="w-3.5 h-3.5 inline mr-1.5" />
          {saving ? "Salvataggio..." : isEditing ? "Aggiorna Movimento" : "Salva Movimento"}
        </button>
      </div>
    </div>
  );
}
