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
    echo "🚀 Opening Docker... Please ensure it is running."
    open -a "Docker"
fi

# 3. Dependency Check: Node.js (Required for Relay)
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js..."
    brew install node
fi

# 4. Dependency Check: BlueBubbles
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

# 5. Configuration Setup
[ ! -f ".env" ] && [ -f ".env.example" ] && cp .env.example .env && echo "✅ Created .env from example."

# 6. Setup Express Relay (Native Mac Host Bridge)
echo "🔗 Setting up Native Mac Relay..."

if ! command -v pm2 &> /dev/null; then
    echo "📥 Installing PM2 (Process Manager)..."
    npm install -g pm2
fi

if [ -d "./apps/relay" ]; then
    echo "📦 Starting Relay Service..."
    cd ./apps/relay
    npm install
    
    # Start or Restart the relay
    pm2 delete home-ai-relay &> /dev/null
    pm2 start index.js --name "home-ai-relay"
    pm2 save
    cd ../..
    echo "✅ Relay is running in the background via PM2."
else
    echo "❌ Error: ./apps/relay directory not found."
fi

# 7. Wait for Docker Engine
echo "⏳ Waiting for Docker engine to start..."
until docker info &> /dev/null; do
    printf "."
    sleep 3
done
echo -e "\n✅ Docker is ready!"

# 8. Start Infrastructure
echo "📦 Starting Background Services (Postgres, Home Assistant)..."
docker compose up -d postgres homeassistant

# 9. Start Ollama and Watch Progress
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