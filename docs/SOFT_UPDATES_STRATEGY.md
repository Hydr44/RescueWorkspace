# 🔄 STRATEGIA AGGIORNAMENTI SOFT - Desktop App

## 🎯 DOMANDA

**È possibile aggiornare la desktop app senza far scaricare il nuovo installer in certi casi?**

---

## ✅ RISPOSTA BREVE

**SÌ, ci sono diverse strategie per aggiornamenti "soft" senza reinstallo completo:**

1. **Feature Flags via API** ✅ (Più semplice, già possibile)
2. **Configurazione Dinamica** ✅ (Già implementato parzialmente)
3. **Hot Reload Frontend** ⚠️ (Complesso, possibile)
4. **Code Splitting Dinamico** ❌ (Molto complesso, non consigliato)
5. **Hybrid Approach** ✅ (Consigliato: combinazione di feature flags + configurazione)

---

## 🔍 ANALISI ARCHITETTURA ATTUALE

### **Stack:**
- **Electron** (Desktop app)
- **React** (Frontend)
- **Vite** (Build tool)
- **Remote Control API** (già implementato per versioni/maintenance)

### **Sistema Aggiornamenti Attuale:**
- ✅ Controllo versione all'avvio (`/api/version/check`)
- ✅ Forced updates (blocca app se versione vecchia)
- ✅ Download URL personalizzabile
- ❌ **Nessun sistema di aggiornamenti soft**

---

## 🚀 STRATEGIE AGGIORNAMENTI SOFT

### **1. FEATURE FLAGS VIA API** ✅ (CONSIGLIATO)

**Concetto:** Abilitare/disabilitare feature o cambiare comportamento via configurazione remota, senza aggiornare l'app.

#### **Implementazione:**

**A. Database Schema:**
```sql
-- Tabella feature flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text NOT NULL UNIQUE,
  enabled boolean DEFAULT false,
  config jsonb DEFAULT '{}'::jsonb,
  description text,
  min_version text, -- Versione minima app per questa flag
  org_id uuid REFERENCES orgs(id), -- Opzionale: per org specifiche
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indici
CREATE INDEX idx_feature_flags_key ON public.feature_flags(flag_key);
CREATE INDEX idx_feature_flags_enabled ON public.feature_flags(enabled);
```

**B. API Endpoint:**
```typescript
// website/src/app/api/features/check/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const currentVersion = searchParams.get('version') || '0.0.0';
  const orgId = searchParams.get('org_id');

  const { data: flags } = await supabaseAdmin
    .from('feature_flags')
    .select('flag_key, enabled, config, min_version')
    .eq('enabled', true)
    .or(`org_id.is.null,org_id.eq.${orgId}`)
    .lte('min_version', currentVersion); // Solo flag compatibili con versione

  const flagsMap = flags?.reduce((acc, flag) => {
    acc[flag.flag_key] = {
      enabled: flag.enabled,
      config: flag.config || {}
    };
    return acc;
  }, {} as Record<string, any>) || {};

  return NextResponse.json({ flags: flagsMap });
}
```

**C. Desktop Service:**
```typescript
// desktop-app/src/lib/feature-flags.ts
class FeatureFlagsService {
  private flags: Record<string, any> = {};
  private lastCheck: number = 0;
  private checkInterval = 5 * 60 * 1000; // 5 minuti

  async loadFlags(orgId?: string): Promise<void> {
    try {
      const version = process.env.APP_VERSION || '0.1.0';
      const params = new URLSearchParams({ version, ...(orgId ? { org_id: orgId } : {}) });
      
      const response = await fetch(`${API_URL}/api/features/check?${params}`);
      const data = await response.json();
      
      this.flags = data.flags || {};
      this.lastCheck = Date.now();
    } catch (error) {
      console.error('Failed to load feature flags:', error);
    }
  }

  isEnabled(flagKey: string): boolean {
    return this.flags[flagKey]?.enabled === true;
  }

  getConfig(flagKey: string): any {
    return this.flags[flagKey]?.config || {};
  }

  startAutoRefresh(orgId?: string): void {
    // Carica flags all'avvio
    this.loadFlags(orgId);

    // Ricarica ogni 5 minuti
    setInterval(() => {
      this.loadFlags(orgId);
    }, this.checkInterval);
  }
}

export const featureFlags = new FeatureFlagsService();
```

