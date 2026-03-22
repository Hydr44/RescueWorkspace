#!/bin/bash
# Script per aggiornare xml-generator.js sul VPS e riavviare il server
# Usa la configurazione SSH 'vps-sdi' (vedi ISTRUZIONI_ACCESSO_VPS.md)

VPS_HOST="vps-sdi"
SERVER_DIR="/opt/sdi-sftp-server"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Aggiornamento xml-generator.js sul VPS..."
echo ""

# Copia file aggiornato
echo "1️⃣  Caricamento xml-generator.js aggiornato..."
cd "$SCRIPT_DIR/server-vps"

scp xml-generator.js $VPS_HOST:$SERVER_DIR/xml-generator.js

if [ $? -eq 0 ]; then
    echo "   ✅ xml-generator.js caricato con successo"
else
    echo "   ❌ Errore nel caricamento"
    exit 1
fi

echo ""

# Riavvia server PM2
echo "2️⃣  Riavvio server SDI-SFTP..."
ssh $VPS_HOST "cd $SERVER_DIR && pm2 restart sdi-sftp-server"

if [ $? -eq 0 ]; then
    echo "   ✅ Server riavviato con successo"
else
    echo "   ❌ Errore nel riavvio"
    exit 1
fi

echo ""

# Verifica status
echo "3️⃣  Verifica status server..."
sleep 2
ssh $VPS_HOST "pm2 status sdi-sftp-server && echo '' && curl -s http://localhost:3004/health"

echo ""
echo "✅ Aggiornamento completato!"
echo ""
echo "📝 Server pronto per i test!"

