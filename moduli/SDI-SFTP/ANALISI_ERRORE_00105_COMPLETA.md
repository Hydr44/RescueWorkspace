# 🔍 Analisi Completa Errore 00105

**Data:** 14 gennaio 2026  
**Errore:** 00105 - Il riferimento temporale della firma digitale apposta non è coerente

---

## 📋 Dettagli Errore

**Notifica di Scarto:**
- **File:** IT02166430856_20.xml.p7m
- **Data Ricezione SDI:** 2026-01-14T16:58:00.000+01:00 (15:58 UTC)
- **Supporto FO:** FO.02166430856.2026014.1832.901.zip
- **Codice:** 00105
- **Descrizione:** Il riferimento temporale della firma digitale apposta non è coerente

---

## 🔍 Significato Errore 00105

**Secondo manuale "Controlli_Extra_XSD.md":**

- **Codice 00103:** Alla firma elettronica apposta al file **manca il riferimento temporale**
- **Codice 00105:** Il riferimento temporale associato alla firma elettronica apposta al file è **successivo alla data di ricezione del file**

**Problema:** Il `signingTime` nella firma è **successivo** alla data di ricezione del file da parte di SDI.

---

## ❓ Domanda: Era Presente nell'Ultimo?

**Risposta:** Probabilmente **NO**, perché:

1. **File che hanno superato i test:**
   - Potrebbero essere stati firmati con **node-forge** (senza signingTime)
   - Oppure il timestamp era coerente (signingTime < data ricezione)

2. **File con errore 00105:**
   - Probabilmente firmato con **OpenSSL** (aggiunge signingTime automaticamente)
   - Il timestamp era successivo alla data di ricezione

---

## 🐛 Causa Probabile

**OpenSSL aggiunge automaticamente `signingTime`:**
- OpenSSL `smime -sign` aggiunge automaticamente `signingTime` con timestamp corrente
- Se il server ha un orario diverso da SDI, o se c'è un ritardo tra firma e invio, il `signingTime` può essere successivo alla data di ricezione

**Esempio:**
- File firmato: 16:59:00 (ora server)
- File ricevuto da SDI: 15:58:00 (ora SDI)
- Errore 00105: signingTime (16:59) > data ricezione (15:58)

---

## 💡 Soluzioni

### Soluzione 1: Usare node-forge (senza signingTime)
- node-forge non aggiunge signingTime se non specificato
- Potrebbe causare errore 00103 (manca riferimento temporale) - ma se non viene segnalato, è OK

### Soluzione 2: Sincronizzare orario server
- Verificare che l'orario del server sia sincronizzato
- Usare NTP per sincronizzazione

### Soluzione 3: Verificare comportamento OpenSSL
- OpenSSL aggiunge signingTime automaticamente
- Non c'è modo diretto di controllarlo (tranne `-noattr` che rimuove tutti gli attributi)

---

## ⏳ Prossimi Passi

1. ⏳ Verificare quale file ha generato l'errore 00105
2. ⏳ Controllare se era firmato con OpenSSL o node-forge
3. ⏳ Verificare orario server vs orario SDI
4. ⏳ Considerare di usare node-forge (senza signingTime) invece di OpenSSL

---

**Status:** ⚠️ Errore 00105 - Riferimento temporale non coerente (probabilmente OpenSSL aggiunge signingTime)
