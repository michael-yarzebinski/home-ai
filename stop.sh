#!/bin/bash
# ================================================
# Home AI - Stop Script
# ================================================

echo "🛑 Stopping Home AI..."

# 1. Stop the Docker containers
# Using 'down' instead of 'stop' is often preferred if you want to clean up 
# the internal networks, but 'stop' is fine if you want a faster restart.
docker compose stop

# 2. Stop the Native Mac Relay
if command -v pm2 &> /dev/null; then
    echo "🔗 Stopping Native Mac Relay (PM2)..."
    pm2 stop home-ai-relay
else
    # Fallback if they didn't use PM2
    echo "⚠️  PM2 not found. Checking for orphan relay processes..."
    pkill -f "node apps/relay/index.js"
fi

echo "✅ All services stopped (volumes preserved)."