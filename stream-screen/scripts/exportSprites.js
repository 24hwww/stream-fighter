#!/usr/bin/env node

/**
 * Sprite Exporter for Stream Fighter
 * Generates pixel-perfect PNG sprites from code-defined character data
 * Compatible with Phaser, spritesmith, and Akios-Canvas
 */

import { Canvas } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import character definitions from ai.js (scaled down for 64x64 export)
import { DESIGNS as AI_DESIGNS } from '../lib/ai.js';

// Scale down designs from 128x128 to 64x64 for export
function scaleDesignForExport(originalDesign) {
    const scale = 64 / (originalDesign.metadata?.base_sprite_size || 128);

    const scaledDesign = {
        ...originalDesign,
        metadata: { ...originalDesign.metadata, base_sprite_size: 64 },
        body_structure: {}
    };

    // Scale all shape coordinates
    for (const [partName, partData] of Object.entries(originalDesign.body_structure)) {
        scaledDesign.body_structure[partName] = {
            ...partData,
            shapes: partData.shapes.map(shape => {
                const scaled = { ...shape };

                // Scale position and size properties
                if (scaled.cx !== undefined) scaled.cx *= scale;
                if (scaled.cy !== undefined) scaled.cy *= scale;
                if (scaled.x !== undefined) scaled.x *= scale;
                if (scaled.y !== undefined) scaled.y *= scale;
                if (scaled.w !== undefined) scaled.w *= scale;
                if (scaled.h !== undefined) scaled.h *= scale;
                if (scaled.r !== undefined) scaled.r *= scale;

                // Scale polygon points
                if (scaled.points) {
                    scaled.points = scaled.points.map(point => [
                        point[0] * scale,
                        point[1] * scale
                    ]);
                }

                return scaled;
            })
        };
    }

    // Animation definitions stay the same (relative transforms)
    scaledDesign.animation_definitions = originalDesign.animation_definitions;

    return scaledDesign;
}

// Prepare all 8 characters for export
const DESIGNS = AI_DESIGNS.map(({ type, design }) => ({
    type,
    design: scaleDesignForExport(design)
}));

class SpriteExporter {
    constructor(outputDir = './exported_sprites') {
        this.outputDir = outputDir;
        this.ensureOutputDir();
    }

    ensureOutputDir() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    getColor(colorKey, palette) {
        return palette[colorKey] || colorKey;
    }

    drawShape(ctx, shape, colors) {
        const color = this.getColor(shape.color, colors.palette);
        ctx.fillStyle = color;
        ctx.strokeStyle = colors.outline_color;
        ctx.lineWidth = 1;

        switch (shape.type) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2);
                ctx.fill();
                if (ctx.lineWidth > 0) ctx.stroke();
                break;

            case 'rect':
                ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
                if (ctx.lineWidth > 0) {
                    ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
                }
                break;

