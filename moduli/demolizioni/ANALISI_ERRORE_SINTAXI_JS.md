# 🔍 Analisi Errore Sintassi JavaScript

**Errore:** `Uncaught SyntaxError: missing ) after argument list`  
**Posizione:** Pagina persistente (BrowserWindow)  
**File:** `electron/ipc.js` riga 1759

---

## 🔴 Problema Identificato

### Doppia Serializzazione JSON

Alla **riga 1754-1759**:

```javascript
const messageDataJson = JSON.stringify(messageData);  // Riga 1754

persistentApiWindow.webContents.executeJavaScript(`
  (function() {
    try {
      const data = JSON.parse(${JSON.stringify(messageDataJson)});  // ❌ RIGA 1759 - PROBLEMA!
      window.postMessage(data, '*');
    } catch (e) {
      console.error('[RVFU IPC API] Errore parsing dati:', e);
    }
  })();
`);
```

### Causa

1. **Riga 1754:** `messageDataJson` è già una **stringa JSON** (risultato di `JSON.stringify(messageData)`)
2. **Riga 1759:** Viene fatto un **secondo `JSON.stringify`** di una stringa già serializzata
3. **Risultato:** Doppia serializzazione che può creare stringhe malformate

### Esempio del Problema

```javascript
// messageData contiene:
{
  id: "123",
  url: "https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/concessionario/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA054AJ"
}

// Riga 1754: Prima serializzazione
messageDataJson = '{"id":"123","url":"https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/concessionario/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA054AJ"}'

// Riga 1759: Seconda serializzazione (ERRORE!)
JSON.stringify(messageDataJson) = '"{\"id\":\"123\",\"url\":\"https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/concessionario/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA054AJ\"}"'

// Quando interpolato nel template literal:
const data = JSON.parse("{\"id\":\"123\",\"url\":\"https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/concessionario/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA054AJ\"}");
```

### Perché Causa "missing ) after argument list"?

Quando l'URL contiene caratteri speciali come `&`, `=`, `?`, `'`, `"`, `\`, anche se sono correttamente escapati nella stringa JSON, quando vengono interpolati nel template literal JavaScript, possono causare problemi se:

1. La doppia serializzazione crea una stringa malformata
2. I caratteri speciali non sono correttamente escapati nel template literal
3. Il parser JavaScript interpreta male la stringa

---

## ✅ Soluzione

### Opzione 1: Usa messageDataJson Direttamente (Consigliata)

```javascript
const messageDataJson = JSON.stringify(messageData);

persistentApiWindow.webContents.executeJavaScript(`
  (function() {
    try {
      const data = JSON.parse(${messageDataJson});  // ✅ Usa direttamente, senza doppio stringify
      window.postMessage(data, '*');
    } catch (e) {
      console.error('[RVFU IPC API] Errore parsing dati:', e);
    }
  })();
`);
```

**Problema:** `messageDataJson` è una stringa, quindi quando viene interpolata nel template literal, diventa:
```javascript
const data = JSON.parse({"id":"123","url":"..."});  // ❌ Sintassi errata!
```

### Opzione 2: Usa Template Literal Corretto (MIGLIORE)

```javascript
const messageDataJson = JSON.stringify(messageData);

persistentApiWindow.webContents.executeJavaScript(`
  (function() {
    try {
      const data = JSON.parse(${JSON.stringify(messageDataJson)});  // ✅ Doppio stringify corretto
      window.postMessage(data, '*');
    } catch (e) {
      console.error('[RVFU IPC API] Errore parsing dati:', e);
    }
  })();
`);
```

**Ma questo è quello che c'è già!** Il problema potrebbe essere che `messageDataJson` contiene caratteri che rompono il template literal.

### Opzione 3: Usa Escape Corretto (SOLUZIONE DEFINITIVA)

Il problema è che quando interpoliamo una stringa JSON in un template literal, dobbiamo assicurarci che sia correttamente escapata. La soluzione migliore è usare un approccio diverso:

```javascript
const messageDataJson = JSON.stringify(messageData);
// Escape per template literal: sostituisci backtick, $, \ con versioni escape
const escapedJson = messageDataJson.replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/\\/g, '\\\\');

persistentApiWindow.webContents.executeJavaScript(`
  (function() {
    try {
      const data = JSON.parse(\`${escapedJson}\`);  // ✅ Usa escaped string
      window.postMessage(data, '*');
    } catch (e) {
      console.error('[RVFU IPC API] Errore parsing dati:', e);
    }
  })();
`);
```

**Ma questo è complesso!** La soluzione migliore è usare `JSON.stringify` due volte, ma assicurandosi che funzioni correttamente.

---

## 🔧 Fix Proposto

La soluzione più semplice e sicura è usare un approccio diverso: invece di interpolare la stringa JSON nel template literal, possiamo usare `eval` (sicuro in questo contesto) o meglio ancora, passare i dati in modo diverso.

**Soluzione Consigliata:**

```javascript
const messageDataJson = JSON.stringify(messageData);

persistentApiWindow.webContents.executeJavaScript(`
  (function() {
    try {
      // Usa JSON.parse con la stringa correttamente escapata
      const jsonString = ${JSON.stringify(messageDataJson)};
      const data = JSON.parse(jsonString);
      window.postMessage(data, '*');
    } catch (e) {
      console.error('[RVFU IPC API] Errore parsing dati:', e);
    }
  })();
`);
```

Questo dovrebbe funzionare perché:
1. `messageDataJson` è una stringa JSON valida
2. `JSON.stringify(messageDataJson)` la converte in una stringa JavaScript valida (con escape)
3. Quando interpolata, diventa: `const jsonString = "{\"id\":\"123\",...}";`
4. `JSON.parse(jsonString)` la parsa correttamente

---

## 🧪 Test

Dopo il fix, testa con:
- URL con query parameters: `?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA054AJ`
- URL con caratteri speciali: `?param=value&other=test`
- Body con caratteri speciali: `{"key": "value with 'quotes'"}`

---

**Status:** 🔴 Problema identificato - Fix da applicare
