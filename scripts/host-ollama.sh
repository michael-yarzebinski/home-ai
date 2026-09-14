#!/bin/bash
# Native Ollama on macOS (Metal). Sourced by install.sh / start.sh / stop.sh.
# Docker cannot pass the Apple GPU into a Linux VM, so the Mac hub runs Ollama
# on the host and the Nest container reaches it via host.docker.internal.

OLLAMA_HOST_URL="${OLLAMA_HOST_URL:-http://127.0.0.1:11434}"
OLLAMA_MODEL="${OLLAMA_MODEL:-qwen3:8b}"
OLLAMA_VISION_MODEL="${OLLAMA_VISION_MODEL:-qwen3-vl:8b}"
OLLAMA_PM2_NAME="home-ai-ollama"
# Metal long-context: flash attention + quantized KV cache (Homebrew's recommended flags).
OLLAMA_FLASH_ATTENTION="${OLLAMA_FLASH_ATTENTION:-1}"
OLLAMA_KV_CACHE_TYPE="${OLLAMA_KV_CACHE_TYPE:-q8_0}"

ollama_api_up() {
  curl -sf "${OLLAMA_HOST_URL}/api/version" >/dev/null 2>&1
}

stop_docker_ollama() {
  if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -qx 'home-ai-ollama'; then
    echo "🧹 Stopping Docker Ollama so the host can bind port 11434 (Metal)..."
    docker stop home-ai-ollama >/dev/null 2>&1 || true
    docker rm home-ai-ollama >/dev/null 2>&1 || true
  fi
}

ensure_host_ollama() {
  if ollama_api_up; then
    echo "✅ Ollama is already running on ${OLLAMA_HOST_URL}"
    return 0
  fi

  if ! command -v ollama >/dev/null 2>&1; then
    echo "❌ ollama CLI not found. Run ./install.sh first."
    return 1
  fi

  echo "🚀 Starting native Ollama (Metal)..."
  if command -v pm2 >/dev/null 2>&1; then
    pm2 delete "${OLLAMA_PM2_NAME}" >/dev/null 2>&1 || true
    OLLAMA_FLASH_ATTENTION="${OLLAMA_FLASH_ATTENTION}" \
      OLLAMA_KV_CACHE_TYPE="${OLLAMA_KV_CACHE_TYPE}" \
      pm2 start "$(command -v ollama)" --name "${OLLAMA_PM2_NAME}" -- serve
    pm2 save >/dev/null 2>&1 || true
  else
    nohup env OLLAMA_FLASH_ATTENTION="${OLLAMA_FLASH_ATTENTION}" \
      OLLAMA_KV_CACHE_TYPE="${OLLAMA_KV_CACHE_TYPE}" \
      ollama serve >/tmp/home-ai-ollama.log 2>&1 &
  fi

  local i=0
  until ollama_api_up || [ "$i" -ge 30 ]; do
    sleep 1
    i=$((i + 1))
  done

  if ollama_api_up; then
    echo "✅ Native Ollama is up"
    return 0
  fi

  echo "❌ Ollama did not become ready on ${OLLAMA_HOST_URL}"
  return 1
}

stop_host_ollama() {
  if command -v pm2 >/dev/null 2>&1; then
    echo "🔗 Stopping native Ollama (PM2)..."
    pm2 stop "${OLLAMA_PM2_NAME}" >/dev/null 2>&1 || true
  fi
}

ensure_ollama_model() {
  echo "📥 Pulling ${OLLAMA_MODEL} (skip if already present)..."
  ollama pull "${OLLAMA_MODEL}"
  echo "📥 Pulling vision model ${OLLAMA_VISION_MODEL} (skip if already present)..."
  ollama pull "${OLLAMA_VISION_MODEL}"
}
