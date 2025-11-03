#!/bin/bash

# Load test script using Apache Bench (ab)
# Usage: ./scripts/load-test.sh [URL] [REQUESTS] [CONCURRENCY]

API_URL=${1:-http://localhost:3001}
REQUESTS=${2:-1000}
CONCURRENCY=${3:-10}

echo "🔥 Load Testing API"
echo "================================"
echo "URL: ${API_URL}"
echo "Requests: ${REQUESTS}"
echo "Concurrency: ${CONCURRENCY}"
echo "================================"
echo ""

# Check if Apache Bench is installed
if ! command -v ab &> /dev/null; then
    echo "❌ Apache Bench (ab) is not installed"
    echo "Install it with: brew install httpd (macOS) or apt-get install apache2-utils (Linux)"
    exit 1
fi

# Test health endpoint
echo "Testing /health endpoint..."
ab -n ${REQUESTS} -c ${CONCURRENCY} -g /tmp/health.tsv ${API_URL}/health

echo ""
echo "Testing /health/readiness endpoint..."
ab -n ${REQUESTS} -c ${CONCURRENCY} -g /tmp/readiness.tsv ${API_URL}/health/readiness

echo ""
echo "Testing /metrics endpoint..."
ab -n ${REQUESTS} -c ${CONCURRENCY} -g /tmp/metrics.tsv ${API_URL}/metrics

echo ""
echo "✅ Load test completed!"
echo "Results saved to /tmp/*.tsv"
