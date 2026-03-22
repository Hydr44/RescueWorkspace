# 🔍 Analisi Struttura ZIP

**Data:** 13 gennaio 2026  
**Obiettivo:** Capire la struttura del ZIP generato per identificare il problema

---

## 📋 Struttura ZIP Attuale (dal Codice)

### Processo di Generazione (server.js)

#### 1. Generazione XML
```javascript
const xmlContent = generateFatturaPA(invoice);
const xmlBuffer = Buffer.from(xmlContent, 'utf8');
```

#### 2. Firma XML Individuale (Approccio 2 - Doppia Firma)
```javascript
const signedXmlBuffer = await signFile(xmlBuffer, CERT_PATHS.firma, CERT_PATHS.password);
// File firmato è PKCS#7 SignedData (CAdES-BES)
// Estensione: .xml.p7m
```

#### 3. Nome File XML Interno
```javascript
// Nome file XML interno: IT{idNodo}_{progressivo}.xml.p7m
const filename = `IT${idNodo}_${progressivo}.xml.p7m`;
xmlFiles.push({ filename, content: signedXmlBuffer });
```

**Formato nome file interno:**
- `IT{IdCodice}_{progressivo}.xml.p7m`
- Esempio: `IT02166430856_00001.xml.p7m`

#### 4. Creazione ZIP
```javascript
const zip = new AdmZip();
xmlFiles.forEach(({ filename, content }) => {
  zip.addFile(filename, signedXmlBuffer); // XML già firmato (PKCS#7)
});
const zipBuffer = zip.toBuffer();
```

#### 5. Firma ZIP (Doppia Firma)
```javascript
const signedZipBuffer = await signFile(zipBuffer, CERT_PATHS.firma, CERT_PATHS.password);
```

#### 6. Cifra ZIP Firmato
```javascript
const encryptedBuffer = await encryptFile(signedZipBuffer, CERT_PATHS.sogeiPublic);
// Risultato: PKCS#7 EnvelopedData
```

---

## 📦 Struttura ZIP Teorica

### Prima della Cifratura (ZIP Plain)

```
FI.02166430856.2026013.1732.957.zip (plain)
└── IT02166430856_00001.xml.p7m (PKCS#7 SignedData)
    └── [Contenuto XML FatturaPA firmato]
```

**Nota:** Il file dentro il ZIP è già firmato (`.xml.p7m`), non è XML plain.

---

## ⚠️ Problema Potenziale Identificato

### File di Quadratura

L'errore "File di Quadratura non presente" potrebbe significare che:

1. **SDI si aspetta XML plain dentro il ZIP** (non firmato)
2. **SDI si aspetta un file aggiuntivo** (file di quadratura)
3. **Il formato `.xml.p7m` non è corretto** per il contenuto ZIP
4. **Il nome file interno non è corretto**

---

## 🔍 Verifica Manuale FatturaPA

Secondo il manuale FatturaPA par. 2.2 caso c:
> "In questo caso **non è il file compresso (.zip) che deve essere firmato digitalmente, ma ogni singolo file in esso contenuto.**"

**Interpretazione:**
- I file XML dentro il ZIP devono essere firmati individualmente
- Il formato `.xml.p7m` (PKCS#7 SignedData) è corretto

**MA:** Il manuale SFTP dice che il supporto (ZIP) deve essere "sottoposto a firma e cifratura".

---

## 💡 Possibili Problemi

### 1. Doppia Firma
- XML firmati individualmente ✅
- ZIP firmato ✅
- ZIP cifrato ✅

Ma forse SDI si aspetta che:
- Il ZIP contenga XML plain (non firmati)
- Il ZIP stesso sia firmato e cifrato

### 2. Formato File Interno
- Nome: `IT{IdCodice}_{progressivo}.xml.p7m` ✅
- Ma forse SDI si aspetta `.xml` invece di `.xml.p7m`?

### 3. Struttura ZIP
- Un solo file XML dentro il ZIP
- Forse SDI si aspetta una struttura diversa?

---

## 📞 Contattare Assistenza SDI

### Informazioni da Fornire

1. **IdCodice:** 02166430856
2. **File in errore:** FI.02166430856.2026013.1732.957.zip
3. **Errore:** "File di Quadratura non presente o mancanza dei documenti di fatturazione"
4. **Struttura ZIP:**
   - Contiene file `IT02166430856_00001.xml.p7m` (PKCS#7 SignedData)
   - ZIP è firmato (PKCS#7 SignedData)
   - ZIP è cifrato (PKCS#7 EnvelopedData)
5. **Domande:**
   - Quale struttura ZIP è corretta?
   - I file XML dentro il ZIP devono essere firmati (.xml.p7m) o plain (.xml)?
   - Cosa significa "File di Quadratura"?
   - Il supporto ZIP deve essere solo cifrato o anche firmato?

---

## 🎯 Prossimi Passi

1. **Contattare assistenza SDI** con le informazioni sopra
2. **Aspettare risposta** per chiarimenti
3. **Regolare struttura** in base alle indicazioni
4. **Testare** con nuovo file
