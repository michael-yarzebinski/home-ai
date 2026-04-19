#!/bin/bash
# ================================================
# Home AI - Restart Script
# Smart restart focused on the Node/NestJS app
# ================================================

echo "🔄 Home AI - Smart Restart"
echo "==========================="

if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this from the root of the home-ai project."
    exit 1
fi

echo "Restarting only the Home AI server (NestJS + AI logic)..."
docker compose restart home-ai

echo "⏳ Waiting for the server to come back online..."
sleep 8

echo ""
echo "✅ Home AI server has been restarted!"
echo ""
echo "📊 Status:"
docker compose ps --filter "name=home-ai-server"

echo ""
echo "🔍 Watch logs to verify new changes:"
echo "   docker compose logs -f home-ai-server"
echo ""
echo "Your updated AI task identification & data extraction logic is now live! 🧠"