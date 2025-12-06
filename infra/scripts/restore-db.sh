#!/bin/bash
# Database Restore Script
# Usage: ./restore-db.sh <backup_file.sql.gz>

set -e

if [ -z "$1" ]; then
    echo "❌ Usage: ./restore-db.sh <backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "🔄 Starting database restore from: $BACKUP_FILE"

# Load environment variables
if [ -f "infra/environment/.env.production" ]; then
    export $(cat infra/environment/.env.production | grep -v '^#' | xargs)
fi

# Confirm restore
read -p "⚠️  This will overwrite the current database. Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 1
fi

# Decompress if needed
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "📦 Decompressing backup..."
    gunzip -c $BACKUP_FILE > /tmp/restore.sql
    RESTORE_FILE="/tmp/restore.sql"
else
    RESTORE_FILE=$BACKUP_FILE
fi

# Restore database
echo "🔄 Restoring database..."
docker exec -i retentionos-db mysql \
    -u${DB_USER:-retentionos} \
    -p${DB_PASSWORD} \
    ${DB_NAME:-retentionos_prod} < $RESTORE_FILE

# Cleanup
if [ -f "/tmp/restore.sql" ]; then
    rm /tmp/restore.sql
fi

echo "✅ Database restore complete!"

