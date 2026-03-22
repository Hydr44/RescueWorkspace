#!/bin/bash
# Script di configurazione Server SFTP per SDI Sogei
# Eseguire come root sulla VPS 217.154.118.37

set -e

echo "=== CONFIGURAZIONE SFTP SERVER PER SDI SOGEI ==="
echo ""

# Colori per output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verifica utente root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}ERRORE: Questo script deve essere eseguito come root${NC}"
    exit 1
fi

echo -e "${GREEN}1. Verifica/Crea utente SFTP 'sdi'...${NC}"
if ! id "sdi" &>/dev/null; then
    echo "Creazione utente sdi..."
    useradd -m -d /var/sftp/sdi -s /usr/sbin/nologin sdi
    echo -e "${GREEN}✅ Utente 'sdi' creato${NC}"
else
    echo -e "${GREEN}✅ Utente 'sdi' già esistente${NC}"
fi

echo ""
echo -e "${GREEN}2. Creazione directory richieste da Sogei...${NC}"
mkdir -p /var/sftp/sdi/DatiDaSdI
mkdir -p /var/sftp/sdi/DatiVersoSdI
mkdir -p /var/sftp/sdi/DatiDaSdITest
mkdir -p /var/sftp/sdi/DatiVersoSdITest

echo "Impostazione permessi directory..."
chown root:root /var/sftp/sdi
chmod 755 /var/sftp/sdi

chown sdi:sdi /var/sftp/sdi/DatiDaSdI
chown sdi:sdi /var/sftp/sdi/DatiVersoSdI
chown sdi:sdi /var/sftp/sdi/DatiDaSdITest
chown sdi:sdi /var/sftp/sdi/DatiVersoSdITest

chmod 755 /var/sftp/sdi/DatiDaSdI
chmod 755 /var/sftp/sdi/DatiVersoSdI
chmod 755 /var/sftp/sdi/DatiDaSdITest
chmod 755 /var/sftp/sdi/DatiVersoSdITest

echo -e "${GREEN}✅ Directory create e permessi impostati${NC}"

echo ""
echo -e "${GREEN}3. Configurazione chiavi pubbliche SSH Sogei...${NC}"
mkdir -p /var/sftp/sdi/.ssh

# Chiavi pubbliche Sogei
cat > /var/sftp/sdi/.ssh/authorized_keys << 'EOF'
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCqsb+b6233XJcBCMRdiJV6fAeeFuim/3tLxQtU4II4DR1B7YILYCDDxgjwMJiIDqVe7r+a2HNbXcgVFdERhj1DliFqYHbfI+iXVxD6LR3AMgZULczZMRAA9m0mg52FiYxQxR7e/U/Cn+KZZN90riZAiYnvkTtLR9ibiXouZblUWJsX87oINUFz46iz9EEL5qpNjZTquU3km0lS7nEAnw6sor8X0Rm3f5bRFPS4LBbJA1ltLP9+jZBa+2C2AEfpNRtw6horQtIWWZkm9UOCh/3GqybW0/POs2hPErrF3mlewQElK1qH3gzmGsRl1neneYM4aYbGI9LDJnwRPgcCoUMr fatturazione@SFTP-SDI1-AT.srv.sogei.it
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDmTrhTE5IUERY6QskEkBcWK4W8xryv15zlIxgc/+UseGAX69P4gfC4amvs6WNAqcP1jWzjlqngm71/XqCcwFc6EYy6yrdke1xlprdQXVNOmlhx+76mFVP/tnkTaj3s1RyxQG9VcSNSaPYKdXuZwEROZykvlG8HD8ErcxReksB7nQj5+NxVsM5GLGtr8CpmdhAfBzi9NhsN6JMVUWTJh9a3aHDwpcBMxBhCr4aUVwjebJZLS0FVVcJX6p+mSkvMI4/XKrzK5vYpZyQBCWRs6xAFddgnY/CkjZhYumSkuSPiCicH3WK77h1Oy3H7gofltnG3GAXZMU0iR9m3EsWQUmPl fatturazione@SFTP-SDI2-AT.srv.sogei.it
EOF

chmod 600 /var/sftp/sdi/.ssh/authorized_keys
chown sdi:sdi /var/sftp/sdi/.ssh/authorized_keys

echo -e "${GREEN}✅ Chiavi pubbliche Sogei aggiunte${NC}"

echo ""
echo -e "${GREEN}4. Verifica configurazione SSHD...${NC}"
if grep -q "Match User sdi" /etc/ssh/sshd_config; then
    echo -e "${GREEN}✅ Configurazione chroot per utente 'sdi' già presente${NC}"
else
    echo -e "${YELLOW}⚠️  Aggiunta configurazione chroot per utente 'sdi'...${NC}"
    cat >> /etc/ssh/sshd_config << 'EOF'

# Configurazione SFTP per SDI Sogei
Match User sdi
    ChrootDirectory /var/sftp/sdi
    ForceCommand internal-sftp
    PasswordAuthentication no
    PubkeyAuthentication yes
    PermitTunnel no
    AllowAgentForwarding no
    AllowTcpForwarding no
    X11Forwarding no
EOF
    echo -e "${GREEN}✅ Configurazione aggiunta a /etc/ssh/sshd_config${NC}"
    echo -e "${YELLOW}⚠️  Riavviare SSHD per applicare modifiche: systemctl restart sshd${NC}"
fi

echo ""
echo -e "${GREEN}5. Configurazione Firewall UFW per IP Sogei...${NC}"
ufw allow from 217.175.54.31 to any port 22 proto tcp comment "Sogei SFTP Client 1 Internet"
ufw allow from 217.175.56.129 to any port 22 proto tcp comment "Sogei SFTP Client DR Internet"
ufw allow from 217.175.48.25 to any port 22 proto tcp comment "Sogei SFTP Client 1 SPC"
ufw allow from 217.175.56.25 to any port 22 proto tcp comment "Sogei SFTP Client DR SPC"
ufw reload

echo -e "${GREEN}✅ Regole firewall aggiunte${NC}"

echo ""
echo -e "${GREEN}=== CONFIGURAZIONE COMPLETATA ===${NC}"
echo ""
echo "Riepilogo:"
echo "  - Utente: sdi"
echo "  - Chroot: /var/sftp/sdi"
echo "  - Directory:"
echo "    * /DatiDaSdI (put, rename)"
echo "    * /DatiVersoSdI (get, delete)"
echo "    * /DatiDaSdITest (put, rename)"
echo "    * /DatiVersoSdITest (get, delete, sovrascrittura)"
echo "  - Chiavi SSH: 2 chiavi Sogei aggiunte"
echo "  - Firewall: 4 IP Sogei abilitati"
echo ""
echo -e "${YELLOW}Prossimi passi:${NC}"
echo "  1. Verificare configurazione: systemctl status sshd"
echo "  2. Riavviare SSHD se necessario: systemctl restart sshd"
echo "  3. Testare connessione SFTP localmente"
echo "  4. Inviare email di conferma a SDI"
echo ""

