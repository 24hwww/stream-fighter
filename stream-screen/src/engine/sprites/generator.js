import { PixelBuffer } from '../renderer/pixelBuffer.js';
import { parseTemplate, FighterTemplates } from './fighterTemplates.js';
import { PixelTypes } from './pixelTypes.js';

const templateCache = new Map();

/**
 * PartGenerator
 * Generates 16-bit anatomical modules using cached templates.
 */
export class PartGenerator {
    /**
     * Generates a sprite from a named template
     * @param {string} templateName 
     * @param {object} ramp Colors for BASE, SHADOW, etc.
     * @param {number} scale Integer scaling factor
     */
    static generateFromTemplate(templateSource, ramp, scale = 1) {
        // 1. Get or Parse Template
        let parsed;
        let cacheKey;

        if (typeof templateSource === 'string') {
            cacheKey = templateSource;
            parsed = templateCache.get(cacheKey);
            if (!parsed) {
                const templateDef = FighterTemplates[templateSource];
                if (!templateDef) {
                    console.warn(`Template ${templateSource} not found.`);
                    return new PixelBuffer(10, 10);
                }
                parsed = parseTemplate(templateDef);
                templateCache.set(cacheKey, parsed);
            }
        } else {
            // Direct object (AI Generated)
            parsed = parseTemplate(templateSource);
        }

        const { width, height, data, pivot, z } = parsed;
        const buffer = new PixelBuffer(width * scale, height * scale);

        // Attach Metadata to Buffer
        buffer.pivot = { x: pivot.x * scale, y: pivot.y * scale };
        buffer.z = z !== undefined ? z : 0;

        // 2. Map Semantic Pixels to Colors
        const colorMap = {
            [PixelTypes.OUTLINE]: ramp.outline,
            [PixelTypes.BASE]: ramp.base,
            [PixelTypes.SHADOW]: ramp.shadow,
            [PixelTypes.HIGHLIGHT]: ramp.highlight,
            [PixelTypes.DETAIL]: ramp.detail || ramp.outline,
            [PixelTypes.TRANSPARENT]: -1
        };

        // 3. Render
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixelType = data[y * width + x];

                if (pixelType !== PixelTypes.TRANSPARENT) {
                    const color = colorMap[pixelType];

                    // Fill scale x scale block
                    for (let sy = 0; sy < scale; sy++) {
                        for (let sx = 0; sx < scale; sx++) {
                            buffer.setPixel(x * scale + sx, y * scale + sy, color);
                        }
                    }
                }
            }
        }

        return buffer;
    }
}
