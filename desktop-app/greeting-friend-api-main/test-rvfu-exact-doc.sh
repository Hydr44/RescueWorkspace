#!/bin/bash
# Test RVFU - Flusso ESATTO come da documentazione ACI sezione 5.3
# Differenze rispetto ai test precedenti:
# 1. /authenticate con Accept-API-Version header
# 2. /authorize è POST (non GET) con csrf e decision=allow
# 3. redirect_uri = https://localhost/ (come da tabella sezione 5.2)

echo "=========================================="
echo "RVFU EXACT DOC FLOW - $(date)"
echo "=========================================="

# ============================================================
# STEP 1: AUTHENTICATE (sezione 5.3.1)
# ============================================================
echo ""
echo "=== STEP 1: POST /authenticate (con Accept-API-Version) ==="

AUTH_RESP=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "X-OpenAM-Username: DETO003001" \
  -H "X-OpenAM-Password: TEST.030" \
  -H "Accept-API-Version: resource=2.0, protocol=1.0" \
  "https://ssoformazione.ilportaledeltrasporto.it/sso/json/authenticate")

TOKEN_ID=$(echo "$AUTH_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['tokenId'])" 2>/dev/null)
if [ -z "$TOKEN_ID" ]; then
  echo "ERRORE: authenticate fallito"
  echo "$AUTH_RESP"
  exit 1
fi
echo "OK - tokenId: ${TOKEN_ID:0:30}..."

# ============================================================
# STEP 2: AUTHORIZE via POST (sezione 5.3.2)
# CRITICO: POST con csrf=tokenId e decision=allow
# ============================================================
echo ""
echo "=== STEP 2: POST /authorize (csrf + decision=allow) ==="

# Eseguo come da curl nella documentazione:
# curl --dump-header - --request POST
#   --Cookie "iPlanetDirectoryPro=..."
#   --data "scope=openid profile"
#   --data "response_type=code"
#   --data "client_id=AUTODEM.RESCUEMANAGER"
#   --data "csrf=<iPlanetDirectoryPro>"
#   --data "redirect_uri=https://localhost/"
#   --data "state=abc123"
#   --data "nonce=123abc"
#   --data "decision=allow"

AUTHORIZE_RESP=$(curl -s -D - -o /dev/null \
  -X POST \
  -b "iPlanetDirectoryPro=$TOKEN_ID" \
  -d "scope=openid profile" \
  -d "response_type=code" \
  -d "client_id=AUTODEM.RESCUEMANAGER" \
  -d "csrf=$TOKEN_ID" \
  -d "redirect_uri=https://localhost/" \
  -d "state=abc123" \
  -d "nonce=123abc" \
  -d "decision=allow" \
  "https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/authorize")

HTTP_AUTH=$(echo "$AUTHORIZE_RESP" | grep "^HTTP" | awk '{print $2}')
LOCATION=$(echo "$AUTHORIZE_RESP" | grep -i "^Location:" | tr -d '\r')
AUTH_CODE=$(echo "$LOCATION" | sed 's/.*code=\([^&]*\).*/\1/')

echo "HTTP: $HTTP_AUTH"
echo "Location: $LOCATION"

if [ -z "$AUTH_CODE" ] || [ "$AUTH_CODE" = "$LOCATION" ]; then
  echo "ERRORE: authorize fallito - no code"
  echo "Full response headers:"
  echo "$AUTHORIZE_RESP" | head -20
  
  # Prova anche con http://localhost/ come negli esempi curl ACI
  echo ""
  echo "--- Retry con redirect_uri=http://localhost/ ---"
  AUTHORIZE_RESP2=$(curl -s -D - -o /dev/null \
    -X POST \
    -b "iPlanetDirectoryPro=$TOKEN_ID" \
    -d "scope=openid profile" \
    -d "response_type=code" \
    -d "client_id=AUTODEM.RESCUEMANAGER" \
    -d "csrf=$TOKEN_ID" \
    -d "redirect_uri=http://localhost/" \
    -d "state=abc123" \
    -d "nonce=123abc" \
    -d "decision=allow" \
    "https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/authorize")
  
  HTTP_AUTH2=$(echo "$AUTHORIZE_RESP2" | grep "^HTTP" | awk '{print $2}')
  LOCATION2=$(echo "$AUTHORIZE_RESP2" | grep -i "^Location:" | tr -d '\r')
  AUTH_CODE=$(echo "$LOCATION2" | sed 's/.*code=\([^&]*\).*/\1/')
  REDIRECT_URI_USED="http://localhost/"
  echo "HTTP: $HTTP_AUTH2"
  echo "Location: $LOCATION2"
  
  if [ -z "$AUTH_CODE" ] || [ "$AUTH_CODE" = "$LOCATION2" ]; then
    echo "ERRORE: authorize fallito anche con http://localhost/"
    exit 1
  fi
