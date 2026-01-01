import { PixelBuffer } from '../renderer/pixelBuffer.js';
import { Palette } from '../sprites/palette.js';

export class DesertStage {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        // Default Colors
        this.skyColor = 0x203060; // Deep blue sky
        this.sandLight = 0xFEDC90; // Bright sand
        this.sandDark = 0xD4B068; // Darker sand/shadows
        this.castleBase = 0xCC8855; // Reddish/Orange Castle
        this.castleDark = 0x995533;
        this.palmGreen = 0x008800;
        this.palmTrunk = 0x664422;
    }

    parseColor(c) {
        if (typeof c === 'number') return c;
        if (typeof c === 'string') {
            const clean = c.replace('#', '').replace('0x', '');
            return parseInt(clean, 16);
        }
        return 0;
    }

    render(buffer, time) {
        const sky = this.parseColor(this.skyColor);
        const floor = this.parseColor(this.sandLight);

        // 1. Sky - Flat color background
        for (let y = 0; y < 80; y++) {
            for (let x = 0; x < this.width; x++) {
                buffer.setPixel(x, y, sky);
            }
        }

        // 2. Floor - Flat color floor
        for (let y = 80; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                buffer.setPixel(x, y, floor);
            }
        }

        // 3. Palm Trees
        this.drawPalm(buffer, 20, 80);
        this.drawPalm(buffer, this.width - 20, 80);
    }

    drawPalm(buffer, cx, cy) {
        for (let i = 0; i < 60; i++) {
            const curve = Math.sin(i * 0.05) * 5;
            for (let w = -2; w <= 2; w++) {
                buffer.setPixel(cx + curve + w, cy - i, this.palmTrunk);
            }
        }
        const topX = cx + Math.sin(60 * 0.05) * 5;
        const topY = cy - 60;
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            for (let r = 0; r < 15; r++) {
                const lx = topX + Math.cos(angle) * r;
                const ly = topY + Math.sin(angle) * r * 0.5;
                buffer.setPixel(lx | 0, ly | 0, this.palmGreen);
            }
        }
    }
}