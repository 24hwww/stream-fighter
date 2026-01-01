import { PartGenerator } from '../sprites/generator.js';
import { Palette } from '../sprites/palette.js';

/**
 * Anatomy
 * Defines the logical parts of a fighter.
 * Higher-level abstraction that composes generated sprites.
 */
export class Anatomy {
    static createFighter(team = 'red') {
        const SCALE = 2;

        // Personaje estilo Bruce Lee (sin camisa, pantalón oscuro)
        if (team === 'red') {
            const skinRamp = {
                base: Palette.BRAWLER_SKIN,
                shadow: Palette.BRAWLER_SHADOW,
                highlight: Palette.BRAWLER_HIGHLIGHT,
                outline: Palette.BRAWLER_OUTLINE,
                detail: Palette.BRAWLER_HAIR
            };

            const torsoRamp = {
                base: Palette.BRAWLER_SKIN,
                shadow: Palette.BRAWLER_SHADOW,
                highlight: Palette.BRAWLER_HIGHLIGHT,
                outline: Palette.BRAWLER_OUTLINE,
                detail: Palette.BRAWLER_DETAIL
            };

            const pantsRamp = {
                base: Palette.PANTS_DARK,
                shadow: Palette.BRAWLER_OUTLINE,
                highlight: Palette.PANTS_LIGHT,
                outline: Palette.BRAWLER_OUTLINE,
                detail: Palette.RED_MID
            };

            return {
                hair: PartGenerator.generateFromTemplate('HAIR_SPIKY', skinRamp, SCALE),
                head: PartGenerator.generateFromTemplate('HEAD', skinRamp, SCALE),
                torso: PartGenerator.generateFromTemplate('TORSO', torsoRamp, SCALE),
                arm_L: PartGenerator.generateFromTemplate('ARM_FULL', skinRamp, SCALE),
                arm_R: PartGenerator.generateFromTemplate('ARM_FULL', skinRamp, SCALE),
                leg_L: PartGenerator.generateFromTemplate('LEG_FULL', pantsRamp, SCALE),
                leg_R: PartGenerator.generateFromTemplate('LEG_FULL', pantsRamp, SCALE),
            };
        }
        // Personaje estilo Karateka (gi blanco, sombrero cónico)
        else {
            const skinRamp = {
                base: Palette.BRAWLER_SKIN,
                shadow: Palette.BRAWLER_SHADOW,
                highlight: Palette.BRAWLER_HIGHLIGHT,
                outline: Palette.BRAWLER_OUTLINE,
                detail: Palette.BRAWLER_HAIR
            };

            const giRamp = {
                base: Palette.GI_WHITE,
                shadow: Palette.GI_SHADOW,
                highlight: Palette.WHITE,
                outline: Palette.BRAWLER_OUTLINE,
                detail: Palette.BLUE_MID
            };

            const hatRamp = {
                base: Palette.HAT_BROWN,
                shadow: Palette.HAT_DARK,
                highlight: Palette.BRAWLER_HIGHLIGHT,
                outline: Palette.BRAWLER_OUTLINE,
                detail: Palette.HAT_DARK
            };

            return {
                hat: PartGenerator.generateFromTemplate('HAT_CONICAL', hatRamp, SCALE),
                head: PartGenerator.generateFromTemplate('HEAD', skinRamp, SCALE),
                torso: PartGenerator.generateFromTemplate('TORSO', giRamp, SCALE),
                arm_L: PartGenerator.generateFromTemplate('ARM_FULL', giRamp, SCALE),
                arm_R: PartGenerator.generateFromTemplate('ARM_FULL', giRamp, SCALE),
                leg_L: PartGenerator.generateFromTemplate('LEG_FULL', giRamp, SCALE),
                leg_R: PartGenerator.generateFromTemplate('LEG_FULL', giRamp, SCALE),
            };
        }
    }

    // Ultra-minimalist characters for direct programmatic rendering
    static createMinimalistFighter() {
        // Fighter: shirtless with spiky hair, arms extended forward
        // Limited to 5 colors: skin, black hair, dark pants, black outline, highlight
        const SCALE = 1; // No scaling for pixel-perfect rendering

        const fighterRamp = {
            base: Palette.BRAWLER_SKIN,      // Skin tone (light beige/orange-brown)
            shadow: Palette.BRAWLER_SHADOW,   // Skin shadow
            highlight: Palette.BRAWLER_HIGHLIGHT, // Skin highlight
            outline: Palette.BRAWLER_OUTLINE, // Black outlines
            detail: Palette.BRAWLER_HAIR      // Black hair
        };

        return {
            sprite: PartGenerator.generateFromTemplate('FIGHTER_MINIMALIST', fighterRamp, SCALE)
        };
    }

    static createMinimalistMonk() {
        // Monk: white gi with conical hat, defensive stance
        // Limited to 5 colors: skin, white gi, brown hat, black outline, hat shadow
        const SCALE = 1; // No scaling for pixel-perfect rendering

        const monkRamp = {
            base: Palette.GI_WHITE,            // Gi white (base body)
            shadow: Palette.HAT_DARK,          // Hat shadow / gi shadow
            highlight: Palette.BRAWLER_SKIN,   // Skin tone
            outline: Palette.BRAWLER_OUTLINE,  // Black outlines
            detail: Palette.HAT_BROWN          // Brown hat
        };

        return {
            sprite: PartGenerator.generateFromTemplate('MONK_MINIMALIST', monkRamp, SCALE)
        };
    }
}