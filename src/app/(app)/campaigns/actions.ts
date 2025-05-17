
"use server";

import { 
  generateStructuredCallFlows, 
  type GenerateStructuredCallFlowsInput,
  type GenerateStructuredCallFlowsOutput 
} from "@/ai/flows/master-script-generator";
import { addAuditLog } from "@/services/audit-log-service";
import { User } from '@/types'; // Assuming User type is available

interface GenerateScriptsForCampaignClientInput {
  userMasterScript: string;
  campaignName: string;
  campaignDescription: string; 
  variantCount: number;
  currentUserInfo: { id: string, name: string, email: string }; // Added for logging
  callCenterInfo?: { id: string, name: string }; // Added for logging
}

export async function handleGenerateCampaignScripts(input: GenerateScriptsForCampaignClientInput): Promise<GenerateStructuredCallFlowsOutput | { error: string }> {
  try {
    const aiInput: GenerateStructuredCallFlowsInput = {
      userMasterScript: input.userMasterScript,
      campaignName: input.campaignName,
      campaignDescription: input.campaignDescription,
      variantCount: input.variantCount,
    };
    const result = await generateStructuredCallFlows(aiInput);
    
    if (!("error" in result)) {
        addAuditLog({
            action: "CAMPAIGN_SCRIPTS_GENERATED",
            userId: input.currentUserInfo.id,
            userName: input.currentUserInfo.name || input.currentUserInfo.email,
            callCenterId: input.callCenterInfo?.id,
            callCenterName: input.callCenterInfo?.name,
            details: { 
                campaignName: input.campaignName, 
                variantCount: input.variantCount,
                generatedFlowsCount: result.generatedCallFlows.length 
            }
        });
    }
    return result;

  } catch (error) {
    console.error("Error generating campaign scripts:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during script generation.";
    
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
