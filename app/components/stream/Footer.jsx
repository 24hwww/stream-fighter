"use client";
import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function Footer() {
    const [timeLeft, setTimeLeft] = useState(0);
    const [origin, setOrigin] = useState("");
    const [previousResult, setPreviousResult] = useState(null);

    const updateData = async () => {
        try {
            const res = await fetch("/api/poll");
            const data = await res.json();

            if (data.current) {
                setOrigin(window.location.origin);
                const expires = new Date(data.current.expiresAt).getTime();
                const now = new Date().getTime();
                const diff = Math.max(0, Math.floor((expires - now) / 1000));
                setTimeLeft(diff);
                if (diff <= 0) window.dispatchEvent(new Event("poll-expired"));
            }

            if (data.previous) {
                const vA = data.previous.optionA?._count?.votes || 0;
                const vB = data.previous.optionB?._count?.votes || 0;
                const total = vA + vB;
                if (total > 0) {
                    const winner = vA >= vB ? data.previous.optionA : data.previous.optionB;
                    const winPercent = Math.round((Math.max(vA, vB) / total) * 100);
                    setPreviousResult({ name: winner.name, percent: winPercent });
                } else {
                    setPreviousResult({ name: "Empate/Sin Votos", percent: 0 });
                }
            }
        } catch (err) {
            console.error("Footer update error:", err);
        }
    };

    useEffect(() => {
        updateData();
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        const sync = setInterval(updateData, 10000); // More frequent sync for results
        return () => { clearInterval(timer); clearInterval(sync); };
    }, []);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex items-center justify-between w-full h-full px-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md overflow-hidden relative">
            {/* Result of Previous Poll */}
            <div className="flex flex-col border-r border-white/10 pr-8">
                <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
                    🏆 Ganador Anterior
                </span>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black italic text-yellow-500 uppercase truncate max-w-[150px]">
                        {previousResult?.name || "---"}
                    </span>
                    <span className="text-sm font-bold text-white/40">{previousResult?.percent}%</span>
                </div>
            </div>

            {/* Timer */}
            <div className="flex flex-col items-center flex-1">
                <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <Clock size={10} /> Siguiente Ronda
                </span>
                <div className="text-5xl font-mono font-black tabular-nums text-white tracking-widest">
                    {formatTime(timeLeft)}
                </div>
            </div>

            {/* Voting QR */}
            <div className="flex items-center gap-6 pl-8 border-l border-white/10">
                <div className="flex flex-col text-right">
                    <span className="text-blue-400 font-black uppercase text-sm italic">Vota Ahora</span>
                    <span className="text-white/40 text-[10px] mt-1 font-mono italic">/vote</span>
                </div>
                <div className="p-2 bg-white rounded-lg">
                    {origin && <QRCodeSVG value={`${origin}/vote`} size={60} level="H" />}
                </div>
            </div>
        </div>
    );
}
