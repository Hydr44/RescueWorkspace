# 📋 API da Acquistare - Validazione Dati Fatturazione Elettronica

**Data:** 19 gennaio 2026  
**Scopo:** Elenco completo delle API commerciali per validazione P.IVA, CF, indirizzi, codice destinatario, ragione sociale

---

## 🎯 API Consigliate (Priorità)

### 1. **Google Maps Platform** ⭐ CONSIGLIATO

**Per cosa serve:**
- Autocompletamento indirizzi (Places Autocomplete)
- Geocoding (conversione indirizzo → coordinate)
- Reverse geocoding (coordinate → indirizzo)
- Validazione indirizzi
- Verifica CAP/Città/Provincia

**Costi:**
- **Places Autocomplete (per sessione):** $2.83 per 1000 sessioni
- **Geocoding:** $5.00 per 1000 richieste
- **Reverse Geocoding:** $5.00 per 1000 richieste
- **$200 di credito gratuito al mese** (circa 70.000 richieste autocomplete o 40.000 geocoding)

**Stima mensile (100 aziende, ~1000 fatture/mese):**
- Autocomplete indirizzi: ~1000 sessioni/mese = **$2.83/mese**
- Geocoding: ~500 richieste/mese = **$2.50/mese**
- **Totale: ~$5.33/mese** (entro il credito gratuito di $200)

**Endpoint:**
- Places Autocomplete: `https://maps.googleapis.com/maps/api/place/autocomplete/json`
- Geocoding: `https://maps.googleapis.com/maps/api/geocode/json`

**Documentazione:** https://developers.google.com/maps/documentation/places/web-service/autocomplete

---

### 2. **OpenAPI.it - Company IT** ⭐ CONSIGLIATO

**Per cosa serve:**
- ✅ Verifica P.IVA e stato (attiva/sospesa/cessata) presso Camera di Commercio e Agenzia delle Entrate
- ✅ Recupero ragione sociale ufficiale (Nome, Forma Legale)
- ✅ Recupero indirizzo sede legale completo
- ✅ Recupero codice destinatario SDI (Codice SDI)
- ✅ Recupero codice fiscale
- ✅ Recupero PEC (Domicilio Digitale)
- ✅ Verifica congruenza P.IVA/CF con ragione sociale
- ✅ Dati aggiuntivi: ATECO, REA, stato attività, dati finanziari

**Caratteristiche uniche:**
- 🚀 **Unico servizio in tempo reale** per aziende appena costituite o cessate
- 📊 **Oltre 1.300 informazioni** per ogni azienda
- 🔄 **Dati sempre aggiornati** da fonti ufficiali

**Costi:**
- **Company IT Start:** Prezzo da verificare nel dashboard (circa €0,015-€0,03 + IVA per richiesta)
- **Prime richieste/mese GRATIS** (da verificare)
- Piani con abbonamenti disponibili per volumi maggiori

**Stima mensile (100 aziende, ~1000 fatture/mese):**
- Verifica P.IVA clienti nuovi: ~50 richieste/mese
- Verifica P.IVA clienti esistenti (aggiornamento): ~200 richieste/mese
- **Totale: ~250 richieste/mese**
- **Costo stimato: ~€3,75-€7,50/mese** (dipende dal piano)

**Endpoint:**
```
GET https://api.openapi.it/company/it/{vatCode_taxCode_or_id}
# Oppure endpoint specifici per Start/Advanced
```

**Risposta esempio (Company IT Start):**
```json
{
  "vat": "02166430856",
  "taxCode": "SCZMNL05L21D960T",
  "denomination": "Emmanuel Sal. Scozzarini",
  "legalForm": "Ditta Individuale",
  "address": {
    "street": "Via...",
    "city": "Roma",
    "province": "RM",
    "zip": "00100"
  },
  "sdiCode": "T04ZHR3",
  "pec": "email@pec.it",
  "status": "active",
  "ateco": "123456",
  "rea": "RM-123456"
}
```

**Documentazione:** 
- Dashboard: https://openapi.it/dashboard (sezione Company)
- Libreria API: https://openapi.it/ (cerca "Company")

---

### 3. **OpenAPI.it - Codice Destinatario SDI** ⚠️ OPZIONALE

**Nota:** Il codice destinatario SDI è **incluso in Company IT**, quindi questa API separata potrebbe non essere necessaria se usi Company IT.

**Per cosa serve (se non usi Company IT):**
- Recupero codice destinatario SDI per qualsiasi P.IVA
- Verifica validità codice destinatario
- Aggiornamento automatico se cambia

**Costi:**
- **€0,019-€0,03 + IVA per richiesta** (circa €0,022-€0,036 totali)
- Prime richieste gratuite (da verificare)

