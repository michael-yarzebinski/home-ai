# Build static UI (Vite bundles @home-ai/shared from source via alias)
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json* tsconfig.base.json ./
COPY apps/shared/package.json ./apps/shared/
COPY apps/ui/package.json ./apps/ui/
# Lockfile was generated with all workspaces; missing manifests skew hoisting (e.g. zod for @hookform/resolvers).
COPY apps/server/package.json ./apps/server/

RUN npm install --ignore-scripts

COPY apps/shared ./apps/shared
COPY apps/ui ./apps/ui

RUN npm run build -w @home-ai/ui

FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/apps/ui/dist /usr/share/nginx/html
COPY apps/ui/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
