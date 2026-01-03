#!/usr/bin/env node

/**
 * Spritesheet Atlas Generator for Stream Fighter
 * Combines individual sprite PNGs into optimized texture atlases
 * Compatible with Phaser's atlas loader
 */

import fs from 'fs';
import path from 'path';
import { Canvas, Image } from '@napi-rs/canvas';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AtlasGenerator {
    constructor(spritesDir = './public/sprites', outputDir = './public/atlases') {
        this.spritesDir = spritesDir;
        this.outputDir = outputDir;
        this.ensureOutputDir();
    }

    ensureOutputDir() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    async loadImage(filepath) {
        const img = new Image();
        const buffer = fs.readFileSync(filepath);
        img.src = buffer;
        return img;
    }

    async generateAtlas(characterName) {
        const charDir = path.join(this.spritesDir, characterName);
        if (!fs.existsSync(charDir)) {
            console.warn(`Character directory not found: ${charDir}`);
            return null;
        }

        // Load metadata
        const metadataPath = path.join(charDir, `${characterName}_metadata.json`);
        if (!fs.existsSync(metadataPath)) {
            console.warn(`Metadata not found: ${metadataPath}`);
            return null;
        }

        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

        // Collect all sprite files
        const sprites = [];
        for (const [animName, frames] of Object.entries(metadata.frames)) {
            for (const frame of frames) {
                const filepath = path.join(charDir, frame.file);
                if (fs.existsSync(filepath)) {
                    sprites.push({
                        name: `${characterName}_${animName}_${frame.index}`,
                        filepath,
                        size: frame.size,
                        animName,
                        index: frame.index
                    });
                }
            }
        }

        if (sprites.length === 0) {
            console.warn(`No sprites found for ${characterName}`);
            return null;
        }

        console.log(`\n📦 Generating atlas for ${characterName} (${sprites.length} sprites)...`);

        // Calculate atlas dimensions (simple grid layout)
        const spriteSize = sprites[0].size;
        const cols = Math.ceil(Math.sqrt(sprites.length));
        const rows = Math.ceil(sprites.length / cols);
        const atlasWidth = cols * spriteSize;
        const atlasHeight = rows * spriteSize;

        // Create atlas canvas
        const canvas = new Canvas(atlasWidth, atlasHeight);
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Clear with transparency
        ctx.clearRect(0, 0, atlasWidth, atlasHeight);

        // Phaser atlas JSON format
        const atlasData = {
            textures: [
                {
                    image: `${characterName}_atlas.png`,
                    format: 'RGBA8888',
                    size: { w: atlasWidth, h: atlasHeight },
                    scale: 1,
                    frames: []
                }
            ],
            meta: {
                app: 'Stream Fighter Atlas Generator',
                version: '1.0',
                image: `${characterName}_atlas.png`,
                format: 'RGBA8888',
                size: { w: atlasWidth, h: atlasHeight },
                scale: 1
            }
        };

        // Place sprites on atlas
        for (let i = 0; i < sprites.length; i++) {
            const sprite = sprites[i];
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = col * spriteSize;
            const y = row * spriteSize;

            // Load and draw sprite
            const img = await this.loadImage(sprite.filepath);
            ctx.drawImage(img, x, y, spriteSize, spriteSize);

            // Add frame to atlas data
            atlasData.textures[0].frames.push({
                filename: sprite.name,
                frame: { x, y, w: spriteSize, h: spriteSize },
                rotated: false,
                trimmed: false,
                spriteSourceSize: { x: 0, y: 0, w: spriteSize, h: spriteSize },
                sourceSize: { w: spriteSize, h: spriteSize },
                pivot: { x: 0.5, y: 0.5 }
            });

            console.log(`  ✓ ${sprite.name} at (${x}, ${y})`);
        }

        // Save atlas PNG
        const atlasImagePath = path.join(this.outputDir, `${characterName}_atlas.png`);
        const buffer = await canvas.encode('png');
        fs.writeFileSync(atlasImagePath, buffer);
        console.log(`  ✓ Saved ${characterName}_atlas.png (${atlasWidth}x${atlasHeight})`);

        // Save atlas JSON
        const atlasJsonPath = path.join(this.outputDir, `${characterName}_atlas.json`);
        fs.writeFileSync(atlasJsonPath, JSON.stringify(atlasData, null, 2));
        console.log(`  ✓ Saved ${characterName}_atlas.json`);

        return {
            character: characterName,
            atlasImage: `${characterName}_atlas.png`,
            atlasJson: `${characterName}_atlas.json`,
            spriteCount: sprites.length,
            dimensions: { width: atlasWidth, height: atlasHeight }
        };
    }

    async generateAll() {
        console.log('🚀 Stream Fighter Atlas Generator');
        console.log('==================================\n');
        console.log(`Sprites directory: ${path.resolve(this.spritesDir)}`);
        console.log(`Output directory: ${path.resolve(this.outputDir)}\n`);

        // Find all character directories
        const entries = fs.readdirSync(this.spritesDir, { withFileTypes: true });
        const characters = entries
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);

        if (characters.length === 0) {
            console.error('No character directories found!');
            return;
        }

        const results = [];
        for (const character of characters) {
            const result = await this.generateAtlas(character);
            if (result) {
                results.push(result);
            }
        }

        // Create master index
        const masterIndex = {
            generated_at: new Date().toISOString(),
            atlases: results,
            usage: {
                phaser: {
                    example: `this.load.atlas('ninja', '/atlases/ninja_atlas.png', '/atlases/ninja_atlas.json');`
                }
            }
        };

        const indexPath = path.join(this.outputDir, 'atlases_index.json');
        fs.writeFileSync(indexPath, JSON.stringify(masterIndex, null, 2));

        console.log('\n✅ Atlas generation complete!');
        console.log(`\nGenerated ${results.length} texture atlases:`);
        results.forEach(r => {
            console.log(`  - ${r.atlasImage} (${r.spriteCount} sprites, ${r.dimensions.width}x${r.dimensions.height})`);
        });
        console.log(`\nReady for Phaser! Use: this.load.atlas(key, pngPath, jsonPath)`);
    }
}

// Run generator
const generator = new AtlasGenerator(
    path.join(__dirname, '../public/sprites'),
    path.join(__dirname, '../public/atlases')
);

generator.generateAll().catch(console.error);
