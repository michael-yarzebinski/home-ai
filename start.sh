#!/bin/bash
echo "🚀 Starting Home AI..."

# 1. Start the Docker containers
docker compose up -d --build

# 2. Wait for the Relay (Native Mac Host)
echo "⏳ Verifying Relay status on port 3100..."
MAX_RETRIES=5
COUNT=0

until lsof -i :3100 &> /dev/null || [ $COUNT -eq $MAX_RETRIES ]; do
    printf "."
    ((COUNT++))
    sleep 2
done

if lsof -i :3100 &> /dev/null; then
    echo -e "\n✅ Relay is alive!"
else
    echo -e "\n⚠️  Relay not detected on port 3100. Attempting to start it via PM2..."
    pm2 start ./apps/relay/index.js --name "home-ai-relay"
fi

echo "✅ Stack started. Logs: docker compose logs -f server"