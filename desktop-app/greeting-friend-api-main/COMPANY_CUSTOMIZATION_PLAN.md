# 🏢 Piano Personalizzazione Aziendale - RescueManager

## 📋 Panoramica
Sistema completo per permettere alle aziende di personalizzare export PDF/CSV con branding aziendale, loghi, informazioni personalizzate e template custom.

---

## 🎯 Obiettivi Principali

### 1. **Branding Aziendale Completo**
- Logo aziendale in tutti gli export
- Colori aziendali personalizzati
- Font e stile personalizzati
- Intestazioni e footer personalizzati

### 2. **Template Export Personalizzabili**
- Template PDF per ogni tipo di documento
- Template CSV con colonne personalizzate
- Layout responsive e professionali
- Preview in tempo reale

### 3. **Gestione Informazioni Aziendali**
- Dati azienda centralizzati
- Informazioni di contatto
- Partita IVA e dati fiscali
- Note legali personalizzate

---

## 🏗️ Architettura Sistema

### **Database Schema**

```sql
-- Tabella configurazioni azienda
CREATE TABLE company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  
  -- Informazioni base
  company_name text NOT NULL,
  company_code text UNIQUE,
  vat_number text,
  tax_code text,
  fiscal_code text,
  
  -- Contatti
  email text,
  phone text,
  website text,
  
  -- Indirizzo
  address_street text,
  address_city text,
  address_province text,
  address_postal_code text,
  address_country text DEFAULT 'IT',
  
  -- Branding
  logo_url text,
  logo_base64 text, -- Per export offline
  primary_color text DEFAULT '#3B82F6',
  secondary_color text DEFAULT '#1E40AF',
  accent_color text DEFAULT '#F59E0B',
  
  -- Font personalizzati
  font_family text DEFAULT 'Inter',
  font_size_base integer DEFAULT 12,
  
  -- Note legali
  legal_notes text,
  privacy_policy_url text,
  terms_url text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Template export personalizzati
CREATE TABLE export_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  
  -- Identificazione template
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('pdf', 'csv', 'excel')),
  category text NOT NULL CHECK (category IN ('transports', 'clients', 'quotes', 'invoices', 'yard', 'spare_parts')),
  
  -- Configurazione template
  template_config jsonb NOT NULL DEFAULT '{}',
  fields_config jsonb NOT NULL DEFAULT '{}',
  styling_config jsonb NOT NULL DEFAULT '{}',
  
  -- Stato
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Configurazioni export specifiche
CREATE TABLE export_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  template_id uuid REFERENCES export_templates(id) ON DELETE CASCADE,
  
  -- Configurazione export
  export_name text NOT NULL,
  file_format text NOT NULL CHECK (file_format IN ('pdf', 'csv', 'xlsx')),
  
  -- Filtri e selezione dati
  data_filters jsonb DEFAULT '{}',
  field_selection jsonb DEFAULT '{}',
  
  -- Personalizzazione
  include_logo boolean DEFAULT true,
  include_company_info boolean DEFAULT true,
  include_legal_notes boolean DEFAULT false,
  
  -- Layout
  page_orientation text DEFAULT 'portrait' CHECK (page_orientation IN ('portrait', 'landscape')),
  page_size text DEFAULT 'A4' CHECK (page_size IN ('A4', 'A3', 'Letter')),
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);
```

---

## 🎨 Sistema Template

### **Template PDF**

