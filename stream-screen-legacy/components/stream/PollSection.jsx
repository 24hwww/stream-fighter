"use client";
import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { createSocketClient } from "@/lib/socketClient";

const socket = createSocketClient();

export default function PollSection() {
    const [poll, setPoll] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);

    const fetchPoll = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const res = await fetch("/api/poll");
            const data = await res.json();
            if (data && data.current) {
                setPoll(data);
                const expires = new Date(data.current.expiresAt).getTime();
                const now = new Date().getTime();
                setTimeLeft(Math.max(0, Math.floor((expires - now) / 1000)));
            }
        } catch (err) {
            console.error("Error fetching poll:", err);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoll();

        socket.on("vote-update", (data) => {
            console.log("Real-time vote received:", data);

            // Sincronización ultrarápida sin fetch
            if (data.optionA_votes !== undefined && data.pollId) {
                setPoll(prev => {
                    if (!prev || !prev.current || prev.current.id !== data.pollId) return prev;
                    return {
                        ...prev,
                        current: {
                            ...prev.current,
                            optionA: { ...prev.current.optionA, _count: { ...prev.current.optionA._count, votes: data.optionA_votes } },
                            optionB: { ...prev.current.optionB, _count: { ...prev.current.optionB._count, votes: data.optionB_votes } }
                        }
                    };
                });
            } else {
                fetchPoll(false); // Fallback
            }
        });

        socket.on("poll-refresh", (data) => {
            console.log("Real-time poll rotation received:", data);
            fetchPoll(true);
        });

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Don't call fetchPoll here to avoid race conditions with AI generation
                    // The API already handles rotation if expired
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(timer);
            socket.off("vote-update");
            socket.off("poll-update");
        };
    }, []);

    if (loading && !poll) {
        return (
            <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                <div className="text-white font-black italic uppercase tracking-widest animate-pulse">
                    Sincronizando Versus...
                </div>
            </div>
        );
    }

    if (!poll?.current) return <div className="text-red-500 font-mono uppercase italic">Error de conexión con la arena</div>;

    const currentPoll = poll.current;
    const votesA = currentPoll.optionA?._count?.votes || 0;
    const votesB = currentPoll.optionB?._count?.votes || 0;
    const totalVotes = votesA + votesB;
    const percentA = totalVotes > 0 ? Math.round((votesA / totalVotes) * 100) : 50;
    const percentB = totalVotes > 0 ? Math.round((votesB / totalVotes) * 100) : 50;

    return (
        <div className="relative flex flex-col items-center justify-center gap-8 w-full animate-in fade-in duration-1000">
            {/* Global Rotation Spinner Overlay */}
            {loading && poll && (
                <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md rounded-3xl animate-in zoom-in-95 duration-500">
                    <div className="relative">
                        <Loader2 className="w-20 h-20 text-purple-500 animate-spin" />
                        <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500 animate-pulse" size={32} />
                    </div>
                    <div className="mt-6 text-2xl font-black italic uppercase tracking-[0.3em] text-white text-center">
                        <span className="text-purple-400">IA</span> ACTUALIZANDO <span className="text-orange-400">GUERREROS</span>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-center gap-12 w-full">
                {/* Option A */}
                <div className="flex flex-col items-center group flex-1 max-w-[400px]">
                    <div className="relative aspect-square w-full p-2 bg-gradient-to-br from-purple-500/50 to-transparent rounded-2xl border-4 border-purple-500/30 overflow-hidden transition-all duration-500 group-hover:scale-105 group-hover:border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                        <img
                            src={currentPoll?.optionA?.image || "/option_a.png"}
                            className="w-full h-full object-cover rounded-xl"
                            onError={(e) => e.target.src = "/option_a.png"}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center pb-8">
                            <span className="text-4xl font-black text-purple-400 uppercase italic text-center px-4 leading-tight">
                                {currentPoll?.optionA?.name || "Opción A"}
                            </span>
                        </div>
                    </div>

                    {/* Vote Bar A */}
                    <div className="w-full mt-6 px-4">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-purple-400 font-black italic uppercase tracking-tighter">Votos</span>
                            <span className="text-4xl font-black italic text-white tabular-nums">{percentA}%</span>
                        </div>
                        <div className="w-full h-4 bg-white/5 rounded-full border border-white/10 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                                style={{ width: `${percentA}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center gap-4">
                    <div className="text-7xl font-black text-white/20 italic select-none">VS</div>
                    {timeLeft > 0 && (
                        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                            <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em] block text-center mb-1">Cierre en</span>
                            <div className="text-xl font-black font-mono text-white tabular-nums">
                                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                            </div>
                        </div>
                    )}
                </div>

                {/* Option B */}
                <div className="flex flex-col items-center group flex-1 max-w-[400px]">
                    <div className="relative aspect-square w-full p-2 bg-gradient-to-br from-orange-500/50 to-transparent rounded-2xl border-4 border-orange-500/30 overflow-hidden transition-all duration-500 group-hover:scale-105 group-hover:border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                        <img
                            src={currentPoll?.optionB?.image || "/option_b.png"}
                            className="w-full h-full object-cover rounded-xl"
                            onError={(e) => e.target.src = "/option_b.png"}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center pb-8">
                            <span className="text-4xl font-black text-orange-400 uppercase italic text-center px-4 leading-tight">
                                {currentPoll?.optionB?.name || "Opción B"}
                            </span>
                        </div>
                    </div>

                    {/* Vote Bar B */}
                    <div className="w-full mt-6 px-4">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-orange-400 font-black italic uppercase tracking-tighter">Votos</span>
                            <span className="text-4xl font-black italic text-white tabular-nums">{percentB}%</span>
                        </div>
                        <div className="w-full h-4 bg-white/5 rounded-full border border-white/10 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                                style={{ width: `${percentB}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
