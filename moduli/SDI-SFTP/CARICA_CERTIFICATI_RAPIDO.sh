#!/bin/bash
# Script rapido per caricare certificati - da eseguire manualmente

VPS="root@217.154.118.37"
PASS="1x9Wa2eW"
CERT_DIR="Chiavi erogate con istruzioni"

echo "📦 Caricamento certificati SDI sulla VPS..."
echo ""

# Crea directory
echo "1️⃣  Creazione directory /opt/sdi-certs..."
ssh $VPS "mkdir -p /opt/sdi-certs && chmod 700 /opt/sdi-certs"
echo "   ✅ Directory creata"
echo ""

# Carica file (ti chiederà la password: 1x9Wa2eW)
echo "2️⃣  Caricamento file certificati..."
echo "   Password VPS: $PASS"
echo ""

scp "$CERT_DIR/EMMAT002.SCZMNL05L21D960T.firma.p12" $VPS:/opt/sdi-certs/ && echo "   ✅ Firma caricato"
scp "$CERT_DIR/EMMAT002.SCZMNL05L21D960T.cifra.p12" $VPS:/opt/sdi-certs/ && echo "   ✅ Cifra caricato"
scp "$CERT_DIR/sogeiunicocifra.pem" $VPS:/opt/sdi-certs/ && echo "   ✅ Sogei public caricato"
scp "$CERT_DIR/CAEntrate.pem" $VPS:/opt/sdi-certs/ && echo "   ✅ CA Entrate caricato"
echo ""

# Permessi
echo "3️⃣  Impostazione permessi..."
ssh $VPS "chmod 600 /opt/sdi-certs/* && chown root:root /opt/sdi-certs/*"
echo "   ✅ Permessi impostati"
echo ""

# Verifica
echo "4️⃣  Verifica finale..."
ssh $VPS "ls -la /opt/sdi-certs/"
echo ""
echo "✅ Certificati caricati con successo!"
echo ""
echo "📝 Password certificati: IBVvOZqq"

