#!/bin/bash
# ================================================
# Home AI - Stop Script
# Gracefully stops all services
# ================================================

echo "🛑 Home AI - Stopping Services"
echo "============================="

if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this from the root of the home-ai project."
    exit 1
fi

echo "Stopping all containers..."
docker compose stop

echo ""
echo "✅ All Home AI services have been stopped."
echo ""
echo "💡 Quick restart tip for updates:"
echo "   1. git pull"
echo "   2. ./start.sh"
echo ""
echo "   (Only the NestJS app will rebuild — DB and Ollama stay intact)"