# 🔍 Analisi Problema CDSSO RVFU

**Data:** 19 gennaio 2026  
**Problema:** Il server RVFU restituisce HTML invece di JSON durante la ricerca veicolo  
**Errore:** `Il server ha restituito HTML invece di JSON (Status: 200). Probabile problema CDSSO`

---

## 🔍 Analisi Log

Dal log vedo:
1. ✅ **Login funziona**: Autenticazione completata con successo
2. ✅ **Token validi**: `hasTokens: true, hasAccessToken: true, hasIdToken: true`
3. ✅ **ID Token JWT**: Token valido e corretto
4. ❌ **Chiamata API fallisce**: HTML invece di JSON

### Log Chiamata
```
[RVFU Client] Request via BrowserWindow: {
  method: 'GET', 
  url: 'https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/concessionario/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA054AJ', 
  hasAuth: true
}
```

### Errore
```
[RVFU Client] BrowserWindow API call failed: 
Error: Il server ha restituito HTML invece di JSON (Status: 200). 
Probabile problema CDSSO.
```

---

## 🔍 Problema Identificato

### 1. **Gestione CDSSO Esistente ma Non Funziona**

Il codice **già gestisce CDSSO** in `electron/ipc.js` (righe 1397-1489):
- ✅ Rileva form CDSSO (`/agent/cdsso-oauth2`)
- ✅ Esegue POST automatico via iframe
- ✅ Riprova richiesta originale dopo CDSSO

**MA** l'errore viene lanciato **prima** che la gestione CDSSO possa funzionare!

### 2. **Flusso Attuale**

```
1. BrowserWindow fa fetch() → Riceve HTML (form CDSSO)
2. Codice rileva HTML → Controlla se è CDSSO
3. Se è CDSSO → Esegue POST automatico
4. Riprova richiesta originale
5. Se ancora HTML → Lancia errore
```

**Problema:** L'errore viene lanciato in `rvfu-client.ts` **prima** che la gestione CDSSO in `ipc.js` possa completare!

---

## 🔧 Soluzione

### Opzione 1: Migliorare Gestione CDSSO in BrowserWindow

Il problema è che la gestione CDSSO in `ipc.js` potrebbe non funzionare correttamente. Verificare:

1. **Cookie SSO disponibili?**
   - Il cookie `iPlanetDirectoryPro` deve essere presente nella finestra BrowserWindow
   - Verificare che il cookie sia impostato correttamente

2. **Form CDSSO submit funziona?**
   - Il form viene submitato correttamente?
   - L'iframe riceve la risposta corretta?

3. **Retry funziona?**
   - Dopo il submit del form CDSSO, la richiesta originale viene riprovata?
   - I cookie di sessione sono disponibili dopo CDSSO?

### Opzione 2: Usare Proxy VPS (Consigliato)

Anche se hai VPN attiva, il proxy VPS è più affidabile perché:
- ✅ Gestisce CDSSO automaticamente sul server
- ✅ Mantiene sessione SSO persistente
- ✅ Evita problemi con cookie cross-domain

**Configurazione:**
```bash
# .env
VITE_RVFU_USE_PROXY=true
VITE_RVFU_PROXY_URL=https://rvfu.rescuemanager.eu
```

**Verifica VPS:**
```bash
# SSH sulla VPS
ssh root@217.154.118.37

# Verifica configurazione Nginx per rvfu-proxy
cat /etc/nginx/sites-available/rvfu-proxy

# Verifica che il proxy sia attivo
curl -I http://localhost/rvfu-proxy
```

### Opzione 3: Debug Gestione CDSSO

Aggiungere più log per capire cosa succede:

1. **Verifica se CDSSO viene rilevato:**
   ```javascript
   console.log('[RVFU API Proxy] HTML ricevuto:', text.substring(0, 500));
   console.log('[RVFU API Proxy] È CDSSO?', text.includes('/agent/cdsso-oauth2'));
   ```

2. **Verifica cookie disponibili:**
   ```javascript
   console.log('[RVFU API Proxy] Cookie disponibili:', document.cookie);
   ```

3. **Verifica risposta dopo CDSSO:**
   ```javascript
   console.log('[RVFU API Proxy] Risposta dopo CDSSO:', retryText.substring(0, 500));
   ```

---

## 🧪 Test da Fare

### 1. Verifica Cookie SSO

Nel BrowserWindow, verifica che i cookie siano disponibili:
```javascript
// Nella console del BrowserWindow
document.cookie
// Dovrebbe contenere: iPlanetDirectoryPro=...
```

### 2. Verifica Risposta HTML

Salva la risposta HTML per analizzarla:
```javascript
// In ipc.js, dopo response.text()
console.log('[RVFU API Proxy] HTML completo:', text);
// Salva in un file per analisi
```

### 3. Test Diretto API

Prova a chiamare l'API direttamente con curl (dalla VPS con VPN):
```bash
curl -X GET "https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/concessionario/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA054AJ" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Cookie: iPlanetDirectoryPro=YOUR_COOKIE_VALUE"
```

---

## 📋 Checklist Debug

- [ ] Verificare che i cookie SSO siano disponibili nel BrowserWindow
- [ ] Verificare che il form CDSSO venga rilevato correttamente
- [ ] Verificare che il form CDSSO venga submitato correttamente
- [ ] Verificare che la richiesta originale venga riprovata dopo CDSSO
- [ ] Verificare che i cookie siano disponibili dopo CDSSO
- [ ] Testare con proxy VPS invece di BrowserWindow
- [ ] Verificare configurazione VPS per rvfu-proxy

---

## 🚨 Note Importanti

1. **VPN Attiva**: Anche se hai VPN attiva, CDSSO potrebbe richiedere cookie di sessione che non sono disponibili nella finestra BrowserWindow
2. **Cookie Cross-Domain**: I cookie SSO potrebbero non essere disponibili quando fai fetch() da una pagina caricata
3. **Proxy VPS**: Il proxy VPS gestisce CDSSO automaticamente perché mantiene la sessione SSO sul server

---

**Status:** 🔍 Analisi in corso - Da verificare gestione CDSSO e configurazione VPS
