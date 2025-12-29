"use client";
import React, { useState, useEffect } from "react";
import { Star, Heart, CheckCircle2, Loader2 } from "lucide-react";

export default function MobileVoting() {
    const [poll, setPoll] = useState(null);
    const [voted, setVoted] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetch("/api/poll")
            .then(res => res.json())
            .then(data => {
                if (!data.error) setPoll(data);
                setLoading(false);
            });
    }, []);

    const handleVote = async (optionId, optionName) => {
        setSubmitting(true);
        try {
            await fetch("/api/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pollId: poll.id, optionId })
            });
            setVoted(optionName);
        } catch (err) {
            console.error("Error voting:", err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-zinc-500">
                <Loader2 className="animate-spin mb-4" />
                <span className="font-mono uppercase text-xs tracking-widest">Cargando votación...</span>
            </div>
        );
    }

    if (voted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 border border-green-500/50">
                    <CheckCircle2 size={48} className="text-green-500" />
                </div>
                <h2 className="text-3xl font-black italic uppercase mb-2">¡Voto Enviado!</h2>
                <p className="text-zinc-500">Tu elección por <span className="text-white font-bold">{voted}</span> ha sido registrada.</p>
                <button
                    onClick={() => setVoted(null)}
                    className="mt-12 text-zinc-600 underline text-sm uppercase tracking-widest"
                >
                    Volver a votar
                </button>
            </div>
        );
    }

    if (!poll) return <div className="text-white p-10">No hay encuestas activas.</div>;

    return (
        <div className="flex flex-col min-h-screen bg-zinc-950 text-white p-6 font-sans">
            <header className="py-8 text-center">
                <h1 className="text-4xl font-black italic tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-orange-400">
                    VOTACIÓN LIVE
                </h1>
                <div className="h-[2px] w-12 bg-zinc-800 mx-auto mt-4" />
            </header>

            <div className="flex-1 flex flex-col gap-6 justify-center max-w-sm mx-auto w-full">
                <button
                    onClick={() => handleVote(poll.optionAId, poll.optionA.name)}
                    disabled={submitting}
                    className="group relative disabled:opacity-50"
                >
                    <div className="flex items-center gap-5 p-6 bg-purple-600/10 border-2 border-purple-500/20 rounded-2xl active:scale-95 transition-all group-hover:border-purple-500/50">
                        <div className="bg-purple-500 p-4 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                            <Star fill="white" size={32} />
                        </div>
                        <div className="text-left font-black italic text-2xl uppercase text-purple-400">Votar {poll.optionA.name}</div>
                    </div>
                </button>

                <div className="flex items-center gap-4 py-2 opacity-20">
                    <div className="flex-1 h-[1px] bg-white" />
                    <span className="font-black italic">VS</span>
                    <div className="flex-1 h-[1px] bg-white" />
                </div>

                <button
                    onClick={() => handleVote(poll.optionBId, poll.optionB.name)}
                    disabled={submitting}
                    className="group relative disabled:opacity-50"
                >
                    <div className="flex items-center gap-5 p-6 bg-orange-600/10 border-2 border-orange-500/20 rounded-2xl active:scale-95 transition-all group-hover:border-orange-500/50">
                        <div className="bg-orange-500 p-4 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                            <Heart fill="white" size={32} />
                        </div>
                        <div className="text-left font-black italic text-2xl uppercase text-orange-400">Votar {poll.optionB.name}</div>
                    </div>
                </button>
            </div>

            <footer className="py-10 text-center opacity-30 text-[10px] uppercase tracking-widest">
                StreamFighter AI & Bullish Design
            </footer>
        </div>
    );
}
