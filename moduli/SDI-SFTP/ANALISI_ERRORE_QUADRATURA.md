# 🔍 Analisi Errore "File di Quadratura non presente"

**Data:** 13 gennaio 2026  
**Errore SDI:** "File di Quadratura non presente o mancanza dei documenti di fatturazione"  
**Status:** ⚠️ File arrivato ma SDI non trova i documenti

---

## 📋 Informazioni dal Manuale SFTP

Dal manuale **Istruzioni-SDIFTP-v4.3** (capitolo 7):

### Struttura File Richiesta

> "I supporti FI. ed FO. scambiati fra il client Sogei ed il server SFTP dell'Ente collegato, dovranno essere **file compressi** (contenenti i documenti da trasmettere allo SDI o inviati dallo SDI) **sottoposti a firma e cifratura**, nelle modalità descritte al precedente capitolo."

> "I file, seppur **firmati e cifrati** come descritto nel capitolo precedente, dovranno presentare la **sola estensione ".zip"**. La presenza di ulteriori estensioni non previste, comporta la rinomina e la mancata acquisizione del file."

### Processo Attuale (server.js)

1. ✅ **Crea ZIP** con file XML (righe 238-242)
2. ✅ **Firma ZIP** con PKCS#7 SignedData (riga 245)
3. ✅ **Cifra file firmato** con PKCS#7 EnvelopedData (riga 246)
4. ✅ **Carica file cifrato** con estensione `.zip` (riga 277)

---

## 🔍 Analisi Problema

### Errore SDI
```
"Il supporto FI.02166430856.2026013.1006.984.260131142 
non è conforme al formato. 
File di Quadratura non presente o mancanza dei documenti di fatturazione"
```

### Interpretazione

L'errore "File di Quadratura non presente" potrebbe significare:

1. **SDI non riesce a decifrare il file** → Non può accedere ai documenti
2. **SDI non riesce a verificare la firma** → Non può processare il file
3. **Il formato del file cifrato non è corretto** → SDI non riconosce la struttura
4. **I documenti non sono accessibili dopo la decifratura** → Problema nella sequenza firma/cifra

---

## 🔍 Ipotesi da Verificare

### Ipotesi 1: Sequenza Operazioni Sbagliata
**Attuale:** ZIP → Firma → Cifra  
**Possibile:** ZIP → Cifra → Firma (o altro ordine)

### Ipotesi 2: Formato Cifratura
Il file cifrato con PKCS#7 EnvelopedData potrebbe non essere nel formato che SDI si aspetta per SFTP.

### Ipotesi 3: Contenuto ZIP
Forse i file XML dentro il ZIP devono essere già firmati/cifrati prima di essere messi nello ZIP.

---

## 📝 Prossimi Passi

1. **Verificare manuale completo** - Leggere capitolo precedente (firma e cifratura)
2. **Analizzare file caricato** - Verificare formato e struttura
3. **Verificare esempi** - Se disponibili nel manuale
4. **Testare sequenze alternative** - Se necessario

