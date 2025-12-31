import { spawn } from 'child_process';
import { canvasRenderer } from './canvasRenderer.js';
import prisma from './prisma.js';
import { io } from 'socket.io-client';

/**
 * Canvas-based Stream Service
 * Reemplaza Chromium con renderizado Canvas directo para mejor rendimiento
 */
class CanvasStreamService {
    constructor() {
        if (!global.canvasStreamServiceInstance) {
            this.activeStreams = new Map();
            this.frameGenerators = new Map();
            global.canvasStreamServiceInstance = this;
        }
        return global.canvasStreamServiceInstance;
    }

    async startStream(screenId, streamKey) {
        if (this.activeStreams.has(streamKey)) {
            console.log(`[CanvasStreamService] Stream ${streamKey} is already running.`);
            return { status: 'already_running', streamKey };
        }

        const rtmpBaseUrl = process.env.RTMP_URL || 'rtmp://restreamer:1935/live';
        const rtmpUrl = `${rtmpBaseUrl}/${streamKey}`;

        console.log(`[CanvasStreamService] Starting stream: id=${screenId}, key=${streamKey}`);

        try {
            // 1. Inicializar renderizador Canvas
            await canvasRenderer.initialize();

            // 2. Crear PulseAudio sink para audio
            const sinkName = `vss_${streamKey}`;
            console.log(`[CanvasStreamService] Creating sink: ${sinkName}`);
            spawn('pactl', ['load-module', 'module-null-sink', `sink_name=${sinkName}`, `sink_properties=device.description="Sink_${streamKey}"`]);

            // 3. Obtener configuración del stream
            const streamConfig = await prisma.stream.findUnique({
                where: { slug: screenId }
            }).catch(() => null);

            const config = streamConfig?.uiConfig || {};

            // 4. Conectar a socket para actualizaciones en tiempo real
            // En el servidor, usar URL interna preferentemente
            const socketUrl = process.env.INTERNAL_SOCKET_URL || process.env.NEXT_PUBLIC_SOCKET_URL || 'http://stream-socket:3001';
            console.log(`[CanvasStreamService] Connecting to socket at: ${socketUrl}`);
            const socket = io(socketUrl);

            let currentPollData = null;

            // Función para obtener datos del poll
            const fetchPollData = async () => {
                try {
                    // Usar fetch nativo de Node.js 18+ o import dinámico
                    let fetchFn;
                    if (typeof fetch !== 'undefined') {
                        fetchFn = fetch;
                    } else {
                        const nodeFetch = await import('node-fetch');
                        fetchFn = nodeFetch.default;
                    }
                    const response = await fetchFn(`http://localhost:3000/api/poll`);
                    const data = await response.json();
                    currentPollData = data;
                } catch (err) {
                    console.error('[CanvasStreamService] Error fetching poll:', err);
                }
            };

            // Cargar datos iniciales
            await fetchPollData();

            // Escuchar actualizaciones de socket
            socket.on('vote-update', () => {
                fetchPollData();
            });

            socket.on('poll-update', () => {
                fetchPollData();
            });

            // 5. Crear pipe para FFmpeg
            // 5. Configurar argumentos de FFmpeg
            const ffmpegArgs = [
                '-f', 'rawvideo',
                '-vcodec', 'rawvideo',
                '-s', '1280x720',
                '-pix_fmt', 'rgb24',
                '-r', '30',
                '-i', 'pipe:0',
                '-f', 'pulse',
                '-i', `${sinkName}.monitor`,
                '-c:v', 'libx264',
                '-preset', 'veryfast',
                '-tune', 'zerolatency',
                '-b:v', '2048k',
                '-minrate', '2048k',
                '-maxrate', '2048k',
                '-bufsize', '2048k',
                '-nal-hrd', 'cbr',
                '-pix_fmt', 'yuv420p',
                '-profile:v', 'main',
                '-level', '3.1',
                '-g', '60',
                '-c:a', 'aac',
                '-ab', '128k',
                '-ar', '44100',
                '-f', 'flv',
                '-flvflags', 'no_duration_filesize',
                rtmpUrl
            ];

            let ffmpeg = null;
            let isRunning = true;
            let restartTimeout = null;

            const startFFmpeg = () => {
                if (!isRunning) return;

                console.log(`[CanvasStreamService] Spawning FFmpeg process...`);
                ffmpeg = spawn('ffmpeg', ffmpegArgs);
                ffmpeg.stdin.setDefaultEncoding('binary');

                ffmpeg.on('error', (err) => console.error(`[CanvasStreamService] FFmpeg error: ${err}`));

                ffmpeg.stderr.on('data', (data) => {
                    console.error(`[FFmpeg-${streamKey}] ${data.toString()}`);
                });

                ffmpeg.on('close', (code) => {
                    if (!isRunning) {
                        console.log(`[CanvasStreamService] FFmpeg stopped gracefully.`);
                        return;
                    }
                    console.warn(`[CanvasStreamService] FFmpeg exited with code ${code}. Restarting in 5 seconds...`);
                    restartTimeout = setTimeout(startFFmpeg, 5000);
                });
            };

            // Iniciar FFmpeg
            startFFmpeg();

            // 6. Generar frames y enviarlos a FFmpeg
            const frameInterval = 1000 / 30; // 30 FPS
            let lastFrameTime = Date.now();

            const generateFrames = async () => {
                while (isRunning) {
                    const now = Date.now();
                    const elapsed = now - lastFrameTime;

                    if (elapsed >= frameInterval) {
                        try {
                            // Renderizar frame
                            const frameBuffer = await canvasRenderer.generateFrameBuffer(currentPollData, config);

                            // Enviar a FFmpeg si el proceso está activo
                            if (ffmpeg && ffmpeg.stdin && !ffmpeg.stdin.destroyed) {
                                try {
                                    ffmpeg.stdin.write(frameBuffer);
                                } catch (writeErr) {
                                    // Ignorar errores de escritura momentáneos (ej. durante reinicio)
                                }
                            }

                            lastFrameTime = now;
                        } catch (err) {
                            console.error(`[CanvasStreamService] Error generating frame:`, err);
                        }
                    }

                    // Pequeña pausa para no saturar CPU
                    await new Promise(resolve => setTimeout(resolve, 1));
                }
            };

            // Iniciar generación de frames
            generateFrames().catch(err => {
                console.error(`[CanvasStreamService] Frame generation error:`, err);
            });

            this.activeStreams.set(streamKey, {
                get ffmpeg() { return ffmpeg; }, // Dynamic reference
                socket,
                sinkName,
                screenId,
                isRunning: () => isRunning,
                stop: () => {
                    isRunning = false;
                    if (restartTimeout) clearTimeout(restartTimeout);
                }
            });

            return { status: 'started', streamKey, rtmpUrl };

        } catch (error) {
            console.error(`[CanvasStreamService] Failed to start stream ${streamKey}:`, error);
            this.stopStream(streamKey);
            throw error;
        }
    }

    stopStream(streamKey) {
        const stream = this.activeStreams.get(streamKey);
        if (stream) {
            console.log(`[CanvasStreamService] Stopping stream: ${streamKey}`);

            if (stream.stop) stream.stop();

            try {
                if (stream.ffmpeg && !stream.ffmpeg.killed) {
                    stream.ffmpeg.stdin.end();
                    stream.ffmpeg.kill('SIGTERM');
                }
            } catch (e) { }

            try {
                if (stream.socket) {
                    stream.socket.disconnect();
                }
            } catch (e) { }

            try {
                // Remover sink de PulseAudio
                spawn('pactl', ['unload-module', `module-null-sink`]);
            } catch (e) { }

            this.activeStreams.delete(streamKey);
            return true;
        }
        return false;
    }

    listStreams() {
        return Array.from(this.activeStreams.entries()).map(([key, value]) => ({
            streamKey: key,
            screenId: value.screenId,
            running: value.isRunning ? value.isRunning() : false
        }));
    }
}

export const canvasStreamService = new CanvasStreamService();

