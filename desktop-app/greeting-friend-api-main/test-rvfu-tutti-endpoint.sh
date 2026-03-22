#!/bin/bash
# ============================================================
# TEST COMPLETO TUTTI ENDPOINT RVFU
# Testa OGNI endpoint GET su:
#   1) /rvfu/sh/...          (nuovo path con API Gateway)
#   2) /demolitori-aci-ws/rest/...  (vecchio path diretto)
# Per ogni endpoint: Bearer id_token, Bearer access_token, no auth
# ============================================================

BASE_HOST="https://formazione.ilportaledeltrasporto.it"
RESULTS_FILE="/tmp/rvfu-test-results.txt"
> "$RESULTS_FILE"

echo "============================================================"
echo "TEST COMPLETO TUTTI ENDPOINT RVFU"
echo "$(date)"
echo "============================================================"

# ============================================================
# STEP 1-3: OAuth flow (identico a test precedente)
# ============================================================
echo ""
echo "=== STEP 1: AUTHENTICATE ==="
AUTH_RESP=$(curl -s --request POST \
  --header "Content-Type: application/json" \
  --header "X-OpenAM-Username: DETO000301" \
  --header "X-OpenAM-Password: TEST.003" \
  --header "Accept-API-Version: resource=2.0, protocol=1.0" \
  https://ssoformazione.ilportaledeltrasporto.it/sso/json/authenticate)

TOKEN_ID=$(echo "$AUTH_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['tokenId'])" 2>/dev/null)
if [ -z "$TOKEN_ID" ]; then
  echo "❌ ERRORE: authenticate fallito. Risposta: $AUTH_RESP"
  exit 1
fi
echo "✅ tokenId: ${#TOKEN_ID} char"

echo ""
echo "=== STEP 2: AUTHORIZE ==="
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
if [ -z "$AUTH_CODE" ]; then
  echo "❌ ERRORE: authorize fallito."
  exit 1
fi
echo "✅ code: ${#AUTH_CODE} char"

echo ""
echo "=== STEP 3: ACCESS TOKEN ==="
TOKEN_RESP=$(curl -s --request POST \
  --data "grant_type=authorization_code" \
  --data "code=$AUTH_CODE" \
  --data "client_id=AUTODEM.RESCUEMANAGER" \
  --data "client_secret=e3abea315f8d7acffca73941c6a0de2197068d15" \
  --data "redirect_uri=https://localhost/" \
  https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/access_token)

ID_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['id_token'])" 2>/dev/null)
ACCESS_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
if [ -z "$ID_TOKEN" ]; then
  echo "❌ ERRORE: access_token fallito."
  exit 1
fi
echo "✅ id_token: ${#ID_TOKEN} char | access_token: ${#ACCESS_TOKEN} char"

echo ""
echo "============================================================"
echo "OAuth flow OK. Inizio test endpoint..."
echo "============================================================"

# ============================================================
# Funzione per testare un singolo endpoint
# Testa su entrambi i base path con 3 modalità di auth
# ============================================================
COUNTER=0
OK_SH=0
FAIL_SH=0
OK_OLD=0
FAIL_OLD=0

