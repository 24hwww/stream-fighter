"use client";
import React, { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { generateCharacterFrame, bufferToCanvas } from '@/lib/phaser-dynamic-generator';

export default function PhaserFighter({ scenario }) {
    const gameContainer = useRef(null);
    const gameRef = useRef(null);

    useEffect(() => {
        if (!gameContainer.current) return;

        const config = {
            type: Phaser.AUTO,
            width: 320,
            height: 180,
            parent: gameContainer.current,
            pixelArt: true,
            backgroundColor: scenario?.color_system?.palette?.sky_top || scenario?.stage?.skyColor || "#2a2a2a",
            scene: {
                preload: preload,
                create: create,
                update: update
            },
            scale: {
                zoom: 1,
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        };

        const game = new Phaser.Game(config);
        gameRef.current = game;

        function preload() {
            if (!scenario) {
                this.load.atlas('fighter', '/sprites/fighter_spritesheet.png', '/sprites/fighter_spritesheet.json');
            }
        }

        function create() {
            if (scenario) {
                // 1. Generate Frames for all defined animations
                const anims = scenario.animation_definitions || scenario.animations;
                const metadata = scenario.character_metadata || scenario.metadata || scenario.character;

                Object.keys(anims).forEach(animKey => {
                    const frames = anims[animKey];
                    frames.forEach((_, idx) => {
                        const canvas = generateCharacterFrame(scenario, animKey, idx);
                        if (canvas) {
                            const textureKey = `${animKey}_${idx}`;
                            this.textures.addCanvas(textureKey, canvas);
                        }
                    });

                    // 2. Create Animations
                    this.anims.create({
                        key: animKey,
                        frames: frames.map((_, idx) => ({ key: `${animKey}_${idx}` })),
                        frameRate: 8,
                        repeat: animKey.toUpperCase().includes('IDLE') ? -1 : 0
                    });
                });

                // 3. Stage Background
                const groundY = 140;
                const graphics = this.add.graphics();

                const palette = scenario.color_system?.palette || scenario.stage || {};
                const groundLight = palette.ground_light || palette.groundLight || 0x444444;
                const groundDark = palette.ground_dark || palette.groundDark || 0x222222;

                // Draw Ground
                graphics.fillStyle(this.parseHex(groundDark), 1);
                graphics.fillRect(0, groundY, 320, 40);

                // Draw Grid
                graphics.lineStyle(1, this.parseHex(groundLight), 0.3);
                for (let i = 0; i < 320; i += 20) {
                    graphics.lineBetween(i, groundY, i, 180);
                }
                graphics.lineBetween(0, groundY, 320, groundY);

                // Add character
                const idleKey = Object.keys(anims).find(k => k.toUpperCase().includes('IDLE')) || Object.keys(anims)[0];
                const fighter = this.add.sprite(160, groundY, `${idleKey}_0`);
                fighter.setOrigin(0.5, 1);
                fighter.play(idleKey);

                // Attack logic
                const punchKey = Object.keys(anims).find(k => k.toUpperCase().includes('PUNCH') || k.toUpperCase().includes('ATTACK'));
                if (punchKey) {
                    this.input.on('pointerdown', () => {
                        if (fighter.anims.currentAnim.key !== punchKey) {
                            fighter.play(punchKey);
                            fighter.chain(idleKey);
                        }
                    });
                }

            } else {
                // Static Backup
                try {
                    const fighterAnims = this.cache.json.get('fighter').animations;
                    Object.keys(fighterAnims).forEach(animKey => {
                        this.anims.create({
                            key: animKey,
                            frames: this.anims.generateFrameNames('fighter', {
                                prefix: animKey + '_',
                                start: 0,
                                end: fighterAnims[animKey].length - 1,
                                zeroPad: 0
                            }),
                            frameRate: 8,
                            repeat: animKey === 'IDLE' ? -1 : 0
                        });
                    });

                    const fighter = this.add.sprite(160, 140, 'fighter', 'IDLE_0');
                    fighter.play('IDLE');

                    this.input.on('pointerdown', () => {
                        if (fighter.anims.currentAnim.key !== 'PUNCH') {
                            fighter.play('PUNCH');
                            fighter.chain('IDLE');
                        }
                    });
                } catch (e) {
                    console.warn("Static atlas not loaded");
                }
            }

            // Text UI
            const name = scenario?.character_metadata?.name || scenario?.metadata?.name || scenario?.character?.name || "Player";
            this.add.text(10, 10, `ARCADE AI: ${name.toUpperCase()}`, {
                font: '8px monospace',
                fill: '#ffffff',
                backgroundColor: '#000000'
            });
        }

        // Helper to parse hex strings or numbers
        this.parseHex = (val) => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
                if (val.startsWith('#')) return parseInt(val.slice(1), 16);
                if (val.startsWith('0x')) return parseInt(val.slice(2), 16);
                return parseInt(val, 16);
            }
            return 0x000000;
        };

        function update() { }

        return () => {
            game.destroy(true);
        };
    }, [scenario]);

    return <div ref={gameContainer} className="w-full h-full" />;
}
