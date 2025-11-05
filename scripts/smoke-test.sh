#!/bin/bash

# Smoke Tests - Quick verification after deployment
# Usage: ./smoke-test.sh [environment]

ENVIRONMENT=${1:-production}

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Smoke Tests - ${ENVIRONMENT}"
echo "=========================================="
echo ""

PASSED=0
FAILED=0

# Test function
test_case() {
    local name=$1
    local command=$2

    echo -n "Testing: ${name}... "

    if eval ${command} > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAILED${NC}"
        FAILED=$((FAILED + 1))
    fi
}

# Run tests
test_case "API Health Endpoint" "curl -f ${API_URL:-http://localhost:3001}/health"
test_case "Web App Home Page" "curl -f ${WEB_URL:-http://localhost:3000}"
test_case "API Login Endpoint" "curl -f -X POST ${API_URL:-http://localhost:3001}/api/v1/auth/check -H 'Content-Type: application/json'"
test_case "Database Connection" "docker exec postgres pg_isready"
test_case "Redis Connection" "docker exec redis redis-cli ping"
test_case "Metrics Endpoint" "curl -f ${API_URL:-http://localhost:3001}/metrics"
test_case "WebSocket Connection" "curl -f ${API_URL:-http://localhost:3001}/notifications"

echo ""
echo "=========================================="
echo "Results:"
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"
echo "=========================================="

if [ ${FAILED} -eq 0 ]; then
    echo -e "${GREEN}✓ All smoke tests passed${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
