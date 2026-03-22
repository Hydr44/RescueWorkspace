#!/bin/bash
set -e

echo "🚀 Deploying VPS Staging Services..."

# Configuration
STAGING_DIR="/opt/staging"
SERVICES=(
  "assist-server"
  "rentri-api"
  "sdi-sftp-server"
  "lead-api"
  "ebay-oauth"
  "oauth-proxy-server"
  "rentri-polling"
  "rentri-server"
  "rvfu-proxy-direct"
)

# Pull latest code
echo "📥 Pulling latest code from staging branch..."
cd $STAGING_DIR
git fetch origin
git checkout staging
git pull origin staging

# Install dependencies for each service
for service in "${SERVICES[@]}"; do
  if [ -d "$STAGING_DIR/moduli/$service" ]; then
    echo "📦 Installing dependencies for $service..."
    cd "$STAGING_DIR/moduli/$service"
    npm install --production
  else
    echo "⚠️  Service $service not found, skipping..."
  fi
done

# Restart PM2 services
echo "🔄 Restarting PM2 services..."
cd $STAGING_DIR
pm2 restart staging-ecosystem || pm2 start staging-ecosystem.config.js

# Show status
echo "📊 PM2 Status:"
pm2 list | grep staging

echo "✅ Staging deployment complete!"
echo "🌐 Services available at:"
echo "  - https://staging-assist.rescuemanager.eu"
echo "  - https://staging-rentri.rescuemanager.eu"
echo "  - https://staging-api.rescuemanager.eu"
