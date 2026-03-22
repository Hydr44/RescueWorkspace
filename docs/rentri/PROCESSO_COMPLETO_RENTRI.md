# ✅ PROCESSO COMPLETO RENTRI IMPLEMENTATO

## 📚 WORKFLOW SECONDO MANUALI RENTRI

### Pattern AgID: NONBLOCK_PULL_REST

RENTRI usa **API asincrone** per le operazioni che richiedono elaborazione.

---

## 🔄 PROCESSO IN 3 FASI

### 1️⃣ TRASMISSIONE (POST)

**Endpoint**: `POST /formulari/v1.0/`

**Request**:
```json
{
  "num_iscr_sito": "OP2512HTM066432-CL0001",
  "dati_partenza": { ... },
  "dati_trasporto_partenza": { ... }
}
```

**Response**:
```json
{
  "transazione_id": "b9c71269-2ac8-4164-af8a-2ad59bac38a6"
}
```

**Status**: ✅ IMPLEMENTATO

---

### 2️⃣ POLLING STATUS (GET)

**Endpoint**: `GET /formulari/v1.0/{transazione_id}/status`

**Ciclo**:
```
Loop ogni 2 secondi:
  Status 200 OK → In elaborazione (continua)
  Status 303 See Other → Completato (stop, vai a fase 3)
  Header Location → URL per recuperare result
```

**Status**: ✅ IMPLEMENTATO  
**File**: `/api/rentri/fir/transazione-status`

---

### 3️⃣ RECUPERO RESULT (GET)

**Endpoint**: `GET /formulari/v1.0/{transazione_id}/result`

**Response**:
```json
{
  "numero_fir": "ABCD-12345-ZZ",  ← Numero definitivo RENTRI
  "identificativo": "F12345...",   ← ID univoco RENTRI
  "stato": "InserimentoQuantita",
  "data_emissione": "2025-12-04T10:21:35Z",
  ...
}
```

**Status**: ✅ IMPLEMENTATO  
**File**: `/api/rentri/fir/transazione-result`

---

## 🔧 IMPLEMENTAZIONE FRONTEND

### Dopo `POST /trasmetti`:

1. ✅ Ricevi `transazione_id`
2. ✅ Avvia polling automatico (ogni 2s)
3. ✅ Dopo status 303, recupera result
4. ✅ Aggiorna DB locale con dati definitivi
5. ✅ Mostra alert con numero FIR RENTRI

---

## ⏱️ TIMING

- **Elaborazione RENTRI**: 10-30 secondi (tipico)
- **Polling interval**: 2 secondi
- **Max tentativi**: 20 (40 secondi totali)
- **Fallback**: Sincronizzazione background ogni 5 minuti

---

## 📊 FLUSSO COMPLETO

```
User: Clicca "Trasmetti"
  ↓
Frontend: POST /api/rentri/fir/trasmetti
  ↓
Backend: POST a RENTRI → transazione_id
  ↓
Backend: Return transazione_id a frontend
  ↓
Frontend: Alert "In elaborazione..."
  ↓
Frontend: Polling ogni 2s
  ├─ GET /api/rentri/fir/transazione-status
  ├─ Status 200? → Continua polling
  └─ Status 303? → GET /api/rentri/fir/transazione-result
      ↓
Frontend: Alert "✅ Numero FIR: ABCD-12345-ZZ"
  ↓
Frontend: Ricarica dati (mostra numero definitivo)
```

---

## ✅ CONFORME AI MANUALI RENTRI

- ✅ Pattern AgID NONBLOCK_PULL_REST
- ✅ Polling con status 303
- ✅ Recupero result finale
- ✅ Aggiornamento DB locale
- ✅ UX chiara per l'utente

---

## 📋 RIFERIMENTI

- **Manuale**: `api-flussi-operativi-introduzione.md`, righe 128-202
- **FAQ**: `supporto-faq.md`, righe 13-17
- **API Spec**: `formulari-v1.0.json`, endpoint `/{ transazione_id}/status` e `/result`

---

## 🎯 TEST DOPO DEPLOY

1. Trasmetti FIR
2. Attendi 10-30 secondi
3. Vedrai alert con numero FIR definitivo RENTRI
4. Il FIR nella lista avrà il numero RENTRI

**Data implementazione**: 04 Dicembre 2025, ore 11:52



