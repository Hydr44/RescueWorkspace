// src/lib/services/companySettingsService.ts
import { supabase } from '../supabase-browser';

export interface CompanySettings {
  id: string;
  org_id: string;
  
  // Informazioni legali
  company_name: string;
  company_code?: string;
  legal_form?: string;
  vat_number?: string;
  tax_code?: string;
  fiscal_code?: string;
  chamber_of_commerce?: string;
  
  // Contatti
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  fax?: string;
  
  // Indirizzo legale
  address_street?: string;
  address_number?: string;
  address_city?: string;
  address_province?: string;
  address_postal_code?: string;
  address_country?: string;
  address_region?: string;
  
  // Indirizzo operativo
  operational_address_street?: string;
  operational_address_number?: string;
  operational_address_city?: string;
  operational_address_province?: string;
  operational_address_postal_code?: string;
  operational_address_country?: string;
  
  // Branding
  logo_url?: string;
  logo_base64?: string;
  logo_width?: number;
  logo_height?: number;
  logo_position?: 'left' | 'center' | 'right';
  
  // Colori
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  success_color?: string;
  warning_color?: string;
  error_color?: string;
  text_color?: string;
  background_color?: string;
  
  // Tipografia
  font_family?: string;
  font_family_heading?: string;
  font_size_base?: number;
  font_size_heading?: number;
  font_weight_normal?: string;
  font_weight_bold?: string;
  
  // Note legali
  legal_notes?: string;
  privacy_policy_url?: string;
  terms_url?: string;
  cookie_policy_url?: string;
  footer_text?: string;
  
  // Configurazioni export
  default_page_size?: 'A4' | 'A3' | 'Letter' | 'Legal';
  default_orientation?: 'portrait' | 'landscape';
  default_margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CompanySettingsUpdate {
  company_name?: string;
  company_code?: string;
  legal_form?: string;
  vat_number?: string;
  tax_code?: string;
  fiscal_code?: string;
  chamber_of_commerce?: string;
  
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  fax?: string;
  
  address_street?: string;
  address_number?: string;
  address_city?: string;
  address_province?: string;
  address_postal_code?: string;
  address_country?: string;
  address_region?: string;
  
  operational_address_street?: string;
  operational_address_number?: string;
  operational_address_city?: string;
  operational_address_province?: string;
  operational_address_postal_code?: string;
  operational_address_country?: string;
  
  logo_url?: string;
  logo_base64?: string;
  logo_width?: number;
  logo_height?: number;
  logo_position?: 'left' | 'center' | 'right';
  
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  success_color?: string;
  warning_color?: string;
  error_color?: string;
  text_color?: string;
  background_color?: string;
  
  font_family?: string;
  font_family_heading?: string;
  font_size_base?: number;
  font_size_heading?: number;
  font_weight_normal?: string;
  font_weight_bold?: string;
  
  legal_notes?: string;
  privacy_policy_url?: string;
  terms_url?: string;
  cookie_policy_url?: string;
  footer_text?: string;
  
  default_page_size?: 'A4' | 'A3' | 'Letter' | 'Legal';
  default_orientation?: 'portrait' | 'landscape';
  default_margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export class CompanySettingsService {
  /**
   * Metodo privato per ottenere settings senza creare automaticamente
   * Usato internamente per evitare loop infiniti
   */
  private static async _getWithoutCreate(orgId: string): Promise<CompanySettings | null> {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('org_id', orgId)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Nessun record trovato
        }
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error fetching company settings (no create):', error);
      return null;
    }
  }

  /**
   * Ottiene le configurazioni aziendali per un'organizzazione
   */
  static async get(orgId: string): Promise<CompanySettings | null> {
    try {
      // Verifica sessione autenticata
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.warn('[CompanySettings] No valid session:', sessionError);
      }

      console.log('[CompanySettings] Fetching settings for org:', orgId);
      console.log('[CompanySettings] Session valid:', !!session);
      console.log('[CompanySettings] User ID:', session?.user?.id);

      // Prima verifica quante righe ci sono (per debug)
      const { count } = await supabase
        .from('company_settings')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId);
      
      console.log('[CompanySettings] Record count for org_id:', count);

