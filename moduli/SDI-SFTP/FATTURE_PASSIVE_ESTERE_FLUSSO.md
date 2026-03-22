# 📋 Flusso Fatture Passive Esterne - TD17, TD18, TD19

## 🔍 Differenza tra TD17, TD18, TD19

### **TD17 - Fattura Passiva da Fornitore Estero**
- **Chi emette**: Il fornitore estero (non noi)
- **Chi riceve**: Noi
- **Va a SDI?**: ❌ **NO** - È una fattura RICEVUTA, non emessa da noi
- **Cosa fare**: Solo movimento contabile (già implementato)
- **Esempio**: Fornitore tedesco ci invia una fattura per servizi

### **TD18 - Autofattura per Acquisti Intracomunitari**
- **Chi emette**: **NOI** (autofattura)
- **Chi riceve**: Noi stessi (destinatario = noi)
- **Va a SDI?**: ✅ **SÌ** - Deve essere inviata a SDI perché siamo noi l'emittente
- **Cosa fare**: 
  1. Movimento contabile (già implementato)
  2. **Creare fattura da inviare a SDI** (da implementare)
- **Esempio**: Acquisto intracomunitario con reverse charge, emettiamo autofattura

### **TD19 - Autofattura per Acquisti da Soggetti Non Residenti**
- **Chi emette**: **NOI** (autofattura)
- **Chi riceve**: Noi stessi (destinatario = noi)
- **Va a SDI?**: ✅ **SÌ** - Deve essere inviata a SDI perché siamo noi l'emittente
- **Cosa fare**: 
  1. Movimento contabile (già implementato)
  2. **Creare fattura da inviare a SDI** (da implementare)
- **Esempio**: Acquisto da fornitore extra-UE, emettiamo autofattura

---

## 🔄 Flusso Completo da Implementare

### **Per TD17 (Fattura Ricevuta):**
```
1. Inserisci dati fattura passiva estera → Movimenti Contabili
2. Fine (NON va a SDI)
```

### **Per TD18/TD19 (Autofattura):**
```
1. Inserisci dati fattura passiva estera → Movimenti Contabili
2. Sistema crea automaticamente fattura in tabella `invoices`
3. Sistema genera XML FatturaPA con:
   - CedentePrestatore: I nostri dati
   - CessionarioCommittente: I nostri dati (destinatario = noi)
   - TipoDocumento: TD18 o TD19
4. Sistema invia a SDI (o propone invio)
5. SDI notifica:
   - Ricevuta di consegna (RC)
   - Eventuali errori (NS)
```

---

## ⚠️ IMPORTANTE: Destinatario Autofattura

Per TD18/TD19, il **CessionarioCommittente** (destinatario) deve essere **NOI STESSI**:
- `IdFiscaleIVA`: La nostra P.IVA
- `CodiceDestinatario`: Il nostro codice destinatario SDI (o PEC)
- `Nazione`: IT
- `Indirizzo`: Il nostro indirizzo

---

## 🛠️ Implementazione Necessaria

### **1. Modificare `AccountingEntries.jsx`:**
- Quando si salva una fattura passiva estera con TD18 o TD19:
  1. Genera movimenti contabili (già fatto)
  2. Crea fattura in tabella `invoices` con:
     - `tipo_documento`: TD18 o TD19
     - `customer_name`: Nome azienda nostra
     - `customer_vat`: La nostra P.IVA
     - `customer_address`: Il nostro indirizzo
     - `meta.sdi.cedente_prestatore`: I nostri dati
     - `meta.sdi.cessionario_committente`: I nostri dati (destinatario = noi)
  3. Propone invio a SDI (o invia automaticamente se configurato)

### **2. Modificare `xml-generator.js`:**
- Gestire correttamente TD18/TD19:
  - CedentePrestatore = nostri dati
  - CessionarioCommittente = nostri dati
  - CodiceDestinatario = nostro codice SDI

### **3. UI:**
- Dopo aver salvato TD18/TD19, mostrare:
  - "Fattura creata. Vuoi inviarla a SDI?"
  - Pulsante "Invia a SDI"
  - Link alla fattura creata

---

## 📝 Note

- **TD17**: Solo movimento contabile, nessuna fattura SDI
- **TD18/TD19**: Movimento contabile + Fattura SDI da inviare
- **Destinatario**: Per autofatture, destinatario = emittente (noi stessi)
