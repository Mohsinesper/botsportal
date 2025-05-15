
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2, Lightbulb, BarChart, Mic, Cpu as BotIcon } from "lucide-react"; // Added Mic and BotIcon
import type { AgentOptimizationInput, AgentOptimizationOutput } from "@/ai/flows/agent-optimization-suggestions";
import { handleSuggestOptimization } from "./actions";
import { toast } from "@/hooks/use-toast";
import { useCallCenter } from "@/contexts/CallCenterContext";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


const performanceDataSchema = z.string().refine(
  (data) => {
    if (!data.trim()) return true; 
    const entries = data.split(',');
    return entries.every(entry => {
      const parts = entry.split(':');
      return parts.length === 3 && !isNaN(parseFloat(parts[2])) && parts[0].trim() !== "" && parts[1].trim() !== "";
    });
  },
  "Each entry must be 'Script:Voice:Metric', e.g., 'WelcomeV1:Ava:0.75'. Comma-separate entries. Script/Voice names cannot be empty."
);

const agentOptimizationSchema = z.object({
  scriptVariants: z.string().min(1, "At least one script variant name is required (comma-separated)"),
  voices: z.string().min(1, "At least one voice name is required (comma-separated)"),
  performanceData: performanceDataSchema,
});

type AgentOptimizationFormData = z.infer<typeof agentOptimizationSchema>;

// For "Add as Bot(s)" Dialog
const addBotSchema = z.object({
  botNamePrefix: z.string().min(1, "Prefix is required").default("OptimizedBot"),
  botCount: z.coerce.number().int().min(1, "At least one bot").max(100).default(1),
});
type AddBotFormData = z.infer<typeof addBotSchema>;


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
      if (!isNaN(metric) && scriptVariantName && voiceName) { 
        if (!performanceMap[scriptVariantName]) {
          performanceMap[scriptVariantName] = {};
        }
        performanceMap[scriptVariantName][voiceName] = metric;
      }
    }
  });
  return performanceMap;
}

const mockDefaultData: Record<string, AgentOptimizationFormData> = {
  cc1: {
    scriptVariants: "Welcome Script (CC1), Sales Pitch (CC1), Closing Script (CC1)",
    voices: "Ava (CC1 Friendly), John (CC1 Pro), Mia (CC1 Empathetic)",
    performanceData: "Welcome Script (CC1):Ava (CC1 Friendly):0.65, Welcome Script (CC1):John (CC1 Pro):0.60, Sales Pitch (CC1):Ava (CC1 Friendly):0.72, Sales Pitch (CC1):John (CC1 Pro):0.78, Closing Script (CC1):Mia (CC1 Empathetic):0.85",
  },
  cc2: {
    scriptVariants: "Greeting Script (CC2), Product Intro (CC2)",
    voices: "Liam (CC2 Clear), Zoe (CC2 Upbeat)",
    performanceData: "Greeting Script (CC2):Liam (CC2 Clear):0.70, Product Intro (CC2):Zoe (CC2 Upbeat):0.68",
  },
  cc3: {
    scriptVariants: "Support Intro (CC3), Resolution Path (CC3)",
    voices: "Noah (CC3 Calm), Olivia (CC3 Assertive)",
    performanceData: "Support Intro (CC3):Noah (CC3 Calm):0.90, Resolution Path (CC3):Olivia (CC3 Assertive):0.88",
  }
};


