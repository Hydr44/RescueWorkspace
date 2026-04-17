#!/bin/bash
# ============================================================
# TEST FLUSSO COMPLETO RVFU — 16 Aprile 2026
# URL SSO corretti (con realm path /realms/root/realms/pdtusers)
# Credenziali: DETO003001 / TEST.030
# ============================================================

set -e

SSO_BASE="https://ssoformazione.ilportaledeltrasporto.it/sso"
API_BASE="https://formazione.ilportaledeltrasporto.it/rvfu/sh"
REALM="/realms/root/realms/pdtusers"
CLIENT_ID="AUTODEM.RESCUEMANAGER"
CLIENT_SECRET="e3abea315f8d7acffca73941c6a0de2197068d15"
REDIRECT_URI="https://localhost/"
USERNAME="DETO003001"
PASSWORD="TEST.030"

# Targhe test
TARGHE_VA=("VA076AJ" "VA185AJ" "VA187AJ" "VA189AJ" "VA205AJ" "VA207AJ" "VA209AJ")
TARGHE_AG=("AG004552" "AG004553" "AG004554" "AG004555" "AG004557" "AG004559" "AG004560" "AG004562" "AG004563" "AG004564")
CAUSALI=("D" "P" "V" "R")

echo "============================================================"
echo "TEST FLUSSO COMPLETO RVFU"
echo "$(date)"
echo "============================================================"

# ============================================================
# STEP 1: AUTHENTICATE
# ============================================================
echo ""
echo "=== STEP 1: AUTHENTICATE ==="
echo "URL: $SSO_BASE/json${REALM}/authenticate"
AUTH_RESP=$(curl -sk --request POST \
  --header "Content-Type: application/json" \
  --header "X-OpenAM-Username: $USERNAME" \
  --header "X-OpenAM-Password: $PASSWORD" \
  --header "Accept-API-Version: resource=2.0, protocol=1.0" \
  "$SSO_BASE/json${REALM}/authenticate")

TOKEN_ID=$(echo "$AUTH_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tokenId',''))" 2>/dev/null)
if [ -z "$TOKEN_ID" ]; then
  echo "❌ ERRORE: tokenId non ottenuto"
  echo "Risposta: $AUTH_RESP"
  exit 1
fi
echo "✅ tokenId ottenuto: ${#TOKEN_ID} char"

# ============================================================
# STEP 2: AUTHORIZE
# ============================================================
echo ""
echo "=== STEP 2: AUTHORIZE ==="
echo "URL: $SSO_BASE/oauth2${REALM}/authorize"
AUTH_HEADERS=$(curl -sk --dump-header - -o /dev/null \
  --request POST \
  -b "pdtsso-form=$TOKEN_ID" \
  --data "scope=openid profile" \
  --data "response_type=code" \
  --data "client_id=$CLIENT_ID" \
  --data "csrf=$TOKEN_ID" \
  --data "redirect_uri=$REDIRECT_URI" \
  --data "state=rvfu_test" \
  --data "nonce=n$(date +%s)" \
  --data "decision=allow" \
  "$SSO_BASE/oauth2${REALM}/authorize")

AUTH_CODE=$(echo "$AUTH_HEADERS" | grep -i "^Location:" | tr -d '\r' | sed 's/.*code=\([^&]*\).*/\1/')
HTTP_STATUS=$(echo "$AUTH_HEADERS" | head -1 | awk '{print $2}')

if [ -z "$AUTH_CODE" ]; then
  echo "❌ ERRORE: authorization code non ottenuto (HTTP $HTTP_STATUS)"
  echo "Headers: $(echo "$AUTH_HEADERS" | head -5)"
  exit 1
fi
echo "✅ HTTP $HTTP_STATUS — code ottenuto: ${#AUTH_CODE} char"

