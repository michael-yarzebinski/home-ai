#!/bin/bash
echo "🚀 Starting Home AI..."
docker compose up -d --build
echo "✅ Stack started. Logs: docker compose logs -f home-ai"