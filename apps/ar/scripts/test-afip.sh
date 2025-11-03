#!/bin/bash

set -e

echo "🔍 Testing AFIP Integration..."

API_URL=${API_URL:-http://localhost:3001}
TENANT_ID=${TENANT_ID:-test-tenant}
TOKEN=${TOKEN}

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$TOKEN" ]; then
  echo -e "${RED}Error: TOKEN environment variable not set${NC}"
  echo "Usage: TOKEN=your-jwt-token ./test-afip.sh"
  exit 1
fi

echo ""
echo "1️⃣ Checking AFIP connection status..."
response=$(curl -s -X GET "${API_URL}/api/v1/afip/status" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

echo "$response" | jq . || echo "$response"

if echo "$response" | jq -e '.connected == true' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ AFIP connection OK${NC}"
else
  echo -e "${RED}❌ AFIP connection failed${NC}"
  exit 1
fi

echo ""
echo "2️⃣ Getting next invoice number..."
response=$(curl -s -X GET "${API_URL}/api/v1/afip/next-invoice-number?type=B" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

echo "$response" | jq . || echo "$response"

next_number=$(echo "$response" | jq -r '.data.nextInvoiceNumber' 2>/dev/null || echo "N/A")
echo -e "${GREEN}Next invoice number: ${next_number}${NC}"

echo ""
echo "3️⃣ Testing current date endpoint..."
response=$(curl -s -X GET "${API_URL}/api/v1/afip/current-date" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

echo "$response" | jq . || echo "$response"

echo ""
echo "4️⃣ Testing invoice generation (REQUIRES A REAL SALE)..."
echo -e "${YELLOW}To test invoice generation, create a sale first and run:${NC}"
echo -e "${YELLOW}curl -X POST ${API_URL}/api/v1/afip/generate-invoice \\${NC}"
echo -e "${YELLOW}  -H 'x-tenant-id: ${TENANT_ID}' \\${NC}"
echo -e "${YELLOW}  -H 'Authorization: Bearer ${TOKEN}' \\${NC}"
echo -e "${YELLOW}  -H 'Content-Type: application/json' \\${NC}"
echo -e "${YELLOW}  -d '{\"saleId\": \"YOUR_SALE_ID\", \"invoiceType\": \"B\", ...}'${NC}"

echo ""
echo -e "${GREEN}✅ AFIP integration tests completed${NC}"
