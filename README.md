# RescueManager

Sistema completo di gestione per demolizioni, trasporti, recupero veicoli e gestione rifiuti.

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/rescuemanager/rescuemanager.git
cd rescuemanager

# Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Install dependencies
cd website && npm install
cd ../admin-panel && npm install
cd ../desktop-app/greeting-friend-api-main && npm install

# Run locally
cd website && npm run dev
```

📖 **Per guida completa:** Vedi [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)

---

## 📦 Componenti

### Website (Next.js)
- **Tech:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Deploy:** Vercel
- **URL Production:** https://rescuemanager.eu
- **URL Staging:** https://staging.rescuemanager.eu

### Desktop App (Electron)
- **Tech:** Electron, React, Vite, SQLite
- **Platforms:** Windows, macOS, Linux
- **Features:** Offline-first, sync con cloud

### Admin Panel (Electron)
- **Tech:** Electron, React, Vite
- **Purpose:** Gestione organizzazioni, subscriptions, analytics

### VPS Services
- **Assist Server:** Gestione posizioni cliente
- **RENTRI API:** Integrazione Registro Rifiuti
- **SDI SFTP:** Fatturazione Elettronica
- **Lead API:** Gestione preventivi e conversioni
- **eBay OAuth:** Integrazione marketplace
- **RVFU Proxy:** Integrazione Registro Veicoli Fuori Uso

---

## 🌳 Branching Strategy

- **main** → Production (protetto)
- **staging** → Staging environment (protetto)
- **develop** → Development base
- **feature/*** → Nuove funzionalità
- **fix/*** → Bug fixes
- **hotfix/*** → Urgent production fixes

---

## 🗄️ Database

- **Production:** Supabase (PostgreSQL)
- **Staging:** Supabase separate project
- **Local:** Supabase local development

### Migrations
```bash
# Create migration
supabase migration new migration_name

# Apply to staging
supabase db push --db-url "$STAGING_DB_URL"

# Apply to production
supabase db push --db-url "$PRODUCTION_DB_URL"
```

---

## 🚀 Deployment

### Automatic Deployment
- Push to `staging` → Auto-deploy to staging
- Push to `main` → Auto-deploy to production

### Manual Deployment
```bash
# Website (Vercel)
cd website
vercel --prod

# VPS Services
./scripts/deploy-vps-staging.sh
```

📋 **Deployment Checklist:** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

---

## 🧪 Testing

### Smoke Tests
```bash
# Test staging
./scripts/smoke-test.sh staging

# Test production
./scripts/smoke-test.sh production
```

### Unit Tests
```bash
cd website
npm test
```

---

## 📚 Documentation

- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - Guida completa sviluppatore
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Checklist deployment
- [RAPPORTO_ARCHITETTURA_COMPLETO_2026.md](./RAPPORTO_ARCHITETTURA_COMPLETO_2026.md) - Architettura sistema
- [PIANI_E_PREZZI.md](./PIANI_E_PREZZI.md) - Modelli subscription

---

## 🔐 Environment Variables

### Required
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# JWT
JWT_SECRET=

# Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# R2 Storage
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
```

Vedi `.env.example` per lista completa.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Users & Clients                       │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
   │ Website │        │ Desktop │        │  Admin  │
   │ Next.js │        │   App   │        │  Panel  │
   └────┬────┘        └────┬────┘        └────┬────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
   │Supabase │        │   VPS   │        │   R2    │
   │   DB    │        │Services │        │ Storage │
   └─────────┘        └─────────┘        └─────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion

### Backend
- Node.js
- Express
- Supabase (PostgreSQL)
- Upstash Redis
- Cloudflare R2

### Desktop
- Electron
- React
- SQLite (local)
- Better-sqlite3

### Infrastructure
- Vercel (Website)
- VPS (API Services)
- Cloudflare (CDN, DNS, R2)
- GitHub Actions (CI/CD)

---

## 📊 Modules

- **SDI-SFTP:** Fatturazione Elettronica Sistema di Interscambio
- **RENTRI:** Registro Elettronico Tracciabilità Rifiuti
- **RVFU:** Registro Veicoli Fuori Uso (MIT)
- **Contabilità:** Prima nota e piano dei conti
- **Trasporti:** Gestione trasporti e logistica
- **Lead Management:** Preventivi e conversioni
- **Ricambi:** Gestione magazzino ricambi

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request verso `staging`

Vedi [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) per workflow completo.

---

## 📝 License

Proprietario - RescueManager © 2026

---

## 📞 Support

- **Email:** info@rescuemanager.eu
- **Website:** https://rescuemanager.eu
- **Documentation:** https://docs.rescuemanager.eu

---

## 🎯 Roadmap

### Q2 2026
- [ ] Ambiente staging completo
- [ ] CI/CD automation
- [ ] Mobile app (React Native)
- [ ] API v2 con GraphQL

### Q3 2026
- [ ] AI-powered features
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] White-label solution

---

**Built with ❤️ by RescueManager Team**
