#!/bin/bash
set -e

API_URL=${API_URL:-http://localhost:3001}

echo "🏥 Checking API health..."

# General health
response=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/health)
if [ $response -eq 200 ]; then
    echo "✅ API is healthy"
else
    echo "❌ API is unhealthy (HTTP $response)"
    exit 1
fi

# Readiness
response=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/health/readiness)
if [ $response -eq 200 ]; then
    echo "✅ API is ready"
else
    echo "⚠️  API is not ready (HTTP $response)"
    exit 1
fi

# Liveness
response=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/health/liveness)
if [ $response -eq 200 ]; then
    echo "✅ API is alive"
else
    echo "❌ API is not alive (HTTP $response)"
    exit 1
fi

echo ""
echo "🎉 All health checks passed!"
