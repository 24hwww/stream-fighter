/**
 * AI Generated Character: Blue Ninja (Manual Fallback)
 * Generated at: 2025-12-31T22:42:00.000Z
 */
export const AiGeneratedTemplates = {
    HEAD: {
        bitmap: [
            "......#####.......",
            ".....#DDDDD#......", // Hood
            "....#DDDDDDD#.....",
            "....#DD######.....", // Eye slit top
            "....#D#HHHHH#.....", // Skin/Eyes
            "....#DD######.....", // Mask bottom
            "....#DDDDDDD#.....",
            ".....#DDDDD#......",
            "......#####.......",
            ".......###........"  // Neck
        ],
        pivot: { x: 10, y: 10 },
        z: 2
    },
    TORSO: {
        bitmap: [
            "......#####.......", // Neck connection
            "....##BBBBB##.....", // Shoulders
            "...#BBBBBBBBB#....",
            "...#BBBBBBBBB#....",
            "...#BBBBBBBBB#....", // Chest
            "....#BB#####B#....",
            "....#BB#####B#....", // Belt area
            "....#BB#####B#....",
            "....##########....", // Black Belt
            "....##########...."
        ],
        pivot: { x: 10, y: 0 },
        z: 1
    },
    ARM_FULL: {
        bitmap: [
            ".....#####......",
            "....#HHHHH#.....", // Shoulder
            "....#HHHHH#.....",
            "....#HHHHH#.....",
            ".....#HHH#......", // Elbow
            ".....#DDD#......", // Gauntlet/Guard
            ".....#DDD#......",
            ".....#DDD#......",
            ".....#####......"  // Fist
        ],
        pivot: { x: 8, y: 2 },
        z: 3
    },
    LEG_FULL: {
        bitmap: [
            ".....#####......", // Hip
            "....#BBBBB#.....", // Thigh
            "....#BBBBB#.....",
            "....#BBBBB#.....",
            ".....#BBB#......", // Knee
            "....#BBBBB#.....", // Shin
            "....#BBBBB#.....",
            "....#BBBBB#.....",
            ".....#####......"  // Foot
        ],
        pivot: { x: 8, y: 1 },
        z: 0
    }
};
