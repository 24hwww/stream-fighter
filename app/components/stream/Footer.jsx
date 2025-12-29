"use client";
import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function Footer() {
    const [timeLeft, setTimeLeft] = useState(0);
    const [origin, setOrigin] = useState("");

    const updateCountdown = async () => {
        try {
            const res = await fetch("/api/poll");
            const poll = await res.json();
            if (poll && poll.expiresAt) {
                setOrigin(window.location.origin);
                const expires = new Date(poll.expiresAt).getTime();
                const now = new Date().getTime();
                const diff = Math.max(0, Math.floor((expires - now) / 1000));
                setTimeLeft(diff);

                // If time is up, trigger a global refresh event
                if (diff <= 0) {
                    window.dispatchEvent(new Event("poll-expired"));
                }
            }
        } catch (err) {
            console.error("Footer countdown error:", err);
        }
    };

    useEffect(() => {
        updateCountdown();
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        // Sync with server every 30 seconds
        const sync = setInterval(updateCountdown, 30000);

        return () => {
            clearInterval(timer);
            clearInterval(sync);
        };
    }, []);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex items-center justify-between w-full h-full px-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
            {/* Timer */}
            <div className="flex flex-col">
                <span className="text-zinc-500 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                    <Clock size={12} /> Próxima Encuesta en
                </span>
                <div className="text-6xl font-mono font-bold tabular-nums text-white">
                    {timeLeft > 0 ? formatTime(timeLeft) : "0:00"}
                </div>
            </div>

            {/* Voting QR */}
            <div className="flex items-center gap-6">
                <div className="flex flex-col text-right">
                    <span className="text-blue-400 font-bold uppercase text-base">¿Quieres votar?</span>
                    <span className="text-white/60 text-sm italic">Escanea para elegir ganador</span>
                    <span className="text-white/40 text-xs mt-1 font-mono italic">/vote</span>
                </div>
                <div className="p-2 bg-white rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    {origin && <QRCodeSVG value={`${origin}/vote`} size={100} level="H" />}
                </div>
            </div>
        </div>
    );
}
