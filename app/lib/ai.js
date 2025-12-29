import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

export const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

export const aiModel = openrouter('google/gemini-2.0-flash-001'); // Reliable and fast model

export async function generateNewPoll(categoryName) {
    const prompt = `Generate a versus poll for the category: ${categoryName}. 
  Provide two contrasting options with a short name and a description of why they are competing.
  Provide a relevant image keyword for each option (e.g., "batman-dark-knight").
  Return ONLY valid JSON: { "optionA": { "name": "...", "description": "...", "image": "..." }, "optionB": { "name": "...", "description": "...", "image": "..." } }`;

    const { text } = await generateText({
        model: aiModel,
        prompt: prompt,
    });

    return JSON.parse(text);
}