#### **Struttura Template**
```javascript
const pdfTemplate = {
  // Header
  header: {
    logo: {
      enabled: true,
      position: 'left', // left, center, right
      size: 'medium', // small, medium, large
      margin: { top: 20, bottom: 10 }
    },
    companyInfo: {
      enabled: true,
      fields: ['name', 'address', 'phone', 'email'],
      position: 'right'
    },
    title: {
      text: 'Lista Trasporti',
      fontSize: 18,
      fontWeight: 'bold',
      alignment: 'center'
    }
  },
  
  // Content
  content: {
    table: {
      columns: [
        { field: 'id', label: 'ID', width: 60 },
        { field: 'cliente', label: 'Cliente', width: 150 },
        { field: 'indirizzo_partenza', label: 'Partenza', width: 200 },
        { field: 'indirizzo_arrivo', label: 'Arrivo', width: 200 },
        { field: 'status', label: 'Stato', width: 100 },
        { field: 'created_at', label: 'Data', width: 100 }
      ],
      styling: {
        headerBackground: '#F3F4F6',
        headerTextColor: '#374151',
        alternateRowColor: '#F9FAFB',
        borderColor: '#E5E7EB'
      }
    }
  },
  
  // Footer
  footer: {
    pageNumbers: true,
    companyInfo: {
      enabled: true,
      fields: ['name', 'vat_number']
    },
    legalNotes: {
      enabled: false,
      text: 'Note legali personalizzate...'
    }
  }
};
```

### **Template CSV**

#### **Configurazione Colonne**
```javascript
const csvTemplate = {
  name: 'Export Trasporti Completo',
  description: 'Export completo con tutti i dettagli',
  
  columns: [
    { field: 'id', label: 'ID Trasporto', enabled: true },
    { field: 'cliente', label: 'Nome Cliente', enabled: true },
    { field: 'cliente_email', label: 'Email Cliente', enabled: true },
    { field: 'cliente_phone', label: 'Telefono Cliente', enabled: true },
    { field: 'indirizzo_partenza', label: 'Indirizzo Partenza', enabled: true },
    { field: 'indirizzo_arrivo', label: 'Indirizzo Arrivo', enabled: true },
    { field: 'status', label: 'Stato', enabled: true },
    { field: 'created_at', label: 'Data Creazione', enabled: true },
    { field: 'updated_at', label: 'Ultima Modifica', enabled: true }
  ],
  
  formatting: {
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'it-IT',
    encoding: 'UTF-8',
    delimiter: ',',
    includeHeaders: true
  }
};
```

---

## 🛠️ Implementazione Frontend

### **1. Pagina Impostazioni Azienda**

```jsx
// src/pages/CompanySettings.jsx
export default function CompanySettings() {
  return (
    <div className="space-y-6">
      {/* Informazioni Azienda */}
      <CompanyInfoSection />
      
      {/* Branding */}
      <BrandingSection />
      
      {/* Template Export */}
      <ExportTemplatesSection />
      
      {/* Anteprima */}
      <PreviewSection />
    </div>
  );
}
```

### **2. Editor Template**

```jsx
// src/components/ExportTemplateEditor.jsx
export default function ExportTemplateEditor({ template, onSave }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Configurazione */}
      <div className="space-y-6">
        <TemplateConfigPanel />
        <FieldsSelectionPanel />
        <StylingPanel />
      </div>
      
      {/* Anteprima */}
      <div className="space-y-4">
        <PreviewPanel />
        <ExportActions />
      </div>
    </div>
  );
}
```

### **3. Sistema Export**

```jsx
// src/lib/exportService.js
export class ExportService {
  static async generatePDF(data, template, companySettings) {
    // Genera PDF con jsPDF o Puppeteer
  }
  
  static async generateCSV(data, template) {
    // Genera CSV personalizzato
  }
  
  static async generateExcel(data, template) {
    // Genera Excel con SheetJS
  }
}
```

---

## 📊 Tipi di Export Supportati

### **1. Trasporti**
- Lista trasporti con filtri
- Dettaglio singolo trasporto
- Report statistiche trasporti
- Export per autista
- Export per periodo

### **2. Clienti**
- Anagrafica clienti completa
- Clienti per zona geografica
- Clienti con trasporti attivi
- Export per segmentazione

### **3. Preventivi**
- Lista preventivi
- Preventivi per stato
- Dettaglio preventivo singolo
- Export per periodo

### **4. Fatture**
- Lista fatture
- Fatture per stato pagamento
- Dettaglio fattura singola
- Export contabilità

### **5. Piazzale**
- Inventario veicoli
- Stato demolizioni
- Report ricavi
- Export per veicolo

