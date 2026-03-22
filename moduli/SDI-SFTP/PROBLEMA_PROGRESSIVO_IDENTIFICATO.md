# ⚠️ PROBLEMA IDENTIFICATO: Progressivo File XML Interno

**Data:** 13 gennaio 2026  
**Severità:** 🔴 CRITICO

---

## 🎯 Problema

Il nome dei file XML dentro il ZIP non rispetta il formato richiesto da SDI.

---

## 📋 Codice Attuale

**File:** `server-vps/server.js`, riga 229

```javascript
const filename = `IT${idNodo}_${invoice.number || invoice.id}.xml`;
```

---

## ❌ Problema Identificato

### 1. Uso di `invoice.id` come fallback

Se `invoice.number` non è presente, viene usato `invoice.id` che è un **UUID**:
- Esempio UUID: `5f8cba7c-c536-4f0c-a210-5c1e4a3c0d20`
- ❌ **36 caratteri** (max richiesto: 5)
- ❌ **Contiene caratteri non validi** (`-`)
- ❌ **Non alfanumerico** (contiene trattini)

### 2. Formato Richiesto da SDI

Dal manuale SDI (paragrafo 2.2):

**Progressivo:**
- **Lunghezza massima:** 5 caratteri
- **Formato:** alfanumerico [a-z], [A-Z], [0-9]
- **Separatore:** underscore (`_`)

**Esempi corretti:**
- `IT02166430856_00001.xml`
- `IT02166430856_ABC01.xml`
- `IT02166430856_00002.xml`

**Esempio ERRATO (nostro attuale):**
- `IT02166430856_5f8cba7c-c536-4f0c-a210-5c1e4a3c0d20.xml` ❌

---

## 🔍 Documentazione SDI

> "il progressivo univoco del file è rappresentato da una stringa alfanumerica di lunghezza massima di 5 caratteri e con valori ammessi [a-z], [A-Z], [0-9]."

---

## ✅ Soluzione

Generare un progressivo alfanumerico conforme:
- **Lunghezza:** massimo 5 caratteri
- **Formato:** alfanumerico [a-z], [A-Z], [0-9]
- **Univoco:** per ogni fattura nel ZIP

**Possibili approcci:**
1. Usare `invoice.number` se presente e conforme (max 5 caratteri, alfanumerico)
2. Generare progressivo sequenziale: `00001`, `00002`, etc.
3. Usare hash/truncate dell'ID se necessario

---

## 🎯 Impatto

Questo potrebbe essere la causa dell'errore "File di Quadratura non presente" perché:
- SDI non riconosce i nomi file XML come validi
- SDI non può processare i documenti con nomi non conformi
- SDI non trova i documenti di fatturazione nel formato atteso

---

## 📝 Prossimi Passi

1. ✅ **Problema identificato**
2. ⏳ **Correggere generazione progressivo**
3. ⏳ **Testare con progressivo conforme**

