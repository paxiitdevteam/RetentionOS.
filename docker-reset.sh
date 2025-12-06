#!/bin/bash
# Docker Reset Script - RetentionOS
# Completely resets Docker environment (removes all data!)

echo "=========================================="
echo "⚠️  RESET RetentionOS Docker Environment"
echo "=========================================="
echo ""
echo "This will:"
echo "  ❌ Stop all containers"
echo "  ❌ Remove all containers"
echo "  ❌ Remove all volumes (DELETES DATA!)"
echo "  ❌ Remove all images"
echo ""
read -p "Are you sure? Type 'yes' to continue: " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🛑 Stopping and removing containers..."
docker-compose down -v

echo ""
echo "🗑️  Removing images..."
docker-compose down --rmi all

echo ""
echo "🧹 Cleaning up..."
docker system prune -f

echo ""
echo "=========================================="
echo "✅ Reset complete!"
echo "=========================================="
echo ""
echo "All data has been removed."
echo "Run ./docker-start.sh to start fresh."

