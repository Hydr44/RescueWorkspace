/**
 * Gestione Offerte Marketplace B2B
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../context/OrgContext';
import { 
  listReceivedOffers, 
  listSentOffers, 
  acceptOffer, 
  rejectOffer,
  counterOffer 
} from '../lib/marketplace-b2b';
import { FiCheck, FiX, FiMessageSquare, FiPackage, FiDollarSign, FiClock } from 'react-icons/fi';

export default function MarketplaceOffers() {
  const navigate = useNavigate();
  const { orgId } = useOrg();

  const [activeTab, setActiveTab] = useState('received'); // received, sent
  const [loading, setLoading] = useState(true);
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [sentOffers, setSentOffers] = useState([]);

  useEffect(() => {
    if (orgId) {
      loadOffers();
    }
  }, [orgId, activeTab]);

  async function loadOffers() {
    setLoading(true);
    try {
      if (activeTab === 'received') {
        const { data } = await listReceivedOffers(orgId);
        setReceivedOffers(data || []);
      } else {
        const { data } = await listSentOffers(orgId);
        setSentOffers(data || []);
      }
    } catch (err) {
      console.error('Errore caricamento offerte:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(offerId) {
    if (!confirm('Accettare questa offerta? Verrà creato un ordine.')) return;

    try {
      await acceptOffer(offerId);
      alert('Offerta accettata! Contatta l\'acquirente per finalizzare.');
      loadOffers();
    } catch (err) {
      console.error('Errore accettazione:', err);
      alert('Errore: ' + err.message);
    }
  }

  async function handleReject(offerId) {
    if (!confirm('Rifiutare questa offerta?')) return;

    try {
      await rejectOffer(offerId);
      loadOffers();
    } catch (err) {
      console.error('Errore rifiuto:', err);
      alert('Errore: ' + err.message);
    }
  }

  const offers = activeTab === 'received' ? receivedOffers : sentOffers;
  const pendingCount = offers.filter(o => o.status === 'pending').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-200">Gestione Offerte</h1>
        <p className="text-sm text-slate-400 mt-1">Offerte ricevute e inviate sul marketplace</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-6 py-3 rounded-lg text-sm font-medium transition ${
            activeTab === 'received'
              ? 'bg-emerald-600 text-white'
              : 'bg-[#1a2536] border border-[#243044] text-slate-400 hover:text-slate-200'
          }`}
        >
          Offerte Ricevute
          {receivedOffers.filter(o => o.status === 'pending').length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {receivedOffers.filter(o => o.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-6 py-3 rounded-lg text-sm font-medium transition ${
            activeTab === 'sent'
              ? 'bg-blue-600 text-white'
              : 'bg-[#1a2536] border border-[#243044] text-slate-400 hover:text-slate-200'
          }`}
        >
          Offerte Inviate
          {sentOffers.filter(o => o.status === 'pending').length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {sentOffers.filter(o => o.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* Offers List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Caricamento...</div>
      ) : offers.length === 0 ? (
        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-12 text-center">
          <FiPackage className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Nessuna offerta {activeTab === 'received' ? 'ricevuta' : 'inviata'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map(offer => (
            <OfferCard
              key={offer.id}
              offer={offer}
              type={activeTab}
              onAccept={() => handleAccept(offer.id)}
              onReject={() => handleReject(offer.id)}
              onViewListing={() => navigate(`/marketplace/annunci/${offer.listing_id}`)}
              onMessage={() => navigate(`/marketplace/messaggi?offer=${offer.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OfferCard({ offer, type, onAccept, onReject, onViewListing, onMessage }) {
  const isReceived = type === 'received';
  const listing = offer.listing;
  
  const statusConfig = {
    pending: { label: 'In Attesa', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    accepted: { label: 'Accettata', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    rejected: { label: 'Rifiutata', color: 'text-red-400', bg: 'bg-red-500/10' },
    countered: { label: 'Controproposta', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    expired: { label: 'Scaduta', color: 'text-slate-400', bg: 'bg-slate-500/10' }
  };

  const status = statusConfig[offer.status] || statusConfig.pending;

  return (
    <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-5 hover:border-emerald-500/30 transition">
      <div className="flex gap-4">
        {/* Listing Image */}
        <div className="w-24 h-24 rounded-lg bg-[#141c27] flex-shrink-0 overflow-hidden">
          {listing?.images?.[0] ? (
            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <FiPackage className="w-8 h-8 text-slate-600" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <button
                onClick={onViewListing}
                className="text-sm font-semibold text-slate-200 hover:text-emerald-400 transition line-clamp-1"
              >
                {listing?.title || 'Annuncio rimosso'}
              </button>
              <p className="text-xs text-slate-500 mt-1">
                {isReceived ? 'Da' : 'A'}: {isReceived ? offer.buyer_org?.name : listing?.org?.name}
              </p>
            </div>
            <div className={`px-3 py-1 ${status.bg} rounded-lg`}>
              <span className={`text-xs font-semibold ${status.color}`}>{status.label}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
            <div>
              <p className="text-xs text-slate-500">Prezzo Richiesto</p>
              <p className="text-sm text-slate-300 font-medium">€{listing?.price?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Offerta</p>
              <p className="text-sm text-emerald-400 font-bold">€{offer.offered_price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Quantità</p>
              <p className="text-sm text-slate-300 font-medium">{offer.quantity}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Pagamento</p>
              <p className="text-sm text-slate-300 font-medium">
                {offer.payment_method === 'bank_transfer' ? 'Bonifico' : 'Contanti'}
              </p>
            </div>
          </div>

          {offer.message && (
            <div className="mb-3 p-3 bg-[#141c27] rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Messaggio:</p>
              <p className="text-sm text-slate-300">{offer.message}</p>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FiClock className="w-3 h-3" />
            <span>{new Date(offer.created_at).toLocaleString('it-IT')}</span>
          </div>
        </div>

        {/* Actions */}
        {isReceived && offer.status === 'pending' && (
          <div className="flex flex-col gap-2">
            <button
              onClick={onAccept}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition flex items-center gap-2"
            >
              <FiCheck className="w-4 h-4" />
              Accetta
            </button>
            <button
              onClick={onReject}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition flex items-center gap-2"
            >
              <FiX className="w-4 h-4" />
              Rifiuta
            </button>
            <button
              onClick={onMessage}
              className="px-4 py-2 bg-[#141c27] border border-[#243044] text-slate-300 text-sm rounded-lg hover:bg-[#243044] transition flex items-center gap-2"
            >
              <FiMessageSquare className="w-4 h-4" />
              Messaggio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
