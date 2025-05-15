import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  // Changed from 'googleai/gemini-pro' to a more current and generally available model
  // to address the "404 Not Found models/gemini-pro:generateContent" error.
  model: 'googleai/gemini-1.5-flash-latest', 
});
