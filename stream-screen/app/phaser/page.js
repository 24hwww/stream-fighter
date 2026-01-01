"use client";
import React, { useState } from 'react';
import PhaserFighter from '../../components/arcade/PhaserFighter';

export default function PhaserPage() {
    const [prompt, setPrompt] = useState("");
    const [scenario, setScenario] = useState(null);
    const [loading, setLoading] = useState(false);

    const generateScenario = async () => {
        if (!prompt) return;
        setLoading(true);
        try {
            const res = await fetch("/api/ai/generate", {
                method: "POST",
                body: JSON.stringify({ prompt }),
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setScenario(data);
        } catch (e) {
            console.error("Failed to generate:", e);
            alert("Error generating scenario: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-black p-8">
            <div className="mb-8 w-full max-w-2xl flex gap-4">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe a fighter and stage (e.g. 'Neon Samurai in a cyberpunk city')"
                    className="flex-1 bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-yellow-500 transition-colors"
                />
                <button
                    onClick={generateScenario}
                    disabled={loading}
                    className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 text-black font-bold px-6 py-2 rounded-lg transition-colors uppercase tracking-wider"
                >
                    {loading ? "Generating..." : "Generate AI"}
                </button>
            </div>

            <div className="relative w-full aspect-video max-w-4xl border-4 border-gray-800 rounded-xl overflow-hidden shadow-2xl shadow-yellow-500/10 bg-gray-900">
                <PhaserFighter scenario={scenario} key={scenario?.character?.name || 'initial'} />

                {!scenario && !loading && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-mono uppercase tracking-[0.2em]">
                        Waiting for Prompt...
                    </div>
                )}

                {loading && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
                        <div className="text-center">
                            <div className="text-yellow-500 text-2xl font-black italic tracking-tighter animate-bounce mb-4">
                                GENERATING SCENARIO
                            </div>
                            <div className="text-gray-400 font-mono text-sm animate-pulse">
                                CONSULTING THE ORACLE...
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {scenario && (
                <div className="mt-6 text-gray-400 font-mono text-xs uppercase tracking-widest text-center">
                    Level Generated: <span className="text-yellow-500">{scenario.stage.type}</span> |
                    Character: <span className="text-yellow-500">{scenario.character.name}</span>
                </div>
            )}
        </div>
    );
}
