
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
const CallFlowVoiceSettingsSchemaInternal = z.object({
  stability: z.number(),
  similarity_boost: z.number(),
});

const CallFlowStepConditionSchemaInternal = z.object({
  type: z.string(),
  keywords: z.array(z.string()).optional(),
  next: z.string(),
});

const CallFlowStepSchemaInternal = z.object({
  description: z.string(),
  audio_file: z.string().describe("Placeholder audio file name, e.g., 'step_name.wav'"),
  wait_for_response: z.boolean().describe("Infer if the step expects user input"),
  timeout: z.number().optional().describe("Timeout in seconds if waiting for response, e.g., 10"),
  next: z.string().optional().describe("Key of the next step if no conditions"),
  conditions: z.array(CallFlowStepConditionSchemaInternal).optional().describe("Conditions for branching"),
  text: z.string().describe("The actual script text for this step"),
  voice_settings: CallFlowVoiceSettingsSchemaInternal.optional().default({ stability: 0.5, similarity_boost: 0.75 }),
});

// This schema is for the AI to return the 'steps' part of ONE call flow.
const AiGeneratedStepsSchemaInternal = z.record(CallFlowStepSchemaInternal);


const GenerateStructuredCallFlowsInputSchema = z.object({
  userMasterScript: z.string().describe("The complete master script text provided by the user."),
  campaignName: z.string().describe("Name of the campaign, used for naming call flows."),
  campaignDescription: z.string().describe("Description of the campaign, used in call flow JSON."),
  variantCount: z.number().int().min(0).max(5).describe("Number of textual variants to generate from the master script. 0 means only master."),
});
export type GenerateStructuredCallFlowsInput = z.infer<typeof GenerateStructuredCallFlowsInputSchema>;

const GenerateStructuredCallFlowsOutputSchema = z.object({
  generatedCallFlows: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      default_exit: z.string(),
      steps: z.record(CallFlowStepSchemaInternal), 
    })
  ).describe("An array of generated CallFlow JSON objects, starting with the master.")
});
export type GenerateStructuredCallFlowsOutput = z.infer<typeof GenerateStructuredCallFlowsOutputSchema>;


export async function generateStructuredCallFlows(input: GenerateStructuredCallFlowsInput): Promise<GenerateStructuredCallFlowsOutput | { error: string }> {
  try {
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
          name: `structureScriptPrompt_flow_${Date.now()}_${i}`, 
          input: { schema: z.object({ scriptText: z.string() }) },
          output: { 
            schema: AiGeneratedStepsSchemaInternal,
            format: 'json' 
          },
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
          config: { temperature: 0.3 } 
      });

      const { output: structuredSteps, finishReason, details } = await structurePrompt({ scriptText: currentScriptText });

      if (!structuredSteps || finishReason !== 'STOP' && finishReason !== 'FINISH') {
        console.error(`Failed to structure script text for ${isMaster ? 'master' : `variant ${i}`}. Finish Reason: ${finishReason}, Details: ${JSON.stringify(details)}. Skipping this script.`);
        const fallbackStepKey = "main_content";
        const fallbackSteps: Record<string, CallFlowStep> = {
          [fallbackStepKey]: {
            description: "Main content of the script (AI structuring failed)",
            audio_file: `${fallbackStepKey}.wav`,
            wait_for_response: false,
            text: currentScriptText, // Store raw script if structuring fails
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            next: "final_exit"
          },
          "final_exit": {
            description: "End of call (fallback)",
            audio_file: "final_exit.wav",
            wait_for_response: false,
            text: "Thank you. Goodbye."
          }
        };
         allCallFlows.push({
          name: isMaster ? input.campaignName : `${input.campaignName} - Variant ${i+1}`, 
          description: input.campaignDescription + (isMaster ? "" : ` (Variant ${i+1}) - AI structuring fallback`),
          default_exit: "final_exit", 
          steps: fallbackSteps,
        });
        continue;
      }
      
      let defaultExitKey = "graceful_exit"; 
      if (!structuredSteps[defaultExitKey] && Object.keys(structuredSteps).includes("exit")) {
          defaultExitKey = "exit"; 
      } else if (!structuredSteps[defaultExitKey] && !Object.keys(structuredSteps).includes("exit")) {
          if (!structuredSteps["final_exit"]) {
               structuredSteps["final_exit"] = {
                  description: "Standard Call Exit - Final",
                  audio_file: "final_exit.wav",
                  wait_for_response: false,
                  text: "Thank you for your time. Goodbye."
              };
          }
          defaultExitKey = Object.keys(structuredSteps).find(key => structuredSteps[key].next === undefined && (!structuredSteps[key].conditions || structuredSteps[key].conditions?.length === 0) && key.toLowerCase().includes("exit")) || "final_exit";

          if(!structuredSteps[defaultExitKey]){ 
              defaultExitKey = "standard_exit_placeholder";
              structuredSteps[defaultExitKey] = {
                  description: "Standard Call Exit",
                  audio_file: "standard_exit_placeholder.wav",
                  wait_for_response: false,
                  text: "Thank you for your time. Goodbye."
              };
          }
      }

      allCallFlows.push({
        name: isMaster ? input.campaignName : `${input.campaignName} - Variant ${i+1}`, 
        description: input.campaignDescription + (isMaster ? "" : ` (Variant ${i+1})`),
        default_exit: defaultExitKey,
        steps: structuredSteps as Record<string, CallFlowStep>, 
      });
    }

    return { generatedCallFlows: allCallFlows };

  } catch (error) {
    console.error("Error in generateStructuredCallFlows:", error);
    let errorMessage = "An unexpected error occurred during script generation.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    if (typeof error === 'object' && error !== null) {
        if ('details' in error) {
            console.error("Genkit error details in flow:", (error as any).details);
        }
        if ('finishReason' in error && (error as any).finishReason === 'SAFETY') {
            errorMessage = "Script generation was blocked due to safety settings. Please revise your script.";
        }
    }
    return { error: errorMessage };
  }
}

// This flow is now defined within the generateStructuredCallFlows function for simplicity,
// but could be a separate ai.defineFlow if complex pre/post-processing were needed per script.
// const structureScriptFlow = ai.defineFlow( ... );


