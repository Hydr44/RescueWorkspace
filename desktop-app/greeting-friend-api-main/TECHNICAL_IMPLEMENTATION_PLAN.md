# 🛠️ Implementazione Tecnica - Sistema Personalizzazione Aziendale

## 📋 Architettura Tecnica

### **Stack Tecnologico**

#### **Frontend**
- **React** + **TypeScript** per l'interfaccia
- **Tailwind CSS** per styling personalizzabile
- **React Hook Form** per gestione form complessi
- **React Query** per cache e sincronizzazione
- **Zustand** per stato globale personalizzazioni

#### **Backend**
- **Supabase** per database e autenticazione
- **Edge Functions** per generazione PDF/CSV
- **Storage** per logo e asset aziendali
- **Real-time** per preview live

#### **Generazione Documenti**
- **jsPDF** per PDF client-side
- **Puppeteer** per PDF server-side complessi
- **SheetJS** per Excel/CSV
- **Canvas API** per manipolazione immagini

---

## 🗄️ Schema Database Dettagliato

### **1. Company Settings**

```sql
-- Estende la tabella orgs esistente
ALTER TABLE public.orgs ADD COLUMN IF NOT EXISTS 
  company_settings_id uuid REFERENCES company_settings(id);

-- Tabella principale configurazioni azienda
CREATE TABLE public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Informazioni legali
  company_name text NOT NULL,
  company_code text UNIQUE,
  legal_form text, -- SRL, SPA, etc.
  vat_number text,
  tax_code text,
  fiscal_code text,
  chamber_of_commerce text,
  
  -- Contatti principali
  email text,
  phone text,
  mobile text,
  website text,
  fax text,
  
  -- Indirizzo legale
  address_street text,
  address_number text,
  address_city text,
  address_province text,
  address_postal_code text,
  address_country text DEFAULT 'IT',
  address_region text,
  
  -- Indirizzo operativo (se diverso)
  operational_address_street text,
  operational_address_number text,
  operational_address_city text,
  operational_address_province text,
  operational_address_postal_code text,
  operational_address_country text DEFAULT 'IT',
  
  -- Branding visuale
  logo_url text,
  logo_base64 text, -- Per export offline
  logo_width integer DEFAULT 200,
  logo_height integer DEFAULT 100,
  logo_position text DEFAULT 'left' CHECK (logo_position IN ('left', 'center', 'right')),
  
  -- Palette colori
  primary_color text DEFAULT '#3B82F6',
  secondary_color text DEFAULT '#1E40AF',
  accent_color text DEFAULT '#F59E0B',
  success_color text DEFAULT '#10B981',
  warning_color text DEFAULT '#F59E0B',
  error_color text DEFAULT '#EF4444',
  text_color text DEFAULT '#374151',
  background_color text DEFAULT '#FFFFFF',
  
  -- Tipografia
  font_family text DEFAULT 'Inter',
  font_family_heading text DEFAULT 'Inter',
  font_size_base integer DEFAULT 12,
  font_size_heading integer DEFAULT 18,
  font_weight_normal text DEFAULT '400',
  font_weight_bold text DEFAULT '700',
  
  -- Note legali e footer
  legal_notes text,
  privacy_policy_url text,
  terms_url text,
  cookie_policy_url text,
  footer_text text,
  
  -- Configurazioni export
  default_page_size text DEFAULT 'A4' CHECK (default_page_size IN ('A4', 'A3', 'Letter', 'Legal')),
  default_orientation text DEFAULT 'portrait' CHECK (default_orientation IN ('portrait', 'landscape')),
  default_margins jsonb DEFAULT '{"top": 20, "right": 20, "bottom": 20, "left": 20}',
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_phone CHECK (phone ~* '^[\+]?[0-9\s\-\(\)]+$'),
  CONSTRAINT valid_colors CHECK (
    primary_color ~* '^#[0-9A-Fa-f]{6}$' AND
    secondary_color ~* '^#[0-9A-Fa-f]{6}$' AND
    accent_color ~* '^#[0-9A-Fa-f]{6}$'
  )
);

-- Indici per performance
CREATE INDEX idx_company_settings_org_id ON public.company_settings(org_id);
CREATE INDEX idx_company_settings_company_code ON public.company_settings(company_code);
```

