# 🔧 Fix Errore 401 OAuth

## Problema

```
GET https://rescuemanager.eu/api/auth/verify?token=... 401 (Unauthorized)
```

Il token JWT viene rifiutato dal server, impedendo l'accesso all'app.

## Possibili Cause

1. **Token scaduto**: Il JWT ha un `exp` (expiration) che potrebbe essere passato
2. **Secret JWT non corrispondente**: Il secret usato per firmare il token non corrisponde a quello del server
3. **Token corrotto/cache vecchi**: Token memorizzati localmente sono invalidi
4. **Problema backend**: L'endpoint `/api/auth/verify` ha problemi

## Soluzioni Rapide

### ✅ SOLUZIONE 1: Pulire Cache Token (CONSIGLIATA)

**Apri DevTools Console (F12 o Cmd+Option+I) e esegui:**

```javascript
localStorage.removeItem('rm-oauth-tokens');
localStorage.removeItem('rm-auth');
localStorage.removeItem('rm:current_org');
location.reload();
```

**Oppure:**

1. Chiudi completamente l'app Electron
2. Apri DevTools prima del login
3. Vai a Application → Local Storage
4. Elimina tutte le chiavi relative a OAuth/auth
5. Riavvia l'app

---

### ✅ SOLUZIONE 2: Verificare Token Scaduto

Il token ha `exp: 1768244356` che corrisponde a:
- Timestamp Unix: 1768244356
- Data: ~2026-01-12 (futuro)
- Quindi il token NON è scaduto

Se il problema persiste, potrebbe essere:
- Il secret JWT non corrisponde
- Il backend non riconosce il token

---

### ✅ SOLUZIONE 3: Verificare Backend

Verifica che l'endpoint `/api/auth/verify` esista e funzioni:

```bash
# Test endpoint (sostituisci TOKEN con un token valido)
curl -X GET "https://rescuemanager.eu/api/auth/verify?token=TOKEN"
```

Se ritorna 401, il problema è nel backend (secret JWT o logica verifica).

---

### ✅ SOLUZIONE 4: Re-login Completo

1. **Chiudi completamente l'app**
2. **Apri DevTools Console**
3. **Esegui:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```
4. **Riavvia l'app**
5. **Esegui login da zero**

---

## Ordine di Test

1. **PRIMA**: Soluzione 1 (Pulire cache) - più veloce
2. **POI**: Se non funziona, Soluzione 4 (Re-login completo)
3. **POI**: Se persiste, Soluzione 3 (Verificare backend)
4. **ULTIMA**: Controllare configurazione JWT secret

---

## Stato

- ⏳ In attesa di test Soluzione 1
- ⚠️ Blocca accesso all'app
- 🔄 Priorità alta (deve essere risolto prima di SDI-SFTP)

