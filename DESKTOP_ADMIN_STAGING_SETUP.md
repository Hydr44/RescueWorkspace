# Desktop App & Admin Panel Staging Setup

Guida per configurare build staging per le applicazioni Electron.

---

## 🖥️ DESKTOP APP STAGING

### Step 1: Configura Environment Variables

```bash
cd desktop-app/greeting-friend-api-main

# Crea .env.staging
cp .env.example .env.staging
```

Contenuto `.env.staging`:
```bash
# Environment
VITE_ENV=staging
NODE_ENV=staging

# Supabase Staging
VITE_SUPABASE_URL=https://staging.supabase.co
VITE_SUPABASE_ANON_KEY=staging-anon-key

# VPS Staging
VITE_API_BASE_URL=https://staging-api.rescuemanager.eu
VITE_ASSIST_BASE=https://staging-assist.rescuemanager.eu
VITE_RENTRI_BASE=https://staging-rentri.rescuemanager.eu

# App Info
VITE_APP_NAME=RescueManager (STAGING)
VITE_APP_VERSION=0.1.0-staging
```

### Step 2: Configura Vite per Staging

Modifica `vite.config.ts`:

```typescript
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // ... existing config
    define: {
      'import.meta.env.VITE_ENV': JSON.stringify(env.VITE_ENV || mode),
    },
  };
});
```

### Step 3: Aggiungi Build Scripts

Modifica `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:staging": "vite --mode staging",
    "build": "vite build && electron-builder",
    "build:staging": "vite build --mode staging && electron-builder --config electron-builder.staging.yml",
    "build:production": "vite build --mode production && electron-builder"
  }
}
```

### Step 4: Configura Electron Builder per Staging

Crea `electron-builder.staging.yml`:

```yaml
appId: eu.rescuemanager.app.staging
productName: RescueManager Staging
artifactName: ${productName}-Staging-${version}-${os}-${arch}.${ext}

directories:
  output: release/staging

mac:
  category: public.app-category.business
  icon: build/icon.icns
  target:
    - dmg
    - zip

win:
  icon: build/icon.ico
  target:
    - nsis
    - portable

linux:
  icon: build/icon.png
  category: Office
  target:
    - AppImage
    - deb

publish:
  provider: generic
  url: https://staging.rescuemanager.eu/downloads
```

### Step 5: Build Staging

```bash
cd desktop-app/greeting-friend-api-main

# Build per staging
npm run build:staging

# Output in release/staging/
# RescueManager-Staging-0.1.0-mac.dmg
# RescueManager-Staging-0.1.0-win.exe
# RescueManager-Staging-0.1.0-linux.AppImage
```

### Step 6: Test Build Staging

```bash
# Installa build staging
# macOS: Apri .dmg e trascina in Applications
# Windows: Esegui .exe
# Linux: chmod +x .AppImage && ./.AppImage

# Verifica environment
# App dovrebbe mostrare "(STAGING)" nel titolo
# Connessione a database staging
```

---

## 🔧 ADMIN PANEL STAGING

### Step 1: Configura Environment Variables

```bash
cd admin-panel

# Crea .env.staging
cp .env.example .env.staging
```

Contenuto `.env.staging`:
```bash
# Environment
VITE_ENV=staging
NODE_ENV=staging

# Supabase Staging
VITE_SUPABASE_URL=https://staging.supabase.co
VITE_SUPABASE_ANON_KEY=staging-anon-key

# Admin Panel
VITE_ADMIN_PANEL=true
VITE_APP_NAME=RescueManager Admin (STAGING)
```

### Step 2: Aggiungi Build Scripts

Modifica `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:staging": "vite --mode staging",
    "build": "vite build && electron-builder",
    "build:staging": "vite build --mode staging && electron-builder --config electron-builder.staging.yml",
    "build:production": "vite build --mode production && electron-builder"
  }
}
```

### Step 3: Configura Electron Builder per Staging

Crea `electron-builder.staging.yml`:

```yaml
appId: eu.rescuemanager.admin.staging
productName: RescueManager Admin Staging
artifactName: ${productName}-${version}-${os}-${arch}.${ext}

directories:
  output: release/staging

mac:
  category: public.app-category.business
  icon: build/icon.icns

win:
  icon: build/icon.ico

linux:
  icon: build/icon.png
  category: Office
```

### Step 4: Build Staging