      // Query con limit per evitare errori se ci sono più righe
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[CompanySettings] Query error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        // Errore 406 Not Acceptable - potrebbe essere RLS o formato response
        if (error.message?.includes('406') || error.message?.includes('Not Acceptable')) {
          console.warn('[CompanySettings] 406 error detected. This might be:');
          console.warn('  1. RLS still enabled (check Supabase dashboard)');
          console.warn('  2. Invalid session/auth token');
          console.warn('  3. Response format issue');
          
          // Prova con una query più semplice per testare
          try {
            const { data: testData, error: testError } = await supabase
              .from('company_settings')
              .select('id, org_id, company_name')
              .eq('org_id', orgId)
              .maybeSingle();
            
            if (testError) {
              console.error('[CompanySettings] Simple query also failed:', testError);
            } else if (testData) {
              console.log('[CompanySettings] Simple query succeeded, full query has format issue');
              // Restituisci almeno i dati base
              return testData as CompanySettings;
            }
          } catch (testErr) {
            console.error('[CompanySettings] Test query error:', testErr);
          }
          
          return null;
        }

        // Errore 42501 = RLS policy violation
        if (error.code === '42501' || error.message?.includes('row-level security')) {
          console.warn('[CompanySettings] RLS policy violation. Ensure RLS is disabled in Supabase.');
          return null;
        }
        
        if (error.code === 'PGRST116') {
          // Nessuna configurazione trovata, prova a creare quella di default
          console.log('[CompanySettings] No settings found, creating default...');
          try {
            return await this.createDefault(orgId);
          } catch (createError: any) {
            console.error('[CompanySettings] Error creating default:', createError);
            // Se anche la creazione fallisce per RLS, restituisci null
            if (createError.code === '42501' || createError.message?.includes('RLS') || createError.message?.includes('406')) {
              console.warn('[CompanySettings] Cannot create default settings due to RLS/406 error');
              return null;
            }
            throw createError;
          }
        }
        
