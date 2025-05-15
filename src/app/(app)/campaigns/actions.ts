
"use server";

import { 
  generateStructuredCallFlows, 
  type GenerateStructuredCallFlowsInput,
  type GenerateStructuredCallFlowsOutput 
} from "@/ai/flows/generate-structured-call-flows"; // Updated import

// Interface for the data coming from the form/client
interface GenerateScriptsForCampaignClientInput {
  userMasterScript: string;
  campaignName: string;
  campaignDescription: string; // Added this based on new flow input
  variantCount: number;
  // tone?: string; // Optional, if you decide to keep it for AI guidance
}

export async function handleGenerateCampaignScripts(input: GenerateScriptsForCampaignClientInput): Promise<GenerateStructuredCallFlowsOutput | { error: string }> {
  try {
    // Map client input to the Genkit flow input
    const aiInput: GenerateStructuredCallFlowsInput = {
      userMasterScript: input.userMasterScript,
      campaignName: input.campaignName,
      campaignDescription: input.campaignDescription,
      variantCount: input.variantCount,
      // tone: input.tone, // Pass if using
    };
    const result = await generateStructuredCallFlows(aiInput);
    return result;
  } catch (error) {
    console.error("Error generating campaign scripts:", error);
    // Check if error is an instance of Error and has a message property
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during script generation.";
    
    // Check if the error might be a Genkit specific error object with more details
    if (typeof error === 'object' && error !== null && 'details' in error) {
        console.error("Genkit error details:", (error as any).details);
    }
    if (typeof error === 'object' && error !== null && 'finishReason' in error) {
        console.error("Genkit finish reason:", (error as any).finishReason);
         if ((error as any).finishReason === 'SAFETY') {
             return { error: "Script generation was blocked due to safety settings. Please revise your script."};
         }
    }

    return { error: errorMessage };
  }
}
