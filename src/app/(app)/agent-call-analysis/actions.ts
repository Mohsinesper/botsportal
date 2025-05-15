
"use server";

import { analyzeCallDropPoint, type CallDropAnalysisInput, type CallDropAnalysisOutput } from "@/ai/flows/call-drop-analyzer";

export async function handleAnalyzeCallDrop(data: CallDropAnalysisInput): Promise<CallDropAnalysisOutput | { error: string }> {
  try {
    const result = await analyzeCallDropPoint(data);
    return result;
  } catch (error) {
    console.error("Error analyzing call drop point:", error);
    return { error: error instanceof Error ? error.message : "An unknown error occurred during AI analysis." };
  }
}
