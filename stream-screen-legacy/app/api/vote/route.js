import { NextResponse } from "next/server";
import { PollService } from "@/services/PollService";

export async function POST(req) {
    try {
        const { pollId, optionId } = await req.json();

        if (!pollId || !optionId) {
            return NextResponse.json({ error: "Missing data" }, { status: 400 });
        }

        const vote = await PollService.registerVote(pollId, optionId);
        return NextResponse.json(vote);
    } catch (error) {
        console.error("Vote API Error:", error);
        return NextResponse.json({ error: "Failed to register vote" }, { status: 500 });
    }
}
