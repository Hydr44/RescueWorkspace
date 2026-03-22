# RENTRI Polling - Verifica Completa Flusso

**Data**: 11 Gennaio 2026  
**Problema**: 401 durante polling transazione movimenti RENTRI

---

## 📋 **FLUSSO SECONDO MANUALI RENTRI**

### **1. Trasmissione Movimenti** ✅ **FUNZIONA**
- **Endpoint**: `POST /dati-registri/v1.0/operatore/{identificativo_registro}/movimenti`
- **Pattern**: NONBLOCK_PULL_REST (asincrono)
- **Risposta**: `transazione_id` (GUID)
- **Autenticazione**: Pattern AgID ID_AUTH_REST_02 (JWT dinamico)
- **Integrità**: Pattern AgID INTEGRITY_REST_01 (Digest + JWT signature)

**Status**: ✅ Funziona correttamente (vedi log: transazione ID `6abfa698-d2e0-4734-8ffa-39c4fc782653`)

---

### **2. Polling Stato Transazione** ⚠️ **PROBLEMA 401**

#### **Secondo Manuale RENTRI:**
- **Endpoint**: `GET /dati-registri/v1.0/{transazione_id}/status`
- **Autenticazione**: Richiesta (pattern AgID ID_AUTH_REST_02)
- **Risposte possibili**:
  - `200 OK`: Elaborazione ancora in corso
  - `303 See Other`: Elaborazione completata (header `Location` contiene URL per `/result`)
  - `4xx/5xx`: Errori

#### **Implementazione Attuale:**
```typescript
// File: website/src/app/api/rentri/registri/transazioni/[id]/status/route.ts
const rentriUrl = `${RENTRI_BASE_URL}/dati-registri/v1.0/${transazioneId}/status`;

const rentriResponse = await fetch(rentriUrl, {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${jwtAuth}`,
    "Content-Type": "application/json"
  },
  signal: AbortSignal.timeout(30000)
});
```

**Verifica**:
- ✅ Path endpoint: Corretto (`/dati-registri/v1.0/{transazione_id}/status`)
- ✅ Metodo: GET (corretto)
- ✅ Header Authorization: Presente (Bearer JWT)
- ⚠️ **Problema**: JWT non viene generato (401 PRIMA della generazione JWT)

---

## 🔍 **ANALISI PROBLEMA**

### **Log Analisi:**
```
2026-01-11 17:27:10.313 [info] Trasmissione OK - Transazione ID: 6abfa698-d2e0-4734-8ffa-39c4fc782653

401  ← ERRORE QUI

2026-01-11 17:27:12.717 [info] [RENTRI-JWT] JWT generato ← DOPO l'errore 401
```

**Interpretazione**:
- Il 401 arriva PRIMA che il JWT venga generato
- Questo significa che l'endpoint `/status` non riesce a trovare/generare il certificato
- La generazione JWT avviene DOPO (probabilmente da un retry o da un'altra chiamata)

### **Cause Possibili:**

1. **Certificato non trovato nel database**
   - Query: `org_id`, `environment`, `is_active=true`, `is_default=true`
   - **Fix applicato**: Rendere `is_default` opzionale (cerca prima `is_default=true`, poi primo attivo)
   - **Status**: ✅ Modifiche committate, ma potrebbe non essere ancora deployato su Vercel

2. **RENTRI_BASE_URL errato**
   - Attuale: `RENTRI_GATEWAY_URL || 'https://rentri-test.rescuemanager.eu'`
   - Reverse proxy: `rentri-test.rescuemanager.eu` → `demoapi.rentri.gov.it`
   - **Verifica**: Reverse proxy funziona (vedi log nginx)

3. **Autenticazione diversa per polling**
   - Manuale dice: "richiede autenticazione" (stesso pattern della trasmissione)
   - **Verifica**: Pattern AgID ID_AUTH_REST_02 (JWT dinamico) - dovrebbe essere lo stesso

4. **Endpoint non disponibile su ambiente DEMO**
   - Manuale dice: endpoint disponibile
   - **Verifica**: Endpoint dovrebbe essere disponibile

---

## ✅ **CHECKLIST VERIFICA COMPLETA**

### **1. Endpoint Path** ✅
- [x] Path corretto: `/dati-registri/v1.0/{transazione_id}/status`
- [x] Nessun prefisso `/operatore/` (come da manuale)
- [x] RENTRI_BASE_URL corretto: `https://rentri-test.rescuemanager.eu`

