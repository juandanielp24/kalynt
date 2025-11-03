#!/bin/bash

set -e

echo "=³ Testing Mercado Pago Integration..."

API_URL=${API_URL:-http://localhost:3001}
TENANT_ID=${TENANT_ID}
TOKEN=${TOKEN}

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$TOKEN" ] || [ -z "$TENANT_ID" ]; then
  echo -e "${RED}Error: TOKEN and TENANT_ID environment variables required${NC}"
  echo "Usage: TOKEN=xxx TENANT_ID=yyy ./test-mercadopago.sh"
  exit 1
fi

echo ""
echo "1ã Creating test sale..."
sale_response=$(curl -s -X POST "${API_URL}/api/v1/sales" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "test-product-id",
        "quantity": 1,
        "unitPriceCents": 100000
      }
    ],
    "paymentMethod": "mercado_pago"
  }')

sale_id=$(echo "$sale_response" | jq -r '.data.id')

if [ "$sale_id" == "null" ] || [ -z "$sale_id" ]; then
  echo -e "${RED}L Failed to create sale${NC}"
  echo "$sale_response" | jq .
  exit 1
fi

echo -e "${GREEN} Sale created: ${sale_id}${NC}"

echo ""
echo "2ã Generating payment link..."
link_response=$(curl -s -X POST "${API_URL}/api/v1/payments/generate-link" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"saleId\": \"${sale_id}\"
  }")

echo "$link_response" | jq .

payment_url=$(echo "$link_response" | jq -r '.data.paymentUrl')

if [ "$payment_url" == "null" ]; then
  echo -e "${RED}L Failed to generate payment link${NC}"
  exit 1
fi

echo -e "${GREEN} Payment link generated${NC}"
echo -e "${YELLOW}Payment URL: ${payment_url}${NC}"

echo ""
echo "3ã Creating QR payment..."
qr_response=$(curl -s -X POST "${API_URL}/api/v1/payments/generate-qr" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"saleId\": \"${sale_id}\"
  }")

echo "$qr_response" | jq .

qr_code=$(echo "$qr_response" | jq -r '.data.qrCode')

if [ "$qr_code" == "null" ]; then
  echo -e "${YELLOW}   QR code not generated (may require physical POS)${NC}"
else
  echo -e "${GREEN} QR code generated${NC}"
fi

echo ""
echo "4ã Creating cash payment..."
cash_response=$(curl -s -X POST "${API_URL}/api/v1/payments" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"saleId\": \"${sale_id}\",
    \"method\": \"cash\",
    \"amountCents\": 100000
  }")

echo "$cash_response" | jq .

payment_id=$(echo "$cash_response" | jq -r '.data.paymentId')
payment_status=$(echo "$cash_response" | jq -r '.data.status')

if [ "$payment_status" == "approved" ]; then
  echo -e "${GREEN} Cash payment approved immediately${NC}"
else
  echo -e "${RED}L Cash payment not approved${NC}"
  exit 1
fi

echo ""
echo "5ã Testing webhook endpoint..."
webhook_response=$(curl -s -X POST "${API_URL}/api/v1/payments/webhooks/mercadopago/test" \
  -H "Content-Type: application/json" \
  -d '{"test": true}')

echo "$webhook_response" | jq .

if echo "$webhook_response" | jq -e '.success == true' > /dev/null; then
  echo -e "${GREEN} Webhook endpoint responding${NC}"
else
  echo -e "${RED}L Webhook endpoint not responding${NC}"
fi

echo ""
echo -e "${GREEN} All Mercado Pago tests completed${NC}"
echo ""
echo "=Ý Next steps:"
echo "  1. Test payment in Mercado Pago sandbox: ${payment_url}"
echo "  2. Verify webhook receives notifications"
echo "  3. Check payment status updates correctly"
