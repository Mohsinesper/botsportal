
// This file will be renamed to generate-structured-call-flows.ts
// For now, putting the new content here. The build system will handle rename.
'use server';
/**
 * @fileOverview Generates structured JSON call flows, including a master and variants, based on user-provided master script text.
 *
 * - generateStructuredCallFlows - A function that orchestrates the generation.
 * - GenerateStructuredCallFlowsInput - Input type.
 * - GenerateStructuredCallFlowsOutput - Output type (array of CallFlow JSON objects).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { CallFlow, CallFlowStep, CallFlowVoiceSettings } from '@/types';

// Define Zod schemas for the CallFlow structure for AI output validation
// These are NOT exported directly from a "use server" file.
const CallFlowVoiceSettingsSchema = z.object({
  stability: z.number(),
  similarity_boost: z.number(),
});

const CallFlowStepConditionSchema = z.object({
  type: z.string(),
  keywords: z.array(z.string()).optional(),
  next: z.string(),
});

const CallFlowStepSchema = z.object({
  description: z.string(),
  audio_file: z.string().describe("Placeholder audio file name, e.g., 'step_name.wav'"),
  wait_for_response: z.boolean().describe("Infer if the step expects user input"),
  timeout: z.number().optional().describe("Timeout in seconds if waiting for response, e.g., 10"),
  next: z.string().optional().describe("Key of the next step if no conditions"),
  conditions: z.array(CallFlowStepConditionSchema).optional().describe("Conditions for branching"),
  text: z.string().describe("The actual script text for this step"),
  voice_settings: CallFlowVoiceSettingsSchema.optional().default({ stability: 0.5, similarity_boost: 0.75 }),
});

// This schema is for the AI to return the 'steps' part of ONE call flow.
const AiGeneratedStepsSchema = z.record(CallFlowStepSchema);


const GenerateStructuredCallFlowsInputSchema = z.object({
  userMasterScript: z.string().describe("The complete master script text provided by the user."),
  campaignName: z.string().describe("Name of the campaign, used for naming call flows."),
  campaignDescription: z.string().describe("Description of the campaign, used in call flow JSON."),
  variantCount: z.number().int().min(0).max(5).describe("Number of textual variants to generate from the master script. 0 means only master."),
  // tone: z.string().optional().describe("Optional tone to guide AI for variant generation, e.g., Professional, Friendly."),
});
export type GenerateStructuredCallFlowsInput = z.infer<typeof GenerateStructuredCallFlowsInputSchema>;

const GenerateStructuredCallFlowsOutputSchema = z.object({
  generatedCallFlows: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      default_exit: z.string(),
      steps: z.record(CallFlowStepSchema), // Reusing the step schema
    })
  ).describe("An array of generated CallFlow JSON objects, starting with the master.")
});
export type GenerateStructuredCallFlowsOutput = z.infer<typeof GenerateStructuredCallFlowsOutputSchema>;


export async function generateStructuredCallFlows(input: GenerateStructuredCallFlowsInput): Promise<GenerateStructuredCallFlowsOutput> {
  const allCallFlows: CallFlow[] = [];

  // 1. Generate textual variants (if any)
  let variantTexts: string[] = [];
  if (input.variantCount > 0) {
    const variantGenResult = await ai.generate({
      prompt: `You are an expert script writer. The user has provided the following master script. Generate ${input.variantCount} distinct textual variations of this master script.
Each variant should maintain the core message and objective of the master script but use different phrasing, emphasis, or style.
Focus only on generating the variant script texts. Do not add any extra formatting or commentary.
Return each variant separated by '||VARIANT_SEPARATOR||'.

Master Script:
${input.userMasterScript}
`,
      config: { temperature: 0.7 }
    });
    const rawVariants = variantGenResult.text?.split('||VARIANT_SEPARATOR||').map(v => v.trim()).filter(v => v) || [];
    if (rawVariants.length !== input.variantCount) {
        console.warn(`AI generated ${rawVariants.length} variants, expected ${input.variantCount}. Using what was generated.`);
    }
    variantTexts = rawVariants;
  }

  const scriptsToProcess = [input.userMasterScript, ...variantTexts];
  
  // 2. For master script and each textual variant, convert to structured JSON steps
  for (let i = 0; i < scriptsToProcess.length; i++) {
    const currentScriptText = scriptsToProcess[i];
    const isMaster = i === 0;
    
    const structurePrompt = ai.definePrompt({
        name: `structureScriptPrompt_${i}`, // Unique name for each prompt instance if needed, or just rely on dynamic generation
        input: { schema: z.object({ scriptText: z.string() }) },
        output: { schema: AiGeneratedStepsSchema }, // Expecting the 'steps' object
        prompt: `You are an expert in call center script design. Convert the following call script text into a structured JSON object representing the steps of a call flow.
Identify logical steps within the provided script. Assign them meaningful keys (e.g., 'greeting', 'qualification_question', 'positive_outcome', 'negative_outcome', 'voicemail', 'exit').
For each step, provide:
- "description": A brief description of the step's purpose.
- "audio_file": A placeholder audio file name (e.g., "step_key.wav").
- "wait_for_response": A boolean (true/false), infer based on whether the step asks a question or expects user input.
- "timeout": An integer (e.g., 10) representing seconds if waiting for a response, otherwise omit or set to a low value if not applicable.
- "text": The exact script text for this step.
- "voice_settings": Default to {"stability": 0.5, "similarity_boost": 0.75}.
- "next": (Optional) The key of the next step if this step unconditionally proceeds to another.
- "conditions": (Optional) An array of condition objects if the step branches. Each condition object should have "type" (e.g., "contains", "matches_intent", "default"), "keywords" (array of strings, if type is "contains"), and "next" (the key of the next step for this condition).

Define at least one 'exit' step (e.g., key 'final_exit') which has no 'next' or 'conditions'.
Identify or create a 'default_exit' step key (e.g., 'graceful_exit_default') which can be used as a common exit point for unhandled situations or negative intents.

The script text to process is:
\`\`\`
{{scriptText}}
\`\`\`

Return ONLY the JSON object for the 'steps'. Ensure all step keys referenced in 'next' or 'conditions.next' are defined within the 'steps' object.
The main goal is to get the text segmented correctly into steps. Conditional logic and 'next' pointers are secondary and can be basic.
Example of a step key: "greeting_step", "ask_medicare_parts", "qualification_confirmed", "transfer_to_agent", "voicemail_message", "end_call".
Ensure there is a clear 'default_exit' step defined.
`,
        config: { temperature: 0.3 } // Lower temperature for more predictable structuring
    });

    const { output: structuredSteps } = await structurePrompt({ scriptText: currentScriptText });

    if (!structuredSteps) {
      console.error(`Failed to structure script text for ${isMaster ? 'master' : `variant ${i}`}. Skipping this script.`);
      // Potentially, we could just put the raw text into a single step as a fallback
      const fallbackStepKey = "main_content";
      const fallbackSteps: Record<string, CallFlowStep> = {
        [fallbackStepKey]: {
          description: "Main content of the script",
          audio_file: `${fallbackStepKey}.wav`,
          wait_for_response: false,
          text: currentScriptText,
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          next: "final_exit"
        },
        "final_exit": {
          description: "End of call",
          audio_file: "final_exit.wav",
          wait_for_response: false,
          text: "Thank you. Goodbye."
        }
      };
       allCallFlows.push({
        name: isMaster ? input.campaignName : `${input.campaignName} - Variant ${i}`,
        description: input.campaignDescription + (isMaster ? "" : ` (Variant ${i})`),
        default_exit: "final_exit", // Fallback
        steps: fallbackSteps,
      });
      continue;
    }
    
    // Try to find a default exit from the generated steps, or add one
    let defaultExitKey = "graceful_exit"; // A common convention
    if (!structuredSteps[defaultExitKey] && Object.keys(structuredSteps).includes("exit")) {
        defaultExitKey = "exit"; // Fallback if 'graceful_exit' is not found but 'exit' is.
    } else if (!structuredSteps[defaultExitKey] && !Object.keys(structuredSteps).includes("exit")) {
        // If neither common exit key is found, create a basic one.
        defaultExitKey = "standard_exit_placeholder";
        structuredSteps[defaultExitKey] = {
            description: "Standard Call Exit",
            audio_file: "standard_exit_placeholder.wav",
            wait_for_response: false,
            text: "Thank you for your time. Goodbye."
        };
    }


    allCallFlows.push({
      name: isMaster ? input.campaignName : `${input.campaignName} - Variant ${i}`,
      description: input.campaignDescription + (isMaster ? "" : ` (Variant ${i})`),
      default_exit: defaultExitKey,
      steps: structuredSteps as Record<string, CallFlowStep>, // Cast needed as AI output schema is generic Record
    });
  }

  return { generatedCallFlows: allCallFlows };
}

// This flow is now defined within the generateStructuredCallFlows function for simplicity,
// but could be a separate ai.defineFlow if complex pre/post-processing were needed per script.
// const structureScriptFlow = ai.defineFlow( ... );

