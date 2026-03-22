# RescueManager - Developer Guide

Guida completa per sviluppatori che lavorano su RescueManager.

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/rescuemanager/rescuemanager.git
cd rescuemanager
```

### 2. Setup Environment
```bash
# Copy environment variables template
cp .env.example .env.local

# Fill in your local development credentials
# Edit .env.local with your Supabase, Redis, R2 credentials
```

### 3. Install Dependencies
```bash
# Website (Next.js)
cd website
npm install

# Admin Panel (Electron)
cd ../admin-panel
npm install

# Desktop App (Electron)
cd ../desktop-app/greeting-friend-api-main
npm install
```

### 4. Run Locally
```bash
# Website
cd website
npm run dev
# → http://localhost:3000

# Admin Panel
cd admin-panel
npm run dev
# → Electron app opens

# Desktop App
cd desktop-app/greeting-friend-api-main
npm run dev
# → Electron app opens
```

---

## 🌳 Git Workflow

### Branch Strategy
- **main** → Production (protetto)
- **staging** → Staging environment (protetto)
- **develop** → Development base
- **feature/*** → Nuove funzionalità
- **fix/*** → Bug fix
- **hotfix/*** → Fix urgenti per production

### Workflow Standard

#### 1. Crea Feature Branch
```bash
# Assicurati di essere aggiornato
git checkout develop
git pull origin develop

# Crea branch per la tua feature
git checkout -b feature/nome-feature
```

#### 2. Sviluppa e Testa
```bash
# Fai le tue modifiche
# Testa localmente

# Commit frequenti con messaggi chiari
git add .
git commit -m "feat: descrizione feature"
```

#### 3. Push e Pull Request
```bash
# Push del branch
git push origin feature/nome-feature

# Vai su GitHub e crea Pull Request verso staging
# Titolo: feat: Nome Feature
# Descrizione: Cosa fa, come testare, screenshot se UI
```

#### 4. Code Review
- Aspetta review da almeno 1 altro developer
- Risolvi commenti e richieste di modifica
- Aggiorna il branch se necessario

#### 5. Merge in Staging
```bash
# Dopo approvazione, merge in staging
# GitHub → Merge Pull Request

# Il deploy automatico su staging partirà
```

#### 6. Test su Staging
- Testa la feature su https://staging.rescuemanager.eu
- Verifica che tutto funzioni correttamente
- Se ci sono problemi, fix e ripeti

#### 7. Release in Production
```bash
# Quando staging è stabile, crea PR staging → main
git checkout staging
git pull origin staging
git checkout -b release/v1.x.x

# Crea PR verso main
# Dopo approvazione e merge, deploy automatico in production
```

---

## 📝 Commit Message Convention

Usa [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types:
- **feat**: Nuova funzionalità
- **fix**: Bug fix
- **docs**: Documentazione
- **style**: Formattazione, missing semicolons, etc.
- **refactor**: Refactoring codice
- **test**: Aggiunta test
- **chore**: Manutenzione, dipendenze, etc.

### Esempi:
```bash
git commit -m "feat(rentri): aggiungi validazione formulario"
git commit -m "fix(auth): correggi logout non funzionante"
git commit -m "docs: aggiorna README con setup Redis"
git commit -m "refactor(api): estrai logica email in utility"
```

---

## 🏗️ Struttura Progetto

```
rescuemanager-workspace/
├── website/                    # Next.js website (Vercel)
│   ├── src/
│   │   ├── app/               # App router
│   │   ├── components/        # React components
│   │   └── lib/               # Utilities
│   └── package.json
│
├── admin-panel/               # Electron admin app
│   ├── src/
│   ├── electron/
│   └── package.json
│
├── desktop-app/               # Electron desktop app
│   └── greeting-friend-api-main/
│       ├── src/
│       ├── electron/
│       └── package.json
│
├── moduli/                    # Moduli specifici
│   ├── SDI-SFTP/             # Fatturazione elettronica
│   ├── RENTRI/               # Registro rifiuti
│   ├── demolizioni/          # RVFU
│   └── lead-api/             # Lead management
│
├── supabase/                  # Database migrations
│   └── migrations/
│
├── .github/                   # CI/CD workflows
│   └── workflows/
│
└── docs/                      # Documentazione
```

---

## 🌍 Ambienti

### Local Development
- **URL:** http://localhost:3000
- **Database:** Supabase staging o locale
- **Redis:** Upstash staging o locale
- **Storage:** R2 staging

### Staging
- **URL:** https://staging.rescuemanager.eu
- **Database:** Supabase staging project
- **Redis:** Upstash staging database
- **Storage:** R2 bucket staging
- **Deploy:** Automatico su push a `staging` branch

### Production
- **URL:** https://rescuemanager.eu
- **Database:** Supabase production project
- **Redis:** Upstash production database
- **Storage:** R2 bucket production
- **Deploy:** Automatico su push a `main` branch

---

## 🗄️ Database

### Supabase Setup Locale
```bash
# Installa Supabase CLI
npm install -g supabase

