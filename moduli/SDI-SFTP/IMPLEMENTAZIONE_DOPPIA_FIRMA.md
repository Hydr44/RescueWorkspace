# ✅ Implementazione Doppia Firma

**Data:** 13 gennaio 2026  
**Approccio:** Firma XML Individuale + Firma ZIP + Cifra ZIP

---

## 🔑 Motivazione

### Manuale SFTP (Istruzioni-SDIFTP-v4.3, Cap. 7)

> "I **supporti FI. ed FO.** scambiati fra il client Sogei ed il server SFTP dell'Ente collegato, dovranno essere **file compressi** (contenenti i documenti da trasmettere allo SDI o inviati dallo SDI) **sottoposti a firma e cifratura**, nelle modalità descritte al precedente capitolo."

**Interpretazione:**
- I "supporti FI" (file ZIP) devono essere "sottoposti a firma e cifratura"
- Questo significa che il ZIP stesso deve essere firmato (oltre ai file XML dentro)

---

## 📋 Sequenza Operazioni (Doppia Firma)

### Livello 1: Struttura Contenuto (FatturaPA)
1. ✅ **Firmare ogni file XML individualmente** (PKCS#7 SignedData, CAdES-BES)
   - Estensione: `.xml.p7m`
   - Conforme a manuale FatturaPA par. 2.2 caso c

### Livello 2: Trasmissione SFTP (Manuali SFTP)
2. ✅ **Mettere XML firmati nello ZIP**
3. ✅ **Firmare il ZIP** (PKCS#7 SignedData)
   - Per la trasmissione SFTP
   - Conforme a Istruzioni-SDIFTP-v4.3 cap. 7
4. ✅ **Cifrare il ZIP firmato** (PKCS#7 EnvelopedData)
   - Per la trasmissione SFTP
   - Conforme a Istruzioni-SDIFTP-v4.3 cap. 7

---

## 🔄 Processo Completo

```
XML Plain
  ↓
[Firma XML individuale] → XML Firmato (.xml.p7m)
  ↓
[ZIP con XML firmati] → ZIP con XML firmati
  ↓
[Firma ZIP] → ZIP Firmato
  ↓
[Cifra ZIP] → ZIP Firmato e Cifrato
  ↓
[Upload SFTP]
```

---

## ⚠️ Conflitto con FatturaPA?

**Manuale FatturaPA (Par. 2.2 caso c):**
> "**non è il file compresso (.zip) che deve essere firmato digitalmente**, ma ogni singolo file in esso contenuto."

**Interpretazione:**
- Il manuale FatturaPA si riferisce alla **struttura del contenuto** (cosa c'è dentro il ZIP)
- Il manuale SFTP si riferisce alla **trasmissione** (come viene trasmesso il supporto)
- **Non sono in conflitto**: entrambi i requisiti devono essere soddisfatti

---

## ✅ Implementazione

**Codice modificato:**
```javascript
// 1. Firma XML individuali
const signedXmlBuffer = await signFile(xmlBuffer, CERT_PATHS.firma, CERT_PATHS.password);

// 2. Crea ZIP con XML firmati
const zip = new AdmZip();
xmlFiles.forEach(({ filename, content }) => {
  zip.addFile(filename, signedXmlBuffer);
});
const zipBuffer = zip.toBuffer();

// 3. Firma il ZIP (doppia firma)
const signedZipBuffer = await signFile(zipBuffer, CERT_PATHS.firma, CERT_PATHS.password);

// 4. Cifra il ZIP firmato
const encryptedBuffer = await encryptFile(signedZipBuffer, CERT_PATHS.sogeiPublic);
```

---

## 🎯 Vantaggi

- ✅ Conforme a manuale FatturaPA (XML firmati individualmente)
- ✅ Conforme a manuale SFTP (supporto firmato e cifrato)
- ✅ Doppio livello di sicurezza (contenuto + trasmissione)

---

## 📝 Prossimi Passi

1. ✅ Codice implementato
2. ⏳ Deploy su VPS
3. ⏳ Test con fattura
4. ⏳ Verificare se risolve l'errore "File di Quadratura non presente"
