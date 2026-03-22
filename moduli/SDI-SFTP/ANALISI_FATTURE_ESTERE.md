# 🔍 Analisi Supporto Fatture Esterne

## 📋 Stato Attuale del Sistema

### ✅ Cosa è già implementato:
1. **Campo `custCountry`** nello stato (`InvoiceNew.jsx` riga 90) - default "IT"
2. **XML Generator supporta `Nazione`** (`xml-generator.js` riga 429):
   ```javascript
   <Nazione>${esc(customerAddress.country || 'IT')}</Nazione>
   ```
3. **Campo `country` salvato** in `customer_address` (jsonb)

### ❌ Cosa manca (problemi critici):

#### 1. **UI - Campo Paese Cliente**
- ❌ Non c'è un campo `<select>` o input per selezionare il paese del cliente
- ❌ Il paese è hardcoded a "IT" di default
- ❌ Non c'è validazione o logica condizionale basata sul paese

#### 2. **XML Generator - IdPaese hardcoded**
- ❌ **PROBLEMA CRITICO**: `IdPaese` è hardcoded a "IT" (riga 410):
  ```javascript
  return `<IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>${esc(vat)}</IdCodice></IdFiscaleIVA>`;
  ```
- ❌ Per clienti esteri, `IdPaese` deve essere il codice ISO del paese (es. "DE", "FR", "US")
- ❌ La validazione P.IVA è solo per formato italiano (11 cifre)

#### 3. **Codice Destinatario**
- ❌ Non c'è logica per impostare automaticamente `CodiceDestinatario="XXXXXXX"` per clienti esteri
- ❌ Secondo manuali SDI, per clienti esteri il CodiceDestinatario deve essere "XXXXXXX" (7 caratteri)

#### 4. **CAP e Provincia**
- ❌ Non c'è logica per impostare `CAP="00000"` se paese != "IT"
- ❌ Non c'è logica per impostare `Provincia="EE"` (Estero) se paese != "IT"
- ❌ La validazione CAP richiede 5 cifre numeriche, ma per estero deve essere "00000"

#### 5. **Validazione P.IVA**
- ❌ La validazione P.IVA è solo per formato italiano (11 cifre numeriche)
- ❌ Per clienti UE, la P.IVA ha formati diversi (es. DE: 9 cifre, FR: 11 caratteri alfanumerici)
- ❌ Per clienti extra-UE, potrebbe non esserci P.IVA o avere formato diverso

#### 6. **IVA e Natura**
- ❌ Non c'è logica per gestire IVA reverse charge o non imponibile per clienti esteri
- ❌ Non c'è suggerimento automatico di `Natura` (es. N2.1, N2.2, N3.1, N3.2) per clienti esteri

---

## 📚 Requisiti Manuali SDI per Fatture Esterne

### 1. **Codice Destinatario**
- Per clienti esteri: `CodiceDestinatario="XXXXXXX"` (7 caratteri)
- SDI non consegna automaticamente a clienti esteri, serve invio manuale (email, PDF)

### 2. **IdPaese e IdFiscaleIVA**
- `IdPaese` deve essere il codice ISO 3166-1 alpha-2 del paese (es. "DE", "FR", "US")
- `IdCodice` deve essere la P.IVA/VAT ID del cliente nel formato del suo paese
- Per extra-UE senza VAT ID: usare codice convenzionale "OO99999999999"

### 3. **Indirizzo Cliente**
- `CAP`: "00000" per indirizzi esteri
- `Provincia`: "EE" (Estero) o lasciare vuoto per clienti esteri
- `Comune`: nome della città nel paese estero
- `Nazione`: codice ISO del paese (obbligatorio)

### 4. **IVA e Tassazione**
- **Intra-UE con P.IVA**: spesso reverse charge (N2.1, N2.2) o non imponibile (N3.1, N3.2)
- **Extra-UE**: generalmente non imponibile per esportazione (N3.1, N3.2)
- **Aliquota IVA**: spesso 0% con Natura obbligatoria

### 5. **Tipo Documento**
- Per fatture passive estere: TD17, TD18, TD19 (a seconda del caso)
- Per fatture attive estere: generalmente TD01 (fattura normale)

---

## 🛠️ Implementazione Necessaria

### 1. **UI - Aggiungere Campo Paese**
```jsx
<Field label="Paese">
  <select
    value={custCountry}
    onChange={(e) => {
      setCustCountry(e.target.value);
      // Auto-aggiorna CAP, Provincia, CodiceDestinatario
      if (e.target.value !== 'IT') {
        setCustZip('00000');
        setCustProv('EE');
        setCodiceDest('XXXXXXX');
      }
    }}
  >
    <option value="IT">Italia</option>
    <option value="DE">Germania</option>
    <option value="FR">Francia</option>
    <option value="ES">Spagna</option>
    <option value="GB">Regno Unito</option>
    <option value="US">Stati Uniti</option>
    {/* ... altri paesi */}
  </select>
</Field>
```

