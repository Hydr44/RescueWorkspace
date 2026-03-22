# ⚠️ Errori Possibili Ora (Dopo Risoluzione Struttura)

**Data:** 14 gennaio 2026  
**Status:** Struttura supporto corretta - possibili errori nel contenuto

---

## ✅ Problemi Risolti

1. ✅ **File di quadratura mancante** → RISOLTO
2. ✅ **Namespace file di quadratura errato** → RISOLTO
3. ✅ **Struttura ZIP** → CORRETTA

---

## ⚠️ Errori Possibili Ora

### 1. **Errori Validazione XSD (Codice 00200)**

**Causa:** XML non conforme allo schema XSD FatturaPA 1.2.2

**Esempi:**
- Formato date errato
- Valori numerici non validi
- Campi obbligatori mancanti
- Lunghezza stringhe non conforme

---

### 2. **Errori Controlli Extra XSD (Codici 004xx)**

#### 2.1 Errori IVA e Natura
- **00400:** `<Natura>` non presente con `<AliquotaIVA>` = 0
- **00401:** `<Natura>` presente con `<AliquotaIVA>` ≠ 0
- **00413:** `<Natura>` non presente con `<AliquotaIVA>` = 0 (cassa previdenziale)
- **00414:** `<Natura>` presente con `<AliquotaIVA>` ≠ 0 (cassa previdenziale)

#### 2.2 Errori Date
- **00403:** `<Data>` successiva alla data di ricezione
- **00418:** `<Data>` antecedente a `<Data>` (altri documenti)

#### 2.3 Errori Dati Ritenuta
- **00411:** `<DatiRitenuta>` non presente con `<Ritenuta>` = SI (dettaglio linee)
- **00415:** `<DatiRitenuta>` non presente con `<Ritenuta>` = SI (cassa previdenziale)

#### 2.4 Errori Identificativi Fiscali
- **00417:** `IdFiscaleIVA` e `CodiceFiscale` entrambi non valorizzati (almeno uno richiesto)

#### 2.5 Errori Dati Riepilogo
- **00419:** `<DatiRiepilogo>` non presente per ogni aliquota IVA

---

### 3. **Errori Validità Contenuto (Codici 003xx)**

#### 3.1 Codice Destinatario
- **00300:** `<IdCodice>` (codice destinatario) non valido
- **00301:** `<IdCodice>` cedente/prestatore non valido
- **00302:** `<CodiceFiscale>` non valido

#### 3.2 Anagrafica IPA
- Codice destinatario non presente/attivo in IndicePA
- Data avvio servizio successiva alla data controllo

---

### 4. **Errori Firma/Cifratura (Codici 001xx)**

#### 4.1 Certificato Firma
- **00100:** Certificato di firma scaduto
- **00101:** Certificato di firma revocato
- **00104:** CA non nell'elenco CA affidabili
- **00107:** Certificato di firma non valido

#### 4.2 Integrità Firma
- **00102:** Firma elettronica non valida
- **00103:** Manca riferimento temporale nella firma
- **00105:** Riferimento temporale successivo alla data ricezione

#### 4.3 File/Archivio
- **00106:** File/archivio vuoto o corrotto

---

### 5. **Errori Nomenclatura (Codici 000xx)**

- **00001:** Nome file non valido
- **00002:** Nome file duplicato
- **00003:** Dimensioni file superano quelle ammesse

---

### 6. **Errori File di Quadratura (se ancora presenti)**

#### 6.1 Dati Non Corrispondenti
- Numero fatture nel file di quadratura ≠ numero reale nel ZIP
- Tipo file errato
- Nome supporto non corrispondente

---

## 🎯 Priorità Verifica

### 🔴 Alta Priorità (Più Probabili)

1. **Errori Controlli Extra XSD (004xx)**
   - IVA e Natura
   - Date
   - Dati Ritenuta
   - Dati Riepilogo

2. **Errori Validità Contenuto (003xx)**
   - Codice destinatario
   - Identificativi fiscali

3. **Errori Validazione XSD (00200)**
   - Formato dati
   - Campi obbligatori

### 🟡 Media Priorità

4. **Errori Firma/Cifratura (001xx)**
   - Certificati
   - Integrità firma

5. **Errori Nomenclatura (000xx)**
   - Nome file
   - Dimensioni

---

## 📝 Note

Ora che la struttura del supporto è corretta, gli errori più probabili sono legati al **contenuto della fattura**, non alla struttura del supporto.

Se l'errore ET02 persiste, controllare:
1. Dettagli errore nel portale SDI (codice errore specifico)
2. Contenuto XML fattura (validazione XSD)
3. Dati fattura (IVA, date, identificativi, etc.)

---

## 🔍 Come Verificare

1. **Portale SDI:** Controllare dettagli errore (codice specifico)
2. **File EO:** Controllare se contiene dettagli aggiuntivi
3. **XML Fattura:** Validare con XSD FatturaPA 1.2.2
4. **Controlli Extra:** Verificare tutti i controlli extra XSD
