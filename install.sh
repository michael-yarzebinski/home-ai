#!/bin/bash
# ================================================
# Home AI - One-Click Install (Mac Mini hub)
# ================================================

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=scripts/host-ollama.sh
source "${ROOT}/scripts/host-ollama.sh"

clear
echo "🚀 Home AI - Infrastructure Install"
echo "=================================="

# 1. Dependency Check: Homebrew
if ! command -v brew &> /dev/null; then
    echo "📥 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || /usr/local/bin/brew shellenv)"
fi

# 2. Dependency Check: Docker
if ! command -v docker &> /dev/null; then
    echo "📥 Installing Docker Desktop..."
    brew install --cask docker
    echo "🚀 Opening Docker... Please ensure it is running."
    open -a "Docker"
fi

# 3. Dependency Check: Node.js (Required for Relay)
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js..."
    brew install node
fi

# 4. Native Ollama (Metal). Docker cannot use the Apple GPU.
if ! command -v ollama &> /dev/null; then
    echo "📥 Installing Ollama..."
    brew install ollama
fi

# 5. Dependency Check: BlueBubbles
if [ ! -d "/Applications/BlueBubbles.app" ]; then
    echo "⚠️  BlueBubbles (iMessage Bridge) is missing."
    read -p "📥 Would you like to install BlueBubbles now? (y/n): " install_bb
    if [[ "$install_bb" =~ ^[Yy]$ ]]; then
        echo "📥 Installing BlueBubbles via Homebrew..."
        brew install --cask bluebubbles
        echo "--------------------------------------------------------"
        echo "✅ BlueBubbles installed to /Applications!"
        echo "⚠️  IMPORTANT: You MUST open BlueBubbles now and grant"
        echo "   Full Disk Access in System Settings to enable iMessage."
        echo "--------------------------------------------------------"
        open -a "BlueBubbles"
    fi
else
    echo "✅ BlueBubbles found. Ensuring it is open..."
    open -a "BlueBubbles"
fi

# 6. Configuration Setup
[ ! -f "${ROOT}/.env" ] && [ -f "${ROOT}/.env.example" ] && cp "${ROOT}/.env.example" "${ROOT}/.env" && echo "✅ Created .env from example."

# 7. Setup Express Relay (Native Mac Host Bridge)
echo "🔗 Setting up Native Mac Relay..."

if ! command -v pm2 &> /dev/null; then
    echo "📥 Installing PM2 (Process Manager)..."
    npm install -g pm2
fi

if [ -d "${ROOT}/apps/relay" ]; then
    echo "📦 Starting Relay Service..."
    (
        cd "${ROOT}/apps/relay"
        npm install
        pm2 delete home-ai-relay &> /dev/null || true
        pm2 start index.js --name "home-ai-relay"
        pm2 save
    )
    echo "✅ Relay is running in the background via PM2."
else
    echo "❌ Error: ./apps/relay directory not found."
    exit 1
fi

# 8. Wait for Docker Engine
if ! docker info &> /dev/null; then
    echo "🚀 Opening Docker Desktop..."
    open -a "Docker"
fi
echo "⏳ Waiting for Docker engine to start..."
until docker info &> /dev/null; do
    printf "."
    sleep 3
done
echo -e "\n✅ Docker is ready!"

# 9. Start Infrastructure (Ollama stays on the host — see scripts/host-ollama.sh)
echo "📦 Starting Background Services (Postgres, Home Assistant)..."
docker compose -f "${ROOT}/docker-compose.yml" --project-directory "${ROOT}" up -d postgres homeassistant

stop_docker_ollama
ensure_host_ollama

echo "--------------------------------------------------------"
echo "📥 Pulling local LLMs (${OLLAMA_MODEL}, ${OLLAMA_VISION_MODEL})"
echo "--------------------------------------------------------"
ensure_ollama_model

echo ""
echo "🎉 INFRASTRUCTURE READY!"
echo "--------------------------------------------------------"
echo "👉 Next step: Run ./setup.sh to connect your accounts."
echo "--------------------------------------------------------"
