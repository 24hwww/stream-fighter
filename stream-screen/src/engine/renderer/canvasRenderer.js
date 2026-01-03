import { hexToRgb } from '../sprites/palette.js';

/**
 * CanvasRenderer
 * Browser-side renderer for the Arcade Engine.
 * Converts the PixelBuffer into a native 2D Canvas.
 */
export class CanvasRenderer {
    constructor(vWidth, vHeight, targetWidth, targetHeight) {
        this.vWidth = vWidth;
        this.vHeight = vHeight;
        this.targetWidth = targetWidth;
        this.targetHeight = targetHeight;

        this.canvas = document.createElement('canvas');
        this.canvas.width = targetWidth;
        this.canvas.height = targetHeight;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        // Internal scaled canvas for crisp upscaling
        this.offscreen = document.createElement('canvas');
        this.offscreen.width = vWidth;
        this.offscreen.height = vHeight;
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
