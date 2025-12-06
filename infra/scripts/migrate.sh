#!/bin/bash
# Database Migration Script
# Usage: ./migrate.sh [up|down|status]

set -e

ACTION=${1:-up}
COMPOSE_FILE="docker-compose.prod.yml"

echo "📊 Running database migrations: $ACTION"

case $ACTION in
    up)
        echo "⬆️  Applying migrations..."
        docker-compose -f $COMPOSE_FILE run --rm backend npm run migrate
        echo "✅ Migrations applied successfully"
        ;;
    status)
        echo "📋 Migration status:"
        docker-compose -f $COMPOSE_FILE run --rm backend npm run migrate -- --status || echo "Status check not available"
        ;;
    *)
        echo "❌ Unknown action: $ACTION"
        echo "Usage: ./migrate.sh [up|status]"
        exit 1
        ;;
esac

