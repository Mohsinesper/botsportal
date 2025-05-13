
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
import type { Campaign, Agent, Bot, Voice, ScriptVariant } from "@/types"; // Updated imports
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge"; // Added Badge import

// Mock data (replace with actual data fetching)
const mockCampaigns: Campaign[] = [
  { 
    id: "c1", 
    name: "Summer Sale Campaign", 
    status: "active", 
    targetAudience: "All subscribers", 
    callObjective: "Promote summer sale", 
    createdDate: "2023-01-01",
    masterScript: "Master script for summer sale...",
    scriptVariants: [
      { id: "sv1-c1", name: "Summer Sale Variant 1", content: "Hello! Check out our summer sale..." },
      { id: "sv2-c1", name: "Summer Sale Variant 2 (Urgent)", content: "Don't miss out! Summer sale ends soon..." },
    ]
  },
  { 
    id: "c2", 
    name: "New Product Feedback", 
    status: "active", 
    targetAudience: "Recent buyers", 
    callObjective: "Gather product feedback", 
    createdDate: "2023-02-01",
    masterScript: "Master script for product feedback...",
    scriptVariants: [
      { id: "sv1-c2", name: "Feedback Variant Polite", content: "We'd love your feedback on our new product." },
    ]
  },
];

const mockVoices: Voice[] = [
  { id: "v1", name: "Ava - Friendly Female", provider: "ElevenLabs" },
  { id: "v2", name: "John - Professional Male", provider: "GoogleTTS" },
  { id: "v3", name: "Mia - Empathetic Female", provider: "ElevenLabs" },
];

