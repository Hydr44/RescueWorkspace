# 🔧 Soluzione OpenSSL Ibrida

**Data:** 14 gennaio 2026

---

## 🐛 Problema OpenSSL 3.0

**OpenSSL 3.0 non supporta:**
- PKCS12KDF per estrazione diretta da P12
- Algoritmi legacy (RC2-40-CBC) senza provider legacy
- Verifica MAC PKCS12 senza `-nomacver`

**Risultato:** Impossibile estrarre certificato direttamente con OpenSSL 3.0

---

## ✅ Soluzione Ibrida

**Approccio:**
1. **Estrai certificato con node-forge** (funziona perfettamente)
2. **Firma con OpenSSL** (garantisce ordine corretto attributi)

**Vantaggi:**
- ✅ node-forge estrae correttamente il certificato P12
- ✅ OpenSSL firma garantendo ordine corretto degli attributi
- ✅ Conforme al manuale SDI (usa OpenSSL per la firma)

---

## 📋 Implementazione

```javascript
// 1. Estrai certificato con node-forge
const { privateKey, certificate } = loadP12Certificate(certPath, password);

// 2. Converti in formato PEM per OpenSSL
const pemKey = forge.pki.privateKeyToPem(privateKey);
const pemCert = forge.pki.certificateToPem(certificate);
fs.writeFileSync(pemFile, pemKey + pemCert);

// 3. Firma con OpenSSL (come da manuale)
openssl smime -sign -in input -outform der -binary -nodetach -out output -signer FIRMA.PEM
```

---

## 🎯 Risultato

**Prima:**
- ❌ OpenSSL falliva estrazione → Fallback completo a node-forge
- ⚠️ Rischio errore 00102 (attributi non ordinati)

**Dopo:**
- ✅ node-forge estrae certificato (funziona)
- ✅ OpenSSL firma (garantisce ordine corretto)
- ✅ Conforme al manuale SDI

---

## ⏳ Prossimi Passi

1. ✅ **Soluzione implementata e deployata**
2. ⏳ **Test con nuova fattura** (userà soluzione ibrida)
3. ⏳ **Verifica se errore 00102 si risolve**

---

**Status:** ✅ Soluzione ibrida implementata - Pronto per test
