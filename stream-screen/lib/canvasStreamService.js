import { spawn } from 'child_process';
import { Canvas, Path2D } from 'skia-canvas';
import sharp from 'sharp';

// Global polyfills for ProceduralRenderer in Node
if (typeof global !== 'undefined') {
    global.Path2D = Path2D;
    global.Canvas = Canvas;
}
import { fighterStateService } from './fighterStateService.js';
import prisma from './prisma.js';
import { io } from 'socket.io-client';
import { ArcadeEngine } from '../engine/index.js';
import { SkiaRenderer } from '../engine/renderer/skiaRenderer.js';

/**
 * Pixi-based Stream Service
 */
class CanvasStreamService {
    constructor() {
        if (!global.canvasStreamServiceInstance) {
            this.activeStreams = new Map();
            global.canvasStreamServiceInstance = this;
        }

        // Use ArcadeEngine + SkiaRenderer
        this.engine = new ArcadeEngine(320, 180);
        this.renderer = new SkiaRenderer(320, 180, 1280, 720);

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
            // 1. Initialize renderer if needed (canvasRenderer handles this internally in renderFrame)
            // await this.renderer.initialize(); // Optional explicit call

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
            let currentDesigns = null;

            // Función para obtener datos del poll y diseños
            const fetchPollData = async () => {
                try {
                    // Use global fetch (available in Node.js 18+)
                    const response = await fetch(`http://localhost:3000/api/poll`);
                    const data = await response.json();

                    if (data.current) {
                        const prevPollId = currentPollData?.current?.id;
                        currentPollData = data;

                        // Fetch designs if poll changed or designs missing
                        if (data.current.id !== prevPollId || !currentDesigns) {
                            console.log(`[CanvasStreamService] Poll changed to ${data.current.id}, fetching designs...`);
                            try {
                                const designsRes = await fetch(`http://localhost:3000/api/poll/designs/${data.current.id}`);
                                if (designsRes.ok) {
                                    currentDesigns = await designsRes.json();
                                    this.engine.updateDesigns(currentDesigns);
                                }
                            } catch (dErr) {
                                console.error('[CanvasStreamService] Error fetching designs:', dErr);
                            }
                        }
                    }
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

            // 5. Configurar argumentos de FFmpeg optimizados para baja latencia
            const ffmpegArgs = [
                // Input de video (Canvas raw frames)
                '-f', 'rawvideo',
                '-vcodec', 'rawvideo',
                '-s', '1280x720',
                '-pix_fmt', 'rgb24',    // ProceduralRenderer now returns RGB24 (via Sharp)
                '-r', '30',
                '-i', 'pipe:0',
                // Codificación de video (optimizada para baja latencia)
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-tune', 'zerolatency',
                '-threads', '2',
                '-b:v', '2048k',
                '-minrate', '2048k',
                '-maxrate', '2048k',
                '-bufsize', '1024k',
                '-nal-hrd', 'cbr',
                '-pix_fmt', 'yuv420p',
                '-profile:v', 'main',
                '-level', '3.1',
                '-g', '60',
                '-sc_threshold', '0',
                // Output RTMP
                '-f', 'flv',
                '-flvflags', 'no_duration_filesize',
                rtmpUrl
            ];

            // Note: Removed PulseAudio input for now to stabilize the stream while fixing permissions

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
                            // 1. Sync Logic State from Redis/Poll
                            const combatState = await fighterStateService.getState(currentPollData?.current?.id || 'idle');

                            // 2. Map Combat State to Renderable State
                            const renderState = {
                                fighters: [
                                    {
                                        x: 320, y: 550,
                                        hp: combatState.fighterA.hp,
                                        flip: false,
                                        action: combatState.fighterA.animation
                                    },
                                    {
                                        x: 960, y: 550,
                                        hp: combatState.fighterB.hp,
                                        flip: true,
                                        action: combatState.fighterB.animation
                                    }
                                ],
                                timer: Math.floor((new Date(currentPollData?.current?.expiresAt || Date.now()) - Date.now()) / 1000)
                            };

                            // Update Combat logic (damage shakes, etc.)
                            if (currentPollData && currentPollData.current) {
                                await fighterStateService.updateCombat(currentPollData.current.id, currentPollData.current);
                            }

                            // 3. Render Procedurally using ArcadeEngine
                            this.engine.update(elapsed);

                            // Synchronize engine state with combat state
                            this.engine.p1.hp = combatState.fighterA.hp / 100;
                            this.engine.p2.hp = combatState.fighterB.hp / 100;
                            this.engine.p1.anim.setState(combatState.fighterA.animation.toUpperCase());
                            this.engine.p2.anim.setState(combatState.fighterB.animation.toUpperCase());
                            this.engine.state.timer = renderState.timer;

                            const pixelBuffer = this.engine.render(now);
                            const canvas = this.renderer.render(pixelBuffer);

                            // Get raw RGB24 buffer from Skia
                            const frameBuffer = await canvas.toBuffer('raw');
                            // Note: raw from skia is RGBA, we need RGB or tell ffmpeg it's RGBA
                            // I'll update ffmpeg args to accept rgba for simplicity or convert here.
                            // Let's use RGB for consistency with previous setup.

                            const sharpBuffer = await sharp(frameBuffer, {
                                raw: { width: 1280, height: 720, channels: 4 }
                            })
                                .removeAlpha()
                                .toBuffer();

                            // 4. Pipe to FFmpeg
                            if (ffmpeg && ffmpeg.stdin && !ffmpeg.stdin.destroyed) {
                                try {
                                    ffmpeg.stdin.write(sharpBuffer);
                                } catch (writeErr) {
                                    // Handle pipe pressure/breaks
                                }
                            }

                            lastFrameTime = now;
                        } catch (err) {
                            console.error(`[CanvasStreamService] Error generating frame:`, err);
                        }
                    }

                    // Strict FPS control
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

    async stopStream(streamKey) {
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

