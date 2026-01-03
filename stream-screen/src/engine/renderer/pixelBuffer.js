/**
 * Pixel Buffer
 * A raw memory buffer for 16-bit rasterization.
 * Supports indices or direct color mapping.
 */
export class PixelBuffer {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.data = new Int32Array(width * height).fill(-1); // -1 is transparent
    }

    clear(color = -1) {
        this.data.fill(color);
    }

    setPixel(x, y, color) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
        this.data[y * this.width + x] = color;
    }

    getPixel(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return -1;
        return this.data[y * this.width + x];
    }

    /**
     * Blits another buffer onto this one with transparency support
     */
    blit(other, destX, destY, flipX = false) {
        destX = Math.round(destX);
        destY = Math.round(destY);

        for (let y = 0; y < other.height; y++) {
            const ty = destY + y;
            if (ty < 0 || ty >= this.height) continue;

            for (let x = 0; x < other.width; x++) {
                const color = other.getPixel(x, y);
                if (color !== -1) {
                    const tx = destX + (flipX ? (other.width - 1 - x) : x);
                    if (tx < 0 || tx >= this.width) continue;
                    this.data[ty * this.width + tx] = color;
                }
            }
        }
    }
}