test_endpoint() {
  local LABEL="$1"
  local REST_PATH="$2"  # es: cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=FN082XY
  local METHOD="${3:-GET}"
  
  COUNTER=$((COUNTER + 1))
  
  echo ""
  echo "--- [$COUNTER] $LABEL ---"
  echo "    Path: $REST_PATH"
  
  # === Test su /rvfu/sh/ con Bearer id_token ===
  local URL_SH="${BASE_HOST}/rvfu/sh/${REST_PATH}"
  local RESP_SH=$(curl -s -o /tmp/rvfu_test_sh.txt -w "%{http_code}" \
    -X "$METHOD" \
    -H "Authorization: Bearer $ID_TOKEN" \
    -H "Accept: application/json" \
    -b "iPlanetDirectoryPro=$TOKEN_ID" \
    "$URL_SH" 2>/dev/null)
  local BODY_SH=$(cat /tmp/rvfu_test_sh.txt 2>/dev/null | head -c 120)
  
  # === Test su /demolitori-aci-ws/rest/ con Bearer id_token ===
  local URL_OLD="${BASE_HOST}/demolitori-aci-ws/rest/${REST_PATH}"
  local RESP_OLD=$(curl -s -D /tmp/rvfu_test_old_h.txt -o /tmp/rvfu_test_old.txt -w "%{http_code}" \
    -X "$METHOD" \
    -H "Authorization: Bearer $ID_TOKEN" \
    -H "Accept: application/json" \
    -b "iPlanetDirectoryPro=$TOKEN_ID" \
    "$URL_OLD" 2>/dev/null)
  local BODY_OLD=$(cat /tmp/rvfu_test_old.txt 2>/dev/null | head -c 120)
  local LOCATION_OLD=""
  if [ "$RESP_OLD" = "302" ]; then
    LOCATION_OLD=$(grep -i '^Location:' /tmp/rvfu_test_old_h.txt 2>/dev/null | tr -d '\r' | head -c 100)
  fi
  
  # === Test su /rvfu/sh/ SENZA auth (baseline) ===
  local RESP_NOAUTH=$(curl -s -o /dev/null -w "%{http_code}" \
    -X "$METHOD" \
    -H "Accept: application/json" \
    "$URL_SH" 2>/dev/null)
  
  # Conteggi
  if [ "$RESP_SH" = "200" ]; then OK_SH=$((OK_SH + 1)); else FAIL_SH=$((FAIL_SH + 1)); fi
  if [ "$RESP_OLD" = "200" ]; then OK_OLD=$((OK_OLD + 1)); else FAIL_OLD=$((FAIL_OLD + 1)); fi
  
  # Output
  local SH_ICON="❌"; [ "$RESP_SH" = "200" ] && SH_ICON="✅"
  local OLD_ICON="❌"; [ "$RESP_OLD" = "200" ] && OLD_ICON="✅"
  
  echo "    /rvfu/sh/        → $SH_ICON HTTP $RESP_SH | $BODY_SH"
  echo "    /demolitori-aci-ws/rest/ → $OLD_ICON HTTP $RESP_OLD | $BODY_OLD"
  [ -n "$LOCATION_OLD" ] && echo "      Location: $LOCATION_OLD"
  echo "    /rvfu/sh/ no-auth → HTTP $RESP_NOAUTH"
  
  # Salva risultato
  echo "$COUNTER|$LABEL|$REST_PATH|$METHOD|$RESP_SH|$RESP_OLD|$RESP_NOAUTH" >> "$RESULTS_FILE"
}

# ============================================================
# GRUPPO 1: VEICOLO (CR) — Endpoint base per ricerca veicoli
# ============================================================
echo ""
echo "=========================================="
echo "GRUPPO 1: VEICOLO (CR)"
echo "=========================================="

test_endpoint "Ricerca veicolo per targa" \
  "cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=FN082XY"

test_endpoint "Lista causali" \
  "cr/causali"

test_endpoint "Causale per codice (DEMOLIZIONE)" \
  "cr/causalePerCodice/DEMOLIZIONE"

# ============================================================
# GRUPPO 2: VFU (CR) — Consultazioni lista VFU
# ============================================================
echo ""
echo "=========================================="
echo "GRUPPO 2: VFU (CR) — Consultazioni"
echo "=========================================="

test_endpoint "Consulta VFU (lista paginata)" \
  "cr/consulta/VFU?pageNumber=0&pageSize=5"

test_endpoint "Consulta Presa In Carico VFU" \
  "cr/consultaPresaInCarico/VFU?pageNumber=0&pageSize=5"

test_endpoint "Consulta Rottamazione VFU" \
  "cr/consultaRottamazione/VFU?pageNumber=0&pageSize=5"

test_endpoint "Consulta Radiati VFU" \
  "cr/consultaRadiati/VFU?pageNumber=0&pageSize=5"

test_endpoint "Consulta Richiesta Integrazione VFU" \
  "cr/consultaRichiestaIntegrazione/VFU?pageNumber=0&pageSize=5"

test_endpoint "Storico VFU" \
  "cr/storico/VFU?tipoVeicolo=A&pageNumber=0&pageSize=5"

# ============================================================
# GRUPPO 3: VFU (CR) — Export e Stampa
# ============================================================
echo ""
echo "=========================================="
echo "GRUPPO 3: VFU (CR) — Export/Stampa"
echo "=========================================="

