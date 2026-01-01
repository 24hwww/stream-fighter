# Sprite Export System - README

## Overview
Professional pixel art sprite exporter for Stream Fighter. Generates pipeline-ready PNG assets from code-defined character data.

## Features
- ✅ **Pixel-Perfect Rendering**: `imageSmoothingEnabled = false`
- ✅ **Transparent Backgrounds**: Proper alpha channel
- ✅ **Metadata Generation**: JSON files for Phaser integration
- ✅ **Individual Frames**: Separate PNGs for each animation frame
- ✅ **Consistent Sizing**: Fixed grid alignment across all frames
- ✅ **Nearest-Neighbor Scaling**: No interpolation artifacts

## Pipeline Compatibility
- **Phaser**: Ready for `pixelArt: true` configuration
- **Akios-Canvas**: Compatible with `ctx.imageSmoothingEnabled = false`
- **spritesmith**: Correct dimensions and transparency for atlas generation
- **sharp**: Clean PNGs for server-side processing

## Usage

### Export All Characters
```bash
cd scripts
npm install
npm run export
```

### Output Structure
```
public/sprites/
├── ninja/
│   ├── ninja_idle_0.png
│   ├── ninja_idle_1.png
│   ├── ninja_attack_0.png
│   └── ninja_metadata.json
├── mage/
│   ├── mage_idle_0.png
│   ├── mage_idle_1.png
│   ├── mage_attack_0.png
│   └── mage_metadata.json
└── sprites_metadata.json (master file)
```

### Metadata Format
```json
{
  "character": "NINJA",
  "size": 64,
  "frames": {
    "IDLE": [
      { "file": "ninja_idle_0.png", "index": 0, "size": 64 },
      { "file": "ninja_idle_1.png", "index": 1, "size": 64 }
    ],
    "ATTACK": [
      { "file": "ninja_attack_0.png", "index": 0, "size": 64 }
    ]
  },
  "palette": {
    "cloth_dark": "#2A2A3D",
    "mask_red": "#8A2A2A",
    ...
  }
}
```

## Phaser Integration Example
```javascript
// Load spritesheet
this.load.image('ninja_idle_0', '/sprites/ninja/ninja_idle_0.png');
this.load.image('ninja_idle_1', '/sprites/ninja/ninja_idle_1.png');

// Configure for pixel art
this.game.config.pixelArt = true;
this.game.renderer.antialias = false;

// Create sprite
const ninja = this.add.sprite(x, y, 'ninja_idle_0');
ninja.setScale(2); // Integer scaling only

// Animate
this.anims.create({
  key: 'ninja_idle',
  frames: [
    { key: 'ninja_idle_0' },
    { key: 'ninja_idle_1' }
  ],
  frameRate: 8,
  repeat: -1
});
```

## Technical Specifications
- **Base Resolution**: 64x64 pixels (configurable)
- **Color Depth**: 24-bit RGB + 8-bit alpha
- **Format**: PNG with transparency
- **Scaling**: Designed for 2x, 3x, 4x integer multiples
- **Palette**: 6-8 colors per character
- **Outline**: 1px hard edges, no anti-aliasing

## Adding New Characters
1. Define character in `lib/ai.js` DESIGNS array
2. Import into `scripts/exportSprites.js`
3. Run `npm run export`
4. Sprites appear in `public/sprites/[character_name]/`

## Quality Checklist
- [ ] No anti-aliasing or smoothing
- [ ] Hard pixel edges only
- [ ] Transparent background (no artifacts)
- [ ] Consistent frame dimensions
- [ ] Integer-based coordinates
- [ ] Limited color palette
- [ ] Readable at 2x-4x scale
