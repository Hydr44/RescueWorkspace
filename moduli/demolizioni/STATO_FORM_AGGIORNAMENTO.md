# Stato Aggiornamento Form Demolizione RVFU

**Data**: 2025-01-XX  
**File**: `src/pages/DemolizioneRVFUForm.jsx`

---

## ✅ COMPLETATO

### 1. **Struttura Dati Form** ✅
- Tutti i campi aggiunti nello state `formData`
- Supporto per intestatario completo (PF/PG)
- Supporto per detentore opzionale
- Distinta documenti completa
- Note aggiuntive e parti rifiuti

### 2. **Sezione Veicolo** ✅
- ✅ Targa
- ✅ Telaio (numero_telaio)
- ✅ **Tipo Veicolo** (A, M, C, R, T, Q, S, U, V, W, X, Y, Z) *NUOVO*
- ✅ Marca
- ✅ Modello
- ✅ Anno
- ✅ Colore
- ✅ **Cilindrata** *NUOVO*
- ✅ **Potenza (kW)** *NUOVO*
- ✅ **Data Prima Immatricolazione** *NUOVO*
- ✅ **Flag Consegna Forze Ordine** *NUOVO*
- ✅ **Canale No PRA** (checkbox) *NUOVO*
- ✅ **CIC** *NUOVO*

### 3. **Sezione Distinta Documenti** ✅ *NUOVO*
- ✅ DU (Documento Unico) - select ASSENTE/DENUNCIA/DOCUMENTO/VERBALE
- ✅ CDC (Carta di Circolazione) - select ASSENTE/DENUNCIA/DOCUMENTO/VERBALE
- ✅ CDP (Carta di Proprietà) - select ASSENTE/DENUNCIA/DOCUMENTO
- ✅ Foglio C - select ASSENTE/DENUNCIA/DOCUMENTO
- ✅ Documento Intestatario (checkbox)
- ✅ Documento Detentore (checkbox)
- ✅ Targa Anteriore (checkbox)
- ✅ Targa Posteriore (checkbox)
- ✅ Targa Denuncia (checkbox)
- ✅ Altro (text input)

### 4. **Note** ✅ *NUOVO*
- ✅ Note Aggiuntive (textarea)
- ✅ Note Parti Rifiuti (textarea)

---

## ⚠️ DA COMPLETARE

### 5. **Sezione Intestatario/Proprietario** ⚠️ PARZIALE
**Attualmente ha solo:**
- Nome completo (singolo campo) ❌ **DA SEPARARE in nome/cognome**
- Codice Fiscale
- Telefono
- Email
- Indirizzo (singolo) ❌ **DA SEPARARE in indirizzo + numero civico + DUG + toponimo**
- CAP
- Comune (text input) ❌ **DA SOSTITUIRE con select comuni ISTAT**
- Provincia (select funzionante)

**Manca:**
- ❌ Toggle Persona Fisica/Giuridica
- ❌ Ragione Sociale (se PG)
- ❌ Nome (separato) *REQUIRED per PF*
- ❌ Cognome (separato) *REQUIRED per PF*
- ❌ Data di Nascita
- ❌ **Nascita:**
  - ❌ Codice Comune Nascita (codice ISTAT 3 cifre)
  - ❌ Comune Nascita (select con comuni ISTAT)
  - ❌ Codice Provincia Nascita
  - ❌ Provincia Nascita (select)
  - ❌ Stato Estero Nascita (se estero)
  - ❌ Codice Stato Estero Nascita
  - ❌ Località Estera Nascita
- ❌ **Residenza:**
  - ❌ Codice Comune Residenza (codice ISTAT 3 cifre) *REQUIRED*
  - ❌ Comune Residenza (select con comuni ISTAT) *REQUIRED*
  - ❌ Codice Provincia Residenza (codice ISTAT 3 cifre) *REQUIRED*
  - ❌ Numero Civico Residenza (separato da indirizzo)
  - ❌ DUG Residenza (Denominazione Urban Generica)
  - ❌ Toponimo Residenza
  - ❌ Stato Estero Residenza (se estero)
  - ❌ Codice Stato Estero Residenza
  - ❌ Località Estera Residenza

### 6. **Sezione Detentore** ❌ MANCANTE COMPLETAMENTE
- ❌ Toggle "Mostra Detentore"
- ❌ Tutti i campi dell'intestatario ripetuti per il detentore

### 7. **Funzionalità Lookup Comuni ISTAT** ⚠️ PARZIALE
- ✅ Funzione `loadComuni()` implementata
- ✅ Logica per caricare comuni quando cambia provincia
- ⚠️ **DA TESTARE** - comuni vengono caricati correttamente
- ❌ Comuni non ancora usati nei select del form (sezione intestatario usa ancora text input)

---

## 📋 PROSSIMI PASSI

1. **Aggiornare sezione Intestatario:**
   - Aggiungere toggle PF/PG
   - Separare nome completo in nome/cognome
   - Aggiungere tutti i campi nascita
   - Sostituire input comune con select comuni ISTAT
   - Aggiungere tutti i campi residenza (numero civico, DUG, toponimo, ecc.)

2. **Aggiungere sezione Detentore completa:**
   - Toggle per mostrare/nascondere
   - Tutti i campi dell'intestatario

3. **Testare lookup comuni ISTAT:**
   - Verificare che i comuni vengano caricati correttamente
   - Verificare che il codice ISTAT venga settato automaticamente

4. **Aggiornare `rvfu-mapper.ts`:**
   - Verificare che tutti i nuovi campi vengano mappati correttamente in `VFUCreateAsConcessionario`

---

## 📝 NOTE

Il form è stato significativamente esteso con tutti i campi essenziali per le API RVFU. La sezione intestatario necessita ancora di completamento per essere conforme alle specifiche API, ma i campi base sono presenti nello state e possono essere completati facilmente.

