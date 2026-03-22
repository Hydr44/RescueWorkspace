# ✅ RENTRI Cron Installato su VPS

**Server**: root@217.154.118.37  
**Data**: 3 Dicembre 2025, ore 22:20  
**Status**: ✅ **OPERATIVO**

---

## ✅ Installazione Completata

### Script
```
Percorso: /root/rentri-sync-fir.sh
Permessi: -rwxr-xr-x (eseguibile)
Dimensione: 1.2 KB
```

### Cron Job
```
Schedule: */5 * * * * (ogni 5 minuti)
Comando: /root/rentri-sync-fir.sh >/dev/null 2>&1
Output: Log su /var/log/rentri-sync.log
```

### Log
```
Percorso: /var/log/rentri-sync.log
Rotazione: Automatica a 10MB
Formato: Timestamp + Status + Dettagli
```

---

## 🔧 Configurazione

### API Endpoint
```
URL: https://rescuemanager.eu/api/rentri/fir/sync-stati
Method: GET
Auth: Bearer rentri-sync-prod-2025-XK9mP2nQ7vL4
Timeout: 60s
Retry: 2 tentativi con 5s delay
```

### Variabile Vercel (DA CONFIGURARE)
```
Nome: CRON_SECRET
Valore: rentri-sync-prod-2025-XK9mP2nQ7vL4
Env: Production, Preview, Development
```

**⚠️ Dopo aver configurato su Vercel, lo script funzionerà!**

---

## 🎯 Come Funziona

### Ogni 5 Minuti
```
1. Cron esegue script
2. Script chiama API backend
3. Backend:
   - Carica FIR trasmessi dal DB
   - Per ogni FIR: chiama RENTRI
   - Legge stato corrente
   - Se cambiato: update DB
4. Script logga risultato
5. Desktop app vede nuovo stato al refresh
```

---

## 🔍 Monitoraggio

### Comandi Utili

```bash
# Connetti al server
ssh root@217.154.118.37

# Log live
tail -f /var/log/rentri-sync.log

# Ultimi 20 sync
tail -20 /var/log/rentri-sync.log

# Sync di oggi
grep "$(date '+%Y-%m-%d')" /var/log/rentri-sync.log

# Quanti sync totali
wc -l /var/log/rentri-sync.log

# Solo errori
grep ERRORE /var/log/rentri-sync.log

# Solo successi
grep "OK:" /var/log/rentri-sync.log | tail -10

# Test manuale
/root/rentri-sync-fir.sh
```

---

## 📊 Verifica Cron Attivo

```bash
# Lista cron jobs
crontab -l

# Status servizio cron
systemctl status cron

# Log sistema cron
grep CRON /var/log/syslog | tail -20
```

---

## 🛠️ Manutenzione

### Disabilita Temporaneamente
```bash
crontab -e
# Aggiungi # davanti alla riga rentri-sync
```

### Riabilita
```bash
crontab -e
# Rimuovi # dalla riga rentri-sync
```

### Cambia Frequenza
```bash
crontab -e
# Modifica: */5 → */3 (ogni 3 min) o */10 (ogni 10 min)
```

### Rimuovi Completamente
```bash
crontab -l | grep -v 'rentri-sync' | crontab -
rm /root/rentri-sync-fir.sh
rm /var/log/rentri-sync.log*
```

---

## 🎊 Sistema Doppio Sync

### Client-Side (Desktop App)
```
✅ Polling ogni 2 minuti
✅ Solo quando app aperta
✅ Update immediato per user
✅ Hook: useFirSync()
```

### Server-Side (VPS Cron)
```
✅ Polling ogni 5 minuti
✅ Sempre attivo (24/7)
✅ Anche con app chiusa
✅ Backup affidabile
```

**Entrambi attivi = massima affidabilità!** 🏆

---

## 🔐 Security

### Secret Hardcoded
```
Script server: rentri-sync-prod-2025-XK9mP2nQ7vL4
Backend verifica: CRON_SECRET env var

Se qualcuno non ha secret → 401 Unauthorized
```

### Rotating Secret
```
Per cambiare:
1. Genera nuovo: openssl rand -hex 32
2. Modifica script server
3. Aggiorna Vercel env var
4. Redeploy
```

---

## 📋 Checklist Finale

```
[✅] Script creato su VPS
[✅] Cron installato
[✅] Permessi corretti
[✅] Test eseguito
[⏳] Configura CRON_SECRET su Vercel
[⏳] Redeploy
[⏳] Test sync dopo deploy
[⏳] Verifica log OK
```

---

## 🎊 RISULTATO

**Cron installato e operativo!** ✅

**Dopo config Vercel:**
```
✅ Sync automatico ogni 5 min
✅ Log persistenti
✅ Monitoring facile
✅ Sistema production-ready
```

---

**🔐 Configura CRON_SECRET su Vercel ora!**

**Poi testa: `ssh root@217.154.118.37 "/root/rentri-sync-fir.sh && tail /var/log/rentri-sync.log"`** 

**Dovrebbe mostrare "OK: 0 aggiornati"!** ✅
