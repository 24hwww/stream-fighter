/**
 * 16-BIT ARCADE PROCEDURAL RENDERING ENGINE - "SKIA KINEMATICS EDITION"
 * Inspired by CPS-1 hardware (Street Fighter II).
 * Uses a skeletal segment system for articulated, pixelated humanoid sprites.
 * Internal Resolution: 256x224 (Upscaled without smoothing)
 */

const PALETTES = {
    STREET_BATTLE: {
        sky: ['#101040', '#202080', '#4040a0', '#6060c0'], // Step gradient
        floor: { base: '#333333', accent: '#444444' },     // Tiled floor
        p1: { // Red Master (White Gi)
            skin: { base: '#ffdbac', shadow: '#c49a6c', high: '#ffe9d1' },
            cloth: { base: '#ffffff', shadow: '#999999', high: '#f0f0f0' },
            belt: '#111111', accent: '#ff0000'
        },
        p2: { // Blue Striker (Blue Gi)
            skin: { base: '#ffdbac', shadow: '#c49a6c', high: '#ffe9d1' },
            cloth: { base: '#1a237e', shadow: '#0d1040', high: '#3949ab' },
            belt: '#111111', accent: '#3366ff'
        }
    }
};

class ProceduralRenderer {
    constructor(targetWidth = 1280, targetHeight = 720) {
        this.targetWidth = targetWidth;
        this.targetHeight = targetHeight;
        this.vWidth = 320; // Slightly wider for better action spacing
        this.vHeight = 224;

        this.mainCanvas = null;
        this.mainCtx = null;
        this.vCanvas = null;
        this.vCtx = null;
        this.palette = PALETTES.STREET_BATTLE;
    }

    /**
     * @param {Function} createCanvas - Injected canvas factory (from @napi-rs/canvas or skia-canvas)
     */
    initialize(createCanvas) {
        this.mainCanvas = createCanvas(this.targetWidth, this.targetHeight);
        this.mainCtx = this.mainCanvas.getContext('2d');
        this.mainCtx.imageSmoothingEnabled = false;

        this.vCanvas = createCanvas(this.vWidth, this.vHeight);
        this.vCtx = this.vCanvas.getContext('2d');
        this.vCtx.imageSmoothingEnabled = false;

        console.log(`[ProceduralRenderer] Kinematics Engine Ready (256x224 -> ${this.targetWidth}x${this.targetHeight})`);
    }

    render(state, timestamp) {
        if (!this.vCtx) return;

        const ctx = this.vCtx;
        const { vWidth, vHeight, palette } = this;

        // 1. Clear with 4-Band Step Sky
        const skyBands = palette.sky;
        const horizon = Math.floor(vHeight * 0.65);
        const bandH = Math.floor(horizon / skyBands.length);
        skyBands.forEach((color, i) => {
            ctx.fillStyle = color;
            ctx.fillRect(0, i * bandH, vWidth, bandH + 2);
        });

        // 2. Procedural Cityscape (Thousands of Windows)
        this.drawCityscape(ctx, vWidth, horizon, timestamp);

        // 3. Tiled Perspective Floor
        this.drawTiledFloor(ctx, vWidth, horizon, vHeight);

        // 3. Render Articulated Fighters
        if (state.fighters) {
            state.fighters.forEach((f, i) => {
                const fighterPalette = i === 0 ? palette.p1 : palette.p2;
                const vx = (f.x / 1280) * vWidth;
                const vy = (f.y / 720) * vHeight;
                this.drawKineFighter(ctx, vx, vy, f, i, timestamp, fighterPalette);
            });
        }

        // 4. Render HUD (Health Bars)
        this.renderHUD(ctx, vWidth, vHeight, state);

        // 4. Final Upscale (Nearest Neighbor)
        this.mainCtx.clearRect(0, 0, this.targetWidth, this.targetHeight);
        this.mainCtx.drawImage(
            this.vCanvas,
            0, 0, this.vWidth, this.vHeight,
            0, 0, this.targetWidth, this.targetHeight
        );
    }

