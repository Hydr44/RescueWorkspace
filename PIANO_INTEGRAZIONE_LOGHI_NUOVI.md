# Piano Integrazione Loghi Nuovi — RescueManager

**Data**: 18 Marzo 2026  
**Cartella sorgente**: `/Users/sign.rascozzarini/Desktop/File logo/`  
**Formato consigliato**: SVG (scalabile, leggero, ottimizzato)

---

## 1. STRUTTURA LOGHI DISPONIBILI

### 1.1 Varianti Disponibili

| Categoria | Varianti | Formato | Uso |
|-----------|----------|---------|-----|
| **Logo Principale** | Colori, Nero, Bianco | SVG/PNG/PDF | Header, favicon, stampe |
| **Solo Logo** | Colori, Nero, Bianco | SVG/PNG/PDF | Icon, sidebar, app icon |
| **Solo Nome** | Colori, Nero, Bianco | SVG/PNG/PDF | Testo branding, footer |

### 1.2 Formati Disponibili
- **SVG** — ✅ Preferito (scalabile, leggero, animabile)
- **PNG @2x** — ✅ Fallback (retina display)
- **PDF** — ⚠️ Solo per stampe
- **JPG** — ❌ Non usare (bassa qualità)

---

## 2. PIANO D'INTEGRAZIONE WEBSITE (Next.js)

### 2.1 Struttura Directory

```
website/public/
├── assets/
│   ├── logos/
│   │   ├── logo-principale-colori.svg      ← Logo + Nome (colori)
│   │   ├── logo-principale-nero.svg        ← Logo + Nome (nero)
│   │   ├── logo-principale-bianco.svg      ← Logo + Nome (bianco)
│   │   ├── logo-icon-colori.svg            ← Solo logo (colori)
│   │   ├── logo-icon-nero.svg              ← Solo logo (nero)
│   │   ├── logo-icon-bianco.svg            ← Solo logo (bianco)
│   │   ├── logo-text-colori.svg            ← Solo nome (colori)
│   │   ├── logo-text-nero.svg              ← Solo nome (nero)
│   │   └── logo-text-bianco.svg            ← Solo nome (bianco)
│   └── favicon/
│       ├── favicon.ico                     ← 32x32 (icon colori)
│       ├── apple-touch-icon.png            ← 180x180 (iOS)
│       └── android-chrome-192x192.png      ← Android
├── og-image.png                            ← Open Graph (1200x630)
└── twitter-image.png                       ← Twitter (1024x512)
```

### 2.2 Componenti da Aggiornare

#### A. Header/Navigation

**File**: `website/src/components/Header.tsx` (o simile)

```typescript
// PRIMA (vecchio logo)
<img src="/logo.png" alt="RescueManager" width={40} height={40} />

// DOPO (nuovo logo)
<img 
  src="/assets/logos/logo-icon-colori.svg" 
  alt="RescueManager" 
  width={40} 
  height={40}
  className="dark:hidden"  // Mostra colori in light mode
/>
<img 
  src="/assets/logos/logo-icon-bianco.svg" 
  alt="RescueManager" 
  width={40} 
  height={40}
  className="hidden dark:block"  // Mostra bianco in dark mode
/>
```

#### B. Logo + Testo (Branding completo)

**File**: `website/src/components/BrandLogo.tsx` (NUOVO)

```typescript
export function BrandLogo({ variant = 'colori', size = 'md' }) {
  const sizes = {
    sm: { width: 120, height: 40 },
    md: { width: 160, height: 53 },
    lg: { width: 240, height: 80 }
  }
  
  return (
    <img
      src={`/assets/logos/logo-principale-${variant}.svg`}
      alt="RescueManager"
      {...sizes[size]}
    />
  )
}

// Uso:
// <BrandLogo variant="colori" size="md" />
```

#### C. Login Page

**File**: `website/src/app/login/page.tsx`

