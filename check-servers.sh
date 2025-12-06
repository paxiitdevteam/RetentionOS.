#!/bin/bash
# Quick server status check script

echo "🔍 Checking RetentionOS Servers..."
echo ""

echo "📊 Port 8000 (Root Server / Status Page):"
curl -s http://localhost:8000/health 2>&1 | head -3 || echo "❌ Not responding"
echo ""

echo "💚 Port 3000 (Backend API):"
curl -s http://localhost:3000/health 2>&1 | head -3 || echo "❌ Not responding"
echo ""

echo "🌐 Port 3001 (Dashboard):"
curl -s http://localhost:3001 2>&1 | grep -E "(RetentionOS|Dashboard|404)" | head -1 || echo "❌ Not responding"
echo ""

echo "✅ Check complete!"

