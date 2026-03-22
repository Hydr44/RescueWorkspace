# 🚀 Installazione Cron RENTRI su VPS

**Server**: root@217.154.118.37  
**Scopo**: Sync automatico stati FIR da RENTRI ogni 5 minuti

---

## 📋 Step 1: Connettiti al Server

```bash
ssh root@217.154.118.37
```

---

## 📋 Step 2: Crea Script Sync

```bash
cat > /root/rentri-sync-fir.sh << 'EOFSCRIPT'
#!/bin/bash
# RENTRI FIR Sync Script
# Sincronizza stati FIR ogni 5 minuti

API_URL="https://rescuemanager.eu/api/rentri/fir/sync-stati"
CRON_SECRET="rentri-sync-prod-2025-XK9mP2nQ7vL4"
LOG_FILE="/var/log/rentri-sync.log"
MAX_LOG_SIZE=10485760

# Rotazione log
if [ -f "$LOG_FILE" ] && [ $(stat -c%s "$LOG_FILE" 2>/dev/null) -gt $MAX_LOG_SIZE ]; then
    mv "$LOG_FILE" "$LOG_FILE.old"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Log rotated" > "$LOG_FILE"
fi

# Log inizio
echo "$(date '+%Y-%m-%d %H:%M:%S') - [RENTRI-SYNC] Inizio..." >> "$LOG_FILE"

# Chiamata API
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  --max-time 60 \
  --retry 2 \
  --retry-delay 5 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

# Log risultato
if [ "$HTTP_CODE" -eq 200 ]; then
    SYNCED=$(echo "$BODY" | grep -o '"synced":[0-9]*' | cut -d':' -f2)
    ERRORS=$(echo "$BODY" | grep -o '"errors":[0-9]*' | cut -d':' -f2)
    echo "$(date '+%Y-%m-%d %H:%M:%S') - [RENTRI-SYNC] OK: $SYNCED aggiornati, $ERRORS errori" >> "$LOG_FILE"
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') - [RENTRI-SYNC] ERRORE HTTP $HTTP_CODE" >> "$LOG_FILE"
    echo "$BODY" >> "$LOG_FILE"
fi

exit 0
EOFSCRIPT
```

---

## 📋 Step 3: Rendi Eseguibile

```bash
chmod +x /root/rentri-sync-fir.sh
ls -lh /root/rentri-sync-fir.sh
```

**Output atteso**: `-rwxr-xr-x 1 root root ... rentri-sync-fir.sh`

---

## 📋 Step 4: Test Manuale

```bash
# Test esecuzione
/root/rentri-sync-fir.sh

# Controlla log
tail -10 /var/log/rentri-sync.log
```

**Dovrebbe mostrare**:
```
2025-12-03 20:20:00 - [RENTRI-SYNC] Inizio...
2025-12-03 20:20:01 - [RENTRI-SYNC] OK: 0 aggiornati, 0 errori
```

---

## 📋 Step 5: Installa Cron Job

```bash
# Backup crontab esistente
crontab -l > /root/crontab.backup.$(date +%Y%m%d)

# Aggiungi cron (ogni 5 minuti)
(crontab -l 2>/dev/null | grep -v 'rentri-sync'; echo '# RENTRI FIR Sync - ogni 5 minuti'; echo '*/5 * * * * /root/rentri-sync-fir.sh >/dev/null 2>&1') | crontab -

# Verifica installazione
crontab -l | grep rentri
```

**Output atteso**:
```
# RENTRI FIR Sync - ogni 5 minuti
*/5 * * * * /root/rentri-sync-fir.sh >/dev/null 2>&1
```

---

## 📋 Step 6: Configura Secret su Vercel

```
1. Vai su: https://vercel.com/dashboard
2. Seleziona progetto: rescuemanager
3. Settings → Environment Variables
4. Aggiungi:
   Nome: CRON_SECRET
   Valore: rentri-sync-prod-2025-XK9mP2nQ7vL4
5. Redeploy
```

---

## 🔍 Verifica Funzionamento

### Dopo 5 Minuti

```bash
# Controlla log
tail -20 /var/log/rentri-sync.log

# Dovrebbe mostrare:
# 2025-12-03 20:20:00 - [RENTRI-SYNC] Inizio...
# 2025-12-03 20:20:01 - [RENTRI-SYNC] OK: 0 aggiornati, 0 errori
# 2025-12-03 20:25:00 - [RENTRI-SYNC] Inizio...
# 2025-12-03 20:25:01 - [RENTRI-SYNC] OK: 0 aggiornati, 0 errori
```

### Controlla Cron Attivo

```bash
# Verifica servizio cron
systemctl status cron

# Lista job
crontab -l

# Log sistema cron
tail -20 /var/log/syslog | grep CRON
```

---

## 🛠️ Comandi Utili

### Visualizza Log Live
```bash
tail -f /var/log/rentri-sync.log
```

### Test Manuale
```bash
/root/rentri-sync-fir.sh
```

### Disabilita Temporaneamente
```bash
# Commenta riga nel crontab
crontab -e
# Aggiungi # davanti alla riga rentri-sync
```

### Rimuovi Cron
```bash
crontab -l | grep -v 'rentri-sync' | crontab -
```

---

## 🎯 Vantaggi Cron su Server

```
✅ Funziona anche con app chiusa
✅ Centralizzato e affidabile
✅ Log persistenti
✅ Nessun limite Vercel
✅ Indipendente da client
✅ Professionale
```

---

## 📊 Monitoraggio

### Controlla Sync Giornaliero
```bash
# Quante volte ha girato oggi?
grep "$(date '+%Y-%m-%d')" /var/log/rentri-sync.log | wc -l

# Ultimi successi
grep "OK:" /var/log/rentri-sync.log | tail -10

# Ultimi errori
grep "ERRORE" /var/log/rentri-sync.log | tail -10
```

---

## ⚙️ Configurazione Avanzata

### Cambio Frequenza
```bash
# Ogni 3 minuti
*/3 * * * * /root/rentri-sync-fir.sh

# Ogni 10 minuti
*/10 * * * * /root/rentri-sync-fir.sh

# Ogni ora
0 * * * * /root/rentri-sync-fir.sh
```

### Alert Email su Errori
```bash
# Installa mailutils
apt-get install -y mailutils

# Modifica script per inviare email su errori
```

---

## 🎊 Riepilogo

**Script creato**: `/root/rentri-sync-fir.sh`  
**Log**: `/var/log/rentri-sync.log`  
**Cron**: Ogni 5 minuti  
**Secret**: `rentri-sync-prod-2025-XK9mP2nQ7vL4`

---

## ✅ Esegui Questi Comandi Sul Server

```bash
ssh root@217.154.118.37

# Copia tutto il blocco Step 2 (creazione script)
# Poi esegui Step 3, 4, 5

# Fatto! ✅
```

---

**📋 Guida completa salvata in**: `RENTRI-project/INSTALL_CRON_VPS.md`

**Eseguila manualmente sul server, io non ho permessi SSH!** 🔧

