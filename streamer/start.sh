# Silence DBUS and Accessibility warnings
export NO_AT_BRIDGE=1
export DBUS_SESSION_BUS_ADDRESS=/dev/null

# Remove Xvfb lock and start Xvfb
rm -f /tmp/.X99-lock
Xvfb :99 -screen 0 1280x720x24 -ac +extension GLX +render -noreset &
export DISPLAY=:99

# Wait for Xvfb to be ready
for i in {1..10}; do
    if xwininfo -root > /dev/null 2>&1; then
        echo "Xvfb is ready"
        break
    fi
    echo "Waiting for Xvfb..."
    sleep 1
done

# Start PulseAudio
pulseaudio -D --exit-idle-time=-1 --system=false
sleep 2

# Create a virtual sink and set it as default
pactl load-module module-null-sink sink_name=vss sink_properties=device.description="Virtual_Sink"
pactl set-default-sink vss

pkill chromium || true
rm -rf /tmp/chrome-user-data*

mkdir -p /tmp/chrome-user-data
echo "Starting Background Music..."
ffplay -nodisp -loop 0 melody.wav > /dev/null 2>&1 &

echo "Starting Chromium..."
TARGET_URL=${TARGET_URL:-"http://webapp:3000"}
chromium \
  "$TARGET_URL" \
  --no-sandbox \
  --test-type \
  --kiosk \
  --window-position=0,0 \
  --window-size=1280,720 \
  --force-device-scale-factor=1 \
  --memory-model=low \
  --js-flags="--max-old-space-size=256" \
  --disable-dev-shm-usage \
  --disable-gpu \
  --disable-software-rasterizer \
  --disable-extensions \
  --disable-notifications \
  --disable-infobars \
  --disable-features=HttpsOnlyMode,HttpsUpgrades \
  --disable-features=StrictOriginIsolation \
  --allow-running-insecure-content \
  --ignore-certificate-errors \
  --no-first-run \
  --no-default-browser-check \
  --autoplay-policy=no-user-gesture-required \
  --user-data-dir=/tmp/chrome-user-data &

echo "Waiting for Chromium to load the page..."
sleep 15

echo "Starting FFmpeg to ${RTMP_URL}/${STREAM_KEY}..."
# Capture video from X11 and audio from PulseAudio (Virtual Sink Monitor)
ffmpeg -f x11grab -draw_mouse 0 -r 30 -s 1280x720 \
  -probesize 10M -analyzeduration 10M \
  -i :99 \
  -f pulse -i vss.monitor \
  -c:a aac -ab 128k -ar 44100 \
  -c:v libx264 -preset veryfast -tune zerolatency \
  -b:v 2048k -minrate 2048k -maxrate 2048k -bufsize 2048k \
  -nal-hrd cbr \
  -pix_fmt yuv420p -profile:v main -level 3.1 \
  -g 60 \
  -f flv -flvflags no_duration_filesize \
  -map 0:v:0 -map 1:a:0 \
  "${RTMP_URL}/${STREAM_KEY}" || echo "FFmpeg failed with exit code $?"