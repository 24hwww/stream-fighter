/**
 * PIXI.JS PROCEDURAL FIGHTER RENDERER
 * Uses a scene graph for sophisticated, detailed animations and effects.
 * Supports both Browser and Node.js environments.
 */

class PixiRenderer {
    constructor(targetWidth = 1280, targetHeight = 720) {
        this.targetWidth = targetWidth;
        this.targetHeight = targetHeight;
        this.vWidth = 320;
        this.vHeight = 224;

        this.app = null;
        this.fighters = [];
        this.background = null;
        this.isInitialized = false;
    }

    /**
     * Initialize Pixi Application
     * @param {Boolean} isServer - Whether we are running on Node.js
     */
    async initialize(isServer = false) {
        if (this.isInitialized) return;

        let PIXI;
        if (isServer) {
            const dynamicImport = new Function('m', 'return import(m)');
            PIXI = await dynamicImport('pixi.js');
        } else {
            // Wrap in eval to hide from server-side bundlers that might try to follow this path
            PIXI = await eval('import("pixi.js")');
        }

        // In Pixi v8, initialization is async
        this.app = new PIXI.Application();
        await this.app.init({
            width: this.vWidth,
            height: this.vHeight,
            background: '#000',
            antialias: false,
            preference: isServer ? 'canvas' : 'webgl'
        });

        // Setup stage
        this.setupStage(PIXI);

        // Final upscale container (if needed) or we just use the app.canvas
        this.isInitialized = true;
        console.log(`[PixiRenderer] Initialized on ${isServer ? 'Server' : 'Client'}`);
    }

    setupStage(PIXI) {
        this.stage = this.app.stage;

        // 1. Create Background (Sky + Ground)
        this.background = new PIXI.Container();
        this.stage.addChild(this.background);

        const sky = new PIXI.Graphics()
            .rect(0, 0, this.vWidth, this.vHeight * 0.7)
            .fill({ color: 0x0a0a20 });
        this.background.addChild(sky);

        const ground = new PIXI.Graphics()
            .rect(0, this.vHeight * 0.7, this.vWidth, this.vHeight * 0.3)
            .fill({ color: 0x222222 });
        this.background.addChild(ground);

        // 2. Fighter Container
        this.fighterContainer = new PIXI.Container();
        this.stage.addChild(this.fighterContainer);

        // Initialize Fighters (Hidden until rendered)
        this.fighters = [
            this.createFighter(PIXI, 0xff3333),
            this.createFighter(PIXI, 0x3333ff)
        ];

        this.fighters.forEach(f => this.fighterContainer.addChild(f.container));
    }

    createFighter(PIXI, baseColor) {
        const container = new PIXI.Container();

        // Detailed Anatomical Groups
        const body = new PIXI.Container();
        const head = new PIXI.Container();
        const lLeg = new PIXI.Container();
        const rLeg = new PIXI.Container();
        const lArm = new PIXI.Container();
        const rArm = new PIXI.Container();

        container.addChild(lLeg, rLeg, body, head, lArm, rArm);

        // Graphics for each part
        const parts = {
            chest: new PIXI.Graphics(),
            hips: new PIXI.Graphics(),
            face: new PIXI.Graphics(),
            hair: new PIXI.Graphics(),
            lThigh: new PIXI.Graphics(),
            lShin: new PIXI.Graphics(),
            rThigh: new PIXI.Graphics(),
            rShin: new PIXI.Graphics(),
            lUpperArm: new PIXI.Graphics(),
            lForearm: new PIXI.Graphics(),
            rUpperArm: new PIXI.Graphics(),
            rForearm: new PIXI.Graphics()
        };

        // Hierarchical setup
        body.addChild(parts.chest, parts.hips);
        head.addChild(parts.face, parts.hair);
        lLeg.addChild(parts.lThigh);
        parts.lThigh.addChild(parts.lShin);
        rLeg.addChild(parts.rThigh);
        parts.rThigh.addChild(parts.rShin);
        lArm.addChild(parts.lUpperArm);
        parts.lUpperArm.addChild(parts.lForearm);
        rArm.addChild(parts.rUpperArm);
        parts.rUpperArm.addChild(parts.rForearm);

        this.drawFighterShapes(parts, baseColor);

        return { container, body, head, lLeg, rLeg, lArm, rArm, parts, color: baseColor };
    }

