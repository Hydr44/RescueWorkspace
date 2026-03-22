# 🧪 GUIDA TEST SINCRONIZZAZIONE

## 📋 **PREPARAZIONE**

### 1. Verifica deploy
```bash
# Il sito deve essere deployato su Vercel
https://rescuemanager.eu

# Verifica che le API siano accessibili
curl https://rescuemanager.eu/api/sync/status
```

### 2. Database Supabase
- Assicurati di avere dati di test in almeno 1 organizzazione
- Utente autenticato con OAuth
- RLS disabilitato su `profiles`, `orgs`, `org_members`

## 🧪 **TEST 1: VERIFICA API**

### Test `/api/sync/status`
```bash
# Nel browser console (Chrome DevTools)
const token = 'YOUR_OAUTH_ACCESS_TOKEN';
const orgId = 'YOUR_ORG_ID';

fetch(`https://rescuemanager.eu/api/sync/status?org_id=${orgId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(r => r.json())
.then(console.log);
```

**Expected:** 
```json
{
  "success": true,
  "org_id": "...",
  "sync_status": {
    "clients": { "last_sync": "...", "ready": true },
    "transports": { "last_sync": "...", "ready": true }
  }
}
```

### Test `/api/sync/pull`
```bash
fetch(`https://rescuemanager.eu/api/sync/pull?org_id=${orgId}&table=clients`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(r => r.json())
.then(console.log);
```

**Expected:** Array di clienti

### Test `/api/sync/push`
```bash
fetch(`https://rescuemanager.eu/api/sync/push`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    org_id: orgId,
    table: 'clients',
    data: [{
      id: 'test-' + Date.now(),
      org_id: orgId,
      nome: 'Test Client',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]
  })
})
.then(r => r.json())
.then(console.log);
```

**Expected:** Success con data inserita

## 🧪 **TEST 2: DESKTOP APP**

### Setup
1. Apri desktop app
2. Login con OAuth
3. Apri DevTools (Console)

### Test SyncService
```javascript
import SyncService from '@/lib/sync';
import { useOrg } from '@/context/OrgContext';

// Nel componente React
const { orgId } = useOrg();

// Test 1: Get status
SyncService.getSyncStatus(orgId)
  .then(console.log)
  .catch(console.error);

// Test 2: Pull clients
SyncService.pull({ orgId, table: 'clients' })
  .then(result => {
    console.log('Pulled clients:', result.data);
  })
  .catch(console.error);

// Test 3: Sync all
SyncService.syncAll(orgId)
  .then(console.log)
  .catch(console.error);
```

### Test Real-time
```javascript
// Test subscription to transports
const unsubscribe = SyncService.subscribeToChanges(
  orgId,
  'transports',
  (payload) => {
    console.log('Real-time update:', payload);
    // Aggiorna UI
  }
);

// Stop subscription
setTimeout(() => unsubscribe(), 60000);
```

## 🧪 **TEST 3: END-TO-END**

### Scenario: Modifica cliente

1. **Desktop App**
   - Apri pagina Clients
   - Modifica un cliente
   - Salva

2. **Verifica Website**
   - Apri dashboard website
   - Controlla che il cliente sia aggiornato

3. **Verifica Real-time**
   - Modifica cliente su website
   - Verifica che desktop app riceva update

### Test completo:
```javascript
// Nel desktop app, dopo login
const { orgId } = useOrg();

// 1. Start background sync
SyncService.startBackgroundSync(orgId, 60000); // Ogni minuto

// 2. Load initial data
const initialData = SyncService.getCachedData(orgId, 'clients');
console.log('Initial cached data:', initialData);

// 3. Subscribe to real-time
SyncService.subscribeToChanges(orgId, 'clients', (payload) => {
  console.log('Client changed:', payload);
  // Refresh UI
});

// 4. Make a change and verify sync
```

## 🐛 **DEBUG**

### Problemi comuni

#### 1. "Unauthorized"
```javascript
// Verifica token OAuth
console.log('Tokens:', localStorage.getItem('rm-oauth-tokens'));

// Verifica che il token sia valido
const response = await fetch('https://rescuemanager.eu/api/auth/verify', {
  headers: {
    'Authorization': `Bearer ${YOUR_TOKEN}`
  }
});
console.log('Token valid:', await response.json());
```

#### 2. "Not authorized for this org"
- Verifica che l'utente appartenga all'org in `org_members`
- Query SQL:
```sql
SELECT * FROM org_members WHERE org_id = 'YOUR_ORG_ID' AND user_id = 'YOUR_USER_ID';
```

#### 3. "No data returned"
- Verifica che ci siano dati nella tabella
- Query SQL:
```sql
SELECT * FROM clients WHERE org_id = 'YOUR_ORG_ID' LIMIT 10;
```

#### 4. "CORS error"
- Verifica che CORS sia configurato su Vercel
- Controlla headers nelle response

## ✅ **CHECKLIST TEST**

- [ ] API `/status` funziona
- [ ] API `/pull` funziona
- [ ] API `/push` funziona
- [ ] SyncService può fare pull
- [ ] SyncService può fare push
- [ ] Cache locale funziona
- [ ] Real-time subscription funziona
- [ ] Background sync funziona
- [ ] Modifiche su desktop sincronizzano su website
- [ ] Modifiche su website sincronizzano su desktop

## 🎯 **SUCCESSO**

Tutti i test passati = Sistema di sincronizzazione funzionante! 🎉
