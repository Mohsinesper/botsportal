
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Lightbulb, BarChartIcon, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCallCenter } from "@/contexts/CallCenterContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Campaign, CallFlow, CallFlowStepAnalysis, CampaignDropAnalysis, Agent, Voice } from "@/types";
import { MOCK_CAMPAIGNS, MOCK_AGENTS, MOCK_VOICES } from "@/lib/mock-data"; 
import { toast } from "@/hooks/use-toast";
import { handleAnalyzeCallDrop } from "./actions"; 
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input"; // Added Input for search

export default function AgentCallAnalysisPage() {
  const { currentCallCenter, isLoading: isCallCenterLoading } = useCallCenter();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [agentsForCallCenter, setAgentsForCallCenter] = useState<Agent[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>();
  const [analysisData, setAnalysisData] = useState<CampaignDropAnalysis | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [agentSearchTerm, setAgentSearchTerm] = useState("");


  useEffect(() => {
    if (currentCallCenter) {
      const ccCampaigns = MOCK_CAMPAIGNS.filter(c => c.callCenterId === currentCallCenter.id);
      setCampaigns(ccCampaigns);
      const ccAgents = MOCK_AGENTS.filter(a => a.callCenterId === currentCallCenter.id);
      setAgentsForCallCenter(ccAgents);
      setVoices(MOCK_VOICES.filter(v => v.callCenterId === currentCallCenter.id));
      setSelectedAgentId(ccAgents[0]?.id); 
    } else {
      setCampaigns([]);
      setAgentsForCallCenter([]);
      setVoices([]);
      setSelectedAgentId(undefined);
    }
    setIsLoadingPageData(false);
  }, [currentCallCenter]);

  useEffect(() => {
    if (selectedAgentId) {
      const agent = agentsForCallCenter.find(a => a.id === selectedAgentId);
      if (agent) {
        const campaign = campaigns.find(c => c.id === agent.campaignId);
        if (campaign && campaign.callFlows && campaign.callFlows.length > 0) {
          const masterFlow = campaign.callFlows[0];
          const simulatedAnalysis = simulateDropAnalysis(masterFlow, campaign.name);
          setAnalysisData(simulatedAnalysis);
          setAiSuggestions(null); 
        } else {
          setAnalysisData(null);
        }
      } else {
         setAnalysisData(null);
      }
    } else {
      setAnalysisData(null);
    }
  }, [selectedAgentId, agentsForCallCenter, campaigns]);

  const simulateDropAnalysis = (callFlow: CallFlow, campaignName: string): CampaignDropAnalysis => {
    const initialCalls = 1000;
    let remainingCalls = initialCalls;
    const stepsAnalysis: CallFlowStepAnalysis[] = [];
    const stepKeys = Object.keys(callFlow.steps);

    for (const stepKey of stepKeys) {
      if (remainingCalls <= 0) break;
      const step = callFlow.steps[stepKey];
      const callsReached = remainingCalls;
      
      let dropPercentage = (step.wait_for_response || step.conditions) ? Math.random() * 0.20 + 0.05 : Math.random() * 0.05 + 0.02;
      if (stepKey.includes("exit") || !step.next && !step.conditions) dropPercentage = 1.0;

      const callsDropped = Math.min(remainingCalls, Math.floor(callsReached * dropPercentage));
      remainingCalls -= callsDropped;

      stepsAnalysis.push({
        stepKey,
        stepDescription: step.description,
        callsReached,
        callsDropped,
        dropRate: parseFloat(((callsDropped / callsReached) * 100).toFixed(1)) || 0,
      });

      if (stepKey === callFlow.default_exit || !step.next && (!step.conditions || step.conditions.length === 0)) {
          if(remainingCalls > 0 && stepsAnalysis.length > 0){
             const lastAnalysisStep = stepsAnalysis[stepsAnalysis.length -1];
             lastAnalysisStep.callsDropped += remainingCalls;
             lastAnalysisStep.dropRate = parseFloat(((lastAnalysisStep.callsDropped / lastAnalysisStep.callsReached) * 100).toFixed(1)) || 0;
          }
          remainingCalls = 0;
          break; 
      }
    }
    return { campaignName, totalInitialCalls: initialCalls, stepsAnalysis };
  };

  const handleTriggerAIAnalysis = async () => {
    if (!analysisData || analysisData.stepsAnalysis.length === 0 || !selectedAgentId) {
      toast({ title: "No Data", description: "No call flow data or agent selected to analyze.", variant: "destructive" });
      return;
    }

    const significantDropStep = analysisData.stepsAnalysis
      .filter(s => s.dropRate > 0 && s.dropRate < 100) 
      .sort((a, b) => b.callsDropped - a.callsDropped)[0];

    if (!significantDropStep) {
      toast({ title: "No Significant Drops", description: "No specific high drop-off points identified in simulation for AI analysis.", variant: "default" });
      setAiSuggestions("AI analysis did not find significant non-terminal drop points in the simulated data. Ensure your call flow progresses logically.");
      return;
    }
    
    const agent = agentsForCallCenter.find(a => a.id === selectedAgentId);
    if (!agent) {
        toast({ title: "Error", description: "Selected agent not found.", variant: "destructive" });
        return;
    }
    const campaign = campaigns.find(c => c.id === agent.campaignId);
    const callFlow = campaign?.callFlows?.[0];

    if (!callFlow || !callFlow.steps[significantDropStep.stepKey]) {
        toast({title: "Error", description: "Could not find step details for analysis.", variant: "destructive"});
        return;
    }

    setIsAnalyzing(true);
    setAiSuggestions(null);
    try {
      const result = await handleAnalyzeCallDrop({
        campaignName: analysisData.campaignName, // This is still campaign name from the analysis data
        stepName: significantDropStep.stepKey,
        stepText: callFlow.steps[significantDropStep.stepKey].text,
        dropOffPercentage: significantDropStep.dropRate,
      });
      if ("error" in result) {
        toast({ title: "AI Analysis Failed", description: result.error, variant: "destructive" });
        setAiSuggestions(`Error: ${result.error}`);
      } else {
        setAiSuggestions(result.analysis);
        toast({ title: "AI Analysis Complete" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error during AI analysis";
      toast({ title: "AI Analysis Error", description: message, variant: "destructive" });
      setAiSuggestions(`Error: ${message}`);
    }
    setIsAnalyzing(false);
  };
  
  const isLoading = isAuthLoading || isCallCenterLoading || isLoadingPageData;

  const filteredAgentsForDropdown = useMemo(() => {
    if (!agentSearchTerm) return agentsForCallCenter;
    return agentsForCallCenter.filter(agent =>
      agent.name.toLowerCase().includes(agentSearchTerm.toLowerCase())
    );
  }, [agentsForCallCenter, agentSearchTerm]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-1/2" />
        <Card><Skeleton className="h-12 w-full" /></Card>
        <div className="grid md:grid-cols-2 gap-6">
          <Card><Skeleton className="h-80 w-full" /></Card>
          <Card><Skeleton className="h-80 w-full" /></Card>
        </div>
      </div>
    );
  }

  if (!currentUser || !["SUPER_ADMIN", "CALL_CENTER_ADMIN", "DESIGN_ADMIN"].includes(currentUser.role)) {
    return <Card><CardHeader><CardTitle>Access Denied</CardTitle></CardHeader><CardContent><p>You do not have permission to view this page.</p></CardContent></Card>;
  }
  
  if (!currentCallCenter) {
     return <Card><CardHeader><CardTitle>No Call Center Selected</CardTitle></CardHeader><CardContent><p>Please select a call center from the header to view agent call analysis.</p></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Agent Call Analysis ({currentCallCenter.name})</h2>

      <Card>
        <CardHeader>
          <CardTitle>Agent Selection</CardTitle>
          <CardDescription>Select an agent to analyze their campaign's call flow drop points.</CardDescription>
        </CardHeader>
        <CardContent>
          {agentsForCallCenter.length > 0 ? (
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger className="w-full md:w-1/2">
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search agents..."
                      value={agentSearchTerm}
                      onChange={(e) => setAgentSearchTerm(e.target.value)}
                      className="w-full pl-8 h-9"
                      onClick={(e) => e.stopPropagation()} 
                    />
                  </div>
                </div>
                {filteredAgentsForDropdown.map(agent => {
                   const campaign = campaigns.find(c => c.id === agent.campaignId);
                   const voice = voices.find(v => v.id === agent.voiceId);
                   const scriptVariant = campaign?.callFlows?.[0]?.name; // Assuming master flow name implies script
                   return (
                      <SelectItem key={agent.id} value={agent.id} disabled={!campaign?.callFlows || campaign.callFlows.length === 0}>
                        {agent.name} ({scriptVariant || 'N/A Script'}, {voice?.name || 'N/A Voice'})
                        {!campaign?.callFlows || campaign.callFlows.length === 0 ? " (No call flow in campaign)" : ""}
                      </SelectItem>
                   );
                })}
                {filteredAgentsForDropdown.length === 0 && (
                  <div className="p-2 text-center text-sm text-muted-foreground">No agents found.</div>
                )}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-muted-foreground">No agents configured for '{currentCallCenter.name}'. Please <Link href="/agents" className="underline text-primary">configure agents</Link>.</p>
          )}
        </CardContent>
      </Card>

      {analysisData && analysisData.stepsAnalysis.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChartIcon className="mr-2 h-5 w-5 text-primary" />
                Simulated Call Drop-off Funnel
              </CardTitle>
              <CardDescription>
                Visualization of simulated call drops for agent '{agentsForCallCenter.find(a=>a.id === selectedAgentId)?.name}' on campaign '{analysisData.campaignName}'. Started with {analysisData.totalInitialCalls} calls.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysisData.stepsAnalysis} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stepKey" type="category" width={150} interval={0} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value, name) => [name === "dropRate" ? `${value}%` : value, name === "stepDescription" ? "Step" : name ]} />
                  <Legend />
                  <Bar dataKey="callsReached" name="Calls Reached Step" fill="hsl(var(--chart-1))" />
                  <Bar dataKey="callsDropped" name="Calls Dropped at Step" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                 <Lightbulb className="mr-2 h-5 w-5 text-primary" />
                AI Drop Point Analysis
              </CardTitle>
              <CardDescription>Get AI-powered insights on potential reasons for call drops.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleTriggerAIAnalysis} disabled={isAnalyzing || !selectedAgentId} className="w-full">
                {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                Analyze Highest Drop Point (Mock AI)
              </Button>
              {aiSuggestions && (
                <div className="mt-4 p-4 border bg-muted/50 rounded-md text-sm">
                  <h4 className="font-semibold mb-2">AI Suggestions:</h4>
                  <p className="whitespace-pre-wrap">{aiSuggestions}</p>
                </div>
              )}
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">Note: AI analysis is based on simulated data and generic insights for this demonstration.</p>
            </CardFooter>
          </Card>
        </div>
      ) : selectedAgentId ? (
         <Card><CardHeader><CardTitle>No Call Flow Data</CardTitle></CardHeader><CardContent><p>The selected agent's campaign does not have a call flow defined or it has no steps. Please <Link href="/campaigns" className="text-primary underline">edit the campaign</Link> to add a call flow.</p></CardContent></Card>
      ) : !isLoading && agentsForCallCenter.length > 0 ? (
         <Card><CardHeader><CardTitle>Select an Agent</CardTitle></CardHeader><CardContent><p>Please select an agent above to view their call drop analysis.</p></CardContent></Card>
      ) : null}
    </div>
  );
}