### **2. Export Templates**

```sql
CREATE TABLE public.export_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Identificazione
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN (
    'transports', 'clients', 'quotes', 'invoices', 
    'yard', 'spare_parts', 'drivers', 'vehicles'
  )),
  subcategory text, -- 'list', 'detail', 'report', 'summary'
  
  -- Tipo documento
  document_type text NOT NULL CHECK (document_type IN ('pdf', 'csv', 'xlsx', 'html')),
  file_extension text NOT NULL,
  mime_type text NOT NULL,
  
  -- Configurazione template
  template_config jsonb NOT NULL DEFAULT '{}',
  fields_config jsonb NOT NULL DEFAULT '{}',
  styling_config jsonb NOT NULL DEFAULT '{}',
  layout_config jsonb NOT NULL DEFAULT '{}',
  
  -- Configurazione dati
  data_source text NOT NULL, -- 'transports', 'clients', etc.
  data_filters jsonb DEFAULT '{}',
  data_sorting jsonb DEFAULT '{}',
  data_grouping jsonb DEFAULT '{}',
  
  -- Configurazione export
  export_settings jsonb DEFAULT '{}',
  file_settings jsonb DEFAULT '{}',
  
  -- Stato e versioning
  version integer DEFAULT 1,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  is_public boolean DEFAULT false, -- Per template condivisi
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT unique_default_per_category UNIQUE (org_id, category, is_default) 
    DEFERRABLE INITIALLY DEFERRED
);

-- Indici
CREATE INDEX idx_export_templates_org_id ON public.export_templates(org_id);
CREATE INDEX idx_export_templates_category ON public.export_templates(category);
CREATE INDEX idx_export_templates_document_type ON public.export_templates(document_type);
CREATE INDEX idx_export_templates_active ON public.export_templates(is_active) WHERE is_active = true;
```

### **3. Export Configurations**

```sql
CREATE TABLE public.export_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.export_templates(id) ON DELETE CASCADE,
  
  -- Identificazione export
  name text NOT NULL,
  description text,
  export_type text NOT NULL CHECK (export_type IN ('manual', 'scheduled', 'automatic')),
  
  -- Configurazione dati
  data_source text NOT NULL,
  data_filters jsonb DEFAULT '{}',
  data_fields jsonb DEFAULT '{}',
  data_sorting jsonb DEFAULT '{}',
  data_limit integer,
  
  -- Configurazione file
  file_format text NOT NULL CHECK (file_format IN ('pdf', 'csv', 'xlsx', 'html')),
  file_name_template text DEFAULT '{category}_{date}_{time}',
  file_compression boolean DEFAULT false,
  
  -- Configurazione contenuto
  include_logo boolean DEFAULT true,
  include_company_info boolean DEFAULT true,
  include_legal_notes boolean DEFAULT false,
  include_page_numbers boolean DEFAULT true,
  include_timestamp boolean DEFAULT true,
  
  -- Configurazione layout
  page_orientation text DEFAULT 'portrait',
  page_size text DEFAULT 'A4',
  margins jsonb DEFAULT '{"top": 20, "right": 20, "bottom": 20, "left": 20}',
  
  -- Scheduling (per export automatici)
  schedule_config jsonb DEFAULT '{}',
  last_run timestamptz,
  next_run timestamptz,
  
  -- Stato
  is_active boolean DEFAULT true,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Indici
CREATE INDEX idx_export_configurations_org_id ON public.export_configurations(org_id);
CREATE INDEX idx_export_configurations_template_id ON public.export_configurations(template_id);
CREATE INDEX idx_export_configurations_scheduled ON public.export_configurations(next_run) 
  WHERE is_active = true AND export_type = 'scheduled';
```

