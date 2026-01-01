import { Palette } from '../sprites/palette.js';

/**
 * ArcadeStage
 * Renders the deterministic background.
 * Supports parallax and procedural elements.
 */
export class ArcadeStage {
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }

    render(buffer, time) {
        // 1. Sky Gradient (Simplified for PixelBuffer)
        for (let y = 0; y < this.height - 40; y++) {
            const color = y < this.height / 2 ? Palette.SKY_TOP : Palette.SKY_BOTTOM;
            for (let x = 0; x < this.width; x++) {
                buffer.setPixel(x, y, color);
            }
        }

        // 2. Ground
        const floorY = this.height - 40;
        for (let y = floorY; y < this.height; y++) {
            const color = y === floorY ? Palette.GROUND_LIGHT : Palette.GROUND_MID;
            for (let x = 0; x < this.width; x++) {
                buffer.setPixel(x, y, color);
            }
        }

        // 3. Simple Grid Lines
        for (let i = 0; i < this.width; i += 20) {
            const scroll = Math.floor(time * 0.05) % 20;
            const x = (i - scroll + this.width) % this.width;
            for (let y = floorY; y < this.height; y++) {
                buffer.setPixel(x, y, Palette.GROUND_DARK);
            }
        }
    }
}
