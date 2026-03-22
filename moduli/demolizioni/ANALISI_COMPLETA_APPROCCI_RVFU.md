# 🔍 Analisi Completa Approcci RVFU - Tutte le Soluzioni Possibili

**Data**: 2026-01-23  
**Problema**: 401 Unauthorized su API REST dopo login riuscito  
**Status**: Login OK ✅, API REST ❌

---

## 📋 SOMMARIO ESECUTIVO

### Situazione Attuale
- ✅ **Login funziona**: Token OAuth2 ricevuti correttamente (`access_token`, `id_token`, `refresh_token`)
- ❌ **API REST fallisce**: 403 Forbidden (non più 401!) su `https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/agenzia/consulta/VFU`
- 🔴 **PROBLEMA CRITICO TROVATO**: Il token JWT ha `audience: 'formazioneAgent'` invece di `AUTODEM.RESCUEMANAGER`!
- ⚠️ **Contraddizione**: Documentazione dice "solo Bearer Token", ma server richiede CDSSO?

### Domande Chiave da Risolvere
1. 🔴 **CRITICO: Perché il token ha audience `formazioneAgent` invece di `AUTODEM.RESCUEMANAGER`?**
2. **Quale token usare per API REST?** (`access_token` vs `id_token`)
3. **Serve CDSSO anche per API REST su `formazione.ilportaledeltrasporto.it`?**
4. **Quale è l'URL corretto per API REST?** (formazione vs serviziaci.it)
5. **Serve una sessione browser attiva anche per API REST?**
6. **Dobbiamo usare `formazioneAgent` come client ID per le API REST?**

---

## 🔄 APPROCCI GIÀ PROVATI

### 1. ❌ `makeRequestDirect` (fetch dal renderer)
**Quando**: Inizialmente  
**Cosa**: Chiamata diretta con `fetch()` dal renderer process  
**Problemi**:
- `ERR_NAME_NOT_RESOLVED` per domini VPN
- CORS issues
- Nessun accesso VPN dal renderer
- HTML invece di JSON (redirect SSO)

**Risultato**: ❌ Fallito

---

### 2. ❌ `makeRequestViaMainProcess` (net.request senza BrowserWindow)
**Quando**: Dopo fix URL  
**Cosa**: `net.request` dal main process, solo Bearer Token, NO navigazione finestra  
**Configurazione**:
- URL: `https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/agenzia/consulta/VFU`
- Token: `access_token` (standard OAuth2)
- Headers: `Authorization: Bearer <access_token>`

**Problemi**:
- 401 Unauthorized
- Server potrebbe richiedere sessione attiva anche per API REST

**Risultato**: ❌ Fallito (401)

---

### 3. ⚠️ `makeRequestViaMainProcess` con navigazione finestra
**Quando**: Ultimo tentativo  
**Cosa**: `net.request` dal main + navigazione finestra persistente per stabilire sessione  
**Configurazione**:
- Naviga finestra a `https://formazione.ilportaledeltrasporto.it` prima della richiesta
- Poi fa `net.request` con Bearer Token

**Problemi**:
- Finestra si apre ma non naviga correttamente
- 401 persiste

**Risultato**: ⚠️ Parzialmente implementato, non testato completamente

---

### 4. ⚠️ `makeRequestViaBrowserWindow` (BrowserWindow con CDSSO)
**Quando**: Attualmente configurato  
**Cosa**: Usa BrowserWindow persistente che gestisce automaticamente CDSSO  
**Configurazione**:
- Finestra persistente naviga all'URL API
- Gestisce automaticamente CDSSO/cookie
- Estrae JSON dalla pagina

**Problemi**:
- Più lento (deve caricare pagina)
- Dipende da rendering HTML
- Potrebbe non funzionare se API restituisce solo JSON

**Risultato**: ⚠️ Non ancora testato completamente

---

## 📚 COSA DICE LA DOCUMENTAZIONE

### Documentazione Ufficiale (`RVFU_API_UFFICIALI.md`)

#### ✅ Endpoint Corretto
```
GET https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/agenzia/consulta/VFU
```

#### ✅ Autenticazione
```
Authorization: Bearer <access_token>
```

