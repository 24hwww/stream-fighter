/**
 * 16-BIT ARCADE RENDERER - "CLASSIC FIGHTER EDITION"
 * Inspired by CPS-1/CPS-2 hardware (Street Fighter II style)
 * Uses sprite-based rendering with parallax backgrounds
 * Internal Resolution: 384x224 (Classic arcade resolution, upscaled)
 */

class ArcadeRenderer {
    constructor(targetWidth = 1280, targetHeight = 720) {
        this.targetWidth = targetWidth;
        this.targetHeight = targetHeight;
        // Classic arcade resolution (slightly wider for widescreen)
        this.vWidth = 320;
        this.vHeight = 224;

        this.mainCanvas = null;
        this.mainCtx = null;
        this.vCanvas = null;
        this.vCtx = null;

        // Sprite assets
        this.sprites = {
            bgFar: null,
            bgMid: null,
            bgFloor: null,
            fighterRed: null,
            fighterBlue: null,
            uiHud: null
        };

        this.imagesLoaded = false;
        this.scrollOffset = 0;
    }

    /**
     * Initialize with canvas factory
     */
    initialize(createCanvas) {
        this.mainCanvas = createCanvas(this.targetWidth, this.targetHeight);
        this.mainCtx = this.mainCanvas.getContext('2d');
        this.mainCtx.imageSmoothingEnabled = false;

        this.vCanvas = createCanvas(this.vWidth, this.vHeight);
        this.vCtx = this.vCanvas.getContext('2d');
        this.vCtx.imageSmoothingEnabled = false;

        console.log(`[ArcadeRenderer] Classic Fighter Engine Ready (${this.vWidth}x${this.vHeight} -> ${this.targetWidth}x${this.targetHeight})`);
    }

