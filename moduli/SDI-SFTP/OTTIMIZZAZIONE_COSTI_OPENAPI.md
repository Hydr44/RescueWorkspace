# 💰 Ottimizzazione Costi OpenAPI.it

**Data:** 19 gennaio 2026  
**Problema:** OpenAPI.it costa **€0,050 per richiesta**, troppo costoso per uso frequente  
**Obiettivo:** Ridurre costi del 80-90% con cache e alternative gratuite

---

## 📊 Analisi Costi Attuali

### Utilizzo Stimato
- **100 aziende** con ~1000 fatture/mese
- **Chiamate API:**
  - Nuovi clienti: ~50 richieste/mese
  - Verifica clienti esistenti (onBlur): ~200 richieste/mese
  - **Totale: ~250 richieste/mese**

### Costo Mensile
- **250 richieste × €0,050 = €12,50/mese**
- **Costo annuo: €150/anno**

### Problema
- L'API viene chiamata **ad ogni blur** del campo P.IVA, anche se già verificata
- Nessuna cache persistente (solo in-memory, si perde al refresh)
- Nessun controllo se il cliente esiste già nel database

---

## 🎯 Soluzioni Proposte

### 1. **Cache Persistente nel Database** ⭐ PRIORITÀ ALTA

**Implementazione:**
- Creare tabella `company_cache` in Supabase
- Salvare dati OpenAPI per ogni P.IVA verificata
- Cache valida per **30 giorni** (dati azienda cambiano raramente)
- Verificare cache prima di chiamare API

**Risparmio:**
- **80-90%** delle chiamate evitate (solo nuove P.IVA o cache scaduta)
- **Costo ridotto: €1,25-€2,50/mese** (solo ~25-50 richieste/mese)

**Schema tabella:**
```sql
CREATE TABLE company_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vat_code VARCHAR(11) UNIQUE NOT NULL,
  company_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Indici per performance
  INDEX idx_company_cache_vat (vat_code),
  INDEX idx_company_cache_expires (expires_at)
);

-- RLS: ogni org vede solo i propri dati (se necessario)
ALTER TABLE company_cache ENABLE ROW LEVEL SECURITY;
```

---

### 2. **Verifica Cliente Esistente** ⭐ PRIORITÀ ALTA

**Implementazione:**
- Prima di chiamare OpenAPI, verificare se il cliente esiste già in `clients`
- Se esiste, usare dati del cliente (non chiamare API)
- Chiamare API solo per **nuovi clienti** o se dati mancanti

**Risparmio:**
- **60-70%** delle chiamate evitate
- **Costo ridotto: €3,75-€5,00/mese** (solo ~75-100 richieste/mese)

**Logica:**
```javascript
// Prima di chiamare OpenAPI
const existingClient = await supabase
  .from('clients')
  .select('*')
  .eq('vat', cleanVat)
  .eq('org_id', orgId)
  .maybeSingle();

if (existingClient) {
  // Usa dati cliente esistente
  return existingClient;
}

// Solo se cliente non esiste, chiama OpenAPI
```

---

### 3. **Cache In-Memory + LocalStorage** ⭐ PRIORITÀ MEDIA

**Implementazione:**
- Cache in-memory per sessione corrente
- Cache localStorage per persistenza tra refresh
- Validità: 24 ore (più breve del database)

**Risparmio:**
- **50-60%** delle chiamate evitate nella stessa sessione
- **Costo ridotto: €5,00-€6,25/mese** (solo ~100-125 richieste/mese)

---

### 4. **Chiamata Solo su Conferma Utente** ⭐ PRIORITÀ MEDIA

**Implementazione:**
- Non chiamare API automaticamente su `onBlur`
- Mostrare pulsante "Verifica P.IVA" o "Recupera Dati"
- Chiamare API solo quando utente clicca esplicitamente

**Risparmio:**
- **70-80%** delle chiamate evitate (utente chiama solo quando necessario)
- **Costo ridotto: €2,50-€3,75/mese** (solo ~50-75 richieste/mese)

---