#### ❌ Cosa NON fare
- NO cookie di sessione
- NO CDSSO browser
- NO endpoint UI (`/concessionario/veicolo`)

**Fonte**: OpenAPI RVFU.json

---

### Manuale ACI/MIT (`CORREZIONI_RVFU_AUTH.md`)

#### Token per API REST
```
Authorization: Bearer {id_token}
```

**Nota**: Dice `id_token`, non `access_token`!

#### URL API REST
```
http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/...
```

**Nota**: Dice `serviziaci.it`, non `formazione.ilportaledeltrasporto.it`!

**Contraddizione**: La documentazione OpenAPI dice `formazione.ilportaledeltrasporto.it`, il manuale dice `serviziaci.it`

---

## 🎯 TUTTE LE SOLUZIONI POSSIBILI

### SOLUZIONE 1: Usare `id_token` invece di `access_token`

**Ipotesi**: Il manuale dice esplicitamente `id_token` per API REST

**Implementazione**:
```typescript
// In rvfu-client.ts, makeRequestViaMainProcess
authHeader = this.authService.getAuthHeader(false); // false = usa idToken
```

**Pro**: Conforme al manuale ACI/MIT  
**Contro**: Contraddice standard OAuth2 (access_token per API)  
**Priorità**: 🔴 ALTA (da provare subito)

---

### SOLUZIONE 2: Usare URL `serviziaci.it` invece di `formazione.ilportaledeltrasporto.it`

**Ipotesi**: Il manuale dice `serviziaci.it` per API REST

**Implementazione**:
```typescript
// In createRVFUClient
const baseUrl = environment === 'production'
  ? 'https://www.ilportaledeltrasporto.it/demolitori-aci-ws/rest'
  : 'http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest';
```

**Pro**: Conforme al manuale ACI/MIT  
**Contro**: 
- DNS `serviziaci.it` non risolve (`NXDOMAIN`)
- Potrebbe essere solo intranet/VPN
- Contraddice OpenAPI che dice `formazione.ilportaledeltrasporto.it`

**Priorità**: 🟡 MEDIA (da verificare con ACI/MIT)

---

### SOLUZIONE 3: BrowserWindow con CDSSO automatico (già implementato)

**Ipotesi**: Anche API REST su `formazione.ilportaledeltrasporto.it` richiedono sessione attiva

**Implementazione**: Già fatto in `makeRequestViaBrowserWindow`

**Pro**: Gestisce automaticamente CDSSO  
**Contro**: Più lento, dipende da rendering HTML  
**Priorità**: 🟡 MEDIA (da testare completamente)

---

### SOLUZIONE 4: Navigare finestra persistente PRIMA della richiesta API

**Ipotesi**: Serve stabilire sessione attiva prima di chiamare API REST

**Implementazione**: Già parzialmente fatto in `ipc.js` (handler `rvfu:api-call-direct`)

**Miglioramenti possibili**:
- Navigare all'URL base del dominio
- Aspettare che la sessione sia stabilita
- Verificare cookie `am-auth-jwt` o `iPlanetDirectoryPro`
- Poi fare `net.request` con Bearer Token + cookie

**Priorità**: 🟡 MEDIA (da completare implementazione)

---

### SOLUZIONE 5: Usare entrambi i token (access_token + id_token)

**Ipotesi**: Server potrebbe richiedere entrambi

**Implementazione**:
```typescript
headers['Authorization'] = `Bearer ${idToken}`;
headers['X-Access-Token'] = accessToken; // Header custom
```

**Priorità**: 🟢 BASSA (poco probabile)

---

### SOLUZIONE 6: Proxy VPS con VPN

**Ipotesi**: Il server API è raggiungibile solo da rete interna/VPN

**Implementazione**: Già presente in codice (disabilitato)

**Pro**: 
- VPS ha VPN attiva
- Risolve problemi DNS
- Centralizza autenticazione

**Contro**: 
- Richiede VPS con VPN
- Aggiunge latenza
- Complessità aggiuntiva

**Priorità**: 🟡 MEDIA (se altre soluzioni falliscono)

---

