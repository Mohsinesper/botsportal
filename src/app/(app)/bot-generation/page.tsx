
"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Cpu, Zap, Users, Shuffle } from "lucide-react";
import type { Campaign, Agent, Bot } from "@/types";
import { toast } from "@/hooks/use-toast";

// Mock data (replace with actual data fetching)
const mockCampaigns: Campaign[] = [
  { id: "c1", name: "Summer Sale Campaign", status: "active", scriptVariants: ["sv1"], targetAudience: "All subscribers", callObjective: "Promote summer sale", createdDate: "2023-01-01" },
  { id: "c2", name: "New Product Feedback", status: "active", scriptVariants: ["sv2"], targetAudience: "Recent buyers", callObjective: "Gather product feedback", createdDate: "2023-02-01" },
];

const mockAgents: Agent[] = [
  { id: "a1", name: "Ava - Friendly Welcome", scriptVariantId: "sv1", voice: "Ava" },
  { id: "a2", name: "John - Professional Pitch", scriptVariantId: "sv2", voice: "John" },
  { id: "a3", name: "Mia - Empathetic Closing", scriptVariantId: "sv1", voice: "Mia" },
];


const botGenerationSchema = z.object({
  campaignId: z.string().min(1, "Campaign selection is required"),
  generationType: z.enum(["individual", "bulk-fifo", "bulk-random"]),
  agentId: z.string().optional(), // Required only if generationType is 'individual'
  botCount: z.coerce.number().int().min(1, "Number of bots must be at least 1").optional(), // Required for bulk
  botNamePrefix: z.string().optional(),
}).refine(data => {
  if (data.generationType === "individual" && !data.agentId) {
    return false;
  }
  return true;
}, {
  message: "Agent selection is required for individual bot generation",
  path: ["agentId"],
}).refine(data => {
  if (data.generationType !== "individual" && (!data.botCount || data.botCount < 1)) {
    return false;
  }
  return true;
}, {
  message: "Bot count is required for bulk generation",
  path: ["botCount"],
});

type BotGenerationFormData = z.infer<typeof botGenerationSchema>;

