// src/components/spare-parts/BatchManager.jsx
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiPackage, FiRefreshCw, FiEye, FiX } from 'react-icons/fi';
import { supabase } from '@/integrations/supabase/client';
import { useOrg } from '@/context/OrgContext';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
import { updateBatchPrices, formatPrice, calculateMargin } from '@/lib/spare-parts-pricing';

const BatchManager = ({ jobId, onBatchUpdate }) => {
  const { orgId } = useOrg();
  const { showSuccess, showError, showWarning } = useToast();
  
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingPrices, setUpdatingPrices] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  useEffect(() => {
    if (jobId && orgId) {
      loadBatches();
    }
  }, [jobId, orgId]);

  const loadBatches = async () => {
    if (!jobId || !orgId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('part_batches')
        .select(`
          *,
          spare_parts (
            id,
            name,
            internal_code,
            warehouse_location,
            status
          )
        `)
        .eq('job_id', jobId)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      logger.error('Error loading batches:', error);
      showError('Errore nel caricamento dei batch');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrices = async () => {
    if (!orgId) return;

    setUpdatingPrices(true);
    try {
      const results = [];
      
      for (const batch of batches) {
        try {
          const result = await updateBatchPrices(batch.id, orgId);
          results.push({ batchId: batch.id, success: true, result });
        } catch (error) {
          results.push({ batchId: batch.id, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      if (errorCount === 0) {
        showSuccess(`Prezzi aggiornati per ${successCount} batch`);
      } else {
        showWarning(`Prezzi aggiornati per ${successCount} batch, ${errorCount} errori`);
      }

      // Ricarica batch
      await loadBatches();
      if (onBatchUpdate) onBatchUpdate();

    } catch (error) {
      logger.error('Error updating prices:', error);
      showError('Errore nell\'aggiornamento dei prezzi');
    } finally {
      setUpdatingPrices(false);
    }
  };

  const handleStatusChange = async (batchId, newStatus) => {
    if (!orgId) return;

    try {
      const { error } = await supabase
        .from('part_batches')
        .update({ status: newStatus })
        .eq('id', batchId)
        .eq('org_id', orgId);

      if (error) throw error;

      showSuccess('Stato batch aggiornato');
      await loadBatches();
      if (onBatchUpdate) onBatchUpdate();

    } catch (error) {
      logger.error('Error updating batch status:', error);
      showError('Errore nell\'aggiornamento dello stato');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'NEW': return 'bg-[#141c27] text-slate-200  ';
      case 'QA_OK': return 'bg-blue-500/10 text-blue-400';
      case 'LISTED_STORE': return 'bg-green-500/10 text-green-400';
      case 'LISTED_ONLINE': return 'bg-purple-500/10 text-purple-400';
      case 'SOLD': return 'bg-yellow-500/10 text-yellow-400';
      case 'RETURNED': return 'bg-orange-500/10 text-orange-400';
      case 'DISCARDED': return 'bg-red-500/10 text-red-400';
      default: return 'bg-[#141c27] text-slate-200  ';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'NEW': return 'Nuovo';
      case 'QA_OK': return 'QA OK';
      case 'LISTED_STORE': return 'In Negozio';
      case 'LISTED_ONLINE': return 'Online';
      case 'SOLD': return 'Venduto';
      case 'RETURNED': return 'Reso';
      case 'DISCARDED': return 'Scartato';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-sm text-slate-500">Caricamento batch...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestione Batch</h3>
          <p className="text-sm text-slate-500">
            {batches.length} batch trovati
          </p>
        </div>
        <button
          onClick={handleUpdatePrices}
          disabled={updatingPrices}
          className="btn btn-primary"
        >
          <FiRefreshCw className={`h-4 w-4 ${updatingPrices ? 'animate-spin' : ''}`} />
          {updatingPrices ? 'Aggiornamento...' : 'Aggiorna Prezzi'}
        </button>
      </div>

      {/* Batch List */}
      {batches.length === 0 ? (
        <div className="text-center py-8">
          <FiPackage className="h-12 w-12 mx-auto mb-4 text-slate-500" />
          <p className="text-slate-500">Nessun batch trovato</p>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className="border border-[#243044]  rounded-lg p-4 bg-[#141c27]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{batch.part_name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                      {getStatusLabel(batch.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Codice OEM:</span>
                      <div className="font-mono">{batch.oem_code || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Quantità:</span>
                      <div className="font-medium">
                        {batch.qty_available} / {batch.qty_in}
                        {batch.qty_sold > 0 && (
                          <span className="text-green-600 ml-1">(-{batch.qty_sold})</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Prezzo Vendita:</span>
                      <div className="font-medium">{formatPrice(batch.sell_price)}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Margine:</span>
                      <div className="font-medium">
                        {batch.cost_price ? (
                          <span className={calculateMargin(batch.sell_price, batch.cost_price) > 0 ? 'text-green-600' : 'text-red-600'}>
                            {calculateMargin(batch.sell_price, batch.cost_price).toFixed(1)}%
                          </span>
                        ) : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {batch.spare_parts && (
                    <div className="mt-3 pt-3 border-t border-[#243044]">
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">Ricambio:</span>
                          <div className="font-medium">{batch.spare_parts.name}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Cod. Interno:</span>
                          <div className="font-mono">{batch.spare_parts.internal_code}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Ubicazione:</span>
                          <div className="font-medium">{batch.spare_parts.warehouse_location || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {batch.notes && (
                    <div className="mt-3 pt-3 border-t border-[#243044]">
                      <span className="text-slate-500 text-sm">Note:</span>
                      <p className="text-sm mt-1">{batch.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setSelectedBatch(batch)}
                    className="btn btn-ghost px-2 py-1"
                    title="Visualizza dettagli"
                  >
                    <FiEye className="h-4 w-4" />
                  </button>
                  
                  <select
                    value={batch.status}
                    onChange={(e) => handleStatusChange(batch.id, e.target.value)}
                    className="text-xs border border-[#243044] rounded px-2 py-1 bg-[#1a2536]"
                  >
                    <option value="NEW">Nuovo</option>
                    <option value="QA_OK">QA OK</option>
                    <option value="LISTED_STORE">In Negozio</option>
                    <option value="LISTED_ONLINE">Online</option>
                    <option value="SOLD">Venduto</option>
                    <option value="RETURNED">Reso</option>
                    <option value="DISCARDED">Scartato</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Batch Detail Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#141c27] rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Dettaglio Batch</h3>
              <button
                onClick={() => setSelectedBatch(null)}
                className="btn btn-ghost px-2"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-500">Nome Ricambio</label>
                  <div className="font-medium">{selectedBatch.part_name}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-500">Codice OEM</label>
                  <div className="font-mono">{selectedBatch.oem_code || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-500">Condizione</label>
                  <div className="font-medium capitalize">{selectedBatch.condition}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-500">Stato</label>
                  <div className="font-medium">{getStatusLabel(selectedBatch.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-slate-500">Quantità Iniziale</label>
                  <div className="font-medium">{selectedBatch.qty_in}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-500">Quantità Disponibile</label>
                  <div className="font-medium">{selectedBatch.qty_available}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-500">Quantità Venduta</label>
                  <div className="font-medium">{selectedBatch.qty_sold}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-slate-500">Prezzo Costo</label>
                  <div className="font-medium">{formatPrice(selectedBatch.cost_price)}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-500">Prezzo Listino</label>
                  <div className="font-medium">{formatPrice(selectedBatch.list_price)}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-500">Prezzo Vendita</label>
                  <div className="font-medium">{formatPrice(selectedBatch.sell_price)}</div>
                </div>
              </div>

              {selectedBatch.notes && (
                <div>
                  <label className="text-sm text-slate-500">Note</label>
                  <p className="text-sm mt-1 p-3 bg-[#141c27]  rounded">
                    {selectedBatch.notes}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="btn btn-outline"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

BatchManager.propTypes = {
  jobId: PropTypes.string.isRequired,
  onBatchUpdate: PropTypes.func
};

export default BatchManager;
