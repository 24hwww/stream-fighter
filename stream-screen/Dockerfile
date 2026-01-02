# Multi-stage Dockerfile for Development and Production
FROM node:20-bookworm-slim AS base

# Install system dependencies
# ffmpeg: for streaming
# pulseaudio: for audio routing
# build-essential: for native modules (canvas, etc)
# libcairo2-dev, etc: for @napi-rs/canvas and skia-canvas
RUN apt-get update && apt-get install -y \
    ffmpeg \
    pulseaudio \
    pavucontrol \
    procps \
    curl \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --- Dependencies Stage ---
FROM base AS deps
COPY package.json package-lock.json* ./
# Install ALL dependencies (including devDependencies for build)
RUN npm install --legacy-peer-deps

# --- Builder Stage ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client
RUN npx prisma generate
# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED 1
# Build application
RUN npm run build

# --- Development Stage ---
# Used for local development with hot-reload
FROM base AS development
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED 1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
COPY start.sh ./
RUN chmod +x start.sh
EXPOSE 3000
CMD ["/bin/bash", "/app/start.sh"]

# --- Production Runner Stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# Copy standalone build from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/start.sh ./start.sh

RUN chmod +x start.sh

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["/bin/bash", "/app/start.sh"]