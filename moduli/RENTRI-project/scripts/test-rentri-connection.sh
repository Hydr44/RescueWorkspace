#!/bin/bash
# ========================================
# Test Connessione RENTRI Demo
# ========================================
# Script per verificare la connessione ai servizi RENTRI via gateway

set -e

GATEWAY_URL="${RENTRI_GATEWAY_URL:-https://rentri-test.rescuemanager.eu}"

echo "🔍 Test Connessione RENTRI Demo"
echo "Gateway: $GATEWAY_URL"
echo ""

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
  local service=$1
  local path=$2
  local url="${GATEWAY_URL}${path}"
  
  echo -n "Testing $service... "
  
  response=$(curl -s -w "\n%{http_code}" -m 10 "$url" 2>&1)
  http_code=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ OK${NC}"
    echo "  Response: $body"
  elif [ "$http_code" = "422" ]; then
    echo -e "${YELLOW}⚠ STUB Mode (422)${NC}"
    echo "  Response: $body"
  else
    echo -e "${RED}✗ FAILED (HTTP $http_code)${NC}"
    echo "  Response: $body"
    return 1
  fi
  echo ""
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Status Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_endpoint "Anagrafiche" "/anagrafiche/v1.0/status"
test_endpoint "Codifiche" "/codifiche/v1.0/status"
test_endpoint "CA RENTRI" "/ca-rentri/v1.0/status"
test_endpoint "Dati Registri" "/dati-registri/v1.0/status"
test_endpoint "Formulari" "/formulari/v1.0/status"
test_endpoint "Vidimazione" "/vidimazione-formulari/v1.0/status"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 Test Codifiche Lookup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_endpoint "Paesi" "/codifiche/v1.0/lookup?tabella=Paesi"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Test Completati${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

