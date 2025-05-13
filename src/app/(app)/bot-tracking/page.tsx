
"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Bot, Campaign, Agent, CallCenter, Voice } from "@/types"; // Added Voice
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, FilterX } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

// Assume a current call center ID. In a real app, this would come from user session/context.
const MOCK_CURRENT_CALL_CENTER_ID = "cc1";

const mockCallCenters: CallCenter[] = [
  { id: "cc1", name: "Main Call Center HQ", location: "New York" },
  { id: "cc2", name: "West Coast Operations", location: "California" },
];

// Updated Mock data with callCenterId
const allMockBots: Bot[] = Array.from({ length: 50 }, (_, i) => ({
  id: `bot-${i}`,
  name: `AlphaBot ${String(i+1).padStart(3, '0')}`,
  campaignId: `c${(i % 4) + 1}`, // campaigns c1, c2 for cc1; c3, c4 for cc2
  agentId: `a${(i % 5) + 1}`, // agents a1, a2 for cc1; a3, a4 for cc2; a5 for cc1
  status: (["active", "inactive", "error"] as Bot["status"][])[i % 3],
  creationDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  callCenterId: (i % 2 === 0) ? "cc1" : "cc2", // Distribute bots between call centers
}));

const allMockCampaigns: Campaign[] = [
  { id: "c1", name: "Winter Promotion (CC1)", status: "active", scriptVariants: [], targetAudience: "", callObjective: "", createdDate:"", callCenterId: "cc1" },
  { id: "c2", name: "Lead Gen Q1 (CC1)", status: "active", scriptVariants: [], targetAudience: "", callObjective: "", createdDate:"", callCenterId: "cc1" },
  { id: "c3", name: "Customer Survey (CC2)", status: "paused", scriptVariants: [], targetAudience: "", callObjective: "", createdDate:"", callCenterId: "cc2" },
  { id: "c4", name: "Spring Sale (CC2)", status: "active", scriptVariants: [], targetAudience: "", callObjective: "", createdDate:"", callCenterId: "cc2" },
];
const allMockAgents: Agent[] = [
  // voiceId should link to a voice within the same call center
  { id: "a1", name: "Agent Smith (CC1)", scriptVariantId: "sv1", voiceId: "v1", callCenterId: "cc1" }, // Assuming v1 is cc1
  { id: "a2", name: "Agent Jones (CC1)", scriptVariantId: "sv2", voiceId: "v2", callCenterId: "cc1" }, // Assuming v2 is cc1
  { id: "a3", name: "Agent Brown (CC2)", scriptVariantId: "sv1", voiceId: "v3", callCenterId: "cc2" }, // Assuming v3 is cc2
  { id: "a4", name: "Agent White (CC2)", scriptVariantId: "sv3", voiceId: "v4", callCenterId: "cc2" }, // Assuming v4 is cc2
  { id: "a5", name: "Agent Zeta (CC1)", scriptVariantId: "sv3", voiceId: "v1", callCenterId: "cc1" },
];
// Add mockVoices to resolve agent details correctly
const allMockVoices: Voice[] = [
  { id: "v1", name: "Ava (CC1)", provider: "ElevenLabs", callCenterId: "cc1" },
  { id: "v2", name: "John (CC1)", provider: "GoogleTTS", callCenterId: "cc1" },
  { id: "v3", name: "Mia (CC2)", provider: "ElevenLabs", callCenterId: "cc2" },
  { id: "v4", name: "Liam (CC2)", provider: "GoogleTTS", callCenterId: "cc2" },
];


export default function BotTrackingPage() {
  // Simulating a selected call center.
  const [currentCallCenterId, setCurrentCallCenterId] = useState<string>(MOCK_CURRENT_CALL_CENTER_ID);

  const [bots, setBots] = useState<Bot[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]); // To help resolve agent voice names

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<string | undefined>(undefined);
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [creationDate, setCreationDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    // Filter all data by the current call center ID
    setBots(allMockBots.filter(b => b.callCenterId === currentCallCenterId));
    setCampaigns(allMockCampaigns.filter(c => c.callCenterId === currentCallCenterId));
    setAgents(allMockAgents.filter(a => a.callCenterId === currentCallCenterId));
    setVoices(allMockVoices.filter(v => v.callCenterId === currentCallCenterId));
  }, [currentCallCenterId]);

  const filteredBots = useMemo(() => {
    return bots.filter(bot => { // bots state is already filtered by currentCallCenterId
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
    const voice = voices.find(v => v.id === agent.voiceId); // Voices state is also filtered by call center
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

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Bot Tracking ({mockCallCenters.find(cc => cc.id === currentCallCenterId)?.name || 'Selected Call Center'})</h2>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Filter Bots</CardTitle>
          <CardDescription>Refine the list of bots within the selected call center.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <Input
            placeholder="Search by name, campaign, agent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="lg:col-span-2"
          />
          <Select value={selectedCampaign || ""} onValueChange={(value) => setSelectedCampaign(value === "all" ? undefined : value) }>
            <SelectTrigger><SelectValue placeholder="Filter by Campaign" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Campaigns</SelectLabel>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={selectedAgent || ""} onValueChange={(value) => setSelectedAgent(value === "all" ? undefined : value)}>
            <SelectTrigger><SelectValue placeholder="Filter by Agent" /></SelectTrigger>
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
           <Button variant="outline" onClick={resetFilters} className="w-full lg:w-auto">
            <FilterX className="mr-2 h-4 w-4" /> Reset Filters
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Bot List</CardTitle>
            <CardDescription>Showing {filteredBots.length} of {bots.length} bots for this call center.</CardDescription>
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
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">No bots match your current filters for this call center.</TableCell>
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
