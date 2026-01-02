import { NextResponse } from "next/server";
import { createSocketClient } from "@/lib/socketClient";

// Server-side socket to emit shoutouts to everyone
const socket = createSocketClient();

export async function POST(req) {
    try {
        const { message, user = "ANON" } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Missing message" }, { status: 400 });
        }

        // Emit to all clients via the socket server
        socket.emit("shoutout", {
            message: message.substring(0, 50).toUpperCase(),
            user: user.substring(0, 15).toUpperCase(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Shoutout API Error:", error);
        return NextResponse.json({ error: "Failed to send shoutout" }, { status: 500 });
    }
}
