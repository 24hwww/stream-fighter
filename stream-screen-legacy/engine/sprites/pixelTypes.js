/**
 * Pixel Types
 * Semantic definitions for pixel content.
 * Removes magic numbers from the rendering pipeline.
 */
export const PixelTypes = {
    TRANSPARENT: -1,
    OUTLINE: 0,
    BASE: 1,      // Primary color (Skin, Cloth)
    SHADOW: 2,    // Shading
    HIGHLIGHT: 3, // Specular / Light
    DETAIL: 4,    // Secondary details (Belt, Hair, Gloves)
    DEBUG: 99     // Pivot points / Hitboxes (optional)
};
