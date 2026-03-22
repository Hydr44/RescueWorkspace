# 🚀 Piano Migrazione API RENTRI da Vercel a VPS

## 📋 Obiettivo

Spostare **tutte le API RENTRI** da Vercel/Next.js alla VPS per risolvere problemi di memoria e migliorare performance/affidabilità.

---

## 📊 Stato Attuale

### **API RENTRI su Vercel** (`website/src/app/api/rentri/`)

1. **Anagrafiche**
   - `/api/rentri/siti/` - Gestione siti
   - `/api/rentri/siti/autorizzazioni/` - Autorizzazioni
   - `/api/rentri/certificati/upload/` - Upload certificati

2. **Registri**
   - `/api/rentri/registri/` - CRUD registri
   - `/api/rentri/registri/create/` - Crea registro
   - `/api/rentri/registri/sync/` - Sincronizzazione
   - `/api/rentri/registri/[id]/` - Dettaglio registro
   - `/api/rentri/registri/[id]/movimenti/` - Movimenti registro
   - `/api/rentri/registri/[id]/movimenti-crud/` - CRUD movimenti
   - `/api/rentri/registri/[id]/movimenti-sync/` - Sync movimenti
   - `/api/rentri/registri/transazioni/[id]/status/` - Status transazione
   - `/api/rentri/registri/transazioni/[id]/result/` - Result transazione

3. **Movimenti**
   - `/api/rentri/movimenti/sync/` - Sincronizzazione movimenti
   - `/api/rentri/movimenti/update-status/` - Aggiorna stato

4. **Formulari (FIR)**
   - `/api/rentri/fir/trasmetti/` - Trasmetti FIR
   - `/api/rentri/fir/transazione-status/` - Status transazione
   - `/api/rentri/fir/transazione-result/` - Result transazione
   - `/api/rentri/fir/pdf/` - PDF FIR
   - `/api/rentri/fir/firma/` - Firma FIR
   - `/api/rentri/fir/accettazione/` - Accettazione FIR
   - `/api/rentri/fir/annulla/` - Annulla FIR
   - `/api/rentri/fir/stato/` - Stato FIR
   - `/api/rentri/fir/sync-stati/` - Sync stati

5. **Altri Servizi**
   - `/api/rentri/codifiche/` - Codifiche RENTRI
   - `/api/rentri/blocchi/` - Blocchi
   - `/api/rentri/limiti/` - Limiti
   - `/api/rentri/limiti/alert/` - Alert limiti
   - `/api/rentri/status/` - Status servizio
   - `/api/rentri/mud/` - MUD
   - `/api/rentri/mud/[id]/` - Dettaglio MUD
   - `/api/rentri/ai-validate/` - Validazione IA

### **Infrastruttura VPS Esistente**

- ✅ Server Express già configurato: `/opt/rentri-polling/` (porta 3001)
- ✅ Nginx già configurato per `/api/rentri/transazioni/`
- ✅ PM2 già configurato
- ✅ Variabili d'ambiente già impostate
- ✅ Certificati RENTRI già gestiti via Supabase

---

## 🎯 Piano di Migrazione

### **Fase 1: Preparazione Server VPS**

#### 1.1 Crea struttura directory

```bash
ssh root@217.154.118.37

# Crea directory principale per API RENTRI
mkdir -p /opt/rentri-api
cd /opt/rentri-api

# Struttura directory
mkdir -p lib
mkdir -p routes
mkdir -p logs
```

#### 1.2 Crea `package.json`

```json
{
  "name": "rentri-api-server",
  "version": "1.0.0",
  "description": "Server API RENTRI su VPS",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "@supabase/supabase-js": "^2.39.0",
    "crypto": "^1.0.1",
    "node-fetch": "^2.7.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

#### 1.3 Crea `.env` (o usa `/root/.env` esistente)

```env
# Server
PORT=3003
NODE_ENV=production

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://hbcygzqiuvqhxmvfqcjy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<chiave_service_role>

