# Vercel & DNS Staging Setup

Guida per configurare Vercel environment variables e DNS per staging.

---

## 🚀 VERCEL STAGING CONFIGURATION

### Step 1: Environment Variables

1. **Vercel Dashboard** → Seleziona progetto `rescuemanager`
2. **Settings** → **Environment Variables**

### Production Environment Variables

```bash
# Supabase Production
NEXT_PUBLIC_SUPABASE_URL=https://production.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-key

# JWT Production
JWT_SECRET=production-jwt-secret-min-32-chars

# Redis Production
UPSTASH_REDIS_REST_URL=https://production-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=prod-redis-token

# R2 Production
R2_ACCOUNT_ID=account-id
R2_ACCESS_KEY_ID=prod-access-key
R2_SECRET_ACCESS_KEY=prod-secret-key
R2_BUCKET_NAME=rescuemanager-production

# VPS Production
VPS_API_BASE_URL=https://api.rescuemanager.eu
VPS_ASSIST_BASE=https://assist.rescuemanager.eu
VPS_RENTRI_BASE=https://rentri-test.rescuemanager.eu

# Environment
NEXT_PUBLIC_ENV=production
NODE_ENV=production
```

**Environment:** Production

### Preview (Staging) Environment Variables

```bash
# Supabase Staging
NEXT_PUBLIC_SUPABASE_URL=https://staging.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=staging-service-key

# JWT Staging
JWT_SECRET=staging-jwt-secret-min-32-chars

# Redis Staging
UPSTASH_REDIS_REST_URL=https://staging-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=staging-redis-token

# R2 Staging
R2_ACCOUNT_ID=account-id
R2_ACCESS_KEY_ID=staging-access-key
R2_SECRET_ACCESS_KEY=staging-secret-key
R2_BUCKET_NAME=rescuemanager-staging

# VPS Staging
VPS_API_BASE_URL=https://staging-api.rescuemanager.eu
VPS_ASSIST_BASE=https://staging-assist.rescuemanager.eu
VPS_RENTRI_BASE=https://staging-rentri.rescuemanager.eu

# Environment
NEXT_PUBLIC_ENV=staging
NODE_ENV=staging
```

**Environment:** Preview

### Step 2: Git Configuration

1. **Settings** → **Git**
2. **Production Branch:** `main`
3. **Preview Branches:** Seleziona `staging` e `develop`

### Step 3: Custom Domains (Opzionale)

**Production:**
- `rescuemanager.eu`
- `www.rescuemanager.eu`

**Staging (opzionale):**
- `staging.rescuemanager.eu`

Per aggiungere staging domain:
1. **Settings** → **Domains**
2. **Add Domain:** `staging.rescuemanager.eu`
3. **Git Branch:** `staging`

---

## 🌐 CLOUDFLARE DNS CONFIGURATION

### Step 1: Record DNS Principali

**Production:**
```
Type   Name    Content                      Proxy
A      @       76.76.21.21 (Vercel IP)     ON
CNAME  www     cname.vercel-dns.com        ON
```

**Staging (se usi custom domain):**
```
Type   Name      Content                    Proxy
CNAME  staging   cname.vercel-dns.com      OFF
```

### Step 2: VPS Services DNS

**Production:**
```
Type   Name          Target              Proxy
A      assist        217.154.118.37      OFF
A      rentri-test   217.154.118.37      OFF
A      api           217.154.118.37      OFF
```

**Staging:**
```
Type   Name              Target              Proxy
A      staging-assist    217.154.118.37      OFF
A      staging-rentri    217.154.118.37      OFF
A      staging-api       217.154.118.37      OFF
A      staging-sdi       217.154.118.37      OFF
A      staging-lead      217.154.118.37      OFF
```

### Step 3: Verifica DNS Propagation

```bash
# Check DNS resolution
dig staging.rescuemanager.eu
dig staging-assist.rescuemanager.eu
dig staging-rentri.rescuemanager.eu

# Check from different locations
nslookup staging.rescuemanager.eu 8.8.8.8
nslookup staging.rescuemanager.eu 1.1.1.1
```

