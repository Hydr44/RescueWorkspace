# 🔍 Spiegazione Errore 00105

**Data:** 14 gennaio 2026  
**Errore:** 00105 - Il riferimento temporale della firma digitale apposta non è coerente

---

## 📋 Dettagli Errore

**Notifica di Scarto:**
- **File:** IT02166430856_20.xml.p7m
- **Data Ricezione SDI:** 2026-01-14T16:58:00.000+01:00 (15:58 UTC)
- **Codice:** 00105
- **Descrizione:** Il riferimento temporale della firma digitale apposta non è coerente

---

## 🔍 Significato Errore 00105

**Secondo manuale "Controlli_Extra_XSD.md":**

- **Codice 00103:** Alla firma elettronica apposta al file **manca il riferimento temporale**
- **Codice 00105:** Il riferimento temporale associato alla firma elettronica apposta al file è **successivo alla data di ricezione del file**

**Problema:** Il `signingTime` nella firma è **successivo** alla data di ricezione del file da parte di SDI.

---

## 🐛 Causa Probabile

**OpenSSL aggiunge automaticamente `signingTime` quando firma:**
- OpenSSL `smime -sign` aggiunge automaticamente `signingTime` con timestamp corrente
- Se il server ha un orario diverso da SDI, o se c'è un ritardo tra firma e invio, il `signingTime` può essere successivo alla data di ricezione

**Esempio:**
- File firmato: 16:59:00 (ora server)
- File ricevuto da SDI: 15:58:00 (ora SDI)
- Errore 00105: signingTime (16:59) > data ricezione (15:58)

---

## ❓ Domanda Utente

**"ma nell'ultimo non era presente?"**

**Risposta:** Probabilmente NO, perché:
- L'ultimo file che ha superato i test obbligatori potrebbe essere stato firmato con node-forge (senza signingTime)
- Oppure il timestamp era coerente (signingTime < data ricezione)

---

## 💡 Soluzioni Possibili

### Soluzione 1: Rimuovere signingTime (se OpenSSL lo permette)
- OpenSSL potrebbe non permettere di rimuovere signingTime
- Potrebbe causare errore 00103 (manca riferimento temporale)

### Soluzione 2: Sincronizzare orario server
- Verificare che l'orario del server sia sincronizzato
- Usare NTP per sincronizzazione

### Soluzione 3: Usare node-forge (senza signingTime)
- node-forge non aggiunge signingTime se non specificato
- Potrebbe essere la soluzione migliore

---

## ⏳ Prossimi Passi

1. ⏳ Verificare quale file ha generato l'errore 00105
2. ⏳ Controllare se era firmato con OpenSSL o node-forge
3. ⏳ Verificare orario server vs orario SDI
4. ⏳ Considerare di usare node-forge (senza signingTime) invece di OpenSSL

---

**Status:** ⚠️ Errore 00105 - Riferimento temporale non coerente