**D. Uso nell'App:**
```typescript
// Esempio: Feature "nuova UI trasporti"
import { featureFlags } from '@/lib/feature-flags';

function TransportsPage() {
  const [flags, setFlags] = useState(featureFlags.flags);

  useEffect(() => {
    // Refresh flags periodicamente
    const interval = setInterval(() => {
      setFlags(featureFlags.flags);
    }, 60000); // Ogni minuto

    return () => clearInterval(interval);
  }, []);

  // Usa feature flag per decidere quale componente mostrare
  if (featureFlags.isEnabled('new_transports_ui')) {
    return <NewTransportsUI config={featureFlags.getConfig('new_transports_ui')} />;
  }

  return <OldTransportsUI />;
}
```

#### **Vantaggi:**
- ✅ **Semplice da implementare** (1-2 giorni)
- ✅ **Immediato** (cambia comportamento senza aggiornare app)
- ✅ **Controllo granulare** (per org, per versione)
- ✅ **Rollback facile** (basta disabilitare flag)
- ✅ **A/B testing** (abilitare per alcune org)

#### **Limiti:**
- ❌ **Non può aggiungere nuovo codice** (solo abilitare/disabilitare codice esistente)
- ❌ **Non può cambiare logica core** (solo UI/features)

#### **Casi d'uso:**
- Abilitare nuova UI per alcune org
- Cambiare configurazione (colori, workflow, etc.)
- Disabilitare feature problematiche velocemente
- A/B testing nuove funzionalità

---

### **2. CONFIGURAZIONE DINAMICA** ✅ (GIÀ POSSIBILE)

**Concetto:** Cambiare configurazione dell'app (colori, workflow, impostazioni) via API senza aggiornare app.

#### **Implementazione:**

**A. Database Schema (già esiste parzialmente):**
```sql
-- Tabella org_settings (già esiste)
-- Può essere estesa per configurazione UI

-- Esempio: Configurazione UI dinamica
ALTER TABLE org_settings ADD COLUMN IF NOT EXISTS ui_config jsonb DEFAULT '{}'::jsonb;
```

**B. API Endpoint:**
```typescript
// website/src/app/api/org/settings/route.ts (già esiste parzialmente)
// Estendere per includere configurazione UI dinamica
```

**C. Desktop Service:**
```typescript
// desktop-app/src/lib/remote-config.ts
class RemoteConfigService {
  private config: any = {};
  private orgId: string;

  async loadConfig(orgId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/org/settings?org_id=${orgId}`);
    const data = await response.json();
    this.config = data.ui_config || {};
    this.orgId = orgId;
  }

  get(key: string, defaultValue?: any): any {
    return this.config[key] ?? defaultValue;
  }

  // Esempio: Configurazione colori tema
  getThemeColors(): Record<string, string> {
    return this.get('theme', {
      primary: '#4f46e5',
      secondary: '#6366f1',
      accent: '#818cf8'
    });
  }
}

export const remoteConfig = new RemoteConfigService();
```

#### **Vantaggi:**
- ✅ **Personalizzazione per org** (ogni org ha i suoi colori/settings)
- ✅ **Cambio immediato** (aggiorna refresh app)
- ✅ **Già possibile** (estendere sistema esistente)

#### **Limiti:**
- ❌ **Solo configurazione** (non può aggiungere codice)
- ❌ **Solo UI/appearance** (non logica business)

---

### **3. HOT RELOAD FRONTEND** ⚠️ (COMPLESSO)

**Concetto:** Scaricare e aggiornare solo i file JavaScript/React senza reinstallare Electron.

#### **Implementazione:**

**A. Architettura:**
```typescript
// desktop-app/electron/main.ts
import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

