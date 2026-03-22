#!/bin/bash
# Script completo per deploy server SDI-SFTP sulla VPS

VPS="root@217.154.118.37"
PASS="1x9Wa2eW"
SERVER_DIR="/opt/sdi-sftp-server"

echo "🚀 Deploy Server SDI-SFTP sulla VPS..."
echo ""

# 1. Crea directory
echo "1️⃣  Creazione directory..."
ssh $VPS "mkdir -p $SERVER_DIR"
echo "   ✅ Directory creata"
echo ""

# 2. Carica file server
echo "2️⃣  Caricamento file server..."
echo "   Password VPS: $PASS"
echo ""

cd "$(dirname "$0")/server-vps"

scp server.js $VPS:$SERVER_DIR/ && echo "   ✅ server.js caricato"
scp package.json $VPS:$SERVER_DIR/ && echo "   ✅ package.json caricato"
echo ""

# 3. Installazione dipendenze
echo "3️⃣  Installazione dipendenze (richiede tempo)..."
ssh $VPS "cd $SERVER_DIR && npm install"
echo "   ✅ Dipendenze installate"
echo ""

# 4. Configurazione variabili d'ambiente
echo "4️⃣  Configurazione variabili d'ambiente..."
ssh $VPS << 'ENDSSH'
cat >> /root/.env << 'EOF'

# SDI-SFTP Server
SDI_SFTP_PORT=3002
SDI_SFTP_HOST=127.0.0.1
SDI_SFTP_PORT_SFTP=22
SDI_SFTP_USERNAME=sdi
SDI_SFTP_PRIVATE_KEY=/root/.ssh/sdi_sftp_key
SDI_SFTP_TEST_MODE=true

# Certificati SDI
SDI_CERT_FIRMA_PATH=/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.firma.p12
SDI_CERT_CIFRA_PATH=/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.cifra.p12
SDI_CERT_SOGEI_PUBLIC_PATH=/opt/sdi-certs/sogeiunicocifra.pem
SDI_CERT_PASSWORD=IBVvOZqq
EOF
echo "   ✅ Variabili d'ambiente aggiunte a /root/.env"
ENDSSH
echo ""

# 5. Genera chiave SSH per utente SDI (se non esiste)
echo "5️⃣  Configurazione chiave SSH per utente SDI..."
ssh $VPS << 'ENDSSH'
if [ ! -f /root/.ssh/sdi_sftp_key ]; then
    ssh-keygen -t rsa -b 4096 -f /root/.ssh/sdi_sftp_key -N "" -q
    cat /root/.ssh/sdi_sftp_key.pub >> /var/sftp/sdi/.ssh/authorized_keys
    chmod 600 /var/sftp/sdi/.ssh/authorized_keys
    chown sdi:sdi /var/sftp/sdi/.ssh/authorized_keys
    echo "   ✅ Chiave SSH generata e aggiunta"
else
    echo "   ✅ Chiave SSH già esistente"
fi
ENDSSH
echo ""

# 6. Avvia con PM2
echo "6️⃣  Avvio server con PM2..."
ssh $VPS "cd $SERVER_DIR && pm2 start server.js --name sdi-sftp-server && pm2 save"
echo "   ✅ Server avviato"
echo ""

# 7. Test health check
echo "7️⃣  Test health check..."
sleep 2
ssh $VPS "curl -s http://localhost:3002/health" && echo ""
echo ""

echo "✅ Deploy completato!"
echo ""
echo "📝 Prossimi passi:"
echo "   1. Configurare Nginx (vedi SETUP_VPS_COMPLETO.md)"
echo "   2. Testare endpoint pubblico"
echo "   3. Perfezionare generazione XML FatturaPA"

