"use client";
import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { createSocketClient } from "@/lib/socketClient";
import { QRCodeSVG } from "qrcode.react";

// Dynamically import PhaserGame to avoid SSR issues
const PhaserGame = dynamic(() => import("./PhaserGame"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full w-full bg-black">
            <div className="text-yellow-500 text-6xl font-black italic tracking-tighter animate-bounce">LOADING ARENA...</div>
        </div>
    )
});

const formatTimer = (seconds) => {
    if (!seconds && seconds !== 0) return "03:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function ArcadeContainer() {
    const [poll, setPoll] = useState(null);
    const [combatState, setCombatState] = useState(null);
    const [tickerMessages, setTickerMessages] = useState(["PIXEL BRAWL ARENA LIVE", "SCAN QR TO JOIN THE BATTLE", "VOTE TO TRIGGER ATTACKS"]);
    const [winner, setWinner] = useState(null);
    const socketRef = useRef(null);

    // Initial Fetch
    useEffect(() => {
        fetch("/api/poll")
            .then(res => res.json())
            .then(data => {
                if (data.current) {
                    setPoll(data.current);
                    if (data.combatState) {
                        setCombatState(data.combatState);
                        checkWinner(data.combatState, data.current);
                    }
                    if (data.current.optionA && data.current.optionB) {
                        fetchInitialHeadline(`${data.current.optionA.name} VS ${data.current.optionB.name}`);
                    }
                }
            })
            .catch(err => console.error("Poll fetch error", err));

        // Connect Socket
        const socket = createSocketClient();
        socketRef.current = socket;

        socket.on("heartbeat", (data) => {
            // High-frequency sync from server pulse
            if (data.combatState) {
                setCombatState(data.combatState);
                checkWinner(data.combatState, poll);
            }
        });

        socket.on("vote", (data) => {
            setPoll(prev => {
                if (!prev || prev.id !== data.pollId) return prev;
                return {
                    ...prev,
                    optionA: { ...prev.optionA, _count: { votes: data.optionA_votes } },
                    optionB: { ...prev.optionB, _count: { votes: data.optionB_votes } }
                };
            });
        });

        socket.on("shoutout", (data) => {
            const formatted = `[SHOUTOUT] ${data.user}: ${data.message}`;
            setTickerMessages(prev => [...prev.slice(-10), formatted]);
        });

        socket.on("poll-update", (newPoll) => {
            setPoll(newPoll);
            setCombatState(null);
            setWinner(null);
            if (newPoll.optionA && newPoll.optionB) {
                fetchInitialHeadline(`${newPoll.optionA.name} VS ${newPoll.optionB.name}`);
            }
        });

        return () => socket.disconnect();
    }, [poll?.id]); // Depend on poll.id to ensure logic updates

    const fetchInitialHeadline = async (matchupStr) => {
        try {
            const res = await fetch("/api/ai/news", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: `Generate a short hype headline for ${matchupStr}` })
            });
            const data = await res.json();
            if (data.text) {
                setTickerMessages(prev => [...prev, data.text.toUpperCase()]);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const checkWinner = (state, currentPoll) => {
        if (!state || !currentPoll) return;
        if (state.fighterA.hp <= 0 && !winner) {
            setWinner(currentPoll.optionB.name);
        } else if (state.fighterB.hp <= 0 && !winner) {
            setWinner(currentPoll.optionA.name);
        }
    };

    // Derived Matchup Data for Phaser
    const matchup = poll ? {
        playerKey: poll.optionA?.image || getCharacterKey(poll.optionA?.name),
        enemyKey: poll.optionB?.image || getCharacterKey(poll.optionB?.name),
        playerCheck: poll.optionA?.name,
        enemyCheck: poll.optionB?.name
    } : null;

    function getCharacterKey(name) {
        if (!name) return 'geek';
        const roster = ['geek', 'pirate', 'ninja', 'sexy', 'cook', 'cat', 'dog'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        const index = Math.abs(hash) % roster.length;
        return roster[index];
    }

    if (!poll) return (
        <div className="w-screen h-screen bg-black flex flex-col items-center justify-center text-yellow-500 font-mono">
            <h1 className="text-4xl font-black animate-pulse">SEARCHING FOR MATCH...</h1>
        </div>
    );

    const networkIp = process.env.NEXT_PUBLIC_NETWORK_IP;
    const networkPort = process.env.NEXT_PUBLIC_PORT || '3000';
    const voteUrl = networkIp
        ? `http://${networkIp}:${networkPort}/vote`
        : (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/vote` : '');
    const totalVotes = (poll.optionA._count.votes || 0) + (poll.optionB._count.votes || 0) || 1;
    const p1Percent = Math.round(((poll.optionA._count.votes || 0) / totalVotes) * 100);
    const p2Percent = Math.round(((poll.optionB._count.votes || 0) / totalVotes) * 100);

    return (
        <div className="relative w-screen h-screen flex bg-black overflow-hidden font-mono text-white select-none">

            {/* Main Game Area */}
            <div className="relative flex-1 h-full overflow-hidden">

                {/* HUD: Top Bar */}
                <div className="absolute top-0 left-0 w-full p-8 flex justify-between z-20 pointer-events-none drop-shadow-lg">
                    {/* Player 1 */}
                    <div className="w-[35%] flex flex-col items-start">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="text-yellow-400 font-black text-4xl italic tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">
                                {poll.optionA.name}
                            </div>
                            <div className="px-2 py-0.5 bg-red-600 text-[10px] text-white font-bold rounded animate-pulse">LIVE</div>
                        </div>
                        <div className="w-full h-8 bg-black/80 border-4 border-white/20 skew-x-[-15deg] relative overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-300"
                                style={{ width: `${combatState?.fighterA?.hp ? combatState.fighterA.hp * 100 : 100}%` }} />
                        </div>
                        <div className="mt-2 text-yellow-500 text-xs font-bold tracking-widest">{p1Percent}% SUPPORT</div>
                    </div>

                    {/* TIMER / VS */}
                    <div className="flex flex-col items-center pt-2">
                        <div className="text-zinc-600 text-xs font-bold tracking-[0.3em] mb-1">MATCH TIMER</div>
                        <div className="text-6xl font-black italic text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] bg-black/40 px-6 py-1 border-x-4 border-white leading-none">
                            {formatTimer(combatState?.timer)}
                        </div>
                        <div className="text-zinc-500 text-[10px] font-bold mt-2 uppercase tracking-widest">ROUND 1</div>
                    </div>

                    {/* Player 2 */}
                    <div className="w-[35%] flex flex-col items-end">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="text-blue-400 font-black text-4xl italic tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] text-right">
                                {poll.optionB.name}
                            </div>
                        </div>
                        <div className="w-full h-8 bg-black/80 border-4 border-white/20 skew-x-[15deg] relative overflow-hidden">
                            <div className="w-full h-full flex justify-end">
                                <div className="h-full bg-gradient-to-l from-blue-600 to-blue-400 transition-all duration-300"
                                    style={{ width: `${combatState?.fighterB?.hp ? combatState.fighterB.hp * 100 : 100}%` }} />
                            </div>
                        </div>
                        <div className="mt-2 text-blue-500 text-xs font-bold tracking-widest">{p2Percent}% SUPPORT</div>
                    </div>
                </div>

                {/* Game Overlay (K.O.) */}
                {winner && (
                    <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                        <div className="text-yellow-500 text-8xl font-black italic tracking-tighter drop-shadow-[0_0_30px_rgba(234,179,8,0.5)] mb-4">
                            K.O.
                        </div>
                        <div className="text-white text-3xl font-black uppercase text-center bg-red-600 px-10 py-2 skew-x-[-10deg]">
                            {winner} WINS!
                        </div>
                        <div className="mt-8 text-zinc-400 text-sm animate-pulse">GENERATING NEXT ROUND...</div>
                    </div>
                )}

                {/* Ticker Bottom */}
                <div className="absolute bottom-0 left-0 w-full h-16 bg-zinc-900 border-t-4 border-yellow-500 z-30 flex items-center shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                    <div className="bg-yellow-500 text-black font-black text-xl px-6 h-full flex items-center justify-center whitespace-nowrap z-40">
                        BRAWL TICKER
                    </div>
                    <div className="flex-1 overflow-hidden relative h-full flex items-center bg-black/50">
                        <div className="text-white uppercase font-mono text-2xl tracking-tight animate-marquee inline-block whitespace-nowrap px-4">
                            {tickerMessages.map((m, i) => (
                                <React.Fragment key={i}>
                                    <span className="mx-8 text-yellow-500 italic font-black">///</span>
                                    <span>{m}</span>
                                </React.Fragment>
                            ))}
                            <span className="mx-8 text-yellow-500 italic font-black">///</span>
                            JOIN THE FIGHT AT {voteUrl.replace(/^https?:\/\//, '').toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* Game Layer */}
                <div className="absolute inset-0 z-0 scale-105 blur-[1px]">
                    {/* Background parallax or atmosphere? Phaser handles it. */}
                </div>
                <div className="absolute inset-0 z-10">
                    <PhaserGame
                        combatState={combatState}
                        matchup={matchup}
                        stage={poll.stage}
                    />
                </div>
            </div>

            {/* Sidebar */}
            <div className="w-80 h-full bg-[#0a0a0a] border-l-4 border-yellow-500 z-30 flex flex-col p-8 relative">
                <div className="mb-10 text-center">
                    <h2 className="text-yellow-500 font-black text-6xl italic leading-[0.7] uppercase tracking-tighter">
                        CONT<br /><span className="text-white">ROL</span>
                    </h2>
                    <div className="h-2 w-20 bg-red-600 mx-auto mt-4"></div>
                </div>

                <div className="bg-white p-3 rounded-lg self-center mb-10 shadow-[0_0_40px_rgba(234,179,8,0.2)] hover:scale-105 transition-all">
                    {voteUrl && <QRCodeSVG value={voteUrl} size={180} level="M" />}
                </div>

                <div className="flex-1 space-y-8 font-mono">
                    <div className="bg-zinc-900/50 p-4 border-l-4 border-yellow-500">
                        <p className="text-[10px] text-yellow-500 font-bold mb-2 uppercase tracking-widest">System Status</p>
                        <ul className="space-y-2">
                            <li className="flex justify-between items-center text-[10px]">
                                <span className="text-zinc-500">AI CORE</span>
                                <span className="text-green-500">ONLINE</span>
                            </li>
                            <li className="flex justify-between items-center text-[10px]">
                                <span className="text-zinc-500">LATENCY</span>
                                <span className="text-zinc-300">12ms</span>
                            </li>
                            <li className="flex justify-between items-center text-[10px]">
                                <span className="text-zinc-500">VOTES</span>
                                <span className="text-white font-bold">{totalVotes}</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-zinc-900/50 p-4 border-l-4 border-red-600">
                        <p className="text-[10px] text-red-600 font-bold mb-2 uppercase tracking-widest">Remote Nodes</p>
                        <div className="text-3xl font-black text-white">{Math.floor(Math.random() * 50) + 120}</div>
                        <p className="text-[8px] text-zinc-500 mt-1 uppercase">Active battle controllers</p>
                    </div>
                </div>

                <div className="mt-auto">
                    <p className="text-[9px] text-zinc-700 uppercase tracking-widest mb-2 font-bold">Terminal Access</p>
                    <p className="text-yellow-500 text-[10px] break-all font-bold underline decoration-dotted">{voteUrl.replace(/^https?:\/\//, '')}</p>
                </div>

                {/* CRT Overlay */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-10"></div>
            </div>

            <style jsx global>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
            `}</style>
        </div>
    );
}
