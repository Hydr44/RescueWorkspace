# 📋 Analisi: API da Migrare dalla App Desktop alla VPS

**Data Analisi**: 18 Gennaio 2025  
**Obiettivo**: Identificare tutte le API usate dalla app desktop che ancora usano Vercel

---

## ✅ **RENTRI - Già Migrato** ✅

Tutte le chiamate RENTRI ora usano `VITE_RENTRI_API_URL` → VPS:
- ✅ AI Validation
- ✅ FIR (Formulari)
- ✅ Registri
- ✅ Movimenti
- ✅ Limiti
- ✅ MUD
- ✅ Sync

---

## 🔍 **API che ancora usano Vercel**

### **1. Remote Control & Monitoring** ⚠️ **PRIORITÀ MEDIA**

**File**: `desktop-app/greeting-friend-api-main/src/lib/remote-control.ts`

**Endpoint usati**:
- `GET /api/maintenance/status` - Status manutenzione
- `GET /api/version/check` - Controllo versioni
- `POST /api/monitoring/heartbeat` - Heartbeat app

**URL attuale**: `https://rescuemanager.eu/api` (hardcoded)

**Da migrare a VPS?**: ⚠️ **Forse NO**
- **Motivo**: Queste API sono usate solo per controllo remoto da admin
- **Frequenza**: Bassa (heartbeat ogni 60s, status ogni 30s)
- **Costo Vercel Pro**: Basso (entro limiti)
- **Raccomandazione**: **Mantenere su Vercel** (poco traffico, funzionalità admin)

---

### **2. SDI-SFTP** ✅ **Già sulla VPS**

**File**: `desktop-app/greeting-friend-api-main/src/lib/sdi.js`

**Endpoint usato**:
- `POST /api/sdi-sftp/send` - Invio fatture SDI

**Stato**: ✅ **Già migrato a VPS** (`sdi-sftp.rescuemanager.eu`)

**Note**: Secondo `SOLUZIONE_DIRETTA_VPS.md`, SDI già usa VPS direttamente.

---

### **3. Sync (Generale)** ⚠️ **PRIORITÀ BASSA**

**File**: `desktop-app/greeting-friend-api-main/src/lib/sync.ts`

**Endpoint usati**:
- `POST /api/sync/push` - Push dati
- `POST /api/sync/pull` - Pull dati
- `GET /api/sync/status` - Status sync

**URL attuale**: Probabilmente `VITE_API_URL` (Vercel)

**Da migrare a VPS?**: ⚠️ **Forse NO**
- **Motivo**: Sync generale (non RENTRI) potrebbe essere usato per altri dati
- **Frequenza**: Media (al login, periodicamente)
- **Raccomandazione**: **Verificare uso** - se solo per RENTRI, già migrato; se per altri dati, valutare

---

### **4. Assist (Sistema Assistenza)** ⚠️ **PRIORITÀ BASSA**

**File**: `desktop-app/greeting-friend-api-main/src/lib/assist.js`

**Endpoint usati**:
- `POST /api/assist/create` - Crea ticket assistenza
- `GET /api/assist/list` - Lista ticket
- `PUT /api/assist/update` - Aggiorna ticket
- `POST /api/assist/close` - Chiudi ticket

**URL attuale**: Probabilmente `VITE_API_URL` (Vercel)

**Da migrare a VPS?**: ⚠️ **Forse NO**
- **Motivo**: Sistema assistenza interno (basso traffico)
- **Frequenza**: Bassa (solo quando utente crea ticket)
- **Costo Vercel Pro**: Molto basso
- **Raccomandazione**: **Mantenere su Vercel** (funzionalità interna, poco traffico)

---

### **5. OAuth** ⚠️ **PRIORITÀ BASSA**

**File**: `desktop-app/greeting-friend-api-main/src/lib/oauth.ts`

**Endpoint usati**:
- `GET /api/auth/oauth/exchange` - Exchange OAuth code
- Altri endpoint OAuth

**URL attuale**: Probabilmente `VITE_API_URL` (Vercel) o `oauth.rescuemanager.eu`

**Da migrare a VPS?**: ⚠️ **Forse NO**
- **Motivo**: OAuth è critico per autenticazione, meglio tenerlo su Vercel (affidabile)
- **Frequenza**: Media (al login)
- **Raccomandazione**: **Mantenere su Vercel** (sicurezza, affidabilità)

---

### **6. API Generiche (Transport, Drivers, etc.)** ❓ **DA VERIFICARE**

