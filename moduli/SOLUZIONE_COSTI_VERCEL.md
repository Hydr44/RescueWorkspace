# 🚨 Soluzione Urgente Costi Vercel - 10+ Milioni Edge Request

**Data**: 2026-01-23  
**Priorità**: 🔴 CRITICA - Risparmio stimato: ~$160-190/mese

---

## 🔴 PROBLEMA IDENTIFICATO

### Polling che Generano Milioni di Richieste

1. **remote-control.ts**:
   - Heartbeat: ogni **30 secondi** → `https://rentri-test.rescuemanager.eu/api/monitoring/heartbeat`
   - Maintenance: ogni **60 secondi** → `https://rentri-test.rescuemanager.eu/api/maintenance/status`
   - Version: ogni **5 minuti** → `https://rescuemanager.eu/api/version/check`

2. **useFirSync.js**:
   - FIR Sync: ogni **2 minuti** → `https://rentri-test.rescuemanager.eu/api/rentri/fir/sync-stati`

### Calcolo Richieste

**Per utente attivo (8 ore/giorno)**:
- Heartbeat: 8h × 120 richieste/h = **960 richieste/giorno**
- Maintenance: 8h × 60 richieste/h = **480 richieste/giorno**
- Version: 8h × 12 richieste/h = **96 richieste/giorno**
- FIR Sync: 8h × 30 richieste/h = **240 richieste/giorno**

**Totale per utente**: ~1.776 richieste/giorno

**Con 100 utenti attivi**: **177.600 richieste/giorno** = **5.3 milioni/mese** ❌

**Con 200 utenti**: **10.6 milioni/mese** ❌❌

---

## ✅ SOLUZIONI IMMEDIATE

### 1. Spostare Polling su VPS (PRIORITÀ MASSIMA)

#### Modifica `remote-control.ts`

```typescript
// PRIMA (chiama Vercel):
const API_BASE_URL = import.meta.env.VITE_MONITORING_API_URL || 'https://rentri-test.rescuemanager.eu/api';

// DOPO (chiama VPS):
const API_BASE_URL = import.meta.env.VITE_MONITORING_API_URL || 'http://api.rescuemanager.eu/api';
// OPPURE se il VPS è su un altro dominio:
const API_BASE_URL = import.meta.env.VITE_MONITORING_API_URL || 'http://217.154.118.37/api';
```

#### Modifica `useFirSync.js`

```javascript
// PRIMA (chiama Vercel):
const apiUrl = import.meta.env.VITE_RENTRI_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri';

// DOPO (chiama VPS):
const apiUrl = import.meta.env.VITE_RENTRI_API_URL || 'http://rentri.rescuemanager.eu/api/rentri';
// OPPURE:
const apiUrl = import.meta.env.VITE_RENTRI_API_URL || 'http://217.154.118.37/api/rentri';
```

---

### 2. Ridurre Frequenza Polling

#### Modifica `remote-control.ts`

```typescript
// PRIMA:
private static POLLING_INTERVAL = 30000; // 30 secondi
// Maintenance: 60000 (60 secondi)
// Version: 300000 (5 minuti)

// DOPO:
private static POLLING_INTERVAL = 300000; // 5 minuti (10x più lento)
// Maintenance: 300000 (5 minuti invece di 1)
// Version: 1800000 (30 minuti invece di 5)
```

#### Modifica `useFirSync.js`

```javascript
// PRIMA:
intervalRef.current = setInterval(syncStati, 2 * 60 * 1000); // 2 minuti

// DOPO:
intervalRef.current = setInterval(syncStati, 10 * 60 * 1000); // 10 minuti (5x più lento)
```

**Risparmio**: ~80% riduzione richieste = **~8-9 milioni di richieste/mese in meno**

---

### 3. Spostare Tutte le Route RENTRI su VPS

**Route da spostare**:
- `/api/rentri/*` → VPS (`http://rentri.rescuemanager.eu/api/rentri/*`)

**File da modificare**:
- `rentri-api.js`: Cambiare `RENTRI_BASE_URL`
- Tutti i file che usano `VITE_RENTRI_API_URL`

---

### 4. Aggiungere Caching su Vercel (per route che rimangono)

**vercel.json**:
```json
{
  "headers": [
    {
      "source": "/api/maintenance/status",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=300"
        }
      ]
    },
    {
      "source": "/api/version/check",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=1800"
        }
      ]
    }
  ]
}
```

---

## 📋 MODIFICHE DA FARE SUBITO

### File 1: `desktop-app/.../src/lib/remote-control.ts`

```typescript
// RIGA 11: Cambiare API_BASE_URL
const API_BASE_URL = import.meta.env.VITE_MONITORING_API_URL || 'http://api.rescuemanager.eu/api';

// RIGA 35: Aumentare intervallo heartbeat
private static POLLING_INTERVAL = 300000; // 5 minuti

// RIGA 36: Aumentare intervallo version
private static VERSION_CHECK_INTERVAL = 1800000; // 30 minuti

// RIGA 238: Aumentare intervallo maintenance
}, 300000); // 5 minuti invece di 60 secondi
```

### File 2: `desktop-app/.../src/hooks/useFirSync.js`

```javascript
// RIGA 16: Cambiare URL
const apiUrl = import.meta.env.VITE_RENTRI_API_URL || 'http://rentri.rescuemanager.eu/api/rentri';

// RIGA 46: Aumentare intervallo
intervalRef.current = setInterval(syncStati, 10 * 60 * 1000); // 10 minuti
```

### File 3: `desktop-app/.../src/lib/rentri-api.js`

```javascript
// RIGA 7: Cambiare URL
const RENTRI_BASE_URL = import.meta.env.VITE_RENTRI_API_URL || 'http://rentri.rescuemanager.eu/api/rentri';
```

---

## ⚠️ VERIFICA PRIMA DI MODIFICARE

**Domande da rispondere**:
1. `rentri-test.rescuemanager.eu` punta a Vercel o VPS?
2. Quale è l'URL corretto del VPS per le API?
3. Il VPS ha già gli endpoint `/api/maintenance/status` e `/api/monitoring/heartbeat`?

**Verifica rapida**:
```bash
# Controlla DNS
nslookup rentri-test.rescuemanager.eu
nslookup api.rescuemanager.eu

# Test endpoint VPS
curl http://api.rescuemanager.eu/api/maintenance/status
curl http://rentri.rescuemanager.eu/api/rentri/fir/sync-stati
```

---

## 💰 RISPARMIO STIMATO

### Prima
- Edge Requests: ~10-15 milioni/mese
- Costo Vercel: ~$150-200/mese
- Memoria: 50€/mese
- **Totale: ~$200-250/mese**

### Dopo
- Edge Requests: ~500k-1M/mese (solo route essenziali)
- Costo Vercel: ~$20-30/mese
- Memoria: ~10€/mese
- **Totale: ~$30-40/mese**

**Risparmio**: **~$160-210/mese** ✅

---

## 🎯 PRIORITÀ

1. 🔴 **URGENTE**: Spostare polling su VPS (oggi)
2. 🔴 **URGENTE**: Ridurre frequenza polling (oggi)
3. 🟡 **IMPORTANTE**: Spostare route RENTRI su VPS (questa settimana)
4. 🟢 **OTTIMIZZAZIONE**: Aggiungere caching (questa settimana)

---

**Nota**: Se `rentri-test.rescuemanager.eu` punta già al VPS, il problema potrebbe essere che Vercel sta facendo proxy o che ci sono altre chiamate che non abbiamo identificato. Verificare i log Vercel per vedere quali route generano più richieste.
