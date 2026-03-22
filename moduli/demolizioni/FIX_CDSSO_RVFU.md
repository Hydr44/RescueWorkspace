# 🔧 Fix Errore CDSSO RVFU - HTML invece di JSON

**Data:** 19 gennaio 2026  
**Problema:** Il server RVFU restituisce HTML invece di JSON durante la ricerca veicolo  
**Errore:** `Il server ha restituito HTML invece di JSON (Status: 200). Probabile problema CDSSO`

---

## 🔍 Analisi Problema

### Errore Attuale
```
[RVFU Client] BrowserWindow API call failed: Error: Error invoking remote method 'rvfu:api-call': 
Error: rvfu:api-call: Il server ha restituito HTML invece di JSON (Status: 200). 
Probabile problema CDSSO. 
URL: https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/concessionario/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA054AJ
```

### Causa
1. **Chiamate dirette via BrowserWindow**: Il codice sta usando `BrowserWindow` per chiamate dirette
2. **CDSSO non gestito**: Il server RVFU richiede autenticazione CDSSO (Cross-Domain Single Sign-On) che non viene gestita correttamente
3. **Cookie di sessione mancanti**: I cookie SSO (`iPlanetDirectoryPro`) potrebbero non essere disponibili nella finestra BrowserWindow

---

## ✅ Soluzione: Usare Proxy VPS

### Perché Proxy VPS?
- ✅ **Accesso VPN**: Il VPS ha accesso VPN necessario per RVFU
- ✅ **Gestione CDSSO**: Il proxy VPS può gestire CDSSO automaticamente
- ✅ **Cookie persistenti**: Il proxy mantiene la sessione SSO
- ✅ **Più affidabile**: Evita problemi di autenticazione

### Configurazione

#### 1. Variabili Ambiente (`.env`)
```bash
# Abilita proxy VPS per RVFU
VITE_RVFU_USE_PROXY=true
VITE_RVFU_PROXY_URL=https://rvfu.rescuemanager.eu
```

**Nota:** Se `VITE_RVFU_PROXY_URL` non è configurato, usa default: `http://217.154.118.37/rvfu-proxy`

#### 2. Verifica Configurazione VPS

Il proxy VPS deve essere configurato su:
- **URL**: `https://rvfu.rescuemanager.eu` (o `http://217.154.118.37/rvfu-proxy`)
- **Nginx reverse proxy**: Deve inoltrare richieste a `https://formazione.ilportaledeltrasporto.it`
- **VPN attiva**: Il VPS deve avere accesso VPN per RVFU

#### 3. Verifica DNS

Assicurati che il DNS sia configurato:
- `rvfu.rescuemanager.eu` → `217.154.118.37`

---

## 🔧 Modifiche Codice

### File: `src/lib/rvfu-client.ts`

Il codice **già supporta** il proxy VPS. Verifica che:

1. **`useProxy` sia `true`** quando crei `RVFUClient`:
```typescript
const rvfuClient = createRVFUClient(authService, 'formation', true);
// Il terzo parametro controlla useBrowserWindow, non useProxy
```

2. **`RVFUAuthService` usi proxy**:
```typescript
const authService = new RVFUAuthService({
  useProxy: true, // ← IMPORTANTE
  environment: 'formation'
});
```

### File: `src/hooks/useRVFUAuth.ts`

Verifica che `useProxy` sia configurato:
```typescript
const useProxy = import.meta.env.VITE_RVFU_USE_PROXY === 'true';
const proxyUrl = useProxy ? (import.meta.env.VITE_RVFU_PROXY_URL || 'http://217.154.118.37/rvfu-proxy') : undefined;
```

---

## 🧪 Test

### 1. Verifica Configurazione
```javascript
// Nel browser console, verifica:
console.log('VITE_RVFU_USE_PROXY:', import.meta.env.VITE_RVFU_USE_PROXY);
console.log('VITE_RVFU_PROXY_URL:', import.meta.env.VITE_RVFU_PROXY_URL);
```

### 2. Verifica Proxy VPS
```bash
# Test proxy VPS
curl -X GET "https://rvfu.rescuemanager.eu/demolitori-aci-ws/rest/concessionario/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA054AJ" \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

### 3. Test Ricerca Veicolo
1. Apri il form demolizione
2. Clicca "Cerca Veicolo"
3. Inserisci solo la targa (es. `VA054AJ`)
4. Verifica che la chiamata vada al proxy VPS invece che direttamente

---

## 📋 Checklist

- [ ] Variabile `VITE_RVFU_USE_PROXY=true` nel `.env`
- [ ] Variabile `VITE_RVFU_PROXY_URL` configurata (opzionale, usa default se non presente)
- [ ] DNS `rvfu.rescuemanager.eu` punta a `217.154.118.37`
- [ ] Proxy VPS configurato e funzionante
- [ ] VPN attiva sul VPS
- [ ] Test ricerca veicolo funziona

---

## 🚨 Se il Problema Persiste

### Opzione 1: Verifica Proxy VPS
```bash
# SSH sul VPS
ssh root@217.154.118.37

# Verifica configurazione Nginx
cat /etc/nginx/sites-available/rvfu-proxy

# Verifica che il proxy sia attivo
curl -I http://localhost/rvfu-proxy
```

### Opzione 2: Usa Chiamate Dirette (solo se VPN locale)
Se hai VPN locale configurata, puoi disabilitare il proxy:
```bash
VITE_RVFU_USE_PROXY=false
```

**Nota:** Questo richiede VPN attiva sul tuo computer.

### Opzione 3: Verifica Cookie SSO
Il problema potrebbe essere che i cookie SSO non sono disponibili. Verifica:
1. Fai login RVFU prima di cercare veicoli
2. Verifica che i cookie `iPlanetDirectoryPro` siano presenti
3. Se mancano, rifai login

---

## 📝 Note

- **Vercel non può fare proxy**: Vercel non ha accesso VPN, quindi non può essere usato come proxy per RVFU
- **BrowserWindow vs Proxy**: BrowserWindow è per chiamate dirette (richiede VPN locale), Proxy VPS è per chiamate via server (VPN sul VPS)
- **CDSSO**: Cross-Domain Single Sign-On richiede cookie di sessione che il proxy VPS gestisce automaticamente

---

**Status:** ⚠️ Da verificare configurazione proxy VPS