        throw error;
      }

      // Se non c'è data, prova a creare le impostazioni di default
      if (!data) {
        console.log('[CompanySettings] No data returned, creating default...');
        try {
          return await this.createDefault(orgId);
        } catch (createError: any) {
          console.error('[CompanySettings] Error creating default (no data case):', createError);
          // Se la creazione fallisce per RLS, restituisci null invece di crashare
          if (createError.code === '42501' || createError.message?.includes('RLS') || createError.message?.includes('406')) {
            console.warn('[CompanySettings] Cannot create default settings due to RLS/406 error');
            return null;
          }
          throw createError;
        }
      }

      console.log('[CompanySettings] Successfully fetched settings');
      return data;
    } catch (error) {
      console.error('[CompanySettings] Unexpected error:', error);
      throw error;
    }
  }

  /**
   * Aggiorna le configurazioni aziendali
   */
  static async update(orgId: string, updates: CompanySettingsUpdate): Promise<CompanySettings> {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('org_id', orgId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating company settings:', error);
      throw error;
    }
  }

  /**
   * Crea configurazioni di default per una nuova organizzazione
   * Prima prova con la funzione RPC, poi fallback a INSERT diretto se RLS lo permette
   */
  static async createDefault(orgId: string): Promise<CompanySettings> {
    try {
      // Prima verifica se esiste già (usando metodo privato per evitare loop)
      const existing = await this._getWithoutCreate(orgId);
      if (existing) {
        return existing;
      }

      // Prova con funzione RPC (bypassa RLS se disponibile)
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('create_default_company_settings', {
          org_id_param: orgId
        });

        if (!rpcError && rpcData) {
          // La funzione ha successo, recupera i dati
          const { data: settings, error: fetchError } = await supabase
            .from('company_settings')
            .select('*')
            .eq('org_id', orgId)
            .single();

          if (!fetchError && settings) {
            return settings;
          }
        }
      } catch (rpcErr) {
        console.warn('RPC function failed, trying direct insert:', rpcErr);
      }

      // Fallback: INSERT diretto (se RLS lo permette)
      const user = (await supabase.auth.getUser()).data.user;
      const { data, error } = await supabase
        .from('company_settings')
        .insert({
          org_id: orgId,
          company_name: 'RescueManager',
          primary_color: '#3B82F6',
          secondary_color: '#1E40AF',
          accent_color: '#F59E0B',
          success_color: '#10B981',
          warning_color: '#F59E0B',
          error_color: '#EF4444',
          text_color: '#374151',
          background_color: '#FFFFFF',
          font_family: 'Inter',
          font_family_heading: 'Inter',
          font_size_base: 12,
          font_size_heading: 18,
          font_weight_normal: '400',
          font_weight_bold: '700',
          default_page_size: 'A4',
          default_orientation: 'portrait',
          default_margins: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
          },
          created_by: user?.id
        })
        .select()
        .single();

      if (error) {
        // Se anche l'INSERT fallisce, potrebbe essere un problema RLS
        console.error('Error creating default company settings:', error);
        throw new Error(`Cannot create company settings: ${error.message}. Please ensure you have permissions for this organization.`);
      }

      return data;
    } catch (error) {
      console.error('Error creating default company settings:', error);
      throw error;
    }
  }

  /**
   * Upload logo aziendale
   */
  static async uploadLogo(file: File, orgId: string): Promise<string> {
    try {
      // Genera nome file unico
      const fileExt = file.name.split('.').pop();
      const fileName = `${orgId}/logo_${Date.now()}.${fileExt}`;

      // Upload file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Ottieni URL pubblico
      const { data: urlData } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName);

      // Converti in base64 per export offline
      const base64 = await this.fileToBase64(file);

      // Aggiorna configurazioni con nuovo logo
      await this.update(orgId, {
        logo_url: urlData.publicUrl,
        logo_base64: base64,
        logo_width: 200,
        logo_height: 100
      });

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  }

  /**
   * Converte file in base64
   */
  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Rimuovi il prefisso data:image/...;base64,
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Valida configurazioni aziendali
   */
  static validateSettings(settings: CompanySettingsUpdate): string[] {
    const errors: string[] = [];

    // Validazione email
    if (settings.email && !this.isValidEmail(settings.email)) {
      errors.push('Email non valida');
    }

    // Validazione telefono
    if (settings.phone && !this.isValidPhone(settings.phone)) {
      errors.push('Numero di telefono non valido');
    }

    // Validazione colori
    if (settings.primary_color && !this.isValidColor(settings.primary_color)) {
      errors.push('Colore primario non valido');
    }

    if (settings.secondary_color && !this.isValidColor(settings.secondary_color)) {
      errors.push('Colore secondario non valido');
    }

    if (settings.accent_color && !this.isValidColor(settings.accent_color)) {
      errors.push('Colore accent non valido');
    }

    // Validazione dimensioni font
    if (settings.font_size_base && (settings.font_size_base < 8 || settings.font_size_base > 24)) {
      errors.push('Dimensione font base deve essere tra 8 e 24');
    }

    if (settings.font_size_heading && (settings.font_size_heading < 12 || settings.font_size_heading > 48)) {
      errors.push('Dimensione font heading deve essere tra 12 e 48');
    }

    return errors;
  }

  /**
   * Valida formato email
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
  }

  /**
   * Valida formato telefono
   */
  private static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]+$/;
    return phoneRegex.test(phone);
  }

  /**
   * Valida formato colore hex
   */
  private static isValidColor(color: string): boolean {
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    return colorRegex.test(color);
  }

  /**
   * Ottiene configurazioni per export (ottimizzate)
   */
  /**
   * Carica i dati "Info Azienda" autoritativi da org_settings.key='company'.
   * Questa è la fonte UFFICIALE da Maggio 2026 (vedi tab Settings → Organizzazione → Info Azienda).
   * Schema esempio: { company_name, vat, tax_code, address: {street, civico, city, zip, province, country}, regime_fiscale }
   * o nel formato vecchio piatto.
   */
  private static async _getOrgInfoAzienda(orgId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('org_settings')
        .select('value')
        .eq('org_id', orgId)
        .eq('key', 'company')
        .maybeSingle();
      if (error || !data?.value) return null;
      const v: any = data.value;
      // Normalizza schema: address può essere stringa o oggetto
      let street = '';
      let city = v.city || '';
      let zip = v.zip || '';
      let province = v.province || '';
      let country = v.country || 'IT';
      if (v.address && typeof v.address === 'object') {
        street = [v.address.street, v.address.civico].filter(Boolean).join(' ').trim();
        city = city || v.address.city || '';
        zip = zip || v.address.zip || '';
        province = province || v.address.province || '';
        country = country || v.address.country || 'IT';
      } else if (typeof v.address === 'string') {
        street = v.address;
      }
      return {
        company_name: v.company_name || null,
        vat_number: v.vat || v.piva || null,
        tax_code: v.tax_code || v.codice_fiscale || null,
        address_street: street || null,
        address_city: city || null,
        address_postal_code: zip || null,
        address_province: province || null,
        address_country: country || 'IT',
        phone: v.phone || null,
        email: v.email || null,
        pec: v.pec || null,
        sdi_recipient_code: v.codice_destinatario || null,
        regime_fiscale: v.regime_fiscale || null,
      };
    } catch {
      return null;
    }
  }

  static async getForExport(orgId: string): Promise<{
    company_name: string;
    logo_base64?: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    text_color: string;
    background_color: string;
    font_family: string;
    font_size_base: number;
    font_size_heading: number;
    legal_notes?: string;
    vat_number?: string;
    tax_code?: string;
    address_street?: string;
    address_city?: string;
    address_postal_code?: string;
    address_province?: string;
    phone?: string;
    email?: string;
    pec?: string;
    sdi_recipient_code?: string;
  }> {
    // 1. Fonte AUTORITATIVA: org_settings.key='company' (Info Azienda)
    const orgInfo = await this._getOrgInfoAzienda(orgId);
    // 2. Fonte BRANDING (legacy): tabella company_settings (logo, colori, font, footer)
    const branding = await this.get(orgId);

    // Default branding values
    const defaults = {
      primary_color: '#3B82F6',
      secondary_color: '#1E40AF',
      accent_color: '#F59E0B',
      text_color: '#374151',
      background_color: '#FFFFFF',
      font_family: 'Inter',
      font_size_base: 12,
      font_size_heading: 18,
    };

    // Merge: prevalgono SEMPRE i dati da Info Azienda (orgInfo) per anagrafica;
    // company_settings è fallback per legacy + fonte unica per branding
    return {
      company_name: orgInfo?.company_name || branding?.company_name || 'RescueManager',
      vat_number: orgInfo?.vat_number || branding?.vat_number || undefined,
      tax_code: orgInfo?.tax_code || branding?.tax_code || undefined,
      address_street: orgInfo?.address_street || branding?.address_street || undefined,
      address_city: orgInfo?.address_city || branding?.address_city || undefined,
      address_postal_code: orgInfo?.address_postal_code || branding?.address_postal_code || undefined,
      address_province: orgInfo?.address_province || branding?.address_province || undefined,
      phone: orgInfo?.phone || branding?.phone || undefined,
      email: orgInfo?.email || branding?.email || undefined,
      pec: orgInfo?.pec || branding?.pec || undefined,
      sdi_recipient_code: orgInfo?.sdi_recipient_code || branding?.sdi_recipient_code || undefined,
      // Branding (sempre da company_settings, fallback ai default)
      logo_base64: branding?.logo_base64,
      primary_color: branding?.primary_color || defaults.primary_color,
      secondary_color: branding?.secondary_color || defaults.secondary_color,
      accent_color: branding?.accent_color || defaults.accent_color,
      text_color: branding?.text_color || defaults.text_color,
      background_color: branding?.background_color || defaults.background_color,
      font_family: branding?.font_family || defaults.font_family,
      font_size_base: branding?.font_size_base || defaults.font_size_base,
      font_size_heading: branding?.font_size_heading || defaults.font_size_heading,
      legal_notes: branding?.legal_notes,
    };
  }

  /**
   * Resetta configurazioni ai valori di default
   */
  static async resetToDefault(orgId: string): Promise<CompanySettings> {
    try {
      const defaultSettings: CompanySettingsUpdate = {
        company_name: 'RescueManager',
        primary_color: '#3B82F6',
        secondary_color: '#1E40AF',
        accent_color: '#F59E0B',
        success_color: '#10B981',
        warning_color: '#F59E0B',
        error_color: '#EF4444',
        text_color: '#374151',
        background_color: '#FFFFFF',
        font_family: 'Inter',
        font_family_heading: 'Inter',
        font_size_base: 12,
        font_size_heading: 18,
        font_weight_normal: '400',
        font_weight_bold: '700',
        default_page_size: 'A4',
        default_orientation: 'portrait',
        default_margins: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20
        }
      };

      return await this.update(orgId, defaultSettings);
    } catch (error) {
      console.error('Error resetting company settings:', error);
      throw error;
    }
  }

  /**
   * Duplica configurazioni da un'altra organizzazione
   */
  static async duplicateFromOrg(orgId: string, sourceOrgId: string): Promise<CompanySettings> {
    try {
      const sourceSettings = await this.get(sourceOrgId);
      if (!sourceSettings) {
        throw new Error('Configurazioni sorgente non trovate');
      }

      // Rimuovi campi che non devono essere duplicati
      const { id, org_id, created_at, updated_at, created_by, updated_by, ...settingsToCopy } = sourceSettings;

      return await this.update(orgId, settingsToCopy);
    } catch (error) {
      console.error('Error duplicating company settings:', error);
      throw error;
    }
  }

  /**
   * Elimina il logo aziendale
   */
  static async deleteLogo(orgId: string, logoUrl: string): Promise<void> {
    try {
      // Aggiorna le impostazioni per rimuovere il logo
      await this.update(orgId, {
        logo_url: null
      });
      
      // TODO: Implementare eliminazione file da Supabase Storage se necessario
      console.log('Logo URL rimosso dalle impostazioni:', logoUrl);
    } catch (error) {
      console.error('Error deleting logo:', error);
      throw error;
    }
  }
}
