"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Star, Heart, CheckCircle2, Loader2, Users, Trophy, Zap } from "lucide-react";
import { createSocketClient } from "@/lib/socketClient";

const socket = createSocketClient();

export default function MobileVoting() {
    const [poll, setPoll] = useState(null);
    const [voted, setVoted] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const fetchPoll = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const res = await fetch("/api/poll");
            const data = await res.json();
            if (data.current) {
                setPoll(data.current);
            }
        } catch (err) {
            console.error("Error fetching poll:", err);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoll();

        // Listen for poll updates (new polls)
        socket.on("poll-refresh", (data) => {
            console.log("Poll refresh received:", data);
            fetchPoll();
            setVoted(null); // Reset vote for new poll
        });

        // Listen for vote updates (to show real-time progress)
        socket.on("vote-update", (data) => {
            console.log("Vote update received:", data);
            fetchPoll(false); // SILENT update (no full-screen spinner)
        });

        return () => {
            socket.off("poll-refresh");
            socket.off("vote-update");
        };
    }, []);

    const handleVote = async (optionId, optionName) => {
        if (submitting || voted) return;

        setSubmitting(true);
        try {
            const response = await fetch("/api/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pollId: poll.id, optionId })
            });

            if (response.ok) {
                setVoted(optionName);
            }
        } catch (err) {
            console.error("Error voting:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const stats = useMemo(() => {
        if (!poll) return { total: 0, pA: 50, pB: 50 };
        const vA = poll.optionA?._count?.votes || 0;
        const vB = poll.optionB?._count?.votes || 0;
        const total = vA + vB;
        if (total === 0) return { total: 0, pA: 50, pB: 50 };
        return {
            total,
            pA: Math.round((vA / total) * 100),
            pB: Math.round((vB / total) * 100)
        };
    }, [poll]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-zinc-500 font-sans">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                    <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-500 animate-pulse" size={24} />
                </div>
                <span className="mt-6 font-bold uppercase text-[10px] tracking-[0.3em] text-zinc-400">Iniciando Arena...</span>
            </div>
        );
    }

    if (!poll) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] p-8 text-center">
                <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 rotate-12">
                    <Users className="text-zinc-700" size={40} />
                </div>
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tight mb-2">Esperando Combate</h2>
                <p className="text-zinc-500 text-sm max-w-[240px]">No hay encuestas activas en este momento. La arena se reactivará pronto.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[100dvh] bg-[#020202] text-white font-sans selection:bg-purple-500/30 overflow-hidden touch-manipulation">
            {/* Background Decorations */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[40%] bg-purple-900/15 blur-[150px] rounded-full"></div>
                <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[40%] bg-orange-900/15 blur-[150px] rounded-full"></div>
                <div className="absolute top-[30%] left-[20%] w-[1px] h-[40%] bg-gradient-to-b from-transparent via-zinc-800 to-transparent opacity-30"></div>
            </div>

            {/* Transition Spinner Overlay */}
            {loading && poll && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                    <span className="text-xs font-black uppercase tracking-[0.4em] text-purple-400">Actualizando Arena...</span>
                </div>
            )}

            <header className="pt-8 sm:pt-12 pb-4 px-6 sm:px-12 relative shrink-0">
                <div className="flex items-baseline justify-between mb-1 max-w-3xl mx-auto">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${loading ? 'bg-zinc-600' : 'bg-red-500 animate-pulse'}`}></span>
                        <span className="text-[10px] sm:text-xs font-black tracking-[0.3em] uppercase text-zinc-500">Live</span>
                    </div>
                    <div className="text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase text-zinc-600 flex items-center gap-1">
                        <Zap size={10} className="text-orange-500" /> Votación Activa
                    </div>
                </div>
                <div className="text-center max-w-3xl mx-auto">
                    <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter uppercase leading-none">
                        STREAM<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-orange-400">FIGHTER</span>
                    </h1>
                </div>
                <div className="mt-4 flex items-center justify-between max-w-3xl mx-auto w-full">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-zinc-800 to-transparent"></div>
                    <div className="px-4 text-[10px] sm:text-xs font-bold text-zinc-700 uppercase tracking-[0.3em] bg-[#020202]">Arena Intv</div>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-zinc-800 to-transparent"></div>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 max-w-3xl mx-auto w-full gap-4 sm:gap-6 overflow-y-auto no-scrollbar">
                {/* Stats Header */}
                <div className="w-full flex justify-between items-end mb-1 px-4">
                    <div className="text-[11px] sm:text-sm font-black uppercase text-zinc-500 tracking-tight">
                        Cat: <span className="text-zinc-200">{poll.category?.name || "General"}</span>
                    </div>
                    <div className="text-[11px] sm:text-sm font-black uppercase text-zinc-500 tracking-tight">
                        Votos: <span className="text-white tabular-nums">{stats.total}</span>
                    </div>
                </div>

                {/* Option A */}
                <button
                    onClick={() => handleVote(poll.optionAId, poll.optionA.name)}
                    disabled={submitting || voted !== null || loading}
                    className={`group relative w-full transition-all duration-500 ${voted === poll.optionB.name ? 'opacity-20 scale-95 grayscale' : 'opacity-100'}`}
                >
                    <div className={`relative overflow-hidden p-6 sm:p-8 rounded-[2rem] border-2 transition-all duration-500 ${voted === poll.optionA.name
                        ? 'bg-purple-600/30 border-purple-500 shadow-[0_0_60px_rgba(168,85,247,0.3)]'
                        : 'bg-zinc-900/60 border-white/10 active:bg-purple-600/20 active:border-purple-500/50 hover:border-white/20'
                        }`}>
                        {/* Progress Bar Background */}
                        <div
                            className="absolute bottom-0 left-0 h-full bg-purple-500/10 transition-all duration-1000 ease-out z-0"
                            style={{ width: `${stats.pA}%` }}
                        />

                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-5 sm:gap-8">
                                <div className={`p-5 sm:p-6 rounded-[1.2rem] sm:rounded-[1.5rem] transition-all duration-500 hover:scale-105 ${voted === poll.optionA.name ? 'bg-purple-500 shadow-xl shadow-purple-500/50 scale-110' : 'bg-zinc-800/90'
                                    }`}>
                                    <Star fill={voted === poll.optionA.name ? "white" : "transparent"} className={voted === poll.optionA.name ? "text-white" : "text-purple-400"} size={40} />
                                </div>
                                <div className="text-left">
                                    <div className={`text-2xl sm:text-4xl font-black italic uppercase leading-tight tracking-tighter ${voted === poll.optionA.name ? 'text-white' : 'text-zinc-100'}`}>
                                        {poll.optionA.name}
                                    </div>
                                    <div className="text-zinc-500 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mt-2">
                                        {voted === poll.optionA.name ? 'Tu Guerrero ha sido elegido' : 'Golpea para votar'}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-4xl sm:text-6xl font-black italic tabular-nums ${voted === poll.optionA.name ? 'text-white' : 'text-purple-500/80'}`}>
                                    {stats.pA}<span className="text-[10px] sm:text-sm ml-1 opacity-60">%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </button>

                {/* VS Divider - Bold */}
                <div className="relative w-full flex items-center justify-center h-12">
                    <div className="absolute inset-x-8 sm:inset-x-12 h-[1px] bg-zinc-800"></div>
                    <div className="relative z-10 font-black italic text-sm sm:text-lg text-zinc-600 bg-[#020202] px-6 py-1 border border-zinc-800 rounded-full">VS</div>
                </div>

                {/* Option B */}
                <button
                    onClick={() => handleVote(poll.optionBId, poll.optionB.name)}
                    disabled={submitting || voted !== null || loading}
                    className={`group relative w-full transition-all duration-500 ${voted === poll.optionA.name ? 'opacity-20 scale-95 grayscale' : 'opacity-100'}`}
                >
                    <div className={`relative overflow-hidden p-6 sm:p-8 rounded-[2rem] border-2 transition-all duration-500 ${voted === poll.optionB.name
                        ? 'bg-orange-600/30 border-orange-500 shadow-[0_0_60px_rgba(249,115,22,0.3)]'
                        : 'bg-zinc-900/60 border-white/10 active:bg-orange-600/20 active:border-orange-500/50 hover:border-white/20'
                        }`}>
                        {/* Progress Bar Background */}
                        <div
                            className="absolute bottom-0 right-0 h-full bg-orange-500/10 transition-all duration-1000 ease-out z-0"
                            style={{ width: `${stats.pB}%` }}
                        />

                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-5 sm:gap-8">
                                <div className={`p-5 sm:p-6 rounded-[1.2rem] sm:rounded-[1.5rem] transition-all duration-500 hover:scale-105 ${voted === poll.optionB.name ? 'bg-orange-500 shadow-xl shadow-orange-500/50 scale-110' : 'bg-zinc-800/90'
                                    }`}>
                                    <Heart fill={voted === poll.optionB.name ? "white" : "transparent"} className={voted === poll.optionB.name ? "text-white" : "text-orange-400"} size={40} />
                                </div>
                                <div className="text-left">
                                    <div className={`text-2xl sm:text-4xl font-black italic uppercase leading-tight tracking-tighter ${voted === poll.optionB.name ? 'text-white' : 'text-zinc-100'}`}>
                                        {poll.optionB.name}
                                    </div>
                                    <div className="text-zinc-500 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mt-2">
                                        {voted === poll.optionB.name ? 'Tu Guerrero ha sido elegido' : 'Golpea para votar'}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-4xl sm:text-6xl font-black italic tabular-nums ${voted === poll.optionB.name ? 'text-white' : 'text-orange-500/80'}`}>
                                    {stats.pB}<span className="text-[10px] sm:text-sm ml-1 opacity-60">%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </button>

                {submitting && (
                    <div className="mt-4 flex items-center gap-2 text-zinc-600 text-[10px] sm:text-xs uppercase font-bold tracking-[0.3em] animate-pulse">
                        <Loader2 size={12} className="animate-spin text-purple-500" /> Sincronizando con la Arena...
                    </div>
                )}
            </main>

            <footer className="pb-10 pt-4 px-8 text-center bg-gradient-to-t from-black to-transparent shrink-0">
                <div className="flex items-center justify-center gap-8 mb-4 opacity-30 grayscale">
                    <Trophy size={18} />
                    <Zap size={18} />
                    <Star size={18} />
                </div>
                <div className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.4em] text-zinc-700">
                    Propulsado por Inteligencia Artificial & Antigravity
                </div>
            </footer>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                body {
                    background-color: #020202;
                    overscroll-behavior-y: contain;
                }
                * {
                    -webkit-tap-highlight-color: transparent;
                }
            `}</style>
        </div>
    );
}
