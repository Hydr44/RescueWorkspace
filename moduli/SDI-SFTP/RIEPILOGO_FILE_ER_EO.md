# 📊 Riepilogo File ER vs EO

**Analisi file con errore (ER) vs file con esito (EO)**

---

## 📋 File ER (Error) - Errore Grave

File ER = Errore che impedisce l'elaborazione completa

### File ER Identificati

1. **ER.02166430856.2026013.1714.976.run**
   - Supporto: `FI.02166430856.2026013.1714.976.zip`
   - Timestamp: 17:14
   - Codice errore: `;2`
   - **Approccio:** Vecchio (firma XML → ZIP → cifra ZIP)

2. **ER.02166430856.2026013.1729.968.run**
   - Supporto: `FI.02166430856.2026013.1729.968.zip`
   - Timestamp: 17:29
   - Codice errore: `;2`
   - **Approccio:** Vecchio (firma XML → ZIP → cifra ZIP)

---

## 📋 File EO (Esito) - Elaborazione Completata (con Errori)

File EO = Elaborazione completata ma con esito negativo (ET02)

### File EO Identificati

1. **EO.02166430856.2026013.1732.957.xml.run**
   - Supporto: `FI.02166430856.2026013.1732.957.zip`
   - Timestamp: 17:32
   - Esito: **ET02** (ERRORE)
   - **Approccio:** Nuovo (doppia firma: XML + ZIP + cifra)

2. **EO.02166430856.2026013.1502.921.xml.run**
   - Supporto: `FI.02166430856.2026013.1502.921.zip`
   - Timestamp: 15:02
   - Esito: **ET02** (ERRORE)
   - **Approccio:** Vecchio

3. **EO.02166430856.2026013.1006.984.xml.run**
   - Supporto: `FI.02166430856.2026013.1006.984.zip`
   - Timestamp: 10:06
   - Esito: **ET02** (ERRORE)
   - **Approccio:** Vecchio

---

## 🔍 Differenza

### File ER (Error)
- **Codice errore:** `;2`
- **Significato:** Errore grave che impedisce l'elaborazione completa
- **Approccio:** Vecchio (17:14, 17:29)

### File EO (Esito)
- **Codice esito:** `ET02`
- **Significato:** Elaborazione completata ma con errori
- **Approccio:** Vecchio e Nuovo (10:06, 15:02, 17:32)

---

## 💡 Conclusione

**File ER (Error):**
- File 17:14 e 17:29 → Approccio **VECCHIO**
- Errore grave (codice `;2`)

**File EO (Esito ET02):**
- File 10:06, 15:02 → Approccio **VECCHIO**
- File 17:32 → Approccio **NUOVO** (doppia firma)
- Tutti con errore ET02 ("File di Quadratura non presente")

---

## 🎯 Risposta

**NO, i file ER sono con approccio VECCHIO (17:14, 17:29).**

Il file con approccio NUOVO (17:32, doppia firma) ha EO (non ER), ma comunque con errore ET02.
