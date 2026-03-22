# ✅ Correzione Progressivo File XML Interno

**Data:** 13 gennaio 2026  
**Status:** ✅ CORRETTO

---

## 🔧 Problema Corretto

**File:** `server-vps/server.js`, righe 207-231

### Prima (ERRATO):
```javascript
const filename = `IT${idNodo}_${invoice.number || invoice.id}.xml`;
```

**Problema:**
- Usava `invoice.id` (UUID) come fallback
- UUID: 36 caratteri (max richiesto: 5)
- Contiene caratteri non validi (`-`)
- Non conforme alle specifiche SDI

### Dopo (CORRETTO):
```javascript
// Progressivo: stringa alfanumerica max 5 caratteri [a-z], [A-Z], [0-9]
let progressivo = String(invoice.number || (index + 1));
// Rimuovi caratteri non alfanumerici e limita a 5 caratteri
progressivo = progressivo.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5);
// Se rimane vuoto o non conforme, usa progressivo sequenziale
if (progressivo.length === 0 || !/^[a-zA-Z0-9]{1,5}$/.test(progressivo)) {
  progressivo = String(index + 1).padStart(5, '0').substring(0, 5);
}
const filename = `IT${idNodo}_${progressivo}.xml`;
```

---

## ✅ Conformità SDI

**Formato richiesto (SDI paragrafo 2.2):**
- Progressivo: alfanumerico, max 5 caratteri, [a-z], [A-Z], [0-9]
- Formato: `IT{IdCodice}_{progressivo}.xml`

**Esempi corretti:**
- `IT02166430856_00001.xml`
- `IT02166430856_00002.xml`
- `IT02166430856_ABC01.xml`

---

## 🔍 Logica Implementata

1. **Usa `invoice.number`** se presente e valido
2. **Pulisce caratteri non alfanumerici**
3. **Limita a 5 caratteri**
4. **Fallback a progressivo sequenziale** (00001, 00002, etc.) se necessario
5. **Verifica formato** con regex

---

## 🎯 Impatto

Questo dovrebbe risolvere l'errore "File di Quadratura non presente" perché:
- ✅ I nomi file XML sono ora conformi alle specifiche SDI
- ✅ SDI può riconoscere e processare i documenti
- ✅ I documenti di fatturazione sono nel formato atteso