### **4. Export History**

```sql
CREATE TABLE public.export_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  configuration_id uuid REFERENCES public.export_configurations(id) ON DELETE SET NULL,
  
  -- Informazioni export
  export_name text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  file_format text NOT NULL,
  mime_type text NOT NULL,
  
  -- Configurazione utilizzata
  template_config jsonb,
  data_filters jsonb,
  
  -- Risultati
  records_exported integer DEFAULT 0,
  export_duration_ms integer,
  success boolean DEFAULT true,
  error_message text,
  
  -- File storage
  file_url text,
  file_path text,
  expires_at timestamptz,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Indici
CREATE INDEX idx_export_history_org_id ON public.export_history(org_id);
CREATE INDEX idx_export_history_created_at ON public.export_history(created_at DESC);
CREATE INDEX idx_export_history_file_format ON public.export_history(file_format);
```

---

## 🎨 Sistema Template Engine

### **Template PDF Engine**

```typescript
// src/lib/templateEngine/pdfEngine.ts
export class PDFTemplateEngine {
  private doc: jsPDF;
  private companySettings: CompanySettings;
  private template: ExportTemplate;

  constructor(companySettings: CompanySettings, template: ExportTemplate) {
    this.companySettings = companySettings;
    this.template = template;
    this.doc = new jsPDF({
      orientation: template.layout_config.orientation || 'portrait',
      unit: 'mm',
      format: template.layout_config.pageSize || 'a4'
    });
  }

  async generatePDF(data: any[]): Promise<Blob> {
    // 1. Setup documento
    this.setupDocument();
    
    // 2. Genera header
    await this.generateHeader();
    
    // 3. Genera contenuto
    await this.generateContent(data);
    
    // 4. Genera footer
    await this.generateFooter();
    
    // 5. Ritorna blob
    return this.doc.output('blob');
  }

  private setupDocument() {
    // Applica colori aziendali
    this.doc.setProperties({
      title: this.template.name,
      subject: this.template.description,
      author: this.companySettings.company_name,
      creator: 'RescueManager'
    });
  }

  private async generateHeader() {
    const config = this.template.template_config.header;
    
    // Logo aziendale
    if (config.logo?.enabled && this.companySettings.logo_base64) {
      await this.addLogo(config.logo);
    }
    
    // Informazioni azienda
    if (config.companyInfo?.enabled) {
      this.addCompanyInfo(config.companyInfo);
    }
    
    // Titolo documento
    if (config.title) {
      this.addTitle(config.title);
    }
  }

  private async addLogo(logoConfig: any) {
    const logoData = this.companySettings.logo_base64;
    const logoWidth = logoConfig.size === 'large' ? 60 : 
                     logoConfig.size === 'medium' ? 40 : 20;
    
    // Posiziona logo
    let x = 20; // default left
    if (logoConfig.position === 'center') x = (this.doc.internal.pageSize.width - logoWidth) / 2;
    if (logoConfig.position === 'right') x = this.doc.internal.pageSize.width - logoWidth - 20;
    
    this.doc.addImage(logoData, 'PNG', x, 20, logoWidth, logoWidth * 0.5);
  }

  private addCompanyInfo(companyConfig: any) {
    const fields = companyConfig.fields || ['name', 'address', 'phone', 'email'];
    let y = 25;
    
    fields.forEach(field => {
      const value = this.getCompanyFieldValue(field);
      if (value) {
        this.doc.setFontSize(10);
        this.doc.setTextColor(this.companySettings.text_color);
        this.doc.text(value, this.doc.internal.pageSize.width - 20, y, { align: 'right' });
        y += 5;
      }
    });
  }

  private addTitle(titleConfig: any) {
    this.doc.setFontSize(titleConfig.fontSize || 18);
    this.doc.setFont('helvetica', titleConfig.fontWeight || 'bold');
    this.doc.setTextColor(this.companySettings.primary_color);
    
    const x = titleConfig.alignment === 'center' ? 
      this.doc.internal.pageSize.width / 2 : 20;
    
    this.doc.text(titleConfig.text, x, 60, { 
      align: titleConfig.alignment || 'left' 
    });
  }

  private async generateContent(data: any[]) {
    const config = this.template.template_config.content;
    
    if (config.table) {
      await this.generateTable(data, config.table);
    } else if (config.list) {
      await this.generateList(data, config.list);
    }
  }

  private async generateTable(data: any[], tableConfig: any) {
    const columns = tableConfig.columns;
    const startY = 80;
    let currentY = startY;
    
    // Header tabella
    this.doc.setFillColor(tableConfig.styling?.headerBackground || '#F3F4F6');
    this.doc.rect(20, currentY, this.doc.internal.pageSize.width - 40, 10, 'F');
    
    let x = 20;
    columns.forEach(column => {
      this.doc.setFontSize(10);
      this.doc.setTextColor(tableConfig.styling?.headerTextColor || '#374151');
      this.doc.text(column.label, x + 2, currentY + 7);
      x += column.width;
    });
    
    currentY += 10;
    
    // Righe dati
    data.forEach((row, index) => {
      // Controlla se serve nuova pagina
      if (currentY > this.doc.internal.pageSize.height - 30) {
        this.doc.addPage();
        currentY = 20;
      }
      
      // Colore riga alternato
      if (index % 2 === 1 && tableConfig.styling?.alternateRowColor) {
        this.doc.setFillColor(tableConfig.styling.alternateRowColor);
        this.doc.rect(20, currentY, this.doc.internal.pageSize.width - 40, 8, 'F');
      }
      
      // Dati riga
      x = 20;
      columns.forEach(column => {
        const value = this.formatFieldValue(row[column.field], column.type);
        this.doc.setFontSize(9);
        this.doc.setTextColor(this.companySettings.text_color);
        this.doc.text(value, x + 2, currentY + 6);
        x += column.width;
      });
      
      currentY += 8;
    });
  }

  private generateFooter() {
    const config = this.template.template_config.footer;
    const pageHeight = this.doc.internal.pageSize.height;
    
    // Numeri pagina
    if (config.pageNumbers) {
      const pageCount = this.doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        this.doc.setPage(i);
        this.doc.setFontSize(8);
        this.doc.setTextColor(this.companySettings.text_color);
        this.doc.text(
          `Pagina ${i} di ${pageCount}`,
          this.doc.internal.pageSize.width / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
    }
    
    // Informazioni azienda footer
    if (config.companyInfo?.enabled) {
      this.doc.setFontSize(8);
      this.doc.setTextColor(this.companySettings.text_color);
      this.doc.text(
        `${this.companySettings.company_name} - ${this.companySettings.vat_number}`,
        20,
        pageHeight - 10
      );
    }
    
    // Note legali
    if (config.legalNotes?.enabled && this.companySettings.legal_notes) {
      this.doc.setFontSize(7);
      this.doc.setTextColor('#6B7280');
      this.doc.text(
        this.companySettings.legal_notes,
        20,
        pageHeight - 5,
        { maxWidth: this.doc.internal.pageSize.width - 40 }
      );
    }
  }

  private getCompanyFieldValue(field: string): string {
    const mapping = {
      name: this.companySettings.company_name,
      address: `${this.companySettings.address_street} ${this.companySettings.address_number}, ${this.companySettings.address_postal_code} ${this.companySettings.address_city}`,
      phone: this.companySettings.phone,
      email: this.companySettings.email,
      vat_number: this.companySettings.vat_number,
      tax_code: this.companySettings.tax_code
    };
    
    return mapping[field] || '';
  }

  private formatFieldValue(value: any, type: string): string {
    if (value === null || value === undefined) return '';
    
    switch (type) {
      case 'date':
        return new Date(value).toLocaleDateString('it-IT');
      case 'datetime':
        return new Date(value).toLocaleString('it-IT');
      case 'currency':
        return new Intl.NumberFormat('it-IT', { 
          style: 'currency', 
          currency: 'EUR' 
        }).format(value);
      case 'number':
        return new Intl.NumberFormat('it-IT').format(value);
      default:
        return String(value);
    }
  }
}
```

