#!/bin/bash
# Test RVFU - simulazione completa flusso CDSSO
# Il server /rvfu/sh/ usa sessioni Apache (HTTP_SESSION_ATTR_TOKEN), non Bearer token
# Il flusso è: Authenticate → CDSSO form → POST /agent/cdsso-oauth2 → session cookies → API

echo "=========================================="
echo "RVFU CDSSO Full Flow Test - $(date)"
echo "=========================================="

COOKIE_JAR=/tmp/rvfu_cdsso_cookies.txt
rm -f "$COOKIE_JAR"

# Step 1: Authenticate → ottieni iPlanetDirectoryPro
echo ""
echo "=== STEP 1: Authenticate (OpenAM) ==="
TOKEN_ID=$(curl -s -X POST "https://ssoformazione.ilportaledeltrasporto.it/sso/json/authenticate" \
  -H "Content-Type: application/json" \
  -H "X-OpenAM-Username: DETO003001" \
  -H "X-OpenAM-Password: TEST.030" | python3 -c "import sys,json; print(json.load(sys.stdin)['tokenId'])" 2>/dev/null)

if [ -z "$TOKEN_ID" ]; then
  echo "ERRORE: authenticate fallito"
  exit 1
fi
echo "OK - tokenId: ${TOKEN_ID:0:30}..."

# Salva il cookie nel jar
printf "ssoformazione.ilportaledeltrasporto.it\tFALSE\t/\tFALSE\t0\tiPlanetDirectoryPro\t%s\n" "$TOKEN_ID" > "$COOKIE_JAR"

