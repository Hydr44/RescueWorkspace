# 📋 Riepilogo: API da Migrare nella App Desktop

**Data Analisi**: 18 Gennaio 2025  
**Status**: ✅ **RENTRI già migrato alla VPS**

---

## ✅ **GIÀ MIGRATO ALLA VPS**

### **1. RENTRI - 100% Migrato** ✅
- ✅ AI Validation
- ✅ FIR (Formulari)
- ✅ Registri
- ✅ Movimenti
- ✅ Limiti
- ✅ MUD
- ✅ Sync RENTRI

**File corretti**: Tutti usano `VITE_RENTRI_API_URL` → VPS

---

### **2. SDI-SFTP - Da Verificare** ⚠️

**File**: `desktop-app/greeting-friend-api-main/src/lib/sdi.js`

**Problema**: Ancora usa `VITE_API_URL` (Vercel) invece di VPS

**Linea 38**:
```javascript
const apiUrl = import.meta.env.VITE_API_URL || 'https://rescuemanager.eu';
const endpoint = `${apiUrl}/api/sdi-sftp/send`;
```

**Dovrebbe essere**:
```javascript
const sdiSftpServerUrl = import.meta.env.VITE_SDI_SFTP_SERVER_URL || 'http://sdi-sftp.rescuemanager.eu';
const endpoint = `${sdiSftpServerUrl}/api/sdi-sftp/send`;
```

**Nota**: Secondo `SOLUZIONE_DIRETTA_VPS.md`, SDI dovrebbe già usare VPS, ma il codice mostra ancora Vercel.

**Azione**: ✅ **DA CORREGGERE**

---

## ❌ **NON MIGRARE (Mantenere su Vercel)**

### **1. Remote Control & Monitoring** ❌

**File**: `desktop-app/greeting-friend-api-main/src/lib/remote-control.ts`

**Endpoint**:
- `/api/maintenance/status` - Status manutenzione
- `/api/version/check` - Controllo versioni
- `/api/monitoring/heartbeat` - Heartbeat app

**URL**: `https://rescuemanager.eu/api` (hardcoded, Vercel)

**Motivo**: 
- Funzionalità admin
- Traffico basso (heartbeat ogni 60s)
- Costo Vercel Pro: Trascurabile

**Azione**: ❌ **NON Migrare** (OK su Vercel)

---

### **2. Assist (Sistema Assistenza)** ❌

**File**: `desktop-app/greeting-friend-api-main/src/lib/assist.js`

**Endpoint**:
- `/api/assist/create` - Crea ticket
- `/api/assist/list` - Lista ticket
- `/api/assist/update` - Aggiorna ticket
- `/api/assist/close` - Chiudi ticket

**URL**: `API.ASSIST` (probabilmente Vercel)

**Motivo**:
- Sistema interno
- Traffico molto basso
- Costo Vercel Pro: Trascurabile

**Azione**: ❌ **NON Migrare** (OK su Vercel)

---

### **3. OAuth** ❌

**File**: `desktop-app/greeting-friend-api-main/src/lib/oauth.ts`

**Endpoint**:
- `/api/auth/oauth/exchange` - Exchange OAuth code

**URL**: `https://oauth.rescuemanager.eu` (già VPS!) ✅

**Stato**: ✅ **Già sulla VPS**

**Azione**: ✅ **OK** (già VPS)

---

## ❓ **DA VERIFICARE**

### **1. Sync Generale** ❓

**File**: `desktop-app/greeting-friend-api-main/src/lib/sync.ts`

**Endpoint**:
- `/api/sync/push` - Push dati
- `/api/sync/pull` - Pull dati
- `/api/sync/status` - Status sync

**URL**: `https://rescuemanager.eu/api/sync` (hardcoded, Vercel)

**Domanda**: Questo sync è solo per RENTRI (già migrato) o per altri dati?

**Se solo RENTRI**: ✅ Già migrato (non serve)  
**Se altri dati**: ⚠️ Valutare migrazione

**Azione**: ❓ **Verificare** se usato o meno

---

### **2. API Generiche (Transports, Drivers, etc.)** ❓

**File**: `desktop-app/greeting-friend-api-main/src/lib/api.js`

**Endpoint**:
- `/api/transports` - Trasporti
- `/api/drivers` - Autisti
- `/api/notes` - Note

**URL**: `VITE_API_URL` (Vercel)

**Domanda**: Queste API passano per Vercel o sono chiamate dirette a Supabase?

