/**
 * Miei Annunci Marketplace B2B
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../context/OrgContext';
import { listMyListings, updateListing, removeListing } from '../lib/marketplace-b2b';
import { FiEdit2, FiTrash2, FiEye, FiPackage, FiCheck, FiX } from 'react-icons/fi';

export default function MarketplaceMyListings() {
  const navigate = useNavigate();
  const { orgId } = useOrg();

  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [filter, setFilter] = useState('all'); // all, active, draft, sold

  useEffect(() => {
    if (orgId) {
      loadListings();
    }
  }, [orgId, filter]);

  async function loadListings() {
    setLoading(true);
    try {
      const statusFilter = filter === 'all' ? null : filter;
      const { data } = await listMyListings(orgId, statusFilter);
      setListings(data || []);
    } catch (err) {
      console.error('Errore caricamento annunci:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(listingId) {
    if (!confirm('Sei sicuro di voler rimuovere questo annuncio?')) return;

    try {
      await removeListing(listingId);
      loadListings();
    } catch (err) {
      console.error('Errore rimozione:', err);
      alert('Errore rimozione annuncio');
    }
  }

  async function handleToggleStatus(listing) {
    try {
      const newStatus = listing.status === 'active' ? 'draft' : 'active';
      await updateListing(listing.id, { status: newStatus });
      loadListings();
    } catch (err) {
      console.error('Errore cambio stato:', err);
      alert('Errore cambio stato');
    }
  }

  const stats = {
    total: listings.length,
    active: listings.filter(l => l.status === 'active').length,
    draft: listings.filter(l => l.status === 'draft').length,
    sold: listings.filter(l => l.status === 'sold').length
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-200">I Miei Annunci</h1>
          <p className="text-sm text-slate-400 mt-1">Gestisci i tuoi annunci sul marketplace</p>
        </div>
      </div>

      <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-4 mb-6">
        <p className="text-sm text-slate-300">
          Gli annunci si pubblicano dal modulo <span className="font-semibold">Ricambi</span> (toggle Marketplace).
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-xl border transition ${
            filter === 'all'
              ? 'bg-blue-500/10 border-blue-500/30'
              : 'bg-[#1a2536] border-[#243044] hover:border-[#3a4a64]'
          }`}
        >
          <p className="text-xs text-slate-400 uppercase tracking-wider">Totali</p>
          <p className="text-2xl font-semibold text-slate-200 mt-1">{stats.total}</p>
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`p-4 rounded-xl border transition ${
            filter === 'active'
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-[#1a2536] border-[#243044] hover:border-[#3a4a64]'
          }`}
        >
          <p className="text-xs text-slate-400 uppercase tracking-wider">Attivi</p>
          <p className="text-2xl font-semibold text-emerald-400 mt-1">{stats.active}</p>
        </button>
        <button
          onClick={() => setFilter('draft')}
          className={`p-4 rounded-xl border transition ${
            filter === 'draft'
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-[#1a2536] border-[#243044] hover:border-[#3a4a64]'
          }`}
        >
          <p className="text-xs text-slate-400 uppercase tracking-wider">Bozze</p>
          <p className="text-2xl font-semibold text-amber-400 mt-1">{stats.draft}</p>
        </button>
        <button
          onClick={() => setFilter('sold')}
          className={`p-4 rounded-xl border transition ${
            filter === 'sold'
              ? 'bg-purple-500/10 border-purple-500/30'
              : 'bg-[#1a2536] border-[#243044] hover:border-[#3a4a64]'
          }`}
        >
          <p className="text-xs text-slate-400 uppercase tracking-wider">Venduti</p>
          <p className="text-2xl font-semibold text-purple-400 mt-1">{stats.sold}</p>
        </button>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Caricamento...</div>
      ) : listings.length === 0 ? (
        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-12 text-center">
          <FiPackage className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">Nessun annuncio trovato</p>
          <p className="text-sm text-slate-500 mb-4">Inizia a pubblicare i tuoi ricambi sul marketplace</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onEdit={() => navigate(`/marketplace/annunci/${listing.id}/modifica`)}
              onView={() => navigate(`/marketplace/annunci/${listing.id}`)}
              onRemove={() => handleRemove(listing.id)}
              onToggleStatus={() => handleToggleStatus(listing)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingCard({ listing, onEdit, onView, onRemove, onToggleStatus }) {
  const mainImage = listing.images?.[0];
  
  const statusConfig = {
    active: { label: 'Attivo', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    draft: { label: 'Bozza', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    sold: { label: 'Venduto', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    expired: { label: 'Scaduto', color: 'text-red-400', bg: 'bg-red-500/10' },
    removed: { label: 'Rimosso', color: 'text-slate-400', bg: 'bg-slate-500/10' }
  };

  const status = statusConfig[listing.status] || statusConfig.draft;

  return (
    <div className="bg-[#1a2536] border border-[#243044] rounded-xl overflow-hidden hover:border-emerald-500/30 transition">
      {/* Image */}
      <div className="relative h-48 bg-[#141c27]">
        {mainImage ? (
          <img src={mainImage} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <FiPackage className="w-16 h-16 text-slate-600" />
          </div>
        )}
        <div className={`absolute top-2 right-2 px-2 py-1 ${status.bg} backdrop-blur-sm rounded text-xs font-semibold ${status.color}`}>
          {status.label}
        </div>
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-xs text-white rounded flex items-center gap-1">
          <FiEye className="w-3 h-3" />
          {listing.views_count || 0}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-slate-200 line-clamp-2 mb-2">
          {listing.title}
        </h3>

        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-slate-500">Prezzo</p>
            <p className="text-lg font-bold text-emerald-400">€{listing.price.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Disponibili</p>
            <p className="text-sm text-slate-200 font-medium">{listing.available_quantity}/{listing.quantity}</p>
          </div>
        </div>

        {listing.offers_count > 0 && (
          <div className="mb-3 px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded text-center">
            {listing.offers_count} {listing.offers_count === 1 ? 'offerta' : 'offerte'}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-[#243044]">
          <button
            onClick={onView}
            className="flex-1 px-3 py-2 bg-[#141c27] border border-[#243044] text-slate-300 text-xs rounded-lg hover:bg-[#243044] transition flex items-center justify-center gap-1"
          >
            <FiEye className="w-3 h-3" />
            Vedi
          </button>
          <button
            onClick={onEdit}
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition flex items-center justify-center gap-1"
          >
            <FiEdit2 className="w-3 h-3" />
            Modifica
          </button>
          <button
            onClick={onToggleStatus}
            className={`px-3 py-2 rounded-lg text-xs transition ${
              listing.status === 'active'
                ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
            }`}
            title={listing.status === 'active' ? 'Disattiva' : 'Attiva'}
          >
            {listing.status === 'active' ? <FiX className="w-4 h-4" /> : <FiCheck className="w-4 h-4" />}
          </button>
          <button
            onClick={onRemove}
            className="px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs rounded-lg transition"
            title="Rimuovi"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
