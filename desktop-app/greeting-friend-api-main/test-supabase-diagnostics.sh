#!/bin/bash

# Script diagnostico completo per Supabase
# Testa connettività, performance DB, API layer, RLS

echo "🔍 DIAGNOSTICA SUPABASE COMPLETA"
echo "================================"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurazione (MODIFICA QUESTI VALORI)
SUPABASE_URL="https://ienzdgrqalltvkdkuamp.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbnpkZ3JxYWxsdHZrZGt1YW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzcwNDUsImV4cCI6MjA3Mzc1MzA0NX0.sj4ZQJcSMjGkqpizDgmUDImm9esIvTLrsPOT0IIBegA"

# Funzione per misurare tempo
time_request() {
  local start=$(date +%s%N)
  "$@"
  local end=$(date +%s%N)
  local duration=$(( (end - start) / 1000000 ))
  echo "${duration}ms"
}

echo "📍 Supabase URL: $SUPABASE_URL"
echo ""

# ============================================
# TEST 1: Ping base (senza auth)
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Ping base (senza autenticazione)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -n "Tempo risposta: "
PING_TIME=$(time_request curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/rest/v1/" 2>/dev/null)
echo ""
if [ "$PING_TIME" = "200" ] || [ "$PING_TIME" = "401" ]; then
  echo -e "${GREEN}✅ Server raggiungibile (HTTP $PING_TIME)${NC}"
else
  echo -e "${RED}❌ Server non raggiungibile (HTTP $PING_TIME)${NC}"
fi
echo ""

# ============================================
# TEST 2: Health check Supabase
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Health check Supabase"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -n "Tempo risposta: "
HEALTH_RESPONSE=$(time_request curl -s "$SUPABASE_URL/rest/v1/" \
  -H "apikey: $SUPABASE_ANON_KEY" 2>/dev/null)
echo ""
if echo "$HEALTH_RESPONSE" | grep -q "swagger"; then
  echo -e "${GREEN}✅ API REST funzionante${NC}"
else
  echo -e "${YELLOW}⚠️  Risposta inattesa${NC}"
  echo "Risposta: $HEALTH_RESPONSE"
fi
echo ""

# ============================================
# TEST 3: Query semplice con timeout breve
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: Query semplice (timeout 5s)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Query: SELECT da system_settings (1 record)"
echo -n "Tempo risposta: "
START_TIME=$(date +%s%N)
SIMPLE_RESPONSE=$(curl -s --max-time 5 "$SUPABASE_URL/rest/v1/system_settings?select=key&limit=1" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" 2>/dev/null)
SIMPLE_EXIT=$?
END_TIME=$(date +%s%N)
DURATION=$(( (END_TIME - START_TIME) / 1000000 ))
echo "${DURATION}ms"

if [ $SIMPLE_EXIT -eq 0 ]; then
  echo -e "${GREEN}✅ Query completata${NC}"
  echo "Risposta: $SIMPLE_RESPONSE"
else
  echo -e "${RED}❌ TIMEOUT o ERRORE${NC}"
  echo "Exit code: $SIMPLE_EXIT"
fi
echo ""

# ============================================
# TEST 4: Query con RLS (org_members)
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 4: Query con RLS - org_members (timeout 10s)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Query: SELECT da org_members (con RLS)"
echo -n "Tempo risposta: "
START_TIME=$(date +%s%N)
RLS_RESPONSE=$(curl -s --max-time 10 "$SUPABASE_URL/rest/v1/org_members?select=org_id&limit=1" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" 2>/dev/null)
RLS_EXIT=$?
END_TIME=$(date +%s%N)
DURATION=$(( (END_TIME - START_TIME) / 1000000 ))
echo "${DURATION}ms"

if [ $RLS_EXIT -eq 0 ]; then
  echo -e "${GREEN}✅ Query completata${NC}"
  echo "Risposta: $RLS_RESPONSE"
else
  echo -e "${RED}❌ TIMEOUT (>10s) - PROBLEMA RLS!${NC}"
  echo "Exit code: $RLS_EXIT"
fi
echo ""

# ============================================
# TEST 5: Query senza RLS (tabella pubblica)
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 5: Query tabella senza RLS (timeout 5s)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Query: SELECT da tabella pubblica"
echo -n "Tempo risposta: "
START_TIME=$(date +%s%N)
PUBLIC_RESPONSE=$(curl -s --max-time 5 "$SUPABASE_URL/rest/v1/system_settings?select=*&limit=1" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" 2>/dev/null)
PUBLIC_EXIT=$?
END_TIME=$(date +%s%N)
DURATION=$(( (END_TIME - START_TIME) / 1000000 ))
echo "${DURATION}ms"

if [ $PUBLIC_EXIT -eq 0 ]; then
  echo -e "${GREEN}✅ Query completata${NC}"
  echo "Risposta: $PUBLIC_RESPONSE"
else
  echo -e "${RED}❌ TIMEOUT - PROBLEMA DATABASE!${NC}"
  echo "Exit code: $PUBLIC_EXIT"
fi
echo ""

# ============================================
# TEST 6: Test connessione PostgreSQL diretta
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 6: DNS e connettività rete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -n "DNS lookup: "
DNS_TIME=$(time_request nslookup ienzdgrqalltvkdkuamp.supabase.co 2>/dev/null | grep -A1 "Name:" | tail -1)
echo ""
echo "IP: $DNS_TIME"
echo ""

# ============================================
# TEST 7: Vercel edge function test
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 7: Test Vercel (se applicabile)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -n "Ping rescuemanager.eu: "
VERCEL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://rescuemanager.eu" --max-time 5 2>/dev/null)
if [ "$VERCEL_RESPONSE" = "200" ] || [ "$VERCEL_RESPONSE" = "301" ] || [ "$VERCEL_RESPONSE" = "302" ]; then
  echo -e "${GREEN}✅ Vercel raggiungibile (HTTP $VERCEL_RESPONSE)${NC}"
else
  echo -e "${YELLOW}⚠️  Vercel non raggiungibile o lento (HTTP $VERCEL_RESPONSE)${NC}"
fi
echo ""

# ============================================
# RIEPILOGO
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RIEPILOGO DIAGNOSTICA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔍 INTERPRETAZIONE:"
echo ""
echo "Se TEST 3 (query semplice) è VELOCE (<1s):"
echo "  → Database funziona ✅"
echo ""
echo "Se TEST 4 (RLS) va in TIMEOUT:"
echo "  → Problema RLS policies ❌"
echo "  → Soluzione: esegui TEMP_disable_rls_for_testing.sql"
echo ""
echo "Se TEST 3 E TEST 5 vanno in TIMEOUT:"
echo "  → Problema database/PostgREST ❌"
echo "  → Soluzione: restart database o contatta Supabase"
echo ""
echo "Se TUTTO va in timeout:"
echo "  → Problema rete o Supabase down ❌"
echo "  → Controlla status.supabase.com"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Test completato!"
echo ""
echo "📝 PROSSIMI PASSI:"
echo "1. Vai su Supabase SQL Editor"
echo "2. Esegui: SELECT * FROM system_settings LIMIT 1;"
echo "3. Misura il tempo di risposta"
echo "4. Se SQL è veloce ma API lenta → problema PostgREST"
echo "5. Se SQL è lento → problema database"
echo ""
