# 🔍 Verifica Cookie e Headers nelle Richieste API

**Data:** 19 gennaio 2026  
**Problema:** Ogni richiesta restituisce CDSSO - serve verificare cookie e headers

---

## 📋 Secondo Manuale RVFU (Specifiche 1.25)

### Punto 7 - Chiamata API Gateway

> **"Il Client chiama l'API Gateway passando l'IDToken (Bearer) nel Header Authorization."**

**IMPORTANTE:** Le API REST richiedono:
1. ✅ **IDToken (Bearer)** nell'header `Authorization` ← **REQUIRED**
2. ✅ **Cookie iPlanetDirectoryPro** ← Potrebbe essere necessario per CDSSO

---

## 🔍 Debug Aggiunto

Ho aggiunto log dettagliati per verificare:

### 1. Cookie Disponibili nella Pagina
```javascript
console.log('[RVFU API Proxy] 🔍 Cookie disponibili nella pagina:', {
  cookieString: document.cookie || 'NESSUN COOKIE',
  cookieCount: document.cookie ? document.cookie.split(';').filter(c => c.trim()).length : 0,
  hasIPlanetCookie: document.cookie ? document.cookie.includes('iPlanetDirectoryPro') : false,
  url: window.location.href,
  origin: window.location.origin
});
```

### 2. Headers Richiesta
```javascript
console.log('[RVFU API Proxy] 🔍 Headers richiesta:', {
  hasAuthorization: !!(headers && headers.Authorization),
  authorizationPrefix: headers && headers.Authorization ? headers.Authorization.substring(0, 30) + '...' : 'NONE',
  allHeaders: headers || {}
});
```

---

## 🧪 Test da Fare

1. **Riavvia l'app** e fai login RVFU
2. **Prova a cercare un veicolo** (targa `VA054AJ`)
3. **Controlla i log nella console** della finestra persistente:
   - Cookie disponibili nella pagina
   - Headers Authorization
   - Se il cookie `iPlanetDirectoryPro` è presente

---

## 🔍 Cosa Verificare

### Se Cookie NON Presente:
- Il cookie non viene condiviso tra finestre
- Il cookie è scaduto
- Il cookie non viene impostato correttamente

### Se Authorization Header NON Presente:
- L'IDToken non viene passato
- Il token è scaduto
- Il token non viene recuperato correttamente

### Se Entrambi Presenti ma CDSSO Persiste:
- Il server RVFU richiede una sessione browser attiva
- Serve navigare alla pagina RVFU prima delle API
- Il CDSSO è obbligatorio per ogni richiesta

---

**Status:** 🔍 Debug aggiunto - Controlla i log nella console