class HotUpdateService {
  private appPath: string;
  private remoteAssetsUrl: string;

  constructor() {
    this.appPath = app.getPath('userData');
    this.remoteAssetsUrl = 'https://rescuemanager.eu/static/app/';
  }

  async checkForUpdates(): Promise<boolean> {
    try {
      // Controlla versione assets remota
      const remoteVersion = await fetch(`${this.remoteAssetsUrl}version.json`)
        .then(r => r.json());

      const localVersion = this.getLocalVersion();

      if (this.compareVersions(remoteVersion.version, localVersion) > 0) {
        // Nuova versione disponibile, scarica assets
        await this.downloadAssets(remoteVersion);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Hot update check failed:', error);
      return false;
    }
  }

  async downloadAssets(version: any): Promise<void> {
    const assetsPath = path.join(this.appPath, 'assets', version.version);
    fs.mkdirSync(assetsPath, { recursive: true });

    // Scarica file JavaScript/CSS aggiornati
    const files = version.files; // ['app.js', 'styles.css', 'components.js']
    
    for (const file of files) {
      const response = await fetch(`${this.remoteAssetsUrl}${version.version}/${file}`);
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(path.join(assetsPath, file), Buffer.from(buffer));
    }

    // Salva nuova versione
    fs.writeFileSync(
      path.join(this.appPath, 'assets', 'version.json'),
      JSON.stringify(version)
    );
  }

  getAssetPath(filename: string): string {
    const version = this.getLocalVersion();
    const localPath = path.join(this.appPath, 'assets', version, filename);
    
    if (fs.existsSync(localPath)) {
      return `file://${localPath}`;
    }
    
    // Fallback a assets bundle
    return path.join(__dirname, '..', 'renderer', 'dist', filename);
  }

  getLocalVersion(): string {
    try {
      const versionPath = path.join(this.appPath, 'assets', 'version.json');
      const version = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
      return version.version || '0.1.0';
    } catch {
      return '0.1.0';
    }
  }
}
```

**B. Caricamento Dinamico:**
```html
<!-- desktop-app/renderer/index.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>RescueManager</title>
  <!-- Carica CSS dinamico -->
  <link id="dynamic-styles" rel="stylesheet" />
</head>
<body>
  <div id="root"></div>
  
  <!-- Carica JS dinamico -->
  <script>
    // Carica versione assets
    const version = window.electron.getAssetVersion();
    const assetsBase = window.electron.getAssetsBase();
    
    // Carica CSS aggiornato
    document.getElementById('dynamic-styles').href = `${assetsBase}styles.css`;
    
