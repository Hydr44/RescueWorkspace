# 🔍 Analisi Errore 00102 - Signed Attributes Non Ordinati

**Data:** 14 gennaio 2026  
**Errore:** 00102 - File non integro (firma non valida): Signed attributes non ordinati  
**File:** IT02166430856_19.xml.p7m  
**Test:** ✅ "Creazione di un supporto FI" - OK  
**Test:** ❌ "Ricezione di un supporto FO" - KO

---

## 🎉 Successo Parziale

**✅ Test 1 Superato:** "Creazione di un supporto FI" - OK  
Il supporto è stato creato correttamente e prelevato da SDI!

---

## ⚠️ Errore 00102

**Codice:** 00102  
**Descrizione:** File non integro (firma non valida): Signed attributes non ordinati

**Dettagli:**
- Il file firmato p7m non risulta integro
- Gli "Signed attributes" (attributi firmati) non sono ordinati correttamente

---

## 🔍 Analisi Codice

### Funzione signFile (server.js, righe 238-259)

```javascript
authenticatedAttributes: [
  { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
  { type: forge.pki.oids.messageDigest },
  { type: forge.pki.oids.signingTime, value: new Date() },
],
```

**Ordine attuale:**
1. contentType
2. messageDigest
3. signingTime

---

## 📋 Specifiche PKCS#7 / CAdES-BES

Secondo le specifiche PKCS#7 e CAdES-BES, gli attributi firmati devono essere ordinati in modo specifico quando vengono serializzati in ASN.1.

**Ordine richiesto:**
1. **contentType** (obbligatorio) - OID: 1.2.840.113549.1.9.3
2. **messageDigest** (obbligatorio) - OID: 1.2.840.113549.1.9.4
3. **signingTime** (opzionale) - OID: 1.2.840.113549.1.9.5

**Problema:** node-forge potrebbe non garantire l'ordine corretto quando serializza gli attributi in ASN.1.

---

## 💡 Possibili Soluzioni

### 1. Verificare Ordine ASN.1
- node-forge potrebbe non rispettare l'ordine quando serializza
- Potrebbe essere necessario forzare l'ordine manualmente

### 2. Usare Libreria Alternativa
- `node-pkcs7` (se disponibile)
- `pkcs7-signature`
- OpenSSL via child_process

### 3. Verificare Configurazione node-forge
- Potrebbe esserci un'opzione per garantire l'ordine
- Verificare documentazione node-forge

---

## 🔧 Prossimi Passi

1. ⏳ Verificare se node-forge garantisce l'ordine degli attributi
2. ⏳ Cercare alternativa o workaround
3. ⏳ Testare con ordine diverso degli attributi
4. ⏳ Considerare uso di OpenSSL per firma

---

**Status:** ⚠️ Errore 00102 - Signed attributes non ordinati
