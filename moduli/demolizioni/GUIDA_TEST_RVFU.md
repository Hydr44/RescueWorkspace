# 🧪 Guida Completa ai Test RVFU

**Data**: 2026-01-23  
**Obiettivo**: Testare tutte le soluzioni possibili per risolvere 401 Unauthorized

---

## 🎯 OVERVIEW

Tutti i test sono stati implementati nel codice con flag di configurazione. Per attivare ogni test, modifica i flag in `rvfu-client.ts` e `ipc.js`.

---

## 🧪 TEST 1: `id_token` invece di `access_token`

**File**: `desktop-app/greeting-friend-api-main/src/lib/rvfu-client.ts`  
**Linea**: ~385  
**Status**: ✅ IMPLEMENTATO E ATTIVO

### Configurazione Attuale
```typescript
const useIdTokenForAPI = true; // true = id_token (ATTIVO)
```

### Come Testare
1. **Attivo di default** - Il test è già attivo
2. Prova a fare una ricerca veicolo
3. Verifica nei log: `🧪 TEST 1: Usando id_token per API REST`
4. Controlla se ricevi 200 invece di 401

### Cosa Cambiare per Disattivare
```typescript
const useIdTokenForAPI = false; // false = access_token (standard OAuth2)
```

### Risultato Atteso
- ✅ Status 200
- ✅ Risposta JSON con dati veicolo
- ❌ Se fallisce: 401 Unauthorized

---

## 🧪 TEST 8: `id_token` + CDSSO (BrowserWindow)

**File**: `desktop-app/greeting-friend-api-main/src/lib/rvfu-client.ts`  
**Linea**: ~265, ~519  
**Status**: ✅ IMPLEMENTATO E ATTIVO

### Configurazione Attuale
```typescript
// In makeRequest (linea ~265)
const needsCDSSO = isPortalUI && isOfficialAPI; // true per formazione.ilportaledeltrasporto.it

// In makeRequestViaBrowserWindow (linea ~519)
const useIdTokenForCDSSO = true; // true = id_token (ATTIVO)
```

### Come Testare
1. **Attivo di default** per API REST su `formazione.ilportaledeltrasporto.it`
2. Prova a fare una ricerca veicolo
3. Verifica nei log: `🧪 TEST 8: Usando id_token per API REST con CDSSO`
4. Verifica che la finestra persistente navighi
5. Controlla se ricevi 200 invece di 401

### Cosa Cambiare per Disattivare
```typescript
const useIdTokenForCDSSO = false; // false = access_token
```

### Risultato Atteso
- ✅ Status 200
- ✅ Finestra persistente naviga correttamente
- ✅ CDSSO gestito automaticamente
- ✅ Risposta JSON con dati veicolo

---

## 🧪 TEST 3: Navigazione finestra + `net.request` con cookie

**File**: `desktop-app/greeting-friend-api-main/electron/ipc.js`  
**Linea**: ~4117, ~4299  
**Status**: ✅ IMPLEMENTATO E ATTIVO

### Configurazione Attuale
```typescript
// In rvfu:api-call-direct (linea ~4117)
const needsSession = isAPIRest && isFormazioneDomain; // true per API REST su formazione

// Cookie aggiunto automaticamente (linea ~4299)
if (cookieHeader) {
  request.setHeader('Cookie', cookieHeader);
  console.log('[RVFU IPC API Direct] 🧪 TEST 3: Cookie header aggiunto');
}
```

### Come Testare
1. **Attivo di default** per API REST su `formazione.ilportaledeltrasporto.it`
2. Prova a fare una ricerca veicolo
3. Verifica nei log del main process (terminale):
   - `🧪 TEST 3: Cookie header aggiunto`
   - `🧪 TEST 3: Usando Bearer Token + Cookie insieme`
4. Controlla se ricevi 200 invece di 401

### Risultato Atteso
- ✅ Status 200
- ✅ Cookie estratti dalla sessione
- ✅ Cookie + Bearer Token inviati insieme
- ✅ Risposta JSON con dati veicolo

---

## 🧪 TEST 2: BrowserWindow completo con CDSSO

**File**: `desktop-app/greeting-friend-api-main/src/lib/rvfu-client.ts`  
**Linea**: ~492  
**Status**: ✅ IMPLEMENTATO (già attivo per API REST su formazione)

### Configurazione Attuale
- Attivo automaticamente quando `needsCDSSO = true` (linea ~265)

### Come Testare
1. **Già attivo** per API REST su `formazione.ilportaledeltrasporto.it`
2. Stesso di TEST 8 (sono combinati)

### Risultato Atteso
- ✅ Status 200
- ✅ BrowserWindow gestisce CDSSO
- ✅ Risposta JSON estratta dalla pagina

---

## 🧪 TEST 7: Cookie + Bearer Token insieme

**File**: `desktop-app/greeting-friend-api-main/electron/ipc.js`  
**Linea**: ~4299  
**Status**: ✅ IMPLEMENTATO E ATTIVO (stesso di TEST 3)

### Configurazione Attuale
- Attivo automaticamente in `rvfu:api-call-direct` quando ci sono cookie disponibili

