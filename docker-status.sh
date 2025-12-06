#!/bin/bash
# Docker Status Script - RetentionOS
# Shows status of all services

echo "=========================================="
echo "📊 RetentionOS Docker Status"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    exit 1
fi

echo "🐳 Docker Status: ✅ Running"
echo ""

# Show container status
echo "📦 Container Status:"
docker-compose ps

echo ""
echo "💾 Volume Status:"
docker volume ls | grep retentionos

echo ""
echo "🌐 Network Status:"
docker network ls | grep retentionos

echo ""
echo "📈 Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" $(docker-compose ps -q) 2>/dev/null || echo "No containers running"

echo ""
echo "🔗 Service URLs:"
echo "  Backend API:    http://localhost:3000/health"
echo "  Dashboard:      http://localhost:3001"
echo "  Marketing Site: http://localhost:3002"
echo "  Database:       localhost:3306"
echo "  Redis:          localhost:6379"

