import { Palette } from '../sprites/palette.js';

/**
 * Basic Bitmap Font for Timer and Health Bars
 */
const TinyFont = {
    '0': [[1, 1, 1], [1, 0, 1], [1, 0, 1], [1, 0, 1], [1, 1, 1]],
    '1': [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]],
    '2': [[1, 1, 1], [0, 0, 1], [1, 1, 1], [1, 0, 0], [1, 1, 1]],
    '3': [[1, 1, 1], [0, 0, 1], [1, 1, 1], [0, 0, 1], [1, 1, 1]],
    '4': [[1, 1, 0], [1, 0, 1], [1, 1, 1], [0, 0, 1], [0, 0, 1]],
    '5': [[1, 1, 1], [1, 0, 0], [1, 1, 1], [0, 0, 1], [1, 1, 1]],
    '6': [[1, 1, 1], [1, 0, 0], [1, 1, 1], [1, 0, 1], [1, 1, 1]],
    '7': [[1, 1, 1], [0, 0, 1], [0, 1, 0], [0, 1, 0], [0, 1, 0]],
    '8': [[1, 1, 1], [1, 0, 1], [1, 1, 1], [1, 0, 1], [1, 1, 1]],
    '9': [[1, 1, 1], [1, 0, 1], [1, 1, 1], [0, 0, 1], [1, 1, 1]],
    ':': [[0, 0, 0], [0, 1, 0], [0, 0, 0], [0, 1, 0], [0, 0, 0]]
};

export class HUD {
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }

    render(buffer, p1HP, p2HP, timer) {
        const barW = 100;
        const barH = 10;
        const margin = 10;

        // Player 1 Health Bar (Red Side)
        this.drawBar(buffer, margin, margin, barW, barH, p1HP, Palette.RED_MID);

        // Player 2 Health Bar (Blue Side)
        this.drawBar(buffer, this.width - margin - barW, margin, barW, barH, p2HP, Palette.BLUE_MID, true);

        // Timer (Center)
        const timeStr = Math.ceil(timer).toString().padStart(2, '0');
        const timerX = (this.width / 2) - (timeStr.length * 4);
        this.drawText(buffer, timeStr, timerX, margin, Palette.YELLOW_BRIGHT);
    }

    drawBar(buffer, x, y, w, h, percent, color, flip = false) {
        // Shadow/Outline
        for (let py = y - 1; py < y + h + 1; py++) {
            for (let px = x - 1; px < x + w + 1; px++) {
                if (px === x - 1 || px === x + w || py === y - 1 || py === y + h) {
                    buffer.setPixel(px, py, Palette.BLACK);
                }
            }
        }

        // BG Area (Dark)
        for (let py = y; py < y + h; py++) {
            for (let px = x; px < x + w; px++) {
                buffer.setPixel(px, py, Palette.GROUND_DARK);
            }
        }

        // Fill Area
        const fillW = Math.max(0, Math.floor(w * percent));
        for (let py = y; py < y + h; py++) {
            for (let px = 0; px < fillW; px++) {
                const tx = flip ? (x + w - 1 - px) : (x + px);
                buffer.setPixel(tx, py, Palette.YELLOW_BRIGHT);
            }
        }
    }

    drawText(buffer, text, x, y, color) {
        let cursorX = x;
        for (const char of text) {
            const bitmap = TinyFont[char];
            if (bitmap) {
                for (let row = 0; row < bitmap.length; row++) {
                    for (let col = 0; col < bitmap[row].length; col++) {
                        if (bitmap[row][col]) {
                            buffer.setPixel(cursorX + col, y + row, color);
                        }
                    }
                }
            }
            cursorX += 4; // Char width + space
        }
    }
}