### Come Testare
1. **Attivo di default** quando ci sono cookie nella sessione
2. Stesso di TEST 3 (sono combinati)

### Risultato Atteso
- ✅ Status 200
- ✅ Cookie + Bearer Token inviati insieme
- ✅ Risposta JSON con dati veicolo

---

## 🧪 TEST 4: URL `serviziaci.it` (se DNS risolve)

**File**: `desktop-app/greeting-friend-api-main/src/lib/rvfu-client.ts`  
**Linea**: ~824  
**Status**: ✅ IMPLEMENTATO (disattivato di default)

### Configurazione Attuale
```typescript
const useServiziaciUrl = false; // false = formazione (ATTIVO), true = serviziaci.it
```

### Come Testare
1. **Attiva VPN** (se necessario)
2. **Modifica flag**:
   ```typescript
   const useServiziaciUrl = true; // Attiva TEST 4
   ```
3. Prova a fare una ricerca veicolo
4. Verifica nei log: `🧪 TEST 4: Usando URL serviziaci.it`
5. Controlla se DNS risolve (altrimenti vedrai `ERR_NAME_NOT_RESOLVED`)

### Prerequisiti
- ✅ VPN attiva
- ✅ DNS risolve `gestione-veicolo-fuoriuso-tst.serviziaci.it`

### Risultato Atteso
- ✅ DNS risolve correttamente
- ✅ Status 200 (se server raggiungibile)
- ❌ Se DNS non risolve: `ERR_NAME_NOT_RESOLVED`

---

## 🧪 TEST 5: Entrambi i token (`access_token` + `id_token`)

**File**: `desktop-app/greeting-friend-api-main/src/lib/rvfu-client.ts`  
**Linea**: ~385  
**Status**: ✅ IMPLEMENTATO (disattivato di default)

### Configurazione Attuale
```typescript
const useBothTokens = false; // false = solo id_token (ATTIVO), true = entrambi
```

### Come Testare
1. **Modifica flag**:
   ```typescript
   const useBothTokens = true; // Attiva TEST 5
   ```
2. Prova a fare una ricerca veicolo
3. Verifica nei log: `🧪 TEST 5: Usando ENTRAMBI i token (id_token + access_token)`
4. Controlla headers nella richiesta:
   - `Authorization: Bearer <id_token>`
   - `X-Access-Token: <access_token>`

### Risultato Atteso
- ✅ Status 200
- ✅ Entrambi i token inviati
- ✅ Risposta JSON con dati veicolo

---

## 📋 ORDINE DI TEST CONSIGLIATO

### Fase 1: Test ad Alta Priorità (già attivi)
1. ✅ **TEST 1**: `id_token` invece di `access_token` (ATTIVO)
2. ✅ **TEST 8**: `id_token` + CDSSO (ATTIVO)
3. ✅ **TEST 3**: Cookie + Bearer Token (ATTIVO)

**Azione**: Prova subito una ricerca veicolo e verifica i risultati.

---

### Fase 2: Se Fase 1 Fallisce
4. 🧪 **TEST 5**: Attiva `useBothTokens = true`
5. 🧪 **TEST 4**: Attiva `useServiziaciUrl = true` (se VPN disponibile)

---

## 🔍 COME VERIFICARE I RISULTATI

### Log da Cercare

#### Nel Renderer (Console Browser)
```
[RVFU Client] 🧪 TEST 1: Usando id_token per API REST
[RVFU Client] 🧪 TEST 8: Usando id_token per API REST con CDSSO
[RVFU Client] Request via Main Process (net.request): {...}
[RVFU Client] ✅ JSON parsato: {...}
```

#### Nel Main Process (Terminale)
```
[RVFU IPC API Direct] 🧪 TEST 3: Cookie header aggiunto
[RVFU IPC API Direct] 🧪 TEST 3: Usando Bearer Token + Cookie insieme
[RVFU IPC API Direct] 📥 Risposta ricevuta: {statusCode: 200, ...}
```

### Criteri di Successo

✅ **SUCCESSO**:
- Status code: `200`
- Content-Type: `application/json`
- Risposta contiene dati veicolo

❌ **FALLITO**:
- Status code: `401` (Unauthorized)
- Status code: `403` (Forbidden)
- Content-Type: `text/html` (redirect SSO)
- Errore: `ERR_NAME_NOT_RESOLVED` (DNS)

---

## 📝 COMPILARE RISULTATI

Dopo ogni test, compila `TEST_RESULTS_RVFU.md` con:
1. Data e ora del test
2. Status (✅/❌/⚠️)
3. Risultato dettagliato
4. Log rilevanti
5. Note aggiuntive

---

## 🎯 PROSSIMI PASSI

1. **Esegui TEST 1, 8, 3** (già attivi) → Prova ricerca veicolo
2. **Compila risultati** in `TEST_RESULTS_RVFU.md`
3. **Se falliscono**, prova TEST 5 e TEST 4
4. **Se tutti falliscono**, usa `DOMANDE_ACI_MIT_RVFU.md` per contattare ACI/MIT

---

**Ultimo aggiornamento**: 2026-01-23  
**Prossima revisione**: Dopo esecuzione test
