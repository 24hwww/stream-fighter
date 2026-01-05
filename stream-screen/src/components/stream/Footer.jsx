"use client";
import React, { useState, useEffect } from "react";
import { Trophy, Users } from "lucide-react";
import { createSocketClient } from "@/lib/socketClient";

const socket = createSocketClient();

export default function Footer() {
    const [stats, setStats] = useState({ current: null, previous: null });

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/poll");
            const data = await res.json();
            if (data) setStats(data);
        } catch (err) {
            console.error("Footer fetch error:", err);
        }
    };

    useEffect(() => {
        setTimeout(() => fetchStats(), 0); // eslint-disable-line react-hooks/set-state-in-effect
        socket.on("vote-update", fetchStats);
        socket.on("poll-update", fetchStats);
        return () => {
            socket.off("vote-update");
            socket.off("poll-update");
        };
    }, []);

    const prevPoll = stats.previous;
    const currentPoll = stats.current;

    const winner = prevPoll ? (
        (prevPoll.optionA?._count?.votes || 0) > (prevPoll.optionB?._count?.votes || 0)
            ? prevPoll.optionA.name
            : prevPoll.optionB.name
    ) : null;

    const totalCurrentVotes = currentPoll ? (currentPoll.optionA?._count?.votes || 0) + (currentPoll.optionB?._count?.votes || 0) : 0;

    return (
        <div className="flex items-center justify-between w-full h-full px-8 bg-gradient-to-r from-black/60 to-purple-900/40 rounded-3xl border border-white/10 backdrop-blur-xl">
            {/* Previous Winner */}
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center border border-yellow-500/30">
                    <Trophy className="text-yellow-500" size={32} />
                </div>
                <div className="flex flex-col">
                    <span className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.3em]">Último Ganador</span>
                    <div className="text-3xl font-black italic text-white uppercase tracking-tighter">
                        {winner || "Arena Iniciando..."}
                    </div>
                </div>
            </div>

            {/* Live Stats */}
            <div className="flex items-center gap-10">
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 text-purple-400 font-black text-[10px] uppercase tracking-[0.2em]">
                        <Users size={12} /> Total Votos Hoy
                    </div>
                    <div className="text-4xl font-black italic text-white tabular-nums">
                        {totalCurrentVotes}
                    </div>
                </div>

                <div className="h-12 w-[1px] bg-white/10" />

                <div className="flex flex-col text-right">
                    <span className="text-white/40 font-black text-[10px] uppercase tracking-[0.2em]">Categoría</span>
                    <span className="text-xl font-bold text-white italic uppercase">
                        {currentPoll?.category?.name || "General"}
                    </span>
                </div>
            </div>
        </div>
    );
}
