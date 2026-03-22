# Cloudflare R2 & Upstash Redis Staging Setup

Guida per configurare storage e cache per ambiente staging.

---

## 📦 CLOUDFLARE R2 STAGING

### Step 1: Crea Bucket Staging

1. **Cloudflare Dashboard** → **R2**
2. Click **Create bucket**
3. **Bucket name:** `rescuemanager-staging`
4. **Location:** Automatic (o stessa di production)
5. Click **Create bucket**

### Step 2: Configura CORS

Stesso CORS di production per consistency:

```json
[
  {
    "AllowedOrigins": [
      "https://staging.rescuemanager.eu",
      "http://localhost:3000"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### Step 3: Genera Access Keys

1. **R2** → **Manage R2 API Tokens**
2. **Create API token**
3. **Token name:** `rescuemanager-staging`
4. **Permissions:** Object Read & Write
5. **Bucket:** `rescuemanager-staging` only
6. Click **Create API token**

Salva credenziali:
```bash
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=staging-access-key-id
R2_SECRET_ACCESS_KEY=staging-secret-access-key
R2_BUCKET_NAME=rescuemanager-staging
```

### Step 4: Test Upload

```javascript
// scripts/test-r2-staging.js
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function testR2() {
  console.log('🧪 Testing R2 Staging...');
  
  // Upload test file
  const uploadParams = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: 'test/test-file.txt',
    Body: 'Hello from staging!',
  };
  
  await s3.send(new PutObjectCommand(uploadParams));
  console.log('✅ Upload successful');
  
  // Download test file
  const downloadParams = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: 'test/test-file.txt',
  };
  
  const response = await s3.send(new GetObjectCommand(downloadParams));
  const body = await response.Body.transformToString();
  console.log('✅ Download successful:', body);
}

testR2();
```

---

## 🔴 UPSTASH REDIS STAGING

### Step 1: Crea Database Staging

1. **Upstash Console** → https://console.upstash.com
2. Click **Create Database**
3. Compila:
   - **Name:** `rescuemanager-staging`
   - **Type:** Regional (più economico)
   - **Region:** Stessa di production per latency
   - **TLS:** Enabled
   - **Eviction:** No eviction (o allkeys-lru se necessario)
4. Click **Create**

### Step 2: Copia Credenziali

Dopo creazione:

```bash
UPSTASH_REDIS_REST_URL=https://your-staging-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-staging-token
```

### Step 3: Test Connessione

```javascript
// scripts/test-redis-staging.js
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function testRedis() {
  console.log('🧪 Testing Redis Staging...');
  
  // Set test key
  await redis.set('test:staging', 'Hello Redis!');
  console.log('✅ SET successful');
  
  // Get test key
  const value = await redis.get('test:staging');
  console.log('✅ GET successful:', value);
  
  // Test expiration
  await redis.setex('test:expire', 60, 'Expires in 60s');
  console.log('✅ SETEX successful');
  
  // Test increment
  await redis.incr('test:counter');
  const counter = await redis.get('test:counter');
  console.log('✅ INCR successful:', counter);
  
  console.log('✅ All Redis tests passed!');
}

