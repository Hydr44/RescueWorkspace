// src/hooks/useExportTemplates.js
import { useState, useEffect, useCallback } from 'react';
import { useOrg } from '@/context/OrgContext';
import { ExportTemplateService } from '@/lib/services/exportTemplateService';

export function useExportTemplates() {
  const { orgId } = useOrg();
  const [templates, setTemplates] = useState([]);
  const [defaultTemplates, setDefaultTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadTemplates = useCallback(async () => {
    if (!orgId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await ExportTemplateService.getAll(orgId);
      setTemplates(data);
    } catch (err) {
      console.error('Error loading export templates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const loadDefaultTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ExportTemplateService.getDefaultTemplates();
      setDefaultTemplates(data);
    } catch (err) {
      console.error('Error loading default templates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTemplatesByCategory = useCallback(async (category) => {
    if (!orgId) return [];
    
    try {
      return await ExportTemplateService.getByCategory(orgId, category);
    } catch (err) {
      console.error('Error loading templates by category:', err);
      setError(err.message);
      return [];
    }
  }, [orgId]);

  const getTemplatesByDocumentType = useCallback(async (documentType) => {
    if (!orgId) return [];
    
    try {
      return await ExportTemplateService.getByDocumentType(orgId, documentType);
    } catch (err) {
      console.error('Error loading templates by document type:', err);
      setError(err.message);
      return [];
    }
  }, [orgId]);

  const getDefaultTemplate = useCallback(async (category) => {
    if (!orgId) return null;
    
    try {
      return await ExportTemplateService.getDefault(orgId, category);
    } catch (err) {
      console.error('Error loading default template:', err);
      setError(err.message);
      return null;
    }
  }, [orgId]);

  const createTemplate = useCallback(async (templateData) => {
    if (!orgId) return;
    
    try {
      setSaving(true);
      setError(null);
      
      // Valida il template
      const errors = ExportTemplateService.validateTemplate(templateData);
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }
      
      const newTemplate = await ExportTemplateService.create(orgId, templateData);
      setTemplates(prev => [...prev, newTemplate]);
      return newTemplate;
    } catch (err) {
      console.error('Error creating template:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [orgId]);

  const updateTemplate = useCallback(async (templateId, updates) => {
    try {
      setSaving(true);
      setError(null);
      
      const updatedTemplate = await ExportTemplateService.update(templateId, updates);
      setTemplates(prev => prev.map(t => t.id === templateId ? updatedTemplate : t));
      return updatedTemplate;
    } catch (err) {
      console.error('Error updating template:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteTemplate = useCallback(async (templateId) => {
    try {
      setSaving(true);
      setError(null);
      
      await ExportTemplateService.delete(templateId);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (err) {
      console.error('Error deleting template:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const duplicateTemplate = useCallback(async (templateId, newName) => {
    try {
      setSaving(true);
      setError(null);
      
      const duplicatedTemplate = await ExportTemplateService.duplicate(templateId, newName);
      setTemplates(prev => [...prev, duplicatedTemplate]);
      return duplicatedTemplate;
    } catch (err) {
      console.error('Error duplicating template:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const setAsDefault = useCallback(async (templateId) => {
    if (!orgId) return;
    
    try {
      setSaving(true);
      setError(null);
      
      await ExportTemplateService.setAsDefault(templateId, orgId);
      
      // Aggiorna lo stato locale
      setTemplates(prev => prev.map(t => ({
        ...t,
        is_default: t.id === templateId
      })));
    } catch (err) {
      console.error('Error setting template as default:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [orgId]);

  const importDefaultTemplate = useCallback(async (defaultTemplateId, customName) => {
    if (!orgId) return;
    
    try {
      setSaving(true);
      setError(null);
      
      const importedTemplate = await ExportTemplateService.importDefaultTemplate(
        orgId,
        defaultTemplateId,
        customName
      );
      
      setTemplates(prev => [...prev, importedTemplate]);
      return importedTemplate;
    } catch (err) {
      console.error('Error importing default template:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [orgId]);

  const getStats = useCallback(async () => {
    if (!orgId) return null;
    
    try {
      return await ExportTemplateService.getStats(orgId);
    } catch (err) {
      console.error('Error getting template stats:', err);
      setError(err.message);
      return null;
    }
  }, [orgId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    templates,
    defaultTemplates,
    loading,
    saving,
    error,
    loadTemplates,
    loadDefaultTemplates,
    getTemplatesByCategory,
    getTemplatesByDocumentType,
    getDefaultTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    setAsDefault,
    importDefaultTemplate,
    getStats
  };
}
