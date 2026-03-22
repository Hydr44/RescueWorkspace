/**
 * Dettaglio Annuncio Marketplace B2B
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOrg } from '../context/OrgContext';
import { 
  getMarketplaceListing,
  createOffer,
  addFavorite,
  removeFavorite,
  isFavorite,
  incrementListingViews,
  CONDITIONS,
  QUALITY_GRADES
} from '../lib/marketplace-b2b';
import { 
  FiArrowLeft, 
  FiMapPin, 
  FiPackage, 
  FiTruck, 
  FiStar,
  FiHeart,
  FiMessageSquare,
  FiShield,
  FiEye,
  FiCalendar,
  FiDollarSign
} from 'react-icons/fi';

export default function MarketplaceListingDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { orgId } = useOrg();

  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);

  useEffect(() => {
    if (id && orgId) {
      loadListing();
      checkFavorite();
      incrementViews();
    }
  }, [id, orgId]);

  async function loadListing() {
    setLoading(true);
    try {
      const { data, error } = await getMarketplaceListing(id);
      if (error) throw error;
      setListing(data);
    } catch (err) {
      console.error('Errore caricamento annuncio:', err);
      alert('Errore caricamento annuncio');
    } finally {
      setLoading(false);
    }
  }

  async function checkFavorite() {
    try {
      const { isFavorite: fav } = await isFavorite(orgId, id);
      setIsFav(fav);
    } catch (err) {
      console.error('Errore verifica preferito:', err);
    }
  }

  async function incrementViews() {
    try {
      await incrementListingViews(id);
    } catch (err) {
      console.error('Errore incremento visualizzazioni:', err);
    }
  }

  async function toggleFavorite() {
    setLoadingFav(true);
    try {
      if (isFav) {
        await removeFavorite(orgId, id);
        setIsFav(false);
      } else {
        await addFavorite(orgId, id);
        setIsFav(true);
      }
    } catch (err) {
      console.error('Errore gestione preferito:', err);
      alert('Errore: ' + err.message);
    } finally {
      setLoadingFav(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-400">Caricamento...</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-slate-400">Annuncio non trovato</p>
          <button
            onClick={() => navigate('/marketplace')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Torna al Marketplace
          </button>
        </div>
      </div>
    );
  }

  const condition = CONDITIONS.find(c => c.value === listing.condition);
  const qualityGrade = QUALITY_GRADES.find(g => g.value === listing.quality_grade);
  const isMyListing = listing.org_id === orgId;
  const images = listing.images || [];
  const currentImage = images[currentImageIndex];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/marketplace')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition"
        >
          <FiArrowLeft className="w-4 h-4" />
          Torna al Marketplace
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFavorite}
            disabled={loadingFav || isMyListing}
            className={`p-2 rounded-lg transition ${
              isFav 
                ? 'bg-red-500/10 text-red-400' 
                : 'bg-[#1a2536] border border-[#243044] text-slate-400 hover:text-red-400'
            } disabled:opacity-50`}
          >
            <FiHeart className={`w-5 h-5 ${isFav ? 'fill-red-400' : ''}`} />
          </button>
          {isMyListing && (
            <button
              onClick={() => navigate(`/marketplace/annunci/${id}/modifica`)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition"
            >
              Modifica Annuncio
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonna Sinistra - Immagini */}
        <div className="lg:col-span-2 space-y-4">
          {/* Immagine Principale */}
          <div className="bg-[#1a2536] border border-[#243044] rounded-xl overflow-hidden">
            {currentImage ? (
              <div className="relative">
                <img 
                  src={currentImage} 
                  alt={listing.title}
                  className="w-full h-96 object-cover"
                />
                {listing.featured && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-yellow-500 text-slate-900 text-sm font-semibold rounded-lg">
                    IN EVIDENZA
                  </div>
                )}
                <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white text-sm rounded-lg flex items-center gap-2">
                  <FiEye className="w-4 h-4" />
                  {listing.views_count || 0} visualizzazioni
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 bg-[#141c27]">
                <FiPackage className="w-24 h-24 text-slate-600" />
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative h-24 rounded-lg overflow-hidden border-2 transition ${
                    index === currentImageIndex 
                      ? 'border-emerald-500' 
                      : 'border-[#243044] hover:border-[#3a4a64]'
                  }`}
                >
                  <img src={img} alt={`${listing.title} ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Descrizione */}
          <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Descrizione</h2>
            <p className="text-slate-300 whitespace-pre-wrap">
              {listing.description || 'Nessuna descrizione disponibile.'}
            </p>

            {listing.tags && listing.tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#243044]">
                <p className="text-xs text-slate-500 mb-2">Tag:</p>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dettagli Veicolo */}
          {(listing.vehicle_brand || listing.vehicle_model || listing.vehicle_year || listing.vin) && (
            <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-4">Veicolo di Origine</h2>
              <div className="grid grid-cols-2 gap-4">
                {listing.vehicle_brand && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Marca</p>
                    <p className="text-sm text-slate-200 font-medium">{listing.vehicle_brand}</p>
                  </div>
                )}
                {listing.vehicle_model && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Modello</p>
                    <p className="text-sm text-slate-200 font-medium">{listing.vehicle_model}</p>
                  </div>
                )}
                {listing.vehicle_year && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Anno</p>
                    <p className="text-sm text-slate-200 font-medium">{listing.vehicle_year}</p>
                  </div>
                )}
                {listing.vin && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">VIN (Telaio)</p>
                    <p className="text-sm text-slate-200 font-medium font-mono">{listing.vin}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Colonna Destra - Info e Azioni */}
        <div className="space-y-4">
          {/* Prezzo e Titolo */}
          <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-6">
            <h1 className="text-2xl font-bold text-slate-200 mb-4">{listing.title}</h1>
            
            <div className="mb-4">
              <p className="text-sm text-slate-500 mb-1">Prezzo</p>
              <p className="text-3xl font-bold text-emerald-400">€{listing.price.toFixed(2)}</p>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-lg text-sm ${
                condition?.value === 'nuovo' 
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-blue-500/10 text-blue-400'
              }`}>
                {condition?.label || listing.condition}
              </span>
              {listing.quality_grade && (
                <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                  listing.quality_grade === 'A' 
                    ? 'bg-green-500/10 text-green-400'
                    : listing.quality_grade === 'B'
                    ? 'bg-yellow-500/10 text-yellow-400'
                    : 'bg-orange-500/10 text-orange-400'
                }`}>
                  Grado {listing.quality_grade}
                </span>
              )}
            </div>

            {listing.warranty_days > 0 && (
              <div className="flex items-center gap-2 text-sm text-emerald-400 mb-4">
                <FiShield className="w-4 h-4" />
                <span>Garanzia {listing.warranty_days} giorni</span>
              </div>
            )}

            {!isMyListing && (
              <button
                onClick={() => setShowOfferModal(true)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                <FiDollarSign className="w-5 h-5" />
                Fai un'Offerta
              </button>
            )}
          </div>

          {/* Info Venditore */}
          <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Venditore</h3>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-white font-semibold">
                {(listing.org?.name || 'V').substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-200">{listing.org?.name || 'Venditore'}</p>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <FiMapPin className="w-3 h-3" />
                  <span>{listing.org?.city || 'N/A'}, {listing.org?.province || ''}</span>
                </div>
              </div>
            </div>

            {listing.stats && (
              <div className="space-y-2 mb-4 pb-4 border-b border-[#243044]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Valutazione</span>
                  <div className="flex items-center gap-1">
                    <FiStar className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-slate-200 font-medium">
                      {listing.stats.average_rating?.toFixed(1) || '0.0'}
                    </span>
                    <span className="text-slate-500">({listing.stats.total_reviews || 0})</span>
                  </div>
                </div>
                {listing.stats.verified_seller && (
                  <div className="flex items-center gap-2 text-sm text-emerald-400">
                    <FiShield className="w-4 h-4" />
                    <span>Venditore Verificato</span>
                  </div>
                )}
              </div>
            )}

            {!isMyListing && (
              <button
                onClick={() => navigate(`/marketplace/messaggi?listing=${id}`)}
                className="w-full py-2 bg-[#141c27] border border-[#243044] text-slate-300 text-sm rounded-lg hover:bg-[#243044] transition flex items-center justify-center gap-2"
              >
                <FiMessageSquare className="w-4 h-4" />
                Contatta Venditore
              </button>
            )}
          </div>

          {/* Disponibilità e Spedizione */}
          <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Disponibilità</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Quantità disponibile</span>
                <span className="text-slate-200 font-medium">{listing.available_quantity} / {listing.quantity}</span>
              </div>

              {listing.shipping_available && (
                <div className="flex items-center gap-2 text-sm text-blue-400">
                  <FiTruck className="w-4 h-4" />
                  <span>Spedizione disponibile</span>
                  {listing.shipping_cost > 0 && (
                    <span className="ml-auto text-slate-300">€{listing.shipping_cost.toFixed(2)}</span>
                  )}
                </div>
              )}

              {listing.pickup_only && (
                <div className="flex items-center gap-2 text-sm text-amber-400">
                  <FiMapPin className="w-4 h-4" />
                  <span>Solo ritiro in sede</span>
                </div>
              )}
            </div>
          </div>

          {/* Info Pubblicazione */}
          <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-6">
            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <FiCalendar className="w-3 h-3" />
                <span>Pubblicato il {new Date(listing.published_at || listing.created_at).toLocaleDateString('it-IT')}</span>
              </div>
              {listing.category && (
                <div className="flex items-center gap-2">
                  <FiPackage className="w-3 h-3" />
                  <span>Categoria: {listing.category}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Fai Offerta */}
      {showOfferModal && (
        <OfferModal
          listing={listing}
          onClose={() => setShowOfferModal(false)}
          onSuccess={() => {
            setShowOfferModal(false);
            alert('Offerta inviata con successo!');
            navigate('/marketplace/offerte');
          }}
        />
      )}
    </div>
  );
}

function OfferModal({ listing, onClose, onSuccess }) {
  const { orgId } = useOrg();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    quantity: 1,
    offered_price: listing.price,
    message: '',
    include_shipping: true,
    pickup_preferred: false,
    payment_method: 'bank_transfer'
  });

  async function handleSubmit(e) {
    e.preventDefault();

    if (form.quantity < 1 || form.quantity > listing.available_quantity) {
      alert(`Quantità deve essere tra 1 e ${listing.available_quantity}`);
      return;
    }

    if (form.offered_price <= 0) {
      alert('Inserisci un prezzo valido');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabaseBrowser().auth.getUser();
      
      await createOffer(orgId, {
        listing_id: listing.id,
        buyer_user_id: user?.id,
        ...form
      });

      onSuccess();
    } catch (err) {
      console.error('Errore invio offerta:', err);
      alert('Errore invio offerta: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold text-slate-200 mb-4">Fai un'Offerta</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Quantità</label>
            <input
              type="number"
              min="1"
              max={listing.available_quantity}
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: Number.parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Prezzo Offerto (€)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.offered_price}
              onChange={e => setForm({ ...form, offered_price: Number.parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Prezzo richiesto: €{listing.price.toFixed(2)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Metodo Pagamento</label>
            <select
              value={form.payment_method}
              onChange={e => setForm({ ...form, payment_method: e.target.value })}
              className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
            >
              <option value="bank_transfer">Bonifico Bancario</option>
              <option value="cash">Contanti al Ritiro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Messaggio (opzionale)</label>
            <textarea
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
              placeholder="Aggiungi dettagli sulla tua offerta..."
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.pickup_preferred}
                onChange={e => setForm({ ...form, pickup_preferred: e.target.checked })}
                className="w-4 h-4 rounded border-[#243044] bg-[#141c27] text-emerald-500"
              />
              <span className="text-sm text-slate-300">Preferisco ritiro in sede</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#141c27] border border-[#243044] text-slate-300 rounded-lg hover:bg-[#243044] transition"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Invio...' : 'Invia Offerta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Import necessario per supabase nel modal
import { supabaseBrowser } from '../lib/supabase-browser';
