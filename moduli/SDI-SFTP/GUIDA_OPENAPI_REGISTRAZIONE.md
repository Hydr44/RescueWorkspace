# 🔑 Guida: Registrazione e Configurazione OpenAPI.it

**Data:** 19 gennaio 2026  
**Scopo:** Guida passo-passo per registrarsi su OpenAPI.it e ottenere la chiave API

---

## 📋 Indice

1. [Registrazione Account](#1-registrazione-account)
2. [Verifica Email](#2-verifica-email)
3. [Creazione API Key](#3-creazione-api-key)
4. [Configurazione Billing](#4-configurazione-billing)
5. [Test API Key](#5-test-api-key)
6. [Integrazione nel Progetto](#6-integrazione-nel-progetto)

---

## 1. Registrazione Account

### Passo 1.1: Vai al Sito OpenAPI.it

1. Apri il browser e vai su: **https://openapi.it/**
2. Clicca su **"Registrati"** o **"Sign Up"** (in alto a destra)
3. Oppure vai direttamente a: **https://openapi.it/register**

### Passo 1.2: Compila il Form di Registrazione

Compila i campi richiesti:

- **Email:** La tua email aziendale
- **Password:** Scegli una password sicura
- **Nome:** Il tuo nome
- **Cognome:** Il tuo cognome
- **Azienda:** Nome della tua azienda (opzionale ma consigliato)
- **Telefono:** Numero di telefono (opzionale)

### Passo 1.3: Accetta Termini e Condizioni

- ✅ Leggi i termini di servizio
- ✅ Accetta i termini e condizioni
- ✅ Accetta la privacy policy (GDPR)

### Passo 1.4: Completa la Registrazione

1. Clicca su **"Registrati"** o **"Crea Account"**
2. Controlla la tua email per il link di verifica

---

## 2. Verifica Email

### Passo 2.1: Controlla la Tua Email

1. Apri la casella email che hai usato per la registrazione
2. Cerca un'email da **OpenAPI.it** o **noreply@openapi.it**
3. Se non la trovi, controlla la cartella **Spam**

### Passo 2.2: Clicca sul Link di Verifica

1. Apri l'email
2. Clicca sul link di verifica (es: "Verifica il tuo account")
3. Verrai reindirizzato al sito OpenAPI.it con account verificato

**Nota:** Se il link non funziona, copia e incolla l'URL nel browser.

---

## 3. Creazione API Key

### Passo 3.1: Accedi al Dashboard

1. Vai su: **https://openapi.it/**
2. Clicca su **"Accedi"** o **"Login"**
3. Inserisci email e password
4. Clicca su **"Accedi"**

### Passo 3.2: Vai alla Sezione API Keys

1. Dopo il login, vai al **Dashboard** o **Area Personale**
2. Cerca la sezione **"API Keys"** o **"Chiavi API"**
3. Oppure vai direttamente a: **https://openapi.it/dashboard/api-keys**

### Passo 3.3: Crea Nuova API Key

1. Clicca su **"Crea nuova API Key"** o **"Generate API Key"**
2. Compila il form:
   - **Nome:** `RescueManager` (o nome a tua scelta)
   - **Descrizione:** `API per validazione P.IVA, CF e Codice Destinatario SDI`
   - **Ambiente:** `Produzione` (o `Test` se disponibile)
3. Clicca su **"Crea"** o **"Generate"**

### Passo 3.4: Copia la Chiave API

1. **⚠️ IMPORTANTE: COPIA SUBITO LA CHIAVE!**
2. La chiave sarà mostrata una sola volta (es: `op_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
3. Salvala in un file temporaneo sicuro
4. Clicca su **"Chiudi"** o **"Close"**

**Formato tipico:** `op_` seguito da una stringa alfanumerica (es: `op_abc123def456ghi789jkl012mno345pqr678`)

---

## 4. Configurazione Billing

### Passo 4.1: Vai alla Sezione Billing

1. Nel dashboard, vai su **"Billing"** o **"Fatturazione"**
2. Oppure vai direttamente a: **https://openapi.it/dashboard/billing**

### Passo 4.2: Aggiungi Metodo di Pagamento

1. Clicca su **"Aggiungi carta"** o **"Add Payment Method"**
2. Inserisci i dati della carta di credito:
   - Numero carta
   - Data di scadenza
   - CVV
   - Nome intestatario
3. Clicca su **"Salva"** o **"Save"**

### Passo 4.3: Verifica Piano

**Piano Consigliato:**

- **Piano Base:** Prime 30 richieste/mese GRATIS
- **Pay-as-you-go:** €0,015 + IVA per richiesta dopo le prime 30

**Stima Costi (100 aziende, ~1000 fatture/mese):**
- Verifica P.IVA clienti nuovi: ~50 richieste/mese
- Verifica P.IVA clienti esistenti: ~200 richieste/mese
- **Totale: ~250 richieste/mese**
- **Costo: (250 - 30) × €0,018 = €3,96/mese**

### Passo 4.4: Imposta Limite di Budget (Opzionale)

1. Vai su **"Limiti"** o **"Limits"**
2. Imposta un limite mensile (es: €50/mese)
3. Attiva notifiche email al 80% e 100% del limite

---

## 5. Test API Key

### Passo 5.1: Test Company Start API

**Endpoint:** `GET https://api.openapi.it/IT-start/{vatCode}`

**Test con cURL:**

```bash
# Sostituisci YOUR_API_KEY con la tua chiave
# Sostituisci 02166430856 con una P.IVA valida
curl -X GET "https://api.openapi.it/IT-start/02166430856" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

**Risposta attesa:**
```json
{
  "vat": "02166430856",
  "taxCode": "SCZMNL05L21D960T",
  "denomination": "Emmanuel Sal. Scozzarini",
  "address": {
    "street": "Via...",
    "city": "Roma",
    "province": "RM",
    "zip": "00100"
  },
  "sdiCode": "T04ZHR3",
  "status": "active"
}
```

### Passo 5.2: Test Codice Destinatario API

**Endpoint:** `GET https://api.openapi.it/codice-destinatario/{vatCode}`

**Test con cURL:**

```bash
curl -X GET "https://api.openapi.it/codice-destinatario/02166430856" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

**Risposta attesa:**
```json
{
  "vat": "02166430856",
  "sdiCode": "T04ZHR3",
  "valid": true,
  "active": true
}
```

### Passo 5.3: Verifica Utilizzo

1. Vai su **"Dashboard"** → **"Utilizzo"** o **"Usage"**
2. Controlla le richieste effettuate
3. Verifica che non ci siano errori

---

## 6. Integrazione nel Progetto

### Passo 6.1: Aggiungi Variabile d'Ambiente

**File:** `desktop-app/greeting-friend-api-main/env.example`

```env
# === OPENAPI.IT ===
# API Key per OpenAPI.it (Company Start e Codice Destinatario)
VITE_OPENAPI_API_KEY=op_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ IMPORTANTE:** Aggiungi anche al tuo file `.env` locale:
```bash
cd desktop-app/greeting-friend-api-main
echo "VITE_OPENAPI_API_KEY=op_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" >> .env
```

### Passo 6.2: Crea File Libreria OpenAPI

**File:** `desktop-app/greeting-friend-api-main/src/lib/openapi.js`

```javascript
// src/lib/openapi.js
// OpenAPI.it - Company Start e Codice Destinatario SDI

const OPENAPI_API_KEY = import.meta.env.VITE_OPENAPI_API_KEY;
const OPENAPI_BASE_URL = 'https://api.openapi.it';

/**
 * Recupera dati azienda da P.IVA usando Company Start
 * @param {string} vatCode - P.IVA (con o senza prefisso IT)
 * @returns {Promise<Object|null>} Dati azienda o null
 */
export async function getCompanyData(vatCode) {
  if (!vatCode) return null;
  
  if (!OPENAPI_API_KEY) {
    console.warn('[OpenAPI] API key non configurata');
    return null;
  }

  // Normalizza P.IVA (rimuovi spazi e prefisso IT)
  const cleanVat = String(vatCode).trim().replace(/\s+/g, '').replace(/^IT/i, '');

  try {
    const url = `${OPENAPI_BASE_URL}/IT-start/${cleanVat}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        // P.IVA non trovata
        return null;
      }
      console.error('[OpenAPI] Errore HTTP:', response.status);
      return null;
    }

    const data = await response.json();
    
    return {
      vat: data.vat || cleanVat,
      taxCode: data.taxCode || null,
      denomination: data.denomination || null,
      address: data.address || null,
      sdiCode: data.sdiCode || null,
      status: data.status || null,
      // Dati formattati per il form
      name: data.denomination || null,
      street: data.address?.street || null,
      city: data.address?.city || null,
      province: data.address?.province || null,
      zip: data.address?.zip || data.address?.postalCode || null,
      codiceDestinatario: data.sdiCode || null
    };
  } catch (error) {
    console.error('[OpenAPI] Errore fetch:', error);
    return null;
  }
}

/**
 * Recupera codice destinatario SDI da P.IVA
 * @param {string} vatCode - P.IVA (con o senza prefisso IT)
 * @returns {Promise<string|null>} Codice destinatario o null
 */
export async function getCodiceDestinatario(vatCode) {
  if (!vatCode) return null;
  
  if (!OPENAPI_API_KEY) {
    console.warn('[OpenAPI] API key non configurata');
    return null;
  }

  // Normalizza P.IVA
  const cleanVat = String(vatCode).trim().replace(/\s+/g, '').replace(/^IT/i, '');

  try {
    const url = `${OPENAPI_BASE_URL}/codice-destinatario/${cleanVat}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      console.error('[OpenAPI] Errore HTTP:', response.status);
      return null;
    }

    const data = await response.json();
    
    return data.sdiCode || null;
  } catch (error) {
    console.error('[OpenAPI] Errore fetch:', error);
    return null;
  }
}

/**
 * Verifica validità P.IVA e stato
 * @param {string} vatCode - P.IVA (con o senza prefisso IT)
 * @returns {Promise<Object>} { valid: boolean, status: string, error?: string }
 */
export async function validatePIVA(vatCode) {
  if (!vatCode) {
    return { valid: false, error: 'P.IVA non fornita' };
  }

  const companyData = await getCompanyData(vatCode);
  
  if (!companyData) {
    return { valid: false, error: 'P.IVA non trovata' };
  }

  return {
    valid: true,
    status: companyData.status || 'unknown',
    denomination: companyData.denomination || null
  };
}
```

### Passo 6.3: Integrazione in InvoiceNew.jsx

**Esempio di utilizzo:**

```javascript
import { getCompanyData, getCodiceDestinatario } from "@/lib/openapi";

// Quando l'utente inserisce una P.IVA
async function handleVatChange(vat) {
  setCustVat(vat);
  
  if (vat && vat.length >= 11) {
    // Recupera dati azienda
    const companyData = await getCompanyData(vat);
    
    if (companyData) {
      // Auto-compila ragione sociale
      if (companyData.denomination) {
        setCustName(companyData.denomination);
      }
      
      // Auto-compila indirizzo
      if (companyData.address) {
        setCustStreet(companyData.address.street || '');
        setCustZip(companyData.address.zip || '');
        setCustCity(companyData.address.city || '');
        setCustProv(companyData.address.province || '');
      }
      
      // Auto-compila codice destinatario
      if (companyData.sdiCode) {
        setCustCodiceDestinatario(companyData.sdiCode);
      }
    }
  }
}
```

---

## 📊 Costi e Limiti

### Piano Gratuito

- ✅ **Prime 30 richieste/mese GRATIS**
- ✅ Nessun costo di setup
- ✅ Nessun costo mensile fisso

### Pay-as-you-go

- **Company Start:** €0,015 + IVA per richiesta (dopo le prime 30)
- **Codice Destinatario:** €0,019-€0,03 + IVA per richiesta (dopo le prime 30)

### Stima Costi Mensili

| Utilizzo | Richieste/mese | Costo |
|----------|----------------|-------|
| Basso (50 aziende) | ~125 | €1,71/mese |
| Medio (100 aziende) | ~250 | €3,96/mese |
| Alto (200 aziende) | ~500 | €8,46/mese |

---

## 🔒 Sicurezza

### Best Practices

1. **Non committare la chiave API:**
   - Aggiungi `.env` a `.gitignore`
   - Usa variabili d'ambiente

2. **Usa HTTPS:**
   - Tutte le chiamate API sono su HTTPS
   - Non esporre la chiave nel frontend (se possibile, usa backend proxy)

3. **Monitora l'utilizzo:**
   - Controlla regolarmente il dashboard
   - Imposta limiti di budget

4. **Cache risultati:**
   - Salva in database i dati già recuperati
   - Evita richieste duplicate per stessa P.IVA

---

## 🐛 Troubleshooting

### Errore: "Unauthorized" (401)

**Causa:** API key non valida o scaduta

**Soluzione:**
1. Verifica che la chiave sia corretta
2. Controlla che non ci siano spazi extra
3. Verifica che la chiave non sia scaduta nel dashboard

### Errore: "Not Found" (404)

**Causa:** P.IVA non trovata nel database OpenAPI

**Soluzione:**
1. Verifica che la P.IVA sia corretta
2. Prova con un'altra P.IVA nota
3. Contatta supporto OpenAPI se il problema persiste

### Errore: "Quota exceeded" (429)

**Causa:** Hai superato il limite di richieste

**Soluzione:**
1. Controlla l'utilizzo nel dashboard
2. Implementa cache per evitare richieste duplicate
3. Considera di aumentare il piano

---

## 📚 Risorse Utili

- **Sito OpenAPI.it:** https://openapi.it/
- **Documentazione API:** https://openapi.it/docs
- **Dashboard:** https://openapi.it/dashboard
- **Supporto:** supporto@openapi.it (o tramite dashboard)

---

## ✅ Checklist Finale

Prima di considerare completata la configurazione:

- [ ] Account OpenAPI.it creato
- [ ] Email verificata
- [ ] API Key creata e copiata
- [ ] Billing configurato
- [ ] Test API eseguiti con successo
- [ ] Variabile d'ambiente aggiunta
- [ ] File libreria creato
- [ ] Integrazione nel codice completata

---

**Status:** ✅ Guida completa - Pronta per registrazione