test_endpoint "Export VFU (xlsx)" \
  "cr/export/VFU"

test_endpoint "Export Presa In Carico (xlsx)" \
  "cr/exportPresaInCarico/VFU"

test_endpoint "Export Radiati (xlsx)" \
  "cr/exportRadiati/VFU"

test_endpoint "Export Rottamazione (xlsx)" \
  "cr/exportRottamazione/VFU"

test_endpoint "Stampa VFU (pdf)" \
  "cr/stampa/VFU"

test_endpoint "Stampa Presa In Carico (pdf)" \
  "cr/stampaPresaInCarico/VFU"

test_endpoint "Stampa Radiati (pdf)" \
  "cr/stampaRadiati/VFU"

test_endpoint "Stampa Rottamazione (pdf)" \
  "cr/stampaRottamazione/VFU"

# ============================================================
# GRUPPO 4: FASCICOLO (CR)
# ============================================================
echo ""
echo "=========================================="
echo "GRUPPO 4: FASCICOLO (CR)"
echo "=========================================="

test_endpoint "Download documento VFU" \
  "cr/documentoVFU?idAci=1"

# ============================================================
# GRUPPO 5: DELEGA (CR)
# ============================================================
echo ""
echo "=========================================="
echo "GRUPPO 5: DELEGA (CR)"
echo "=========================================="

test_endpoint "Consulta deleghe" \
  "cr/consulta/delega?pageNumber=0&pageSize=5"

test_endpoint "Stampa deleghe (pdf)" \
  "cr/stampa/delega"

# ============================================================
# GRUPPO 6: IMPRESA GESTIONE VFU (CR)
# ============================================================
echo ""
echo "=========================================="
echo "GRUPPO 6: IMPRESA GESTIONE VFU (CR)"
echo "=========================================="

test_endpoint "Consulta Centro Raccolta" \
  "cr/consulta/centroRaccolta?pageNumber=0&pageSize=5"

test_endpoint "Consulta Concessionario" \
  "cr/consulta/concessionario?codiceFiscale=TESTCF00000000&pageNumber=0&pageSize=5"

# ============================================================
# GRUPPO 7: UTILITY (trasversale)
# ============================================================
echo ""
echo "=========================================="
echo "GRUPPO 7: UTILITY"
echo "=========================================="

test_endpoint "Dettaglio utente corrente" \
  "utility/detail/utente"

test_endpoint "Lista province" \
  "utility/provincia"

test_endpoint "Comuni per provincia (RM)" \
  "utility/comune?siglaProvincia=RM"

test_endpoint "Comuni correnti per codiceDtt (058)" \
  "utility/provincia/058/comune"

test_endpoint "Stati esteri" \
  "utility/statiEsteri"

test_endpoint "Stato estero (cerca)" \
  "utility/statoEstero"

# ============================================================
# GRUPPO 8: MONITORAGGIO
# ============================================================
echo ""
echo "=========================================="
echo "GRUPPO 8: MONITORAGGIO"
echo "=========================================="

