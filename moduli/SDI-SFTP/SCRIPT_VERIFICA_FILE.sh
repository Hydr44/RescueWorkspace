#!/bin/bash
# Script per verificare file SDI caricato

FILENAME="FI.02166430856.2026013.1502.921.zip"
DIR_TEST="/var/sftp/sdi/DatiVersoSdITest"
DIR_ESITI="/var/sftp/sdi/DatiDaSdITest"

echo "🔍 Verifica File SDI: $FILENAME"
echo "=========================================="
echo ""

# Verifica file presente
echo "1️⃣  Verifica file presente..."
if ssh vps-sdi "test -f $DIR_TEST/$FILENAME"; then
    echo "   ✅ File presente"
    ssh vps-sdi "ls -lh $DIR_TEST/$FILENAME"
else
    echo "   ⚠️  File non presente (potrebbe essere stato prelevato da SDI)"
fi
echo ""

# Verifica formato
echo "2️⃣  Verifica formato file..."
ssh vps-sdi "file $DIR_TEST/$FILENAME 2>/dev/null"
echo ""

# Verifica header
echo "3️⃣  Verifica header (primi 16 bytes)..."
ssh vps-sdi "head -c 16 $DIR_TEST/$FILENAME 2>/dev/null | od -A x -t x1z -v | head -1"
echo ""

# Verifica semaforo
echo "4️⃣  Verifica semaforo..."
ssh vps-sdi "cat $DIR_TEST/semaforodaSogei.log 2>/dev/null && echo ''"
echo "   Timestamp: $(ssh vps-sdi "stat -c '%y' $DIR_TEST/semaforodaSogei.log 2>/dev/null")"
echo ""

# Verifica file esiti
echo "5️⃣  Verifica file esiti SDI..."
echo "   File EO/ER presenti:"
ssh vps-sdi "ls -lht $DIR_ESITI/ 2>/dev/null | grep -E 'EO\.02166430856\.2026013\.1502\.921|ER\.02166430856\.2026013\.1502\.921' | head -3"
echo ""

# Verifica ultimo accesso file
echo "6️⃣  Ultimo accesso file (SDI potrebbe averlo letto)..."
ssh vps-sdi "stat -c 'Access: %x' $DIR_TEST/$FILENAME 2>/dev/null || echo 'File non presente'"
echo ""

echo "=========================================="
echo "✅ Verifica completata!"
echo ""
echo "📝 Note:"
echo "   - Il file è cifrato (PKCS#7), non può essere estratto localmente"
echo "   - SDI processerà il file in 5-30 minuti"
echo "   - Verificare file EO in $DIR_ESITI/"

