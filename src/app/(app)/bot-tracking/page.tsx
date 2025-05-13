
"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Bot, Campaign, Agent } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, FilterX } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

// Mock data
const mockBots: Bot[] = Array.from({ length: 50 }, (_, i) => ({
  id: `bot-${i}`,
  name: `AlphaBot ${String(i+1).padStart(3, '0')}`,
  campaignId: `c${(i % 3) + 1}`,
  agentId: `a${(i % 4) + 1}`,
  status: (["active", "inactive", "error"] as Bot["status"][])[i % 3],
  creationDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random date in last 30 days
  lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
}));

const mockCampaigns: Campaign[] = [
  { id: "c1", name: "Winter Promotion", status: "active", scriptVariants: [], targetAudience: "", callObjective: "", createdDate:"" },
  { id: "c2", name: "Lead Gen Q1", status: "active", scriptVariants: [], targetAudience: "", callObjective: "", createdDate:"" },
  { id: "c3", name: "Customer Survey", status: "paused", scriptVariants: [], targetAudience: "", callObjective: "", createdDate:"" },
];
const mockAgents: Agent[] = [
  { id: "a1", name: "Agent Smith", scriptVariantId: "sv1", voice: "Standard Male" },
  { id: "a2", name: "Agent Jones", scriptVariantId: "sv2", voice: "Friendly Female" },
  { id: "a3", name: "Agent Brown", scriptVariantId: "sv1", voice: "Authoritative Male" },
  { id: "a4", name: "Agent White", scriptVariantId: "sv3", voice: "Calm Female" },
];

export default function BotTrackingPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<string | undefined>(undefined);
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [creationDate, setCreationDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    setBots(mockBots);
    setCampaigns(mockCampaigns);
    setAgents(mockAgents);
  }, []);

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
  const getAgentName = (id: string) => agents.find(a => a.id === id)?.name || "Unknown";

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
      <h2 className="text-3xl font-bold tracking-tight">Bot Tracking</h2>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Filter Bots</CardTitle>
          <CardDescription>Refine the list of bots using the filters below.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <Input
            placeholder="Search by name, campaign, agent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="lg:col-span-2"
          />
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger><SelectValue placeholder="Filter by Campaign" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Campaigns</SelectLabel>
                {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger><SelectValue placeholder="Filter by Agent" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Agents</SelectLabel>
                {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger><SelectValue placeholder="Filter by Status" /></SelectTrigger>
            <SelectContent>
               <SelectGroup>
                <SelectLabel>Status</SelectLabel>
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
            <CardDescription>Showing {filteredBots.length} of {bots.length} bots.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bot Name</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Agent</TableHead>
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
                    <TableCell className="text-muted-foreground">{getAgentName(bot.agentId)}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(bot.status)} className="capitalize">{bot.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(bot.creationDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-muted-foreground">{bot.lastActivity ? new Date(bot.lastActivity).toLocaleString() : "N/A"}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">No bots match your current filters.</TableCell>
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
