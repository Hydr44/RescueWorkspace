# Problemi Trovati e Corretti - Verifica Profonda Manuali

## 🔍 Analisi Completa Effettuata

**Data:** 13 gennaio 2026  
**Obiettivo:** Verifica conformità 101% ai manuali SDI

---

## ❌ PROBLEMI CRITICI TROVATI

### 1. CessionarioCommittente con Valori Placeholder ⚠️ CRITICO

**File:** `xml-generator.js`

**Problema:**
```javascript
// PRIMA (NON CORRETTO)
<Indirizzo>${esc(customerAddress.address || customerAddress.via || customerAddress.indirizzo || 'Via')}</Indirizzo>
<CAP>${esc(customerAddress.postal_code || customerAddress.cap || '00000')}</CAP>
<Comune>${esc(customerAddress.city || customerAddress.comune || 'Comune')}</Comune>
<Provincia>${esc(customerAddress.province || customerAddress.provincia || 'XX')}</Provincia>
```

**Causa:**
- Se i dati cliente erano incompleti, venivano usati valori placeholder
- SDI probabilmente rifiutava il file per dati cliente non validi
- Questo spiegherebbe perché i file non vengono prelevati

**Correzione:**
```javascript
// DOPO (CORRETTO)
// Validazione dati cliente
if (!customerIndirizzo || customerIndirizzo === 'Via' || !customerCap || customerCap === '00000' || !customerComune || customerComune === 'Comune' || !customerProvincia || customerProvincia === 'XX') {
  throw new Error('Indirizzo cliente completo obbligatorio (Via, CAP, Comune, Provincia). I dati cliente devono essere completi.');
}

// Usa valori validati (no placeholder)
<Indirizzo>${esc(customerIndirizzo)}</Indirizzo>
<CAP>${esc(customerCap)}</CAP>
<Comune>${esc(customerComune)}</Comune>
<Provincia>${esc(customerProvincia)}</Provincia>
```

✅ **CORRETTO** - Validazione aggiunta, nessun placeholder

---

### 2. Nome File XML Interno con Fallback 'XXXXXXX' ⚠️

**File:** `server.js`

**Problema:**
```javascript
// PRIMA (NON CORRETTO)
const idNodo = invoice.meta?.sdi?.cedente_prestatore?.id_codice || 'XXXXXXX';
const filename = `IT${idNodo}_${invoice.number || invoice.id}.xml`;
```

**Causa:**
- Se `id_codice` mancava, veniva usato `'XXXXXXX'` nel nome file
- Anche se l'XML generato sarebbe valido (grazie alla validazione), il nome file poteva essere non valido

**Correzione:**
```javascript
// DOPO (CORRETTO)
const cedente = invoice.meta?.sdi?.cedente_prestatore || {};
const idNodo = cedente.id_fiscale_iva?.id_codice || cedente.id_codice;
if (!idNodo || idNodo === 'XXXXXXX') {
  throw new Error(`IdCodice azienda non valido per fattura ${invoice.id}. Configura i dati azienda in Settings.`);
}
const filename = `IT${idNodo}_${invoice.number || invoice.id}.xml`;
```

✅ **CORRETTO** - Validazione aggiunta, errore se dati mancanti

---

## ✅ Verifica Conformità Completa

### Aspetti Verificati

| Aspetto | Stato | Note |
|---------|-------|------|
| Nomenclatura file FI | ✅ CONFORME | Formato `FI.{IdNodo}.{AAAAGGG}.{HHMM}.{NNN}.zip` |
| Composizione supporti | ✅ CONFORME | ZIP → Firma → Cifratura |
| Firma PKCS#7 | ✅ CONFORME | SHA-256, DER, PKCS#7 SignedData |
| Cifratura PKCS#7 | ✅ CONFORME | AES-256, RSA 4096, DER, PKCS#7 EnvelopedData |
| Ordine operazioni | ✅ CONFORME | Firma → Cifratura |
| Directory SFTP | ✅ CONFORME | DatiVersoSdITest / DatiVersoSdI |
| CedentePrestatore | ✅ CONFORME | Validazione completa, no placeholder |
| **CessionarioCommittente** | ✅ **CORRETTO** | **Validazione aggiunta, no placeholder** |
| Nome XML interno | ✅ **CORRETTO** | **Validazione aggiunta, no 'XXXXXXX'** |

---

## 🎯 Conclusione

**Prima della correzione:**
- ❌ CessionarioCommittente con valori placeholder
- ❌ Nome file XML interno con fallback 'XXXXXXX'
- ❌ File probabilmente rifiutati da SDI

**Dopo la correzione:**
- ✅ Validazione completa di tutti i dati
- ✅ Nessun valore placeholder
- ✅ Errori chiari se dati mancanti
- ✅ File dovrebbero essere accettati da SDI

---

## 📋 Prossimi Passi

1. ✅ Server VPS aggiornato con correzioni
2. ⏳ Testare con nuova fattura (usando fillTestData aggiornato)
3. ⏳ Verificare che i dati cliente siano completi
4. ⏳ Monitorare prelievo file da SDI

---

## 🔗 File Corretti

- ✅ `moduli/SDI-SFTP/server-vps/xml-generator.js`
- ✅ `moduli/SDI-SFTP/server-vps/server.js`
- ✅ Server VPS aggiornato e riavviato

