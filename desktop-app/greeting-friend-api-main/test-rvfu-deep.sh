#!/bin/bash
# Deep diagnostic RVFU

# Step 1-3: Ottieni token freschi
TOKEN_ID=$(curl -s -X POST "https://ssoformazione.ilportaledeltrasporto.it/sso/json/authenticate" \
  -H "Content-Type: application/json" \
  -H "X-OpenAM-Username: DETO003001" \
  -H "X-OpenAM-Password: TEST.030" | python3 -c "import sys,json; print(json.load(sys.stdin)['tokenId'])" 2>/dev/null)

AUTH_HEADERS=$(curl -s -D - -o /dev/null \
  -H "Cookie: iPlanetDirectoryPro=$TOKEN_ID" \
  "https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/authorize?scope=openid%20profile&response_type=code&client_id=AUTODEM.RESCUEMANAGER&redirect_uri=https%3A%2F%2Flocalhost%2F&state=test123&nonce=nonce123")
LOCATION=$(echo "$AUTH_HEADERS" | grep -i "^Location:" | tr -d '\r')
AUTH_CODE=$(echo "$LOCATION" | sed 's/.*code=\([^&]*\).*/\1/')

TOKEN_RESP=$(curl -s -X POST "https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/access_token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=$AUTH_CODE" \
  -d "client_id=AUTODEM.RESCUEMANAGER" \
  -d "client_secret=e3abea315f8d7acffca73941c6a0de2197068d15" \
  -d "redirect_uri=https://localhost/")

ID_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['id_token'])" 2>/dev/null)
ACCESS_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

echo "Tokens OK. tokenId: ${TOKEN_ID:0:20}..."
echo "id_token: ${#ID_TOKEN} chars | access_token: ${#ACCESS_TOKEN} chars"

echo ""
echo "=== 1. iPlanetDirectoryPro come Bearer token ==="
R=$(curl -s -o /tmp/t1.txt -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN_ID" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali")
echo "HTTP $R | $(head -c 100 /tmp/t1.txt)"

echo ""
echo "=== 2. OIDC Discovery completo ==="
curl -s "https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/.well-known/openid-configuration" | python3 -m json.tool 2>/dev/null

echo ""
echo "=== 3. Session validation via OpenAM REST ==="
curl -s -X POST "https://ssoformazione.ilportaledeltrasporto.it/sso/json/sessions?_action=validate" \
  -H "Content-Type: application/json" \
  -H "iPlanetDirectoryPro: $TOKEN_ID" \
  -d "{\"tokenId\": \"$TOKEN_ID\"}" | python3 -m json.tool 2>/dev/null

echo ""
echo "=== 4. Body pagina ForgeRock da /rvfu/ con CDSSO ==="
curl -s -L \
  -b "iPlanetDirectoryPro=$TOKEN_ID" \
  -c /tmp/cjar_rvfu3.txt \
  "https://formazione.ilportaledeltrasporto.it/rvfu/" -o /tmp/body_rvfu_root.txt
echo "HTTP finale: $(curl -s -L -b "iPlanetDirectoryPro=$TOKEN_ID" -o /dev/null -w "%{http_code}" "https://formazione.ilportaledeltrasporto.it/rvfu/")"
echo "Body completo:"
cat /tmp/body_rvfu_root.txt

echo ""
echo "=== 5. /rvfu/sh/ nofollow - vedo redirect? ==="
curl -s -D - -o /tmp/nofollow_body.txt \
  -b "iPlanetDirectoryPro=$TOKEN_ID" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali" | grep -E "^(HTTP|Location|Set-Cookie|Server|WWW)"
echo "Body: $(head -c 200 /tmp/nofollow_body.txt)"

echo ""
echo "=== 6. Introspection con token nel body (non Basic auth) ==="
curl -s -X POST "https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/introspect" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=$ACCESS_TOKEN&client_id=AUTODEM.RESCUEMANAGER&client_secret=e3abea315f8d7acffca73941c6a0de2197068d15" | python3 -m json.tool 2>/dev/null

echo ""
echo "=== 7. User-Agent browser su /rvfu/sh/ ==="
R=$(curl -s -o /tmp/t7.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Accept: application/json" \
  -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali")
echo "HTTP $R | $(head -c 100 /tmp/t7.txt)"

echo ""
echo "=== 8. Authorize con scope=demolitori ==="
RESP8=$(curl -s -D - -o /dev/null \
  -H "Cookie: iPlanetDirectoryPro=$TOKEN_ID" \
  "https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/authorize?scope=openid%20profile%20demolitori&response_type=code&client_id=AUTODEM.RESCUEMANAGER&redirect_uri=https%3A%2F%2Flocalhost%2F&state=t8&nonce=n8")
echo "$(echo "$RESP8" | grep -E "^(HTTP|Location)")"
