#!/bin/bash
# Test RVFU v2 - flusso completo con cookie jar per catturare agent-authn-tx

JAR=/tmp/rvfu_v2.txt
rm -f "$JAR"

echo "=== STEP 1: Authenticate ==="
TOKEN_ID=$(curl -s -X POST "https://ssoformazione.ilportaledeltrasporto.it/sso/json/authenticate" \
  -H "Content-Type: application/json" \
  -H "X-OpenAM-Username: DETO003001" \
  -H "X-OpenAM-Password: TEST.030" | python3 -c "import sys,json; print(json.load(sys.stdin)['tokenId'])" 2>/dev/null)
echo "tokenId OK: ${TOKEN_ID:0:20}..."

# Inizializza jar con iPlanetDirectoryPro per il dominio SSO
printf "ssoformazione.ilportaledeltrasporto.it\tFALSE\t/\tFALSE\t2000000000\tiPlanetDirectoryPro\t%s\n" "$TOKEN_ID" > "$JAR"
printf "formazione.ilportaledeltrasporto.it\tFALSE\t/\tFALSE\t2000000000\tiPlanetDirectoryPro\t%s\n" "$TOKEN_ID" >> "$JAR"

echo ""
echo "=== STEP 2: GET /rvfu/ con jar (cattura agent-authn-tx + form) ==="
CDSSO_BODY=$(curl -s -L \
  -b "$JAR" \
  -c "$JAR" \
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
echo "CDSSO state: $CDSSO_STATE"
echo "Cookie jar dopo step 2:"
cat "$JAR" | grep -v "^#" | awk '{print $6"="substr($7,1,30)}'

if [ -z "$CDSSO_IDTOKEN" ]; then
  echo "ERRORE: CDSSO form non trovato"
  echo "Body: $(echo "$CDSSO_BODY" | head -c 500)"
  exit 1
fi

echo ""
echo "=== STEP 3: POST HTTPS /agent/cdsso-oauth2 con jar (agent-authn-tx incluso) ==="
curl -s \
  -b "$JAR" \
  -c "$JAR" \
  -D /tmp/v2_step3_hdrs.txt \
  -o /tmp/v2_step3_body.txt \
  -X POST "https://formazione.ilportaledeltrasporto.it/agent/cdsso-oauth2" \
  --data-urlencode "id_token=$CDSSO_IDTOKEN" \
  --data-urlencode "state=$CDSSO_STATE"

HTTP3=$(grep "^HTTP" /tmp/v2_step3_hdrs.txt | awk '{print $2}')
echo "HTTP: $HTTP3"
echo "Headers risposta:"
grep -iE "(location|set-cookie|server)" /tmp/v2_step3_hdrs.txt
echo "Body: $(head -c 200 /tmp/v2_step3_body.txt)"

echo ""
echo "=== Cookie jar dopo step 3 ==="
cat "$JAR" | grep -v "^#" | awk '{print $6"="substr($7,1,40)}'

# Estrai am-auth-jwt
AM_AUTH_JWT=$(python3 -c "
import re
with open('/tmp/v2_step3_hdrs.txt') as f:
    content = f.read()
m = re.search(r'am-auth-jwt=([^;\s\r\n]+)', content, re.IGNORECASE)
print(m.group(1).strip() if m else '')
" 2>/dev/null)
echo ""
echo "am-auth-jwt estratto: ${#AM_AUTH_JWT} chars"

# Se am-auth-jwt non è nel step3 headers, cercalo nel jar
if [ -z "$AM_AUTH_JWT" ]; then
  AM_AUTH_JWT=$(grep "am-auth-jwt" "$JAR" | awk '{print $NF}')
  echo "am-auth-jwt dal jar: ${#AM_AUTH_JWT} chars"
fi

echo ""
echo "=== STEP 4: POST HTTP:80 /agent/cdsso-oauth2 (form action originale) ==="
# Ottieni un nuovo CDSSO token perché quello precedente è stato consumato
CDSSO_BODY2=$(curl -s -L \
  -b "$JAR" \
  -c "$JAR" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/")
CDSSO_IDTOKEN2=$(echo "$CDSSO_BODY2" | python3 -c "
import sys, re
m = re.search(r'name=\"id_token\" value=\"([^\"]+)\"', sys.stdin.read())
print(m.group(1) if m else '')
" 2>/dev/null)
CDSSO_STATE2=$(echo "$CDSSO_BODY2" | python3 -c "
import sys, re
m = re.search(r'name=\"state\" value=\"([^\"]+)\"', sys.stdin.read())
print(m.group(1) if m else '')
" 2>/dev/null)
echo "Nuovo CDSSO token: ${#CDSSO_IDTOKEN2} chars, state: $CDSSO_STATE2"

curl -s -L \
  -b "$JAR" \
  -c "$JAR" \
  -D /tmp/v2_step4_hdrs.txt \
  -o /tmp/v2_step4_body.txt \
  -X POST "http://formazione.ilportaledeltrasporto.it:80/agent/cdsso-oauth2" \
  --data-urlencode "id_token=$CDSSO_IDTOKEN2" \
  --data-urlencode "state=$CDSSO_STATE2"

HTTP4=$(grep "^HTTP" /tmp/v2_step4_hdrs.txt | tail -1 | awk '{print $2}')
echo "HTTP finale: $HTTP4"
echo "Set-Cookie da HTTP:80:"
grep -i "set-cookie" /tmp/v2_step4_hdrs.txt
echo "Body (200 chars): $(head -c 200 /tmp/v2_step4_body.txt)"

echo ""
echo "=== Cookie jar completo dopo step 4 ==="
cat "$JAR" | grep -v "^#" | awk '{print $6"="substr($7,1,40)}'

# Estrai HTTP_SESSION_ATTR_TOKEN
HTTP_SESSION=$(grep "HTTP_SESSION_ATTR_TOKEN" "$JAR" | grep -v "^#" | awk '{print $NF}')
echo "HTTP_SESSION_ATTR_TOKEN nel jar: '$HTTP_SESSION'"

echo ""
echo "=== STEP 5: API calls con tutti i cookie accumulati nel jar ==="

echo ""
echo "--- A: /rvfu/sh/cr/causali con jar completo ---"
HA=$(curl -s -o /tmp/v2a.txt -w "%{http_code}" \
  -b "$JAR" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali")
echo "HTTP $HA | $(head -c 300 /tmp/v2a.txt)"

echo ""
echo "--- B: /rvfu/sh/cr/causali verbose (Server header + Set-Cookie) ---"
curl -v -s -o /tmp/v2b.txt \
  -b "$JAR" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali" 2>&1 | grep -E "^[<>]"

echo ""
echo "--- C: /rvfu/sh/cr/veicolo VA076AJ con jar ---"
HC=$(curl -s -o /tmp/v2c.txt -w "%{http_code}" \
  -b "$JAR" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA076AJ")
echo "HTTP $HC | $(head -c 400 /tmp/v2c.txt)"

echo ""
echo "--- D: Stesso /rvfu/sh/cr/causali con jar (ripete → sessione stabilizzata?) ---"
HD=$(curl -s -o /tmp/v2d.txt -w "%{http_code}" \
  -b "$JAR" \
  -c "$JAR" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali")
echo "HTTP $HD | $(head -c 300 /tmp/v2d.txt)"

echo ""
echo "==========================="
echo "=== RIEPILOGO ==="
echo "A (/cr/causali):     HTTP $HA"
echo "C (/cr/veicolo):     HTTP $HC"
echo "D (retry causali):   HTTP $HD"
