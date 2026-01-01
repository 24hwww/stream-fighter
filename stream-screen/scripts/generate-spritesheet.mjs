import { Canvas } from 'skia-canvas';
import fs from 'fs';
import path from 'path';
import { Anatomy } from '../engine/characters/anatomy.js';
import { Poses } from '../engine/characters/poses.js';
import { PixelBuffer } from '../engine/renderer/pixelBuffer.js';
import { hexToRgb } from '../engine/sprites/palette.js';

// Configuration
const OUTPUT_DIR = path.resolve('./public/sprites');
const FRAME_WIDTH = 120; // Estimated max width
const FRAME_HEIGHT = 160; // Estimated max height
const COLS = 4; // Frames per row

async function generate() {
    console.log('🥊 Generating Spritesheet...');

    // Ensure output dir exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    let customTemplates = null;
    const generatedPath = path.resolve('engine/sprites/generated_character.js');
    if (fs.existsSync(generatedPath)) {
        console.log('🤖 Found Custom AI Character! Using it...');
        try {
            const module = await import('../engine/sprites/generated_character.js');
            customTemplates = module.AiGeneratedTemplates;
        } catch (e) {
            console.error('Failed to import generated character:', e);
        }
    }

    // Initialize Fighter (Red Team Brawler)
    // If customTemplates is present, Anatomy will use it.
    const fighter = Anatomy.createFighter('red', customTemplates);
    const animations = ['IDLE', 'PUNCH'];

    // Collect all frames
    const frames = [];

    for (const animName of animations) {
        const poseFrames = Poses[animName];
        if (!poseFrames) continue;

        poseFrames.forEach((poseFrame, index) => {
            frames.push({
                anim: animName,
                index: index,
                pose: poseFrame.parts,
                duration: poseFrame.duration
            });
        });
    }

    // Create Atlas Canvas
    const totalFrames = frames.length;
    const rows = Math.ceil(totalFrames / COLS);
    const canvasWidth = COLS * FRAME_WIDTH;
    const canvasHeight = rows * FRAME_HEIGHT;

    const canvas = new Canvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Disable smoothing for pixel art
    ctx.imageSmoothingEnabled = false;

    // Metadata for Phaser
    const spritesheetMeta = {
        frames: [],
        animations: {}
    };

    // Render Loop
    frames.forEach((frame, i) => {
        // Create a temporary buffer for this frame
        const buffer = new PixelBuffer(FRAME_WIDTH, FRAME_HEIGHT);

        // Render parts to buffer
        // Note: Using similar logic to ArcadeEngine.drawFighter but centered in the frame
        const cx = FRAME_WIDTH / 2;
        const cy = FRAME_HEIGHT - 10; // Floor offset

        // Sort by Z
        const partKeys = Object.keys(fighter).filter(k => fighter[k]);
        const parts = partKeys.map(key => ({
            name: key,
            sprite: fighter[key],
            pose: frame.pose[key]
        })).filter(p => p.sprite && p.pose);

        parts.sort((a, b) => (a.sprite.z || 0) - (b.sprite.z || 0));

        // Blit to buffer
        parts.forEach(p => {
            const { sprite, pose } = p;
            const pivotX = sprite.pivot ? sprite.pivot.x : 0;
            const pivotY = sprite.pivot ? sprite.pivot.y : 0;

            // Calculate absolute position in the frame buffer
            // cx + pose.ox is the anchor point. 
            // We subtract pivotX to align the sprite's pivot to that anchor.
            const destX = cx + pose.ox - pivotX;
            const destY = cy + pose.oy - pivotY;

            buffer.blit(sprite, destX, destY, false);
        });

        // Convert Buffer to Canvas Draw
        const imgData = ctx.createImageData(FRAME_WIDTH, FRAME_HEIGHT);
        const data = imgData.data;

        for (let j = 0; j < buffer.data.length; j++) {
            const hex = buffer.data[j];
            const [r, g, b, a = 255] = hexToRgb(hex);
            const pIdx = j * 4;
            data[pIdx] = r;
            data[pIdx + 1] = g;
            data[pIdx + 2] = b;
            data[pIdx + 3] = hex === -1 ? 0 : a;
        }

        // Put frame onto Atlas
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const tx = col * FRAME_WIDTH;
        const ty = row * FRAME_HEIGHT;

        // Draw temp buffer to main canvas
        // Skia-canvas putImageData acts on the context directly
        // But we need to place it at tx, ty. 
        // putImageData(imgData, dx, dy) works.
        ctx.putImageData(imgData, tx, ty);

        // Record Metadata
        const frameName = `${frame.anim}_${frame.index}`;
        spritesheetMeta.frames.push({
            filename: frameName,
            frame: { x: tx, y: ty, w: FRAME_WIDTH, h: FRAME_HEIGHT },
            rotated: false,
            trimmed: false,
            spriteSourceSize: { x: 0, y: 0, w: FRAME_WIDTH, h: FRAME_HEIGHT },
            sourceSize: { w: FRAME_WIDTH, h: FRAME_HEIGHT },
            duration: frame.duration
        });

        // Group Animations
        if (!spritesheetMeta.animations[frame.anim]) {
            spritesheetMeta.animations[frame.anim] = [];
        }
        spritesheetMeta.animations[frame.anim].push(frameName);
    });

    // Save PNG
    const pngBuffer = await canvas.toBuffer('png');
    fs.writeFileSync(path.join(OUTPUT_DIR, 'fighter_spritesheet.png'), pngBuffer);
    console.log(`✅ Saved ${path.join(OUTPUT_DIR, 'fighter_spritesheet.png')}`);

    // Save JSON
    fs.writeFileSync(path.join(OUTPUT_DIR, 'fighter_spritesheet.json'), JSON.stringify(spritesheetMeta, null, 2));
    console.log(`✅ Saved ${path.join(OUTPUT_DIR, 'fighter_spritesheet.json')}`);
}

generate().catch(console.error);
