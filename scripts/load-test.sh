#!/bin/bash

# Load Testing Script using Apache Bench
# Usage: ./load-test.sh [environment]

ENVIRONMENT=${1:-staging}

# Load environment
if [ -f ".env.${ENVIRONMENT}" ]; then
    source ".env.${ENVIRONMENT}"
fi

echo "=========================================="
echo "Load Testing - ${ENVIRONMENT}"
echo "=========================================="
echo ""

# Check if ab (Apache Bench) is installed
if ! command -v ab &> /dev/null; then
    echo "Error: Apache Bench (ab) is not installed"
    echo "Install with: apt-get install apache2-utils"
    exit 1
fi

# Test parameters
CONCURRENCY=50
REQUESTS=1000

# Endpoints to test
declare -A ENDPOINTS=(
    ["Health Check"]="${API_URL:-http://localhost:3001}/health"
    ["Products List"]="${API_URL:-http://localhost:3001}/api/v1/products?limit=10"
    ["Dashboard"]="${WEB_URL:-http://localhost:3000}/dashboard"
)

# Run tests
for name in "${!ENDPOINTS[@]}"; do
    url="${ENDPOINTS[$name]}"

    echo "Testing: ${name}"
    echo "URL: ${url}"
    echo "Concurrency: ${CONCURRENCY}"
    echo "Requests: ${REQUESTS}"
    echo ""

    ab -n ${REQUESTS} -c ${CONCURRENCY} -g "${name// /_}.tsv" "${url}"

    echo ""
    echo "----------------------------------------"
    echo ""
done

echo "✓ Load testing completed"
echo "Results saved to *.tsv files"