# RENTRI Gateway URL (opzionale)
RENTRI_GATEWAY_URL=https://rentri-test.rescuemanager.eu
```

---

### **Fase 2: Migrazione Codice**

#### 2.1 Struttura file da migrare

```
/opt/rentri-api/
├── server.js              # Server Express principale
├── package.json
├── .env
├── lib/
│   ├── jwt-dynamic.js     # Generazione JWT RENTRI (da website/lib/rentri/)
│   ├── fir-builder.js     # Costruzione FIR (da website/lib/rentri/)
│   ├── cors.js            # Gestione CORS
│   └── utils.js           # Utility varie
├── routes/
│   ├── anagrafiche.js     # API anagrafiche
│   ├── registri.js        # API registri
│   ├── movimenti.js       # API movimenti
│   ├── formulari.js       # API FIR
│   ├── codifiche.js       # API codifiche
│   ├── mud.js             # API MUD
│   └── status.js          # API status
└── logs/
    └── rentri-api.log
```

#### 2.2 File da copiare da `website/`

1. **`website/src/lib/rentri/jwt-dynamic.ts`** → `lib/jwt-dynamic.js`
2. **`website/src/lib/rentri/fir-builder.ts`** → `lib/fir-builder.js`
3. **`website/src/lib/cors.ts`** → `lib/cors.js`
4. **Tutti i file `route.ts` da `website/src/app/api/rentri/`** → Converti in route Express

#### 2.3 Conversione da Next.js Route Handler a Express

**Esempio: `trasmetti/route.ts` → `routes/formulari.js`**

**Prima (Next.js):**
```typescript
export async function POST(request: NextRequest) {
  const { fir_id } = await request.json();
  // ... logica
  return NextResponse.json({ success: true });
}
```

**Dopo (Express):**
```javascript
router.post('/fir/trasmetti', async (req, res) => {
  try {
    const { fir_id } = req.body;
    // ... stessa logica
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### **Fase 3: Server Express Principale**

#### 3.1 Crea `server.js`

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/rentri', require('./routes/anagrafiche'));
app.use('/api/rentri', require('./routes/registri'));
app.use('/api/rentri', require('./routes/movimenti'));
app.use('/api/rentri', require('./routes/formulari'));
app.use('/api/rentri', require('./routes/codifiche'));
app.use('/api/rentri', require('./routes/mud'));
app.use('/api/rentri', require('./routes/status'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'rentri-api',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`[RENTRI-API] Server avviato sulla porta ${PORT}`);
  console.log(`[RENTRI-API] Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
```

---

### **Fase 4: Configurazione Nginx**

#### 4.1 Aggiorna configurazione Nginx

Aggiungi a `/etc/nginx/sites-available/rentri` (o file config principale):

```nginx
# API RENTRI (nuovo server completo)
location /api/rentri/ {
    proxy_pass http://localhost:3003;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # CORS headers (se necessario)
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
    add_header Access-Control-Allow-Headers 'Content-Type, Authorization';
    
    # Timeout per operazioni lunghe
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

# Mantieni vecchio endpoint polling (se ancora usato)
location /api/rentri/transazioni/ {
    proxy_pass http://localhost:3001;
    # ... configurazione esistente
}
```

#### 4.2 Ricarica Nginx

```bash
nginx -t  # Verifica configurazione
systemctl reload nginx
```

---

### **Fase 5: Configurazione PM2**

#### 5.1 Crea file `ecosystem.config.js`

```javascript
module.exports = {
  apps: [{
    name: 'rentri-api',
    script: './server.js',
    cwd: '/opt/rentri-api',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3003
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M',
    watch: false
  }]
};
```

#### 5.2 Avvia con PM2

```bash
cd /opt/rentri-api
npm install
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Se non già configurato
```

---

### **Fase 6: Aggiornamento Frontend**

#### 6.1 Crea file di configurazione

**`desktop-app/greeting-friend-api-main/src/lib/rentri-config.js`**

```javascript
// Configurazione URL API RENTRI
const RENTRI_API_URL = import.meta.env.VITE_RENTRI_API_URL || 
  (import.meta.env.VITE_USE_VPS_RENTRI === 'true' 
    ? 'https://rentri-test.rescuemanager.eu'  // VPS
    : 'https://rescuemanager.eu');              // Vercel (fallback)

export const RENTRI_BASE_URL = `${RENTRI_API_URL}/api/rentri`;
```

#### 6.2 Aggiorna `rentri-api.js`

Modifica `desktop-app/greeting-friend-api-main/src/lib/rentri-api.js`:

```javascript
import { RENTRI_BASE_URL } from './rentri-config';

// Sostituisci tutti gli URL hardcoded con RENTRI_BASE_URL
const url = `${RENTRI_BASE_URL}${path}`;
```

#### 6.3 Aggiorna tutte le chiamate API nel frontend

Cerca e sostituisci in tutti i file:
- `https://rescuemanager.eu/api/rentri` → `${RENTRI_BASE_URL}`
- Usa `RENTRI_BASE_URL` da `rentri-config.js`

---

### **Fase 7: Testing e Validazione**

#### 7.1 Test Health Check

```bash
# Locale (SSH)
curl http://localhost:3003/health

# Pubblico
curl https://rentri-test.rescuemanager.eu/api/rentri/status
```

#### 7.2 Test Endpoint Principali

```bash
# Status
curl https://rentri-test.rescuemanager.eu/api/rentri/status

# Lista registri
curl "https://rentri-test.rescuemanager.eu/api/rentri/registri?org_id=xxx"

# Lista FIR
curl "https://rentri-test.rescuemanager.eu/api/rentri/formulari?org_id=xxx"
```

#### 7.3 Monitoraggio

```bash
# Log PM2
pm2 logs rentri-api

# Log Nginx
tail -f /var/log/nginx/rentri-test.access.log
tail -f /var/log/nginx/rentri-test.error.log

# Status PM2
pm2 status
pm2 info rentri-api
```

---

### **Fase 8: Rollout Graduale**

#### 8.1 Variabile ambiente per switch

Aggiungi variabile `VITE_USE_VPS_RENTRI=true` nel frontend per abilitare VPS gradualmente.

#### 8.2 Monitoraggio

Monitora per alcuni giorni:
- Errori nei log
- Performance
- Memoria/CPU usage

#### 8.3 Disattivazione Vercel

Dopo conferma che tutto funziona:
- Disabilita endpoint RENTRI su Vercel (opzionale, per sicurezza)
- Rimuovi variabile `VITE_USE_VPS_RENTRI` (sempre VPS)

---

## 📋 Checklist Migrazione

### **Server VPS**
- [ ] Directory `/opt/rentri-api` creata
- [ ] `package.json` creato e `npm install` eseguito
- [ ] File `.env` configurato con variabili Supabase
- [ ] Codice migrato da `website/src/app/api/rentri/`
- [ ] Library migrate da `website/src/lib/rentri/`
- [ ] `server.js` principale creato
- [ ] Routes Express create
- [ ] Test locale eseguiti

### **Nginx**
- [ ] Configurazione aggiornata per `/api/rentri/`
- [ ] `nginx -t` passa senza errori
- [ ] Nginx ricaricato

### **PM2**
- [ ] `ecosystem.config.js` creato
- [ ] Server avviato con PM2
- [ ] `pm2 save` eseguito
- [ ] Health check funziona

### **Frontend**
- [ ] `rentri-config.js` creato
- [ ] `rentri-api.js` aggiornato
- [ ] Tutte le chiamate API aggiornate
- [ ] Test end-to-end eseguiti

### **Monitoring**
- [ ] Log PM2 configurati
- [ ] Log Nginx verificati
- [ ] Performance monitorate

---

## 🔧 Comandi Rapidi

### **Installazione VPS**

```bash
# Connetti alla VPS
ssh root@217.154.118.37

# Crea directory e installa
mkdir -p /opt/rentri-api/{lib,routes,logs}
cd /opt/rentri-api

# Copia file (da locale, dopo averli preparati)
# ... upload file ...

# Installa dipendenze
npm install

# Avvia con PM2
pm2 start ecosystem.config.js
pm2 save
```

### **Aggiornamento**

```bash
cd /opt/rentri-api
git pull  # Se usi git
# oppure copia nuovi file manualmente
npm install  # Se package.json cambia
pm2 restart rentri-api
```

### **Rollback**

```bash
# Disabilita VPS nel frontend
# VITE_USE_VPS_RENTRI=false

# Mantieni VPS attivo per test paralleli
```

---

## ⚠️ Note Importanti

1. **Certificati**: I certificati RENTRI sono già su Supabase, nessun cambiamento necessario
2. **Database**: Continua a usare Supabase, nessun cambiamento
3. **Autenticazione**: Stesso sistema JWT, nessun cambiamento
4. **CORS**: Configurato su Nginx e Express per permettere chiamate dal frontend
5. **Backup**: Mantieni codice Vercel per riferimento/rollback

---

## 📞 Supporto

In caso di problemi:
1. Verifica log PM2: `pm2 logs rentri-api`
2. Verifica log Nginx: `tail -f /var/log/nginx/rentri-test.error.log`
3. Test health check: `curl http://localhost:3003/health`
4. Verifica variabili d'ambiente: `pm2 env rentri-api`