### **Template CSV Engine**

```typescript
// src/lib/templateEngine/csvEngine.ts
export class CSVTemplateEngine {
  private template: ExportTemplate;
  private companySettings: CompanySettings;

  constructor(companySettings: CompanySettings, template: ExportTemplate) {
    this.companySettings = companySettings;
    this.template = template;
  }

  async generateCSV(data: any[]): Promise<Blob> {
    const config = this.template.template_config;
    const columns = config.columns || [];
    
    // Genera header
    const headers = this.generateHeaders(columns);
    
    // Genera righe dati
    const rows = data.map(row => this.generateRow(row, columns));
    
    // Combina header e dati
    const csvContent = [headers, ...rows]
      .map(row => this.escapeCSVRow(row))
      .join('\n');
    
    // Aggiungi BOM per UTF-8
    const bom = '\uFEFF';
    const finalContent = bom + csvContent;
    
    return new Blob([finalContent], { type: 'text/csv;charset=utf-8;' });
  }

  private generateHeaders(columns: any[]): string[] {
    return columns
      .filter(col => col.enabled)
      .map(col => col.label || col.field);
  }

  private generateRow(row: any, columns: any[]): string[] {
    return columns
      .filter(col => col.enabled)
      .map(col => this.formatFieldValue(row[col.field], col.type));
  }

  private escapeCSVRow(row: string[]): string {
    return row.map(field => {
      const stringField = String(field || '');
      
      // Escape virgolette e newline
      if (stringField.includes('"') || stringField.includes('\n') || stringField.includes(',')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      
      return stringField;
    }).join(',');
  }

  private formatFieldValue(value: any, type: string): string {
    if (value === null || value === undefined) return '';
    
    switch (type) {
      case 'date':
        return new Date(value).toLocaleDateString('it-IT');
      case 'datetime':
        return new Date(value).toLocaleString('it-IT');
      case 'currency':
        return new Intl.NumberFormat('it-IT', { 
          style: 'currency', 
          currency: 'EUR' 
        }).format(value);
      case 'number':
        return new Intl.NumberFormat('it-IT').format(value);
      default:
        return String(value);
    }
  }
}
```

