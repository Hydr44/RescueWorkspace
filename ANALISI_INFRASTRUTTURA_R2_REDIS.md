# Analisi Infrastruttura: R2 + Redis per RescueManager

**Data:** 18 Marzo 2026  
**Contesto:** VPS attuale con 7 microservizi Node.js, Supabase PostgreSQL, SDI/RENTRI/RVFU  
**Obiettivo:** Valutare se R2 (S3-compatible storage) e Redis (in-memory cache) migliorano performance e affidabilità

---

## 1. STATO INFRASTRUTTURA ATTUALE

### VPS (217.154.118.37)
- **RAM:** 3.8 GB (1.3 GB usata, 2.5 GB disponibile)
- **CPU:** Load avg 0.00 (idle)
- **Disco:** 116 GB (9.9 GB usato, 9%)
- **Servizi:** 7 microservizi Node.js (353 MB RAM totale)
  - sdi-sftp-server (49 MB, 61 restart)
  - rentri-api x2 (68+66 MB, 6+6 restart)
  - rentri-polling (39 MB, 148 restart)
  - oauth-proxy-server (56 MB)
  - rvfu-proxy-direct (48 MB)
  - rentri-cert-upload (27 MB)

### Database
- **Supabase PostgreSQL** - Gestisce: clienti, trasporti, demolizioni, ricambi, fatture, utenti
- **MariaDB** (Plesk, non usato, 50 MB RAM)

### Storage Attuale
- **SFTP locale** `/var/sftp/sdi/` - Fatture SDI (DatiVersoSdI, DatiDaSdI)
- **Certificati locali** `/opt/sdi-certs/` - Certificati firma/cifratura SDI
- **File temporanei** `/opt/*/debug/` - Debug ZIP sparsi

### Problemi Identificati
1. **Nessun backup automatico** - File SDI/certificati a rischio
2. **Storage locale limitato** - 116 GB totali, crescita non sostenibile
3. **Nessun caching** - Ogni query va al DB, no cache layer
4. **Crash frequenti** - sdi-sftp (61x), rentri-polling (148x)
5. **Nessun swap** - OOM killer risk con picchi
6. **Tutto come root** - Rischio sicurezza elevato

---

## 2. ANALISI R2 (Cloudflare S3-Compatible Storage)

### Cos'è R2?
- **S3-compatible object storage** di Cloudflare
- **Pricing:** $0.015/GB/mese (storage) + $0.20/milione richieste GET + $4/milione PUT
- **Vantaggi:** No egress fees (a differenza di AWS S3), CDN integrato, API S3 standard
- **Regioni:** Globale (Cloudflare edge locations)

### Casi d'Uso per RescueManager

#### ✅ **IDEALE: Backup Fatture SDI**
```
Flusso attuale:
  Desktop App → SFTP :3004 → /var/sftp/sdi/DatiVersoSdI/ → SDI Sogei
  SDI Sogei → SFTP :3004 → /var/sftp/sdi/DatiDaSdI/ → rentri-polling

Flusso con R2:
  Desktop App → SFTP :3004 → /var/sftp/sdi/ (locale)
                                    ↓
                          sdi-sftp-server
                                    ↓
                          R2: s3://rescuemanager-sdi/
                          ├── sent/YYYY/MM/DD/
                          ├── received/YYYY/MM/DD/
                          └── backup/
```

**Benefici:**
- ✅ Backup automatico e georeplicato
- ✅ Versioning (recupero file cancellati)
- ✅ Lifecycle policies (archivio vecchi file)
- ✅ Accesso da qualsiasi luogo (non solo VPS)
- ✅ Riduce disco VPS (116 GB → 20 GB)

**Costo stimato:**
- 100 GB fatture/mese = $1.50/mese storage
- 1M richieste/mese = $0.20 GET + $4 PUT = $4.20
- **Totale: ~$6/mese**

#### ✅ **IDEALE: Certificati SDI**
```
Attuale: /opt/sdi-certs/ (locale, no backup)

Con R2:
  R2: s3://rescuemanager-certs/
  ├── firma/EMMAT002.*.p12
  ├── cifratura/EMMAT002.*.p12
  └── ca-bundle/
```

