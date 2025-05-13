
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
import type { Campaign, Agent, Bot, Voice, ScriptVariant } from "@/types";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useCallCenter } from "@/contexts/CallCenterContext";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

// Global Mock data (replace with actual data fetching for a real app)
const allMockCampaigns: Campaign[] = [
  { 
    id: "c1", 
    name: "Summer Sale Campaign (CC1)", 
    status: "active", 
    targetAudience: "All subscribers", 
    callObjective: "Promote summer sale", 
    createdDate: "2023-01-01",
    callCenterId: "cc1",
    masterScript: "Master script for summer sale...",
    scriptVariants: [
      { id: "sv1-c1", name: "Summer Sale Variant 1", content: "Hello! Check out our summer sale..." },
      { id: "sv2-c1", name: "Summer Sale Variant 2 (Urgent)", content: "Don't miss out! Summer sale ends soon..." },
    ]
  },
  { 
    id: "c2", 
    name: "New Product Feedback (CC1)", 
    status: "active", 
    targetAudience: "Recent buyers", 
    callObjective: "Gather product feedback", 
    createdDate: "2023-02-01",
    callCenterId: "cc1",
    masterScript: "Master script for product feedback...",
    scriptVariants: [
      { id: "sv1-c2", name: "Feedback Variant Polite", content: "We'd love your feedback on our new product." },
    ]
  },
  { 
    id: "c3", 
    name: "Winter Promo (CC2)", 
    status: "active", 
    targetAudience: "Previous winter buyers", 
    callObjective: "Promote winter specials", 
    createdDate: "2023-03-01",
    callCenterId: "cc2",
    masterScript: "Master script for winter promo...",
    scriptVariants: [
      { id: "sv1-c3", name: "Winter Variant Early Bird", content: "Early bird specials for winter!" },
    ]
  },
   { 
    id: "c4", 
    name: "Support Follow-up (CC3)", 
    status: "active", 
    targetAudience: "Customers with recent support tickets", 
    callObjective: "Ensure issue resolution and satisfaction", 
    createdDate: "2023-04-01",
    callCenterId: "cc3",
    masterScript: "Master script for support follow-up...",
    scriptVariants: [
      { id: "sv1-c4", name: "Support Check-in", content: "Hello, this is a follow-up on your recent support request..." },
    ]
  },
];

const allMockVoices: Voice[] = [
  { id: "v1", name: "Ava - Friendly Female", provider: "ElevenLabs", callCenterId: "cc1" },
  { id: "v2", name: "John - Professional Male", provider: "GoogleTTS", callCenterId: "cc1" },
  { id: "v3", name: "Mia - Empathetic Female", provider: "ElevenLabs", callCenterId: "cc2" },
  { id: "v4", name: "Liam - Clear Male", provider: "GoogleTTS", callCenterId: "cc2" },
  { id: "v5", name: "Zoe - Upbeat Female", provider: "AzureTTS", callCenterId: "cc3"},
];

const allMockAgents: Agent[] = [
  { id: "agent1", name: "Summer Sale V1 - Ava (CC1)", campaignId: "c1", scriptVariantId: "sv1-c1", voiceId: "v1", callCenterId: "cc1" },
  { id: "agent2", name: "Summer Sale V2 - John (CC1)", campaignId: "c1", scriptVariantId: "sv2-c1", voiceId: "v2", callCenterId: "cc1" },
  { id: "agent3", name: "Feedback Polite - Ava (CC1)", campaignId: "c2", scriptVariantId: "sv1-c2", voiceId: "v1", callCenterId: "cc1" },
  { id: "agent4", name: "Winter Early - Mia (CC2)", campaignId: "c3", scriptVariantId: "sv1-c3", voiceId: "v3", callCenterId: "cc2" },
  { id: "agent5", name: "Support Check - Zoe (CC3)", campaignId: "c4", scriptVariantId: "sv1-c4", voiceId: "v5", callCenterId: "cc3"},
];


