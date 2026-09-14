#!/bin/bash
# ================================================
# Home AI - Start Script
# ================================================

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=scripts/host-ollama.sh
source "${ROOT}/scripts/host-ollama.sh"

echo "🚀 Starting Home AI..."

if [[ "$(uname -s)" == "Darwin" ]]; then
    stop_docker_ollama
    ensure_host_ollama
    docker compose -f "${ROOT}/docker-compose.yml" --project-directory "${ROOT}" up -d --build
else
    echo "🐧 Linux host: starting Ollama inside Docker (linux-ollama profile)..."
    if grep -q 'host.docker.internal:11434' "${ROOT}/.env" 2>/dev/null; then
        echo "⚠️  This .env points at host.docker.internal. For in-Compose Ollama set"
        echo "   IMMEDIATE_BASE_URL and SOON_BASE_URL to http://ollama:11434/v1"
    fi
    docker compose -f "${ROOT}/docker-compose.yml" --project-directory "${ROOT}" --profile linux-ollama up -d --build
fi

# Wait for the Relay (Native Mac Host)
echo "⏳ Verifying Relay status on port 3100..."
MAX_RETRIES=5
COUNT=0

until lsof -i :3100 &> /dev/null || [ $COUNT -eq $MAX_RETRIES ]; do
    printf "."
    COUNT=$((COUNT + 1))
    sleep 2
done

if lsof -i :3100 &> /dev/null; then
    echo -e "\n✅ Relay is alive!"
else
    echo -e "\n⚠️  Relay not detected on port 3100. Attempting to start it via PM2..."
    pm2 start "${ROOT}/apps/relay/index.js" --name "home-ai-relay"
fi

echo "✅ Stack started. Logs: docker compose logs -f home-ai"
