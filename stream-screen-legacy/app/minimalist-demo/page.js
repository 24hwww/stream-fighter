"use client";
import { useEffect, useRef } from 'react';

// Import the minimalist character generation functions
import { Anatomy } from '../../engine/characters/anatomy.js';
import { Poses } from '../../engine/characters/poses.js';
import { Palette } from '../../engine/sprites/palette.js';

export default function MinimalistDemo() {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        canvas.width = 400;
        canvas.height = 300;

        // Set light grey background (RGB: 230, 230, 230)
        ctx.fillStyle = 'rgb(230, 230, 230)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Generate minimalist characters
        const fighter = Anatomy.createMinimalistFighter();
        const monk = Anatomy.createMinimalistMonk();

        // Function to render a pixel buffer to canvas
        function renderPixelBuffer(buffer, x, y) {
            const imageData = ctx.createImageData(buffer.width, buffer.height);
            const data = imageData.data;

            for (let py = 0; py < buffer.height; py++) {
                for (let px = 0; px < buffer.width; px++) {
                    const color = buffer.getPixel(px, py);
                    if (color !== -1) { // Not transparent
                        const [r, g, b] = Palette.hexToRgb(color);
                        const index = (py * buffer.width + px) * 4;
                        data[index] = r;     // Red
                        data[index + 1] = g; // Green
                        data[index + 2] = b; // Blue
                        data[index + 3] = 255; // Alpha
                    }
                }
            }

            ctx.putImageData(imageData, x, y);
        }

        // Render characters side by side
        // Fighter on the left
        renderPixelBuffer(fighter.sprite, 50, 50);

        // Monk on the right
        renderPixelBuffer(monk.sprite, 250, 50);

        // Add labels
        ctx.fillStyle = 'black';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Fighter (Projectile Pose)', 150, 200);
        ctx.fillText('Monk (Defensive Pose)', 350, 200);

        // Add technical info
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Ultra-Minimalist Pixel Art Characters', 10, 250);
        ctx.fillText('Geometric blocks • Limited palette • Programmatic rendering', 10, 270);
        ctx.fillText('16x24 & 16x28 pixels • Direct fillRect operations', 10, 290);

    }, []);

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-8">
            <div className="mb-6 text-center">
                <h1 className="text-4xl font-black text-white mb-2">
                    ⚔️ Ultra-Minimalist Pixel Art Characters
                </h1>
                <p className="text-gray-400">
                    Direct Programmatic Rendering - No PNG Images Required
                </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-2xl">
                <canvas
                    ref={canvasRef}
                    className="border border-gray-300"
                    style={{
                        imageRendering: 'pixelated',
                        imageRendering: '-moz-crisp-edges',
                        imageRendering: 'crisp-edges'
                    }}
                />
            </div>

            <div className="mt-6 max-w-4xl bg-gray-800 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-white mb-3">🎨 Character Specifications:</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-semibold text-red-400 mb-2">🏃 Fighter Character:</h3>
                        <ul className="text-gray-300 space-y-1 text-sm">
                            <li>• <strong>Archetype:</strong> Shirtless male fighter</li>
                            <li>• <strong>Hair:</strong> Spiky black geometric blocks</li>
                            <li>• <strong>Torso:</strong> Skin-colored rectangular block</li>
                            <li>• <strong>Pose:</strong> Arms extended forward (projectile)</li>
                            <li>• <strong>Size:</strong> 16×24 pixels</li>
                            <li>• <strong>Colors:</strong> Skin tone, black outlines, black hair</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-blue-400 mb-2">🥋 Monk Character:</h3>
                        <ul className="text-gray-300 space-y-1 text-sm">
                            <li>• <strong>Archetype:</strong> Martial artist with conical hat</li>
                            <li>• <strong>Hat:</strong> Brown conical geometric blocks</li>
                            <li>• <strong>Gi:</strong> White tunic rectangular blocks</li>
                            <li>• <strong>Pose:</strong> Defensive stance, arms bent ready</li>
                            <li>• <strong>Size:</strong> 16×28 pixels</li>
                            <li>• <strong>Colors:</strong> Skin tone, white gi, brown hat, black outlines</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-green-400 mb-2">⚙️ Technical Implementation:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ul className="text-gray-300 space-y-1 text-sm">
                            <li>✅ <strong>Geometric Construction:</strong> Only rectangular pixel blocks</li>
                            <li>✅ <strong>Limited Palette:</strong> Max 5 colors per character</li>
                            <li>✅ <strong>Skin Tone:</strong> Light beige/orange-brown (0xE0AC69)</li>
                            <li>✅ <strong>Black Outlines:</strong> Pure black for all outlines/features</li>
                            <li>✅ <strong>Background:</strong> Light grey (RGB: 230, 230, 230)</li>
                        </ul>
                        <ul className="text-gray-300 space-y-1 text-sm">
                            <li>✅ <strong>Direct Rendering:</strong> fillRect operations only</li>
                            <li>✅ <strong>Pixel Precision:</strong> No anti-aliasing</li>
                            <li>✅ <strong>Data Structure:</strong> Arrays of x,y,width,height,color</li>
                            <li>✅ <strong>Programmatic:</strong> Akios-Canvas & Phaser compatible</li>
                            <li>✅ <strong>Ultra-Minimalist:</strong> Functional blocky aesthetic</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}