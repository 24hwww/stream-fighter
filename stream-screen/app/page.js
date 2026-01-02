"use client";
import dynamic from "next/dynamic";

const ArcadeContainer = dynamic(() => import("@/components/arcade/ArcadeContainer"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-black">
      <ArcadeContainer />
    </main>
  );
}
