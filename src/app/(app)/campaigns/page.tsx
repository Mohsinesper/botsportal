
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Edit2, Trash2, Play, Pause, Archive, Wand2, Loader2, Eye, FilterX, Search, FileJson, MessageSquare, ArrowUpDown, CheckSquare, Square, AlertTriangle } from "lucide-react";
import type { Campaign, ScriptVariant, CallFlow, CallFlowStep } from "@/types"; 
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { handleGenerateCampaignScripts } from "./actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { useAuth } from "@/contexts/AuthContext"; 
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { MOCK_CAMPAIGNS } from "@/lib/mock-data"; 
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { addAuditLog } from "@/services/audit-log-service";
import { Checkbox } from "@/components/ui/checkbox"; 
import { parseISO } from "date-fns"; 

type SortableCampaignKey = keyof Campaign | 'callFlowsCount' | 'createdDateFormatted';
type SortDirection = "asc" | "desc";

const campaignSchemaBase = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Campaign name must be at least 3 characters"),
  status: z.enum(["active", "paused", "archived", "draft"]),
  userMasterScript: z.string().min(20, "Master script text must be at least 20 characters."),
  variantCount: z.coerce.number().int().min(0).max(5).default(1), 
  targetAudience: z.string().optional(), 
  callObjective: z.string().optional(),
  tone: z.string().optional(),
});

type CampaignFormData = z.infer<typeof campaignSchemaBase>;

