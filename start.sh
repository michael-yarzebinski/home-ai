#!/bin/bash
# ================================================
# Home AI - Start Script
# Starts or restarts the full stack safely
# ================================================

echo "🚀 Home AI - Starting Services"
echo "=============================="

# Ensure we're in the project root
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this from the root of the home-ai project."
    exit 1
fi

echo "📦 Starting all services in detached mode..."
docker compose up -d --build

echo "⏳ Waiting for services to stabilize (15 seconds)..."
sleep 15

echo ""
echo "📊 Current Service Status:"
docker compose ps

echo ""
echo "✅ Home AI stack is now running!"
echo ""
echo "📍 Useful links:"
echo "   • Home Assistant: http://localhost:8123"
echo "   • NestJS API (your AI brain): http://localhost:3000"
echo ""
echo "🔍 To watch real-time logs from your NestJS app:"
echo "   docker compose logs -f home-ai-server"
echo ""
echo "🏠 Your Home AI Assistant is ready for iMessage commands!"