Online tools:
- https://dnschecker.org
- https://www.whatsmydns.net

---

## 🧪 TEST DEPLOYMENT

### Test 1: Vercel Preview Deploy

```bash
# Locale
git checkout staging
git pull origin staging

# Fai una modifica test
echo "# Test staging deploy" >> TEST.md
git add TEST.md
git commit -m "test: verify staging deployment"
git push origin staging

# Vercel auto-deploy partirà
# Check su Vercel Dashboard → Deployments
```

### Test 2: Verifica Environment Variables

Crea endpoint test: `pages/api/test-env.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo in staging/development
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  res.json({
    env: process.env.NEXT_PUBLIC_ENV,
    nodeEnv: process.env.NODE_ENV,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    redisUrl: process.env.UPSTASH_REDIS_REST_URL?.substring(0, 30) + '...',
    r2Bucket: process.env.R2_BUCKET_NAME,
    vpsBase: process.env.VPS_API_BASE_URL,
  });
}
```

Test:
```bash
curl https://staging.rescuemanager.eu/api/test-env
# Dovrebbe mostrare env vars staging
```

### Test 3: Health Check

```bash
curl https://staging.rescuemanager.eu/api/health
```

Expected response:
```json
{
  "status": "ok",
  "environment": "staging",
  "timestamp": "2026-03-23T...",
  "services": {
    "database": { "status": "healthy" },
    "redis": { "status": "healthy" }
  }
}
```

---

## 📋 Checklist Vercel & DNS

### Vercel
- [ ] Production env vars configurate
- [ ] Preview (staging) env vars configurate
- [ ] Git branches configurate (main=prod, staging=preview)
- [ ] Custom domain staging aggiunto (opzionale)
- [ ] Test deploy su staging passato
- [ ] Environment variables verificate

### DNS
- [ ] Record A per VPS staging creati
- [ ] CNAME per staging website (se custom domain)
- [ ] DNS propagato (verificato con dig/nslookup)
- [ ] SSL certificates attivi (Vercel auto, VPS Certbot)
- [ ] Tutti i sottodomini accessibili

### Testing
- [ ] Website staging accessibile
- [ ] API staging accessibili
- [ ] Health checks passati
- [ ] Environment variables corrette
- [ ] Deploy automatico funzionante

---

## 🔧 Troubleshooting

### Vercel: "Environment variable not found"
```
1. Verifica nome esatto variabile
2. Check environment corretto (Production vs Preview)
3. Redeploy dopo aggiunta variabile
```

### DNS: "Domain not found"
```
1. Verifica record DNS creato
2. Attendi propagazione (max 48h, solitamente 5-10 min)
3. Check con dig/nslookup
4. Verifica Proxy OFF per VPS services
```

### Vercel: "Deployment failed"
```
1. Check build logs su Vercel Dashboard
2. Verifica package.json scripts
3. Check TypeScript errors
4. Verifica env vars necessarie
```

---

## 🔄 Workflow Deploy

### Staging Deploy
```bash
# 1. Crea feature branch
git checkout -b feature/new-feature

# 2. Sviluppa e testa localmente
npm run dev

# 3. Commit e push
git add .
git commit -m "feat: new feature"
git push origin feature/new-feature

# 4. Crea PR verso staging
# GitHub → New Pull Request → base: staging

# 5. Dopo merge, auto-deploy su staging
# Vercel deploy automatico

# 6. Testa su staging
curl https://staging.rescuemanager.eu
```

### Production Deploy
```bash
# 1. Staging testato e stabile

# 2. Crea PR staging → main
git checkout staging
git pull origin staging
# GitHub → New Pull Request → base: main

# 3. Review e approval

# 4. Merge in main
# Auto-deploy production

# 5. Verifica production
curl https://rescuemanager.eu/api/health
```

---

**Vercel & DNS staging configurati!** 🎉