### **2. Autenticazione** ⚠️
- [x] Header `Authorization: Bearer {jwt}` presente
- [x] Pattern AgID ID_AUTH_REST_02 (JWT dinamico)
- [x] Stesso pattern usato per trasmissione (che funziona)
- [ ] **Problema**: JWT non viene generato (certificato non trovato?)

### **3. Certificato RENTRI** ⚠️
- [x] Query certificato: `org_id`, `environment`, `is_active=true`
- [x] **Fix applicato**: `is_default` reso opzionale
- [ ] Certificato esiste nel database per l'org_id/environment usato?
- [ ] Certificato ha `is_active=true`?

### **4. Reverse Proxy** ✅
- [x] Nginx reverse proxy configurato
- [x] `rentri-test.rescuemanager.eu` → `demoapi.rentri.gov.it`
- [x] Certificati mTLS configurati
- [x] Log nginx mostrano chiamate funzionanti

### **5. Pattern NONBLOCK_PULL_REST** ✅
- [x] Trasmissione asincrona (OK)
- [x] Polling status implementato
- [x] Polling result implementato
- [x] Gestione 200 (in_elaborazione) e 303 (completata)

---

## 🔧 **SOLUZIONI APPLICATE**

### **Fix 1: Certificato Query - is_default opzionale** ✅
**File modificati**:
- `website/src/app/api/rentri/registri/create/route.ts`
- `website/src/app/api/rentri/registri/transazioni/[id]/status/route.ts`
- `website/src/app/api/rentri/registri/transazioni/[id]/result/route.ts`
- `website/src/app/api/rentri/registri/[id]/movimenti/route.ts`

**Logica**:
1. Prova prima a trovare certificato con `is_default=true`
2. Se non trovato, prende il primo certificato attivo (`is_active=true`)
3. Se ancora non trovato, restituisce 404

**Commit**: `fd46b9ee fix: RENTRI certificato query - rende is_default opzionale`

---

## ⚠️ **PROSSIMI PASSI**

1. **Verificare deploy su Vercel**
   - Le modifiche sono state committate, ma potrebbero non essere ancora deployate
   - Attendere deploy automatico o verificare su Vercel dashboard

2. **Verificare certificato nel database**
   - Controllare che esista un certificato per l'`org_id` e `environment` usati
   - Verificare che il certificato abbia `is_active=true`
   - Se multipli certificati, assicurarsi che uno abbia `is_default=true` o che almeno uno sia attivo

3. **Test dopo deploy**
   - Riprovare trasmissione movimento
   - Verificare che il polling funzioni senza 401

4. **Verifica manuale endpoint RENTRI**
   - Se il problema persiste, verificare direttamente con curl/Postman
   - Testare endpoint status con JWT valido generato manualmente

---

## 📚 **RIFERIMENTI MANUALI**

- Manuale: `API anagrafiche - Flussi Operativi Registri`
- Endpoint status: `GET /dati-registri/v1.0/{transazione_id}/status`
- Pattern autenticazione: AgID ID_AUTH_REST_02
- Pattern integrità: AgID INTEGRITY_REST_01 (solo per POST, non per GET status)

---

**Nota**: Il problema sembra essere legato alla ricerca del certificato durante il polling. Le modifiche applicate dovrebbero risolverlo, ma serve verificare che:
1. Le modifiche siano deployate su Vercel
2. Il certificato esista nel database con i criteri corretti

