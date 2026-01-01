import { NextResponse } from "next/server";
import { PollService } from "@/services/PollService";

export async function POST(request) {
    try {
        const body = await request.json();
        const { category = "General" } = body;

        console.log(`[API] Generating new poll for category: ${category}`);

        const newPoll = await PollService.rotatePoll(category);

        return NextResponse.json({
            success: true,
            poll: newPoll,
            message: `New ${category} poll generated successfully`
        });
    } catch (error) {
        console.error("[API] Poll generation error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message
            },
            { status: 500 }
        );
    }
}
