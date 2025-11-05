#!/bin/bash

# Automated Backup Cron Job
# Add to crontab: 0 2 * * * /path/to/automated-backup-cron.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="/var/log/retail-backups"
LOG_FILE="${LOG_DIR}/backup_$(date +%Y%m%d).log"

mkdir -p ${LOG_DIR}

{
    echo "=========================================="
    echo "Starting automated backup: $(date)"
    echo "=========================================="

    # PostgreSQL backup
    ${SCRIPT_DIR}/backup-postgres.sh production

    # Redis backup
    ${SCRIPT_DIR}/backup-redis.sh production

    # Cleanup old logs (keep 30 days)
    find ${LOG_DIR} -name "backup_*.log" -type f -mtime +30 -delete

    echo "=========================================="
    echo "Backup completed: $(date)"
    echo "=========================================="
} 2>&1 | tee -a ${LOG_FILE}
