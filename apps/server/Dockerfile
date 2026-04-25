# STAGE 1: Build
FROM node:20-alpine AS builder

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy root metadata and base config
# Added package-lock.json to ensure consistent dependency resolution
COPY package.json package-lock.json* tsconfig.base.json ./
# Copy workspace metadata
COPY apps/shared/package.json ./apps/shared/
COPY apps/server/package.json ./apps/server/

# Install dependencies for the whole workspace
# We ignore scripts to avoid running build before source code is present
RUN npm install --ignore-scripts

# Copy source code
COPY apps/shared ./apps/shared
COPY apps/server ./apps/server

# Build the shared library first
RUN npm run build -w @home-ai/shared

# Move to server directory and build
WORKDIR /app/apps/server
# This will trigger prebuild (rimraf) then build:docker
RUN npm run build:docker

# STAGE 2: Runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json* ./
COPY apps/shared/package.json ./apps/shared/
COPY apps/server/package.json ./apps/server/

RUN npm install --omit=dev --ignore-scripts

# Copy compiled artifacts from builder
COPY --from=builder /app/apps/shared/dist ./apps/shared/dist
COPY --from=builder /app/apps/server/dist ./apps/server/dist

# Ensure the shared package is linked in production
RUN npm install --omit=dev --workspace=@home-ai/shared --workspace=@home-ai/server --ignore-scripts

ENV NODE_ENV=production
WORKDIR /app/apps/server

# Start the application
CMD ["node", "dist/main"]