### SOLUZIONE 7: Cookie di sessione + Bearer Token

**Ipotesi**: Server richiede sia Bearer Token che cookie di sessione

**Implementazione**:
```typescript
// In ipc.js, rvfu:api-call-direct
// 1. Naviga finestra per ottenere cookie
// 2. Estrai cookie dalla sessione
// 3. Aggiungi cookie header + Bearer Token
request.setHeader('Cookie', cookieHeader);
request.setHeader('Authorization', `Bearer ${token}`);
```

**Priorità**: 🟡 MEDIA (da provare)

---

### SOLUZIONE 8: Usare `id_token` con CDSSO

**Ipotesi**: Serve `id_token` + sessione attiva (CDSSO)

**Implementazione**: Combinare Soluzione 1 + Soluzione 3/4

**Priorità**: 🔴 ALTA (combinazione più probabile)

---

## ❓ DELUCIDAZIONI DA CHIEDERE AD ACI/MIT

### 1. **Quale token per API REST?**
- ✅ `access_token` (standard OAuth2)
- ✅ `id_token` (come dice manuale sezione 5.3 punto 7)
- ❓ Entrambi?
- ❓ Dipende dall'endpoint?

**Fonte da verificare**: Manuale sezione 5.3 punto 7

---

### 2. **Quale URL per API REST in formazione?**
- ✅ `https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest` (OpenAPI)
- ✅ `http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest` (Manuale)
- ❓ Quale è corretto?
- ❓ `serviziaci.it` è solo intranet/VPN?

---

### 3. **Serve CDSSO anche per API REST?**
- ✅ NO (secondo OpenAPI)
- ✅ SÌ (secondo comportamento attuale - 401 senza sessione)
- ❓ Dipende dal dominio?
- ❓ `formazione.ilportaledeltrasporto.it` richiede CDSSO, `serviziaci.it` no?

---

### 4. **Cookie di sessione necessari?**
- ✅ NO (secondo OpenAPI)
- ✅ SÌ (potrebbe essere necessario per `formazione.ilportaledeltrasporto.it`)
- ❓ Quali cookie? (`am-auth-jwt`, `iPlanetDirectoryPro`, altri?)

---

### 5. **Client ID corretto?**
- ✅ `AUTODEM.RESCUEMANAGER` (attualmente usato)
- ❓ È registrato correttamente?
- ❓ Ha permessi per API REST?

---

### 6. **Scope corretti?**
- ✅ `openid profile` (attualmente usato)
- ❓ Serve scope aggiuntivo per API REST?
- ❓ `rvfu` scope esiste?

---

## 🧪 PIANO DI TEST SISTEMATICO

### TEST 1: `id_token` invece di `access_token`
**Priorità**: 🔴 ALTA  
**Tempo**: 5 minuti

```typescript
// Modifica in rvfu-client.ts
authHeader = this.authService.getAuthHeader(false); // false = idToken
```

**Criteri successo**: 
- ✅ Status 200 invece di 401
- ✅ Risposta JSON valida

---

### TEST 2: BrowserWindow con CDSSO
**Priorità**: 🟡 MEDIA  
**Tempo**: 10 minuti

**Già implementato**, ma da testare completamente:
- Verificare che finestra navighi correttamente
- Verificare che CDSSO venga gestito
- Verificare estrazione JSON dalla risposta

---

### TEST 3: Navigazione finestra + `net.request` con cookie
**Priorità**: 🟡 MEDIA  
**Tempo**: 15 minuti

**Implementazione**:
1. Naviga finestra a `https://formazione.ilportaledeltrasporto.it`
2. Aspetta sessione stabilita
3. Estrai cookie dalla sessione
4. Fai `net.request` con Bearer Token + Cookie header

---

### TEST 4: URL `serviziaci.it` (se risolve DNS)
**Priorità**: 🟡 MEDIA  
**Tempo**: 5 minuti

**Prerequisito**: VPN attiva, DNS risolve

```typescript
const baseUrl = 'http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest';
```

---

### TEST 5: Entrambi i token
**Priorità**: 🟢 BASSA  
**Tempo**: 5 minuti

