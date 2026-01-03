import { Canvas, loadImage } from 'skia-canvas';
import QRCode from 'qrcode';

/**
 * Canvas Renderer Service
 * Reemplaza Chromium con renderizado directo a Canvas para mejor rendimiento
 * OPTIMIZADO: Ahora utiliza Skia-Canvas y Sharp para máxima velocidad
 */
class CanvasRenderer {
    constructor() {
        this.width = 1280;
        this.height = 720;
        this.fps = 30;
        this.frameInterval = 1000 / this.fps;
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        this.frameCount = 0;
    }

    async initialize() {
        // Skia-canvas Canvas constructor
        this.canvas = new Canvas(this.width, this.height);
        this.ctx = this.canvas.getContext('2d');

        // Configurar calidad de renderizado
        this.ctx.imageSmoothingEnabled = false; // Pixel-perfect style

        console.log('[CanvasRenderer] Skia-Canvas Initialized');
    }

    /**
     * Renderiza un frame del overlay
     */
    async renderFrame(pollData, config = {}, time = 0) {
        if (!this.ctx) await this.initialize();

        const ctx = this.ctx;
        const { width, height } = this.canvas;

        // Limpiar canvas (Fondo oscuro arcade)
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, width, height);

        // 1. Renderizar Fondo Arcade (Glow, Grid, Parallax)
        this.renderArcadeBackground(ctx, width, height, time);

        // 2. Renderizar Personajes (Basado en el polldata)
        if (pollData && pollData.current) {
            this.renderFighters(ctx, width, height, time, pollData.current);
        }

        // 3. Renderizar Overlay de Poll (Barras de vida y VS)
        if (pollData && pollData.current) {
            await this.renderPollOverlay(ctx, width, height, pollData.current, config);
        }

        // 4. Renderizar Sidebar (QR)
        await this.renderSidebar(ctx, width, height, config);

        // 5. Renderizar Footer
        if (pollData) {
            this.renderFooter(ctx, width, height, pollData);
        }

