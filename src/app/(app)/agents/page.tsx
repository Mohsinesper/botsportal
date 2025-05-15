
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
import { FilterX, Search, Settings2, FilePenLine } from "lucide-react";
import type { Agent, Campaign, ScriptVariant, Voice } from "@/types";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { MOCK_AGENTS, MOCK_CAMPAIGNS, MOCK_SCRIPT_VARIANTS, MOCK_VOICES } from "@/lib/mock-data";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface EditingScriptInfo {
  campaignId: string;
  variantId: string;
  variantName: string;
  content: string;
}

export default function AgentConfigurationsPage() {
  const { currentCallCenter, isLoading: isCallCenterLoading } = useCallCenter();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [isScriptEditDialogOpen, setIsScriptEditDialogOpen] = useState(false);
  const [editingScriptInfo, setEditingScriptInfo] = useState<EditingScriptInfo | null>(null);
  const [editableScriptContent, setEditableScriptContent] = useState("");

  useEffect(() => {
    if (currentCallCenter) {
      setAgents(MOCK_AGENTS.filter(a => a.callCenterId === currentCallCenter.id));
      // Fetch campaigns relevant to the current call center for script editing
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
        const scriptVariantName = getScriptVariantDetails(agent.campaignId, agent.scriptVariantId)?.name || "N/A";
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

  const handleOpenEditScriptDialog = (agent: Agent) => {
    const scriptVariant = getScriptVariantDetails(agent.campaignId, agent.scriptVariantId);
    if (scriptVariant) {
      setEditingScriptInfo({
        campaignId: agent.campaignId,
        variantId: scriptVariant.id,
        variantName: scriptVariant.name,
        content: scriptVariant.content,
      });
      setEditableScriptContent(scriptVariant.content);
      setIsScriptEditDialogOpen(true);
    } else {
      toast({ title: "Error", description: "Script variant not found for this agent.", variant: "destructive" });
    }
  };

  const handleSaveScriptChanges = () => {
    if (!editingScriptInfo) return;

    const campaignIndex = MOCK_CAMPAIGNS.findIndex(c => c.id === editingScriptInfo.campaignId);
    if (campaignIndex > -1) {
      const campaign = MOCK_CAMPAIGNS[campaignIndex];
      const variantIndex = campaign.scriptVariants?.findIndex(sv => sv.id === editingScriptInfo.variantId);
      
      if (campaign.scriptVariants && variantIndex !== undefined && variantIndex > -1) {
        campaign.scriptVariants[variantIndex].content = editableScriptContent;

        // Refresh local campaigns state to reflect changes
        if (currentCallCenter) {
          setCampaigns(MOCK_CAMPAIGNS.filter(c => c.callCenterId === currentCallCenter.id));
        }
        
        toast({ title: "Script Updated", description: `Content for "${editingScriptInfo.variantName}" has been saved.` });
      } else {
        toast({ title: "Error", description: "Could not find script variant within the campaign.", variant: "destructive" });
      }
    } else {
      toast({ title: "Error", description: "Campaign not found for this script.", variant: "destructive" });
    }

    setIsScriptEditDialogOpen(false);
    setEditingScriptInfo(null);
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.length > 0 ? (
                  filteredAgents.map((agent) => {
                    const scriptVariant = getScriptVariantDetails(agent.campaignId, agent.scriptVariantId);
                    return (
                        <TableRow key={agent.id}>
                        <TableCell className="font-medium">{agent.name}</TableCell>
                        <TableCell>{getCampaignName(agent.campaignId)}</TableCell>
                        <TableCell>{scriptVariant?.name || "N/A"}</TableCell>
                        <TableCell>{getVoiceName(agent.voiceId)}</TableCell>
                        <TableCell className="text-right">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleOpenEditScriptDialog(agent)}
                                title="Edit Script Content"
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
                    <TableCell colSpan={5} className="text-center h-24">
                      {agents.length === 0 ? "No agent configurations found for this call center." : "No agents match your current filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isScriptEditDialogOpen} onOpenChange={setIsScriptEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Script: {editingScriptInfo?.variantName}</DialogTitle>
            <DialogDescription>
              Modify the content for this script variant. Changes will affect all agents using this variant.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="scriptContentArea">Script Content</Label>
            <Textarea
              id="scriptContentArea"
              value={editableScriptContent}
              onChange={(e) => setEditableScriptContent(e.target.value)}
              className="min-h-[200px] text-sm"
              placeholder="Enter script content here..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsScriptEditDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleSaveScriptChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

