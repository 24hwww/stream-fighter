import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const aiModel = openrouter(process.env.OPENROUTER_MODEL?.split(',')[0] || 'mistralai/mistral-large-2411');

// ROSTER FROM PIXEL-BRAWL-ARCADE
export const ROSTER = [
  { key: 'geek', description: 'A spiky-haired tech enthusiast with glasses.' },
  { key: 'pirate', description: 'A sea-worn fighter with a bandana and a red shirt.' },
  { key: 'ninja', description: 'A stealthy assassin in dark blue cloth and a red mask.' },
  { key: 'sexy', description: 'A stylish fighter with curly blonde hair and pink outfit.' },
  { key: 'cook', description: 'A battle chef with a white hat and an apron.' },
  { key: 'cat', description: 'A fierce feline humanoid with orange fur and ears.' },
  { key: 'dog', description: 'A loyal canine warrior with brown fur and floppy ears.' }
];

export const STAGES = [
  { skyColor: "#3498DB", groundLight: "#2ECC71", groundDark: "#27AE60", type: "FOREST" },
  { skyColor: "#1a1a2e", groundLight: "#16213e", groundDark: "#0f3460", type: "CITY" },
  { skyColor: "#ff4d4d", groundLight: "#330000", groundDark: "#1a0000", type: "HELL" },
  { skyColor: "#87CEEB", groundLight: "#F0E68C", groundDark: "#BDB76B", type: "DESERT" }
];

export async function generateNewPoll(categoryName = "General") {
  try {
    const { text } = await generateText({
      model: aiModel,
      system: `You are a creative writer for a pixel-art fighting game. 
      Generate two iconic fighter names and pick the most fitting character archetype for each from this list:
      ${ROSTER.map((r, i) => `${i}=${r.key} (${r.description})`).join(', ')}
      
      Also pick a stage type index (0=FOREST, 1=CITY, 2=HELL, 3=DESERT).
      
      Format: JSON { "nameA": "...", "typeA": 0-6, "nameB": "...", "typeB": 0-6, "stageIdx": 0-3 }`,
      prompt: `Generate a rival matchup for the tournament category: ${categoryName}.`,
      responseFormat: { type: 'json' }
    });

    const aiData = JSON.parse(text);

    const charA = ROSTER[aiData.typeA % ROSTER.length];
    const charB = ROSTER[aiData.typeB % ROSTER.length];
    const stage = STAGES[aiData.stageIdx % STAGES.length];

    return {
      optionA: {
        name: aiData.nameA,
        characterKey: charA.key
      },
      optionB: {
        name: aiData.nameB,
        characterKey: charB.key
      },
      stage: stage
    };
  } catch (error) {
    console.error("AI Generation failed, using fallback:", error.message);

    // Pick two distinct random characters from ROSTER
    const shuffled = [...ROSTER].sort(() => 0.5 - Math.random());
    const charA = shuffled[0];
    const charB = shuffled[1];

    return {
      optionA: { name: charA.key.toUpperCase(), characterKey: charA.key },
      optionB: { name: charB.key.toUpperCase(), characterKey: charB.key },
      stage: STAGES[Math.floor(Math.random() * STAGES.length)]
    };
  }
}