const botGenerationSchema = z.object({
  campaignId: z.string().min(1, "Campaign selection is required"),
  generationType: z.enum(["individual", "bulk-fifo", "bulk-random"]),
  agentId: z.string().optional(), 
  botCount: z.coerce.number().int().min(1, "Number of bots must be at least 1").optional(),
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
  const { currentCallCenter, isLoading: isCallCenterLoading } = useCallCenter();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedBots, setGeneratedBots] = useState<Bot[]>([]);
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]); 
  const [voices, setVoices] = useState<Voice[]>([]);

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>();

  useEffect(() => {
    if (currentCallCenter) {
      setCampaigns(allMockCampaigns.filter(c => c.callCenterId === currentCallCenter.id));
      setAgents(allMockAgents.filter(a => a.callCenterId === currentCallCenter.id));
      setVoices(allMockVoices.filter(v => v.callCenterId === currentCallCenter.id));
    } else {
      setCampaigns([]);
      setAgents([]);
      setVoices([]);
    }
    // Reset campaign-dependent fields when call center changes
    setValue("campaignId", undefined);
    setValue("agentId", undefined);
    setSelectedCampaignId(undefined);

  }, [currentCallCenter]);

  const { control, handleSubmit, register, watch, formState: { errors }, setValue } = useForm<BotGenerationFormData>({
    resolver: zodResolver(botGenerationSchema),
    defaultValues: {
      generationType: "individual",
      botCount: 10,
      botNamePrefix: "Bot"
    }
  });

  const generationType = watch("generationType");
  const watchedCampaignId = watch("campaignId");

  const availableAgentsForCampaign = agents.filter(agent => agent.campaignId === watchedCampaignId);

  useEffect(() => {
    if (watchedCampaignId !== selectedCampaignId) {
      setSelectedCampaignId(watchedCampaignId);
      setValue("agentId", undefined); 
    }
  }, [watchedCampaignId, selectedCampaignId, setValue]);


  const onSubmit = async (data: BotGenerationFormData) => {
    setIsLoading(true);
    setGeneratedBots([]);

    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

    if (!currentCallCenter) {
      toast({ title: "Error", description: "No call center selected.", variant: "destructive"});
      setIsLoading(false);
      return;
    }

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
      let agentIdToUse = data.agentId; 
      
      if (data.generationType === "bulk-fifo") {
        agentIdToUse = agentsForThisCampaign[i % agentsForThisCampaign.length]?.id;
      } else if (data.generationType === "bulk-random") {
        agentIdToUse = agentsForThisCampaign[Math.floor(Math.random() * agentsForThisCampaign.length)]?.id;
      }
      
      if (!agentIdToUse) {
         toast({ title: "Error", description: `Could not determine agent for bot ${i + 1}. Ensure agents are configured.`, variant: "destructive"});
         continue; 
      }

      newBots.push({
        id: `bot-${Date.now()}-${i}`,
        name: `${data.botNamePrefix || selectedCampaign.name.substring(0,5).replace(/\s/g, '') }-${i + 1}`,
        campaignId: selectedCampaign.id,
        agentId: agentIdToUse!,
        status: "active",
        creationDate: new Date().toISOString(),
        callCenterId: currentCallCenter.id, 
      });
    }
    // In a real app, these new bots would be saved to a backend.
    // For mock purposes, we can add them to a global list if we want them to persist across navigations,
    // but for this page, just setting local state is fine to show the result.
    setGeneratedBots(newBots);
    if (newBots.length > 0) {
      toast({ title: "Bots Generated Successfully!", description: `${newBots.length} bot(s) have been created.` });
    } else if(count > 0) { // If tried to generate but none were created
      toast({ title: "Bot Generation Issue", description: "No bots were generated. Please check configuration and ensure agents are available for the campaign.", variant: "default"});
    }
    setIsLoading(false);
  };

  const getAgentDetails = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId); // agents state is already filtered
    if (!agent) return "Unknown Agent";
    const voice = voices.find(v => v.id === agent.voiceId); // voices state is already filtered
    const campaign = campaigns.find(c => c.id === agent.campaignId); // campaigns state is already filtered
    const scriptVariant = campaign?.scriptVariants?.find(sv => sv.id === agent.scriptVariantId);
    return `${agent.name} (Script: ${scriptVariant?.name || 'N/A'}, Voice: ${voice?.name || 'N/A'})`;
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
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-1/2" />
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Skeleton className="h-10 w-36" />
          </CardFooter>
        </Card>
      </div>
    );
  }


  if (!currentCallCenter) {
     return (
       <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Bot Generation</h2>
         <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>No Call Center Selected</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Please select a call center from the header or <Link href="/call-centers" className="text-primary underline">add and select a call center</Link> to use Bot Generation.</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Bot Generation ({currentCallCenter.name})</h2>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Configure and Generate Bots</CardTitle>
          <CardDescription>Streamline the process of deploying new bots for your campaigns within {currentCallCenter.name}.</CardDescription>
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
                    onValueChange={(value) => { field.onChange(value); }} 
                    value={field.value || ""} // Ensure value is controlled
                    disabled={campaigns.length === 0}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder={campaigns.length === 0 ? "No campaigns for this call center" : "Choose a campaign"} />
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
              {campaigns.length === 0 && <p className="text-xs text-muted-foreground mt-1">No campaigns available for '{currentCallCenter.name}'. Please <Link href="/campaigns" className="underline text-primary">create a campaign</Link> first.</p>}
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
                    <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ""}  // Ensure value is controlled
                        disabled={!watchedCampaignId || availableAgentsForCampaign.length === 0}
                    >
                        <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder={!watchedCampaignId ? "Select a campaign first" : (availableAgentsForCampaign.length === 0 ? "No agents for this campaign" : "Choose an agent configuration")} />
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
                 {!watchedCampaignId && campaigns.length > 0 && <p className="text-xs text-muted-foreground mt-1">Please select a campaign to see available agents.</p>}
                 {watchedCampaignId && availableAgentsForCampaign.length === 0 && <p className="text-xs text-muted-foreground mt-1">No agent configurations found for the selected campaign in this call center. Agents define the script and voice for a bot.</p>}
              </div>
            )}

            {generationType !== "individual" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="botCount">Number of Bots</Label>
                    <Input id="botCount" type="number" {...register("botCount")} className="mt-1" min="1" disabled={!watchedCampaignId} />
                    {errors.botCount && <p className="text-sm text-destructive mt-1">{errors.botCount.message}</p>}
                </div>
                <div>
                    <Label htmlFor="botNamePrefix">Bot Name Prefix (Optional)</Label>
                    <Input id="botNamePrefix" {...register("botNamePrefix")} className="mt-1" placeholder="e.g., CampaignXBot" disabled={!watchedCampaignId}/>
                </div>
                 {!watchedCampaignId && campaigns.length > 0 && <p className="text-xs text-muted-foreground mt-1 col-span-full">Please select a campaign first to enable bulk generation.</p>}
                 {watchedCampaignId && availableAgentsForCampaign.length === 0 && <p className="text-xs text-warning-foreground mt-1 col-span-full bg-warning/20 p-2 rounded-md">Warning: No agent configurations found for the selected campaign. Bots cannot be generated without agents.</p>}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button 
                type="submit" 
                disabled={
                    isLoading || 
                    !watchedCampaignId || 
                    (generationType === 'individual' && !watch("agentId")) ||
                    (generationType !== 'individual' && availableAgentsForCampaign.length === 0 && campaigns.length > 0) // Disable bulk if campaign selected but no agents
                } 
                className="w-full md:w-auto"
            >
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
            <CardDescription>{generatedBots.length} bot(s) were created successfully for {currentCallCenter.name}.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {generatedBots.map(bot => (
                <li key={bot.id} className="flex justify-between items-center p-3 border rounded-md bg-muted/30 text-sm">
                  <div>
                    <p className="font-semibold">{bot.name}</p>
                    <p className="text-xs text-muted-foreground">Campaign: {campaigns.find(c=>c.id === bot.campaignId)?.name}</p>
                    <p className="text-xs text-muted-foreground">Agent Config: {getAgentDetails(bot.agentId)}</p>
                     <p className="text-xs text-muted-foreground">Call Center: {currentCallCenter.name}</p>
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
