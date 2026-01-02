FROM node:20-bookworm-slim AS base

# Install runtime dependencies
# Canvas dependencies: cairo, pango, libjpeg, giflib, librsvg
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
    && rm -rf /var/lib/apt/lists/*

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# We don't use the nextjs user here because PulseAudio/Xvfb often need more permissions 
# or specific home dir setup for Chrome. For simplicity in this complex setup, 
# we stay as root or configure thoroughly. The user previously used root in streamer.

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Copy start script
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["/bin/bash", "/app/start.sh"]