#!/bin/bash
# RetentionOS Startup Script
# Starts root server for easy access
# Use Git Bash on Windows

echo "🚀 Starting RetentionOS Root Server..."
echo ""

# Check if node_modules exists, if not install
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

# Start root server
echo "🌐 Starting server on port 8000..."
echo "📊 Status page will be available at: http://localhost:8000/"
echo ""
npm start

