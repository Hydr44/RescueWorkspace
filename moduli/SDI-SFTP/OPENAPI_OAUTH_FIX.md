# 🔐 Fix Autenticazione OpenAPI.it - OAuth Token

**Data:** 19 gennaio 2026  
**Problema:** Errore 401 Unauthorized - La chiave API non può essere usata direttamente

---

## 🔍 Problema Identificato

L'errore `401 Unauthorized` indica che:
- ❌ La chiave API **non può essere usata direttamente** come Bearer token
- ✅ Serve **ottenere un token OAuth** prima di chiamare l'API Company

---

## ✅ Soluzione: OAuth Token Flow

### Step 1: Ottenere Token OAuth

**Endpoint OAuth:**
```
POST https://oauth.openapi.it/token
```

**Headers:**
```
Authorization: Basic <base64(email:APIKey)>
Content-Type: application/json
```

**Body:**
```json
{
  "scopes": ["GET:company.openapi.com/IT-start"],
  "ttl": 3600
}
```

**Risposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Step 2: Usare Token OAuth nelle Chiamate API

**Endpoint Company:**
```
GET https://company.openapi.com/IT-start/02166430856
```

**Headers:**
```
Authorization: Bearer <access_token_ottenuto>
Content-Type: application/json
```

---

## 🔧 Implementazione

### Opzione 1: Token OAuth nel Frontend (Semplice)

**Problema:** Richiede email + API key nel frontend (non ideale per sicurezza)

**Soluzione:** Usare un proxy backend che gestisce OAuth

### Opzione 2: Proxy Backend (Consigliato)

**Vantaggi:**
- ✅ Chiavi API non esposte nel frontend
- ✅ Gestione token OAuth lato server
- ✅ Cache token per ridurre chiamate OAuth
- ✅ Gestione refresh token automatica

**Architettura:**
```
Frontend → Proxy Backend (VPS) → OAuth OpenAPI → Token
Frontend → Proxy Backend (VPS) → Company API (con token)
```

---

## 📝 Note Importanti

1. **Email per OAuth:**
   - Serve l'email associata all'account OpenAPI.it
   - Non è la stessa della chiave API

2. **Scopes:**
   - `GET:company.openapi.com/IT-start` - per dati base
   - `GET:company.openapi.com/IT-advanced` - per dati avanzati

3. **TTL Token:**
   - Default: 3600 secondi (1 ora)
   - Implementare refresh automatico

4. **Rate Limiting:**
   - Limitare chiamate OAuth (cache token)
   - Evitare di richiedere token ad ogni chiamata

---

## 🚀 Prossimi Passi

1. **Verificare email account OpenAPI.it**
2. **Implementare proxy backend OAuth** (consigliato)
3. **Oppure:** Usare token OAuth direttamente nel frontend (meno sicuro)

---

**Status:** ⚠️ Richiede implementazione OAuth token flow
