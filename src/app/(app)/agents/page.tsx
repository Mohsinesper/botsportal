
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FilterX, Search, Settings2, FilePenLine, Volume2 } from "lucide-react";
import type { Agent, Campaign, ScriptVariant, Voice } from "@/types";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { MOCK_AGENTS, MOCK_CAMPAIGNS, MOCK_SCRIPT_VARIANTS, MOCK_VOICES, AVAILABLE_BACKGROUND_NOISES } from "@/lib/mock-data";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface EditingAgentInfo {
  agentId: string;
  campaignId: string;
  variantId: string;
  variantName: string;
  scriptContent: string;
  backgroundNoise?: string;
  backgroundNoiseVolume?: number;
}

export default function AgentConfigurationsPage() {
  const { currentCallCenter, isLoading: isCallCenterLoading } = useCallCenter();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [editingAgentInfo, setEditingAgentInfo] = useState<EditingAgentInfo | null>(null);
  
  // States for editing within the dialog
  const [editableScriptContent, setEditableScriptContent] = useState("");
  const [editableBackgroundNoise, setEditableBackgroundNoise] = useState<string | undefined>("none");
  const [editableBackgroundNoiseVolume, setEditableBackgroundNoiseVolume] = useState<number>(0);


  useEffect(() => {
    if (currentCallCenter) {
      setAgents(MOCK_AGENTS.filter(a => a.callCenterId === currentCallCenter.id));
      setCampaigns(MOCK_CAMPAIGNS.filter(c => c.callCenterId === currentCallCenter.id));
      setVoices(MOCK_VOICES.filter(v => v.callCenterId === currentCallCenter.id));
    } else {
      setAgents([]);
      setCampaigns([]);
      setVoices([]);
    }
    setSearchTerm("");
  }, [currentCallCenter]);

  const getCampaignName = (campaignId: string) => campaigns.find(c => c.id === campaignId)?.name || "N/A";
  
  const getScriptVariantDetails = (campaignId: string, scriptVariantId: string): ScriptVariant | undefined => {
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign?.scriptVariants?.find(sv => sv.id === scriptVariantId);
  };
  
  const getVoiceName = (voiceId: string) => voices.find(v => v.id === voiceId)?.name || "N/A";

  const filteredAgents = useMemo(() => {
    if (!searchTerm) return agents;
    return agents.filter(agent => {
        const scriptVariantName = getScriptVariantDetails(agent.campaignId, agent.scriptVariantId || "")?.name || "N/A";
        return (
            agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getCampaignName(agent.campaignId).toLowerCase().includes(searchTerm.toLowerCase()) ||
            scriptVariantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getVoiceName(agent.voiceId).toLowerCase().includes(searchTerm.toLowerCase())
        );
    });
  }, [agents, searchTerm, campaigns, voices]);

  const resetFilters = () => {
    setSearchTerm("");
  };

  const handleOpenSettingsDialog = (agent: Agent) => {
    const scriptVariant = getScriptVariantDetails(agent.campaignId, agent.scriptVariantId || "");
    if (scriptVariant) {
      setEditingAgentInfo({
        agentId: agent.id,
        campaignId: agent.campaignId,
        variantId: scriptVariant.id,
        variantName: scriptVariant.name,
        scriptContent: scriptVariant.content,
        backgroundNoise: agent.backgroundNoise || "none",
        backgroundNoiseVolume: agent.backgroundNoiseVolume || 0,
      });
      setEditableScriptContent(scriptVariant.content);
      setEditableBackgroundNoise(agent.backgroundNoise || "none");
      setEditableBackgroundNoiseVolume(agent.backgroundNoiseVolume || 0);
      setIsSettingsDialogOpen(true);
    } else {
      toast({ title: "Error", description: "Script variant not found for this agent.", variant: "destructive" });
    }
  };

  const handleSaveSettings = () => {
    if (!editingAgentInfo) return;

    // Update script content
    const globalCampaignIndex = MOCK_CAMPAIGNS.findIndex(c => c.id === editingAgentInfo.campaignId);
    if (globalCampaignIndex > -1) {
      const campaignToUpdate = MOCK_CAMPAIGNS[globalCampaignIndex];
      if (campaignToUpdate.scriptVariants) {
        const variantIndex = campaignToUpdate.scriptVariants.findIndex(sv => sv.id === editingAgentInfo.variantId);
        if (variantIndex > -1) {
          campaignToUpdate.scriptVariants[variantIndex].content = editableScriptContent;
        }
      }
    }

    // Update agent's background noise settings
    const agentIndexGlobal = MOCK_AGENTS.findIndex(a => a.id === editingAgentInfo.agentId);
    if (agentIndexGlobal > -1) {
        MOCK_AGENTS[agentIndexGlobal].backgroundNoise = editableBackgroundNoise === "none" ? undefined : editableBackgroundNoise;
        MOCK_AGENTS[agentIndexGlobal].backgroundNoiseVolume = editableBackgroundNoise === "none" ? undefined : editableBackgroundNoiseVolume;
    }
    
    // Refresh local states
    if (currentCallCenter) {
      setCampaigns(MOCK_CAMPAIGNS.filter(c => c.callCenterId === currentCallCenter.id));
      setAgents(MOCK_AGENTS.filter(a => a.callCenterId === currentCallCenter.id));
    }
    
    toast({ title: "Agent Settings Updated", description: `Settings for agent and script "${editingAgentInfo.variantName}" saved.` });
    setIsSettingsDialogOpen(false);
    setEditingAgentInfo(null);
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
                  <TableHead>Background Noise</TableHead>
                  <TableHead>Noise Volume</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.length > 0 ? (
                  filteredAgents.map((agent) => {
                    const scriptVariant = getScriptVariantDetails(agent.campaignId, agent.scriptVariantId || "");
                    const backgroundNoiseName = AVAILABLE_BACKGROUND_NOISES.find(bn => bn.id === agent.backgroundNoise)?.name || "None";
                    return (
                        <TableRow key={agent.id}>
                        <TableCell className="font-medium">{agent.name}</TableCell>
                        <TableCell>{getCampaignName(agent.campaignId)}</TableCell>
                        <TableCell>{scriptVariant?.name || "N/A"}</TableCell>
                        <TableCell>{getVoiceName(agent.voiceId)}</TableCell>
                        <TableCell>{agent.backgroundNoise ? backgroundNoiseName : "None"}</TableCell>
                        <TableCell>{agent.backgroundNoise && agent.backgroundNoise !== "none" && agent.backgroundNoiseVolume !== undefined ? `${agent.backgroundNoiseVolume}%` : "N/A"}</TableCell>
                        <TableCell className="text-right">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleOpenSettingsDialog(agent)}
                                title="Edit Script & Agent Settings"
                                disabled={!scriptVariant}
                            >
                            <FilePenLine className="h-4 w-4" />
                            </Button>
                        </TableCell>
                        </TableRow>
                    );
                })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      {agents.length === 0 ? "No agent configurations found for this call center." : "No agents match your current filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent key={editingAgentInfo?.variantId || 'agent-settings-dialog'} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Settings for: {editingAgentInfo?.variantName}</DialogTitle>
            <DialogDescription>
              Modify script content and agent-specific background noise settings.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
                <Label htmlFor="scriptContentArea">Script Content</Label>
                <Textarea
                id="scriptContentArea"
                value={editableScriptContent}
                onChange={(e) => setEditableScriptContent(e.target.value)}
                className="min-h-[150px] text-sm"
                placeholder="Enter script content here..."
                />
            </div>
            <div className="border-t pt-4 mt-4">
                <Label className="font-semibold">Agent Background Noise</Label>
                <div className="mt-2 space-y-3">
                    <div>
                        <Label htmlFor="agentBackgroundNoise">Noise Type</Label>
                        <Select value={editableBackgroundNoise || "none"} onValueChange={setEditableBackgroundNoise}>
                            <SelectTrigger id="agentBackgroundNoise"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {AVAILABLE_BACKGROUND_NOISES.map(noise => (
                                    <SelectItem key={noise.id} value={noise.id}>{noise.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {editableBackgroundNoise && editableBackgroundNoise !== "none" && (
                    <div>
                        <Label htmlFor="agentBackgroundNoiseVolume">Noise Volume ({editableBackgroundNoiseVolume}%)</Label>
                        <Slider
                            id="agentBackgroundNoiseVolume"
                            min={0}
                            max={100}
                            step={5}
                            value={[editableBackgroundNoiseVolume || 0]}
                            onValueChange={(value) => setEditableBackgroundNoiseVolume(value[0])}
                            className="mt-1"
                        />
                    </div>
                    )}
                </div>
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleSaveSettings}>Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

