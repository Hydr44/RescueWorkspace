# 🔐 Fix Errore 401 OpenAPI.it

**Data:** 19 gennaio 2026  
**Problema:** `401 Unauthorized` quando si chiama l'API Company

---

## 🔍 Problema

L'errore `401 Unauthorized` indica che:
- ❌ La chiave API **non può essere usata direttamente** come Bearer token
- ✅ Serve **ottenere un token OAuth** prima di chiamare l'API

---

## ✅ Soluzione Implementata

### Opzione 1: Token OAuth (Consigliato)

Se hai l'**email** associata all'account OpenAPI.it:

1. **Aggiungi al `.env`:**
   ```bash
   VITE_OPENAPI_API_KEY=rl8s0sunqebsufrxxzdiwkngzlckm7xm
   VITE_OPENAPI_EMAIL=your-email@example.com
   ```

2. **Il sistema:**
   - Ottiene automaticamente un token OAuth usando email + API key
   - Usa il token OAuth per chiamare l'API Company
   - Cache del token (1 ora) per ridurre chiamate OAuth

### Opzione 2: Chiave come Token Diretto

Se la chiave fornita è **già un token OAuth valido**:

1. **Aggiungi solo al `.env`:**
   ```bash
   VITE_OPENAPI_API_KEY=rl8s0sunqebsufrxxzdiwkngzlckm7xm
   ```

2. **Il sistema:**
   - Prova a usare la chiave direttamente come token
   - Se fallisce, mostra errore più chiaro

---

## 🧪 Test

### Test 1: Verifica Chiave come Token

1. **Apri console browser** (F12)
2. **Inserisci P.IVA** nel form
3. **Controlla console:**
   - Se vedi `[OpenAPI Company] Email non configurata, provo a usare la chiave come token diretto` → sta usando la chiave direttamente
   - Se vedi `401 Unauthorized` → la chiave non è un token valido, serve OAuth

### Test 2: OAuth Token

1. **Aggiungi email al `.env`:**
   ```bash
   VITE_OPENAPI_EMAIL=your-email@example.com
   ```

2. **Riavvia server:**
   ```bash
   npm run dev
   ```

3. **Inserisci P.IVA** nel form
4. **Controlla console:**
   - Dovresti vedere chiamata a `/token` per ottenere OAuth token
   - Poi chiamata a `/IT-start/{vatCode}` con token OAuth

---

## 📝 Come Ottenere Email Account

1. **Vai a:** https://console.openapi.com/it/
2. **Accedi** con le tue credenziali
3. **Vai a:** "Profilo" o "Impostazioni"
4. **Copia l'email** associata all'account

---

## 🔧 Codice Aggiornato

Il file `openapi-company.js` è stato aggiornato con:

1. ✅ **Funzione `getOAuthToken()`** - Ottiene token OAuth se email configurata
2. ✅ **Cache token** - Evita chiamate OAuth ripetute
3. ✅ **Fallback** - Prova a usare chiave direttamente se email non configurata
4. ✅ **Gestione errori** - Messaggi più chiari

---

## ⚠️ Note Importanti

1. **Sicurezza:**
   - L'email nel frontend non è ideale (ma funziona)
   - **Consigliato:** Implementare proxy backend per OAuth

2. **Token Cache:**
   - Il token è cachato in-memory (si resetta al refresh pagina)
   - Durata: 1 ora (configurabile)

3. **Rate Limiting:**
   - Evita di richiedere token OAuth ad ogni chiamata
   - La cache riduce le chiamate OAuth

---

## 🚀 Prossimi Passi (Opzionale)

### Implementare Proxy Backend

**Vantaggi:**
- ✅ Chiavi API non esposte nel frontend
- ✅ Gestione OAuth lato server
- ✅ Cache token più robusta
- ✅ Gestione refresh token automatica

**Endpoint proxy:**
```
GET /api/openapi/company/{vatCode}
```

**Implementazione:**
- Endpoint VPS che gestisce OAuth
- Frontend chiama solo il proxy
- Proxy gestisce token OAuth internamente

---

**Status:** ✅ Fix implementato - Testare con email o chiave come token
