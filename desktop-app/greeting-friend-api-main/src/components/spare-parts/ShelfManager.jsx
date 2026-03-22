// src/components/spare-parts/ShelfManager.jsx
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiPlus, FiEdit, FiTrash2, FiMapPin, FiSearch, FiRefreshCw, FiX } from 'react-icons/fi';
import { supabase } from '@/integrations/supabase/client';
import { useOrg } from '@/context/OrgContext';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';

const ShelfManager = ({ onShelfUpdate }) => {
  const { orgId } = useOrg();
  const { showSuccess, showError } = useToast();
  
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingShelf, setEditingShelf] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');

  const [formData, setFormData] = useState({
    code: '',
    area: '',
    section: '',
    shelf_number: '',
    description: '',
    capacity: '',
    notes: ''
  });

  useEffect(() => {
    if (orgId) {
      loadShelves();
    }
  }, [orgId]);

  const loadShelves = async () => {
    if (!orgId) return;

    setLoading(true);
    try {
      // Prima carica gli scaffali
      let query = supabase
        .from('shelves')
        .select('*')
        .eq('org_id', orgId)
        .eq('active', true)
        .order('area', { ascending: true })
        .order('section', { ascending: true })
        .order('shelf_number', { ascending: true });

      if (selectedArea !== 'all') {
        query = query.eq('area', selectedArea);
      }

      const { data: shelvesData, error } = await query;
      if (error) throw error;

      // Poi carica i ricambi per ogni scaffale
      if (shelvesData && shelvesData.length > 0) {
        const shelfIds = shelvesData.map(s => s.id);
        const { data: partsData } = await supabase
          .from('spare_parts')
          .select('id, name, quantity, status, shelf_id')
          .in('shelf_id', shelfIds)
          .eq('org_id', orgId);

        // Combina i dati
        const shelvesWithParts = shelvesData.map(shelf => ({
          ...shelf,
          spare_parts: partsData?.filter(p => p.shelf_id === shelf.id) || []
        }));

        setShelves(shelvesWithParts);
      } else {
        setShelves(shelvesData || []);
      }
    } catch (error) {
      logger.error('Error loading shelves:', error);
      showError('Errore nel caricamento degli scaffali');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orgId) return;

    try {
      const payload = {
        org_id: orgId,
        code: formData.code.trim(),
        area: formData.area.trim(),
        section: formData.section.trim(),
        shelf_number: formData.shelf_number.trim(),
        description: formData.description.trim() || null,
        capacity: formData.capacity ? Number.parseInt(formData.capacity, 10) : null,
        notes: formData.notes.trim() || null,
        active: true
      };

      if (editingShelf) {
        const { error } = await supabase
          .from('shelves')
          .update(payload)
          .eq('id', editingShelf.id)
          .eq('org_id', orgId);

        if (error) throw error;
        showSuccess('Scaffale aggiornato con successo');
      } else {
        const { error } = await supabase
          .from('shelves')
          .insert([payload]);

        if (error) throw error;
        showSuccess('Scaffale creato con successo');
      }

      setShowForm(false);
      setEditingShelf(null);
      resetForm();
      await loadShelves();
      if (onShelfUpdate) onShelfUpdate();

    } catch (error) {
      logger.error('Error saving shelf:', error);
      if (error.code === '23505') {
        showError('Codice scaffale già esistente');
      } else {
        showError('Errore nel salvataggio dello scaffale');
      }
    }
  };

  const handleEdit = (shelf) => {
    setEditingShelf(shelf);
    setFormData({
      code: shelf.code,
      area: shelf.area || '',
      section: shelf.section || '',
      shelf_number: shelf.shelf_number || '',
      description: shelf.description || '',
      capacity: shelf.capacity ? shelf.capacity.toString() : '',
      notes: shelf.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (shelf) => {
    if (!orgId) return;

    if (!confirm(`Sei sicuro di voler eliminare lo scaffale ${shelf.code}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('shelves')
        .update({ active: false })
        .eq('id', shelf.id)
        .eq('org_id', orgId);

      if (error) throw error;

      showSuccess('Scaffale eliminato con successo');
      await loadShelves();
      if (onShelfUpdate) onShelfUpdate();

    } catch (error) {
      logger.error('Error deleting shelf:', error);
      showError('Errore nell\'eliminazione dello scaffale');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      area: '',
      section: '',
      shelf_number: '',
      description: '',
      capacity: '',
      notes: ''
    });
  };

  const filteredShelves = shelves.filter(shelf => {
    const matchesSearch = !searchQuery || 
      shelf.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shelf.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shelf.area?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getAreas = () => {
    const areas = [...new Set(shelves.map(s => s.area).filter(Boolean))];
    return areas.sort();
  };

  const getShelfStats = (shelf) => {
    const parts = shelf.spare_parts || [];
    const totalParts = parts.length;
    const totalQuantity = parts.reduce((sum, part) => sum + (part.quantity || 0), 0);
    const availableParts = parts.filter(part => part.status === 'available').length;
    
    return {
      totalParts,
      totalQuantity,
      availableParts,
      utilization: shelf.capacity ? Math.round((totalQuantity / shelf.capacity) * 100) : 0
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-sm text-slate-500">Caricamento scaffali...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestione Scaffali</h3>
          <p className="text-sm text-slate-500">
            {shelves.length} scaffali attivi
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void loadShelves()}
            className="btn btn-outline"
          >
            <FiRefreshCw className="h-4 w-4" />
            Aggiorna
          </button>
          <button
            onClick={() => {
              setEditingShelf(null);
              resetForm();
              setShowForm(true);
            }}
            className="btn btn-primary"
          >
            <FiPlus className="h-4 w-4" />
            Nuovo Scaffale
          </button>
        </div>
      </div>

      {/* Filtri */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cerca scaffali..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-md border px-3 py-2 pl-9 w-full text-sm form-input focus-ring"
            />
          </div>
        </div>

        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm min-w-[150px] form-input focus-ring"
        >
          <option value="all">Tutte le aree</option>
          {getAreas().map(area => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>
      </div>

      {/* Lista Scaffali */}
      {filteredShelves.length === 0 ? (
        <div className="text-center py-8">
          <FiMapPin className="h-12 w-12 mx-auto mb-4 text-slate-500" />
          <p className="text-slate-500">Nessuno scaffale trovato</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredShelves.map((shelf) => {
            const stats = getShelfStats(shelf);
            return (
              <div
                key={shelf.id}
                className="border border-[#243044]  rounded-lg p-4 bg-[#141c27]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold">{shelf.code}</h4>
                    {shelf.description && (
                      <p className="text-sm text-slate-500 mt-1">
                        {shelf.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(shelf)}
                      className="btn btn-ghost px-2 py-1"
                      title="Modifica"
                    >
                      <FiEdit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(shelf)}
                      className="btn btn-ghost px-2 py-1 text-red-600 hover:text-red-400"
                      title="Elimina"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Area:</span>
                    <span className="font-medium">{shelf.area || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sezione:</span>
                    <span className="font-medium">{shelf.section || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Numero:</span>
                    <span className="font-medium">{shelf.shelf_number || 'N/A'}</span>
                  </div>
                  {shelf.capacity && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Capacità:</span>
                      <span className="font-medium">{shelf.capacity}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#243044]">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-500">Ricambi:</span>
                      <div className="font-medium">{stats.totalParts}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Quantità:</span>
                      <div className="font-medium">{stats.totalQuantity}</div>
                    </div>
                  </div>
                  
                  {shelf.capacity && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Utilizzo</span>
                        <span>{stats.utilization}%</span>
                      </div>
                      <div className="w-full bg-[#243044]  rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            stats.utilization > 80 ? 'bg-red-500/10' :
                            stats.utilization > 60 ? 'bg-yellow-500/10' : 'bg-green-500/10'
                          }`}
                          style={{ width: `${Math.min(stats.utilization, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {shelf.notes && (
                  <div className="mt-3 pt-3 border-t border-[#243044]">
                    <span className="text-slate-500 text-xs">Note:</span>
                    <p className="text-xs mt-1">{shelf.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form Scaffale */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#141c27] rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingShelf ? 'Modifica Scaffale' : 'Nuovo Scaffale'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingShelf(null);
                  resetForm();
                }}
                className="btn btn-ghost px-2"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Codice *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="es. A1-01"
                    className="w-full px-3 py-2 border border-[#243044] rounded-md form-input focus-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Area
                  </label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="es. A"
                    className="w-full px-3 py-2 border border-[#243044] rounded-md form-input focus-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Sezione
                  </label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    placeholder="es. 1"
                    className="w-full px-3 py-2 border border-[#243044] rounded-md form-input focus-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Numero Scaffale
                  </label>
                  <input
                    type="text"
                    value={formData.shelf_number}
                    onChange={(e) => setFormData({ ...formData, shelf_number: e.target.value })}
                    placeholder="es. 01"
                    className="w-full px-3 py-2 border border-[#243044] rounded-md form-input focus-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Descrizione
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrizione dello scaffale"
                  className="w-full px-3 py-2 border border-[#243044] rounded-md form-input focus-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Capacità
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="Capacità massima"
                  className="w-full px-3 py-2 border border-[#243044] rounded-md form-input focus-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Note
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Note aggiuntive"
                  className="w-full px-3 py-2 border border-[#243044] rounded-md form-input focus-ring"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  {editingShelf ? 'Aggiorna' : 'Crea'} Scaffale
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingShelf(null);
                    resetForm();
                  }}
                  className="btn btn-outline"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

ShelfManager.propTypes = {
  onShelfUpdate: PropTypes.func
};

export default ShelfManager;