# ============================================================
# STEP 3: ACCESS TOKEN
# ============================================================
echo ""
echo "=== STEP 3: ACCESS TOKEN ==="
echo "URL: $SSO_BASE/oauth2${REALM}/access_token"
TOKEN_RESP=$(curl -sk --request POST \
  --data "grant_type=authorization_code" \
  --data "code=$AUTH_CODE" \
  --data "client_id=$CLIENT_ID" \
  --data "client_secret=$CLIENT_SECRET" \
  --data "redirect_uri=$REDIRECT_URI" \
  "$SSO_BASE/oauth2${REALM}/access_token")

ID_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id_token',''))" 2>/dev/null)
if [ -z "$ID_TOKEN" ]; then
  echo "❌ ERRORE: id_token non ottenuto"
  echo "Risposta: $(echo "$TOKEN_RESP" | head -c 300)"
  exit 1
fi
echo "✅ id_token: ${#ID_TOKEN} char"

# Decodifica claims
echo "   Claims: $(echo "$ID_TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'sub={d.get(\"sub\")}, aud={d.get(\"aud\")}')" 2>/dev/null)"

echo ""
echo "============================================================"
echo "AUTH COMPLETATA ✅ — Inizio test API"
echo "============================================================"

# ============================================================
# FUNZIONE HELPER per chiamate API
# ============================================================
api_get() {
  local path="$1"
  local desc="$2"
  local resp=$(curl -sk -w "\n%{http_code}" \
    -H "Authorization: Bearer $ID_TOKEN" \
    -H "Accept: application/json" \
    "$API_BASE$path")
  local http_code=$(echo "$resp" | tail -1)
  local body=$(echo "$resp" | sed '$d')
  local esito=$(echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('esito',{}).get('code','?'))" 2>/dev/null)
  local msg=$(echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('esito',{}).get('message','?')[:80])" 2>/dev/null)
  
  if [ "$http_code" = "200" ] && [ "$esito" = "E000" ]; then
    echo "  ✅ $desc — HTTP $http_code, $esito"
  else
    echo "  ❌ $desc — HTTP $http_code, $esito: $msg"
  fi
  # Salva ultimo body per uso successivo
  LAST_BODY="$body"
}

api_put() {
  local path="$1"
  local data="$2"
  local desc="$3"
  local resp=$(curl -sk -w "\n%{http_code}" \
    -H "Authorization: Bearer $ID_TOKEN" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -X PUT \
    -d "$data" \
    "$API_BASE$path")
  local http_code=$(echo "$resp" | tail -1)
  local body=$(echo "$resp" | sed '$d')
  local esito=$(echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('esito',{}).get('code','?'))" 2>/dev/null)
  local msg=$(echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('esito',{}).get('message','?')[:80])" 2>/dev/null)
  
  if [ "$http_code" = "200" ] && [ "$esito" = "E000" ]; then
    echo "  ✅ $desc — HTTP $http_code, $esito"
  else
    echo "  ❌ $desc — HTTP $http_code, $esito: $msg"
  fi
  LAST_BODY="$body"
}

api_post() {
  local path="$1"
  local data="$2"
  local desc="$3"
  local resp=$(curl -sk -w "\n%{http_code}" \
    -H "Authorization: Bearer $ID_TOKEN" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -X POST \
    -d "$data" \
    "$API_BASE$path")
  local http_code=$(echo "$resp" | tail -1)
  local body=$(echo "$resp" | sed '$d')
  local esito=$(echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('esito',{}).get('code','?'))" 2>/dev/null)
  local msg=$(echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('esito',{}).get('message','?')[:80])" 2>/dev/null)
  
  if [ "$http_code" = "200" ] && [ "$esito" = "E000" ]; then
    echo "  ✅ $desc — HTTP $http_code, $esito"
  else
    echo "  ❌ $desc — HTTP $http_code, $esito: $msg"
  fi
  LAST_BODY="$body"
}