# Monitoraggio ha path diverso: /demolitori-aci-ws/mon/ (non /rest/)
echo ""
echo "--- [EXTRA] Monitoraggio status ---"
RESP_MON=$(curl -s -o /tmp/rvfu_mon.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Accept: application/json" \
  "${BASE_HOST}/demolitori-aci-ws/mon/status/up")
echo "    /demolitori-aci-ws/mon/status/up → HTTP $RESP_MON | $(cat /tmp/rvfu_mon.txt | head -c 120)"

RESP_MON_SH=$(curl -s -o /tmp/rvfu_mon_sh.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Accept: application/json" \
  "${BASE_HOST}/rvfu/sh/mon/status/up")
echo "    /rvfu/sh/mon/status/up → HTTP $RESP_MON_SH | $(cat /tmp/rvfu_mon_sh.txt | head -c 120)"

RESP_MON_NOAUTH=$(curl -s -o /dev/null -w "%{http_code}" \
  "${BASE_HOST}/demolitori-aci-ws/mon/status/up")
echo "    /demolitori-aci-ws/mon/status/up no-auth → HTTP $RESP_MON_NOAUTH"

# ============================================================
# GRUPPO 9: Test path base (root dei vari prefissi)
# ============================================================
echo ""
echo "=========================================="
echo "GRUPPO 9: Test root path"
echo "=========================================="

echo ""
echo "--- Root /rvfu/sh/ ---"
RESP_ROOT_SH=$(curl -s -o /tmp/rvfu_root_sh.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ID_TOKEN" \
  "${BASE_HOST}/rvfu/sh/")
echo "    HTTP $RESP_ROOT_SH | $(cat /tmp/rvfu_root_sh.txt | head -c 120)"

echo ""
echo "--- Root /demolitori-aci-ws/rest/ ---"
RESP_ROOT_OLD=$(curl -s -D /tmp/rvfu_root_old_h.txt -o /tmp/rvfu_root_old.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ID_TOKEN" \
  "${BASE_HOST}/demolitori-aci-ws/rest/")
echo "    HTTP $RESP_ROOT_OLD | $(cat /tmp/rvfu_root_old.txt | head -c 120)"
[ "$RESP_ROOT_OLD" = "302" ] && echo "    Location: $(grep -i '^Location:' /tmp/rvfu_root_old_h.txt | tr -d '\r' | head -c 120)"

echo ""
echo "--- Root /rvfu/ (senza sh) ---"
RESP_ROOT_RVFU=$(curl -s -D /tmp/rvfu_root_rvfu_h.txt -o /tmp/rvfu_root_rvfu.txt -w "%{http_code}" \
  -H "Authorization: Bearer $ID_TOKEN" \
  "${BASE_HOST}/rvfu/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=FN082XY")
echo "    HTTP $RESP_ROOT_RVFU | $(cat /tmp/rvfu_root_rvfu.txt | head -c 120)"
[ "$RESP_ROOT_RVFU" = "302" ] && echo "    Location: $(grep -i '^Location:' /tmp/rvfu_root_rvfu_h.txt | tr -d '\r' | head -c 120)"

# ============================================================
# RIEPILOGO FINALE
# ============================================================
echo ""
echo ""
echo "============================================================"
echo "============================================================"
echo "    RIEPILOGO FINALE — $(date)"
echo "============================================================"
echo "============================================================"
echo ""
echo "OAuth flow (step 1-3): ✅ OK"
echo ""
echo "Endpoint testati: $COUNTER"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "/rvfu/sh/ (nuovo API Gateway):"
echo "  ✅ OK:   $OK_SH"
echo "  ❌ FAIL: $FAIL_SH"
echo ""
echo "/demolitori-aci-ws/rest/ (vecchio path):"
echo "  ✅ OK:   $OK_OLD"
echo "  ❌ FAIL: $FAIL_OLD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Dettaglio per endpoint:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
printf "%-4s %-40s %-12s %-12s %-10s\n" "#" "ENDPOINT" "/rvfu/sh/" "/old-path/" "no-auth"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
while IFS='|' read -r NUM LABEL PATH METHOD RESP_SH RESP_OLD RESP_NOAUTH; do
  SH_ICON="❌"; [ "$RESP_SH" = "200" ] && SH_ICON="✅"
  OLD_ICON="❌"; [ "$RESP_OLD" = "200" ] && OLD_ICON="✅"
  printf "%-4s %-40s %s %-10s %s %-10s %-10s\n" "$NUM" "$LABEL" "$SH_ICON" "$RESP_SH" "$OLD_ICON" "$RESP_OLD" "$RESP_NOAUTH"
done < "$RESULTS_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "CONCLUSIONE:"
if [ "$OK_SH" -eq 0 ]; then
  echo "❌ /rvfu/sh/ restituisce errore per TUTTI i $COUNTER endpoint testati."
  echo "   Il problema NON è specifico di /cr/veicolo ma riguarda TUTTO il path /rvfu/sh/."
  echo "   È un problema di configurazione API Gateway/nginx lato ACI."
fi
if [ "$OK_OLD" -gt 0 ]; then
  echo "✅ /demolitori-aci-ws/rest/ risponde correttamente per $OK_OLD/$COUNTER endpoint."
  echo "   Il vecchio path funziona (anche se con redirect CDSSO 302)."
fi
echo ""
echo "File risultati salvato in: $RESULTS_FILE"
echo ""