else
  REDIRECT_URI_USED="https://localhost/"
fi

echo "OK - code: ${AUTH_CODE:0:20}... (redirect_uri: $REDIRECT_URI_USED)"

# ============================================================
# STEP 3: ACCESS TOKEN (sezione 5.3.3)
# ============================================================
echo ""
echo "=== STEP 3: POST /access_token ==="

TOKEN_RESP=$(curl -s -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=$AUTH_CODE" \
  -d "client_id=AUTODEM.RESCUEMANAGER" \
  -d "client_secret=e3abea315f8d7acffca73941c6a0de2197068d15" \
  -d "redirect_uri=$REDIRECT_URI_USED" \
  "https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/access_token")

echo "Token response:"
echo "$TOKEN_RESP" | python3 -m json.tool 2>/dev/null || echo "$TOKEN_RESP"

ID_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['id_token'])" 2>/dev/null)
ACCESS_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

if [ -z "$ID_TOKEN" ]; then
  echo "ERRORE: token exchange fallito"
  exit 1
fi
echo ""
echo "id_token: ${#ID_TOKEN} chars"
echo "access_token: ${#ACCESS_TOKEN} chars"

# Decode JWT payload
echo ""
echo "=== JWT id_token payload ==="
echo "$ID_TOKEN" | cut -d"." -f2 | python3 -c "
import sys, base64, json
p = sys.stdin.read().strip()
p += '=' * (4 - len(p) % 4)
print(json.dumps(json.loads(base64.urlsafe_b64decode(p)), indent=2))
" 2>/dev/null

# ============================================================
# STEP 4: API CALLS (sezione 5.3 punto 7)
# "Il Client chiama l'API Gateway passando l'IDToken (Bearer)"
# ============================================================
echo ""
echo "=========================================="
echo "=== STEP 4: API CALLS ==="
echo "=========================================="

echo ""
echo "--- TEST 1: Bearer id_token (come da doc punto 7) ---"
R1=$(curl -s -o /tmp/exact1.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA076AJ")
echo "HTTP $R1 | $(head -c 300 /tmp/exact1.txt)"

echo ""
echo "--- TEST 2: Bearer access_token ---"
R2=$(curl -s -o /tmp/exact2.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA076AJ")
echo "HTTP $R2 | $(head -c 300 /tmp/exact2.txt)"

echo ""
echo "--- TEST 3: Bearer id_token + iPlanetDirectoryPro cookie ---"
R3=$(curl -s -o /tmp/exact3.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Cookie: iPlanetDirectoryPro=$TOKEN_ID" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA076AJ")
echo "HTTP $R3 | $(head -c 300 /tmp/exact3.txt)"

echo ""
echo "--- TEST 4: /cr/causali con Bearer id_token ---"
R4=$(curl -s -o /tmp/exact4.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali")
echo "HTTP $R4 | $(head -c 300 /tmp/exact4.txt)"

echo ""
echo "--- TEST 5: Verbose /cr/veicolo (vedi headers risposta) ---"
curl -v -s -o /tmp/exact5.txt \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA076AJ" 2>&1 | grep -E "^[<>]"

echo ""
echo "--- TEST 6: Bearer id_token + X-OpenAM headers (username/pwd) ---"
R6=$(curl -s -o /tmp/exact6.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "X-OpenAM-Username: DETO003001" \
  -H "X-OpenAM-Password: TEST.030" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA076AJ")
echo "HTTP $R6 | $(head -c 300 /tmp/exact6.txt)"

echo ""
echo "--- TEST 7: Bearer id_token + iPlanet + Accept-API-Version ---"
R7=$(curl -s -o /tmp/exact7.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Cookie: iPlanetDirectoryPro=$TOKEN_ID" \
  -H "Accept: application/json" \
  -H "Accept-API-Version: resource=2.0, protocol=1.0" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA076AJ")
echo "HTTP $R7 | $(head -c 300 /tmp/exact7.txt)"

echo ""
echo "=========================================="
echo "=== RIEPILOGO ==="
echo "=========================================="
echo "Flusso: Authenticate(POST+AcceptAPIVer) → Authorize(POST+csrf+decision) → AccessToken"
echo "redirect_uri usato: $REDIRECT_URI_USED"
echo ""
echo "Test 1 (Bearer id_token):          HTTP $R1"
echo "Test 2 (Bearer access_token):      HTTP $R2"
echo "Test 3 (Bearer id + iPlanet):      HTTP $R3"
echo "Test 4 (/cr/causali):              HTTP $R4"
echo "Test 6 (Bearer + X-OpenAM):        HTTP $R6"
echo "Test 7 (Bearer + iPlanet + API):   HTTP $R7"