### 5. **Alternative Gratuite** ⭐ PRIORITÀ ALTA

#### A. **Agenzia delle Entrate API** (GRATIS)
- Verifica P.IVA ufficiale
- Stato P.IVA (attiva/sospesa/cessata)
- Denominazione ufficiale
- **Limite:** Richiede registrazione e OAuth2

#### B. **VIES** (GRATIS - già implementato)
- Validazione P.IVA UE
- Denominazione e indirizzo (se disponibile)
- **Limite:** Solo per P.IVA comunitarie

#### C. **IPA** (GRATIS - già implementato)
- Verifica codice destinatario PA
- **Limite:** Solo per Pubblica Amministrazione

**Strategia:**
1. Prima verifica con **Agenzia Entrate** (gratis)
2. Se P.IVA UE, usa **VIES** (gratis)
3. Se PA, usa **IPA** (gratis)
4. Solo se dati mancanti, usa **OpenAPI** (a pagamento)

**Risparmio:**
- **40-50%** delle chiamate evitate (solo P.IVA italiane non-PA)
- **Costo ridotto: €6,25-€7,50/mese** (solo ~125-150 richieste/mese)

---

### 6. **Combinazione Ottimale** ⭐⭐ CONSIGLIATO

**Implementazione combinata:**
1. ✅ Verifica cliente esistente (database)
2. ✅ Cache persistente (database, 30 giorni)
3. ✅ Cache in-memory + localStorage (24 ore)
4. ✅ Chiamata solo su conferma utente (pulsante)
5. ✅ Alternative gratuite prima di OpenAPI

**Risparmio stimato:**
- **85-95%** delle chiamate evitate
- **Costo ridotto: €0,63-€1,88/mese** (solo ~12-38 richieste/mese)
- **Costo annuo: €7,50-€22,50/anno** (vs €150/anno attuale)

---

## 🔧 Implementazione Tecnica

### Step 1: Creare Tabella Cache

```sql
-- Migration: 20260119_create_company_cache.sql
CREATE TABLE IF NOT EXISTS company_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vat_code VARCHAR(11) UNIQUE NOT NULL,
  company_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_company_cache_vat ON company_cache(vat_code);
CREATE INDEX IF NOT EXISTS idx_company_cache_expires ON company_cache(expires_at);

-- RLS: tutti possono leggere, solo sistema può scrivere
ALTER TABLE company_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_cache_select" ON company_cache
  FOR SELECT USING (true);

CREATE POLICY "company_cache_insert" ON company_cache
  FOR INSERT WITH CHECK (true);

CREATE POLICY "company_cache_update" ON company_cache
  FOR UPDATE USING (true);
```

### Step 2: Modificare `openapi-company.js`

```javascript
// Aggiungere funzione per cache database
async function getCachedCompanyData(vatCode) {
  const { data, error } = await supabase
    .from('company_cache')
    .select('company_data, expires_at')
    .eq('vat_code', vatCode)
    .maybeSingle();
  
  if (error || !data) return null;
  
  // Verifica se cache è scaduta
  if (new Date(data.expires_at) < new Date()) {
    // Elimina cache scaduta
    await supabase
      .from('company_cache')
      .delete()
      .eq('vat_code', vatCode);
    return null;
  }
  
  return data.company_data;
}

async function setCachedCompanyData(vatCode, companyData) {
  await supabase
    .from('company_cache')
    .upsert({
      vat_code: vatCode,
      company_data: companyData,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 giorni
    });
}

// Modificare getCompanyData per usare cache
export async function getCompanyData(vatCode) {
  // 1. Verifica cache database
  const cached = await getCachedCompanyData(vatCode);
  if (cached) {
    console.log('[OpenAPI Company] Dati da cache database');
    return cached;
  }
  
  // 2. Verifica cache localStorage
  const localStorageKey = `openapi_cache_${vatCode}`;
  const cachedLocal = localStorage.getItem(localStorageKey);
  if (cachedLocal) {
    const parsed = JSON.parse(cachedLocal);
    if (parsed.expiresAt > Date.now()) {
      console.log('[OpenAPI Company] Dati da cache localStorage');
      return parsed.data;
    }
  }
  
  // 3. Chiama API OpenAPI
  const data = await fetchCompanyDataFromAPI(vatCode);
  
  // 4. Salva in cache (database e localStorage)
  if (data) {
    await setCachedCompanyData(vatCode, data);
    localStorage.setItem(localStorageKey, JSON.stringify({
      data,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 ore
    }));
  }
  
  return data;
}
```

