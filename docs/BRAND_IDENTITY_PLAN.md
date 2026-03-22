# Brand Identity & Design System Plan

## 🎯 Obiettivo
Creare un'identità visiva coerente e un design system standardizzato per RescueManager, garantendo uniformità grafica in tutta l'applicazione.

## 📊 Situazione Attuale
- Form con stili diversi e inconsistenti
- Palette colori non standardizzata
- Componenti non riutilizzabili
- Layout variabili tra le pagine

## 🎨 Brand Identity

### Colori Principali
```css
/* Primary Brand Colors */
--primary-blue: #3B82F6      /* Azzurro principale */
--primary-green: #10B981     /* Verde successo */
--accent-purple: #8B5CF6     /* Viola accento */

/* Neutral Palette */
--gray-50: #F9FAFB
--gray-100: #F3F4F6
--gray-200: #E5E7EB
--gray-300: #D1D5DB
--gray-400: #9CA3AF
--gray-500: #6B7280
--gray-600: #4B5563
--gray-700: #374151
--gray-800: #1F2937
--gray-900: #111827

/* Status Colors */
--success: #10B981
--warning: #F59E0B
--error: #EF4444
--info: #3B82F6
```

### Tipografia
```css
/* Font Family */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Font Sizes */
--text-xs: 0.75rem     /* 12px */
--text-sm: 0.875rem    /* 14px */
--text-base: 1rem      /* 16px */
--text-lg: 1.125rem    /* 18px */
--text-xl: 1.25rem     /* 20px */
--text-2xl: 1.5rem     /* 24px */
--text-3xl: 1.875rem   /* 30px */
```

### Spacing System
```css
/* Spacing Scale */
--space-1: 0.25rem    /* 4px */
--space-2: 0.5rem     /* 8px */
--space-3: 0.75rem    /* 12px */
--space-4: 1rem       /* 16px */
--space-5: 1.25rem    /* 20px */
--space-6: 1.5rem     /* 24px */
--space-8: 2rem       /* 32px */
--space-10: 2.5rem    /* 40px */
--space-12: 3rem      /* 48px */
--space-16: 4rem      /* 64px */
```

## 🧩 Design System Components

### 1. Form Components
- **Input**: Standardizzato con label, placeholder, error states
- **Select**: Dropdown con ricerca e multi-select
- **Textarea**: Area di testo con resize controllato
- **Checkbox**: Checkbox con label personalizzabile
- **Radio**: Radio buttons con layout verticale/orizzontale
- **Button**: Primary, secondary, danger, ghost variants
- **DatePicker**: Selezione date con calendario
- **FileUpload**: Upload file con drag & drop

### 2. Layout Components
- **FormContainer**: Container standard per form
- **FormSection**: Sezioni con titolo e descrizione
- **FormRow**: Layout a colonne per campi
- **FormActions**: Area azioni (salva, annulla, etc.)

### 3. Feedback Components
- **Alert**: Messaggi di successo, errore, warning
- **Toast**: Notifiche temporanee
- **Loading**: Stati di caricamento
- **EmptyState**: Stati vuoti con CTA

## 📋 Form Layouts Standard

### 1. Single Form
```
┌─────────────────────────────────┐
│ Form Header                      │
├─────────────────────────────────┤
│ Form Section 1                  │
│ ┌─────────┐ ┌─────────┐        │
│ │ Field 1 │ │ Field 2 │        │
│ └─────────┘ └─────────┘        │
├─────────────────────────────────┤
│ Form Section 2                  │
│ ┌─────────────────────────────┐ │
│ │ Field 3                     │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Form Actions                    │
│ [Cancel] [Save]                 │
└─────────────────────────────────┘
```

### 2. Multi-Step Form
```
┌─────────────────────────────────┐
│ Progress Steps                  │
│ ●──●──○──○                     │
├─────────────────────────────────┤
│ Step Content                    │
│ [Back] [Next]                   │
└─────────────────────────────────┘
```

### 3. Modal Form
```
┌─────────────────────────────────┐
│ Modal Header                    │
├─────────────────────────────────┤
│ Form Content                    │
├─────────────────────────────────┤
│ Modal Actions                   │
└─────────────────────────────────┘
```

## 🔄 Migration Strategy

### Phase 1: Foundation
1. Creare design tokens (colori, tipografia, spacing)
2. Sviluppare componenti base (Button, Input, etc.)
3. Creare utility classes CSS

### Phase 2: Components
1. Form components standardizzati
2. Layout components
3. Feedback components

### Phase 3: Migration
1. Audit form esistenti
2. Migrazione graduale pagina per pagina
3. Testing e feedback

### Phase 4: Documentation
1. Storybook per componenti
2. Linee guida brand identity
3. Best practices document

## 📁 File Structure
```
src/
├── components/
│   ├── ui/                    # Design system components
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Select/
│   │   ├── Form/
│   │   └── index.js
│   ├── forms/                 # Form-specific components
│   │   ├── FormContainer/
│   │   ├── FormSection/
│   │   └── FormActions/
│   └── layout/                # Layout components
├── styles/
│   ├── tokens.css             # Design tokens
│   ├── components.css         # Component styles
│   └── utilities.css          # Utility classes
└── docs/
    ├── brand-guidelines.md
    └── component-library.md
```

## 🎯 Priorità Implementazione

### High Priority
1. **Form Components**: Input, Select, Button, FormContainer
2. **Color System**: Palette standardizzata
3. **Typography**: Font e sizing coerenti

### Medium Priority
1. **Layout Components**: FormSection, FormRow, FormActions
2. **Feedback Components**: Alert, Toast, Loading
3. **Migration**: Trasporti, Clienti, Dashboard

### Low Priority
1. **Advanced Components**: DatePicker, FileUpload
2. **Documentation**: Storybook, guidelines
3. **Optimization**: Performance, accessibility

## 📊 Success Metrics
- ✅ 100% form con design coerente
- ✅ Componenti riutilizzabili >80%
- ✅ Tempo sviluppo nuovi form -50%
- ✅ User experience score migliorato
- ✅ Brand recognition aumentato

## 🚀 Next Steps
1. Iniziare con audit form esistenti
2. Creare design tokens base
3. Sviluppare primi componenti (Button, Input)
4. Migrare pagina Trasporti come pilota
5. Iterare e migliorare basandosi su feedback
