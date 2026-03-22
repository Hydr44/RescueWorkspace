// src/components/spare-parts/DismantlingImport.jsx
import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FiUpload, FiFileText, FiCheckCircle, FiAlertCircle, FiX, FiDownload } from 'react-icons/fi';
import { supabase } from '@/integrations/supabase/client';
import { useOrg } from '@/context/OrgContext';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';

const DismantlingImport = ({ onImportComplete, onClose }) => {
  const { orgId } = useOrg();
  const { showSuccess, showError, showWarning } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Gestione drag & drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  // Upload file
  const handleFileUpload = async (file) => {
    if (!orgId) {
      showError('Seleziona un\'organizzazione');
      return;
    }

    if (!file.name.endsWith('.json') && !file.name.endsWith('.csv')) {
      showError('Formato file non supportato. Usa JSON o CSV.');
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      let data;

      if (file.name.endsWith('.json')) {
        data = JSON.parse(text);
      } else {
        // Parsing CSV semplice
        data = parseCSV(text);
      }

      // Validazione dati
      const validation = validateImportData(data);
      if (!validation.valid) {
        showError(`Errore validazione: ${validation.error}`);
        setLoading(false);
        return;
      }

      setPreviewData({
        filename: file.name,
        data: data,
        stats: {
          totalJobs: data.length,
          totalParts: data.reduce((sum, job) => sum + job.parts.length, 0),
          totalValue: data.reduce((sum, job) => 
            sum + job.parts.reduce((partSum, part) => partSum + (part.sell_price || 0), 0), 0
          )
        }
      });

      showSuccess(`File caricato: ${data.length} distinte, ${data.reduce((sum, job) => sum + job.parts.length, 0)} ricambi`);
    } catch (error) {
      logger.error('Error parsing file:', error);
      showError('Errore nel parsing del file');
    } finally {
      setLoading(false);
    }
  };

  // Parsing CSV
  const parseCSV = (csvText) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const jobs = {};
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) continue;
      
      const row = {};
    for (const [index, header] of headers.entries()) {
      row[header] = values[index];
    }
      
      const jobKey = `${row.targa}_${row.marca}_${row.modello}`;
      if (!jobs[jobKey]) {
        jobs[jobKey] = {
          targa: row.targa,
          telaio: row.telaio,
          marca: row.marca,
          modello: row.modello,
          anno: Number.parseInt(row.anno, 10),
          dismantling_date: row.dismantling_date,
          dismantler_name: row.dismantler_name,
          notes: row.notes,
          parts: []
        };
      }
      
      jobs[jobKey].parts.push({
        oem_code: row.oem_code,
        part_name: row.part_name,
        condition: row.condition,
        qty: Number.parseInt(row.qty, 10),
        cost_price: Number.parseFloat(row.cost_price),
        list_price: Number.parseFloat(row.list_price),
        sell_price: Number.parseFloat(row.sell_price),
        notes: row.notes
      });
    }
    
    return Object.values(jobs);
  };

  // Validazione dati
  const validateImportData = (data) => {
    if (!Array.isArray(data)) {
      return { valid: false, error: 'Il file deve contenere un array di distinte' };
    }

    for (const job of data) {
      if (!job.targa || !job.marca || !job.modello || !job.anno) {
        return { valid: false, error: 'Ogni distinta deve avere targa, marca, modello e anno' };
      }
      
      if (!job.parts || !Array.isArray(job.parts)) {
        return { valid: false, error: 'Ogni distinta deve avere un array di ricambi' };
      }
      
      for (const part of job.parts) {
        if (!part.part_name || !part.condition) {
          return { valid: false, error: 'Ogni ricambio deve avere nome e condizione' };
        }
      }
    }

    return { valid: true };
  };

  // Import effettivo
  const handleImport = async () => {
    if (!previewData || !orgId) return;

    setLoading(true);
    try {
      const results = {
        jobsCreated: 0,
        partsCreated: 0,
        batchesCreated: 0,
        stockMovesCreated: 0,
        errors: []
      };

      for (const jobData of previewData.data) {
        try {
          // 1. Crea o trova veicolo nel catalogo
          let vehicleId = null;
          const { data: existingVehicle } = await supabase
            .from('vehicles_catalog')
            .select('id')
            .eq('org_id', orgId)
            .eq('make', jobData.marca)
            .eq('model', jobData.modello)
            .eq('year_from', jobData.anno)
            .eq('year_to', jobData.anno)
            .single();

          if (existingVehicle) {
            vehicleId = existingVehicle.id;
          } else {
            const { data: newVehicle, error: vehicleError } = await supabase
              .from('vehicles_catalog')
              .insert({
                org_id: orgId,
                make: jobData.marca,
                model: jobData.modello,
                year_from: jobData.anno,
                year_to: jobData.anno,
                fuel_type: 'Benzina', // Default
                metadata: { source: 'dismantling_import' }
              })
              .select('id')
              .single();

            if (vehicleError) throw vehicleError;
            vehicleId = newVehicle.id;
          }

          // 2. Crea distinta smontaggio
          const { data: job, error: jobError } = await supabase
            .from('dismantling_jobs')
            .insert({
              org_id: orgId,
              vehicle_id: vehicleId,
              targa: jobData.targa,
              telaio: jobData.telaio,
              marca: jobData.marca,
              modello: jobData.modello,
              anno: jobData.anno,
              dismantling_date: jobData.dismantling_date,
              dismantler_name: jobData.dismantler_name,
              notes: jobData.notes,
              status: 'completed'
            })
            .select('id')
            .single();

          if (jobError) throw jobError;
          results.jobsCreated++;

          // 3. Crea batch e ricambi per ogni parte
          for (const partData of jobData.parts) {
            try {
              // Crea batch
              const { data: batch, error: batchError } = await supabase
                .from('part_batches')
                .insert({
                  org_id: orgId,
                  job_id: job.id,
                  oem_code: partData.oem_code,
                  part_name: partData.part_name,
                  condition: partData.condition,
                  qty_in: partData.qty,
                  qty_available: partData.qty,
                  qty_sold: 0,
                  cost_price: partData.cost_price,
                  list_price: partData.list_price,
                  sell_price: partData.sell_price,
                  status: 'LISTED_STORE',
                  notes: partData.notes
                })
                .select('id')
                .single();

              if (batchError) throw batchError;
              results.batchesCreated++;

              // Crea ricambio
              const internalCode = `INT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
              const { data: part, error: partError } = await supabase
                .from('spare_parts')
                .insert({
                  org_id: orgId,
                  name: partData.part_name,
                  description: partData.notes,
                  oem_code: partData.oem_code,
                  internal_code: internalCode,
                  source_vehicle_id: vehicleId,
                  quantity: partData.qty,
                  price_buy: partData.cost_price,
                  price_sell: partData.sell_price,
                  auto_price: true,
                  warehouse_location: 'A1-01', // Default location
                  condition: partData.condition,
                  status: 'available',
                  images: [],
                  technical_docs: [],
                  search_terms: `${partData.part_name} ${partData.oem_code} ${jobData.marca} ${jobData.modello} ${jobData.anno}`,
                  compatibility_notes: `Compatibile con ${jobData.marca} ${jobData.modello} ${jobData.anno} (${jobData.targa})`,
                  metadata: {
                    source: 'dismantling_import',
                    batch_id: batch.id,
                    job_id: job.id,
                    source_vehicle: jobData.targa
                  }
                })
                .select('id')
                .single();

              if (partError) throw partError;
              results.partsCreated++;

              // Aggiorna batch con part_id
              await supabase
                .from('part_batches')
                .update({ part_id: part.id })
                .eq('id', batch.id);

              // Crea movimento stock IN
              const { error: stockError } = await supabase
                .from('stock_moves')
                .insert({
                  org_id: orgId,
                  part_id: part.id,
                  batch_id: batch.id,
                  qty: partData.qty,
                  type: 'IN',
                  reason: 'Carico da distinta smontaggio',
                  ref_type: 'dismantling',
                  ref_id: job.id,
                  notes: `Carico iniziale da veicolo ${jobData.targa}`,
                  cost_per_unit: partData.cost_price
                });

              if (stockError) throw stockError;
              results.stockMovesCreated++;

            } catch (partError) {
              logger.error('Error creating part:', partError);
              results.errors.push(`Errore creazione ricambio ${partData.part_name}: ${partError.message}`);
            }
          }

        } catch (jobError) {
          logger.error('Error creating job:', jobError);
          results.errors.push(`Errore creazione distinta ${jobData.targa}: ${jobError.message}`);
        }
      }

      setImportResults(results);
      
      if (results.errors.length === 0) {
        showSuccess(`Import completato: ${results.jobsCreated} distinte, ${results.partsCreated} ricambi, ${results.batchesCreated} batch`);
        if (onImportComplete) onImportComplete();
      } else {
        showWarning(`Import completato con errori: ${results.errors.length} errori`);
      }

    } catch (error) {
      logger.error('Import error:', error);
      showError('Errore durante l\'import');
    } finally {
      setLoading(false);
    }
  };

  // Download template
  const downloadTemplate = () => {
    const template = [
      {
        targa: "AB123CD",
        telaio: "ZFA31200001234567",
        marca: "Fiat",
        modello: "Panda",
        anno: 2010,
        dismantling_date: "2024-01-15",
        dismantler_name: "Mario Rossi",
        notes: "Veicolo incidentato frontalmente",
        oem_code: "71712345",
        part_name: "Motore 1.2 8V",
        condition: "used",
        qty: 1,
        cost_price: 800,
        list_price: 1200,
        sell_price: 1000,
        part_notes: "Motore funzionante, 120.000 km"
      }
    ];

    const csv = [
      Object.keys(template[0]).join(','),
      ...template.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_distinte_smontaggio.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Import Distinte Smontaggio</h2>
          <p className="text-sm text-slate-500 ">
            Carica file JSON o CSV per importare distinte di smontaggio e creare automaticamente i ricambi
          </p>
        </div>
        <button
          onClick={onClose}
          className="btn btn-ghost px-2"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>

      {/* Upload Area */}
      {!previewData && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-indigo-500 bg-blue-500/10' 
              : 'border-[#243044]  hover:border-indigo-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <FiUpload className="h-12 w-12 mx-auto mb-4 text-slate-500" />
          <h3 className="text-lg font-semibold mb-2">Carica File Distinte</h3>
          <p className="text-sm text-slate-500 mb-4">
            Trascina qui un file JSON o CSV, oppure clicca per selezionare
          </p>
          
          <input
            type="file"
            accept=".json,.csv"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="btn btn-primary cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && document.getElementById('file-upload').click()}
          >
            <FiUpload className="h-4 w-4" />
            Seleziona File
          </label>
          
          <div className="mt-4">
            <button
              onClick={downloadTemplate}
              className="btn btn-outline text-sm"
            >
              <FiDownload className="h-4 w-4" />
              Scarica Template CSV
            </button>
          </div>
        </div>
      )}

      {/* Preview Data */}
      {previewData && !importResults && (
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiFileText className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Anteprima Import</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-500">File:</span>
                <div className="font-medium">{previewData.filename}</div>
              </div>
              <div>
                <span className="text-slate-500">Distinte:</span>
                <div className="font-medium">{previewData.stats.totalJobs}</div>
              </div>
              <div>
                <span className="text-slate-500">Ricambi:</span>
                <div className="font-medium">{previewData.stats.totalParts}</div>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-[#141c27]  sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Targa</th>
                  <th className="px-3 py-2 text-left">Veicolo</th>
                  <th className="px-3 py-2 text-left">Ricambi</th>
                  <th className="px-3 py-2 text-left">Valore</th>
                </tr>
              </thead>
              <tbody>
                {previewData.data.map((job) => (
                  <tr key={`${job.targa}-${job.marca}-${job.modello}`} className="border-t">
                    <td className="px-3 py-2 font-mono">{job.targa}</td>
                    <td className="px-3 py-2">{job.marca} {job.modello} {job.anno}</td>
                    <td className="px-3 py-2">{job.parts.length}</td>
                    <td className="px-3 py-2">
                      €{job.parts.reduce((sum, part) => sum + (part.sell_price || 0), 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Importazione...' : 'Conferma Import'}
            </button>
            <button
              onClick={() => setPreviewData(null)}
              className="btn btn-outline"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* Import Results */}
      {importResults && (
        <div className="space-y-4">
          <div className={`border rounded-lg p-4 ${
            importResults.errors.length === 0 
              ? 'bg-green-500/10 border-green-500/20' 
              : 'bg-yellow-500/10 border-yellow-500/20'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {importResults.errors.length === 0 ? (
                <FiCheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <FiAlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              <h3 className="font-semibold">
                {importResults.errors.length === 0 ? 'Import Completato' : 'Import Completato con Errori'}
              </h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Distinte:</span>
                <div className="font-medium">{importResults.jobsCreated}</div>
              </div>
              <div>
                <span className="text-slate-500">Ricambi:</span>
                <div className="font-medium">{importResults.partsCreated}</div>
              </div>
              <div>
                <span className="text-slate-500">Batch:</span>
                <div className="font-medium">{importResults.batchesCreated}</div>
              </div>
              <div>
                <span className="text-slate-500">Movimenti:</span>
                <div className="font-medium">{importResults.stockMovesCreated}</div>
              </div>
            </div>

            {importResults.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-yellow-400 mb-2">Errori:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {importResults.errors.map((error) => (
                    <li key={error}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setPreviewData(null);
                setImportResults(null);
              }}
              className="btn btn-primary"
            >
              Nuovo Import
            </button>
            <button
              onClick={onClose}
              className="btn btn-outline"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

DismantlingImport.propTypes = {
  onImportComplete: PropTypes.func,
  onClose: PropTypes.func
};

export default DismantlingImport;
