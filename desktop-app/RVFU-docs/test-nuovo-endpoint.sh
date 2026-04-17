#!/bin/bash
# Test diagnostico RVFU — Nuovo endpoint con realm path
# 08/04/2026

SSO="https://ssoformazione.ilportaledeltrasporto.it/sso"
REALM="/realms/root/realms/pdtusers"
API="https://formazione.ilportaledeltrasporto.it/rvfu/sh"
USER="DETO003001"
PASS="TEST.030"
CLIENT_ID="AUTODEM.RESCUEMANAGER"
CLIENT_SECRET="e3abea315f8d7acffca73941c6a0de2197068d15"
REDIRECT="https://localhost/"
TARGET_IP="10.220.222.45"

echo "============================================================"
echo "  DIAGNOSTICA RVFU — Nuovo endpoint ACI"
echo "  $(date '+%d/%m/%Y %H:%M:%S')"
echo "============================================================"
echo ""

# --- TEST 1: VPN ---
echo "[1/7] Stato VPN"
echo "------------------------------------------------------------"
VPN_IF=$(ifconfig | grep -A1 "utun.*POINTOPOINT" | grep "inet " | tail -1)
if [ -n "$VPN_IF" ]; then
  VPN_IP=$(echo "$VPN_IF" | awk '{print $2}')
  echo "  VPN attiva: $VPN_IP"
else
  echo "  VPN NON ATTIVA"
fi
echo ""

# --- TEST 2: Route VPN ---
echo "[2/7] Route VPN per 10.220.222/24"
echo "------------------------------------------------------------"
ROUTE=$(netstat -rn 2>/dev/null | grep "10.220.222")
if [ -n "$ROUTE" ]; then
  echo "  Route trovata: $ROUTE"
else
  echo "  NESSUNA ROUTE per 10.220.222/24"
  echo "  Route 10.220.x disponibili:"
  netstat -rn 2>/dev/null | grep "10.220" | while read line; do echo "    $line"; done
fi
echo ""

# --- TEST 3: DNS ---
echo "[3/7] Risoluzione DNS"
echo "------------------------------------------------------------"
RESOLVED_IP=$(python3 -c "import socket; print(socket.gethostbyname('ssoformazione.ilportaledeltrasporto.it'))" 2>/dev/null)
echo "  ssoformazione.ilportaledeltrasporto.it -> $RESOLVED_IP"
if [ "$RESOLVED_IP" = "$TARGET_IP" ]; then
  echo "  Risolve all'IP corretto ($TARGET_IP)"
else
  echo "  IP atteso da ACI: $TARGET_IP"
  echo "  IP attuale:       $RESOLVED_IP"
  HOSTS_ENTRY=$(grep "ssoformazione" /etc/hosts 2>/dev/null)
  if [ -n "$HOSTS_ENTRY" ]; then
    echo "  Entry /etc/hosts: $HOSTS_ENTRY"
  else
    echo "  Nessuna entry in /etc/hosts"
  fi
fi
echo ""

# --- TEST 4: Raggiungibilità IP target ---
echo "[4/7] Raggiungibilita IP $TARGET_IP (porta 443)"
echo "------------------------------------------------------------"
NC_RESULT=$(nc -z -w 5 $TARGET_IP 443 2>&1 && echo "OPEN" || echo "TIMEOUT")
echo "  Porta 443: $NC_RESULT"
echo ""

# --- TEST 5: Raggiungibilità IP DNS ---
echo "[5/7] Raggiungibilita IP $RESOLVED_IP (porta 443)"
echo "------------------------------------------------------------"
NC_RESULT2=$(nc -z -w 5 $RESOLVED_IP 443 2>&1 && echo "OPEN" || echo "TIMEOUT")
echo "  Porta 443: $NC_RESULT2"
echo ""

