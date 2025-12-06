#!/bin/bash
# Quick Docker MySQL Setup for RetentionOS
# This is the fastest way to get a working database

echo "=========================================="
echo "Docker MySQL Setup for RetentionOS"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed."
    echo ""
    echo "Please install Docker Desktop for Windows:"
    echo "https://www.docker.com/products/docker-desktop"
    echo ""
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Check if MySQL container already exists
if docker ps -a --format '{{.Names}}' | grep -q "^retentionos-mysql$"; then
    echo "⚠️  Container 'retentionos-mysql' already exists"
    read -p "Remove existing container and create new one? (y/n): " answer
    if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
        echo "Stopping and removing existing container..."
        docker stop retentionos-mysql 2>/dev/null
        docker rm retentionos-mysql 2>/dev/null
    else
        echo "Using existing container..."
        docker start retentionos-mysql
        echo "✅ Container started"
        exit 0
    fi
fi

# Stop existing MySQL service if running
echo "Checking for existing MySQL service..."
if sc query MySQL80 2>/dev/null | grep -q "RUNNING"; then
    echo "⚠️  MySQL service is running. Stopping it..."
    net stop MySQL80 2>/dev/null || net stop MySQL 2>/dev/null
    echo "✅ MySQL service stopped"
fi

echo ""
echo "🚀 Starting Docker MySQL container..."
echo ""

# Run MySQL in Docker
docker run --name retentionos-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=retentionos_dev \
  -e MYSQL_USER=retentionos \
  -e MYSQL_PASSWORD=password \
  -p 3306:3306 \
  -d mysql:8.0

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Docker MySQL container started!"
    echo ""
    echo "Waiting for MySQL to be ready (10 seconds)..."
    sleep 10
    echo ""
    echo "=========================================="
    echo "✅ SETUP COMPLETE!"
    echo "=========================================="
    echo ""
    echo "Database is ready with:"
    echo "  Host: localhost"
    echo "  Port: 3306"
    echo "  Database: retentionos_dev"
    echo "  User: retentionos"
    echo "  Password: password"
    echo ""
    echo "Next steps:"
    echo "  1. cd backend"
    echo "  2. npm run test:db"
    echo "  3. npm run migrate"
    echo "  4. npm run seed"
    echo "  5. Test login at http://localhost:3001/login"
    echo ""
else
    echo ""
    echo "❌ Failed to start Docker container"
    echo "   Make sure Docker Desktop is running"
    exit 1
fi

