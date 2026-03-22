# Brand Identity Guidelines - RescueManager

## 🎯 Mission
RescueManager è un sistema professionale per la gestione di trasporti, demolizioni e logistica nel settore del recupero. Il brand deve trasmettere **affidabilità**, **professionalità** e **efficienza**.

## 🎨 Brand Colors

### Primary Palette
```css
--brand-primary: #3B82F6      /* Blu principale - Azione primaria */
--brand-secondary: #1E40AF    /* Blu scuro - Header e navigazione */
--brand-accent: #10B981       /* Verde - Successo e completamento */
```

### Status Colors
```css
--status-success: #10B981     /* Trasporti completati */
--status-warning: #F59E0B     /* Trasporti in corso */
--status-error: #EF4444       /* Errori e cancellazioni */
--status-info: #3B82F6        /* Informazioni */
```

### Neutral Palette
```css
--neutral-50: #F8FAFC        /* Sfondo chiaro */
--neutral-100: #F1F5F9       /* Bordi chiari */
--neutral-200: #E2E8F0       /* Separatori */
--neutral-300: #CBD5E1       /* Testo secondario */
--neutral-400: #94A3B8       /* Placeholder */
--neutral-500: #64748B       /* Testo normale */
--neutral-600: #475569       /* Testo importante */
--neutral-700: #334155       /* Testo scuro */
--neutral-800: #1E293B       /* Sfondo scuro */
--neutral-900: #0F172A       /* Testo su sfondo scuro */
```

## 📝 Typography

### Font Family
- **Primary**: Inter (sans-serif)
- **Monospace**: JetBrains Mono (codice)

### Font Sizes
```css
--text-xs: 0.75rem      /* 12px - Hint, label piccole */
--text-sm: 0.875rem     /* 14px - Testo secondario */
--text-base: 1rem       /* 16px - Testo normale */
--text-lg: 1.125rem     /* 18px - Sottotitoli */
--text-xl: 1.25rem      /* 20px - Titoli sezioni */
--text-2xl: 1.5rem      /* 24px - Titoli pagine */
--text-3xl: 1.875rem    /* 30px - Titoli principali */
```

### Font Weights
- **Normal**: 400 - Testo normale
- **Medium**: 500 - Testo importante
- **Semibold**: 600 - Titoli sezioni
- **Bold**: 700 - Titoli principali

## 📐 Spacing System

### Spacing Scale
```css
--space-1: 0.25rem      /* 4px - Bordi interni */
--space-2: 0.5rem       /* 8px - Padding piccoli */
--space-3: 0.75rem      /* 12px - Gap elementi */
--space-4: 1rem         /* 16px - Padding standard */
--space-5: 1.25rem      /* 20px - Margin piccoli */
--space-6: 1.5rem       /* 24px - Margin standard */
--space-8: 2rem         /* 32px - Margin grandi */
--space-12: 3rem        /* 48px - Separazione sezioni */
--space-16: 4rem        /* 64px - Separazione pagine */
```

## 🧩 Component Guidelines

### Buttons
- **Primary**: Azioni principali (Salva, Invia)
- **Secondary**: Azioni secondarie (Annulla, Modifica)
- **Success**: Azioni positive (Completa, Approva)
- **Danger**: Azioni distruttive (Elimina, Cancella)
- **Ghost**: Azioni leggere (Visualizza, Dettagli)

### Form Elements
- **Input**: Bordi arrotondati, focus ring blu
- **Select**: Stesso stile degli input
- **Checkbox**: Quadrati con bordi arrotondati
- **Radio**: Cerchi con focus ring
- **Textarea**: Resize verticale, altezza minima 80px

### Layout
- **Container**: Max-width 4xl, padding responsive
- **Cards**: Bordi arrotondati, ombra leggera
- **Sections**: Separazione chiara con bordi
- **Grid**: Gap standard 16px, responsive

## 🎭 Visual Style