testRedis();
```

### Step 4: Configura Rate Limiting Keys

Struttura keys identica a production:

```
rate_limit:ip:{ip_address}
rate_limit:user:{user_id}
session:{session_id}
cache:transport:{id}
cache:lead:{id}
```

---

## 🔐 Environment Variables

### .env.staging

```bash
# R2 Storage Staging
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=staging-access-key
R2_SECRET_ACCESS_KEY=staging-secret-key
R2_BUCKET_NAME=rescuemanager-staging
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# Upstash Redis Staging
UPSTASH_REDIS_REST_URL=https://staging-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=staging-token
```

### GitHub Secrets

Aggiungi in **Settings** → **Secrets**:

```
STAGING_R2_ACCOUNT_ID
STAGING_R2_ACCESS_KEY_ID
STAGING_R2_SECRET_ACCESS_KEY
STAGING_UPSTASH_REDIS_REST_URL
STAGING_UPSTASH_REDIS_REST_TOKEN
```

### Vercel Environment Variables

**Preview (staging branch):**
- `R2_ACCOUNT_ID` = staging account
- `R2_ACCESS_KEY_ID` = staging key
- `R2_SECRET_ACCESS_KEY` = staging secret
- `R2_BUCKET_NAME` = rescuemanager-staging
- `UPSTASH_REDIS_REST_URL` = staging URL
- `UPSTASH_REDIS_REST_TOKEN` = staging token

---

## 🧪 Test Completo

```javascript
// scripts/test-storage-cache-staging.js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Redis } from '@upstash/redis';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function testAll() {
  console.log('🧪 Testing Storage & Cache Staging...\n');
  
  // Test 1: R2 Upload
  console.log('Test 1: R2 Upload');
  const uploadParams = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: `test/${Date.now()}.txt`,
    Body: 'Test file from staging',
  };
  await s3.send(new PutObjectCommand(uploadParams));
  console.log('✅ R2 upload successful\n');
  
  // Test 2: Redis Cache
  console.log('Test 2: Redis Cache');
  const cacheKey = `test:${Date.now()}`;
  await redis.set(cacheKey, { test: true, timestamp: Date.now() });
  const cached = await redis.get(cacheKey);
  console.log('✅ Redis cache successful:', cached, '\n');
  
  // Test 3: Rate Limiting
  console.log('Test 3: Rate Limiting');
  const rateLimitKey = `rate_limit:test:${Date.now()}`;
  await redis.incr(rateLimitKey);
  await redis.expire(rateLimitKey, 60);
  const count = await redis.get(rateLimitKey);
  console.log('✅ Rate limiting successful, count:', count, '\n');
  
  console.log('🎉 All tests passed!');
}

testAll();
```

Run:
```bash
node scripts/test-storage-cache-staging.js
```

---

## 💰 Costi

### Cloudflare R2
- **Storage:** $0.015/GB/month
- **Class A operations:** $4.50/million
- **Class B operations:** $0.36/million
- **Egress:** FREE

**Staging stimato:** ~$0.50/month (pochi GB)

### Upstash Redis
- **Free Tier:**
  - 10,000 commands/day
  - 256 MB storage
  - TLS enabled
- **Pay-as-you-go:** $0.20/100K commands

**Staging:** FREE (sotto 10K commands/day)

**Totale:** ~$0.50/month

---

## 📊 Monitoring

### R2 Dashboard
- **Storage usage:** Monitora GB usati
- **Requests:** Controlla operazioni
- **Bandwidth:** Verifica egress

### Upstash Dashboard
- **Commands/day:** Controlla sotto limite free
- **Storage:** Monitora MB usati
- **Latency:** Verifica performance

---

## 🔄 Manutenzione

### Settimanale
- [ ] Pulisci file test vecchi in R2
- [ ] Verifica Redis commands usage
- [ ] Check storage costs

### Mensile
- [ ] Review R2 storage usage
- [ ] Cleanup cache keys non usate
- [ ] Verifica performance

---

## 🔧 Troubleshooting

### R2: "Access Denied"
```bash
# Verifica access key e secret
# Controlla bucket name corretto
# Verifica permissions token
```

### Redis: "Connection timeout"
```bash
# Verifica URL e token corretti
# Check firewall/network
# Verifica TLS enabled
```

### R2: "Bucket not found"
```bash
# Verifica bucket name esatto
# Check account ID corretto
# Verifica endpoint URL
```

---

## ✅ Checklist Setup

- [ ] R2 bucket staging creato
- [ ] R2 CORS configurato
- [ ] R2 access keys generate
- [ ] Redis database staging creato
- [ ] Redis credenziali salvate
- [ ] Environment variables configurate
- [ ] GitHub Secrets aggiunti
- [ ] Vercel env vars configurate
- [ ] Test R2 upload passato
- [ ] Test Redis cache passato
- [ ] Test completo passato

---

**Storage & Cache staging pronti!** 🎉
