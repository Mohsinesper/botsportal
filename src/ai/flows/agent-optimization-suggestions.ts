
// src/ai/flows/agent-optimization-suggestions.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting optimal combinations of script variants, voices, and background noise for AI agents based on performance analytics.
 *
 * - `suggestAgentOptimization` - A function that takes performance analytics data and returns suggestions for optimizing AI agent configurations.
 * - `AgentOptimizationInput` - The input type for the `suggestAgentOptimization` function.
 * - `AgentOptimizationOutput` - The output type for the `suggestAgentOptimization` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { AVAILABLE_BACKGROUND_NOISES } from '@/lib/mock-data'; // For providing noise options to AI

const AgentOptimizationInputSchema = z.object({
  scriptVariants: z.array(z.string()).describe('An array of script variants used by the AI agents.'),
  voices: z.array(z.string()).describe('An array of voice options used by the AI agents.'),
  performanceData: z.record(z.record(z.number())).describe(
    'A record of performance data for each script variant and voice combination. The outer key is the script variant, the inner key is the voice, and the value is a performance metric (e.g., conversion rate). Background noise context is not explicitly in this input for now but can be inferred or generally suggested by the AI.'
  ),
  // We could add availableBackgroundNoises: z.array(z.string()) here if we want to dynamically pass them to the AI
});
export type AgentOptimizationInput = z.infer<typeof AgentOptimizationInputSchema>;

const AgentOptimizationOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      scriptVariant: z.string().describe('The suggested script variant.'),
      voice: z.string().describe('The suggested voice.'),
      backgroundNoise: z.string().optional().describe('The suggested background noise type (e.g., "Cafe Ambience", "None").'),
      backgroundNoiseVolume: z.number().min(0).max(100).optional().describe('The suggested background noise volume (0-100), if applicable.'),
      rationale: z.string().describe('The rationale for this suggestion based on the performance data and potentially including background noise considerations.'),
    })
  ).describe('An array of suggestions for optimal script variant, voice, and background noise combinations.'),
});
export type AgentOptimizationOutput = z.infer<typeof AgentOptimizationOutputSchema>;

export async function suggestAgentOptimization(input: AgentOptimizationInput): Promise<AgentOptimizationOutput> {
  return agentOptimizationFlow(input);
}

const noiseOptionsForPrompt = AVAILABLE_BACKGROUND_NOISES.map(n => n.name).join(', ');

const prompt = ai.definePrompt({
  name: 'agentOptimizationPrompt',
  input: {schema: AgentOptimizationInputSchema},
  output: {schema: AgentOptimizationOutputSchema},
  prompt: `You are an AI agent optimization expert. Analyze the provided performance data to suggest the best combinations of script variants and voices for AI agents.
  Also, consider if a background noise environment could enhance performance.

  Script Variants: {{scriptVariants}}
  Voices: {{voices}}
  Performance Data: {{performanceData}}
  Available Background Noises: ${noiseOptionsForPrompt}

  Based on this data, provide suggestions for optimal script variant, voice, and optionally, background noise combinations. 
  If suggesting background noise, specify the type and a volume level (0-100). If no noise is better, indicate "None" or omit noise fields.
  Explain why you think this combination (including any noise) will improve performance in the rationale.
  Format your response as a JSON array of objects. Each object should contain 'scriptVariant', 'voice', 'rationale', and optionally 'backgroundNoise' and 'backgroundNoiseVolume' fields.
  `,
});

const agentOptimizationFlow = ai.defineFlow(
  {
    name: 'agentOptimizationFlow',
    inputSchema: AgentOptimizationInputSchema,
    outputSchema: AgentOptimizationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

