#!/bin/bash
# ================================================
# Home AI - One-Click Setup Script for Mac mini
# Installs Homebrew + Docker Desktop + Starts Home AI
# ================================================

echo "🚀 Home AI - One-Click Setup"
echo "=============================="
echo "This script will prepare your Mac mini and start your Home AI Assistant."
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Install Homebrew if not present
echo "🔍 Checking for Homebrew..."
if command_exists brew; then
    echo "✅ Homebrew is already installed."
else
    echo "📥 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH (Apple Silicon + Intel)
    if [[ "$(uname -m)" == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    else
        echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/usr/local/bin/brew shellenv)"
    fi
    echo "✅ Homebrew installed successfully!"
fi

# 2. Install Docker Desktop if not present
echo ""
echo "🔍 Checking for Docker Desktop..."
if command_exists docker && docker info >/dev/null 2>&1; then
    echo "✅ Docker Desktop is already installed and running."
else
    echo "📥 Installing Docker Desktop..."
    brew install --cask docker-desktop
    
    echo "✅ Docker Desktop installed!"
    echo "⏳ Opening Docker Desktop for the first time..."
    open -a "Docker Desktop"
    
    echo "⏳ Waiting for Docker to start (this may take 30-60 seconds)..."
    echo "   Please wait while Docker initializes..."
    
    # Wait up to 90 seconds for Docker to become ready
    for i in {1..30}; do
        if docker info >/dev/null 2>&1; then
            echo "✅ Docker is now ready!"
            break
        fi
        sleep 3
        echo -n "."
    done
    
    if ! docker info >/dev/null 2>&1; then
        echo ""
        echo "⚠️  Docker still not responding. Please manually open Docker Desktop"
        echo "    from Applications and wait for the whale icon to show it's running."
        echo "    Then run this script again."
        exit 1
    fi
fi

# 3. Start the Home AI stack
echo ""
echo "🚀 Starting Home AI services (Postgres, Ollama, NestJS, Home Assistant)..."

# Make sure we're in the project directory
if [ ! -f "docker-compose.yml" ]; then
    echo "⚠️  docker-compose.yml not found in current directory."
    echo "    Please run this script from the root of your home-ai project."
    exit 1
fi

# Copy .env.example to .env if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "📋 Creating .env file from example..."
        cp .env.example .env
        echo "✅ .env file created (please review and edit it later if needed)."
    else
        echo "⚠️  .env.example not found. You may need to create .env manually."
    fi
fi

echo "📦 Pulling images and starting containers..."
docker compose up -d --build

echo ""
echo "⏳ Waiting for services to initialize (this may take a minute)..."
sleep 15

# Quick status check
echo ""
echo "📊 Service Status:"
docker compose ps

echo ""
echo "🎉 Home AI Setup Complete!"
echo "============================"
echo ""
echo "✅ Your Home AI Assistant is now starting up!"
echo ""
echo "📍 Important Next Steps:"
echo "   1. Install BlueBubbles manually (required for iMessage):"
echo "      → Download from https://bluebubbles.app and run the setup wizard"
echo "   2. Edit your .env file if you want to change database credentials"
echo "   3. Check logs anytime with: docker compose logs -f home-ai-server"
echo "   4. Access Home Assistant at: http://localhost:8123"
echo ""
echo "Your NestJS server should be available on port 3000 once fully started."
echo ""
echo "Need help? Check the README.md or run 'docker compose logs home-ai-server'"
echo ""
echo "🏠 Your intelligent Home AI is now live! Enjoy building with iMessage control."