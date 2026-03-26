# 🔑 Credenziali Umberto - RescueManager

**Data creazione:** 23 Marzo 2026  
**Creato da:** Sign Rascozzarini

---

## 🖥️ VPS SSH Access

```
Server: 217.154.118.37
Username: umberto
Password: zpKfCzlsmBBdlLJYXKsWTw==
```

**Comando SSH:**
```bash
ssh umberto@217.154.118.37
```

**Permessi:**
- ✅ Accesso SSH completo
- ✅ Sudo (può eseguire comandi admin con `sudo`)
- ✅ Accesso PM2 (gestione servizi)
- ✅ Home directory: `/home/umberto`

**Comandi Utili:**
```bash
# Vedere tutti i servizi PM2
pm2 list

# Vedere solo servizi staging
pm2 list | grep staging

# Vedere solo servizi production
pm2 list | grep -v staging

# Vedere logs di un servizio
pm2 logs <service-name>

# Restart servizio
pm2 restart <service-name>

# Restart tutti i servizi staging
pm2 restart all | grep staging

# Vedere configurazione Nginx
sudo nano /etc/nginx/sites-available/<config-file>

# Test configurazione Nginx
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🌐 Vercel (Website Deployment)

**Come accedere:**
1. Riceverai email di invito da Vercel
2. Clicca sul link nell'email
3. Crea account Vercel (se non ce l'hai già)
4. Accetta l'invito al team

**Dopo l'accesso avrai:**
- ✅ Dashboard: https://vercel.com/dashboard
- ✅ Progetto: rescuemanager.eu (website)
- ✅ Accesso a deployments, logs, analytics
- ✅ Environment variables (se ruolo Developer)

**Ruolo assegnato:** Developer (può deployare e modificare settings)

---

## 🗄️ Supabase (Database)

### Production
```
URL: https://rvjhxnpjlqfbxzfmvmqe.supabase.co
Anon Key: [DA FORNIRE]
Service Role Key: [DA FORNIRE - SOLO SE NECESSARIO]
```

### Staging
```
URL: https://nkcnvjrspndqwqmryldc.supabase.co
Anon Key: [DA FORNIRE]
Service Role Key: [DA FORNIRE - SOLO SE NECESSARIO]
```

**Dashboard:** https://supabase.com/dashboard

---

## 🔴 Upstash Redis

### Production
```
URL: [DA FORNIRE]
Token: [DA FORNIRE]
```

### Staging
```
URL: https://central-humpback-82030.upstash.io
Token: [DA FORNIRE]
```

**Dashboard:** https://console.upstash.com

---

## 🐙 GitHub

**Repository:** rescuemanager-workspace

**Come accedere:**
1. Riceverai email di invito da GitHub
2. Accetta l'invito
3. Avrai accesso al repository

**Permesso:** Write (può pushare codice)

**Clone repository:**
```bash
git clone https://github.com/[USERNAME]/rescuemanager-workspace.git
cd rescuemanager-workspace
```

---

## ☁️ Cloudflare (DNS)

**Dominio:** rescuemanager.eu

**Come accedere:**
1. Riceverai email di invito da Cloudflare
2. Accetta l'invito
3. Avrai accesso al dominio

**Dashboard:** https://dash.cloudflare.com

**Ruolo:** [DA DEFINIRE - Administrator o DNS]

---

## 💳 Stripe (Pagamenti)

**Come accedere:**
1. Riceverai email di invito da Stripe
2. Accetta l'invito
3. Avrai accesso alla dashboard

**Dashboard:** https://dashboard.stripe.com

**Ruolo:** [DA DEFINIRE - Developer o Analyst]

---

## 📋 Servizi VPS - Porte e Domini

### Production (porte 3xxx)
- `assist-server` → porta 3100 → https://assist.rescuemanager.eu
- `rentri-api` → porta 3003 → https://rentri-test.rescuemanager.eu
- `sdi-sftp-server` → porta 3005 → https://sdi-sftp.rescuemanager.eu
- `lead-api` → porta 3006 → https://lead-api.rescuemanager.eu
- `ebay-oauth` → porta 3007
- `oauth-proxy-server` → porta 3008 → https://oauth.rescuemanager.eu
- `rentri-server` → porta 3200
- `rentri-polling` → (background job)
- `monitoring-service` → porta 3999 → http://monitoring.rescuemanager.eu

### Staging (porte 4xxx)
- `staging-assist-server` → porta 4100 → http://staging-assist.rescuemanager.eu
- `staging-rentri-api` → porta 4003 → http://staging-rentri.rescuemanager.eu
- `staging-lead-api` → porta 4006 → http://staging-lead.rescuemanager.eu
- `staging-oauth-proxy-server` → porta 4008
- `staging-api` → porta 4100 → http://staging-api.rescuemanager.eu

---

## 🔒 Sicurezza - Best Practices

1. **Cambia password VPS** al primo accesso:
   ```bash
   ssh umberto@217.154.118.37
   passwd
   ```

2. **Setup chiave SSH** (più sicuro di password):
   ```bash
   # Sul tuo Mac
   ssh-keygen -t ed25519 -C "umberto@rescuemanager.eu"
   ssh-copy-id umberto@217.154.118.37
   
   # Dopo, puoi disabilitare login con password
   ```

3. **Abilita 2FA** su tutti i servizi:
   - GitHub
   - Vercel
   - Cloudflare
   - Stripe
   - Supabase

4. **Non condividere mai:**
   - Service Role Keys di Supabase
   - Password via email/chat non sicuri
   - Chiavi private SSH

5. **Usa variabili d'ambiente** invece di hardcodare credenziali nel codice

---

## 📁 Struttura Progetto

```
rescuemanager-workspace/
├── desktop-app/              # App Electron desktop
├── website/                  # Next.js website (Vercel)
├── admin-panel/             # React SPA admin
├── RescueMobile/            # React Native mobile app
├── moduli/                  # Moduli VPS
│   ├── assist-server/
│   ├── rentri-api/
│   ├── sdi-sftp-server/
│   ├── lead-api/
│   └── ...
├── .env.staging             # Env vars staging
└── scripts/                 # Script deployment
```

---

## 🆘 Contatti

**Per supporto tecnico:**
- Sign Rascozzarini: [EMAIL/PHONE]

**Documentazione:**
- README.md nel repository
- .env.example per variabili d'ambiente
- Documentazione API in `/docs` (se presente)

---

## ⚠️ IMPORTANTE

**Questo file contiene credenziali sensibili!**

- ✅ Conserva in luogo sicuro (password manager)
- ✅ Non committare su GitHub
- ✅ Non condividere via email/chat non sicuri
- ✅ Elimina dopo aver salvato le credenziali
- ✅ Cambia password al primo accesso

---

**File creato il:** 23 Marzo 2026, 19:52  
**Versione:** 1.0
