# 🔍 Analisi Completa Errore SDI

**Data:** 13 gennaio 2026  
**Errore SDI:** "File di Quadratura non presente o mancanza dei documenti di fatturazione"  
**Status:** ⚠️ File arrivato ma SDI non trova i documenti

---

## 📋 Informazioni dal Manuale SFTP

### Struttura File Richiesta (Capitolo 7)

Dal manuale **Istruzioni-SDIFTP-v4.3**:

> "I supporti FI. ed FO. scambiati fra il client Sogei ed il server SFTP dell'Ente collegato, dovranno essere **file compressi** (contenenti i documenti da trasmettere allo SDI o inviati dallo SDI) **sottoposti a firma e cifratura**, nelle modalità descritte al precedente capitolo."

> "I file, seppur **firmati e cifrati** come descritto nel capitolo precedente, dovranno presentare la **sola estensione ".zip"**. La presenza di ulteriori estensioni non previste, comporta la rinomina e la mancata acquisizione del file."

### Requisiti Criptografici (SDI_SFTP_Massivi_v2)

- **Algoritmo di hash:** SHA-256 ✅
- **Lunghezza chiavi RSA:** 4096 bit (cifratura), 4096/2048 bit (firma) ✅
- **Algoritmo di cifratura:** AES-256 ✅

---

## 🔍 Processo Attuale (server.js)

### Sequenza Operazioni

1. ✅ **Crea ZIP** con file XML (righe 238-242)
   ```javascript
   const zip = new AdmZip();
   xmlFiles.forEach(({ filename, content }) => {
     zip.addFile(filename, Buffer.from(content, 'utf8'));
   });
   const zipBuffer = zip.toBuffer();
   ```

2. ✅ **Firma ZIP** con PKCS#7 SignedData (riga 245)
   ```javascript
   const signedBuffer = await signFile(zipBuffer, CERT_PATHS.firma, CERT_PATHS.password);
   ```

3. ✅ **Cifra file firmato** con PKCS#7 EnvelopedData (riga 246)
   ```javascript
   const encryptedBuffer = await encryptFile(signedBuffer, CERT_PATHS.sogeiPublic);
   ```

4. ✅ **Carica file cifrato** con estensione `.zip` (riga 277)
   ```javascript
   await sftp.put(encryptedBuffer, remotePath);
   ```

---

## ⚠️ Errore SDI

```
"Il supporto FI.02166430856.2026013.1006.984.260131142 
non è conforme al formato. 
File di Quadratura non presente o mancanza dei documenti di fatturazione"
```

### Interpretazione

Il "File di Quadratura" è un file XML che SDI **genera DOPO** aver elaborato il supporto. L'errore "File di Quadratura non presente" significa che:

**SDI non riesce a trovare/elaborare i documenti di fatturazione nel supporto**, quindi non può generare il file di quadratura.

---

## 🔍 Ipotesi Problema

### Ipotesi 1: Formato File Cifrato

Il file risultante dalla sequenza ZIP → Firma → Cifra è un **file binario PKCS#7 EnvelopedData**, non più un ZIP leggibile.

**Problema:** SDI potrebbe aspettarsi che dopo la decifratura ci sia un ZIP leggibile, ma forse il formato non è corretto o c'è un problema nella sequenza operazioni.

### Ipotesi 2: Sequenza Operazioni

**Attuale:** ZIP → Firma (SignedData) → Cifra (EnvelopedData)

Il manuale dice "sottoposti a firma e cifratura" ma non specifica l'ordine esatto. Forse l'ordine è diverso o c'è un problema nella combinazione.

### Ipotesi 3: Contenuto ZIP

Forse i file XML dentro il ZIP devono essere già firmati/cifrati prima di essere messi nello ZIP, oppure il ZIP deve contenere solo XML plain.

---

## 📝 Prossimi Passi

1. **Verificare manuale capitolo 6** - Leggere le specifiche esatte di firma e cifratura
2. **Analizzare file caricato** - Verificare formato, header, struttura
3. **Verificare esempi** - Se disponibili nel manuale o documentazione
4. **Testare sequenze alternative** - Se necessario

---

## 🎯 Note

Il fatto che il file sia arrivato al portale SDI è un **grande progresso**. Il problema ora è nel formato/cifratura, non nella connessione o nomenclatura.

