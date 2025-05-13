// src/ai/flows/agent-optimization-suggestions.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting optimal combinations of script variants and voices for AI agents based on performance analytics.
 *
 * - `suggestAgentOptimization` - A function that takes performance analytics data and returns suggestions for optimizing AI agent configurations.
 * - `AgentOptimizationInput` - The input type for the `suggestAgentOptimization` function, including script variants, voices, and performance metrics.
 * - `AgentOptimizationOutput` - The output type for the `suggestAgentOptimization` function, providing suggestions for optimal script/voice combinations.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AgentOptimizationInputSchema = z.object({
  scriptVariants: z.array(z.string()).describe('An array of script variants used by the AI agents.'),
  voices: z.array(z.string()).describe('An array of voice options used by the AI agents.'),
  performanceData: z.record(z.record(z.number())).describe(
    'A record of performance data for each script variant and voice combination. The outer key is the script variant, the inner key is the voice, and the value is a performance metric (e.g., conversion rate).'
  ),
});
export type AgentOptimizationInput = z.infer<typeof AgentOptimizationInputSchema>;

const AgentOptimizationOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      scriptVariant: z.string().describe('The suggested script variant.'),
      voice: z.string().describe('The suggested voice.'),
      rationale: z.string().describe('The rationale for this suggestion based on the performance data.'),
    })
  ).describe('An array of suggestions for optimal script variant and voice combinations.'),
});
export type AgentOptimizationOutput = z.infer<typeof AgentOptimizationOutputSchema>;

export async function suggestAgentOptimization(input: AgentOptimizationInput): Promise<AgentOptimizationOutput> {
  return agentOptimizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'agentOptimizationPrompt',
  input: {schema: AgentOptimizationInputSchema},
  output: {schema: AgentOptimizationOutputSchema},
  prompt: `You are an AI agent optimization expert. Analyze the provided performance data to suggest the best combinations of script variants and voices for AI agents.

  Script Variants: {{scriptVariants}}
  Voices: {{voices}}
  Performance Data: {{performanceData}}

  Based on this data, provide suggestions for the optimal script variant and voice combinations, along with a rationale for each suggestion.  Explain why you think this will improve performance.
  Format your response as a JSON array of objects.  Each object should contain 'scriptVariant', 'voice', and 'rationale' fields.
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
