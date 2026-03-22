# 📋 Analisi Specifica OpenAPI Company IT

**Data:** 19 gennaio 2026  
**Fonte:** https://console.openapi.com/oas/it/company.openapi.json

---

## 🔍 Informazioni dalla Specifica OpenAPI

### Server Base

- **Produzione:** `https://company.openapi.com`
- **Sandbox (Test):** `https://test.company.openapi.com`

### Autenticazione

- **Tipo:** Bearer Token
- **Header:** `Authorization: Bearer <token>`
- **Formato:** `Bearer rl8s0sunqebsufrxxzdiwkngzlckm7xm`

---

## 📍 Endpoint per Italia

### 1. **IT-start** - Dati di Base

**Endpoint:** `GET /IT-start/{vatCode_companyNumber_taxCode_or_id}`

**Descrizione:** Restituisce informazioni di base di un'azienda (nome, indirizzo, stato)

**Parametro:**
- `vatCode_companyNumber_taxCode_or_id`: P.IVA, numero azienda, codice fiscale o ID

**Esempio:**
```
GET https://company.openapi.com/IT-start/02166430856
Authorization: Bearer rl8s0sunqebsufrxxzdiwkngzlckm7xm
```

**Risposta (200 OK):**
```json
{
  "data": [
    {
      "id": "...",
      "lastUpdateTimestamp": 1234567890,
      "companyDetails": {
        "companyName": "Emmanuel Sal. Scozzarini",
        "vatCode": "IT02166430856",
        "taxCode": "SCZMNL05L21D960T",
        "legalForm": "Ditta Individuale",
        "rea": "RM-123456"
      },
      "address": {
        "registeredOffice": {
          "streetName": "Via...",
          "streetNumber": "123",
          "town": "Roma",
          "province": "RM",
          "zipCode": "00100",
          "country": "IT"
        }
      },
      "companyStatus": {
        "activityStatus": "ACTIVE"
      },
      "pec": {
        "pec": "email@pec.it",
        "sdiCode": "T04ZHR3"
      }
    }
  ],
  "success": true,
  "message": "",
  "error": null
}
```

---

### 2. **IT-advanced** - Dati Avanzati

**Endpoint:** `GET /IT-advanced/{vatCode_companyNumber_taxCode_or_id}`

**Descrizione:** Restituisce informazioni avanzate (bilancio, soci, dipendenti, etc.)

**Parametro:**
- `vatCode_companyNumber_taxCode_or_id`: P.IVA, numero azienda, codice fiscale o ID

**Esempio:**
```
GET https://company.openapi.com/IT-advanced/02166430856
Authorization: Bearer rl8s0sunqebsufrxxzdiwkngzlckm7xm
```

**Risposta:** Include tutti i dati di `IT-start` più dati finanziari, soci, etc.

---

## 📊 Struttura Risposta

### Formato Generale

```json
{
  "data": [ /* Array di oggetti azienda */ ],
  "success": boolean,
  "message": string,
  "error": integer | null
}
```

### Struttura Oggetto Azienda (IT-start)

```json
{
  "id": "string",
  "lastUpdateTimestamp": number,
  "companyDetails": {
    "companyName": "string",
    "vatCode": "string",
    "taxCode": "string",
    "legalForm": "string",
    "rea": "string"
  },
  "address": {
    "registeredOffice": {
      "streetName": "string",
      "streetNumber": "string",
      "town": "string",
      "province": "string",
      "zipCode": "string",
      "country": "string"
    }
  },
  "companyStatus": {
    "activityStatus": "ACTIVE" | "SUSPENDED" | "CEASED" | etc.
  },
  "pec": {
    "pec": "string",
    "sdiCode": "string"
  }
}
```

---

## 🔧 Codice Aggiornato

Il file `openapi-company.js` è stato aggiornato con:

1. ✅ **URL base corretto:** `https://company.openapi.com`
2. ✅ **Endpoint corretto:** `/IT-start/{vatCode}` e `/IT-advanced/{vatCode}`
3. ✅ **Parsing risposta:** Gestisce formato `{ data: [...], success: boolean }`
4. ✅ **Mapping campi:** Estrae dati da `companyDetails`, `address`, `pec`, `companyStatus`

---

## 🧪 Test Endpoint

### Test con cURL

```bash
# Test IT-start
curl -X GET "https://company.openapi.com/IT-start/02166430856" \
  -H "Authorization: Bearer rl8s0sunqebsufrxxzdiwkngzlckm7xm" \
  -H "Content-Type: application/json"
```

### Risposta Attesa

```json
{
  "data": [
    {
      "companyDetails": {
        "companyName": "...",
        "vatCode": "IT02166430856",
        "taxCode": "..."
      },
      "address": {
        "registeredOffice": {
          "streetName": "...",
          "town": "...",
          "province": "...",
          "zipCode": "..."
        }
      },
      "pec": {
        "pec": "...",
        "sdiCode": "..."
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

## ⚠️ Codici di Errore

| Codice | Significato | Azione |
|--------|-------------|--------|
| **200** | OK | Dati recuperati con successo |
| **204** | Nessun contenuto | Nessun risultato trovato |
| **400** | Bad Request | Parametro non valido |
| **401** | Unauthorized | Token non valido o scaduto |
| **402** | Payment Required | Credito insufficiente nel wallet |
| **404** | Not Found | P.IVA non trovata |
| **406** | Not Acceptable | Formato P.IVA non valido |
| **417** | Expectation Failed | Servizio temporaneamente non disponibile |
| **429** | Too Many Requests | Limite richieste superato |

---

## 📝 Note Importanti

1. **Formato P.IVA:**
   - Accetta P.IVA con o senza prefisso "IT"
   - Accetta anche codice fiscale o numero azienda
   - Normalizza automaticamente nel codice

2. **Risposta Array:**
   - `data` è sempre un array (anche se un solo risultato)
   - Prendere `data[0]` per il primo risultato

3. **Timestamp:**
   - `lastUpdateTimestamp` indica quando i dati sono stati aggiornati
   - Utile per cache e validazione

4. **Stato Attività:**
   - `activityStatus` può essere: `ACTIVE`, `SUSPENDED`, `CEASED`, etc.
   - Verificare sempre questo campo per warning

---

## ✅ Checklist Implementazione

- [x] URL base corretto (`https://company.openapi.com`)
- [x] Endpoint corretto (`/IT-start/{vatCode}`)
- [x] Autenticazione Bearer token
- [x] Parsing formato risposta (`data` array)
- [x] Mapping campi (`companyDetails`, `address`, `pec`, `companyStatus`)
- [x] Gestione errori (401, 402, 404, 429, etc.)
- [x] Normalizzazione P.IVA
- [x] Fallback se API non disponibile

---

**Status:** ✅ Specifica analizzata e codice aggiornato

**Documentazione:** https://console.openapi.com/oas/it/company.openapi.json
