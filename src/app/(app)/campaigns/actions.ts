
"use server";

import { generateMasterScript, type MasterScriptInput, type MasterScriptOutput } from "@/ai/flows/master-script-generator";
import type { Campaign } from "@/types";

interface GenerateScriptsForCampaignInput {
  campaignData: {
    productDescription: string; // Assuming this comes from campaign's description or a dedicated field
    targetAudience: string;
    callObjective: string;
    tone: string;
  };
  variantCount: number;
}

export async function handleGenerateCampaignScripts(input: GenerateScriptsForCampaignInput): Promise<MasterScriptOutput | { error: string }> {
  try {
    const aiInput: MasterScriptInput = {
      campaignDetails: {
        productDescription: input.campaignData.productDescription,
        targetAudience: input.campaignData.targetAudience,
        callObjective: input.campaignData.callObjective,
        tone: input.campaignData.tone,
      },
      variantCount: input.variantCount,
    };
    const result = await generateMasterScript(aiInput);
    return result;
  } catch (error) {
    console.error("Error generating campaign scripts:", error);
    return { error: error instanceof Error ? error.message : "An unknown error occurred." };
  }
}
