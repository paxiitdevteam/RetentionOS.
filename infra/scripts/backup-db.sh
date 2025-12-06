#!/bin/bash
# Database Backup Script
# Usage: ./backup-db.sh

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/retentionos_backup_$TIMESTAMP.sql"

echo "📦 Starting database backup..."

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Load environment variables
if [ -f "infra/environment/.env.production" ]; then
    export $(cat infra/environment/.env.production | grep -v '^#' | xargs)
fi

# Backup database
docker exec retentionos-db mysqldump \
    -u${DB_USER:-retentionos} \
    -p${DB_PASSWORD} \
    ${DB_NAME:-retentionos_prod} > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE
BACKUP_FILE="${BACKUP_FILE}.gz"

echo "✅ Backup created: $BACKUP_FILE"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "retentionos_backup_*.sql.gz" -mtime +7 -delete

echo "✅ Backup complete! Old backups (>7 days) cleaned up."

