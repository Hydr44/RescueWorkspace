-- ============================================
-- COMPANY CUSTOMIZATION SYSTEM MIGRATION
-- Sistema completo per personalizzazione aziendale
-- ============================================

-- 1. TABELLA CONFIGURAZIONI AZIENDA
-- ============================================

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

-- 2. TABELLA TEMPLATE EXPORT
-- ============================================

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

-- 3. TABELLA CONFIGURAZIONI EXPORT
-- ============================================

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

-- 4. TABELLA STORICO EXPORT
-- ============================================

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

-- 5. TABELLA TEMPLATE PREDEFINITI
-- ============================================

CREATE TABLE public.default_export_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificazione template
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN (
    'transports', 'clients', 'quotes', 'invoices', 
    'yard', 'spare_parts', 'drivers', 'vehicles'
  )),
  subcategory text,
  
  -- Tipo documento
  document_type text NOT NULL CHECK (document_type IN ('pdf', 'csv', 'xlsx', 'html')),
  
  -- Configurazione template
  template_config jsonb NOT NULL DEFAULT '{}',
  fields_config jsonb NOT NULL DEFAULT '{}',
  styling_config jsonb NOT NULL DEFAULT '{}',
  layout_config jsonb NOT NULL DEFAULT '{}',
  
  -- Configurazione dati
  data_source text NOT NULL,
  data_filters jsonb DEFAULT '{}',
  
  -- Configurazione export
  export_settings jsonb DEFAULT '{}',
  file_settings jsonb DEFAULT '{}',
  
  -- Metadata
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indici
CREATE INDEX idx_default_export_templates_category ON public.default_export_templates(category);
CREATE INDEX idx_default_export_templates_document_type ON public.default_export_templates(document_type);

-- 6. INSERIMENTO TEMPLATE PREDEFINITI
-- ============================================

-- Template PDF per Trasporti
INSERT INTO public.default_export_templates (
  name, description, category, subcategory, document_type,
  template_config, fields_config, styling_config, layout_config,
  data_source, export_settings
) VALUES (
  'Lista Trasporti Standard',
  'Template standard per lista trasporti con informazioni complete',
  'transports',
  'list',
  'pdf',
  '{
    "header": {
      "logo": {"enabled": true, "position": "left", "size": "medium"},
      "companyInfo": {"enabled": true, "fields": ["name", "address", "phone"], "position": "right"},
      "title": {"text": "Lista Trasporti", "fontSize": 18, "fontWeight": "bold", "alignment": "center"}
    },
    "content": {
      "table": {
        "columns": [
          {"field": "id", "label": "ID", "width": 60},
          {"field": "cliente", "label": "Cliente", "width": 150},
          {"field": "pickup_address", "label": "Partenza", "width": 200},
          {"field": "dropoff_address", "label": "Arrivo", "width": 200},
          {"field": "status", "label": "Stato", "width": 100},
          {"field": "created_at", "label": "Data", "width": 100}
        ],
        "styling": {
          "headerBackground": "#F3F4F6",
          "headerTextColor": "#374151",
          "alternateRowColor": "#F9FAFB",
          "borderColor": "#E5E7EB"
        }
      }
    },
    "footer": {
      "pageNumbers": true,
      "companyInfo": {"enabled": true, "fields": ["name", "vat_number"]},
      "legalNotes": {"enabled": false}
    }
  }',
  '{
    "availableFields": [
      {"field": "id", "label": "ID", "type": "text"},
      {"field": "cliente", "label": "Cliente", "type": "text"},
      {"field": "pickup_address", "label": "Indirizzo Partenza", "type": "text"},
      {"field": "dropoff_address", "label": "Indirizzo Arrivo", "type": "text"},
      {"field": "status", "label": "Stato", "type": "text"},
      {"field": "created_at", "label": "Data Creazione", "type": "date"},
      {"field": "updated_at", "label": "Ultima Modifica", "type": "datetime"},
      {"field": "price_cents", "label": "Prezzo", "type": "currency"},
      {"field": "eta_minutes", "label": "ETA (minuti)", "type": "number"}
    ],
    "selectedFields": ["id", "cliente", "pickup_address", "dropoff_address", "status", "created_at"]
  }',
  '{
    "colors": {
      "primary": "#3B82F6",
      "secondary": "#1E40AF",
      "accent": "#F59E0B",
      "text": "#374151",
      "background": "#FFFFFF"
    },
    "fonts": {
      "family": "Inter",
      "sizeBase": 12,
      "sizeHeading": 18,
      "weightNormal": "400",
      "weightBold": "700"
    }
  }',
  '{
    "pageSize": "A4",
    "orientation": "portrait",
    "margins": {"top": 20, "right": 20, "bottom": 20, "left": 20}
  }',
  'transports',
  '{
    "includeLogo": true,
    "includeCompanyInfo": true,
    "includePageNumbers": true,
    "includeTimestamp": true
  }'
);

