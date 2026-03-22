# 🔍 Analisi Errori Possibili nel Codice

**Data:** 14 gennaio 2026  
**Status:** Verifica completa errori SDI vs implementazione

---

## ✅ Errori GESTITI CORRETTAMENTE

### 1. **00400/00401 - Natura e AliquotaIVA (DettaglioLinee)**
**Status:** ✅ GESTITO CORRETTAMENTE

```javascript
// Righe 39-45
if (vatPerc === 0) {
  naturaIvaTag = `<Natura>${esc(naturaIva || 'N4')}</Natura>`;
} else if (naturaIva) {
  naturaIvaTag = `<Natura>${esc(naturaIva)}</Natura>`;
}
```

**Conclusione:** ✅ Natura presente solo quando necessario

---

### 2. **00419 - DatiRiepilogo Mancante**
**Status:** ✅ GESTITO CORRETTAMENTE

```javascript
// Righe 106-171: Generazione DatiRiepilogo
const riepilogoMap = new Map();
items.forEach(item => {
  const aliquotaVal = Number(item.vat_perc || 22);
  const aliquota = aliquotaVal.toFixed(2);
  const naturaIva = item.natura_iva || item.naturaIva || '';
  const key = `${aliquota}_${naturaIva}`;
  // Raggruppa per aliquota e natura
});
```

**Conclusione:** ✅ DatiRiepilogo generato per ogni combinazione aliquota/natura

---

### 3. **00421 - Imposta Non Calcolata Correttamente**
**Status:** ✅ GESTITO CORRETTAMENTE

```javascript
// Righe 128-130
const impostaCalcolata = (aliquotaVal * imponibileItem) / 100;
const impostaItem = Math.round(impostaCalcolata * 100) / 100;
```

**Conclusione:** ✅ Calcolo corretto con arrotondamento

---

### 4. **00422 - ImponibileImporto Non Corrispondente**
**Status:** ✅ GESTITO CORRETTAMENTE

```javascript
// Righe 85-89, 122
const imponibileItem = qty * price;
// Somma corretta
```

**Conclusione:** ✅ ImponibileImporto corrisponde alla somma dei PrezzoTotale

---

### 5. **00423 - PrezzoTotale Non Calcolato Correttamente**
**Status:** ✅ GESTITO CORRETTAMENTE

```javascript
// Righe 69-77
const prezzoTotale = qty * price;
return (Math.round(prezzoTotale * 100) / 100).toFixed(2);
```

**Conclusione:** ✅ Calcolo corretto

---

### 6. **00417 - IdFiscaleIVA e CodiceFiscale Non Valorizzati**
**Status:** ✅ GESTITO CORRETTAMENTE

```javascript
// Righe 240-242
if (!invoice.customer_vat && !invoice.customer_tax_code) {
  throw new Error('Almeno uno tra P.IVA o Codice Fiscale deve essere presente');
}
```

**Conclusione:** ✅ Controllo presente

---

### 7. **00425 - Numero Non Contiene Numeri**
**Status:** ✅ GESTITO CORRETTAMENTE

```javascript
// Righe 368-375
if (!/\d/.test(num)) {
  throw new Error('Numero fattura deve contenere almeno un carattere numerico');
}
```

**Conclusione:** ✅ Controllo presente

---

### 8. **00428 - FormatoTrasmissione Non Coerente**
**Status:** ✅ GESTITO CORRETTAMENTE

```javascript
// Righe 244-251
if (formatoTrasm !== versioneAttributo) {
  throw new Error(`ERRORE 00428: FormatoTrasmissione non coerente`);
}
```

**Conclusione:** ✅ Controllo presente

---

## ⚠️ Errori POTENZIALMENTE PRESENTI

### 1. **00413/00414 - Natura e AliquotaIVA (Cassa Previdenziale)**
**Status:** ⚠️ NON GESTITO

**Problema:** Se usi DatiCassaPrevidenziale, devi gestire Natura quando AliquotaIVA = 0.

**Verifica Necessaria:**
- Il codice gestisce DatiCassaPrevidenziale?
- Se sì, gestisce Natura correttamente?

**Priorità:** 🟡 MEDIA (solo se usi cassa previdenziale)

---

### 2. **00411/00415 - DatiRitenuta Mancante**
**Status:** ⚠️ NON GESTITO

**Problema:** Se Ritenuta = SI, DatiRitenuta è obbligatorio.

**Verifica Necessaria:**
- Il codice gestisce DatiRitenuta?
- Aggiunge DatiRitenuta quando Ritenuta = SI?

**Priorità:** 🟡 MEDIA (solo se usi ritenute)

---

### 3. **00403 - Data Successiva a Ricezione**
**Status:** ⚠️ NON GESTITO

**Problema:** Data fattura non può essere successiva alla data di ricezione.

**Verifica Necessaria:**
- Il codice controlla che la data fattura non sia futura?
- La data è corretta?

**Priorità:** 🟡 MEDIA

**Nota:** Questo controllo è fatto da SDI, non dal nostro codice. Ma possiamo prevenirlo.

---

### 4. **00300/00301/00302 - Identificativi Non Validi**
**Status:** ⚠️ PARZIALMENTE GESTITO

**Problema:** SDI verifica che gli identificativi siano validi nell'anagrafe tributaria.

**Verifica Necessaria:**
- Validazione formato presente ✅
- Validazione anagrafe tributaria: NO (fatta da SDI)

**Priorità:** 🟡 MEDIA

**Nota:** Il formato è corretto, ma SDI verifica anche l'esistenza nell'anagrafe.

---

## 🎯 Conclusione

### ✅ Errori Gestiti (8)
- 00400/00401 - Natura e AliquotaIVA
- 00419 - DatiRiepilogo
- 00421 - Imposta
- 00422 - ImponibileImporto
- 00423 - PrezzoTotale
- 00417 - IdFiscaleIVA/CodiceFiscale
- 00425 - Numero
- 00428 - FormatoTrasmissione

### ⚠️ Errori Potenzialmente Presenti (4)
- 00413/00414 - Cassa Previdenziale (solo se usata)
- 00411/00415 - DatiRitenuta (solo se usato)
- 00403 - Data (controllo SDI, ma possiamo prevenirlo)
- 00300/00301/00302 - Identificativi (validazione anagrafe SDI)

---

## 💡 Raccomandazione

Il codice gestisce correttamente la maggior parte degli errori comuni. Gli errori potenzialmente presenti sono legati a funzionalità avanzate (cassa previdenziale, ritenute) che potrebbero non essere usate.

Se l'errore ET02 persiste, verificare:
1. Dettagli errore nel portale SDI (codice specifico)
2. Se usi cassa previdenziale o ritenute
3. Validità identificativi nell'anagrafe tributaria
