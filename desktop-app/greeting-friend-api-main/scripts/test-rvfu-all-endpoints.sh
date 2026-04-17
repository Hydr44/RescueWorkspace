#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Test TUTTI gli endpoint RVFU CR — Centro Raccolta
# Usa il flusso OIDC completo per ottenere il Bearer token
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ── Configurazione ──────────────────────────────────────────────
BASE="https://formazione.ilportaledeltrasporto.it/rvfu/sh"
SSO_BASE="https://ssoformazione.ilportaledeltrasporto.it/sso"
REALM="/realms/root/realms/pdtusers"

CLIENT_ID="AUTODEM.RESCUEMANAGER"
CLIENT_SECRET="e3abea315f8d7acffca73941c6a0de2197068d15"
USERNAME="DETO000301"
PASSWORD="TEST.003"
REDIRECT_URI="https://localhost/"

# Targa di test (formazione ACI)
TEST_TARGA="VA054AJ"
TEST_TIPO_VEICOLO="A"
TEST_CAUSALE="D"

# PagoPA / Anagrafica base URLs (stesso dominio, path diverso)
ROOT="https://formazione.ilportaledeltrasporto.it"
PAGOPA_BASE="${ROOT}/pagamenti/sh/v1"
ANAG_BASE="${ROOT}/anagrafica/sh/v1"

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PASS=0
FAIL=0
SKIP=0
TOTAL=0

# ── Funzione test ───────────────────────────────────────────────
test_endpoint() {
  local num="$1"
  local method="$2"
  local path="$3"
  local desc="$4"
  local extra_args="${5:-}"
  
  TOTAL=$((TOTAL + 1))
  printf "${CYAN}[%02d]${NC} %-6s %-55s " "$num" "$method" "$path"
  
  local url="${BASE}${path}"
  local cmd="curl -s -o /dev/null -w '%{http_code}' -X ${method} '${url}' -H 'Authorization: Bearer ${TOKEN}' -H 'Content-Type: application/json'"
  
  if [ -n "$extra_args" ]; then
    cmd="curl -s -o /dev/null -w '%{http_code}' -X ${method} '${url}' -H 'Authorization: Bearer ${TOKEN}' -H 'Content-Type: application/json' ${extra_args}"
  fi
  
  local status
  status=$(eval "$cmd" 2>/dev/null) || status="ERR"
  
  if [[ "$status" == "200" || "$status" == "201" ]]; then
    printf "${GREEN}✅ %s${NC} %s\n" "$status" "$desc"
    PASS=$((PASS + 1))
  elif [[ "$status" == "404" ]]; then
    printf "${YELLOW}⚠️  %s${NC} %s (non trovato/nessun dato)\n" "$status" "$desc"
    PASS=$((PASS + 1))
  elif [[ "$status" == "400" ]]; then
    printf "${YELLOW}⚠️  %s${NC} %s (bad request — parametri mancanti?)\n" "$status" "$desc"
    SKIP=$((SKIP + 1))
  elif [[ "$status" == "401" || "$status" == "403" ]]; then
    printf "${RED}❌ %s${NC} %s (auth problem)\n" "$status" "$desc"
    FAIL=$((FAIL + 1))
  else
    printf "${RED}❌ %s${NC} %s\n" "$status" "$desc"
    FAIL=$((FAIL + 1))
  fi
}

