# 🔍 Verifica Errori Possibili nel Codice

**Data:** 14 gennaio 2026  
**Analisi:** Verifica se gli errori SDI possono verificarsi nel nostro codice

---

## ✅ Errori Già Gestiti

### 1. **00400/00401 - Natura e AliquotaIVA (DettaglioLinee)**
**Status:** ✅ GESTITO

```javascript
// Righe 39-45: Gestione corretta
if (vatPerc === 0) {
  // Aliquota 0 → Natura obbligatoria
  naturaIvaTag = `<Natura>${esc(naturaIva || 'N4')}</Natura>`;
} else if (naturaIva) {
  // Aliquota != 0 ma natura presente → Natura obbligatoria
  naturaIvaTag = `<Natura>${esc(naturaIva)}</Natura>`;
}
// Se aliquota != 0 e natura vuota → non aggiungere Natura (corretto)
```

**Conclusione:** ✅ Corretto - Natura presente solo quando necessario

---

### 2. **00417 - IdFiscaleIVA e CodiceFiscale**
**Status:** ✅ GESTITO

```javascript
// Riga 240-242: Controllo presente
if (!invoice.customer_vat && !invoice.customer_tax_code) {
  throw new Error('CessionarioCommittente: almeno uno tra P.IVA o Codice Fiscale deve essere presente');
}
```

**Conclusione:** ✅ Corretto - Almeno uno dei due è richiesto

---

### 3. **00423 - PrezzoTotale**
**Status:** ✅ GESTITO

```javascript
// Righe 69-77: Calcolo corretto
const prezzoTotale = qty * price;
return (Math.round(prezzoTotale * 100) / 100).toFixed(2);
```

**Conclusione:** ✅ Corretto - Calcolo con arrotondamento

---

### 4. **00422 - ImponibileImporto**
**Status:** ✅ GESTITO

```javascript
// Righe 85-89: Calcolo corretto
const imponibile = items.reduce((sum, r) => {
  const qty = Number(r.qty || 0);
  const price = Number(r.price || 0);
  return sum + (qty * price);
}, 0);
```

**Conclusione:** ✅ Corretto - Somma dei PrezzoTotale

---

### 5. **00421 - Imposta**
**Status:** ✅ GESTITO

```javascript
// Righe 93-100: Calcolo corretto
const impostaItem = Math.round((aliquota * imponibileItem / 100) * 100) / 100;
```

**Conclusione:** ✅ Corretto - Calcolo con arrotondamento

---

### 6. **00428 - FormatoTrasmissione**
**Status:** ✅ GESTITO

```javascript
// Righe 244-251: Controllo presente
if (formatoTrasm !== versioneAttributo) {
  throw new Error(`ERRORE 00428: FormatoTrasmissione non coerente`);
}
```

**Conclusione:** ✅ Corretto - Coerenza verificata

---

## ⚠️ Errori Potenzialmente Presenti

### 1. **00419 - DatiRiepilogo Mancante**

**Problema:** DatiRiepilogo deve essere presente per ogni aliquota IVA presente nelle righe.

**Verifica Necessaria:**
- Il codice genera DatiRiepilogo?
- Raggruppa per aliquota IVA?
- Include tutte le aliquote presenti?

**Priorità:** 🔴 ALTA

---

### 2. **00413/00414 - Natura e AliquotaIVA (Cassa Previdenziale)**

**Problema:** Stesso controllo ma per DatiCassaPrevidenziale.

**Verifica Necessaria:**
- Il codice gestisce DatiCassaPrevidenziale?
- Natura presente quando AliquotaIVA = 0?

**Priorità:** 🟡 MEDIA (se usi cassa previdenziale)

---

### 3. **00411/00415 - DatiRitenuta**

**Problema:** DatiRitenuta obbligatorio se Ritenuta = SI.

**Verifica Necessaria:**
- Il codice gestisce DatiRitenuta?
- Aggiunge DatiRitenuta quando necessario?

**Priorità:** 🟡 MEDIA (se usi ritenute)

---

### 4. **00403 - Data Successiva a Ricezione**

**Problema:** Data fattura non può essere successiva alla data di ricezione.

**Verifica Necessaria:**
- Il codice controlla la data?
- La data è corretta?

**Priorità:** 🟡 MEDIA

---

### 5. **00300/00301/00302 - Identificativi Non Validi**

**Problema:** Codice destinatario o identificativi fiscali non validi.

**Verifica Necessaria:**
- Validazione presente?
- Formato corretto?

**Priorità:** 🟡 MEDIA

---

## 🎯 Prossimi Passi

1. ⏳ Verificare generazione DatiRiepilogo
2. ⏳ Verificare gestione DatiCassaPrevidenziale
3. ⏳ Verificare gestione DatiRitenuta
4. ⏳ Verificare validazione date
