/**
 * Sales Quote Form
 * Creazione/modifica preventivo con selezione ricambi
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOrg } from '../context/OrgContext';
import { createQuote, updateQuote, getQuote, calculateTotals } from '../lib/sales';
import { supabaseBrowser } from '../lib/supabase-browser';
import { FiPlus, FiTrash2, FiSave, FiX, FiSearch, FiFileText, FiPercent, FiAlertCircle, FiPaperclip } from 'react-icons/fi';

export default function SalesQuoteForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { orgId } = useOrg();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [form, setForm] = useState({
    client_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reference: '',
    discount_percent: 0,
    discount_amount: 0,
    notes: '',
    internal_notes: '',
    terms: 'Preventivo valido 30 giorni. Pagamento: bonifico bancario entro 30 giorni data fattura.',
    items: []
  });

  const [totals, setTotals] = useState({
    subtotal: 0,
    discount_amount: 0,
    subtotal_after_discount: 0,
    tax_amount: 0,
    total: 0
  });

  useEffect(() => {
    if (orgId) {
      loadClients();
      loadSpareParts();
      if (isEdit) loadQuote();
    }
  }, [orgId, id]);

  useEffect(() => {
    // Ricalcola totali quando cambiano le righe o lo sconto globale
    if (form.items.length > 0) {
      const calculated = calculateTotals(form.items);
      const subtotal = calculated.subtotal;
      
      // Applica sconto globale
      let discountAmount = 0;
      if (form.discount_percent > 0) {
        discountAmount = subtotal * (form.discount_percent / 100);
      } else if (form.discount_amount > 0) {
        discountAmount = form.discount_amount;
      }
      
      const subtotalAfterDiscount = subtotal - discountAmount;
      const taxAmount = subtotalAfterDiscount * 0.22; // IVA 22%
      const total = subtotalAfterDiscount + taxAmount;
      
      setTotals({
        subtotal,
        discount_amount: discountAmount,
        subtotal_after_discount: subtotalAfterDiscount,
        tax_amount: taxAmount,
        total
      });
    } else {
      setTotals({ subtotal: 0, discount_amount: 0, subtotal_after_discount: 0, tax_amount: 0, total: 0 });
    }
  }, [form.items, form.discount_percent, form.discount_amount]);

  async function loadClients() {
    try {
      const { data } = await supabaseBrowser()
        .from('clients')
        .select('id, nome, piva, email')
        .eq('org_id', orgId)
        .order('nome');
      
      setClients(data || []);
    } catch (err) {
      console.error('Errore caricamento clienti:', err);
    }
  }

  async function loadSpareParts() {
    try {
      const { data } = await supabaseBrowser()
        .from('spare_parts')
        .select('id, name, sku, sale_price, status')
        .eq('org_id', orgId)
        .in('status', ['available', 'reserved'])
        .order('name');
      
      setSpareParts(data || []);
    } catch (err) {
      console.error('Errore caricamento ricambi:', err);
    }
  }

  async function loadQuote() {
    setLoading(true);
    try {
      const quote = await getQuote(id);
      setForm({
        client_id: quote.client_id || '',
        issue_date: quote.issue_date,
        valid_until: quote.valid_until,
        reference: quote.reference || '',
        discount_percent: quote.discount_percent || 0,
        discount_amount: quote.discount_amount || 0,
        notes: quote.notes || '',
        internal_notes: quote.internal_notes || '',
        terms: quote.terms || '',
        items: quote.items || []
      });
    } catch (err) {
      console.error('Errore caricamento preventivo:', err);
      alert('Errore caricamento preventivo');
    } finally {
      setLoading(false);
    }
  }

  function addItem(product) {
    const newItem = {
      item_type: 'spare_part',
      item_id: product.id,
      description: product.name,
      sku: product.sku || '',
      quantity: 1,
      unit_price: product.sale_price || 0,
      discount_percent: 0,
      tax_rate: 22,
      line_total: product.sale_price || 0
    };

    setForm({
      ...form,
      items: [...form.items, newItem]
    });
    setShowProductSearch(false);
    setSearchQuery('');
  }

  function updateItem(index, field, value) {
    const updatedItems = [...form.items];
    updatedItems[index][field] = value;

    // Ricalcola line_total
    const item = updatedItems[index];
    const lineSubtotal = item.quantity * item.unit_price;
    const lineDiscount = lineSubtotal * (item.discount_percent / 100);
    updatedItems[index].line_total = lineSubtotal - lineDiscount;

    setForm({ ...form, items: updatedItems });
  }

  function removeItem(index) {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index)
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!form.client_id) {
      alert('Seleziona un cliente');
      return;
    }

    if (form.items.length === 0) {
      alert('Aggiungi almeno un prodotto');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        org_id: orgId,
        client_id: form.client_id,
        issue_date: form.issue_date,
        valid_until: form.valid_until,
        reference: form.reference,
        discount_percent: form.discount_percent,
        discount_amount: totals.discount_amount,
        notes: form.notes,
        internal_notes: form.internal_notes,
        terms: form.terms,
        subtotal: totals.subtotal,
        tax_amount: totals.tax_amount,
        total: totals.total,
        items: form.items
      };

      if (isEdit) {
        await updateQuote(id, payload);
      } else {
        await createQuote(orgId, payload);
      }

      navigate('/vendite/preventivi');
    } catch (err) {
      console.error('Errore salvataggio:', err);
      alert('Errore salvataggio preventivo: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = spareParts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-200">
            {isEdit ? 'Modifica Preventivo' : 'Nuovo Preventivo'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">Crea un preventivo di vendita</p>
        </div>
        <button
          onClick={() => navigate('/vendite/preventivi')}
          className="px-4 py-2 bg-[#1a2536] border border-[#243044] text-slate-300 text-sm rounded-lg hover:bg-[#243044] transition"
        >
          <FiX className="w-4 h-4 inline mr-2" />
          Annulla
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dati Preventivo */}
        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Dati Preventivo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Cliente *</label>
              <select
                value={form.client_id}
                onChange={e => setForm({ ...form, client_id: e.target.value })}
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
                required
              >
                <option value="">Seleziona cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome} {c.piva ? `- ${c.piva}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Data Emissione</label>
              <input
                type="date"
                value={form.issue_date}
                onChange={e => setForm({ ...form, issue_date: e.target.value })}
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Valido Fino</label>
              <input
                type="date"
                value={form.valid_until}
                onChange={e => setForm({ ...form, valid_until: e.target.value })}
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
                <FiFileText className="w-3 h-3 inline mr-1" />
                Riferimento Cliente
              </label>
              <input
                type="text"
                value={form.reference}
                onChange={e => setForm({ ...form, reference: e.target.value })}
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
                placeholder="Es: Ordine #12345, Progetto XYZ..."
              />
            </div>
          </div>
        </div>

        {/* Sconti e Note Interne */}
        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            <FiPercent className="w-4 h-4 inline mr-2" />
            Sconti e Note Interne
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Sconto Globale %</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.discount_percent}
                onChange={e => {
                  const val = Number.parseFloat(e.target.value) || 0;
                  setForm({ ...form, discount_percent: val, discount_amount: 0 });
                }}
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
                placeholder="0.00"
              />
              <p className="text-xs text-slate-500 mt-1">Sconto percentuale sul totale</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Sconto Fisso €</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.discount_amount}
                onChange={e => {
                  const val = Number.parseFloat(e.target.value) || 0;
                  setForm({ ...form, discount_amount: val, discount_percent: 0 });
                }}
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
                placeholder="0.00"
              />
              <p className="text-xs text-slate-500 mt-1">Importo fisso di sconto</p>
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-400 mb-2">
                <FiAlertCircle className="w-3 h-3 inline mr-1" />
                Note Interne
              </label>
              <textarea
                value={form.internal_notes}
                onChange={e => setForm({ ...form, internal_notes: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
                placeholder="Note visibili solo internamente (non stampate)..."
              />
            </div>
          </div>
        </div>

        {/* Prodotti */}
        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Prodotti</h2>
            <button
              type="button"
              onClick={() => setShowProductSearch(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              Aggiungi Prodotto
            </button>
          </div>

          {/* Lista Prodotti */}
          <div className="space-y-3">
            {form.items.map((item, index) => (
              <div key={index} className="bg-[#141c27] border border-[#243044] rounded-lg p-4">
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-4">
                    <label className="block text-xs text-slate-500 mb-1">Descrizione</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => updateItem(index, 'description', e.target.value)}
                      className="w-full px-2 py-1.5 bg-[#1a2536] border border-[#243044] rounded text-sm text-slate-200"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Quantità</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                      className="w-full px-2 py-1.5 bg-[#1a2536] border border-[#243044] rounded text-sm text-slate-200"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Prezzo €</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={e => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-[#1a2536] border border-[#243044] rounded text-sm text-slate-200"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Sconto %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={item.discount_percent}
                      onChange={e => updateItem(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-[#1a2536] border border-[#243044] rounded text-sm text-slate-200"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <label className="block text-xs text-slate-500 mb-1">Totale</label>
                    <div className="text-sm font-medium text-slate-200">
                      €{item.line_total.toFixed(2)}
                    </div>
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1.5 text-red-400 hover:text-red-300 transition"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {form.items.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                Nessun prodotto aggiunto. Clicca "Aggiungi Prodotto" per iniziare.
              </div>
            )}
          </div>
        </div>

        {/* Totali */}
        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-5">
          <div className="max-w-md ml-auto space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Subtotale:</span>
              <span className="text-slate-200 font-medium">€{totals.subtotal.toFixed(2)}</span>
            </div>
            {totals.discount_amount > 0 && (
              <>
                <div className="flex justify-between text-sm text-amber-400">
                  <span>
                    Sconto {form.discount_percent > 0 ? `(${form.discount_percent}%)` : ''}:
                  </span>
                  <span>-€{totals.discount_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-[#243044] pt-2">
                  <span className="text-slate-400">Subtotale scontato:</span>
                  <span className="text-slate-200 font-medium">€{totals.subtotal_after_discount.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">IVA (22%):</span>
              <span className="text-slate-200 font-medium">€{totals.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t border-[#243044] pt-2">
              <span className="text-slate-200">Totale:</span>
              <span className="text-blue-400">€{totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Note e Condizioni</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Note</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
                placeholder="Note aggiuntive..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Condizioni di Vendita</label>
              <textarea
                value={form.terms}
                onChange={e => setForm({ ...form, terms: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
                placeholder="Condizioni di vendita..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/vendite/preventivi')}
            className="px-4 py-2 bg-[#1a2536] border border-[#243044] text-slate-300 text-sm rounded-lg hover:bg-[#243044] transition"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition flex items-center gap-2 disabled:opacity-50"
          >
            <FiSave className="w-4 h-4" />
            {loading ? 'Salvataggio...' : 'Salva Preventivo'}
          </button>
        </div>
      </form>

      {/* Modal Ricerca Prodotti */}
      {showProductSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2536] border border-[#243044] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[#243044] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-200">Seleziona Prodotto</h3>
              <button
                onClick={() => setShowProductSearch(false)}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 border-b border-[#243044]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cerca per nome o codice..."
                  className="w-full pl-10 pr-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-2">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    Nessun prodotto trovato
                  </div>
                ) : (
                  filteredProducts.map(product => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addItem(product)}
                      className="w-full text-left px-4 py-3 bg-[#141c27] border border-[#243044] rounded-lg hover:border-blue-500/30 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-slate-200">{product.name}</div>
                          {product.sku && (
                            <div className="text-xs text-slate-400 mt-1">SKU: {product.sku}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-blue-400">
                            €{product.sale_price?.toFixed(2) || '0.00'}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">{product.status}</div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
