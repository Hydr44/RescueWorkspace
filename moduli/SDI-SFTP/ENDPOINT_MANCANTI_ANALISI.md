# 📋 Analisi Endpoint SDI Mancanti

**Data:** 14 gennaio 2026  
**Status:** Analisi completata, da implementare

---

## ✅ Endpoint Esistenti

1. **`GET /api/sdi-sftp/status`**
   - ✅ Lista file FI (in attesa di prelevamento)
   - ✅ Lista file EO (esiti)
   - ✅ Lista file ER (scarti)
   - ✅ **Lista file FO (fatture ricevute)** ← **IMPLEMENTATO**

2. **`POST /api/sdi-sftp/send`**
   - ✅ Invio fatture via SFTP
   - ✅ Funziona correttamente

---

## ✅ Endpoint Implementati

### 1. **`GET /api/sdi-sftp/files/incoming`** ✅
**Scopo:** Elencare i file FO (fatture passive ricevute)  
**Query params:**
- `test_mode` (opzionale): `true` per test, `false` per produzione
- `limit` (opzionale): Numero massimo di risultati (default: 50)

**Risposta:**
```json
{
  "test_mode": true,
  "files": [
    {
      "filename": "FO.02166430856.2026014.1554.901.zip.p7m.enc",
      "size": 8736,
      "received_at": "2026-01-14T15:54:00.000Z",
      "status": "unprocessed"
    }
  ],
  "summary": {
    "total_count": 4,
    "unprocessed_count": 4
  }
}
```

### 2. **`GET /api/sdi-sftp/files/incoming/:filename/download`** ✅
**Scopo:** Scaricare un file FO (cifrato)  
**Risposta:** File binario con `Content-Type: application/octet-stream`  
**Status:** ✅ Implementato

### 3. **`POST /api/sdi-sftp/files/incoming/:filename/decrypt`** ⚠️
**Scopo:** Decifrare un file FO e estrarre il contenuto XML  
**Status:** ⚠️ Endpoint creato ma decifratura non ancora implementata (ritorna 501)  
**Risposta:**
```json
{
  "success": true,
  "filename": "FO.02166430856.2026014.1554.901.zip.p7m.enc",
  "xml_files": [
    {
      "name": "IT02166430856_XXXXX.xml",
      "content": "...",
      "size": 5420
    }
  ],
  "invoice_data": {
    "numero": "F001",
    "data": "2026-01-14",
    "importo_totale": 1000.00
  }
}
```

### 4. **`GET /api/sdi-sftp/files/incoming/:filename/pdf`**
**Scopo:** Convertire una fattura ricevuta in PDF  
**Query params:**
- `decrypt` (opzionale): `true` per decifrare automaticamente (default: `true`)

**Risposta:** File PDF con `Content-Type: application/pdf`

### 5. **`POST /api/sdi-sftp/files/incoming/process`**
**Scopo:** Processare automaticamente tutti i file FO non processati  
**Body:**
```json
{
  "test_mode": true,
  "auto_create_invoices": true
}
```

**Risposta:**
```json
{
  "success": true,
  "processed_count": 4,
  "created_invoices": 4,
  "errors": []
}
```

### 6. **`GET /api/sdi-sftp/polling/check`** (Polling Automatico)
**Scopo:** Verificare se ci sono nuovi file FO/EO/ER dopo 2 ore  
**Query params:**
- `hours` (opzionale): Numero di ore da controllare (default: 2)

**Risposta:**
```json
{
  "has_new_files": true,
  "files_fo": 4,
  "files_eo": 10,
  "files_er": 2,
  "last_check": "2026-01-14T15:00:00.000Z",
  "next_check": "2026-01-14T17:00:00.000Z"
}
```

---

## 🔍 File FO Trovati

**Directory:** `/var/sftp/sdi/DatiDaSdITest/`

```
FO.02166430856.2026014.1554.901.zip.p7m.enc (8736 bytes)
FO.02166430856.2026014.1832.901.zip.p7m.enc (11856 bytes)
FO.02166430856.2026014.1940.901.zip.p7m.enc (8960 bytes)
FO.02166430856.2026014.2038.901.zip.p7m.enc (8960 bytes)
```

**Formato:**
- `.zip.p7m.enc` = ZIP firmato (PKCS#7) e cifrato (PKCS#7 EnvelopedData)
- Processo inverso: Cifrato → Firma → ZIP → XML

---

## 📝 Note Tecniche

### Decifratura File FO

I file FO sono cifrati con **PKCS#7 EnvelopedData** usando la chiave pubblica di SDI/Sogei.

**Processo di decifratura:**
1. Leggi file `.p7m.enc`
2. Decifra con certificato privato di cifratura (`EMMAT002.SCZMNL05L21D960T.cifra.p12`)
3. Verifica firma (opzionale, ma consigliato)
4. Estrai ZIP
5. Estrai XML dal ZIP

### Conversione XML → PDF

**Opzioni:**
1. **Generazione locale:** Converti XML FatturaPA in PDF usando `jsPDF` o libreria simile
2. **Usa servizio esterno:** Chiama API SDI per ottenere PDF (se disponibile)
3. **XSLT:** Usa XSLT per convertire XML in HTML/PDF

**Raccomandato:** Generazione locale per controllo completo e indipendenza da SDI.

---

## 🚀 Priorità Implementazione

1. **Alta Priorità:**
   - ✅ Aggiungere file FO in `/api/sdi-sftp/status` - **COMPLETATO**
   - ✅ Creare `/api/sdi-sftp/files/incoming` per elencare FO - **COMPLETATO**
   - ✅ Creare `/api/sdi-sftp/files/incoming/:filename/download` - **COMPLETATO**
   - ⚠️ Creare `/api/sdi-sftp/files/incoming/:filename/decrypt` - **Endpoint creato, decifratura da implementare**

2. **Media Priorità:**
   - ✅ Creare `/api/sdi-sftp/files/incoming/:filename/pdf`
   - ✅ Creare `/api/sdi-sftp/polling/check`

3. **Bassa Priorità:**
   - ✅ Creare `/api/sdi-sftp/files/incoming/process` (automatizzazione completa)

---

## 🔧 File da Modificare

1. **`moduli/SDI-SFTP/server-vps/server.js`**
   - Aggiungere lettura file FO in `/api/sdi-sftp/status`
   - Aggiungere nuovi endpoint

2. **`website/src/app/api/sdi-sftp/status/route.ts`** (se esiste)
   - Aggiornare per includere file FO

3. **Frontend (Desktop App)**
   - Aggiungere UI per visualizzare fatture ricevute
   - Aggiungere pulsante "Stampa PDF" per fatture ricevute

---

## 📚 Riferimenti

- Manuale SDI: `moduli/SDI-SFTP/manuali/Istruzioni-SDIFTP-v4.3`
- Formato FO: `FO.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.zip.p7m.enc`
- Directory: `/var/sftp/sdi/DatiDaSdITest/` (test) o `/var/sftp/sdi/DatiDaSdI/` (produzione)
