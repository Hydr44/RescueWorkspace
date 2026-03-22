#!/bin/bash

# Script di deploy automatico per eBay OAuth Server su VPS

set -e

VPS_HOST="root@217.154.118.37"
VPS_PATH="/opt/ebay-oauth"
LOCAL_PATH="."

echo "🚀 Deploy eBay OAuth Server su VPS..."

# 1. Copia file sul VPS
echo "📦 Copiando file sul VPS..."
ssh $VPS_HOST "mkdir -p $VPS_PATH"
scp server.js package.json $VPS_HOST:$VPS_PATH/

# 2. Installa dipendenze
echo "📥 Installando dipendenze..."
ssh $VPS_HOST "cd $VPS_PATH && npm install --production"

# 3. Verifica .env
echo "🔍 Verificando configurazione .env..."
ssh $VPS_HOST "test -f $VPS_PATH/.env || echo '⚠️  ATTENZIONE: File .env non trovato! Crealo manualmente.'"

# 4. Riavvia servizio PM2
echo "🔄 Riavviando servizio PM2..."
ssh $VPS_HOST "pm2 restart ebay-oauth || pm2 start $VPS_PATH/server.js --name ebay-oauth"
ssh $VPS_HOST "pm2 save"

# 5. Test health endpoint
echo "🏥 Testando health endpoint..."
sleep 2
curl -f https://api.rescuemanager.eu/api/ebay/health || echo "⚠️  Health check fallito"

echo "✅ Deploy completato!"
echo ""
echo "📋 Prossimi passi:"
echo "1. Verifica .env su VPS: ssh $VPS_HOST 'cat $VPS_PATH/.env'"
echo "2. Controlla logs: ssh $VPS_HOST 'pm2 logs ebay-oauth'"
echo "3. Testa OAuth: https://api.rescuemanager.eu/api/ebay/auth/start?org_id=TEST"