    drawCityscape(ctx, w, horizon, time) {
        const buildingCount = 6;
        const bWidth = w / buildingCount;

        ctx.save();
        // Slow parallax scroll
        const scroll = (time * 0.002) % bWidth;
        ctx.translate(-scroll, 0);

        for (let i = -1; i <= buildingCount; i++) {
            const bx = i * bWidth;
            const bh = 70 + Math.sin(i * 2) * 20;
            const by = horizon - bh;

            // Building Shadow Side
            ctx.fillStyle = '#1a1a3a';
            ctx.fillRect(bx, by, bWidth, bh);

            // Building Front
            ctx.fillStyle = '#2a2a5a';
            ctx.fillRect(bx + 4, by + 4, bWidth - 8, bh);

            // Windows (Demonstrating Skia's shape performance)
            const rows = 12;
            const cols = 6;
            const winW = (bWidth - 16) / cols;
            const winH = (bh - 16) / rows;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    // Random light on/off effect
                    const flicker = (Math.sin(time * 0.001 + i + r + c) > 0.8);
                    ctx.fillStyle = flicker ? '#ffffaa' : '#112244';

                    const wx = bx + 8 + c * winW + 1;
                    const wy = by + 8 + r * winH + 1;
                    ctx.fillRect(wx, wy, winW - 2, winH - 2);
                }
            }
        }
        ctx.restore();
    }

    drawTiledFloor(ctx, w, horizon, h) {
        const floorH = h - horizon;
        const rows = 12;
        ctx.fillStyle = this.palette.floor.base;
        ctx.fillRect(0, horizon, w, floorH);

        for (let i = 0; i < rows; i++) {
            const y = horizon + Math.pow(i / rows, 2) * floorH;
            const yNext = horizon + Math.pow((i + 1) / rows, 2) * floorH;
            const rH = yNext - y;

            ctx.fillStyle = (i % 2 === 0) ? this.palette.floor.accent : this.palette.floor.base;
            ctx.fillRect(0, y, w, rH + 1);

            // Perspective tile lines - BATCHED for Skia performance
            ctx.strokeStyle = '#00000033';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let j = -10; j <= 10; j++) {
                const xTop = (w / 2) + (j * (i + 1) * 6);
                const xBottom = (w / 2) + (j * (i + 2) * 6);
                ctx.moveTo(xTop, y);
                ctx.lineTo(xBottom, yNext);
            }
            ctx.stroke();
        }
    }

    /**
     * DRAW SEGMENT: Connected muscle/limb block
     */
    drawSegment(ctx, p1, p2, t1, t2, shades) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const angle = Math.atan2(dy, dx);
        const perp = angle + Math.PI / 2;

        const p1L = { x: p1.x + Math.cos(perp) * t1, y: p1.y + Math.sin(perp) * t1 };
        const p1R = { x: p1.x - Math.cos(perp) * t1, y: p1.y - Math.sin(perp) * t1 };
        const p2L = { x: p2.x + Math.cos(perp) * t2, y: p2.y + Math.sin(perp) * t2 };
        const p2R = { x: p2.x - Math.cos(perp) * t2, y: p2.y - Math.sin(perp) * t2 };

        // Draw Base
        ctx.fillStyle = shades.base;
        ctx.beginPath();
        ctx.moveTo(p1L.x, p1L.y); ctx.lineTo(p1R.x, p1R.y);
        ctx.lineTo(p2R.x, p2R.y); ctx.lineTo(p2L.x, p2L.y);
        ctx.closePath();
        ctx.fill();

        // Draw Shadows (Half-cut logic)
        ctx.save();
        ctx.clip();
        ctx.fillStyle = shades.shadow;
        // Shifted shadow rect to cover the "dark" side
        ctx.fillRect(p1.x + (p2.x > p1.x ? -20 : 0), p1.y - 100, 20, 200);
        ctx.restore();

        // Draw Highlights
        ctx.fillStyle = shades.high;
        ctx.fillRect(p1.x - 1, p1.y - 1, 2, 2);

        // 1px Outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    drawKineFighter(ctx, x, y, f, index, time, pal) {
        const t = time * 0.005;
        let bounce = Math.sin(t * 2 + index) * 1.5;

        // Damage Shake Logic
        const isHit = (time - (f.lastHit || 0)) < 200;
        if (isHit) {
            x += (Math.random() - 0.5) * 5;
            bounce += (Math.random() - 0.5) * 3;
        }

        ctx.save();
        ctx.translate(Math.round(x), Math.round(y + bounce));
        if (f.flip) ctx.scale(-1, 1);

        // --- SKELETON DEFINITION (Dynamic based on ACTION) ---
        const action = f.action || 'idle';

        let hip = { x: 0, y: -25 };
        let shoulder = { x: 5, y: -50 };
        let bKnee = { x: -12, y: -10 }, bAnkle = { x: -18, y: 0 };
        let fKnee = { x: 12, y: -10 }, fAnkle = { x: 18, y: 0 };
        let bElbow = { x: -10, y: -45 }, bWrist = { x: 0, y: -50 };
        let fElbow = { x: 10, y: -40 }, fWrist = { x: 15, y: -50 };

        if (action === 'punch') {
            fWrist = { x: 35, y: -52 };
            fElbow = { x: 20, y: -50 };
            shoulder.x += 5;
        } else if (action === 'kick') {
            fAnkle = { x: 35, y: -30 };
            fKnee = { x: 25, y: -35 };
            hip.x -= 5;
            bounce -= 5;
        } else if (action === 'special') {
            fWrist = { x: 25, y: -45 };
            bWrist = { x: 25, y: -55 };
            // Draw "HADOUKEN" light
            ctx.fillStyle = 'rgba(100,200,255,0.6)';
            ctx.beginPath();
            ctx.arc(35, -50, 10 + Math.sin(t * 10) * 3, 0, Math.PI * 2);
            ctx.fill();
        }

        if (isHit) {
            // "Hit Stun" pose
            shoulder.x -= 8;
            fWrist.y -= 10;
            bWrist.y -= 10;
        }

        // 1. BACK LIMBS
        this.drawSegment(ctx, hip, bKnee, 5, 4, pal.cloth);
        this.drawSegment(ctx, bKnee, bAnkle, 4, 3, pal.cloth);
        this.drawSegment(ctx, shoulder, bElbow, 4, 3, pal.skin);
        this.drawSegment(ctx, bElbow, bWrist, 3, 4, pal.skin);

        // 2. TORSO (V-Taper)
        ctx.beginPath();
        ctx.moveTo(shoulder.x - 12, shoulder.y - 4);
        ctx.lineTo(shoulder.x + 15, shoulder.y + 4);
        ctx.lineTo(hip.x + 8, hip.y + 5);
        ctx.lineTo(hip.x - 6, hip.y + 3);
        ctx.closePath();

        ctx.fillStyle = isHit ? '#ff0000' : pal.cloth.base;
        ctx.fill();

        ctx.save();
        ctx.clip();
        ctx.fillStyle = pal.cloth.shadow; ctx.fillRect(shoulder.x - 2, shoulder.y - 20, 20, 100);
        ctx.restore();
        ctx.strokeStyle = '#000'; ctx.stroke();

        // Belt
        ctx.fillStyle = pal.belt;
        ctx.fillRect(hip.x - 8, hip.y, 18, 4);
        ctx.strokeRect(hip.x - 8, hip.y, 18, 4);

        // 3. FRONT LIMBS
        this.drawSegment(ctx, hip, fKnee, 5, 4, pal.cloth);
        this.drawSegment(ctx, fKnee, fAnkle, 4, 3, pal.cloth);
        this.drawSegment(ctx, shoulder, fElbow, 4, 3, pal.skin);
        this.drawSegment(ctx, fElbow, fWrist, 3, 4, pal.skin);

        // 4. HEAD
        const headX = shoulder.x - 2;
        const headY = shoulder.y - 18;
        ctx.fillStyle = pal.skin.base;
        ctx.fillRect(headX, headY, 12, 14);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(headX, headY, 12, 14);
        // Headband
        ctx.fillStyle = pal.accent;
        ctx.fillRect(headX - 2, headY + 4, 16, 3);

        ctx.restore();
    }

    renderHUD(ctx, w, h, state) {
        const barW = 100;
        const barH = 10;
        const barY = 15;

        // P1 Health
        const hp1 = state.fighters[0].hp;
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(10, barY, barW, barH);
        ctx.fillStyle = hp1 > 0.3 ? '#00ff00' : '#ff0000';
        ctx.fillRect(10, barY, barW * hp1, barH);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(10, barY, barW, barH);

        // P2 Health
        const hp2 = state.fighters[1].hp;
        const p2X = w - barW - 10;
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(p2X, barY, barW, barH);
        ctx.fillStyle = hp2 > 0.3 ? '#00ff00' : '#ff0000';
        // Fills from right
        ctx.fillRect(p2X + barW * (1 - hp2), barY, barW * hp2, barH);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(p2X, barY, barW, barH);
    }

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
            // This is extremely fast and reduces data sent to FFmpeg
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
                    .removeAlpha() // Drop A channel -> RGB
                    .toBuffer();
            } else {
                throw new Error('Sharp is only available in Node.js environment');
            }

        } catch (e) {
            console.error('[ProceduralRenderer] Buffer error:', e);
            // Fallback: Manual RGBA to RGB conversion if sharp fails
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

export { ProceduralRenderer, PALETTES };
