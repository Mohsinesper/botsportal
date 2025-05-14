
"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Bot, Campaign, Agent, Voice } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, FilterX, TrendingUp, TrendingDown, PhoneMissed, Phone } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useCallCenter } from "@/contexts/CallCenterContext";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

// Global Mock Data (In a real app, this would come from a backend API)
const allMockBots: Bot[] = Array.from({ length: 75 }, (_, i) => {
    const callCenterIds = ["cc1", "cc2", "cc3"];
    const currentCcId = callCenterIds[i % callCenterIds.length];
    let campaignIdSuffix = '';
    if (currentCcId === 'cc1') campaignIdSuffix = (i % 2) + 1; // c1, c2
    else if (currentCcId === 'cc2') campaignIdSuffix = (i % 2) + 3; // c3, c4
    else campaignIdSuffix = (i % 1) + 5; // c5

    const totalCalls = Math.floor(Math.random() * 451) + 50; // 50-500 calls
    const successfulCalls = Math.floor(totalCalls * (Math.random() * 0.6 + 0.2)); // 20-80% success
    const remainingAfterSuccess = totalCalls - successfulCalls;
    const failedCalls = Math.floor(remainingAfterSuccess * (Math.random() * 0.5 + 0.1)); // 10-60% of remaining are failed
    const busyCalls = remainingAfterSuccess - failedCalls;

    return {
        id: `bot-${i}`,
        name: `Bot ${String(i+1).padStart(3, '0')} (${currentCcId.toUpperCase()})`,
        campaignId: `c${campaignIdSuffix}`,
        agentId: `a${(i % 7) + 1}`, // Agents a1-a2 (cc1), a3-a4 (cc2), a5 (cc1), a6-a7 (cc3)
        status: (["active", "inactive", "error"] as Bot["status"][])[i % 3],
        creationDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        callCenterId: currentCcId,
        totalCalls,
        successfulCalls,
        failedCalls,
        busyCalls,
    };
});

const allMockCampaigns: Campaign[] = [
  { id: "c1", name: "Winter Promotion (CC1)", status: "active", scriptVariants: [], targetAudience: "", callObjective: "", createdDate:"", callCenterId: "cc1" },
  { id: "c2", name: "Lead Gen Q1 (CC1)", status: "active", scriptVariants: [], targetAudience: "", callObjective: "", createdDate:"", callCenterId: "cc1" },
  { id: "c3", name: "Customer Survey (CC2)", status: "paused", scriptVariants: [], targetAudience: "", callObjective: "", createdDate:"", callCenterId: "cc2" },
  { id: "c4", name: "Spring Sale (CC2)", status: "active", scriptVariants: [], targetAudience: "", callObjective: "", createdDate:"", callCenterId: "cc2" },
  { id: "c5", name: "EMEA Outreach (CC3)", status: "active", scriptVariants: [], targetAudience: "", callObjective: "", createdDate:"", callCenterId: "cc3" },
];
const allMockAgents: Agent[] = [
  { id: "a1", name: "Agent Smith (CC1)", scriptVariantId: "sv1", voiceId: "v1", callCenterId: "cc1" },
  { id: "a2", name: "Agent Jones (CC1)", scriptVariantId: "sv2", voiceId: "v2", callCenterId: "cc1" },
  { id: "a3", name: "Agent Brown (CC2)", scriptVariantId: "sv1", voiceId: "v3", callCenterId: "cc2" },
  { id: "a4", name: "Agent White (CC2)", scriptVariantId: "sv3", voiceId: "v4", callCenterId: "cc2" },
  { id: "a5", name: "Agent Zeta (CC1)", scriptVariantId: "sv3", voiceId: "v1", callCenterId: "cc1" },
  { id: "a6", name: "Agent Gamma (CC3)", scriptVariantId: "sv1-c5", voiceId: "v5", callCenterId: "cc3"},
  { id: "a7", name: "Agent Delta (CC3)", scriptVariantId: "sv2-c5", voiceId: "v5", callCenterId: "cc3"},
];
const allMockVoices: Voice[] = [
  { id: "v1", name: "Ava (CC1)", provider: "ElevenLabs", callCenterId: "cc1" },
  { id: "v2", name: "John (CC1)", provider: "GoogleTTS", callCenterId: "cc1" },
  { id: "v3", name: "Mia (CC2)", provider: "ElevenLabs", callCenterId: "cc2" },
  { id: "v4", name: "Liam (CC2)", provider: "GoogleTTS", callCenterId: "cc2" },
  { id: "v5", name: "Zoe (CC3)", provider: "AzureTTS", callCenterId: "cc3"},
];


