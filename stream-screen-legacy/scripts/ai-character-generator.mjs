import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { FighterTemplates } from '../engine/sprites/fighterTemplates.js';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

// Example context from existing templates (simplified for token limit if needed)
const EXAMPLE_TEMPLATE = JSON.stringify(FighterTemplates.HEAD, null, 2);

const SYSTEM_PROMPT = `
You are a Senior Pixel Art Engine Developer. 
Your task is to generate JavaScript code for a "FighterTemplate" object based on a text description.

### Context
We use a custom 16-bit arcade engine where characters are defined by ASCII-art bitmaps.
The format is STRICT. You must return a valid JavaScript object.

### Pixel Legend / Palette
. -> TRANSPARENT
# -> OUTLINE (0x1b1b1b)
B -> BASE (Primary Skin/Material)
S -> SHADOW (Darker shade)
H -> HIGHLIGHT (Lighter shade)
D -> DETAIL (Secondary color, e.g. Belt, Hair, Wraps)

### Structure
Each part (HEAD, TORSO, ARM_FULL, LEG_FULL) must have:
1. bitmap: Array of strings (rows).
2. pivot: { x, y } Integer anchor point.
   - HEAD pivot: Bottom Center (Neck)
   - TORSO pivot: Top Center (Neck Connection)
   - ARM pivot: Top Center (Shoulder)
   - LEG pivot: Top Center (Hip)
3. z: Integer (Z-Index).
   - HEAD: 2
   - TORSO: 1
   - ARM: 3
   - LEG: 0

### Example Output Format
{
    HEAD: {
        bitmap: [
            "......#######.......",
            "....##DDDDDDD##.....",
             // ... more lines
        ],
        pivot: { x: 10, y: 11 },
        z: 2
    },
    // ... other parts
}
`;

async function generateCharacter(description) {
    console.log(`🤖 Asking AI to generate: "${description}"...`);

    if (!process.env.OPENROUTER_API_KEY) {
        console.error("❌ Error: OPENROUTER_API_KEY is not set in .env or .env.local");
        process.exit(1);
    }

    try {
        const { text } = await generateText({
            model: openrouter('mistralai/mistral-7b-instruct:free'),
            system: SYSTEM_PROMPT,
            prompt: `Generate a full character sprite set (HEAD, TORSO, ARM_FULL, LEG_FULL) for: ${description}. 
            Ensure the art style matches a 16-bit generic fighting game (Street Fighter 2 style).
            Return ONLY the JavaScript object literal code. No markdown formatting.`
        });

        const outputPath = path.resolve('engine/sprites/generated_character.js');
        const fileContent = `/**
 * AI Generated Character: ${description}
 * Generated at: ${new Date().toISOString()}
 */
export const AiGeneratedTemplates = ${text};
`;

        fs.writeFileSync(outputPath, fileContent);
        console.log(`✅ Character generated and saved to: ${outputPath}`);
        console.log("👉 Import 'AiGeneratedTemplates' in Anatomy.js to use it.");

    } catch (error) {
        console.error("❌ AI Generation Failed:", error);
    }
}

// Get prompt from CLI args
const userPrompt = process.argv.slice(2).join(' ') || "A cyborg soldier with a red visor";
generateCharacter(userPrompt);
