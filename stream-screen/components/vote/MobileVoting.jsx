"use client";
import React, { useEffect, useState, useRef } from "react";
import { createSocketClient } from "@/lib/socketClient";
import { createLogger } from "@/lib/logger";

const log = createLogger('MobileVoting');

export default function MobileVoting() {
    const [poll, setPoll] = useState(null);
    const [voted, setVoted] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const socketRef = useRef(null);

    const fetchPoll = async () => {
        try {
            const res = await fetch("/api/poll");
            const data = await res.json();
            if (data.current) {
                setPoll(data.current);
            }
        } catch (err) {
            log.error('Fetch error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setIsMounted(true);
        fetchPoll();

        // Initialize socket only on client
        if (!socketRef.current) {
            socketRef.current = createSocketClient();
        }

        const socket = socketRef.current;

        socket.on("poll-refresh", () => {
            log.debug('Poll refreshed via socket');
            fetchPoll();
            setVoted(null);
        });

        socket.on("vote-update", (data) => {
            log.debug('Vote update received:', data);

            // Si el socket trae los conteos frescos, actualizamos localmente sin fetch()
            if (data.optionA_votes !== undefined && data.pollId) {
                setPoll(prev => {
                    if (!prev || prev.id !== data.pollId) return prev;

                    // Solo actualizamos si el conteo es mayor al que tenemos (evitar saltos hacia atrás)
                    const newA = Math.max(prev.optionA._count.votes, data.optionA_votes);
                    const newB = Math.max(prev.optionB._count.votes, data.optionB_votes);

                    return {
                        ...prev,
                        optionA: { ...prev.optionA, _count: { ...prev.optionA._count, votes: newA } },
                        optionB: { ...prev.optionB, _count: { ...prev.optionB._count, votes: newB } }
                    };
                });
            } else {
                // Fallback a fetch si el mensaje es incompleto
                fetchPoll();
            }
        });

        return () => {
            if (socket) {
                socket.off("poll-refresh");
                socket.off("vote-update");
                // We keep the socket connection alive as long as the component is mounted
            }
        };
    }, []);

    const handleVote = async (optionId, optionName) => {
        if (!poll || voted) return;

        // --- OPTIMISTIC UI ---
        setVoted(optionName);
        setPoll(prev => {
            if (!prev) return prev;
            const isA = (optionId === prev.optionA.id || optionName === prev.optionA.name);
            return {
                ...prev,
                optionA: { ...prev.optionA, _count: { ...prev.optionA._count, votes: prev.optionA._count.votes + (isA ? 1 : 0) } },
                optionB: { ...prev.optionB, _count: { ...prev.optionB._count, votes: prev.optionB._count.votes + (!isA ? 1 : 0) } }
            };
        });

        const id = optionId || (optionName === poll.optionA.name ? poll.optionA.id : poll.optionB.id);

        try {
            const res = await fetch("/api/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pollId: poll.id, optionId: id })
            });

            if (!res.ok) {
                // Si el voto falla en el servidor, revertimos (opcional, o mostramos error)
                log.error('Vote failed on server');
                fetchPoll(); // Refrescar para estar seguros
            }
        } catch (err) {
            log.error('Vote error:', err.message);
            fetchPoll(); // Refrescar en caso de error
        }
    };

    if (!isMounted) return null;

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-yellow-500 font-black animate-pulse tracking-widest uppercase">
                PREPARANDO ARENA...
            </div>
        </div>
    );

    if (!poll) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center gap-4">
            <div className="text-red-500 text-2xl font-black uppercase italic underline decoration-red-900 underline-offset-8">
                SIN BATALLA ACTIVA
            </div>
            <p className="text-gray-500 text-xs font-mono">ESPERANDO AL SIGUIENTE ROUND</p>
            <button
                onClick={fetchPoll}
                className="mt-4 px-6 py-2 border border-gray-800 text-gray-500 text-[10px] hover:text-white transition-colors"
            >
                REINTENTAR
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white font-mono p-6 flex flex-col items-center">
            <div className="w-full max-w-md pt-4">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-black tracking-tighter italic text-yellow-500 mb-2 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                        TU VOTO DECIDE
                    </h1>
                    <div className="h-0.5 bg-gradient-to-r from-transparent via-red-600 to-transparent w-full opacity-50"></div>
                </header>

                <div className="space-y-6">
                    {/* Option A */}
                    <button
                        onClick={() => handleVote(poll.optionAId || poll.optionA.id, poll.optionA.name)}
                        disabled={voted !== null}
                        className={`w-full relative overflow-hidden rounded-xl border-2 transition-all active:scale-95 duration-200 ${voted === poll.optionA.name
                            ? 'border-yellow-400 bg-red-900/40 shadow-[0_0_40px_rgba(239,68,68,0.2)]'
                            : voted
                                ? 'border-gray-900 opacity-30 grayscale'
                                : 'border-red-900/50 bg-red-950/20 hover:border-red-600'
                            }`}
                    >
                        <div className="p-5 flex items-center justify-between">
                            <div className="flex-1 text-left">
                                <div className="text-[9px] font-bold text-red-500/80 mb-1 tracking-widest uppercase">GUERRERO A</div>
                                <div className="text-2xl font-black uppercase tracking-tight leading-none truncate pr-2">
                                    {poll.optionA.name}
                                </div>
                            </div>
                            <div className="text-3xl font-black text-red-600 italic">
                                {Math.round(((poll.optionA?._count?.votes || 0) / ((poll.optionA?._count?.votes || 0) + (poll.optionB?._count?.votes || 0) || 1)) * 100)}%
                            </div>
                        </div>
                    </button>

                    <div className="flex items-center justify-center py-0">
                        <span className="text-lg font-black text-white/5 italic tracking-[0.5em]">VERSUS</span>
                    </div>

                    {/* Option B */}
                    <button
                        onClick={() => handleVote(poll.optionBId || poll.optionB.id, poll.optionB.name)}
                        disabled={voted !== null}
                        className={`w-full relative overflow-hidden rounded-xl border-2 transition-all active:scale-95 duration-200 ${voted === poll.optionB.name
                            ? 'border-yellow-400 bg-blue-900/40 shadow-[0_0_40px_rgba(59,130,246,0.2)]'
                            : voted
                                ? 'border-gray-900 opacity-30 grayscale'
                                : 'border-blue-900/50 bg-blue-950/20 hover:border-blue-600'
                            }`}
                    >
                        <div className="p-5 flex items-center justify-between">
                            <div className="flex-1 text-left">
                                <div className="text-[9px] font-bold text-blue-500/80 mb-1 tracking-widest uppercase">GUERRERO B</div>
                                <div className="text-2xl font-black uppercase tracking-tight leading-none truncate pr-2">
                                    {poll.optionB.name}
                                </div>
                            </div>
                            <div className="text-3xl font-black text-blue-600 italic">
                                {Math.round(((poll.optionB?._count?.votes || 0) / ((poll.optionA?._count?.votes || 0) + (poll.optionB?._count?.votes || 0) || 1)) * 100)}%
                            </div>
                        </div>
                    </button>
                </div>

                {voted && (
                    <div className="mt-10 text-center animate-bounce">
                        <div className="inline-block px-8 py-2.5 bg-yellow-500 text-black font-black uppercase text-xs rounded-full tracking-tighter shadow-xl">
                            ¡VOTO REGISTRADO!
                        </div>
                    </div>
                )}
            </div>

            <footer className="mt-auto pb-10 flex flex-col items-center gap-4 w-full">
                <div className="flex items-center gap-3 text-[9px] font-bold text-white/20 uppercase tracking-[0.4em]">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></div>
                    ARENA LIVE • SINCRONIZADO
                </div>
            </footer>
        </div>
    );
}
