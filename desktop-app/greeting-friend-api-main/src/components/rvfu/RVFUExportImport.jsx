import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  FiDownload, FiUpload, FiFileText, FiCheckCircle, 
  FiAlertCircle, FiX, FiCalendar, FiFilter 
} from 'react-icons/fi';
import { useOrg } from '@/context/OrgContext';
import { supabase } from '@/lib/supabase-browser';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
import LoadingButton from '@/components/ui/LoadingButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const RVFUExportImport = ({ onClose, className = '' }) => {
  const { orgId } = useOrg();
  const { showSuccess, showError } = useToast();
  
  const [activeTab, setActiveTab] = useState('export');
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [dateRange, setDateRange] = useState('30d');
  const [includeDocuments, setIncludeDocuments] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);

  // Export dati
  const handleExport = useCallback(async () => {
    if (!orgId) return;

    setLoading(true);
    try {
      const startDate = getDateRangeStart(dateRange);
      
      // Carica dati
      const { data: cases, error: casesError } = await supabase
        .from('demolition_cases')
        .select(`
          *,
          clients:client_id (id, nome, cognome, telefono, email),
          transports:transport_id (id, autista, cliente)
        `)
        .eq('org_id', orgId)
        .gte('created_at', startDate.toISOString());

      if (casesError) throw casesError;

      // Carica documenti se richiesto
      let documents = [];
      if (includeDocuments) {
        const { data: docs, error: docsError } = await supabase
          .from('rvfu_documents')
          .select('*')
          .gte('created_at', startDate.toISOString());

        if (docsError) throw docsError;
        documents = docs;
      }

      // Genera file
      let fileContent, fileName, mimeType;
      
      if (exportFormat === 'csv') {
        fileContent = generateCSV(cases, documents);
        fileName = `rvfu-export-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      } else if (exportFormat === 'excel') {
        fileContent = generateExcel(cases, documents);
        fileName = `rvfu-export-${dateRange}-${new Date().toISOString().split('T')[0]}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (exportFormat === 'json') {
        fileContent = JSON.stringify({ cases, documents }, null, 2);
        fileName = `rvfu-export-${dateRange}-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      }

      // Download
      const blob = new Blob([fileContent], { type: mimeType });
      const url = globalThis.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      globalThis.URL.revokeObjectURL(url);
      a.remove();

      showSuccess(`Export completato: ${cases.length} casi esportati`);
      
    } catch (error) {
      logger.error('Error exporting RVFU data:', error);
      showError('Errore durante l\'export dei dati');
    } finally {
      setLoading(false);
    }
  }, [orgId, exportFormat, dateRange, includeDocuments, showSuccess, showError]);

  // Import dati
  const handleImport = useCallback(async () => {
    if (!importFile || !orgId) return;

    setLoading(true);
    try {
      const fileContent = await readFileContent(importFile);
      const data = parseImportFile(fileContent, importFile.type);
      
      if (!data.cases || data.cases.length === 0) {
        showError('Nessun caso valido trovato nel file');
        return;
      }

      // Validazione dati
      const validationErrors = validateImportData(data.cases);
      if (validationErrors.length > 0) {
        showError(`Errori di validazione: ${validationErrors.join(', ')}`);
        return;
      }

      // Import nel database
      const { error } = await supabase
        .from('demolition_cases')
        .insert(data.cases.map(case_ => ({
          ...case_,
          org_id: orgId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })));

      if (error) throw error;

      showSuccess(`Import completato: ${data.cases.length} casi importati`);
      onClose?.();
      
    } catch (error) {
      logger.error('Error importing RVFU data:', error);
      showError('Errore durante l\'import dei dati');
    } finally {
      setLoading(false);
    }
  }, [importFile, orgId, showSuccess, showError, onClose]);

  // Preview import
  const handleFileSelect = useCallback(async (file) => {
    setImportFile(file);
    
    try {
      const content = await readFileContent(file);
      const data = parseImportFile(content, file.type);
      setImportPreview(data);
    } catch (error) {
      logger.error('Error previewing file:', error);
      showError('Errore nella lettura del file');
    }
  }, [showError]);

  // Utility functions
  const getDateRangeStart = (range) => {
    const now = new Date();
    const ranges = {
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      '1y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      'all': new Date(0)
    };
    return ranges[range];
  };

  const generateCSV = (cases, documents) => {
    const headers = [
      'ID', 'Targa', 'Telaio', 'Marca/Modello', 'Anno', 'Stato',
      'Causale RVFU', 'Data Demolizione', 'Proprietario Nome', 'Proprietario Cognome',
      'Proprietario CF', 'Proprietario Telefono', 'Proprietario Email',
      'Provincia', 'Comune', 'Indirizzo', 'CAP', 'Note', 'Data Creazione'
    ];

    const rows = cases.map(case_ => [
      case_.id,
      case_.targa || '',
      case_.telaio || '',
      case_.marca_modello || '',
      case_.anno || '',
      case_.stato || '',
      case_.rvfu_causale || '',
      case_.rvfu_data_demolizione || '',
      case_.rvfu_proprietario_nome || '',
      case_.rvfu_proprietario_cognome || '',
      case_.rvfu_proprietario_cf || '',
      case_.rvfu_proprietario_telefono || '',
      case_.rvfu_proprietario_email || '',
      case_.rvfu_provincia || '',
      case_.rvfu_comune || '',
      case_.rvfu_indirizzo || '',
      case_.rvfu_cap || '',
      case_.note || '',
      new Date(case_.created_at).toLocaleDateString('it-IT')
    ]);

    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  const generateExcel = (cases, documents) => {
    // Per semplicità, generiamo CSV con estensione .xlsx
    // In un'implementazione reale si userebbe una libreria come xlsx
    return generateCSV(cases, documents);
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      
      if (file.type === 'application/json') {
        reader.readAsText(file);
      } else if (file.type === 'text/csv') {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const parseImportFile = (content, mimeType) => {
    if (mimeType === 'application/json') {
      return JSON.parse(content);
    } else if (mimeType === 'text/csv') {
      return parseCSV(content);
    }
    throw new Error('Formato file non supportato');
  };

  const parseCSV = (csvContent) => {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    const cases = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
        const case_ = {};
        
        headers.forEach((header, index) => {
          case_[header.toLowerCase().replace(/\s+/g, '_')] = values[index] || '';
        });
        
        cases.push(case_);
      }
    }

    return { cases };
  };

  const validateImportData = (cases) => {
    const errors = [];
    
    cases.forEach((case_, index) => {
      if (!case_.targa) errors.push(`Caso ${index + 1}: Targa mancante`);
      if (!case_.telaio) errors.push(`Caso ${index + 1}: Telaio mancante`);
      if (!case_.marca_modello) errors.push(`Caso ${index + 1}: Marca/Modello mancante`);
    });

    return errors;
  };

  return (
    <div className={`bg-[#141c27] rounded-lg shadow-lg border border-[#243044]  ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-[#243044] ">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Export/Import Dati RVFU</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-400 transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'bg-blue-500/10 text-blue-400'
                : 'text-slate-400 hover:text-slate-200  '
            }`}
          >
            <FiDownload className="h-4 w-4 inline mr-2" />
            Export
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'import'
                ? 'bg-blue-500/10 text-blue-400'
                : 'text-slate-400 hover:text-slate-200  '
            }`}
          >
            <FiUpload className="h-4 w-4 inline mr-2" />
            Import
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'export' ? (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Export Dati</h3>
            
            {/* Export Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Formato File
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full rounded-md border border-[#243044] px-3 py-2 text-sm form-input focus-ring"
                >
                  <option value="csv">CSV</option>
                  <option value="excel">Excel (.xlsx)</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Periodo
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full rounded-md border border-[#243044] px-3 py-2 text-sm form-input focus-ring"
                >
                  <option value="7d">Ultimi 7 giorni</option>
                  <option value="30d">Ultimi 30 giorni</option>
                  <option value="90d">Ultimi 90 giorni</option>
                  <option value="1y">Ultimo anno</option>
                  <option value="all">Tutti i dati</option>
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeDocuments"
                checked={includeDocuments}
                onChange={(e) => setIncludeDocuments(e.target.checked)}
                className="rounded border-[#243044] text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="includeDocuments" className="ml-2 text-sm text-slate-300">
                Includi documenti allegati
              </label>
            </div>

            <LoadingButton
              onClick={handleExport}
              loading={loading}
              className="w-full"
            >
              <FiDownload className="h-4 w-4" />
              {loading ? 'Export in corso...' : 'Esporta Dati'}
            </LoadingButton>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Import Dati</h3>
            
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Seleziona File
              </label>
              <div className="border-2 border-dashed border-[#243044] rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv,.json,.xlsx"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                  id="importFile"
                />
                <label htmlFor="importFile" className="cursor-pointer">
                  <FiUpload className="mx-auto h-12 w-12 text-slate-500 mb-4" />
                  <p className="text-sm text-slate-400">
                    Clicca per selezionare un file CSV, JSON o Excel
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Formati supportati: .csv, .json, .xlsx
                  </p>
                </label>
              </div>
            </div>

            {/* Preview */}
            {importPreview && (
              <div className="bg-[#141c27]  rounded-lg p-4">
                <h4 className="font-medium mb-2">Anteprima Import</h4>
                <div className="text-sm text-slate-400">
                  <p>Casi trovati: {importPreview.cases?.length || 0}</p>
                  <p>Documenti trovati: {importPreview.documents?.length || 0}</p>
                </div>
              </div>
            )}

            <LoadingButton
              onClick={handleImport}
              loading={loading}
              disabled={!importFile}
              className="w-full"
            >
              <FiUpload className="h-4 w-4" />
              {loading ? 'Import in corso...' : 'Importa Dati'}
            </LoadingButton>
          </div>
        )}
      </div>
    </div>
  );
};

RVFUExportImport.propTypes = {
  onClose: PropTypes.func,
  className: PropTypes.string,
};

export default RVFUExportImport;
