import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { prompt } = await req.json();

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://stream-fighter.com", // Optional, for OpenRouter rankings
                "X-Title": "Stream Fighter", // Optional
            },
            body: JSON.stringify({
                model: process.env.OPENROUTER_MODEL?.split(',')[0] || "meta-llama/llama-3.1-8b-instruct",
                messages: [
                    {
                        "role": "user",
                        "content": prompt || "Generate a funny or epic 1v1 fighting game matchup. Provide only two names separated by |. Example: Batman | Iron Man. Keep it short."
                    }
                ],
                temperature: 0.8,
                max_tokens: 50,
            })
        });

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim() || "Fighter A | Fighter B";

        return NextResponse.json({ text });
    } catch (error) {
        console.error("AI API Error:", error);
        return NextResponse.json({ text: "Error | Error" }, { status: 500 });
    }
}
