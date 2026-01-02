import { NextResponse } from "next/server";
import { PollService } from "@/services/PollService";
import { createLogger } from "@/lib/logger";

const log = createLogger('PollRotateAPI');

export async function POST(request) {
    try {
        // Simple internal check could be added here if needed
        log.info('Manual rotation triggered via API');
        const poll = await PollService.rotatePoll("General");
        return NextResponse.json({ success: true, poll });
    } catch (error) {
        log.error('Rotation API Error:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
