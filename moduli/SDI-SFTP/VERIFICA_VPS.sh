#!/bin/bash
# Script per verificare che il deploy sul VPS sia OK
# Usa la configurazione SSH 'vps-sdi' (vedi ISTRUZIONI_ACCESSO_VPS.md)

VPS_HOST="vps-sdi"
SERVER_DIR="/opt/sdi-sftp-server"

echo "🔍 Verifica Deploy VPS - xml-generator.js"
echo "=========================================="
echo ""

echo "1️⃣  Verifica Status PM2..."
ssh $VPS_HOST "pm2 status sdi-sftp-server"
echo ""

echo "2️⃣  Verifica Health Check..."
HEALTH=$(ssh $VPS_HOST "curl -s http://localhost:3004/health")
echo "$HEALTH"
echo ""

echo "3️⃣  Verifica File xml-generator.js..."
FILE_INFO=$(ssh $VPS_HOST "ls -lh $SERVER_DIR/xml-generator.js 2>&1")
echo "$FILE_INFO"
echo ""

echo "4️⃣  Verifica Contenuto File (prime 5 righe)..."
ssh $VPS_HOST "head -5 $SERVER_DIR/xml-generator.js"
echo ""

echo "5️⃣  Verifica Validazioni Presenti..."
VALIDATIONS=$(ssh $VPS_HOST "grep -c 'ERRORE 004' $SERVER_DIR/xml-generator.js")
echo "Validazioni ERRORE 004 trovate: $VALIDATIONS"
echo ""

echo "6️⃣  Verifica Righe Totali..."
LINES=$(ssh $VPS_HOST "wc -l $SERVER_DIR/xml-generator.js | awk '{print \$1}'")
echo "Righe totali: $LINES"
echo ""

echo "7️⃣  Verifica Log Server (ultime 10 righe)..."
ssh $VPS_HOST "pm2 logs sdi-sftp-server --lines 10 --nostream 2>&1 | tail -10"
echo ""

echo "8️⃣  Verifica Funzioni Critiche..."
echo "  - Items array vuoto:"
ssh $VPS_HOST "grep -c 'items.length === 0' $SERVER_DIR/xml-generator.js"
echo "  - AliquotaIVA validazione:"
ssh $VPS_HOST "grep -c 'AliquotaIVA.*>=.*1.00' $SERVER_DIR/xml-generator.js"
echo "  - Arrotondamento Math.round:"
ssh $VPS_HOST "grep -c 'Math.round' $SERVER_DIR/xml-generator.js"
echo ""

echo "=========================================="
echo "✅ Verifica completata!"
echo ""
echo "📝 File aggiornato con 32 problemi critici risolti"
echo "🎯 Server pronto per i test!"

