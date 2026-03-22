/**
 * Marketplace B2B Dashboard
 * Vista principale marketplace ricambi tra demolitori
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../context/OrgContext';
import { 
  listMarketplaceListings, 
  listMyListings,
  listSentOffers,
  listReceivedOffers,
  countUnreadMessages,
  getOrgStats,
  SPARE_PART_CATEGORIES,
  CONDITIONS
} from '../lib/marketplace-b2b';
import { 
  FiSearch, 
  FiShoppingCart, 
  FiPackage, 
  FiTrendingUp, 
  FiMessageSquare,
  FiStar,
  FiMapPin,
  FiFilter,
  FiHeart,
  FiEye
} from 'react-icons/fi';

export default function MarketplaceDashboard() {
  const navigate = useNavigate();
  const { orgId } = useOrg();

  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [stats, setStats] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingOffers, setPendingOffers] = useState({ sent: 0, received: 0 });

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    vehicle_brand: '',
    condition: '',
    min_price: '',
    max_price: '',
    shipping_available: undefined
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (orgId) {
      loadData();
    }
  }, [orgId]);

  useEffect(() => {
    if (orgId) {
      loadListings();
    }
  }, [orgId, filters]);

  async function loadData() {
    setLoading(true);
    try {
      const [myListingsRes, statsRes, messagesRes, sentOffersRes, receivedOffersRes] = await Promise.all([
        listMyListings(orgId, 'active'),
        getOrgStats(orgId),
        countUnreadMessages(orgId),
        listSentOffers(orgId, 'pending'),
        listReceivedOffers(orgId, 'pending')
      ]);

      setMyListings(myListingsRes.data || []);
      setStats(statsRes.data);
      setUnreadMessages(messagesRes.count || 0);
      setPendingOffers({
        sent: sentOffersRes.data?.length || 0,
        received: receivedOffersRes.data?.length || 0
      });
    } catch (err) {
      console.error('Errore caricamento dati:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadListings() {
    try {
      const { data } = await listMarketplaceListings(filters);
      // Escludi i propri annunci dalla ricerca
      setListings((data || []).filter(l => l.org_id !== orgId));
    } catch (err) {
      console.error('Errore caricamento annunci:', err);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    loadListings();
  }

  function resetFilters() {
    setFilters({
      search: '',
      category: '',
      vehicle_brand: '',
      condition: '',
      min_price: '',
      max_price: '',
      shipping_available: undefined
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-400">Caricamento marketplace...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-200">Marketplace B2B</h1>
          <p className="text-sm text-slate-400 mt-1">Compra e vendi ricambi con altri demolitori</p>
        </div>
      </div>

      <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-4 mb-6">
        <p className="text-sm text-slate-300">
          Per pubblicare un annuncio sul Marketplace B2B crea/modifica un ricambio in <span className="font-semibold">Ricambi</span> e abilita il toggle Marketplace.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Miei Annunci</p>
              <p className="text-2xl font-semibold text-slate-200 mt-1">{myListings.length}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <FiPackage className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Offerte Ricevute</p>
              <p className="text-2xl font-semibold text-slate-200 mt-1">{pendingOffers.received}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <FiShoppingCart className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Messaggi</p>
              <p className="text-2xl font-semibold text-slate-200 mt-1">{unreadMessages}</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <FiMessageSquare className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Reputazione</p>
              <div className="flex items-center gap-1 mt-1">
                <FiStar className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <p className="text-2xl font-semibold text-slate-200">
                  {stats?.average_rating?.toFixed(1) || '0.0'}
                </p>
                <span className="text-xs text-slate-500 ml-1">({stats?.total_reviews || 0})</span>
              </div>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => navigate('/marketplace/miei-annunci')}
          className="p-4 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition text-left"
        >
          <FiPackage className="w-5 h-5 text-blue-400 mb-2" />
          <p className="text-sm font-medium text-slate-200">I Miei Annunci</p>
          <p className="text-xs text-slate-500 mt-1">{myListings.length} attivi</p>
        </button>

        <button
          onClick={() => navigate('/marketplace/offerte')}
          className="p-4 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition text-left"
        >
          <FiShoppingCart className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-sm font-medium text-slate-200">Offerte</p>
          <p className="text-xs text-slate-500 mt-1">{pendingOffers.received} da gestire</p>
        </button>

        <button
          onClick={() => navigate('/marketplace/messaggi')}
          className="p-4 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition text-left"
        >
          <FiMessageSquare className="w-5 h-5 text-purple-400 mb-2" />
          <p className="text-sm font-medium text-slate-200">Messaggi</p>
          <p className="text-xs text-slate-500 mt-1">{unreadMessages} non letti</p>
        </button>

        <button
          onClick={() => navigate('/marketplace/preferiti')}
          className="p-4 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition text-left"
        >
          <FiHeart className="w-5 h-5 text-red-400 mb-2" />
          <p className="text-sm font-medium text-slate-200">Preferiti</p>
          <p className="text-xs text-slate-500 mt-1">Annunci salvati</p>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-5 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
                placeholder="Cerca ricambi, marca, modello..."
                className="w-full pl-10 pr-4 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200 placeholder-slate-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg text-sm transition flex items-center gap-2 ${
                showFilters 
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                  : 'bg-[#141c27] border-[#243044] text-slate-400 hover:text-slate-200'
              }`}
            >
              <FiFilter className="w-4 h-4" />
              Filtri
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition"
            >
              Cerca
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-[#243044]">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Categoria</label>
                <select
                  value={filters.category}
                  onChange={e => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
                >
                  <option value="">Tutte</option>
                  {SPARE_PART_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Marca Veicolo</label>
                <input
                  type="text"
                  value={filters.vehicle_brand}
                  onChange={e => setFilters({ ...filters, vehicle_brand: e.target.value })}
                  placeholder="Es: Fiat, BMW..."
                  className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Condizione</label>
                <select
                  value={filters.condition}
                  onChange={e => setFilters({ ...filters, condition: e.target.value })}
                  className="w-full px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
                >
                  <option value="">Tutte</option>
                  {CONDITIONS.map(cond => (
                    <option key={cond.value} value={cond.value}>{cond.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Prezzo (€)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={filters.min_price}
                    onChange={e => setFilters({ ...filters, min_price: e.target.value })}
                    placeholder="Min"
                    className="w-1/2 px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
                  />
                  <input
                    type="number"
                    value={filters.max_price}
                    onChange={e => setFilters({ ...filters, max_price: e.target.value })}
                    placeholder="Max"
                    className="w-1/2 px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
                  />
                </div>
              </div>

              <div className="md:col-span-4 flex justify-end">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm text-slate-400 hover:text-slate-200 transition"
                >
                  Resetta filtri
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Listings Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-200">
            Annunci Disponibili ({listings.length})
          </h2>
        </div>

        {listings.length === 0 ? (
          <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-12 text-center">
            <FiPackage className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Nessun annuncio trovato</p>
            <p className="text-sm text-slate-500 mt-2">Prova a modificare i filtri di ricerca</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} onView={() => navigate(`/marketplace/annunci/${listing.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ListingCard({ listing, onView }) {
  const mainImage = listing.images?.[0] || null;
  const condition = CONDITIONS.find(c => c.value === listing.condition);

  return (
    <div
      onClick={onView}
      className="bg-[#1a2536] border border-[#243044] rounded-xl overflow-hidden hover:border-emerald-500/30 transition cursor-pointer group"
    >
      {/* Image */}
      <div className="relative h-48 bg-[#141c27] overflow-hidden">
        {mainImage ? (
          <img src={mainImage} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <FiPackage className="w-16 h-16 text-slate-600" />
          </div>
        )}
        {listing.featured && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-xs font-semibold text-slate-900 rounded">
            IN EVIDENZA
          </div>
        )}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-xs text-white rounded flex items-center gap-1">
          <FiEye className="w-3 h-3" />
          {listing.views_count || 0}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-200 line-clamp-2 flex-1">
            {listing.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
          {listing.vehicle_brand && (
            <span>{listing.vehicle_brand} {listing.vehicle_model}</span>
          )}
          {listing.vehicle_year && (
            <span>• {listing.vehicle_year}</span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded">
            {condition?.label || listing.condition}
          </span>
          {listing.quality_grade && (
            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded font-semibold">
              Grado {listing.quality_grade}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#243044]">
          <div>
            <p className="text-xs text-slate-500">Prezzo</p>
            <p className="text-lg font-bold text-emerald-400">€{listing.price.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <FiMapPin className="w-3 h-3" />
              <span>{listing.org?.city || 'N/A'}</span>
            </div>
            {listing.shipping_available && (
              <p className="text-xs text-blue-400 mt-1">Spedizione disponibile</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
