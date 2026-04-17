import React, { useState, useEffect } from 'react';
import { FiUpload, FiDownload, FiTrash2, FiFile, FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
import LoadingButton from '@/components/ui/LoadingButton';
import Modal from '@/components/ui/Modal';

const VFUFascicoloTab = ({ 
  idVFU, 
  rvfuClient, 
  onDocumentsChange,
  fascicoloStato,
  onChiudiFascicolo,
  onRiapriFascicolo
}) => {
  const { showError, showSuccess, showInfo } = useToast();
  const [documenti, setDocumenti] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    nome: '',
    tipoDocumento: 'ALTRO',
    descrizione: '',
    file: null,
  });

  useEffect(() => {
    if (idVFU) {
      loadDocumenti();
    }
  }, [idVFU]);

  const loadDocumenti = async () => {
    if (!idVFU || !rvfuClient) return;
    
    setLoading(true);
    try {
      const response = await rvfuClient.consultaDocumenti(idVFU);
      const docs = response?.result || response?.payload || response || [];
      setDocumenti(Array.isArray(docs) ? docs : []);
      if (onDocumentsChange) onDocumentsChange(docs);
    } catch (error) {
      logger.error('Error loading documenti:', error);
      showError('Errore caricamento documenti: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showError('File troppo grande (max 10MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result.split(',')[1];
      setUploadData(prev => ({
        ...prev,
        file: base64,
        nome: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.nome) {
      showError('Seleziona un file');
      return;
    }

    setUploading(true);
    try {
      const payload = {
        nome: uploadData.nome,
        tipoDocumento: uploadData.tipoDocumento,
        contenuto: uploadData.file,
        descrizione: uploadData.descrizione,
      };

      await rvfuClient.allegaDocumento(idVFU, payload);
      showSuccess('Documento allegato con successo');
      setShowUploadModal(false);
      setUploadData({ nome: '', tipoDocumento: 'ALTRO', descrizione: '', file: null });
      await loadDocumenti();
    } catch (error) {
      logger.error('Error uploading documento:', error);
      showError('Errore upload documento: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (documento) => {
    try {
      const response = await rvfuClient.downloadDocumento({
        idAci: documento.idDocumento,
        idFascicolo: documento.idFascicolo,
      });

      if (response?.url) {
        window.open(response.url, '_blank');
      } else if (response?.contenuto) {
        const blob = new Blob([atob(response.contenuto)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        showInfo('Download avviato');
      }
    } catch (error) {
      logger.error('Error downloading documento:', error);
      showError('Errore download documento: ' + error.message);
    }
  };

  const tipiDocumento = [
    { value: 'DU', label: 'Documento Unico (DU)' },
    { value: 'CDC', label: 'Carta di Circolazione' },
    { value: 'CDP', label: 'Certificato di Proprietà' },
    { value: 'FOGLIO_C', label: 'Foglio Complementare' },
    { value: 'DOCUMENTO_IDENTITA', label: 'Documento Identità' },
    { value: 'DELEGA', label: 'Delega' },
    { value: 'ALTRO', label: 'Altro' },
  ];

  return (
    <div className="space-y-6">
      {/* Stato fascicolo + azioni */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-400">
            Stato fascicolo:
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            fascicoloStato === 'CHIUSO' 
              ? 'bg-green-600/20 text-green-400 border border-green-500/30'
              : fascicoloStato === 'INTEGRAZIONE'
              ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30'
              : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
          }`}>
            {fascicoloStato || 'INSERITO'}
          </span>
        </div>

        <div className="flex gap-2">
          {fascicoloStato !== 'CHIUSO' && (
            <LoadingButton
              onClick={onChiudiFascicolo}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-2"
            >
              <FiCheckCircle className="w-4 h-4" />
              Chiudi fascicolo
            </LoadingButton>
          )}
          {fascicoloStato === 'CHIUSO' && (
            <LoadingButton
              onClick={onRiapriFascicolo}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm flex items-center gap-2"
            >
              <FiAlertCircle className="w-4 h-4" />
              Riapri fascicolo
            </LoadingButton>
          )}
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2"
          >
            <FiUpload className="w-4 h-4" />
            Allega documento
          </button>
        </div>
      </div>

      {/* Lista documenti */}
      <div className="bg-[#1a2536]/90 backdrop-blur-sm rounded-xl border border-[#243044]">
        <div className="p-4 border-b border-[#243044]">
          <h3 className="text-sm font-semibold text-gray-300">Documenti allegati</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">
            Caricamento...
          </div>
        ) : documenti.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Nessun documento allegato
          </div>
        ) : (
          <div className="divide-y divide-[#243044]">
            {documenti.map((doc) => (
              <div key={doc.idDocumento} className="p-4 hover:bg-[#243044]/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <FiFile className="w-5 h-5 text-blue-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{doc.nome}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {doc.tipoDocumento} • {doc.dimensione ? `${(doc.dimensione / 1024).toFixed(0)} KB` : 'N/A'}
                        {doc.dataCaricamento && ` • ${new Date(doc.dataCaricamento).toLocaleDateString()}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 hover:bg-blue-600/20 text-blue-400 rounded-lg transition-colors"
                      title="Scarica"
                    >
                      <FiDownload className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload modal */}
      {showUploadModal && (
        <Modal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="Allega documento"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo documento
              </label>
              <select
                value={uploadData.tipoDocumento}
                onChange={(e) => setUploadData(prev => ({ ...prev, tipoDocumento: e.target.value }))}
                className="w-full bg-[#243044] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              >
                {tipiDocumento.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                File
              </label>
              <input
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full bg-[#243044] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">PDF, JPG o PNG - Max 10MB</p>
            </div>

            {uploadData.nome && (
              <div className="text-sm text-gray-400">
                File selezionato: <span className="text-white">{uploadData.nome}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descrizione (opzionale)
              </label>
              <textarea
                value={uploadData.descrizione}
                onChange={(e) => setUploadData(prev => ({ ...prev, descrizione: e.target.value }))}
                className="w-full bg-[#243044] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
              >
                Annulla
              </button>
              <LoadingButton
                onClick={handleUpload}
                loading={uploading}
                disabled={!uploadData.file}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50"
              >
                Allega
              </LoadingButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default VFUFascicoloTab;