```typescript
// PRIMA
<img src="/logo_128.png" alt="RescueManager" />

// DOPO
<img 
  src="/assets/logos/logo-principale-colori.svg" 
  alt="RescueManager"
  width={200}
  height={67}
/>
```

#### D. Set Password Page

**File**: `website/src/app/set-password/page.tsx`

```typescript
// PRIMA
<img src="/logo_128.png" alt="RescueManager" />

// DOPO
<img 
  src="/assets/logos/logo-principale-colori.svg" 
  alt="RescueManager"
  width={200}
  height={67}
/>
```

#### E. Onboarding Page

**File**: `website/src/app/onboarding/page.tsx`

```typescript
// PRIMA
<img src="/logo_128.png" alt="RescueManager" />

// DOPO
<img 
  src="/assets/logos/logo-principale-colori.svg" 
  alt="RescueManager"
  width={200}
  height={67}
/>
```

#### F. Footer

**File**: `website/src/components/Footer.tsx`

```typescript
// PRIMA
<img src="/logo.png" alt="RescueManager" width={40} height={40} />

// DOPO
<img 
  src="/assets/logos/logo-icon-nero.svg" 
  alt="RescueManager"
  width={40}
  height={40}
/>
```

#### G. Dashboard

**File**: `website/src/app/dashboard/layout.tsx`

```typescript
// Sidebar logo
<img 
  src="/assets/logos/logo-icon-colori.svg"
  alt="RescueManager"
  width={40}
  height={40}
/>
```

#### H. Meta Tags (SEO)

**File**: `website/src/app/layout.tsx`

```typescript
export const metadata = {
  title: 'RescueManager',
  description: 'Piattaforma gestione autodemolizioni',
  icons: {
    icon: '/assets/favicon/favicon.ico',
    apple: '/assets/favicon/apple-touch-icon.png',
  },
  openGraph: {
    images: ['/og-image.png'],
  },
  twitter: {
    images: ['/twitter-image.png'],
  }
}
```

### 2.3 Checklist Website

- [ ] Copiare file SVG in `public/assets/logos/`
- [ ] Creare favicon (32x32 da logo-icon-colori.svg)
- [ ] Creare apple-touch-icon.png (180x180)
- [ ] Creare og-image.png (1200x630 con logo + nome)
- [ ] Creare twitter-image.png (1024x512)
- [ ] Aggiornare Header.tsx
- [ ] Creare BrandLogo.tsx component
- [ ] Aggiornare login/page.tsx
- [ ] Aggiornare set-password/page.tsx
- [ ] Aggiornare onboarding/page.tsx
- [ ] Aggiornare Footer.tsx
- [ ] Aggiornare dashboard/layout.tsx
- [ ] Aggiornare layout.tsx (meta tags)
- [ ] Testare su mobile (breakpoint 375px, 768px, 1024px)
- [ ] Testare dark mode
- [ ] Rimuovere `/logo.png`, `/logo_128.png` vecchi

---

## 3. PIANO D'INTEGRAZIONE DESKTOP APP (Electron)

### 3.1 Struttura Directory

```
desktop-app/greeting-friend-api-main/
├── public/
│   ├── logos/
│   │   ├── logo-principale-colori.svg
│   │   ├── logo-principale-nero.svg
│   │   ├── logo-icon-colori.svg
│   │   └── logo-icon-bianco.svg
├── build/
│   ├── icon.icns                          ← macOS (logo-icon-colori)
│   ├── icon.ico                           ← Windows (logo-icon-colori)
│   └── icon.png                           ← Linux (logo-icon-colori)
└── electron/
    └── main.js                            ← Aggiornare icon path
```

### 3.2 Componenti da Aggiornare

#### A. Shell/Sidebar

**File**: `desktop-app/greeting-friend-api-main/src/components/Shell.jsx`

