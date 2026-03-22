# ✅ Ricerca Veicolo e Rilevamento PRA

## 🔍 Come Funziona

Quando esegui la **ricerca veicolo** tramite `verificaVeicolo`, il sistema:

1. **Chiama l'API RVFU** con i parametri (targa, telaio, codice fiscale, causale, tipo veicolo)

2. **Riceve i dati completi del veicolo**, inclusi:
   - Dati tecnici (targa, telaio, marca, modello, cilindrata, potenza)
   - Dati intestatario (nome, cognome, codice fiscale, indirizzo)
   - **Campo PRA**: `obbligoIscrizionePRA` (string: 'S' = Sì, altro = No)
   - **Flag PRA**: `obbligoIscrizionePraFlag` (boolean)

3. **Popola automaticamente il form** quando selezioni un veicolo dalla ricerca:
   - Tutti i dati tecnici del veicolo
   - Dati intestatario (se disponibili)
   - **`obbligoIscrizionePRA`** → Campo nel formData
   - **`canaleNoPra`** → Impostato automaticamente (`true` se NON PRA, `false` se PRA)

4. **Mostra messaggio informativo**:
   - "Dati veicolo caricati nel form - **Veicolo con obbligo PRA**"
   - oppure "Dati veicolo caricati nel form - **Veicolo senza obbligo PRA**"

---

## 📍 Dove Viene Utilizzato

### **Nel Form di Creazione** (`DemolizioneRVFUForm.jsx`)

Quando selezioni un veicolo dalla ricerca:
```javascript
handleSelectVeicolo(veicolo) {
  setFormData({
    ...
    obbligoIscrizionePRA: veicolo.obbligoIscrizionePRA || (veicolo.obbligoIscrizionePraFlag ? 'S' : 'N'),
    canaleNoPra: veicolo.canaleNoPra !== undefined ? veicolo.canaleNoPra : (veicolo.obbligoIscrizionePRA !== 'S'),
    ...
  });
}
```

### **Nella Mappatura per API RVFU** (`rvfu-mapper.ts`)

Il campo `obbligoIscrizionePRA` viene incluso nel payload quando si registra il VFU:
- Se `obbligoIscrizionePRA = 'S'` → Veicolo richiede radiazione PRA
- Se `obbligoIscrizionePRA ≠ 'S'` → Veicolo senza obbligo PRA (gestione UMC)

### **Nella Visualizzazione Dettaglio** (`DemolizioneRVFUDettaglio.jsx`)

Il campo viene mostrato con badge colorato:
- **Badge Blu**: "Con Obbligo PRA"
- **Badge Grigio**: "Senza Obbligo PRA"

---

## ✅ Flusso Completo

1. **Ricerca Veicolo** → API restituisce `obbligoIscrizionePRA`
2. **Selezione Veicolo** → Campo popolato automaticamente nel form
3. **Messaggio Toast** → Informa l'utente sul tipo veicolo (PRA/non PRA)
4. **Salvataggio** → Campo incluso nel payload API
5. **Visualizzazione** → Badge colorato nella lista e dettaglio

**Il sistema "capisce tutto" automaticamente dalla ricerca!** 🎉

