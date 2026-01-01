"use client";
import dynamic from "next/dynamic";

const FighterGame = dynamic(() => import("@/components/arcade/FighterGame"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-yellow-500 text-6xl font-black italic tracking-tighter animate-bounce">VERSUS</div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-black">
      <FighterGame />
    </main>
  );
}
