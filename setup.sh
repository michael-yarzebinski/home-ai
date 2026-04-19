#!/bin/bash
# ================================================
# Home AI - Setup Script
# Guides user through Home Assistant long-lived token setup
# ================================================

echo "🏠 Home AI - Configuration Setup"
echo "================================"
echo ""

# Check if we're in the project root
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the root of your home-ai project."
    exit 1
fi

# Wait for Home Assistant to be ready
echo "⏳ Waiting for Home Assistant to start[](http://localhost:8123)..."
for i in {1..40}; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8123 | grep -q "200\|30[0-9]"; then
        echo "✅ Home Assistant is ready!"
        break
    fi
    sleep 5
    echo -n "."
done

if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:8123 | grep -q "200\|30[0-9]"; then
    echo ""
    echo "⚠️  Home Assistant is not responding yet."
    echo "    Please wait a bit longer or check 'docker compose logs homeassistant'"
    exit 1
fi

echo ""
echo "📱 Opening Home Assistant in your browser..."
open "http://localhost:8123"

echo ""
echo "🔑 Step-by-step: Create your Long-Lived Access Token"
echo "1. In the Home Assistant UI, click your username/profile at the bottom left."
echo "2. Scroll all the way down to the section 'Long-Lived Access Tokens'."
echo "3. Click 'Create Token'."
echo "4. Give it a name like 'Home AI Server'."
echo "5. Click 'OK' — copy the token immediately (you won't see it again!)."
echo ""
echo "Paste the token below when you're ready."
echo ""

# Prompt for the token with validation (basic length check)
while true; do
    read -p "🔑 Paste your Long-Lived Access Token here: " HA_TOKEN
    
    if [ -z "$HA_TOKEN" ]; then
        echo "❌ Token cannot be empty. Please try again."
        continue
    fi
    
    if [ ${#HA_TOKEN} -lt 100 ]; then
        echo "⚠️  That token looks too short. Make sure you copied the full token."
        read -p "Try again? (y/N): " retry
        if [[ ! "$retry" =~ ^[Yy]$ ]]; then
            echo "Setup cancelled."
            exit 1
        fi
        continue
    fi
    
    break
done

# Update .env file
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    echo "📋 Creating new .env file..."
    cp .env.example "$ENV_FILE" 2>/dev/null || touch "$ENV_FILE"
fi

# Use sed to update or append HOME_ASSISTANT_TOKEN
if grep -q "^HOME_ASSISTANT_TOKEN=" "$ENV_FILE"; then
    sed -i '' "s|^HOME_ASSISTANT_TOKEN=.*|HOME_ASSISTANT_TOKEN=$HA_TOKEN|" "$ENV_FILE"
else
    echo "" >> "$ENV_FILE"
    echo "# Home Assistant Integration" >> "$ENV_FILE"
    echo "HOME_ASSISTANT_TOKEN=$HA_TOKEN" >> "$ENV_FILE"
fi

echo ""
echo "✅ Token saved securely to .env"
echo ""

# Restart the home-ai service so it picks up the new token
echo "🔄 Restarting Home AI server to apply configuration..."
docker compose restart home-ai

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo "Your Home AI now has secure access to Home Assistant for device control"
echo "(washer, Litter-Robot, lights, etc.)."
echo ""
echo "Next recommended step:"
echo "   • Install BlueBubbles (if not done yet) → https://bluebubbles.app"
echo "   • Test your assistant by sending an iMessage"
echo ""
echo "Useful commands:"
echo "   docker compose logs -f home-ai-server     # Watch AI processing"
echo "   ./start.sh                                # Quick start"
echo "   ./stop.sh                                 # Quick stop"
echo ""
echo "Your intelligent Home AI is ready for iMessage commands! 🏠✨"