#!/bin/bash

echo "🔐 Verifying AFIP Certificates..."

CERT_DIR="apps/ar/certs"

# Check if certificates exist
if [ ! -f "${CERT_DIR}/cert-test.pem" ]; then
  echo "❌ Test certificate not found: ${CERT_DIR}/cert-test.pem"
  exit 1
fi

if [ ! -f "${CERT_DIR}/key-test.pem" ]; then
  echo "❌ Test private key not found: ${CERT_DIR}/key-test.pem"
  exit 1
fi

echo "✅ Certificate files found"
echo ""

# Verify certificate
echo "📋 Certificate details:"
openssl x509 -in "${CERT_DIR}/cert-test.pem" -text -noout | grep -A 2 "Subject:" || echo "Could not extract certificate details"
echo ""

# Check if key matches cert
echo "🔑 Verifying key matches certificate..."
cert_modulus=$(openssl x509 -noout -modulus -in "${CERT_DIR}/cert-test.pem" 2>/dev/null | openssl md5)
key_modulus=$(openssl rsa -noout -modulus -in "${CERT_DIR}/key-test.pem" 2>/dev/null | openssl md5)

if [ "$cert_modulus" == "$key_modulus" ]; then
  echo "✅ Certificate and key match!"
else
  echo "❌ Certificate and key DO NOT match!"
  exit 1
fi

echo ""
echo "✅ All certificate checks passed"
