// src/components/spare-parts/WarehouseMap.jsx
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiMapPin, FiPackage, FiSearch, FiRefreshCw, FiGrid, FiList } from 'react-icons/fi';
import { supabase } from '@/integrations/supabase/client';
import { useOrg } from '@/context/OrgContext';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';

const WarehouseMap = ({ onPartSelect }) => {
  const { orgId } = useOrg();
  const { showError } = useToast();
  
  const [shelves, setShelves] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedArea, setSelectedArea] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredShelf, setHoveredShelf] = useState(null);

  useEffect(() => {
    if (orgId) {
      loadData();
    }
  }, [orgId]);

  const loadData = async () => {
    if (!orgId) return;

    setLoading(true);
    try {
      // Carica scaffali
      const { data: shelvesData, error: shelvesError } = await supabase
        .from('shelves')
        .select('*')
        .eq('org_id', orgId)
        .eq('active', true)
        .order('area', { ascending: true })
        .order('section', { ascending: true })
        .order('shelf_number', { ascending: true });

      if (shelvesError) throw shelvesError;

      // Carica ricambi
      const { data: partsData, error: partsError } = await supabase
        .from('spare_parts')
        .select('*')
        .eq('org_id', orgId)
        .eq('status', 'available')
        .not('warehouse_location', 'is', null);

      if (partsError) throw partsError;

      setShelves(shelvesData || []);
      setParts(partsData || []);
    } catch (error) {
      logger.error('Error loading warehouse data:', error);
      showError('Errore nel caricamento dei dati del magazzino');
    } finally {
      setLoading(false);
    }
  };

  const getPartsForShelf = (shelfCode) => {
    return parts.filter(part => part.warehouse_location === shelfCode);
  };

  const getShelfStats = (shelfCode) => {
    const shelfParts = getPartsForShelf(shelfCode);
    const totalQuantity = shelfParts.reduce((sum, part) => sum + (part.quantity || 0), 0);
    const totalValue = shelfParts.reduce((sum, part) => sum + ((part.price_sell || 0) * (part.quantity || 0)), 0);
    
    return {
      partsCount: shelfParts.length,
      totalQuantity,
      totalValue
    };
  };

  const getAreas = () => {
    const areas = [...new Set(shelves.map(s => s.area).filter(Boolean))];
    return areas.sort();
  };

  const getSectionsForArea = (area) => {
    const sections = [...new Set(shelves.filter(s => s.area === area).map(s => s.section).filter(Boolean))];
    return sections.sort();
  };

  const filteredShelves = shelves.filter(shelf => {
    const matchesArea = selectedArea === 'all' || shelf.area === selectedArea;
    const matchesSearch = !searchQuery || 
      shelf.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shelf.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesArea && matchesSearch;
  });

  const getShelfColor = (shelf) => {
    const stats = getShelfStats(shelf.code);
    const utilization = shelf.capacity ? (stats.totalQuantity / shelf.capacity) * 100 : 0;
    
    if (utilization > 80) return 'bg-red-500/10 border-red-500/20 text-red-400';
    if (utilization > 60) return 'bg-yellow-500/10 border-yellow-300 text-yellow-400';
    if (stats.partsCount > 0) return 'bg-green-500/10 border-green-300 text-green-400';
    return 'bg-[#141c27] border-[#243044] text-slate-200   ';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-sm text-slate-500">Caricamento mappa magazzino...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Mappa Magazzino</h3>
          <p className="text-sm text-slate-500">
            Visualizzazione scaffali e ubicazioni ricambi
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void loadData()}
            className="btn btn-outline"
          >
            <FiRefreshCw className="h-4 w-4" />
            Aggiorna
          </button>
          
          <div className="flex border border-[#243044] rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-blue-500/10 text-white' : 'bg-[#1a2536] text-slate-300'}`}
            >
              <FiGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-500/10 text-white' : 'bg-[#1a2536] text-slate-300'}`}
            >
              <FiList className="h-4 w-4" />
            </button>
          </div>
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

      {/* Legenda */}
      <div className="bg-[#141c27]  rounded-lg p-4">
        <h4 className="font-medium mb-2">Legenda</h4>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500/10 border border-green-300 rounded"></div>
            <span>Scaffale con ricambi</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500/10 border border-yellow-300 rounded"></div>
            <span>Scaffale pieno (60-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500/10 border border-red-500/20 rounded"></div>
            <span>Scaffale sovraccarico (&gt;80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#141c27] border border-[#243044] rounded"></div>
            <span>Scaffale vuoto</span>
          </div>
        </div>
      </div>

      {/* Contenuto */}
      {viewMode === 'grid' ? (
        // Vista Griglia per Area
        <div className="space-y-6">
          {getAreas().map(area => {
            const areaShelves = filteredShelves.filter(shelf => shelf.area === area);
            if (areaShelves.length === 0) return null;

            return (
              <div key={area} className="space-y-4">
                <h4 className="text-lg font-semibold border-b border-[#243044] pb-2">
                  Area {area}
                </h4>
                
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {areaShelves.map(shelf => {
                    const stats = getShelfStats(shelf.code);
                    const shelfParts = getPartsForShelf(shelf.code);
                    
                    return (
                      <div
                        key={shelf.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${getShelfColor(shelf)}`}
                        onMouseEnter={() => setHoveredShelf(shelf)}
                        onMouseLeave={() => setHoveredShelf(null)}
                        onClick={() => onPartSelect && onPartSelect(shelfParts)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-sm">{shelf.code}</h5>
                          <FiMapPin className="h-4 w-4" />
                        </div>
                        
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Ricambi:</span>
                            <span className="font-medium">{stats.partsCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Quantità:</span>
                            <span className="font-medium">{stats.totalQuantity}</span>
                          </div>
                          {shelf.capacity && (
                            <div className="flex justify-between">
                              <span>Capacità:</span>
                              <span className="font-medium">{shelf.capacity}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Valore:</span>
                            <span className="font-medium">€{stats.totalValue.toFixed(0)}</span>
                          </div>
                        </div>

                        {shelf.description && (
                          <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                            <p className="text-xs opacity-75">{shelf.description}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Vista Lista
        <div className="space-y-3">
          {filteredShelves.map(shelf => {
            const stats = getShelfStats(shelf.code);
            const shelfParts = getPartsForShelf(shelf.code);
            
            return (
              <div
                key={shelf.id}
                className="border border-[#243044]  rounded-lg p-4 bg-[#141c27]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{shelf.code}</h4>
                      <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-medium">
                        {shelf.area} - {shelf.section} - {shelf.shelf_number}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Ricambi:</span>
                        <div className="font-medium">{stats.partsCount}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Quantità:</span>
                        <div className="font-medium">{stats.totalQuantity}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Valore:</span>
                        <div className="font-medium">€{stats.totalValue.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Utilizzo:</span>
                        <div className="font-medium">
                          {shelf.capacity ? `${Math.round((stats.totalQuantity / shelf.capacity) * 100)}%` : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {shelf.description && (
                      <div className="mt-3 pt-3 border-t border-[#243044]">
                        <span className="text-slate-500 text-sm">Descrizione:</span>
                        <p className="text-sm mt-1">{shelf.description}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => onPartSelect && onPartSelect(shelfParts)}
                      className="btn btn-outline text-sm"
                    >
                      <FiPackage className="h-4 w-4" />
                      Visualizza Ricambi
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tooltip per scaffale */}
      {hoveredShelf && (
        <div className="fixed bg-black bg-opacity-75 text-white text-sm rounded-lg p-3 pointer-events-none z-50"
             style={{
               left: hoveredShelf.clientX || 0,
               top: (hoveredShelf.clientY || 0) - 50
             }}>
          <div className="font-semibold">{hoveredShelf.code}</div>
          <div>{hoveredShelf.description || 'Nessuna descrizione'}</div>
          <div>Ricambi: {getShelfStats(hoveredShelf.code).partsCount}</div>
        </div>
      )}
    </div>
  );
};

WarehouseMap.propTypes = {
  onPartSelect: PropTypes.func
};

export default WarehouseMap;
