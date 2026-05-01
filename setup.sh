#!/bin/bash
# ================================================
# Home AI - Setup Wizard
# ================================================

echo "🏠 Home AI - Setup Wizard"
echo "========================"

echo "⏳ Waiting for Home Assistant to be ready..."
sleep 20

echo ""
echo "📍 Home Assistant URL: http://localhost:8123"
echo "   → Open this link and create a Long-Lived Access Token"
echo ""

# Home Assistant token with validation
while true; do
    read -p "🔑 Paste your Home Assistant Long-Lived Access Token: " HA_TOKEN
    if [ ${#HA_TOKEN} -gt 100 ]; then
        break
    fi
    echo "⚠️  Token looks too short. Please try again."
done

# BlueBubbles password with validation
echo ""
echo "📍 BlueBubbles URL: http://localhost:1234 (or wherever you run BlueBubbles)"
echo "   → Go to Settings → Server → API Password and copy it"
echo ""
while true; do
    read -p "🔑 Paste your BlueBubbles API Password: " BB_PASSWORD
    if [ -n "$BB_PASSWORD" ]; then
        break
    fi
    echo "⚠️  Password cannot be empty. Please try again."
done

# Write to .env
sed -i '' "s|^HOME_ASSISTANT_TOKEN=.*|HOME_ASSISTANT_TOKEN=$HA_TOKEN|" .env 2>/dev/null || echo "HOME_ASSISTANT_TOKEN=$HA_TOKEN" >> .env
sed -i '' "s|^BLUEBUBBLES_PASSWORD=.*|BLUEBUBBLES_PASSWORD=$BB_PASSWORD|" .env 2>/dev/null || echo "BLUEBUBBLES_PASSWORD=$BB_PASSWORD" >> .env

echo ""
echo "✅ Tokens saved to .env"
echo "🚀 Starting Home AI server now..."
docker compose up -d home-ai

echo ""
echo "🎉 Setup complete! Your Home AI is now running."
echo "   Logs: docker compose logs -f home-ai"