### 2. **XML Generator - IdPaese Dinamico**
```javascript
${invoice.customer_vat ? (() => {
  const country = customerAddress.country || 'IT';
  const vat = invoice.customer_vat.replace(/^[A-Z]{2}/i, '').replace(/\s+/g, '');
  
  // Estrai prefisso paese se presente (es. "DE123456789")
  const vatWithPrefix = invoice.customer_vat.toUpperCase();
  const countryFromVat = vatWithPrefix.match(/^([A-Z]{2})/)?.[1];
  const finalCountry = countryFromVat || country;
  
  // Validazione P.IVA in base al paese
  if (finalCountry === 'IT') {
    if (!/^\d{11}$/.test(vat)) {
      throw new Error(`P.IVA italiana non valida: deve essere 11 cifre. Valore: ${vat}`);
    }
  } else if (finalCountry === 'DE') {
    // Germania: 9 cifre
    if (!/^\d{9}$/.test(vat)) {
      throw new Error(`P.IVA tedesca non valida: deve essere 9 cifre. Valore: ${vat}`);
    }
  } else if (finalCountry === 'FR') {
    // Francia: 11 caratteri alfanumerici (2 lettere + 9 cifre)
    if (!/^[A-Z]{2}\d{9}$/.test(vatWithPrefix)) {
      throw new Error(`P.IVA francese non valida: formato XY123456789. Valore: ${vatWithPrefix}`);
    }
  }
  // ... altri paesi
  
  return `<IdFiscaleIVA><IdPaese>${esc(finalCountry)}</IdPaese><IdCodice>${esc(vat)}</IdCodice></IdFiscaleIVA>`;
})() : ''}
```

### 3. **Validazione CAP e Provincia**
```javascript
// In xml-generator.js, modificare validazione CAP:
const customerCap = customerAddress.zip || customerAddress.postal_code || customerAddress.cap;
const customerCountry = customerAddress.country || 'IT';

if (customerCountry === 'IT') {
  // CAP italiano: 5 cifre numeriche
  if (!/^\d{5}$/.test(customerCap)) {
    throw new Error(`CAP italiano non valido: deve essere 5 cifre. Valore: ${customerCap}`);
  }
} else {
  // CAP estero: "00000"
  if (customerCap !== '00000') {
    // Auto-correzione o warning
    customerCap = '00000';
  }
}

// Provincia:
const customerProvincia = customerCountry === 'IT' 
  ? (customerAddress.province || customerAddress.provincia || 'XX')
  : 'EE'; // Estero
```

### 4. **Codice Destinatario Automatico**
```javascript
// In InvoiceNew.jsx, funzione save():
let finalCodiceDest = codiceDest.trim();
if (custCountry !== 'IT') {
  finalCodiceDest = 'XXXXXXX'; // Cliente estero
} else if (!finalCodiceDest && !finalPecDest) {
  finalCodiceDest = '0000000'; // B2C italiano
}
```

### 5. **Suggerimento Natura IVA**
```javascript
// In InvoiceNew.jsx, quando cambia custCountry:
useEffect(() => {
  if (custCountry !== 'IT') {
    // Suggerisci Natura IVA per estero
    if (custCountry.match(/^(AT|BE|BG|CY|CZ|DE|DK|EE|ES|FI|FR|GR|HR|HU|IE|IT|LT|LU|LV|MT|NL|PL|PT|RO|SE|SI|SK)$/)) {
      // UE: reverse charge o non imponibile
      setRiepNatura('N2.1'); // o N2.2, N3.1, N3.2 a seconda del caso
      setRiepAliq(0);
    } else {
      // Extra-UE: non imponibile per esportazione
      setRiepNatura('N3.1'); // o N3.2
      setRiepAliq(0);
    }
  }
}, [custCountry]);
```

---

## ✅ Checklist Implementazione

- [ ] Aggiungere campo `<select>` per paese cliente in `InvoiceNew.jsx`
- [ ] Implementare logica auto-aggiornamento CAP/Provincia/CodiceDestinatario
- [ ] Modificare `xml-generator.js` per `IdPaese` dinamico
- [ ] Aggiungere validazione P.IVA per paesi UE principali (DE, FR, ES, GB, ecc.)
- [ ] Modificare validazione CAP per accettare "00000" per estero
- [ ] Modificare validazione Provincia per accettare "EE" per estero
- [ ] Implementare suggerimento automatico Natura IVA per clienti esteri
- [ ] Aggiungere lista paesi ISO 3166-1 alpha-2 completa
- [ ] Testare generazione XML con cliente estero (DE, FR, US)
- [ ] Verificare che SDI accetti fatture con CodiceDestinatario="XXXXXXX"
- [ ] Documentare flusso fatturazione estera per utenti

---

## 🚨 Note Importanti

1. **SDI non consegna a clienti esteri**: anche se la fattura è inviata a SDI, serve invio manuale al cliente (email, PDF, cartaceo).

2. **Validazione P.IVA per paese**: ogni paese UE ha formato diverso. Implementare almeno per i principali (DE, FR, ES, GB, NL, BE, AT, PL).

3. **Reverse Charge**: per clienti UE con P.IVA, spesso serve reverse charge (N2.1, N2.2). Consultare commercialista per casi specifici.

4. **Extra-UE senza P.IVA**: usare codice convenzionale "OO99999999999" in `IdFiscaleIVA`.

5. **Test**: testare con dati reali di clienti esteri prima di passare in produzione.
