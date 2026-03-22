# ✅ Implementazione Approccio 2

**Data:** 13 gennaio 2026  
**Stato:** ✅ IMPLEMENTATO

---

## 📋 Cambiamenti Implementati

### Approccio 2: Firma XML Individuale → ZIP → Cifra ZIP

**Secondo manuale FatturaPA par. 2.2 caso c:**
> "In questo caso non è il file compresso (.zip) che deve essere firmato digitalmente, ma ogni singolo file in esso contenuto."

---

## 🔄 Modifiche al Codice

### Prima (Approccio 1 - Attuale):
```javascript
// 1. Crea ZIP con XML plain
const zip = new AdmZip();
xmlFiles.forEach(({ filename, content }) => {
  zip.addFile(filename, Buffer.from(content, 'utf8'));
});
const zipBuffer = zip.toBuffer();

// 2. Firma ZIP intero ❌
const signedBuffer = await signFile(zipBuffer, CERT_PATHS.firma, CERT_PATHS.password);
// 3. Cifra file firmato ❌
const encryptedBuffer = await encryptFile(signedBuffer, CERT_PATHS.sogeiPublic);
```

### Dopo (Approccio 2 - Nuovo):
```javascript
// 1. Per ogni XML: firma individualmente ✅
const xmlBuffer = Buffer.from(xmlContent, 'utf8');
const signedXmlBuffer = await signFile(xmlBuffer, CERT_PATHS.firma, CERT_PATHS.password);
const filename = `IT${idNodo}_${progressivo}.xml.p7m`; // Estensione .xml.p7m per CAdES-BES
xmlFiles.push({ filename, content: signedXmlBuffer });

// 2. Crea ZIP con XML firmati ✅
const zip = new AdmZip();
xmlFiles.forEach(({ filename, content }) => {
  zip.addFile(filename, Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8'));
});
const zipBuffer = zip.toBuffer();

// 3. Cifra ZIP (NON firma, XML già firmati) ✅
const encryptedBuffer = await encryptFile(zipBuffer, CERT_PATHS.sogeiPublic);
```

---

## 📝 Dettagli Implementazione

### 1. Firma XML Individuale
- Ogni XML viene firmato con PKCS#7 SignedData (CAdES-BES)
- Formato: binario PKCS#7
- Estensione file: `.xml.p7m` (CAdES-BES secondo manuale FatturaPA)
- Funzione: `signFile()` (già esistente, riutilizzata)

### 2. Creazione ZIP
- ZIP contiene file XML firmati (binari PKCS#7)
- Nomi file: `IT{idNodo}_{progressivo}.xml.p7m`
- Struttura conforme a manuale FatturaPA

### 3. Cifratura ZIP
- ZIP viene cifrato con PKCS#7 EnvelopedData
- Formato: binario PKCS#7 cifrato
- Funzione: `encryptFile()` (già esistente, riutilizzata)
- **NON viene più firmato il ZIP** (i file XML sono già firmati)

---

## 🎯 Differenze Chiave

| Aspetto | Approccio 1 (Vecchio) | Approccio 2 (Nuovo) |
|---------|----------------------|---------------------|
| **Firma** | ZIP intero | Ogni XML individualmente |
| **Estensione XML** | `.xml` (plain) | `.xml.p7m` (firmato PKCS#7) |
| **ZIP contiene** | XML plain | XML firmati (PKCS#7) |
| **ZIP viene** | Firmato + Cifrato | Solo Cifrato |
| **Conformità** | ❌ Non conforme manuale FatturaPA | ✅ Conforme manuale FatturaPA |

---

## 🧪 Prossimi Passi

1. **Deploy su VPS** - Caricare codice aggiornato
2. **Test invio fattura** - Inviare una fattura di test
3. **Monitorare esito SDI** - Verificare se l'errore "File di Quadratura non presente" si risolve
4. **Verificare file EO** - Controllare se SDI processa correttamente

---

## ⚠️ Note

- **Estensione .xml.p7m**: Usata per CAdES-BES (PKCS#7 SignedData)
- **Formato PKCS#7**: I file XML firmati sono binari, non più XML plain
- **Compatibilità**: Il codice mantiene compatibilità con struttura esistente (Buffer handling)
- **Conformità manuale**: Ora conforme a manuale FatturaPA par. 2.2 caso c
