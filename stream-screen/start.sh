#!/bin/bash
cd /app
echo "Starting stream-screen service..."
ls -l /app/start.sh

# Cleanup PulseAudio and X11
rm -rf /tmp/.X*-lock /tmp/pulse-* /root/.config/pulse /root/.pulse-cookie
mkdir -p /tmp/pulse-socket

# Initialize PulseAudio
if ! pulseaudio -D --system --disallow-exit --disallow-module-loading=0; then
    echo "PulseAudio system mode failed, trying standard mode as root..."
    pulseaudio -D --exit-idle-time=-1 --system=false --disallow-exit --disallow-module-loading=0
fi
sleep 2

# Create the default virtual sink
pactl load-module module-null-sink sink_name=vss sink_properties=device.description="Virtual_Sink"
pactl set-default-sink vss

# Run Next.js server
if [ "$NODE_ENV" = "development" ]; then
    echo "Starting Next.js in DEVELOPMENT mode (Hot Reload enabled)..."
    npm run dev
else
    if [ -f "server.js" ]; then
        echo "Starting Next.js in PRODUCTION mode..."
        node server.js
    else
        echo "server.js not found, falling back to npm run dev..."
        npm run dev
    fi
fi
