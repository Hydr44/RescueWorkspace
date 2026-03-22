#!/bin/bash

# Script per configurare Reverse Proxy OAuth sulla VPS
# Eseguire come root sulla VPS: ssh root@217.154.118.37

set -e

echo "🔧 Configurazione Reverse Proxy OAuth sulla VPS"
echo "================================================"

# Opzione scelta (1 = sottodominio, 2 = dominio principale)
OPTION=${1:-2}

if [ "$OPTION" = "1" ]; then
    echo "📌 Opzione 1: Sottodominio oauth.rescuemanager.eu"
    SERVER_NAME="oauth.rescuemanager.eu"
    CONFIG_FILE="/etc/nginx/sites-available/oauth-proxy"
    
    # Crea configurazione
    cat > "$CONFIG_FILE" << 'NGINX_EOF'
server {
    listen 80;
    server_name oauth.rescuemanager.eu;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name oauth.rescuemanager.eu;

    ssl_certificate /etc/letsencrypt/live/oauth.rescuemanager.eu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/oauth.rescuemanager.eu/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location /api/auth/oauth/desktop {
        proxy_pass https://rescuemanager.eu;
        proxy_http_version 1.1;
        proxy_set_header Host rescuemanager.eu;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_buffering off;
    }

    location /auth/oauth/desktop {
        proxy_pass https://rescuemanager.eu;
        proxy_http_version 1.1;
        proxy_set_header Host rescuemanager.eu;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_buffering off;
    }
}
NGINX_EOF

    # Abilita sito
    ln -sf "$CONFIG_FILE" /etc/nginx/sites-enabled/
    
    echo "✅ Configurazione creata: $CONFIG_FILE"
    echo "⚠️  IMPORTANTE: Configura DNS A record: oauth.rescuemanager.eu → 217.154.118.37"
    echo "⚠️  Poi esegui: certbot --nginx -d oauth.rescuemanager.eu"
    
else
    echo "📌 Opzione 2: Usa dominio principale rescuemanager.eu"
    
    # Trova file configurazione esistente
    CONFIG_FILE=""
    if [ -f "/etc/nginx/sites-available/rescuemanager" ]; then
        CONFIG_FILE="/etc/nginx/sites-available/rescuemanager"
    elif [ -f "/etc/nginx/sites-available/default" ]; then
        CONFIG_FILE="/etc/nginx/sites-available/default"
    else
        echo "❌ Errore: Non trovo configurazione nginx esistente"
        echo "Crea manualmente la configurazione o usa Opzione 1"
        exit 1
    fi
    
    echo "📝 Aggiungo location a: $CONFIG_FILE"
    
    # Backup
    cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Aggiungi location se non esiste già
    if ! grep -q "location /api/auth/oauth/desktop" "$CONFIG_FILE"; then
        # Trova il server block e aggiungi location
        sed -i '/server {/,/^}/ {
            /^}/ i\
    location /api/auth/oauth/desktop {\
        proxy_pass https://rescuemanager.eu;\
        proxy_http_version 1.1;\
        proxy_set_header Host rescuemanager.eu;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
        proxy_buffering off;\
    }\
\
    location /auth/oauth/desktop {\
        proxy_pass https://rescuemanager.eu;\
        proxy_http_version 1.1;\
        proxy_set_header Host rescuemanager.eu;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
        proxy_buffering off;\
    }
        }' "$CONFIG_FILE"
        
        echo "✅ Location aggiunte a $CONFIG_FILE"
    else
        echo "⚠️  Location già presente in $CONFIG_FILE"
    fi
fi

# Verifica configurazione
echo ""
echo "🔍 Verifica configurazione nginx..."
if nginx -t; then
    echo "✅ Configurazione valida!"
    echo ""
    echo "🔄 Ricarico nginx..."
    systemctl reload nginx
    echo "✅ Nginx ricaricato!"
else
    echo "❌ Errore nella configurazione nginx!"
    echo "Ripristina backup se necessario"
    exit 1
fi

echo ""
echo "✅ Configurazione completata!"
echo ""
echo "🧪 Test:"
echo "curl 'https://rescuemanager.eu/api/auth/oauth/desktop?app_id=desktop_app&redirect_uri=http://localhost:3001/auth/callback&state=test'"
echo ""
echo "Se vedi HTML redirect, funziona! 🎉"
