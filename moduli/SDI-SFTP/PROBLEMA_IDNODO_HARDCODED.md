# Problema Critico: IdNodo Hardcoded

## ❌ PROBLEMA TROVATO

**File:** `server-vps/server.js`  
**Riga:** 234

### Descrizione

Alla riga 234, l'IdNodo era **hardcoded**:
```javascript
const idNodo = 'SCZMNL05L21D960T'; // TODO: Da configurazione org
```

Ma alle righe 213-218, il codice estraeva correttamente l'IdNodo dalle fatture:
```javascript
const cedente = invoice.meta?.sdi?.cedente_prestatore || {};
const idNodo = cedente.id_fiscale_iva?.id_codice || cedente.id_codice;
```

**Problema:** Il nome file esterno (FI.{IdNodo}.{AAAAGGG}.{HHMM}.{NNN}.zip) veniva generato con un IdNodo hardcoded invece di usare quello estratto dalle fatture.

---

## ✅ CORREZIONE

Ora il codice:
1. Estrae l'IdNodo dalle fatture (come già faceva per il nome file XML interno)
2. **Usa lo stesso IdNodo** per il nome file esterno
3. Garantisce coerenza tra XML interno e nome file esterno

### Codice Corretto

```javascript
// Estrai idNodo dalle fatture
let idNodoForFilename = null;

for (const invoice of invoices) {
  const cedente = invoice.meta?.sdi?.cedente_prestatore || {};
  const idNodo = cedente.id_fiscale_iva?.id_codice || cedente.id_codice;
  
  // Usa lo stesso idNodo per il nome file esterno
  if (!idNodoForFilename) {
    idNodoForFilename = idNodo;
  }
  
  // ... resto del codice ...
}

// Genera nome file esterno usando l'IdNodo estratto
const filename = generateFIFilename(idNodoForFilename, progressivo, useTestMode);
```

---

## 🔍 ALTRI PUNTI DA VERIFICARE

### 1. Lunghezza IdNodo

**Possibili valori:**
- **11 caratteri:** P.IVA (es: `12345678901`)
- **16 caratteri:** Codice fiscale (es: `RSCSGN80A01H501U`)
- **17 caratteri:** Codice fiscale con prefisso IT (es: `ITRSCSGN80A01H501U`)

**Nel nostro caso:** `SCZMNL05L21D960T` = 17 caratteri

**Verifica necessaria:** Nei manuali SDI, quale formato è richiesto per l'IdNodo nel nome file?

### 2. Nome File XML Interno

**Formato attuale:** `IT{idNodo}_{number}.xml`

**Esempio:** `ITSCZMNL05L21D960T_1.xml`

**Verifica necessaria:** I manuali SDI specificano un formato esatto per il nome file XML interno?

---

## 📋 IMPATTO

**Prima della correzione:**
- ❌ IdNodo hardcoded nel nome file esterno
- ❌ Possibile inconsistenza tra XML e nome file
- ❌ Non dinamico per organizzazioni diverse

**Dopo la correzione:**
- ✅ IdNodo estratto dalle fatture
- ✅ Coerenza garantita
- ✅ Dinamico per organizzazioni diverse

---

## 🎯 PROSSIMI PASSI

1. ✅ Corretto IdNodo hardcoded
2. ⏳ Verificare nei manuali se l'IdNodo deve essere esattamente 11 caratteri
3. ⏳ Verificare formato nome file XML interno nei manuali
4. ⏳ Testare con nuova fattura

