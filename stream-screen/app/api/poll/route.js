import { NextResponse } from "next/server";
import { PollService } from "@/services/PollService";
import { createLogger } from "@/lib/logger";

const log = createLogger('PollAPI');

export async function GET() {
    try {
        let poll = await PollService.getCurrentPoll();

        // Logic to auto-rotate if expired or doesn't exist
        if (!poll || new Date() > new Date(poll.expiresAt)) {
            log.info('Rotating poll...');
            poll = await PollService.rotatePoll("General");
        }

        // Fetch combat state for the client
        let combatState = null;
        if (poll) {
            const { fighterStateService } = await import("@/lib/fighterStateService");
            combatState = await fighterStateService.updateCombat(poll.id, poll);
        }

        const previous = await PollService.getPreviousPoll();
        return NextResponse.json({ current: poll, previous, combatState });
    } catch (error) {
        log.error('Poll API Error:', error.message, error.stack);

        // Fallback data so the stream doesn't break
        const fallbackPoll = {
            id: "fallback",
            optionA: { name: "Batman", image: "/option_a.png", _count: { votes: 0 } },
            optionB: { name: "Superman", image: "/option_b.png", _count: { votes: 0 } },
            expiresAt: new Date(Date.now() + 300000).toISOString(), // 5 mins
            isFallback: true
        };

        return NextResponse.json({ current: fallbackPoll, previous: null });
    }
}
