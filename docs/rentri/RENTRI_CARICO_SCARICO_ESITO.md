# RENTRI - Guida Carico/Scarico e Esito Conferimento

**Data**: 11 Gennaio 2025  
**Problema**: Disallineamento tra tipo_operazione locale e causale RENTRI, esito conferimento assente

---

## ⚠️ **PROBLEMA 1: Carico/Scarico Invertito**

### **Causa**:
RENTRI **determina carico/scarico dalla causale operazione**, NON dal campo `tipo_operazione` (che è solo per UI locale).

### **Causali RENTRI**:

#### **CARICO** (movimento in entrata):
- **DT** - Deposito Temporaneo
- **NP** - Nuovo Produzione  
- **RE** - Recupero
- **I** - Intermediazione

#### **SCARICO** (movimento in uscita):
- **aT** - Accettazione Trasporto
- **TR** - Trasporto
- **T*** - Trasporto con asterisco
- **T*aT** - Trasporto + Accettazione

#### **SPECIALE**:
- **M** - Materiali (non rifiuti)

### **Soluzione**:
Se vuoi uno **scarico**, devi usare una causale di scarico (`aT`, `TR`, `T*`, `T*aT`), non importa cosa c'è in `tipo_operazione`.

**Esempio**:
- ❌ `tipo_operazione = "scarico"` + `causale = "NP"` → RENTRI mostra **CARICO**
- ✅ `tipo_operazione = "scarico"` + `causale = "aT"` → RENTRI mostra **SCARICO**

---

## ⚠️ **PROBLEMA 2: Esito Conferimento "Non Presente"**

### **Causa**:
Per le causali **aT** e **T*aT**, RENTRI richiede obbligatoriamente il campo **`esito`** con l'esito del conferimento.

### **Campo Esito (OBBLIGATORIO per aT, T*aT)**:
```json
{
  "esito": {
    "esito_accettazione": "Accettato" | "Rifiutato" | "AccettatoParzialmente",
    "quantita_accettata": number (opzionale),
    "note_esito": "string" (opzionale, max 500 chars)
  }
}
```

### **Stato Attuale**:
- ✅ Il builder (`movimento-builder.ts`) include automaticamente `esito` per causali `aT` e `T*aT`
- ✅ Default: `esito_accettazione = "Accettato"` se non specificato
- ⚠️ **PROBLEMA**: Se RENTRI mostra "non presente", potrebbe essere:
  1. La causale non è `aT` o `T*aT`
  2. C'è un errore nella struttura del payload
  3. Il campo esito non viene incluso per qualche motivo

### **Verifica**:
1. Controlla la causale del movimento: deve essere `aT` o `T*aT`
2. Controlla i log del backend per vedere se `esito` è incluso nel payload
3. Se la causale è corretta ma l'esito non appare, verificare il builder

---

## 📝 **Raccomandazioni**

### **Per l'UI**:
1. **Sincronizzare `tipo_operazione` con causale**:
   - Se `causale` = `DT`, `NP`, `RE`, `I` → `tipo_operazione` dovrebbe essere "carico"
   - Se `causale` = `aT`, `TR`, `T*`, `T*aT` → `tipo_operazione` dovrebbe essere "scarico"

2. **Mostrare warning** se `tipo_operazione` non corrisponde alla causale:
   ```
   ⚠️ Attenzione: Causale "NP" è un CARICO, ma tipo operazione è "scarico".
   RENTRI mostrerà questo movimento come CARICO.
   ```

3. **Aggiungere campi esito nel form** (per causali aT, T*aT):
   - `esito_accettazione` (select: Accettato/Rifiutato/AccettatoParzialmente)
   - `quantita_accettata` (opzionale, number)
   - `note_esito` (opzionale, textarea)

### **Per il Builder**:
- ✅ Già implementato: `esito` incluso per `aT` e `T*aT`
- ✅ Default: `esito_accettazione = "Accettato"`
- ⚠️ Verificare che la struttura sia corretta (potrebbe essere che RENTRI richieda una struttura diversa)

---

## 🔍 **Debug Checklist**

Quando un movimento mostra problemi:

1. ✅ Verificare la **causale operazione** (deve corrispondere al tipo di operazione desiderato)
2. ✅ Verificare che per causali `aT`/`T*aT` il campo **`esito`** sia incluso nel payload
3. ✅ Controllare i **log backend** per vedere il payload completo inviato a RENTRI
4. ✅ Verificare che `tipo_operazione` corrisponda alla causale (per coerenza UI)

---

## 📚 **Riferimenti**

- RENTRI Manuale: Flussi Operativi Registri
- OpenAPI Spec: `/dati-registri/v1.0/operatore/{identificativo_registro}/movimenti`
- Campo `esito`: Obbligatorio per causali `aT`, `T*aT`