-- Template CSV per Trasporti
INSERT INTO public.default_export_templates (
  name, description, category, subcategory, document_type,
  template_config, fields_config, styling_config, layout_config,
  data_source, export_settings
) VALUES (
  'Export Trasporti CSV',
  'Template CSV per export completo trasporti',
  'transports',
  'list',
  'csv',
  '{
    "columns": [
      {"field": "id", "label": "ID Trasporto", "enabled": true},
      {"field": "cliente", "label": "Nome Cliente", "enabled": true},
      {"field": "pickup_address", "label": "Indirizzo Partenza", "enabled": true},
      {"field": "dropoff_address", "label": "Indirizzo Arrivo", "enabled": true},
      {"field": "status", "label": "Stato", "enabled": true},
      {"field": "created_at", "label": "Data Creazione", "enabled": true},
      {"field": "updated_at", "label": "Ultima Modifica", "enabled": true},
      {"field": "price_cents", "label": "Prezzo (centesimi)", "enabled": true},
      {"field": "eta_minutes", "label": "ETA (minuti)", "enabled": true}
    ],
    "formatting": {
      "dateFormat": "DD/MM/YYYY",
      "numberFormat": "it-IT",
      "encoding": "UTF-8",
      "delimiter": ",",
      "includeHeaders": true
    }
  }',
  '{
    "availableFields": [
      {"field": "id", "label": "ID", "type": "text"},
      {"field": "cliente", "label": "Cliente", "type": "text"},
      {"field": "pickup_address", "label": "Indirizzo Partenza", "type": "text"},
      {"field": "dropoff_address", "label": "Indirizzo Arrivo", "type": "text"},
      {"field": "status", "label": "Stato", "type": "text"},
      {"field": "created_at", "label": "Data Creazione", "type": "date"},
      {"field": "updated_at", "label": "Ultima Modifica", "type": "datetime"},
      {"field": "price_cents", "label": "Prezzo", "type": "currency"},
      {"field": "eta_minutes", "label": "ETA (minuti)", "type": "number"}
    ],
    "selectedFields": ["id", "cliente", "pickup_address", "dropoff_address", "status", "created_at", "updated_at", "price_cents", "eta_minutes"]
  }',
  '{}',
  '{}',
  'transports',
  '{
    "includeHeaders": true,
    "encoding": "UTF-8",
    "delimiter": ","
  }'
);

-- Template PDF per Clienti
INSERT INTO public.default_export_templates (
  name, description, category, subcategory, document_type,
  template_config, fields_config, styling_config, layout_config,
  data_source, export_settings
) VALUES (
  'Anagrafica Clienti',
  'Template per anagrafica completa clienti',
  'clients',
  'list',
  'pdf',
  '{
    "header": {
      "logo": {"enabled": true, "position": "left", "size": "medium"},
      "companyInfo": {"enabled": true, "fields": ["name", "address", "phone"], "position": "right"},
      "title": {"text": "Anagrafica Clienti", "fontSize": 18, "fontWeight": "bold", "alignment": "center"}
    },
    "content": {
      "table": {
        "columns": [
          {"field": "id", "label": "ID", "width": 60},
          {"field": "nome", "label": "Nome", "width": 150},
          {"field": "email", "label": "Email", "width": 200},
          {"field": "phone", "label": "Telefono", "width": 120},
          {"field": "address", "label": "Indirizzo", "width": 250},
          {"field": "created_at", "label": "Data Registrazione", "width": 120}
        ],
        "styling": {
          "headerBackground": "#F3F4F6",
          "headerTextColor": "#374151",
          "alternateRowColor": "#F9FAFB",
          "borderColor": "#E5E7EB"
        }
      }
    },
    "footer": {
      "pageNumbers": true,
      "companyInfo": {"enabled": true, "fields": ["name", "vat_number"]},
      "legalNotes": {"enabled": false}
    }
  }',
  '{
    "availableFields": [
      {"field": "id", "label": "ID", "type": "text"},
      {"field": "nome", "label": "Nome", "type": "text"},
      {"field": "email", "label": "Email", "type": "email"},
      {"field": "phone", "label": "Telefono", "type": "text"},
      {"field": "address", "label": "Indirizzo", "type": "text"},
      {"field": "created_at", "label": "Data Registrazione", "type": "date"},
      {"field": "vat_number", "label": "P.IVA", "type": "text"},
      {"field": "tax_code", "label": "Codice Fiscale", "type": "text"}
    ],
    "selectedFields": ["id", "nome", "email", "phone", "address", "created_at"]
  }',
  '{
    "colors": {
      "primary": "#3B82F6",
      "secondary": "#1E40AF",
      "accent": "#F59E0B",
      "text": "#374151",
      "background": "#FFFFFF"
    },
    "fonts": {
      "family": "Inter",
      "sizeBase": 12,
      "sizeHeading": 18,
      "weightNormal": "400",
      "weightBold": "700"
    }
  }',
  '{
    "pageSize": "A4",
    "orientation": "portrait",
    "margins": {"top": 20, "right": 20, "bottom": 20, "left": 20}
  }',
  'clients',
  '{
    "includeLogo": true,
    "includeCompanyInfo": true,
    "includePageNumbers": true,
    "includeTimestamp": true
  }'
);

