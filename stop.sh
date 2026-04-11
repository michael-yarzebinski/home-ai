#!/bin/bash
set -e

echo "🛑 Stopping ai-home System..."
echo "============================"

# Stop NestJS server (if running)
echo "Stopping NestJS server processes..."
pkill -f "nest start" || true
pkill -f "node.*apps/server" || true

# Stop Docker services
echo "Stopping Docker services (Postgres + Home Assistant)..."
docker compose down

# Optional: Stop Ollama and BlueBubbles if they were started manually
pkill -f ollama || true
pkill -f BlueBubbles || true

echo "✅ All services stopped."
echo ""
echo "To restart, run: ./start.sh"