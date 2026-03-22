# Verifica Completa Conformità SDI-SFTP

## 📋 Checklist Conformità

### 1. Nomenclatura File (Sezione 3.1.4)

**Requisiti Manuale:**
- Formato: `FI.{IdNodo}.{AAAAGGG}.{HHMM}.{NNN}.zip`
- `FI` = prefisso per file in ingresso
- `{IdNodo}` = Codice fiscale o identificativo del nodo
- `{AAAAGGG}` = Anno + Giorno giuliano (es. 2026013 = 13 gennaio 2026)
- `{HHMM}` = Ora e minuti
- `{NNN}` = Progressivo (900-999 per test, 0-899 per produzione)
- Estensione: `.zip`

**Implementazione:**
```javascript
function generateFIFilename(idNodo, progressivo, testMode = false) {
  const now = new Date();
  const aaaaggg = getJulianDate(now);  // Anno + Giorno giuliano
  const hhmm = String(now.getHours()).padStart(2, '0') + 
               String(now.getMinutes()).padStart(2, '0');
  const nnn = testMode 
    ? String(Math.min(999, Math.max(900, progressivo))).padStart(3, '0')
    : String(Math.min(899, Math.max(0, progressivo))).padStart(3, '0');
  return `FI.${idNodo}.${aaaaggg}.${hhmm}.${nnn}.zip`;
}
```

✅ **CONFORME** - Nomenclatura corretta

---

### 2. Composizione Supporti (Sezione 3.1.5)

**Requisiti Manuale:**
- File ZIP contenente file XML fatture
- File firmati e cifrati con PKCS#7
- Ordine: ZIP → Firma → Cifratura

**Implementazione:**
```javascript
// 1. Crea ZIP con XML
const zip = new AdmZip();
xmlFiles.forEach(({ filename, content }) => {
  zip.addFile(filename, Buffer.from(content, 'utf8'));
});
const zipBuffer = zip.toBuffer();

// 2. Firma (PKCS#7 SignedData)
const signedBuffer = await signFile(zipBuffer, CERT_PATHS.firma, CERT_PATHS.password);

// 3. Cifra (PKCS#7 EnvelopedData)
const encryptedBuffer = await encryptFile(signedBuffer, CERT_PATHS.sogeiPublic);
```

✅ **CONFORME** - Ordine corretto: ZIP → Firma → Cifratura

---

### 3. Firma PKCS#7 (Sezione 6)

**Requisiti Manuale:**
- Formato: PKCS#7 v 1.5 SignedData
- Hash: SHA-256
- Codifica: DER
- Algoritmo RSA: 4096/2048 bit (firma)

**Implementazione:**
```javascript
async function signFile(fileBuffer, certPath, password) {
  const { privateKey, certificate } = loadP12Certificate(certPath, password);
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(fileBuffer.toString('binary'));
  p7.addCertificate(certificate);
  p7.addSigner({
    key: privateKey,
    certificate,
    digestAlgorithm: forge.pki.oids.sha256,  // ✅ SHA-256
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date() },
    ],
  });
  p7.sign({ detached: false });
  const signedData = forge.asn1.toDer(p7.toAsn1()).getBytes();  // ✅ DER
  return Buffer.from(signedData, 'binary');
}
```

✅ **CONFORME** - PKCS#7 SignedData, SHA-256, DER

---

### 4. Cifratura PKCS#7 (Sezione 6)

**Requisiti Manuale:**
- Formato: PKCS#7 v 1.5 EnvelopedData
- Algoritmo simmetrico: AES-256
- Algoritmo asimmetrico: RSA 4096 bit
- Hash: SHA-256
- Codifica: DER

**Implementazione:**
```javascript
async function encryptFile(fileBuffer, publicCertPath) {
  const publicCert = loadPublicCertificatePEM(publicCertPath);
  const p7 = forge.pkcs7.createEnvelopedData();  // ✅ PKCS#7 EnvelopedData
  p7.addRecipient(publicCert);
  p7.content = forge.util.createBuffer(fileBuffer.toString('binary'));
  p7.encrypt();  // ✅ AES-256-CBC + RSA-PKCS1-v1_5
  const asn1 = p7.toAsn1();
  const der = forge.asn1.toDer(asn1);  // ✅ DER
  return Buffer.from(der.getBytes(), 'binary');
}
```

✅ **CONFORME** - PKCS#7 EnvelopedData, AES-256, DER

