// src/lib/services/exportTemplateService.ts
import { supabase } from '../supabase-browser';

export interface ExportTemplate {
  id: string;
  org_id: string;
  
  // Identificazione
  name: string;
  description?: string;
  category: 'transports' | 'clients' | 'quotes' | 'invoices' | 'yard' | 'spare_parts' | 'drivers' | 'vehicles';
  subcategory?: string;
  
  // Tipo documento
  document_type: 'pdf' | 'csv' | 'xlsx' | 'html';
  file_extension: string;
  mime_type: string;
  
  // Configurazione template
  template_config: any;
  fields_config: any;
  styling_config: any;
  layout_config: any;
  
  // Configurazione dati
  data_source: string;
  data_filters: any;
  data_sorting: any;
  data_grouping: any;
  
  // Configurazione export
  export_settings: any;
  file_settings: any;
  
  // Stato e versioning
  version: number;
  is_default: boolean;
  is_active: boolean;
  is_public: boolean;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface ExportTemplateCreate {
  name: string;
  description?: string;
  category: 'transports' | 'clients' | 'quotes' | 'invoices' | 'yard' | 'spare_parts' | 'drivers' | 'vehicles';
  subcategory?: string;
  document_type: 'pdf' | 'csv' | 'xlsx' | 'html';
  template_config: any;
  fields_config: any;
  styling_config: any;
  layout_config: any;
  data_source: string;
  data_filters?: any;
  data_sorting?: any;
  data_grouping?: any;
  export_settings?: any;
  file_settings?: any;
  is_default?: boolean;
  is_public?: boolean;
}

export interface ExportTemplateUpdate {
  name?: string;
  description?: string;
  subcategory?: string;
  template_config?: any;
  fields_config?: any;
  styling_config?: any;
  layout_config?: any;
  data_filters?: any;
  data_sorting?: any;
  data_grouping?: any;
  export_settings?: any;
  file_settings?: any;
  is_default?: boolean;
  is_active?: boolean;
  is_public?: boolean;
}

export interface DefaultExportTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  document_type: string;
  template_config: any;
  fields_config: any;
  styling_config: any;
  layout_config: any;
  data_source: string;
  data_filters: any;
  export_settings: any;
  file_settings: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class ExportTemplateService {
  /**
   * Ottiene tutti i template per un'organizzazione
   */
  static async getAll(orgId: string): Promise<ExportTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('export_templates')
        .select('*')
        .eq('org_id', orgId)
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching export templates:', error);
      throw error;
    }
  }

  /**
   * Ottiene template per categoria
   */
  static async getByCategory(orgId: string, category: string): Promise<ExportTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('export_templates')
        .select('*')
        .eq('org_id', orgId)
        .eq('category', category)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching templates by category:', error);
      throw error;
    }
  }

  /**
   * Ottiene template per tipo documento
   */
  static async getByDocumentType(orgId: string, documentType: string): Promise<ExportTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('export_templates')
        .select('*')
        .eq('org_id', orgId)
        .eq('document_type', documentType)
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching templates by document type:', error);
      throw error;
    }
  }

  /**
   * Ottiene template di default per categoria
   */
  static async getDefault(orgId: string, category: string): Promise<ExportTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('export_templates')
        .select('*')
        .eq('org_id', orgId)
        .eq('category', category)
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching default template:', error);
      throw error;
    }
  }

  /**
   * Ottiene template per ID
   */
  static async getById(templateId: string): Promise<ExportTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('export_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching template by ID:', error);
      throw error;
    }
  }

  /**
   * Crea nuovo template
   */
  static async create(orgId: string, templateData: ExportTemplateCreate): Promise<ExportTemplate> {
    try {
      // Se is_default è true o non specificato, assicurati di non avere conflitti
      let isDefault = templateData.is_default || false;
      
      // Se si sta cercando di creare un default, rimuovi default esistenti della stessa categoria
      if (isDefault) {
        await supabase
          .from('export_templates')
          .update({ is_default: false })
          .eq('org_id', orgId)
          .eq('category', templateData.category)
          .eq('is_default', true);
      } else {
        // Se is_default è false, non può esserci conflitto con il vincolo unique
        // Il vincolo unique_default_per_category si applica solo quando is_default=true
      }

      const { data, error } = await supabase
        .from('export_templates')
        .insert({
          org_id: orgId,
          name: templateData.name,
          description: templateData.description,
          category: templateData.category,
          subcategory: templateData.subcategory,
          document_type: templateData.document_type,
          file_extension: this.getFileExtension(templateData.document_type),
          mime_type: this.getMimeType(templateData.document_type),
          template_config: templateData.template_config || {},
          fields_config: templateData.fields_config || {},
          styling_config: templateData.styling_config || {},
          layout_config: templateData.layout_config || {},
          data_source: templateData.data_source,
          data_filters: templateData.data_filters || {},
          data_sorting: templateData.data_sorting || {},
          data_grouping: templateData.data_grouping || {},
          export_settings: templateData.export_settings || {},
          file_settings: templateData.file_settings || {},
          is_default: isDefault,
          is_public: templateData.is_public || false,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) {
        // Se c'è ancora un errore di constraint, potrebbe essere un problema con il vincolo
        if (error.code === '23505') {
          throw new Error('Esiste già un template con queste caratteristiche. Modifica il template esistente o cambia categoria.');
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating export template:', error);
      throw error;
    }
  }

  /**
   * Aggiorna template esistente
   */
  static async update(templateId: string, updates: ExportTemplateUpdate): Promise<ExportTemplate> {
    try {
      const { data, error } = await supabase
        .from('export_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating export template:', error);
      throw error;
    }
  }

  /**
   * Elimina template
   */
  static async delete(templateId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('export_templates')
        .update({ is_active: false })
        .eq('id', templateId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting export template:', error);
      throw error;
    }
  }

  /**
   * Imposta template come default per categoria
   */
  static async setAsDefault(templateId: string, orgId: string): Promise<void> {
    try {
      // Prima rimuovi default da tutti i template della stessa categoria
      const template = await this.getById(templateId);
      if (!template) throw new Error('Template non trovato');

      await supabase
        .from('export_templates')
        .update({ is_default: false })
        .eq('org_id', orgId)
        .eq('category', template.category);

      // Poi imposta questo come default
      await supabase
        .from('export_templates')
        .update({ is_default: true })
        .eq('id', templateId);

    } catch (error) {
      console.error('Error setting template as default:', error);
      throw error;
    }
  }

  /**
   * Duplica template esistente
   */
  static async duplicate(templateId: string, newName: string): Promise<ExportTemplate> {
    try {
      const originalTemplate = await this.getById(templateId);
      if (!originalTemplate) throw new Error('Template originale non trovato');

      const duplicateData: ExportTemplateCreate = {
        name: newName,
        description: `Copia di ${originalTemplate.name}`,
        category: originalTemplate.category,
        subcategory: originalTemplate.subcategory,
        document_type: originalTemplate.document_type,
        template_config: originalTemplate.template_config,
        fields_config: originalTemplate.fields_config,
        styling_config: originalTemplate.styling_config,
        layout_config: originalTemplate.layout_config,
        data_source: originalTemplate.data_source,
        data_filters: originalTemplate.data_filters,
        data_sorting: originalTemplate.data_sorting,
        data_grouping: originalTemplate.data_grouping,
        export_settings: originalTemplate.export_settings,
        file_settings: originalTemplate.file_settings,
        is_default: false,
        is_public: false
      };

      return await this.create(originalTemplate.org_id, duplicateData);
    } catch (error) {
      console.error('Error duplicating template:', error);
      throw error;
    }
  }

  /**
   * Ottiene template predefiniti disponibili
   */
  static async getDefaultTemplates(): Promise<DefaultExportTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('default_export_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching default templates:', error);
      throw error;
    }
  }

  /**
   * Ottiene template predefiniti per categoria
   */
  static async getDefaultTemplatesByCategory(category: string): Promise<DefaultExportTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('default_export_templates')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching default templates by category:', error);
      throw error;
    }
  }

  /**
   * Importa template predefinito nell'organizzazione
   */
  static async importDefaultTemplate(orgId: string, defaultTemplateId: string, customName?: string): Promise<ExportTemplate> {
    try {
      const { data: defaultTemplate, error: fetchError } = await supabase
        .from('default_export_templates')
        .select('*')
        .eq('id', defaultTemplateId)
        .single();

      if (fetchError) throw fetchError;

      const templateData: ExportTemplateCreate = {
        name: customName || defaultTemplate.name,
        description: defaultTemplate.description,
        category: defaultTemplate.category as any,
        subcategory: defaultTemplate.subcategory,
        document_type: defaultTemplate.document_type as any,
        template_config: defaultTemplate.template_config,
        fields_config: defaultTemplate.fields_config,
        styling_config: defaultTemplate.styling_config,
        layout_config: defaultTemplate.layout_config,
        data_source: defaultTemplate.data_source,
        data_filters: defaultTemplate.data_filters,
        export_settings: defaultTemplate.export_settings,
        file_settings: defaultTemplate.file_settings,
        is_default: false,
        is_public: false
      };

      return await this.create(orgId, templateData);
    } catch (error) {
      console.error('Error importing default template:', error);
      throw error;
    }
  }

  /**
   * Ottiene estensione file per tipo documento
   */
  private static getFileExtension(documentType: string): string {
    const extensions = {
      'pdf': 'pdf',
      'csv': 'csv',
      'xlsx': 'xlsx',
      'html': 'html'
    };
    return extensions[documentType as keyof typeof extensions] || 'txt';
  }

  /**
   * Ottiene MIME type per tipo documento
   */
  private static getMimeType(documentType: string): string {
    const mimeTypes = {
      'pdf': 'application/pdf',
      'csv': 'text/csv',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'html': 'text/html'
    };
    return mimeTypes[documentType as keyof typeof mimeTypes] || 'text/plain';
  }

  /**
   * Valida configurazione template
   */
  static validateTemplate(template: ExportTemplateCreate): string[] {
    const errors: string[] = [];

    if (!template.name || template.name.trim().length === 0) {
      errors.push('Nome template richiesto');
    }

    if (!template.category) {
      errors.push('Categoria richiesta');
    }

    if (!template.document_type) {
      errors.push('Tipo documento richiesto');
    }

    if (!template.data_source) {
      errors.push('Sorgente dati richiesta');
    }

    // Validazione template_config
    if (template.template_config) {
      try {
        JSON.stringify(template.template_config);
      } catch {
        errors.push('Configurazione template non valida');
      }
    }

    // Validazione fields_config
    if (template.fields_config) {
      try {
        JSON.stringify(template.fields_config);
      } catch {
        errors.push('Configurazione campi non valida');
      }
    }

    return errors;
  }

  /**
   * Ottiene statistiche template per organizzazione
   */
  static async getStats(orgId: string): Promise<{
    total: number;
    byCategory: Record<string, number>;
    byDocumentType: Record<string, number>;
    defaultTemplates: number;
  }> {
    try {
      const templates = await this.getAll(orgId);
      
      const stats = {
        total: templates.length,
        byCategory: {} as Record<string, number>,
        byDocumentType: {} as Record<string, number>,
        defaultTemplates: templates.filter(t => t.is_default).length
      };

      // Conta per categoria
      templates.forEach(template => {
        stats.byCategory[template.category] = (stats.byCategory[template.category] || 0) + 1;
        stats.byDocumentType[template.document_type] = (stats.byDocumentType[template.document_type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting template stats:', error);
      throw error;
    }
  }
}
