import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

export const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

export const aiModel = openrouter(process.env.OPENROUTER_MODEL?.split(',')[0] || 'google/gemini-2.0-flash-001');

export async function generateNewPoll(categoryName) {
    const prompt = `Generate a versus poll for the category: ${categoryName}. 
  Provide two contrasting options with a short name and a description of why they are competing.
  Provide a relevant image keyword for each option (e.g., "batman-dark-knight").
  Return ONLY valid JSON: { "optionA": { "name": "...", "description": "...", "image": "..." }, "optionB": { "name": "...", "description": "...", "image": "..." } }`;

    const { text } = await generateText({
        model: aiModel,
        prompt: prompt,
    });

    // Clean output for markdown blocks
    const cleanText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanText);
}
