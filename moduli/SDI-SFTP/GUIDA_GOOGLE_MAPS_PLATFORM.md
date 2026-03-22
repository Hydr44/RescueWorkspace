# 🗺️ Guida Completa: Attivazione e Configurazione Google Maps Platform

**Data:** 19 gennaio 2026  
**Scopo:** Guida passo-passo per attivare e configurare Google Maps Platform per autocomplete indirizzi e geocoding

---

## 📋 Indice

1. [Creazione Account Google Cloud](#1-creazione-account-google-cloud)
2. [Creazione Progetto](#2-creazione-progetto)
3. [Abilitazione API](#3-abilitazione-api)
4. [Creazione API Key](#4-creazione-api-key)
5. [Configurazione Restrizioni](#5-configurazione-restrizioni)
6. [Configurazione Billing](#6-configurazione-billing)
7. [Integrazione nel Progetto](#7-integrazione-nel-progetto)
8. [Test e Verifica](#8-test-e-verifica)

---

## 1. Creazione Account Google Cloud

### Passo 1.1: Accedi a Google Cloud Console

1. Vai su: **https://console.cloud.google.com/**
2. Accedi con il tuo account Google (o creane uno nuovo)
3. Se è la prima volta, accetta i termini di servizio

### Passo 1.2: Verifica Account

- Google Cloud richiede un account Google valido
- Non è necessario un account Gmail, puoi usare qualsiasi email Google
- Se non hai un account, crealo su: **https://accounts.google.com/signup**

---

## 2. Creazione Progetto

### Passo 2.1: Crea Nuovo Progetto

1. Dalla **Google Cloud Console**, clicca sul menu a tendina in alto (accanto a "Google Cloud")
2. Clicca su **"Nuovo progetto"** o **"New Project"**
3. Compila il form:
   - **Nome progetto:** `RescueManager` (o nome a tua scelta)
   - **Organizzazione:** (opzionale, lascia vuoto se non hai organizzazione)
   - **Posizione:** (opzionale, lascia default)
4. Clicca su **"Crea"** o **"Create"**

### Passo 2.2: Seleziona il Progetto

1. Dopo la creazione, seleziona il progetto dal menu a tendina in alto
2. Verifica che il nome del progetto sia visibile nella barra superiore

---

## 3. Abilitazione API

### Passo 3.1: Vai alla Sezione API

1. Nel menu laterale sinistro, vai su **"API e servizi"** → **"Libreria"** (o **"APIs & Services"** → **"Library"**)
2. Oppure vai direttamente a: **https://console.cloud.google.com/apis/library**

### Passo 3.2: Abilita Places API

1. Cerca **"Places API"** nella barra di ricerca
2. Seleziona **"Places API"** (non "Places API (New)")
3. Clicca su **"Abilita"** o **"Enable"**
4. Attendi qualche secondo per l'abilitazione

### Passo 3.3: Abilita Geocoding API

1. Torna alla libreria API
2. Cerca **"Geocoding API"**
3. Seleziona **"Geocoding API"**
4. Clicca su **"Abilita"** o **"Enable"**

### Passo 3.4: Abilita Maps JavaScript API (Opzionale, per mappe interattive)

1. Se vuoi mostrare mappe interattive (non necessario per autocomplete)
2. Cerca **"Maps JavaScript API"**
3. Seleziona e abilita

### ✅ API da Abilitare (Riepilogo)

- ✅ **Places API** (obbligatorio per autocomplete)
- ✅ **Geocoding API** (obbligatorio per geocoding)
- ⚠️ **Maps JavaScript API** (opzionale, solo se vuoi mappe interattive)

---

## 4. Creazione API Key

### Passo 4.1: Vai alle Credenziali

1. Nel menu laterale, vai su **"API e servizi"** → **"Credenziali"** (o **"APIs & Services"** → **"Credentials"**)
2. Oppure vai direttamente a: **https://console.cloud.google.com/apis/credentials**

### Passo 4.2: Crea API Key

1. Clicca su **"+ Crea credenziali"** o **"+ Create credentials"**
2. Seleziona **"Chiave API"** o **"API key"**
3. Viene creata una nuova API key (es: `AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567`)

### Passo 4.3: Copia la Chiave

1. **COPIA SUBITO LA CHIAVE** (non potrai più vederla completa dopo)
2. Salvala in un file temporaneo sicuro
3. Clicca su **"Chiudi"** o **"Close"**

⚠️ **IMPORTANTE:** Non condividere mai la tua API key pubblicamente!

---

## 5. Configurazione Restrizioni

### Passo 5.1: Modifica la Chiave

1. Dalla pagina **"Credenziali"**, clicca sul nome della chiave appena creata
2. Oppure clicca sull'icona matita (✏️) accanto alla chiave

### Passo 5.2: Restrizioni Applicazioni

1. Nella sezione **"Restrizioni applicazioni"** o **"Application restrictions"**, seleziona:
   - **"Indirizzi IP"** o **"IP addresses"** (per server backend)
   - **"Riferimenti pagine web"** o **"HTTP referrers"** (per frontend web)

#### Per Frontend (Desktop App / Website):

**Opzione A: HTTP Referrers (Consigliato per frontend)**

**IMPORTANTE:** Quando Google ti chiede di proteggere la chiave API, inserisci questi riferimenti:

```
Riferimenti pagine web (HTTP referrers):
- https://rescuemanager.eu/*
- https://*.rescuemanager.eu/*
- http://localhost:8080/*
- http://localhost:3000/*
- http://127.0.0.1:8080/*
- http://127.0.0.1:3000/*
- file://* (per Electron app desktop)
```

**Spiegazione:**
- `https://rescuemanager.eu/*` - Dominio di produzione principale
- `https://*.rescuemanager.eu/*` - Tutti i sottodomini (es: api.rescuemanager.eu, sdi-sftp.rescuemanager.eu)
- `http://localhost:8080/*` - Sviluppo locale desktop app
- `http://localhost:3000/*` - Sviluppo locale website
- `file://*` - Per app Electron (desktop app) che caricano file locali

**Opzione B: Nessuna restrizione (Solo per sviluppo)**
- ⚠️ **NON usare in produzione!**
- Usa solo per test locali

#### Per Backend (Server VPS):

**Opzione: Indirizzi IP**
```
Indirizzi IP:
- 217.154.118.37/32 (IP VPS)
- (aggiungi altri IP se necessario)
```

### Passo 5.3: Restrizioni API

1. Nella sezione **"Restrizioni API"** o **"API restrictions"**, seleziona:
   - **"Limita chiave"** o **"Restrict key"**
2. Seleziona solo le API che hai abilitato:
   - ✅ **Places API**
   - ✅ **Geocoding API**
   - ✅ **Maps JavaScript API** (se abilitata)

### Passo 5.4: Salva

1. Clicca su **"Salva"** o **"Save"**
2. Attendi qualche secondo per l'applicazione delle restrizioni

---

## 6. Configurazione Billing

### Passo 6.1: Attiva Billing

1. Vai su **"Fatturazione"** → **"Account di fatturazione"** (o **"Billing"** → **"Billing account"**)
2. Oppure vai direttamente a: **https://console.cloud.google.com/billing**

### Passo 6.2: Collega Carta di Credito

1. Clicca su **"Crea account di fatturazione"** o **"Create billing account"**
2. Compila i dati:
   - **Nome account:** `RescueManager Billing` (o nome a tua scelta)
   - **Paese:** Italia
   - **Valuta:** EUR
3. Inserisci i dati della carta di credito
4. Accetta i termini
5. Clicca su **"Invia e abilita fatturazione"**

### Passo 6.3: Collega Billing al Progetto

1. Torna alla pagina del progetto
2. Vai su **"Fatturazione"** → **"Collega account di fatturazione"**
3. Seleziona l'account di fatturazione appena creato
4. Conferma

### 💰 Credito Gratuito

- Google offre **$200 di credito gratuito al mese**
- Il credito si rinnova automaticamente ogni mese
- Con $200 puoi fare:
  - ~70.000 richieste Places Autocomplete
  - ~40.000 richieste Geocoding
  - ~28.000 richieste Reverse Geocoding

### ⚠️ Limiti e Avvisi

1. **Imposta limiti di budget:**
   - Vai su **"Fatturazione"** → **"Budget e avvisi"**
   - Crea un budget con limite (es: €50/mese)
   - Imposta avvisi email al 50%, 90%, 100%

2. **Monitora l'utilizzo:**
   - Vai su **"API e servizi"** → **"Dashboard"**
   - Controlla le richieste giornaliere

---

## 7. Integrazione nel Progetto

### Passo 7.1: Aggiungi Variabile d'Ambiente

#### Per Desktop App (Electron):

**File:** `desktop-app/greeting-friend-api-main/.env` o `.env.local`

```env
# Google Maps Platform
VITE_GOOGLE_MAPS_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
```

#### Per Website (Next.js):

**File:** `website/.env.local`

```env
# Google Maps Platform
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
```

#### Per VPS (Backend):

**File:** `/root/.env` (sul VPS)

```env
# Google Maps Platform
GOOGLE_MAPS_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
```

### Passo 7.2: Installa Libreria (Opzionale)

#### Per React/Next.js (Frontend):

```bash
npm install @react-google-maps/api
# oppure
npm install use-places-autocomplete
```

#### Per Node.js (Backend):

```bash
npm install @googlemaps/google-maps-services-js
```

### Passo 7.3: Esempio di Utilizzo

#### Frontend - Autocomplete Indirizzi:

```javascript
// src/lib/google-maps-autocomplete.js
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export async function searchAddress(query) {
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}&components=country:it&language=it`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK') {
      return data.predictions.map(prediction => ({
        description: prediction.description,
        place_id: prediction.place_id,
        structured_formatting: prediction.structured_formatting
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Errore Google Maps Autocomplete:', error);
    return [];
  }
}

export async function getPlaceDetails(placeId) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&fields=address_components,formatted_address,geometry&language=it`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK') {
      const place = data.result;
      const address = parseAddressComponents(place.address_components);
      return {
        street: address.street,
        number: address.number,
        zip: address.postal_code,
        city: address.locality,
        province: address.administrative_area_level_2,
        country: address.country
      };
    }
    
    return null;
  } catch (error) {
    console.error('Errore Google Maps Place Details:', error);
    return null;
  }
}

function parseAddressComponents(components) {
  const address = {};
  
  components.forEach(component => {
    const types = component.types;
    
    if (types.includes('street_number')) {
      address.number = component.long_name;
    } else if (types.includes('route')) {
      address.street = component.long_name;
    } else if (types.includes('postal_code')) {
      address.postal_code = component.long_name;
    } else if (types.includes('locality')) {
      address.locality = component.long_name;
    } else if (types.includes('administrative_area_level_2')) {
      address.administrative_area_level_2 = component.short_name;
    } else if (types.includes('country')) {
      address.country = component.short_name;
    }
  });
  
  return address;
}
```

#### Backend - Geocoding:

```javascript
// moduli/GOOGLE-MAPS/geocoding-server.js
const { Client } = require('@googlemaps/google-maps-services-js');

const client = new Client({});

async function geocodeAddress(address) {
  try {
    const response = await client.geocode({
      params: {
        address: address,
        key: process.env.GOOGLE_MAPS_API_KEY,
        region: 'it',
        language: 'it'
      }
    });
    
    if (response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        formatted_address: result.formatted_address,
        location: result.geometry.location,
        address_components: result.address_components
      };
    }
    
    return null;
  } catch (error) {
    console.error('Errore geocoding:', error);
    return null;
  }
}
```

---

## 8. Test e Verifica

### Passo 8.1: Test API Key

#### Test Autocomplete (cURL):

```bash
curl "https://maps.googleapis.com/maps/api/place/autocomplete/json?input=via%20roma&key=YOUR_API_KEY&components=country:it"
```

#### Test Geocoding (cURL):

```bash
curl "https://maps.googleapis.com/maps/api/geocode/json?address=via%20roma%20roma&key=YOUR_API_KEY&region=it"
```

### Passo 8.2: Verifica Utilizzo

1. Vai su **"API e servizi"** → **"Dashboard"**
2. Controlla le richieste per ogni API
3. Verifica che non ci siano errori

### Passo 8.3: Monitora Costi

1. Vai su **"Fatturazione"** → **"Riepilogo utilizzo"**
2. Controlla i costi giornalieri
3. Verifica che siano entro il credito gratuito di $200

---

## 🔒 Sicurezza

### Best Practices

1. **Non committare la chiave API nel repository:**
   - Aggiungi `.env` a `.gitignore`
   - Usa variabili d'ambiente

2. **Usa restrizioni:**
   - Restringi per IP (backend)
   - Restringi per HTTP referrers (frontend)
   - Limita alle API necessarie

3. **Ruota le chiavi periodicamente:**
   - Crea nuove chiavi ogni 6-12 mesi
   - Disabilita le vecchie chiavi

4. **Monitora l'utilizzo:**
   - Imposta avvisi per uso anomalo
   - Controlla i log regolarmente

---

## 📊 Costi Stimati

### Con Credito Gratuito ($200/mese):

| API | Richieste/mese | Costo |
|-----|----------------|-------|
| Places Autocomplete | ~70.000 | $0 (entro credito) |
| Geocoding | ~40.000 | $0 (entro credito) |
| Reverse Geocoding | ~28.000 | $0 (entro credito) |

### Oltre il Credito:

| API | Costo per 1000 richieste | Costo mensile (esempio) |
|-----|--------------------------|-------------------------|
| Places Autocomplete | $2.83 | $0.28 per 100 richieste |
| Geocoding | $5.00 | $0.50 per 100 richieste |

**Stima per 100 aziende, ~1000 fatture/mese:**
- Autocomplete: ~1000 richieste/mese = **$2.83/mese**
- Geocoding: ~500 richieste/mese = **$2.50/mese**
- **Totale: ~$5.33/mese** (entro credito gratuito)

---

## 🐛 Troubleshooting

### Errore: "This API project is not authorized to use this API"

**Soluzione:**
1. Verifica che l'API sia abilitata nel progetto
2. Vai su **"API e servizi"** → **"Libreria"**
3. Cerca l'API e verifica che sia abilitata

### Errore: "API key not valid"

**Soluzione:**
1. Verifica che la chiave sia corretta
2. Controlla le restrizioni (potrebbero essere troppo restrittive)
3. Verifica che il billing sia attivo

### Errore: "Billing account required"

**Soluzione:**
1. Vai su **"Fatturazione"** → **"Account di fatturazione"**
2. Collega un account di fatturazione al progetto
3. Inserisci una carta di credito

### Errore: "Quota exceeded"

**Soluzione:**
1. Verifica l'utilizzo su **"API e servizi"** → **"Dashboard"**
2. Controlla se hai superato il credito gratuito
3. Considera di aumentare il budget o ottimizzare le richieste

---

## 📚 Risorse Utili

- **Documentazione Google Maps Platform:** https://developers.google.com/maps/documentation
- **Places API:** https://developers.google.com/maps/documentation/places/web-service/autocomplete
- **Geocoding API:** https://developers.google.com/maps/documentation/geocoding
- **Console Google Cloud:** https://console.cloud.google.com/
- **Pricing:** https://mapsplatform.google.com/pricing/

---

## ✅ Checklist Finale

Prima di considerare completata la configurazione:

- [ ] Account Google Cloud creato
- [ ] Progetto creato
- [ ] Places API abilitata
- [ ] Geocoding API abilitata
- [ ] API Key creata
- [ ] Restrizioni configurate
- [ ] Billing attivato
- [ ] Variabili d'ambiente configurate
- [ ] Test eseguiti con successo
- [ ] Monitoraggio attivo

---

**Status:** ✅ Guida completa - Pronta per implementazione
