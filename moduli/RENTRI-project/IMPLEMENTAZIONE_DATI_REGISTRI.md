# ✅ Implementazione Dati Registri RENTRI - Completata

**Data**: 2025-01-XX  
**Modulo**: Dati Registri (Upload Movimenti)  
**Stato**: ✅ Implementazione Base Completata

---

## 📋 File Creati

### 1. Builder MovimentoModel
**File**: `website/src/lib/rentri/movimento-builder.ts`

- ✅ `buildRentriMovimentoPayload()` - Costruisce payload MovimentoModel da dati locali
- ✅ `validateMovimentoForRentri()` - Valida movimento prima della trasmissione
- ✅ `mapRentriEsitoToLocal()` - Mappa esito RENTRI al formato locale

**Funzionalità**:
- Mapping completo da `rentri_movimenti` → `MovimentoModel` RENTRI
- Validazione campi obbligatori e condizionali
- Gestione causali operazione (DT, NP, T*, RE, I, aT, M, TR, T*aT)
- Supporto rifiuto/materiali (condizionale in base a causale)
- Integrazione FIR (per causali aT, TR, T*, T*aT)

### 2. Endpoint Upload Movimenti
**File**: `website/src/app/api/rentri/registri/[id]/movimenti/route.ts`

**Endpoint**: `POST /api/rentri/registri/{registro_id}/movimenti`

**Payload Request**:
```json
{
  "movimenti_ids": ["uuid1", "uuid2", ...]
}
```

**Funzionalità**:
- ✅ Carica registro da database
- ✅ Carica movimenti da trasmettere (filtro per sync_status)
- ✅ Validazione certificato RENTRI
- ✅ Validazione movimenti (pre-trasmissione)
- ✅ Costruzione payload array MovimentoModel
- ✅ Autenticazione JWT (pattern ID_AUTH_REST_02)
- ✅ Integrità messaggio (pattern INTEGRITY_REST_01)
- ✅ POST a RENTRI API con retry (3 tentativi)
- ✅ Gestione risposta 202 Accepted
- ✅ Estrazione `transazione_id` da risposta
- ✅ Aggiornamento DB con stato trasmissione

**Limiti**:
- Max 1000 movimenti per chiamata (limite RENTRI)

### 3. Endpoint Stato Transazione
**File**: `website/src/app/api/rentri/registri/transazioni/[id]/status/route.ts`

**Endpoint**: `GET /api/rentri/registri/transazioni/{transazione_id}/status?org_id={uuid}&environment={demo|prod}`

**Funzionalità**:
- ✅ GET `/dati-registri/v1.0/{transazione_id}/status`
- ✅ Gestione 200 (in elaborazione)
- ✅ Gestione 303 (completata, Location header)

### 4. Endpoint Esito Transazione
**File**: `website/src/app/api/rentri/registri/transazioni/[id]/result/route.ts`

**Endpoint**: `GET /api/rentri/registri/transazioni/{transazione_id}/result?org_id={uuid}&registro_id={uuid}&environment={demo|prod}`

**Funzionalità**:
- ✅ GET `/dati-registri/v1.0/{transazione_id}/result`
- ✅ Parsing EsitoMovimentiModel
- ✅ Aggiornamento movimenti con esiti (validati/errori)
- ✅ Aggiornamento `rentri_id` e `rentri_stato` movimenti

---

## 🔄 Workflow Asincrono

Pattern **NONBLOCK_PULL_REST** (come FIR):

1. **Upload Movimenti** → `POST /api/rentri/registri/{id}/movimenti`
   - Risposta: `202 Accepted` + `transazione_id`

2. **Polling Stato** → `GET /api/rentri/registri/transazioni/{transazione_id}/status`
   - `200` = in elaborazione (continuare polling)
   - `303` = completata (Location header per result)

3. **Recupero Esito** → `GET /api/rentri/registri/transazioni/{transazione_id}/result`
   - `200` = esito disponibile
   - Parsing `EsitoMovimentiModel`
   - Aggiornamento DB

---

## 📊 Schema MovimentoModel

### Campi Obbligatori
- `riferimenti`: DatiRiferimentiModel
  - `numero_registrazione`: { anno, progressivo }
  - `data_ora_registrazione`: ISO 8601 UTC
  - `causale_operazione`: enum (DT, NP, T*, RE, I, aT, M, TR, T*aT)

### Campi Condizionali
- `rifiuto`: DatiRifiutoModel (obbligatorio se causale != "M")
- `materiali`: DatiMaterialiModel (obbligatorio se causale == "M")
- `integrazione_fir`: DatiIntegrazioneFirModel (per causali aT, TR, T*, T*aT)
- `esito`: DatiEsitoModel (per causali aT, T*aT)
- `produttore`, `destinatario`, `trasportatore`: DatiSoggettoModel (opzionali)

---

## ✅ Test e Validazione

### Da Implementare
- [ ] Test end-to-end con RENTRI DEMO
- [ ] Gestione errori validazione RENTRI
- [ ] Worker polling asincrono automatico (opzionale)
- [ ] UI frontend per upload movimenti
- [ ] Supporto rettifiche e annullamenti

### Validazioni Implementate
- ✅ Anno (1980-2050)
- ✅ Progressivo (>= 1)
- ✅ Causale operazione (enum valido)
- ✅ Codice EER (obbligatorio se causale != "M")
- ✅ Quantità e unità di misura
- ✅ Stato fisico (SP, S, FP, L, VS)
- ✅ Integrazione FIR (per causali specifiche)

---

## 📚 Riferimenti

- **API Spec**: `RENTRI-project/demo-docs/api/dati-registri-v1.0.json`
- **Flussi Operativi**: `RENTRI-project/demo-docs/md/api-flussi-operativi-registri.md`
- **Pattern Asincrono**: NONBLOCK_PULL_REST (AgID)
- **Piano**: `RENTRI-project/PLAN_DATI_REGISTRI.md`

---

## 🎯 Prossimi Step

1. **UI Frontend** - Creare interfaccia per selezione e upload movimenti
2. **Worker Polling** - Implementare polling automatico stato transazioni
3. **Gestione Errori** - Migliorare gestione errori validazione RENTRI
4. **Rettifiche/Annullamenti** - Implementare supporto movimenti rettificati/annullati
5. **Test End-to-End** - Test completo con RENTRI DEMO

---

## ⚠️ Note Implementative

1. **Identificativo Registro**: L'endpoint richiede `identificativo_registro` nel formato `R[0-9A-Z]{10}` (es. `RXXXXXXXXX0`). Questo deve essere già presente in `rentri_registri.rentri_id`.

2. **Transazione ID**: La risposta 202 contiene `TransazioneModel` con campo `transazione_id` (UUID).

3. **Status Endpoint**: L'endpoint `/status` restituisce:
   - `200` = ancora in elaborazione
   - `303` = completata (Location contiene URL result)

4. **Result Endpoint**: L'endpoint `/result` restituisce `EsitoMovimentiModel` con:
   - Lista movimenti validati
   - Lista errori validazione
   - Stato complessivo

5. **Certificato**: Utilizza certificato attivo e default per org_id e environment.

---

## 🔗 Endpoint RENTRI Utilizzati

- `POST /dati-registri/v1.0/operatore/{identificativo_registro}/movimenti`
- `GET /dati-registri/v1.0/{transazione_id}/status`
- `GET /dati-registri/v1.0/{transazione_id}/result`

