# Fix Mapping Campi Cliente

## ❌ Problema

**Errore:** `"Indirizzo cliente completo obbligatorio (Via, CAP, Comune, Provincia). I dati cliente devono essere completi."`

**Causa:** Disallineamento tra i nomi dei campi salvati nel form e quelli cercati nell'XML generator.

---

## 🔍 Analisi

### Form (`InvoiceNew.jsx`) - Come vengono salvati i dati:

```javascript
const customer_address = {
  street: custStreet || null,      // ← Salva come "street"
  zip: custZip || null,            // ← Salva come "zip"
  city: custCity || null,          // ← Salva come "city"
  province: custProv || null,      // ← Salva come "province"
  country: custCountry || "IT",
};
```

### XML Generator (`xml-generator.js`) - Cosa cercava:

```javascript
// PRIMA (NON FUNZIONAVA)
const customerIndirizzo = customerAddress.address || customerAddress.via || customerAddress.indirizzo;
const customerCap = customerAddress.postal_code || customerAddress.cap;
const customerComune = customerAddress.city || customerAddress.comune;
const customerProvincia = customerAddress.province || customerAddress.provincia;
```

**Problema:** Il form salva `street`, ma l'XML cerca `address`, `via`, `indirizzo`. Non c'era corrispondenza!

---

## ✅ Soluzione

### Mapping Corretto

```javascript
// DOPO (CORRETTO)
const customerIndirizzo = customerAddress.street || customerAddress.address || customerAddress.via || customerAddress.indirizzo;
const customerCap = customerAddress.zip || customerAddress.postal_code || customerAddress.cap;
const customerComune = customerAddress.city || customerAddress.comune;
const customerProvincia = customerAddress.province || customerAddress.provincia;
```

**Modifiche:**
- ✅ Aggiunto `customerAddress.street` come **prima opzione** per l'indirizzo
- ✅ Aggiunto `customerAddress.zip` come **prima opzione** per il CAP
- ✅ Mantenuto supporto per altri formati (backward compatibility)

---

## 📋 Tabella Mapping

| Campo Form | Campo DB/Salvataggio | Campo XML Generator | Stato |
|------------|---------------------|---------------------|-------|
| `custStreet` | `customer_address.street` | `street` ✅ | **Aggiunto** |
| `custZip` | `customer_address.zip` | `zip` ✅ | **Aggiunto** |
| `custCity` | `customer_address.city` | `city` ✅ | Già presente |
| `custProv` | `customer_address.province` | `province` ✅ | Già presente |

---

## 🎯 Risultato

Ora i dati cliente salvati dal form vengono correttamente letti dall'XML generator:
- ✅ `street` → trovato
- ✅ `zip` → trovato
- ✅ `city` → trovato
- ✅ `province` → trovato

La validazione passa e l'XML viene generato correttamente.

---

## 🔗 File Modificati

- ✅ `moduli/SDI-SFTP/server-vps/xml-generator.js`
- ✅ Server VPS aggiornato e riavviato

