# ✅ Correzione Errore 00427

**Data:** 14 gennaio 2026

---

## 🐛 Problema Identificato

**Errore nel codice:** `xml-generator.js` righe 277-284

Il codice forzava `CodiceDestinatario` a **6 caratteri** per `FPR12`, ma secondo il manuale:
- **FPA12** → CodiceDestinatario = **6 caratteri**
- **FPR12** → CodiceDestinatario = **7 caratteri** (NON 6!)

---

## ✅ Correzione Applicata

**Nuovo codice:**
- Verifica `FormatoTrasmissione`
- Se `FPA12` → `CodiceDestinatario` = **6 caratteri**
- Se `FPR12` → `CodiceDestinatario` = **7 caratteri**
- Validazione lunghezza con errore esplicito se non conforme

---

## 📋 Verifica Ultima Fattura

**Errore ricevuto:** 00427 - CodiceDestinatario di 6 caratteri con FormatoTrasmissione FPR12

**Causa:** Il codice forzava 6 caratteri quando doveva essere 7 per FPR12

**Status:** ✅ Corretto

---

## ✅ Verifica Problemi Firma

**Ultima fattura inviata:**
- ✅ File ricevuto correttamente
- ✅ File decifrato correttamente
- ✅ Firma verificata correttamente
- ✅ XML validato correttamente
- ❌ Solo errori di validazione contenuto (dati fattura)

**Conclusione:** ✅ **Nessun problema di firma!**

Gli errori 00102 e 00105 **NON sono più presenti** nell'ultima fattura!

---

**Status:** ✅ Codice corretto - Problemi di firma risolti!