# Login
supabase login

# Link al progetto staging
supabase link --project-ref your-staging-project-ref

# Pull schema
supabase db pull

# Run migrations
supabase db push
```

### Creare Nuova Migrazione
```bash
# Crea file migrazione
supabase migration new nome_migrazione

# Edita il file in supabase/migrations/
# Scrivi SQL per la migrazione

# Testa localmente
supabase db reset

# Push a staging
supabase db push --db-url "postgresql://staging..."

# Dopo test, push a production
supabase db push --db-url "postgresql://production..."
```

---

## 🧪 Testing

### Unit Tests
```bash
# Website
cd website
npm test

# Desktop App
cd desktop-app/greeting-friend-api-main
npm test
```

### E2E Tests
```bash
# Playwright (se configurato)
cd website
npm run test:e2e
```

### Manual Testing Checklist
Prima di creare PR, testa:
- [ ] Funzionalità principale funziona
- [ ] Nessun errore in console
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Accessibilità (keyboard navigation, screen reader)
- [ ] Performance (no lag, caricamenti rapidi)

---

## 🔧 Troubleshooting

### Problema: npm install fallisce
```bash
# Pulisci cache
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Problema: Supabase connection error
```bash
# Verifica env variables
cat .env.local | grep SUPABASE

# Testa connessione
curl https://your-project.supabase.co/rest/v1/
```

### Problema: Electron app non parte
```bash
# Rebuild native modules
cd desktop-app/greeting-friend-api-main
npm run postinstall
```

### Problema: Build fallisce
```bash
# Verifica TypeScript errors
npm run build

# Fix errors uno alla volta
# Usa // @ts-ignore solo se necessario
```

---

## 📚 Risorse Utili

### Documentazione Tecnica
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Electron Docs](https://www.electronjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Documentazione Interna
- `RAPPORTO_ARCHITETTURA_COMPLETO_2026.md` - Architettura sistema
- `PIANI_E_PREZZI.md` - Modelli subscription
- `moduli/*/README.md` - Documentazione moduli specifici

### API Endpoints
- **Website API:** `/api/*` (Next.js API routes)
- **VPS Services:** Vedi `moduli/*/README.md`

---

## 🤝 Code Style

### TypeScript/JavaScript
```typescript
// Use TypeScript strict mode
// Prefer const over let
// Use arrow functions
// Destructure when possible

// ✅ Good
const fetchUser = async (id: string): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

// ❌ Bad
function fetchUser(id) {
  return supabase.from('users').select('*').eq('id', id).single();
}
```

### React Components
```tsx
// Use functional components
// Use hooks
// Prefer named exports
// Add TypeScript types

// ✅ Good
interface UserCardProps {
  user: User;
  onEdit: (id: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onEdit }) => {
  return (
    <div className="card">
      <h3>{user.name}</h3>
      <button onClick={() => onEdit(user.id)}>Edit</button>
    </div>
  );
};

// ❌ Bad
export default function UserCard(props) {
  return <div>{props.user.name}</div>;
}
```

### CSS/Tailwind
```tsx
// Use Tailwind utility classes
// Group by category (layout, spacing, colors, etc.)
// Use custom classes for repeated patterns

// ✅ Good
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">

// ❌ Bad
<div style={{ display: 'flex', padding: '16px' }}>
```

---

## 🚨 Cosa NON Fare

### ❌ Non committare:
- File `.env` con credenziali reali
- `node_modules/`
- File di build (`dist/`, `.next/`)
- Certificati o chiavi private
- File temporanei o log

### ❌ Non pushare direttamente su:
- `main` branch
- `staging` branch
- Sempre usa Pull Request

### ❌ Non fare:
- Commit con messaggi vaghi ("fix", "update", "wip")
- Modifiche massive senza PR
- Deploy in production senza test su staging
- Hardcode credenziali o secrets
- Disabilitare TypeScript strict mode

---

## 📞 Supporto

### Hai problemi?
1. Controlla questa guida
2. Cerca in documentazione interna
3. Chiedi nel canale Slack #dev
4. Crea issue su GitHub se è un bug

### Vuoi proporre miglioramenti?
1. Discuti nel canale Slack #dev
2. Crea issue su GitHub con label "enhancement"
3. Se approvato, crea PR con implementazione

---

## 🎯 Checklist Onboarding

Per nuovi sviluppatori:

- [ ] Accesso GitHub repository
- [ ] Accesso Supabase staging project
- [ ] Accesso Vercel dashboard
- [ ] Accesso VPS (se necessario)
- [ ] Setup ambiente locale funzionante
- [ ] Primo commit e PR di test
- [ ] Review di questa guida
- [ ] Lettura architettura sistema
- [ ] Introduzione al team

---

**Benvenuto nel team RescueManager! 🚀**

Per domande: info@rescuemanager.eu
