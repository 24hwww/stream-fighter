import { PixelTypes } from './pixelTypes.js';

/**
 * FighterTemplates
 * Formalized sprite definitions with metadata.
 * Implements "Brawler" character style.
 */
export const FighterTemplates = {
    HEAD: {
        bitmap: [
            "......#####......",
            "....##DDDDD##....",
            "...#DDDDDDDDD#...",
            "..#DDDDDDDDDDD#..",
            ".#DDDDDDDDDDDDD#.",
            "#DDDDDDDDDDDDDDD#",
            "#DDDDDDDDDDDDDDD#",
            "#BBBB##DDD##BBBB#",
            "#BBB#HH#D#HH#BBB#",
            "#BBB########BBB##",
            ".#BBBBBBBBBBBBB#.",
            ".#BBBB#BBB#BBBB#.",
            "..#BBBBB#BBBBB#..",
            "...##BBBBBBB##...",
            "....#########...."
        ],
        pivot: { x: 8, y: 14 }, // Bottom center
        z: 2
    },
    TORSO: {
        bitmap: [
            "......######......",
            ".....########.....",
            "....##BBBBBB##....",
            "...#BBBBHHBBBB#...",
            "..#BBBBHHHHBBBB#..",
            ".#BBBBHHHHHHBBBB#.",
            "#BBBBBBHHHHBBBBBB#",
            "#BBBBBBBBBBBBBBBB#",
            "#BBBBBBSSSSBBBBBB#",
            ".#BBBBSSSSSBBBB#.",
            "..#BBBBSSSBBB##...",
            "...##BBBBBBB#.....",
            "....###BBB##......",
            ".....#####........"
        ],
        pivot: { x: 8, y: 2 }, // Neck connection
        z: 1
    },
    ARM_FULL: {
        // Concatenated UPPER and LOWER for modular simplicity in current engine
        bitmap: [
            "....#####....",
            "...#BBBBB#...",
            "..#BBBHBBB#..",
            ".#BBBHHBBBB#.",
            "#BBBBBHBBBB#.",
            "#BBBBBBBBBS#.",
            ".#BBBBBBSS#..",
            "..#BBBBBS#...",
            "...#####.....", // Elbow joint
            "...####......",
            "..#BBBB#.....",
            ".#BBBHBB#....",
            "#BBBBBBBB#...",
            "#BBBBBBBSS#..",
            ".#BBBBBS#....",
            "..######.....",
            "...#####.....",
            "....###......"
        ],
        pivot: { x: 6, y: 3 }, // Shoulder
        z: 3
    },
    LEG_FULL: {
        // Concatenated THIGH and SHIN
        bitmap: [
            "....######....",
            "...#DDDDDD#...",
            "..#DDDDDDDD#..",
            ".#DDDDDDDDDD#.",
            "#DDDDHHDDDDDD#",
            "#DDDDDDDDDDDS#",
            "#DDDDDDDDDDSS#",
            ".#DDDDDDDDS#..",
            "..#DDDDDDSS#..",
            "...#######....", // Knee Joint
            "...######.....",
            "..#BBBBBB#....",
            ".#BBBHBBBB#...",
            "#BBBBBBBBBB#..",
            "#BBBBBBBBBSS#.",
            ".#BBBBBBBS#...",
            "..#BBBBSS#....",
            "...#####......",
            "....###......."
        ],
        pivot: { x: 7, y: 2 }, // Hip
        z: 0
    },
    
    // Additional template for hat/headgear
    HAT_CONICAL: {
        bitmap: [
            ".........#.........",
            "........###........",
            ".......#####.......",
            "......#######......",
            ".....#########.....",
            "....###########....",
            "...#############...",
            "..###############..",
            ".#################.",
            "###################",
            "###DDDDDDDDDDDDD###",
            "##DDDDDDDDDDDDDDD##",
            "#DDDDDDDDDDDDDDDDD#",
            "###SSSSSSSSSSSSS###",
            "..#################"
        ],
        pivot: { x: 9, y: 14 },
        z: 3
    },
    
    // Hair template
    HAIR_SPIKY: {
        bitmap: [
            "....###....###....",
            "...#####..#####...",
            "..###############.",
            ".###############..",
            "#################.",
            "##################",
            "#################.",
            ".###############..",
            "..#############...",
            "...###########...."
        ],
        pivot: { x: 9, y: 9 },
        z: 1
    },

    // Ultra-minimalist Character 1: Fighter (shirtless, projectile pose)
    // 16x24 pixels - geometric blocks only, limited colors
    FIGHTER_MINIMALIST: {
        bitmap: [
            ".....###.....", // Spiky hair top
            "....#####....",
            "...#######...",
            "..###...###..",
            ".##.....##..", // Head block
            ".#.......#..",
            ".#.......#..",
            ".#.......#..",
            ".#.......#..",
            ".##.....##..",
            "..###...###..",
            "...#######...", // Torso (skin)
            "...#######...",
            "...#######...",
            "...#######...",
            "...#######...",
            "...#######...",
            "...#######...",
            "...#######...",
            "...#######...",
            "..##.....##..", // Arms extended
            "..##.....##..",
            "..##.....##..",
            "..##.....##..",
            "..##.....##..",
            "..##.....##..",
            "..##.....##..",
            "..##.....##..",
            "...#.....#...", // Hands
            "............"
        ],
        pivot: { x: 6, y: 23 }, // Bottom center
        z: 1
    },

    // Ultra-minimalist Character 2: Monk (conical hat, defensive pose)
    // 16x28 pixels - geometric blocks only, limited colors
    // B = Base (white gi), D = Detail (brown hat), H = Highlight (skin), # = Outline (black)
    MONK_MINIMALIST: {
        bitmap: [
            "......D......", // Hat point (brown)
            ".....DDD.....",
            "....DDDDD....",
            "...DDDDDDD...",
            "..DDDDDDDDD..",
            ".DDDDDDDDDDD.",
            ".DDDDDDDDDDD.", // Hat base
            ".DDDDDDDDDDD.",
            ".DDDDDDDDDDD.",
            ".DDDDDDDDDDD.",
            "..DDDDDDDDD..",
            "...DDDDDDD...",
            "....DDDDD....",
            ".....DDD.....",
            "......D......", // Hat end
            ".....HHH.....", // Head (skin)
            "....HHHHH....",
            "...H#...#H...",
            "..#.....#....",
            "..#.....#....",
            "..#.....#....",
            "..#.....#....",
            "..#.....#....",
            "...H#...#H...",
            "....BBBBB....", // Gi top (white)
            "....BBBBB....",
            "....BBBBB....",
            "....BBBBB....",
            "....BBBBB....",
            "....BBBBB....",
            "....BBBBB....",
            "....BBBBB....",
            "....BBBBB....",
            "....BBBBB....",
            "....BBBBB....",
            "....BBBBB....",
            "...BBBBBBB...", // Gi bottom
            "....BBBBB....",
            ".....BBB.....",
            "......B......"
        ],
        pivot: { x: 7, y: 27 }, // Bottom center
        z: 1
    }
};

/**
 * Parses ASCII template into semantic pixel buffer
 */
export function parseTemplate(templateDef) {
    const { bitmap } = templateDef;
    const height = bitmap.length;
    const width = bitmap[0].length;
    const data = new Int32Array(width * height);

    const mapping = {
        '.': PixelTypes.TRANSPARENT,
        '#': PixelTypes.OUTLINE,
        'B': PixelTypes.BASE,
        'S': PixelTypes.SHADOW,
        'H': PixelTypes.HIGHLIGHT,
        'D': PixelTypes.DETAIL
    };

    for (let y = 0; y < height; y++) {
        const row = bitmap[y];
        for (let x = 0; x < width; x++) {
            const char = row[x];
            data[y * width + x] = mapping[char] !== undefined ? mapping[char] : PixelTypes.BASE;
        }
    }

    return {
        width,
        height,
        data,
        pivot: templateDef.pivot,
        z: templateDef.z
    };
}