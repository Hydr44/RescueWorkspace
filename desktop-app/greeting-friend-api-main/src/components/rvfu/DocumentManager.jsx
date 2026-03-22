import React, { useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  FiUpload, FiDownload, FiEye, FiTrash2, FiFile, FiImage, 
  FiFileText, FiCheckCircle, FiX, FiPlus 
} from 'react-icons/fi';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
import LoadingButton from '@/components/ui/LoadingButton';

const DocumentManager = ({ 
  demolitionCaseId, 
  rvfuId, 
  documents = [], 
  onDocumentsChange,
  className = '' 
}) => {
  const { showSuccess, showError } = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Tipi documento supportati
  const documentTypes = [
    { value: 'CARTA_CIRCOLAZIONE', label: 'Carta di Circolazione', icon: FiFileText },
    { value: 'CERTIFICATO_DEMOLIZIONE', label: 'Certificato Demolizione', icon: FiCheckCircle },
    { value: 'FOTO_VEICOLO_PRIMA', label: 'Foto Veicolo Prima', icon: FiImage },
    { value: 'FOTO_VEICOLO_DOPO', label: 'Foto Veicolo Dopo', icon: FiImage },
    { value: 'DOCUMENTO_IDENTITA', label: 'Documento Identità', icon: FiFile },
    { value: 'ALTRO', label: 'Altro', icon: FiFile }
  ];

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

  // Validazione file
  const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > maxSize) {
      showError('File troppo grande. Dimensione massima: 10MB');
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      showError('Tipo file non supportato. Usa PDF, JPG, PNG o DOC');
      return false;
    }

    return true;
  };

  // Upload file
  const handleFileUpload = async (file, documentType = 'ALTRO') => {
    if (!validateFile(file)) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('demolitionCaseId', demolitionCaseId);
      formData.append('rvfuId', rvfuId || '');
      formData.append('documentType', documentType);
      formData.append('fileName', file.name);

      const response = await fetch('/api/rvfu-documents/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        showSuccess('Documento caricato con successo!');
        onDocumentsChange?.([...documents, result.document]);
      } else {
        showError(result.error || 'Errore durante il caricamento');
      }
    } catch (error) {
      logger.error('Error uploading document:', error);
      showError('Errore durante il caricamento del documento');
    } finally {
      setUploading(false);
    }
  };

  // Download documento
  const handleDownload = async (document) => {
    try {
      const response = await fetch(`/api/rvfu-documents/download/${document.id}`);
      const blob = await response.blob();
      
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.document_name || 'documento.pdf';
      document.body.appendChild(a);
      a.click();
      globalThis.URL.revokeObjectURL(url);
      a.remove();
      
      showSuccess('Documento scaricato!');
    } catch (error) {
      logger.error('Error downloading document:', error);
      showError('Errore durante il download del documento');
    }
  };

  // Elimina documento
  const handleDelete = async (documentId) => {
    if (!confirm('Sei sicuro di voler eliminare questo documento?')) return;

    try {
      const response = await fetch(`/api/rvfu-documents/${documentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showSuccess('Documento eliminato!');
        onDocumentsChange?.(documents.filter(doc => doc.id !== documentId));
      } else {
        showError('Errore durante l\'eliminazione del documento');
      }
    } catch (error) {
      logger.error('Error deleting document:', error);
      showError('Errore durante l\'eliminazione del documento');
    }
  };

  // Preview documento
  const handlePreview = (document) => {
    setPreviewDoc(document);
  };

  // Get icon per tipo documento
  const getDocumentIcon = (documentType) => {
    const type = documentTypes.find(t => t.value === documentType);
    return type ? type.icon : FiFile;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'FIRMATO': return 'text-green-600 bg-green-500/10';
      case 'INSERITO': return 'text-blue-600 bg-blue-500/10';
      case 'ERRORE': return 'text-red-600 bg-red-500/10';
      default: return 'text-slate-400 bg-[#141c27]';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FiFileText className="h-5 w-5" />
          Documenti RVFU
        </h3>
        <LoadingButton
          onClick={() => fileInputRef.current?.click()}
          loading={uploading}
          size="sm"
          className="animate-bounce-in"
        >
          <FiPlus className="h-4 w-4" />
          Carica Documento
        </LoadingButton>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-indigo-500 bg-blue-500/10' 
            : 'border-[#243044] hover:border-[#243044]'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <FiUpload className="mx-auto h-12 w-12 text-slate-500 mb-4" />
        <p className="text-sm text-slate-400 mb-2">
          Trascina qui i documenti o clicca per selezionare
        </p>
        <p className="text-xs text-slate-500 ">
          PDF, JPG, PNG, DOC fino a 10MB
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />
      </div>

      {/* Lista Documenti */}
      {documents.length > 0 ? (
        <div className="space-y-2">
          {documents.map((doc, index) => {
            const IconComponent = getDocumentIcon(doc.document_type);
            return (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-[#1a2536] rounded-lg border border-[#243044] hover:shadow-md transition-all duration-200 ease-out animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="font-medium text-sm">{doc.document_name}</p>
                    <p className="text-xs text-slate-500">
                      {doc.document_type} • {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.document_status)}`}>
                    {doc.document_status}
                  </span>
                  
                  <div className="flex gap-1">
                    <LoadingButton
                      onClick={() => handlePreview(doc)}
                      size="sm"
                      variant="ghost"
                      className="animate-fade-in"
                    >
                      <FiEye className="h-4 w-4" />
                    </LoadingButton>
                    <LoadingButton
                      onClick={() => handleDownload(doc)}
                      size="sm"
                      variant="ghost"
                      className="animate-fade-in"
                    >
                      <FiDownload className="h-4 w-4" />
                    </LoadingButton>
                    <LoadingButton
                      onClick={() => handleDelete(doc.id)}
                      size="sm"
                      variant="ghost"
                      className="animate-fade-in text-red-600 hover:text-red-400"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </LoadingButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-6 border border-dashed border-[#243044] rounded-lg">
          <FiFile className="mx-auto h-8 w-8 text-slate-500 mb-2" />
          <p className="text-sm text-slate-500">Nessun documento caricato</p>
        </div>
      )}

      {/* Modal Preview */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div className="bg-[#141c27] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden modal-content animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-[#243044] ">
              <h3 className="text-lg font-semibold">{previewDoc.document_name}</h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-500 hover:text-slate-400 transition-colors"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {previewDoc.document_type?.includes('FOTO') ? (
                <img
                  src={`data:image/jpeg;base64,${previewDoc.document_data}`}
                  alt={previewDoc.document_name}
                  className="max-w-full h-auto rounded"
                />
              ) : (
                <iframe
                  src={`data:application/pdf;base64,${previewDoc.document_data}`}
                  className="w-full h-96 border-0 rounded"
                  title={previewDoc.document_name}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

DocumentManager.propTypes = {
  demolitionCaseId: PropTypes.string.isRequired,
  rvfuId: PropTypes.number,
  documents: PropTypes.array,
  onDocumentsChange: PropTypes.func,
  className: PropTypes.string,
};

export default DocumentManager;
