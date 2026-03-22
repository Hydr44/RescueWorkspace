# 📋 Endpoint da Spostare sul VPS

**Data**: 2026-01-23  
**Priorità**: Media (non critici ma riducono costi Vercel)

---

## 🔍 Endpoint Attualmente su Vercel

### 1. `/api/rentri/limiti/alert`
- **File**: `website/src/app/api/rentri/limiti/alert/route.ts`
- **Uso**: Dashboard RENTRI - mostra alert limiti rifiuti
- **Frequenza**: Bassa (solo quando si apre la dashboard)
- **Status**: ⚠️ Attualmente 404 quando chiamato da VPS

### 2. `/api/version/check`
- **File**: `website/src/app/api/version/check/route.ts`
- **Uso**: Remote Control - verifica aggiornamenti app
- **Frequenza**: Bassa (ogni 30 minuti)
- **Status**: ⚠️ Attualmente 404 quando chiamato da VPS

---

## ✅ Endpoint Già Funzionanti

### 1. `/api/monitoring/heartbeat`
- **File**: `website/src/app/api/monitoring/heartbeat/route.ts`
- **Status**: ✅ Funziona (chiamato da VPS)
- **Nota**: Probabilmente proxyato da Nginx o esiste un server sul VPS

### 2. `/api/maintenance/status`
- **File**: `website/src/app/api/maintenance/status/route.ts`
- **Status**: ✅ Funziona (chiamato da VPS)
- **Nota**: Probabilmente proxyato da Nginx o esiste un server sul VPS

---

## 🔧 Soluzione Temporanea

Gli endpoint che danno 404 sono stati configurati per puntare a Vercel (`rescuemanager.eu`) invece di VPS (`rentri-test.rescuemanager.eu`).

**File modificati**:
- `desktop-app/greeting-friend-api-main/src/pages/RifiutiDashboard.jsx`
- `desktop-app/greeting-friend-api-main/src/lib/remote-control.ts`

---

## 📝 Prossimi Passi per Spostare sul VPS

### Opzione 1: Creare Server Express sul VPS
1. Creare server Express che gestisce questi endpoint
2. Configurare Nginx per fare proxy a questo server
3. Spostare la logica da Vercel al VPS

### Opzione 2: Proxy Nginx a Vercel (temporaneo)
1. Configurare Nginx per fare proxy a Vercel per questi endpoint specifici
2. Mantenere gli altri endpoint sul VPS
3. Migrare gradualmente

### Opzione 3: Lasciare su Vercel (se frequenza bassa)
- Se la frequenza è molto bassa, potrebbe non valere la pena spostarli
- Monitorare i costi Vercel per vedere se questi endpoint generano costi significativi

---

## 📊 Impatto Costi

| Endpoint | Frequenza | Impatto Vercel |
|----------|-----------|----------------|
| `/api/rentri/limiti/alert` | Bassa (solo dashboard) | Minimo |
| `/api/version/check` | Bassa (ogni 30 min) | Minimo |
| `/api/monitoring/heartbeat` | Alta (ogni 5 min) | ✅ Già su VPS |
| `/api/maintenance/status` | Media (ogni 5 min) | ✅ Già su VPS |

---

## 🔐 Accesso VPS

- **IP**: 217.154.118.37
- **SSH Key**: `vps-sdi` (salvata in `~/.ssh/vps-sdi`)
- **Comando**: `ssh -i ~/.ssh/vps-sdi root@217.154.118.37`

---

## 📝 Note

- Gli endpoint che funzionano (heartbeat, maintenance) probabilmente sono proxyati da Nginx o esiste un server sul VPS
- Verificare la configurazione Nginx per capire come sono gestiti questi endpoint
- Gli endpoint che danno 404 devono essere creati sul VPS o proxyati a Vercel
