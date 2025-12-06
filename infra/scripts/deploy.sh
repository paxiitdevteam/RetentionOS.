#!/bin/bash
# RetentionOS Deployment Script
# Usage: ./deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
COMPOSE_FILE="docker-compose.prod.yml"

echo "🚀 Starting RetentionOS deployment for: $ENVIRONMENT"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it and try again."
    exit 1
fi

# Load environment variables
if [ -f "infra/environment/.env.$ENVIRONMENT" ]; then
    export $(cat infra/environment/.env.$ENVIRONMENT | grep -v '^#' | xargs)
    echo "✅ Loaded environment variables from .env.$ENVIRONMENT"
else
    echo "⚠️  No .env.$ENVIRONMENT file found. Using default values."
fi

# Validate environment
echo "🔍 Validating environment..."
node infra/scripts/validate-env.js || exit 1

# Build images
echo "🔨 Building Docker images..."
docker-compose -f $COMPOSE_FILE build --no-cache

# Run database migrations
echo "📊 Running database migrations..."
docker-compose -f $COMPOSE_FILE run --rm backend npm run migrate

# Start services
echo "🚀 Starting services..."
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
docker-compose -f $COMPOSE_FILE ps

echo "✅ Deployment complete!"
echo ""
echo "Services are running:"
echo "  - Backend API: http://localhost:3000"
echo "  - Dashboard: http://localhost:3001"
echo "  - Nginx: http://localhost:80"
echo ""
echo "View logs with: docker-compose -f $COMPOSE_FILE logs -f"

