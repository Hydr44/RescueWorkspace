# Altri Problemi Trovati - Verifica Profonda Manuali

## 🔍 Verifica Sistematica Effettuata

**Data:** 13 gennaio 2026  
**Obiettivo:** Trovare TUTTI gli errori, non fermarsi al primo

---

## ❌ PROBLEMI AGGIUNTIVI TROVATI

### 1. DatiRiepilogo - Solo Un'Aliquota Hardcoded ⚠️ CRITICO

**File:** `xml-generator.js`  
**Riga:** 138-142

**Problema:**
```javascript
// PRIMA (ERRATO)
<DatiRiepilogo>
  <AliquotaIVA>22.00</AliquotaIVA>  // ← Hardcoded 22%!
  <ImponibileImporto>${imponibile.toFixed(2)}</ImponibileImporto>
  <Imposta>${iva.toFixed(2)}</Imposta>
</DatiRiepilogo>
```

**Conseguenze:**
- Se ci sono righe con aliquote IVA diverse (es. 10%, 4%, esenti), mancano i DatiRiepilogo corrispondenti
- **FatturaPA richiede UN DatiRiepilogo per OGNI aliquota IVA utilizzata**
- File XML non conforme → SDI rifiuterebbe

**Correzione:**
```javascript
// DOPO (CORRETTO)
// Raggruppa per aliquota IVA
const aliquoteMap = new Map();
items.forEach(item => {
  const aliquota = Number(item.vat_perc || 22).toFixed(2);
  // ... calcolo imponibile e imposta per aliquota ...
});
// Genera DatiRiepilogo per ogni aliquota
const riepilogoRows = Array.from(aliquoteMap.values()).map(riep => `
  <DatiRiepilogo>
    <AliquotaIVA>${riep.aliquota}</AliquotaIVA>
    <ImponibileImporto>${riep.imponibile.toFixed(2)}</ImponibileImporto>
    <Imposta>${riep.imposta.toFixed(2)}</Imposta>
  </DatiRiepilogo>`).join('');
```

✅ **CORRETTO** - Ora genera un DatiRiepilogo per ogni aliquota IVA

---

### 2. UnitaMisura Sempre 'PZ' Hardcoded ⚠️

**File:** `xml-generator.js`  
**Riga:** 24

**Problema:**
```javascript
// PRIMA (ERRATO)
<UnitaMisura>PZ</UnitaMisura>  // ← Sempre 'PZ'!
```

**Conseguenze:**
- Non rispecchia l'unità di misura reale dell'item
- Potrebbe essere non conforme se l'item ha unità diverse (KG, M, H, ecc.)

**Correzione:**
```javascript
// DOPO (CORRETTO)
${item.unit ? `<UnitaMisura>${esc(item.unit)}</UnitaMisura>` : ''}
```

✅ **CORRETTO** - Usa `item.unit` se disponibile, altrimenti omette (opzionale)

---

### 3. customer_vat - Normalizzazione Mancante ⚠️

**File:** `xml-generator.js`  
**Riga:** 111

**Problema:**
```javascript
// PRIMA (POTENZIALE PROBLEMA)
<IdCodice>${esc(invoice.customer_vat)}</IdCodice>
```

**Conseguenze:**
- Se `customer_vat` contiene prefisso "IT" o spazi, non è conforme
- FatturaPA richiede solo numeri (11 cifre per P.IVA italiana)

**Correzione:**
```javascript
// DOPO (CORRETTO)
${invoice.customer_vat ? (() => {
  // P.IVA: può essere con o senza prefisso IT, normalizza
  const vat = invoice.customer_vat.replace(/^IT/i, '').replace(/\s+/g, '');
  return `<IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>${esc(vat)}</IdCodice></IdFiscaleIVA>`;
})() : ''}
```

✅ **CORRETTO** - Normalizza rimuovendo "IT" e spazi

---

## ⚠️ PUNTI DA VERIFICARE (Controversie nei Manuali)

### 1. Lunghezza IdNodo

**Discrepanza tra documenti:**
- **VERIFICA_PROFONDA_MANUALE.md:** Dice "11 caratteri"
- **ANALISI_MANUALE_SOGEI.md:** Dice "P.IVA/CF di registrazione" (non specifica)

**Realtà:**
- P.IVA italiana: 11 caratteri
- Codice fiscale: 16 caratteri
- Attuale: 17 caratteri (`SCZMNL05L21D960T`)

**Azione:** Manteniamo così per ora, ma da verificare con SDI/Sogei

---

## ✅ Checklist Problemi Risolti

| Problema | Stato | Priorità |
|----------|-------|----------|
| IdNodo hardcoded | ✅ CORRETTO | ALTA |
| Progressivo sempre 1 | ✅ CORRETTO | ALTA |
| DatiRiepilogo solo 22% | ✅ CORRETTO | **ALTA** |
| UnitaMisura sempre PZ | ✅ CORRETTO | MEDIA |
| customer_vat non normalizzato | ✅ CORRETTO | MEDIA |
| CessionarioCommittente placeholder | ✅ CORRETTO (già fatto) | ALTA |
| Mapping campi cliente | ✅ CORRETTO (già fatto) | ALTA |
| Lunghezza IdNodo | ⚠️ DA VERIFICARE | MEDIA |

---

## 🎯 Conclusione

**Problemi Critici Aggiuntivi:** ✅ TUTTI RISOLTI

1. ✅ DatiRiepilogo ora genera un riepilogo per ogni aliquota IVA
2. ✅ UnitaMisura usa il valore dall'item
3. ✅ customer_vat normalizzato (rimuove IT e spazi)

---

## 📋 File Aggiornati

- ✅ `xml-generator.js` - DatiRiepilogo multipli, UnitaMisura dinamica, customer_vat normalizzato
- ✅ Server VPS aggiornato e riavviato

