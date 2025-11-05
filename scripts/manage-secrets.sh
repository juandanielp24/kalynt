#!/bin/bash

# Secrets Management Script
# Usage: ./manage-secrets.sh [encrypt|decrypt|rotate] [environment]

ACTION=$1
ENVIRONMENT=${2:-production}
SECRETS_FILE=".env.${ENVIRONMENT}"
ENCRYPTED_FILE=".env.${ENVIRONMENT}.gpg"

case ${ACTION} in
  encrypt)
    echo "Encrypting secrets for ${ENVIRONMENT}..."
    gpg --symmetric --cipher-algo AES256 ${SECRETS_FILE}
    echo "✓ Secrets encrypted to ${ENCRYPTED_FILE}"
    echo "⚠️  Remember to delete the unencrypted file!"
    ;;

  decrypt)
    echo "Decrypting secrets for ${ENVIRONMENT}..."
    gpg --decrypt ${ENCRYPTED_FILE} > ${SECRETS_FILE}
    echo "✓ Secrets decrypted to ${SECRETS_FILE}"
    chmod 600 ${SECRETS_FILE}
    ;;

  rotate)
    echo "Rotating secrets for ${ENVIRONMENT}..."

    # Generate new JWT secret
    NEW_JWT_SECRET=$(openssl rand -base64 32)
    echo "New JWT_SECRET: ${NEW_JWT_SECRET}"

    # Generate new BETTER_AUTH_SECRET
    NEW_AUTH_SECRET=$(openssl rand -base64 32)
    echo "New BETTER_AUTH_SECRET: ${NEW_AUTH_SECRET}"

    echo ""
    echo "⚠️  Update these secrets in your environment and redeploy"
    ;;

  *)
    echo "Usage: ./manage-secrets.sh [encrypt|decrypt|rotate] [environment]"
    exit 1
    ;;
esac
