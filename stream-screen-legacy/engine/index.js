import { PixelBuffer } from './renderer/pixelBuffer.js';
import { DesertStage } from './stages/desertStage.js';
import { Anatomy } from './characters/anatomy.js';
import { AnimationController } from './characters/animations.js';
import { HUD } from './ui/hud.js';
import { GameState } from './core/state.js';
import { ShapeRenderer } from './renderer/shapeRenderer.js';

// Environment-agnostic Canvas helper
const createCanvas = (w, h) => {
    if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        return canvas;
    } else if (typeof global !== 'undefined' && global.Canvas) {
        // Node environment with global Canvas (passed from service)
        return new global.Canvas(w, h);
    } else {
        console.warn("Canvas implementation not found. Pre-rasterization skipped.");
        return null;
    }
};

/**
 * ArcadeEngine
 * The central coordinator for the SF-style engine.
 */
export class ArcadeEngine {
    constructor(vWidth = 320, vHeight = 180) {
        this.vWidth = vWidth;
        this.vHeight = vHeight;
        this.buffer = new PixelBuffer(vWidth, vHeight);
        this.state = new GameState();
        this.stage = new DesertStage(vWidth, vHeight);
        this.hud = new HUD(vWidth, vHeight);

        // Fighters
        this.p1 = {
            anatomy: Anatomy.createFighter('red'),
            anim: new AnimationController(),
            x: 70, y: vHeight - 95,
            hp: 1.0
        };
        this.p2 = {
            anatomy: Anatomy.createFighter('blue'),
            anim: new AnimationController(),
            x: vWidth - 70, y: vHeight - 95,
            hp: 1.0,
            flip: true
        };
    }

    /**
     * Updates the engine with new AI designs
     */
    updateDesigns(designs) {
        if (!designs) {
            this.p1.aiDesign = null;
            this.p2.aiDesign = null;
            this.p1.aiSprites = null;
            this.p2.aiSprites = null;
            return;
        }

        // Pre-rasterize AI designs for both players
        this.p1.aiDesign = designs.fighterA;
        this.p2.aiDesign = designs.fighterB;
        this.p1.aiSprites = this.rasterizeAIDesign(designs.fighterA);
        this.p2.aiSprites = this.rasterizeAIDesign(designs.fighterB);

        if (designs.stage) {
            this.stage.skyColor = this.stage.parseColor(designs.stage.skyColor);
            this.stage.sandLight = this.stage.parseColor(designs.stage.groundLight);
            this.stage.sandDark = this.stage.parseColor(designs.stage.groundDark);
        }
    }

    rasterizeAIDesign(design) {
        if (!design) return null;

        const sprites = {};
        const anims = design.animation_definitions || design.animations;
        const body = design.body_structure || design.body;
        const colors = design.color_system || design.palette;
        const size = design.metadata?.base_sprite_size || 128;

        Object.keys(anims).forEach(animKey => {
            sprites[animKey] = anims[animKey].map((frame, frameIdx) => {
                // Instead of a canvas, we'll create a PixelBuffer
                const buffer = new PixelBuffer(size, size);

                // Sort parts by Z
                const parts = Object.entries(body).map(([name, data]) => ({
                    name,
                    ...data,
                    transform: frame.parts?.[name] || { x: 0, y: 0, rotation: 0, scale: 1 }
                }));
                parts.sort((a, b) => (a.z_order || a.z || 0) - (b.z_order || b.z || 0));

                const charX = size / 2;
                const charY = size - (size * 0.1);

                // Use ShapeRenderer or similar logic to draw to buffer
                // For simplicity here, we'll just store the composite design 
                // and let the renderer handle it if it can.
                // ACTUAL IMPLEMENTATION: 
                // Use environmental canvas helper
                const canvas = createCanvas(size, size);
                if (!canvas) return buffer;

                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;

                parts.forEach(part => {
                    ctx.save();
                    ctx.translate(charX + (part.transform.x || 0), charY + (part.transform.y || 0));
                    ctx.rotate((part.transform.rotation || 0) * Math.PI / 180);
                    const s = part.transform.scale || 1;
                    ctx.scale(s, s);

                    (part.shapes || []).forEach(shape => {
                        ctx.fillStyle = ShapeRenderer.getColor(shape.color, colors.palette);
                        ctx.strokeStyle = colors.outline_color || '#000000';
                        ctx.lineWidth = shape.outline_width || 0;

                        if (shape.type === 'polygon' && shape.points) {
                            ctx.beginPath();
                            shape.points.forEach((p, i) => i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]));
                            ctx.closePath();
                            ctx.fill();
                            if (ctx.lineWidth > 0) ctx.stroke();
                        } else if (shape.type === 'rect') {
                            ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
                        } else if (shape.type === 'circle') {
                            ctx.beginPath();
                            ctx.arc(shape.cx || 0, shape.cy || 0, shape.r || 10, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    });
                    ctx.restore();
                });

                // Copy canvas to PixelBuffer
                const imgData = ctx.getImageData(0, 0, size, size);
                for (let i = 0; i < imgData.data.length; i += 4) {
                    const r = imgData.data[i];
                    const g = imgData.data[i + 1];
                    const b = imgData.data[i + 2];
                    const a = imgData.data[i + 3];
                    if (a > 128) {
                        buffer.data[i / 4] = (r << 16) | (g << 8) | b;
                    } else {
                        buffer.data[i / 4] = -1;
                    }
                }

                return buffer;
            });
        });

        return sprites;
    }

