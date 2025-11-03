#!/bin/bash

echo "< Setting up webhook tunnel with ngrok..."

# Verificar que ngrok está instalado
if ! command -v ngrok &> /dev/null; then
    echo "L ngrok not found. Install from: https://ngrok.com/download"
    exit 1
fi

# Iniciar ngrok
echo "Starting ngrok tunnel to localhost:3001..."
ngrok http 3001 > /dev/null &

# Esperar a que ngrok inicie
sleep 3

# Obtener la URL pública
WEBHOOK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')

if [ -z "$WEBHOOK_URL" ]; then
    echo "L Failed to get ngrok URL"
    exit 1
fi

WEBHOOK_ENDPOINT="${WEBHOOK_URL}/api/v1/payments/webhooks/mercadopago"

echo ""
echo " Webhook tunnel ready!"
echo ""
echo "=Ë Configuration:"
echo "  Public URL: ${WEBHOOK_URL}"
echo "  Webhook Endpoint: ${WEBHOOK_ENDPOINT}"
echo ""
echo "=' Update your Mercado Pago webhook URL to:"
echo "  ${WEBHOOK_ENDPOINT}"
echo ""
echo "< ngrok dashboard: http://localhost:4040"
echo ""
echo "Press Ctrl+C to stop the tunnel"

# Mantener el script corriendo
wait
