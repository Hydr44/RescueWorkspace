#!/bin/bash
# Script per passare SDI in modalità TEST

VPS="root@217.154.118.37"

echo "🔄 Passaggio SDI in modalità TEST..."
echo ""

# 1. Verifica connessione VPS
echo "1️⃣  Verifica connessione VPS..."
if ! ssh -o ConnectTimeout=5 $VPS "echo 'Connesso'" 2>/dev/null; then
    echo "   ❌ Impossibile connettersi alla VPS"
    exit 1
fi
echo "   ✅ VPS connessa"
echo ""

# 2. Aggiorna variabile d'ambiente SDI_SFTP_TEST_MODE
echo "2️⃣  Aggiornamento variabile SDI_SFTP_TEST_MODE=true..."
ssh $VPS << 'ENDSSH'
# Rimuovi eventuali righe SDI_SFTP_TEST_MODE esistenti
sed -i '/^SDI_SFTP_TEST_MODE=/d' /root/.env 2>/dev/null || true

# Aggiungi SDI_SFTP_TEST_MODE=true
echo "" >> /root/.env
echo "# SDI-SFTP Test Mode" >> /root/.env
echo "SDI_SFTP_TEST_MODE=true" >> /root/.env

echo "   ✅ Variabile SDI_SFTP_TEST_MODE=true aggiunta a /root/.env"
ENDSSH
echo ""

# 3. Riavvia server SDI-SFTP con PM2
echo "3️⃣  Riavvio server SDI-SFTP..."
ssh $VPS << 'ENDSSH'
cd /opt/sdi-sftp-server

# Se il processo esiste, riavvialo
if pm2 describe sdi-sftp-server > /dev/null 2>&1; then
    pm2 restart sdi-sftp-server
    echo "   ✅ Server riavviato"
else
    # Se non esiste, avvialo
    pm2 start server.js --name sdi-sftp-server
    pm2 save
    echo "   ✅ Server avviato"
fi

# Mostra status
pm2 status sdi-sftp-server
ENDSSH
echo ""

# 4. Verifica che il server sia in modalità test
echo "4️⃣  Verifica modalità TEST..."
sleep 2
ssh $VPS << 'ENDSSH'
pm2 logs sdi-sftp-server --lines 20 --nostream | grep -i "test mode" || echo "   ⚠️  Controlla manualmente i log"
ENDSSH
echo ""

echo "✅ Completato! SDI è ora in modalità TEST"
echo ""
echo "📋 Prossimi passi:"
echo "   1. Verifica che il server sia attivo: ssh $VPS 'pm2 status'"
echo "   2. Controlla i log: ssh $VPS 'pm2 logs sdi-sftp-server --lines 50'"
echo "   3. Testa l'invio di una fattura con test_mode=true"
echo ""