export default function AgentOptimizationPage() {
  const { currentCallCenter, isLoading: isCallCenterLoading } = useCallCenter();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AgentOptimizationOutput["suggestions"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAddBotDialogOpen, setIsAddBotDialogOpen] = useState(false);
  const [currentSuggestionForBot, setCurrentSuggestionForBot] = useState<AgentOptimizationOutput["suggestions"][0] | null>(null);
  
  const { handleSubmit, register, formState: { errors }, reset } = useForm<AgentOptimizationFormData>({
    resolver: zodResolver(agentOptimizationSchema),
  });

  const addBotForm = useForm<AddBotFormData>({
    resolver: zodResolver(addBotSchema),
  });

  useEffect(() => {
    if (currentCallCenter) {
      reset(mockDefaultData[currentCallCenter.id] || { scriptVariants: "", voices: "", performanceData: ""});
    } else {
      reset({ scriptVariants: "", voices: "", performanceData: ""}); 
    }
  }, [currentCallCenter, reset]);


  const onSubmit = async (data: AgentOptimizationFormData) => {
    if (!currentCallCenter) {
      toast({ title: "Error", description: "Please select a call center.", variant: "destructive"});
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuggestions(null);

    const inputForAI: AgentOptimizationInput = {
      scriptVariants: data.scriptVariants.split(',').map(s => s.trim()).filter(s => s),
      voices: data.voices.split(',').map(v => v.trim()).filter(v => v),
      performanceData: parsePerformanceData(data.performanceData),
    };
    
    if(inputForAI.scriptVariants.length === 0 || inputForAI.voices.length === 0) {
        setError("Script variants and voices cannot be empty after processing.");
        toast({ title: "Input Error", description: "Please ensure script variants and voices are correctly formatted and not empty.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

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

  const handleMockCall = (suggestion: AgentOptimizationOutput["suggestions"][0]) => {
    toast({
      title: "Mock Call Initiated (Simulated)",
      description: `Script: ${suggestion.scriptVariant}, Voice: ${suggestion.voice}. Call is now active.`,
    });
  };

  const handleOpenAddBotDialog = (suggestion: AgentOptimizationOutput["suggestions"][0]) => {
    setCurrentSuggestionForBot(suggestion);
    addBotForm.reset({ botNamePrefix: `${suggestion.scriptVariant.replace(/\s+/g, '')}Bot`, botCount: 1});
    setIsAddBotDialogOpen(true);
  };

  const handleAddBots = (data: AddBotFormData) => {
    if (!currentSuggestionForBot) return;
    toast({
      title: "Bots Generation Started (Simulated)",
      description: `${data.botCount} bot(s) with prefix "${data.botNamePrefix}" using script "${currentSuggestionForBot.scriptVariant}" and voice "${currentSuggestionForBot.voice}" are being created.`,
    });
    setIsAddBotDialogOpen(false);
    setCurrentSuggestionForBot(null);
  };


  if (isCallCenterLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-3/4 md:w-1/2" />
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-1" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!currentCallCenter) {
     return (
       <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">AI Agent Optimization</h2>
         <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>No Call Center Selected</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Please select a call center from the header or <Link href="/call-centers" className="text-primary underline">add and select a call center</Link> to use Agent Optimization.</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">AI Agent Optimization ({currentCallCenter.name})</h2>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Get AI-Powered Optimization Suggestions</CardTitle>
          <CardDescription>
            Input your script variant names, available voice names, and their performance data from the 
            '{currentCallCenter.name}'
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
                placeholder="Format: ScriptName:VoiceName:PerformanceMetric (e.g., 0.75). Separate entries with commas. Example: WelcomeV1:AvaFriendly:0.65, SalesVA:JohnPro:0.78" 
              />
              {errors.performanceData && <p className="text-sm text-destructive mt-1">{errors.performanceData.message}</p>}
               <p className="text-xs text-muted-foreground mt-1">
                Provide performance data for script-voice combinations within '{currentCallCenter.name}'. Use a consistent metric. Ensure names match those entered above.
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
            <CardDescription>Based on the provided data for '{currentCallCenter.name}', here are the AI's top recommendations:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <Card key={index} className="bg-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Lightbulb className="mr-2 h-5 w-5 text-primary" />
                    Suggestion {index + 1}: <span className="ml-2 font-semibold text-primary">{suggestion.scriptVariant}</span> with <span className="ml-1 font-semibold text-primary">{suggestion.voice}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80 flex items-start mb-3">
                    <BarChart className="mr-2 mt-1 h-4 w-4 text-accent flex-shrink-0" />
                    <strong>Rationale:</strong> {suggestion.rationale}
                  </p>
                   <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleMockCall(suggestion)}>
                      <Mic className="mr-2 h-4 w-4" /> Mock Call (Simulated)
                    </Button>
                    <Button variant="default" size="sm" onClick={() => handleOpenAddBotDialog(suggestion)}>
                      <BotIcon className="mr-2 h-4 w-4" /> Add as Bot(s)
                    </Button>
                  </div>
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
            <p>The AI could not generate specific suggestions based on the input for '{currentCallCenter.name}'. Please review your data or try different parameters.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isAddBotDialogOpen} onOpenChange={setIsAddBotDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bot(s) from Suggestion</DialogTitle>
            <DialogDescription>
              Configure new bot(s) based on: <br />
              Script: <strong>{currentSuggestionForBot?.scriptVariant}</strong> <br/>
              Voice: <strong>{currentSuggestionForBot?.voice}</strong>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={addBotForm.handleSubmit(handleAddBots)} className="space-y-4 py-4">
             <div>
                <Label htmlFor="botNamePrefix">Bot Name Prefix</Label>
                <Input id="botNamePrefix" {...addBotForm.register("botNamePrefix")} className="mt-1" />
                {addBotForm.formState.errors.botNamePrefix && <p className="text-sm text-destructive mt-1">{addBotForm.formState.errors.botNamePrefix.message}</p>}
            </div>
            <div>
                <Label htmlFor="botCount">Number of Bots</Label>
                <Input id="botCount" type="number" {...addBotForm.register("botCount")} className="mt-1" min="1" max="100" />
                {addBotForm.formState.errors.botCount && <p className="text-sm text-destructive mt-1">{addBotForm.formState.errors.botCount.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddBotDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Add Bot(s) (Simulated)</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}

    