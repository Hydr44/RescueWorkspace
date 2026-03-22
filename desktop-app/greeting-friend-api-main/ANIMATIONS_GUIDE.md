# 🎨 Sistema di Animazioni UI/UX

## Panoramica
Sistema di animazioni professionale per RescueManager che migliora l'esperienza utente con transizioni fluide e micro-interazioni eleganti.

## 🚀 Caratteristiche

### ✅ Animazioni Implementate
- **Transizioni globali** per tutti gli elementi
- **Micro-interazioni** sui pulsanti e card
- **Animazioni di caricamento** eleganti
- **Transizioni dei modal** con backdrop blur
- **Animazioni stagger** per le liste
- **Feedback visivo** per le interazioni
- **Animazioni di pagina** per le route
- **Sistema di easing** professionale

### 🎯 Componenti Animati
- `Toast` - Notifiche con slide-in/out
- `Modal` - Apertura/chiusura con scale e fade
- `Shell` - Sidebar con transizioni smooth
- `SpareParts` - Card con stagger animation
- `LoadingSpinner` - Spinner con animazioni
- `LoadingButton` - Pulsanti con stati di caricamento
- `Skeleton` - Loading states animati

## 📁 Struttura File

```
src/
├── styles/
│   └── animations.css          # Sistema CSS globale
├── components/
│   ├── ui/
│   │   ├── Modal.jsx          # Modal con animazioni
│   │   ├── LoadingSpinner.jsx  # Spinner animato
│   │   ├── LoadingButton.jsx   # Pulsante con loading
│   │   ├── Skeleton.jsx       # Skeleton loading
│   │   ├── ProgressBar.jsx    # Barra di progresso
│   │   ├── AnimatedCard.jsx    # Card con hover effects
│   │   └── NotificationBadge.jsx # Badge animato
│   ├── Toast.jsx              # Notifiche toast
│   ├── Shell.jsx              # Layout con sidebar
│   └── PageTransition.jsx     # Transizioni di pagina
└── pages/
    └── SpareParts.tsx         # Pagina con animazioni
```

## 🎨 Classi CSS Disponibili

### Animazioni Base
```css
.animate-fade-in          /* Fade in semplice */
.animate-slide-up         /* Slide up con scale */
.animate-scale-in         /* Scale in */
.animate-bounce-in        /* Bounce in */
```

### Componenti
```css
.btn                      /* Pulsanti con hover effects */
.card                     /* Card con hover e shadow */
.modal-overlay            /* Overlay dei modal */
.modal-content            /* Contenuto dei modal */
.form-input               /* Input con focus effects */
.focus-ring               /* Ring di focus */
.clickable                /* Micro-interazioni */
```

### Loading States
```css
.loading-spinner          /* Spinner rotante */
.loading-pulse            /* Pulse animation */
.loading-bounce           /* Bounce animation */
```

### Stagger Animations
```css
.stagger-item            /* Elementi con delay progressivo */
```

## 🔧 Utilizzo

### Animazioni CSS
```jsx
// Fade in semplice
<div className="animate-fade-in">Contenuto</div>

// Card con hover effects
<div className="card">Card animata</div>

// Pulsante con micro-interazioni
<button className="btn btn-primary">Pulsante</button>
```

### Componenti React
```jsx
// Toast con animazioni
<Toast show={true} text="Messaggio" type="success" />

// Modal con transizioni
<Modal isOpen={true} onClose={handleClose}>
  <div>Contenuto modal</div>
</Modal>

// Loading spinner
<LoadingSpinner size="md" color="primary" text="Caricamento..." />

// Card animata
<AnimatedCard hoverEffect={true}>
  <div>Contenuto card</div>
</AnimatedCard>
```

## ⚡ Performance

### Ottimizzazioni
- **Hardware acceleration** con `transform: translateZ(0)`
- **Will-change** per elementi animati
- **Reduced motion** support per accessibilità
- **Easing functions** ottimizzate per performance

### Variabili CSS
```css
:root {
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --duration-slower: 600ms;
  
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
  --ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);
  --ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

## ♿ Accessibilità

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Focus Management
- Ring di focus visibili
- Transizioni smooth per focus
- Supporto keyboard navigation

## 🎯 Best Practices

### ✅ Da Fare
- Usare `transform` invece di `position` per animazioni
- Applicare `will-change` solo quando necessario
- Testare con `prefers-reduced-motion`
- Mantenere durate sotto i 400ms
- Usare easing functions appropriate

### ❌ Da Evitare
- Animazioni eccessive o distraenti
- Durate troppo lunghe (>600ms)
- Animazioni su proprietà costose (width, height)
- Ignorare le preferenze di accessibilità

## 🔄 Aggiornamenti Futuri

### Prossime Implementazioni
- [ ] Animazioni per tabelle
- [ ] Transizioni tra route
- [ ] Animazioni per form validation
- [ ] Micro-interazioni per drag & drop
- [ ] Animazioni per grafici e chart

### Miglioramenti
- [ ] Lazy loading per animazioni
- [ ] Intersection Observer per trigger
- [ ] Animazioni basate su scroll
- [ ] Sistema di theme per animazioni