**File**: `desktop-app/greeting-friend-api-main/src/lib/api.js`

**Endpoint usati**:
- `GET /api/transports` - Lista trasporti
- `POST /api/transports` - Crea trasporto
- `PATCH /api/transports/{id}` - Aggiorna trasporto
- `GET /api/drivers` - Lista autisti
- `GET /api/notes` - Note
- `PUT /api/notes` - Salva note

**URL attuale**: `VITE_API_URL` (Vercel)

**Da migrare a VPS?**: ❓ **DA VERIFICARE**
- **Motivo**: Queste API potrebbero essere gestite da Supabase direttamente
- **Frequenza**: Alta (operazioni quotidiane)
- **Costo Vercel Pro**: Medio (con 100 aziende)
- **Raccomandazione**: **Verificare** se queste API passano per Vercel o sono chiamate dirette a Supabase

---

## 📊 **Riepilogo**

| Categoria | Endpoint | URL Attuale | Migrare? | Priorità | Motivo |
|-----------|----------|-------------|----------|----------|--------|
| **RENTRI** | `/api/rentri/*` | VPS ✅ | ✅ Fatto | - | Già migrato |
| **SDI** | `/api/sdi-sftp/*` | VPS ✅ | ✅ Fatto | - | Già sulla VPS |
| **Remote Control** | `/api/maintenance/*`, `/api/version/*`, `/api/monitoring/*` | Vercel | ❌ NO | - | Funzionalità admin, poco traffico |
| **Sync** | `/api/sync/*` | Vercel | ⚠️ Verificare | Bassa | Verificare se solo RENTRI o altro |
| **Assist** | `/api/assist/*` | Vercel | ❌ NO | - | Sistema interno, poco traffico |
| **OAuth** | `/api/auth/oauth/*` | Vercel | ❌ NO | - | Critico, meglio Vercel |
| **API Generiche** | `/api/transports`, `/api/drivers`, `/api/notes` | Vercel | ❓ Verificare | Media | Verificare se passano per Vercel o Supabase diretto |

---

## ✅ **Raccomandazioni**

### **✅ NON Migrare** (Mantenere su Vercel)

1. **Remote Control** (`/api/maintenance/*`, `/api/version/*`, `/api/monitoring/*`)
   - Funzionalità admin
   - Traffico basso (heartbeat ogni 60s)
   - Costo Vercel Pro: Bassissimo

2. **Assist** (`/api/assist/*`)
   - Sistema interno
   - Traffico molto basso
   - Costo Vercel Pro: Trascurabile

3. **OAuth** (`/api/auth/oauth/*`)
   - Critico per sicurezza
   - Vercel più affidabile per autenticazione
   - Traffico medio (solo al login)

### **❓ Verificare**

1. **Sync** (`/api/sync/*`)
   - Verificare se usato solo per RENTRI (già migrato) o per altri dati
   - Se solo RENTRI → ✅ Già migrato
   - Se altri dati → Valutare migrazione

2. **API Generiche** (`/api/transports`, `/api/drivers`, etc.)
   - Verificare se queste API passano per Vercel o sono chiamate dirette a Supabase
   - Se Supabase diretto → ✅ Nessuna migrazione necessaria
   - Se Vercel → Valutare migrazione (dipende da traffico)

---

## 🎯 **Conclusione**

### **✅ Già Migrato (100%)**
- ✅ **RENTRI** - Tutte le API migrate alla VPS
- ✅ **SDI** - Già sulla VPS

### **❌ NON Migrare (Mantenere su Vercel)**
- ❌ **Remote Control** - Funzionalità admin, poco traffico
- ❌ **Assist** - Sistema interno, poco traffico
- ❌ **OAuth** - Critico, meglio Vercel

### **❓ Verificare**
- ❓ **Sync** - Verificare se solo RENTRI (già migrato) o altro
- ❓ **API Generiche** - Verificare se passano per Vercel o Supabase diretto

---

## 📝 **Prossimi Passi**

1. **Verificare Sync**: Controllare `src/lib/sync.ts` per vedere se usa solo RENTRI o altri dati
2. **Verificare API Generiche**: Controllare `src/lib/api.js` per vedere se chiama Vercel o Supabase diretto
3. **Se necessario**: Migrare solo se il traffico è alto e i costi Vercel sono elevati

**Per ora, RENTRI e SDI sono già sulla VPS. Le altre API possono rimanere su Vercel Pro senza problemi!** ✅
