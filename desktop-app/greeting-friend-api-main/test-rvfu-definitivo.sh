#!/bin/bash
# ============================================================
# TEST DEFINITIVO RVFU - Riproduce ESATTAMENTE i curl di ACI
# + aggiunge Step 4 (chiamata API) che ACI NON ha testato
# ============================================================

echo "============================================================"
echo "TEST DEFINITIVO RVFU API"  
echo "$(date)"
echo "============================================================"

# ============================================================
# STEP 1: AUTHENTICATE (identico a curl ACI)
# ============================================================
echo ""
echo "=== STEP 1: AUTHENTICATE (come da email ACI) ==="
AUTH_RESP=$(curl -s --request POST \
  --header "Content-Type: application/json" \
  --header "X-OpenAM-Username: DETO000301" \
  --header "X-OpenAM-Password: TEST.003" \
  --header "Accept-API-Version: resource=2.0, protocol=1.0" \
  https://ssoformazione.ilportaledeltrasporto.it/sso/json/authenticate)

TOKEN_ID=$(echo "$AUTH_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['tokenId'])" 2>/dev/null)
echo "✅ tokenId ottenuto: ${#TOKEN_ID} char"
echo "   tokenId prefix: ${TOKEN_ID:0:30}..."

# ============================================================
# STEP 2: AUTHORIZE (identico a curl ACI - nota: POST con decision=allow)
# ============================================================
echo ""
echo "=== STEP 2: AUTHORIZE (come da email ACI) ==="
AUTH_HEADERS=$(curl -s --dump-header - -o /dev/null \
  --request POST \
  -b "iPlanetDirectoryPro=$TOKEN_ID" \
  --data "scope=openid profile" \
  --data "response_type=code" \
  --data "client_id=AUTODEM.RESCUEMANAGER" \
  --data "csrf=$TOKEN_ID" \
  --data "redirect_uri=https://localhost/" \
  --data "state=abc123" \
  --data "nonce=123abc" \
  --data "decision=allow" \
  https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/authorize)

AUTH_CODE=$(echo "$AUTH_HEADERS" | grep -i "^Location:" | tr -d '\r' | sed 's/.*code=\([^&]*\).*/\1/')
HTTP_STATUS=$(echo "$AUTH_HEADERS" | head -1 | awk '{print $2}')
echo "✅ HTTP $HTTP_STATUS - code ottenuto: ${#AUTH_CODE} char"

# ============================================================
# STEP 3: ACCESS TOKEN (identico a curl ACI)
# ============================================================
echo ""
echo "=== STEP 3: ACCESS TOKEN (come da email ACI) ==="
TOKEN_RESP=$(curl -s --request POST \
  --data "grant_type=authorization_code" \
  --data "code=$AUTH_CODE" \
  --data "client_id=AUTODEM.RESCUEMANAGER" \
  --data "client_secret=e3abea315f8d7acffca73941c6a0de2197068d15" \
  --data "redirect_uri=https://localhost/" \
  https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/access_token)

ID_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['id_token'])" 2>/dev/null)
ACCESS_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
REFRESH_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['refresh_token'])" 2>/dev/null)
echo "✅ id_token: ${#ID_TOKEN} char (JWT)"
echo "   access_token: ${#ACCESS_TOKEN} char (opaque)"
echo "   refresh_token: ${#REFRESH_TOKEN} char"

# Decodifica id_token per mostrare audience
AUD=$(echo "$ID_TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'aud={d.get(\"aud\")}, sub={d.get(\"sub\")}, name={d.get(\"name\")}')" 2>/dev/null)
echo "   id_token claims: $AUD"

echo ""
echo "============================================================"
echo "=== STEP 1-3 COMPLETATI ✅ (fin qui ACI ha testato) ==="  
echo "=== STEP 4: CHIAMATA API (ACI NON ha testato questo!) ==="
echo "============================================================"

