# 📊 PIANO DI SINCRONIZZAZIONE DATI

## 🎯 **OBIETTIVO**
Sincronizzare i dati tra sito web (gestione admin/organizzazioni) e app desktop (operazioni sul campo) in tempo reale.

## 📋 **TABELLE DA SINCRONIZZARE**

### **1. ORGANIZZAZIONI (Bidirezionale)**
**Priorità:** 🔴 Alta
- `orgs` → modifiche nome, contatti, settings
- `org_members` → aggiunta/rimozione membri
- `org_settings` → configurazioni app

**Sincronizzazione:**
- Website → Desktop: immediato
- Desktop → Website: immediato

### **2. CLIENTI (Bidirezionale)**
**Priorità:** 🔴 Alta
- `clients` → anagrafica, contatti, note

**Sincronizzazione:**
- Website → Desktop: real-time
- Desktop → Website: real-time

### **3. TRANSPORTI (Desktop → Website)**
**Priorità:** 🔴 Alta
- `transports` → movimentazioni mezzi
- Real-time tracking su website per admin

**Sincronizzazione:**
- Desktop → Website: real-time streaming
- Website → Desktop: read-only

### **4. QUOTAZIONI (Bidirezionale)**
**Priorità:** 🟡 Media
- `quotes` → preventivi
- `invoice_items` → voci fattura

**Sincronizzazione:**
- Desktop → Website: immediato
- Website → Desktop: immediato

### **5. DEMOLIZIONI RVFU (Desktop → Website)**
**Priorità:** 🟡 Media
- `demolition_cases` → pratiche demolizione
- `rvfu_documents` → documenti

**Sincronizzazione:**
- Desktop → Website: immediato
- Website → Desktop: read-only

### **6. YARD ITEMS (Desktop → Website)**
**Priorità:** 🟢 Bassa
- `yard_items` → inventario piazzale

**Sincronizzazione:**
- Desktop → Website: polling ogni 5 min
- Website → Desktop: read-only

### **7. SPARE PARTS (Desktop → Website)**
**Priorità:** 🟢 Bassa
- `spare_parts` → magazzino ricambi
- `spare_parts_catalog` → catalogo

**Sincronizzazione:**
- Desktop → Website: polling ogni 10 min
- Website → Desktop: read-only

## 🔧 **METODI DI SINCRONIZZAZIONE**

### **1. Real-time (WebSocket)**
**Tabella:** `transports`
**Implementazione:** Supabase Realtime Subscriptions
```javascript
// Desktop app
supabase
  .channel(`transports:${orgId}`)
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'transports' },
    (payload) => {
      // Update UI
    }
  )
  .subscribe();
```

### **2. Polling Intelligente**
**Tabelle:** `quotes`, `clients`
**Frequenza:** 1-2 minuti
**Implementazione:** Service Worker con cache

### **3. Push Notifications**
**Tabelle:** `org_settings`, `org_members`
**Implementazione:** Supabase Edge Functions
- Trigger su modifica
- Notifica via WebSocket

### **4. Batch Sync**
**Tabelle:** `yard_items`, `spare_parts`
**Frequenza:** 5-10 minuti
**Implementazione:** Background job

## 📡 **ARCHITETTURA API**

### **Website Endpoints**
```typescript
// GET /api/sync/status
// POST /api/sync/push
// GET /api/sync/pull
// WebSocket: wss://rescuemanager.eu/api/sync/ws
```

### **Desktop Service**
```typescript
class SyncService {
  // Sync all data
  async syncAll()
  
  // Sync specific table
  async syncTable(table: string)
  
  // Real-time listener
  subscribeToChanges(table: string)
  
  // Offline queue
  queueOfflineChanges()
}
```

## 🔄 **FLUSSO SINCRONIZZAZIONE**

### **1. On Login (Desktop)**
```javascript
// 1. Pull latest data
const data = await syncService.syncAll()

// 2. Subscribe to real-time
syncService.subscribeToChanges('transports')
syncService.subscribeToChanges('clients')

// 3. Start background sync
syncService.startBackgroundSync()
```

### **2. On Change (Desktop)**
```javascript
// 1. Save locally
await localStorage.save(data)

// 2. Push to server
await syncService.pushChanges(table, data)

// 3. Broadcast to other clients
syncService.broadcastChange(table, data)
```

### **3. On Reconnect**
```javascript
// 1. Check for unsynced changes
const unsynced = await syncService.getUnsynced()

// 2. Push unsynced
await syncService.pushChanges(unsynced)

// 3. Pull latest
await syncService.syncAll()
```

## 🛡️ **SICUREZZA**

### **Token-based Auth**
- Usa OAuth access token
- Refresh automatico ogni ora

### **Conflict Resolution**
- Last-write-wins per dati operativi
- Manual merge per dati critici

### **Data Validation**
- Schema validation prima di sync
- Rollback su errore

## 📊 **MONITORAGGIO**

### **Metrics**
- Sync success rate
- Latency per tabella
- Offline queue size

### **Alerting**
- Failed syncs > 5%
- Latency > 5s
- Offline queue > 100 items

## 🚀 **IMPLEMENTAZIONE**

### **Fase 1: Infrastructure**
1. Creare API endpoints sync
2. Implementare WebSocket server
3. Aggiungere Supabase Realtime

### **Fase 2: Desktop Service**
1. Implementare SyncService
2. Aggiungere background sync
3. Gestire offline queue

### **Fase 3: Real-time**
1. Subscribe a transports
2. Subscribe a clients
3. Broadcast updates

### **Fase 4: Optimization**
1. Implementare caching
2. Ottimizzare polling
3. Monitorare performance

## ✅ **SUCCESS CRITERIA**

- [ ] Tutte le tabelle sincronizzate
- [ ] Real-time sync per transports
- [ ] Offline support
- [ ] Zero data loss
- [ ] < 2s sync latency