**Se Supabase diretto**: ✅ Nessuna migrazione necessaria  
**Se Vercel**: ❓ Valutare migrazione (dipende da traffico)

**Azione**: ❓ **Verificare** se chiamate dirette a Supabase o passano per Vercel

---

## 🎯 **PRIORITÀ AZIONI**

### **🔴 ALTA PRIORITÀ (Da Fare Subito)**

1. **SDI-SFTP** ⚠️
   - **File**: `src/lib/sdi.js`
   - **Problema**: Usa ancora `VITE_API_URL` (Vercel)
   - **Fix**: Cambiare a `VITE_SDI_SFTP_SERVER_URL` → VPS
   - **Azione**: ✅ **Correggere ora**

---

### **🟡 MEDIA PRIORITÀ (Da Verificare)**

2. **Sync Generale** ❓
   - **File**: `src/lib/sync.ts`
   - **Verificare**: Se usato solo per RENTRI (già migrato) o altri dati
   - **Azione**: ❓ **Verificare**

3. **API Generiche** ❓
   - **File**: `src/lib/api.js`
   - **Verificare**: Se chiamate dirette a Supabase o passano per Vercel
   - **Azione**: ❓ **Verificare**

---

### **🟢 BASSA PRIORITÀ (OK così)**

4. **Remote Control** ❌
   - **File**: `src/lib/remote-control.ts`
   - **Stato**: OK su Vercel (funzionalità admin, poco traffico)
   - **Azione**: ❌ **NON Migrare**

5. **Assist** ❌
   - **File**: `src/lib/assist.js`
   - **Stato**: OK su Vercel (sistema interno, poco traffico)
   - **Azione**: ❌ **NON Migrare**

6. **OAuth** ✅
   - **File**: `src/lib/oauth.ts`
   - **Stato**: ✅ Già sulla VPS (`oauth.rescuemanager.eu`)
   - **Azione**: ✅ **OK**

---

## 📝 **AZIONI IMMEDIATE**

### **1. Correggere SDI** ✅

**File**: `desktop-app/greeting-friend-api-main/src/lib/sdi.js`

**Prima**:
```javascript
const apiUrl = import.meta.env.VITE_API_URL || 'https://rescuemanager.eu';
const endpoint = `${apiUrl}/api/sdi-sftp/send`;
```

**Dopo**:
```javascript
const sdiSftpServerUrl = import.meta.env.VITE_SDI_SFTP_SERVER_URL || 'http://sdi-sftp.rescuemanager.eu';
const endpoint = `${sdiSftpServerUrl}/api/sdi-sftp/send`;
```

---

## ✅ **RIEPILOGO FINALE**

| API | Endpoint | Stato Attuale | Migrare? | Priorità | Azione |
|-----|----------|---------------|----------|----------|--------|
| **RENTRI** | `/api/rentri/*` | ✅ VPS | ✅ Fatto | - | ✅ Già migrato |
| **SDI-SFTP** | `/api/sdi-sftp/*` | ❌ Vercel | ✅ **SÌ** | 🔴 Alta | ⚠️ **Correggere ora** |
| **OAuth** | `/api/auth/oauth/*` | ✅ VPS | ✅ Fatto | - | ✅ Già VPS |
| **Remote Control** | `/api/maintenance/*`, `/api/version/*`, `/api/monitoring/*` | Vercel | ❌ NO | - | ❌ OK così |
| **Assist** | `/api/assist/*` | Vercel | ❌ NO | - | ❌ OK così |
| **Sync** | `/api/sync/*` | Vercel | ❓ Verificare | 🟡 Media | ❓ Verificare |
| **API Generiche** | `/api/transports`, `/api/drivers`, `/api/notes` | Vercel | ❓ Verificare | 🟡 Media | ❓ Verificare |

---

## 🎯 **Conclusione**

### **✅ Da Fare Subito**
1. ⚠️ **Correggere SDI** - Cambiare da Vercel a VPS

### **❓ Da Verificare**
2. ❓ **Sync** - Verificare se usato solo per RENTRI (già migrato) o altri dati
3. ❓ **API Generiche** - Verificare se chiamate dirette a Supabase o passano per Vercel

### **✅ OK così**
4. ✅ **RENTRI** - Già migrato alla VPS
5. ✅ **OAuth** - Già sulla VPS
6. ❌ **Remote Control** - OK su Vercel (poco traffico)
7. ❌ **Assist** - OK su Vercel (poco traffico)

**Prossimo passo**: Correggere SDI per usare VPS invece di Vercel! 🎯
