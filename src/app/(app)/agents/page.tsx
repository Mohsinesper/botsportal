
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilterX, Search, Settings2 } from "lucide-react";
import type { Agent, Campaign, ScriptVariant, Voice } from "@/types";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { MOCK_AGENTS, MOCK_CAMPAIGNS, MOCK_SCRIPT_VARIANTS, MOCK_VOICES } from "@/lib/mock-data";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label"; // Added Label import
// Note: CRUD for agents is not implemented in this pass. This page is read-only.

export default function AgentConfigurationsPage() {
  const { currentCallCenter, isLoading: isCallCenterLoading } = useCallCenter();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [scriptVariants, setScriptVariants] = useState<ScriptVariant[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (currentCallCenter) {
      setAgents(MOCK_AGENTS.filter(a => a.callCenterId === currentCallCenter.id));
      setCampaigns(MOCK_CAMPAIGNS.filter(c => c.callCenterId === currentCallCenter.id));
      // Script variants are part of campaigns, Voices are filtered by call center
      setScriptVariants(MOCK_SCRIPT_VARIANTS); // Assuming script variants might not be directly tied to callCenterId in mock for now
      setVoices(MOCK_VOICES.filter(v => v.callCenterId === currentCallCenter.id));
    } else {
      setAgents([]);
      setCampaigns([]);
      setScriptVariants([]);
      setVoices([]);
    }
    setSearchTerm("");
  }, [currentCallCenter]);

  const getCampaignName = (campaignId: string) => campaigns.find(c => c.id === campaignId)?.name || "N/A";
  
  const getScriptVariantName = (campaignId: string, scriptVariantId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign?.scriptVariants?.find(sv => sv.id === scriptVariantId)?.name || "N/A";
  };
  
  const getVoiceName = (voiceId: string) => voices.find(v => v.id === voiceId)?.name || "N/A";

  const filteredAgents = useMemo(() => {
    if (!searchTerm) return agents;
    return agents.filter(agent =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCampaignName(agent.campaignId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getScriptVariantName(agent.campaignId, agent.scriptVariantId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getVoiceName(agent.voiceId).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [agents, searchTerm, campaigns, voices]); // Added campaigns, voices to dependency array

  const resetFilters = () => {
    setSearchTerm("");
  };

  if (isCallCenterLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-3/4 md:w-1/2" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentCallCenter) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight flex items-center"><Settings2 className="mr-3 h-8 w-8" />Agent Configurations</h2>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>No Call Center Selected</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please select a call center from the header or <Link href="/call-centers" className="text-primary underline">add and select a call center</Link> to view agent configurations.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight flex items-center">
          <Settings2 className="mr-3 h-8 w-8" />Agent Configurations ({currentCallCenter.name})
        </h2>
        {/* Button to Add Agent can be added here in future */}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Filter Agents</CardTitle>
          <CardDescription>Refine the list of agent configurations for {currentCallCenter.name}.</CardDescription>
          <div className="mt-4 flex gap-4 items-end">
            <div className="flex-grow">
                <Label htmlFor="agentSearch">Search Agents</Label>
                 <div className="relative mt-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="agentSearch"
                        placeholder="Search by name, campaign, script, or voice..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>
            <Button variant="outline" onClick={resetFilters} className="mt-auto">
              <FilterX className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent Name</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Script Variant</TableHead>
                  <TableHead>Voice</TableHead>
                  {/* <TableHead className="text-right">Actions</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.length > 0 ? (
                  filteredAgents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium">{agent.name}</TableCell>
                      <TableCell>{getCampaignName(agent.campaignId)}</TableCell>
                      <TableCell>{getScriptVariantName(agent.campaignId, agent.scriptVariantId)}</TableCell>
                      <TableCell>{getVoiceName(agent.voiceId)}</TableCell>
                      {/* <TableCell className="text-right">
                        <Button variant="ghost" size="sm" disabled>Edit</Button> 
                      </TableCell> */}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      {agents.length === 0 ? "No agent configurations found for this call center." : "No agents match your current filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
