"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { Trophy, Clock } from "lucide-react";

export default function Home() {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-12 bg-black text-white overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 text-center mt-4">
        <h1 className="text-5xl font-black tracking-tighter uppercase italic mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-orange-400">
          Escoge la opción que tú quieras
        </h1>
        <div className="flex items-center justify-center gap-2 text-zinc-500 font-mono text-xl uppercase tracking-widest">
          <Trophy size={20} /> El Gran Versus Semanal <Trophy size={20} />
        </div>
      </div>

      {/* Versus Grid */}
      <div className="relative z-10 flex items-center justify-center gap-16 w-full max-w-5xl">
        {/* Option A */}
        <div className="flex flex-col items-center group">
          <div className="relative w-[340px] h-[340px] p-2 bg-gradient-to-br from-purple-500/50 to-transparent rounded-2xl border-4 border-purple-500/30 overflow-hidden transition-all duration-500 group-hover:scale-105 group-hover:border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)] group-hover:shadow-[0_0_50px_rgba(168,85,247,0.4)]">
            <img src="/option_a.png" alt="Option A" className="w-full h-full object-cover rounded-xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-bottom justify-center pb-4">
              <span className="text-4xl font-black text-purple-400">OPCIÓN A</span>
            </div>
          </div>
        </div>

        {/* VS Divider */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-1 bg-zinc-800" />
          <div className="text-7xl font-black text-white/50 italic select-none">VS</div>
          <div className="w-16 h-1 bg-zinc-800" />
        </div>

        {/* Option B */}
        <div className="flex flex-col items-center group">
          <div className="relative w-[340px] h-[340px] p-2 bg-gradient-to-br from-orange-500/50 to-transparent rounded-2xl border-4 border-orange-500/30 overflow-hidden transition-all duration-500 group-hover:scale-105 group-hover:border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.2)] group-hover:shadow-[0_0_50px_rgba(249,115,22,0.4)]">
            <img src="/option_b.png" alt="Option B" className="w-full h-full object-cover rounded-xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-bottom justify-center pb-4">
              <span className="text-4xl font-black text-orange-400">OPCIÓN B</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Interface */}
      <div className="relative z-10 w-full flex items-end justify-between px-8 mb-4">
        {/* Timer */}
        <div className="flex flex-col gap-1">
          <span className="text-zinc-500 font-mono text-sm uppercase tracking-widest flex items-center gap-2">
            <Clock size={14} /> Tiempo Restante
          </span>
          <div className="text-6xl font-mono font-bold tabular-nums text-white">
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* QR Code Section */}
        <div className="flex items-center gap-6 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
          <div className="flex flex-col text-right">
            <span className="text-blue-400 font-bold uppercase text-sm">¿Quieres votar?</span>
            <span className="text-white/60 text-xs">Escanea el código QR</span>
            <span className="text-white/40 text-[10px] mt-1 font-mono">vota.tudominio.com</span>
          </div>
          <div className="p-2 bg-white rounded-xl">
            <QRCodeSVG value="https://vota.tudominio.com" size={80} level="H" />
          </div>
        </div>
      </div>

      {/* Style for consistent centering and layout */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 0;
          background: black;
          width: 1280px;
          height: 720px;
          overflow: hidden;
        }
      `}</style>
    </main>
  );
}
