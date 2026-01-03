/**
 * Poses
 * Defines the relative position and rotation of anatomical parts for each state.
 * Units are in relative pixels and discrete rotations.
 */
export const Poses = {
    IDLE: [
        // Frame 1: Neutral
        {
            duration: 10,
            parts: {
                hair: { ox: 0, oy: -80, rot: 0 },
                hat: { ox: 0, oy: -95, rot: 0 },
                head: { ox: 0, oy: -75, rot: 0 },
                torso: { ox: 0, oy: -75, rot: 0 },
                arm_L: { ox: -20, oy: -65, rot: 5 },
                arm_R: { ox: 20, oy: -65, rot: -5 },
                leg_L: { ox: -8, oy: -38, rot: 0 },
                leg_R: { ox: 8, oy: -38, rot: 0 }
            }
        },
        // Frame 2: Slight Dip
        {
            duration: 10,
            parts: {
                hair: { ox: 0, oy: -79, rot: 0 },
                hat: { ox: 0, oy: -94, rot: 0 },
                head: { ox: 0, oy: -74, rot: 0 },
                torso: { ox: 0, oy: -74, rot: 0 },
                arm_L: { ox: -20, oy: -64, rot: 7 },
                arm_R: { ox: 20, oy: -64, rot: -7 },
                leg_L: { ox: -8, oy: -38, rot: 0 },
                leg_R: { ox: 8, oy: -38, rot: 0 }
            }
        },
        // Frame 3: Low Point (Breathe out)
        {
            duration: 10,
            parts: {
                hair: { ox: 0, oy: -78, rot: 0 },
                hat: { ox: 0, oy: -93, rot: 0 },
                head: { ox: 0, oy: -73, rot: 0 },
                torso: { ox: 0, oy: -73, rot: 0 },
                arm_L: { ox: -20, oy: -63, rot: 10 },
                arm_R: { ox: 20, oy: -63, rot: -10 },
                leg_L: { ox: -9, oy: -38, rot: 0 }, // Slight widen
                leg_R: { ox: 9, oy: -38, rot: 0 }
            }
        },
        // Frame 4: Rise back
        {
            duration: 10,
            parts: {
                hair: { ox: 0, oy: -79, rot: 0 },
                hat: { ox: 0, oy: -94, rot: 0 },
                head: { ox: 0, oy: -74, rot: 0 },
                torso: { ox: 0, oy: -74, rot: 0 },
                arm_L: { ox: -20, oy: -64, rot: 7 },
                arm_R: { ox: 20, oy: -64, rot: -7 },
                leg_L: { ox: -8, oy: -38, rot: 0 },
                leg_R: { ox: 8, oy: -38, rot: 0 }
            }
        }
    ],
    PUNCH: [
        // Frame 1: Anticipation (Pull back)
        {
            duration: 4,
            parts: {
                hair: { ox: -2, oy: -80, rot: -3 },
                hat: { ox: -2, oy: -95, rot: -3 },
                head: { ox: -2, oy: -75, rot: -3 },
                torso: { ox: -5, oy: -75, rot: -5 },
                arm_L: { ox: -28, oy: -65, rot: -20 }, // Cocked back
                arm_R: { ox: 18, oy: -65, rot: -5 },
                leg_L: { ox: -8, oy: -38, rot: 0 },
                leg_R: { ox: 10, oy: -38, rot: 0 }
            }
        },
        // Frame 2: Strike (Extension)
        {
            duration: 6,
            parts: {
                hair: { ox: 5, oy: -80, rot: 2 },
                hat: { ox: 5, oy: -95, rot: 2 },
                head: { ox: 5, oy: -75, rot: 2 },
                torso: { ox: 10, oy: -75, rot: 8 }, // Leaning in
                arm_L: { ox: 45, oy: -70, rot: 85 }, // Extended
                arm_R: { ox: 12, oy: -65, rot: -20 }, // Guarding
                leg_L: { ox: -5, oy: -38, rot: 0 },
                leg_R: { ox: 12, oy: -38, rot: 5 }
            }
        },
        // Frame 3: Hold (Impact)
        {
            duration: 4,
            parts: {
                hair: { ox: 6, oy: -80, rot: 3 },
                hat: { ox: 6, oy: -95, rot: 3 },
                head: { ox: 6, oy: -75, rot: 3 },
                torso: { ox: 12, oy: -75, rot: 10 },
                arm_L: { ox: 48, oy: -70, rot: 85 },
                arm_R: { ox: 12, oy: -65, rot: -20 },
                leg_L: { ox: -5, oy: -38, rot: 0 },
                leg_R: { ox: 12, oy: -38, rot: 5 }
            }
        },
        // Frame 4: Recovery (Returning)
        {
            duration: 5,
            parts: {
                hair: { ox: 0, oy: -80, rot: 0 },
                hat: { ox: 0, oy: -95, rot: 0 },
                head: { ox: 0, oy: -75, rot: 0 },
                torso: { ox: 5, oy: -75, rot: 5 },
                arm_L: { ox: 10, oy: -65, rot: 40 },
                arm_R: { ox: 18, oy: -65, rot: -10 },
                leg_L: { ox: -8, oy: -38, rot: 0 },
                leg_R: { ox: 10, oy: -38, rot: 0 }
            }
        }
    ],
};

// Ultra-minimalist character poses (single sprite positioning)
Poses.FIGHTER_PROJECTILE = [
    {
        duration: 1, // Static pose
        parts: {
            sprite: { ox: 0, oy: 0, rot: 0 } // Centered, no offset
        }
    }
];

Poses.MONK_DEFENSIVE = [
    {
        duration: 1, // Static pose
        parts: {
            sprite: { ox: 0, oy: 0, rot: 0 } // Centered, no offset
        }
    }
];

// Aliases for FighterState (assigned after initialization to avoid ReferenceError)
Poses.IDLE_P1 = Poses.IDLE;
Poses.IDLE_P2 = Poses.IDLE;
Poses.ATTACK = Poses.PUNCH;
Poses.HIT = Poses.IDLE; // Placeholder

// Also export as a constant for easy lookup
Poses.get = (name) => Poses[name.toUpperCase()] || Poses.IDLE;