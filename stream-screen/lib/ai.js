import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const aiModel = openrouter(process.env.OPENROUTER_MODEL?.split(',')[0] || 'mistralai/mistral-large-2411');

export const DESIGNS = [
  {
    type: "MERC",
    design: {
      metadata: { base_sprite_size: 128 },
      color_system: {
        palette: {
          skin_base: "#C27E6A", skin_dark: "#8B5441",
          jacket_base: "#5A854C", jacket_dark: "#3A552F",
          beanie_base: "#525266", beanie_dark: "#353545",
          gun_base: "#4A4A58", gun_mid: "#B8B0AB"
        },
        outline_color: "#111111"
      },
      body_structure: {
        HEAD: {
          z_order: 4,
          shapes: [
            { type: "circle", cx: 0, cy: -20, r: 12, color: "skin_base" },
            { type: "rect", x: -10, y: -30, w: 20, h: 10, color: "beanie_base" },
            { type: "rect", x: -6, y: -20, w: 4, h: 2, color: "skin_dark" }
          ]
        },
        TORSO: {
          z_order: 3,
          shapes: [
            { type: "rect", x: -12, y: -10, w: 24, h: 25, color: "jacket_base" },
            { type: "rect", x: -12, y: 5, w: 24, h: 4, color: "beanie_dark" }
          ]
        },
        ARM_FRONT: {
          z_order: 5,
          shapes: [
            { type: "rect", x: 0, y: 0, w: 15, h: 6, color: "jacket_base" },
            { type: "rect", x: 12, y: -4, w: 20, h: 12, color: "gun_base" },
            { type: "rect", x: 30, y: -2, w: 10, h: 4, color: "gun_base" }
          ]
        },
        LEG_FRONT: {
          z_order: 2,
          shapes: [
            { type: "rect", x: -6, y: 15, w: 10, h: 18, color: "beanie_dark" },
            { type: "rect", x: -8, y: 30, w: 14, h: 6, color: "beanie_base" }
          ]
        }
      },
      animation_definitions: {
        IDLE: [
          { parts: { HEAD: { y: 0 }, TORSO: { y: 0 }, ARM_FRONT: { y: 0 }, LEG_FRONT: { y: 0 } } },
          { parts: { HEAD: { y: 1 }, TORSO: { y: 0.5 }, ARM_FRONT: { y: 1 }, LEG_FRONT: { y: 0 } } }
        ],
        PUNCH: [
          { parts: { HEAD: { x: -2 }, TORSO: { x: 4 }, ARM_FRONT: { x: 10, rotation: -5 }, LEG_FRONT: { x: 2 } } }
        ]
      }
    }
  },
  {
    type: "GUARD",
    design: {
      metadata: { base_sprite_size: 128 },
      color_system: {
        palette: {
          plate_base: "#42529E", plate_dark: "#2A3670",
          scarf_base: "#9A2A2A", scarf_dark: "#6B1A1A",
          hair_base: "#5A5A6D", skin_base: "#F2B897"
        },
        outline_color: "#0A0A0A"
      },
      body_structure: {
        HEAD: {
          z_order: 3,
          shapes: [
            { type: "circle", cx: 0, cy: -20, r: 11, color: "skin_base" },
            { type: "circle", cx: 0, cy: -25, r: 10, color: "hair_base" }
          ]
        },
        TORSO: {
          z_order: 2,
          shapes: [
            { type: "rect", x: -14, y: -10, w: 28, h: 30, color: "plate_base" },
            { type: "rect", x: -16, y: -12, w: 32, h: 8, color: "scarf_base" }
          ]
        },
        SHIELD: {
          z_order: 5,
          shapes: [
            { type: "rect", x: 10, y: -10, w: 15, h: 45, color: "plate_dark" },
            { type: "rect", x: 12, y: -8, w: 11, h: 41, color: "plate_base" }
          ]
        }
      },
      animation_definitions: {
        IDLE: [
          { parts: { HEAD: { y: 0 }, TORSO: { y: 0 }, SHIELD: { y: 0 } } },
          { parts: { HEAD: { y: 1 }, TORSO: { y: 0.5 }, SHIELD: { y: 1 } } }
        ],
        PUNCH: [
          { parts: { HEAD: { x: -3 }, TORSO: { x: 6 }, SHIELD: { x: 20, rotation: 10 } } }
        ]
      }
    }
  },
  {
    type: "TEAL",
    design: {
      metadata: { base_sprite_size: 128 },
      color_system: {
        palette: {
          hair_base: "#3AA296", hair_dark: "#22746B",
          dress_base: "#D9543A", skin_base: "#F2B897"
        },
        outline_color: "#1A1A1A"
      },
      body_structure: {
        HEAD: {
          z_order: 4,
          shapes: [
            { type: "circle", cx: 0, cy: -20, r: 14, color: "skin_base" },
            { type: "circle", cx: -14, cy: -30, r: 8, color: "hair_base" },
            { type: "circle", cx: 14, cy: -30, r: 8, color: "hair_base" },
            { type: "rect", x: -14, y: -25, w: 28, h: 10, color: "hair_base" }
          ]
        },
        TORSO: {
          z_order: 3,
          shapes: [
            { type: "polygon", points: [[-18, -5], [18, -5], [25, 25], [-25, 25]], color: "dress_base" }
          ]
        }
      },
      animation_definitions: {
        IDLE: [
          { parts: { HEAD: { rotation: -3 }, TORSO: { scale: 1 } } },
          { parts: { HEAD: { rotation: 3 }, TORSO: { scale: 1.02 } } }
        ],
        PUNCH: [
          { parts: { HEAD: { y: -8, scale: 1.1 }, TORSO: { y: -4 } } }
        ]
      }
    }
  },
  {
    type: "LION_KNIGHT",
    design: {
      metadata: { base_sprite_size: 128 },
      color_system: {
        palette: {
          armor_blue: "#42529E", armor_gold: "#D8983A",
          plume_red: "#9A2A2A", skin_pale: "#F2B897",
          steel_silver: "#B8B0AB", beard_brown: "#5A3A22"
        },
        outline_color: "#050510"
      },
      body_structure: {
        HEAD: {
          z_order: 5,
          shapes: [
            { type: "circle", cx: 0, cy: -22, r: 10, color: "armor_blue" }, // Helmet
            { type: "rect", x: -4, y: -24, w: 8, h: 4, color: "armor_gold" }, // Visor
            { type: "polygon", points: [[0, -32], [8, -40], [-8, -40]], color: "plume_red" }, // Plume
            { type: "rect", x: -6, y: -15, w: 12, h: 5, color: "beard_brown" } // Beard
          ]
        },
        TORSO: {
          z_order: 3,
          shapes: [
            { type: "rect", x: -15, y: -10, w: 30, h: 35, color: "armor_blue" },
            { type: "rect", x: -15, y: -10, w: 30, h: 5, color: "armor_gold" } // Collar
          ]
        },
        SWORD: {
          z_order: 6,
          shapes: [
            { type: "rect", x: 15, y: -5, w: 25, h: 6, color: "steel_silver" }, // Blade
            { type: "rect", x: 12, y: -8, w: 4, h: 12, color: "armor_gold" }    // Hilt
          ]
        },
        SHIELD: {
          z_order: 4,
          shapes: [
            { type: "polygon", points: [[-25, -5], [-10, -5], [-10, 25], [-17.5, 35], [-25, 25]], color: "armor_blue" },
            { type: "circle", cx: -17.5, cy: 10, r: 4, color: "armor_gold" } // Lion emblem placeholder
          ]
        },
        LEG_FRONT: {
          z_order: 2,
          shapes: [
            { type: "rect", x: -10, y: 25, w: 10, h: 15, color: "armor_blue" }
          ]
        }
      },
      animation_definitions: {
        IDLE: [
          { parts: { HEAD: { y: 0 }, TORSO: { y: 0 }, SWORD: { rotation: 0 }, SHIELD: { x: 0 } } },
          { parts: { HEAD: { y: 1 }, TORSO: { y: 0.5 }, SWORD: { rotation: 5 }, SHIELD: { x: -1 } } }
        ],
        PUNCH: [
          { parts: { HEAD: { x: 2 }, TORSO: { x: 5 }, SWORD: { x: 20, rotation: -45 }, SHIELD: { x: -5 } } }
        ]
      }
    }
  },
  {
    type: "NINJA",
    design: {
      metadata: { base_sprite_size: 128 },
      color_system: {
        palette: {
          cloth_dark: "#2A2A3D", cloth_mid: "#3D3D52",
          mask_red: "#8A2A2A", skin_tan: "#D4A574",
          blade_steel: "#C0C0D0", blade_dark: "#707080"
        },
        outline_color: "#0A0A0A"
      },
      body_structure: {
        HEAD: {
          z_order: 5,
          shapes: [
            { type: "circle", cx: 0, cy: -22, r: 9, color: "skin_tan" },
            { type: "rect", x: -8, y: -26, w: 16, h: 10, color: "cloth_dark" }, // Hood
            { type: "rect", x: -7, y: -18, w: 14, h: 6, color: "mask_red" } // Mask
          ]
        },
        TORSO: {
          z_order: 3,
          shapes: [
            { type: "rect", x: -12, y: -8, w: 24, h: 28, color: "cloth_dark" },
            { type: "rect", x: -10, y: 0, w: 20, h: 3, color: "mask_red" } // Belt
          ]
        },
        KATANA: {
          z_order: 6,
          shapes: [
            { type: "rect", x: 12, y: -8, w: 30, h: 4, color: "blade_steel" },
            { type: "rect", x: 10, y: -10, w: 6, h: 8, color: "cloth_dark" } // Handle
          ]
        },
        LEG_FRONT: {
          z_order: 2,
          shapes: [
            { type: "rect", x: -8, y: 20, w: 9, h: 18, color: "cloth_dark" }
          ]
        }
      },
      animation_definitions: {
        IDLE: [
          { parts: { HEAD: { y: 0 }, TORSO: { y: 0 }, KATANA: { rotation: -15 }, LEG_FRONT: { y: 0 } } },
          { parts: { HEAD: { y: 0.5 }, TORSO: { y: 0.5 }, KATANA: { rotation: -10 }, LEG_FRONT: { y: 0 } } }
        ],
        PUNCH: [
          { parts: { HEAD: { x: 3 }, TORSO: { x: 8 }, KATANA: { x: 25, rotation: -60 }, LEG_FRONT: { x: 4 } } }
        ]
      }
    }
  },
  {
    type: "MAGE",
    design: {
      metadata: { base_sprite_size: 128 },
      color_system: {
        palette: {
          robe_purple: "#6A3D9A", robe_dark: "#4A2A6A",
          orb_cyan: "#3AAAC2", orb_bright: "#5ADDFF",
          skin_pale: "#E8D4C8", beard_white: "#D0D0D8"
        },
        outline_color: "#1A0A2A"
      },
      body_structure: {
        HEAD: {
          z_order: 4,
          shapes: [
            { type: "circle", cx: 0, cy: -24, r: 11, color: "skin_pale" },
            { type: "polygon", points: [[-10, -32], [0, -40], [10, -32], [8, -24], [-8, -24]], color: "robe_purple" }, // Hat
            { type: "rect", x: -8, y: -18, w: 16, h: 6, color: "beard_white" }
          ]
        },
        TORSO: {
          z_order: 2,
          shapes: [
            { type: "polygon", points: [[-16, -8], [16, -8], [20, 30], [-20, 30]], color: "robe_purple" },
            { type: "rect", x: -14, y: 5, w: 28, h: 4, color: "robe_dark" } // Belt
          ]
        },
        STAFF: {
          z_order: 5,
          shapes: [
            { type: "rect", x: 15, y: -35, w: 4, h: 50, color: "robe_dark" }, // Staff
            { type: "circle", cx: 17, cy: -38, r: 6, color: "orb_cyan" }, // Orb
            { type: "circle", cx: 17, cy: -38, r: 3, color: "orb_bright" } // Orb glow
          ]
        }
      },
      animation_definitions: {
        IDLE: [
          { parts: { HEAD: { y: 0 }, TORSO: { y: 0 }, STAFF: { y: 0, rotation: 5 } } },
          { parts: { HEAD: { y: 1 }, TORSO: { y: 0.5 }, STAFF: { y: -2, rotation: 0 } } }
        ],
        PUNCH: [
          { parts: { HEAD: { y: -2 }, TORSO: { x: 3 }, STAFF: { x: 10, y: -5, rotation: -30 } } }
        ]
      }
    }
  },
  {
    type: "BARBARIAN",
    design: {
      metadata: { base_sprite_size: 128 },
      color_system: {
        palette: {
          skin_tan: "#C8956A", skin_dark: "#9A6A42",
          fur_brown: "#5A3A22", leather_dark: "#3A2A1A",
          axe_steel: "#A0A0B0", axe_wood: "#6A4A2A"
        },
        outline_color: "#0A0A0A"
      },
      body_structure: {
        HEAD: {
          z_order: 4,
          shapes: [
            { type: "circle", cx: 0, cy: -22, r: 12, color: "skin_tan" },
            { type: "rect", x: -10, y: -28, w: 20, h: 8, color: "fur_brown" }, // Fur helmet
            { type: "rect", x: -8, y: -16, w: 16, h: 8, color: "fur_brown" } // Beard
          ]
        },
        TORSO: {
          z_order: 3,
          shapes: [
            { type: "rect", x: -16, y: -10, w: 32, h: 32, color: "skin_tan" }, // Bare chest
            { type: "rect", x: -14, y: 8, w: 28, h: 6, color: "leather_dark" } // Belt
          ]
        },
        AXE: {
          z_order: 6,
          shapes: [
            { type: "rect", x: 12, y: -15, w: 6, h: 35, color: "axe_wood" }, // Handle
            { type: "polygon", points: [[18, -18], [35, -12], [35, -8], [18, -2]], color: "axe_steel" }, // Blade
            { type: "polygon", points: [[18, -2], [35, 2], [35, 6], [18, 0]], color: "axe_steel" } // Blade bottom
          ]
        },
        LEG_FRONT: {
          z_order: 2,
          shapes: [
            { type: "rect", x: -10, y: 22, w: 12, h: 16, color: "leather_dark" }
          ]
        }
      },
      animation_definitions: {
        IDLE: [
          { parts: { HEAD: { y: 0 }, TORSO: { y: 0 }, AXE: { rotation: 10 }, LEG_FRONT: { y: 0 } } },
          { parts: { HEAD: { y: 1 }, TORSO: { y: 0.5 }, AXE: { rotation: 15 }, LEG_FRONT: { y: 0 } } }
        ],
        PUNCH: [
          { parts: { HEAD: { x: 4 }, TORSO: { x: 8 }, AXE: { x: 20, rotation: -50 }, LEG_FRONT: { x: 3 } } }
        ]
      }
    }
  },
  {
    type: "ARCHER",
    design: {
      metadata: { base_sprite_size: 128 },
      color_system: {
        palette: {
          leather_green: "#4A6A3A", leather_dark: "#2A4A1A",
          skin_fair: "#E8C8A8", hair_blonde: "#D8B870",
          bow_wood: "#8A6A4A", string_white: "#D0D0D0"
        },
        outline_color: "#0A0A0A"
      },
      body_structure: {
        HEAD: {
          z_order: 4,
          shapes: [
            { type: "circle", cx: 0, cy: -22, r: 10, color: "skin_fair" },
            { type: "circle", cx: 0, cy: -28, r: 9, color: "hair_blonde" }, // Hair
            { type: "rect", x: -8, y: -26, w: 16, h: 6, color: "leather_green" } // Hood
          ]
        },
        TORSO: {
          z_order: 3,
          shapes: [
            { type: "rect", x: -13, y: -10, w: 26, h: 30, color: "leather_green" },
            { type: "rect", x: -11, y: 0, w: 22, h: 3, color: "leather_dark" } // Belt
          ]
        },
        BOW: {
          z_order: 5,
          shapes: [
            { type: "polygon", points: [[12, -20], [18, -25], [20, -20], [20, 10], [18, 15], [12, 10]], color: "bow_wood" },
            { type: "rect", x: 18, y: -20, w: 1, h: 30, color: "string_white" } // String
          ]
        },
        QUIVER: {
          z_order: 2,
          shapes: [
            { type: "rect", x: -18, y: -5, w: 8, h: 20, color: "leather_dark" }
          ]
        },
        LEG_FRONT: {
          z_order: 2,
          shapes: [
            { type: "rect", x: -8, y: 20, w: 10, h: 18, color: "leather_dark" }
          ]
        }
      },
      animation_definitions: {
        IDLE: [
          { parts: { HEAD: { y: 0 }, TORSO: { y: 0 }, BOW: { rotation: 5 }, QUIVER: { y: 0 }, LEG_FRONT: { y: 0 } } },
          { parts: { HEAD: { y: 0.5 }, TORSO: { y: 0.5 }, BOW: { rotation: 0 }, QUIVER: { y: 0.5 }, LEG_FRONT: { y: 0 } } }
        ],
        PUNCH: [
          { parts: { HEAD: { x: -2 }, TORSO: { x: 2 }, BOW: { x: 15, rotation: -45 }, QUIVER: { x: 1 }, LEG_FRONT: { x: 1 } } }
        ]
      }
    }
  }
];

