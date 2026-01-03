/**
 * ShapeRenderer
 * Rasterizes design data into pixel-perfect sprites.
 */
export class ShapeRenderer {
    /**
     * Renders a set of shapes to a PixelBuffer
     * @param {Array} shapes Array of shape objects {type, color, points/coords}
     * @param {Object} palette Color mapping
     * @param {number} width 
     * @param {number} height
     */
    static renderToBuffer(shapes, palette, width, height) {
        // Use a temporary canvas for high-quality shape rasterization
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        // Disable anti-aliasing for pixel-perfect look
        ctx.imageSmoothingEnabled = false;

        shapes.forEach(shape => {
            ctx.fillStyle = this.getColor(shape.color, palette);
            ctx.strokeStyle = palette.outline || '#000000';
            ctx.lineWidth = shape.outlineWidth || 0;

            if (shape.type === 'polygon') {
                ctx.beginPath();
                shape.points.forEach((p, i) => {
                    if (i === 0) ctx.moveTo(p[0], p[1]);
                    else ctx.lineTo(p[0], p[1]);
                });
                ctx.closePath();
                ctx.fill();
                if (ctx.lineWidth > 0) ctx.stroke();
            } else if (shape.type === 'rect') {
                ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
                if (ctx.lineWidth > 0) ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
            } else if (shape.type === 'circle') {
                ctx.beginPath();
                ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2);
                ctx.fill();
                if (ctx.lineWidth > 0) ctx.stroke();
            }
        });

        // Convert back to our PixelBuffer format if needed, 
        // or just return the canvas as an image asset
        return canvas;
    }

    static getColor(key, palette) {
        // Handle common keys like 'base', 'mid', 'dark', 'highlight'
        const color = palette[key] || key;
        return color.startsWith('0x') ? '#' + color.slice(2) : color;
    }
}
