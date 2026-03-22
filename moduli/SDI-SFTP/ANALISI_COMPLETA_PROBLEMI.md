# 🔍 Analisi Completa Problemi SDI

**Data:** 13 gennaio 2026  
**Obiettivo:** Identificare TUTTI i problemi che potrebbero causare l'errore "File di Quadratura non presente"

---

## 📋 Problemi Identificati

### 🔴 PROBLEMA 1: Firma File ZIP vs File XML Individuali

**Descrizione:**
- **Manuale FatturaPA (par. 2.2, caso c)**: Dice che per file compresso ZIP, **NON si firma il ZIP**, ma **ogni singolo file XML contenuto**
- **Attuale implementazione**: Firmiamo il ZIP intero, poi cifriamo

**Codice attuale (server.js, righe 246-255):**
```javascript
// Crea ZIP con XML plain
const zip = new AdmZip();
xmlFiles.forEach(({ filename, content }) => {
  zip.addFile(filename, Buffer.from(content, 'utf8'));
});
const zipBuffer = zip.toBuffer();

// Firma il ZIP intero ❌
const signedBuffer = await signFile(zipBuffer, CERT_PATHS.firma, CERT_PATHS.password);
// Cifra il file firmato ❌
const encryptedBuffer = await encryptFile(signedBuffer, CERT_PATHS.sogeiPublic);
```

**Cosa dice il manuale FatturaPA:**
> "In questo caso non è il file compresso (.zip) che deve essere firmato digitalmente, ma ogni singolo file in esso contenuto."

**⚠️ DISCREPANZA:** 
- Manuale SFTP dice che i supporti FI devono essere "firmati e cifrati" (per la trasmissione SFTP)
- Manuale FatturaPA dice che i file XML dentro il ZIP devono essere firmati individualmente
- **Da verificare**: Per SFTP, forse serve FIRMARE ogni XML individualmente, POI mettere nello ZIP, POI cifrare il ZIP per SFTP?

**Priorità:** 🔴 ALTA

---

### 🟡 PROBLEMA 2: Formato Firma XML

**Descrizione:**
- Il manuale FatturaPA menziona due formati di firma:
  - **XAdES-BES**: Estensione `.xml`
  - **CAdES-BES**: Estensione `.xml.p7m`

**Attuale implementazione:**
- Non firmiamo i file XML individualmente
- Se dovessimo firmarli, quale formato usare?

**Priorità:** 🟡 MEDIA (dipende dalla soluzione del Problema 1)

---

### 🟡 PROBLEMA 3: Verifica Algoritmi Cifratura

**Descrizione:**
- Manuale SFTP richiede:
  - **Algoritmo hash:** SHA-256 ✅
  - **Lunghezza chiavi RSA:** 4096 bit (cifratura), 4096/2048 bit (firma) ⚠️
  - **Algoritmo cifratura:** AES-256 ✅

**Codice attuale (server.js, righe 122-173):**
```javascript
// Firma: usa SHA-256 ✅
digestAlgorithm: forge.pki.oids.sha256,

// Cifratura: node-forge usa automaticamente AES-256-CBC ✅
// RSA-PKCS1-v1_5 per cifrare chiave simmetrica ✅
```

**⚠️ DA VERIFICARE:**
- Lunghezza chiavi RSA dei certificati (4096 bit?)
- Algoritmo esatto per cifratura (AES-256-CBC?)

**Priorità:** 🟡 MEDIA

---

### 🟢 PROBLEMA 4: Nome File XML Interni (RISOLTO)

**Descrizione:**
- Progressivo file XML interno deve essere alfanumerico, max 5 caratteri
- **STATUS:** ✅ CORRETTO (già fixato)

**Priorità:** 🟢 BASSA (già risolto)

---

### 🟡 PROBLEMA 5: Struttura ZIP

**Descrizione:**
- Verificare che il ZIP contenga solo file XML
- Verificare che non ci siano directory o altri file
- Verificare che i nomi file siano conformi

**Codice attuale:**
- Sembra corretto, ma da verificare con un file reale

**Priorità:** 🟡 MEDIA

---

### 🟡 PROBLEMA 6: Sequenza Operazioni

**Descrizione:**
- Attuale: ZIP → Firma ZIP → Cifra
- Possibile alternativa 1: Firma XML → ZIP → Cifra ZIP
- Possibile alternativa 2: ZIP → Cifra ZIP → Firma (diverso ordine)

**Priorità:** 🟡 MEDIA (dipende dalla soluzione del Problema 1)

---

### 🟡 PROBLEMA 7: Validazione XML FatturaPA

**Descrizione:**
- Verificare che gli XML generati siano conformi a FatturaPA 1.2.2
- Verificare che passino tutti i controlli XSD
- **STATUS:** ✅ Dovrebbe essere OK (già verificato in xml-generator.js)

**Priorità:** 🟡 MEDIA (verificare se ci sono errori XML nel file EO)

---

## 🎯 Piano di Test

### Test 1: Approccio Attuale (ZIP → Firma ZIP → Cifra)
- **Stato:** ❌ Già testato, errore "File di Quadratura non presente"
- **Risultato:** Non funziona

### Test 2: Approccio Alternativo 1 (Firma XML → ZIP → Cifra ZIP)
- **Descrizione:** Firmare ogni file XML individualmente, mettere nello ZIP, cifrare il ZIP
- **Implementazione necessaria:**
  1. Firmare ogni XML con PKCS#7 SignedData
  2. Aggiungere XML firmati allo ZIP
  3. Cifrare il ZIP con PKCS#7 EnvelopedData

### Test 3: Approccio Alternativo 2 (ZIP → Cifra → Firma)
- **Descrizione:** Creare ZIP, cifrare, poi firmare (ordine diverso)
- **Implementazione necessaria:**
  1. Creare ZIP con XML plain
  2. Cifrare ZIP
  3. Firmare file cifrato

---

## 📝 Prossimi Passi

1. **Verificare manuale SFTP completo** - Capire esattamente cosa richiede
2. **Implementare Test 2** - Firma XML individuale → ZIP → Cifra
3. **Implementare Test 3** - ZIP → Cifra → Firma (se necessario)
4. **Testare entrambi gli approcci** - Vedere quale funziona
5. **Verificare altri problemi** - Algoritmi, formati, validazioni

---

## 🔍 Note Aggiuntive

- L'errore "File di Quadratura non presente" suggerisce che SDI non riesce a processare i documenti
- Il fatto che il file venga prelevato da SDI significa che formato esterno e trasmissione SFTP sono corretti
- Il problema è probabilmente nella struttura/contenuto del file dopo la decifratura
