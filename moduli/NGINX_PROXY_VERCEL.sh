#!/bin/bash
# Script per configurare Nginx sul VPS come proxy a Vercel per endpoint RENTRI
# Esegui questo script sulla VPS: ssh -i ~/.ssh/vps-sdi root@217.154.118.37

set -e

echo "🔧 Configurazione Nginx Proxy a Vercel per endpoint RENTRI..."

# Backup configurazione esistente
if [ -f /etc/nginx/sites-available/rentri ]; then
    cp /etc/nginx/sites-available/rentri /etc/nginx/sites-available/rentri.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup creato"
fi

# Leggi configurazione esistente
CONFIG_FILE="/etc/nginx/sites-available/rentri"

# Verifica se esiste già una location /api/rentri/fir/
if grep -q "location /api/rentri/fir/" "$CONFIG_FILE" 2>/dev/null; then
    echo "⚠️  Configurazione proxy FIR già presente, aggiornando..."
else
    echo "➕ Aggiungendo configurazione proxy..."
    
    # Trova la fine del server block per rentri-test.rescuemanager.eu
    # Aggiungi le location prima della location / finale
    
    cat >> "$CONFIG_FILE" << 'NGINX_CONFIG'

    # ==========================================
    # PROXY ENDPOINT RENTRI A VERCEL
    # Per ridurre edge requests Vercel, tutti gli endpoint passano attraverso VPS
    # ==========================================

    # Proxy endpoint FIR a Vercel
    location /api/rentri/fir/ {
        proxy_pass https://rescuemanager.eu;
        proxy_set_header Host rescuemanager.eu;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        # Timeout per operazioni lunghe (trasmissione FIR può richiedere tempo)
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer per richieste grandi
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Proxy endpoint AI Validation a Vercel
    location /api/rentri/ai-validate {
        proxy_pass https://rescuemanager.eu;
        proxy_set_header Host rescuemanager.eu;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        # Timeout lungo per IA (può richiedere 60+ secondi)
        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
        proxy_read_timeout 90s;
    }

    # Proxy endpoint limiti/alert a Vercel
    location /api/rentri/limiti/alert {
        proxy_pass https://rescuemanager.eu;
        proxy_set_header Host rescuemanager.eu;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }

    # Proxy endpoint version/check a Vercel
    location /api/version/check {
        proxy_pass https://rescuemanager.eu;
        proxy_set_header Host rescuemanager.eu;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }

NGINX_CONFIG
fi

# Verifica configurazione
echo "🔍 Verifica configurazione Nginx..."
if nginx -t; then
    echo "✅ Configurazione valida"
    
    # Ricarica Nginx
    echo "🔄 Ricarica Nginx..."
    systemctl reload nginx
    echo "✅ Nginx ricaricato"
    
    echo ""
    echo "✅ Configurazione completata!"
    echo ""
    echo "📋 Endpoint configurati:"
    echo "  - /api/rentri/fir/* → Vercel (rescuemanager.eu)"
    echo "  - /api/rentri/ai-validate → Vercel (rescuemanager.eu)"
    echo "  - /api/rentri/limiti/alert → Vercel (rescuemanager.eu)"
    echo "  - /api/version/check → Vercel (rescuemanager.eu)"
    echo ""
    echo "🧪 Test endpoint:"
    echo "  curl -k https://rentri-test.rescuemanager.eu/api/rentri/fir/trasmetti"
else
    echo "❌ Errore nella configurazione Nginx!"
    echo "Ripristina backup se necessario:"
    echo "  cp /etc/nginx/sites-available/rentri.backup.* /etc/nginx/sites-available/rentri"
    exit 1
fi
