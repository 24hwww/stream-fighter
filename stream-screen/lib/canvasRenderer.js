import { createCanvas, loadImage } from '@napi-rs/canvas';
import QRCode from 'qrcode';
import { loadImageFromPath } from './imageLoader.js';

/**
 * Canvas Renderer Service
 * Reemplaza Chromium con renderizado directo a Canvas para mejor rendimiento
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
        this.canvas = createCanvas(this.width, this.height);
        this.ctx = this.canvas.getContext('2d');

        // Configurar calidad de renderizado
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        console.log('[CanvasRenderer] Initialized');
    }

    /**
     * Renderiza un frame del overlay
     */
    async renderFrame(pollData, config = {}) {
        if (!this.ctx) await this.initialize();

        const ctx = this.ctx;
        const { width, height } = this.canvas;

        // Limpiar canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        // Renderizar fondo con gradientes
        this.renderBackground(ctx, width, height, config);

        // Renderizar contenido principal
        if (pollData && pollData.current) {
            await this.renderPoll(ctx, width, height, pollData.current, config);
        }

        // Renderizar sidebar (QR, publicidad)
        await this.renderSidebar(ctx, width, height, config);

        // Renderizar footer (estadísticas)
        if (pollData) {
            this.renderFooter(ctx, width, height, pollData);
        }

        // Return nothing, the context is updated in place
        return;
    }

    /**
     * Renderiza el fondo con efectos de blur
     */
    renderBackground(ctx, width, height, config) {
        const primaryColorFrom = config.primaryColorFrom || 'purple';
        const primaryColorTo = config.primaryColorTo || 'orange';

        // Gradiente de fondo
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.1)');
        gradient.addColorStop(1, 'rgba(249, 115, 22, 0.1)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Círculos de blur (simulados con gradientes radiales)
        const circle1 = ctx.createRadialGradient(width * 0.2, height * 0.2, 0, width * 0.2, height * 0.2, width * 0.4);
        circle1.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
        circle1.addColorStop(1, 'rgba(139, 92, 246, 0)');
        ctx.fillStyle = circle1;
        ctx.fillRect(0, 0, width, height);

        const circle2 = ctx.createRadialGradient(width * 0.8, height * 0.8, 0, width * 0.8, height * 0.8, width * 0.4);
        circle2.addColorStop(0, 'rgba(249, 115, 22, 0.3)');
        circle2.addColorStop(1, 'rgba(249, 115, 22, 0)');
        ctx.fillStyle = circle2;
        ctx.fillRect(0, 0, width, height);
    }

    /**
     * Renderiza la sección de poll (versus)
     */
    async renderPoll(ctx, width, height, poll, config) {
        const mainAreaWidth = width - 320; // Dejar espacio para sidebar
        const mainAreaHeight = height - 200; // Dejar espacio para header y footer
        const startX = 0;
        const startY = 100; // Header height

        const title = config.title || 'EL GRAN VERSUS';

        // Renderizar título
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, mainAreaWidth / 2, 60);

        // Calcular porcentajes
        const votesA = poll.optionA?._count?.votes || 0;
        const votesB = poll.optionB?._count?.votes || 0;
        const totalVotes = votesA + votesB;
        const percentA = totalVotes > 0 ? Math.round((votesA / totalVotes) * 100) : 50;
        const percentB = totalVotes > 0 ? Math.round((votesB / totalVotes) * 100) : 50;

        const optionSize = 400;
        const spacing = 100;
        const centerX = mainAreaWidth / 2;
        const centerY = startY + mainAreaHeight / 2;

        // Opción A (izquierda)
        const optionAX = centerX - optionSize / 2 - spacing / 2;
        const optionAY = centerY - optionSize / 2;

        // Fondo de opción A
        ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
        ctx.fillRect(optionAX - 10, optionAY - 10, optionSize + 20, optionSize + 20);

        // Imagen de opción A
        try {
            const imgA = await loadImageFromPath(poll.optionA?.image, '/option_a.png');
            ctx.drawImage(imgA, optionAX, optionAY, optionSize, optionSize);
        } catch (e) {
            console.warn('[CanvasRenderer] Error loading image A:', e.message);
            // Si falla la imagen, usar color sólido
            ctx.fillStyle = '#8b5cf6';
            ctx.fillRect(optionAX, optionAY, optionSize, optionSize);
        }

        // Nombre de opción A
        ctx.fillStyle = '#a78bfa';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(poll.optionA?.name || 'Opción A', optionAX + optionSize / 2, optionAY + optionSize + 40);

        // Barra de votos A
        const barWidth = optionSize;
        const barHeight = 20;
        const barX = optionAX;
        const barY = optionAY + optionSize + 60;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = '#8b5cf6';
        ctx.fillRect(barX, barY, (barWidth * percentA) / 100, barHeight);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(`${percentA}%`, barX + barWidth / 2, barY - 10);

        // VS en el centro
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = 'bold 72px Arial';
        ctx.fillText('VS', centerX, centerY);

        // Opción B (derecha)
        const optionBX = centerX + optionSize / 2 + spacing / 2;
        const optionBY = centerY - optionSize / 2;

        // Fondo de opción B
        ctx.fillStyle = 'rgba(249, 115, 22, 0.3)';
        ctx.fillRect(optionBX - 10, optionBY - 10, optionSize + 20, optionSize + 20);

        // Imagen de opción B
        try {
            const imgB = await loadImageFromPath(poll.optionB?.image, '/option_b.png');
            ctx.drawImage(imgB, optionBX, optionBY, optionSize, optionSize);
        } catch (e) {
            console.warn('[CanvasRenderer] Error loading image B:', e.message);
            ctx.fillStyle = '#f97316';
            ctx.fillRect(optionBX, optionBY, optionSize, optionSize);
        }

        // Nombre de opción B
        ctx.fillStyle = '#fb923c';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(poll.optionB?.name || 'Opción B', optionBX + optionSize / 2, optionBY + optionSize + 40);

        // Barra de votos B
        const barBX = optionBX;
        const barBY = optionBY + optionSize + 60;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(barBX, barBY, barWidth, barHeight);

        ctx.fillStyle = '#f97316';
        ctx.fillRect(barBX, barBY, (barWidth * percentB) / 100, barHeight);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(`${percentB}%`, barBX + barWidth / 2, barBY - 10);
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
            // Generar URL de votación (usar IP de red si está disponible)
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

            // Cargar QR como imagen
            const qrImage = await loadImage(qrBuffer);
            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
        } catch (err) {
            console.error('[CanvasRenderer] Error generating QR:', err);
            // Fallback: fondo blanco
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
     * Retorna buffer en formato RGB24 (raw) para FFmpeg
     */
    async generateFrameBuffer(pollData, config) {
        await this.renderFrame(pollData, config);

        // Convertir a formato raw RGB24 para FFmpeg
        // @napi-rs/canvas no tiene toBuffer('raw'), necesitamos convertir manualmente
        const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        const buffer = Buffer.allocUnsafe(this.width * this.height * 3);

        // Convertir RGBA a RGB
        for (let i = 0; i < imageData.data.length; i += 4) {
            const pixelIndex = (i / 4) * 3;
            buffer[pixelIndex] = imageData.data[i];         // R
            buffer[pixelIndex + 1] = imageData.data[i + 1]; // G
            buffer[pixelIndex + 2] = imageData.data[i + 2]; // B
        }

        return buffer;
    }
}

export const canvasRenderer = new CanvasRenderer();

