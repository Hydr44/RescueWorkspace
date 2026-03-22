# 📋 Campo "Linea" A-Z nelle Fatture

## 🔍 Analisi

### **Cosa NON è:**
- ❌ **NON è parte dello standard SDI/FatturaPA**: Non esiste un campo "Linea" alfabetico (A-Z) nelle specifiche ufficiali dell'Agenzia delle Entrate
- ❌ **NON è obbligatorio**: Non è richiesto per l'invio a SDI
- ❌ **NON va nell'XML**: Non viene trasmesso a SDI

### **Cosa POTREBBE essere:**
1. **Classificazione interna righe fattura**
   - Identificazione visiva/organizzativa delle righe
   - Esempio: Linea A = Beni, Linea B = Servizi, Linea C = Note

2. **Settore/Linea di attività aziendale**
   - Classificazione per settore di business
   - Esempio: Linea A = Vendita auto, Linea B = Ricambi, Linea C = Servizi

3. **Codice ATECO o classificazione contabile**
   - Riferimento a codici di classificazione attività economiche
   - Classificazione per piano dei conti

4. **Riferimento a ordini/DDT**
   - Collegamento a documenti esterni
   - Identificazione di gruppi di righe correlate

---

## 💡 Implementazione Proposta

### **Opzione 1: Campo opzionale per classificazione interna**
- Campo `linea` (A-Z) opzionale su ogni riga fattura (`invoice_items`)
- Solo per uso interno/organizzativo
- Non inviato a SDI
- Utile per filtri, report, classificazioni

### **Opzione 2: Campo a livello fattura**
- Campo `linea_attivita` (A-Z) a livello fattura (`invoices`)
- Classifica l'intera fattura per settore/linea di attività
- Utile per statistiche e report per settore

### **Opzione 3: Campo in meta (flessibile)**
- Campo `meta.linea` o `meta.linea_attivita` in formato JSONB
- Può essere A-Z o qualsiasi valore personalizzato
- Non impatta XML SDI

---

## 🛠️ Implementazione Consigliata

**Campo opzionale `linea` su `invoice_items`**:
- Tipo: TEXT (1 carattere: A-Z)
- Opzionale
- Solo per uso interno
- Non incluso nell'XML SDI

**Vantaggi:**
- ✅ Flessibile per classificare righe
- ✅ Non impatta conformità SDI
- ✅ Utile per report e filtri interni

---

## ❓ Domande per l'utente

1. **Dove viene usato il campo "Linea"?**
   - Su ogni riga fattura?
   - A livello di fattura intera?
   - In altri documenti?

2. **A cosa serve?**
   - Classificazione settore?
   - Riferimento ordini/DDT?
   - Organizzazione interna?

3. **È obbligatorio?**
   - Deve essere sempre compilato?
   - Solo per alcuni tipi di fattura?

4. **Quali sono i valori possibili?**
   - Solo A-Z?
   - Altri codici (es. A1, B2, etc.)?

---

## 📝 Note

- Il campo "Linea" è **puramente interno** e non viene trasmesso a SDI
- Può essere utile per organizzazione, report, filtri
- Se serve, possiamo implementarlo come campo opzionale
