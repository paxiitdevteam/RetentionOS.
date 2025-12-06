#!/bin/bash
# Start Backend Server from Root
# Usage: ./start-backend.sh

echo "🚀 Starting RetentionOS Backend Server..."
echo "📍 Location: Root directory"
echo ""

# Check if node_modules exists, if not install
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Start backend server
npm run backend:dev

