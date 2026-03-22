# 🧪 Guida Test OpenAPI Company IT - Frontend

**Data:** 19 gennaio 2026  
**Scopo:** Verificare che il frontend funzioni correttamente con OpenAPI Company IT

---

## ✅ Checklist Frontend

### 1. **Variabile d'Ambiente Configurata**

**File:** `desktop-app/greeting-friend-api-main/.env`

```bash
# Aggiungi questa riga al file .env (se non esiste, crealo)
VITE_OPENAPI_API_KEY=rl8s0sunqebsufrxxzdiwkngzlckm7xm
```

**⚠️ IMPORTANTE:** 
- Il file `.env` deve essere nella directory `desktop-app/greeting-friend-api-main/`
- Dopo aver aggiunto/modificato `.env`, **riavvia il server di sviluppo**

---

### 2. **File Libreria OpenAPI**

**File:** `desktop-app/greeting-friend-api-main/src/lib/openapi-company.js`

**Status:** ✅ **Completo e aggiornato**

**Endpoint configurati:**
- Base URL: `https://company.openapi.com`
- IT-start: `/IT-start/{vatCode}`
- IT-advanced: `/IT-advanced/{vatCode}`

---

### 3. **Integrazione Frontend**

**File integrati:**
- ✅ `desktop-app/greeting-friend-api-main/src/pages/InvoiceNew.jsx`
- ✅ `desktop-app/greeting-friend-api-main/src/pages/ClientNew.jsx`

**Funzionalità:**
- ✅ Auto-compilazione form quando si inserisce P.IVA
- ✅ Spinner di loading durante verifica
- ✅ Messaggi di stato (valida/sospesa/non trovata)
- ✅ Auto-compilazione: ragione sociale, CF, indirizzo, codice SDI, PEC

---

## 🧪 Test Frontend

### Test 1: Verifica Variabile d'Ambiente

1. **Apri la console del browser** (F12)
2. **Vai a:** "Nuova Fattura" o "Nuovo Cliente"
3. **Inserisci una P.IVA** (es: "02166430856")
4. **Controlla la console:**
   - ✅ Se vedi `[OpenAPI Company] API key non configurata` → variabile d'ambiente mancante
   - ✅ Se vedi `[OpenAPI Company] P.IVA non trovata` → API funziona ma P.IVA non esiste
   - ✅ Se vedi `[OpenAPI Company] Errore HTTP: 401` → API key non valida
   - ✅ Se vedi `[OpenAPI Company] Errore HTTP: 402` → credito insufficiente

---

### Test 2: Test Manuale API

**Opzione A: Browser Console**

1. Apri la console del browser (F12)
2. Esegui questo codice:

```javascript
// Test diretto API
const apiKey = 'rl8s0sunqebsufrxxzdiwkngzlckm7xm';
const vatCode = '02166430856';

fetch(`https://company.openapi.com/IT-start/${vatCode}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Risposta:', data);
  if (data.success && data.data && data.data.length > 0) {
    console.log('✅ Azienda trovata:', data.data[0].companyDetails?.companyName);
  } else {
    console.log('❌ Nessun risultato:', data.message);
  }
})
.catch(error => {
  console.error('❌ Errore:', error);
});
```

**Opzione B: cURL (Terminale)**

```bash
# Test IT-start
curl -X GET "https://company.openapi.com/IT-start/02166430856" \
  -H "Authorization: Bearer rl8s0sunqebsufrxxzdiwkngzlckm7xm" \
  -H "Content-Type: application/json" \
  | jq '.'
```

**Opzione C: Postman/Insomnia**

1. **Method:** GET
2. **URL:** `https://company.openapi.com/IT-start/02166430856`
3. **Headers:**
   - `Authorization: Bearer rl8s0sunqebsufrxxzdiwkngzlckm7xm`
   - `Content-Type: application/json`

---

## 🔍 Come Recuperare/Verificare Endpoint

### Metodo 1: Specifica OpenAPI (Consigliato)

**URL:** https://console.openapi.com/oas/it/company.openapi.json

**Cosa fare:**
1. Apri il link nel browser
2. Cerca la sezione `paths`
3. Verifica gli endpoint:
   - `/IT-start/{vatCode_companyNumber_taxCode_or_id}`
   - `/IT-advanced/{vatCode_companyNumber_taxCode_or_id}`
4. Verifica il formato risposta nella sezione `responses`

