#!/bin/bash
set -e

echo "🚀 Starting ai-home System (Mac Mode)"
echo "====================================="

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "❌ .env file not found. Please run ./setup.sh first."
  exit 1
fi

# Start Ollama in background if not already running
echo "Starting Ollama..."
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
  ollama serve > ollama.log 2>&1 &
  OLLAMA_PID=$!
  echo "✅ Ollama started in background (PID: $OLLAMA_PID)"
  sleep 4
else
  echo "✅ Ollama is already running"
fi

# Start Docker services (Postgres + Home Assistant)
echo "Starting Docker services..."
docker compose up -d

# Wait for Postgres
echo "Waiting for Postgres to be ready..."
until docker compose exec -T postgres pg_isready -U "$DB_USER" > /dev/null 2>&1; do
  sleep 2
done
echo "✅ Postgres is ready."

# Move to server directory
cd apps/server

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Run migrations and seeding
echo "Running database migrations..."
npx knex migrate:latest

echo "Seeding initial data..."
npx knex seed:run

echo ""
echo "========================================"
echo "Starting NestJS AI Server..."
echo "URL: http://localhost:$SERVER_PORT"
echo "========================================"
echo ""

# Start the NestJS server
npm run start:dev