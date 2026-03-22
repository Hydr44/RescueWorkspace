#!/bin/bash
# Test RVFU - flusso definitivo con estrazione cookie via -D (headers file)

set -e
echo "=== STEP 1: Authenticate ==="
TOKEN_ID=$(curl -s -X POST "https://ssoformazione.ilportaledeltrasporto.it/sso/json/authenticate" \
  -H "Content-Type: application/json" \
  -H "X-OpenAM-Username: DETO003001" \
  -H "X-OpenAM-Password: TEST.030" | python3 -c "import sys,json; print(json.load(sys.stdin)['tokenId'])" 2>/dev/null)
echo "tokenId OK"

echo ""
echo "=== STEP 2: CDSSO form via GET /rvfu/ ==="
CDSSO_BODY=$(curl -s \
  -b "iPlanetDirectoryPro=$TOKEN_ID" \
  -L \
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
echo "CDSSO id_token: ${#CDSSO_IDTOKEN} chars, state: $CDSSO_STATE"

if [ -z "$CDSSO_IDTOKEN" ]; then
  echo "ERRORE: CDSSO form non trovato"; exit 1
fi

echo ""
echo "=== STEP 3: POST HTTPS /agent/cdsso-oauth2 → estrae am-auth-jwt da headers ==="
# Usa -D per salvare headers, poi parse con python
curl -s -X POST "https://formazione.ilportaledeltrasporto.it/agent/cdsso-oauth2" \
  -D /tmp/step3_hdrs.txt \
  -o /tmp/step3_body.txt \
  --data-urlencode "id_token=$CDSSO_IDTOKEN" \
  --data-urlencode "state=$CDSSO_STATE"

HTTP3=$(grep "^HTTP" /tmp/step3_hdrs.txt | awk '{print $2}')
echo "HTTP: $HTTP3"
echo "Set-Cookie headers:"
grep -i "set-cookie" /tmp/step3_hdrs.txt

# Estrai am-auth-jwt con python (robusto)
AM_AUTH_JWT=$(python3 -c "
import re
with open('/tmp/step3_hdrs.txt') as f:
    content = f.read()
m = re.search(r'am-auth-jwt=([^;]+)', content, re.IGNORECASE)
print(m.group(1).strip() if m else '')
" 2>/dev/null)
echo ""
echo "am-auth-jwt estratto: ${#AM_AUTH_JWT} chars → ${AM_AUTH_JWT:0:50}..."

if [ -z "$AM_AUTH_JWT" ]; then
  echo "ATTENZIONE: am-auth-jwt non estratto (HTTP $HTTP3)"
  echo "Body: $(head -c 200 /tmp/step3_body.txt)"
fi

echo ""
echo "=== STEP 4a: Prima richiesta con am-auth-jwt → ricevi HTTP_SESSION_ATTR_TOKEN ==="
curl -s -X GET \
  -H "Cookie: am-auth-jwt=$AM_AUTH_JWT" \
  -H "Accept: application/json" \
  -D /tmp/step4a_hdrs.txt \
  -o /tmp/step4a_body.txt \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali"

HTTP4A=$(grep "^HTTP" /tmp/step4a_hdrs.txt | awk '{print $2}')
echo "HTTP: $HTTP4A"
echo "Set-Cookie in risposta:"
grep -i "set-cookie" /tmp/step4a_hdrs.txt

# Estrai HTTP_SESSION_ATTR_TOKEN dal valore NON vuoto (Max-Age > 0)
SESSION_TOKEN=$(python3 -c "
import re
with open('/tmp/step4a_hdrs.txt') as f:
    content = f.read()
# Trova il cookie con Max-Age > 0 (non la versione che svuota)
for m in re.finditer(r'HTTP_SESSION_ATTR_TOKEN=([^;]+)', content):
    val = m.group(1).strip()
    if val and val != '':
        print(val)
        break
" 2>/dev/null)

TIPO_ACCESSO=$(python3 -c "
import re
with open('/tmp/step4a_hdrs.txt') as f:
    content = f.read()
for m in re.finditer(r'HTTP_SESSIONITIPOACCESSO=([^;]+)', content):
    val = m.group(1).strip()
    if val and val != '':
        print(val)
        break
" 2>/dev/null)

echo "HTTP_SESSION_ATTR_TOKEN estratto: '$SESSION_TOKEN'"
echo "HTTP_SESSIONITIPOACCESSO estratto: '$TIPO_ACCESSO'"

echo ""
echo "=== STEP 4b: Seconda richiesta con am-auth-jwt + HTTP_SESSION_ATTR_TOKEN ==="
HTTP4B=$(curl -s -o /tmp/step4b_body.txt -w "%{http_code}" \
  -H "Cookie: am-auth-jwt=$AM_AUTH_JWT; HTTP_SESSION_ATTR_TOKEN=$SESSION_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali")
echo "HTTP: $HTTP4B"
echo "Body: $(head -c 400 /tmp/step4b_body.txt)"

echo ""
echo "=== STEP 4c: Solo HTTP_SESSION_ATTR_TOKEN (senza am-auth-jwt) ==="
HTTP4C=$(curl -s -o /tmp/step4c_body.txt -w "%{http_code}" \
  -H "Cookie: HTTP_SESSION_ATTR_TOKEN=$SESSION_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali")
echo "HTTP: $HTTP4C"
echo "Body: $(head -c 200 /tmp/step4c_body.txt)"

echo ""
echo "=== STEP 4d: am-auth-jwt + iPlanetDirectoryPro + HTTP_SESSION ==="
HTTP4D=$(curl -s -o /tmp/step4d_body.txt -w "%{http_code}" \
  -H "Cookie: iPlanetDirectoryPro=$TOKEN_ID; am-auth-jwt=$AM_AUTH_JWT; HTTP_SESSION_ATTR_TOKEN=$SESSION_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali")
echo "HTTP: $HTTP4D"
echo "Body: $(head -c 400 /tmp/step4d_body.txt)"

echo ""
echo "=== STEP 5: Veicolo VA076AJ con sessione completa ==="
HTTP5=$(curl -s -o /tmp/step5_body.txt -w "%{http_code}" \
  -H "Cookie: am-auth-jwt=$AM_AUTH_JWT; HTTP_SESSION_ATTR_TOKEN=$SESSION_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA076AJ")
echo "HTTP: $HTTP5"
echo "Body: $(head -c 400 /tmp/step5_body.txt)"

echo ""
echo "=== STEP 6: /rvfu/sh/cr/causali verbose con sessione completa ==="
curl -v -s -o /tmp/step6_body.txt \
  -H "Cookie: am-auth-jwt=$AM_AUTH_JWT; HTTP_SESSION_ATTR_TOKEN=$SESSION_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali" 2>&1 | grep -E "^[<>]"

echo ""
echo "==========================="
echo "=== RIEPILOGO ==="
echo "4a (am-auth-jwt, prima):       HTTP $HTTP4A → session token: '$SESSION_TOKEN'"
echo "4b (am-auth + session):        HTTP $HTTP4B"
echo "4c (solo session):             HTTP $HTTP4C"
echo "4d (iPlanet+am-auth+session):  HTTP $HTTP4D"
echo "5  (veicolo VA076AJ):          HTTP $HTTP5"
