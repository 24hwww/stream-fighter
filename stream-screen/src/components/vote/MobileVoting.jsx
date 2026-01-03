import React, { useEffect, useState, useRef } from "react";
import { createSocketClient } from "../../lib/socketClient.js";

export default function MobileVoting() {
    const [poll, setPoll] = useState(null);
    const [votedSide, setVotedSide] = useState(null); // 'A' or 'B'
    const [isVibrating, setIsVibrating] = useState(false);
    const [shoutout, setShoutout] = useState("");
    const [shoutoutStatus, setShoutoutStatus] = useState(null); // 'sending', 'sent'
    const [latency, setLatency] = useState(0);
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
            console.error("Fetch error:", err);
        }
    };

    useEffect(() => {
        setIsMounted(true);
        fetchPoll();

        const socket = createSocketClient();
        socketRef.current = socket;

        const start = Date.now();
        socket.on("connect", () => {
            setLatency(Date.now() - start);
        });

        socket.on("poll-update", (newPoll) => {
            setPoll(newPoll);
            setVotedSide(null);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const handleVote = async (side) => {
        if (!poll) return;

        setVotedSide(side);
        setIsVibrating(true);
        setTimeout(() => setIsVibrating(false), 100);

        // Standard vibration API if available
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(50);
        }

        const optionId = side === 'A' ? poll.optionA.id : poll.optionB.id;

        try {
            await fetch("/api/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pollId: poll.id, optionId })
            });
        } catch (err) {
            console.error("Vote error:", err);
        }
    };

    const sendShoutout = async (e) => {
        e.preventDefault();
        if (!shoutout.trim() || shoutoutStatus === 'sending') return;

        setShoutoutStatus('sending');
        try {
            await fetch("/api/shoutout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: shoutout })
            });
            setShoutout("");
            setShoutoutStatus('sent');
            setTimeout(() => setShoutoutStatus(null), 3000);
        } catch (err) {
            console.error("Shoutout error:", err);
            setShoutoutStatus(null);
        }
    };

    if (!isMounted) return null;

    if (!poll) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-yellow-500 font-mono p-6">
            <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-6" />
            <p className="text-xl font-black italic animate-pulse">ESTABLISHING UPLINK...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white font-mono flex flex-col overflow-hidden">

            {/* Header: Terminal Style */}
            <header className="bg-yellow-500 text-black p-4 flex flex-col items-center shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">BRAWL REMOTE NODE</h1>
                <div className="flex gap-4 mt-2">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                        <span className="text-[8px] font-bold uppercase tracking-widest">Live Uplink</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-[8px] font-bold text-black/60 uppercase tracking-widest">Lat: {latency}ms</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-6 flex flex-col gap-6 max-w-md mx-auto w-full">

                {/* Matchup Banner */}
                <div className="text-center">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-[0.4em] mb-2">Current Combat Simulation</p>
                    <div className="flex items-center justify-center gap-4">
                        <span className="text-lg font-black uppercase text-yellow-500 truncate max-w-[120px]">{poll.optionA.name}</span>
                        <span className="text-zinc-700 italic font-black">VS</span>
                        <span className="text-lg font-black uppercase text-blue-500 truncate max-w-[120px]">{poll.optionB.name}</span>
                    </div>
                </div>

                {/* Team Selector */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => handleVote('A')}
                        className={`h-28 border-4 transition-all relative flex flex-col items-center justify-center p-2 rounded-lg ${votedSide === 'A'
                            ? 'border-yellow-500 bg-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.5)]'
                            : 'border-zinc-900 bg-zinc-900/50 hover:border-zinc-700'
                            }`}
                    >
                        <span className="text-[9px] font-bold text-zinc-500 absolute top-2 uppercase">Team A</span>
                        <span className="font-black text-sm uppercase text-center mt-2 leading-tight">{poll.optionA.name}</span>
                        {votedSide === 'A' && <div className="absolute inset-0 bg-yellow-500/10 animate-pulse rounded-lg" />}
                    </button>

                    <button
                        onClick={() => handleVote('B')}
                        className={`h-28 border-4 transition-all relative flex flex-col items-center justify-center p-2 rounded-lg ${votedSide === 'B'
                            ? 'border-blue-500 bg-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                            : 'border-zinc-900 bg-zinc-900/50 hover:border-zinc-700'
                            }`}
                    >
                        <span className="text-[9px] font-bold text-zinc-500 absolute top-2 uppercase">Team B</span>
                        <span className="font-black text-sm uppercase text-center mt-2 leading-tight">{poll.optionB.name}</span>
                        {votedSide === 'B' && <div className="absolute inset-0 bg-blue-500/10 animate-pulse rounded-lg" />}
                    </button>
                </div>

                {/* Main Action Trigger */}
                <div className="flex-1 flex flex-col items-center justify-center py-4">
                    <div className="text-[10px] text-zinc-600 uppercase font-bold mb-4 tracking-widest">Execute Combat Command</div>
                    <button
                        onClick={() => votedSide && handleVote(votedSide)}
                        disabled={!votedSide}
                        className={`w-48 h-48 rounded-full border-8 transition-all flex flex-col items-center justify-center box-border ${!votedSide
                            ? 'border-zinc-900 bg-zinc-950 text-zinc-800'
                            : votedSide === 'A'
                                ? 'border-yellow-500 bg-yellow-500/10 text-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.4)] active:scale-90 active:brightness-150'
                                : 'border-blue-500 bg-blue-500/10 text-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.4)] active:scale-90 active:brightness-150'
                            } ${isVibrating ? 'scale-105' : ''}`}
                    >
                        <span className="text-4xl mb-1">⚡</span>
                        <span className="text-xl font-black italic tracking-tighter">ACTION</span>
                    </button>
                    <div className="text-[8px] text-zinc-700 mt-4 uppercase tracking-[0.3em]">Spam to trigger attacks</div>
                </div>

                {/* Shoutout Box */}
                <div className="bg-zinc-900/80 border-t-2 border-yellow-500/30 p-4 rounded-t-2xl">
                    <p className="text-[10px] text-yellow-500 font-bold mb-3 uppercase tracking-widest flex justify-between">
                        <span>Transmission Feeder</span>
                        <span className="opacity-50 font-mono">CH-88</span>
                    </p>
                    <form onSubmit={sendShoutout} className="flex gap-2">
                        <input
                            type="text"
                            maxLength={35}
                            value={shoutout}
                            onChange={(e) => setShoutout(e.target.value)}
                            placeholder="Type a live shoutout..."
                            className="flex-1 bg-black border border-zinc-800 rounded-lg p-3 text-sm focus:outline-none focus:border-yellow-500 transition-colors uppercase font-mono tracking-tight"
                        />
                        <button
                            type="submit"
                            disabled={!shoutout.trim() || shoutoutStatus === 'sending'}
                            className={`px-4 rounded-lg font-black text-xs uppercase transition-all ${shoutoutStatus === 'sent'
                                ? 'bg-green-500 text-white'
                                : 'bg-yellow-500 text-black hover:bg-white active:scale-95 disabled:opacity-20'
                                }`}
                        >
                            {shoutoutStatus === 'sending' ? '...' : shoutoutStatus === 'sent' ? 'OK!' : 'SEND'}
                        </button>
                    </form>
                </div>
            </main>

            <footer className="p-4 bg-black border-t border-zinc-900 text-[8px] text-zinc-600 text-center uppercase tracking-[0.5em] leading-relaxed">
                Terminal Auth: <span className="text-zinc-400">0xEF82...B1A2</span><br />
                PIXEL-BRAWL NETWORKS V2.0
            </footer>
        </div>
    );
}
