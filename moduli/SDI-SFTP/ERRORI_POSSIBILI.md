# ⚠️ Errori Possibili Ora

**Data:** 14 gennaio 2026  
**Status:** Dopo risoluzione problemi struttura supporto

---

## ✅ Problemi Risolti

1. ✅ File di quadratura mancante → **RISOLTO**
2. ✅ Namespace file di quadratura errato → **RISOLTO**
3. ✅ Struttura ZIP → **CORRETTA**

---

## ⚠️ Errori Possibili Ora

### 1. **Errori nel Contenuto XML Fattura**

#### 1.1 Errori di Validazione XSD
- **Causa:** Dati non conformi allo schema XSD FatturaPA 1.2.2
- **Esempi:**
  - Formato date errato
  - Valori numerici non validi
  - Campi obbligatori mancanti
  - Lunghezza stringhe non conforme

#### 1.2 Errori Controlli Extra XSD
- **Causa:** Dati logicamente non validi (anche se XSD valid)
- **Esempi:**
  - Calcoli IVA errati
  - Totali non corrispondenti
  - Codici destinatario non validi
  - Partita IVA/Codice Fiscale non validi

---

### 2. **Errori Firma/Cifratura**

#### 2.1 Problema Firma XML
- **Causa:** Firma PKCS#7 non valida o non conforme
- **Esempi:**
  - Certificato scaduto
  - Algoritmo hash non conforme
  - Formato CAdES-BES non corretto

#### 2.2 Problema Cifratura ZIP
- **Causa:** Cifratura PKCS#7 EnvelopedData non valida
- **Esempi:**
  - Certificato pubblico Sogei errato
  - Algoritmo di cifratura non conforme
  - Formato non conforme

---

### 3. **Errori Dati Fattura**

#### 3.1 Dati Cliente/Fornitore
- **Causa:** Dati incompleti o non validi
- **Esempi:**
  - Indirizzo incompleto
  - CAP/Provincia non validi
  - Partita IVA non valida

#### 3.2 Dati Righe Fattura
- **Causa:** Dati righe non validi
- **Esempi:**
  - Prezzi negativi
  - Quantità zero
  - IVA non calcolata correttamente

---

### 4. **Errori File di Quadratura (se ancora presenti)**

#### 4.1 Dati File di Quadratura
- **Causa:** Dati nel file di quadratura non corrispondono al contenuto ZIP
- **Esempi:**
  - Numero fatture errato
  - Tipo file errato
  - Nome supporto non corrispondente

---

### 5. **Errori Generici SDI**

#### 5.1 Errori di Elaborazione
- **Causa:** Problemi interni SDI
- **Esempi:**
  - Timeout elaborazione
  - Problemi temporanei SDI

---

## 🎯 Priorità Verifica

### Alta Priorità
1. **Contenuto XML fattura** - Verificare validazione XSD e controlli extra
2. **Dati fattura** - Verificare che tutti i dati siano completi e corretti
3. **Firma/Cifratura** - Verificare che i certificati siano validi

### Media Priorità
4. **File di quadratura** - Verificare che i dati corrispondano al contenuto
5. **Formato generale** - Verificare che tutto sia conforme

---

## 📝 Note

Ora che la struttura del supporto è corretta, gli errori più probabili sono:
- **Errori nel contenuto XML delle fatture** (dati, calcoli, validazioni)
- **Errori nei dati cliente/fornitore** (indirizzi, codici, etc.)

Se l'errore ET02 persiste, probabilmente è legato al contenuto della fattura, non alla struttura del supporto.
