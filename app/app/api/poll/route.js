import { NextResponse } from "next/server";
import { PollService } from "@/services/PollService";

export async function GET() {
    try {
        let poll = await PollService.getCurrentPoll();

        // Logic to auto-rotate if expired or doesn't exist
        if (!poll || new Date() > new Date(poll.expiresAt)) {
            console.log("Rotating poll...");
            poll = await PollService.rotatePoll("General");
        }

        const previous = await PollService.getPreviousPoll();

        return NextResponse.json({ current: poll, previous });
    } catch (error) {
        console.error("Poll API Error:", error);

        // Fallback data so the stream doesn't break
        const fallbackPoll = {
            id: "fallback",
            optionA: { name: "Batman", image: "/option_a.png" },
            optionB: { name: "Superman", image: "/option_b.png" },
            expiresAt: new Date(Date.now() + 300000).toISOString(), // 5 mins
            isFallback: true
        };

        return NextResponse.json(fallbackPoll);
    }
}
