import Phaser from 'phaser';

export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    preload() {
        // Generate the roster assets procedurally
        this.createRoster();
    }

    create() {
        const keys = ['geek', 'pirate', 'ninja', 'sexy', 'cook', 'cat', 'dog'];
        keys.forEach(key => this.createFighterAnimations(key));
        this.scene.start('MainScene');
    }

    createRoster() {
        const roster = [
            {
                key: 'geek',
                colors: {
                    hair: '#5DBB63', hairS: '#3E8E41', hairL: '#A8E4A0',
                    skin: '#FFDBAC', skinS: '#D2A679',
                    shirt: '#2C3E50', shirtS: '#1A252F', shirtL: '#5D6D7E',
                    pants: '#333', pantsS: '#111', shoes: '#000',
                    hairStyle: 'spiky', accessory: 'glasses'
                }
            },
            {
                key: 'pirate',
                colors: {
                    hair: '#3D2B1F', hairS: '#2A1A0F', hairL: '#5D4037',
                    skin: '#E0AC69', skinS: '#AD8154',
                    shirt: '#C0392B', shirtS: '#922B21', shirtL: '#E74C3C',
                    pants: '#34495E', pantsS: '#212F3C', shoes: '#111',
                    hairStyle: 'bob', accessory: 'bandana'
                }
            },
            {
                key: 'ninja',
                colors: {
                    hair: '#111', hairS: '#000', hairL: '#222',
                    skin: '#FFDBAC', skinS: '#D2A679',
                    shirt: '#2C3E50', shirtS: '#1A252F', shirtL: '#34495E',
                    pants: '#1B2631', pantsS: '#000', shoes: '#111',
                    hairStyle: 'spiky', accessory: 'mask'
                }
            },
            {
                key: 'sexy',
                colors: {
                    hair: '#F1C40F', hairS: '#D4AC0D', hairL: '#F7DC6F',
                    skin: '#FAD7A0', skinS: '#F5B041',
                    shirt: '#EC407A', shirtS: '#C2185B', shirtL: '#F48FB1',
                    pants: '#EC407A', pantsS: '#880E4F', shoes: '#FFEB3B',
                    hairStyle: 'curly', accessory: 'blush'
                }
            },
            {
                key: 'cook',
                colors: {
                    hair: '#333', hairS: '#111', hairL: '#555',
                    skin: '#FFDBAC', skinS: '#D2A679',
                    shirt: '#FDFEFE', shirtS: '#D5DBDB', shirtL: '#FBFCFC',
                    pants: '#2E4053', pantsS: '#1A252F', shoes: '#000',
                    hairStyle: 'bob', accessory: 'chef_hat'
                }
            },
            {
                key: 'cat',
                colors: {
                    hair: '#E67E22', hairS: '#D35400', hairL: '#F39C12',
                    skin: '#FAD7A0', skinS: '#F5B041',
                    shirt: '#D35400', shirtS: '#A04000', shirtL: '#E67E22',
                    pants: '#E67E22', pantsS: '#A04000', shoes: '#222',
                    hairStyle: 'animal', accessory: 'cat_ears'
                }
            },
            {
                key: 'dog',
                colors: {
                    hair: '#8D6E63', hairS: '#5D4037', hairL: '#A1887F',
                    skin: '#D7CCC8', skinS: '#BCAAA4',
                    shirt: '#5D4037', shirtS: '#3E2723', shirtL: '#795548',
                    pants: '#5D4037', pantsS: '#3E2723', shoes: '#111',
                    hairStyle: 'animal', accessory: 'dog_ears'
                }
            }
        ];

        roster.forEach(char => this.drawFighter(char.key, char.colors));
    }

    drawFighter(key, colors) {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 320;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;

        const drawPixelFrame = (frameX, frameY, pose, step) => {
            const cx = frameX + 32;
            const cy = frameY + 60;

            // Drop Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(cx - 16, cy - 2, 32, 4);

            // Tail for animals
            if (key === 'cat' || key === 'dog') {
                ctx.fillStyle = colors.hair;
                const tailOffset = (pose === 'walk' && step === 1) ? -4 : 0;
                ctx.fillRect(cx - 16, cy - 24 + tailOffset, 6, 14); // Tail
            }

            // Legs
            let lX = cx - 10, rX = cx + 2, lY = cy - 14, rY = cy - 14;
            if (pose === 'walk') { const m = step === 0 ? 4 : -4; lX += m; rX -= m; }
            else if (pose === 'kick') { rX = cx + 8; rY = cy - 26; }

            ctx.fillStyle = colors.pantsS;
            ctx.fillRect(lX + 4, lY, 2, 12);
            ctx.fillStyle = colors.pants;
            ctx.fillRect(lX, lY, 4, 12);
            ctx.fillStyle = colors.shoes;
            ctx.fillRect(lX - 2, lY + 10, 8, 4);

            if (pose === 'kick') {
                ctx.fillStyle = colors.pants;
                ctx.fillRect(cx + 4, cy - 26, 20, 8);
                ctx.fillStyle = colors.shoes;
                ctx.fillRect(cx + 20, cy - 28, 8, 10);
            } else {
                ctx.fillStyle = colors.pantsS;
                ctx.fillRect(rX + 4, rY, 2, 12);
                ctx.fillStyle = colors.pants;
                ctx.fillRect(rX, rY, 4, 12);
                ctx.fillStyle = colors.shoes;
                ctx.fillRect(rX - 2, rY + 10, 8, 4);
            }

            // Torso
            let ty = cy - 36;
            if (pose === 'punch') ty += 2;
            ctx.fillStyle = colors.shirt;
            ctx.fillRect(cx - 10, ty, 20, 22);
            ctx.fillStyle = colors.shirtS;
            ctx.fillRect(cx + 6, ty, 4, 22);

            if (key === 'cook') {
                ctx.fillStyle = '#FBFCFC';
                ctx.fillRect(cx - 8, ty + 10, 16, 12); // Apron
                ctx.fillStyle = '#BDC3C7';
                ctx.fillRect(cx - 4, ty + 2, 8, 8);
            }

            // Arms
            ctx.fillStyle = colors.skin;
            if (pose === 'punch') {
                ctx.fillRect(cx + 8, ty + 4, 24, 6);
                ctx.fillStyle = '#fff';
                ctx.fillRect(cx + 24, ty + 2, 10, 10);
            } else {
                const os = (pose === 'walk' && step === 1) ? 2 : 0;
                ctx.fillRect(cx - 14, ty + 6 + os, 6, 12);
                ctx.fillRect(cx + 9, ty + 6 - os, 6, 12);
            }

            // Head
            let hx = cx - 12, hy = ty - 24;
            if (pose === 'hit') hx -= 4;

            // Hair/Fur
            ctx.fillStyle = colors.hairS;
            if (colors.hairStyle === 'spiky') ctx.fillRect(hx - 4, hy - 6, 32, 12);
            else if (colors.hairStyle === 'curly') ctx.fillRect(hx - 6, hy - 6, 36, 28);
            else if (colors.hairStyle === 'animal') ctx.fillRect(hx - 2, hy - 2, 28, 20);
            else ctx.fillRect(hx - 2, hy - 4, 28, 22);

            // Face
            ctx.fillStyle = colors.skin;
            ctx.fillRect(hx + 2, hy + 4, 20, 20);
            ctx.fillStyle = colors.skinS;
            ctx.fillRect(hx + 18, hy + 4, 4, 20);

            // Accessories
            if (colors.accessory === 'cat_ears') {
                ctx.fillStyle = colors.hair;
                ctx.fillRect(hx + 2, hy - 4, 6, 8);
                ctx.fillRect(hx + 16, hy - 4, 6, 8);
            } else if (colors.accessory === 'dog_ears') {
                ctx.fillStyle = colors.hairS;
                ctx.fillRect(hx - 4, hy + 4, 6, 16);
                ctx.fillRect(hx + 22, hy + 4, 6, 16);
                ctx.fillStyle = '#333';
                ctx.fillRect(hx + 14, hy + 16, 8, 4);
            } else if (colors.accessory === 'glasses') {
                ctx.fillStyle = '#111';
                ctx.fillRect(hx + 4, hy + 10, 16, 2);
                ctx.fillRect(hx + 5, hy + 10, 5, 5);
                ctx.fillRect(hx + 14, hy + 10, 5, 5);
            } else if (colors.accessory === 'mask') {
                ctx.fillStyle = colors.shirtS;
                ctx.fillRect(hx + 2, hy + 16, 20, 8);
            } else if (colors.accessory === 'bandana') {
                ctx.fillStyle = '#C0392B';
                ctx.fillRect(hx, hy + 2, 24, 6);
            } else if (colors.accessory === 'chef_hat') {
                ctx.fillStyle = '#fff';
                ctx.fillRect(hx, hy - 14, 24, 18);
                ctx.fillStyle = '#eee';
                ctx.fillRect(hx + 20, hy - 14, 4, 18);
            }

            // Eyes
            if (colors.accessory !== 'glasses') {
                ctx.fillStyle = '#111';
                ctx.fillRect(hx + 6, hy + 12, 3, 3);
                ctx.fillRect(hx + 15, hy + 12, 3, 3);
            }
        };

        ['idle', 'walk', 'punch', 'kick', 'hit'].forEach((pose, r) => {
            for (let c = 0; c < 2; c++) drawPixelFrame(c * 64, r * 64, pose, c);
        });

        this.textures.addSpriteSheet(`${key}_sheet`, canvas, { frameWidth: 64, frameHeight: 64 });
    }

    createFighterAnimations(key) {
        const anims = this.anims;
        const poses = ['idle', 'walk', 'punch', 'kick', 'hit'];
        poses.forEach((p, i) => {
            anims.create({
                key: `${key}_${p}`,
                frames: anims.generateFrameNumbers(`${key}_sheet`, { start: i * 2, end: i * 2 + 1 }),
                frameRate: p === 'idle' ? 4 : 10,
                repeat: p === 'idle' || p === 'walk' ? -1 : 0
            });
        });
    }
}
