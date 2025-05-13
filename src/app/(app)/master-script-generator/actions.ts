
"use server";

import { generateMasterScript, type MasterScriptInput, type MasterScriptOutput } from "@/ai/flows/master-script-generator";

export async function handleGenerateScript(data: MasterScriptInput): Promise<MasterScriptOutput | { error: string }> {
  try {
    const result = await generateMasterScript(data);
    return result;
  } catch (error) {
    console.error("Error generating master script:", error);
    return { error: error instanceof Error ? error.message : "An unknown error occurred." };
  }
}
