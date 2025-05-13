
// use server'; // This directive should be at the top of Server Action files, not Genkit flow files directly unless they also export server actions.
// For Genkit flows imported by Server Actions, 'use server' in the action file is sufficient.

/**
 * @fileOverview Generates master scripts and variants using AI based on provided campaign data.
 *
 * - generateMasterScript - A function that generates the master script.
 * - MasterScriptInput - The input type for the generateMasterScript function.
 * - MasterScriptOutput - The return type for the generateMasterScript function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MasterScriptInputSchema = z.object({
  campaignDetails: z.object({
    productDescription: z.string().describe('Description of the product or service being offered.'),
    targetAudience: z.string().describe('Description of the target audience for the campaign.'),
    callObjective: z.string().describe('The primary objective of the call (e.g., lead generation, sales).'),
    tone: z.string().describe('The desired tone of the script (e.g., professional, friendly, urgent).'),
  }),
  variantCount: z.number().int().min(1).max(5).describe('The number of script variants to generate.'),
});
export type MasterScriptInput = z.infer<typeof MasterScriptInputSchema>;

const MasterScriptOutputSchema = z.object({
  masterScript: z.string().describe('The generated master script for the call center.'),
  variants: z.array(z.string()).describe('An array of script variants generated from the master script.'),
});
export type MasterScriptOutput = z.infer<typeof MasterScriptOutputSchema>;

export async function generateMasterScript(input: MasterScriptInput): Promise<MasterScriptOutput> {
  return generateMasterScriptFlow(input);
}

const masterScriptPrompt = ai.definePrompt({
  name: 'masterScriptPrompt',
  input: {schema: MasterScriptInputSchema},
  output: {schema: MasterScriptOutputSchema},
  prompt: `You are an expert script writer for call centers. Your goal is to generate a master script and several variants based on the provided information.

Product Description: {{{campaignDetails.productDescription}}}
Target Audience: {{{campaignDetails.targetAudience}}}
Call Objective: {{{campaignDetails.callObjective}}}
Key Talking Points: (The AI should infer key talking points from the product description, audience, and objective. If specific points are needed, they should be part of campaignDetails or a separate input)
Tone: {{{campaignDetails.tone}}}

Generate a master script that is clear, concise, and persuasive. Then, create {{{variantCount}}} variants of the script, each with a slightly different approach or emphasis.

Ensure the output is well-formatted and easy to read.

Master Script:

Variants:`, 
});

const generateMasterScriptFlow = ai.defineFlow(
  {
    name: 'generateMasterScriptFlow',
    inputSchema: MasterScriptInputSchema,
    outputSchema: MasterScriptOutputSchema,
  },
  async input => {
    // TODO: Consider adding logic to extract key talking points explicitly if needed by the prompt,
    // or refine the prompt to better infer them.
    // For now, the prompt implies inference from description, audience, objective.
    const {output} = await masterScriptPrompt(input);
    return output!;
  }
);
