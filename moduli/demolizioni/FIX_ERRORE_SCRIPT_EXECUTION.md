# ✅ Fix Errore "Script failed to execute"

**Data:** 19 gennaio 2026  
**Errore:** `Script failed to execute, this normally means an error was thrown. Check the renderer console for the error.`  
**File:** `electron/ipc.js` riga 1759

---

## 🔍 Problema Identificato

L'errore si verifica quando viene eseguito `executeJavaScript` per iniettare il codice nella finestra persistente. Il problema è nell'interpolazione del template literal con `JSON.stringify(messageDataJson)`.

### Causa

Quando `messageDataJson` viene serializzato due volte e interpolato nel template literal, caratteri speciali possono causare problemi di sintassi JavaScript.

---

## ✅ Fix Applicato

### Prima (Con Problema)

```javascript
const messageDataJson = JSON.stringify(messageData);

persistentApiWindow.webContents.executeJavaScript(`
  (function() {
    try {
      const jsonString = ${JSON.stringify(messageDataJson)};
      const data = JSON.parse(jsonString);
      window.postMessage(data, '*');
    } catch (e) {
      console.error('[RVFU IPC API] Errore parsing dati:', e);
      console.error('[RVFU IPC API] Stringa JSON:', ${JSON.stringify(messageDataJson)});
    }
  })();
`);
```

**Problema:** `JSON.stringify(messageDataJson)` viene chiamato direttamente nel template literal, il che può causare problemi se la stringa contiene caratteri che rompono la sintassi.

### Dopo (Fix)

```javascript
const messageDataJson = JSON.stringify(messageData);

// FIX: Serializza due volte per creare una stringa JavaScript valida
const escapedJson = JSON.stringify(messageDataJson);

persistentApiWindow.webContents.executeJavaScript(`
  (function() {
    try {
      // Assegna la stringa JSON a una variabile per evitare problemi di interpolazione
      const jsonString = ${escapedJson};
      const data = JSON.parse(jsonString);
      window.postMessage(data, '*');
    } catch (e) {
      console.error('[RVFU IPC API] Errore parsing dati:', e);
      console.error('[RVFU IPC API] Stringa JSON:', ${escapedJson});
    }
  })();
`);
```

**Vantaggi:**
- ✅ La serializzazione avviene PRIMA dell'interpolazione
- ✅ `escapedJson` è già una stringa JavaScript valida
- ✅ Evita problemi di escape nel template literal
- ✅ Più leggibile e manutenibile

---

## 🔧 Altri Fix Applicati

### Fix 1: Controllo `url` null/undefined (Riga 1383)

```javascript
// PRIMA:
console.log('...', JSON.stringify({ requestId, method, url: url.substring(0, 100) }));

// DOPO:
console.log('...', JSON.stringify({ requestId, method, url: url ? url.substring(0, 100) : null }));
```

---

## 🧪 Test

Dopo i fix, testa:

1. **Inizializzazione finestra persistente:**
   - Riavvia l'app
   - Verifica che non compaia più l'errore "Script failed to execute"

2. **Chiamata API:**
   - Fai login RVFU
   - Cerca veicolo con targa `VA054AJ`
   - Verifica che funzioni correttamente

---

## 📝 Note

- Il fix separa la serializzazione dall'interpolazione
- `escapedJson` è calcolato PRIMA del template literal
- Questo evita problemi di escape e sintassi

---

**Status:** ✅ Fix applicato - Pronto per test
