
'use server';
/**
 * @fileOverview An AI flow to analyze potential reasons for call drops at a specific step in a call flow.
 *
 * - analyzeCallDropPoint - A function that handles the call drop analysis.
 * - CallDropAnalysisInput - The input type for the function.
 * - CallDropAnalysisOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CallDropAnalysisInputSchema = z.object({
  campaignName: z.string().describe("The name of the campaign being analyzed."),
  stepName: z.string().describe("The key/name of the step in the call flow where drops are occurring."),
  stepText: z.string().describe("The exact script text of the step where calls are dropping."),
  dropOffPercentage: z.number().describe("The percentage of calls that drop off at this specific step."),
});
export type CallDropAnalysisInput = z.infer<typeof CallDropAnalysisInputSchema>;

const CallDropAnalysisOutputSchema = z.object({
  analysis: z.string().describe("A textual analysis of potential reasons for the call drop and suggestions for improvement."),
});
export type CallDropAnalysisOutput = z.infer<typeof CallDropAnalysisOutputSchema>;

export async function analyzeCallDropPoint(input: CallDropAnalysisInput): Promise<CallDropAnalysisOutput> {
  return callDropAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'callDropAnalysisPrompt',
  input: {schema: CallDropAnalysisInputSchema},
  output: {schema: CallDropAnalysisOutputSchema},
  prompt: `You are a call center optimization expert.
Campaign Name: {{campaignName}}
Problem: High call drop-off rate ({{dropOffPercentage}}%) at step "{{stepName}}".
Script text for this step: "{{stepText}}"

Analyze potential reasons why calls might be dropping off at this specific step in the call flow. Consider factors like:
- Clarity and conciseness of the script text.
- Complexity of the question asked or information requested.
- Potential for user confusion or frustration.
- Length of the step or perceived wait time.
- Relevance of this step to the user's likely intent.

Provide a brief analysis (2-4 bullet points) of potential reasons for this drop-off and suggest 1-2 actionable improvements to the script text or flow at this point to reduce abandonment.
Focus your suggestions on the provided step text and its immediate context.
`,
});

const callDropAnalysisFlow = ai.defineFlow(
  {
    name: 'callDropAnalysisFlow',
    inputSchema: CallDropAnalysisInputSchema,
    outputSchema: CallDropAnalysisOutputSchema,
  },
  async (input: CallDropAnalysisInput) => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("AI failed to generate an analysis for call drop point.");
    }
    return output;
  }
);