            case 'polygon':
                if (shape.points && shape.points.length > 0) {
                    ctx.beginPath();
                    ctx.moveTo(shape.points[0][0], shape.points[0][1]);
                    for (let i = 1; i < shape.points.length; i++) {
                        ctx.lineTo(shape.points[i][0], shape.points[i][1]);
                    }
                    ctx.closePath();
                    ctx.fill();
                    if (ctx.lineWidth > 0) ctx.stroke();
                }
                break;
        }
    }

    renderFrame(design, animationName, frameIndex) {
        const size = design.metadata.base_sprite_size;
        const canvas = new Canvas(size, size);
        const ctx = canvas.getContext('2d');

        // CRITICAL: Disable image smoothing for pixel-perfect rendering
        ctx.imageSmoothingEnabled = false;

        // Transparent background
        ctx.clearRect(0, 0, size, size);

        const anim = design.animation_definitions[animationName];
        if (!anim || !anim[frameIndex]) {
            console.warn(`Animation ${animationName} frame ${frameIndex} not found`);
            return null;
        }

        const frame = anim[frameIndex];
        const body = design.body_structure;
        const colors = design.color_system;

        // Character anchor point (center-bottom)
        const charX = size / 2;
        const charY = size - (size * 0.1);

        // Sort parts by z-order
        const parts = Object.entries(body).map(([name, data]) => ({
            name,
            ...data,
            transform: frame.parts?.[name] || { x: 0, y: 0, rotation: 0, scale: 1 }
        }));
        parts.sort((a, b) => (a.z_order || 0) - (b.z_order || 0));

        // Render each part
        parts.forEach(part => {
            ctx.save();
            ctx.translate(
                charX + (part.transform.x || 0),
                charY + (part.transform.y || 0)
            );
            ctx.rotate((part.transform.rotation || 0) * Math.PI / 180);
            const s = part.transform.scale || 1;
            ctx.scale(s, s);

            (part.shapes || []).forEach(shape => {
                this.drawShape(ctx, shape, colors);
            });

            ctx.restore();
        });

        return canvas;
    }

    async exportCharacter(characterData) {
        const { type, design } = characterData;
        const charDir = path.join(this.outputDir, type.toLowerCase());

        if (!fs.existsSync(charDir)) {
            fs.mkdirSync(charDir, { recursive: true });
        }

        const metadata = {
            character: type,
            size: design.metadata.base_sprite_size,
            frames: {},
            palette: design.color_system.palette
        };

        console.log(`\n🎨 Exporting ${type}...`);

        for (const [animName, frames] of Object.entries(design.animation_definitions)) {
            metadata.frames[animName] = [];

            for (let i = 0; i < frames.length; i++) {
                const canvas = this.renderFrame(design, animName, i);
                if (!canvas) continue;

                const filename = `${type.toLowerCase()}_${animName.toLowerCase()}_${i}.png`;
                const filepath = path.join(charDir, filename);

                // Export as PNG with alpha channel
                const buffer = await canvas.encode('png');
                fs.writeFileSync(filepath, buffer);

                metadata.frames[animName].push({
                    file: filename,
                    index: i,
                    size: design.metadata.base_sprite_size
                });

                console.log(`  ✓ ${filename}`);
            }
        }

        // Save metadata JSON
        const metadataPath = path.join(charDir, `${type.toLowerCase()}_metadata.json`);
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        console.log(`  ✓ ${type.toLowerCase()}_metadata.json`);

        return metadata;
    }

    async exportAll() {
        console.log('🚀 Stream Fighter Sprite Exporter');
        console.log('================================\n');
        console.log(`Output directory: ${path.resolve(this.outputDir)}\n`);

        const allMetadata = [];

        for (const character of DESIGNS) {
            const metadata = await this.exportCharacter(character);
            allMetadata.push(metadata);
        }

        // Create master metadata file
        const masterMetadata = {
            exported_at: new Date().toISOString(),
            characters: allMetadata,
            pipeline_config: {
                phaser: {
                    pixelArt: true,
                    imageSmoothingEnabled: false
                },
                canvas: {
                    imageSmoothingEnabled: false
                },
                scaling: 'nearest-neighbor'
            }
        };

        const masterPath = path.join(this.outputDir, 'sprites_metadata.json');
        fs.writeFileSync(masterPath, JSON.stringify(masterMetadata, null, 2));

        console.log('\n✅ Export complete!');
        console.log(`\nGenerated files:`);
        console.log(`  - ${allMetadata.length} character folders`);
        console.log(`  - ${allMetadata.reduce((sum, m) => sum + Object.values(m.frames).flat().length, 0)} PNG sprites`);
        console.log(`  - ${allMetadata.length + 1} metadata JSON files`);
        console.log(`\nReady for Phaser integration! 🎮`);
    }
}

// Run exporter
const exporter = new SpriteExporter('./public/sprites');
exporter.exportAll().catch(console.error);