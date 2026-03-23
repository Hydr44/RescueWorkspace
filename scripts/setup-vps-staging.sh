#!/bin/bash

# ============================================
# VPS Staging Setup Script
# Configura ambiente staging sul VPS
# ============================================

set -e  # Exit on error

VPS_HOST="217.154.118.37"
VPS_USER="root"
STAGING_DIR="/opt/staging"
REPO_URL="https://github.com/YOUR-USERNAME/rescuemanager.git"

echo "🚀 VPS Staging Setup"
echo "===================="
echo ""
echo "Host: $VPS_HOST"
echo "Directory: $STAGING_DIR"
echo ""

# ============================================
# Step 1: Crea directory staging
# ============================================
echo "📁 Step 1: Creazione directory staging..."
ssh $VPS_USER@$VPS_HOST << 'ENDSSH'
  # Crea directory
  mkdir -p /opt/staging
  cd /opt/staging
  
  echo "✅ Directory creata: /opt/staging"
ENDSSH

# ============================================
# Step 2: Clone repository (branch staging)
# ============================================
echo ""
echo "📦 Step 2: Clone repository..."
read -p "Inserisci URL repository GitHub (default: $REPO_URL): " input_repo
REPO_URL=${input_repo:-$REPO_URL}

ssh $VPS_USER@$VPS_HOST << ENDSSH
  cd /opt/staging
  
  # Rimuovi directory esistente se presente
  if [ -d ".git" ]; then
    echo "⚠️  Repository già esistente, aggiorno..."
    git fetch origin
    git checkout staging
    git pull origin staging
  else
    echo "📥 Cloning repository..."
    git clone -b staging $REPO_URL .
  fi
  
  echo "✅ Repository clonato/aggiornato"
  git branch
ENDSSH

# ============================================
# Step 3: Copia file .env.staging
# ============================================
echo ""
echo "🔑 Step 3: Configurazione environment variables..."
echo "Copiando .env.staging sul VPS..."

scp .env.staging $VPS_USER@$VPS_HOST:$STAGING_DIR/.env.staging

echo "✅ File .env.staging copiato"

# ============================================
# Step 4: Installa dependencies
# ============================================
echo ""
echo "📦 Step 4: Installazione dependencies..."

ssh $VPS_USER@$VPS_HOST << 'ENDSSH'
  cd /opt/staging
  
  # Lista servizi
  SERVICES=(
    "moduli/assist-server"
    "moduli/rentri-api"
    "moduli/sdi-sftp-server"
    "moduli/lead-api"
    "moduli/ebay-oauth"
    "moduli/oauth-proxy-server"
    "moduli/rentri-polling"
    "moduli/rentri-server"
    "moduli/rvfu-proxy-direct"
  )
  
  for service in "${SERVICES[@]}"; do
    if [ -d "$service" ]; then
      echo "📦 Installing $service..."
      cd "/opt/staging/$service"
      npm install --production
      cd /opt/staging
    else
      echo "⚠️  Directory $service non trovata, skip..."
    fi
  done
  
  echo "✅ Dependencies installate"
ENDSSH

# ============================================
# Step 5: Copia PM2 ecosystem config
# ============================================
echo ""
echo "⚙️  Step 5: Configurazione PM2..."

ssh $VPS_USER@$VPS_HOST << 'ENDSSH'
  cd /opt/staging
  
  # Verifica che staging-ecosystem.config.js esista
  if [ -f "staging-ecosystem.config.js" ]; then
    echo "✅ PM2 ecosystem config trovato"
  else
    echo "❌ staging-ecosystem.config.js non trovato!"
    exit 1
  fi
ENDSSH

# ============================================
# Step 6: Start PM2 services
# ============================================
echo ""
echo "🚀 Step 6: Avvio servizi PM2..."

