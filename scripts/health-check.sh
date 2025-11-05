#!/bin/bash

# Health Check Script - Verify all services are running
# Usage: ./health-check.sh [environment]

ENVIRONMENT=${1:-production}

echo "=========================================="
echo "Health Check - ${ENVIRONMENT}"
echo "=========================================="
echo ""

# Load environment
if [ -f ".env.${ENVIRONMENT}" ]; then
    source ".env.${ENVIRONMENT}"
fi

# Function to check endpoint
check_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}

    echo -n "Checking ${name}... "

    status=$(curl -s -o /dev/null -w "%{http_code}" ${url})

    if [ "${status}" -eq "${expected_status}" ]; then
        echo "✓ OK (${status})"
        return 0
    else
        echo "✗ FAILED (${status})"
        return 1
    fi
}

# Check services
FAILED=0

check_endpoint "API Health" "${API_URL}/health" || FAILED=$((FAILED + 1))
check_endpoint "Web App" "${WEB_URL}" || FAILED=$((FAILED + 1))
check_endpoint "API Metrics" "${API_URL}/metrics" || FAILED=$((FAILED + 1))

# Check database
echo -n "Checking PostgreSQL... "
if docker exec postgres pg_isready > /dev/null 2>&1; then
    echo "✓ OK"
else
    echo "✗ FAILED"
    FAILED=$((FAILED + 1))
fi

# Check Redis
echo -n "Checking Redis... "
if docker exec redis redis-cli ping > /dev/null 2>&1; then
    echo "✓ OK"
else
    echo "✗ FAILED"
    FAILED=$((FAILED + 1))
fi

# Check disk space
echo -n "Checking Disk Space... "
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ ${DISK_USAGE} -lt 90 ]; then
    echo "✓ OK (${DISK_USAGE}% used)"
else
    echo "⚠️  WARNING (${DISK_USAGE}% used)"
    FAILED=$((FAILED + 1))
fi

# Check memory
echo -n "Checking Memory... "
MEMORY_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
if [ ${MEMORY_USAGE} -lt 90 ]; then
    echo "✓ OK (${MEMORY_USAGE}% used)"
else
    echo "⚠️  WARNING (${MEMORY_USAGE}% used)"
fi

echo ""
echo "=========================================="
if [ ${FAILED} -eq 0 ]; then
    echo "✓ All checks passed"
    exit 0
else
    echo "✗ ${FAILED} check(s) failed"
    exit 1
fi
