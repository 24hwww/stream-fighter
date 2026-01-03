import { ShapeRenderer } from '@/engine/renderer/shapeRenderer';

/**
 * Generates a Phaser texture from AI Design Data (Step 1)
 * This replaces the old ASCII bitmap generator.
 */
export function generateCharacterFrame(design, animKey, frameIdx) {
    if (!design) return null;

    // The AI might return the data under different top-level keys 
    // depending on the model's interpretation of the prompt.
    // We normalize here to ensure robustness.
    const body = design.body_structure || design.body;
    const anims = design.animation_definitions || design.animations;
    const colors = design.color_system || design.palette;
    const metadata = design.character_metadata || design.metadata;

    if (!body || !anims) {
        console.warn("Invalid design data structure", design);
        return null;
    }

    const size = metadata?.base_sprite_size || 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Disable smoothing for pixel-perfect results
    ctx.imageSmoothingEnabled = false;

    // Get the frame data
    const animation = anims[animKey] || anims[animKey.toLowerCase()] || anims[animKey.toUpperCase()];
    if (!animation) return null;

    const frame = animation[frameIdx];
    if (!frame) return null;

    // Get all parts and sort by Z
    const parts = Object.entries(body).map(([name, data]) => ({
        name,
        ...data,
        transform: frame.parts?.[name] || { x: 0, y: 0, rotation: 0, scale: 1 }
    }));

    // Sort by Z-order (default to 0 if missing)
    parts.sort((a, b) => (a.z_order || a.z || 0) - (b.z_order || b.z || 0));

    // Anchor point: bottom-center
    const charX = size / 2;
    const charY = size - (size * 0.1);

    parts.forEach(part => {
        ctx.save();

        ctx.translate(charX + (part.transform.x || 0), charY + (part.transform.y || 0));
        ctx.rotate((part.transform.rotation || 0) * Math.PI / 180);
        const s = part.transform.scale || 1;
        ctx.scale(s, s);

        const shapes = part.shapes || [];
        shapes.forEach(shape => {
            const palette = colors.palette || colors;
            ctx.fillStyle = ShapeRenderer.getColor(shape.color, palette);

            // Shading: outline color and shadow intensity
            ctx.strokeStyle = colors.outline_color || colors.outline || '#000000';
            ctx.lineWidth = shape.outline_width || design.rendering_hints?.outline_thickness || 0;

            if (shape.type === 'polygon' && shape.points) {
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
            } else if (shape.type === 'circle' || shape.type === 'ellipse') {
                ctx.beginPath();
                const radiusX = shape.r || shape.rx || shape.w / 2 || 10;
                const radiusY = shape.ry || shape.h / 2 || radiusX;
                ctx.ellipse(shape.cx || shape.x || 0, shape.cy || shape.y || 0, radiusX, radiusY, 0, 0, Math.PI * 2);
                ctx.fill();
                if (ctx.lineWidth > 0) ctx.stroke();
            }
        });

        ctx.restore();
    });

    return canvas;
}

// Keep export for compatibility
export function bufferToCanvas(buffer) {
    if (buffer instanceof HTMLCanvasElement) return buffer;
    // ... existing logic if buffer is PixelBuffer ...
    return buffer;
}
