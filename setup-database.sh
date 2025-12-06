#!/bin/bash
# Automatic database setup - no manual fixes needed!
# This sets up a clean MySQL in Docker - isolated from your system

echo "=========================================="
echo "Automatic Database Setup"
echo "=========================================="
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo ""
    echo "Please install Docker Desktop:"
    echo "  https://www.docker.com/products/docker-desktop"
    echo ""
    echo "OR we can use SQLite for development (no setup needed)"
    echo "Would you like me to switch to SQLite instead? (y/n)"
    exit 1
fi

echo "✅ Docker found"
echo ""

# Stop any existing container
echo "Stopping any existing database container..."
docker stop retentionos-mysql 2>/dev/null || true
docker rm retentionos-mysql 2>/dev/null || true

# Start fresh MySQL container
echo "Starting MySQL container..."
docker run -d \
  --name retentionos-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=retentionos_dev \
  -e MYSQL_USER=retentionos \
  -e MYSQL_PASSWORD=password \
  -p 3306:3306 \
  mysql:8.0

echo ""
echo "Waiting for MySQL to be ready (15 seconds)..."
sleep 15

# Test connection
echo ""
echo "Testing connection..."
cd backend
npm run test:db

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database is ready!"
    echo ""
    echo "Running migrations..."
    npm run migrate
    echo ""
    echo "Seeding database..."
    npm run seed
    echo ""
    echo "=========================================="
    echo "✅ SETUP COMPLETE!"
    echo "=========================================="
    echo ""
    echo "Database is ready to use!"
    echo "Login at: http://localhost:3001/login"
else
    echo ""
    echo "⚠️  Connection test failed, but container is starting..."
    echo "Wait 30 seconds and run: cd backend && npm run test:db"
fi