```jsx
// PRIMA
<img src="/logo.png" alt="RescueManager" width={40} height={40} />

// DOPO
<img 
  src="/logos/logo-icon-colori.svg" 
  alt="RescueManager"
  width={40}
  height={40}
/>
```

#### B. Login Page

**File**: `desktop-app/greeting-friend-api-main/src/pages/Login.jsx`

```jsx
// PRIMA
<img src="/logo_128.png" alt="RescueManager" />

// DOPO
<img 
  src="/logos/logo-principale-colori.svg" 
  alt="RescueManager"
  width={200}
  height={67}
/>
```

#### C. Window Icon (Electron)

**File**: `desktop-app/greeting-friend-api-main/electron/main.js`

```javascript
// PRIMA
const mainWindow = new BrowserWindow({
  icon: path.join(__dirname, '../public/logo.png')
})

// DOPO
const mainWindow = new BrowserWindow({
  icon: path.join(__dirname, '../build/icon.png')
})
```

#### D. App Icon (Build)

**File**: `desktop-app/greeting-friend-api-main/package.json`

```json
{
  "build": {
    "mac": {
      "icon": "build/icon.icns"
    },
    "win": {
      "icon": "build/icon.ico"
    },
    "linux": {
      "icon": "build/icon.png"
    }
  }
}
```

### 3.3 Checklist Desktop App

- [ ] Copiare file SVG in `public/logos/`
- [ ] Generare icon.icns (macOS) da logo-icon-colori.svg
- [ ] Generare icon.ico (Windows) da logo-icon-colori.svg
- [ ] Generare icon.png (Linux) da logo-icon-colori.svg
- [ ] Aggiornare Shell.jsx
- [ ] Aggiornare Login.jsx
- [ ] Aggiornare electron/main.js
- [ ] Aggiornare package.json build config
- [ ] Testare build macOS (dmg)
- [ ] Testare build Windows (nsis)
- [ ] Testare build Linux (AppImage)
- [ ] Rimuovere `/logo.png`, `/logo_128.png` vecchi

---

## 4. LOGHI VECCHI DA RIMUOVERE

### 4.1 Website

```bash
# File da eliminare
rm website/public/logo.png
rm website/public/logo_128.png
rm website/public/favicon.ico (se vecchio)
```

### 4.2 Desktop App

```bash
# File da eliminare
rm desktop-app/greeting-friend-api-main/public/logo.png
rm desktop-app/greeting-friend-api-main/public/logo_128.png
rm desktop-app/greeting-friend-api-main/build/icon.png (se vecchio)
```

### 4.3 Ricerca nel Codice

```bash
# Trovare riferimenti ai vecchi loghi
grep -r "logo.png\|logo_128.png\|logo_old" website/src/ desktop-app/src/
# Eliminare tutti i riferimenti trovati
```

---

## 5. GUIDA PRATICA: COME GENERARE FAVICON E ICON

### 5.1 Favicon da SVG

**Tool consigliato**: https://realfavicongenerator.net/

1. Upload: `logo-icon-colori.svg`
2. Genera automaticamente:
   - favicon.ico (32x32)
   - apple-touch-icon.png (180x180)
   - android-chrome-192x192.png
   - android-chrome-512x512.png

**Oppure con ImageMagick** (CLI):
```bash
# Installare ImageMagick
brew install imagemagick

# Convertire SVG → PNG
convert -background none -density 300 \
  "/Users/sign.rascozzarini/Desktop/File logo/Solo logo/SVG/solo logo a colori.svg" \
  -resize 32x32 favicon.ico

convert -background none -density 300 \
  "/Users/sign.rascozzarini/Desktop/File logo/Solo logo/SVG/solo logo a colori.svg" \
  -resize 180x180 apple-touch-icon.png
```

### 5.2 App Icon (Electron)

**Tool consigliato**: https://www.icoconvert.com/ o Figma