export default function BotTrackingPage() {
  const { currentCallCenter, isLoading: isCallCenterLoading } = useCallCenter();

  const [bots, setBots] = useState<Bot[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<string | undefined>(undefined);
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [creationDate, setCreationDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (currentCallCenter) {
      setBots(allMockBots.filter(b => b.callCenterId === currentCallCenter.id));
      setCampaigns(allMockCampaigns.filter(c => c.callCenterId === currentCallCenter.id));
      setAgents(allMockAgents.filter(a => a.callCenterId === currentCallCenter.id));
      setVoices(allMockVoices.filter(v => v.callCenterId === currentCallCenter.id));
    } else {
      setBots([]);
      setCampaigns([]);
      setAgents([]);
      setVoices([]);
    }
    // Reset filters when call center changes
    resetFilters();
  }, [currentCallCenter]);

  const filteredBots = useMemo(() => {
    return bots.filter(bot => {
      const campaign = campaigns.find(c => c.id === bot.campaignId);
      const agent = agents.find(a => a.id === bot.agentId);

      return (
        (bot.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         (campaign && campaign.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
         (agent && agent.name.toLowerCase().includes(searchTerm.toLowerCase()))
        ) &&
        (!selectedCampaign || bot.campaignId === selectedCampaign) &&
        (!selectedAgent || bot.agentId === selectedAgent) &&
        (!selectedStatus || bot.status === selectedStatus) &&
        (!creationDate || new Date(bot.creationDate).toDateString() === creationDate.toDateString())
      );
    });
  }, [bots, searchTerm, selectedCampaign, selectedAgent, selectedStatus, creationDate, campaigns, agents]);

  const getCampaignName = (id: string) => campaigns.find(c => c.id === id)?.name || "Unknown";
  
  const getAgentNameWithDetails = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return "Unknown Agent";
    const voice = voices.find(v => v.id === agent.voiceId);
    return `${agent.name} (Voice: ${voice?.name || 'N/A'})`;
  };

  const statusBadgeVariant = (status: Bot["status"]) => {
    switch (status) {
      case "active": return "default";
      case "inactive": return "secondary";
      case "error": return "destructive";
      default: return "outline";
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCampaign(undefined);
    setSelectedAgent(undefined);
    setSelectedStatus(undefined);
    setCreationDate(undefined);
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
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
             <Skeleton className="h-10 w-full lg:w-auto" />
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2 mt-1" />
          </CardHeader>
          <CardContent className="p-0">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }


  if (!currentCallCenter) {
     return (
       <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Bot Tracking</h2>
         <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>No Call Center Selected</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Please select a call center from the header or <Link href="/call-centers" className="text-primary underline">add and select a call center</Link> to track bots.</p>
            </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Bot Tracking ({currentCallCenter.name})</h2>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Filter Bots</CardTitle>
          <CardDescription>Refine the list of bots within {currentCallCenter.name}.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <Input
            placeholder="Search by name, campaign, agent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="lg:col-span-2"
          />
          <Select value={selectedCampaign || ""} onValueChange={(value) => setSelectedCampaign(value === "all" ? undefined : value) } disabled={campaigns.length === 0}>
            <SelectTrigger><SelectValue placeholder={campaigns.length === 0 ? "No campaigns" : "Filter by Campaign"} /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Campaigns</SelectLabel>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={selectedAgent || ""} onValueChange={(value) => setSelectedAgent(value === "all" ? undefined : value)} disabled={agents.length === 0}>
            <SelectTrigger><SelectValue placeholder={agents.length === 0 ? "No agents" : "Filter by Agent"} /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Agents</SelectLabel>
                 <SelectItem value="all">All Agents</SelectItem>
                {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={selectedStatus || ""} onValueChange={(value) => setSelectedStatus(value === "all" ? undefined : value)}>
            <SelectTrigger><SelectValue placeholder="Filter by Status" /></SelectTrigger>
            <SelectContent>
               <SelectGroup>
                <SelectLabel>Status</SelectLabel>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
           <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={`w-full justify-start text-left font-normal ${!creationDate && "text-muted-foreground"}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {creationDate ? format(creationDate, "PPP") : <span>Filter by Creation Date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={creationDate}
                onSelect={setCreationDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
           <Button variant="outline" onClick={resetFilters} className="w-full lg:w-auto mt-4 lg:mt-0 lg:col-start-5">
            <FilterX className="mr-2 h-4 w-4" /> Reset Filters
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Bot List</CardTitle>
            <CardDescription>Showing {filteredBots.length} of {bots.length} bots for {currentCallCenter.name}.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bot Name</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Agent Config</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Creation Date</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="text-right">Total Calls</TableHead>
                  <TableHead className="text-right">Successful</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead className="text-right">Busy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBots.length > 0 ? filteredBots.map((bot) => (
                  <TableRow key={bot.id}>
                    <TableCell className="font-medium">{bot.name}</TableCell>
                    <TableCell className="text-muted-foreground">{getCampaignName(bot.campaignId)}</TableCell>
                    <TableCell className="text-muted-foreground">{getAgentNameWithDetails(bot.agentId)}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(bot.status)} className="capitalize">{bot.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(bot.creationDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-muted-foreground">{bot.lastActivity ? new Date(bot.lastActivity).toLocaleString() : "N/A"}</TableCell>
                    <TableCell className="text-right font-medium">{bot.totalCalls ?? 0}</TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-500">{bot.successfulCalls ?? 0}</TableCell>
                    <TableCell className="text-right text-red-600 dark:text-red-500">{bot.failedCalls ?? 0}</TableCell>
                    <TableCell className="text-right text-yellow-600 dark:text-yellow-500">{bot.busyCalls ?? 0}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center h-24">
                      {bots.length === 0 ? "No bots found for this call center." : "No bots match your current filters."}
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

