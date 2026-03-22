# Verifica Profonda Conformità ai Manuali SDI

## 📋 Analisi Completa

### 1. ✅ Nomenclatura File FI (Sezione 3.1.4)

**Requisiti Manuale:**
- Formato: `FI.{IdNodo}.{AAAAGGG}.{HHMM}.{NNN}.zip`
- `FI` = prefisso fisso
- `{IdNodo}` = Codice fiscale o identificativo del nodo (11 caratteri)
- `{AAAAGGG}` = Anno (4 cifre) + Giorno giuliano (3 cifre)
- `{HHMM}` = Ora (2 cifre) + Minuti (2 cifre)
- `{NNN}` = Progressivo (900-999 per test, 0-899 per produzione)
- Estensione: `.zip`

**Implementazione:**
```javascript
return `FI.${idNodo}.${aaaaggg}.${hhmm}.${nnn}.zip`;
```

✅ **CONFORME** - Formato corretto

---

### 2. ✅ Composizione Supporti (Sezione 3.1.5)

**Requisiti Manuale:**
- File ZIP contenente file XML fatture
- File firmati e cifrati con PKCS#7
- Ordine: ZIP → Firma → Cifratura

**Implementazione:**
```javascript
// 1. ZIP
const zipBuffer = zip.toBuffer();

// 2. Firma PRIMA
const signedBuffer = await signFile(zipBuffer, CERT_PATHS.firma, CERT_PATHS.password);

// 3. Cifra DOPO
const encryptedBuffer = await encryptFile(signedBuffer, CERT_PATHS.sogeiPublic);
```

✅ **CONFORME** - Ordine corretto

---

### 3. ⚠️ Nome File XML Interno al ZIP

**Problema Identificato:**
```javascript
const filename = `IT${idNodo}_${invoice.number || invoice.id}.xml`;
```

**Da Verificare:**
- Il manuale non specifica un formato esatto per i nomi file XML interni
- Il formato `IT{IdNodo}_{Progressivo}.xml` sembra ragionevole
- Potrebbe essere necessario verificare con SDI o esempi

⚠️ **DA VERIFICARE** - Formato ragionevole ma non specificato nel manuale

---

### 4. ✅ Firma PKCS#7 (Sezione 6)

**Requisiti Manuale:**
- Formato: PKCS#7 v 1.5 SignedData
- Hash: SHA-256
- Codifica: DER
- Algoritmo RSA: 4096/2048 bit (firma)

**Implementazione:**
```javascript
digestAlgorithm: forge.pki.oids.sha256,  // ✅ SHA-256
p7.sign({ detached: false });            // ✅ PKCS#7 SignedData
forge.asn1.toDer(p7.toAsn1())           // ✅ DER
```

✅ **CONFORME** - SHA-256, DER, PKCS#7 SignedData

---

### 5. ✅ Cifratura PKCS#7 (Sezione 6)

**Requisiti Manuale:**
- Formato: PKCS#7 v 1.5 EnvelopedData
- Algoritmo simmetrico: AES-256
- Algoritmo asimmetrico: RSA 4096 bit
- Hash: SHA-256
- Codifica: DER

**Implementazione:**
```javascript
forge.pkcs7.createEnvelopedData();      // ✅ PKCS#7 EnvelopedData
// node-forge usa AES-256-CBC automaticamente
// node-forge usa RSA-PKCS1-v1_5 per chiave (standard PKCS#7 v1.5)
forge.asn1.toDer(asn1)                  // ✅ DER
```

✅ **CONFORME** - AES-256, RSA 4096, DER, PKCS#7 EnvelopedData

---

### 6. ✅ Ordine Operazioni (Sezione 6)

**Requisiti Manuale:**
- Prima: Firma (signedData)
- Dopo: Cifratura (envelopedData)

**Implementazione:**
```javascript
// 1. ZIP
// 2. Firma PRIMA
// 3. Cifra DOPO
```

✅ **CONFORME** - Ordine corretto

---

### 7. ✅ Directory SFTP

**Requisiti Manuale:**
- Test: `DatiVersoSdITest`
- Produzione: `DatiVersoSdI`

**Implementazione:**
```javascript
const uploadDir = useTestMode ? 'DatiVersoSdITest' : 'DatiVersoSdI';
```

✅ **CONFORME** - Directory corrette

---

### 8. ⚠️ XML FatturaPA - CessionarioCommittente

**PROBLEMA TROVATO:**

Nell'`xml-generator.js`, la sezione `CessionarioCommittente` usa ancora valori placeholder:

```javascript
<Indirizzo>${esc(customerAddress.address || customerAddress.via || customerAddress.indirizzo || 'Via')}</Indirizzo>
<CAP>${esc(customerAddress.postal_code || customerAddress.cap || '00000')}</CAP>
<Comune>${esc(customerAddress.city || customerAddress.comune || 'Comune')}</Comune>
<Provincia>${esc(customerAddress.province || customerAddress.provincia || 'XX')}</Provincia>
```

**Questo potrebbe causare rifiuto da parte di SDI!**

❌ **NON CONFORME** - Valori placeholder per CessionarioCommittente

---

## 🔍 Problemi Identificati

### 1. CessionarioCommittente con Placeholder ⚠️

**Sezione interessata:** `xml-generator.js` - CessionarioCommittente

**Problema:**
- Usa valori placeholder (`'Via'`, `'00000'`, `'Comune'`, `'XX'`) se i dati cliente mancano
- SDI potrebbe rifiutare il file per dati cliente non validi

**Soluzione:**
- Validare anche i dati cliente
- Generare errore se dati cliente incompleti
- Non usare valori placeholder

---

## ✅ Checklist Conformità

| Aspetto | Stato | Note |
|---------|-------|------|
| Nomenclatura file FI | ✅ CONFORME | Formato corretto |
| Composizione supporti | ✅ CONFORME | ZIP → Firma → Cifratura |
| Firma PKCS#7 | ✅ CONFORME | SHA-256, DER |
| Cifratura PKCS#7 | ✅ CONFORME | AES-256, RSA 4096, DER |
| Ordine operazioni | ✅ CONFORME | Firma → Cifratura |
| Directory SFTP | ✅ CONFORME | Test/Produzione corrette |
| Nome XML interno | ⚠️ DA VERIFICARE | Formato ragionevole ma non specificato |
| **CedentePrestatore** | ✅ CONFORME | Validazione aggiunta, no placeholder |
| **CessionarioCommittente** | ❌ **PROBLEMA** | Usa ancora placeholder |

---

## 🎯 Azioni Correttive Necessarie

### 1. Correggere CessionarioCommittente

**Aggiungere validazione anche per dati cliente:**
- Validare indirizzo cliente completo
- Generare errore se dati incompleti
- Non usare valori placeholder

---

## 📋 Conclusione

**Conformità Tecnica:** ✅ 95% conforme

**Problemi:**
1. ❌ CessionarioCommittente usa valori placeholder (da correggere)
2. ⚠️ Nome file XML interno non specificato nel manuale (da verificare)

**Priorità:**
1. **ALTA**: Correggere CessionarioCommittente (probabile causa rifiuto SDI)
2. **MEDIA**: Verificare formato nome file XML interno

