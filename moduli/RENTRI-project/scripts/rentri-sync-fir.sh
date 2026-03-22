#!/bin/bash
# RENTRI FIR Sync Script
# Sincronizza stati FIR da RENTRI ogni 5 minuti
# Installato su: root@217.154.118.37

# Configurazione
API_URL="https://rescuemanager.eu/api/rentri/fir/sync-stati"
CRON_SECRET="rentri-sync-secret-2025-change-this"  # Cambia con secret sicuro
LOG_FILE="/var/log/rentri-sync.log"
MAX_LOG_SIZE=10485760  # 10MB

# Rotazione log se troppo grande
if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null) -gt $MAX_LOG_SIZE ]; then
    mv "$LOG_FILE" "$LOG_FILE.old"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Log rotated" > "$LOG_FILE"
fi

# Log inizio
echo "$(date '+%Y-%m-%d %H:%M:%S') - [RENTRI-SYNC] Inizio sync FIR..." >> "$LOG_FILE"

# Chiamata API
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  --max-time 60 \
  --retry 2 \
  --retry-delay 5)

# Estrai HTTP code e body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

# Log risultato
if [ "$HTTP_CODE" -eq 200 ]; then
    SYNCED=$(echo "$BODY" | grep -o '"synced":[0-9]*' | cut -d':' -f2)
    ERRORS=$(echo "$BODY" | grep -o '"errors":[0-9]*' | cut -d':' -f2)
    echo "$(date '+%Y-%m-%d %H:%M:%S') - [RENTRI-SYNC] Completato: $SYNCED aggiornati, $ERRORS errori" >> "$LOG_FILE"
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') - [RENTRI-SYNC] ERRORE HTTP $HTTP_CODE: $BODY" >> "$LOG_FILE"
fi

exit 0

