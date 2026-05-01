#!/bin/bash
# ================================================
# Home AI - One-Click Install
# ================================================

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
    open -a "Docker"
fi

# 3. Dependency Check: BlueBubbles (Enforced)
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
    else
        echo "ℹ️  Skipping BlueBubbles. iMessage features will be unavailable."
    fi
    echo ""
fi

# 4. Wait for Docker Engine
echo "⏳ Waiting for Docker engine to start..."
until docker info &> /dev/null; do
    printf "."
    sleep 3
done
echo -e "\n✅ Docker is ready!"

# 5. Configuration Setup
[ ! -f ".env" ] && [ -f ".env.example" ] && cp .env.example .env && echo "✅ Created .env from example."

# 6. Start Infrastructure
echo "📦 Starting Background Services (Postgres, Home Assistant)..."
docker compose up -d postgres homeassistant

# 7. Start Ollama and Watch Progress
echo "--------------------------------------------------------"
echo "📥 STARTING AI MODEL DOWNLOADS (~10GB)"
echo "--------------------------------------------------------"

docker compose up -d ollama

# Follow logs until installation is confirmed
docker compose logs -f ollama | while read -r line; do
    echo "$line"
    if [[ "$line" == *"ALL MODELS INSTALLED"* ]]; then
        # Terminate the log tail process group
        pkill -l -P $$ docker
        break
    fi
done

echo ""
echo "🎉 INFRASTRUCTURE READY!"
echo "--------------------------------------------------------"
echo "👉 Next step: Run ./setup.sh to connect your accounts."
echo "--------------------------------------------------------"