# ============================================================
# TEST A: Dettaglio utente
# ============================================================
echo ""
echo "=== TEST A: DETTAGLIO UTENTE ==="
api_get "/utility/detail/utente" "Dettaglio utente"
echo "   Dettaglio: $(echo "$LAST_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin).get('result',{}); print(f'CF={d.get(\"codiceFiscaleImpresa\")}, matricola={d.get(\"matricola\")}, profili={d.get(\"profili\")}')" 2>/dev/null)"

# ============================================================
# TEST B: Ricerca veicolo — TUTTE le targhe VA* con TUTTE le causali
# ============================================================
echo ""
echo "=== TEST B: RICERCA VEICOLO — Targhe VA* ==="
for TARGA in "${TARGHE_VA[@]}"; do
  echo "  --- $TARGA ---"
  for CAUSALE in "${CAUSALI[@]}"; do
    api_get "/cr/veicolo?causale=$CAUSALE&targa=$TARGA" "$TARGA causale=$CAUSALE"
  done
done

# ============================================================
# TEST C: Ricerca veicolo — Targhe AG* dal doc ACI
# ============================================================
echo ""
echo "=== TEST C: RICERCA VEICOLO — Targhe AG* (doc ACI) ==="
for TARGA in "${TARGHE_AG[@]}"; do
  echo "  --- $TARGA ---"
  for CAUSALE in "${CAUSALI[@]}"; do
    api_get "/cr/veicolo?causale=$CAUSALE&targa=$TARGA" "$TARGA causale=$CAUSALE"
  done
done

# ============================================================
# TEST D: Lista VFU esistenti
# ============================================================
echo ""
echo "=== TEST D: CONSULTAZIONE VFU ==="
api_get "/cr/consulta/VFU?size=10&page=0" "Lista VFU"
echo "   Totale: $(echo "$LAST_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('totalElements','?'))" 2>/dev/null)"

api_get "/cr/consultaPresaInCarico/VFU?size=10&page=0" "VFU Presa in Carico"
echo "   Totale: $(echo "$LAST_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('totalElements','?'))" 2>/dev/null)"

api_get "/cr/consultaRottamazione/VFU?size=10&page=0" "VFU Rottamazione"
echo "   Totale: $(echo "$LAST_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('totalElements','?'))" 2>/dev/null)"

api_get "/cr/consultaRadiati/VFU?size=10&page=0" "VFU Radiati"
echo "   Totale: $(echo "$LAST_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('totalElements','?'))" 2>/dev/null)"

# ============================================================
# TEST E: Registrazione VFU con targa AG non ancora usata
# Cerchiamo prima una targa disponibile
# ============================================================
echo ""
echo "=== TEST E: REGISTRAZIONE VFU ==="
echo "  Cerco targa disponibile tra le AG*..."

REG_TARGA=""
REG_TELAIO=""
REG_FABBRICA=""
for TARGA in "${TARGHE_AG[@]}"; do
  resp=$(curl -sk \
    -H "Authorization: Bearer $ID_TOKEN" \
    -H "Accept: application/json" \
    "$API_BASE/cr/veicolo?causale=D&targa=$TARGA")
  esito=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('esito',{}).get('code','?'))" 2>/dev/null)
  if [ "$esito" = "E000" ]; then
    telaio=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('telaio',''))" 2>/dev/null)
    fabbrica=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('fabbrica',''))" 2>/dev/null)
    tipo=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('tipoVeicolo',''))" 2>/dev/null)
    if [ -n "$telaio" ] && [ "$telaio" != "None" ]; then
      REG_TARGA="$TARGA"
      REG_TELAIO="$telaio"
      REG_FABBRICA="$fabbrica"
      REG_TIPO="$tipo"
      echo "  ✅ Trovata targa registrabile: $TARGA (telaio=$telaio, tipo=$tipo)"
      break
    fi
  fi
done

