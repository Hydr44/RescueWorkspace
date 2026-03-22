// src/pages/Invoices.jsx
import { useEffect, useMemo, useState, useCallback, memo } from "react";
import { FiPlus, FiSearch, FiRefreshCcw, FiFileText, FiEdit, FiDownload, FiChevronLeft, FiChevronRight, FiBarChart2, FiInbox, FiSend, FiUnlock, FiX, FiCheckCircle, FiAlertTriangle, FiInfo, FiCalendar, FiAlertCircle, FiTrash2, FiTag, FiRotateCcw } from "react-icons/fi";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import { useNavigate } from "react-router-dom";
import { getIncomingInvoices, decryptIncomingInvoice } from "@/lib/sdi";
import { generatePdfFromXml } from "@/lib/invoicePdfGenerator";
import { checkOverdueInvoices } from "@/lib/invoiceReminders";
import { getInvoiceDescription } from "@/lib/invoiceSummary";

const TABLE = "invoices";

/* Helpers */
const MONEY = (val) =>
  typeof val === "number" ? Number(val).toFixed(2) + "€" : "—";

const SELECT_COLS = [
  "id","org_id","customer_name","number","date",
  "total","sdi_status","provider_ext_id","created_at","note_external","tags"
].join(",");

// Nota: invoice_items non è incluso qui perché è una relazione separata
// Il riassunto AI userà note_external come fallback

const STATUS = ["tutti","draft","validated","sent","delivered","rejected","archived"];

const STATUS_LABELS = {
  "tutti": "Tutti gli stati",
  "draft": "Bozza",
  "validated": "Validata",
  "sent": "Inviata",
  "delivered": "Consegnata",
  "rejected": "Rifiutata",
  "archived": "Archiviata"
};

