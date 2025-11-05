#!/bin/bash

# Performance Report Generator
# Usage: ./performance-report.sh

echo "=========================================="
echo "Performance Report"
echo "Date: $(date)"
echo "=========================================="
echo ""

# API Response Times (from Prometheus)
echo "API Response Times (p95):"
curl -s "http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,%20rate(http_request_duration_seconds_bucket[5m]))" | \
    jq -r '.data.result[] | "\(.metric.route): \(.value[1])s"'
echo ""

# Database Query Performance
echo "Database Query Performance (avg):"
docker exec postgres psql -U retail -d retail_db -c \
    "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;" \
    --csv
echo ""

# Redis Performance
echo "Redis Info:"
docker exec redis redis-cli INFO stats | grep "instantaneous_ops_per_sec"
echo ""

# Container Resource Usage
echo "Container Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo ""

# Disk I/O
echo "Disk I/O:"
iostat -x 1 1
echo ""

echo "=========================================="
echo "Report completed"
echo "=========================================="
