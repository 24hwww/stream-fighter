"use client";
import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { DollarSign } from "lucide-react";

export default function Sidebar() {
  return (
    <div className="flex flex-col h-full gap-6">
      {/* Publicity Slot 1 */}
      <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center relative group">
        <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] font-bold text-white/40 uppercase">Publicidad</div>
        <img 
          src="/publicity_a.png" 
          alt="Ad" 
          className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity"
          onError={(e) => e.target.src = "https://via.placeholder.com/320x400?text=Tu+Publicidad+Aqui"}
        />
      </div>

      {/* Donation QR */}
      <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-2xl border border-white/10 p-4 flex flex-col items-center gap-3 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-green-400 font-bold uppercase text-xs">
          <DollarSign size={14} /> Apoya el Stream
        </div>
        <div className="p-2 bg-white rounded-xl">
          <QRCodeSVG value={process.env.NEXT_PUBLIC_DONATION_URL || "https://paypal.me/yourid"} size={120} level="H" />
        </div>
        <p className="text-[10px] text-white/40 text-center font-mono">DONACIONES AQUÍ</p>
      </div>

      {/* Publicity Slot 2 */}
      <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center relative group">
        <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] font-bold text-white/40 uppercase">Publicidad</div>
        <img 
          src="/publicity_b.png" 
          alt="Ad" 
          className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity"
          onError={(e) => e.target.src = "https://via.placeholder.com/320x400?text=Tu+Publicidad+Aqui"}
        />
      </div>
    </div>
  );
}
