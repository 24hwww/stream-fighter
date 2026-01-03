import { Canvas } from 'skia-canvas';
import { hexToRgb } from '../sprites/palette.js';

/**
 * SkiaRenderer
 * Converts the engine's internal PixelBuffer into a high-res Skia Canvas.
 * Supports integer scaling for crisp pixel art.
 */
export class SkiaRenderer {
    constructor(vWidth, vHeight, targetWidth, targetHeight) {
        this.vWidth = vWidth;
        this.vHeight = vHeight;
        this.targetWidth = targetWidth;
        this.targetHeight = targetHeight;
        this.canvas = new Canvas(targetWidth, targetHeight);
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        // Internal scaled canvas for crisp upscaling if needed
        this.offscreen = new Canvas(vWidth, vHeight);
        this.oCtx = this.offscreen.getContext('2d');
    }

    render(pixelBuffer) {
        const imageData = this.oCtx.createImageData(this.vWidth, this.vHeight);
        const data = imageData.data;

        for (let i = 0; i < pixelBuffer.data.length; i++) {
            const hex = pixelBuffer.data[i];
            const [r, g, b, a = 255] = hexToRgb(hex);

            const p = i * 4;
            data[p] = r;
            data[p + 1] = g;
            data[p + 2] = b;
            data[p + 3] = hex === -1 ? 0 : a;
        }

        this.oCtx.putImageData(imageData, 0, 0);

        // Blit to target canvas with integer scaling
        this.ctx.clearRect(0, 0, this.targetWidth, this.targetHeight);
        this.ctx.drawImage(this.offscreen, 0, 0, this.targetWidth, this.targetHeight);

        return this.canvas;
    }
}