# Prova anche targhe VA con causale D
if [ -z "$REG_TARGA" ]; then
  echo "  Nessuna targa AG disponibile con D. Provo VA* con causale V..."
  for TARGA in "${TARGHE_VA[@]}"; do
    resp=$(curl -sk \
      -H "Authorization: Bearer $ID_TOKEN" \
      -H "Accept: application/json" \
      "$API_BASE/cr/veicolo?causale=V&targa=$TARGA")
    esito=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('esito',{}).get('code','?'))" 2>/dev/null)
    if [ "$esito" = "E000" ]; then
      telaio=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('telaio',''))" 2>/dev/null)
      fabbrica=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('fabbrica',''))" 2>/dev/null)
      tipo=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('tipoVeicolo',''))" 2>/dev/null)
      if [ -n "$telaio" ] && [ "$telaio" != "None" ]; then
        REG_TARGA="$TARGA"
        REG_TELAIO="$telaio"
        REG_FABBRICA="$fabbrica"
        REG_TIPO="$tipo"
        REG_CAUSALE="V"
        echo "  ✅ Trovata targa VA registrabile: $TARGA (telaio=$telaio, tipo=$tipo, causale=V)"
        break
      fi
    fi
  done
fi

if [ -z "$REG_TARGA" ]; then
  echo "  ❌ Nessuna targa disponibile per registrazione"