const StatusBadge = memo(({ status }) => {
  const getStatusStyles = (status) => {
    switch (status) {
      case "delivered":
      case "archived":
        return "bg-green-500/10 text-green-400";
      case "sent":
        return "bg-blue-500/10 text-blue-400";
      case "validated":
        return "bg-yellow-500/10 text-yellow-400";
      case "rejected":
        return "bg-red-500/10 text-red-400";
      case "draft":
        return "bg-[#141c27] text-slate-200";
      default:
        return "bg-[#141c27] text-slate-200";
    }
  };

  const getStatusLabel = (status) => {
    return STATUS_LABELS[status] || status;
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
});

const InvoiceRow = memo(function InvoiceRow({ invoice, onEdit, onView, isSelected, onToggleSelect, onDelete, onStorno }) {
  const handleEdit = useCallback(() => onEdit(invoice.id), [onEdit, invoice.id]);
  const handleView = useCallback(() => onView(invoice.id), [onView, invoice.id]);
  const handleToggle = useCallback(() => onToggleSelect(invoice.id), [onToggleSelect, invoice.id]);

  const canDelete = invoice.sdi_status === "draft" || invoice.sdi_status === "rejected";
  const canStorno = invoice.sdi_status === "sent" || invoice.sdi_status === "delivered";

  return (
    <tr className={`hover:bg-[#141c27] transition-colors ${
      isSelected ? 'bg-emerald-500/5 border-l-2 border-emerald-500' : ''
    }`}>
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleToggle}
          className="w-4 h-4 text-emerald-600 border-[#243044] rounded focus:ring-emerald-500 cursor-pointer"
        />
      </td>
      <td className="px-4 py-3 text-sm font-medium text-slate-200">
        {invoice.number || "—"}
      </td>
      <td className="px-4 py-3 text-sm text-slate-200">
        {invoice.customer_name || "—"}
      </td>
      <td className="px-4 py-3 text-sm text-slate-400">
        {invoice.date ? new Date(invoice.date).toLocaleDateString('it-IT') : "—"}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-slate-200">
        {MONEY(invoice.total)}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={invoice.sdi_status} />
      </td>
      <td className="px-4 py-3 text-sm text-slate-400">
        <div className="max-w-xs truncate" title={getInvoiceDescription(invoice) || "Nessuna descrizione"}>
          {getInvoiceDescription(invoice) || "—"}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {invoice.tags && invoice.tags.length > 0 ? (
            invoice.tags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-600">—</span>
          )}
          {invoice.tags && invoice.tags.length > 2 && (
            <span className="text-[10px] text-slate-500">+{invoice.tags.length - 2}</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleView}
            className="p-1 text-slate-500 hover:text-blue-600 transition-colors"
            title="Dettagli"
          >
            <FiFileText className="w-4 h-4" />
          </button>
          <button
            onClick={handleEdit}
            className="p-1 text-slate-500 hover:text-blue-400 transition-colors"
            title="Modifica"
          >
            <FiEdit className="w-4 h-4" />
          </button>
          {canStorno && (
            <button
              onClick={() => onStorno(invoice)}
              className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
              title="Storna (Nota di Credito TD04)"
            >
              <FiRotateCcw className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(invoice)}
              className="p-1 text-slate-500 hover:text-red-400 transition-colors"
              title="Elimina"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

/* ============== Pagina lista Fatture ============== */
export default function Invoices() {
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);

  // Tab attivo: "emesse" (default) o "ricevute"
  const [activeTab, setActiveTab] = useState("emesse");

  // Fatture ricevute (file FO)
  const [incomingFiles, setIncomingFiles] = useState([]);
  const [incomingLoading, setIncomingLoading] = useState(false);

  // Modale dettaglio FO decifrato
  const [decryptedModal, setDecryptedModal] = useState(null); // { filename, xml_files, invoice_data }
  const [decrypting, setDecrypting] = useState(null); // filename in corso

  // filtri
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [stato, setStato] = useState("tutti");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Selezione multipla
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // Tag e categorie
  const [showTagModal, setShowTagModal] = useState(false);
  const [availableTags, setAvailableTags] = useState(['Urgente', 'Pagata', 'In sospeso', 'Ricorrente', 'Da verificare']);
  const [newTagInput, setNewTagInput] = useState('');
  const [selectedTag, setSelectedTag] = useState(''); // Filtro per tag

  // Messaggi (sostituzione alert())
  const [errMsg, setErrMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // Debounce ricerca
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  async function fetchAll() {
    if (!orgId) { setRows([]); setLoading(false); return; }
    try {
      setLoading(true);
      // Include invoice_items per il riassunto AI
      const { data, error, status } = await supabase
        .from(TABLE)
        .select(`${SELECT_COLS}, invoice_items(id, item_code, item_description, qty)`)
        .eq("org_id", orgId)
        .order("created_at", { ascending:false });
      if (error) throw Object.assign(error, { status });
      setRows(data || []);
      setEnabled(true);
    } catch (e) {
      const msg = String(e?.message || "");
      if (e?.status === 404 || msg.includes("relation") || msg.includes("not exist")) {
        // mock fallback se la tabella non esiste
        setEnabled(false);
        setRows([
          { id:"mock-1", org_id:orgId, customer_name:"Mario Rossi", number:"2025/0001", date:"2025-10-01", total:122.00, sdi_status:"draft", provider_ext_id:null, created_at:new Date().toISOString() },
          { id:"mock-2", org_id:orgId, customer_name:"ACME Spa", number:"2025/0002", date:"2025-10-05", total:500.00, sdi_status:"delivered", provider_ext_id:"SDI123456", created_at:new Date(Date.now()-86400000).toISOString() }
        ]);
      } else {
        console.error("fetch invoices failed", e);
        setErrMsg("Errore caricando le fatture");
      }
    } finally { setLoading(false); }
  }

  useEffect(()=>{ fetchAll(); /* eslint-disable-next-line */ }, [orgId]);

  // Controlla fatture scadute all'apertura della pagina (scheduler leggero)
  useEffect(() => {
    if (!orgId || !enabled) return;
    checkOverdueInvoices(orgId).catch(() => {});
  }, [orgId, enabled]);

  // realtime
  useEffect(() => {
    if (!orgId || !enabled) return;
    const ch = supabase.channel(`${TABLE}:${orgId}`);
    ch.on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE, filter: `org_id=eq.${orgId}` },
      fetchAll
    );
    ch.subscribe();
    return () => { try { supabase.removeChannel(ch); } catch {} };
    // eslint-disable-next-line
  }, [orgId, enabled]);

  const filtered = useMemo(() => {
    let l = [...rows];
    if (stato !== "tutti") l = l.filter(r => r.sdi_status === stato);
    if (dateFrom) l = l.filter(r => r.date && r.date >= dateFrom);
    if (dateTo) l = l.filter(r => r.date && r.date <= dateTo);
    if (selectedTag) l = l.filter(r => r.tags && r.tags.includes(selectedTag));
    if (debouncedQ) {
      const s = debouncedQ.toLowerCase();
      l = l.filter(r =>
        (r.number || "").toLowerCase().includes(s) ||
        (r.customer_name || "").toLowerCase().includes(s) ||
        (r.provider_ext_id || "").toLowerCase().includes(s)
      );
    }
    return l;
  }, [rows, stato, debouncedQ, dateFrom, dateTo, selectedTag]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filtered.slice(start, end);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const onEdit = useCallback((id) => {
    navigate(`/fatture/${id}`);
  }, [navigate]);

  const onView = useCallback((id) => {
    navigate(`/fatture/${id}`);
  }, [navigate]);

  // Gestione selezione multipla
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map(inv => inv.id)));
    }
  }, [selectedIds.size, paginated]);

  const toggleSelectOne = useCallback((id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Azioni bulk
  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    // Filtra: solo bozze e scartate possono essere eliminate
    const deletableStatuses = ['draft', 'rejected'];
    const deletable = rows.filter(r => ids.includes(r.id) && deletableStatuses.includes(r.sdi_status));
    const nonDeletable = rows.filter(r => ids.includes(r.id) && !deletableStatuses.includes(r.sdi_status));

    if (nonDeletable.length > 0) {
      const nonDelNames = nonDeletable.map(r => `${r.number || '—'} (${STATUS_LABELS[r.sdi_status] || r.sdi_status})`).join(', ');
      if (deletable.length === 0) {
        setErrMsg(`Impossibile eliminare: le fatture selezionate sono già state inviate/accettate da SDI (${nonDelNames}). Per annullarle, usa la funzione "Storna" che emette una Nota di Credito.`);
        return;
      }
      if (!window.confirm(`${nonDeletable.length} fatture non eliminabili (già inviate a SDI): ${nonDelNames}.\n\nVuoi eliminare solo le ${deletable.length} fatture in bozza/scartate?`)) return;
    } else {
      if (!window.confirm(`Eliminare ${deletable.length} fatture selezionate?`)) return;
    }

    if (deletable.length === 0) return;

    try {
      const delIds = deletable.map(r => r.id);
      // Elimina righe collegate prima
      await supabase.from("invoice_items").delete().in('invoice_id', delIds);
      await supabase.from("sdi_events").delete().in('invoice_id', delIds);
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .in('id', delIds);
      if (error) throw error;
      setInfoMsg(`${deletable.length} fatture eliminate`);
      clearSelection();
      fetchAll();
    } catch (e) {
      console.error('Bulk delete error:', e);
      setErrMsg('Errore eliminazione fatture: ' + e.message);
    }
  }, [selectedIds, rows, supabase, clearSelection]);

  const handleBulkAddTag = useCallback(async (tag) => {
    if (!tag) return;
    try {
      const ids = Array.from(selectedIds);
      
      // Per ogni fattura, aggiungi il tag all'array esistente
      for (const id of ids) {
        const invoice = rows.find(r => r.id === id);
        const currentTags = invoice?.tags || [];
        
        // Evita duplicati
        if (!currentTags.includes(tag)) {
          const newTags = [...currentTags, tag];
          const { error } = await supabase
            .from(TABLE)
            .update({ tags: newTags })
            .eq('id', id);
          if (error) throw error;
        }
      }
      
      setInfoMsg(`Tag "${tag}" aggiunto a ${selectedIds.size} fatture`);
      clearSelection();
      fetchAll();
    } catch (e) {
      console.error('Bulk add tag error:', e);
      setErrMsg('Errore aggiunta tag: ' + e.message);
    }
  }, [selectedIds, rows, supabase, clearSelection]);

  const addNewTag = useCallback(() => {
    const tag = newTagInput.trim();
    if (!tag) return;
    if (!availableTags.includes(tag)) {
      setAvailableTags(prev => [...prev, tag]);
    }
    setNewTagInput('');
  }, [newTagInput, availableTags]);

  const handleBulkExport = useCallback(() => {
    const selectedInvoices = rows.filter(r => selectedIds.has(r.id));
    if (!selectedInvoices.length) return;
    const header = "Numero;Cliente;Data;Totale;Stato SDI;Oggetto";
    const csvRows = selectedInvoices.map(r => [
      r.number || "",
      (r.customer_name || "").replace(/;/g, ","),
      r.date ? new Date(r.date).toLocaleDateString("it-IT") : "",
      typeof r.total === "number" ? r.total.toFixed(2).replace(".", ",") : "",
      STATUS_LABELS[r.sdi_status] || r.sdi_status || "",
      (r.note_external || "").replace(/;/g, ","),
    ].join(";"));
    const csv = [header, ...csvRows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const now = new Date().toISOString().slice(0, 10);
    a.download = `fatture_selezionate_${now}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
    setInfoMsg(`Esportate ${selectedInvoices.length} fatture`);
  }, [selectedIds, rows]);

  // Elimina singola fattura (solo draft/rejected)
  const handleDeleteSingle = useCallback(async (invoice) => {
    if (invoice.sdi_status !== 'draft' && invoice.sdi_status !== 'rejected') {
      setErrMsg('Impossibile eliminare: la fattura è già stata inviata/accettata da SDI. Usa "Storna" per emettere una Nota di Credito.');
      return;
    }
    if (!window.confirm(`Eliminare la fattura ${invoice.number || '—'}? Questa azione non è reversibile.`)) return;
    try {
      await supabase.from("invoice_items").delete().eq('invoice_id', invoice.id);
      await supabase.from("sdi_events").delete().eq('invoice_id', invoice.id);
      const { error } = await supabase.from(TABLE).delete().eq('id', invoice.id);
      if (error) throw error;
      setInfoMsg(`Fattura ${invoice.number || '—'} eliminata`);
      fetchAll();
    } catch (e) {
      console.error('Delete single error:', e);
      setErrMsg('Errore eliminazione fattura: ' + e.message);
    }
  }, [supabase]);

  // Storna singola fattura (crea Nota di Credito TD04)
  const handleStornoSingle = useCallback(async (invoice) => {
    const confirmMsg = [
      `Stornare la fattura N. ${invoice.number || '—'}?`,
      ``,
      `Verrà creata automaticamente una Nota di Credito (TD04)`,
      `con gli stessi importi della fattura originale.`,
      ``,
      `La nota di credito dovrà poi essere validata e inviata a SDI.`,
    ].join("\n");
    if (!window.confirm(confirmMsg)) return;

    try {
      // Recupera le righe della fattura originale
      const { data: origItems, error: itemsErr } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoice.id)
        .order("id", { ascending: true });
      if (itemsErr) throw itemsErr;

      // Recupera meta completa della fattura
      const { data: fullInv, error: fullErr } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoice.id)
        .single();
      if (fullErr) throw fullErr;

      // Crea la nota di credito
      const now = new Date().toISOString().slice(0, 10);
      const creditNoteMeta = {
        ...(fullInv.meta || {}),
        sdi: {
          ...(fullInv.meta?.sdi || {}),
          documento: {
            ...(fullInv.meta?.sdi?.documento || {}),
            tipo_documento: "TD04",
          },
          original_invoice: {
            id: fullInv.id,
            number: fullInv.number,
            date: fullInv.date,
          },
        },
        storno_di: fullInv.id,
        storno_numero_originale: fullInv.number,
        storno_data_originale: fullInv.date,
      };

      const { data: newInv, error: createErr } = await supabase
        .from("invoices")
        .insert({
          org_id: fullInv.org_id,
          customer_name: fullInv.customer_name,
          customer_vat: fullInv.customer_vat,
          customer_tax_code: fullInv.customer_tax_code,
          customer_address: fullInv.customer_address,
          date: now,
          currency: fullInv.currency || "EUR",
          total: fullInv.total,
          sdi_status: "draft",
          original_invoice_id: fullInv.id,
          meta: creditNoteMeta,
          note: `Storno integrale fattura N. ${fullInv.number || '—'} del ${fullInv.date ? new Date(fullInv.date).toLocaleDateString('it-IT') : '—'}`,
        })
        .select("id")
        .single();
      if (createErr) throw createErr;

      // Copia le righe nella nota di credito
      if (origItems && origItems.length > 0) {
        const newItems = origItems.map(item => ({
          invoice_id: newInv.id,
          descr: item.descr,
          item_code: item.item_code,
          item_description: item.item_description,
          qty: item.qty,
          price: item.price,
          vat_perc: item.vat_perc,
        }));
        const { error: insertItemsErr } = await supabase
          .from("invoice_items")
          .insert(newItems);
        if (insertItemsErr) throw insertItemsErr;
      }

      // Aggiorna la fattura originale con riferimento allo storno
      await supabase
        .from("invoices")
        .update({
          meta: {
            ...(fullInv.meta || {}),
            stornata: true,
            storno_invoice_id: newInv.id,
            storno_date: now,
          },
        })
        .eq("id", fullInv.id);

      setInfoMsg(`Nota di Credito (TD04) creata per fattura N. ${invoice.number || '—'}. Aprila per validarla e inviarla a SDI.`);
      fetchAll();
      // Naviga alla nota di credito
      navigate(`/fatture/${newInv.id}`);
    } catch (e) {
      console.error('Storno error:', e);
      setErrMsg('Errore creazione nota di credito: ' + e.message);
    }
  }, [supabase, navigate]);

  // Reset selezione quando cambiano i filtri
  useEffect(() => {
    clearSelection();
  }, [stato, debouncedQ, dateFrom, dateTo, currentPage, clearSelection]);

  // Carica fatture ricevute (file FO)
  const loadIncomingInvoices = useCallback(async () => {
    if (!orgId) {
      console.warn('[Invoices] orgId non disponibile per caricamento fatture ricevute');
      setIncomingFiles([]);
      return;
    }
    
    try {
      setIncomingLoading(true);
      const result = await getIncomingInvoices({ testMode: false, limit: 100, orgId });
      setIncomingFiles(result.files || []);
      console.log('[Invoices] Fatture ricevute caricate:', result.files?.length || 0, 'file per org', orgId);
    } catch (error) {
      console.error('[Invoices] Errore caricamento fatture ricevute:', error);
      setErrMsg('Errore caricamento fatture ricevute: ' + error.message);
    } finally {
      setIncomingLoading(false);
    }
  }, [orgId]);

  // Carica fatture ricevute quando si cambia tab
  useEffect(() => {
    if (activeTab === "ricevute") {
      loadIncomingInvoices();
    }
  }, [activeTab, loadIncomingInvoices]);

  // Polling automatico fatture passive ogni 30 minuti (background)
  useEffect(() => {
    if (!orgId) return;
    const POLLING_MS = 30 * 60 * 1000;
    const timer = setInterval(() => {
      loadIncomingInvoices();
    }, POLLING_MS);
    return () => clearInterval(timer);
  }, [orgId, loadIncomingInvoices]);

  // Decifra una fattura ricevuta e mostra dettagli nel modale
  const handleDecryptInvoice = useCallback(async (filename) => {
    try {
      setDecrypting(filename);
      const result = await decryptIncomingInvoice(filename, { testMode: false });
      console.log('[Invoices] Fattura decifrata:', result);
      
      if (result.xml_files && result.xml_files.length > 0) {
        setDecryptedModal({
          filename,
          xml_files: result.xml_files.filter(f => f.content && f.content.length > 0),
          invoice_data: result.invoice_data,
        });
      } else {
        setErrMsg('Nessun file XML trovato nella fattura decifrata');
      }
    } catch (error) {
      console.error('[Invoices] Errore decifratura fattura:', error);
      setErrMsg('Errore decifratura fattura: ' + error.message);
    } finally {
      setDecrypting(null);
    }
  }, []);

  // Scarica un singolo file XML
  const handleDownloadXml = useCallback((xmlFile) => {
    const content = typeof xmlFile.content === 'string' ? xmlFile.content : String(xmlFile.content || '');
    if (!content) return;
    const blob = new Blob([content], { type: 'application/xml;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = xmlFile.name || 'file.xml';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 1000);
  }, []);

  // Genera e scarica PDF da XML FatturaPA
  const handleViewPdf = useCallback((xmlFile, invoiceData) => {
    try {
      const pdfDoc = generatePdfFromXml(xmlFile.content, invoiceData || {});
      const fileName = (xmlFile.name || 'fattura').replace('.xml', '.pdf');
      pdfDoc.save(fileName);
    } catch (error) {
      console.error('[Invoices] Errore generazione PDF:', error);
      setErrMsg('Errore generazione PDF: ' + error.message);
    }
  }, []);

  // Export CSV fatture filtrate
  const exportCSV = useCallback(() => {
    if (!filtered.length) { setErrMsg("Nessuna fattura da esportare"); return; }
    const header = "Numero;Cliente;Data;Totale;Stato SDI;Oggetto";
    const csvRows = filtered.map(r => [
      r.number || "",
      (r.customer_name || "").replace(/;/g, ","),
      r.date ? new Date(r.date).toLocaleDateString("it-IT") : "",
      typeof r.total === "number" ? r.total.toFixed(2).replace(".", ",") : "",
      STATUS_LABELS[r.sdi_status] || r.sdi_status || "",
      (r.note_external || "").replace(/;/g, ","),
    ].join(";"));
    const csv = [header, ...csvRows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const now = new Date().toISOString().slice(0, 10);
    a.download = `fatture_${now}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
    setInfoMsg(`Esportate ${filtered.length} fatture`);
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Fatture</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gestisci tutte le fatture della tua organizzazione</p>
          {!enabled && (
            <p className="text-xs text-amber-400 mt-1">
              Modalità mock (crea la tabella <code className="px-1 py-0.5 bg-amber-500/10 rounded text-[10px]">invoices</code> per attivare il live)
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors"
          >
            <FiDownload className="w-3.5 h-3.5" />
            CSV
          </button>
          <button
            onClick={fetchAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors"
          >
            <FiRefreshCcw className="w-3.5 h-3.5" />
            Ricarica
          </button>
          <button
            onClick={() => navigate("/fatture/new")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <FiPlus className="w-3.5 h-3.5" />
            Nuova Fattura
          </button>
        </div>
      </div>

        {/* Tab Emesse/Ricevute */}
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] mb-3">
          <div className="border-b border-[#243044]">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("emesse")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === "emesse"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-500 hover:text-slate-300 "
                }`}
              >
                <FiSend className="w-4 h-4" />
                Fatture Emesse
                {activeTab === "emesse" && filtered.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-green-500/10 text-green-400 rounded-full">
                    {filtered.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("ricevute")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === "ricevute"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-500 hover:text-slate-300 "
                }`}
              >
                <FiInbox className="w-4 h-4" />
                Fatture Ricevute
                {activeTab === "ricevute" && incomingFiles.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-green-500/10 text-green-400 rounded-full">
                    {incomingFiles.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Messaggi errore/info */}
        {errMsg && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-2">
            <FiAlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <span className="text-sm text-red-400 flex-1">{errMsg}</span>
            <button onClick={() => setErrMsg("")} className="text-red-400/60 hover:text-red-400"><FiX className="w-3.5 h-3.5" /></button>
          </div>
        )}
        {infoMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-start gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <span className="text-sm text-emerald-400 flex-1">{infoMsg}</span>
            <button onClick={() => setInfoMsg("")} className="text-emerald-400/60 hover:text-emerald-400"><FiX className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Contenuto Tab Ricevute */}
        {activeTab === "ricevute" && (
          <div className="space-y-6">
            {/* Controlli */}
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
              <div className="flex items-center justify-end">
                <button
                  onClick={loadIncomingInvoices}
                  disabled={incomingLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiRefreshCcw className={`w-4 h-4 ${incomingLoading ? 'animate-spin' : ''}`} />
                  {incomingLoading ? 'Caricamento...' : 'Sincronizza Fatture Ricevute'}
                </button>
              </div>
            </div>

            {/* Lista File FO */}
            <div className="bg-[#1a2536] rounded-xl border border-[#243044]">
              <div className="px-6 py-4 border-b border-[#243044]">
                <h2 className="text-lg font-semibold text-slate-200">
                  File FO Ricevuti ({incomingFiles.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                {incomingLoading ? (
                  <div className="px-6 py-10 text-center text-slate-500">
                    Caricamento fatture ricevute...
                  </div>
                ) : incomingFiles.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-[#141c27]">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nome File</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Dimensione</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Data Ricezione</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Stato</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Azioni</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#243044]">
                      {incomingFiles.map((file) => (
                        <tr key={file.filename} className="hover:bg-[#141c27] transition-colors">
                          <td className="px-4 py-3 text-sm font-mono text-slate-200">
                            {file.filename}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-400">
                            {(file.size / 1024).toFixed(2)} KB
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-400">
                            {file.received_at ? new Date(file.received_at).toLocaleString('it-IT') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              file.status === 'unprocessed'
                                ? 'bg-yellow-500/10 text-yellow-400'
                                : 'bg-green-500/10 text-green-400'
                            }`}>
                              {file.status === 'unprocessed' ? 'Non processata' : 'Processata'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDecryptInvoice(file.filename)}
                                disabled={decrypting === file.filename}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#243044] hover:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Decifra e visualizza"
                              >
                                {decrypting === file.filename ? (
                                  <><FiRefreshCcw className="w-3.5 h-3.5 animate-spin" /> Decifratura...</>
                                ) : (
                                  <><FiUnlock className="w-3.5 h-3.5" /> Apri</>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-6 py-12">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-[#141c27] rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiInbox className="w-8 h-8 text-slate-500" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-200 mb-2">
                        Nessuna fattura ricevuta
                      </h3>
                      <p className="text-sm text-slate-500 mb-4">
                        Le fatture passive ricevute da SDI appariranno qui dopo la sincronizzazione
                      </p>
                      <button
                        onClick={loadIncomingInvoices}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        <FiRefreshCcw className="w-4 h-4" />
                        Sincronizza Ora
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contenuto Tab Emesse (default) */}
        {activeTab === "emesse" && (
          <>
        {/* Barra Azioni Bulk */}
        {selectedIds.size > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiCheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">
                  {selectedIds.size} {selectedIds.size === 1 ? 'fattura selezionata' : 'fatture selezionate'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkExport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] hover:text-emerald-400 transition-colors"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  Esporta
                </button>
                <button
                  onClick={() => setShowTagModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] hover:text-emerald-400 transition-colors"
                >
                  <FiTag className="w-3.5 h-3.5" />
                  Aggiungi Tag
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                  Elimina
                </button>
                <button
                  onClick={clearSelection}
                  className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                  title="Deseleziona tutto"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filtri e Ricerca */}
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-6 mb-3">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Ricerca */}
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cerca per numero, cliente, IdSdI..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            {/* Filtro Status */}
            <div className="sm:w-48">
              <select
                value={stato}
                onChange={(e) => {
                  setStato(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              >
                {STATUS.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            {/* Filtro Tag */}
            <div className="sm:w-48">
              <select
                value={selectedTag}
                onChange={(e) => {
                  setSelectedTag(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              >
                <option value="">Tutti i tag</option>
                {availableTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtro Date */}
          <div className="flex items-center gap-3 mt-3">
            <FiCalendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                className="px-2 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <span className="text-xs text-slate-500">—</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                className="px-2 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); setCurrentPage(1); }}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Resetta date
              </button>
            )}
          </div>
        </div>

        {/* Lista Fatture */}
        <div className="bg-[#1a2536] rounded-xl border border-[#243044]">
          {/* Header Tabella */}
          <div className="px-6 py-4 border-b border-[#243044]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-200">
                Lista Fatture
              </h2>
              <div className="flex items-center gap-4">
                <div className="text-sm text-slate-500">
                  {filtered.length} fatture
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Mostra per pagina:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 text-sm border border-[#243044] rounded bg-[#1a2536] text-slate-200"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Tabella */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#141c27]">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={paginated.length > 0 && selectedIds.size === paginated.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-emerald-600 border-[#243044] rounded focus:ring-emerald-500 cursor-pointer"
                      title="Seleziona tutto"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Numero</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Totale</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Stato</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Oggetto/Prestazioni</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tag</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243044]">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                      Caricamento…
                    </td>
                  </tr>
                ) : paginated.length > 0 ? (
                  paginated.map((invoice) => (
                    <InvoiceRow 
                      key={invoice.id} 
                      invoice={invoice} 
                      onEdit={onEdit} 
                      onView={onView}
                      isSelected={selectedIds.has(invoice.id)}
                      onToggleSelect={toggleSelectOne}
                      onDelete={handleDeleteSingle}
                      onStorno={handleStornoSingle}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-12">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-[#141c27] rounded-full flex items-center justify-center mx-auto mb-4">
                          <FiFileText className="w-8 h-8 text-slate-500" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-200 mb-2">
                          Nessuna fattura trovata
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">
                          {debouncedQ || stato !== "tutti" 
                            ? "Prova a modificare i filtri di ricerca" 
                            : "Crea la tua prima fattura per iniziare"}
                        </p>
                        {!debouncedQ && stato === "tutti" && (
                          <button
                            onClick={() => navigate("/fatture/new")}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200"
                          >
                            <FiPlus className="w-4 h-4" />
                            Nuova Fattura
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginazione */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[#243044] flex items-center justify-between">
              <div className="text-sm text-slate-500">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} di {filtered.length} fatture
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-[#243044] bg-[#1a2536] text-slate-300 hover:bg-[#1a2536] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? "bg-emerald-600 text-white"
                            : "text-slate-300 hover:bg-[#1a2536]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-[#243044] bg-[#1a2536] text-slate-300 hover:bg-[#1a2536] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
          </>
        )}

        {/* Modale Tag */}
        {showTagModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowTagModal(false)}>
            <div className="bg-[#1a2536] border border-[#243044] rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#243044]">
                <div>
                  <h3 className="text-base font-semibold text-slate-100">Aggiungi Tag</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedIds.size} fatture selezionate</p>
                </div>
                <button onClick={() => setShowTagModal(false)} className="p-1.5 text-slate-500 hover:text-slate-200 transition-colors">
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Tag Disponibili</label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          handleBulkAddTag(tag);
                          setShowTagModal(false);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400 transition-colors"
                      >
                        <FiTag className="w-3 h-3" />
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Crea Nuovo Tag</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addNewTag();
                          if (newTagInput.trim()) {
                            handleBulkAddTag(newTagInput.trim());
                            setShowTagModal(false);
                          }
                        }
                      }}
                      placeholder="Nome del tag..."
                      className="flex-1 px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => {
                        addNewTag();
                        if (newTagInput.trim()) {
                          handleBulkAddTag(newTagInput.trim());
                          setShowTagModal(false);
                        }
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Crea e Aggiungi
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#243044]">
                <button
                  onClick={() => setShowTagModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modale Dettaglio FO Decifrato */}
        {decryptedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDecryptedModal(null)}>
            <div className="bg-[#1a2536] border border-[#243044] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              {/* Header modale */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#243044]">
                <div>
                  <h3 className="text-base font-semibold text-slate-100">Contenuto File FO</h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">{decryptedModal.filename}</p>
                </div>
                <button onClick={() => setDecryptedModal(null)} className="p-1.5 text-slate-500 hover:text-slate-200 transition-colors">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Contenuto modale */}
              <div className="overflow-y-auto max-h-[calc(85vh-130px)] p-6 space-y-4">
                {/* Riepilogo dati */}
                {decryptedModal.invoice_data && (
                  <div className="bg-[#141c27] rounded-xl border border-[#243044] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      {decryptedModal.invoice_data.tipo === 'fattura' && <FiFileText className="w-4 h-4 text-emerald-400" />}
                      {decryptedModal.invoice_data.tipo === 'ricevuta_consegna' && <FiCheckCircle className="w-4 h-4 text-emerald-400" />}
                      {decryptedModal.invoice_data.tipo === 'metadati' && <FiInfo className="w-4 h-4 text-blue-400" />}
                      {(decryptedModal.invoice_data.tipo === 'notifica_scarto' || decryptedModal.invoice_data.tipo === 'notifica_mancata_consegna') && <FiAlertTriangle className="w-4 h-4 text-amber-400" />}
                      <span className="text-sm font-semibold text-slate-200">
                        {{
                          fattura: 'Fattura Elettronica',
                          ricevuta_consegna: 'Ricevuta di Consegna (RC)',
                          metadati: 'Metadati SDI',
                          notifica_scarto: 'Notifica di Scarto',
                          notifica_mancata_consegna: 'Mancata Consegna',
                        }[decryptedModal.invoice_data.tipo] || decryptedModal.invoice_data.tipo}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {decryptedModal.invoice_data.identificativo_sdi && (
                        <div><span className="text-slate-500">Id SDI</span><p className="text-slate-200 font-mono mt-0.5">{decryptedModal.invoice_data.identificativo_sdi}</p></div>
                      )}
                      {decryptedModal.invoice_data.nome_file && (
                        <div><span className="text-slate-500">File Originale</span><p className="text-slate-200 font-mono mt-0.5">{decryptedModal.invoice_data.nome_file}</p></div>
                      )}
                      {decryptedModal.invoice_data.cedente && (
                        <div><span className="text-slate-500">Cedente</span><p className="text-slate-200 mt-0.5">{decryptedModal.invoice_data.cedente}</p></div>
                      )}
                      {decryptedModal.invoice_data.numero && (
                        <div><span className="text-slate-500">Numero</span><p className="text-slate-200 mt-0.5">{decryptedModal.invoice_data.numero}</p></div>
                      )}
                      {decryptedModal.invoice_data.data && (
                        <div><span className="text-slate-500">Data</span><p className="text-slate-200 mt-0.5">{decryptedModal.invoice_data.data}</p></div>
                      )}
                      {decryptedModal.invoice_data.importo_totale > 0 && (
                        <div><span className="text-slate-500">Importo</span><p className="text-emerald-400 font-semibold mt-0.5">{MONEY(decryptedModal.invoice_data.importo_totale)}</p></div>
                      )}
                      {decryptedModal.invoice_data.data_ricezione && (
                        <div><span className="text-slate-500">Ricevuto SDI</span><p className="text-slate-200 mt-0.5">{new Date(decryptedModal.invoice_data.data_ricezione).toLocaleString('it-IT')}</p></div>
                      )}
                      {decryptedModal.invoice_data.data_consegna && (
                        <div><span className="text-slate-500">Consegnato</span><p className="text-emerald-400 mt-0.5">{new Date(decryptedModal.invoice_data.data_consegna).toLocaleString('it-IT')}</p></div>
                      )}
                      {decryptedModal.invoice_data.codice_destinatario && (
                        <div><span className="text-slate-500">Cod. Destinatario</span><p className="text-slate-200 font-mono mt-0.5">{decryptedModal.invoice_data.codice_destinatario}</p></div>
                      )}
                      {decryptedModal.invoice_data.message_id && (
                        <div><span className="text-slate-500">Message ID</span><p className="text-slate-200 font-mono mt-0.5">{decryptedModal.invoice_data.message_id}</p></div>
                      )}
                    </div>
                  </div>
                )}

                {/* Lista file XML */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">File XML Contenuti ({decryptedModal.xml_files.length})</h4>
                  <div className="space-y-2">
                    {decryptedModal.xml_files.map((xmlFile, idx) => {
                      const typeLabels = {
                        fattura: { label: 'Fattura', color: 'text-emerald-400 bg-emerald-500/10' },
                        ricevuta_consegna: { label: 'RC', color: 'text-emerald-400 bg-emerald-500/10' },
                        notifica_scarto: { label: 'Scarto', color: 'text-red-400 bg-red-500/10' },
                        notifica_decorrenza: { label: 'Decorrenza', color: 'text-amber-400 bg-amber-500/10' },
                        notifica_esito: { label: 'Esito', color: 'text-blue-400 bg-blue-500/10' },
                        notifica_mancata_consegna: { label: 'MC', color: 'text-amber-400 bg-amber-500/10' },
                        metadati: { label: 'Metadati', color: 'text-blue-400 bg-blue-500/10' },
                        quadratura: { label: 'Quadratura', color: 'text-slate-400 bg-slate-500/10' },
                      };
                      const t = typeLabels[xmlFile.type] || { label: xmlFile.type, color: 'text-slate-400 bg-slate-500/10' };
                      return (
                        <div key={idx} className="flex items-center justify-between bg-[#141c27] border border-[#243044] rounded-lg px-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <FiFileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm text-slate-200 font-mono truncate">{xmlFile.name}</p>
                              <p className="text-xs text-slate-500">{(xmlFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${t.color}`}>{t.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {xmlFile.type === 'fattura' && (
                              <button
                                onClick={() => handleViewPdf(xmlFile, decryptedModal.invoice_data)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                              >
                                <FiFileText className="w-3.5 h-3.5" />
                                PDF
                              </button>
                            )}
                            <button
                              onClick={() => handleDownloadXml(xmlFile)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] hover:text-emerald-400 transition-colors"
                            >
                              <FiDownload className="w-3.5 h-3.5" />
                              XML
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer modale */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#243044]">
                <button
                  onClick={() => setDecryptedModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}