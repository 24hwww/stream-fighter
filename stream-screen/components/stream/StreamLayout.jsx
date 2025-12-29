"use client";
import React from "react";
import PollSection from "./PollSection";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

export default function StreamLayout() {
    return (
        <div className="flex h-screen w-screen bg-black text-white p-6 gap-6 relative overflow-hidden">
            {/* Main Content (Poll) */}
            <div className="flex-1 flex flex-col gap-6 relative z-10">
                <header className="text-center h-24 flex flex-col justify-center">
                    <h1 className="text-5xl font-black italic tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-orange-400">
                        EL GRAN VERSUS
                    </h1>
                </header>

                <main className="flex-1 flex items-center justify-center">
                    <PollSection />
                </main>

                <footer className="h-40">
                    <Footer />
                </footer>
            </div>

            {/* Sidebar (Publicity & Donations) */}
            <aside className="w-80 h-full flex flex-col gap-6 relative z-10">
                <Sidebar />
            </aside>

            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600 rounded-full blur-[120px]" />
            </div>
        </div>
    );
}