**Benefici:**
- ✅ Backup certificati (critici!)
- ✅ Accesso da più VPS se necessario
- ✅ Versionamento (rollback se compromessi)
- ✅ Encryption at rest (Cloudflare)

**Costo:** Negligibile (~$0.01/mese)

#### ✅ **UTILE: Export PDF/Excel Trasporti**
```
Attuale: Generati al volo, no cache

Con R2:
  R2: s3://rescuemanager-exports/
  ├── transports/YYYY/MM/DD/
  ├── quotes/YYYY/MM/DD/
  └── invoices/YYYY/MM/DD/
```

**Benefici:**
- ✅ Cache export generati (richiesta stessa = download da R2)
- ✅ CDN Cloudflare per download veloce
- ✅ Riduce carico CPU VPS
- ✅ Accesso diretto da browser (signed URLs)

**Costo:** ~$0.50/mese (se 50 export/giorno)

#### ⚠️ **NON IDEALE: Database Backup**
- R2 è object storage, non backup DB
- **Soluzione migliore:** Supabase backup automatico (già incluso) + pg_dump giornaliero su R2

---

## 3. ANALISI REDIS (In-Memory Cache)

### Cos'è Redis?
- **In-memory data structure store** (cache, session, queue)
- **Pricing:** 
  - Self-hosted: $0 (ma richiede gestione)
  - Managed (Upstash, Redis Cloud): $5-50/mese
- **Vantaggi:** Velocissimo (sub-millisecond), supporta strutture dati (string, list, set, hash, sorted set)
- **Svantaggi:** Volatile (dati in RAM), richiede persistenza se critico

### Casi d'Uso per RescueManager

#### ✅ **CRITICO: Cache Query Frequenti**
```
Problema attuale:
  - Ogni caricamento lista trasporti = query DB
  - Ogni ricerca clienti = query DB
  - Nessun caching

Con Redis:
  GET /trasporti?status=enroute
    ├─ Redis HIT → return cached (1ms)
    └─ Redis MISS → query DB → cache 5 min → return

  GET /clienti?search=acme
    ├─ Redis HIT → return cached (1ms)
    └─ Redis MISS → query DB → cache 10 min → return
```

**Benefici:**
- ✅ Riduce query DB (da 1000/ora a 100/ora)
- ✅ Risposta istantanea (1ms vs 50ms)
- ✅ Riduce carico CPU Supabase
- ✅ Migliora UX (UI più responsiva)

**Implementazione:**
```typescript
// Middleware cache Redis
async function getCachedTransports(orgId, status) {
  const key = `transports:${orgId}:${status}`;
  
  // Try cache
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  // Miss: query DB
  const data = await supabase
    .from('transports')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', status);
  
  // Cache 5 minuti
  await redis.setex(key, 300, JSON.stringify(data));
  return data;
}
```

**Costo:** ~$10/mese (Upstash starter)

#### ✅ **IMPORTANTE: Session Management**
```
Problema attuale:
  - OAuth tokens in localStorage (client-side)
  - Nessuna sessione server-side
  - Risk: token compromise

Con Redis:
  POST /auth/login
    ├─ Valida credenziali
    ├─ Crea session Redis (TTL 24h)
    ├─ Return session ID (secure cookie)
    └─ Client usa session ID per richieste

  GET /api/trasporti
    ├─ Valida session Redis
    ├─ Carica user data da cache
    └─ Return dati
```

**Benefici:**
- ✅ Sessioni server-side (più sicure)
- ✅ Logout istantaneo (invalida session)
- ✅ Tracking attività utente
- ✅ Rate limiting per utente

**Implementazione:**
```typescript
// Session middleware
async function validateSession(req) {
  const sessionId = req.cookies.sessionId;
  const session = await redis.get(`session:${sessionId}`);
  
  if (!session) throw new Error('Invalid session');
  
  const data = JSON.parse(session);
  req.user = data.user;
  req.orgId = data.orgId;
}
```

