#!/bin/bash
# Script per installare il server di upload certificati sul VPS

set -e

echo "🚀 Installazione RENTRI Certificate Upload Server su VPS..."

# Colori
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurazione
VPS_HOST="root@217.154.118.37"
INSTALL_DIR="/opt/rentri-cert-upload"
SERVICE_NAME="rentri-cert-upload"

echo -e "${BLUE}📦 1. Creazione directory sul VPS...${NC}"
ssh $VPS_HOST "mkdir -p $INSTALL_DIR"

echo -e "${BLUE}📤 2. Upload script server...${NC}"
scp cert-upload-server.js $VPS_HOST:$INSTALL_DIR/

echo -e "${BLUE}📝 3. Creazione package.json...${NC}"
ssh $VPS_HOST "cat > $INSTALL_DIR/package.json << 'EOF'
{
  \"name\": \"rentri-cert-upload\",
  \"version\": \"1.0.0\",
  \"description\": \"RENTRI Certificate Upload Server\",
  \"main\": \"cert-upload-server.js\",
  \"scripts\": {
    \"start\": \"node cert-upload-server.js\"
  },
  \"dependencies\": {
    \"express\": \"^4.18.2\",
    \"multer\": \"^1.4.5-lts.1\",
    \"cors\": \"^2.8.5\"
  }
}
EOF
"

echo -e "${BLUE}📦 4. Installazione dipendenze...${NC}"
ssh $VPS_HOST "cd $INSTALL_DIR && npm install"

echo -e "${BLUE}🔧 5. Creazione servizio systemd...${NC}"
ssh $VPS_HOST "cat > /etc/systemd/system/$SERVICE_NAME.service << 'EOF'
[Unit]
Description=RENTRI Certificate Upload Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node $INSTALL_DIR/cert-upload-server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=rentri-cert-upload

[Install]
WantedBy=multi-user.target
EOF
"

echo -e "${BLUE}🔄 6. Abilitazione e avvio servizio...${NC}"
ssh $VPS_HOST "systemctl daemon-reload"
ssh $VPS_HOST "systemctl enable $SERVICE_NAME"
ssh $VPS_HOST "systemctl restart $SERVICE_NAME"

echo -e "${BLUE}⏳ 7. Attesa avvio servizio...${NC}"
sleep 2

echo -e "${BLUE}✅ 8. Verifica stato servizio...${NC}"
ssh $VPS_HOST "systemctl status $SERVICE_NAME --no-pager -l" || true

echo -e "${BLUE}🔍 9. Test health check...${NC}"
ssh $VPS_HOST "curl -s http://localhost:3456/health" || echo "⚠️ Health check fallito (potrebbe richiedere qualche secondo)"

echo ""
echo -e "${GREEN}✅ Installazione completata!${NC}"
echo ""
echo "📍 Endpoint: http://217.154.118.37:3456/upload-cert"
echo "🔍 Health: http://217.154.118.37:3456/health"
echo ""
echo "📊 Comandi utili:"
echo "  - Stato:    ssh $VPS_HOST 'systemctl status $SERVICE_NAME'"
echo "  - Logs:     ssh $VPS_HOST 'journalctl -u $SERVICE_NAME -f'"
echo "  - Restart:  ssh $VPS_HOST 'systemctl restart $SERVICE_NAME'"
echo "  - Stop:     ssh $VPS_HOST 'systemctl stop $SERVICE_NAME'"
echo ""

