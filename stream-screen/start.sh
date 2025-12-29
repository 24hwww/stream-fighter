#!/bin/bash
# Cleanup Xvfb lock files
rm -f /tmp/.X*-lock

# Silence DBUS and Accessibility warnings
export NO_AT_BRIDGE=1
export DBUS_SESSION_BUS_ADDRESS=/dev/null

# Initialize PulseAudio
pulseaudio -D --exit-idle-time=-1 --system=false
sleep 2

# Create the default virtual sink
pactl load-module module-null-sink sink_name=vss sink_properties=device.description="Virtual_Sink"
pactl set-default-sink vss

# Run Next.js server
echo "Starting Next.js server..."
node server.js
