"use client";
import React, { useState, useEffect } from "react";

export default function PollSection() {
    const [poll, setPoll] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPoll = async () => {
        try {
            const res = await fetch("/api/poll");
            const data = await res.json();
            if (!data.error) setPoll(data);
        } catch (err) {
            console.error("Error fetching poll:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoll();

        // Listen for automatic refresh signal from the timer
        window.addEventListener("poll-expired", fetchPoll);

        const interval = setInterval(fetchPoll, 30000); // Pulse check every 30s
        return () => {
            clearInterval(interval);
            window.removeEventListener("poll-expired", fetchPoll);
        };
    }, []);

    if (loading) return <div className="text-zinc-500 animate-pulse font-mono uppercase italic">Cargando versus...</div>;
    if (!poll) return <div className="text-red-500 font-mono uppercase italic">Error al cargar versus</div>;

    return (
        <div className="flex items-center justify-center gap-12 w-full animate-in fade-in duration-1000">
            {/* Option A */}
            <div className="flex flex-col items-center group flex-1 max-w-[400px]">
                <div className="relative aspect-square w-full p-2 bg-gradient-to-br from-purple-500/50 to-transparent rounded-2xl border-4 border-purple-500/30 overflow-hidden transition-all duration-500 group-hover:scale-105 group-hover:border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                    <img
                        src={poll?.optionA?.image?.startsWith("http") ? poll.optionA.image : "/option_a.png"}
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => e.target.src = "/option_a.png"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center pb-8">
                        <span className="text-4xl font-black text-purple-400 uppercase italic text-center px-4 leading-tight">
                            {poll?.optionA?.name || "Opción A"}
                        </span>
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
                        src={poll?.optionB?.image?.startsWith("http") ? poll.optionB.image : "/option_b.png"}
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => e.target.src = "/option_b.png"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center pb-8">
                        <span className="text-4xl font-black text-orange-400 uppercase italic text-center px-4 leading-tight">
                            {poll?.optionB?.name || "Opción B"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
