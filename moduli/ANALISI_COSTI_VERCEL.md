# 🔴 Analisi Costi Vercel - 10+ Milioni Edge Request

**Data**: 2026-01-23  
**Problema**: Oltre 10 milioni di edge request su Vercel + 50€ per memoria provvisoria  
**Status**: 🔴 CRITICO - Richiede azione immediata

---

## 📊 SITUAZIONE ATTUALE

### Costi Vercel
- **Edge Requests**: > 10.000.000 (assurdo!)
- **Memoria Provvisoria**: 50€ addebitati
- **Note**: La maggior parte delle operazioni dovrebbe passare da VPS, non Vercel

---

## 🔍 CAUSE IDENTIFICATE

### 1. 🔴 Polling Client-Side Troppo Frequenti

#### **remote-control.ts** - Polling Continuo
```typescript
// Heartbeat ogni 30 secondi
POLLING_INTERVAL = 30000; // 30 secondi

// Maintenance check ogni 60 secondi
setInterval(checkMaintenance, 60000);

// Version check ogni 5 minuti
VERSION_CHECK_INTERVAL = 300000; // 5 minuti
```

**Calcolo richieste**:
- Heartbeat: 1 utente × 2 richieste/minuto × 60 minuti × 24 ore = **2.880 richieste/giorno per utente**
- Maintenance: 1 utente × 1 richiesta/minuto × 60 × 24 = **1.440 richieste/giorno per utente**
- Version: 1 utente × 0.2 richieste/minuto × 60 × 24 = **288 richieste/giorno per utente**

**Totale per utente**: ~4.600 richieste/giorno  
**Con 100 utenti attivi**: ~460.000 richieste/giorno = **13.8 milioni/mese** ❌

#### **useFirSync.js** - Polling FIR ogni 2 minuti
```javascript
// Sync ogni 2 minuti
setInterval(syncStati, 2 * 60 * 1000);
```

**Calcolo**:
- 1 utente × 0.5 richieste/minuto × 60 × 24 = **720 richieste/giorno per utente**
- Con 50 utenti che usano RENTRI: **36.000 richieste/giorno** = **1.08 milioni/mese** ❌

---

### 2. 🔴 Route API su Vercel che Dovrebbero Essere su VPS

#### Route che Generano Molte Richieste

**RENTRI** (dovrebbero essere su VPS):
- `/api/rentri/fir/sync-stati` - Chiamato ogni 2 minuti da ogni utente
- `/api/rentri/registri/*` - Chiamate frequenti
- `/api/rentri/movimenti/*` - Chiamate frequenti
- `/api/rentri/fir/*` - Chiamate frequenti

**Remote Control** (dovrebbero essere su VPS):
- `/api/monitoring/heartbeat` - Chiamato ogni 30 secondi
- `/api/maintenance/status` - Chiamato ogni 60 secondi
- `/api/version/check` - Chiamato ogni 5 minuti

**Altri**:
- `/api/auth/*` - Chiamate frequenti (ma potrebbero rimanere su Vercel)
- `/api/rentri/*` - Tutte le route RENTRI dovrebbero essere su VPS

---

### 3. 🔴 Memoria Provvisoria

**Possibili cause**:
- Route API che fanno operazioni pesanti (query DB complesse)
- Route che processano file/grandi payload
- Route che fanno chiamate esterne lente (timeout)

**Route sospette**:
- `/api/rentri/ai-validate` - Potrebbe processare grandi payload
- `/api/sdi/ai-validate` - Potrebbe processare grandi payload
- `/api/rentri/fir/*` - Potrebbe fare operazioni pesanti

---

## 🎯 SOLUZIONI

### ✅ SOLUZIONE 1: Spostare Polling su VPS (PRIORITÀ ALTA)

**Modifiche necessarie**:

1. **remote-control.ts**:
   ```typescript
   // CAMBIARE DA:
   const API_BASE_URL = 'https://rescuemanager.eu/api';
   
   // A:
   const API_BASE_URL = import.meta.env.VITE_VPS_API_URL || 'http://api.rescuemanager.eu/api';
   ```