// Agents are now combinations of a script variant (from a campaign) and a voice.
// For mocking, we'll predefine some agent configurations.
// In a real app, users might create these dynamically or select script variant + voice.
const mockAgents: Agent[] = [
  { id: "agent1", name: "Summer Sale V1 - Ava", campaignId: "c1", scriptVariantId: "sv1-c1", voiceId: "v1" },
  { id: "agent2", name: "Summer Sale V2 - John", campaignId: "c1", scriptVariantId: "sv2-c1", voiceId: "v2" },
  { id: "agent3", name: "Feedback Polite - Mia", campaignId: "c2", scriptVariantId: "sv1-c2", voiceId: "v3" },
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
  const [agents, setAgents] = useState<Agent[]>([]); // This will list available pre-configured agents
  const [voices, setVoices] = useState<Voice[]>([]); // Not directly used for agent selection if agents are pre-configured

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>();

  useEffect(() => {
    setCampaigns(mockCampaigns);
    setAgents(mockAgents); // Assuming agents are pre-configured for now
    setVoices(mockVoices);
  }, []);

  const { control, handleSubmit, register, watch, formState: { errors }, setValue } = useForm<BotGenerationFormData>({
    resolver: zodResolver(botGenerationSchema),
    defaultValues: {
      generationType: "individual",
      botCount: 10,
      botNamePrefix: "Bot"
    }
  });

  const generationType = watch("generationType");
  const currentCampaignId = watch("campaignId");

  // Filter agents based on selected campaign
  const availableAgentsForCampaign = agents.filter(agent => agent.campaignId === currentCampaignId);

  useEffect(() => {
    if (currentCampaignId !== selectedCampaignId) {
      setSelectedCampaignId(currentCampaignId);
      setValue("agentId", undefined); // Reset agent selection when campaign changes
    }
  }, [currentCampaignId, selectedCampaignId, setValue]);


  const onSubmit = async (data: BotGenerationFormData) => {
    setIsLoading(true);
    setGeneratedBots([]);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const newBots: Bot[] = [];
    const selectedCampaign = campaigns.find(c => c.id === data.campaignId);

    if (!selectedCampaign) {
      toast({ title: "Error", description: "Selected campaign not found.", variant: "destructive"});
      setIsLoading(false);
      return;
    }
    
    const agentsForThisCampaign = agents.filter(a => a.campaignId === selectedCampaign.id);
    if (agentsForThisCampaign.length === 0 && data.generationType !== "individual") {
        toast({ title: "Error", description: "No agents configured for the selected campaign for bulk generation.", variant: "destructive"});
        setIsLoading(false);
        return;
    }
     if (agentsForThisCampaign.length === 0 && data.generationType === "individual" && !data.agentId) {
        toast({ title: "Error", description: "No agents available for this campaign.", variant: "destructive"});
        setIsLoading(false);
        return;
    }


    const count = data.generationType === "individual" ? 1 : data.botCount || 0;

    for (let i = 0; i < count; i++) {
      let agentIdToUse = data.agentId; // For individual
      
      if (data.generationType === "bulk-fifo") {
        agentIdToUse = agentsForThisCampaign[i % agentsForThisCampaign.length]?.id;
      } else if (data.generationType === "bulk-random") {
        agentIdToUse = agentsForThisCampaign[Math.floor(Math.random() * agentsForThisCampaign.length)]?.id;
      }
      
      if (!agentIdToUse) { // Should only happen if individual generation fails to select or bulk has no agents
         toast({ title: "Error", description: `Could not determine agent for bot ${i + 1}.`, variant: "destructive"});
         continue; // Skip this bot
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
    if (newBots.length > 0) {
      toast({ title: "Bots Generated Successfully!", description: `${newBots.length} bot(s) have been created.` });
    } else {
      toast({ title: "Bot Generation Issue", description: "No bots were generated. Please check configuration.", variant: "default"});
    }
    setIsLoading(false);
  };

  const getAgentDetails = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return "Unknown Agent";
    const voice = voices.find(v => v.id === agent.voiceId);
    const campaign = campaigns.find(c => c.id === agent.campaignId);
    const scriptVariant = campaign?.scriptVariants?.find(sv => sv.id === agent.scriptVariantId);
    return `${agent.name} (Script: ${scriptVariant?.name || 'N/A'}, Voice: ${voice?.name || 'N/A'})`;
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
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      //setSelectedCampaignId(value); // This is handled by useEffect now
                    }} 
                    defaultValue={field.value}
                  >
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
                    <Label htmlFor="individual" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer">
                       <RadioGroupItem value="individual" id="individual" className="sr-only" />
                       <Users className="mb-3 h-6 w-6" /> Individual
                       <span className="text-xs text-muted-foreground text-center mt-1">Manually select agent for one bot.</span>
                    </Label>
                    <Label htmlFor="bulk-fifo" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer">
                       <RadioGroupItem value="bulk-fifo" id="bulk-fifo" className="sr-only" />
                       <Zap className="mb-3 h-6 w-6" /> Bulk (FIFO)
                       <span className="text-xs text-muted-foreground text-center mt-1">Assign agents sequentially.</span>
                    </Label>
                    <Label htmlFor="bulk-random" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer">
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
                <Label htmlFor="agentId">Select Agent Configuration</Label>
                 <Controller
                    name="agentId"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={!currentCampaignId || availableAgentsForCampaign.length === 0}>
                        <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder={!currentCampaignId ? "Select a campaign first" : (availableAgentsForCampaign.length === 0 ? "No agents for this campaign" : "Choose an agent configuration")} />
                        </SelectTrigger>
                        <SelectContent>
                        {availableAgentsForCampaign.map(agent => {
                            const voice = voices.find(v => v.id === agent.voiceId);
                            const campaign = campaigns.find(c => c.id === agent.campaignId);
                            const scriptVariant = campaign?.scriptVariants?.find(sv => sv.id === agent.scriptVariantId);
                            return (
                                <SelectItem key={agent.id} value={agent.id}>
                                    {agent.name} (Script: {scriptVariant?.name || 'N/A'}, Voice: {voice?.name || 'N/A'})
                                </SelectItem>
                            );
                        })}
                        </SelectContent>
                    </Select>
                    )}
                />
                {errors.agentId && <p className="text-sm text-destructive mt-1">{errors.agentId.message}</p>}
                 {!currentCampaignId && <p className="text-xs text-muted-foreground mt-1">Please select a campaign to see available agents.</p>}
                 {currentCampaignId && availableAgentsForCampaign.length === 0 && <p className="text-xs text-muted-foreground mt-1">No agent configurations found for the selected campaign.</p>}
              </div>
            )}

            {generationType !== "individual" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="botCount">Number of Bots</Label>
                    <Input id="botCount" type="number" {...register("botCount")} className="mt-1" min="1" disabled={!currentCampaignId} />
                    {errors.botCount && <p className="text-sm text-destructive mt-1">{errors.botCount.message}</p>}
                </div>
                <div>
                    <Label htmlFor="botNamePrefix">Bot Name Prefix (Optional)</Label>
                    <Input id="botNamePrefix" {...register("botNamePrefix")} className="mt-1" placeholder="e.g., CampaignXBot" disabled={!currentCampaignId}/>
                </div>
                 {!currentCampaignId && <p className="text-xs text-muted-foreground mt-1 col-span-full">Please select a campaign first to enable bulk generation.</p>}
                 {currentCampaignId && availableAgentsForCampaign.length === 0 && <p className="text-xs text-muted-foreground mt-1 col-span-full">Warning: No agent configurations found for the selected campaign. Bots may not be generated correctly.</p>}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={isLoading || !currentCampaignId || (generationType==='individual' && !watch("agentId"))} className="w-full md:w-auto">
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
                <li key={bot.id} className="flex justify-between items-center p-3 border rounded-md bg-muted/30 text-sm">
                  <div>
                    <p className="font-semibold">{bot.name}</p>
                    <p className="text-xs text-muted-foreground">Campaign: {campaigns.find(c=>c.id === bot.campaignId)?.name}</p>
                    <p className="text-xs text-muted-foreground">Agent Config: {getAgentDetails(bot.agentId)}</p>
                  </div>
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
