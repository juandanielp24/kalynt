#!/bin/bash

# Security Audit Script
# Run regularly to check for security issues

echo "=========================================="
echo "Security Audit Report"
echo "Date: $(date)"
echo "=========================================="
echo ""

# Check for exposed secrets in code
echo "1. Checking for exposed secrets..."
git grep -i -E "(password|secret|api_key|token|private_key)" -- '*.ts' '*.js' '*.tsx' '*.jsx' | \
    grep -v 'node_modules' | \
    grep -v '.git' | \
    grep -v 'test' || echo "✓ No hardcoded secrets found"
echo ""

# Check npm packages for vulnerabilities
echo "2. Checking npm packages for vulnerabilities..."
pnpm audit --audit-level=moderate
echo ""

# Check Docker images for vulnerabilities (if Trivy installed)
if command -v trivy &> /dev/null; then
    echo "3. Checking Docker images for vulnerabilities..."
    trivy image your-registry/retail-api:latest
    trivy image your-registry/retail-web:latest
else
    echo "3. Trivy not installed, skipping Docker image scan"
fi
echo ""

# Check environment variables
echo "4. Checking required environment variables..."
REQUIRED_VARS=(
    "DATABASE_URL"
    "JWT_SECRET"
    "BETTER_AUTH_SECRET"
    "REDIS_HOST"
)

for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        echo "✗ Missing: ${VAR}"
    else
        echo "✓ Present: ${VAR}"
    fi
done
echo ""

# Check SSL certificates expiry
echo "5. Checking SSL certificate expiry..."
if [ -f "nginx/ssl/fullchain.pem" ]; then
    EXPIRY=$(openssl x509 -enddate -noout -in nginx/ssl/fullchain.pem | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "${EXPIRY}" +%s)
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

    if [ ${DAYS_LEFT} -lt 30 ]; then
        echo "⚠️  SSL certificate expires in ${DAYS_LEFT} days!"
    else
        echo "✓ SSL certificate valid for ${DAYS_LEFT} days"
    fi
else
    echo "⚠️  No SSL certificate found"
fi
echo ""

# Check file permissions
echo "6. Checking file permissions..."
find . -name ".env*" -type f -exec chmod 600 {} \;
echo "✓ Environment files permissions set to 600"
echo ""

echo "=========================================="
echo "Security audit completed"
echo "=========================================="
