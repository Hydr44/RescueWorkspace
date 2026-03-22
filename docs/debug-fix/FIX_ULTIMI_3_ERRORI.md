# 🔧 FIX ULTIMI 3 ERRORI RENTRI

## ❌ ERRORI RIMANENTI

```
1. 'dati_partenza.rifiuto.caratteristiche_pericolo': ['sys.required']
2. 'dati_partenza.trasportatori[0].codice_fiscale': ['sys.invalid']
3. 'dati_partenza.trasportatori[0].numero_iscrizione_albo': ['sys.invalid']
```

---

## ✅ FIX APPLICATI

### 1. **caratteristiche_pericolo** - SEMPRE PRESENTE

**Problema**: Il campo veniva omesso se l'array era vuoto.

**Soluzione**: Includere sempre come array (anche vuoto `[]`).

```typescript
// PRIMA (sbagliato):
...(rifiutoPrincipale.caratteristiche_pericolo && rifiutoPrincipale.caratteristiche_pericolo.length > 0 && {
  classi_pericolo: rifiutoPrincipale.caratteristiche_pericolo
}),

// DOPO (corretto):
caratteristiche_pericolo: rifiutoPrincipale.caratteristiche_pericolo || [],
```

**Nota**: Corretto anche il nome del campo da `classi_pericolo` → `caratteristiche_pericolo`.

---

### 2. **numero_iscrizione_albo** - NORMALIZZAZIONE

**Problema**: Pattern RENTRI richiede **esattamente** `XX/YYYYYY` (2 lettere + / + 6 cifre).

**Pattern RENTRI**:
```
^([A-Za-z]{2})/([0-9]{6})$
maxLength: 10
```

**Soluzione**: Normalizzare sempre a formato corretto:
- Provincia: uppercase, max 2 caratteri
- Numero: pad a 6 cifre con zeri iniziali

```typescript
// Normalizza: "VA/123" → "VA/000123"
// Normalizza: "mi/234567" → "MI/234567"
```

---

### 3. **codice_fiscale trasportatore** - DA VERIFICARE

**Problema**: RENTRI potrebbe verificare che il trasportatore sia registrato nel loro database.

**Possibili soluzioni**:
- Usare una P.IVA reale di azienda trasporti registrata
- Verificare con RENTRI se CF personali sono accettati in ambiente DEMO
- Contattare supporto RENTRI per lista operatori di test

**Per ora**: Manteniamo CF personali validi (matematicamente corretti).

---

## 📋 PROSSIMI PASSI

1. **Deploy backend** (Vercel)
2. **Test con nuovo payload**
3. **Se errore CF/albo persiste**: Contattare RENTRI per operatori di test DEMO

---

## 🔍 VERIFICA PATTERN ALBO

Pattern RENTRI confermato:
```
^([A-Za-z]{2})/([0-9]{6})$
```

Esempi validi:
- ✅ `MI/123456` (10 caratteri)
- ✅ `VA/000123` (10 caratteri)
- ❌ `MI/1234` (solo 4 cifre)
- ❌ `mi/123456` (provincia lowercase)
- ❌ `VA/1234567` (7 cifre, troppo lungo)

---

## ✅ STATO

- ✅ `caratteristiche_pericolo`: SEMPRE incluso come array
- ✅ `numero_iscrizione_albo`: Normalizzato a formato corretto
- ⚠️ `codice_fiscale`: Da verificare con RENTRI se problema persiste



