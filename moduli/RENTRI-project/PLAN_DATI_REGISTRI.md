# 📋 Piano Implementazione Dati Registri RENTRI

**Obiettivo**: Implementare upload movimenti registri RENTRI (obbligatorio D.M. 4 aprile 2023 n. 59)

---

## 🎯 Endpoint da Implementare

### 1. **Upload Movimenti** (Priorità Alta)
```
POST /api/rentri/registri/{identificativo_registro}/movimenti
```
- Invio batch movimenti (max 1000 per chiamata)
- Pattern asincrono NONBLOCK_PULL_REST
- Restituisce `transazione_id`

### 2. **Stato Transazione** (Priorità Alta)
```
GET /api/rentri/registri/transazioni/{transazione_id}/status
```
- Polling stato elaborazione
- Restituisce 200 (in elaborazione) o 303 (completata con Location)

### 3. **Esito Transazione** (Priorità Alta)
```
GET /api/rentri/registri/transazioni/{transazione_id}/result
```
- Recupera esito elaborazione
- Restituisce `EsitoMovimentiModel` con errori/validazioni

---

## 📊 Schema MovimentoModel (da API RENTRI)

### Campi Obbligatori
- `riferimenti`: DatiRiferimentiModel (obbligatorio)
  - `numero_registrazione`: { anno, progressivo }
  - `data_ora_registrazione`: ISO 8601 UTC
  - `causale_operazione`: enum (DT, NP, T*, RE, I, aT, M, TR, T*aT)
  - `numero_registrazione_rettifica`: opzionale (per rettifiche)

### Campi Condizionali
- `rifiuto`: DatiRifiutoModel (obbligatorio se causale != "M")
  - `codice_eer`: codice EER rifiuto
  - `descrizione`: descrizione rifiuto
  - `quantita`: { valore, unita_misura }
  - `caratteristiche_pericolo`: array HP01-HP15
  - `categorie_aee`: per AEE (Cat1-Cat6, PF)
  
- `materiali`: DatiMaterialiModel (obbligatorio se causale == "M")

- `integrazione_fir`: DatiIntegrazioneFirModel (obbligatorio se causale in ["aT", "TR", "T*", "T*AT"])
  - `numero_fir`: numero FIR RENTRI

- `esito`: DatiEsitoModel (obbligatorio se causale in ["aT", "T*AT"])

- `produttore`: DatiSoggettoModel (obbligatorio per causali di carico)
- `destinatario`: DatiSoggettoModel (obbligatorio per causali di scarico)
- `detentore`: DatiSoggettoModel (opzionale)
- `trasportatore`: DatiSoggettoModel (opzionale)

---

## 🔧 File da Creare

1. **Builder MovimentoModel**
   - File: `website/src/lib/rentri/movimento-builder.ts`
   - Funzioni:
     - `buildRentriMovimentoPayload(movimentoLocale, registro)`
     - `validateMovimentoForRentri(movimentoLocale)`
     - Mapping da DB locale → RENTRI format

2. **Endpoint Upload Movimenti**
   - File: `website/src/app/api/rentri/registri/[id]/movimenti/route.ts`
   - Logica:
     - Carica registro da DB
     - Valida certificato RENTRI
     - Carica movimenti da trasmettere (filtro per stato)
     - Costruisce payload array MovimentoModel
     - Chiama API RENTRI POST /operatore/{id}/movimenti
     - Salva transazione_id
     - Avvia polling asincrono

3. **Endpoint Stato Transazione**
   - File: `website/src/app/api/rentri/registri/transazioni/[id]/status/route.ts`
   - Logica:
     - GET /dati-registri/v1.0/{transazione_id}/status
     - Gestisce 200 (in elaborazione) e 303 (Location)

4. **Endpoint Esito Transazione**
   - File: `website/src/app/api/rentri/registri/transazioni/[id]/result/route.ts`
   - Logica:
     - GET /dati-registri/v1.0/{transazione_id}/result
     - Parsing EsitoMovimentiModel
     - Aggiornamento DB con esiti

5. **Worker Polling Asincrono** (Opzionale - simile a FIR)
   - Polling automatico status
   - Recupero result quando completato
   - Aggiornamento movimenti con esiti

---

## 📋 Database Schema (da verificare)

### Tabelle esistenti
- `rentri_registri` - Registri RENTRI
- `rentri_movimenti` - Movimenti locali

### Campi necessari in `rentri_movimenti`
- `transazione_id` - ID transazione RENTRI (UUID)
- `stato_trasmissione` - enum (da_trasmettere, in_trasmissione, trasmesso, errore)
- `esito_rentri` - JSONB con esito RENTRI
- `errori_rentri` - JSONB con errori validazione

---

## 🎯 Prossimi Step

1. ✅ Analizzare schema completo MovimentoModel
2. ⏳ Creare movimento-builder.ts
3. ⏳ Creare endpoint upload movimenti
4. ⏳ Creare endpoint status/result
5. ⏳ Implementare workflow asincrono
6. ⏳ Test completo

---

## 📚 Riferimenti

- API Spec: `RENTRI-project/demo-docs/api/dati-registri-v1.0.json`
- Flussi Operativi: `RENTRI-project/demo-docs/md/api-flussi-operativi-registri.md`
- Pattern Asincrono: Stesso di FIR (NONBLOCK_PULL_REST)

