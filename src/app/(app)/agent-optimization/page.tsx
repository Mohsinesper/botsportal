
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2, Lightbulb, BarChart } from "lucide-react";
import { suggestAgentOptimization, type AgentOptimizationInput, type AgentOptimizationOutput } from "@/ai/flows/agent-optimization-suggestions";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

// Example: "Script A:Voice X:0.75,Script B:Voice Y:0.82"
const performanceDataSchema = z.string().refine(
  (data) => {
    if (!data.trim()) return true; // Allow empty if not required, or add .min(1) if required
    const entries = data.split(',');
    return entries.every(entry => {
      const parts = entry.split(':');
      return parts.length === 3 && !isNaN(parseFloat(parts[2]));
    });
  },
  "Performance data must be in format 'ScriptVariant:Voice:PerformanceMetric', e.g., 'WelcomeScript:Ava:0.75,ProductPitch:John:0.82'"
);

const agentOptimizationSchema = z.object({
  scriptVariants: z.string().min(1, "At least one script variant is required (comma-separated)"),
  voices: z.string().min(1, "At least one voice is required (comma-separated)"),
  performanceData: performanceDataSchema,
});

type AgentOptimizationFormData = z.infer<typeof agentOptimizationSchema>;

// Server action to call the Genkit flow
async function handleSuggestOptimization(data: AgentOptimizationInput): Promise<AgentOptimizationOutput | { error: string }> {
  "use server";
  try {
    const result = await suggestAgentOptimization(data);
    return result;
  } catch (error) {
    console.error("Error suggesting agent optimization:", error);
    return { error: error instanceof Error ? error.message : "An unknown error occurred." };
  }
}

function parsePerformanceData(dataString: string): Record<string, Record<string, number>> {
  const performanceMap: Record<string, Record<string, number>> = {};
  if (!dataString.trim()) return performanceMap;

  const entries = dataString.split(',');
  entries.forEach(entry => {
    const parts = entry.split(':');
    if (parts.length === 3) {
      const scriptVariant = parts[0].trim();
      const voice = parts[1].trim();
      const metric = parseFloat(parts[2]);
      if (!isNaN(metric)) {
        if (!performanceMap[scriptVariant]) {
          performanceMap[scriptVariant] = {};
        }
        performanceMap[scriptVariant][voice] = metric;
      }
    }
  });
  return performanceMap;
}


export default function AgentOptimizationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AgentOptimizationOutput["suggestions"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { handleSubmit, register, formState: { errors } } = useForm<AgentOptimizationFormData>({
    resolver: zodResolver(agentOptimizationSchema),
    defaultValues: {
      scriptVariants: "Welcome Script, Sales Pitch, Closing Script",
      voices: "Ava (Friendly Female), John (Professional Male), Mia (Empathetic Female)",
      performanceData: "Welcome Script:Ava:0.65, Welcome Script:John:0.60, Sales Pitch:Ava:0.72, Sales Pitch:John:0.78, Closing Script:Mia:0.85",
    }
  });

  const onSubmit = async (data: AgentOptimizationFormData) => {
    setIsLoading(true);
    setError(null);
    setSuggestions(null);

    const inputForAI: AgentOptimizationInput = {
      scriptVariants: data.scriptVariants.split(',').map(s => s.trim()),
      voices: data.voices.split(',').map(v => v.trim()),
      performanceData: parsePerformanceData(data.performanceData),
    };

    const result = await handleSuggestOptimization(inputForAI);

    if ("error" in result) {
      setError(result.error);
      toast({ title: "Error Generating Suggestions", description: result.error, variant: "destructive" });
    } else if (result.suggestions) {
      setSuggestions(result.suggestions);
      toast({ title: "Optimization Suggestions Ready!", description: "AI has provided recommendations." });
    } else {
      setError("Received an unexpected response from the AI.");
      toast({ title: "Error", description: "Received an unexpected response from the AI.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">AI Agent Optimization</h2>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Get AI-Powered Optimization Suggestions</CardTitle>
          <CardDescription>Input your script variants, available voices, and their performance data to receive intelligent suggestions for optimal agent configurations.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="scriptVariants">Script Variants (comma-separated)</Label>
              <Input id="scriptVariants" {...register("scriptVariants")} className="mt-1" placeholder="e.g., Script A, Script B" />
              {errors.scriptVariants && <p className="text-sm text-destructive mt-1">{errors.scriptVariants.message}</p>}
            </div>
            <div>
              <Label htmlFor="voices">Available Voices (comma-separated)</Label>
              <Input id="voices" {...register("voices")} className="mt-1" placeholder="e.g., Voice X (Friendly), Voice Y (Authoritative)" />
              {errors.voices && <p className="text-sm text-destructive mt-1">{errors.voices.message}</p>}
            </div>
            <div>
              <Label htmlFor="performanceData">Performance Data</Label>
              <Textarea 
                id="performanceData" 
                {...register("performanceData")} 
                className="mt-1 min-h-[120px]" 
                placeholder="Format: ScriptVariantName:VoiceName:PerformanceMetric (e.g., 0.75 for 75% conversion). Separate entries with commas. Example: WelcomeScript:Ava:0.65, SalesPitch:John:0.78" 
              />
              {errors.performanceData && <p className="text-sm text-destructive mt-1">{errors.performanceData.message}</p>}
               <p className="text-xs text-muted-foreground mt-1">
                Provide performance data for script-voice combinations. Use a consistent metric (e.g., conversion rate, customer satisfaction score).
              </p>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Get Suggestions
            </Button>
          </CardFooter>
        </form>
      </Card>

      {error && (
        <Card className="border-destructive bg-destructive/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-destructive">Suggestion Generation Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {suggestions && suggestions.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Optimization Suggestions</CardTitle>
            <CardDescription>Based on the provided data, here are the AI's top recommendations:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <Card key={index} className="bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Lightbulb className="mr-2 h-5 w-5 text-primary" />
                    Suggestion {index + 1}: <span className="ml-2 font-semibold text-primary">{suggestion.scriptVariant}</span> with <span className="ml-1 font-semibold text-primary">{suggestion.voice}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80 flex items-start">
                    <BarChart className="mr-2 mt-1 h-4 w-4 text-accent flex-shrink-0" />
                    <strong>Rationale:</strong> {suggestion.rationale}
                  </p>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
      {suggestions && suggestions.length === 0 && (
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>No specific suggestions generated.</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The AI could not generate specific suggestions based on the input. Please review your data or try different parameters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
