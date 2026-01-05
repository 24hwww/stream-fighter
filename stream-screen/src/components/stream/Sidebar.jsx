"use client";
import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { DollarSign, Smartphone } from "lucide-react";

export default function Sidebar() {
  // Use a client-side only URL for the QR code
  const [voteUrl, setVoteUrl] = React.useState("");

  React.useEffect(() => {
    // Get base URL from API to ensure it uses network IP
    const fetchBaseUrl = async () => {
      try {
        const res = await fetch("/api/base-url");
        const data = await res.json();
        if (data.baseUrl) {
          setVoteUrl(data.baseUrl + "/vote");
        } else {
          // Fallback to current origin
          const origin = window.location.origin;
          // Replace localhost with network IP if available
          const networkIp = data.networkIp;
          if (networkIp && origin.includes('localhost')) {
            setVoteUrl(`http://${networkIp}:3010/vote`);
          } else {
            setVoteUrl(origin + "/vote");
          }
        }
      } catch (err) {
        console.error("Error fetching base URL:", err);
        // Fallback: try to use hostname (works if accessed via network IP)
        const hostname = window.location.hostname;
        const port = window.location.port || '3010';
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
          setVoteUrl(`http://${hostname}:${port}/vote`);
        } else {
          setVoteUrl(window.location.origin + "/vote");
        }
      }
    };

    fetchBaseUrl();
  }, []);

  // const [origin, setOrigin] = React.useState("");

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Voting QR Section */}
      <div className="bg-gradient-to-br from-purple-600/30 to-orange-600/30 rounded-3xl border-2 border-white/20 p-6 flex flex-col items-center gap-4 backdrop-blur-xl shadow-[0_0_50px_rgba(168,85,247,0.2)]">
        <div className="flex items-center gap-2 text-white font-black uppercase text-sm tracking-widest animate-pulse">
          <Smartphone size={18} className="text-purple-400" /> ¡Vota Ahora!
        </div>
        <div className="p-4 bg-white rounded-2xl shadow-xl transform transition-transform hover:scale-105">
          {voteUrl && (
            <QRCodeSVG
              value={voteUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
          )}
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-sm uppercase leading-tight italic">
            Escanea con tu celular<br />para votar
          </p>
          <div className="mt-2 h-1 w-12 bg-gradient-to-r from-purple-500 to-orange-500 mx-auto rounded-full" />
        </div>
      </div>

      {/* Publicity Slot 1 */}
      <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center relative group">
        <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] font-bold text-white/40 uppercase text-xs">Publicidad</div>
        <img
          src="/publicity_a.png"
          alt="Ad"
          className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity"
          onError={(e) => e.target.src = "https://via.placeholder.com/320x400?text=Tu+Publicidad+Aqui"}
        />
      </div>

      {/* Donation QR (Moved/Smaller) */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-3 flex flex-col items-center gap-2 backdrop-blur-sm opacity-60 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 text-green-400 font-bold uppercase text-[10px]">
          <DollarSign size={10} /> Apoya el Stream
        </div>
        <div className="p-1 bg-white rounded-lg">
          <QRCodeSVG value={import.meta.env.VITE_DONATION_URL || "https://paypal.me/yourid"} size={60} level="H" />
        </div>
      </div>
    </div>
  );
}