1. Esportare logo-icon-colori.svg come PNG 512x512
2. Convertire:
   - PNG 512x512 → icon.icns (macOS)
   - PNG 512x512 → icon.ico (Windows)
   - PNG 512x512 → icon.png (Linux)

**Oppure con electron-builder** (automatico):
```bash
# electron-builder genera automaticamente da una PNG 512x512
# Basta mettere build/icon.png e fa il resto
```

### 5.3 Open Graph Image

**Dimensioni**: 1200x630 px  
**Contenuto**: Logo principale + nome + tagline

**Creare in Figma**:
1. Nuovo file 1200x630
2. Inserire `logo-principale-colori.svg`
3. Aggiungere testo "RescueManager" + "Gestione Autodemolizioni"
4. Esportare come PNG

---

## 6. TIMELINE D'IMPLEMENTAZIONE

### Fase 1: Setup (2 ore)
- [ ] Copiare file SVG in website/public/assets/logos/
- [ ] Copiare file SVG in desktop-app/public/logos/
- [ ] Generare favicon e app icons

### Fase 2: Website (3 ore)
- [ ] Aggiornare Header.tsx
- [ ] Creare BrandLogo.tsx
- [ ] Aggiornare login, set-password, onboarding pages
- [ ] Aggiornare Footer.tsx
- [ ] Aggiornare meta tags

### Fase 3: Desktop App (2 ore)
- [ ] Aggiornare Shell.jsx
- [ ] Aggiornare Login.jsx
- [ ] Aggiornare electron/main.js
- [ ] Aggiornare package.json

### Fase 4: Testing & Cleanup (1 ora)
- [ ] Testare website su mobile/desktop
- [ ] Testare dark mode
- [ ] Build desktop app (Mac/Win/Linux)
- [ ] Rimuovere loghi vecchi
- [ ] Commit e push

**Totale**: 8 ore

---

## 7. COMANDI RAPIDI

### Copiare loghi in website
```bash
mkdir -p website/public/assets/logos
cp "/Users/sign.rascozzarini/Desktop/File logo/Logo principale/SVG/"* \
   website/public/assets/logos/
cp "/Users/sign.rascozzarini/Desktop/File logo/Solo logo/SVG/"* \
   website/public/assets/logos/
cp "/Users/sign.rascozzarini/Desktop/File logo/Solo nome/SVG/"* \
   website/public/assets/logos/
```

### Copiare loghi in desktop app
```bash
mkdir -p desktop-app/greeting-friend-api-main/public/logos
cp "/Users/sign.rascozzarini/Desktop/File logo/Logo principale/SVG/"* \
   desktop-app/greeting-friend-api-main/public/logos/
cp "/Users/sign.rascozzarini/Desktop/File logo/Solo logo/SVG/"* \
   desktop-app/greeting-friend-api-main/public/logos/
```

### Trovare riferimenti ai vecchi loghi
```bash
grep -r "logo\.png\|logo_128\.png" website/src desktop-app/src
```

### Rimuovere loghi vecchi
```bash
find website/public desktop-app/greeting-friend-api-main/public \
  -name "logo.png" -o -name "logo_128.png" -o -name "logo_old*" | xargs rm
```

---

## 8. NOTE IMPORTANTI

### SVG vs PNG
- **SVG**: Usa per web (scalabile, leggero, animabile)
- **PNG**: Usa per favicon, app icons, fallback
- **JPG**: ❌ Non usare (bassa qualità per loghi)

### Dark Mode
- Colori: Usa in light mode
- Nero: Usa in dark mode
- Bianco: Usa come fallback/stampe

### Responsive
- Mobile (375px): Logo icon solo
- Tablet (768px): Logo icon + nome
- Desktop (1024px+): Logo principale completo

### Accessibility
- Sempre aggiungere `alt="RescueManager"`
- SVG inline: Aggiungere `role="img"`
- Testare con screen reader

---

**Fine Piano**

*Generato da Cascade AI — 18 Marzo 2026*
