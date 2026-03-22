// src/pages/SparePartsMVP.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiPackage, FiUpload, FiRefreshCw, FiX, FiEye, FiDownload } from 'react-icons/fi';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import DismantlingImport from '@/components/spare-parts/DismantlingImport';
import BatchManager from '@/components/spare-parts/BatchManager';
import { useQRCode } from '@/hooks/useQRCode';
import { supabase } from '@/integrations/supabase/client';
import { useOrg } from '@/context/OrgContext';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';

export default function SparePartsMVP() {
  const { orgId } = useOrg();
  const { downloadQR } = useQRCode();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dismantlingJobs, setDismantlingJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showScanner, setShowScanner] = useState(false);
  const [viewMode, setViewMode] = useState('parts');
  const [showImport, setShowImport] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);
  const [scannedCode, setScannedCode] = useState('');

  // Carica dati quando cambia l'org
  useEffect(() => {
    if (!orgId) return;
    void loadData();
  }, [orgId, viewMode]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (viewMode === 'parts') {
        await loadParts();
        await loadCategories();
      } else if (viewMode === 'jobs') {
        await loadDismantlingJobs();
      }
    } catch (error) {
      logger.error('Error loading data:', error);
      showError('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('spare_parts_categories')
      .select('id,name,code,parent_id,created_at')
      .order('name', { ascending: true });

    if (error) {
      logger.error('Error loading categories:', error);
      showError('Errore nel caricamento delle categorie');
      setCategories([]);
      return;
    }
      setCategories((data || []).map(c => ({ ...c, code: c.code ?? '' })));
  };

  const loadParts = async () => {
    if (!orgId) return;

    let query = supabase
      .from('spare_parts')
      .select(`
        *,
        spare_part_images!spare_part_images_spare_part_id_fkey (
          id,
          url,
          is_primary,
          sort_order
        )
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (selectedCategory !== 'all') {
      query = query.eq('category_id', selectedCategory);
    }

    if (selectedStatus !== 'all') {
      query = query.eq('status', selectedStatus);
    }

    const { data, error } = await query;
    if (error) {
      logger.error('Error loading parts:', error);
      showError('Errore nel caricamento dei ricambi');
      setParts([]);
      return;
    }
    setParts(data || []);
  };

  const loadDismantlingJobs = async () => {
    if (!orgId) return;

    const { data, error } = await supabase
      .from('dismantling_jobs')
      .select(`
        *,
        vehicles_catalog (
          make,
          model,
          year_from
        ),
        part_batches (
          id,
          part_name,
          qty_in,
          qty_available,
          qty_sold,
          status
        )
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error loading dismantling jobs:', error);
      showError('Errore nel caricamento delle distinte');
      setDismantlingJobs([]);
      return;
    }
    setDismantlingJobs(data || []);
  };

  const handleScan = async (code) => {
    setShowScanner(false);
    if (!orgId) return;

    const { data, error } = await supabase
      .from('spare_parts')
      .select('*')
      .eq('org_id', orgId)
      .or(
        `ean_code.eq.${code},warehouse_barcode.eq.${code},oem_code.eq.${code}`
      )
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      // Prodotto non trovato - mostra modal elegante
      setScannedCode(code);
      setShowNotFoundModal(true);
      return;
    }

    navigate(`/ricambi/${data.id}`);
  };

  const handleCreateFromScan = () => {
    setShowNotFoundModal(false);
    navigate(`/ricambi/nuovo?code=${encodeURIComponent(scannedCode)}`);
  };

  const handleCancelFromScan = () => {
    setShowNotFoundModal(false);
    setScannedCode('');
  };


  const handleDownloadQR = async (part) => {
    try {
      const qrData = JSON.stringify({
        id: part.id,
        code: part.internal_code || part.ean_code || part.id,
        name: part.name,
      });

      await downloadQR(qrData, `ricambio-${part.internal_code || part.id}`);
      showSuccess(`QR Code scaricato: ${part.name}`);
    } catch (error) {
      logger.error('Error downloading QR code:', error);
      showError('Errore: impossibile generare il QR code');
    }
  };

  const filteredParts = useMemo(() => {
    if (!searchQuery) return parts;
    const q = searchQuery.toLowerCase();
    return parts.filter((part) =>
      (part.name || '').toLowerCase().includes(q) ||
      (part.description || '').toLowerCase().includes(q) ||
      (part.oem_code || '').toLowerCase().includes(q) ||
      (part.ean_code || '').toLowerCase().includes(q) ||
      (part.internal_code || '').toLowerCase().includes(q) ||
      (part.warehouse_location || '').toLowerCase().includes(q)
    );
  }, [parts, searchQuery]);

  const handleImportComplete = () => {
    setShowImport(false);
    void loadData();
    showSuccess('Import completato con successo!');
  };

  // Se l'org non è selezionata
  if (!orgId) {
    return (
      <div className="p-4">
        <h1 className="text-sm font-semibold text-slate-200 mb-1">Magazzino Ricambi</h1>
        <p className="text-xs text-slate-500">Seleziona un'organizzazione per visualizzare i ricambi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-100">Magazzino Ricambi</h1>
              <p className="text-xs text-slate-500 mt-0.5">Gestione ricambi, distinte smontaggio e vendite</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowScanner(true)}
                className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition inline-flex items-center gap-1.5"
              >
                <FiSearch className="w-3.5 h-3.5" />
                Scanner
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition inline-flex items-center gap-1.5"
              >
                <FiUpload className="w-3.5 h-3.5" />
                Import
              </button>
              <button
                onClick={() => navigate('/ricambi-mvp/nuovo')}
                className="h-8 px-4 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-600/20 inline-flex items-center gap-1.5"
              >
                <FiPlus className="w-3.5 h-3.5" />
                Nuovo Ricambio
              </button>
            </div>
      </div>

      {/* View Mode Tabs */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044]">
        <div className="px-3">
          <nav className="flex gap-1">
            <button
              onClick={() => setViewMode('parts')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                viewMode === 'parts'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <FiPackage className="w-3.5 h-3.5" />
              Ricambi ({parts.length})
            </button>
            <button
              onClick={() => setViewMode('jobs')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                viewMode === 'jobs'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <FiUpload className="w-3.5 h-3.5" />
              Distinte ({dismantlingJobs.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Filtri per Ricambi */}
      {viewMode === 'parts' && (
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Cerca per nome, codice, ubicazione..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-9 pr-3 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/30 outline-none transition"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 px-2 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 outline-none min-w-[160px]"
            >
              <option value="all">Tutte le categorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-8 px-2 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 outline-none min-w-[140px]"
            >
              <option value="all">Tutti gli stati</option>
              <option value="available">Disponibile</option>
              <option value="reserved">Riservato</option>
              <option value="sold">Venduto</option>
              <option value="damaged">Danneggiato</option>
            </select>

            <button
              onClick={() => void loadParts()}
              className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition inline-flex items-center gap-1.5"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
              Aggiorna
            </button>
          </div>
        </div>
      )}

      {/* Contenuto */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-44 bg-[#1a2536] rounded-xl border border-[#243044]" />)}
          </div>
        </div>
      ) : viewMode === 'parts' ? (
        // Lista Ricambi
        filteredParts.length === 0 ? (
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] py-12 text-center">
            <FiPackage className="w-8 h-8 mx-auto mb-3 text-slate-600" />
            <p className="text-xs text-slate-500">Nessun ricambio trovato</p>
            <button
              onClick={() => navigate('/ricambi-mvp/nuovo')}
              className="mt-3 h-8 px-4 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-1.5"
            >
              <FiPlus className="w-3.5 h-3.5" /> Aggiungi Ricambio
            </button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredParts.map((part) => (
              <div
                key={part.id}
                className="bg-[#1a2536] rounded-xl border border-[#243044] hover:border-blue-500/30 transition-colors relative group"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/ricambi/${part.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/ricambi/${part.id}`); }}
                  className="p-4 cursor-pointer"
                >
                  {/* Thumbnail foto */}
                  {part.spare_part_images && part.spare_part_images.length > 0 && (() => {
                    const primaryImg = part.spare_part_images.find(img => img.is_primary) || part.spare_part_images[0];
                    return (
                      <div className="mb-3 rounded-lg overflow-hidden bg-[#141c27] border border-[#243044]">
                        <img 
                          src={primaryImg.url} 
                          alt={part.name}
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    );
                  })()}

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="text-sm font-semibold text-slate-200 truncate">{part.name}</h3>
                      {!!part.description && (
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{part.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {part.internal_code && (
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Cod. Interno</span>
                        <span className="font-mono text-slate-300">{part.internal_code}</span>
                      </div>
                    )}
                    {part.oem_code && (
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Cod. OEM</span>
                        <span className="font-mono text-slate-300">{part.oem_code}</span>
                      </div>
                    )}
                    {part.warehouse_location && (
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Ubicazione</span>
                        <span className="text-slate-300 font-medium">{part.warehouse_location}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">Quantità</span>
                      <span className="text-slate-300 font-medium">{part.quantity}</span>
                    </div>
                    {typeof part.price_sell === 'number' && (
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Prezzo</span>
                        <span className="text-slate-100 font-semibold">€ {part.price_sell.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[#243044]">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      part.status === 'available' ? 'bg-emerald-500/10 text-emerald-400' :
                      part.status === 'reserved' ? 'bg-amber-500/10 text-amber-400' :
                      part.status === 'sold' ? 'bg-slate-500/10 text-slate-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {part.status === 'available' ? 'Disponibile' :
                       part.status === 'reserved' ? 'Riservato' :
                       part.status === 'sold' ? 'Venduto' : 'Danneggiato'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-500/10 text-slate-400">
                      {part.condition === 'new' ? 'Nuovo' :
                       part.condition === 'refurbished' ? 'Rigenerato' :
                       part.condition === 'damaged' ? 'Danneggiato' : 'Usato'}
                    </span>
                  </div>
                </div>
                
                <button
                  type="button"
                  className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-blue-400 transition bg-[#1a2536] rounded-lg opacity-0 group-hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); handleDownloadQR(part); }}
                  title="Scarica QR Code"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )
      ) : viewMode === 'jobs' ? (
        // Lista Distinte Smontaggio
        dismantlingJobs.length === 0 ? (
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] py-12 text-center">
            <FiUpload className="w-8 h-8 mx-auto mb-3 text-slate-600" />
            <p className="text-xs text-slate-500">Nessuna distinta smontaggio trovata</p>
            <button
              onClick={() => setShowImport(true)}
              className="mt-3 h-8 px-4 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-1.5"
            >
              <FiUpload className="w-3.5 h-3.5" /> Importa Prima Distinta
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {dismantlingJobs.map((job) => (
              <div
                key={job.id}
                className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#243044]">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xs font-semibold text-slate-200">{job.marca} {job.modello} {job.anno}</h3>
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-medium">
                      {job.targa}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      job.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {job.status === 'completed' ? 'Completata' :
                       job.status === 'in_progress' ? 'In Corso' : 'Cancellata'}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="h-7 px-3 text-[10px] font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition inline-flex items-center gap-1"
                  >
                    <FiEye className="w-3 h-3" /> Gestisci Batch
                  </button>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Data Smontaggio</div>
                      <div className="text-xs text-slate-200 font-medium mt-0.5">{new Date(job.dismantling_date).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Smontatore</div>
                      <div className="text-xs text-slate-200 font-medium mt-0.5">{job.dismantler_name || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Ricambi</div>
                      <div className="text-xs text-slate-200 font-medium mt-0.5">{job.part_batches?.length || 0}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Disponibili</div>
                      <div className="text-xs text-slate-200 font-medium mt-0.5">
                        {job.part_batches?.reduce((sum, batch) => sum + batch.qty_available, 0) || 0}
                      </div>
                    </div>
                  </div>
                  {job.notes && (
                    <div className="mt-3 pt-3 border-t border-[#243044]">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Note</div>
                      <p className="text-xs text-slate-300 mt-0.5">{job.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : null}

      {/* Scanner Modal */}
      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <DismantlingImport
              onImportComplete={handleImportComplete}
              onClose={() => setShowImport(false)}
            />
          </div>
        </div>
      )}

      {/* Batch Manager Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-200">
                Gestione Batch - {selectedJob.marca} {selectedJob.modello} {selectedJob.anno} ({selectedJob.targa})
              </h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="btn btn-ghost px-2"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <BatchManager
              jobId={selectedJob.id}
              onBatchUpdate={() => {
                void loadDismantlingJobs();
                void loadParts();
              }}
            />
          </div>
        </div>
      )}


      {/* Modal Prodotto Non Trovato */}
      {showNotFoundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-sm border-none cursor-pointer"
            onClick={handleCancelFromScan}
            aria-label="Chiudi"
            type="button"
          />
          <div className="relative bg-[#1a2536] rounded-xl border border-[#243044] p-5 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 mb-3">
                <FiPackage className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-sm font-semibold text-slate-200 mb-1.5">Ricambio Non Trovato</div>
              <p className="text-xs text-slate-400 mb-1">
                Il codice <code className="font-mono bg-[#141c27] px-1.5 py-0.5 rounded text-slate-300">{scannedCode}</code> non è presente nel database.
              </p>
              <p className="text-xs text-slate-500 mb-5">
                Vuoi creare un nuovo ricambio con questo codice?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelFromScan}
                  className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition"
                >
                  Annulla
                </button>
                <button
                  onClick={handleCreateFromScan}
                  className="h-8 px-4 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-1.5"
                >
                  <FiPlus className="w-3.5 h-3.5" /> Crea Ricambio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
