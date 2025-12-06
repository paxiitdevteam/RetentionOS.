#!/bin/bash
# Docker Stop Script - RetentionOS
# Stops all services gracefully

echo "=========================================="
echo "🛑 Stopping RetentionOS Docker Services"
echo "=========================================="
echo ""

docker-compose down

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All services stopped"
    echo ""
    echo "To remove volumes (delete data):"
    echo "  docker-compose down -v"
else
    echo ""
    echo "❌ Error stopping services"
    exit 1
fi

