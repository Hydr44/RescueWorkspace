#!/bin/bash
set -e

# Smoke Test Script for RescueManager
# Usage: ./smoke-test.sh [staging|production]

ENV=${1:-staging}

if [ "$ENV" == "production" ]; then
  BASE_URL="https://rescuemanager.eu"
  ASSIST_URL="https://assist.rescuemanager.eu"
  RENTRI_URL="https://rentri-test.rescuemanager.eu"
  API_URL="https://api.rescuemanager.eu"
else
  BASE_URL="https://staging.rescuemanager.eu"
  ASSIST_URL="https://staging-assist.rescuemanager.eu"
  RENTRI_URL="https://staging-rentri.rescuemanager.eu"
  API_URL="https://staging-api.rescuemanager.eu"
fi

PASS=0
FAIL=0

pass() {
  echo "✅ PASS - $1"
  PASS=$((PASS + 1))
}

fail() {
  echo "❌ FAIL - $1"
  FAIL=$((FAIL + 1))
}

echo "🧪 Running Smoke Tests for $ENV environment"
echo "=========================================="
echo ""

# Test 1: Website Homepage
echo "Test 1: Website Homepage"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL")
if [ "$HTTP_CODE" = "200" ]; then
  pass "Website homepage accessible (HTTP $HTTP_CODE)"
else
  fail "Website homepage failed (HTTP $HTTP_CODE)"
fi

# Test 2: Website Health Check
echo "Test 2: Website Health Check"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health")
if [ "$HTTP_CODE" = "200" ]; then
  HEALTH_DATA=$(curl -s "$BASE_URL/api/health")
  pass "Health check passed: $HEALTH_DATA"
else
  fail "Health check failed (HTTP $HTTP_CODE)"
fi

# Test 3: Assist Server
echo "Test 3: Assist Server"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$ASSIST_URL/health")
if [ "$HTTP_CODE" = "200" ]; then
  pass "Assist server healthy (HTTP $HTTP_CODE)"
else
  fail "Assist server failed (HTTP $HTTP_CODE)"
fi

# Test 4: RENTRI API
echo "Test 4: RENTRI API"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$RENTRI_URL/health")
if [ "$HTTP_CODE" = "200" ]; then
  pass "RENTRI API healthy (HTTP $HTTP_CODE)"
else
  fail "RENTRI API failed (HTTP $HTTP_CODE)"
fi

# Test 5: API Gateway
echo "Test 5: API Gateway"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
if [ "$HTTP_CODE" = "200" ]; then
  pass "API Gateway healthy (HTTP $HTTP_CODE)"
else
  fail "API Gateway failed (HTTP $HTTP_CODE)"
fi

# Test 6: Auth Endpoint (should return 401 without credentials)
echo "Test 6: Auth Endpoint Protection"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}')
if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "400" ]; then
  pass "Auth endpoint protected (HTTP $HTTP_CODE)"
else
  fail "Auth endpoint issue (HTTP $HTTP_CODE)"
fi

# Test 7: Static Assets
echo "Test 7: Static Assets"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/favicon.ico")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
  pass "Static assets loading (HTTP $HTTP_CODE)"
else
  fail "Static assets failed (HTTP $HTTP_CODE)"
fi

# Test 8: HTTPS Redirect
echo "Test 8: HTTPS Redirect"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L "http://rescuemanager.eu")
if [ "$HTTP_CODE" = "200" ]; then
  pass "HTTPS redirect working"
else
  fail "HTTPS redirect failed (HTTP $HTTP_CODE)"
fi

# Summary
echo ""
echo "=========================================="
echo "SUMMARY"
echo "=========================================="
echo "Tests Passed: $PASS"
echo "Tests Failed: $FAIL"
TOTAL=$((PASS + FAIL))
echo "Total Tests: $TOTAL"

if [ "$TOTAL" -gt 0 ]; then
  PASS_RATE=$((PASS * 100 / TOTAL))
  echo "Pass Rate: $PASS_RATE%"
fi

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "🎉 ALL TESTS PASSED!"
  exit 0
else
  echo "⚠️  SOME TESTS FAILED"
  exit 1
fi