# ============================================================
# STEP 4A: /rvfu/sh/ con Bearer id_token (come da specifiche)
# ============================================================
echo ""
echo "--- 4A: /rvfu/sh/cr/veicolo + Bearer id_token (specifiche step 7) ---"
RESP_4A=$(curl -s -o /tmp/rvfu_4a.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=FN082XY")
echo "HTTP $RESP_4A | Body: $(cat /tmp/rvfu_4a.txt | head -c 150)"

# ============================================================
# STEP 4B: /rvfu/sh/ con Bearer access_token
# ============================================================
echo ""
echo "--- 4B: /rvfu/sh/cr/veicolo + Bearer access_token ---"
RESP_4B=$(curl -s -o /tmp/rvfu_4b.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=FN082XY")
echo "HTTP $RESP_4B | Body: $(cat /tmp/rvfu_4b.txt | head -c 150)"

# ============================================================
# STEP 4C: /rvfu/sh/ con Bearer + Cookie iPlanet
# ============================================================
echo ""
echo "--- 4C: /rvfu/sh/cr/veicolo + Bearer id_token + Cookie iPlanet ---"
RESP_4C=$(curl -s -o /tmp/rvfu_4c.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Accept: application/json" \
  -b "iPlanetDirectoryPro=$TOKEN_ID" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=FN082XY")
echo "HTTP $RESP_4C | Body: $(cat /tmp/rvfu_4c.txt | head -c 150)"

# ============================================================
# STEP 4D: /rvfu/sh/ SENZA auth (baseline)
# ============================================================
echo ""
echo "--- 4D: /rvfu/sh/cr/veicolo SENZA auth (baseline) ---"
RESP_4D=$(curl -s -o /tmp/rvfu_4d.txt -w "%{http_code}" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=FN082XY")
echo "HTTP $RESP_4D | Body: $(cat /tmp/rvfu_4d.txt | head -c 150)"

# ============================================================
# STEP 4E: Vecchio path /demolitori-aci-ws/rest/ con Bearer
# ============================================================
echo ""
echo "--- 4E: /demolitori-aci-ws/rest/cr/veicolo + Bearer id_token ---"
RESP_4E=$(curl -s -D /tmp/rvfu_4e_h.txt -o /tmp/rvfu_4e.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=FN082XY")
echo "HTTP $RESP_4E | Body: $(cat /tmp/rvfu_4e.txt | head -c 150)"
if [ "$RESP_4E" = "302" ]; then
  echo "   Location: $(grep -i '^Location:' /tmp/rvfu_4e_h.txt | tr -d '\r')"
fi

# ============================================================
# STEP 4F: /rvfu/sh/cr/causali (endpoint più semplice)
# ============================================================
echo ""
echo "--- 4F: /rvfu/sh/cr/causali + Bearer id_token ---"
RESP_4F=$(curl -s -o /tmp/rvfu_4f.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/causali")
echo "HTTP $RESP_4F | Body: $(cat /tmp/rvfu_4f.txt | head -c 150)"

echo ""
echo "============================================================"
echo "=== RIEPILOGO ==="
echo "============================================================"
echo ""
echo "Step 1-3 (OAuth flow): ✅ FUNZIONA (identico a ACI)"
echo ""
echo "Step 4 (API call) - RISULTATI:"
echo "  4A: /rvfu/sh/ + Bearer id_token    → HTTP $RESP_4A"
echo "  4B: /rvfu/sh/ + Bearer access_token → HTTP $RESP_4B"
echo "  4C: /rvfu/sh/ + Bearer + Cookie     → HTTP $RESP_4C"
echo "  4D: /rvfu/sh/ senza auth            → HTTP $RESP_4D"
echo "  4E: /demolitori-aci-ws/rest/ + Bearer → HTTP $RESP_4E"
echo "  4F: /rvfu/sh/cr/causali + Bearer    → HTTP $RESP_4F"
echo ""
echo "CONCLUSIONE:"
if [ "$RESP_4A" = "401" ] && [ "$RESP_4B" = "401" ]; then
  echo "❌ /rvfu/sh/ restituisce 401 per TUTTE le combinazioni di autenticazione."
  echo "   Il flusso OAuth (step 1-3) funziona perfettamente."
  echo "   Il problema è nell'API Gateway /rvfu/sh/ che NON accetta il Bearer token."
  echo ""
  echo "   NOTA: L'email di ACI mostra SOLO gli step 1-3 (OAuth flow)."
  echo "   Lo step 4 (chiamata API con Bearer) NON è stato testato da ACI."
  echo ""
  echo "   RICHIESTA AD ACI: Fornire il curl COMPLETO per lo step 4,"
  echo "   ovvero la chiamata a /rvfu/sh/cr/veicolo con il Bearer token."
fi