```bash
cd admin-panel

# Build per staging
npm run build:staging

# Output in release/staging/
```

---

## 🎨 UI INDICATORS

### Desktop App - Aggiungi Badge Staging

Modifica `src/App.tsx`:

```tsx
function App() {
  const env = import.meta.env.VITE_ENV;
  
  return (
    <div className="app">
      {env === 'staging' && (
        <div className="staging-banner">
          🚧 STAGING ENVIRONMENT 🚧
        </div>
      )}
      {/* Rest of app */}
    </div>
  );
}
```

CSS:
```css
.staging-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #ff9800;
  color: white;
  text-align: center;
  padding: 8px;
  font-weight: bold;
  z-index: 9999;
}
```

---

## 🧪 TESTING

### Test Desktop App Staging

```bash
# 1. Build
npm run build:staging

# 2. Installa
# Apri file in release/staging/

# 3. Test funzionalità
- Login con utente staging
- Sync dati
- Verifica connessione DB staging
- Test offline mode
- Verifica updates (se configurato)

# 4. Check logs
# macOS: ~/Library/Logs/RescueManager Staging/
# Windows: %APPDATA%/RescueManager Staging/logs/
# Linux: ~/.config/RescueManager Staging/logs/
```

### Test Admin Panel Staging

```bash
# 1. Build
npm run build:staging

# 2. Installa e apri

# 3. Test funzionalità
- Login admin
- Gestione organizzazioni
- Analytics
- Subscription management
```

---

## 📦 DISTRIBUTION

### Opzione 1: Download Manuale

Upload build su server:
```bash
# Upload a VPS o storage
scp release/staging/*.dmg root@217.154.118.37:/var/www/downloads/staging/
scp release/staging/*.exe root@217.154.118.37:/var/www/downloads/staging/
scp release/staging/*.AppImage root@217.154.118.37:/var/www/downloads/staging/

# Accessibile da:
# https://staging.rescuemanager.eu/downloads/RescueManager-Staging-0.1.0-mac.dmg
```

### Opzione 2: Auto-Update (Avanzato)

Configura `electron-updater`:

```typescript
// main.ts
import { autoUpdater } from 'electron-updater';

autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://staging.rescuemanager.eu/downloads/staging'
});

autoUpdater.checkForUpdatesAndNotify();
```

---

## 🔄 CI/CD per Desktop Apps (Opzionale)

Crea `.github/workflows/desktop-build.yml`:

```yaml
name: Build Desktop Apps

on:
  push:
    branches: [staging]
    paths:
      - 'desktop-app/**'
      - 'admin-panel/**'

jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Build Desktop App
        working-directory: ./desktop-app/greeting-friend-api-main
        run: |
          npm install
          npm run build:staging
      
      - name: Upload Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: desktop-app-${{ matrix.os }}
          path: desktop-app/greeting-friend-api-main/release/staging/*
```

---

## 📋 Checklist Desktop & Admin

### Desktop App
- [ ] .env.staging creato
- [ ] Vite config aggiornato
- [ ] Build scripts aggiunti
- [ ] electron-builder.staging.yml creato
- [ ] Build staging testato
- [ ] UI staging indicator aggiunto
- [ ] Connessione DB staging verificata
- [ ] Logs verificati

### Admin Panel
- [ ] .env.staging creato
- [ ] Build scripts aggiunti
- [ ] electron-builder.staging.yml creato
- [ ] Build staging testato
- [ ] Funzionalità admin testate

### Distribution
- [ ] Build uploadati su server (opzionale)
- [ ] Download links funzionanti
- [ ] Auto-update configurato (opzionale)
- [ ] CI/CD configurato (opzionale)

---

## 🔧 Troubleshooting

### Build fallisce
```bash
# Pulisci cache
rm -rf node_modules dist release
npm install
npm run build:staging
```

### App non si connette a staging
```bash
# Verifica .env.staging
cat .env.staging

# Check build mode
# Dovrebbe usare --mode staging

# Verifica in app
console.log(import.meta.env.VITE_ENV)
```

### Electron builder error
```bash
# Installa dipendenze sistema
# macOS: Xcode Command Line Tools
# Windows: Visual Studio Build Tools
# Linux: build-essential

# Update electron-builder
npm install electron-builder@latest --save-dev
```

---

**Desktop App & Admin Panel staging pronti!** 🎉
