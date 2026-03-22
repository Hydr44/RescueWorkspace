// src/hooks/useCompanySettings.js
import { useState, useEffect, useCallback } from 'react';
import { useOrg } from '@/context/OrgContext';
import { CompanySettingsService } from '@/lib/services/companySettingsService';

export function useCompanySettings() {
  const { orgId } = useOrg();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadSettings = useCallback(async () => {
    if (!orgId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await CompanySettingsService.get(orgId);
      setSettings(data);
    } catch (err) {
      console.error('Error loading company settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const updateSettings = useCallback(async (updates) => {
    if (!orgId) return;
    
    try {
      setSaving(true);
      setError(null);
      
      // Valida le impostazioni
      const errors = CompanySettingsService.validateSettings(updates);
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }
      
      const updatedSettings = await CompanySettingsService.update(orgId, updates);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      console.error('Error updating company settings:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [orgId]);

  const uploadLogo = useCallback(async (file) => {
    if (!orgId) return;
    
    try {
      setSaving(true);
      setError(null);
      
      const logoUrl = await CompanySettingsService.uploadLogo(file, orgId);
      
      // Aggiorna le impostazioni locali
      setSettings(prev => ({
        ...prev,
        logo_url: logoUrl
      }));
      
      return logoUrl;
    } catch (err) {
      console.error('Error uploading logo:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [orgId]);

  const resetToDefault = useCallback(async () => {
    if (!orgId) return;
    
    try {
      setSaving(true);
      setError(null);
      
      const defaultSettings = await CompanySettingsService.resetToDefault(orgId);
      setSettings(defaultSettings);
      return defaultSettings;
    } catch (err) {
      console.error('Error resetting settings:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [orgId]);

  const getExportSettings = useCallback(async () => {
    if (!orgId) return null;
    
    try {
      return await CompanySettingsService.getForExport(orgId);
    } catch (err) {
      console.error('Error getting export settings:', err);
      setError(err.message);
      return null;
    }
  }, [orgId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    saving,
    error,
    loadSettings,
    updateSettings,
    uploadLogo,
    resetToDefault,
    getExportSettings
  };
}