    /**
     * Load sprite images (browser environment)
     */
    async loadImages() {
        if (this.imagesLoaded) return;

        const loadImage = (src) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => {
                    console.warn(`[ArcadeRenderer] Failed to load: ${src}`);
                    resolve(null);
                };
                img.src = src;
            });
        };

        try {
            const [bgFar, bgMid, bgFloor, fighterRed, fighterBlue, uiHud] = await Promise.all([
                loadImage('/arcade/bg_far.png'),
                loadImage('/arcade/bg_mid.png'),
                loadImage('/arcade/bg_floor.png'),
                loadImage('/arcade/fighter_red.png'),
                loadImage('/arcade/fighter_blue.png'),
                loadImage('/arcade/ui_hud.png')
            ]);

            this.sprites.bgFar = bgFar;
            this.sprites.bgMid = bgMid;
            this.sprites.bgFloor = bgFloor;
            this.sprites.fighterRed = fighterRed;
            this.sprites.fighterBlue = fighterBlue;
            this.sprites.uiHud = uiHud;

            this.imagesLoaded = true;
            console.log('[ArcadeRenderer] Sprites loaded successfully');
        } catch (e) {
            console.error('[ArcadeRenderer] Error loading sprites:', e);
        }
    }

    /**
     * Main render function
     */
    render(state, timestamp) {
        if (!this.vCtx) return;

        const ctx = this.vCtx;
        const { vWidth, vHeight } = this;

        // Update scroll for parallax
        this.scrollOffset = (timestamp * 0.01) % vWidth;

        // Clear with black base
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, vWidth, vHeight);

        // 1. Render Background Layers (Parallax)
        this.renderBackground(ctx, vWidth, vHeight, timestamp);

        // 2. Render Floor
        this.renderFloor(ctx, vWidth, vHeight, timestamp);

        // 3. Render Fighters
        if (state.fighters) {
            this.renderFighters(ctx, state.fighters, timestamp);
        }

        // 4. Render HUD (Health bars, score, round)
        this.renderHUD(ctx, vWidth, vHeight, state, timestamp);

        // 5. Final Upscale (Nearest Neighbor for pixel-perfect)
        this.mainCtx.clearRect(0, 0, this.targetWidth, this.targetHeight);
        this.mainCtx.drawImage(
            this.vCanvas,
            0, 0, this.vWidth, this.vHeight,
            0, 0, this.targetWidth, this.targetHeight
        );
    }

    /**
     * Render parallax background layers
     */
    renderBackground(ctx, w, h, time) {
        const horizon = Math.floor(h * 0.65);

        // Sky gradient (4-band like classic arcade)
        const skyColors = ['#0a0a20', '#151540', '#202060', '#303080'];
        const bandH = Math.floor(horizon / skyColors.length);
        skyColors.forEach((color, i) => {
            ctx.fillStyle = color;
            ctx.fillRect(0, i * bandH, w, bandH + 2); // Overlap to avoid gaps
        });

        // Distant Mountain Silhouette (Mount Fuji style)
        ctx.fillStyle = '#050510';
        ctx.beginPath();
        ctx.moveTo(w * 0.1, horizon);
        ctx.lineTo(w * 0.3, horizon - 80);
        ctx.lineTo(w * 0.4, horizon - 75);
        ctx.lineTo(w * 0.5, horizon - 110); // Peak
        ctx.lineTo(w * 0.6, horizon - 75);
        ctx.lineTo(w * 0.8, horizon - 90);
        ctx.lineTo(w * 0.9, horizon);
        ctx.fill();

        // Moon
        ctx.fillStyle = '#fdfbd3';
        ctx.beginPath();
        ctx.arc(w * 0.8, 40, 12, 0, Math.PI * 2);
        ctx.fill();
        // Moon glow
        ctx.fillStyle = 'rgba(253, 251, 211, 0.1)';
        ctx.beginPath();
        ctx.arc(w * 0.8, 40, 20, 0, Math.PI * 2);
        ctx.fill();

        // Far background (slowest parallax)
        if (this.sprites.bgFar) {
            const farScroll = (time * 0.005) % w;
            this.drawTiledSprite(ctx, this.sprites.bgFar, -farScroll, 20, w, horizon - 20);
        } else {
            // Procedural far background (temple/building silhouette)
            this.drawProceduralTemple(ctx, w, horizon, time);
        }

        // Mid background (medium parallax - trees/palms)
        if (this.sprites.bgMid) {
            const midScroll = (time * 0.01) % w;
            this.drawTiledSprite(ctx, this.sprites.bgMid, -midScroll, 40, w, horizon - 20);
        } else {
            // Procedural palm trees
            this.drawProceduralPalms(ctx, w, horizon, time);
        }
    }

    /**
     * Draw tiled sprite with scroll
     */
    drawTiledSprite(ctx, sprite, offsetX, y, w, h) {
        if (!sprite) return;
        const sw = sprite.width;
        const sh = sprite.height;

        // Scale to fit height
        const scale = h / sh;
        const scaledW = sw * scale;

        // Draw tiled
        let x = offsetX % scaledW;
        if (x > 0) x -= scaledW;

        while (x < w) {
            ctx.drawImage(sprite, x, y, scaledW, h);
            x += scaledW;
        }
    }

    /**
     * Render floor with perspective tiles
     */
    renderFloor(ctx, w, h, time) {
        const horizon = Math.floor(h * 0.65);
        const floorH = h - horizon;

        if (this.sprites.bgFloor) {
            // Use sprite for floor
            ctx.drawImage(this.sprites.bgFloor, 0, horizon, w, floorH);
        } else {
            // Procedural perspective floor (stone tiles)
            this.drawProceduralFloor(ctx, w, horizon, floorH, time);
        }
    }

    /**
     * Procedural temple/building background (Darker / Premium)
     */
    drawProceduralTemple(ctx, w, horizon, time) {
        // Main temple structure (Silhouette style)
        ctx.fillStyle = '#1a1a2e';

        // Central gate
        const gateW = 80;
        const gateH = 65;
        const gateX = (w - gateW) / 2;
        const gateY = horizon - gateH - 10;

        // Side walls
        ctx.fillStyle = '#16213e';
        ctx.fillRect(gateX - 60, gateY + 15, 60, gateH - 15);
        ctx.fillRect(gateX + gateW, gateY + 15, 60, gateH - 15);

        // Central tower
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(gateX, gateY - 15, gateW, gateH + 15);

        // Gate arch (Darkest)
        ctx.fillStyle = '#0f3460';
        ctx.fillRect(gateX + 25, gateY + 20, 30, 45);

        // Pagoda style roofs
        ctx.fillStyle = '#0a0a1a';
        ctx.beginPath();
        ctx.moveTo(gateX - 10, gateY - 15);
        ctx.lineTo(gateX + gateW + 10, gateY - 15);
        ctx.lineTo(gateX + gateW / 2, gateY - 35);
        ctx.closePath();
        ctx.fill();

        // Side towers
        ctx.fillStyle = '#16213e';
        ctx.fillRect(20, horizon - 90, 40, 90);
        ctx.fillRect(w - 60, horizon - 90, 40, 90);

        // Window lights (subtle)
        ctx.fillStyle = '#e94560';
        if (Math.floor(time / 1000) % 2 === 0) {
            ctx.fillRect(gateX + 35, gateY - 5, 10, 5);
        }
    }

    /**
     * Procedural palm trees
     */
    drawProceduralPalms(ctx, w, horizon, time) {
        const palmPositions = [30, 100, w - 40, w - 110];

        palmPositions.forEach((px, i) => {
            const sway = Math.sin(time * 0.002 + i) * 2;

            // Trunk
            ctx.fillStyle = '#654321';
            ctx.fillRect(px - 4, horizon - 70, 8, 70);

            // Leaves
            ctx.fillStyle = '#228b22';
            for (let l = 0; l < 6; l++) {
                const angle = (l / 6) * Math.PI * 2 + sway * 0.1;
                const leafLen = 25;
                ctx.save();
                ctx.translate(px, horizon - 75);
                ctx.rotate(angle);
                ctx.fillRect(-3, 0, 6, leafLen);
                ctx.restore();
            }
        });
    }

    /**
     * Procedural stone floor with perspective
     */
    drawProceduralFloor(ctx, w, horizon, floorH, time) {
        // Base floor color
        ctx.fillStyle = '#444444';
        ctx.fillRect(0, horizon, w, floorH);

        // Perspective grid lines
        const rows = 8;
        for (let i = 0; i < rows; i++) {
            const y = horizon + Math.pow(i / rows, 1.5) * floorH;
            const yNext = horizon + Math.pow((i + 1) / rows, 1.5) * floorH;
            const rowH = yNext - y;

            // Alternate row colors
            ctx.fillStyle = (i % 2 === 0) ? '#3a3a3a' : '#2a2a2a';
            ctx.fillRect(0, y, w, rowH + 1);

            // Vertical perspective lines
            ctx.strokeStyle = '#5b4325';
            ctx.lineWidth = 1;
            const tilesPerRow = 8 + i * 2;
            for (let j = 0; j <= tilesPerRow; j++) {
                const xTop = w / 2 + (j - tilesPerRow / 2) * (w / tilesPerRow);
                const xBot = w / 2 + (j - tilesPerRow / 2) * (w / (tilesPerRow - 2));
                ctx.beginPath();
                ctx.moveTo(xTop, y);
                ctx.lineTo(xBot, yNext);
                ctx.stroke();
            }
        }
    }

    /**
     * Render fighters using sprites or procedural
     */
    renderFighters(ctx, fighters, time) {
        fighters.forEach((f, i) => {
            const sprite = i === 0 ? this.sprites.fighterRed : this.sprites.fighterBlue;
            // Convert from 1280x720 coords to virtual resolution
            const vx = (f.x / 1280) * this.vWidth;
            const vy = (f.y / 720) * this.vHeight;

            if (sprite) {
                this.drawSpriteFighter(ctx, sprite, vx, vy, f, i, time);
            } else {
                this.drawProceduralFighter(ctx, vx, vy, f, i, time);
            }
        });
    }

    /**
     * Draw fighter using sprite
     */
    drawSpriteFighter(ctx, sprite, x, y, f, index, time) {
        const bounce = Math.sin(time * 0.008 + index) * 2;
        // Scale down the sprites if they are huge (arcade sprites are usually 80-120px)
        const scale = 0.5; // Adjusted from 1.0 to look reasonable
        const sw = sprite.width * scale;
        const sh = sprite.height * scale;

        ctx.save();
        ctx.translate(x, y + bounce);

        if (f.flip) {
            ctx.scale(-1, 1);
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 5 - bounce, sw * 0.4, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fighter sprite
        ctx.drawImage(sprite, -sw / 2, -sh, sw, sh);

        // Damage flash effect
        if (f.hp < 0.3 && Math.floor(time / 100) % 2 === 0) {
            ctx.globalCompositeOperation = 'overlay';
            ctx.fillStyle = 'rgba(255,0,0,0.5)';
            ctx.fillRect(-sw / 2, -sh, sw, sh);
            ctx.globalCompositeOperation = 'source-over';
        }

        ctx.restore();
    }

    /**
     * Procedural fighter (fallback if no sprite)
     */
    drawProceduralFighter(ctx, x, y, f, index, time) {
        const bounce = Math.sin(time * 0.008 + index) * 2;
        const colors = index === 0
            ? { main: '#cc2200', accent: '#ff4400', skin: '#ffdbac' }
            : { main: '#0022aa', accent: '#0044ff', skin: '#ffdbac' };

        ctx.save();
        ctx.translate(Math.round(x), Math.round(y + bounce));
        if (f.flip) ctx.scale(-1, 1);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 5, 20, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.fillStyle = colors.main;
        ctx.fillRect(-12, -35, 8, 35);
        ctx.fillRect(4, -35, 8, 35);

        // Body
        ctx.fillStyle = colors.main;
        ctx.fillRect(-15, -70, 30, 40);

        // Belt
        ctx.fillStyle = '#111';
        ctx.fillRect(-15, -35, 30, 5);

        // Arms
        const armSwing = Math.sin(time * 0.01 + index) * 5;
        ctx.fillStyle = colors.skin;
        ctx.fillRect(-22, -65 + armSwing, 8, 25);
        ctx.fillRect(14, -65 - armSwing, 8, 25);

        // Head
        ctx.fillStyle = colors.skin;
        ctx.fillRect(-8, -85, 16, 16);

        // Headband
        ctx.fillStyle = colors.accent;
        ctx.fillRect(-10, -82, 20, 4);

        // 1px outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(-15, -70, 30, 40);
        ctx.strokeRect(-8, -85, 16, 16);

        ctx.restore();
    }

    /**
     * Render arcade-style HUD
     */
    renderHUD(ctx, w, h, state, time) {
        // Health bar background frame
        const barW = 140;
        const barH = 12;
        const barY = 18;

        // Calculate HP from state
        const hp1 = state.fighters?.[0]?.hp ?? 1;
        const hp2 = state.fighters?.[1]?.hp ?? 1;

        // === PLAYER 1 (Left) ===
        // Health bar border
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(10, barY - 2, barW + 4, barH + 4);
        ctx.fillStyle = '#000';
        ctx.fillRect(12, barY, barW, barH);

        // Health fill (green to yellow to red)
        const hp1Color = hp1 > 0.5 ? '#00ff00' : hp1 > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillStyle = hp1Color;
        ctx.fillRect(12, barY, barW * hp1, barH);

        // P1 Label
        ctx.fillStyle = '#fff';
        ctx.font = '8px monospace';
        ctx.fillText('1P', 12, barY - 4);

        // Score
        ctx.fillStyle = '#0f0';
        ctx.font = '6px monospace';
        ctx.fillText('SCORE', 12, barY + 22);
        ctx.fillStyle = '#fff';
        ctx.fillText('1000000', 12, barY + 30);

        // === PLAYER 2 (Right) ===
        const bar2X = w - barW - 14;

        // Health bar border
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(bar2X - 2, barY - 2, barW + 4, barH + 4);
        ctx.fillStyle = '#000';
        ctx.fillRect(bar2X, barY, barW, barH);

        // Health fill (fills from right to left)
        const hp2Color = hp2 > 0.5 ? '#00ff00' : hp2 > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillStyle = hp2Color;
        ctx.fillRect(bar2X + barW * (1 - hp2), barY, barW * hp2, barH);

        // P2 Label
        ctx.fillStyle = '#fff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('2P', w - 12, barY - 4);

        // Health text
        ctx.fillStyle = '#f60';
        ctx.font = '6px monospace';
        ctx.fillText('HEALTH', w - 12, barY + 22);
        ctx.textAlign = 'left';

        // === ROUND INDICATOR (Center) ===
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ROUND 1', w / 2, h * 0.35);
        ctx.textAlign = 'left';

        // === TIMER (Center top) ===
        const timer = state.timer ?? 99;
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        // Stroke for readability
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(String(timer).padStart(2, '0'), w / 2, 24);
        ctx.fillText(String(timer).padStart(2, '0'), w / 2, 24);
        ctx.textAlign = 'left';

        // === SCORE DISPLAY (Bottom) ===
        // LED style numbers
        this.drawLEDNumber(ctx, w / 2 - 50, h - 20, '00', '#ff0000');
        this.drawLEDNumber(ctx, w / 2 + 30, h - 20, '00', '#ff0000');

        // VS indicator
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('VS', w / 2, h - 16);
        ctx.textAlign = 'left';
    }

    /**
     * Draw LED-style number display
     */
    drawLEDNumber(ctx, x, y, num, color) {
        ctx.fillStyle = '#200000';
        ctx.fillRect(x, y, 24, 14);
        ctx.fillStyle = color;
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(num, x + 12, y + 11);
        ctx.textAlign = 'left';
    }

    /**
     * Get frame buffer for FFmpeg (server-side)
     */
    /**
     * RAW BUFFER OUTPUT: Optimized with Sharp for FFmpeg
     * Converts to RGB to reduce pipe bandwidth by 25%
     */
    async getFrameBuffer() {
        if (!this.mainCanvas) return null;

        try {
            // Skia-canvas toBuffer('raw') returns RGBA [R,G,B,A, R,G,B,A...]
            const rgbaBuffer = await this.mainCanvas.toBuffer('raw');

            // Use Sharp to convert RGBA to RGB (dropping the alpha channel)
            if (process.env.NEXT_RUNTIME === 'nodejs' || typeof window === 'undefined') {
                const sharpModule = 'sharp';
                const sharp = (await import(sharpModule)).default;
                return await sharp(rgbaBuffer, {
                    raw: {
                        width: this.targetWidth,
                        height: this.targetHeight,
                        channels: 4
                    }
                })
                    .removeAlpha() // Drop A channel -> RGB24
                    .toBuffer();
            } else {
                throw new Error('Sharp is only available in Node.js environment');
            }

        } catch (e) {
            console.error('[ArcadeRenderer] Buffer error:', e);
            // Fallback: Manual RGBA to RGB conversion
            const imageData = this.mainCtx.getImageData(0, 0, this.targetWidth, this.targetHeight);
            const data = imageData.data;
            const buffer = Buffer.allocUnsafe(this.targetWidth * this.targetHeight * 3);

            for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
                buffer[j] = data[i];
                buffer[j + 1] = data[i + 1];
                buffer[j + 2] = data[i + 2];
            }
            return buffer;
        }
    }
}

export { ArcadeRenderer };