### **6. Ricambi**
- Catalogo ricambi
- Inventario magazzino
- Movimenti stock
- Export per categoria

---

## 🎨 Personalizzazione Branding

### **Colori Aziendali**
```css
:root {
  --company-primary: #3B82F6;
  --company-secondary: #1E40AF;
  --company-accent: #F59E0B;
  --company-success: #10B981;
  --company-warning: #F59E0B;
  --company-error: #EF4444;
}
```

### **Font Personalizzati**
- Supporto per font web (Google Fonts)
- Font locali per export offline
- Dimensioni personalizzabili
- Pesi font configurabili

### **Logo Integration**
- Upload logo aziendale
- Ridimensionamento automatico
- Posizionamento flessibile
- Supporto PNG, JPG, SVG

---

## 🔧 Funzionalità Avanzate

### **1. Template Predefiniti**
- Template professionali pre-caricati
- Template per settore (demolizioni, trasporti, etc.)
- Template per paese (Italia, EU, etc.)

### **2. Import/Export Template**
- Salvataggio template personalizzati
- Condivisione template tra organizzazioni
- Backup e ripristino configurazioni

### **3. Anteprima Real-time**
- Preview istantaneo delle modifiche
- Zoom e navigazione
- Test con dati reali

### **4. Batch Export**
- Export multipli simultanei
- Scheduling export automatici
- Notifiche completamento

---

## 📱 Interfaccia Utente

### **1. Wizard Setup Iniziale**
```jsx
const CompanySetupWizard = () => (
  <div className="max-w-4xl mx-auto">
    <Steps>
      <Step title="Informazioni Azienda" />
      <Step title="Upload Logo" />
      <Step title="Colori Branding" />
      <Step title="Template Predefiniti" />
      <Step title="Test Export" />
    </Steps>
  </div>
);
```

### **2. Dashboard Personalizzazione**
```jsx
const CustomizationDashboard = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <Card title="Branding" icon={FiPalette} />
    <Card title="Template PDF" icon={FiFileText} />
    <Card title="Template CSV" icon={FiTable} />
    <Card title="Anteprima" icon={FiEye} />
    <Card title="Export Test" icon={FiDownload} />
    <Card title="Impostazioni" icon={FiSettings} />
  </div>
);
```

---

## 🚀 Roadmap Implementazione

### **Fase 1: Foundation (Settimana 1-2)**
- [ ] Database schema
- [ ] Company settings CRUD
- [ ] Logo upload system
- [ ] Basic branding colors

### **Fase 2: Template System (Settimana 3-4)**
- [ ] Template editor interface
- [ ] PDF generation engine
- [ ] CSV customization
- [ ] Preview system

### **Fase 3: Advanced Features (Settimana 5-6)**
- [ ] Batch export
- [ ] Template sharing
- [ ] Advanced styling
- [ ] Performance optimization

### **Fase 4: Polish & Testing (Settimana 7-8)**
- [ ] User testing
- [ ] Bug fixes
- [ ] Documentation
- [ ] Training materials

---

## 💡 Benefici per l'Azienda

### **Professionalità**
- Documenti con branding aziendale
- Template personalizzati per settore
- Aspetto professionale e coerente

### **Efficienza**
- Export automatizzati
- Template riutilizzabili
- Batch processing

### **Flessibilità**
- Personalizzazione completa
- Adattamento per clienti
- Scalabilità per crescita

### **Compliance**
- Note legali personalizzate
- Dati fiscali integrati
- Conformità normativa

---

## 🎯 Risultato Finale

Un sistema completo di personalizzazione aziendale che permette a ogni organizzazione di:

1. **Personalizzare completamente** tutti gli export
2. **Mantenere coerenza** del branding aziendale
3. **Automatizzare** i processi di export
4. **Professionalizzare** la comunicazione con i clienti
5. **Scalare** facilmente con la crescita dell'azienda

Il sistema sarà **user-friendly**, **potente** e **completamente personalizzabile** per ogni esigenza aziendale! 🚀
