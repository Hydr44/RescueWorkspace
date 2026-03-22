# Test Finale Pre-Produzione RENTRI

**Data**: 18 Febbraio 2026  
**Obiettivo**: Verificare tutti gli endpoint RENTRI in ambiente DEMO prima del passaggio a PRODUZIONE

---

## Prerequisiti

1. Certificato DEMO attivo e non scaduto in `rentri_org_certificates`
2. `org_settings.rentri_environment = 'demo'`
3. Almeno un sito con `num_iscr_sito` configurato
4. Server website (Vercel) raggiungibile

---

## 1. Test Ambiente Toggle

### 1.1 GET Ambiente Corrente
```bash
curl -s "https://www.rescuemanager.eu/api/rentri/environment?org_id=YOUR_ORG_ID" | jq
```
**Atteso**: `{ "environment": "demo", "certificato_attivo": {...}, ... }`

### 1.2 PUT Cambio Ambiente (a prod - fallirà senza cert prod)
```bash
curl -s -X PUT "https://www.rescuemanager.eu/api/rentri/environment" \
  -H "Content-Type: application/json" \
  -d '{"org_id":"YOUR_ORG_ID","environment":"prod"}' | jq
```
**Atteso**: Errore "Nessun certificato attivo trovato per l'ambiente PRODUZIONE"

### 1.3 PUT Cambio Ambiente (a demo - deve funzionare)
```bash
curl -s -X PUT "https://www.rescuemanager.eu/api/rentri/environment" \
  -H "Content-Type: application/json" \
  -d '{"org_id":"YOUR_ORG_ID","environment":"demo"}' | jq
```
**Atteso**: `{ "success": true, "environment": "demo" }`

---

## 2. Test Anagrafiche

### 2.1 GET Siti Operatore
```bash
curl -s "https://www.rescuemanager.eu/api/rentri/siti?org_id=YOUR_ORG_ID" | jq
```
**Atteso**: Lista siti con `num_iscr_sito`

### 2.2 GET Autorizzazioni Sito
```bash
curl -s "https://www.rescuemanager.eu/api/rentri/siti/autorizzazioni?org_id=YOUR_ORG_ID&num_iscr_sito=YOUR_NUM_ISCR_SITO" | jq
```
**Atteso**: Lista autorizzazioni per il sito

### 2.3 Sincronizza Registri da RENTRI
```bash
curl -s -X POST "https://www.rescuemanager.eu/api/rentri/registri/sync" \
  -H "Content-Type: application/json" \
  -d '{"org_id":"YOUR_ORG_ID","num_iscr_sito":"YOUR_NUM_ISCR_SITO"}' | jq
```
**Atteso**: `{ "success": true, "registri_sincronizzati": N }`

---

## 3. Test Registri

### 3.1 GET Lista Registri (locale)
```bash
curl -s "https://www.rescuemanager.eu/api/rentri/registri?org_id=YOUR_ORG_ID" | jq
```
**Atteso**: Lista registri con `rentri_id` per quelli sincronizzati

### 3.2 POST Crea Registro Locale
```bash
curl -s -X POST "https://www.rescuemanager.eu/api/rentri/registri" \
  -H "Content-Type: application/json" \
  -d '{
    "org_id":"YOUR_ORG_ID",
    "anno": 2026,
    "tipo": "carico",
    "numero_registro": "TEST-PRE-PROD-001"
  }' | jq
```
**Atteso**: `{ "success": true, "registro": {...} }`

### 3.3 POST Crea Registro su RENTRI
```bash
curl -s -X POST "https://www.rescuemanager.eu/api/rentri/registri/create" \
  -H "Content-Type: application/json" \
  -d '{"org_id":"YOUR_ORG_ID","registro_id":"REGISTRO_ID_DAL_PASSO_3.2"}' | jq
```
**Atteso**: `{ "success": true, "rentri_id": "...", "registro_id": "..." }`

### 3.4 GET Vidimazione Registro
```bash
curl -s "https://www.rescuemanager.eu/api/rentri/registri/REGISTRO_ID/vidimazione?org_id=YOUR_ORG_ID"
```
**Atteso**: XML della vidimazione virtuale (o errore se non disponibile in DEMO)

---

## 4. Test Movimenti

### 4.1 POST Crea Movimento Locale
```bash
curl -s -X POST "https://www.rescuemanager.eu/api/rentri/registri/REGISTRO_ID/movimenti" \
  -H "Content-Type: application/json" \
  -d '{
    "org_id":"YOUR_ORG_ID",
    "tipo_operazione": "carico",
    "data_operazione": "2026-02-18",
    "codice_eer": "160104*",
    "descrizione_rifiuto": "Veicoli fuori uso - Test pre-produzione",
    "quantita": 1500,
    "unita_misura": "KG",
    "causale_operazione": "RP",
    "progressivo": 1
  }' | jq
```
**Atteso**: `{ "movimento": {...} }`

### 4.2 POST Trasmetti Movimenti a RENTRI
```bash
curl -s -X POST "https://www.rescuemanager.eu/api/rentri/registri/REGISTRO_ID/movimenti" \
  -H "Content-Type: application/json" \
  -d '{
    "org_id":"YOUR_ORG_ID",
    "movimenti_ids": ["MOVIMENTO_ID_DAL_PASSO_4.1"]
  }' | jq
```
**Atteso**: `{ "success": true, "transazione_id": "...", "movimenti_trasmessi": 1 }`

