# 🔧 Correzione Errore 00102 - Signed Attributes

**Data:** 14 gennaio 2026  
**Errore:** 00102 - Signed attributes non ordinati  
**Azione:** Rimozione temporanea di signingTime per test

---

## 🎉 Test 1 Superato!

**✅ "Creazione di un supporto FI" - OK**  
Il supporto è stato creato correttamente e prelevato da SDI!

---

## ⚠️ Errore 00102

**Codice:** 00102  
**Descrizione:** File non integro (firma non valida): Signed attributes non ordinati

**Causa probabile:** node-forge non garantisce l'ordine corretto degli attributi quando serializza in ASN.1.

---

## 🔧 Modifica Applicata

### Prima (con signingTime):
```javascript
authenticatedAttributes: [
  { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
  { type: forge.pki.oids.messageDigest },
  { type: forge.pki.oids.signingTime, value: new Date() },
],
```

### Dopo (senza signingTime):
```javascript
authenticatedAttributes: [
  { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
  { type: forge.pki.oids.messageDigest },
  // signingTime rimosso temporaneamente per test errore 00102
],
```

---

## 📋 Motivazione

1. **signingTime è opzionale** in CAdES-BES
2. **Riduce complessità** della firma (meno attributi = meno possibilità di errore)
3. **Test rapido** per verificare se signingTime causa il problema

---

## ⏳ Prossimi Passi

1. ✅ **Deploy** codice aggiornato sul VPS
2. ⏳ **Test** con nuova fattura
3. ⏳ **Verifica** se errore 00102 si risolve

**Se non funziona:**
- Implementare firma con OpenSSL (garantisce ordine corretto)
- Usare libreria alternativa per PKCS#7

---

**Status:** 🔧 Modifica applicata - In attesa di test
