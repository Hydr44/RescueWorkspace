#!/bin/bash
# Script per caricare certificati SDI sulla VPS

VPS_HOST="217.154.118.37"
VPS_USER="root"
VPS_PASS="1x9Wa2eW"
CERT_DIR="/opt/sdi-certs"
SOURCE_DIR="$(dirname "$0")/Chiavi erogate con istruzioni"

echo "📦 Caricamento certificati SDI sulla VPS..."

# Verifica file certificati locali
if [ ! -f "$SOURCE_DIR/EMMAT002.SCZMNL05L21D960T.firma.p12" ]; then
    echo "❌ Errore: Certificato firma non trovato"
    exit 1
fi

if [ ! -f "$SOURCE_DIR/EMMAT002.SCZMNL05L21D960T.cifra.p12" ]; then
    echo "❌ Errore: Certificato cifra non trovato"
    exit 1
fi

if [ ! -f "$SOURCE_DIR/sogeiunicocifra.pem" ]; then
    echo "❌ Errore: Certificato pubblico Sogei non trovato"
    exit 1
fi

if [ ! -f "$SOURCE_DIR/CAEntrate.pem" ]; then
    echo "❌ Errore: Certificato CA Entrate non trovato"
    exit 1
fi

echo "✅ File certificati trovati"

# Usa sshpass per autenticazione con password
if ! command -v sshpass &> /dev/null; then
    echo "⚠️  sshpass non installato. Installazione richiesta:"
    echo "   macOS: brew install hudochenkov/sshpass/sshpass"
    echo "   Linux: sudo apt-get install sshpass"
    exit 1
fi

# Crea directory sulla VPS
echo "📁 Creazione directory certificati sulla VPS..."
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << 'ENDSSH'
mkdir -p /opt/sdi-certs
chmod 700 /opt/sdi-certs
ENDSSH

# Carica file certificati
echo "⬆️  Caricamento certificati..."
sshpass -p "$VPS_PASS" scp -o StrictHostKeyChecking=no \
    "$SOURCE_DIR/EMMAT002.SCZMNL05L21D960T.firma.p12" \
    "$SOURCE_DIR/EMMAT002.SCZMNL05L21D960T.cifra.p12" \
    "$SOURCE_DIR/sogeiunicocifra.pem" \
    "$SOURCE_DIR/CAEntrate.pem" \
    "$VPS_USER@$VPS_HOST:$CERT_DIR/"

# Imposta permessi
echo "🔒 Impostazione permessi..."
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << 'ENDSSH'
chmod 600 /opt/sdi-certs/*
chown root:root /opt/sdi-certs/*
ls -la /opt/sdi-certs/
ENDSSH

echo "✅ Certificati caricati con successo sulla VPS!"
echo ""
echo "📝 Prossimi passi:"
echo "   1. Configurare variabili d'ambiente con path certificati"
echo "   2. Testare connessione SFTP"
echo "   3. Implementare generazione XML FatturaPA completa"