const STAGES = [
  { skyColor: "#1a1a2e", groundLight: "#16213e", groundDark: "#0f3460", type: "CITY" },
  { skyColor: "#45a29e", groundLight: "#1f2833", groundDark: "#0b0c10", type: "GRID" },
  { skyColor: "#ff4d4d", groundLight: "#330000", groundDark: "#1a0000", type: "CASTLE" },
  { skyColor: "#87CEEB", groundLight: "#F0E68C", groundDark: "#BDB76B", type: "DESERT" }
];

export async function generateNewPoll(categoryName = "General") {
  try {
    const { text } = await generateText({
      model: aiModel,
      system: `You are a creative writer for a fighting game. 
      Generate two iconic fighter names and select a visual archetype for each:
      0=MERC (tactical soldier), 1=GUARD (knight), 2=TEAL (support), 3=LION_KNIGHT (royal knight),
      4=NINJA (stealth assassin), 5=MAGE (wizard), 6=BARBARIAN (berserker), 7=ARCHER (ranger)
      Also pick a stage type index (0=CITY, 1=GRID, 2=CASTLE, 3=DESERT).
      Format: JSON { "nameA": "...", "typeA": 0-7, "nameB": "...", "typeB": 0-7, "stageIdx": 0-3 }`,
      prompt: `Generate a matchup for category: ${categoryName}. Characters should be high-contrast rivals.`,
      responseFormat: { type: 'json' }
    });

    const aiData = JSON.parse(text);

    const charA = DESIGNS[aiData.typeA % DESIGNS.length];
    const charB = DESIGNS[aiData.typeB % DESIGNS.length];
    const stage = STAGES[aiData.stageIdx % STAGES.length];

    return {
      optionA: {
        name: aiData.nameA,
        design: charA.design
      },
      optionB: {
        name: aiData.nameB,
        design: charB.design
      },
      stage: stage
    };
  } catch (error) {
    console.error("AI Name generation failed, using procedural fallback:", error);
    // Fallback to purely procedural if AI fails
    const seed = Date.now();
    const charA = DESIGNS[seed % DESIGNS.length];
    const charB = DESIGNS[(seed + 1) % DESIGNS.length];
    return {
      optionA: { name: "Warrior A", design: charA.design },
      optionB: { name: "Warrior B", design: charB.design },
      stage: STAGES[0]
    };
  }
}