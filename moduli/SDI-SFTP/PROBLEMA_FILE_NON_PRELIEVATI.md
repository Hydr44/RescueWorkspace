# Problema: File Non Prelevati da SDI

## 📊 Situazione Attuale

**Data verifica:** 13 gennaio 2026, 08:43  
**Tempo trascorso:** ~8 ore dal primo caricamento

### File Presenti (NON prelevati)

1. **File 1:** `FI.SCZMNL05L21D960T.2026013.0049.900.zip`
   - Caricato: 00:50:00
   - Stato: **Ancora presente** (8 ore dopo)
   - Dimensione: 4.2K

2. **File 2:** `FI.SCZMNL05L21D960T.2026013.0125.900.zip`
   - Caricato: 01:25:00
   - Stato: **Ancora presente** (7 ore dopo)
   - Dimensione: 4.2K

### Semaforo SDI

- **Ultimo aggiornamento:** 08:40:14
- **Stato:** SDI si collega regolarmente
- **Contenuto:** "da Sogei"

### File da SDI

- ❌ Nessun file **ER** (errore/scarto)
- ❌ Nessun file **EO** (esito)
- ❌ Nessun file **FO** (file in uscita)

---

## 🔍 Analisi

### Comportamento SDI

1. ✅ SDI si collega regolarmente (semaforo aggiornato)
2. ❌ SDI **non preleva** i file caricati
3. ❌ SDI **non genera** file di errore/scarto (ER)

### Possibili Cause

#### 1. File Non Validi (Più Probabile)

SDI controlla i file ma **non li preleva** perché:
- **Dati fattura con valori placeholder** (più probabile)
  - `IdCodice = 'XXXXXXX'`
  - `Denominazione = 'Da configurare'`
  - Indirizzo con valori placeholder
- **Formato XML non conforme** FatturaPA 1.2.2
- **Struttura ZIP non corretta**

#### 2. Problemi di Formato/Cifratura

Anche se tecnicamente conforme, potrebbe esserci:
- Problema nella struttura PKCS#7
- Algoritmo RSA non corretto (anche se dovrebbe essere OK)
- Formato DER non conforme

#### 3. Problemi di Nomenclatura

Anche se sembra corretta:
- Progressivo duplicato
- Formato nome file non conforme

---

## ✅ Soluzioni Implementate

### 1. Validazione Dati

**File:** `xml-generator.js`
- ✅ Validazione `IdCodice` (non può essere `XXXXXXX`)
- ✅ Validazione `Denominazione` (non può essere `'Da configurare'`)
- ✅ Validazione indirizzo completo
- ✅ Messaggi di errore chiari

### 2. Dati Test Aggiornati

**File:** `InvoiceNew.jsx` - `fillTestData()`
- ✅ P.IVA formato corretto: `IT12345678901`
- ✅ Indirizzi completi e validi
- ✅ Codici destinatario test corretti

---

## 🎯 Prossimi Passi

### 1. Verificare Contenuto File Esistenti

**File da analizzare:**
- `FI.SCZMNL05L21D960T.2026013.0049.900.zip` (probabilmente con dati placeholder)
- `FI.SCZMNL05L21D960T.2026013.0125.900.zip` (probabilmente con dati placeholder)

**Azioni:**
1. Scaricare file da SFTP
2. Decifrare file (se possibile)
3. Verificare contenuto XML interno
4. Identificare valori placeholder o problemi

### 2. Creare Nuovo File con Dati Validi

**Usando:**
1. Funzione `fillTestData()` aggiornata
2. Dati azienda configurati in Settings
3. Dati completi e validi (no placeholder)

### 3. Contattare SDI/Sogei

**Se il problema persiste dopo dati validi:**
- Email: `servizicrittograficiftp@sogei.it`
- Chiedere:
  - Perché i file non vengono prelevati
  - Se ci sono problemi nei log SDI
  - Verifica conformità file

---

## 📋 Checklist Debug

- [ ] Verificare contenuto file esistenti
- [ ] Verificare dati azienda in Settings
- [ ] Creare nuova fattura con `fillTestData()` aggiornato
- [ ] Verificare che XML generato non contenga placeholder
- [ ] Inviare nuovo file con dati validi
- [ ] Monitorare prelievo per 1-2 ore
- [ ] Se ancora non prelevato, contattare SDI

---

## 🔗 Riferimenti

- Verifica conformità: `VERIFICA_COMPLETA_CONFORMITA.md`
- Aggiornamento dati test: `AGGIORNAMENTO_DATI_TEST.md`
- Funzionamento prelievo: `FUNZIONAMENTO_PRELIEVO_SDI.md`

