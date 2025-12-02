import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  organization: process.env.OPENAI_ORG_ID,
});

export const HANDEDNESS = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
} as const;

export type Handedness = (typeof HANDEDNESS)[keyof typeof HANDEDNESS];

export interface ExtractedPlayer {
  name: string;
  number: number;
  handedness?: Handedness;
  isGoalkeeper?: boolean;
}

// Load prompt from file
function loadPrompt(): string {
  const promptPath = path.join(__dirname, '../../prompts/player-extraction-prompt.txt');
  return fs.readFileSync(promptPath, 'utf-8');
}

export async function extractPlayersFromImage(base64Image: string): Promise<ExtractedPlayer[]> {
  const promptText = loadPrompt();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: promptText,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  try {
    // Remove markdown code blocks if present
    let jsonString = content.trim();

    // Check for ```json or ``` wrapping
    const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1].trim();
    }

    // Try to parse the JSON
    const players: ExtractedPlayer[] = JSON.parse(jsonString);

    // Validate it's an array
    if (!Array.isArray(players)) {
      throw new Error('Response is not an array');
    }

    return players;
  } catch (error) {
    console.error('Failed to parse OpenAI response:', content);
    console.error('Parse error:', error);
    throw new Error('Invalid response format from OpenAI. Please try again.');
  }
}
