"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { createSocketClient } from "@/lib/socketClient";
import { ArcadeEngine } from "@/engine";
import { CanvasRenderer } from "@/engine/renderer/canvasRenderer";

import { QRCodeCanvas } from "qrcode.react";

const socket = createSocketClient();

export default function FighterGame() {
    const canvasRef = useRef(null);
    const rendererRef = useRef(null);
    const animationRef = useRef(null);

    const [poll, setPoll] = useState(null);
    const [previousPoll, setPreviousPoll] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(99);
    const [isLoading, setIsLoading] = useState(true);
    const [fighterState, setFighterState] = useState(null);
    const [designs, setDesigns] = useState(null);
    const [networkIp, setNetworkIp] = useState("");

    // Fetch network IP for QR code
    useEffect(() => {
        fetch("/api/base-url")
            .then(res => res.json())
            .then(data => setNetworkIp(data.baseUrl || window.location.origin))
            .catch(() => setNetworkIp(window.location.origin));
    }, []);

    // Sync poll data and fighter state
    useEffect(() => {
        const syncPoll = async (liveData = null) => {
            try {
                // Si tenemos data viva del socket, sincronizamos inmediatamente sin fetch
                if (liveData && liveData.pollId === poll?.id) {
                    if (liveData.optionA_votes !== undefined) {
                        setPoll(prev => {
                            if (!prev) return prev;
                            return {
                                ...prev,
                                optionA: { ...prev.optionA, _count: { ...prev.optionA._count, votes: liveData.optionA_votes } },
                                optionB: { ...prev.optionB, _count: { ...prev.optionB._count, votes: liveData.optionB_votes } }
                            };
                        });
                    }
                    if (liveData.combatState) {
                        setFighterState(liveData.combatState);
                    }
                    return; // Fin de la sincronización rápida
                }

                // Fallback: Sincronización completa vía API
                const res = await fetch("/api/poll");
                const data = await res.json();
                if (data.current) {
                    const prevPollId = poll?.id;
                    setPoll(data.current);
                    setPreviousPoll(data.previous);

                    if (data.combatState) {
                        setFighterState(data.combatState);
                    }

                    const expiry = new Date(data.current.expiresAt);
                    setTimeRemaining(Math.max(0, Math.floor((expiry - new Date()) / 1000)));

                    if (data.current.id !== prevPollId) {
                        const designsRes = await fetch(`/api/poll/designs/${data.current.id}`);
                        if (designsRes.ok) {
                            const designsData = await designsRes.json();
                            setDesigns(designsData);
                        }
                    }
                }
            } catch (e) {
                console.error("[FighterGame] Poll Sync Failed", e);
            }
        };

        syncPoll();
        socket.on("poll-refresh", () => syncPoll()); // Full refresh
        socket.on("vote-update", (data) => syncPoll(data)); // Live partial refresh

        return () => {
            socket.off("poll-refresh");
            socket.off("vote-update");
        };
    }, [poll?.id]);

    // Timer countdown
    useEffect(() => {
        if (timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining]);

    // Initialize Arcade Renderer
    useEffect(() => {
        if (!canvasRef.current) return;

        const initRenderer = async () => {
            // Create engine and renderer
            const engine = new ArcadeEngine(320, 180);
            const renderer = new CanvasRenderer(320, 180, 1280, 720);

            // Append Canvas to container
            if (canvasRef.current && renderer.canvas) {
                // Clear existing content
                canvasRef.current.innerHTML = "";
                renderer.canvas.className = "w-full h-full";
                renderer.canvas.style.imageRendering = "pixelated";
                canvasRef.current.appendChild(renderer.canvas);
            }

            rendererRef.current = { engine, renderer };
            setIsLoading(false);

            console.log("[FighterGame] Arcade Engine initialized");
        };

        initRenderer();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    // Update Engine Designs
    useEffect(() => {
        if (rendererRef.current && designs) {
            rendererRef.current.engine.updateDesigns(designs);
        }
    }, [designs]);

    // Animation loop
    const animate = useCallback((timestamp) => {
        if (!rendererRef.current || !canvasRef.current || !poll || !fighterState) {
            return;
        }

        const { engine, renderer } = rendererRef.current;

        // Synchronize engine state
        engine.update(16.67);

        // Use base anatomy HP if fighterState is not yet ready or being weird
        engine.p1.hp = (fighterState.fighterA.hp || 100) / 100;
        engine.p2.hp = (fighterState.fighterB.hp || 100) / 100;

        engine.p1.anim.setState((fighterState.fighterA.animation || 'IDLE').toUpperCase());
        engine.p2.anim.setState((fighterState.fighterB.animation || 'IDLE').toUpperCase());

        // Use the live countdown from state if available
        engine.state.timer = timeRemaining;

        // Render frame
        const pixelBuffer = engine.render(timestamp);
        renderer.render(pixelBuffer);
    }, [poll, fighterState, timeRemaining]);

    useEffect(() => {
        const frame = () => {
            animate(performance.now());
            animationRef.current = requestAnimationFrame(frame);
        };

        animationRef.current = requestAnimationFrame(frame);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [animate]);

    return (
        <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
            <div className="relative w-full h-full max-w-[177.78vh] aspect-video">
                {/* Main Game Pixi Container */}
                <div
                    ref={canvasRef}
                    className="w-full h-full"
                />

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
                        <div className="text-center">
                            <div className="text-yellow-400 text-2xl font-mono animate-pulse mb-4">
                                LOADING...
                            </div>
                            <div className="w-48 h-2 bg-gray-800 rounded overflow-hidden">
                                <div className="h-full bg-yellow-400 animate-[loading_1s_ease-in-out_infinite]"
                                    style={{ width: "60%" }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* CRT Scanlines Effect */}
                <div
                    className="absolute inset-0 pointer-events-none z-30"
                    style={{
                        backgroundImage: `repeating-linear-gradient(
                            0deg,
                            transparent,
                            transparent 2px,
                            rgba(0, 0, 0, 0.15) 2px,
                            rgba(0, 0, 0, 0.15) 4px
                        )`,
                        mixBlendMode: "multiply"
                    }}
                />

                {/* CRT RGB Pixel Grid */}
                <div
                    className="absolute inset-0 pointer-events-none z-31 opacity-10"
                    style={{
                        backgroundImage: `repeating-linear-gradient(
                            90deg,
                            rgba(255, 0, 0, 0.3) 0px,
                            rgba(0, 255, 0, 0.3) 1px,
                            rgba(0, 0, 255, 0.3) 2px,
                            transparent 3px
                        )`,
                        backgroundSize: "3px 100%"
                    }}
                />

                {/* CRT Vignette Effect */}
                <div
                    className="absolute inset-0 pointer-events-none z-40"
                    style={{
                        background: `radial-gradient(
                            ellipse at center,
                            transparent 0%,
                            transparent 60%,
                            rgba(0, 0, 0, 0.4) 90%,
                            rgba(0, 0, 0, 0.8) 100%
                        )`
                    }}
                />

                {/* CRT Screen Curvature Simulation */}
                <div
                    className="absolute inset-0 pointer-events-none z-35"
                    style={{
                        boxShadow: `
                            inset 0 0 100px rgba(0, 0, 0, 0.5),
                            inset 0 0 200px rgba(0, 0, 0, 0.3)
                        `,
                        borderRadius: "20px"
                    }}
                />

                {/* CRT Flicker Effect (subtle) */}
                <div
                    className="absolute inset-0 pointer-events-none z-25 opacity-[0.02] animate-[flicker_0.15s_infinite]"
                    style={{
                        background: "linear-gradient(transparent 50%, rgba(255,255,255,0.1) 50%)",
                        backgroundSize: "100% 4px"
                    }}
                />

                {/* Phosphor Glow */}
                <div
                    className="absolute inset-0 pointer-events-none z-20 mix-blend-screen opacity-5"
                    style={{
                        background: `radial-gradient(
                            ellipse at center,
                            rgba(100, 255, 100, 0.1) 0%,
                            transparent 70%
                        )`
                    }}
                />

                {/* Vote Link & QR Code Overlay */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-4xl px-8 flex items-end justify-between">
                    <div className="bg-black/90 p-4 border-2 border-yellow-500/80 rounded-xl shadow-2xl flex items-center gap-6 backdrop-blur-md">
                        <div className="bg-white p-2 rounded-lg">
                            <QRCodeCanvas
                                value={`${networkIp}/vote`}
                                size={80}
                                level="H"
                                includeMargin={false}
                            />
                        </div>
                        <div>
                            <p className="text-yellow-400 font-black italic text-xl tracking-tighter leading-none mb-1">SCAN TO VOTE</p>
                            <p className="text-white text-xs font-mono uppercase tracking-widest opacity-80">
                                {networkIp.replace(/^https?:\/\//, '')}/VOTE
                            </p>
                            <div className="mt-3 flex gap-2">
                                <span className="px-2 py-0.5 bg-yellow-500 text-black text-[10px] font-bold rounded uppercase">Live Voting</span>
                                <span className="px-2 py-0.5 bg-white/10 text-white text-[10px] font-bold rounded uppercase border border-white/20">5 Min Rounds</span>
                            </div>
                        </div>
                    </div>

                    {/* Previous Round Winner */}
                    {previousPoll && (
                        <div className="bg-black/80 p-4 border-l-4 border-yellow-500 rounded-r-xl backdrop-blur-sm">
                            <p className="text-gray-500 text-[10px] font-mono uppercase tracking-widest mb-1">Previous Winner</p>
                            <p className="text-white font-bold uppercase tracking-tighter text-lg">
                                {previousPoll.optionA._count.votes >= previousPoll.optionB._count.votes ?
                                    previousPoll.optionA.name : previousPoll.optionB.name}
                            </p>
                            <p className="text-yellow-500/60 text-[10px] font-mono uppercase">Defeated opponent in last round</p>
                        </div>
                    )}
                </div>

                {/* Player Info Overlays */}
                {poll && (
                    <>
                        {/* Player 1 Name */}
                        <div className="absolute top-20 left-8 z-50 pointer-events-none">
                            <div className="bg-black/60 px-3 py-1 border-l-4 border-red-500 shadow-lg shadow-red-500/20">
                                <p className="text-red-400 text-sm font-mono font-bold uppercase tracking-tighter">
                                    {poll.optionA?.name || "PLAYER 1"}
                                </p>
                            </div>
                        </div>

                        {/* Player 2 Name */}
                        <div className="absolute top-20 right-8 z-50 pointer-events-none">
                            <div className="bg-black/60 px-3 py-1 border-r-4 border-blue-500 shadow-lg shadow-blue-500/20">
                                <p className="text-blue-400 text-sm font-mono font-bold uppercase text-right tracking-tighter">
                                    {poll.optionB?.name || "PLAYER 2"}
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Custom CSS for animations */}
            <style jsx>{`
                @keyframes flicker {
                    0% { opacity: 0.02; }
                    50% { opacity: 0.04; }
                    100% { opacity: 0.02; }
                }
                @keyframes loading {
                    0% { width: 0%; }
                    50% { width: 100%; }
                    100% { width: 0%; }
                }
            `}</style>
        </div>
    );
}
