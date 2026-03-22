#!/bin/bash
# Test RVFU API - Varianti path e CDSSO sul vecchio path

echo "=========================================="
echo "RVFU API Test 2 - Path variants + CDSSO"
echo "$(date)"
echo "=========================================="

# Step 1: Authenticate
echo ""
echo "=== Authenticate ==="
AUTH_RESP=$(curl -s -X POST "https://ssoformazione.ilportaledeltrasporto.it/sso/json/authenticate" \
  -H "Content-Type: application/json" \
  -H "X-OpenAM-Username: DETO000301" \
  -H "X-OpenAM-Password: TEST.003")

TOKEN_ID=$(echo "$AUTH_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['tokenId'])" 2>/dev/null)
echo "tokenId: ${#TOKEN_ID} char"

# Step 2: Authorize + Token Exchange
AUTH_HEADERS=$(curl -s -D - -o /dev/null \
  -H "Cookie: iPlanetDirectoryPro=$TOKEN_ID" \
  "https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/authorize?scope=openid%20profile&response_type=code&client_id=AUTODEM.RESCUEMANAGER&redirect_uri=https%3A%2F%2Flocalhost%2F&state=test2&nonce=nonce2")
AUTH_CODE=$(echo "$AUTH_HEADERS" | grep -i "^Location:" | tr -d '\r' | sed 's/.*code=\([^&]*\).*/\1/')
echo "code: ${#AUTH_CODE} char"

TOKEN_RESP=$(curl -s -X POST "https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/access_token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=$AUTH_CODE" \
  -d "client_id=AUTODEM.RESCUEMANAGER" \
  -d "client_secret=e3abea315f8d7acffca73941c6a0de2197068d15" \
  -d "redirect_uri=https://localhost/")

ID_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['id_token'])" 2>/dev/null)
ACCESS_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
echo "id_token: ${#ID_TOKEN} char, access_token: ${#ACCESS_TOKEN} char"

echo ""
echo "=========================================="
echo "=== VARIANTI PATH ==="
echo "=========================================="

# Test diversi path per trovare quello giusto
PATHS=(
  "/rvfu/sh/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=FN082XY"
  "/rvfu/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=FN082XY"
  "/rvfu/sh/rest/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=FN082XY"
  "/rvfu/rest/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=FN082XY"
  "/demolitori-aci-ws/rest/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=FN082XY"
  "/rvfu/sh/cr/causali"
  "/rvfu/sh/cr/consulta/VFU"
)

for P in "${PATHS[@]}"; do
  RESP=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $ID_TOKEN" \
    -H "Accept: application/json" \
    "https://formazione.ilportaledeltrasporto.it${P}")
  echo "HTTP $RESP | $P"
done

echo ""
echo "=========================================="
echo "=== VECCHIO PATH CON CDSSO (follow redirect) ==="
echo "=========================================="

# Test: segui il CDSSO redirect del vecchio path
echo ""
echo "--- Step A: Vecchio path con cookie (segui redirect) ---"
RESP_CDSSO=$(curl -s -D /tmp/rvfu_cdsso_headers.txt -o /tmp/rvfu_cdsso_body.txt -w "%{http_code}" \
  -L \
  -b "iPlanetDirectoryPro=$TOKEN_ID" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=FN082XY")
echo "HTTP $RESP_CDSSO (con -L follow redirect + cookie + Bearer)"
echo "Body (primi 300 char): $(cat /tmp/rvfu_cdsso_body.txt | head -c 300)"

echo ""
echo "--- Step B: Vecchio path con SOLO cookie (no Bearer) + follow redirect ---"
RESP_COOKIE=$(curl -s -o /tmp/rvfu_cookie_body.txt -w "%{http_code}" \
  -L \
  -b "iPlanetDirectoryPro=$TOKEN_ID" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=FN082XY")
echo "HTTP $RESP_COOKIE (con -L follow redirect + solo cookie)"
echo "Body (primi 300 char): $(cat /tmp/rvfu_cookie_body.txt | head -c 300)"

echo ""
echo "--- Step C: Dove va il 302? ---"
LOCATION=$(curl -s -D - -o /dev/null \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=FN082XY" \
  2>&1 | grep -i "^Location:" | tr -d '\r')
echo "302 Location: $LOCATION"

echo ""
echo "=========================================="
echo "=== CONNECTIVITY TEST ==="
echo "=========================================="
echo "VPN IP: $(curl -s -o /dev/null -w '%{remote_ip}' https://formazione.ilportaledeltrasporto.it/)"
echo "Our public IP: $(curl -s ifconfig.me 2>/dev/null || echo 'N/A')"
echo "VPN interfaces: $(ifconfig 2>/dev/null | grep -E 'utun|ipsec' | head -5)"
