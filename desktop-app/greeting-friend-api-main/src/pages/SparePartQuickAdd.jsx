/**
 * Form semplificato per aggiunta rapida ricambi
 * Workflow: Scansione → AutoDoc → Conferma + Ubicazione → Genera etichetta
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiSave, FiX, FiPackage, FiMapPin, FiPrinter, FiCreditCard, FiDollarSign, FiImage, FiTruck, FiArrowLeft } from 'react-icons/fi';
import QuickScanModal from '@/components/spare-parts/QuickScanModal';
import { supabase } from '@/integrations/supabase/client';
import { useOrg } from '@/context/OrgContext';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
import { generateInternalCode, getCategoryCode } from '@/lib/sparePartCodes';
import { generateThermalLabel, downloadPDF } from '@/lib/labelGenerator';
import { calculatePriceSuggestion, getDefaultMarkupByCategory } from '@/lib/pricingSuggestions';
import { lookupByCode } from '@/lib/tecdoc';
import { generateAftermarketDescription } from '@/lib/aiDescriptions';
import { getPriceSuggestion } from '@/lib/ebayPricing';

export default function SparePartQuickAdd() {
  const { orgId } = useOrg();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError, showWarning } = useToast();

  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [autodocData, setAutodocData] = useState(null);
  const [pricingSuggestion, setPricingSuggestion] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    oem_code: '',
    ean_code: '',
    tecdoc_supplier: '',
    category_id: '',
    warehouse_location: '',
    quantity: 1,
    price_sell: '',
    notes: '',
  });

  useEffect(() => {
    if (!orgId) return;
    loadInitialData();
  }, [orgId]);

  // Auto-load dati quando riceve codice da URL
  useEffect(() => {
    const code = searchParams.get('code');
    if (code && !autodocData) {
      autoLoadPartData(code);
    }
  }, [searchParams, autodocData]);

  const loadInitialData = async () => {
    try {
      const { data: cats } = await supabase.from('spare_parts_categories').select('id, name, code').order('name');
      setCategories(cats || []);

      const { data: sh } = await supabase.from('shelves').select('id, code, area, section').eq('org_id', orgId).order('code');
      setShelves(sh || []);
    } catch (e) {
      logger.error('Error loading initial data:', e);
    }
  };

  /**
   * Carica automaticamente dati da TecDoc + IA + eBay
   */
  const autoLoadPartData = async (code) => {
    setLoading(true);
    try {
      console.log('[QuickAdd] Auto-loading data for code:', code);

      // 1. TecDoc - Dati tecnici
      const tecdocResult = await lookupByCode(code);
      if (!tecdocResult || !tecdocResult.articles || tecdocResult.articles.length === 0) {
        showWarning(`Codice ${code} non trovato in TecDoc. Inserisci dati manualmente.`);
        setShowScanner(true);
        setLoading(false);
        return;
      }

      const article = tecdocResult.articles[0];
      const partName = article.articleName || article.name || article.genericArticleName || article.description || 'Ricambio';
      const brand = article.brandName || article.supplier || article.mfrName || article.brand || article.manufacturerName || '';
      const eanCode = article.eanNumber || article.ean || article.eanCode || article.barcode || '';
      
      console.log('[QuickAdd] TecDoc article data:', {
        partName,
        brand,
        eanCode,
        rawArticle: article
      });

      // 2. IA - Descrizione aftermarket
      let aiDescription = null;
      try {
        aiDescription = await generateAftermarketDescription({
          name: partName,
          brand: brand,
          oem_code: code,
          description: article.articleDescription || '',
          compatible_vehicles: tecdocResult.vehicles || [],
        });
      } catch (err) {
        console.warn('[QuickAdd] AI description failed, using fallback:', err);
      }

      // 3. eBay - Prezzo suggerito
      let pricing = null;
      try {
        pricing = await getPriceSuggestion({
          name: partName,
          brand: brand,
          oem_code: code,
          category: null,
          condition: 'used',
        });
      } catch (err) {
        console.warn('[QuickAdd] Pricing failed, using default:', err);
      }

      // Aggiorna form con tutti i dati
      setAutodocData({
        tecdoc: tecdocResult,
        article: article,
        ai: aiDescription,
        pricing: pricing,
      });

      setFormData(prev => ({
        ...prev,
        oem_code: code,
        ean_code: eanCode,
        name: aiDescription?.title || partName,
        description: aiDescription?.description || article.articleDescription || article.description || '',
        tecdoc_supplier: brand,
        price_sell: pricing?.suggestedPrice || '',
      }));

      setPricingSuggestion(pricing);
      showSuccess(`Dati caricati automaticamente per ${partName}`);

    } catch (error) {
      logger.error('[QuickAdd] Auto-load error:', error);
      showError('Errore nel caricamento automatico dati');
      setShowScanner(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePartFound = async (partData) => {
    setAutodocData(partData);
    setFormData(prev => ({
      ...prev,
      name: partData.name || prev.name,
      description: partData.description || prev.description,
      oem_code: partData.oem_code || prev.oem_code,
      ean_code: partData.ean_code || prev.ean_code,
      tecdoc_supplier: partData.tecdoc_supplier || prev.tecdoc_supplier,
    }));

    // Calcola prezzo suggerito
    if (partData.price_autodoc) {
      const category = categories.find(c => c.id === formData.category_id);
      const markup = category ? getDefaultMarkupByCategory(category.name) : 30;
      const suggestedPrice = partData.price_autodoc * (1 + markup / 100);
      
      setPricingSuggestion({
        autodocPrice: partData.price_autodoc,
        markup: markup,
        suggestedPrice: Math.round(suggestedPrice * 100) / 100,
        availability: partData.availability,
      });

      setFormData(prev => ({
        ...prev,
        price_sell: Math.round(suggestedPrice * 100) / 100,
      }));
    }

    setShowScanner(false);
    showSuccess(`Ricambio trovato: ${partData.name}`);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showWarning('Il nome del ricambio è obbligatorio');
      return;
    }

    if (!formData.warehouse_location.trim()) {
      showWarning('Inserisci l\'ubicazione in magazzino');
      return;
    }

    setSaving(true);

    try {
      // Genera codice interno
      const category = categories.find(c => c.id === formData.category_id);
      const internalCode = await generateInternalCode(orgId, category?.name);

      const payload = {
        org_id: orgId,
        internal_code: internalCode,
        name: formData.name.trim(),
        description: formData.description.trim(),
        oem_code: formData.oem_code.trim() || null,
        ean_code: formData.ean_code.trim() || null,
        tecdoc_supplier: formData.tecdoc_supplier || null,
        category_id: formData.category_id || null,
        condition: 'used',
        status: 'available',
        warehouse_location: formData.warehouse_location.trim(),
        quantity: Number(formData.quantity) || 1,
        price_sell: Number(formData.price_sell) || null,
        notes: formData.notes.trim() || null,
        // Dati pricing AutoDoc
        suggested_price_autodoc: pricingSuggestion?.autodocPrice || null,
        price_markup_percent: pricingSuggestion?.markup || null,
        last_price_check: pricingSuggestion ? new Date().toISOString() : null,
        autodoc_availability: pricingSuggestion?.availability || null,
      };

      const { data: newPart, error } = await supabase
        .from('spare_parts')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;

      showSuccess(`Ricambio creato: ${internalCode}`);

      // Genera e scarica etichetta automaticamente
      await generateAndPrintLabel(newPart);

      // Reset form per prossima scansione
      setFormData({
        name: '',
        description: '',
        oem_code: '',
        ean_code: '',
        tecdoc_supplier: '',
        category_id: '',
        warehouse_location: '',
        quantity: 1,
        price_sell: '',
        notes: '',
      });
      setAutodocData(null);
      setPricingSuggestion(null);
      setShowScanner(true);

    } catch (e) {
      logger.error('Error saving spare part:', e);
      showError('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const generateAndPrintLabel = async (sparePart) => {
    try {
      const pdf = await generateThermalLabel(sparePart);
      downloadPDF(pdf, `etichetta-${sparePart.internal_code}.pdf`);
      
      // Aggiorna contatore stampe
      await supabase
        .from('spare_parts')
        .update({
          barcode_printed: true,
          barcode_printed_at: new Date().toISOString(),
          label_count: (sparePart.label_count || 0) + 1,
        })
        .eq('id', sparePart.id);

      showSuccess('Etichetta generata e scaricata');
    } catch (error) {
      logger.error('Error generating label:', error);
      showWarning('Ricambio salvato ma errore nella generazione etichetta');
    }
  };

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const inputCls = "w-full h-10 px-3 text-sm border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/30 outline-none transition";
  const labelCls = "text-xs text-slate-500 uppercase tracking-wider font-medium mb-2 block";
  const selectCls = "w-full h-10 px-3 text-sm border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 outline-none";
  const cardCls = "bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden";

  return (
    <div className="min-h-screen bg-[#0f1419] p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/ricambi-mvp')}
              className="h-10 px-4 text-sm font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition inline-flex items-center gap-2"
            >
              <FiArrowLeft className="w-4 h-4" />
              Ricambi
            </button>
            <div>
              <h1 className="text-xl font-semibold text-slate-100">Aggiunta Rapida Ricambio</h1>
              <p className="text-sm text-slate-500 mt-0.5">Scansiona → AutoDoc → Conferma → Etichetta</p>
            </div>
          </div>
          <button
            onClick={() => setShowScanner(true)}
            className="h-10 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
          >
            <FiCreditCard className="w-4 h-4" />
            Scansiona Codice
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={cardCls}>
            <div className="px-5 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Caricamento dati ricambio...</h3>
                  <p className="text-xs text-slate-500 mt-0.5">TecDoc → IA → Prezzi</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-xs text-slate-400">Ricerca dati tecnici su TecDoc...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-slate-600 flex items-center justify-center">
                    <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                  </div>
                  <span className="text-xs text-slate-500">Generazione descrizione con IA...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-slate-600 flex items-center justify-center">
                    <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                  </div>
                  <span className="text-xs text-slate-500">Calcolo prezzi di mercato...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dati AutoDoc */}
        {!loading && autodocData && (
          <div className={cardCls}>
            <div className="px-5 py-3 border-b border-[#243044] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiPackage className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Dati AutoDoc</h2>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Trovato</span>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <p className="text-xs text-slate-500 mb-1">Nome Ricambio</p>
                <p className="text-base font-semibold text-slate-100">{formData.name || autodocData.name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Marca</p>
                <p className="text-sm font-medium text-slate-200">{formData.tecdoc_supplier || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Codice OEM</p>
                <p className="text-sm font-mono text-slate-200">{formData.oem_code || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Codice EAN</p>
                <p className="text-sm font-mono text-slate-200">{formData.ean_code || '-'}</p>
              </div>
              {pricingSuggestion && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Prezzo Suggerito</p>
                  <p className="text-sm font-semibold text-emerald-400">€ {pricingSuggestion.suggestedPrice?.toFixed(2) || pricingSuggestion.marketPrice?.toFixed(2) || '-'}</p>
                </div>
              )}
              {autodocData.images && autodocData.images.length > 0 && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 mb-2">Immagine</p>
                  <img src={autodocData.images[0]} alt={autodocData.name} className="h-24 rounded-lg border border-[#243044]" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form Completamento */}
        {autodocData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Classificazione */}
            <div className={cardCls}>
              <div className="px-5 py-3 border-b border-[#243044] flex items-center gap-2">
                <FiPackage className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Classificazione</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className={labelCls}>Categoria</label>
                  <select value={formData.category_id} onChange={e => set('category_id', e.target.value)} className={selectCls}>
                    <option value="">Seleziona categoria...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Quantità</label>
                  <input type="number" min="1" value={formData.quantity} onChange={e => set('quantity', e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>

            {/* Magazzino */}
            <div className={cardCls}>
              <div className="px-5 py-3 border-b border-[#243044] flex items-center gap-2">
                <FiMapPin className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Ubicazione <span className="text-red-400">*</span></h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className={labelCls}>Posizione Magazzino</label>
                  <input
                    type="text"
                    value={formData.warehouse_location}
                    onChange={e => set('warehouse_location', e.target.value)}
                    className={inputCls}
                    placeholder="Es. Scaffale A-12"
                    autoFocus
                  />
                </div>
                {shelves.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {shelves.slice(0, 8).map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => set('warehouse_location', `${s.code} - ${s.area}/${s.section}`)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-[#141c27] border border-[#243044] text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition"
                      >
                        {s.code}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Prezzo */}
            {pricingSuggestion && (
              <div className={cardCls}>
                <div className="px-5 py-3 border-b border-[#243044] flex items-center gap-2">
                  <FiDollarSign className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Prezzo Vendita</h2>
                </div>
                <div className="p-5 space-y-3">
                  <div className="bg-[#141c27] rounded-lg p-3 border border-[#243044]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500">Prezzo Mercato</span>
                      <span className="text-sm font-semibold text-slate-300">€ {pricingSuggestion?.marketPrice?.toFixed(2) || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Markup {pricingSuggestion?.markup || 35}%</span>
                      <span className="text-lg font-bold text-blue-400">€ {pricingSuggestion?.suggestedPrice?.toFixed(2) || '-'}</span>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Prezzo Finale (€)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price_sell}
                      onChange={e => set('price_sell', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Note */}
            <div className={cardCls}>
              <div className="px-5 py-3 border-b border-[#243044] flex items-center gap-2">
                <FiTruck className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Note</h2>
              </div>
              <div className="p-5">
                <textarea
                  value={formData.notes}
                  onChange={e => set('notes', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/30 outline-none resize-none"
                  rows="4"
                  placeholder="Note aggiuntive (opzionale)..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {autodocData && (
          <div className="flex items-center justify-between bg-[#1a2536] rounded-xl border border-[#243044] px-6 py-4">
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <FiPrinter className="w-4 h-4" />
              <span>L'etichetta verrà generata automaticamente dopo il salvataggio</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setAutodocData(null);
                  setPricingSuggestion(null);
                  setShowScanner(true);
                }}
                className="h-10 px-4 text-sm font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition inline-flex items-center gap-2"
              >
                <FiX className="w-4 h-4" />
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.warehouse_location.trim()}
                className="h-10 px-6 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 inline-flex items-center gap-2"
              >
                <FiSave className="w-4 h-4" />
                {saving ? 'Salvataggio...' : 'Salva e Stampa Etichetta'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scanner Modal */}
      <QuickScanModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onPartFound={handlePartFound}
      />
    </div>
  );
}
