# 🔍 Analisi File ER (Error)

**Domanda:** Quali file hanno dato errore (file ER) e quali hanno EO?

---

## 📊 File ER (Error)

I file ER sono file di errore generati da SDI quando c'è un problema nel prelevamento/elaborazione.

### File ER Identificati

1. **ER.02166430856.2026013.1729.968.run**
   - Supporto: `FI.02166430856.2026013.1729.968.zip`
   - Generato: 18:20 UTC
   - IdCodice: `02166430856` (Partita IVA)

2. **ER.02166430856.2026013.1714.976.run**
   - Supporto: `FI.02166430856.2026013.1714.976.zip`
   - Generato: 18:20 UTC
   - IdCodice: `02166430856` (Partita IVA)

---

## 📋 File EO (Esito)

I file EO sono file di esito generati quando SDI elabora il file (anche con errori).

### File EO Identificati

1. **EO.02166430856.2026013.1732.957.xml.run**
   - Supporto: `FI.02166430856.2026013.1732.957.zip`
   - Esito: ET02 (ERRORE)
   - IdCodice: `02166430856` (Partita IVA)

2. **EO.02166430856.2026013.1502.921.xml.run**
   - Supporto: `FI.02166430856.2026013.1502.921.zip`
   - Esito: ET02 (ERRORE)
   - IdCodice: `02166430856` (Partita IVA)

3. **EO.02166430856.2026013.1006.984.xml.run**
   - Supporto: `FI.02166430856.2026013.1006.984.zip`
   - Esito: ET02 (ERRORE)
   - IdCodice: `02166430856` (Partita IVA)

---

## 🔍 Differenza tra ER e EO

- **ER (Error):** File generato quando c'è un errore grave che impedisce l'elaborazione
- **EO (Esito):** File generato quando il file viene elaborato (anche se con errori ET02)

---

## 💡 Conclusione

Tutti i file che hanno dato esito (EO o ER) sono con IdCodice `02166430856` (Partita IVA).

I file con Codice Fiscale (`SCZMNL05L21D960T`) non hanno né EO né ER - semplicemente non vengono prelevati da SDI.
