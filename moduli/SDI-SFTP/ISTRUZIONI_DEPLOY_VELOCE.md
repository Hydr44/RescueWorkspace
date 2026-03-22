# Deploy Rapido Server SDI-SFTP

## ⚡ Comandi da Eseguire (Copia e Incolla)

Esegui questi comandi **in ordine** nel tuo terminale:

```bash
# Vai nella directory
cd /Users/sign.rascozzarini/Projects/rescuemanager-workspace/moduli/SDI-SFTP

# 1. Carica file
scp server-vps/server.js root@217.154.118.37:/opt/sdi-sftp-server/
scp server-vps/package.json root@217.154.118.37:/opt/sdi-sftp-server/
# Password: 1x9Wa2eW

# 2. Installa e configura (unico comando SSH)
ssh root@217.154.118.37 << 'ENDSSH'
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
fi

# Avvia con PM2
pm2 start server.js --name sdi-sftp-server
pm2 save

# Test
curl http://localhost:3002/health
ENDSSH
# Password: 1x9Wa2eW
```

## ✅ Verifica

Dopo aver eseguito i comandi, verifica:

```bash
ssh root@217.154.118.37 "pm2 status | grep sdi-sftp"
ssh root@217.154.118.37 "curl http://localhost:3002/health"
```

Dovresti vedere:
- Server `sdi-sftp-server` in esecuzione
- Risposta `{"status":"ok","service":"sdi-sftp-server","port":3002}`

