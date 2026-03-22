# 📋 Piano Test Due Approcci

**Obiettivo:** Testare entrambi gli approcci per identificare quale funziona

---

## 🧪 Approccio 1: Attuale (ZIP → Firma ZIP → Cifra)

**Descrizione:**
- Creare ZIP con XML plain
- Firmare il ZIP intero
- Cifrare il file firmato

**Stato:** ❌ Già testato, errore "File di Quadratura non presente"

---

## 🧪 Approccio 2: Firma XML Individuale → ZIP → Cifra ZIP

**Descrizione:**
- Firmare ogni file XML individualmente con PKCS#7 SignedData
- Mettere gli XML firmati nello ZIP
- Cifrare il ZIP con PKCS#7 EnvelopedData

**Implementazione:**
1. Per ogni XML:
   - Generare XML FatturaPA
   - Firmare XML con `signFile()` (PKCS#7 SignedData)
   - Aggiungere XML firmato allo ZIP (estensione `.xml.p7m` o `.xml`)
2. Creare ZIP con tutti gli XML firmati
3. Cifrare ZIP con `encryptFile()` (PKCS#7 EnvelopedData)
4. Caricare file cifrato su SFTP

**Nota:** 
- Il manuale FatturaPA dice di firmare ogni file XML individualmente
- Per CAdES-BES, l'estensione dovrebbe essere `.xml.p7m`
- Per XAdES-BES, l'estensione dovrebbe essere `.xml`
- **DA DECIDERE:** Quale formato usare? (Probabilmente CAdES-BES con `.xml.p7m`)

---

## 🔄 Come Implementare il Test

### Opzione A: Flag nella richiesta
Aggiungere parametro `sign_method` nella richiesta:
- `sign_method: "zip"` → Approccio 1 (attuale)
- `sign_method: "individual"` → Approccio 2 (nuovo)

### Opzione B: Due endpoint separati
- `/api/sdi-sftp/send` → Approccio 1
- `/api/sdi-sftp/send-v2` → Approccio 2

### Opzione C: Due versioni del codice
- `server.js` → Approccio 1
- `server-v2.js` → Approccio 2
- Testare separatamente

---

## 💡 Raccomandazione

**Opzione A (Flag nella richiesta)** perché:
- ✅ Permette test rapidi
- ✅ Non richiede deploy multipli
- ✅ Facile da switchare
- ✅ Possibile mantenere entrambi per compatibilità

---

## 📝 Modifiche Codice Necessarie

### Per Approccio 2:

1. **Firmare XML individuali:**
   ```javascript
   // Per ogni XML
   const xmlContent = generateFatturaPA(invoice);
   const signedXmlBuffer = await signFile(
     Buffer.from(xmlContent, 'utf8'),
     CERT_PATHS.firma,
     CERT_PATHS.password
   );
   // Estensione: .xml.p7m per CAdES-BES
   const filename = `IT${idNodo}_${progressivo}.xml.p7m`;
   xmlFiles.push({ filename, content: signedXmlBuffer });
   ```

2. **Creare ZIP con XML firmati:**
   ```javascript
   const zip = new AdmZip();
   xmlFiles.forEach(({ filename, content }) => {
     zip.addFile(filename, Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8'));
   });
   const zipBuffer = zip.toBuffer();
   ```

3. **Cifrare ZIP:**
   ```javascript
   const encryptedBuffer = await encryptFile(zipBuffer, CERT_PATHS.sogeiPublic);
   ```

---

## ⚠️ Domande Aperte

1. **Estensione file XML firmati:**
   - `.xml` (XAdES-BES) o `.xml.p7m` (CAdES-BES)?
   - Il manuale menziona entrambi, quale è corretto per SDI SFTP?

2. **Formato firma PKCS#7:**
   - Attuale: `detached: false` (firma attached)
   - È corretto per file XML individuali?

3. **Verifica manuale SFTP:**
   - Il manuale SFTP conferma che per SFTP serve questo approccio?
   - O c'è una differenza tra manuale FatturaPA e manuale SFTP?
