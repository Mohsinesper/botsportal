// use server'

/**
 * @fileOverview Generates master scripts and variants using AI based on provided data.
 *
 * - generateMasterScript - A function that generates the master script.
 * - MasterScriptInput - The input type for the generateMasterScript function.
 * - MasterScriptOutput - The return type for the generateMasterScript function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MasterScriptInputSchema = z.object({
  productDescription: z.string().describe('Description of the product or service being offered.'),
  targetAudience: z.string().describe('Description of the target audience for the campaign.'),
  callObjective: z.string().describe('The primary objective of the call (e.g., lead generation, sales).'),
  keyTalkingPoints: z.string().describe('A comma-separated list of key talking points to cover.'),
  tone: z.string().describe('The desired tone of the script (e.g., professional, friendly, urgent).'),
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

Product Description: {{{productDescription}}}
Target Audience: {{{targetAudience}}}
Call Objective: {{{callObjective}}}
Key Talking Points: {{{keyTalkingPoints}}}
Tone: {{{tone}}}

Generate a master script that is clear, concise, and persuasive. Then, create {{{variantCount}}} variants of the script, each with a slightly different approach or emphasis, but covering all the same key talking points.

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
    const {output} = await masterScriptPrompt(input);
    return output!;
  }
);