```typescript
headers['Authorization'] = `Bearer ${idToken}`;
headers['X-Access-Token'] = accessToken;
```

---

### TEST 6: Proxy VPS
**Priorità**: 🟡 MEDIA (se altri falliscono)  
**Tempo**: 30 minuti

**Prerequisito**: VPS con VPN configurata

---

## 📊 MATRICE DECISIONALE

| Soluzione | Complessità | Probabilità Successo | Tempo | Priorità |
|-----------|-------------|----------------------|-------|----------|
| 1. `id_token` | Bassa | 🔴 Alta | 5 min | 🔴 ALTA |
| 2. URL `serviziaci.it` | Bassa | 🟡 Media | 5 min | 🟡 MEDIA |
| 3. BrowserWindow CDSSO | Media | 🟡 Media | 10 min | 🟡 MEDIA |
| 4. Finestra + net.request | Media | 🟡 Media | 15 min | 🟡 MEDIA |
| 5. Entrambi token | Bassa | 🟢 Bassa | 5 min | 🟢 BASSA |
| 6. Proxy VPS | Alta | 🟡 Media | 30 min | 🟡 MEDIA |
| 7. Cookie + Bearer | Media | 🟡 Media | 10 min | 🟡 MEDIA |
| 8. `id_token` + CDSSO | Media | 🔴 Alta | 15 min | 🔴 ALTA |

---

## 🔴 PROBLEMA CRITICO TROVATO

### Audience Token JWT
**Problema**: Il token JWT ha `audience: 'formazioneAgent'` invece di `AUTODEM.RESCUEMANAGER`

**Impatto**: Potrebbe essere la causa principale del 403 Forbidden

**Vedi**: `PROBLEMA_AUDIENCE_TOKEN.md` per analisi completa

---

## 🎯 RACCOMANDAZIONE

### Ordine di Test Consigliato

1. 🔴 **CRITICO: Verificare audience token** - Decodificare JWT e verificare `aud` field
2. **TEST 1**: `id_token` invece di `access_token` (5 min) 🔴
3. **TEST 8**: `id_token` + CDSSO (BrowserWindow) (15 min) 🔴
4. **TEST 3**: Navigazione finestra + `net.request` con cookie (15 min) 🟡
5. **TEST 2**: BrowserWindow completo (10 min) 🟡
6. **TEST 7**: Cookie + Bearer Token (10 min) 🟡
7. **TEST 4**: URL `serviziaci.it` (se DNS risolve) (5 min) 🟡
8. **TEST 6**: Proxy VPS (se altri falliscono) (30 min) 🟡

### Se Tutti i Test Falliscono

**Chiedere delucidazioni ad ACI/MIT su**:
1. Quale token per API REST (`access_token` vs `id_token`)
2. Quale URL corretto (`formazione.ilportaledeltrasporto.it` vs `serviziaci.it`)
3. Serve CDSSO anche per API REST?
4. Quali cookie sono necessari?
5. Client ID `AUTODEM.RESCUEMANAGER` è configurato correttamente?

---

## 📝 NOTE FINALI

### Contraddizioni nella Documentazione

1. **Token**: OpenAPI non specifica, manuale dice `id_token`
2. **URL**: OpenAPI dice `formazione.ilportaledeltrasporto.it`, manuale dice `serviziaci.it`
3. **CDSSO**: OpenAPI dice "NO CDSSO", ma comportamento suggerisce il contrario

### Possibili Cause del 401

1. Token sbagliato (`access_token` invece di `id_token`)
2. URL sbagliato (`formazione` invece di `serviziaci.it`)
3. Manca sessione attiva (CDSSO necessario)
4. Manca cookie di sessione
5. Client ID non autorizzato per API REST
6. Scope insufficienti

### Prossimi Passi

1. ✅ Implementare TEST 1 (`id_token`)
2. ✅ Testare TEST 8 (`id_token` + CDSSO)
3. ✅ Se falliscono, chiedere delucidazioni ad ACI/MIT
4. ✅ Documentare risultati per riferimento futuro

---

**Ultimo aggiornamento**: 2026-01-23  
**Prossima revisione**: Dopo test sistematici