### 4.3 GET Status Transazione
```bash
curl -s "https://www.rescuemanager.eu/api/rentri/registri/transazioni/TRANSAZIONE_ID/status?org_id=YOUR_ORG_ID&registro_id=REGISTRO_ID" | jq
```
**Atteso**: `{ "stato": "in_elaborazione" }` o `{ "stato": "completata" }`

### 4.4 GET Result Transazione (dopo completamento)
```bash
curl -s "https://www.rescuemanager.eu/api/rentri/registri/transazioni/TRANSAZIONE_ID/result?org_id=YOUR_ORG_ID&registro_id=REGISTRO_ID" | jq
```
**Atteso**: `{ "success": true, "esito": {...} }`

### 4.5 Sincronizza Movimenti da RENTRI
```bash
curl -s -X POST "https://www.rescuemanager.eu/api/rentri/movimenti/sync" \
  -H "Content-Type: application/json" \
  -d '{"org_id":"YOUR_ORG_ID","registro_id":"REGISTRO_ID"}' | jq
```
**Atteso**: `{ "success": true, "movimenti_sincronizzati": N }`

---

## 5. Test FIR (Formulari)

### 5.1 POST Trasmetti FIR
```bash
curl -s -X POST "https://www.rescuemanager.eu/api/rentri/fir/trasmetti" \
  -H "Content-Type: application/json" \
  -d '{"fir_id":"FIR_ID_ESISTENTE"}' | jq
```
**Atteso**: `{ "success": true, "transazione_id": "..." }`

### 5.2 GET Status Transazione FIR
```bash
curl -s "https://www.rescuemanager.eu/api/rentri/fir/transazione-status?org_id=YOUR_ORG_ID&transazione_id=TRANSAZIONE_ID" | jq
```

### 5.3 GET Result Transazione FIR
```bash
curl -s "https://www.rescuemanager.eu/api/rentri/fir/transazione-result?org_id=YOUR_ORG_ID&transazione_id=TRANSAZIONE_ID" | jq
```

### 5.4 POST Firma FIR
```bash
curl -s -X POST "https://www.rescuemanager.eu/api/rentri/fir/firma" \
  -H "Content-Type: application/json" \
  -d '{"fir_id":"FIR_ID"}' | jq
```

### 5.5 POST Accettazione FIR
```bash
curl -s -X POST "https://www.rescuemanager.eu/api/rentri/fir/accettazione" \
  -H "Content-Type: application/json" \
  -d '{"fir_id":"FIR_ID"}' | jq
```

### 5.6 GET PDF FIR
```bash
curl -s "https://www.rescuemanager.eu/api/rentri/fir/pdf?org_id=YOUR_ORG_ID&numero_fir=NUMERO_FIR"
```

---

## 6. Test Codifiche

### 6.1 GET Lookup Codifiche
```bash
curl -s "https://www.rescuemanager.eu/api/rentri/codifiche?tabella=CodiciEER" | jq '.data | length'
```
**Atteso**: Numero > 0

---

## 7. Checklist Pre-Produzione

### Funzionalità Core
- [ ] Toggle ambiente funzionante in Settings
- [ ] Certificato DEMO attivo e valido
- [ ] Siti operatore recuperati correttamente
- [ ] Autorizzazioni sito recuperate
- [ ] Registri sincronizzati da RENTRI
- [ ] Creazione registro su RENTRI funzionante
- [ ] Creazione movimento locale funzionante
- [ ] Trasmissione movimenti a RENTRI funzionante
- [ ] Polling status transazione funzionante
- [ ] Recupero esito transazione funzionante
- [ ] Sincronizzazione movimenti da RENTRI funzionante

### FIR
- [ ] Trasmissione FIR funzionante
- [ ] Firma FIR funzionante
- [ ] Accettazione FIR funzionante
- [ ] Download PDF FIR funzionante

### Ambiente Dinamico
- [ ] Tutti gli endpoint usano `getActiveCert` (no hardcoded "demo")
- [ ] Tutti gli endpoint usano `getAudience` per JWT audience
- [ ] Tutti gli endpoint usano `getGatewayUrl` per base URL
- [ ] `cert-helper.ts` legge ambiente da `org_settings`
- [ ] Migrazione SQL `rentri_environment` applicata

### UI Settings
- [ ] Toggle TEST/PROD visibile e funzionante
- [ ] Info certificato attivo mostrate
- [ ] Warning per certificato mancante/scaduto
- [ ] Conferma prima di passare a PRODUZIONE
- [ ] Toast di successo/errore dopo cambio

---

## 8. Per Passaggio a PRODUZIONE

Quando tutti i test DEMO sono superati:

1. **Richiedere certificato PRODUZIONE** sul portale RENTRI
2. **Caricare certificato PROD** nell'app (Settings > Certificati)
3. **Configurare gateway VPS PROD**: `rentri.rescuemanager.eu → api.rentri.gov.it`
4. **Aggiungere env var** `RENTRI_GATEWAY_URL_PROD` su Vercel
5. **Cambiare ambiente** da Settings a PRODUZIONE
6. **Verificare** status endpoint PROD
7. **Testare** operazione base (lookup codifiche)
8. **Go-live** graduale

---

**Creato**: 18 Febbraio 2026  
**Status**: Pronto per esecuzione test
