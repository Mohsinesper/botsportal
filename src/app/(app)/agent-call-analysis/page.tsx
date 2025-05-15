
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Lightbulb, BarChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCallCenter } from "@/contexts/CallCenterContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Campaign, CallFlow, CallFlowStepAnalysis, CampaignDropAnalysis } from "@/types";
import { MOCK_CAMPAIGNS } from "@/lib/mock-data"; // Assuming campaigns are here
import { toast } from "@/hooks/use-toast";
import { handleAnalyzeCallDrop } from "./actions"; 
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function AgentCallAnalysisPage() {
  const { currentCallCenter, isLoading: isCallCenterLoading } = useCallCenter();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>();
  const [analysisData, setAnalysisData] = useState<CampaignDropAnalysis | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);

  useEffect(() => {
    if (currentCallCenter) {
      // Filter campaigns for the current call center
      const ccCampaigns = MOCK_CAMPAIGNS.filter(c => c.callCenterId === currentCallCenter.id);
      setCampaigns(ccCampaigns);
      setSelectedCampaignId(ccCampaigns[0]?.id); // Select first campaign by default
    } else {
      setCampaigns([]);
      setSelectedCampaignId(undefined);
    }
    setIsLoadingCampaigns(false);
  }, [currentCallCenter]);

  useEffect(() => {
    if (selectedCampaignId) {
      const campaign = campaigns.find(c => c.id === selectedCampaignId);
      if (campaign && campaign.callFlows && campaign.callFlows.length > 0) {
        // Simulate drop analysis for the first call flow (master)
        const masterFlow = campaign.callFlows[0];
        const simulatedAnalysis = simulateDropAnalysis(masterFlow, campaign.name);
        setAnalysisData(simulatedAnalysis);
        setAiSuggestions(null); // Reset AI suggestions when campaign changes
      } else {
        setAnalysisData(null);
      }
    } else {
      setAnalysisData(null);
    }
  }, [selectedCampaignId, campaigns]);

  const simulateDropAnalysis = (callFlow: CallFlow, campaignName: string): CampaignDropAnalysis => {
    const initialCalls = 1000;
    let remainingCalls = initialCalls;
    const stepsAnalysis: CallFlowStepAnalysis[] = [];
    const stepKeys = Object.keys(callFlow.steps);

    for (const stepKey of stepKeys) {
      if (remainingCalls <= 0) break;
      const step = callFlow.steps[stepKey];
      const callsReached = remainingCalls;
      
      // Simulate drop rate: higher for complex steps or questions
      let dropPercentage = (step.wait_for_response || step.conditions) ? Math.random() * 0.20 + 0.05 : Math.random() * 0.05 + 0.02; // 5-25% for interactive, 2-7% for non-interactive
      if (stepKey.includes("exit") || !step.next && !step.conditions) dropPercentage = 1.0; // All remaining drop at exit

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
          // If it's an exit point, ensure all remaining calls are "dropped" here for the simulation
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
    if (!analysisData || analysisData.stepsAnalysis.length === 0) {
      toast({ title: "No Data", description: "No call flow data to analyze.", variant: "destructive" });
      return;
    }

    // Find step with highest drop count (excluding perfect drop rates at exits for simulation)
    const significantDropStep = analysisData.stepsAnalysis
      .filter(s => s.dropRate > 0 && s.dropRate < 100) 
      .sort((a, b) => b.callsDropped - a.callsDropped)[0];

    if (!significantDropStep) {
      toast({ title: "No Significant Drops", description: "No specific high drop-off points identified in simulation for AI analysis.", variant: "default" });
      setAiSuggestions("AI analysis did not find significant non-terminal drop points in the simulated data. Ensure your call flow progresses logically.");
      return;
    }
    
    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
    const callFlow = selectedCampaign?.callFlows?.[0];
    if (!callFlow || !callFlow.steps[significantDropStep.stepKey]) {
        toast({title: "Error", description: "Could not find step details for analysis.", variant: "destructive"});
        return;
    }

    setIsAnalyzing(true);
    setAiSuggestions(null);
    try {
      const result = await handleAnalyzeCallDrop({
        campaignName: analysisData.campaignName,
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
  
  const isLoading = isAuthLoading || isCallCenterLoading || isLoadingCampaigns;

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
          <CardTitle>Campaign Selection</CardTitle>
          <CardDescription>Select a campaign to analyze its call flow drop points.</CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length > 0 ? (
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger className="w-full md:w-1/2">
                <SelectValue placeholder="Select a campaign" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map(campaign => (
                  <SelectItem key={campaign.id} value={campaign.id} disabled={!campaign.callFlows || campaign.callFlows.length === 0}>
                    {campaign.name} {!campaign.callFlows || campaign.callFlows.length === 0 ? "(No call flow)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-muted-foreground">No campaigns available for '{currentCallCenter.name}'. Please <Link href="/campaigns" className="underline text-primary">create a campaign with a call flow</Link>.</p>
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
                Visualization of simulated call drops at each step for '{analysisData.campaignName}'. Started with {analysisData.totalInitialCalls} calls.
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
              <Button onClick={handleTriggerAIAnalysis} disabled={isAnalyzing} className="w-full">
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
      ) : selectedCampaignId ? (
         <Card><CardHeader><CardTitle>No Call Flow Data</CardTitle></CardHeader><CardContent><p>The selected campaign does not have a call flow defined or it has no steps. Please <Link href="/campaigns" className="text-primary underline">edit the campaign</Link> to add a call flow.</p></CardContent></Card>
      ) : !isLoading && campaigns.length > 0 ? (
         <Card><CardHeader><CardTitle>Select a Campaign</CardTitle></CardHeader><CardContent><p>Please select a campaign above to view its call drop analysis.</p></CardContent></Card>
      ) : null}
    </div>
  );
}
