import { NextResponse } from 'next/server';
import { generateNewPoll } from '@/lib/ai';

export async function POST(req) {
    try {
        const { prompt } = await req.json();

        // Redirect to procedural generation instead of OpenRouter
        console.log(`[AI Stub] Procedural generation requested for: ${prompt}`);

        // This route was originally for a single character, 
        // so we'll just return the 'optionA' part of a new poll generation
        const pollData = await generateNewPoll("General");

        return NextResponse.json(pollData.optionA.design);

    } catch (error) {
        console.error("AI Generation Failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
