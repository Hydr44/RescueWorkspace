# Test Split Design - Website Style

## 🎨 Implementazione Completata

Ho implementato il **design split** (sidebar scura + content chiaro/scuro) nella desktop app, esattamente come nel mockup HTML.

## 📁 File Creati/Modificati

### Nuovi File
1. **`src/styles/split-design.css`** - CSS per il layout split
2. **`src/components/ShellSplit.jsx`** - Shell component con sidebar scura
3. **`src/pages/DashboardSplit.jsx`** - Dashboard con nuovo stile
4. **`src/pages/TestSplitDesign.jsx`** - Pagina di test

### File Modificati
1. **`src/styles/design-tokens.css`** - Aggiornati colori e tokens per split design

## 🚀 Come Testare

### Opzione 1: Aggiungere Route Temporanea

Aggiungi questa route in `src/App.jsx` (dopo le altre route):

```jsx
// Importa il componente (in cima al file, con gli altri import)
const TestSplitDesign = lazyPage(() => import("./pages/TestSplitDesign"), "TestSplitDesign");

// Aggiungi la route (dentro <Routes>)
<Route path="/test-split" element={<TestSplitDesign />} />
```

Poi avvia l'app e vai su: `http://localhost:5173/#/test-split`

### Opzione 2: Sostituire Dashboard Temporaneamente

In `src/App.jsx`, sostituisci temporaneamente:

```jsx
// PRIMA
const Dashboard = lazyPage(() => import("./pages/Dashboard"), "Dashboard");

// DOPO (temporaneo per test)
const Dashboard = lazyPage(() => import("./pages/TestSplitDesign"), "TestSplitDesign");
```

Poi avvia l'app normalmente e vedrai il nuovo design sulla homepage.

## ✨ Caratteristiche Implementate

### Split Design
- ✅ **Sidebar scura** (#0f172a) come website
- ✅ **Content chiaro** (#ffffff) in light mode
- ✅ **Content scuro** (#1e293b) in dark mode
- ✅ **Dark mode toggle** funzionante nella sidebar

### Componenti Website Style
- ✅ **Elementi squadrati** (border-radius: 0)
- ✅ **Typography bold** (font-weight: 800 per titoli)
- ✅ **Section titles** uppercase piccole
- ✅ **Badge flat** con bordi sottili
- ✅ **Stats cards** con hover effects
- ✅ **Subscription card** come dashboard website

### Design Tokens Aggiornati
- ✅ Colori split (`--bg-left`, `--bg-right`)
- ✅ Text colors (`--text-left`, `--text-right`)
- ✅ Border colors (`--border-left`, `--border-right`)
- ✅ Dark mode overrides

## 🎯 Prossimi Step

Se il design ti piace:

1. **Sostituire Shell.jsx** con ShellSplit.jsx
2. **Aggiornare Dashboard.jsx** con lo stile split
3. **Aggiornare altre pagine** progressivamente
4. **Creare componenti UI** riutilizzabili (Button, Card, Badge)

## 📸 Screenshot

Apri l'app e vedrai:
- Sidebar scura a sinistra con nav items
- Content area chiara/scura a destra
- Bottone "Dark Mode" in fondo alla sidebar
- Stats cards con stile website
- Subscription card con badge

## 🔧 Personalizzazione

Tutti i colori e stili sono in:
- `src/styles/design-tokens.css` - Variabili CSS
- `src/styles/split-design.css` - Layout e componenti

Puoi modificare facilmente:
- Colori sidebar: `--bg-left`
- Colori content: `--bg-right`
- Border radius: `--radius-*` (attualmente 0 per squadrato)
- Font weights, spacing, etc.
