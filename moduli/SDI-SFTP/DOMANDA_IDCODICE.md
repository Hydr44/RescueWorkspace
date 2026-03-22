# ❓ Domanda: IdCodice - Partita IVA vs Codice Fiscale

**Domanda utente:** Perché ho messo il Codice Fiscale invece della Partita IVA negli approcci nuovi, quando la Partita IVA funzionava?

---

## 📋 Situazione

L'utente dice che:
- Con la **Partita IVA** funzionava (file vecchi)
- Negli approcci nuovi ho messo il **Codice Fiscale** (che non funziona?)

---

## 🔍 Codice Attuale

### xml-generator.js
```javascript
const idCodice = cedente.id_fiscale_iva?.id_codice || cedente.id_codice;
```

### server.js (nome file)
```javascript
const idNodo = cedente.id_fiscale_iva?.id_codice || cedente.id_codice;
```

**Logica:** Usa `id_fiscale_iva.id_codice` se presente, altrimenti `id_codice`.

---

## 🤔 Cosa Dovrebbe Essere

Per SDI SFTP, serve la **Partita IVA** (11 cifre), non il Codice Fiscale (16 caratteri).

- **Partita IVA:** 11 cifre (es. `02166430856`)
- **Codice Fiscale:** 16 caratteri (es. `SCZMNL05L21D960T`)

---

## ⚠️ Possibile Problema

Se `cedente.id_fiscale_iva.id_codice` contiene il Codice Fiscale invece della Partita IVA, allora:
- Dovremmo usare `cedente.id_codice` (che contiene la Partita IVA)
- O correggere la struttura dati

---

## 📝 Domanda per Utente

Puoi chiarire:
1. **Cosa contiene `cedente.id_fiscale_iva.id_codice`?** (Partita IVA o Codice Fiscale?)
2. **Cosa contiene `cedente.id_codice`?** (Partita IVA o Codice Fiscale?)
3. **Quale valore funzionava nei file vecchi?** (Partita IVA `02166430856` o Codice Fiscale?)

Così posso correggere la logica di estrazione.
