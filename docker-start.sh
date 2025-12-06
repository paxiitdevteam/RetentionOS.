#!/bin/bash
# Docker Start Script - RetentionOS
# Starts all services using Docker Compose

echo "=========================================="
echo "🚀 Starting RetentionOS with Docker"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "   Please start Docker Desktop first"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found"
    echo "   Creating from example..."
    if [ -f "infra/environment/dev.env.example" ]; then
        cp infra/environment/dev.env.example .env
        echo "   ✅ Created .env file"
        echo "   ⚠️  Please update .env with your actual values"
    fi
fi

# Start services
echo "📦 Starting Docker containers..."
echo ""

docker-compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ All services started!"
    echo "=========================================="
    echo ""
    echo "Services available at:"
    echo "  📊 Backend API:    http://localhost:3000"
    echo "  🎨 Dashboard:      http://localhost:3001"
    echo "  🌐 Marketing Site: http://localhost:3002"
    echo "  💾 Database:       localhost:3306"
    echo "  🔴 Redis:          localhost:6379"
    echo "  🗄️  phpMyAdmin:    http://localhost:8080"
    echo ""
    echo "View logs: docker-compose logs -f"
    echo "Stop all:  docker-compose down"
    echo ""
    echo "Opening Docker Desktop to view containers..."
    echo ""
    
    # Open Docker Desktop (Windows)
    if command -v "C:\Program Files\Docker\Docker\Docker Desktop.exe" &> /dev/null; then
        "C:\Program Files\Docker\Docker\Docker Desktop.exe" &
    fi
else
    echo ""
    echo "❌ Failed to start services"
    echo "   Check logs: docker-compose logs"
    exit 1
fi

