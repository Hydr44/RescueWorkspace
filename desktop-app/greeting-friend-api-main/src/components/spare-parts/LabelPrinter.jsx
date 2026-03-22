// src/components/spare-parts/LabelPrinter.jsx
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiPrinter, FiRefreshCw, FiEye, FiSettings, FiX } from 'react-icons/fi';
import { supabase } from '@/integrations/supabase/client';
import { useOrg } from '@/context/OrgContext';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
import { 
  generateCode128, 
  downloadLabelPDF, 
  generatePartQRCode,
  generateInternalCode,
  generateEAN13
} from '@/lib/barcode-generator';

const LabelPrinter = ({ selectedParts = [], onClose }) => {
  const { orgId } = useOrg();
  const { showSuccess, showError, showWarning } = useToast();
  
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPart, setPreviewPart] = useState(null);
  const [labelSettings, setLabelSettings] = useState({
    showBarcode: true,
    showQR: false,
    showPrice: true,
    showLocation: true,
    showDescription: false,
    companyName: 'RescueManager',
    fontSize: 8
  });

  useEffect(() => {
    if (orgId) {
      loadParts();
    }
  }, [orgId]);

  const loadParts = async () => {
    if (!orgId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('spare_parts')
        .select('*')
        .eq('org_id', orgId)
        .eq('status', 'available')
        .order('name', { ascending: true });

      if (error) throw error;
      setParts(data || []);
    } catch (error) {
      logger.error('Error loading parts:', error);
      showError('Errore nel caricamento dei ricambi');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintSingle = async (part) => {
    try {
      setPrinting(true);
      const success = await downloadLabelPDF(part, `etichetta-${part.internal_code || part.id}.pdf`);
      
      if (success) {
        showSuccess(`Etichetta generata per ${part.name}`);
      } else {
        showError('Errore nella generazione dell\'etichetta');
      }
    } catch (error) {
      logger.error('Error printing single label:', error);
      showError('Errore nella stampa dell\'etichetta');
    } finally {
      setPrinting(false);
    }
  };

  const handlePrintMultiple = async () => {
    if (selectedParts.length === 0) {
      showWarning('Seleziona almeno un ricambio');
      return;
    }

    try {
      setPrinting(true);
      let successCount = 0;
      
      for (const part of selectedParts) {
        try {
          const success = await downloadLabelPDF(part, `etichetta-${part.internal_code || part.id}.pdf`);
          if (success) successCount++;
        } catch (error) {
          logger.error(`Error printing label for part ${part.id}:`, error);
        }
      }

      if (successCount === selectedParts.length) {
        showSuccess(`Etichette generate per ${successCount} ricambi`);
      } else {
        showWarning(`Etichette generate per ${successCount} di ${selectedParts.length} ricambi`);
      }
    } catch (error) {
      logger.error('Error printing multiple labels:', error);
      showError('Errore nella stampa delle etichette');
    } finally {
      setPrinting(false);
    }
  };

  const handlePreview = (part) => {
    setPreviewPart(part);
    setShowPreview(true);
  };

  const generateBarcodeForPart = (part) => {
    if (part.ean_code) {
      return generateCode128(part.ean_code);
    } else if (part.internal_code) {
      return generateCode128(part.internal_code);
    } else {
      return generateCode128(part.id);
    }
  };

  const generateQRForPart = (part) => {
    return generatePartQRCode(part);
  };

  const handleGenerateCodes = async (part) => {
    if (!orgId) return;

    try {
      const updates = {};
      
      if (!part.internal_code) {
        updates.internal_code = generateInternalCode();
      }
      
      if (!part.ean_code) {
        updates.ean_code = generateEAN13();
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('spare_parts')
          .update(updates)
          .eq('id', part.id)
          .eq('org_id', orgId);

        if (error) throw error;

        showSuccess('Codici generati con successo');
        await loadParts();
      } else {
        showWarning('Il ricambio ha già tutti i codici necessari');
      }
    } catch (error) {
      logger.error('Error generating codes:', error);
      showError('Errore nella generazione dei codici');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-sm text-slate-500">Caricamento ricambi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Stampa Etichette</h3>
          <p className="text-sm text-slate-500">
            Genera e stampa etichette per i ricambi
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void loadParts()}
            className="btn btn-outline"
          >
            <FiRefreshCw className="h-4 w-4" />
            Aggiorna
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="btn btn-ghost px-2"
            >
              <FiX className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Impostazioni */}
      <div className="bg-[#141c27]  rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <FiSettings className="h-4 w-4" />
          <h4 className="font-medium">Impostazioni Etichetta</h4>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={labelSettings.showBarcode}
              onChange={(e) => setLabelSettings({ ...labelSettings, showBarcode: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Barcode</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={labelSettings.showQR}
              onChange={(e) => setLabelSettings({ ...labelSettings, showQR: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">QR Code</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={labelSettings.showPrice}
              onChange={(e) => setLabelSettings({ ...labelSettings, showPrice: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Prezzo</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={labelSettings.showLocation}
              onChange={(e) => setLabelSettings({ ...labelSettings, showLocation: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Ubicazione</span>
          </label>
        </div>
      </div>

      {/* Azioni Multiple */}
      {selectedParts.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">
                {selectedParts.length} ricambi selezionati
              </h4>
              <p className="text-sm text-blue-400">
                Stampa etichette per tutti i ricambi selezionati
              </p>
            </div>
            <button
              onClick={handlePrintMultiple}
              disabled={printing}
              className="btn btn-primary"
            >
              <FiPrinter className="h-4 w-4" />
              {printing ? 'Stampa...' : 'Stampa Tutte'}
            </button>
          </div>
        </div>
      )}

      {/* Lista Ricambi */}
      <div className="space-y-3">
        {parts.length === 0 ? (
          <div className="text-center py-8">
            <FiPrinter className="h-12 w-12 mx-auto mb-4 text-slate-500" />
            <p className="text-slate-500">Nessun ricambio disponibile</p>
          </div>
        ) : (
          parts.map((part) => (
            <div
              key={part.id}
              className="border border-[#243044]  rounded-lg p-4 bg-[#141c27]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{part.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      part.status === 'available' ? 'bg-green-500/10 text-green-400' :
                      part.status === 'reserved' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {part.status === 'available' ? 'Disponibile' :
                       part.status === 'reserved' ? 'Riservato' : 'Venduto'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Cod. Interno:</span>
                      <div className="font-mono">
                        {part.internal_code || (
                          <span className="text-red-500">Mancante</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Cod. EAN:</span>
                      <div className="font-mono">
                        {part.ean_code || (
                          <span className="text-red-500">Mancante</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Ubicazione:</span>
                      <div className="font-medium">{part.warehouse_location || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Prezzo:</span>
                      <div className="font-medium">
                        {part.price_sell ? `€${part.price_sell.toFixed(2)}` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {(!part.internal_code || !part.ean_code) && (
                    <button
                      onClick={() => handleGenerateCodes(part)}
                      className="btn btn-outline text-sm"
                      title="Genera codici mancanti"
                    >
                      <FiRefreshCw className="h-4 w-4" />
                      Genera Codici
                    </button>
                  )}
                  
                  <button
                    onClick={() => handlePreview(part)}
                    className="btn btn-outline text-sm"
                    title="Anteprima etichetta"
                  >
                    <FiEye className="h-4 w-4" />
                    Anteprima
                  </button>
                  
                  <button
                    onClick={() => handlePrintSingle(part)}
                    disabled={printing}
                    className="btn btn-primary text-sm"
                    title="Stampa etichetta"
                  >
                    <FiPrinter className="h-4 w-4" />
                    Stampa
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Anteprima Etichetta */}
      {showPreview && previewPart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#141c27] rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Anteprima Etichetta</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="btn btn-ghost px-2"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="border border-[#243044] rounded p-4 bg-[#1a2536]">
              <div className="text-center space-y-2">
                <div className="font-bold text-sm">{labelSettings.companyName}</div>
                <div className="font-semibold text-xs">{previewPart.name}</div>
                
                {previewPart.internal_code && (
                  <div className="text-xs text-slate-400">
                    Cod. Interno: {previewPart.internal_code}
                  </div>
                )}
                
                {previewPart.oem_code && (
                  <div className="text-xs text-slate-400">
                    Cod. OEM: {previewPart.oem_code}
                  </div>
                )}
                
                {labelSettings.showLocation && previewPart.warehouse_location && (
                  <div className="text-xs text-slate-400">
                    Ubicazione: {previewPart.warehouse_location}
                  </div>
                )}
                
                {labelSettings.showPrice && previewPart.price_sell && (
                  <div className="font-bold text-sm">
                    €{previewPart.price_sell.toFixed(2)}
                  </div>
                )}

                {labelSettings.showBarcode && (
                  <div className="mt-2">
                    <img
                      src={generateBarcodeForPart(previewPart)}
                      alt="Barcode"
                      className="mx-auto"
                      style={{ maxHeight: '40px' }}
                    />
                  </div>
                )}

                {labelSettings.showQR && (
                  <div className="mt-2">
                    <img
                      src={generateQRForPart(previewPart)}
                      alt="QR Code"
                      className="mx-auto"
                      style={{ maxHeight: '60px' }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handlePrintSingle(previewPart)}
                disabled={printing}
                className="btn btn-primary flex-1"
              >
                <FiPrinter className="h-4 w-4" />
                Stampa Etichetta
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="btn btn-outline"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

LabelPrinter.propTypes = {
  selectedParts: PropTypes.array,
  onClose: PropTypes.func
};

export default LabelPrinter;
