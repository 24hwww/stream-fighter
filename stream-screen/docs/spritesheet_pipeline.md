# Procedural vs Spritesheet Pipeline Comparison

## Overview
This document compares the two rendering architectures implemented in the engine:
1.  **Procedural Runtime**: Real-time generation of frames using `PixelBuffer` and CPU-based composition (`ArcadeEngine`).
2.  **Spritesheet Playback**: Pre-rendering frames to a texture atlas (`generate-spritesheet.mjs`) and playing them via WebGL/Canvas (`Phaser`).

## 1. Performance Metircs

| Metric | Procedural Runtime (CPU) | Spritesheet Playback (GPU) |
| :--- | :--- | :--- |
| **CPU Usage** | High (Per-frame buffer composition) | Low (Only logic updates) |
| **GPU Usage** | Low (Texture upload only) | Moderate (WebGL draw calls) |
| **Memory** | Low (Stores only templates) | Higher (Stores full texture atlas) |
| **Scalability** | O(N) cost per fighter. Slows down with >2 fighters. | O(1) mostly. Very cheap for many fighters. |
| **Flexibility** | Extreme. Can change colors/parts per frame. | Rigid. Requires re-generation for changes. |

## 2. Implementation Pipeline

### PROCEDURAL (Current Server-Side)
- **Input**: ASCII Templates + Poses
- **Process**: 
  1. `PartGenerator` creates parts.
  2. `ArcadeEngine` clears buffer.
  3. Composes parts based on Z-layer and Pivot.
  4. Flushes buffer to Canvas/FFmpeg.
- **Best Use**: Server-side video generation (FFmpeg input), Dynamic characters (Clothing changes).

### SPRITESHEET (Client-Side Optimization)
- **Input**: `scripts/generate-spritesheet.mjs`
- **Process**:
  1. Node.js script iterates all Poses.
  2. Renders composite frames to single PNG Atlas.
  3. Outputs JSON metadata (Aseprite/Phaser format).
  4. Phaser loads Atlas and plays animations.
- **Best Use**: Browser/Client gameplay, Mobile, High FPS.

## 3. Recommendation

**Hybrid Approach**:
- Use **Procedural** on the **Server** to generate the stream. Since the server controls the "Truth" and has high CPU power but no GPU, the software rasterizer (`PixelBuffer`) is robust.
- Use **Spritesheets** on the **Client (Browser)** if pure performance is needed (e.g. 60fps on mobile). However, for this project's unique constraint (Server-Side Stream is the game), the **Procedural** engine is critical.

The **Spritesheet Generator** is an excellent tool for debugging animations and creating marketing assets, or if we decide to move rendering fully to the client.

## 4. Optimization Strategies
1. **Template Caching**: `PartGenerator` now caches parsed bitmaps. Critical for Procedural speed.
2. **Dirty Rectangles**: Only update the pixel buffer where characters moved (Not yet implemented, high potential).
3. **Integer Math**: The engine uses strict integer alignment (3x scale) to avoid sub-pixel anti-aliasing artifacts.
