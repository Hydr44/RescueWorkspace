# 🧪 Risultati Test RVFU - Tracciamento Completo

**Data Inizio**: 2026-01-23  
**Obiettivo**: Risolvere 401 Unauthorized su API REST dopo login riuscito

---

## 📊 MATRICE RISULTATI

| Test | Descrizione | Status | Risultato | Note |
|------|-------------|--------|-----------|------|
| TEST 1 | `id_token` invece di `access_token` | 🔄 IN CORSO | - | - |
| TEST 8 | `id_token` + CDSSO (BrowserWindow) | ⏳ PENDING | - | - |
| TEST 3 | Navigazione finestra + `net.request` con cookie | ⏳ PENDING | - | - |
| TEST 2 | BrowserWindow completo con CDSSO | ⏳ PENDING | - | - |
| TEST 7 | Cookie + Bearer Token insieme | ⏳ PENDING | - | - |
| TEST 4 | URL `serviziaci.it` (se DNS risolve) | ⏳ PENDING | - | - |
| TEST 5 | Entrambi i token (`access_token` + `id_token`) | ⏳ PENDING | - | - |

**Legenda**:
- ✅ SUCCESSO: Test passato, problema risolto
- ❌ FALLITO: Test fallito, problema persiste
- ⚠️ PARZIALE: Test parzialmente riuscito, necessari aggiustamenti
- 🔄 IN CORSO: Test attualmente in esecuzione
- ⏳ PENDING: Test non ancora eseguito

---

## 🧪 TEST 1: `id_token` invece di `access_token`

**Priorità**: 🔴 ALTA  
**Tempo stimato**: 5 minuti  
**Status**: 🔄 IN CORSO

### Configurazione
```typescript
// In rvfu-client.ts, makeRequestViaMainProcess
const useIdTokenForAPI = true; // true = id_token
authHeader = this.authService.getAuthHeader(false); // false = usa idToken
```

### Criteri Successo
- ✅ Status 200 invece di 401
- ✅ Risposta JSON valida
- ✅ Dati veicolo presenti nella risposta

### Risultato
**Data Test**: _da compilare_  
**Status**: 🔄 IN CORSO  
**Risultato**: _da compilare_  
**Errori**: _da compilare_  
**Log**: _da compilare_

---

## 🧪 TEST 8: `id_token` + CDSSO (BrowserWindow)

**Priorità**: 🔴 ALTA  
**Tempo stimato**: 15 minuti  
**Status**: ⏳ PENDING

### Configurazione
```typescript
// In rvfu-client.ts, makeRequestViaBrowserWindow
const useIdTokenForCDSSO = true; // true = id_token
authHeader = this.authService.getAuthHeader(false); // false = usa idToken
// + BrowserWindow gestisce CDSSO automaticamente
```

### Criteri Successo
- ✅ Status 200 invece di 401
- ✅ BrowserWindow naviga correttamente
- ✅ CDSSO gestito automaticamente
- ✅ Risposta JSON valida

### Risultato
**Data Test**: _da compilare_  
**Status**: ⏳ PENDING  
**Risultato**: _da compilare_  
**Errori**: _da compilare_  
**Log**: _da compilare_

---

## 🧪 TEST 3: Navigazione finestra + `net.request` con cookie

**Priorità**: 🟡 MEDIA  
**Tempo stimato**: 15 minuti  
**Status**: ⏳ PENDING

### Configurazione
```typescript
// In ipc.js, rvfu:api-call-direct
// 1. Naviga finestra a base URL
// 2. Estrai cookie dalla sessione
// 3. Fai net.request con Bearer Token + Cookie header
request.setHeader('Cookie', cookieHeader);
request.setHeader('Authorization', `Bearer ${token}`);
```

### Criteri Successo
- ✅ Status 200 invece di 401
- ✅ Cookie estratti correttamente
- ✅ Cookie + Bearer Token inviati insieme
- ✅ Risposta JSON valida

### Risultato
**Data Test**: _da compilare_  
**Status**: ⏳ PENDING  
**Risultato**: _da compilare_  
**Errori**: _da compilare_  
**Log**: _da compilare_

---

## 🧪 TEST 2: BrowserWindow completo con CDSSO

**Priorità**: 🟡 MEDIA  
**Tempo stimato**: 10 minuti  
**Status**: ⏳ PENDING

