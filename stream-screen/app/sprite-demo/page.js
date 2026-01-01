"use client";
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

export default function PhaserSpriteDemo() {
    const gameRef = useRef(null);
    const phaserGameRef = useRef(null);

    useEffect(() => {
        if (typeof window === 'undefined' || phaserGameRef.current) return;

        class DemoScene extends Phaser.Scene {
            constructor() {
                super({ key: 'DemoScene' });
            }

            preload() {
                // Load all character atlases
                const characters = ['ninja', 'merc', 'guard', 'teal', 'lion_knight', 'mage', 'barbarian', 'archer'];

                characters.forEach(char => {
                    this.load.atlas(`${char}_atlas`, `/atlases/${char}_atlas.png`, `/atlases/${char}_atlas.json`);
                });

                // Keep individual sprites for fallback
                this.load.image('ninja_idle_0', '/sprites/ninja/ninja_idle_0.png');
                this.load.image('ninja_idle_1', '/sprites/ninja/ninja_idle_1.png');
                this.load.image('ninja_attack_0', '/sprites/ninja/ninja_attack_0.png');
            }

            create() {
                // Background
                this.cameras.main.setBackgroundColor('#1a1a2e');

                // Title
                this.add.text(400, 50, 'Stream Fighter - All Characters', {
                    fontSize: '32px',
                    color: '#ffffff',
                    fontFamily: 'monospace'
                }).setOrigin(0.5);

                // Subtitle
                this.add.text(400, 85, '8 AI-Generated Fighters - Pixel-Perfect', {
                    fontSize: '14px',
                    color: '#aaaaaa',
                    fontFamily: 'monospace'
                }).setOrigin(0.5);

                // Character data
                const characters = [
                    { name: 'Ninja', key: 'ninja', color: '#ff6b6b' },
                    { name: 'Merc', key: 'merc', color: '#4ecdc4' },
                    { name: 'Guard', key: 'guard', color: '#45b7d1' },
                    { name: 'Teal', key: 'teal', color: '#96ceb4' },
                    { name: 'Lion Knight', key: 'lion_knight', color: '#feca57' },
                    { name: 'Mage', key: 'mage', color: '#ff9ff3' },
                    { name: 'Barbarian', key: 'barbarian', color: '#ff9f43' },
                    { name: 'Archer', key: 'archer', color: '#54a0ff' }
                ];

                // Create animations for all characters
                characters.forEach(char => {
                    // IDLE animation
                    this.anims.create({
                        key: `${char.key}_idle`,
                        frames: this.anims.generateFrameNames(`${char.key}_atlas`, {
                            prefix: `${char.key.toUpperCase()}_IDLE_`,
                            start: 0,
                            end: 1
                        }),
                        frameRate: 8,
                        repeat: -1
                    });

                    // ATTACK/PUNCH animation
                    this.anims.create({
                        key: `${char.key}_attack`,
                        frames: this.anims.generateFrameNames(`${char.key}_atlas`, {
                            prefix: `${char.key.toUpperCase()}_PUNCH_`,
                            start: 0,
                            end: 0
                        }),
                        frameRate: 1,
                        repeat: 0
                    });
                });

                // Display characters in a grid
                const cols = 4;
                const rows = 2;
                const startX = 150;
                const startY = 150;
                const spacingX = 150;
                const spacingY = 120;

                characters.forEach((char, index) => {
                    const col = index % cols;
                    const row = Math.floor(index / cols);
                    const x = startX + (col * spacingX);
                    const y = startY + (row * spacingY);

                    // Create sprite using atlas
                    const sprite = this.add.sprite(x, y, `${char.key}_atlas`, `${char.key.toUpperCase()}_IDLE_0`);
                    sprite.setScale(3);
                    sprite.play(`${char.key}_idle`);

                    // Character name
                    this.add.text(x, y + 50, char.name, {
                        fontSize: '12px',
                        color: char.color,
                        fontFamily: 'monospace',
                        fontWeight: 'bold'
                    }).setOrigin(0.5);

                    // Make interactive
                    sprite.setInteractive();
                    sprite.on('pointerdown', () => {
                        sprite.play(`${char.key}_attack`);
                        sprite.once('animationcomplete', () => {
                            sprite.play(`${char.key}_idle`);
                        });
                    });

                    // Hover effect
                    sprite.on('pointerover', () => {
                        sprite.setTint(0xaaaaaa);
                    });
                    sprite.on('pointerout', () => {
                        sprite.clearTint();
                    });
                });

                // Instructions
                this.add.text(400, 450, 'Click on any character to see their attack animation', {
                    fontSize: '16px',
                    color: '#ffff00',
                    fontFamily: 'monospace'
                }).setOrigin(0.5);

                // Character count
                this.add.text(400, 470, `8 Characters × 3 Animations = 24 Pixel-Perfect Sprites`, {
                    fontSize: '12px',
                    color: '#888888',
                    fontFamily: 'monospace'
                }).setOrigin(0.5);

                // Technical info
                const techInfo = [
                    'Technical Details:',
                    '• 8 AI-Generated Characters',
                    '• Texture Atlases (128x128)',
                    '• Pixel-Perfect Rendering',
                    '• Transparent PNG with Alpha',
                    '• Phaser Atlas Format',
                    '• 64x64 Base Resolution'
                ];

                techInfo.forEach((line, index) => {
                    this.add.text(20, 500 + (index * 18), line, {
                        fontSize: '11px',
                        color: '#666666',
                        fontFamily: 'monospace'
                    });
                });
            }
        }

        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: gameRef.current,
            pixelArt: true, // CRITICAL for pixel art
            render: {
                antialias: false,
                pixelArt: true
            },
            scene: [DemoScene]
        };

        phaserGameRef.current = new Phaser.Game(config);

        return () => {
            if (phaserGameRef.current) {
                phaserGameRef.current.destroy(true);
                phaserGameRef.current = null;
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-8">
            <div className="mb-6 text-center">
                <h1 className="text-4xl font-black text-white mb-2">
                    🎮 Stream Fighter - 8 AI Fighters
                </h1>
                <p className="text-gray-400">
                    Complete Pixel Art Pipeline Demo - Click Characters to Attack!
                </p>
            </div>

            <div
                ref={gameRef}
                className="border-4 border-yellow-500 shadow-2xl"
                style={{
                    imageRendering: 'pixelated',
                    imageRendering: '-moz-crisp-edges',
                    imageRendering: 'crisp-edges'
                }}
            />

            <div className="mt-6 max-w-3xl bg-gray-800 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-white mb-3">🎮 Complete Character Pipeline:</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-yellow-400 mb-2">8 AI-Generated Characters:</h3>
                        <ul className="text-gray-300 space-y-1 text-sm">
                            <li>• <strong>Ninja:</strong> Stealth assassin with katana</li>
                            <li>• <strong>Merc:</strong> Tactical soldier with gun</li>
                            <li>• <strong>Guard:</strong> Knight with shield</li>
                            <li>• <strong>Teal:</strong> Support mage with hair buns</li>
                            <li>• <strong>Lion Knight:</strong> Royal knight with plume</li>
                            <li>• <strong>Mage:</strong> Wizard with staff & orb</li>
                            <li>• <strong>Barbarian:</strong> Berserker with axe</li>
                            <li>• <strong>Archer:</strong> Ranger with bow & quiver</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-green-400 mb-2">Technical Achievements:</h3>
                        <ul className="text-gray-300 space-y-1 text-sm">
                            <li>✅ <strong>24 Pixel-Perfect Sprites</strong> (8 chars × 3 anims)</li>
                            <li>✅ <strong>8 Texture Atlases</strong> (128×128 optimized)</li>
                            <li>✅ <strong>AI-Driven Design</strong> (code-generated graphics)</li>
                            <li>✅ <strong>Phaser Integration</strong> (atlas animations)</li>
                            <li>✅ <strong>Interactive Demo</strong> (click to attack)</li>
                            <li>✅ <strong>Procedural Pipeline</strong> (automated export)</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-4">
                <a
                    href="/sprites/sprites_metadata.json"
                    target="_blank"
                    className="text-yellow-400 hover:text-yellow-300 underline text-sm"
                >
                    📊 Master Sprite Metadata
                </a>
                <a
                    href="/atlases/atlases_index.json"
                    target="_blank"
                    className="text-blue-400 hover:text-blue-300 underline text-sm"
                >
                    🗺️ Atlas Index
                </a>
                <a
                    href="/sprites/ninja/ninja_metadata.json"
                    target="_blank"
                    className="text-green-400 hover:text-green-300 underline text-sm"
                >
                    👤 Ninja Metadata
                </a>
            </div>
        </div>
    );
}