#!/bin/bash
# Docker Logs Script - RetentionOS
# View logs from all services

SERVICE=${1:-""}

if [ -z "$SERVICE" ]; then
    echo "=========================================="
    echo "📋 RetentionOS Docker Logs"
    echo "=========================================="
    echo ""
    echo "Usage:"
    echo "  ./docker-logs.sh           # All services"
    echo "  ./docker-logs.sh backend   # Backend only"
    echo "  ./docker-logs.sh dashboard # Dashboard only"
    echo "  ./docker-logs.sh db        # Database only"
    echo ""
    echo "Following logs (Ctrl+C to exit)..."
    echo ""
    docker-compose logs -f
else
    echo "Following logs for: $SERVICE"
    echo "Press Ctrl+C to exit"
    echo ""
    docker-compose logs -f "$SERVICE"
fi

