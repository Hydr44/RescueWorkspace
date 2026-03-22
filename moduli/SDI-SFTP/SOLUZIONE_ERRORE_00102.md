# 🔧 Soluzione Errore 00102 - Signed Attributes Non Ordinati

**Data:** 14 gennaio 2026  
**Errore:** 00102 - Signed attributes non ordinati  
**Test:** ✅ "Creazione di un supporto FI" - OK  
**Test:** ❌ "Ricezione di un supporto FO" - KO

---

## 🎉 Successo Importante

**✅ Test "Creazione di un supporto FI" SUPERATO!**  
Il supporto è stato creato correttamente e prelevato da SDI. Questo significa che:
- ✅ Formato ZIP corretto
- ✅ File di quadratura corretto
- ✅ Nome file corretto
- ✅ Struttura supporto corretta

---

## ⚠️ Problema: Errore 00102

**Errore:** File non integro (firma non valida): Signed attributes non ordinati

**Causa:** Gli attributi firmati nel file PKCS#7 non sono ordinati correttamente secondo le specifiche.

---

## 🔍 Analisi Codice Attuale

```javascript
authenticatedAttributes: [
  { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
  { type: forge.pki.oids.messageDigest },
  { type: forge.pki.oids.signingTime, value: new Date() },
],
```

**Problema:** node-forge potrebbe non garantire l'ordine corretto quando serializza gli attributi in ASN.1.

---

## 💡 Soluzioni Possibili

### Soluzione 1: Rimuovere signingTime (Test)
**Ipotesi:** signingTime potrebbe causare problemi di ordinamento.

```javascript
authenticatedAttributes: [
  { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
  { type: forge.pki.oids.messageDigest },
  // signingTime rimosso temporaneamente per test
],
```

**Pro:** signingTime è opzionale in CAdES-BES  
**Contro:** Potrebbe essere richiesto da SDI

---

### Soluzione 2: Usare OpenSSL per Firma
**Ipotesi:** OpenSSL garantisce l'ordine corretto degli attributi.

```bash
openssl cms -sign \
  -in file.xml \
  -out file.xml.p7m \
  -signer cert.pem \
  -inkey key.pem \
  -binary \
  -outform DER \
  -nodetach \
  -certfile cert.pem
```

**Pro:** OpenSSL è lo standard de facto per PKCS#7  
**Contro:** Richiede child_process e gestione file temporanei

---

### Soluzione 3: Verificare Versione node-forge
**Ipotesi:** Versioni più recenti potrebbero aver corretto il problema.

**Verifica:** Controllare versione installata e aggiornare se necessario.

---

### Soluzione 4: Usare Libreria Alternativa
**Ipotesi:** Altre librerie potrebbero gestire meglio l'ordine.

**Alternative:**
- `node-pkcs7` (se disponibile)
- `pkcs7-signature`
- Wrapper OpenSSL

---

## 🎯 Raccomandazione

**Ordine di test:**
1. ⏳ **Test 1:** Rimuovere signingTime e testare
2. ⏳ **Test 2:** Se non funziona, implementare firma con OpenSSL
3. ⏳ **Test 3:** Se necessario, usare libreria alternativa

---

## 📋 Note Importanti

- **Test 1 superato:** Il supporto è stato creato correttamente!
- **Errore 00102:** Problema specifico con la firma, non con la struttura
- **Tempo elaborazione:** 21 minuti è normale per SDI

---

**Status:** ⚠️ Errore 00102 da risolvere - Test 1 superato! 🎉
