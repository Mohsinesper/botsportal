
"use server";

import { suggestAgentOptimization, type AgentOptimizationInput, type AgentOptimizationOutput } from "@/ai/flows/agent-optimization-suggestions";

export async function handleSuggestOptimization(data: AgentOptimizationInput): Promise<AgentOptimizationOutput | { error: string }> {
  try {
    const result = await suggestAgentOptimization(data);
    return result;
  } catch (error) {
    console.error("Error suggesting agent optimization:", error);
    return { error: error instanceof Error ? error.message : "An unknown error occurred." };
  }
}