export default function CampaignsPage() {
  const { currentCallCenter, isLoading: isCallCenterLoading } = useCallCenter();
  const { currentUser, isLoading: isAuthLoading } = useAuth(); 
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isCampaignFormOpen, setIsCampaignFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isGeneratingScripts, setIsGeneratingScripts] = useState(false);
  
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [campaignToReview, setCampaignToReview] = useState<Campaign | null>(null);
  const [editableCallFlows, setEditableCallFlows] = useState<CallFlow[]>([]);

  const [searchTermCampaigns, setSearchTermCampaigns] = useState("");
  const [filterStatusCampaigns, setFilterStatusCampaigns] = useState<Campaign["status"] | "all">("all");

  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<SortableCampaignKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const { control, handleSubmit, register, reset, formState: { errors }, setValue } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchemaBase),
    defaultValues: {
      name: "",
      status: "draft",
      userMasterScript: "",
      variantCount: 1,
      targetAudience: "", 
      callObjective: "", 
      tone: "Professional",
    }
  });
  
  useEffect(() => {
    if (currentCallCenter) {
      setCampaigns(MOCK_CAMPAIGNS.filter(c => c.callCenterId === currentCallCenter.id));
    } else {
      setCampaigns([]); 
    }
    resetFilters();
    setSelectedCampaignIds([]);
  }, [currentCallCenter]);

  const filteredAndSortedCampaignsData = useMemo(() => {
    let filtered = campaigns.filter(campaign => {
      const matchesSearch = searchTermCampaigns === "" || 
                            campaign.name.toLowerCase().includes(searchTermCampaigns.toLowerCase()) ||
                            (campaign.callObjective && campaign.callObjective.toLowerCase().includes(searchTermCampaigns.toLowerCase()));
      const matchesStatus = filterStatusCampaigns === "all" || campaign.status === filterStatusCampaigns;
      return matchesSearch && matchesStatus;
    });

    if (sortColumn) {
      filtered.sort((a, b) => {
        let valA: any;
        let valB: any;

        if (sortColumn === 'callFlowsCount') {
          valA = a.callFlows?.length || 0;
          valB = b.callFlows?.length || 0;
        } else if (sortColumn === 'createdDate') {
          valA = parseISO(a.createdDate).getTime();
          valB = parseISO(b.createdDate).getTime();
        } else {
          valA = a[sortColumn as keyof Campaign];
          valB = b[sortColumn as keyof Campaign];
        }
        
        if (valA == null && valB == null) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return 0;
      });
    }
    return filtered;
  }, [campaigns, searchTermCampaigns, filterStatusCampaigns, sortColumn, sortDirection]);

  const handleSort = (columnKey: SortableCampaignKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (columnKey: SortableCampaignKey) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUpDown className="ml-2 h-4 w-4 text-primary transform rotate-0" /> : 
      <ArrowUpDown className="ml-2 h-4 w-4 text-primary transform rotate-180" />;
  };

  const handleSelectCampaign = (campaignId: string, checked: boolean) => {
    setSelectedCampaignIds(prev => 
      checked ? [...prev, campaignId] : prev.filter(id => id !== campaignId)
    );
  };

  const handleSelectAllCampaigns = (checked: boolean) => {
    if (checked) {
      setSelectedCampaignIds(filteredAndSortedCampaignsData.map(c => c.id));
    } else {
      setSelectedCampaignIds([]);
    }
  };

  const resetFilters = () => {
    setSearchTermCampaigns("");
    setFilterStatusCampaigns("all");
    setSortColumn(null);
  };

  const handleCampaignFormSubmit = async (data: CampaignFormData) => {
    if (!currentCallCenter || !currentUser) {
      toast({ title: "Error", description: "No call center selected or user not logged in.", variant: "destructive" });
      return;
    }
    setIsGeneratingScripts(true);
    const campaignId = editingCampaign ? editingCampaign.id : Date.now().toString();
    
    const scriptGenerationInput = {
      userMasterScript: data.userMasterScript,
      campaignName: data.name,
      campaignDescription: `Call flow for ${data.name}: ${data.callObjective || 'General campaign objective.'}`,
      variantCount: data.variantCount,
      currentUserInfo: { id: currentUser.id, name: currentUser.name || currentUser.email, email: currentUser.email },
      callCenterInfo: { id: currentCallCenter.id, name: currentCallCenter.name }
    };

    const scriptResult = await handleGenerateCampaignScripts(scriptGenerationInput);
    let generatedCallFlows: CallFlow[] | undefined = undefined;

    if ("error" in scriptResult || !scriptResult.generatedCallFlows) {
      toast({ title: "Script Generation Failed", description: scriptResult.error || "Unknown error from AI.", variant: "destructive" });
      setIsGeneratingScripts(false);
      return;
    } else {
      toast({ title: "Scripts Structured by AI!", description: "Review and edit the generated call flows." });
      generatedCallFlows = scriptResult.generatedCallFlows;
    }

    const campaignDataToSave: Partial<Campaign> = {
      name: data.name,
      status: data.status,
      targetAudience: data.targetAudience || "", 
      callObjective: data.callObjective || "",   
      tone: data.tone,
      id: campaignId,
      callCenterId: currentCallCenter.id,
      userMasterScript: data.userMasterScript,
      callFlows: generatedCallFlows,
      createdDate: editingCampaign?.createdDate || new Date().toISOString(),
      masterScript: undefined, 
      scriptVariants: undefined,
    };
    
    let savedCampaign: Campaign;
    const actionType = editingCampaign ? "CAMPAIGN_UPDATED" : "CAMPAIGN_CREATED";

    if (editingCampaign) {
      savedCampaign = { ...editingCampaign, ...campaignDataToSave } as Campaign;
      const updatedCampaigns = MOCK_CAMPAIGNS.map(c => c.id === editingCampaign.id ? savedCampaign : c);
      MOCK_CAMPAIGNS.length = 0; 
      MOCK_CAMPAIGNS.push(...updatedCampaigns);
      setCampaigns(MOCK_CAMPAIGNS.filter(c => c.callCenterId === currentCallCenter.id));
      toast({ title: "Campaign Updated", description: `Campaign "${data.name}" updated. Review scripts.`});
    } else {
      savedCampaign = campaignDataToSave as Campaign;
      MOCK_CAMPAIGNS.push(savedCampaign);
      setCampaigns(prev => [...prev, savedCampaign]);
      toast({ title: "Campaign Created", description: `Campaign "${data.name}" created. Review scripts.`});
    }

    addAuditLog({
        action: actionType,
        userId: currentUser.id,
        userName: currentUser.name || currentUser.email,
        callCenterId: currentCallCenter.id,
        callCenterName: currentCallCenter.name,
        details: { campaignId: savedCampaign.id, campaignName: savedCampaign.name, status: savedCampaign.status }
    });
    
    setIsGeneratingScripts(false);
    setIsCampaignFormOpen(false);
    reset({name: "", status: "draft", userMasterScript: "", variantCount: 1, targetAudience: "", callObjective: "", tone: "Professional"});
    setEditingCampaign(null);

    setCampaignToReview(savedCampaign);
    setEditableCallFlows(JSON.parse(JSON.stringify(savedCampaign.callFlows || [])));
    setIsReviewDialogOpen(true);
  };

  const handleOpenEditCampaignForm = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    reset({
      name: campaign.name,
      status: campaign.status,
      userMasterScript: campaign.userMasterScript || "",
      variantCount: campaign.callFlows ? Math.max(0, campaign.callFlows.length - 1) : 1, 
      targetAudience: campaign.targetAudience || "",
      callObjective: campaign.callObjective || "",
      tone: campaign.tone || "Professional",
    });
    setIsCampaignFormOpen(true);
  };

  const handleDeleteCampaign = (campaignId: string) => {
    const campaignToDelete = MOCK_CAMPAIGNS.find(c => c.id === campaignId);
    if (!campaignToDelete || !currentUser || !currentCallCenter) return;

    const index = MOCK_CAMPAIGNS.findIndex(c => c.id === campaignId);
    if (index > -1) MOCK_CAMPAIGNS.splice(index, 1);
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    setSelectedCampaignIds(prev => prev.filter(id => id !== campaignId));
    
    addAuditLog({
        action: "CAMPAIGN_DELETED",
        userId: currentUser.id,
        userName: currentUser.name || currentUser.email,
        callCenterId: currentCallCenter.id,
        callCenterName: currentCallCenter.name,
        details: { campaignId: campaignId, campaignName: campaignToDelete.name }
    });
    toast({ title: "Campaign Deleted", variant: "destructive" });
  };
  
  const handleChangeCampaignStatus = (campaignId: string, newStatus: Campaign["status"]) => {
    if (!currentUser || !currentCallCenter) return;
    const campaignToUpdate = MOCK_CAMPAIGNS.find(c => c.id === campaignId);
    if (!campaignToUpdate) return;

    const index = MOCK_CAMPAIGNS.findIndex(c => c.id === campaignId);
    if (index > -1) MOCK_CAMPAIGNS[index].status = newStatus;
    
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: newStatus } : c));
    
    addAuditLog({
        action: "CAMPAIGN_STATUS_CHANGED",
        userId: currentUser.id,
        userName: currentUser.name || currentUser.email,
        callCenterId: currentCallCenter.id,
        callCenterName: currentCallCenter.name,
        details: { campaignId: campaignId, campaignName: campaignToUpdate.name, oldStatus: campaignToUpdate.status, newStatus: newStatus }
    });
    toast({ title: "Status Updated", description: `Campaign status changed to ${newStatus}.`});
  };
  
  const handleSaveReviewedCallFlows = () => {
    if (!campaignToReview || !editableCallFlows || !currentUser || !currentCallCenter) return;

    const campaignIndex = MOCK_CAMPAIGNS.findIndex(c => c.id === campaignToReview.id);
    if (campaignIndex > -1) {
      MOCK_CAMPAIGNS[campaignIndex].callFlows = editableCallFlows;
      setCampaigns(MOCK_CAMPAIGNS.filter(c => c.callCenterId === currentCallCenter?.id));
      
      addAuditLog({
          action: "CAMPAIGN_CALL_FLOWS_UPDATED",
          userId: currentUser.id,
          userName: currentUser.name || currentUser.email,
          callCenterId: currentCallCenter.id,
          callCenterName: currentCallCenter.name,
          details: { campaignId: campaignToReview.id, campaignName: campaignToReview.name, flowsCount: editableCallFlows.length }
      });
      toast({ title: "Call Flows Updated", description: `Scripts for "${campaignToReview.name}" have been saved.` });
    }
    setIsReviewDialogOpen(false);
    setCampaignToReview(null);
    setEditableCallFlows([]);
  };

  const handleCallFlowStepTextChange = (flowIndex: number, stepKey: string, newText: string) => {
    setEditableCallFlows(prevFlows => {
      const updatedFlows = [...prevFlows];
      if (updatedFlows[flowIndex] && updatedFlows[flowIndex].steps[stepKey]) {
        updatedFlows[flowIndex].steps[stepKey].text = newText;
      }
      return updatedFlows;
    });
  };

  const statusBadgeVariant = (status: Campaign["status"]) => {
    switch (status) {
      case "active": return "default";
      case "paused": return "secondary";
      case "archived": return "outline";
      case "draft": return "outline"; 
      default: return "outline";
    }
  };

   const statusIcon = (status: Campaign["status"]) => {
    switch (status) {
      case "active": return <Play className="mr-2 h-4 w-4" />;
      case "paused": return <Pause className="mr-2 h-4 w-4" />;
      case "archived": return <Archive className="mr-2 h-4 w-4" />;
      default: return null;
    }
  };

  const handleBulkAction = (action: "activate" | "pause" | "archive" | "delete") => {
    if (selectedCampaignIds.length === 0) {
      toast({ title: "No Campaigns Selected", description: "Please select campaigns to perform a bulk action.", variant: "default" });
      return;
    }
    const actionMap = {
      activate: () => selectedCampaignIds.forEach(id => handleChangeCampaignStatus(id, "active")),
      pause: () => selectedCampaignIds.forEach(id => handleChangeCampaignStatus(id, "paused")),
      archive: () => selectedCampaignIds.forEach(id => handleChangeCampaignStatus(id, "archived")),
      delete: () => selectedCampaignIds.forEach(id => handleDeleteCampaign(id)),
    };
    actionMap[action]();
    toast({ title: `Bulk Action: ${action.charAt(0).toUpperCase() + action.slice(1)}`, description: `${selectedCampaignIds.length} campaign(s) affected.`});
    setSelectedCampaignIds([]); 
  };

  const pageLoading = isCallCenterLoading || isAuthLoading;
  const isActionDisabled = currentCallCenter?.status === 'inactive' && currentUser?.role !== 'SUPER_ADMIN';


  if (pageLoading) {
    return ( <div className="space-y-6"> <Skeleton className="h-9 w-3/4 md:w-1/2" /> <Card><Skeleton className="h-64 w-full" /></Card> </div> );
  }

  if (!currentCallCenter) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Campaign Management</h2>
         <Card className="shadow-lg"><CardHeader><CardTitle>No Call Center Selected</CardTitle></CardHeader><CardContent><p>Please select a call center or <Link href="/call-centers" className="text-primary underline">manage call centers</Link>.</p></CardContent></Card>
      </div>
    );
  }

  const isAllFilteredCampaignsSelected = filteredAndSortedCampaignsData.length > 0 && selectedCampaignIds.length === filteredAndSortedCampaignsData.length;
  const isSomeFilteredCampaignsSelected = selectedCampaignIds.length > 0 && selectedCampaignIds.length < filteredAndSortedCampaignsData.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Campaign Management ({currentCallCenter.name})</h2>
        <Button onClick={() => { 
          setEditingCampaign(null); 
          reset({name: "", status: "draft", userMasterScript: "", variantCount: 1, targetAudience: "", callObjective: "", tone: "Professional"}); 
          setIsCampaignFormOpen(true); 
        }}
        disabled={isActionDisabled}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Create Campaign
        </Button>
      </div>

      {isActionDisabled && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-900/30">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-orange-700 dark:text-orange-400 text-lg">Functionality Limited</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-600 dark:text-orange-300">
              The current call center '{currentCallCenter.name}' is inactive. Creating or modifying campaigns is disabled for non-Super Admins.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isCampaignFormOpen} onOpenChange={(isOpen) => {
        setIsCampaignFormOpen(isOpen);
        if (!isOpen) {
          setEditingCampaign(null);
          reset({name: "", status: "draft", userMasterScript: "", variantCount: 1, targetAudience: "", callObjective: "", tone: "Professional"});
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? "Edit Campaign" : "Create New Campaign & Define Master Script"}</DialogTitle>
            <DialogDescription>
              {editingCampaign ? "Update campaign details. Scripts can be re-generated if master script text changes." : "Provide master script text. AI will generate variants and structure them into call flows."}
              {" "}Campaign will be for '{currentCallCenter.name}'.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] md:max-h-[80vh] pr-5"> 
            <form onSubmit={handleSubmit(handleCampaignFormSubmit)} className="space-y-4 py-4" id="campaignFormDialog">
              <div>
                <Label htmlFor="name-dialog">Campaign Name</Label>
                <Input id="name-dialog" {...register("name")} className="mt-1" />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
              </div>
               <div>
                <Label htmlFor="userMasterScript-dialog">Master Script Text</Label>
                <Textarea id="userMasterScript-dialog" {...register("userMasterScript")} className="mt-1 min-h-[150px]" placeholder="Enter the full master script text here..."/>
                {errors.userMasterScript && <p className="text-sm text-destructive mt-1">{errors.userMasterScript.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="variantCount-dialog">Number of AI Variants (0-5)</Label>
                  <Input id="variantCount-dialog" type="number" {...register("variantCount")} className="mt-1" min="0" max="5" />
                  {errors.variantCount && <p className="text-sm text-destructive mt-1">{errors.variantCount.message}</p>}
                </div>
                <div>
                    <Label htmlFor="tone-dialog">Tone (Optional AI guidance)</Label>
                    <Controller
                        name="tone"
                        control={control}
                        render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || "Professional"} >
                            <SelectTrigger className="w-full mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                            <SelectItem value="Professional">Professional</SelectItem>
                            <SelectItem value="Friendly">Friendly</SelectItem>
                            <SelectItem value="Empathetic">Empathetic</SelectItem>
                            <SelectItem value="Urgent">Urgent</SelectItem>
                            <SelectItem value="Informative">Informative</SelectItem>
                            </SelectContent>
                        </Select>
                        )}
                    />
                </div>
              </div>
               <div>
                <Label htmlFor="targetAudience-dialog">Target Audience (Optional Metadata)</Label>
                <Textarea id="targetAudience-dialog" {...register("targetAudience")} className="mt-1" placeholder="Describe target audience..." />
                {errors.targetAudience && <p className="text-sm text-destructive mt-1">{errors.targetAudience.message}</p>}
              </div>
              <div>
                <Label htmlFor="callObjective-dialog">Call Objective (Optional Metadata)</Label>
                <Textarea id="callObjective-dialog" {...register("callObjective")} className="mt-1" placeholder="Primary goal..." />
                {errors.callObjective && <p className="text-sm text-destructive mt-1">{errors.callObjective.message}</p>}
              </div>
              <div>
                <Label htmlFor="status-dialog">Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                {errors.status && <p className="text-sm text-destructive mt-1">{errors.status.message}</p>}
              </div>
            </form>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t mt-2"> 
            <Button type="button" variant="outline" onClick={() => setIsCampaignFormOpen(false)} disabled={isGeneratingScripts}>Cancel</Button>
            <Button type="submit" form="campaignFormDialog" disabled={isGeneratingScripts}> 
              {isGeneratingScripts && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCampaign ? "Save & Re-Process Scripts" : "Create & Generate Call Flows"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReviewDialogOpen} onOpenChange={(isOpen) => {
          if (!isOpen) {
              setCampaignToReview(null);
              setEditableCallFlows([]);
          }
          setIsReviewDialogOpen(isOpen);
      }}>
        <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Review & Edit Generated Call Flows for: {campaignToReview?.name}</DialogTitle>
            <DialogDescription>
              AI has generated the following call flow structures. Review and edit the text for each step.
              Other structural elements (like conditions, next steps) are AI-generated and may need refinement outside this basic editor for complex logic.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1 pr-4">
            {editableCallFlows && editableCallFlows.length > 0 ? (
              <Accordion type="multiple" defaultValue={editableCallFlows.map((_, idx) => `flow-${idx}`)} className="w-full space-y-2">
                {editableCallFlows.map((flow, flowIndex) => (
                  <AccordionItem value={`flow-${flowIndex}`} key={flow.name} className="border rounded-md p-0">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/50 rounded-t-md">
                      <div className="flex items-center gap-2">
                        <FileJson className="h-5 w-5 text-primary" />
                        <span className="font-semibold">{flow.name}</span> ({Object.keys(flow.steps).length} steps)
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 border-t">
                      <div className="space-y-3">
                        <p className="text-sm"><span className="font-semibold">Description:</span> {flow.description}</p>
                        <p className="text-sm"><span className="font-semibold">Default Exit Step:</span> {flow.default_exit}</p>
                        <h4 className="font-medium text-md mt-2 mb-1">Steps:</h4>
                        {Object.entries(flow.steps).map(([stepKey, step]) => (
                          <Card key={stepKey} className="bg-background/70">
                            <CardHeader className="pb-2 pt-3 px-3">
                              <CardTitle className="text-sm font-semibold flex items-center">
                                <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground"/>
                                Step: {stepKey}
                              </CardTitle>
                              <CardDescription className="text-xs">{step.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="px-3 pb-3 space-y-2">
                              <Label htmlFor={`step-text-${flowIndex}-${stepKey}`} className="text-xs font-medium">Script Text:</Label>
                              <Textarea
                                id={`step-text-${flowIndex}-${stepKey}`}
                                value={step.text}
                                onChange={(e) => handleCallFlowStepTextChange(flowIndex, stepKey, e.target.value)}
                                className="min-h-[80px] text-xs"
                              />
                              <div className="text-xs space-y-1 mt-1">
                                <p><span className="font-semibold">Audio (placeholder):</span> {step.audio_file}</p>
                                <p><span className="font-semibold">Wait for response:</span> {step.wait_for_response ? 'Yes' : 'No'} {step.timeout ? `(Timeout: ${step.timeout}s)` : ''}</p>
                                {step.next && <p><span className="font-semibold">Next Step:</span> {step.next}</p>}
                                {step.conditions && step.conditions.length > 0 && (
                                  <div>
                                    <span className="font-semibold">Conditions:</span>
                                    <ul className="list-disc list-inside pl-2">
                                      {step.conditions.map((cond, cIdx) => (
                                        <li key={cIdx}>{`If type '${cond.type}' ${cond.keywords ? `(keywords: ${cond.keywords.join(', ')}) ` : ''}=> Next: ${cond.next}`}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {step.voice_settings && (
                                    <p><span className="font-semibold">Voice Settings:</span> Stability: {step.voice_settings.stability}, Similarity: {step.voice_settings.similarity_boost}</p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p>No call flows to review for this campaign.</p>
            )}
          </ScrollArea>
          <DialogFooter className="border-t pt-4 mt-2">
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveReviewedCallFlows}>Save Approved Call Flows</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
         <CardHeader>
          <CardTitle>Filter Campaigns</CardTitle>
          <CardDescription>Refine the list of campaigns within {currentCallCenter.name}. Showing {filteredAndSortedCampaignsData.length} of {campaigns.length} campaigns.</CardDescription>
           <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <Label htmlFor="campaignSearch">Search by Name/Objective</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="campaignSearch" placeholder="Enter campaign name or objective..." value={searchTermCampaigns} onChange={(e) => setSearchTermCampaigns(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div>
              <Label htmlFor="campaignStatusFilter">Status</Label>
              <Select value={filterStatusCampaigns} onValueChange={(value) => setFilterStatusCampaigns(value as Campaign["status"] | "all")}>
                <SelectTrigger id="campaignStatusFilter" className="w-full mt-1"><SelectValue /></SelectTrigger>
                <SelectContent> <SelectItem value="all">All Statuses</SelectItem> <SelectItem value="draft">Draft</SelectItem> <SelectItem value="active">Active</SelectItem> <SelectItem value="paused">Paused</SelectItem> <SelectItem value="archived">Archived</SelectItem> </SelectContent>
              </Select>
            </div>
             <Button onClick={resetFilters} variant="outline" size="sm" className="md:col-start-3"> <FilterX className="mr-2 h-4 w-4" /> Reset Filters </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {selectedCampaignIds.length > 0 && (
            <div className="p-4 border-b bg-muted/50">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{selectedCampaignIds.length} campaign(s) selected.</span>
                <Button size="sm" onClick={() => handleBulkAction("activate")} disabled={isActionDisabled}>Activate Selected</Button>
                <Button size="sm" variant="secondary" onClick={() => handleBulkAction("pause")} disabled={isActionDisabled}>Pause Selected</Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("archive")} disabled={isActionDisabled}>Archive Selected</Button>
                <Button size="sm" variant="destructive" onClick={() => handleBulkAction("delete")} disabled={isActionDisabled}>Delete Selected</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedCampaignIds([])}>Clear Selection</Button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                        checked={isAllFilteredCampaignsSelected}
                        onCheckedChange={(checked) => handleSelectAllCampaigns(Boolean(checked))}
                        aria-label="Select all filtered campaigns"
                        indeterminate={isSomeFilteredCampaignsSelected ? true : undefined}
                        disabled={isActionDisabled && filteredAndSortedCampaignsData.length > 0}
                    />
                  </TableHead>
                  <TableHead onClick={() => handleSort('name')} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center">Name {renderSortIcon('name')}</div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('status')} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center">Status {renderSortIcon('status')}</div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('callObjective')} className="cursor-pointer hover:bg-muted/50 transition-colors max-w-xs">
                    <div className="flex items-center">Objective {renderSortIcon('callObjective')}</div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('callFlowsCount')} className="cursor-pointer hover:bg-muted/50 transition-colors">
                     <div className="flex items-center">Call Flows {renderSortIcon('callFlowsCount')}</div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('createdDate')} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center">Created {renderSortIcon('createdDate')}</div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedCampaignsData.length > 0 ? (
                  filteredAndSortedCampaignsData.map((campaign) => (
                    <TableRow 
                        key={campaign.id} 
                        data-state={selectedCampaignIds.includes(campaign.id) ? "selected" : ""}
                    >
                      <TableCell>
                        <Checkbox
                            checked={selectedCampaignIds.includes(campaign.id)}
                            onCheckedChange={(checked) => handleSelectCampaign(campaign.id, Boolean(checked))}
                            aria-label={`Select campaign ${campaign.name}`}
                            disabled={isActionDisabled}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell><Badge variant={statusBadgeVariant(campaign.status)} className="capitalize">{statusIcon(campaign.status)}{campaign.status}</Badge></TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">{campaign.callObjective}</TableCell>
                      <TableCell>
                        {(campaign.callFlows && campaign.callFlows.length > 0) ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => { setCampaignToReview(campaign); setEditableCallFlows(JSON.parse(JSON.stringify(campaign.callFlows || []))); setIsReviewDialogOpen(true); }}
                            disabled={isActionDisabled}
                          >
                            <FileJson className="mr-2 h-4 w-4" /> Review ({campaign.callFlows.length})
                          </Button>
                        ) : ( 
                          <span className="text-xs text-muted-foreground">No call flows</span> 
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(campaign.createdDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={isActionDisabled}>
                              <span className="sr-only">Open menu for {campaign.name}</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleOpenEditCampaignForm(campaign)} disabled={isActionDisabled}>
                              <Edit2 className="mr-2 h-4 w-4" /> Edit Details & Master Script
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setCampaignToReview(campaign); setEditableCallFlows(JSON.parse(JSON.stringify(campaign.callFlows || []))); setIsReviewDialogOpen(true); }} disabled={!campaign.callFlows || campaign.callFlows.length === 0 || isActionDisabled}>
                              <FileJson className="mr-2 h-4 w-4" /> Review/Edit Call Flows
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {campaign.status !== "active" && <DropdownMenuItem onClick={() => handleChangeCampaignStatus(campaign.id, "active")} disabled={isActionDisabled}><Play className="mr-2 h-4 w-4" /> Activate</DropdownMenuItem>}
                            {campaign.status === "active" && <DropdownMenuItem onClick={() => handleChangeCampaignStatus(campaign.id, "paused")} disabled={isActionDisabled}><Pause className="mr-2 h-4 w-4" /> Pause</DropdownMenuItem>}
                            {campaign.status !== "archived" && <DropdownMenuItem onClick={() => handleChangeCampaignStatus(campaign.id, "archived")} disabled={isActionDisabled}><Archive className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteCampaign(campaign.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10" disabled={isActionDisabled}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={7} className="text-center h-24">{campaigns.length === 0 ? "No campaigns created for this call center." : "No campaigns match filters."}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
