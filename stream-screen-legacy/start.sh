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
    # Ensure dependencies are installed if mounted without them
    if [ ! -d "node_modules" ]; then
        npm install --legacy-peer-deps
    fi
    npx prisma generate
    npm run dev
else
    echo "Starting Next.js in PRODUCTION mode..."
    # Next.js standalone output puts server.js in the root of the standalone folder
    if [ -f "server.js" ]; then
        node server.js
    else
        echo "server.js not found, checking .next/standalone..."
        if [ -f ".next/standalone/server.js" ]; then
            cd .next/standalone
            node server.js
        else
            echo "Error: Could not find server.js. Falling back to npm run start (might fail if devDeps missing)."
            npm run start
        fi
    fi
fi
