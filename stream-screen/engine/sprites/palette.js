/**
 * 16-Bit Arcade Palette
 * Inspired by SF2 and classic CPS-1/2 games.
 * Limited to 32 colors for authentic retro feel.
 */
export const Palette = {
    // Basics
    TRANSPARENT: -1,
    BLACK: 0x000000,
    WHITE: 0xFFFFFF,

    // UI / Text
    YELLOW_BRIGHT: 0xFFFF00,
    YELLOW_DARK: 0xCCAA00,

    // Skin Ramps
    SKIN_LIGHT: 0xFFDBAC,
    SKIN_MID: 0xE0AC69,
    SKIN_DARK: 0x8D5524,

    // Brawler Palette (User Provided)
    BRAWLER_SKIN: 0xE0AC69,
    BRAWLER_SHADOW: 0x8D5524,
    BRAWLER_HIGHLIGHT: 0xFFDBAC,
    BRAWLER_OUTLINE: 0x000000,
    BRAWLER_DETAIL: 0xFFFFFF, // Wraps
    BRAWLER_HAIR: 0x1a1a1a, // Black hair
    
    // Clothing colors
    PANTS_DARK: 0x2a2a3a,
    PANTS_LIGHT: 0x3a3a4a,
    GI_WHITE: 0xf0f0f0,
    GI_SHADOW: 0xc0c0c0,
    HAT_BROWN: 0x8B6239,
    HAT_DARK: 0x5a4020,

    // Red Team (Player 1)
    RED_LIGHT: 0xFF5555,
    RED_MID: 0xCC0000,
    RED_DARK: 0x660000,
    RED_OUTLINE: 0x220000,

    // Blue Team (Player 2)
    BLUE_LIGHT: 0x5555FF,
    BLUE_MID: 0x0000CC,
    BLUE_DARK: 0x000066,
    BLUE_OUTLINE: 0x000022,

    // Stage / Background
    SKY_TOP: 0x050510,
    SKY_BOTTOM: 0x201040,
    GROUND_LIGHT: 0x444444,
    GROUND_MID: 0x222222,
    GROUND_DARK: 0x111111,

    // Special Effects
    HIT_FLASH: 0xFFFFFF,
    CHISEL_GOLD: 0xFFCC33,
};

/**
 * Returns RGB components for a hex color
 */
export function hexToRgb(hex) {
    if (hex === -1) return [0, 0, 0, 0];
    return [
        (hex >> 16) & 0xFF,
        (hex >> 8) & 0xFF,
        hex & 0xFF
    ];
}