    drawFighterShapes(parts, color) {
        const skinColor = 0xffdbac;

        // 1. CHEST (V-Taper)
        parts.chest.poly([-12, 0, 12, 0, 15, -25, -15, -25])
            .fill({ color: color })
            .stroke({ color: 0x000, width: 1 });

        parts.hips.rect(-10, 0, 20, 8)
            .fill({ color: 0x111111 })
            .stroke({ color: 0x000, width: 1 });

        // 2. HEAD
        parts.face.rect(-5, -10, 10, 12)
            .fill({ color: skinColor })
            .stroke({ color: 0x000, width: 1 });

        parts.hair.poly([-6, -10, 6, -10, 8, -14, 0, -16, -8, -14])
            .fill({ color: 0x000 });

        // 3. LEGS & ARMS
        const buildLimb = (g, len, w1, w2, limbColor) => {
            g.poly([-w1 / 2, 0, w1 / 2, 0, w2 / 2, len, -w2 / 2, len])
                .fill({ color: limbColor })
                .stroke({ color: 0x000, width: 1 });
        };

        buildLimb(parts.lThigh, 16, 10, 8, color);
        buildLimb(parts.lShin, 14, 8, 5, color);
        buildLimb(parts.rThigh, 16, 10, 8, color);
        buildLimb(parts.rShin, 14, 8, 5, color);

        buildLimb(parts.lUpperArm, 14, 7, 6, skinColor);
        buildLimb(parts.lForearm, 12, 6, 8, skinColor);
        buildLimb(parts.rUpperArm, 14, 7, 6, skinColor);
        buildLimb(parts.rForearm, 12, 6, 8, skinColor);
    }

    async render(state, timestamp) {
        if (!this.isInitialized) return;

        // Update background elements
        // ... (Parallax, etc.)

        // Update Fighters
        state.fighters.forEach((f, i) => {
            const fighter = this.fighters[i];
            const vx = (f.x / 1280) * this.vWidth;
            const vy = (f.y / 720) * this.vHeight;

            fighter.container.x = vx;
            fighter.container.y = vy;
            fighter.container.scale.x = f.flip ? -1 : 1;

            // Simple animation logic
            const bounce = Math.sin(timestamp * 0.01 + i) * 2;
            fighter.container.y += bounce;

            // Dynamic detail (update parts based on action)
            this.updateFighterDetail(fighter, f.action, timestamp);
        });

        // Current Pixi version auto-renders or we call app.render()
        // For server, we might need a sync render
    }

    updateFighterDetail(fighter, action, time) {
        const { body, head, lLeg, rLeg, lArm, rArm, parts } = fighter;
        const t = time * 0.005;

        // Reset default positions
        body.y = -25;
        head.y = -50;

        lLeg.position.set(-6, -20);
        rLeg.position.set(6, -20);
        lArm.position.set(-14, -50);
        rArm.position.set(14, -50);

        // Hierarchical Rotation (Idle)
        const breathe = Math.sin(t * 2);
        body.scale.set(1, 1 + breathe * 0.02);

        lArm.rotation = 0.5 + Math.sin(t) * 0.1;
        parts.lForearm.y = 14;
        parts.lForearm.rotation = -1.2;

        rArm.rotation = -0.5 - Math.sin(t) * 0.1;
        parts.rForearm.y = 14;
        parts.rForearm.rotation = 1.2;

        lLeg.rotation = 0.2;
        parts.lShin.y = 16;
        parts.lShin.rotation = -0.2;

        rLeg.rotation = -0.2;
        parts.rShin.y = 16;
        parts.rShin.rotation = 0.2;

        // Action Logic
        if (action === 'punch') {
            rArm.rotation = -1.4;
            parts.rForearm.rotation = 0.2;
            body.x = 5;
        } else if (action === 'kick') {
            rLeg.rotation = -1.5;
            parts.rShin.rotation = 0.5;
            body.y -= 5;
        } else if (action === 'special') {
            lArm.rotation = -1.2;
            rArm.rotation = -1.2;
            parts.lForearm.rotation = 0.5;
            parts.rForearm.rotation = 0.5;
        }
    }

    async getFrameBuffer() {
        if (!this.app || !this.app.canvas) return null;

        try {
            const canvas = this.app.canvas;

            // On Server (@pixi/node)
            if (typeof canvas.toBuffer === 'function') {
                const buffer = canvas.toBuffer('raw');

                // Use sharp to upscale if needed (v8 renderer is small)
                const dynamicImport = new Function('m', 'return import(m)');
                const sharp = (await dynamicImport('sharp')).default;

                return await sharp(buffer, {
                    raw: {
                        width: this.vWidth,
                        height: this.vHeight,
                        channels: 4
                    }
                })
                    .resize(this.targetWidth, this.targetHeight, { kernel: 'nearest' })
                    .removeAlpha() // RGB24 for FFmpeg
                    .toBuffer();
            }
        } catch (e) {
            console.error('[PixiRenderer] Buffer Error:', e);
        }
        return null;
    }
}

export { PixiRenderer };
