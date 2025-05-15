
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  // Changed from flash-latest to pro-latest for better JSON schema support
  model: 'googleai/gemini-1.5-pro-latest', 
});

