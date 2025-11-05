#!/bin/bash

# PostgreSQL Backup Script
# Usage: ./backup-postgres.sh [environment]

set -e

ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
RETENTION_DAYS=30

# Load environment variables
if [ -f ".env.${ENVIRONMENT}" ]; then
    source ".env.${ENVIRONMENT}"
else
    echo "Error: .env.${ENVIRONMENT} file not found"
    exit 1
fi

# Create backup directory
mkdir -p ${BACKUP_DIR}

echo "Starting PostgreSQL backup for ${ENVIRONMENT}..."

# Backup database
BACKUP_FILE="${BACKUP_DIR}/retail_db_${ENVIRONMENT}_${TIMESTAMP}.sql.gz"

PGPASSWORD=${POSTGRES_PASSWORD} pg_dump \
    -h ${POSTGRES_HOST:-localhost} \
    -p ${POSTGRES_PORT:-5432} \
    -U ${POSTGRES_USER} \
    -d ${POSTGRES_DB} \
    --format=custom \
    --compress=9 \
    --verbose \
    | gzip > ${BACKUP_FILE}

# Verify backup
if [ -f ${BACKUP_FILE} ]; then
    SIZE=$(du -h ${BACKUP_FILE} | cut -f1)
    echo "✓ Backup completed successfully: ${BACKUP_FILE} (${SIZE})"
else
    echo "✗ Backup failed!"
    exit 1
fi

# Upload to S3 (optional)
if [ ! -z "${AWS_S3_BACKUP_BUCKET}" ]; then
    echo "Uploading backup to S3..."
    aws s3 cp ${BACKUP_FILE} \
        s3://${AWS_S3_BACKUP_BUCKET}/postgres/${ENVIRONMENT}/ \
        --storage-class STANDARD_IA
    echo "✓ Backup uploaded to S3"
fi

# Remove old backups
echo "Cleaning up old backups (retention: ${RETENTION_DAYS} days)..."
find ${BACKUP_DIR} -name "retail_db_${ENVIRONMENT}_*.sql.gz" \
    -type f -mtime +${RETENTION_DAYS} -delete

echo "✓ Backup process completed"

# Send notification
if [ ! -z "${SLACK_WEBHOOK_URL}" ]; then
    curl -X POST ${SLACK_WEBHOOK_URL} \
        -H 'Content-Type: application/json' \
        -d "{\"text\":\"✓ Database backup completed for ${ENVIRONMENT}: ${SIZE}\"}"
fi