### Border Radius
```css
--radius-sm: 0.25rem    /* 4px - Elementi piccoli */
--radius-md: 0.375rem    /* 6px - Input, button */
--radius-lg: 0.5rem      /* 8px - Card piccole */
--radius-xl: 0.75rem     /* 12px - Card grandi */
--radius-2xl: 1rem      /* 16px - Modal, container */
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)     /* Elementi piccoli */
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1)   /* Card */
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1) /* Modal */
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1) /* Overlay */
```

### Transitions
```css
--transition-fast: 150ms ease-in-out    /* Hover stati */
--transition-normal: 250ms ease-in-out  /* Focus, click */
--transition-slow: 350ms ease-in-out    /* Animazioni */
```

## 🌙 Dark Mode

### Principi
- Mantenere la stessa gerarchia visiva
- Usare colori più scuri per sfondi
- Invertire i colori neutri
- Preservare il contrasto per accessibilità

### Palette Dark
```css
.dark {
  --neutral-50: #0F172A    /* Sfondo scuro */
  --neutral-100: #1E293B   /* Bordi scuri */
  --neutral-200: #334155   /* Separatori scuri */
  --neutral-300: #475569   /* Testo secondario scuro */
  --neutral-400: #64748B   /* Placeholder scuro */
  --neutral-500: #94A3B8   /* Testo normale scuro */
  --neutral-600: #CBD5E1   /* Testo importante scuro */
  --neutral-700: #E2E8F0   /* Testo chiaro */
  --neutral-800: #F1F5F9   /* Sfondo chiaro */
  --neutral-900: #F8FAFC   /* Testo su sfondo chiaro */
}
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Principi
- Mobile-first approach
- Grid responsive con colonne adattive
- Testo leggibile su tutti i dispositivi
- Touch-friendly su mobile

## ♿ Accessibility

### Contrasto
- Minimo 4.5:1 per testo normale
- Minimo 3:1 per testo grande
- Testare con strumenti di accessibilità

### Focus
- Focus ring visibile su tutti gli elementi interattivi
- Navigazione da tastiera completa
- Screen reader friendly

### Colori
- Non usare solo il colore per comunicare informazioni
- Aggiungere icone o testo per stati
- Testare con simulatori di daltonismo

## 🚀 Implementation

### CSS Variables
Usare sempre le variabili CSS definite nel design system:
```css
color: var(--brand-primary);
background-color: var(--neutral-50);
border-radius: var(--radius-md);
```

### Componenti
Importare sempre dai componenti standardizzati:
```jsx
import { Input, Button, FormSection } from '@/components/ui';
```

### Classi Utility
Usare Tailwind CSS con le classi personalizzate:
```jsx
className="text-brand bg-neutral-50 rounded-lg"
```

## 📋 Checklist

### Prima di rilasciare un form:
- [ ] Usa componenti del design system
- [ ] Testa in modalità chiara e scura
- [ ] Verifica accessibilità con screen reader
- [ ] Testa responsive su mobile
- [ ] Controlla contrasto colori
- [ ] Valida navigazione da tastiera
- [ ] Testa stati di loading e errore
- [ ] Verifica messaggi di validazione

### Prima di rilasciare una pagina:
- [ ] Header coerente con il design system
- [ ] Spacing standardizzato
- [ ] Colori della palette brand
- [ ] Tipografia corretta
- [ ] Icone coerenti
- [ ] Stati di loading
- [ ] Gestione errori
- [ ] Feedback utente

## 📚 Risorse

### Design Tokens
- `src/styles/design-tokens.css` - Variabili CSS
- `src/components/ui/` - Componenti standardizzati

### Esempi
- `src/examples/FormMigrationExample.jsx` - Esempio migrazione
- `src/components/ui/` - Documentazione componenti

### Tools
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [React Icons](https://react-icons.github.io/) - Icone
- [Clsx](https://github.com/lukeed/clsx) - Utility per classi CSS
