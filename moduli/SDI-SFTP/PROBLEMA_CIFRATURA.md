# 🚨 PROBLEMA CIFRATURA FILE SDI-SFTP

## ⚠️ PROBLEMA IDENTIFICATO

Nel file `server-vps/server.js`, la funzione `encryptFile()` ha un **TODO critico**:

```javascript
// TODO: Formato PKCS#7 EnvelopedData completo secondo specifiche SDI
const result = Buffer.concat([
  Buffer.from(encryptedKey, 'binary'),
  Buffer.from(iv, 'binary'),
  Buffer.from(encrypted.getBytes(), 'binary'),
]);
```

## 📋 COSA STA FACENDO ORA

Il codice attuale:
1. ✅ Cifra il file con **AES-256-CBC** (corretto)
2. ✅ Cifra la chiave simmetrica con **RSA-OAEP** (corretto)
3. ❌ **Concatena** semplicemente: `encryptedKey + IV + encryptedData` (SBAGLIATO!)

## ❌ COSA MANCA

SDI si aspetta un formato **PKCS#7 EnvelopedData** completo secondo standard ASN.1, non una semplice concatenazione raw.

Il formato PKCS#7 EnvelopedData include:
- Struttura ASN.1 conforme
- Version
- RecipientInfos (con chiave cifrata RSA-OAEP)
- EncryptedContentInfo (con algoritmo AES-256-CBC, IV, dati cifrati)
- Altri campi standard

## 🔍 IMPATTO

**Questo potrebbe essere il motivo per cui SDI non preleva i file!**

SDI probabilmente:
1. Tenta di decifrare il file
2. Non riesce perché il formato non è PKCS#7 EnvelopedData standard
3. Genera un file ER (scarto) ma potrebbe non essere visibile immediatamente

## ✅ SOLUZIONE

Deve essere implementato un formato PKCS#7 EnvelopedData completo usando `node-forge`:

```javascript
const p7 = forge.pkcs7.createEnvelopedData();
p7.addRecipient(publicCert); // Certificato pubblico Sogei
p7.content = fileBuffer; // Dati da cifrare
p7.encrypt(); // Cifra con algoritmo conforme

const encryptedData = forge.asn1.toDer(p7.toAsn1()).getBytes();
return Buffer.from(encryptedData, 'binary');
```

Oppure utilizzare una libreria che supporta PKCS#7 EnvelopedData completo.

## 📚 RIFERIMENTI

- Manuale SDI: `SDI_SFTP_Massivi_v2.pdf` (dettagli algoritmi)
- Standard: PKCS#7 / CMS (Cryptographic Message Syntax) RFC 5652
- Specifiche SDI: Formato EnvelopedData conforme

## 🎯 PRIORITÀ

**ALTA** - Questo potrebbe essere il motivo principale per cui i file non vengono processati da SDI.

## 📝 NOTE

La firma PKCS#7 sembra corretta (usando `forge.pkcs7.createSignedData()`), ma la cifratura no.

Il file viene prima firmato, poi cifrato, quindi il risultato finale dovrebbe essere un file ZIP firmato e poi cifrato in formato PKCS#7 EnvelopedData.