# Step 2: Trigger CDSSO su /rvfu/ con follow redirect
echo ""
echo "=== STEP 2: Trigger CDSSO - GET /rvfu/ con follow redirect ==="
CDSSO_BODY=$(curl -s -L \
  -b "iPlanetDirectoryPro=$TOKEN_ID" \
  -c "$COOKIE_JAR" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/")

# Estrai id_token e state dal form HTML
CDSSO_IDTOKEN=$(echo "$CDSSO_BODY" | python3 -c "
import sys, re
body = sys.stdin.read()
m = re.search(r'name=\"id_token\" value=\"([^\"]+)\"', body)
if m:
    print(m.group(1))
" 2>/dev/null)

CDSSO_STATE=$(echo "$CDSSO_BODY" | python3 -c "
import sys, re
body = sys.stdin.read()
m = re.search(r'name=\"state\" value=\"([^\"]+)\"', body)
if m:
    print(m.group(1))
" 2>/dev/null)

FORM_ACTION=$(echo "$CDSSO_BODY" | python3 -c "
import sys, re
body = sys.stdin.read()
m = re.search(r'action=\"([^\"]+)\"', body)
if m:
    print(m.group(1))
" 2>/dev/null)

echo "Form action: $FORM_ACTION"
echo "CDSSO id_token (${#CDSSO_IDTOKEN} chars): ${CDSSO_IDTOKEN:0:40}..."
echo "CDSSO state: $CDSSO_STATE"

if [ -z "$CDSSO_IDTOKEN" ]; then
  echo "ERRORE: CDSSO form non trovato nel body"
  echo "Body (500 chars): $(echo "$CDSSO_BODY" | head -c 500)"
  exit 1
fi

# Decodifica il CDSSO id_token
echo ""
echo "=== CDSSO id_token DECODED ==="
echo "$CDSSO_IDTOKEN" | cut -d"." -f2 | python3 -c "
import sys, base64, json
p = sys.stdin.read().strip()
p += '=' * (4 - len(p) % 4)
try:
    decoded = json.loads(base64.urlsafe_b64decode(p))
    print(json.dumps(decoded, indent=2))
except Exception as e:
    print('Decode error:', e)
" 2>/dev/null

# Step 3: POST il form CDSSO a /agent/cdsso-oauth2
echo ""
echo "=== STEP 3: POST CDSSO form → /agent/cdsso-oauth2 ==="

# Prova prima con HTTPS
echo "--- 3a: HTTPS POST ---"
CDSSO_POST_RESP=$(curl -s -v \
  -c "$COOKIE_JAR" \
  -b "$COOKIE_JAR" \
  -D /tmp/cdsso_post_headers.txt \
  -o /tmp/cdsso_post_body.txt \
  -X POST "https://formazione.ilportaledeltrasporto.it/agent/cdsso-oauth2" \
  --data-urlencode "id_token=$CDSSO_IDTOKEN" \
  --data-urlencode "state=$CDSSO_STATE" 2>&1 | grep -E "^[<>*]")

HTTP_POST=$(grep "^HTTP" /tmp/cdsso_post_headers.txt | head -1)
echo "HTTP: $HTTP_POST"
echo "Response headers:"
grep -E "^(Location|Set-Cookie|Server)" /tmp/cdsso_post_headers.txt
echo "Body (300 chars): $(head -c 300 /tmp/cdsso_post_body.txt)"
echo "Cookie jar dopo POST:"
cat "$COOKIE_JAR" | grep -v "^#"

# Prova anche con HTTP:80 (come nel form action)
echo ""
echo "--- 3b: HTTP:80 POST (come nel form) ---"
curl -s -L \
  -c "$COOKIE_JAR" \
  -b "$COOKIE_JAR" \
  -D /tmp/cdsso_post80_headers.txt \
  -o /tmp/cdsso_post80_body.txt \
  -X POST "http://formazione.ilportaledeltrasporto.it:80/agent/cdsso-oauth2" \
  --data-urlencode "id_token=$CDSSO_IDTOKEN" \
  --data-urlencode "state=$CDSSO_STATE"

HTTP_POST80=$(grep "^HTTP" /tmp/cdsso_post80_headers.txt | head -1)
echo "HTTP: $HTTP_POST80"
echo "Response headers (80):"
grep -E "^(Location|Set-Cookie|Server)" /tmp/cdsso_post80_headers.txt
echo "Body (300 chars): $(head -c 300 /tmp/cdsso_post80_body.txt)"

echo ""
echo "=== Cookie jar COMPLETO dopo tutta la sequenza ==="
cat "$COOKIE_JAR" | grep -v "^#"

# Step 4: Test API calls con i cookie di sessione
echo ""
echo "=== STEP 4: API calls con session cookies ==="

echo ""
echo "--- TEST A: /rvfu/sh/cr/causali con cookie jar ---"
RA=$(curl -s -o /tmp/api_a.txt -w "%{http_code}" \
  -b "$COOKIE_JAR" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali")
echo "HTTP $RA | $(head -c 300 /tmp/api_a.txt)"

echo ""
echo "--- TEST B: /rvfu/sh/cr/veicolo?targa=VA076AJ con cookie jar ---"
RB=$(curl -s -o /tmp/api_b.txt -w "%{http_code}" \
  -b "$COOKIE_JAR" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA076AJ")
echo "HTTP $RB | $(head -c 300 /tmp/api_b.txt)"

echo ""
echo "--- TEST C: /rvfu/sh/cr/causali con solo HTTP_SESSION_ATTR_TOKEN (se nel jar) ---"
SESSION_TOKEN=$(cat "$COOKIE_JAR" | grep "HTTP_SESSION_ATTR_TOKEN" | awk '{print $NF}')
if [ -n "$SESSION_TOKEN" ]; then
  RC=$(curl -s -o /tmp/api_c.txt -w "%{http_code}" \
    -H "Cookie: HTTP_SESSION_ATTR_TOKEN=$SESSION_TOKEN" \
    -H "Accept: application/json" \
    "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali")
  echo "HTTP $RC | $(head -c 300 /tmp/api_c.txt)"
else
  echo "HTTP_SESSION_ATTR_TOKEN non trovato nel cookie jar"
fi

echo ""
echo "=========================================="
echo "=== RIEPILOGO ==="
echo "=========================================="
echo "Test A (/cr/causali con jar):     HTTP $RA"
echo "Test B (/cr/veicolo VA076AJ):     HTTP $RB"