# Funzione per test con body (mostra anche la risposta)
test_endpoint_verbose() {
  local num="$1"
  local method="$2"
  local path="$3"
  local desc="$4"
  local extra_args="${5:-}"
  
  TOTAL=$((TOTAL + 1))
  printf "${CYAN}[%02d]${NC} %-6s %-55s " "$num" "$method" "$path"
  
  local url="${BASE}${path}"
  local response
  local http_code
  
  if [ -n "$extra_args" ]; then
    response=$(curl -s -w "\n%{http_code}" -X ${method} "${url}" -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" ${extra_args} 2>/dev/null) || response="ERR"
  else
    response=$(curl -s -w "\n%{http_code}" -X ${method} "${url}" -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" 2>/dev/null) || response="ERR"
  fi
  
  http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | sed '$d' | head -c 200)
  
  if [[ "$http_code" == "200" || "$http_code" == "201" ]]; then
    printf "${GREEN}✅ %s${NC} %s\n" "$http_code" "$desc"
    echo "    └─ ${body}..."
    PASS=$((PASS + 1))
  elif [[ "$http_code" == "404" ]]; then
    printf "${YELLOW}⚠️  %s${NC} %s\n" "$http_code" "$desc"
    PASS=$((PASS + 1))
  elif [[ "$http_code" == "400" ]]; then
    printf "${YELLOW}⚠️  %s${NC} %s\n" "$http_code" "$desc"
    echo "    └─ ${body}"
    SKIP=$((SKIP + 1))
  else
    printf "${RED}❌ %s${NC} %s\n" "$http_code" "$desc"
    echo "    └─ ${body}"
    FAIL=$((FAIL + 1))
  fi
}

# ── Funzione test con URL assoluto (per PagoPA / Anagrafica) ───
test_endpoint_abs() {
  local num="$1"
  local method="$2"
  local full_url="$3"
  local display_path="$4"
  local desc="$5"
  local extra_args="${6:-}"
  
  TOTAL=$((TOTAL + 1))
  printf "${CYAN}[%02d]${NC} %-6s %-55s " "$num" "$method" "$display_path"
  
  local cmd="curl -s -o /dev/null -w '%{http_code}' -X ${method} '${full_url}' -H 'Authorization: Bearer ${TOKEN}' -H 'Content-Type: application/json'"
  
  if [ -n "$extra_args" ]; then
    cmd="curl -s -o /dev/null -w '%{http_code}' -X ${method} '${full_url}' -H 'Authorization: Bearer ${TOKEN}' -H 'Content-Type: application/json' ${extra_args}"
  fi
  
  local status
  status=$(eval "$cmd" 2>/dev/null) || status="ERR"
  
  if [[ "$status" == "200" || "$status" == "201" ]]; then
    printf "${GREEN}✅ %s${NC} %s\n" "$status" "$desc"
    PASS=$((PASS + 1))
  elif [[ "$status" == "404" ]]; then
    printf "${YELLOW}⚠️  %s${NC} %s (non trovato/nessun dato)\n" "$status" "$desc"
    PASS=$((PASS + 1))
  elif [[ "$status" == "400" ]]; then
    printf "${YELLOW}⚠️  %s${NC} %s (bad request — parametri mancanti?)\n" "$status" "$desc"
    SKIP=$((SKIP + 1))
  elif [[ "$status" == "401" || "$status" == "403" ]]; then
    printf "${RED}❌ %s${NC} %s (auth problem)\n" "$status" "$desc"
    FAIL=$((FAIL + 1))
  else
    printf "${RED}❌ %s${NC} %s\n" "$status" "$desc"
    FAIL=$((FAIL + 1))
  fi
}

test_endpoint_abs_verbose() {
  local num="$1"
  local method="$2"
  local full_url="$3"
  local display_path="$4"
  local desc="$5"
  local extra_args="${6:-}"
  
  TOTAL=$((TOTAL + 1))
  printf "${CYAN}[%02d]${NC} %-6s %-55s " "$num" "$method" "$display_path"
  
  local response
  if [ -n "$extra_args" ]; then
    response=$(curl -s -w "\n%{http_code}" -X ${method} "${full_url}" -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" ${extra_args} 2>/dev/null) || response="ERR"
  else
    response=$(curl -s -w "\n%{http_code}" -X ${method} "${full_url}" -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" 2>/dev/null) || response="ERR"
  fi
  
  local http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | sed '$d' | head -c 200)
  
  if [[ "$http_code" == "200" || "$http_code" == "201" ]]; then
    printf "${GREEN}✅ %s${NC} %s\n" "$http_code" "$desc"
    echo "    └─ ${body}..."
    PASS=$((PASS + 1))
  elif [[ "$http_code" == "404" ]]; then
    printf "${YELLOW}⚠️  %s${NC} %s\n" "$http_code" "$desc"
    PASS=$((PASS + 1))
  elif [[ "$http_code" == "400" ]]; then
    printf "${YELLOW}⚠️  %s${NC} %s\n" "$http_code" "$desc"
    echo "    └─ ${body}"
    SKIP=$((SKIP + 1))
  else
    printf "${RED}❌ %s${NC} %s\n" "$http_code" "$desc"
    echo "    └─ ${body}"
    FAIL=$((FAIL + 1))
  fi
}

# ── Autenticazione OIDC ─────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " RVFU — Test COMPLETO tutti endpoint CR"
echo " Base URL: ${BASE}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🔐 Step 1: Autenticazione..."

# 1. POST /sso/json/realms/root/realms/pdtusers/authenticate → tokenId + pdtsso-form cookie
AUTH_RESP=$(curl -s -D - -X POST "${SSO_BASE}/json${REALM}/authenticate" \
  -H "Content-Type: application/json" \
  -H "X-OpenAM-Username: ${USERNAME}" \
  -H "X-OpenAM-Password: ${PASSWORD}" \
  -H "Accept-API-Version: resource=2.0, protocol=1.0" \
  2>/dev/null)

# Cattura tokenId dal body JSON
TOKEN_ID=$(echo "$AUTH_RESP" | grep -o '"tokenId":"[^"]*"' | head -1 | sed 's/"tokenId":"//;s/"//')

# Cattura session cookie (pdtsso-form o iPlanetDirectoryPro)
SESSION_COOKIE=""
SESSION_COOKIE_NAME=""
for CNAME in pdtsso-form iPlanetDirectoryPro; do
  CVAL=$(echo "$AUTH_RESP" | grep -i "${CNAME}=" | head -1 | sed "s/.*${CNAME}=//;s/;.*//" | tr -d '\r\n')
  if [ -n "$CVAL" ]; then
    SESSION_COOKIE="$CVAL"
    SESSION_COOKIE_NAME="$CNAME"
    break
  fi
done

if [ -z "$TOKEN_ID" ]; then
  echo "${RED}❌ Autenticazione fallita — impossibile ottenere tokenId${NC}"
  echo "Response: $(echo "$AUTH_RESP" | tail -10)"
  exit 1
fi
echo "   ✅ tokenId ottenuto (${#TOKEN_ID} chars)"
if [ -n "$SESSION_COOKIE" ]; then
  echo "   ✅ Session cookie '${SESSION_COOKIE_NAME}' ottenuto"
else
  echo "   ⚠️  Nessun session cookie, uso tokenId come fallback"
  SESSION_COOKIE_NAME="iPlanetDirectoryPro"
  SESSION_COOKIE="${TOKEN_ID}"
fi

# 2. POST /sso/oauth2/realms/root/realms/pdtusers/authorize → authorization code (302 redirect)
echo "🔐 Step 2: Autorizzazione..."
AUTH_CODE_RESP=$(curl -s -D - -o /dev/null \
  -X POST "${SSO_BASE}/oauth2${REALM}/authorize" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Cookie: ${SESSION_COOKIE_NAME}=${SESSION_COOKIE}" \
  -d "scope=openid+profile" \
  -d "response_type=code" \
  -d "client_id=${CLIENT_ID}" \
  -d "csrf=${TOKEN_ID}" \
  -d "redirect_uri=${REDIRECT_URI}" \
  -d "state=rvfu_auth" \
  -d "nonce=n$(date +%s)" \
  -d "decision=allow" \
  2>/dev/null)

AUTH_CODE=$(echo "$AUTH_CODE_RESP" | grep -i 'Location:' | head -1 | sed 's/.*code=//;s/&.*//' | tr -d '\r\n')

if [ -z "$AUTH_CODE" ]; then
  echo "${RED}❌ Autorizzazione fallita — impossibile ottenere authorization code${NC}"
  echo "Response:"
  echo "$AUTH_CODE_RESP" | head -15
  exit 1
fi
echo "   ✅ Authorization code ottenuto (${#AUTH_CODE} chars)"

# 3. POST /sso/oauth2/realms/root/realms/pdtusers/access_token → id_token
echo "🔐 Step 3: Token exchange..."
TOKEN_RESP=$(curl -s "${SSO_BASE}/oauth2${REALM}/access_token" \
  -d "grant_type=authorization_code" \
  -d "code=${AUTH_CODE}" \
  -d "redirect_uri=${REDIRECT_URI}" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  2>/dev/null)

TOKEN=$(echo "$TOKEN_RESP" | grep -o '"id_token":"[^"]*"' | head -1 | sed 's/"id_token":"//;s/"//')
ACCESS_TOKEN=$(echo "$TOKEN_RESP" | grep -o '"access_token":"[^"]*"' | head -1 | sed 's/"access_token":"//;s/"//')

if [ -z "$TOKEN" ]; then
  echo "${RED}❌ Token exchange fallito${NC}"
  echo "Response: ${TOKEN_RESP}"
  exit 1
fi
echo "   ✅ id_token ottenuto (${#TOKEN} chars)"
echo "   ✅ access_token ottenuto (${#ACCESS_TOKEN} chars)"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " 🚗 VEICOLO — Ricerca e Causali"
echo "═══════════════════════════════════════════════════════════════"

test_endpoint_verbose 1 GET "/cr/veicolo?causale=${TEST_CAUSALE}&tipoVeicolo=${TEST_TIPO_VEICOLO}&targa=${TEST_TARGA}" \
  "Ricerca veicolo per targa"

test_endpoint_verbose 2 GET "/cr/veicolo?causale=${TEST_CAUSALE}&tipoVeicolo=${TEST_TIPO_VEICOLO}&targa=${TEST_TARGA}&codiceFiscale=RSSMRA80A01H501U" \
  "Ricerca veicolo con CF (test mismatch)"

test_endpoint_verbose 3 GET "/cr/causali" \
  "Lista causali"

test_endpoint_verbose 4 GET "/cr/causalePerCodice/D" \
  "Causale per codice D"

test_endpoint_verbose 5 GET "/cr/causalePerCodice/SD" \
  "Causale per codice SD"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " 📋 VFU — Consultazioni"
echo "═══════════════════════════════════════════════════════════════"

test_endpoint_verbose 6 GET "/cr/consulta/VFU?pageNumber=0&pageSize=5" \
  "Lista VFU (pagina 1)"

test_endpoint 7 GET "/cr/consultaPresaInCarico/VFU?pageNumber=0&pageSize=5" \
  "Lista presa in carico"

test_endpoint 8 GET "/cr/consultaRadiati/VFU?pageNumber=0&pageSize=5" \
  "Lista radiati"

test_endpoint 9 GET "/cr/consultaRichiestaIntegrazione/VFU?pageNumber=0&pageSize=5" \
  "Lista richiesta integrazione"

test_endpoint 10 GET "/cr/consultaRottamazione/VFU?pageNumber=0&pageSize=5" \
  "Lista rottamazione"

test_endpoint 11 GET "/cr/storico/VFU?tipoVeicolo=A&targa=${TEST_TARGA}" \
  "Storico VFU"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " 📊 VFU — Export XLSX"
echo "═══════════════════════════════════════════════════════════════"

test_endpoint 12 GET "/cr/export/VFU" \
  "Export XLSX VFU"

test_endpoint 13 GET "/cr/exportPresaInCarico/VFU" \
  "Export XLSX presa in carico"

test_endpoint 14 GET "/cr/exportRadiati/VFU" \
  "Export XLSX radiati"

test_endpoint 15 GET "/cr/exportRottamazione/VFU" \
  "Export XLSX rottamazione"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " 🖨️  VFU — Stampa PDF"
echo "═══════════════════════════════════════════════════════════════"

test_endpoint 16 GET "/cr/stampa/VFU" \
  "Stampa PDF VFU"

test_endpoint 17 GET "/cr/stampaPresaInCarico/VFU" \
  "Stampa PDF presa in carico"

test_endpoint 18 GET "/cr/stampaRadiati/VFU" \
  "Stampa PDF radiati"

test_endpoint 19 GET "/cr/stampaRottamazione/VFU" \
  "Stampa PDF rottamazione"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " 📎 FASCICOLO"
echo "═══════════════════════════════════════════════════════════════"

test_endpoint 20 GET "/cr/documentoVFU" \
  "Download documento VFU (senza params)"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " 📝 DELEGA"
echo "═══════════════════════════════════════════════════════════════"

test_endpoint_verbose 21 GET "/cr/consulta/delega?pageNumber=0&pageSize=5" \
  "Lista deleghe"

test_endpoint 22 GET "/cr/stampa/delega" \
  "Stampa PDF deleghe"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " 🏢 IMPRESA — Gestione VFU"
echo "═══════════════════════════════════════════════════════════════"

test_endpoint_verbose 23 GET "/cr/consulta/centroRaccolta?pageNumber=0&pageSize=5" \
  "Lista centri raccolta"

test_endpoint 24 GET "/cr/consulta/concessionario?codiceFiscale=00000000000" \
  "Lista concessionari (CF test)"

test_endpoint 25 GET "/cr/agenziaSTA" \
  "Ricerca agenzia STA"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " 🔧 UTILITY"
echo "═══════════════════════════════════════════════════════════════"

test_endpoint_verbose 26 GET "/utility/detail/utente" \
  "Dettaglio utente corrente"

test_endpoint_verbose 27 GET "/utility/provincia" \
  "Lista province"

test_endpoint_verbose 28 GET "/utility/comune?siglaProvincia=VA" \
  "Comuni provincia VA"

test_endpoint 29 GET "/utility/provincia/VA/comune" \
  "Comuni correnti VA"

test_endpoint_verbose 30 GET "/utility/statiEsteri" \
  "Lista stati esteri"

test_endpoint 31 GET "/utility/statoEstero?nome=FRANCIA" \
  "Ricerca stato estero"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " 🩺 MONITORAGGIO"
echo "═══════════════════════════════════════════════════════════════"

test_endpoint_verbose 32 GET "/mon/status/up" \
  "Health check"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " � PAGOPA — Nuovo Sistema Pagamenti"
echo " Base: ${PAGOPA_BASE}"
echo "═══════════════════════════════════════════════════════════════"

echo ""
echo "── 4.1 Gestione Tariffario ──"

test_endpoint_abs_verbose 33 GET \
  "${PAGOPA_BASE}/catalogo/tariffario" \
  "/pagamenti/sh/v1/catalogo/tariffario" \
  "Ricerca tipo tariffario"

test_endpoint_abs_verbose 34 GET \
  "${PAGOPA_BASE}/catalogo/corrispondenzatariffe?codiceTipoTariffario=N" \
  "/pagamenti/.../catalogo/corrispondenzatariffe" \
  "Corrispondenza tariffe nuove/vecchie"

test_endpoint_abs_verbose 35 GET \
  "${PAGOPA_BASE}/catalogo/elencocompleto" \
  "/pagamenti/.../catalogo/elencocompleto" \
  "Catalogo pratiche tariffe completo (cacheable)"

echo ""
echo "── 4.2 Gestione Cassetto Pagamenti ──"

test_endpoint_abs_verbose 36 GET \
  "${PAGOPA_BASE}/cassetto/ricerca/richiestaPagamento" \
  "/pagamenti/.../cassetto/ricerca/richiestaPagamento" \
  "Ricerca richieste pagamento"

test_endpoint_abs 37 GET \
  "${PAGOPA_BASE}/cassetto/saldo?codiceTipoTariffario=N&codiceTipoPratica=001" \
  "/pagamenti/.../cassetto/saldo" \
  "Verifica pagamenti (saldo)"

test_endpoint_abs 38 GET \
  "${PAGOPA_BASE}/cassetto/saldoCompleto" \
  "/pagamenti/.../cassetto/saldoCompleto" \
  "Saldo completo cassetto"

test_endpoint_abs_verbose 39 GET \
  "${PAGOPA_BASE}/cassetto/richiestePagate" \
  "/pagamenti/.../cassetto/richiestePagate" \
  "Ricerca richieste pagate"

test_endpoint_abs 40 GET \
  "${PAGOPA_BASE}/cassetto/stampaavvisopagamento/99999" \
  "/pagamenti/.../cassetto/stampaavvisopagamento/{id}" \
  "Stampa avviso pagamento (id fittizio)"

test_endpoint_abs 41 GET \
  "${PAGOPA_BASE}/cassetto/stamparicevutatelematica/99999" \
  "/pagamenti/.../cassetto/stamparicevutatelematica/{id}" \
  "Stampa ricevuta pagamento (id fittizio)"

test_endpoint_abs 42 POST \
  "${PAGOPA_BASE}/cassetto/inserimentoSpontaneo" \
  "/pagamenti/.../cassetto/inserimentoSpontaneo" \
  "Inserimento pagamento ASINCRONO (senza body)" \
  "-d '{}'"

test_endpoint_abs 43 POST \
  "${PAGOPA_BASE}/cassetto/inserimentospontaneosync" \
  "/pagamenti/.../cassetto/inserimentospontaneosync" \
  "Inserimento pagamento SINCRONO (senza body)" \
  "-d '{}'"

test_endpoint_abs 44 POST \
  "${PAGOPA_BASE}/cassetto/inserimentospontaneosync/contoterzi" \
  "/pagamenti/.../cassetto/.../contoterzi" \
  "Inserimento pagamento conto terzi (senza body)" \
  "-d '{}'"

test_endpoint_abs 45 PUT \
  "${PAGOPA_BASE}/cassetto/cancellarichiesta/99999" \
  "/pagamenti/.../cassetto/cancellarichiesta/{id}" \
  "Cancella richiesta (id fittizio)"

test_endpoint_abs 46 POST \
  "${PAGOPA_BASE}/cassetto/abbinamento/abilita/automatico/99999/S" \
  "/pagamenti/.../abbinamento/.../automatico/{id}/{flag}" \
  "Modifica flag abbinamento (id fittizio)"

echo ""
echo "── 4.3 Gestione Anagrafica PagoPA ──"

test_endpoint_abs_verbose 47 GET \
  "${ANAG_BASE}/elencoProvincieValide" \
  "/anagrafica/sh/v1/elencoProvincieValide" \
  "Elenco province valide"

test_endpoint_abs 48 GET \
  "${ANAG_BASE}/elencoProvincieValideByDate/2025-01-01" \
  "/anagrafica/.../elencoProvincieValideByDate/{data}" \
  "Province valide a data"

test_endpoint_abs_verbose 49 GET \
  "${ANAG_BASE}/elencoComuniValidi/058" \
  "/anagrafica/.../elencoComuniValidi/{codProv}" \
  "Comuni validi (prov 058=Roma)"

test_endpoint_abs 50 GET \
  "${ANAG_BASE}/elencoComuniValidiByData/058/2025-01-01" \
  "/anagrafica/.../elencoComuniValidiByData/{prov}/{data}" \
  "Comuni validi a data"

test_endpoint_abs_verbose 51 GET \
  "${ANAG_BASE}/elencoStatiValidi" \
  "/anagrafica/sh/v1/elencoStatiValidi" \
  "Elenco stati validi"

test_endpoint_abs 52 GET \
  "${ANAG_BASE}/elencoStatiValidiByData/2025-01-01" \
  "/anagrafica/.../elencoStatiValidiByData/{data}" \
  "Stati validi a data"

echo ""
echo "── 4.4 Riscatto Voucher ──"

test_endpoint_abs 53 GET \
  "${PAGOPA_BASE}/cassetto/adesioneriscatto" \
  "/pagamenti/.../cassetto/adesioneriscatto" \
  "Ricerca adesioni riscatto voucher"

test_endpoint_abs 54 GET \
  "${PAGOPA_BASE}/cassetto/codiceriscatto/verifica?codiceFiscale=RSSMRA80A01H501U&codiceRiscatto=TEST123" \
  "/pagamenti/.../cassetto/codiceriscatto/verifica" \
  "Verifica codice riscatto voucher"

echo ""
echo "── 4.5 Disaggregazione IUV ──"

test_endpoint_abs_verbose 55 GET \
  "${PAGOPA_BASE}/cassetto/ricerca/disaggregati" \
  "/pagamenti/.../cassetto/ricerca/disaggregati" \
  "Ricerca IUV disaggregati"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " �📊 RIEPILOGO"
echo "═══════════════════════════════════════════════════════════════"
echo ""
printf " Totale:   %d endpoint testati\n" "$TOTAL"
printf " ${GREEN}Passati:  %d${NC}\n" "$PASS"
printf " ${YELLOW}Skipped:  %d${NC} (bad request — parametri incompleti)\n" "$SKIP"
printf " ${RED}Falliti:  %d${NC}\n" "$FAIL"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo "${GREEN}🎉 Tutti gli endpoint rispondono correttamente!${NC}"
else
  echo "${RED}⚠️  ${FAIL} endpoint con errore — verificare auth o path${NC}"
fi
echo ""

# ── Curl singoli per debug ──────────────────────────────────────
echo "═══════════════════════════════════════════════════════════════"
echo " 📋 CURL singoli per debug (copia-incolla)"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "# Token (già ottenuto sopra):"
echo "TOKEN=\"${TOKEN:0:50}...\""
echo ""
echo "# Ricerca veicolo:"
echo "curl -s '${BASE}/cr/veicolo?causale=D&tipoVeicolo=A&targa=${TEST_TARGA}' \\"
echo "  -H 'Authorization: Bearer \$TOKEN' | python3 -m json.tool"
echo ""
echo "# Lista VFU:"
echo "curl -s '${BASE}/cr/consulta/VFU?pageNumber=0&pageSize=5' \\"
echo "  -H 'Authorization: Bearer \$TOKEN' | python3 -m json.tool"
echo ""
echo "# Causali:"
echo "curl -s '${BASE}/cr/causali' \\"
echo "  -H 'Authorization: Bearer \$TOKEN' | python3 -m json.tool"
echo ""
echo "# Dettaglio utente:"
echo "curl -s '${BASE}/utility/detail/utente' \\"
echo "  -H 'Authorization: Bearer \$TOKEN' | python3 -m json.tool"
echo ""
echo "# Province:"
echo "curl -s '${BASE}/utility/provincia' \\"
echo "  -H 'Authorization: Bearer \$TOKEN' | python3 -m json.tool"
echo ""