**Esempio struttura:**
```json
{
  "paths": {
    "/IT-start/{vatCode_companyNumber_taxCode_or_id}": {
      "get": {
        "summary": "Dati di base",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": { "type": "array" },
                    "success": { "type": "boolean" }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

---

### Metodo 2: Dashboard OpenAPI.it

1. **Vai a:** https://console.openapi.com/it/
2. **Accedi** con le tue credenziali
3. **Vai a:** "API" → "Company"
4. **Clicca su:** "Documentazione" o "Try it out"
5. **Verifica:**
   - Endpoint URL
   - Formato richiesta
   - Formato risposta
   - Esempi di chiamata

---

### Metodo 3: Test Diretto con P.IVA Nota

**P.IVA di test (da verificare nel dashboard OpenAPI):**

```bash
# Test con P.IVA nota (es. la tua)
curl -X GET "https://company.openapi.com/IT-start/02166430856" \
  -H "Authorization: Bearer rl8s0sunqebsufrxxzdiwkngzlckm7xm" \
  -H "Content-Type: application/json"
```

**Risposta attesa:**
```json
{
  "data": [
    {
      "companyDetails": {
        "companyName": "Emmanuel Sal. Scozzarini",
        "vatCode": "IT02166430856",
        "taxCode": "SCZMNL05L21D960T"
      },
      "address": {
        "registeredOffice": {
          "streetName": "Via...",
          "town": "Roma",
          "province": "RM",
          "zipCode": "00100"
        }
      },
      "pec": {
        "pec": "email@pec.it",
        "sdiCode": "T04ZHR3"
      },
      "companyStatus": {
        "activityStatus": "ACTIVE"
      }
    }
  ],
  "success": true,
  "message": "",
  "error": null
}
```

---

## 🐛 Troubleshooting

### Problema: "API key non configurata"

**Causa:** Variabile d'ambiente `VITE_OPENAPI_API_KEY` non trovata

**Soluzione:**
1. Crea/modifica file `.env` in `desktop-app/greeting-friend-api-main/`
2. Aggiungi: `VITE_OPENAPI_API_KEY=rl8s0sunqebsufrxxzdiwkngzlckm7xm`
3. Riavvia il server di sviluppo

---

### Problema: "Errore HTTP: 401"

**Causa:** API key non valida o scaduta

**Soluzione:**
1. Verifica la chiave nel dashboard OpenAPI.it
2. Controlla che non ci siano spazi extra
3. Verifica che la chiave non sia scaduta

---

### Problema: "Errore HTTP: 402"

**Causa:** Credito insufficiente nel wallet OpenAPI

**Soluzione:**
1. Vai al dashboard OpenAPI.it
2. Controlla il saldo del wallet
3. Ricarica se necessario

---

### Problema: "Errore HTTP: 404"

**Causa:** P.IVA non trovata nel database

**Soluzione:**
1. Verifica che la P.IVA sia corretta
2. Prova con una P.IVA nota (es. la tua)
3. Controlla che la P.IVA sia registrata nel Registro Imprese

---

### Problema: "Errore HTTP: 429"

**Causa:** Limite richieste superato

**Soluzione:**
1. Aspetta qualche minuto
2. Verifica il limite nel dashboard OpenAPI.it
3. Considera di implementare un sistema di cache

---

### Problema: "Nessun dato trovato" ma API risponde 200

**Causa:** Formato risposta diverso da quello atteso

**Soluzione:**
1. Controlla la console del browser per la risposta completa
2. Verifica la struttura della risposta nella specifica OpenAPI
3. Aggiorna il parsing in `openapi-company.js` se necessario

---

## 📊 Verifica Completa Frontend

### Checklist Finale

- [ ] File `.env` creato con `VITE_OPENAPI_API_KEY`
- [ ] Server di sviluppo riavviato dopo modifica `.env`
- [ ] Test API diretto funziona (cURL o browser console)
- [ ] Frontend mostra spinner durante verifica P.IVA
- [ ] Frontend auto-compila campi quando P.IVA trovata
- [ ] Frontend mostra messaggi di stato corretti
- [ ] Nessun errore in console del browser

---

## 🎯 Test Completo End-to-End

1. **Avvia l'app:**
   ```bash
   cd desktop-app/greeting-friend-api-main
   npm run dev
   ```

2. **Vai a:** "Nuova Fattura" o "Nuovo Cliente"

3. **Inserisci P.IVA:** "02166430856" (o una P.IVA valida)

4. **Verifica:**
   - ✅ Spinner appare durante verifica
   - ✅ Campi si auto-compilano (nome, indirizzo, codice SDI, PEC)
   - ✅ Messaggio di stato appare (verde/giallo/rosso)
   - ✅ Nessun errore in console

---

## 📝 Note Importanti

1. **CORS:** L'API OpenAPI.it dovrebbe supportare CORS per chiamate dal browser. Se ci sono problemi, potrebbe essere necessario usare un proxy backend.

2. **Rate Limiting:** OpenAPI.it ha limiti di richieste. Implementa cache se necessario.

3. **Sandbox:** Per test, puoi usare `https://test.company.openapi.com` invece di `https://company.openapi.com`

4. **Formato P.IVA:** L'API accetta P.IVA con o senza prefisso "IT". Il codice normalizza automaticamente.

---

**Status:** ✅ Guida completa per test e verifica frontend