# --- TEST 6: Nuovo endpoint (con realm) ---
echo "[6/7] Test NUOVO endpoint (con realm)"
echo "  POST $SSO/json${REALM}/authenticate"
echo "------------------------------------------------------------"
TS6=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
RESP6=$(curl -sk -w "\n__HTTP__%{http_code}__TIME__%{time_total}" --max-time 15 \
  -X POST "$SSO/json${REALM}/authenticate" \
  -H "accept-api-version: resource=2.0, protocol=1.0" \
  -H "x-openam-username: $USER" \
  -H "x-openam-password: $PASS" \
  -H "content-type: application/json" 2>&1)

BODY6=$(echo "$RESP6" | sed '$d')
META6=$(echo "$RESP6" | tail -1)
STATUS6=$(echo "$META6" | grep -o "__HTTP__[0-9]*" | sed 's/__HTTP__//')
TIME6=$(echo "$META6" | grep -o "__TIME__[0-9.]*" | sed 's/__TIME__//')

echo "  Timestamp: $TS6"
echo "  HTTP Status: ${STATUS6:-timeout}"
echo "  Tempo: ${TIME6:-n/a}s"
if [ -n "$BODY6" ]; then
  echo "  Risposta: $(echo "$BODY6" | head -3)"
fi
echo ""

# --- TEST 7: Vecchio endpoint (senza realm) ---
echo "[7/7] Test VECCHIO endpoint (senza realm)"
echo "  POST $SSO/json/authenticate"
echo "------------------------------------------------------------"
TS7=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
RESP7=$(curl -sk -w "\n__HTTP__%{http_code}__TIME__%{time_total}" --max-time 15 \
  -X POST "$SSO/json/authenticate" \
  -H "accept-api-version: resource=2.0, protocol=1.0" \
  -H "x-openam-username: $USER" \
  -H "x-openam-password: $PASS" \
  -H "content-type: application/json" 2>&1)

BODY7=$(echo "$RESP7" | sed '$d')
META7=$(echo "$RESP7" | tail -1)
STATUS7=$(echo "$META7" | grep -o "__HTTP__[0-9]*" | sed 's/__HTTP__//')
TIME7=$(echo "$META7" | grep -o "__TIME__[0-9.]*" | sed 's/__TIME__//')
TOKEN7=$(echo "$BODY7" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tokenId','')[:30]+'...')" 2>/dev/null)

echo "  Timestamp: $TS7"
echo "  HTTP Status: ${STATUS7:-timeout}"
echo "  Tempo: ${TIME7:-n/a}s"
if [ -n "$TOKEN7" ] && [ "$TOKEN7" != "..." ]; then
  echo "  tokenId: $TOKEN7"
fi
if [ -n "$BODY7" ] && [ -z "$TOKEN7" ]; then
  echo "  Risposta: $(echo "$BODY7" | head -3)"
fi
echo ""

# --- RIEPILOGO ---
echo "============================================================"
echo "  RIEPILOGO"
echo "============================================================"
echo ""
echo "  VPN:                ${VPN_IP:-NON ATTIVA}"
echo "  DNS risolve a:      ${RESOLVED_IP:-errore}"
echo "  IP target ACI:      $TARGET_IP"
echo "  IP target reach:    $NC_RESULT"
echo "  IP DNS reach:       $NC_RESULT2"
echo "  Nuovo endpoint:     HTTP ${STATUS6:-timeout}"
echo "  Vecchio endpoint:   HTTP ${STATUS7:-timeout}"
echo ""

if [ "${STATUS6:-0}" = "200" ]; then
  echo "  RISULTATO: Nuovo endpoint FUNZIONA"
elif [ "${STATUS6:-0}" = "404" ]; then
  echo "  RISULTATO: Realm non trovato sul server $RESOLVED_IP"
  echo "  Il realm esiste solo su $TARGET_IP (non raggiungibile)"
elif [ "${STATUS6:-0}" = "000" ] || [ -z "$STATUS6" ]; then
  echo "  RISULTATO: Server $TARGET_IP NON RAGGIUNGIBILE"
  echo "  La VPN non ha la route per 10.220.222.0/24"
fi
echo ""
echo "  Test completato: $(date '+%H:%M:%S')"
echo ""