2. **useFirSync.js**:
   ```javascript
   // CAMBIARE DA:
   const apiUrl = import.meta.env.VITE_RENTRI_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri';
   
   // A:
   const apiUrl = import.meta.env.VITE_RENTRI_API_URL || 'http://rentri.rescuemanager.eu/api/rentri';
   ```

**Risparmio stimato**: ~15 milioni di edge request/mese ❌ → 0 ✅

---

### ✅ SOLUZIONE 2: Spostare Route RENTRI su VPS

**Route da spostare**:
- `/api/rentri/*` → VPS (`http://rentri.rescuemanager.eu/api/rentri/*`)

**Modifiche**:
1. Creare route su VPS per tutte le API RENTRI
2. Aggiornare frontend per chiamare VPS invece di Vercel
3. Rimuovere route da Vercel (o mantenerle come fallback)

**Risparmio stimato**: ~2-3 milioni di edge request/mese

---

### ✅ SOLUZIONE 3: Ridurre Frequenza Polling

**Modifiche**:
```typescript
// remote-control.ts
POLLING_INTERVAL = 300000; // 5 minuti invece di 30 secondi
// Maintenance: ogni 5 minuti invece di 1 minuto
// Version: ogni 30 minuti invece di 5 minuti

// useFirSync.js
setInterval(syncStati, 10 * 60 * 1000); // 10 minuti invece di 2
```

**Risparmio stimato**: ~80% riduzione polling = ~12 milioni di richieste/mese in meno

---

### ✅ SOLUZIONE 4: Usare WebSocket per Real-Time (Opzionale)

Invece di polling, usare WebSocket per:
- Heartbeat
- Maintenance status
- Version updates

**Risparmio**: Elimina completamente il polling

---

### ✅ SOLUZIONE 5: Caching Aggressivo

Aggiungere caching su Vercel per:
- Route `/api/maintenance/status` (cache 1 minuto)
- Route `/api/version/check` (cache 5 minuti)
- Route `/api/rentri/codifiche` (cache 1 ora)

**Configurazione Vercel**:
```json
{
  "headers": [
    {
      "source": "/api/maintenance/status",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=60"
        }
      ]
    }
  ]
}
```

---

## 📋 PIANO DI AZIONE

### 🔴 URGENTE (Oggi)

1. **Spostare polling su VPS**:
   - Modificare `remote-control.ts` per chiamare VPS
   - Modificare `useFirSync.js` per chiamare VPS
   - Verificare che VPS abbia endpoint corrispondenti

2. **Ridurre frequenza polling**:
   - Heartbeat: 30s → 5 minuti
   - Maintenance: 60s → 5 minuti
   - FIR Sync: 2 min → 10 minuti

### 🟡 IMPORTANTE (Questa settimana)

3. **Spostare route RENTRI su VPS**:
   - Creare route su VPS
   - Aggiornare frontend
   - Test completo

4. **Aggiungere caching**:
   - Configurare `vercel.json` con cache headers
   - Testare che funzioni

### 🟢 OTTIMIZZAZIONE (Prossimo mese)

5. **WebSocket** (se necessario):
   - Implementare WebSocket server su VPS
   - Sostituire polling con WebSocket

---

## 💰 RISPARMIO STIMATO

### Prima
- Edge Requests: ~15 milioni/mese
- Costo: ~$150-200/mese (piano Pro)
- Memoria: 50€/mese

### Dopo (con tutte le soluzioni)
- Edge Requests: ~500k-1M/mese (solo route essenziali su Vercel)
- Costo: ~$20-30/mese
- Memoria: ~10€/mese

**Risparmio totale**: ~$120-150/mese + 40€/mese = **~$160-190/mese** ✅

---

## 🔧 MODIFICHE IMMEDIATE

### File da Modificare

1. **desktop-app/.../src/lib/remote-control.ts**:
   - Cambiare `API_BASE_URL` da Vercel a VPS
   - Aumentare intervalli polling

2. **desktop-app/.../src/hooks/useFirSync.js**:
   - Cambiare URL da Vercel a VPS
   - Aumentare intervallo da 2 min a 10 min

3. **website/vercel.json**:
   - Aggiungere cache headers per route che rimangono su Vercel

---

**Prossimo passo**: Implementare SOLUZIONE 1 e 3 (spostare polling su VPS e ridurre frequenza)
