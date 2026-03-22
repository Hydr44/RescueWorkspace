# 🔍 Analisi Prelevamento - IdCodice Partita IVA vs Codice Fiscale

**Domanda:** Perché i file con Codice Fiscale NON vengono prelevati, mentre quelli con Partita IVA sì?

---

## 📊 File Analizzati

### File PRELEVATO ✅
- **Nome:** `FI.02166430856.2026013.1732.957.zip`
- **IdCodice:** `02166430856`
- **Tipo:** Partita IVA (11 cifre numeriche)
- **Status:** ✅ Prelevato da SDI

### File NON PRELEVATI ❌
- **Nome:** `FI.SCZMNL05L21D960T.2026013.0906.900.zip`
- **IdCodice:** `SCZMNL05L21D960T`
- **Tipo:** Codice Fiscale (16 caratteri alfanumerici)
- **Status:** ❌ NON prelevati da SDI

---

## 🔍 Differenze

1. **Lunghezza:**
   - Partita IVA: 11 caratteri numerici
   - Codice Fiscale: 16 caratteri alfanumerici

2. **Formato:**
   - Partita IVA: Solo numeri (es. `02166430856`)
   - Codice Fiscale: Alfanumerico (es. `SCZMNL05L21D960T`)

---

## 💡 Conclusione

**SDI SFTP preleva SOLO file con Partita IVA (11 cifre), NON file con Codice Fiscale (16 caratteri).**

Questo spiega perché:
- File con IdCodice `02166430856` (Partita IVA) → ✅ Prelevato
- File con IdCodice `SCZMNL05L21D960T` (Codice Fiscale) → ❌ NON prelevato

---

## 🔧 Codice Attuale

### server.js (nome file ZIP)
```javascript
const idNodo = cedente.id_fiscale_iva?.id_codice || cedente.id_codice;
```

**Problema:** Se `id_fiscale_iva.id_codice` non è presente, usa `cedente.id_codice` che potrebbe essere il Codice Fiscale.

---

## ✅ Soluzione

**Assicurarsi che venga SEMPRE usata la Partita IVA per il nome file ZIP.**

Il nome file ZIP deve contenere la **Partita IVA (11 cifre)**, non il Codice Fiscale.

Potrebbe essere necessario:
1. Verificare che `cedente.id_fiscale_iva.id_codice` contenga sempre la Partita IVA
2. Oppure cambiare la logica per usare sempre `id_fiscale_iva.id_codice` (che dovrebbe essere la Partita IVA)

---

## 📝 Nota

Per SDI SFTP:
- **Nome file ZIP esterno:** Deve contenere Partita IVA (11 cifre)
- **IdCodice nel XML:** Può essere Partita IVA o Codice Fiscale (a seconda del soggetto)

Ma per il **nome file ZIP**, serve sempre la Partita IVA.
