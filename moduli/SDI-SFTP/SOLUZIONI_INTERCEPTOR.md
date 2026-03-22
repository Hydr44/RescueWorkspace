# 🔧 Soluzioni per Problema Interceptor

## Problema Identificato

La richiesta `fetch()` viene intercettata e modificata:
- **URL corretto nel codice**: `http://sdi-sftp.rescuemanager.eu/api/sdi-sftp/send`
- **URL nella richiesta HTTP**: `https://rentri-test.rescuemanager.eu/api/sdi-sftp/send`
- **Metodo corretto nel codice**: `POST`
- **Metodo nella richiesta HTTP**: `GET`

## Soluzioni

### ✅ SOLUZIONE 1: XMLHttpRequest (IMPLEMENTATO)

**Stato**: ✅ Già implementato in `src/lib/sdi.js`

**Vantaggi**:
- Bypassa interceptor `fetch()`
- Più basso livello
- Meno probabile che venga intercettato

**Come testare**:
1. Riavvia completamente l'app
2. Prova invio fattura
3. Verifica se funziona

**Codice**:
```javascript
const xhr = new XMLHttpRequest();
xhr.open('POST', endpoint, true);
// ... configurazione headers e body
xhr.send(JSON.stringify(payload));
```

---

### 🔍 SOLUZIONE 2: Verificare Vite Proxy

**Dove verificare**: `vite.config.js`

**Cosa cercare**:
```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api/sdi-sftp': { ... }  // ← RIMUOVERE se presente
    }
  }
});
```

**Azione**: Se c'è un proxy configurato, rimuoverlo o modificarlo.

---

### 🔍 SOLUZIONE 3: Verificare Electron Session Handlers

**Dove verificare**: `electron/main.js` o `electron/ipc.js`

**Cosa cercare**:
```javascript
session.defaultSession.webRequest.onBeforeRequest(...)
session.defaultSession.webRequest.onBeforeSendHeaders(...)
protocol.interceptHttpProtocol(...)
```

**Azione**: Se ci sono interceptors, rimuoverli o escludere `/api/sdi-sftp/*`.

---

### 🔧 SOLUZIONE 4: Usare Electron IPC (Complesso)

**Quando usare**: Solo se le altre soluzioni non funzionano

**Come funziona**:
1. Creare handler IPC in `electron/ipc.js`
2. Chiamare API da main process (Node.js `https` module)
3. Passare dati via IPC dal renderer al main

**Vantaggi**:
- Bypassa completamente qualsiasi interceptor
- Controllo totale sulle richieste

**Svantaggi**:
- Più complesso da implementare
- Richiede modifiche a più file

---

## Ordine di Test

1. **PRIMA**: Testa Soluzione 1 (XMLHttpRequest) - già implementato
2. **POI**: Se non funziona, verifica Soluzione 2 (Vite proxy)
3. **POI**: Se non funziona, verifica Soluzione 3 (Electron session)
4. **ULTIMA RISORSA**: Implementa Soluzione 4 (Electron IPC)

---

## Stato Attuale

- ✅ XMLHttpRequest implementato
- ⏳ In attesa di test
- ⏳ Verifica Vite proxy (se necessario)
- ⏳ Verifica Electron session (se necessario)