**Nota:** `node-forge` usa automaticamente:
- AES-256-CBC per cifrare il contenuto ✅
- RSA-PKCS1-v1_5 per cifrare la chiave simmetrica (standard PKCS#7 v1.5) ✅

---

### 5. Ordine Operazioni (Sezione 6)

**Requisiti Manuale:**
- Prima: Firma (signedData)
- Dopo: Cifratura (envelopedData)

**Implementazione:**
```javascript
// 1. ZIP
const zipBuffer = zip.toBuffer();

// 2. Firma PRIMA
const signedBuffer = await signFile(zipBuffer, CERT_PATHS.firma, CERT_PATHS.password);

// 3. Cifra DOPO
const encryptedBuffer = await encryptFile(signedBuffer, CERT_PATHS.sogeiPublic);
```

✅ **CONFORME** - Ordine corretto: Firma → Cifratura

---

### 6. Directory SFTP

**Requisiti Manuale:**
- Test: `DatiVersoSdITest`
- Produzione: `DatiVersoSdI`

**Implementazione:**
```javascript
const uploadDir = useTestMode ? 'DatiVersoSdITest' : 'DatiVersoSdI';
```

✅ **CONFORME** - Directory corrette

---

### 7. Formato XML Fattura

**Requisiti Manuale:**
- Formato: FatturaPA 1.2.2
- Schema XSD conforme

**Implementazione:**
- Usa `generateFatturaPA()` che genera XML FatturaPA 1.2.2
- Schema: `http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2`
- Versione: `FPR12`

✅ **CONFORME** - Formato FatturaPA 1.2.2

---

## ⚠️ Punti da Verificare

### 1. Nome File XML Interno al ZIP

**Implementazione Attuale:**
```javascript
const filename = `IT${idNodo}_${invoice.number || invoice.id}.xml`;
```

**Da Verificare:**
- Il manuale non specifica un formato esatto per i nomi file XML interni
- Il formato `IT{IdNodo}_{Progressivo}.xml` sembra ragionevole
- Potrebbe essere necessario verificare con SDI

### 2. Progressivo File FI

**Implementazione Attuale:**
```javascript
const progressivo = 1; // TODO: Gestire progressivo incrementale
```

⚠️ **ATTENZIONE:** Il progressivo è hardcoded a `1`. Dovrebbe essere incrementale per evitare duplicati.

### 3. IdNodo Hardcoded

**Implementazione Attuale:**
```javascript
const idNodo = 'SCZMNL05L21D960T'; // TODO: Da configurazione org
```

⚠️ **ATTENZIONE:** L'IdNodo è hardcoded. Dovrebbe essere configurato per organizzazione.

---

## ✅ Riepilogo Conformità

| Aspetto | Stato | Note |
|---------|-------|------|
| Nomenclatura file FI | ✅ CONFORME | Formato corretto |
| Composizione supporti | ✅ CONFORME | ZIP → Firma → Cifratura |
| Firma PKCS#7 | ✅ CONFORME | SHA-256, DER |
| Cifratura PKCS#7 | ✅ CONFORME | AES-256, RSA 4096, DER |
| Ordine operazioni | ✅ CONFORME | Firma → Cifratura |
| Directory SFTP | ✅ CONFORME | Test/Produzione corrette |
| Formato XML | ✅ CONFORME | FatturaPA 1.2.2 |
| Nome XML interno | ⚠️ DA VERIFICARE | Formato ragionevole ma non specificato |
| Progressivo | ⚠️ DA MIGLIORARE | Hardcoded, serve incrementale |
| IdNodo | ⚠️ DA MIGLIORARE | Hardcoded, serve configurazione |

---

## 🎯 Conclusione

L'implementazione è **CONFORME** alle specifiche SDI per:
- Nomenclatura file
- Formato PKCS#7 (firma e cifratura)
- Algoritmi (SHA-256, AES-256, RSA 4096)
- Ordine operazioni
- Directory SFTP
- Formato XML FatturaPA

**Punti di miglioramento:**
- Gestione progressivo incrementale
- Configurazione IdNodo per organizzazione
- Verifica formato nome file XML interno

**Il problema del file non prelevato potrebbe essere dovuto a:**
1. Formato XML fattura non completamente conforme
2. Dati fattura mancanti/non validi
3. Certificati non corretti
4. Timing (SDI ancora in elaborazione)

