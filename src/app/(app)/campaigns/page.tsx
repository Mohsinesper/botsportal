
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Edit2, Trash2, Play, Pause, Archive, Wand2, Loader2, Eye, FilterX, Search, FileJson, MessageSquare } from "lucide-react";
import type { Campaign, ScriptVariant, CallFlow, CallFlowStep } from "@/types"; // Added CallFlow types
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
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { MOCK_CAMPAIGNS } from "@/lib/mock-data"; 
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


const campaignSchemaBase = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Campaign name must be at least 3 characters"),
  status: z.enum(["active", "paused", "archived", "draft"]),
  userMasterScript: z.string().min(20, "Master script text must be at least 20 characters."),
  variantCount: z.coerce.number().int().min(0).max(5).default(1), // 0 means only master
  // Optional fields, now primarily for metadata or AI guidance if not directly parsing structured script
  targetAudience: z.string().optional(), 
  callObjective: z.string().optional(),
  tone: z.string().optional(),
});

type CampaignFormData = z.infer<typeof campaignSchemaBase>;

export default function CampaignsPage() {
  const { currentCallCenter, isLoading: isCallCenterLoading } = useCallCenter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isCampaignFormOpen, setIsCampaignFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isGeneratingScripts, setIsGeneratingScripts] = useState(false);
  
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [campaignToReview, setCampaignToReview] = useState<Campaign | null>(null);
  const [editableCallFlows, setEditableCallFlows] = useState<CallFlow[]>([]);


  const [searchTermCampaigns, setSearchTermCampaigns] = useState("");
  const [filterStatusCampaigns, setFilterStatusCampaigns] = useState<Campaign["status"] | "all">("all");

  const { control, handleSubmit, register, reset, formState: { errors }, setValue } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchemaBase),
    defaultValues: {
      name: "",
      status: "draft",
      userMasterScript: "",
      variantCount: 1,
      targetAudience: "", // Provide default empty string
      callObjective: "", // Provide default empty string
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
  }, [currentCallCenter]);

  const filteredCampaignsData = useMemo(() => {
    return campaigns.filter(campaign => {
      const matchesSearch = searchTermCampaigns === "" || 
                            campaign.name.toLowerCase().includes(searchTermCampaigns.toLowerCase()) ||
                            (campaign.callObjective && campaign.callObjective.toLowerCase().includes(searchTermCampaigns.toLowerCase()));
      const matchesStatus = filterStatusCampaigns === "all" || campaign.status === filterStatusCampaigns;
      return matchesSearch && matchesStatus;
    });
  }, [campaigns, searchTermCampaigns, filterStatusCampaigns]);

  const resetFilters = () => {
    setSearchTermCampaigns("");
    setFilterStatusCampaigns("all");
  };

  const handleCampaignFormSubmit = async (data: CampaignFormData) => {
    if (!currentCallCenter) {
      toast({ title: "Error", description: "No call center selected.", variant: "destructive" });
      return;
    }
    setIsGeneratingScripts(true);
    const campaignId = editingCampaign ? editingCampaign.id : Date.now().toString();
    
    const scriptGenerationInput = {
      userMasterScript: data.userMasterScript,
      campaignName: data.name,
      // Use optional callObjective for description, provide fallback
      campaignDescription: `Call flow for ${data.name}: ${data.callObjective || 'General campaign objective.'}`,
      variantCount: data.variantCount,
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
      targetAudience: data.targetAudience || "", // Ensure empty string if optional
      callObjective: data.callObjective || "",   // Ensure empty string if optional
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
      variantCount: campaign.callFlows ? Math.max(0, campaign.callFlows.length - 1) : 1, // Default to 1 if no callFlows
      targetAudience: campaign.targetAudience || "",
      callObjective: campaign.callObjective || "",
      tone: campaign.tone || "Professional",
    });
    setIsCampaignFormOpen(true);
  };

  const handleDeleteCampaign = (id: string) => {
    const index = MOCK_CAMPAIGNS.findIndex(c => c.id === id);
    if (index > -1) MOCK_CAMPAIGNS.splice(index, 1);
    setCampaigns(campaigns.filter(c => c.id !== id));
    toast({ title: "Campaign Deleted", variant: "destructive" });
  };
  
  const handleChangeCampaignStatus = (id: string, status: Campaign["status"]) => {
    const updatedCampaigns = MOCK_CAMPAIGNS.map(c => c.id === id ? { ...c, status } : c);
    MOCK_CAMPAIGNS.length = 0;
    MOCK_CAMPAIGNS.push(...updatedCampaigns);
    if (currentCallCenter) {
      setCampaigns(MOCK_CAMPAIGNS.filter(c => c.callCenterId === currentCallCenter.id));
    }
    toast({ title: "Status Updated", description: `Campaign status changed to ${status}.`});
  };
  
  const handleSaveReviewedCallFlows = () => {
    if (!campaignToReview || !editableCallFlows) return;

    const campaignIndex = MOCK_CAMPAIGNS.findIndex(c => c.id === campaignToReview.id);
    if (campaignIndex > -1) {
      MOCK_CAMPAIGNS[campaignIndex].callFlows = editableCallFlows;
      setCampaigns(MOCK_CAMPAIGNS.filter(c => c.callCenterId === currentCallCenter?.id));
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

  if (isCallCenterLoading) {
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


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Campaign Management ({currentCallCenter.name})</h2>
        <Button onClick={() => { 
          setEditingCampaign(null); 
          reset({name: "", status: "draft", userMasterScript: "", variantCount: 1, targetAudience: "", callObjective: "", tone: "Professional"}); 
          setIsCampaignFormOpen(true); 
        }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Campaign
        </Button>
      </div>

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
          <CardDescription>Refine the list of campaigns within {currentCallCenter.name}.</CardDescription>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Objective</TableHead>
                <TableHead>Call Flows</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaignsData.length > 0 ? (
                filteredCampaignsData.map((campaign) => (
                  <TableRow key={campaign.id}><TableCell className="font-medium">{campaign.name}</TableCell><TableCell><Badge variant={statusBadgeVariant(campaign.status)} className="capitalize">{statusIcon(campaign.status)}{campaign.status}</Badge></TableCell><TableCell className="max-w-xs truncate text-muted-foreground">{campaign.callObjective}</TableCell><TableCell>{(campaign.callFlows && campaign.callFlows.length > 0) ? (<Button variant="outline" size="sm" onClick={() => { setCampaignToReview(campaign); setEditableCallFlows(JSON.parse(JSON.stringify(campaign.callFlows || []))); setIsReviewDialogOpen(true); }}><FileJson className="mr-2 h-4 w-4" /> Review ({campaign.callFlows.length})</Button>) : ( <span className="text-xs text-muted-foreground">No call flows</span> )}</TableCell><TableCell className="text-muted-foreground">{new Date(campaign.createdDate).toLocaleDateString()}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Actions</DropdownMenuLabel><DropdownMenuItem onClick={() => handleOpenEditCampaignForm(campaign)}><Edit2 className="mr-2 h-4 w-4" /> Edit Details & Master Script</DropdownMenuItem><DropdownMenuItem onClick={() => { setCampaignToReview(campaign); setEditableCallFlows(JSON.parse(JSON.stringify(campaign.callFlows || []))); setIsReviewDialogOpen(true); }} disabled={!campaign.callFlows || campaign.callFlows.length === 0}><FileJson className="mr-2 h-4 w-4" /> Review/Edit Call Flows</DropdownMenuItem><DropdownMenuSeparator />{campaign.status !== "active" && <DropdownMenuItem onClick={() => handleChangeCampaignStatus(campaign.id, "active")}><Play className="mr-2 h-4 w-4" /> Activate</DropdownMenuItem>}{campaign.status === "active" && <DropdownMenuItem onClick={() => handleChangeCampaignStatus(campaign.id, "paused")}><Pause className="mr-2 h-4 w-4" /> Pause</DropdownMenuItem>}{campaign.status !== "archived" && <DropdownMenuItem onClick={() => handleChangeCampaignStatus(campaign.id, "archived")}><Archive className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>}<DropdownMenuSeparator /><DropdownMenuItem onClick={() => handleDeleteCampaign(campaign.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} className="text-center h-24">{campaigns.length === 0 ? "No campaigns created for this call center." : "No campaigns match filters."}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
