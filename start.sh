#!/bin/bash
# Solana AI Developer Landing Page - Quick Start Script

echo "🚀 Solana AI Developer Landing Page"
echo "==================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🔨 Starting development server..."
echo ""
echo "🌐 Landing page will be available at: http://localhost:3000"
echo "   (or 3001/3002 if those ports are in use)"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