    update(dt) {
        this.state.update(dt);

        // Pass AI animation frames if they exist so the controller knows the loop length
        const p1Anims = (this.p1.aiSprites && this.p1.aiDesign) ?
            (this.p1.aiDesign.animation_definitions || this.p1.aiDesign.animations)[this.p1.anim.currentState] : null;
        const p2Anims = (this.p2.aiSprites && this.p2.aiDesign) ?
            (this.p2.aiDesign.animation_definitions || this.p2.aiDesign.animations)[this.p2.anim.currentState] : null;

        this.p1.anim.update(dt, p1Anims);
        this.p2.anim.update(dt, p2Anims);
    }

    render(time) {
        this.buffer.clear();

        // 1. Stage
        this.stage.render(this.buffer, time);

        // 2. Fighters
        this.drawFighter(this.p1);
        this.drawFighter(this.p2);

        // 3. HUD
        this.hud.render(this.buffer, this.p1.hp, this.p2.hp, this.state.timer);

        return this.buffer;
    }

    drawFighter(f) {
        // If AI sprites are available, use them instead of modular anatomy
        if (f.aiSprites) {
            const state = f.anim.currentState.toUpperCase();
            const anim = f.aiSprites[state] || f.aiSprites['IDLE'] || Object.values(f.aiSprites)[0];
            const frameIdx = f.anim.currentFrameIdx % anim.length;
            const sprite = anim[frameIdx];

            if (sprite) {
                // Align AI sprite to floor anchor
                const destX = f.x - (sprite.width / 2);
                const destY = f.y - (sprite.height - (sprite.height * 0.1));
                this.buffer.blit(sprite, destX, destY, f.flip);
            }
            return;
        }

        const pose = f.anim.getCurrentPose();

        // 1. Collect and Sort Parts by Z-Index
        const parts = Object.keys(f.anatomy).map(key => ({
            name: key,
            sprite: f.anatomy[key],
            pose: pose[key]
        })).filter(p => p.sprite && p.pose);

        // Sort by Z (lower Z first)
        parts.sort((a, b) => (a.sprite.z || 0) - (b.sprite.z || 0));

        // 2. Render Composite
        for (const p of parts) {
            const { sprite, pose } = p;

            // Calculate Logic Position (Pivot-centric)
            // CharX is the floor anchor. Pose Offset is relative to that.
            // We subtract pivot to align the sprite's anchor to that point.

            let destX;
            if (f.flip) {
                // Flipped: World Offset inverted, Pivot becomes (Width - PivotX)
                const flippedPivotX = sprite.width - (sprite.pivot ? sprite.pivot.x : 0);
                destX = f.x - pose.ox - flippedPivotX;
            } else {
                // Normal: World Offset + Pivot offset
                const pivotX = sprite.pivot ? sprite.pivot.x : 0;
                destX = f.x + pose.ox - pivotX;
            }

            const pivotY = sprite.pivot ? sprite.pivot.y : 0;
            const destY = f.y + pose.oy - pivotY;

            this.buffer.blit(sprite, destX, destY, f.flip);
        }
    }
}
