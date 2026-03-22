# 🔍 Analisi Problema Cookie CDSSO - Ogni Richiesta Richiede Login

**Data:** 19 gennaio 2026  
**Problema:** Ogni richiesta API RVFU restituisce CDSSO, richiedendo login continuo

---

## 🔴 Problema Identificato

Dai log:
```
[RVFU API Proxy] 🔐 Rilevato form CDSSO, eseguendo POST automatico...
[RVFU API Proxy] ⚠️ CDSSO rilevato - richiede re-autenticazione
```

**Ogni richiesta API restituisce HTML CDSSO invece di JSON**, indicando che:
1. Il cookie `iPlanetDirectoryPro` non viene inviato nelle richieste API
2. O il cookie è scaduto/invalido
3. O il cookie non è disponibile nel contesto della finestra persistente

---

## 📋 Analisi Manuale RVFU

### Flusso Autenticazione (Specifiche 1.25)

1. **`/authenticate`** → Restituisce cookie `iPlanetDirectoryPro`
2. **`/authorize`** → Richiede cookie `iPlanetDirectoryPro` + ClientId
3. **`/accesstoken`** → Restituisce IDToken, AccessToken, RefreshToken
4. **API REST** → Richiede **IDToken (Bearer)** nell'header `Authorization`

### Durata Token (Specifiche 1.25)

- **AccessToken**: 30 minuti (default)
- **IDToken**: 4 ore (default)
- **RefreshToken**: 2 giorni (default)
- **Cookie iPlanetDirectoryPro**: Non specificato esplicitamente, ma dovrebbe essere persistente per la sessione

---

## 🔍 Possibili Cause

### 1. Cookie Non Inviato nelle Richieste API

**Verifica:**
- Il cookie `iPlanetDirectoryPro` è presente nella sessione?
- Viene inviato automaticamente con `credentials: 'include'`?
- Il dominio del cookie corrisponde al dominio dell'API?

**Fix Potenziale:**
```javascript
// Verifica che il cookie sia disponibile prima della richiesta
const cookies = await defaultSession.cookies.get({ 
  domain: 'ssoformazione.ilportaledeltrasporto.it' 
});
const iPlanetCookie = cookies.find(c => c.name === 'iPlanetDirectoryPro');
if (!iPlanetCookie) {
  console.error('Cookie iPlanetDirectoryPro NON TROVATO!');
}
```

### 2. Cookie Scaduto

**Verifica:**
- Il cookie ha una data di scadenza?
- Quando è stato creato?
- Quanto tempo è passato dal login?

**Fix Potenziale:**
```javascript
// Aggiungi expirationDate quando imposti il cookie
await defaultSession.cookies.set({
  url: `https://${ssoDomain}/sso/`,
  name: 'iPlanetDirectoryPro',
  value: iPlanetCookie.value,
  domain: ssoDomain,
  path: '/',
  secure: true,
  httpOnly: true,
  expirationDate: new Date(Date.now() + 4 * 60 * 60 * 1000).getTime() / 1000, // 4 ore
});
```

### 3. Cookie Non Condiviso tra Finestre

**Verifica:**
- La finestra persistente usa la stessa sessione della finestra di login?
- Il cookie è impostato per la sessione corretta?

**Fix Potenziale:**
- Usa `session.defaultSession` per entrambe le finestre
- Verifica che il cookie sia impostato PRIMA di caricare la pagina

### 4. IDToken Non Usato nelle Richieste API

**Secondo specifiche, le API REST richiedono IDToken (Bearer) nell'header Authorization**

**Verifica:**
- Le richieste API includono `Authorization: Bearer <idToken>`?
- L'IDToken è valido (non scaduto)?

**Fix Potenziale:**
```javascript
// Usa IDToken invece di solo cookie
const headers = {
  'Authorization': `Bearer ${idToken}`, // IMPORTANTE secondo specifiche
  'Content-Type': 'application/json',
};
```

---

## ✅ Fix Proposti

### Fix 1: Verifica Cookie Prima di Richieste API

```javascript
// Prima di ogni richiesta API, verifica che il cookie sia presente
const cookies = await defaultSession.cookies.get({ 
  domain: 'ssoformazione.ilportaledeltrasporto.it' 
});
const iPlanetCookie = cookies.find(c => c.name === 'iPlanetDirectoryPro');
if (!iPlanetCookie) {
  throw new Error('Cookie iPlanetDirectoryPro non trovato. Rifai login.');
}
```

### Fix 2: Usa IDToken nelle Richieste API

```javascript
// Secondo specifiche, le API REST richiedono IDToken (Bearer)
const headers = {
  'Authorization': `Bearer ${idToken}`,
  'Content-Type': 'application/json',
};
```

### Fix 3: Imposta ExpirationDate per Cookie

```javascript
// Imposta expirationDate quando crei il cookie
await defaultSession.cookies.set({
  // ... altri parametri
  expirationDate: new Date(Date.now() + 4 * 60 * 60 * 1000).getTime() / 1000, // 4 ore
});
```

---

## 🧪 Test

1. **Verifica Cookie:**
   ```javascript
   // Nella console della finestra persistente
   document.cookie // Dovrebbe contenere iPlanetDirectoryPro
   ```

2. **Verifica Headers Richiesta:**
   - Apri DevTools → Network
   - Controlla se `Cookie` header è presente
   - Controlla se `Authorization` header è presente

3. **Verifica Scadenza:**
   - Controlla quando è stato creato il cookie
   - Verifica se è scaduto

---

**Status:** 🔍 Analisi in corso - Serve verificare se cookie viene inviato e se IDToken è usato
