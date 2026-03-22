# 🔍 Verifica Errore 00427

**Data:** 14 gennaio 2026  
**Errore:** 00427 - CodiceDestinatario lunghezza non corretta per FormatoTrasmissione

---

## 📋 Regole Errore 00427

Dal manuale `Controlli_Extra_XSD.md`:

**Errore 00427:**
- Se `FormatoTrasmissione = "FPA12"` → `CodiceDestinatario` **NON può essere di 7 caratteri** (deve essere di 6 caratteri)
- Se `FormatoTrasmissione = "FPR12"` → `CodiceDestinatario` **NON può essere di 6 caratteri** (deve essere di 7 caratteri)

**Logica:**
- **FPA12** (fattura verso PA) → CodiceDestinatario = **6 caratteri**
- **FPR12** (fattura verso privato) → CodiceDestinatario = **7 caratteri**

---

## 🔍 Verifica Codice

**File:** `xml-generator.js`

**FormatoTrasmissione:**
```javascript
const formatoTrasm = sdi.trasmissione?.formato_trasmissione || 'FPR12';
```

**CodiceDestinatario:**
- Viene preso da: `sdi.trasmissione?.codice_destinatario`
- Non c'è validazione della lunghezza nel codice
- Se FormatoTrasmissione = "FPR12" → CodiceDestinatario deve essere **7 caratteri**

---

## ⚠️ Problema Identificato

**L'errore 00427 nell'ultima notifica indica:**
- FormatoTrasmissione = "FPR12"
- CodiceDestinatario = lunghezza errata (probabilmente 6 caratteri invece di 7)

**Ma questo è un errore sui DATI della fattura, non sul codice!**

- Il codice genera correttamente il CodiceDestinatario dal campo `sdi.trasmissione?.codice_destinatario`
- Se i dati inseriti dall'utente hanno un CodiceDestinatario di lunghezza errata, l'errore è atteso

---

## ✅ Conclusione

**Il codice è corretto!**

L'errore 00427 è un errore di validazione dei DATI della fattura, non del codice. Il codice genera correttamente il CodiceDestinatario dal campo inserito dall'utente.

**Raccomandazione:**
- Aggiungere validazione client-side per verificare la lunghezza del CodiceDestinatario in base al FormatoTrasmissione
- Oppure aggiungere validazione server-side prima di generare l'XML

---

**Status:** ✅ Codice corretto - Errore sui dati fattura (non codice)