---

## 🎨 Interfaccia Utente

### **1. Company Settings Page**

```tsx
// src/pages/CompanySettings.tsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useOrg } from '@/context/OrgContext';
import { CompanySettingsService } from '@/lib/services/companySettingsService';

interface CompanySettingsForm {
  // Informazioni base
  company_name: string;
  company_code: string;
  vat_number: string;
  tax_code: string;
  
  // Contatti
  email: string;
  phone: string;
  website: string;
  
  // Indirizzo
  address_street: string;
  address_city: string;
  address_province: string;
  address_postal_code: string;
  
  // Branding
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  
  // Font
  font_family: string;
  font_size_base: number;
}

export default function CompanySettings() {
  const { orgId } = useOrg();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CompanySettingsForm>();

  useEffect(() => {
    loadCompanySettings();
  }, [orgId]);

  const loadCompanySettings = async () => {
    if (!orgId) return;
    
    try {
      setLoading(true);
      const settings = await CompanySettingsService.get(orgId);
      
      if (settings) {
        Object.keys(settings).forEach(key => {
          setValue(key as keyof CompanySettingsForm, settings[key]);
        });
        
        if (settings.logo_url) {
          setLogoPreview(settings.logo_url);
        }
      }
    } catch (error) {
      console.error('Error loading company settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      
      // Crea preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: CompanySettingsForm) => {
    if (!orgId) return;
    
    try {
      setSaving(true);
      
      // Upload logo se presente
      let logoUrl = '';
      if (logoFile) {
        logoUrl = await CompanySettingsService.uploadLogo(logoFile, orgId);
      }
      
      // Salva impostazioni
      await CompanySettingsService.update(orgId, {
        ...data,
        logo_url: logoUrl || logoPreview
      });
      
      // Mostra successo
      // toast.success('Impostazioni azienda salvate con successo');
      
    } catch (error) {
      console.error('Error saving company settings:', error);
      // toast.error('Errore nel salvare le impostazioni');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Caricamento...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Impostazioni Azienda
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Informazioni Base */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Informazioni Base
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome Azienda *
                </label>
                <input
                  {...register('company_name', { required: 'Nome azienda richiesto' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.company_name && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {errors.company_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Codice Azienda
                </label>
                <input
                  {...register('company_code')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Partita IVA
                </label>
                <input
                  {...register('vat_number')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Codice Fiscale
                </label>
                <input
                  {...register('tax_code')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Contatti */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Contatti
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  {...register('email', { 
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email non valida'
                    }
                  })}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Telefono
                </label>
                <input
                  {...register('phone')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sito Web
                </label>
                <input
                  {...register('website')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Branding */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Branding
            </h2>
            
            {/* Logo Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Logo Aziendale
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Carica Logo
                </label>
                {logoPreview && (
                  <div className="w-20 h-20 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Colori */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Colore Primario
                </label>
                <div className="flex items-center gap-2">
                  <input
                    {...register('primary_color')}
                    type="color"
                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    {...register('primary_color')}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Colore Secondario
                </label>
                <div className="flex items-center gap-2">
                  <input
                    {...register('secondary_color')}
                    type="color"
                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    {...register('secondary_color')}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Colore Accent
                </label>
                <div className="flex items-center gap-2">
                  <input
                    {...register('accent_color')}
                    type="color"
                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    {...register('accent_color')}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Pulsanti */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

## 🚀 Implementazione Graduale

### **Fase 1: Foundation (Settimana 1)**
1. **Database Schema** - Creare tabelle company_settings, export_templates
2. **Company Settings Service** - CRUD per impostazioni azienda
3. **Logo Upload** - Sistema upload e storage logo
4. **Basic UI** - Pagina impostazioni azienda base

### **Fase 2: Template System (Settimana 2)**
1. **Template Engine** - PDF e CSV generation
2. **Template Editor** - Interfaccia creazione template
3. **Preview System** - Anteprima real-time
4. **Default Templates** - Template predefiniti per ogni categoria

### **Fase 3: Advanced Features (Settimana 3)**
1. **Export Configurations** - Configurazioni export avanzate
2. **Batch Export** - Export multipli
3. **Scheduling** - Export automatici
4. **Template Sharing** - Condivisione template

### **Fase 4: Polish (Settimana 4)**
1. **Performance Optimization** - Ottimizzazione generazione documenti
2. **Error Handling** - Gestione errori robusta
3. **Documentation** - Documentazione utente
4. **Testing** - Test completi sistema

---

## 💡 Benefici Implementazione

### **Per l'Azienda**
- **Professionalità**: Documenti con branding completo
- **Efficienza**: Export automatizzati e personalizzati
- **Flessibilità**: Template adattabili per ogni esigenza
- **Scalabilità**: Sistema che cresce con l'azienda

### **Per gli Utenti**
- **Facilità d'uso**: Interfaccia intuitiva
- **Personalizzazione**: Controllo completo su output
- **Velocità**: Generazione documenti rapida
- **Qualità**: Output professionali e coerenti

### **Per il Sistema**
- **Modularità**: Componenti riutilizzabili
- **Estensibilità**: Facile aggiunta nuovi formati
- **Performance**: Generazione ottimizzata
- **Manutenibilità**: Codice pulito e documentato

Questo sistema trasformerà RescueManager in una soluzione completamente personalizzabile per ogni azienda! 🚀