**Stima mensile (se usato separatamente):**
- Recupero codice destinatario: ~300 richieste/mese
- **Costo: ~€6,60-€10,80/mese**

**Endpoint:**
```
GET https://api.openapi.it/codice-destinatario/{vatCode}
```

**Raccomandazione:** 
- ✅ **Usa Company IT** che include già il codice SDI
- ❌ **Non serve API separata** per codice destinatario se usi Company IT

**Documentazione:** https://openapi.it/ (cerca "Codice Destinatario" se necessario)

---

### 4. **Agenzia delle Entrate - API Management** ⭐ GRATIS (con registrazione)

**Per cosa serve:**
- Verifica esistenza e validità codice fiscale
- Verifica esistenza e validità partita IVA
- Corrispondenza CF/P.IVA con dati anagrafici
- Stato P.IVA (attiva/sospesa/cessata)
- Denominazione ufficiale

**Costi:**
- **GRATIS** (servizio pubblico)
- Richiede registrazione e adesione condizioni d'uso
- Autenticazione OAuth2 richiesta

**Endpoint:**
- Verifica CF: `POST https://api.agenziaentrate.gov.it/verifica-cf`
- Verifica P.IVA: `POST https://api.agenziaentrate.gov.it/verifica-piva`

**Documentazione:** 
- https://www.agenziaentrate.gov.it/portale/web/guest/servizi/api-management
- https://www.assolombarda.it/servizi/fisco/informazioni/verifica-della-validita-della-partita-iva-e-codice-fiscale-tramite-la-piattaforma-api-dell2019agenzia-delle-entrate

**Nota:** Servizio ufficiale, ma richiede registrazione e potrebbe avere limiti di rate limiting.

---

### 5. **VIES (VAT Information Exchange System)** ⭐ GRATIS

**Per cosa serve:**
- Validazione P.IVA comunitaria (UE)
- Verifica esistenza P.IVA in altri paesi UE
- Recupero denominazione e indirizzo (se disponibile)

**Costi:**
- **GRATIS** (servizio UE)
- Nessuna registrazione richiesta
- Limiti di rate limiting (non documentati)

**Endpoint:**
```
POST https://ec.europa.eu/taxation_customs/vies/services/checkVatService
```

**Formato:** SOAP (già implementato nel codice)

**Documentazione:** https://ec.europa.eu/taxation_customs/vies/

**Nota:** Già implementato in `website/src/lib/sdi-validation.ts`

---

### 6. **IPA (Indice Pubblica Amministrazione)** ⭐ GRATIS

**Per cosa serve:**
- Verifica codice destinatario PA (6 caratteri)
- Recupero denominazione amministrazione pubblica
- Verifica validità codice IPA

**Costi:**
- **GRATIS** (servizio pubblico)
- Nessuna registrazione richiesta

**Endpoint:**
```
GET https://www.indicepa.gov.it/ipa-dati/dati/amm.json
```

**Documentazione:** https://www.indicepa.gov.it/

**Nota:** Già implementato in `website/src/lib/sdi-validation.ts`

---

### 7. **ValidateIT** (Opzionale)

**Per cosa serve:**
- Validazione formale CF/P.IVA (check digit)
- Estrazione dati base (matricola, sede)
- Validazione IBAN

**Costi:**
- **Gratis** (versione open-source)
- **A pagamento** per servizi avanzati (prezzi da verificare)

**Endpoint:**
- API disponibile su RapidAPI o self-hosted

**Documentazione:** https://github.com/validateit/validateit (se open-source)

**Nota:** Utile per validazione formale lato client, ma non fornisce ragione sociale o indirizzo completo.

---

## 📊 Confronto Costi Mensili Stimati

| API | Funzionalità | Costo Mensile (100 aziende) | Priorità |
|-----|-------------|------------------------------|----------|
| **Google Maps Platform** | Autocomplete indirizzi, geocoding | **€0/mese** (entro credito $200) | ⭐⭐⭐ |
| **OpenAPI Company Start** | P.IVA, ragione sociale, indirizzo, CF | **€3,96/mese** | ⭐⭐⭐ |
| **OpenAPI Codice Destinatario** | Codice destinatario SDI | **€6,60-€10,80/mese** | ⭐⭐⭐ |
| **Agenzia Entrate API** | Verifica CF/P.IVA ufficiale | **GRATIS** | ⭐⭐ |
| **VIES** | Validazione P.IVA UE | **GRATIS** | ⭐⭐ |
| **IPA** | Verifica codice destinatario PA | **GRATIS** | ⭐⭐ |
| **ValidateIT** | Validazione formale CF/P.IVA | **GRATIS** (open-source) | ⭐ |