### Configurazione
- Usa `makeRequestViaBrowserWindow` già implementato
- Verifica che CDSSO venga gestito correttamente
- Verifica estrazione JSON dalla risposta

### Criteri Successo
- ✅ Status 200 invece di 401
- ✅ Finestra naviga correttamente
- ✅ CDSSO gestito automaticamente
- ✅ JSON estratto correttamente dalla pagina

### Risultato
**Data Test**: _da compilare_  
**Status**: ⏳ PENDING  
**Risultato**: _da compilare_  
**Errori**: _da compilare_  
**Log**: _da compilare_

---

## 🧪 TEST 7: Cookie + Bearer Token insieme

**Priorità**: 🟡 MEDIA  
**Tempo stimato**: 10 minuti  
**Status**: ⏳ PENDING

### Configurazione
```typescript
// In ipc.js, rvfu:api-call-direct
// Estrai cookie dalla sessione + usa Bearer Token
request.setHeader('Cookie', cookieHeader);
request.setHeader('Authorization', `Bearer ${token}`);
```

### Criteri Successo
- ✅ Status 200 invece di 401
- ✅ Cookie + Bearer Token inviati insieme
- ✅ Risposta JSON valida

### Risultato
**Data Test**: _da compilare_  
**Status**: ⏳ PENDING  
**Risultato**: _da compilare_  
**Errori**: _da compilare_  
**Log**: _da compilare_

---

## 🧪 TEST 4: URL `serviziaci.it` (se DNS risolve)

**Priorità**: 🟡 MEDIA  
**Tempo stimato**: 5 minuti  
**Status**: ⏳ PENDING

### Configurazione
```typescript
// In createRVFUClient
const useServiziaciUrl = true; // true = prova serviziaci.it
const baseUrl = useServiziaciUrl
  ? 'http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest'
  : 'https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest';
```

### Prerequisiti
- VPN attiva
- DNS risolve `serviziaci.it`

### Criteri Successo
- ✅ DNS risolve correttamente
- ✅ Status 200 invece di 401
- ✅ Risposta JSON valida

### Risultato
**Data Test**: _da compilare_  
**Status**: ⏳ PENDING  
**Risultato**: _da compilare_  
**Errori**: _da compilare_  
**Log**: _da compilare_

---

## 🧪 TEST 5: Entrambi i token (`access_token` + `id_token`)

**Priorità**: 🟢 BASSA  
**Tempo stimato**: 5 minuti  
**Status**: ⏳ PENDING

### Configurazione
```typescript
// In rvfu-client.ts, makeRequestViaMainProcess
headers['Authorization'] = `Bearer ${idToken}`;
headers['X-Access-Token'] = accessToken; // Header custom
```

### Criteri Successo
- ✅ Status 200 invece di 401
- ✅ Entrambi i token inviati
- ✅ Risposta JSON valida

### Risultato
**Data Test**: _da compilare_  
**Status**: ⏳ PENDING  
**Risultato**: _da compilare_  
**Errori**: _da compilare_  
**Log**: _da compilare_

---

## 📝 NOTE GENERALI

### Log da Catturare per Ogni Test
1. **Request**:
   - URL completo
   - Headers (con token mascherati)
   - Method
   - Body (se presente)

2. **Response**:
   - Status code
   - Status message
   - Headers
   - Body (primi 1000 caratteri se HTML, completo se JSON)

3. **Errori**:
   - Messaggio errore completo
   - Stack trace (se disponibile)
   - Codice errore (se disponibile)

### Come Compilare i Risultati

Per ogni test, compilare:
```markdown
### Risultato
**Data Test**: 2026-01-23 HH:MM
**Status**: ✅ SUCCESSO / ❌ FALLITO / ⚠️ PARZIALE
**Risultato**: 
- Status code: 200 / 401 / altro
- Risposta: JSON valido / HTML / errore
- Dati: veicolo trovato / non trovato / errore

**Errori**: 
- Nessuno / Lista errori

**Log**: 
- [Incollare log rilevanti]
```

---

## 🎯 CONCLUSIONI

**Test Riusciti**: _da compilare_  
**Test Falliti**: _da compilare_  
**Soluzione Finale**: _da compilare_  
**Prossimi Passi**: _da compilare_

---

**Ultimo aggiornamento**: 2026-01-23  
**Prossima revisione**: Dopo ogni test
