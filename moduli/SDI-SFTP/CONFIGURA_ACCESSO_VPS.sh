#!/bin/bash
# Script per configurare accesso SSH permanente al VPS SDI-SFTP
# Eseguire questo script per dare accesso permanente alla VPS

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SSH_DIR="$HOME/.ssh"
SSH_KEY_SOURCE="$SCRIPT_DIR/id_ed25519"
SSH_KEY_TARGET="$SSH_DIR/id_ed25519_vps_sdi"
SSH_CONFIG="$SSH_DIR/config"

echo "🔑 Configurazione accesso SSH permanente al VPS SDI-SFTP"
echo ""

# Verifica che la chiave sorgente esista
if [ ! -f "$SSH_KEY_SOURCE" ]; then
    echo "❌ Chiave SSH sorgente non trovata: $SSH_KEY_SOURCE"
    exit 1
fi

# Crea directory .ssh se non esiste
if [ ! -d "$SSH_DIR" ]; then
    echo "📁 Creazione directory .ssh..."
    mkdir -p "$SSH_DIR"
    chmod 700 "$SSH_DIR"
fi

# Copia la chiave
echo "1️⃣  Copia chiave SSH in ~/.ssh/id_ed25519_vps_sdi..."
cp "$SSH_KEY_SOURCE" "$SSH_KEY_TARGET"
chmod 600 "$SSH_KEY_TARGET"
echo "   ✅ Chiave copiata e permessi impostati"

# Aggiorna SSH config
echo ""
echo "2️⃣  Aggiornamento ~/.ssh/config..."

# Backup del config esistente
if [ -f "$SSH_CONFIG" ]; then
    cp "$SSH_CONFIG" "$SSH_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
    echo "   📋 Backup config esistente creato"
fi

# Verifica se la configurazione esiste già
if grep -q "Host vps-sdi" "$SSH_CONFIG" 2>/dev/null; then
    echo "   ⚠️  Configurazione 'vps-sdi' già presente, aggiornando..."
    # Rimuovi la configurazione esistente
    sed -i.bak '/^Host vps-sdi$/,/^$/d' "$SSH_CONFIG" 2>/dev/null || true
fi

# Aggiungi la configurazione
cat >> "$SSH_CONFIG" << 'EOF'

# VPS SDI-SFTP Server
Host vps-sdi
  HostName 217.154.118.37
  User root
  IdentityFile ~/.ssh/id_ed25519_vps_sdi
  IdentitiesOnly yes
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null
EOF

chmod 600 "$SSH_CONFIG"
echo "   ✅ Config aggiornato"

# Test connessione
echo ""
echo "3️⃣  Test connessione al VPS..."
if ssh -o ConnectTimeout=5 vps-sdi "echo 'Connessione OK'" 2>/dev/null; then
    echo "   ✅ Connessione testata con successo!"
else
    echo "   ⚠️  Connessione non riuscita (normale se è la prima volta)"
    echo "   ℹ️  La configurazione è comunque stata completata"
fi

echo ""
echo "✅ Configurazione completata!"
echo ""
echo "📝 Ora puoi usare:"
echo "   ssh vps-sdi"
echo ""
echo "📋 O negli script:"
echo "   ssh vps-sdi 'comando'"
echo "   scp file vps-sdi:/percorso/destinazione"
echo ""

