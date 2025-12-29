"use client";
import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function PollSection() {
    const [poll, setPoll] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);

    const fetchPoll = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/poll");
            const data = await res.json();
            if (!data.error) {
                setPoll(data);
                const expires = new Date(data.current.expiresAt).getTime();
                const now = new Date().getTime();
                setTimeLeft(Math.max(0, Math.floor((expires - now) / 1000)));
            }
        } catch (err) {
            console.error("Error fetching poll:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoll();

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    fetchPoll();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        const refreshInterval = setInterval(fetchPoll, 30000);

        return () => {
            clearInterval(timer);
            clearInterval(refreshInterval);
        };
    }, []);

    if (!poll?.current) return <div className="text-red-500 font-mono uppercase italic">Error al cargar versus</div>;

    const currentPoll = poll.current;
    const votesA = currentPoll.optionA?._count?.votes || 0;
    const votesB = currentPoll.optionB?._count?.votes || 0;
    const totalVotes = votesA + votesB;
    const percentA = totalVotes > 0 ? Math.round((votesA / totalVotes) * 100) : 50;
    const percentB = totalVotes > 0 ? Math.round((votesB / totalVotes) * 100) : 50;

    return (
        <div className="relative flex flex-col items-center justify-center gap-8 w-full animate-in fade-in duration-1000">
            {/* Loading Overlay */}
            {loading && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-3xl border border-white/10 animate-in fade-in duration-300">
                    <Loader2 className="w-16 h-16 text-purple-500 animate-spin mb-4" />
                    <span className="text-white font-black italic uppercase tracking-tighter text-xl animate-pulse">
                        IA Generando Nuevo Versus...
                    </span>
                </div>
            )}

            <div className="flex items-center justify-center gap-12 w-full">
                {/* Option A */}
                <div className="flex flex-col items-center group flex-1 max-w-[400px]">
                    <div className="relative aspect-square w-full p-2 bg-gradient-to-br from-purple-500/50 to-transparent rounded-2xl border-4 border-purple-500/30 overflow-hidden transition-all duration-500 group-hover:scale-105 group-hover:border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                        <img
                            src={currentPoll?.optionA?.image?.startsWith("http") ? currentPoll.optionA.image : "/option_a.png"}
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
                            <span className="text-purple-400 font-black italic italic uppercase tracking-tighter">Votos</span>
                            <span className="text-4xl font-black italic text-white">{percentA}%</span>
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
                </div>

                {/* Option B */}
                <div className="flex flex-col items-center group flex-1 max-w-[400px]">
                    <div className="relative aspect-square w-full p-2 bg-gradient-to-br from-orange-500/50 to-transparent rounded-2xl border-4 border-orange-500/30 overflow-hidden transition-all duration-500 group-hover:scale-105 group-hover:border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                        <img
                            src={currentPoll?.optionB?.image?.startsWith("http") ? currentPoll.optionB.image : "/option_b.png"}
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
                            <span className="text-orange-400 font-black italic italic uppercase tracking-tighter">Votos</span>
                            <span className="text-4xl font-black italic text-white">{percentB}%</span>
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