-- 7. RLS (ROW LEVEL SECURITY)
-- ============================================

-- Abilita RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;

-- Policy per company_settings
CREATE POLICY "Users can view company settings for their org" ON public.company_settings
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update company settings for their org" ON public.company_settings
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert company settings for their org" ON public.company_settings
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy per export_templates
CREATE POLICY "Users can view export templates for their org" ON public.export_templates
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    ) OR is_public = true
  );

CREATE POLICY "Users can manage export templates for their org" ON public.export_templates
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy per export_configurations
CREATE POLICY "Users can view export configurations for their org" ON public.export_configurations
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage export configurations for their org" ON public.export_configurations
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy per export_history
CREATE POLICY "Users can view export history for their org" ON public.export_history
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert export history for their org" ON public.export_history
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members 
      WHERE user_id = auth.uid()
    )
  );

-- 8. FUNZIONI HELPER
-- ============================================

-- Funzione per creare configurazione azienda di default
CREATE OR REPLACE FUNCTION create_default_company_settings(org_id_param uuid)
RETURNS uuid AS $$
DECLARE
  settings_id uuid;
BEGIN
  INSERT INTO public.company_settings (
    org_id,
    company_name,
    primary_color,
    secondary_color,
    accent_color
  ) VALUES (
    org_id_param,
    'RescueManager',
    '#3B82F6',
    '#1E40AF',
    '#F59E0B'
  ) RETURNING id INTO settings_id;
  
  RETURN settings_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per copiare template predefiniti
CREATE OR REPLACE FUNCTION copy_default_templates_to_org(org_id_param uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO public.export_templates (
    org_id,
    name,
    description,
    category,
    subcategory,
    document_type,
    file_extension,
    mime_type,
    template_config,
    fields_config,
    styling_config,
    layout_config,
    data_source,
    export_settings,
    is_default,
    created_by
  )
  SELECT 
    org_id_param,
    name,
    description,
    category,
    subcategory,
    document_type,
    CASE 
      WHEN document_type = 'pdf' THEN 'pdf'
      WHEN document_type = 'csv' THEN 'csv'
      WHEN document_type = 'xlsx' THEN 'xlsx'
      WHEN document_type = 'html' THEN 'html'
    END,
    CASE 
      WHEN document_type = 'pdf' THEN 'application/pdf'
      WHEN document_type = 'csv' THEN 'text/csv'
      WHEN document_type = 'xlsx' THEN 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      WHEN document_type = 'html' THEN 'text/html'
    END,
    template_config,
    fields_config,
    styling_config,
    layout_config,
    data_source,
    export_settings,
    true,
    auth.uid()
  FROM public.default_export_templates
  WHERE is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. TRIGGER PER AUTO-CREAZIONE
-- ============================================

-- Trigger per creare configurazioni di default quando viene creata una nuova org
CREATE OR REPLACE FUNCTION setup_company_customization()
RETURNS trigger AS $$
BEGIN
  -- Crea configurazione azienda di default
  PERFORM create_default_company_settings(NEW.id);
  
  -- Copia template predefiniti
  PERFORM copy_default_templates_to_org(NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sulla tabella orgs
CREATE TRIGGER trigger_setup_company_customization
  AFTER INSERT ON public.orgs
  FOR EACH ROW
  EXECUTE FUNCTION setup_company_customization();

-- 10. COMMENTI PER DOCUMENTAZIONE
-- ============================================

COMMENT ON TABLE public.company_settings IS 'Configurazioni personalizzazione aziendale per branding e export';
COMMENT ON TABLE public.export_templates IS 'Template personalizzati per export PDF/CSV/Excel';
COMMENT ON TABLE public.export_configurations IS 'Configurazioni export specifiche per ogni organizzazione';
COMMENT ON TABLE public.export_history IS 'Storico export generati per audit e tracking';
COMMENT ON TABLE public.default_export_templates IS 'Template predefiniti disponibili per tutte le organizzazioni';

COMMENT ON COLUMN public.company_settings.logo_base64 IS 'Logo in formato base64 per export offline senza dipendenze esterne';
COMMENT ON COLUMN public.company_settings.primary_color IS 'Colore primario aziendale in formato hex (#RRGGBB)';
COMMENT ON COLUMN public.export_templates.template_config IS 'Configurazione JSON per layout e contenuto template';
COMMENT ON COLUMN public.export_templates.fields_config IS 'Configurazione JSON per campi disponibili e selezionati';
COMMENT ON COLUMN public.export_configurations.data_filters IS 'Filtri JSON per limitare dati esportati';

-- ============================================
-- MIGRATION COMPLETATA
-- ============================================

-- Verifica creazione tabelle
SELECT 
  'TABELLE CREATE' as status,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('company_settings', 'export_templates', 'export_configurations', 'export_history', 'default_export_templates')
ORDER BY table_name;

-- Verifica template predefiniti inseriti
SELECT 
  'TEMPLATE PREDEFINITI' as status,
  COUNT(*) as total_templates,
  category,
  document_type
FROM public.default_export_templates 
GROUP BY category, document_type
ORDER BY category, document_type;
