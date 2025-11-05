#!/bin/bash

# Redis Backup Script
# Usage: ./backup-redis.sh [environment]

set -e

ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/redis"
RETENTION_DAYS=7

# Load environment variables
source ".env.${ENVIRONMENT}"

# Create backup directory
mkdir -p ${BACKUP_DIR}

echo "Starting Redis backup for ${ENVIRONMENT}..."

# Trigger Redis BGSAVE
redis-cli -h ${REDIS_HOST:-localhost} -p ${REDIS_PORT:-6379} \
    ${REDIS_PASSWORD:+-a ${REDIS_PASSWORD}} \
    BGSAVE

# Wait for BGSAVE to complete
echo "Waiting for BGSAVE to complete..."
while true; do
    LASTSAVE=$(redis-cli -h ${REDIS_HOST:-localhost} -p ${REDIS_PORT:-6379} \
        ${REDIS_PASSWORD:+-a ${REDIS_PASSWORD}} \
        LASTSAVE)
    sleep 1
    NEWSAVE=$(redis-cli -h ${REDIS_HOST:-localhost} -p ${REDIS_PORT:-6379} \
        ${REDIS_PASSWORD:+-a ${REDIS_PASSWORD}} \
        LASTSAVE)
    if [ "${LASTSAVE}" != "${NEWSAVE}" ]; then
        break
    fi
done

# Copy dump.rdb file
BACKUP_FILE="${BACKUP_DIR}/redis_${ENVIRONMENT}_${TIMESTAMP}.rdb"
cp /var/lib/redis/dump.rdb ${BACKUP_FILE}

# Compress backup
gzip ${BACKUP_FILE}

echo "✓ Redis backup completed: ${BACKUP_FILE}.gz"

# Upload to S3 (optional)
if [ ! -z "${AWS_S3_BACKUP_BUCKET}" ]; then
    aws s3 cp ${BACKUP_FILE}.gz \
        s3://${AWS_S3_BACKUP_BUCKET}/redis/${ENVIRONMENT}/
fi

# Clean old backups
find ${BACKUP_DIR} -name "redis_${ENVIRONMENT}_*.rdb.gz" \
    -type f -mtime +${RETENTION_DAYS} -delete

echo "✓ Backup process completed"