else
  CAUSALE_REG="${REG_CAUSALE:-D}"
  echo ""
  echo "  --- Registrazione VFU: $REG_TARGA (causale=$CAUSALE_REG) ---"
  
  REG_PAYLOAD=$(cat <<EOF
{
  "causale": "$CAUSALE_REG",
  "dataRitiro": "$(date -u +%Y-%m-%dT00:00:00Z)",
  "fabbrica": "$REG_FABBRICA",
  "flagConsegnaForzeOrdine": "N",
  "flagIntestatarioForzato": "S",
  "flagTipoRegime": "1",
  "forzaRegistrazione": "N",
  "intestatario": {
    "capResidenza": "00100",
    "codiceComuneResidenza": "091",
    "codiceFiscale": "MROBNI82B11H501L",
    "codiceProvinciaResidenza": "058",
    "cognome": "Bianchi",
    "dataNascita": "1982-02-11T00:00:00Z",
    "indirizzoResidenza": "Via Flaminia, 4",
    "nome": "Mario"
  },
  "obbligoIscrizionePRA": "N",
  "targa": "$REG_TARGA",
  "telaio": "$REG_TELAIO",
  "tipoVeicolo": "$REG_TIPO"
}
EOF
)
  
  api_post "/cr/VFU" "$REG_PAYLOAD" "POST /cr/VFU ($REG_TARGA)"
  
  # Estrai idVFU dalla risposta
  VFU_ID=$(echo "$LAST_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('idVFU',''))" 2>/dev/null)
  VFU_STATO=$(echo "$LAST_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('statoVFU',''))" 2>/dev/null)
  VFU_DPIC=$(echo "$LAST_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('dataPresaInCarico','null'))" 2>/dev/null)
  VFU_FASCICOLO=$(echo "$LAST_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('idFascicolo',''))" 2>/dev/null)
  
  echo "   idVFU: $VFU_ID"
  echo "   statoVFU: $VFU_STATO"
  echo "   dataPresaInCarico: $VFU_DPIC"
  echo "   idFascicolo: $VFU_FASCICOLO"
  
  if [ -n "$VFU_ID" ] && [ "$VFU_ID" != "None" ] && [ "$VFU_ID" != "" ]; then
    # ============================================================
    # TEST F: FLUSSO POST-REGISTRAZIONE
    # ============================================================
    echo ""
    echo "=== TEST F: FLUSSO POST-REGISTRAZIONE (idVFU=$VFU_ID) ==="
    
    # F1: Genera Ricevuta Presa in Carico
    echo "  --- F1: Genera Ricevuta Presa in Carico ---"
    api_post "/cr/genera/ricevutaPresaInCarico/$VFU_ID" "{}" "Genera Ricevuta"
    
    # F2: Genera Certificato di Rottamazione (con dati veicolo)
    echo "  --- F2: Genera Certificato di Rottamazione ---"
    # Prima recupera dati veicolo per il payload CDR
    CDR_PAYLOAD=$(cat <<EOFCDR
{
  "causale": null,
  "cic": null,
  "dataImmatricolazione": null,
  "dataRegistrazione": "$(date -u +%Y-%m-%dT%H:%M:%S)",
  "destinazioneVeicolo": null,
  "enteConferimento": "TEST",
  "enteRitiro": "TEST",
  "modello": "$REG_FABBRICA",
  "obbligoIscrizionePRA": "N",
  "ostativiEForzature": null,
  "radiabile": "SI",
  "regimeVeicolo": "1",
  "soggettoVeicolo": {
    "capResidenza": "00100",
    "codiceFiscale": "MROBNI82B11H501L",
    "cognome": "Bianchi",
    "indirizzoResidenza": "Via Flaminia, 4",
    "nome": "Mario",
    "codiceComuneResidenza": "091",
    "codiceProvinciaResidenza": "058"
  },
  "statoVFU": "PRESO IN CARICO",
  "targa": "$REG_TARGA",
  "telaio": "$REG_TELAIO",
  "tipoUtilizzoVeicolo": null,
  "tipoVeicolo": "$REG_TIPO",
  "vincoloOstativo": "NO"
}
EOFCDR
)
    api_post "/cr/genera/certificatoRottamazione/$VFU_ID" "$CDR_PAYLOAD" "Genera CDR"
    
    # F3: Consulta documenti fascicolo
    echo "  --- F3: Documenti fascicolo ---"
    api_get "/cr/consulta/documentoVFU/$VFU_ID" "Lista documenti"
    echo "   Docs: $(echo "$LAST_BODY" | python3 -c "import sys,json; r=json.load(sys.stdin).get('result',[]); print(f'{len(r)} documenti: {[d.get(\"tipoDocumento\",\"?\") for d in r]}')" 2>/dev/null)"
    
    # F4: Chiudi fascicolo
    echo "  --- F4: Chiudi fascicolo ---"
    api_put "/cr/chiudi/fascicolo/$VFU_ID" "{}" "Chiudi fascicolo"
    
    # F5: Verifica VFU
    echo "  --- F5: Verifica VFU ---"
    api_put "/cr/verifica/VFU/$VFU_ID/$CAUSALE_REG" "{}" "Verifica VFU (causale=$CAUSALE_REG)"
    
    # F6: Demolisci VFU
    echo "  --- F6: Demolisci VFU ---"
    DEMO_PAYLOAD=$(cat <<EOFDEMO
{
  "dataDistruzioneDocumenti": "$(date -u +%Y-%m-%dT23:59:59Z)",
  "dataDistruzioneTarga": "$(date -u +%Y-%m-%dT23:59:59Z)",
  "numeroTargheDistrutte": "1"
}
EOFDEMO
)
    api_put "/cr/demolisci/VFU/$VFU_ID" "$DEMO_PAYLOAD" "Demolisci VFU"
    
    # F7: Stato finale
    echo "  --- F7: Stato finale VFU ---"
    api_get "/cr/VFU/$VFU_ID" "Dettaglio VFU finale"
    FINAL_STATO=$(echo "$LAST_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('statoVFU','?'))" 2>/dev/null)
    FINAL_DPIC=$(echo "$LAST_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('dataPresaInCarico','null'))" 2>/dev/null)
    echo "   Stato finale: $FINAL_STATO"
    echo "   dataPresaInCarico: $FINAL_DPIC"
  fi
fi

echo ""
echo "============================================================"
echo "TEST COMPLETATO — $(date)"
echo "============================================================"
