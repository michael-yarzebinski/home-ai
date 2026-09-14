#!/bin/bash
# ================================================
# Home AI - Stop Script
# ================================================

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=scripts/host-ollama.sh
source "${ROOT}/scripts/host-ollama.sh"

echo "🛑 Stopping Home AI..."

# Stop Compose services, including a Linux-profile Ollama container if it was started.
docker compose -f "${ROOT}/docker-compose.yml" --project-directory "${ROOT}" --profile linux-ollama stop
stop_docker_ollama

if [[ "$(uname -s)" == "Darwin" ]]; then
    stop_host_ollama
fi

# Stop the Native Mac Relay
if command -v pm2 &> /dev/null; then
    echo "🔗 Stopping Native Mac Relay (PM2)..."
    pm2 stop home-ai-relay >/dev/null 2>&1 || true
else
    echo "⚠️  PM2 not found. Checking for orphan relay processes..."
    pkill -f "node apps/relay/index.js" || true
fi

echo "✅ All services stopped (volumes preserved)."