export default function BotGenerationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedBots, setGeneratedBots] = useState<Bot[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    setCampaigns(mockCampaigns);
    setAgents(mockAgents);
  }, []);

  const { control, handleSubmit, register, watch, formState: { errors } } = useForm<BotGenerationFormData>({
    resolver: zodResolver(botGenerationSchema),
    defaultValues: {
      generationType: "individual",
      botCount: 10,
      botNamePrefix: "Bot"
    }
  });

  const generationType = watch("generationType");

  const onSubmit = async (data: BotGenerationFormData) => {
    setIsLoading(true);
    setGeneratedBots([]);

    // Simulate bot generation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newBots: Bot[] = [];
    const selectedCampaign = campaigns.find(c => c.id === data.campaignId);

    if (!selectedCampaign) {
      toast({ title: "Error", description: "Selected campaign not found.", variant: "destructive"});
      setIsLoading(false);
      return;
    }

    const count = data.generationType === "individual" ? 1 : data.botCount || 0;

    for (let i = 0; i < count; i++) {
      let agentIdToUse = data.agentId;
      if (data.generationType === "bulk-fifo") {
        agentIdToUse = agents[i % agents.length]?.id || agents[0]?.id; // Cycle through agents
      } else if (data.generationType === "bulk-random") {
        agentIdToUse = agents[Math.floor(Math.random() * agents.length)]?.id || agents[0]?.id; // Random agent
      }
      
      if (!agentIdToUse && data.generationType === 'individual') {
         toast({ title: "Error", description: "Agent not found for individual generation.", variant: "destructive"});
         setIsLoading(false);
         return;
      }
      if (!agentIdToUse && data.generationType !== 'individual' && agents.length === 0) {
         toast({ title: "Error", description: "No agents available for bulk generation.", variant: "destructive"});
         setIsLoading(false);
         return;
      }


      newBots.push({
        id: `bot-${Date.now()}-${i}`,
        name: `${data.botNamePrefix || selectedCampaign.name.substring(0,5).replace(/\s/g, '') }-${i + 1}`,
        campaignId: selectedCampaign.id,
        agentId: agentIdToUse!,
        status: "active",
        creationDate: new Date().toISOString(),
      });
    }

    setGeneratedBots(newBots);
    toast({ title: "Bots Generated Successfully!", description: `${newBots.length} bot(s) have been created.` });
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Bot Generation</h2>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Configure and Generate Bots</CardTitle>
          <CardDescription>Streamline the process of deploying new bots for your campaigns.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="campaignId">Select Campaign</Label>
              <Controller
                name="campaignId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Choose a campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map(campaign => (
                        <SelectItem key={campaign.id} value={campaign.id}>{campaign.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.campaignId && <p className="text-sm text-destructive mt-1">{errors.campaignId.message}</p>}
            </div>

            <div>
              <Label>Generation Type</Label>
              <Controller
                name="generationType"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Label htmlFor="individual" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                       <RadioGroupItem value="individual" id="individual" className="sr-only" />
                       <Users className="mb-3 h-6 w-6" /> Individual
                       <span className="text-xs text-muted-foreground text-center mt-1">Manually select agent for one bot.</span>
                    </Label>
                    <Label htmlFor="bulk-fifo" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                       <RadioGroupItem value="bulk-fifo" id="bulk-fifo" className="sr-only" />
                       <Zap className="mb-3 h-6 w-6" /> Bulk (FIFO)
                       <span className="text-xs text-muted-foreground text-center mt-1">Assign agents sequentially.</span>
                    </Label>
                    <Label htmlFor="bulk-random" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                       <RadioGroupItem value="bulk-random" id="bulk-random" className="sr-only" />
                       <Shuffle className="mb-3 h-6 w-6" /> Bulk (Random)
                       <span className="text-xs text-muted-foreground text-center mt-1">Assign agents randomly.</span>
                    </Label>
                  </RadioGroup>
                )}
              />
            </div>

            {generationType === "individual" && (
              <div>
                <Label htmlFor="agentId">Select Agent</Label>
                 <Controller
                    name="agentId"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Choose an agent configuration" />
                        </SelectTrigger>
                        <SelectContent>
                        {agents.map(agent => (
                            <SelectItem key={agent.id} value={agent.id}>{agent.name} (Voice: {agent.voice})</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    )}
                />
                {errors.agentId && <p className="text-sm text-destructive mt-1">{errors.agentId.message}</p>}
              </div>
            )}

            {generationType !== "individual" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="botCount">Number of Bots</Label>
                    <Input id="botCount" type="number" {...register("botCount")} className="mt-1" min="1" />
                    {errors.botCount && <p className="text-sm text-destructive mt-1">{errors.botCount.message}</p>}
                </div>
                <div>
                    <Label htmlFor="botNamePrefix">Bot Name Prefix (Optional)</Label>
                    <Input id="botNamePrefix" {...register("botNamePrefix")} className="mt-1" placeholder="e.g., CampaignXBot"/>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Cpu className="mr-2 h-4 w-4" />}
              Generate Bots
            </Button>
          </CardFooter>
        </form>
      </Card>

      {generatedBots.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Generated Bots</CardTitle>
            <CardDescription>{generatedBots.length} bot(s) were created successfully.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {generatedBots.map(bot => (
                <li key={bot.id} className="flex justify-between items-center p-2 border rounded-md bg-muted/30">
                  <span>{bot.name} (Campaign: {campaigns.find(c=>c.id === bot.campaignId)?.name}, Agent: {agents.find(a=>a.id === bot.agentId)?.name})</span>
                  <Badge variant={bot.status === "active" ? "default" : "secondary"}>{bot.status}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
