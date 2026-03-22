# 🔍 Analisi Errore 00105

**Data:** 14 gennaio 2026  
**Errore:** 00105 - Il riferimento temporale della firma digitale apposta non è coerente

---

## 📋 Dettagli Errore

**Notifica di Scarto:**
- **File:** IT02166430856_20.xml.p7m
- **Data Ricezione:** 2026-01-14T16:58:00.000+01:00
- **Codice:** 00105
- **Descrizione:** Il riferimento temporale della firma digitale apposta non è coerente

---

## 🔍 Significato Errore 00105

**Secondo manuale "Controlli_Extra_XSD.md":**
- **Codice 00103:** Alla firma elettronica apposta al file **manca il riferimento temporale**
- **Codice 00105:** Il riferimento temporale associato alla firma elettronica apposta al file è **successivo alla data di ricezione del file**

**Problema:** Il `signingTime` nella firma è **successivo** alla data di ricezione del file da parte di SDI.

---

## 🐛 Situazione Attuale

**Abbiamo rimosso `signingTime` per risolvere l'errore 00102:**
- ❌ `signingTime` rimosso da node-forge
- ⚠️ OpenSSL potrebbe aggiungere `signingTime` automaticamente

**Possibili cause:**
1. OpenSSL aggiunge `signingTime` con timestamp futuro
2. Timestamp non sincronizzato con l'ora di SDI
3. Timezone diverso tra server e SDI

---

## 💡 Soluzioni Possibili

### Soluzione 1: Aggiungere signingTime corretto
- Aggiungere `signingTime` con timestamp **precedente** alla data di ricezione
- Usare ora UTC sincronizzata

### Soluzione 2: Verificare comportamento OpenSSL
- OpenSSL potrebbe aggiungere `signingTime` automaticamente
- Verificare se possiamo controllare il timestamp

### Soluzione 3: Rimuovere signingTime (se permesso)
- Se 00103 non è un problema, rimuovere completamente
- Ma 00105 indica che c'è un signingTime presente

---

## ⏳ Prossimi Passi

1. ⏳ Verificare se OpenSSL aggiunge signingTime automaticamente
2. ⏳ Controllare timestamp nella firma
3. ⏳ Aggiungere signingTime corretto (se necessario)

---

**Status:** ⚠️ Errore 00105 - Riferimento temporale non coerente
