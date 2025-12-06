#!/bin/bash
# Start Dashboard Server from Root
# Usage: ./start-dashboard.sh

echo "🚀 Starting RetentionOS Dashboard..."
echo "📍 Location: Root directory"
echo ""

# Check if dashboard/node_modules exists, if not install
if [ ! -d "dashboard/node_modules" ]; then
  echo "📦 Installing dashboard dependencies..."
  cd dashboard && npm install && cd ..
fi

# Start dashboard server
npm run dashboard:dev

