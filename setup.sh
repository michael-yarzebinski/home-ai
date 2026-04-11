#!/bin/bash
set -e

echo "🚀 ai-home Setup Script"
echo "======================="

# Ask for basic or advanced config
echo "Choose configuration type:"
echo "1) Basic (recommended for most users)"
echo "2) Advanced (custom ports, credentials, etc.)"
read -p "Enter 1 or 2: " config_type

if [ "$config_type" = "2" ]; then
  echo "Advanced configuration:"
  read -p "Postgres Port [5432]: " pg_port
  pg_port=${pg_port:-5432}
  
  read -p "Server Port [3000]: " server_port
  server_port=${server_port:-3000}
  
  read -p "Postgres User [aiadmin]: " pg_user
  pg_user=${pg_user:-aiadmin}
  
  read -sp "Postgres Password: " pg_password
  echo ""
else
  # Basic defaults
  pg_port=5432
  server_port=3000
  pg_user="aiadmin"
  pg_password="aihome_secure_2026"
fi

# Create .env file
cat > .env << EOF
# Database
DB_HOST=localhost
DB_PORT=${pg_port}
DB_USER=${pg_user}
DB_PASSWORD=${pg_password}
DB_NAME=aihome

# Server
SERVER_PORT=${server_port}

# Ollama
OLLAMA_HOST=http://localhost:11434

# BlueBubbles (iMessage)
BLUEBUBBLES_URL=http://localhost:1234

# Webhook for devices (washer, LitterRobot, etc.)
WEBHOOK_PORT=3002
WEBHOOK_SECRET=change_this_to_a_strong_secret_please

# Weather (for daily summary)
WEATHER_ZIP_CODE=90210

# General
NODE_ENV=development
EOF

echo "✅ .env file created with your settings."

# Install system dependencies
echo "Installing system dependencies..."
if ! command -v brew &> /dev/null; then
  echo "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

brew install node docker ollama
brew install --cask docker bluebubbles

cd apps/server

# Install Node dependencies
echo "Installing NestJS dependencies..."
npm install

echo "✅ Setup complete!"

echo ""
echo "Next steps:"
echo "1. Run: ./start.sh"
echo "2. The server will automatically start Docker, create the database, run migrations, and start the NestJS server."
echo "3. You will be prompted to create the first admin user during startup."

chmod +x ../../start.sh ../../stop.sh
echo "✅ setup.sh is ready!"