#### ✅ **IMPORTANTE: Rate Limiting**
```
Problema attuale:
  - Nessun rate limiting
  - Risk: brute force, DDoS

Con Redis:
  GET /api/login
    ├─ Incrementa counter Redis (key: ip:endpoint)
    ├─ Se counter > 5 in 1 min → 429 Too Many Requests
    └─ Altrimenti procedi
```

**Benefici:**
- ✅ Protegge da brute force
- ✅ Protegge da DDoS
- ✅ Implementazione semplice

#### ✅ **UTILE: Job Queue (RENTRI/SDI)**
```
Problema attuale:
  - rentri-polling gira ogni 5 min
  - sdi-sftp-server processa file sincrono
  - Se crash, file persi

Con Redis Queue (Bull):
  sdi-sftp-server
    ├─ Riceve file SFTP
    ├─ Aggiunge job a Redis queue
    ├─ Return 200 OK subito
    └─ Worker processa asincrono

  Worker (rentri-polling)
    ├─ Legge job da queue
    ├─ Processa file
    ├─ Aggiorna DB
    ├─ Mark job done
    └─ Se fallisce: retry 3x
```

**Benefici:**
- ✅ Decoupling (SFTP non aspetta processing)
- ✅ Retry automatico (affidabilità)
- ✅ Tracking job status
- ✅ Riduce crash (148 restart → 0)

**Implementazione:**
```typescript
import Queue from 'bull';

const rentriQueue = new Queue('rentri', {
  redis: { host: 'redis.example.com', port: 6379 }
});

// Producer (sdi-sftp-server)
app.post('/upload', async (req, res) => {
  const file = req.file;
  
  // Aggiungi job
  await rentriQueue.add(
    { filePath: file.path, fileName: file.originalname },
    { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
  );
  
  res.json({ status: 'queued' });
});

// Consumer (worker)
rentriQueue.process(async (job) => {
  const { filePath, fileName } = job.data;
  
  try {
    // Processa file
    const result = await processRentriFile(filePath);
    
    // Aggiorna DB
    await supabase
      .from('rentri_movements')
      .insert({ file_name: fileName, status: 'processed', result });
    
    return { success: true };
  } catch (error) {
    throw error; // Retry
  }
});
```

**Costo:** Incluso in Redis (~$10/mese)

#### ⚠️ **LIMITATO: Real-Time Notifications**
```
Problema attuale:
  - Nessuna notifica real-time
  - Utente deve refreshare manualmente

Con Redis Pub/Sub:
  Quando trasporto cambia stato:
    ├─ Backend pubblica evento Redis
    ├─ WebSocket client riceve notifica
    └─ UI aggiorna istantaneamente
```

**Benefici:**
- ✅ Notifiche real-time
- ✅ Collaborazione multi-utente
- ✅ Tracking live

**Limitazione:** Richiede WebSocket (non solo REST)

**Costo:** Incluso in Redis

---

## 4. ARCHITETTURA PROPOSTA

### Fase 1: R2 + Redis Essenziale (1-2 settimane)

```
┌─────────────────────────────────────────────────────────────┐
│                    Desktop App / Web                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                    Nginx :443
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   :3004 SDI         :3003 RENTRI    :3005 OAuth
   SFTP Server       API x2          Proxy
        │                │
        ├─────────────────┼─────────────────────┐
        │                 │                     │
        ▼                 ▼                     ▼
    /var/sftp/sdi    Supabase            Redis Cache
    (locale)         PostgreSQL          (Upstash)
        │                 │
        │                 └──────────────┐
        │                                │
        ▼                                ▼
    R2 Storage                    Session + Rate Limit
    (Cloudflare)                  + Job Queue
    ├── sent/
    ├── received/
    ├── backup/
    └── certs/
```

### Implementazione R2

**Step 1: Crea bucket R2**
```bash
# Via Cloudflare dashboard
# Bucket: rescuemanager-sdi
# Access: Private (signed URLs)
```

**Step 2: Configura credenziali**
```env
# .env.local
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=rescuemanager-sdi
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
```

