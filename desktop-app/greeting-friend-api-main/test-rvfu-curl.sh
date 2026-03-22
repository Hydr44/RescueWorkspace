#!/bin/bash
# Test RVFU API - Flusso completo OAuth2 + API call

echo "=========================================="
echo "RVFU API Test - $(date)"
echo "=========================================="

# Step 1: Authenticate
echo ""
echo "=== STEP 1: Authenticate ==="
AUTH_RESP=$(curl -s -X POST "https://ssoformazione.ilportaledeltrasporto.it/sso/json/authenticate" \
  -H "Content-Type: application/json" \
  -H "X-OpenAM-Username: DETO003001" \
  -H "X-OpenAM-Password: TEST.030")

TOKEN_ID=$(echo "$AUTH_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['tokenId'])" 2>/dev/null)
if [ -z "$TOKEN_ID" ]; then
  echo "ERRORE: authenticate fallito"
  echo "$AUTH_RESP"
  exit 1
fi
echo "OK - tokenId length: ${#TOKEN_ID}"

# Step 2: Authorize (GET)
echo ""
echo "=== STEP 2: Authorize ==="
AUTH_HEADERS=$(curl -s -D - -o /dev/null \
  -H "Cookie: iPlanetDirectoryPro=$TOKEN_ID" \
  "https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/authorize?scope=openid%20profile&response_type=code&client_id=AUTODEM.RESCUEMANAGER&redirect_uri=https%3A%2F%2Flocalhost%2F&state=test123&nonce=nonce123")

HTTP_CODE=$(echo "$AUTH_HEADERS" | grep "^HTTP" | awk '{print $2}')
LOCATION=$(echo "$AUTH_HEADERS" | grep -i "^Location:" | tr -d '\r')
AUTH_CODE=$(echo "$LOCATION" | sed 's/.*code=\([^&]*\).*/\1/')

if [ -z "$AUTH_CODE" ]; then
  echo "ERRORE: authorize fallito (HTTP $HTTP_CODE)"
  echo "$AUTH_HEADERS"
  exit 1
fi
echo "OK - HTTP $HTTP_CODE - code length: ${#AUTH_CODE}"

# Step 3: Token Exchange
echo ""
echo "=== STEP 3: Token Exchange ==="
TOKEN_RESP=$(curl -s -X POST "https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/access_token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=$AUTH_CODE" \
  -d "client_id=AUTODEM.RESCUEMANAGER" \
  -d "client_secret=e3abea315f8d7acffca73941c6a0de2197068d15" \
  -d "redirect_uri=https://localhost/")

ID_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['id_token'])" 2>/dev/null)
ACCESS_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

if [ -z "$ID_TOKEN" ]; then
  echo "ERRORE: token exchange fallito"
  echo "$TOKEN_RESP"
  exit 1
fi
echo "OK - id_token length: ${#ID_TOKEN}, access_token length: ${#ACCESS_TOKEN}"

# Step 4: API Calls - MATRICE COMPLETA
echo ""
echo "=========================================="
echo "=== STEP 4: API Calls - MATRICE TEST ==="
echo "=========================================="

API_URL="https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA076AJ"

echo ""
echo "--- TEST 1: id_token (JWT) senza cookie ---"
RESP1=$(curl -s -D /tmp/rvfu_test1_headers.txt -o /tmp/rvfu_test1_body.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Accept: application/json" \
  "$API_URL")
echo "HTTP $RESP1 | Body: $(cat /tmp/rvfu_test1_body.txt | head -1)"

echo ""
echo "--- TEST 2: access_token (opaque) senza cookie ---"
RESP2=$(curl -s -D /tmp/rvfu_test2_headers.txt -o /tmp/rvfu_test2_body.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "$API_URL")
echo "HTTP $RESP2 | Body: $(cat /tmp/rvfu_test2_body.txt | head -1)"

echo ""
echo "--- TEST 3: id_token + cookie iPlanetDirectoryPro ---"
RESP3=$(curl -s -D /tmp/rvfu_test3_headers.txt -o /tmp/rvfu_test3_body.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Cookie: iPlanetDirectoryPro=$TOKEN_ID" \
  -H "Accept: application/json" \
  "$API_URL")
echo "HTTP $RESP3 | Body: $(cat /tmp/rvfu_test3_body.txt | head -1)"

echo ""
echo "--- TEST 4: SOLO cookie iPlanetDirectoryPro, NO Bearer ---"
RESP4=$(curl -s -D /tmp/rvfu_test4_headers.txt -o /tmp/rvfu_test4_body.txt -w "%{http_code}" \
  -H "Cookie: iPlanetDirectoryPro=$TOKEN_ID" \
  -H "Accept: application/json" \
  "$API_URL")
echo "HTTP $RESP4 | Body: $(cat /tmp/rvfu_test4_body.txt | head -1)"

echo ""
echo "--- TEST 5: access_token + cookie ---"
RESP5=$(curl -s -D /tmp/rvfu_test5_headers.txt -o /tmp/rvfu_test5_body.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Cookie: iPlanetDirectoryPro=$TOKEN_ID" \
  -H "Accept: application/json" \
  "$API_URL")
echo "HTTP $RESP5 | Body: $(cat /tmp/rvfu_test5_body.txt | head -1)"

echo ""
echo "--- TEST 6: endpoint /cr/consulta/VFU con id_token ---"
RESP6=$(curl -s -o /tmp/rvfu_test6_body.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/consulta/VFU")
echo "HTTP $RESP6 | Body: $(cat /tmp/rvfu_test6_body.txt | head -c 200)"

echo ""
echo "--- TEST 7: endpoint /cr/causali con id_token ---"
RESP7=$(curl -s -o /tmp/rvfu_test7_body.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali")
echo "HTTP $RESP7 | Body: $(cat /tmp/rvfu_test7_body.txt | head -c 200)"

echo ""
echo "--- TEST 8: vecchio path /demolitori-aci-ws/rest/cr/veicolo ---"
RESP8=$(curl -s -o /tmp/rvfu_test8_body.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=FN082XY")
echo "HTTP $RESP8 | Body: $(cat /tmp/rvfu_test8_body.txt | head -c 200)"

echo ""
echo "=========================================="
echo "=== RIEPILOGO ==="
echo "=========================================="
echo "Test 1 (id_token, no cookie):        HTTP $RESP1"
echo "Test 2 (access_token, no cookie):    HTTP $RESP2"
echo "Test 3 (id_token + cookie):          HTTP $RESP3"
echo "Test 4 (solo cookie, no Bearer):     HTTP $RESP4"
echo "Test 5 (access_token + cookie):      HTTP $RESP5"
echo "Test 6 (/cr/consulta/VFU):           HTTP $RESP6"
echo "Test 7 (/cr/causali):                HTTP $RESP7"
echo "Test 8 (vecchio path):               HTTP $RESP8"
echo ""
echo "IP remoto: $(curl -s -o /dev/null -w '%{remote_ip}' https://formazione.ilportaledeltrasporto.it/)"
echo "VPN attiva: $(ifconfig | grep -c 'utun'> /dev/null && echo 'Sì' || echo 'No')"
