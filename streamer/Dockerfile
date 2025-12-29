FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y \
    chromium \
    ffmpeg \
    xvfb \
    curl \
    procps \
    x11-utils \
    pulseaudio \
    pavucontrol \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /stream
COPY . .
RUN chmod +x start.sh
CMD ["bash", "start.sh"]