# 🔍 Verifica IdCodice - CF vs Partita IVA

**Domanda utente:** Perché ho messo il Codice Fiscale invece della Partita IVA negli approcci nuovi, quando la Partita IVA funzionava?

---

## 📋 Codice Attuale

### Nel server.js (nome file ZIP)
```javascript
const idNodo = cedente.id_fiscale_iva?.id_codice || cedente.id_codice;
```

### Nel xml-generator.js (IdCodice XML)
```javascript
const idCodice = cedente.id_fiscale_iva?.id_codice || cedente.id_codice;
```

**Logica:** Usa `id_fiscale_iva.id_codice` se presente, altrimenti `id_codice`.

---

## ⚠️ Problema Potenziale

L'utente dice che **con la Partita IVA funzionava**, quindi forse:
- Nei file vecchi che funzionavano usava la **Partita IVA**
- Negli approcci nuovi usa il **Codice Fiscale** (o viceversa)

---

## 🔍 Da Verificare

1. **Cosa contiene `id_fiscale_iva.id_codice`?**
   - Codice Fiscale?
   - Partita IVA?

2. **Cosa contiene `id_codice`?**
   - Codice Fiscale?
   - Partita IVA?

3. **Quale dovrebbe essere usato?**
   - Per SDI SFTP, serve la **Partita IVA** (es. `02166430856`)
   - Non il Codice Fiscale

---

## 💡 Possibile Soluzione

Se `id_fiscale_iva.id_codice` contiene il Codice Fiscale e `id_codice` contiene la Partita IVA, allora:
- Dovremmo usare `cedente.id_codice` (Partita IVA) invece di `id_fiscale_iva.id_codice`
- O cambiare l'ordine di priorità

---

## 📝 Prossimi Passi

1. Verificare struttura dati `cedente` nelle fatture
2. Capire cosa contiene `id_fiscale_iva.id_codice` vs `id_codice`
3. Correggere per usare Partita IVA (se necessario)
