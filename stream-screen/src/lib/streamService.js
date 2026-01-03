import { spawn } from 'child_process';
import path from 'path';

class StreamService {
    constructor() {
        if (!global.streamServiceInstance) {
            this.activeStreams = new Map();
            this.displayCounter = 100;
            global.streamServiceInstance = this;
        }
        return global.streamServiceInstance;
    }

    async startStream(screenId, streamKey) {
        if (this.activeStreams.has(streamKey)) {
            console.log(`Stream ${streamKey} is already running.`);
            return { status: 'already_running', streamKey };
        }

        const rtmpBaseUrl = process.env.RTMP_URL || 'rtmp://restreamer:1935/live';
        const rtmpUrl = `${rtmpBaseUrl}/${streamKey}`;

        // Usar Canvas renderer si está disponible (más eficiente)
        const useCanvas = process.env.USE_CANVAS_RENDERER !== 'false';

        if (useCanvas) {
            try {
                console.log(`[StreamService] Using Canvas renderer for ${streamKey}`);
                const { canvasStreamService } = await import('./canvasStreamService.js');
                return await canvasStreamService.startStream(screenId, streamKey);
            } catch (e) {
                console.warn(`[StreamService] Canvas renderer failed, falling back to Chromium:`, e.message);
            }
        }

        // Fallback a Chromium (método original)
        console.log(`[StreamService] Using Chromium renderer for ${streamKey}`);
        const display = `:${this.displayCounter++}`;
        const targetUrl = `http://localhost:3000/screen/${screenId}`;

        console.log(`[StreamService] Starting stream: id=${screenId}, key=${streamKey}, display=${display}`);

        try {
            // 0. Create dedicated PulseAudio sink
            const sinkName = `vss_${streamKey}`;
            console.log(`[StreamService] Creating sink: ${sinkName}`);
            spawn('pactl', ['load-module', 'module-null-sink', `sink_name=${sinkName}`, `sink_properties=device.description="Sink_${streamKey}"`]);

            // 1. Start Xvfb
            const xvfb = spawn('Xvfb', [display, '-screen', '0', '1280x720x24', '-ac', '+extension', 'GLX', '+render', '-noreset']);
            xvfb.on('error', (err) => console.error(`Xvfb error: ${err}`));

            // Wait for Xvfb
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 2. Start Chromium
            const chrome = spawn('chromium', [
                targetUrl,
                '--no-sandbox',
                '--test-type',
                '--kiosk',
                '--window-position=0,0',
                '--window-size=1280,720',
                '--force-device-scale-factor=1',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-extensions',
                '--disable-notifications',
                '--disable-infobars',
                '--autoplay-policy=no-user-gesture-required',
                `--user-data-dir=/tmp/chrome-${streamKey}`
            ], {
                env: { ...process.env, DISPLAY: display, PULSE_SINK: sinkName }
            });
            chrome.on('error', (err) => console.error(`Chrome error: ${err}`));

            // Wait for page load
            console.log(`[StreamService] Waiting for page to load: ${targetUrl}`);
            await new Promise(resolve => setTimeout(resolve, 12000));

            // 3. Start FFmpeg (optimizado para baja latencia)
            console.log(`[StreamService] Launching FFmpeg to ${rtmpUrl}`);
            const ffmpegArgs = [
                // Input de video (X11 grab)
                '-f', 'x11grab', '-draw_mouse', '0', '-r', '30', '-s', '1280x720',
                '-probesize', '10M', '-analyzeduration', '10M',
                '-i', display,
                // Input de audio (PulseAudio)
                '-f', 'pulse', '-i', `${sinkName}.monitor`,
                // Codificación de audio
                '-c:a', 'aac', '-ab', '128k', '-ar', '44100', '-ac', '2',
                // Codificación de video (optimizada para baja latencia)
                '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency',
                '-threads', '2',
                '-b:v', '2048k', '-minrate', '2048k', '-maxrate', '2048k', '-bufsize', '1024k',
                '-nal-hrd', 'cbr',
                '-pix_fmt', 'yuv420p', '-profile:v', 'main', '-level', '3.1',
                '-g', '60', '-sc_threshold', '0',
                // Output RTMP
                '-f', 'flv', '-flvflags', 'no_duration_filesize',
                '-map', '0:v:0', '-map', '1:a:0',
                rtmpUrl
            ];

            const ffmpeg = spawn('ffmpeg', ffmpegArgs);
            ffmpeg.on('error', (err) => console.error(`FFmpeg error: ${err}`));

            // Capture logs for debugging
            ffmpeg.stderr.on('data', (data) => {
                // Only log errors or important info from ffmpeg to avoid flooding
                if (data.toString().includes('Error')) {
                    console.error(`[FFmpeg-${streamKey}] ${data.toString()}`);
                }
            });

            this.activeStreams.set(streamKey, { xvfb, chrome, ffmpeg, display, screenId });

            ffmpeg.on('close', (code) => {
                console.log(`[StreamService] FFmpeg for ${streamKey} exited with code ${code}`);
                this.stopStream(streamKey);
            });

            return { status: 'started', streamKey, display, targetUrl, rtmpUrl };

        } catch (error) {
            console.error(`[StreamService] Failed to start stream ${streamKey}:`, error);
            this.stopStream(streamKey);
            throw error;
        }
    }

    async stopStream(streamKey) {
        const stream = this.activeStreams.get(streamKey);

        // Check if it's a canvas stream first
        const { canvasStreamService } = await import('./canvasStreamService.js');
        const isCanvasStream = canvasStreamService.activeStreams.has(streamKey);

        if (isCanvasStream) {
            await canvasStreamService.stopStream(streamKey);
        }

        if (stream) {
            console.log(`[StreamService] Stopping stream: ${streamKey}`);
            try { if (stream.ffmpeg) stream.ffmpeg.kill('SIGTERM'); } catch (e) { }
            try { if (stream.chrome) stream.chrome.kill('SIGTERM'); } catch (e) { }
            try { if (stream.xvfb) stream.xvfb.kill('SIGTERM'); } catch (e) { }

            this.activeStreams.delete(streamKey);
            return true;
        }

        return isCanvasStream;
    }

    listStreams() {
        return Array.from(this.activeStreams.entries()).map(([key, value]) => ({
            streamKey: key,
            screenId: value.screenId,
            display: value.display
        }));
    }
}

export const streamService = new StreamService();
