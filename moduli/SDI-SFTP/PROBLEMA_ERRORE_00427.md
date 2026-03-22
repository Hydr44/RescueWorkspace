# 🚨 Problema Errore 00427 - Codice ERRATO!

**Data:** 14 gennaio 2026

---

## ❌ Errore nel Codice

**File:** `xml-generator.js` - Righe 277-284

**Codice ATTUALE (SBAGLIATO):**
```javascript
<CodiceDestinatario>${esc((() => {
  // Per FPR12, CodiceDestinatario deve essere 6 caratteri (non 7!)
  // ERRORE 00427 se non conforme
  const codice = sdi.trasmissione?.codice_destinatario || '000000';
  // Normalizza: se è 7 caratteri, prendi primi 6; se meno di 6, pad right
  if (codice.length === 7) return codice.substring(0, 6); // Rimuovi ultimo carattere
  return codice.padEnd(6, '0').substring(0, 6); // Assicura esattamente 6 caratteri
})())}</CodiceDestinatario>
```

---

## 📋 Regola Corretta (dal Manuale)

**Errore 00427:**
- Se `FormatoTrasmissione = "FPA12"` → `CodiceDestinatario` **NON può essere di 7 caratteri** (deve essere **6 caratteri**)
- Se `FormatoTrasmissione = "FPR12"` → `CodiceDestinatario` **NON può essere di 6 caratteri** (deve essere **7 caratteri**)

**Quindi:**
- **FPA12** (fattura verso PA) → CodiceDestinatario = **6 caratteri**
- **FPR12** (fattura verso privato) → CodiceDestinatario = **7 caratteri**

---

## ⚠️ Problema

Il codice attuale:
- ✅ Usa `FormatoTrasmissione = "FPR12"` (corretto)
- ❌ Forza `CodiceDestinatario` a **6 caratteri** (SBAGLIATO per FPR12!)
- ❌ Dovrebbe essere **7 caratteri** per FPR12!

---

## ✅ Correzione Necessaria

Il codice deve:
1. Verificare `FormatoTrasmissione`
2. Se `FPR12` → `CodiceDestinatario` deve essere **7 caratteri**
3. Se `FPA12` → `CodiceDestinatario` deve essere **6 caratteri**
4. Validare la lunghezza e lanciare errore se non conforme

---

**Status:** ❌ Codice da correggere!
