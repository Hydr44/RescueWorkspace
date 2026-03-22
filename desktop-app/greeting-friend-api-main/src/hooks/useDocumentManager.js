import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';

export const useDocumentManager = (demolitionCaseId, rvfuId) => {
  const { showSuccess, showError } = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Carica documenti
  const loadDocuments = useCallback(async () => {
    if (!demolitionCaseId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/rvfu-documents?demolitionCaseId=${demolitionCaseId}`);
      const result = await response.json();

      if (result.success) {
        setDocuments(result.documents || []);
      } else {
        showError('Errore nel caricamento dei documenti');
      }
    } catch (error) {
      logger.error('Error loading documents:', error);
      showError('Errore nel caricamento dei documenti');
    } finally {
      setLoading(false);
    }
  }, [demolitionCaseId, showError]);

  // Upload documento
  const uploadDocument = useCallback(async (file, documentType = 'ALTRO') => {
    if (!file || !demolitionCaseId) return false;

    setLoading(true);
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
        setDocuments(prev => [...prev, result.document]);
        showSuccess('Documento caricato con successo!');
        return true;
      } else {
        showError(result.error || 'Errore durante il caricamento');
        return false;
      }
    } catch (error) {
      logger.error('Error uploading document:', error);
      showError('Errore durante il caricamento del documento');
      return false;
    } finally {
      setLoading(false);
    }
  }, [demolitionCaseId, rvfuId, showSuccess, showError]);

  // Elimina documento
  const deleteDocument = useCallback(async (documentId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/rvfu-documents/${documentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        showSuccess('Documento eliminato!');
        return true;
      } else {
        showError('Errore durante l\'eliminazione del documento');
        return false;
      }
    } catch (error) {
      logger.error('Error deleting document:', error);
      showError('Errore durante l\'eliminazione del documento');
      return false;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  // Download documento
  const downloadDocument = useCallback(async (document) => {
    try {
      const response = await fetch(`/api/rvfu-documents/download/${document.id}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.document_name || 'documento.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showSuccess('Documento scaricato!');
      return true;
    } catch (error) {
      logger.error('Error downloading document:', error);
      showError('Errore durante il download del documento');
      return false;
    }
  }, [showSuccess, showError]);

  // Validazione file
  const validateFile = useCallback((file) => {
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
  }, [showError]);

  // Statistiche documenti
  const getDocumentStats = useCallback(() => {
    const stats = {
      total: documents.length,
      byType: {},
      byStatus: {},
      totalSize: 0
    };

    documents.forEach(doc => {
      // Per tipo
      stats.byType[doc.document_type] = (stats.byType[doc.document_type] || 0) + 1;
      
      // Per stato
      stats.byStatus[doc.document_status] = (stats.byStatus[doc.document_status] || 0) + 1;
      
      // Dimensione totale (approssimativa)
      if (doc.document_data) {
        stats.totalSize += Math.round(doc.document_data.length * 0.75); // Base64 è ~33% più grande
      }
    });

    return stats;
  }, [documents]);

  return {
    documents,
    loading,
    loadDocuments,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    validateFile,
    getDocumentStats,
    setDocuments
  };
};