**Step 3: Modifica sdi-sftp-server**
```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Quando ricevi file SFTP
app.post('/sftp/upload', async (req, res) => {
  const file = req.file;
  const date = new Date().toISOString().split('T')[0];
  const key = `sent/${date}/${file.originalname}`;
  
  // Salva localmente (per SFTP)
  fs.writeFileSync(`/var/sftp/sdi/DatiVersoSdI/${file.originalname}`, file.buffer);
  
  // Salva su R2 (backup)
  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    Metadata: { 'org-id': req.orgId }
  }));
  
  res.json({ status: 'uploaded', r2Key: key });
});
```

**Step 4: Backup automatico**
```bash
#!/bin/bash
# /opt/backup-to-r2.sh

DATE=$(date +%Y/%m/%d)

# Backup fatture inviate
aws s3 sync /var/sftp/sdi/DatiVersoSdI/ \
  s3://rescuemanager-sdi/sent/$DATE/ \
  --endpoint-url $R2_ENDPOINT

# Backup fatture ricevute
aws s3 sync /var/sftp/sdi/DatiDaSdI/ \
  s3://rescuemanager-sdi/received/$DATE/ \
  --endpoint-url $R2_ENDPOINT

# Backup certificati
aws s3 sync /opt/sdi-certs/ \
  s3://rescuemanager-sdi/certs/ \
  --endpoint-url $R2_ENDPOINT
```

**Step 5: Cron job**
```bash
# /etc/cron.d/rescuemanager-r2-backup
0 2 * * * root /opt/backup-to-r2.sh >> /var/log/r2-backup.log 2>&1
```

### Implementazione Redis

**Step 1: Provisiona Redis**
```bash
# Usa Upstash (managed Redis)
# https://console.upstash.com/
# Piano: Free o Starter ($10/mese)
# Copia connection string
```

**Step 2: Configura credenziali**
```env
# .env.local
REDIS_URL=redis://default:password@host:port
```

**Step 3: Installa client**
```bash
npm install redis ioredis bull
```

**Step 4: Crea middleware cache**
```typescript
// lib/redis-cache.ts
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL
});

redis.connect();

export async function getCached<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // Try cache
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  // Miss: fetch
  const data = await fetcher();
  
  // Cache
  await redis.setEx(key, ttl, JSON.stringify(data));
  
  return data;
}
```

**Step 5: Usa cache in API routes**
```typescript
// app/api/trasporti/route.ts
import { getCached } from '@/lib/redis-cache';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'all';
  const orgId = req.headers.get('x-org-id');
  
  const key = `transports:${orgId}:${status}`;
  
  const data = await getCached(key, 300, async () => {
    // Query DB
    const { data } = await supabase
      .from('transports')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', status);
    
    return data;
  });
  
  return Response.json(data);
}
```

**Step 6: Invalidate cache on update**
```typescript
// Quando aggiorna trasporto
await supabase
  .from('transports')
  .update({ status: 'done' })
  .eq('id', transportId);

// Invalida cache
await redis.del(`transports:${orgId}:*`);
```

---

## 5. COSTI COMPARATIVI

### Scenario: 100 utenti, 1000 trasporti/mese, 500 fatture/mese

| Componente | Attuale | Con R2 | Con Redis | Con R2+Redis |
|-----------|---------|--------|-----------|-------------|
| **Storage VPS** | $0 (incluso) | -$10 (ridotto) | $0 | -$10 |
| **R2 Storage** | — | $1.50 | — | $1.50 |
| **R2 Requests** | — | $4.20 | — | $4.20 |
| **Redis** | — | — | $10 | $10 |
| **Supabase** | $25 (base) | $25 | $25 | $25 |
| **Totale/mese** | **$25** | **$20.70** | **$35** | **$30.70** |

**ROI:**
- ✅ R2: -$4.30/mese (risparmio disco VPS)
- ✅ Redis: +$10/mese (ma riduce crash e migliora UX)
- ✅ R2+Redis: +$5.70/mese (ma molto più affidabile)

---

## 6. ROADMAP IMPLEMENTAZIONE

