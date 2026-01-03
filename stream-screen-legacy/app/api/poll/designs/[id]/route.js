import { NextResponse } from "next/server";
import redis from "@/lib/redis";

export async function GET(req, { params }) {
    try {
        const { id } = await params;

        if (id === "fallback") {
            return NextResponse.json(null);
        }

        const cached = await redis.get(`designs_poll_${id}`);

        if (cached) {
            return NextResponse.json(JSON.parse(cached));
        }

        // Return null instead of 404 to avoid console noise
        return NextResponse.json(null);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
