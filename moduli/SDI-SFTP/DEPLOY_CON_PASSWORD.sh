#!/bin/bash
# Deploy Server SDI-SFTP usando password

VPS="root@217.154.118.37"
PASS="1x9Wa2eW"
SERVER_DIR="/opt/sdi-sftp-server"

echo "🚀 Deploy Server SDI-SFTP..."
echo ""

# Controlla se sshpass è disponibile
if ! command -v sshpass &> /dev/null; then
    echo "⚠️  sshpass non trovato. Installazione richiesta:"
    echo "   macOS: brew install hudochenkov/sshpass/sshpass"
    echo "   Oppure esegui i comandi manualmente (vedi ISTRUZIONI_DEPLOY_VELOCE.md)"
    exit 1
fi

# 1. Carica file
echo "1️⃣  Caricamento file..."
cd "$(dirname "$0")"
sshpass -p "$PASS" scp -o StrictHostKeyChecking=no server-vps/server.js $VPS:/opt/sdi-sftp-server/
sshpass -p "$PASS" scp -o StrictHostKeyChecking=no server-vps/package.json $VPS:/opt/sdi-sftp-server/
echo "   ✅ File caricati"
echo ""

# 2. Installa e configura
echo "2️⃣  Installazione e configurazione..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no $VPS << 'ENDSSH'
cd /opt/sdi-sftp-server
npm install

# Aggiungi variabili d'ambiente
cat >> /root/.env << 'EOF'

# SDI-SFTP Server
SDI_SFTP_PORT=3002
SDI_SFTP_HOST=127.0.0.1
SDI_SFTP_PORT_SFTP=22
SDI_SFTP_USERNAME=sdi
SDI_SFTP_PRIVATE_KEY=/root/.ssh/sdi_sftp_key
SDI_SFTP_TEST_MODE=true

SDI_CERT_FIRMA_PATH=/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.firma.p12
SDI_CERT_CIFRA_PATH=/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.cifra.p12
SDI_CERT_SOGEI_PUBLIC_PATH=/opt/sdi-certs/sogeiunicocifra.pem
SDI_CERT_PASSWORD=IBVvOZqq
EOF

# Genera chiave SSH se non esiste
if [ ! -f /root/.ssh/sdi_sftp_key ]; then
    ssh-keygen -t rsa -b 4096 -f /root/.ssh/sdi_sftp_key -N "" -q
    cat /root/.ssh/sdi_sftp_key.pub >> /var/sftp/sdi/.ssh/authorized_keys
    chmod 600 /var/sftp/sdi/.ssh/authorized_keys
    chown sdi:sdi /var/sftp/sdi/.ssh/authorized_keys
    echo "Chiave SSH generata"
fi

# Avvia con PM2
pm2 start server.js --name sdi-sftp-server || pm2 restart sdi-sftp-server
pm2 save

# Test
sleep 2
curl -s http://localhost:3002/health
ENDSSH

echo ""
echo "✅ Deploy completato!"

