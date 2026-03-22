# 📋 Differenza tra Veicoli PRA e Non PRA

## 🔍 Come Vedere la Differenza

### **Nella Pagina Dettaglio VFU**

1. **Badge nell'Header** (vicino allo stato):
   - 🟦 **Badge Blu**: "Con Obbligo PRA" - Veicolo con obbligo di iscrizione al PRA
   - ⚪ **Badge Grigio**: "Senza Obbligo PRA" - Veicolo senza obbligo PRA

2. **Box Prominente nella Sidebar**:
   - Box evidenziato con bordo blu che mostra chiaramente:
     - **Con Obbligo PRA**: Richiede radiazione PRA
     - **Senza Obbligo PRA**: Gestione UMC

3. **Campo nei Dati Veicolo**:
   - Sezione "Obbligo Iscrizione PRA" con badge colorato

### **Nella Lista VFU**

- **Badge PRA** accanto alla targa:
  - **"PRA"** (blu) = Con obbligo PRA
  - **"No PRA"** (grigio) = Senza obbligo PRA

---

## ⚠️ Differenze Operative

### **Veicolo CON Obbligo PRA** (`obbligoIscrizionePRA = 'S'`)
- ✅ **Richiede radiazione PRA** prima della demolizione
- ✅ Il Centro di Raccolta deve richiedere la radiazione al PRA
- ✅ Può essere gestito anche tramite Studio di Consulenza
- ✅ Richiede Certificato di Rottamazione (CDR)

### **Veicolo SENZA Obbligo PRA** (`obbligoIscrizionePRA = 'N'` o diverso da 'S'`)
- ✅ **Gestione UMC** (Uffici Motorizzazione Civile)
- ✅ Richiede Ricevuta di Presa in Carico della documentazione
- ✅ La radiazione è gestita direttamente dagli UMC
- ✅ Processo semplificato, senza radiazione PRA

---

## 🔧 Campo API

Il campo `obbligoIscrizionePRA` è disponibile in:
- `VFUBean.obbligoIscrizionePRA` (string)
- Valori possibili: `'S'` (Sì) o altro (No)

---

## 📍 Dove Viene Mostrato

1. **Pagina Dettaglio VFU** (`DemolizioneRVFUDettaglio.jsx`):
   - Header (badge vicino allo stato)
   - Sidebar (box prominente)
   - Sezione Dati Veicolo

2. **Lista VFU** (`DemolizioniRVFU.jsx`):
   - Badge nella card del veicolo (accanto a targa/marca)