        return;
    }

    /**
     * Renderiza un fondo estilo arcade retro sin GPU
     * OPTIMIZADO: Batch rendering
     */
    renderArcadeBackground(ctx, width, height, time) {
        // Cielo con gradiente
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height - 150);
        skyGrad.addColorStop(0, '#050510');
        skyGrad.addColorStop(1, '#201040');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height - 150);

        // Suelo (Grid)
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, height - 150, width, 150);

        // Grid Lines - BATCHED
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 15; i++) {
            const y = height - 150 + (i * 10);
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();

        // Glow horizontal en el horizonte
        const horizonGlow = ctx.createLinearGradient(0, height - 160, 0, height - 140);
        horizonGlow.addColorStop(0, 'rgba(255, 0, 128, 0)');
        horizonGlow.addColorStop(0.5, 'rgba(255, 0, 128, 0.2)');
        horizonGlow.addColorStop(1, 'rgba(255, 0, 128, 0)');
        ctx.fillStyle = horizonGlow;
        ctx.fillRect(0, height - 160, width, 20);
    }

    /**
     * Renderiza los luchadores usando primitivas 2D (Súper eficiente en CPU)
     */
    renderFighters(ctx, width, height, time, poll) {
        const floorY = height - 150;

        // Calcular HP basado en votos (0 a 1)
        const vA = poll.optionA?._count?.votes || 0;
        const vB = poll.optionB?._count?.votes || 0;
        const total = vA + vB || 1;
        const hpA = Math.max(0.1, 1 - (vB / total));
        const hpB = Math.max(0.1, 1 - (vA / total));

        // Dibujar Luchador A (Izquierda)
        this.drawProceduralFighter(ctx, width * 0.25, floorY, time, '#ff3366', hpA, false);

        // Dibujar Luchador B (Derecha)
        this.drawProceduralFighter(ctx, width * 0.65, floorY, time, '#3366ff', hpB, true);
    }

    drawProceduralFighter(ctx, x, y, time, color, hp, flip) {
        const bounce = Math.sin(time * 0.005) * 10;

        ctx.save();
        ctx.translate(x, y - 20 + bounce);
        if (flip) ctx.scale(-1, 1);

        // Sombra en el suelo (independiente del bounce)
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 20 - bounce, 50, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cuerpo (Rectángulo con bordes redondeados simulado)
        ctx.fillStyle = color;
        ctx.fillRect(-30, -100, 60, 100);

        // Brillo lateral (Retro lighting)
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(-30, -100, 10, 100);

        // Cabeza
        ctx.fillStyle = '#ffdbac'; // Skin
        ctx.fillRect(-20, -145, 40, 40);

        // Brazos
        ctx.fillStyle = color;
        const armSwing = Math.sin(time * 0.004) * 20;
        ctx.fillRect(-45, -90 + armSwing, 15, 50); // Arm 1
        ctx.fillRect(30, -90 - armSwing, 15, 50);  // Arm 2

        // Efecto de "daño" si HP es bajo
        if (hp < 0.4 && (Math.floor(time / 100) % 2 === 0)) {
            ctx.fillStyle = 'white';
            ctx.globalAlpha = 0.5;
            ctx.fillRect(-35, -150, 70, 160);
            ctx.globalAlpha = 1.0;
        }

        ctx.restore();
    }

    /**
     * Renderiza la parte del overlay (vida, nombres)
     */
    async renderPollOverlay(ctx, width, height, poll, config) {
        const vA = poll.optionA?._count?.votes || 0;
        const vB = poll.optionB?._count?.votes || 0;
        const total = vA + vB || 1;
        const percentA = (vA / total);
        const percentB = (vB / total);

        // Barras de Vida (Arriba)
        const barW = 400;
        const barH = 30;

        // Jugador A
        this.drawHealthBar(ctx, 50, 50, barW, barH, 1 - percentB, poll.optionA.name, '#ff3366', false);
        // Jugador B
        this.drawHealthBar(ctx, width - 450, 50, barW, barH, 1 - percentA, poll.optionB.name, '#3366ff', true);

        // VS Central
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('VS', width / 2, 75);
    }

    drawHealthBar(ctx, x, y, w, h, fill, name, color, flip) {
        // Border/Background
        ctx.fillStyle = '#333';
        ctx.fillRect(x - 5, y - 5, w + 10, h + 10);
        ctx.fillStyle = '#000';
        ctx.fillRect(x, y, w, h);

        // Fill
        const fillW = w * Math.max(0, fill);
        ctx.fillStyle = (fill < 0.3) ? '#ff0000' : '#ffff00';

        if (flip) {
            ctx.fillRect(x + (w - fillW), y, fillW, h);
        } else {
            ctx.fillRect(x, y, fillW, h);
        }

        // Name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = flip ? 'right' : 'left';
        ctx.fillText(name.toUpperCase(), flip ? x + w : x, y + h + 25);
    }

    /**
     * Renderiza el sidebar (QR codes, publicidad)
     */
    async renderSidebar(ctx, width, height, config) {
        const sidebarX = width - 320;
        const sidebarY = 0;
        const sidebarWidth = 320;
        const sidebarHeight = height;

        // Fondo del sidebar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(sidebarX, sidebarY, sidebarWidth, sidebarHeight);

        // QR Code de votación
        const qrSize = 200;
        const qrX = sidebarX + (sidebarWidth - qrSize) / 2;
        const qrY = 100;

        try {
            const networkIp = process.env.NETWORK_IP || 'localhost';
            const voteUrl = `http://${networkIp}:3010/vote`;

            // Generar QR code como buffer
            const qrBuffer = await QRCode.toBuffer(voteUrl, {
                width: qrSize,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            // Cargar QR como imagen usando skia-canvas loadImage
            const qrImage = await loadImage(qrBuffer);
            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
        } catch (err) {
            console.error('[CanvasRenderer] Error generating QR:', err);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(qrX, qrY, qrSize, qrSize);
        }

        // Texto "Escanea para votar"
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Escanea con tu celular', qrX + qrSize / 2, qrY + qrSize + 30);
        ctx.fillText('para votar', qrX + qrSize / 2, qrY + qrSize + 50);
    }

    /**
     * Renderiza el footer con estadísticas
     */
    renderFooter(ctx, width, height, pollData) {
        const footerY = height - 160;
        const footerHeight = 160;

        // Fondo del footer
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, footerY, width - 320, footerHeight);

        if (pollData.current) {
            const votesA = pollData.current.optionA?._count?.votes || 0;
            const votesB = pollData.current.optionB?._count?.votes || 0;
            const totalVotes = votesA + votesB;

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`Total de votos: ${totalVotes}`, 40, footerY + 40);
        }
    }

    /**
     * Genera un frame como buffer para FFmpeg
     * OPTIMIZADO: Ahora utiliza Skia-Canvas y Sharp
     */
    async generateFrameBuffer(pollData, config, time = 0) {
        await this.renderFrame(pollData, config, time);

        try {
            // Skia-canvas toBuffer('raw') returns RGBA
            const rgbaBuffer = await this.canvas.toBuffer('raw');

            // Use Sharp to convert RGBA to RGB24
            if (typeof window === 'undefined') {
                // Node.js environment
                const sharpModule = 'sharp';
                const sharp = (await import(sharpModule)).default;
                return await sharp(rgbaBuffer, {
                    raw: {
                        width: this.width,
                        height: this.height,
                        channels: 4
                    }
                })
                    .removeAlpha()
                    .toBuffer();
            } else {
                throw new Error('Sharp is only available in Node.js environment');
            }

        } catch (e) {
            console.error('[CanvasRenderer] Buffer conversion error:', e);
            // Fallback manual RGBA -> RGB
            const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
            const buffer = Buffer.allocUnsafe(this.width * this.height * 3);
            for (let i = 0, j = 0; i < imageData.data.length; i += 4, j += 3) {
                buffer[j] = imageData.data[i];
                buffer[j + 1] = imageData.data[i + 1];
                buffer[j + 2] = imageData.data[i + 2];
            }
            return buffer;
        }
    }
}

export const canvasRenderer = new CanvasRenderer();