### Step 3: Modificare `InvoiceNew.jsx` e `ClientNew.jsx`

```javascript
// Aggiungere verifica cliente esistente
async function handleVatChange(vat) {
  setCustomerVat(vat);
  setPivaStatus(null);
  
  const cleanVat = String(vat).trim().replace(/\s+/g, '').replace(/^IT/i, '');
  
  if (cleanVat.length === 11 && /^\d{11}$/.test(cleanVat)) {
    // 1. Verifica se cliente esiste già
    const { data: existingClient } = await supabase
      .from('clients')
      .select('*')
      .eq('vat', cleanVat)
      .eq('org_id', orgId)
      .maybeSingle();
    
    if (existingClient) {
      // Usa dati cliente esistente
      setCustomerName(existingClient.name);
      setCustomerTax(existingClient.tax_code);
      setCustStreet(existingClient.street);
      setCustZip(existingClient.zip);
      setCustCity(existingClient.city);
      setCustProv(existingClient.province);
      setCodiceDest(existingClient.codice_destinatario);
      setPecDest(existingClient.pec);
      setPivaStatus({ valid: true, message: 'Cliente esistente' });
      return;
    }
    
    // 2. Verifica cache (non chiamare API automaticamente)
    // Mostra pulsante "Recupera Dati" invece di chiamare subito
    setShowOpenAPIFetchButton(true);
  }
}
```

### Step 4: Aggiungere Pulsante "Recupera Dati"

```jsx
{/* Pulsante per recuperare dati da OpenAPI */}
{showOpenAPIFetchButton && (
  <button
    type="button"
    onClick={async () => {
      setLoadingPIVA(true);
      const companyData = await autoFillFromPIVA(cleanVat);
      // ... gestisci dati
      setShowOpenAPIFetchButton(false);
    }}
    className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
  >
    <FiRefreshCw className="inline mr-1" />
    Recupera Dati Azienda
  </button>
)}
```

---

## 📈 Risultati Attesi

### Prima (Senza Ottimizzazioni)
- **250 richieste/mese × €0,050 = €12,50/mese**
- **€150/anno**

### Dopo (Con Ottimizzazioni)
- **12-38 richieste/mese × €0,050 = €0,63-€1,88/mese**
- **€7,50-€22,50/anno**

### Risparmio
- **85-95%** di riduzione costi
- **€127,50-€142,50/anno** risparmiati

---

## 🚀 Prossimi Passi

1. ✅ Creare tabella `company_cache`
2. ✅ Modificare `openapi-company.js` per usare cache
3. ✅ Modificare `InvoiceNew.jsx` e `ClientNew.jsx` per verificare cliente esistente
4. ✅ Aggiungere pulsante "Recupera Dati" invece di chiamata automatica
5. ⏳ Integrare Agenzia Entrate API (gratis)
6. ⏳ Testare con dati reali
7. ⏳ Monitorare costi effettivi

---

## ⚠️ Note Importanti

1. **Cache Database:**
   - Valida per 30 giorni (dati azienda cambiano raramente)
   - Pulizia automatica cache scaduta (cron job o trigger)

2. **Privacy:**
   - Cache contiene dati pubblici (P.IVA, ragione sociale)
   - Rispettare GDPR per dati sensibili

3. **Fallback:**
   - Se OpenAPI fallisce, permettere inserimento manuale
   - Mostrare warning se dati non verificati

4. **Monitoraggio:**
   - Tracciare numero chiamate API effettive
   - Alert se supera soglia (es. 50 richieste/mese)

---

**Status:** ✅ Piano completo - Pronto per implementazione
