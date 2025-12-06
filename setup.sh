#!/bin/bash
# Automatic setup - just run this, everything else is handled!
# No manual database fixes needed!

echo "=========================================="
echo "RetentionOS Automatic Setup"
echo "=========================================="
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found"
    echo ""
    echo "Installing Docker is recommended for easy database setup."
    echo "Download: https://www.docker.com/products/docker-desktop"
    echo ""
    echo "For now, we'll try to use your existing MariaDB..."
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    USE_DOCKER=false
else
    echo "✅ Docker found"
    USE_DOCKER=true
fi

# Setup database
if [ "$USE_DOCKER" = true ]; then
    echo ""
    echo "Setting up database with Docker..."
    echo ""
    
    # Stop existing container
    docker stop retentionos-mysql 2>/dev/null || true
    docker rm retentionos-mysql 2>/dev/null || true
    
    # Start MySQL container
    echo "Starting MySQL container (this may take a minute)..."
    docker run -d \
      --name retentionos-mysql \
      -e MYSQL_ROOT_PASSWORD=rootpassword \
      -e MYSQL_DATABASE=retentionos_dev \
      -e MYSQL_USER=retentionos \
      -e MYSQL_PASSWORD=password \
      -p 3306:3306 \
      mysql:8.0
    
    echo "Waiting for MySQL to be ready..."
    sleep 20
    
    echo "✅ Database container is running"
fi

# Install dependencies
echo ""
echo "Installing backend dependencies..."
cd backend
npm install

echo ""
echo "Installing dashboard dependencies..."
cd ../frontend/dashboard
npm install

echo ""
echo "Installing widget dependencies..."
cd ../widget
npm install

# Setup database
echo ""
echo "Setting up database..."
cd ../../backend

# Wait a bit more for Docker MySQL
if [ "$USE_DOCKER" = true ]; then
    echo "Waiting for database to be fully ready..."
    sleep 10
fi

# Test connection
echo "Testing database connection..."
npm run test:db

if [ $? -eq 0 ]; then
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
    echo "Everything is ready!"
    echo ""
    echo "To start development:"
    echo "  1. Backend: cd backend && npm run dev"
    echo "  2. Dashboard: cd frontend/dashboard && npm run dev"
    echo "  3. Root server: node server.js"
    echo ""
    echo "Login at: http://localhost:3001/login"
    echo "  Email: admin@retentionos.com"
    echo "  Password: ChangeThisPassword123!"
    echo ""
else
    echo ""
    echo "⚠️  Database connection failed"
    if [ "$USE_DOCKER" = true ]; then
        echo "Wait 30 seconds and run: cd backend && npm run test:db"
    else
        echo "You may need to fix your MariaDB authentication"
        echo "See: FIX_DATABASE.txt"
    fi
fi