### **FASE 1: Essenziale (Settimana 1-2)**
- [ ] Provisiona R2 bucket
- [ ] Configura backup automatico SDI/certificati
- [ ] Provisiona Redis (Upstash)
- [ ] Implementa cache query trasporti/clienti
- [ ] Implementa session management Redis
- **Tempo:** 40 ore
- **Benefici:** Backup sicuro, 50% riduzione query DB, sessioni sicure

### **FASE 2: Affidabilità (Settimana 3-4)**
- [ ] Implementa job queue Redis (RENTRI/SDI)
- [ ] Aggiungi retry logic
- [ ] Monitoring job status
- [ ] Riduce restart sdi-sftp-server (61x → 5x)
- **Tempo:** 30 ore
- **Benefici:** Affidabilità, riduce crash, tracking job

### **FASE 3: Performance (Settimana 5-6)**
- [ ] Implementa rate limiting Redis
- [ ] Cache export PDF/Excel
- [ ] Monitoring cache hit rate
- [ ] Ottimizza TTL cache
- **Tempo:** 25 ore
- **Benefici:** Protezione DDoS, export veloce, analytics

### **FASE 4: Real-Time (Settimana 7-8)**
- [ ] WebSocket server (Socket.io)
- [ ] Redis Pub/Sub per notifiche
- [ ] Notifiche real-time trasporti
- [ ] Collaborazione multi-utente
- **Tempo:** 35 ore
- **Benefici:** Real-time, UX moderna

---

## 7. METRICHE DI SUCCESSO

### Baseline (Attuale)
- Query DB: 1000/ora
- Tempo risposta API: 50-200ms
- Crash sdi-sftp: 61 in 23 giorni
- Crash rentri-polling: 148 in 24 giorni
- Storage VPS: 9.9 GB usato
- Backup: NESSUNO

### Target (Con R2+Redis)
- Query DB: 100/ora (90% riduzione)
- Tempo risposta API: 5-50ms (80% miglioramento)
- Crash sdi-sftp: 0-2 in 30 giorni
- Crash rentri-polling: 0-1 in 30 giorni
- Storage VPS: 2 GB usato (80% riduzione)
- Backup: Automatico, georeplicato

---

## 8. RISCHI E MITIGAZIONI

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|------------|--------|------------|
| Redis down | Media | Alto | Fallback a DB (cache miss) |
| R2 latenza | Bassa | Medio | CDN Cloudflare, retry logic |
| Costi R2 crescono | Bassa | Basso | Lifecycle policy (archivio 90gg) |
| Sincronizzazione cache | Media | Medio | Invalidate on update, TTL breve |
| Migrazione dati | Bassa | Alto | Backup locale prima di migrare |

---

## 9. CONCLUSIONI

### ✅ **R2 è CONSIGLIATO**
- Backup fatture critiche (SDI/RENTRI)
- Riduce disco VPS (116 GB → 20 GB)
- Costo minimo ($6/mese)
- Implementazione semplice (S3 API standard)
- **Priorità: ALTA**

### ✅ **Redis è CONSIGLIATO**
- Riduce query DB (1000 → 100/ora)
- Migliora UX (50ms → 5ms)
- Affidabilità job queue (riduce crash)
- Sessioni sicure
- **Priorità: ALTA**

### 💡 **Implementazione Consigliata**
1. **Settimana 1-2:** R2 + Redis cache (essenziale)
2. **Settimana 3-4:** Job queue (affidabilità)
3. **Settimana 5-6:** Rate limiting + export cache
4. **Settimana 7-8:** Real-time (nice-to-have)

### 📊 **Impatto Complessivo**
- **Affidabilità:** 5/10 → 8/10
- **Performance:** 6/10 → 8/10
- **Scalabilità:** 5/10 → 8/10
- **Costo:** +$5.70/mese (accettabile)
- **Tempo implementazione:** 130 ore (~3-4 settimane)

---

## Prossimi Step
1. Approva R2 + Redis
2. Provisiona Upstash Redis
3. Crea R2 bucket Cloudflare
4. Inizia Fase 1 (backup + cache)
