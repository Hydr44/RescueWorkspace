#!/bin/bash
# Test RVFU - flusso in due step: prima richiesta stabilisce sessione, seconda usa il cookie

echo "=== STEP 1: Authenticate ==="
TOKEN_ID=$(curl -s -X POST "https://ssoformazione.ilportaledeltrasporto.it/sso/json/authenticate" \
  -H "Content-Type: application/json" \
  -H "X-OpenAM-Username: DETO003001" \
  -H "X-OpenAM-Password: TEST.030" | python3 -c "import sys,json; print(json.load(sys.stdin)['tokenId'])" 2>/dev/null)
echo "tokenId OK: ${TOKEN_ID:0:20}..."

echo ""
echo "=== STEP 2: CDSSO → ottieni am-auth-jwt ==="
CDSSO_BODY=$(curl -s -L \
  -b "iPlanetDirectoryPro=$TOKEN_ID" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/")

CDSSO_IDTOKEN=$(echo "$CDSSO_BODY" | python3 -c "
import sys, re
m = re.search(r'name=\"id_token\" value=\"([^\"]+)\"', sys.stdin.read())
print(m.group(1) if m else '')
" 2>/dev/null)

CDSSO_STATE=$(echo "$CDSSO_BODY" | python3 -c "
import sys, re
m = re.search(r'name=\"state\" value=\"([^\"]+)\"', sys.stdin.read())
print(m.group(1) if m else '')
" 2>/dev/null)

echo "CDSSO id_token: ${#CDSSO_IDTOKEN} chars"

# POST HTTPS per ottenere am-auth-jwt
AM_AUTH_JWT_RAW=$(curl -s -v \
  -X POST "https://formazione.ilportaledeltrasporto.it/agent/cdsso-oauth2" \
  --data-urlencode "id_token=$CDSSO_IDTOKEN" \
  --data-urlencode "state=$CDSSO_STATE" 2>&1 | grep -i "set-cookie: am-auth-jwt=" | sed 's/.*am-auth-jwt=\([^;]*\).*/\1/' | tr -d '< ')

echo "am-auth-jwt: ${AM_AUTH_JWT_RAW:0:40}..."

echo ""
echo "=== STEP 3a: Prima richiesta con am-auth-jwt → ottieni HTTP_SESSION_ATTR_TOKEN ==="
FIRST_RESP_HEADERS=$(curl -s -D - -o /tmp/first_body.txt \
  -H "Cookie: am-auth-jwt=$AM_AUTH_JWT_RAW" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali")

HTTP_CODE_1=$(echo "$FIRST_RESP_HEADERS" | grep "^HTTP" | awk '{print $2}')
SESSION_TOKEN=$(echo "$FIRST_RESP_HEADERS" | grep "HTTP_SESSION_ATTR_TOKEN=" | grep -v "Max-Age=0" | sed 's/.*HTTP_SESSION_ATTR_TOKEN=\([^;]*\).*/\1/' | tr -d '< \r')
TIPO_ACCESSO=$(echo "$FIRST_RESP_HEADERS" | grep "HTTP_SESSIONITIPOACCESSO=" | grep -v "Max-Age=0" | sed 's/.*HTTP_SESSIONITIPOACCESSO=\([^;]*\).*/\1/' | tr -d '< \r')

echo "HTTP step 3a: $HTTP_CODE_1"
echo "HTTP_SESSION_ATTR_TOKEN ricevuto: '$SESSION_TOKEN'"
echo "HTTP_SESSIONITIPOACCESSO ricevuto: '$TIPO_ACCESSO'"
echo "Tutti i Set-Cookie:"
echo "$FIRST_RESP_HEADERS" | grep -i "set-cookie"

echo ""
echo "=== STEP 3b: Seconda richiesta con am-auth-jwt + HTTP_SESSION_ATTR_TOKEN ==="
R2=$(curl -s -o /tmp/second_body.txt -w "%{http_code}" \
  -H "Cookie: am-auth-jwt=$AM_AUTH_JWT_RAW; HTTP_SESSION_ATTR_TOKEN=$SESSION_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali")
echo "HTTP step 3b: $R2"
echo "Body: $(head -c 400 /tmp/second_body.txt)"

echo ""
echo "=== STEP 3c: Seconda richiesta con iPlanet + am-auth-jwt + HTTP_SESSION ==="
R3=$(curl -s -o /tmp/third_body.txt -w "%{http_code}" \
  -H "Cookie: iPlanetDirectoryPro=$TOKEN_ID; am-auth-jwt=$AM_AUTH_JWT_RAW; HTTP_SESSION_ATTR_TOKEN=$SESSION_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali")
echo "HTTP step 3c: $R3"
echo "Body: $(head -c 400 /tmp/third_body.txt)"

echo ""
echo "=== STEP 3d: Solo HTTP_SESSION_ATTR_TOKEN (senza altri cookie) ==="
R4=$(curl -s -o /tmp/fourth_body.txt -w "%{http_code}" \
  -H "Cookie: HTTP_SESSION_ATTR_TOKEN=$SESSION_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali")
echo "HTTP step 3d: $R4"
echo "Body: $(head -c 400 /tmp/fourth_body.txt)"

echo ""
echo "=== STEP 3e: Ripeto step 3a headers verbose per vedere tutti i cookie impostati ==="
curl -v -s -o /tmp/verbose_body.txt \
  -H "Cookie: am-auth-jwt=$AM_AUTH_JWT_RAW" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali" 2>&1 | grep -E "^[<>]"

echo ""
echo "=== STEP 4: Testa /rvfu/sh/cr/veicolo con sessione ==="
RV=$(curl -s -o /tmp/veicolo_body.txt -w "%{http_code}" \
  -H "Cookie: am-auth-jwt=$AM_AUTH_JWT_RAW; HTTP_SESSION_ATTR_TOKEN=$SESSION_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA076AJ")
echo "HTTP veicolo: $RV"
echo "Body: $(head -c 400 /tmp/veicolo_body.txt)"

echo ""
echo "=== RIEPILOGO ==="
echo "3a (am-auth-jwt, prima): HTTP $HTTP_CODE_1"
echo "3b (am-auth + session): HTTP $R2"
echo "3c (iPlanet+am-auth+session): HTTP $R3"
echo "3d (solo session): HTTP $R4"
echo "4  (veicolo VA076AJ): HTTP $RV"
