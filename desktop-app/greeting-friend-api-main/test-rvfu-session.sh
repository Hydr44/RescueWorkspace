#!/bin/bash
# Test RVFU - sessione completa via HTTPS CDSSO + follow redirect

COOKIE_JAR=/tmp/rvfu_session.txt
rm -f "$COOKIE_JAR"

echo "=== STEP 1: Authenticate ==="
TOKEN_ID=$(curl -s -X POST "https://ssoformazione.ilportaledeltrasporto.it/sso/json/authenticate" \
  -H "Content-Type: application/json" \
  -H "X-OpenAM-Username: DETO003001" \
  -H "X-OpenAM-Password: TEST.030" | python3 -c "import sys,json; print(json.load(sys.stdin)['tokenId'])" 2>/dev/null)
echo "tokenId: ${TOKEN_ID:0:30}..."

echo ""
echo "=== STEP 2: CDSSO form via /rvfu/ ==="
CDSSO_BODY=$(curl -s -L \
  -b "iPlanetDirectoryPro=$TOKEN_ID" \
  -c "$COOKIE_JAR" \
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

echo ""
echo "=== STEP 3: POST HTTPS /agent/cdsso-oauth2 con follow redirect ==="
curl -s -L \
  -c "$COOKIE_JAR" \
  -b "$COOKIE_JAR" \
  -D /tmp/step3_headers.txt \
  -o /tmp/step3_body.txt \
  -X POST "https://formazione.ilportaledeltrasporto.it/agent/cdsso-oauth2" \
  --data-urlencode "id_token=$CDSSO_IDTOKEN" \
  --data-urlencode "state=$CDSSO_STATE"

echo "HTTP finale step 3: $(grep '^HTTP' /tmp/step3_headers.txt | tail -1)"
echo "Headers step 3:"
grep -E "^(Location|Set-Cookie|Server)" /tmp/step3_headers.txt
echo "Body (200 chars): $(head -c 200 /tmp/step3_body.txt)"

echo ""
echo "=== Cookie jar dopo step 3 ==="
cat "$COOKIE_JAR" | grep -v "^#"

echo ""
echo "=== STEP 4: Estrai am-auth-jwt e usalo esplicitamente ==="
AM_AUTH_JWT=$(cat "$COOKIE_JAR" | grep "am-auth-jwt" | awk '{print $NF}')
HTTP_SESSION=$(cat "$COOKIE_JAR" | grep "HTTP_SESSION_ATTR_TOKEN" | awk '{print $NF}')
echo "am-auth-jwt: ${AM_AUTH_JWT:0:40}..."
echo "HTTP_SESSION_ATTR_TOKEN: $HTTP_SESSION"

echo ""
echo "=== STEP 5: GET /rvfu/ con am-auth-jwt esplicito (senza scadenza) ==="
curl -s -L \
  -c "$COOKIE_JAR" \
  -H "Cookie: am-auth-jwt=$AM_AUTH_JWT" \
  -D /tmp/step5_headers.txt \
  -o /tmp/step5_body.txt \
  "https://formazione.ilportaledeltrasporto.it/rvfu/"

echo "HTTP: $(grep '^HTTP' /tmp/step5_headers.txt | tail -1)"
echo "Headers:"
grep -E "^(Location|Set-Cookie|Server)" /tmp/step5_headers.txt
echo "Body (300 chars): $(head -c 300 /tmp/step5_body.txt)"

echo ""
echo "=== Cookie jar dopo step 5 ==="
cat "$COOKIE_JAR" | grep -v "^#"

echo ""
echo "=== STEP 6: API calls con am-auth-jwt esplicito ==="

echo ""
echo "--- A: /rvfu/sh/cr/causali con am-auth-jwt ---"
RA=$(curl -s -o /tmp/a.txt -w "%{http_code}" \
  -H "Cookie: am-auth-jwt=$AM_AUTH_JWT" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali")
echo "HTTP $RA | $(head -c 300 /tmp/a.txt)"

echo ""
echo "--- B: /rvfu/sh/cr/causali con cookie jar completo ---"
RB=$(curl -s -o /tmp/b.txt -w "%{http_code}" \
  -b "$COOKIE_JAR" \
  -H "Cookie: am-auth-jwt=$AM_AUTH_JWT" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali")
echo "HTTP $RB | $(head -c 300 /tmp/b.txt)"

echo ""
echo "--- C: /rvfu/sh/cr/causali con iPlanet + am-auth-jwt ---"
RC=$(curl -s -o /tmp/c.txt -w "%{http_code}" \
  -H "Cookie: iPlanetDirectoryPro=$TOKEN_ID; am-auth-jwt=$AM_AUTH_JWT" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali")
echo "HTTP $RC | $(head -c 300 /tmp/c.txt)"

echo ""
echo "--- D: /rvfu/sh/cr/veicolo VA076AJ con am-auth-jwt ---"
RD=$(curl -s -o /tmp/d.txt -w "%{http_code}" \
  -b "$COOKIE_JAR" \
  -H "Cookie: am-auth-jwt=$AM_AUTH_JWT" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA076AJ")
echo "HTTP $RD | $(head -c 300 /tmp/d.txt)"

echo ""
echo "--- E: /rvfu/sh/cr/causali verbose con am-auth-jwt (vedi Server header) ---"
curl -v -s -o /tmp/e.txt \
  -H "Cookie: am-auth-jwt=$AM_AUTH_JWT" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali" 2>&1 | grep -E "^[<>]"

echo ""
echo "=== RIEPILOGO ==="
echo "A: HTTP $RA | B: HTTP $RB | C: HTTP $RC | D: HTTP $RD"