**Totale stimato: ~€10-€15/mese** per 100 aziende

---

## 🎯 Piano di Implementazione Consigliato

### Fase 1: API Gratuite (Immediate)
1. ✅ **VIES** - Già implementato
2. ✅ **IPA** - Già implementato
3. ⏳ **Agenzia Entrate API** - Da registrare e implementare
4. ⏳ **ValidateIT** - Da valutare per validazione formale

### Fase 2: API Commerciali (Priorità Alta)
1. ⏳ **Google Maps Platform** - Per autocomplete indirizzi
2. ⏳ **OpenAPI Company Start** - Per verifica P.IVA e ragione sociale
3. ⏳ **OpenAPI Codice Destinatario** - Per recupero codice SDI

---

## 🔧 Integrazione nel Sistema

### 1. Google Maps Platform - Autocomplete Indirizzi

**Dove integrare:**
- `desktop-app/greeting-friend-api-main/src/pages/InvoiceNew.jsx` (campo indirizzo cliente)
- `desktop-app/greeting-friend-api-main/src/pages/ClientNew.jsx` (campo indirizzo cliente)

**Funzionalità:**
- Autocompletamento durante digitazione
- Validazione automatica CAP/Città/Provincia
- Geocoding per coordinate

---

### 2. OpenAPI Company Start - Verifica P.IVA

**Dove integrare:**
- `desktop-app/greeting-friend-api-main/src/pages/InvoiceNew.jsx` (campo P.IVA cliente)
- `desktop-app/greeting-friend-api-main/src/pages/ClientNew.jsx` (campo P.IVA cliente)

**Funzionalità:**
- Verifica P.IVA al blur del campo
- Auto-compilazione ragione sociale
- Auto-compilazione indirizzo sede legale
- Auto-compilazione codice destinatario SDI
- Verifica stato P.IVA (attiva/sospesa/cessata)

---

### 3. OpenAPI Codice Destinatario - Recupero SDI Code

**Dove integrare:**
- `desktop-app/greeting-friend-api-main/src/pages/InvoiceNew.jsx` (campo codice destinatario)
- `desktop-app/greeting-friend-api-main/src/pages/ClientNew.jsx` (campo codice destinatario)

**Funzionalità:**
- Auto-compilazione codice destinatario da P.IVA
- Verifica validità codice destinatario
- Aggiornamento automatico se cambia

---

### 4. Agenzia Entrate API - Verifica Ufficiale

**Dove integrare:**
- `website/src/lib/sdi-validation.ts` (aggiungere endpoint)
- Validazione pre-invio fattura SDI

**Funzionalità:**
- Verifica ufficiale CF/P.IVA
- Corrispondenza con dati anagrafici
- Validazione pre-invio per evitare scarti

---

## 📝 Note Importanti

### Limitazioni e Considerazioni

1. **Rate Limiting:**
   - Google Maps: 200 richieste/secondo (con credito)
   - OpenAPI: Da verificare (probabilmente ~1000/minuto)
   - Agenzia Entrate: Da verificare (probabilmente limitato)

2. **Caching:**
   - Implementare cache per P.IVA già verificate (evitare richieste duplicate)
   - Cache per indirizzi già geocodificati
   - Cache per codici destinatario (validità ~1 mese)

3. **Fallback:**
   - Se API commerciale fallisce, usare validazione formale locale
   - Se API gratuita fallisce, permettere inserimento manuale con warning

4. **Privacy:**
   - Non salvare dati sensibili in cache senza consenso
   - Rispettare GDPR per dati anagrafici

---

## 🚀 Prossimi Passi

1. **Registrazione:**
   - [ ] Google Maps Platform (creare account, abilitare API)
   - [ ] OpenAPI.it (creare account, acquistare crediti)
   - [ ] Agenzia Entrate (registrazione API Management)

2. **Implementazione:**
   - [ ] Integrare Google Maps Autocomplete
   - [ ] Integrare OpenAPI Company Start
   - [ ] Integrare OpenAPI Codice Destinatario
   - [ ] Integrare Agenzia Entrate API

3. **Testing:**
   - [ ] Test con dati reali
   - [ ] Verifica rate limiting
   - [ ] Verifica costi effettivi

---

## 📞 Contatti e Link Utili

- **Google Maps Platform:** https://console.cloud.google.com/
- **OpenAPI.it:** https://openapi.it/
- **Agenzia Entrate API:** https://www.agenziaentrate.gov.it/portale/web/guest/servizi/api-management
- **VIES:** https://ec.europa.eu/taxation_customs/vies/
- **IPA:** https://www.indicepa.gov.it/

---

**Status:** ✅ Documento completo - Pronto per implementazione
