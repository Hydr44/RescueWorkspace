# 🔐 Specifica OAuth OpenAPI.it - Implementazione

**Data:** 19 gennaio 2026  
**Fonte:** https://console.openapi.com/oas/it/oauth.openapi.json

---

## 📋 Specifica OAuth

### Endpoint Token

**URL:** `POST https://oauth.openapi.it/token`

**Autenticazione:** Basic Auth
- **Header:** `Authorization: Basic <base64(email:APIKey)>`
- **Formato:** `email:APIKey` codificato in base64

**Body (JSON):**
```json
{
  "scopes": [
    "GET:company.openapi.com/IT-start",
    "GET:company.openapi.com/IT-advanced"
  ],
  "ttl": 3600
}
```

**Parametri:**
- `scopes` (array, obbligatorio): Lista di scopes richiesti
- `ttl` (integer, opzionale): Time-to-live in secondi (max 1 anno). Se non specificato, default 1 anno

**Risposta (200 OK):**
```json
{
  "token": "5f8711afe4754a532a7a8358",
  "scopes": ["GET:company.openapi.com/IT-start", "GET:company.openapi.com/IT-advanced"],
  "expire": 1634223407,
  "success": true,
  "message": "",
  "error": null
}
```

**Formato risposta:**
- `token` (string): Token OAuth da usare come Bearer token
- `scopes` (array): Scopes espansi (può includere più di quelli richiesti)
- `expire` (integer): Timestamp UNIX in secondi della scadenza
- `success` (boolean): Esito operazione
- `message` (string): Messaggio opzionale
- `error` (integer|null): Codice errore se presente

---

## 🔧 Implementazione

### Codice Aggiornato

Il file `openapi-company.js` è stato aggiornato per:

1. ✅ **Usare formato corretto risposta OAuth:**
   - `data.token` invece di `data.access_token`
   - `data.expire` (timestamp UNIX in secondi) invece di `data.expires_in`

2. ✅ **Gestione cache token:**
   - Cache in-memory del token
   - Verifica scadenza usando `expire` timestamp
   - Refresh automatico quando scade

3. ✅ **Scopes corretti:**
   - `GET:company.openapi.com/IT-start`
   - `GET:company.openapi.com/IT-advanced`

4. ✅ **TTL configurabile:**
   - Default: 3600 secondi (1 ora)
   - Max: 1 anno secondo specifica

---

## 🧪 Test

### Test 1: Ottenere Token OAuth

```bash
# Sostituisci EMAIL e API_KEY con i tuoi valori
EMAIL="your-email@example.com"
API_KEY="rl8s0sunqebsufrxxzdiwkngzlckm7xm"

# Crea Basic Auth
BASIC_AUTH=$(echo -n "${EMAIL}:${API_KEY}" | base64)

# Richiedi token
curl -X POST "https://oauth.openapi.it/token" \
  -H "Authorization: Basic ${BASIC_AUTH}" \
  -H "Content-Type: application/json" \
  -d '{
    "scopes": [
      "GET:company.openapi.com/IT-start",
      "GET:company.openapi.com/IT-advanced"
    ],
    "ttl": 3600
  }'
```

**Risposta attesa:**
```json
{
  "token": "5f8711afe4754a532a7a8358",
  "scopes": ["GET:company.openapi.com/IT-start", "GET:company.openapi.com/IT-advanced"],
  "expire": 1634223407,
  "success": true,
  "message": "",
  "error": null
}
```

### Test 2: Usare Token per Chiamare API Company

```bash
# Usa il token ottenuto
TOKEN="5f8711afe4754a532a7a8358"

curl -X GET "https://company.openapi.com/IT-start/02166430856" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"
```

---

## 📝 Note Importanti

### Scopes

Gli scopes devono essere nel formato:
- `METODO:dominio/path`
- Esempi:
  - `GET:company.openapi.com/IT-start`
  - `GET:company.openapi.com/IT-advanced`
  - `*:company.openapi.com/*` (wildcard per tutti i metodi)

### TTL

- **Minimo:** Non specificato (usa default)
- **Massimo:** 1 anno (31536000 secondi)
- **Default:** 1 anno se non specificato
- **Consigliato:** 3600 secondi (1 ora) per sicurezza

### Cache Token

- Il token viene cachato in-memory
- Si resetta al refresh pagina
- Verifica scadenza usando `expire` timestamp
- Refresh automatico quando scade

### Basic Auth

- **Formato:** `email:APIKey`
- **Encoding:** Base64
- **Header:** `Authorization: Basic <base64_string>`

---

## 🔒 Sicurezza

### Best Practices

1. ✅ **Non esporre email nel frontend** (consigliato proxy backend)
2. ✅ **Cache token** per ridurre chiamate OAuth
3. ✅ **TTL breve** (1 ora) per limitare validità token
4. ✅ **Verifica scadenza** prima di usare token cached

### Proxy Backend (Consigliato)

**Vantaggi:**
- ✅ Email e API key non esposte nel frontend
- ✅ Gestione OAuth lato server
- ✅ Cache token più robusta (Redis, database)
- ✅ Gestione refresh token automatica

**Implementazione:**
```
Frontend → Proxy Backend (VPS) → OAuth OpenAPI → Token
Frontend → Proxy Backend (VPS) → Company API (con token)
```

---

## ✅ Checklist Implementazione

- [x] Endpoint OAuth corretto (`POST /token`)
- [x] Basic Auth formato corretto (`email:APIKey` base64)
- [x] Body formato corretto (`scopes` array, `ttl` opzionale)
- [x] Parsing risposta corretto (`token`, `expire`, `success`)
- [x] Cache token con verifica scadenza
- [x] Scopes corretti per Company IT
- [x] Fallback se OAuth fallisce
- [x] Gestione errori completa

---

**Status:** ✅ Implementazione completata secondo specifica OAuth

**Documentazione:** https://console.openapi.com/oas/it/oauth.openapi.json
