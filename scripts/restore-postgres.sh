#!/bin/bash

# PostgreSQL Restore Script
# Usage: ./restore-postgres.sh <backup_file> [environment]

set -e

BACKUP_FILE=$1
ENVIRONMENT=${2:-production}

if [ -z "${BACKUP_FILE}" ]; then
    echo "Usage: ./restore-postgres.sh <backup_file> [environment]"
    exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

# Load environment variables
source ".env.${ENVIRONMENT}"

echo "⚠️  WARNING: This will restore database from backup!"
echo "Environment: ${ENVIRONMENT}"
echo "Backup file: ${BACKUP_FILE}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

echo "Starting database restore..."

# Drop existing connections
PGPASSWORD=${POSTGRES_PASSWORD} psql \
    -h ${POSTGRES_HOST:-localhost} \
    -p ${POSTGRES_PORT:-5432} \
    -U ${POSTGRES_USER} \
    -d postgres \
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB}';"

# Drop and recreate database
PGPASSWORD=${POSTGRES_PASSWORD} psql \
    -h ${POSTGRES_HOST:-localhost} \
    -p ${POSTGRES_PORT:-5432} \
    -U ${POSTGRES_USER} \
    -d postgres \
    -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};"

PGPASSWORD=${POSTGRES_PASSWORD} psql \
    -h ${POSTGRES_HOST:-localhost} \
    -p ${POSTGRES_PORT:-5432} \
    -U ${POSTGRES_USER} \
    -d postgres \
    -c "CREATE DATABASE ${POSTGRES_DB};"

# Restore backup
gunzip -c ${BACKUP_FILE} | PGPASSWORD=${POSTGRES_PASSWORD} pg_restore \
    -h ${POSTGRES_HOST:-localhost} \
    -p ${POSTGRES_PORT:-5432} \
    -U ${POSTGRES_USER} \
    -d ${POSTGRES_DB} \
    --verbose \
    --no-owner \
    --no-acl

echo "✓ Database restored successfully"

# Send notification
if [ ! -z "${SLACK_WEBHOOK_URL}" ]; then
    curl -X POST ${SLACK_WEBHOOK_URL} \
        -H 'Content-Type: application/json' \
        -d "{\"text\":\"⚠️ Database restored from backup on ${ENVIRONMENT}\"}"
fi