ssh $VPS_USER@$VPS_HOST << 'ENDSSH'
  cd /opt/staging
  
  # Carica environment variables
  export $(cat .env.staging | grep -v '^#' | xargs)
  
  # Start PM2 services
  pm2 start staging-ecosystem.config.js
  
  # Save PM2 config
  pm2 save
  
  # Lista servizi
  echo ""
  echo "📊 Servizi PM2 staging:"
  pm2 list | grep staging
  
  echo "✅ Servizi PM2 avviati"
ENDSSH

# ============================================
# Step 7: Configura Nginx
# ============================================
echo ""
echo "🌐 Step 7: Configurazione Nginx..."

ssh $VPS_USER@$VPS_HOST << 'ENDSSH'
  cd /opt/staging
  
  # Copia config Nginx
  if [ -f "nginx-staging-config.conf" ]; then
    cp nginx-staging-config.conf /etc/nginx/sites-available/staging-apis
    
    # Crea symlink se non esiste
    if [ ! -L "/etc/nginx/sites-enabled/staging-apis" ]; then
      ln -s /etc/nginx/sites-available/staging-apis /etc/nginx/sites-enabled/
    fi
    
    # Test config
    nginx -t
    
    # Reload Nginx
    systemctl reload nginx
    
    echo "✅ Nginx configurato"
  else
    echo "⚠️  nginx-staging-config.conf non trovato, skip..."
  fi
ENDSSH

# ============================================
# Step 8: Setup SSL certificates
# ============================================
echo ""
echo "🔒 Step 8: Setup SSL certificates..."
echo "⚠️  Questo step richiede conferma manuale"
read -p "Vuoi configurare SSL con Certbot? (y/n): " setup_ssl

if [ "$setup_ssl" = "y" ]; then
  ssh $VPS_USER@$VPS_HOST << 'ENDSSH'
    # Genera certificati per tutti i sottodomini staging
    certbot --nginx \
      -d staging-assist.rescuemanager.eu \
      -d staging-rentri.rescuemanager.eu \
      -d staging-api.rescuemanager.eu \
      -d staging-sdi.rescuemanager.eu \
      -d staging-lead.rescuemanager.eu \
      --email info@rescuemanager.eu \
      --agree-tos \
      --no-eff-email \
      --non-interactive || echo "⚠️  Certbot fallito, configura manualmente"
    
    echo "✅ SSL configurato"
ENDSSH
else
  echo "⏭️  SSL setup saltato"
fi

# ============================================
# Step 9: Test servizi
# ============================================
echo ""
echo "🧪 Step 9: Test servizi..."

ssh $VPS_USER@$VPS_HOST << 'ENDSSH'
  echo "Testing local endpoints..."
  
  # Test porte locali
  curl -s http://localhost:4100/health && echo "✅ assist-server OK" || echo "❌ assist-server FAIL"
  curl -s http://localhost:4003/health && echo "✅ rentri-api OK" || echo "❌ rentri-api FAIL"
  curl -s http://localhost:4005/health && echo "✅ sdi-sftp OK" || echo "❌ sdi-sftp FAIL"
  curl -s http://localhost:4006/health && echo "✅ lead-api OK" || echo "❌ lead-api FAIL"
ENDSSH

# ============================================
# Summary
# ============================================
echo ""
echo "═══════════════════════════════════════"
echo "✅ SETUP COMPLETATO"
echo "═══════════════════════════════════════"
echo ""
echo "📊 Verifica servizi:"
echo "  ssh $VPS_USER@$VPS_HOST 'pm2 list | grep staging'"
echo ""
echo "📝 Visualizza logs:"
echo "  ssh $VPS_USER@$VPS_HOST 'pm2 logs staging-assist-server'"
echo ""
echo "🌐 Test esterni:"
echo "  curl https://staging-assist.rescuemanager.eu/health"
echo "  curl https://staging-rentri.rescuemanager.eu/health"
echo "  curl https://staging-api.rescuemanager.eu/health"
echo ""
echo "🔄 Restart servizi:"
echo "  ssh $VPS_USER@$VPS_HOST 'pm2 restart all | grep staging'"
echo ""
echo "═══════════════════════════════════════"