    // Carica JS aggiornato
    const script = document.createElement('script');
    script.src = `${assetsBase}app.js`;
    script.onload = () => {
      // Inizializza app
      window.app.init();
    };
    document.body.appendChild(script);
  </script>
</body>
</html>
```

#### **Vantaggi:**
- ✅ **Aggiorna UI/logica** senza reinstallare Electron
- ✅ **Più veloce** (solo file JS/CSS, non installer completo)
- ✅ **Trasparente per utente** (download in background)

#### **Limiti:**
- ⚠️ **Complesso da implementare** (1-2 settimane)
- ⚠️ **Gestione versioni** (compatibilità vecchie versioni)
- ⚠️ **Security** (validare signature file remoti)
- ⚠️ **Rollback** (gestire fallback a versione precedente)

#### **Casi d'uso:**
- Aggiornamenti UI frequenti
- Fix bug rapidi
- Nuove feature frontend

---

### **4. HYBRID APPROACH** ✅ (CONSIGLIATO)

**Concetto:** Combinare Feature Flags + Configurazione Dinamica + Hot Reload selettivo.

#### **Strategia:**

1. **Feature Flags** per:
   - Abilitare/disabilitare feature esistenti
   - A/B testing
   - Rollback rapido

2. **Configurazione Dinamica** per:
   - Personalizzazione UI per org
   - Cambio workflow
   - Impostazioni utente

3. **Hot Reload** (opzionale) per:
   - Aggiornamenti UI frequenti
   - Fix bug rapidi frontend

4. **Full Update** (sempre disponibile) per:
   - Aggiornamenti Electron core
   - Nuove feature che richiedono native code
   - Aggiornamenti critici

---

## 📊 TABELLA COMPARAZIONE

| Strategia | Complessità | Velocità | Flessibilità | Casi d'Uso |
|-----------|-------------|----------|--------------|------------|
| **Feature Flags** | ⭐ Bassa | ✅ Immediato | ⚠️ Limitato | Abilitare/disabilitare feature |
| **Config Dinamica** | ⭐ Bassa | ✅ Immediato | ⚠️ Solo UI | Personalizzazione org |
| **Hot Reload** | ⭐⭐⭐ Alta | ✅ Rapido | ✅ Buono | Update UI/frontend |
| **Full Update** | ⭐ Media | ❌ Lento | ✅ Completo | Update completo app |

---

## 🎯 RACCOMANDAZIONE

### **FASE 1: Feature Flags** (Implementare subito) ✅

**Priorità:** Alta  
**Tempo:** 1-2 giorni  
**Beneficio:** Controllo immediato features senza aggiornare app

**Implementazione:**
1. Creare tabella `feature_flags`
2. API endpoint `/api/features/check`
3. Service `FeatureFlagsService` nell'app
4. Usare flags per abilitare/disabilitare feature

**Casi d'uso immediati:**
- Abilitare nuova UI trasporti per alcune org
- Disabilitare feature problematiche velocemente
- A/B testing nuovi flussi

---

### **FASE 2: Configurazione Dinamica Estesa** (2-3 giorni)

**Priorità:** Media  
**Tempo:** 2-3 giorni  
**Beneficio:** Personalizzazione per org senza aggiornare app

**Implementazione:**
1. Estendere `org_settings` con `ui_config`
2. API per salvare/caricare configurazione
3. Service `RemoteConfigService` nell'app
4. Usare config per personalizzare UI

**Casi d'uso:**
- Colori tema personalizzati per org
- Workflow personalizzato
- Impostazioni default

---

### **FASE 3: Hot Reload** (Opzionale, solo se necessario)

**Priorità:** Bassa  
**Tempo:** 1-2 settimane  
**Beneficio:** Aggiornamenti UI rapidi

**Quando implementare:**
- Se fai aggiornamenti UI molto frequenti (>1/settimana)
- Se vuoi fix bug rapidi senza reinstallare
- Se hai risorse per implementarlo

---

## ✅ CONCLUSIONE

### **SÌ, è possibile aggiornamenti soft senza installer** ✅

**Strategia consigliata:**
1. ✅ **Feature Flags** (implementare subito) → controllo features
2. ✅ **Configurazione Dinamica** (implementare presto) → personalizzazione
3. ⚠️ **Hot Reload** (opzionale) → solo se necessario
4. ✅ **Full Update** (sempre disponibile) → per aggiornamenti critici

**Vantaggi:**
- **Risparmio tempo** utente (non deve scaricare/reinstallare)
- **Rollback rapido** (basta disabilitare flag)
- **A/B testing** (testare su subset utenti)
- **Personalizzazione** (configurazione per org)

**Quando usare full update:**
- Aggiornamenti Electron core
- Nuove feature che richiedono native code
- Aggiornamenti critici di sicurezza
- Cambiamenti breaking

---

**Ultimo aggiornamento:** Gennaio 2025  
**Versione:** 1.0
