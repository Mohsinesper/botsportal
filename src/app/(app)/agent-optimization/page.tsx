
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
import type { AgentOptimizationInput, AgentOptimizationOutput } from "@/ai/flows/agent-optimization-suggestions";
import { handleSuggestOptimization } from "./actions";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CallCenter } from "@/types";

// Assume a current call center ID. In a real app, this would come from user session/context.
const MOCK_CURRENT_CALL_CENTER_ID = "cc1";

const mockCallCenters: CallCenter[] = [
  { id: "cc1", name: "Main Call Center HQ", location: "New York" },
  { id: "cc2", name: "West Coast Operations", location: "California" },
];

// Example: "Welcome Script Variant 1:Ava - Friendly Female:0.75,Sales Pitch Variant 2:John - Professional Male:0.82"
const performanceDataSchema = z.string().refine(
  (data) => {
    if (!data.trim()) return true;
    const entries = data.split(',');
    return entries.every(entry => {
      const parts = entry.split(':');
      return parts.length === 3 && !isNaN(parseFloat(parts[2]));
    });
  },
  "Performance data must be in format 'ScriptVariantName:VoiceName:PerformanceMetric', e.g., 'WelcomeScriptV1:AvaFriendly:0.75,ProductPitchV2:JohnPro:0.82'"
);

const agentOptimizationSchema = z.object({
  scriptVariants: z.string().min(1, "At least one script variant name is required (comma-separated)"),
  voices: z.string().min(1, "At least one voice name is required (comma-separated)"),
  performanceData: performanceDataSchema,
});

type AgentOptimizationFormData = z.infer<typeof agentOptimizationSchema>;


function parsePerformanceData(dataString: string): Record<string, Record<string, number>> {
  const performanceMap: Record<string, Record<string, number>> = {};
  if (!dataString.trim()) return performanceMap;

  const entries = dataString.split(',');
  entries.forEach(entry => {
    const parts = entry.split(':');
    if (parts.length === 3) {
      const scriptVariantName = parts[0].trim(); 
      const voiceName = parts[1].trim(); 
      const metric = parseFloat(parts[2]);
      if (!isNaN(metric)) {
        if (!performanceMap[scriptVariantName]) {
          performanceMap[scriptVariantName] = {};
        }
        performanceMap[scriptVariantName][voiceName] = metric;
      }
    }
  });
  return performanceMap;
}


export default function AgentOptimizationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AgentOptimizationOutput["suggestions"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Simulating a selected call center.
  const [currentCallCenterId, setCurrentCallCenterId] = useState<string>(MOCK_CURRENT_CALL_CENTER_ID);


  const { handleSubmit, register, formState: { errors } } = useForm<AgentOptimizationFormData>({
    resolver: zodResolver(agentOptimizationSchema),
    // Default values should ideally reflect data from the MOCK_CURRENT_CALL_CENTER_ID
    defaultValues: {
      scriptVariants: "Welcome Script (CC1), Sales Pitch (CC1), Closing Script (CC1)",
      voices: "Ava (CC1 Friendly), John (CC1 Pro), Mia (CC1 Empathetic)", // Assuming these voices belong to CC1
      performanceData: "Welcome Script (CC1):Ava (CC1 Friendly):0.65, Welcome Script (CC1):John (CC1 Pro):0.60, Sales Pitch (CC1):Ava (CC1 Friendly):0.72, Sales Pitch (CC1):John (CC1 Pro):0.78, Closing Script (CC1):Mia (CC1 Empathetic):0.85",
    }
  });

  const onSubmit = async (data: AgentOptimizationFormData) => {
    setIsLoading(true);
    setError(null);
    setSuggestions(null);

    // The AI flow expects arrays of strings for script variants and voices.
    // These strings are treated as identifiers/names by the AI.
    // In a multi-call center setup, ensure these names are relevant to the currentCallCenterId.
    const inputForAI: AgentOptimizationInput = {
      scriptVariants: data.scriptVariants.split(',').map(s => s.trim()),
      voices: data.voices.split(',').map(v => v.trim()),
      performanceData: parsePerformanceData(data.performanceData),
    };

    // The handleSuggestOptimization action doesn't explicitly take callCenterId,
    // but the data it processes (script/voice names, performance) should be from that call center.
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
      <h2 className="text-3xl font-bold tracking-tight">AI Agent Optimization ({mockCallCenters.find(cc => cc.id === currentCallCenterId)?.name || 'Selected Call Center'})</h2>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Get AI-Powered Optimization Suggestions</CardTitle>
          <CardDescription>
            Input your script variant names, available voice names, and their performance data from the 
            '{mockCallCenters.find(cc => cc.id === currentCallCenterId)?.name || 'current call center'}'
            to receive intelligent suggestions for optimal agent configurations.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="scriptVariants">Script Variant Names (comma-separated)</Label>
              <Input id="scriptVariants" {...register("scriptVariants")} className="mt-1" placeholder="e.g., Welcome Variant 1, Sales Variant A" />
              {errors.scriptVariants && <p className="text-sm text-destructive mt-1">{errors.scriptVariants.message}</p>}
            </div>
            <div>
              <Label htmlFor="voices">Available Voice Names (comma-separated)</Label>
              <Input id="voices" {...register("voices")} className="mt-1" placeholder="e.g., Ava Friendly, John Professional" />
              {errors.voices && <p className="text-sm text-destructive mt-1">{errors.voices.message}</p>}
            </div>
            <div>
              <Label htmlFor="performanceData">Performance Data</Label>
              <Textarea 
                id="performanceData" 
                {...register("performanceData")} 
                className="mt-1 min-h-[120px]" 
                placeholder="Format: ScriptVariantName:VoiceName:PerformanceMetric (e.g., 0.75 for 75% conversion). Separate entries with commas. Example: WelcomeV1:AvaFriendly:0.65, SalesVA:JohnPro:0.78" 
              />
              {errors.performanceData && <p className="text-sm text-destructive mt-1">{errors.performanceData.message}</p>}
               <p className="text-xs text-muted-foreground mt-1">
                Provide performance data for script variant-voice combinations within the selected call center. Use a consistent metric. Ensure names match those entered above.
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
            <CardDescription>Based on the provided data for '{mockCallCenters.find(cc => cc.id === currentCallCenterId)?.name}', here are the AI's top recommendations:</CardDescription>
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
            <p>The AI could not generate specific suggestions based on the input for this call center. Please review your data or try different parameters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
