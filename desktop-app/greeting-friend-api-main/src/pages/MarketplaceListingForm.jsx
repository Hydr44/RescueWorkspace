/**
 * Form Creazione/Modifica Annuncio Marketplace
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOrg } from '../context/OrgContext';
import { 
  createListing, 
  updateListing, 
  getMarketplaceListing,
  publishListing,
  SPARE_PART_CATEGORIES,
  CONDITIONS,
  QUALITY_GRADES
} from '../lib/marketplace-b2b';
import { supabaseBrowser } from '../lib/supabase-browser';
import { FiSave, FiX, FiUpload, FiTrash2, FiSend } from 'react-icons/fi';

export default function MarketplaceListingForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { orgId } = useOrg();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [spareParts, setSpareParts] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [form, setForm] = useState({
    spare_part_id: '',
    title: '',
    description: '',
    category: '',
    vehicle_brand: '',
    vehicle_model: '',
    vehicle_year: '',
    vin: '',
    condition: 'usato',
    quality_grade: 'B',
    warranty_days: 0,
    price: '',
    quantity: 1,
    available_quantity: 1,
    images: [],
    shipping_available: true,
    shipping_cost: '',
    pickup_only: false,
    pickup_address: '',
    status: 'draft',
    visibility: 'public',
    tags: [],
    expires_at: ''
  });

  const [tagInput, setTagInput] = useState('');

  if (!isEdit) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-6">
          <h1 className="text-xl font-semibold text-slate-200 mb-2">Creazione annuncio disabilitata</h1>
          <p className="text-sm text-slate-400 mb-6">
            Gli annunci del Marketplace B2B vengono pubblicati direttamente dal modulo <span className="text-slate-200 font-semibold">Ricambi</span>.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/ricambi/nuovo')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition"
            >
              Vai a Nuovo Ricambio
            </button>
            <button
              onClick={() => navigate('/marketplace')}
              className="px-4 py-2 bg-[#141c27] border border-[#243044] text-slate-300 text-sm rounded-lg hover:bg-[#243044] transition"
            >
              Torna al Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (orgId) {
      loadSpareParts();
      if (isEdit) loadListing();
    }
  }, [orgId, id]);

  async function loadSpareParts() {
    try {
      const { data } = await supabaseBrowser()
        .from('spare_parts')
        .select('id, name, sku, category, sale_price, quantity')
        .eq('org_id', orgId)
        .gt('quantity', 0)
        .order('name');
      
      setSpareParts(data || []);
    } catch (err) {
      console.error('Errore caricamento ricambi:', err);
    }
  }

  async function loadListing() {
    setLoading(true);
    try {
      const { data } = await getMarketplaceListing(id);
      if (data) {
        setForm({
          spare_part_id: data.spare_part_id || '',
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          vehicle_brand: data.vehicle_brand || '',
          vehicle_model: data.vehicle_model || '',
          vehicle_year: data.vehicle_year || '',
          vin: data.vin || '',
          condition: data.condition || 'usato',
          quality_grade: data.quality_grade || 'B',
          warranty_days: data.warranty_days || 0,
          price: data.price || '',
          quantity: data.quantity || 1,
          available_quantity: data.available_quantity || 1,
          images: data.images || [],
          shipping_available: data.shipping_available !== false,
          shipping_cost: data.shipping_cost || '',
          pickup_only: data.pickup_only || false,
          pickup_address: data.pickup_address || '',
          status: data.status || 'draft',
          visibility: data.visibility || 'public',
          tags: data.tags || [],
          expires_at: data.expires_at || ''
        });
      }
    } catch (err) {
      console.error('Errore caricamento annuncio:', err);
      alert('Errore caricamento annuncio');
    } finally {
      setLoading(false);
    }
  }

  function handleSparePartSelect(sparePartId) {
    const part = spareParts.find(p => p.id === sparePartId);
    if (part) {
      setForm({
        ...form,
        spare_part_id: sparePartId,
        title: form.title || part.name,
        category: form.category || part.category,
        price: form.price || part.sale_price || '',
        quantity: part.quantity,
        available_quantity: part.quantity
      });
    } else {
      setForm({ ...form, spare_part_id: '' });
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Seleziona un file immagine valido');
      return;
    }

    setUploadingImage(true);
    try {
      const fileName = `${orgId}/${Date.now()}_${file.name}`;
      const { data, error } = await supabaseBrowser()
        .storage
        .from('marketplace-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabaseBrowser()
        .storage
        .from('marketplace-images')
        .getPublicUrl(data.path);

      setForm({
        ...form,
        images: [...form.images, publicUrl]
      });
    } catch (err) {
      console.error('Errore upload immagine:', err);
      alert('Errore upload immagine: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  }

  function removeImage(index) {
    setForm({
      ...form,
      images: form.images.filter((_, i) => i !== index)
    });
  }

  function addTag() {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm({
        ...form,
        tags: [...form.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  }

  function removeTag(tag) {
    setForm({
      ...form,
      tags: form.tags.filter(t => t !== tag)
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      alert('Inserisci un titolo');
      return;
    }

    if (!form.price || Number.parseFloat(form.price) <= 0) {
      alert('Inserisci un prezzo valido');
      return;
    }

    setLoading(true);
    try {
      // Ottieni utente corrente
      const { data: { user } } = await supabaseBrowser().auth.getUser();
      
      const listingData = {
        ...form,
        created_by: user?.id
      };

      if (isEdit) {
        await updateListing(id, listingData);
      } else {
        await createListing(orgId, listingData);
      }

      navigate('/marketplace/miei-annunci');
    } catch (err) {
      console.error('Errore salvataggio:', err);
      alert('Errore salvataggio annuncio: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    if (!form.title.trim() || !form.price) {
      alert('Completa i campi obbligatori prima di pubblicare');
      return;
    }

    setLoading(true);
    try {
      // Ottieni utente corrente
      const { data: { user } } = await supabaseBrowser().auth.getUser();
      
      let listingId = id;
      
      if (!isEdit) {
        const { data } = await createListing(orgId, {
          ...form,
          status: 'draft',
          created_by: user?.id
        });
        listingId = data.id;
      }

      await publishListing(listingId);
      navigate('/marketplace/miei-annunci');
    } catch (err) {
      console.error('Errore pubblicazione:', err);
      alert('Errore pubblicazione annuncio: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-400">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-200">
            {isEdit ? 'Modifica Annuncio' : 'Nuovo Annuncio Marketplace'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">Pubblica un ricambio nel marketplace B2B</p>
        </div>
        <button
          onClick={() => navigate('/marketplace/miei-annunci')}
          className="px-4 py-2 bg-[#1a2536] border border-[#243044] text-slate-300 text-sm rounded-lg hover:bg-[#243044] transition"
        >
          <FiX className="w-4 h-4 inline mr-2" />
          Annulla
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ricambio da Magazzino */}
        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Ricambio (Opzionale)
          </h2>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Seleziona da Magazzino
            </label>
            <select
              value={form.spare_part_id}
              onChange={e => handleSparePartSelect(e.target.value)}
              className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
            >
              <option value="">Nessuno (inserimento manuale)</option>
              {spareParts.map(part => (
                <option key={part.id} value={part.id}>
                  {part.name} - {part.sku} (Qtà: {part.quantity})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Se selezioni un ricambio, alcuni campi verranno compilati automaticamente
            </p>
          </div>
        </div>

        {/* Dati Annuncio */}
        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Dati Annuncio *
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-2">Titolo *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
                placeholder="Es: Motore 1.6 TDI Volkswagen Golf VII"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-2">Descrizione</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows="4"
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
                placeholder="Descrizione dettagliata del ricambio, condizioni, eventuali difetti..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Categoria</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
              >
                <option value="">Seleziona...</option>
                {SPARE_PART_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Prezzo (€) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
                placeholder="0.00"
                required
              />
            </div>
          </div>
        </div>

        {/* Veicolo Origine */}
        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Veicolo di Origine
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Marca</label>
              <input
                type="text"
                value={form.vehicle_brand}
                onChange={e => setForm({ ...form, vehicle_brand: e.target.value })}
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
                placeholder="Es: Fiat, BMW..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Modello</label>
              <input
                type="text"
                value={form.vehicle_model}
                onChange={e => setForm({ ...form, vehicle_model: e.target.value })}
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
                placeholder="Es: Punto, Serie 3..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Anno</label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={form.vehicle_year}
                onChange={e => setForm({ ...form, vehicle_year: e.target.value })}
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
                placeholder="2020"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-400 mb-2">VIN (Telaio)</label>
              <input
                type="text"
                value={form.vin}
                onChange={e => setForm({ ...form, vin: e.target.value.toUpperCase() })}
                maxLength="17"
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200 font-mono"
                placeholder="WVWZZZ1KZBW123456"
              />
            </div>
          </div>
        </div>

        {/* Condizioni */}
        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Condizioni e Qualità
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Condizione</label>
              <select
                value={form.condition}
                onChange={e => setForm({ ...form, condition: e.target.value })}
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
              >
                {CONDITIONS.map(cond => (
                  <option key={cond.value} value={cond.value}>{cond.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Grado Qualità</label>
              <select
                value={form.quality_grade}
                onChange={e => setForm({ ...form, quality_grade: e.target.value })}
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
              >
                {QUALITY_GRADES.map(grade => (
                  <option key={grade.value} value={grade.value}>{grade.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Garanzia (giorni)</label>
              <input
                type="number"
                min="0"
                value={form.warranty_days}
                onChange={e => setForm({ ...form, warranty_days: Number.parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Disponibilità e Spedizione */}
        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Disponibilità e Spedizione
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Quantità Totale</label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={e => {
                  const qty = Number.parseInt(e.target.value) || 1;
                  setForm({ 
                    ...form, 
                    quantity: qty,
                    available_quantity: Math.min(form.available_quantity, qty)
                  });
                }}
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Quantità Disponibile</label>
              <input
                type="number"
                min="0"
                max={form.quantity}
                value={form.available_quantity}
                onChange={e => setForm({ ...form, available_quantity: Number.parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
              />
            </div>

            <div className="md:col-span-2 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.shipping_available}
                  onChange={e => setForm({ ...form, shipping_available: e.target.checked })}
                  className="w-4 h-4 rounded border-[#243044] bg-[#141c27] text-emerald-500"
                />
                <span className="text-sm text-slate-300">Spedizione disponibile</span>
              </label>

              {form.shipping_available && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Costo Spedizione (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.shipping_cost}
                    onChange={e => setForm({ ...form, shipping_cost: e.target.value })}
                    className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
                    placeholder="0.00 (lascia vuoto se gratis)"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.pickup_only}
                  onChange={e => setForm({ ...form, pickup_only: e.target.checked })}
                  className="w-4 h-4 rounded border-[#243044] bg-[#141c27] text-emerald-500"
                />
                <span className="text-sm text-slate-300">Solo ritiro in sede</span>
              </label>

              {form.pickup_only && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Indirizzo Ritiro</label>
                  <textarea
                    value={form.pickup_address}
                    onChange={e => setForm({ ...form, pickup_address: e.target.value })}
                    rows="2"
                    className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
                    placeholder="Indirizzo completo per il ritiro..."
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Immagini */}
        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Immagini
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {form.images.map((img, index) => (
              <div key={index} className="relative group">
                <img 
                  src={img} 
                  alt={`Immagine ${index + 1}`} 
                  className="w-full h-32 object-cover rounded-lg border border-[#243044]"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
              disabled={uploadingImage}
            />
            <label
              htmlFor="image-upload"
              className={`inline-flex items-center gap-2 px-4 py-2 border border-[#243044] rounded-lg text-sm transition cursor-pointer ${
                uploadingImage 
                  ? 'bg-[#141c27] text-slate-500 cursor-not-allowed' 
                  : 'bg-[#1a2536] text-slate-300 hover:bg-[#243044]'
              }`}
            >
              <FiUpload className="w-4 h-4" />
              {uploadingImage ? 'Caricamento...' : 'Carica Immagine'}
            </label>
            <p className="text-xs text-slate-500 mt-2">Formati supportati: JPG, PNG, WebP (max 5MB)</p>
          </div>
        </div>

        {/* Tag */}
        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Tag di Ricerca
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.tags.map(tag => (
              <span 
                key={tag}
                className="px-3 py-1 bg-blue-500/10 text-blue-400 text-sm rounded-full flex items-center gap-2"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-blue-300"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="flex-1 px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
              placeholder="Aggiungi tag (es: originale, garantito, km certificati...)"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition"
            >
              Aggiungi
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/marketplace/miei-annunci')}
            className="px-4 py-2 bg-[#1a2536] border border-[#243044] text-slate-300 text-sm rounded-lg hover:bg-[#243044] transition"
          >
            Annulla
          </button>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              <FiSave className="w-4 h-4" />
              {loading ? 'Salvataggio...' : 'Salva Bozza'}
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={loading}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              <FiSend className="w-4 h-4" />
              {loading ? 'Pubblicazione...' : 'Pubblica Ora'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
