
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Edit2, Trash2, Play, Pause, Archive, Wand2, Loader2, Eye, FilterX, Search } from "lucide-react";
import type { Campaign, ScriptVariant } from "@/types";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { handleGenerateCampaignScripts } from "./actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCallCenter } from "@/contexts/CallCenterContext";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { MOCK_CAMPAIGNS } from "@/lib/mock-data"; // Import centralized mock data

const campaignSchemaBase = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Campaign name must be at least 3 characters"),
  status: z.enum(["active", "paused", "archived", "draft"]),
  targetAudience: z.string().min(10, "Target audience description is required"),
  callObjective: z.string().min(5, "Call objective is required"),
  tone: z.string().min(3, "Tone for script generation is required"),
  variantCount: z.coerce.number().int().min(1).max(5).default(3),
});

type CampaignFormData = z.infer<typeof campaignSchemaBase>;

export default function CampaignsPage() {
  const { currentCallCenter, isLoading: isCallCenterLoading } = useCallCenter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isGeneratingScripts, setIsGeneratingScripts] = useState(false);
  const [viewingScriptsCampaign, setViewingScriptsCampaign] = useState<Campaign | null>(null);
  
  // Filters
  const [searchTermCampaigns, setSearchTermCampaigns] = useState("");
  const [filterStatusCampaigns, setFilterStatusCampaigns] = useState<Campaign["status"] | "all">("all");


  const { control, handleSubmit, register, reset, formState: { errors }, setValue } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchemaBase),
    defaultValues: {
      name: "",
      status: "draft",
      targetAudience: "",
      callObjective: "",
      tone: "Professional",
      variantCount: 3,
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
                            campaign.callObjective.toLowerCase().includes(searchTermCampaigns.toLowerCase());
      const matchesStatus = filterStatusCampaigns === "all" || campaign.status === filterStatusCampaigns;
      return matchesSearch && matchesStatus;
    });
  }, [campaigns, searchTermCampaigns, filterStatusCampaigns]);

  const resetFilters = () => {
    setSearchTermCampaigns("");
    setFilterStatusCampaigns("all");
  };

  const onSubmit = async (data: CampaignFormData) => {
    if (!currentCallCenter) {
      toast({ title: "Error", description: "No call center selected. Please select a call center first.", variant: "destructive" });
      return;
    }
    setIsGeneratingScripts(true);
    let campaignId = editingCampaign ? editingCampaign.id : Date.now().toString();
    
    const scriptGenerationInput = {
      campaignData: {
        productDescription: `${data.callObjective}. Target: ${data.targetAudience}`,
        targetAudience: data.targetAudience,
        callObjective: data.callObjective,
        tone: data.tone,
      },
      variantCount: data.variantCount,
    };

    const scriptResult = await handleGenerateCampaignScripts(scriptGenerationInput);
    let masterScript: string | undefined = undefined;
    let scriptVariants: ScriptVariant[] | undefined = undefined;

    if ("error" in scriptResult) {
      toast({ title: "Script Generation Failed", description: scriptResult.error, variant: "destructive" });
    } else {
      toast({ title: "Scripts Generated Successfully!"});
      masterScript = scriptResult.masterScript;
      scriptVariants = scriptResult.variants.map((content, index) => ({
        id: `${campaignId}-sv${index + 1}`,
        name: `Variant ${index + 1}`,
        content,
      }));
    }

    const campaignDataWithCallCenter = {
      ...data,
      callCenterId: currentCallCenter.id, 
    };

    if (editingCampaign) {
      const updatedCampaigns = MOCK_CAMPAIGNS.map(c => c.id === editingCampaign.id ? { ...editingCampaign, ...campaignDataWithCallCenter, masterScript: masterScript ?? editingCampaign.masterScript, scriptVariants: scriptVariants ?? editingCampaign.scriptVariants } : c);
      MOCK_CAMPAIGNS.length = 0; // Clear original array
      MOCK_CAMPAIGNS.push(...updatedCampaigns); // Push updated items
      setCampaigns(MOCK_CAMPAIGNS.filter(c => c.callCenterId === currentCallCenter.id));

      toast({ title: "Campaign Updated", description: `Campaign "${data.name}" has been successfully updated.`});
    } else {
      const newCampaign: Campaign = {
        id: campaignId,
        ...campaignDataWithCallCenter,
        createdDate: new Date().toISOString(),
        masterScript,
        scriptVariants,
      };
      MOCK_CAMPAIGNS.push(newCampaign);
      setCampaigns(prev => [...prev, newCampaign]);
      toast({ title: "Campaign Created", description: `Campaign "${data.name}" has been successfully created.`});
    }
    
    setIsGeneratingScripts(false);
    setIsDialogOpen(false);
    reset({name: "", status: "draft", targetAudience: "", callObjective: "", tone: "Professional", variantCount: 3});
    setEditingCampaign(null);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    reset({
      ...campaign,
      tone: (campaign as any).tone || "Professional", 
      variantCount: campaign.scriptVariants?.length || 3,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const index = MOCK_CAMPAIGNS.findIndex(c => c.id === id);
    if (index > -1) MOCK_CAMPAIGNS.splice(index, 1);
    setCampaigns(campaigns.filter(c => c.id !== id));
    toast({ title: "Campaign Deleted", description: "The campaign has been deleted.", variant: "destructive" });
  };
  
  const handleStatusChange = (id: string, status: Campaign["status"]) => {
    const updatedCampaigns = MOCK_CAMPAIGNS.map(c => c.id === id ? { ...c, status } : c);
    MOCK_CAMPAIGNS.length = 0;
    MOCK_CAMPAIGNS.push(...updatedCampaigns);
    if (currentCallCenter) {
      setCampaigns(MOCK_CAMPAIGNS.filter(c => c.callCenterId === currentCallCenter.id));
    }
    toast({ title: "Status Updated", description: `Campaign status changed to ${status}.`});
  };

  const openScriptGenerationDialog = (campaign: Campaign) => {
    setEditingCampaign(campaign); 
    setValue("tone", (campaign as any).tone || "Professional"); 
    setValue("variantCount", campaign.scriptVariants?.length || 3);
    setValue("name", campaign.name);
    setValue("targetAudience", campaign.targetAudience);
    setValue("callObjective", campaign.callObjective);
    setValue("status", campaign.status);
    setIsDialogOpen(true); 
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
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Card className="shadow-lg">
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
        <div className="flex justify-between items-center">
           <h2 className="text-3xl font-bold tracking-tight">Campaign Management</h2>
        </div>
         <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>No Call Center Selected</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Please select a call center from the header or <Link href="/call-centers" className="text-primary underline">add and select a call center</Link> to manage campaigns.</p>
            </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Campaign Management ({currentCallCenter.name})</h2>
        <Button onClick={() => { 
          setEditingCampaign(null); 
          reset({name: "", status: "draft", targetAudience: "", callObjective: "", tone: "Professional", variantCount: 3}); 
          setIsDialogOpen(true); 
        }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Campaign
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
        setIsDialogOpen(isOpen);
        if (!isOpen) {
          setEditingCampaign(null);
          reset({name: "", status: "draft", targetAudience: "", callObjective: "", tone: "Professional", variantCount: 3});
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? "Edit Campaign & Scripts" : "Create New Campaign & Generate Scripts"}</DialogTitle>
            <DialogDescription>
              {editingCampaign ? "Update campaign details and re-generate scripts." : "Fill in details to create a campaign and generate initial scripts."}
              {" "}Campaign will be associated with '{currentCallCenter.name}'.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] md:max-h-[80vh] pr-5"> 
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4" id="campaignForm">
              <div>
                <Label htmlFor="name">Campaign Name</Label>
                <Input id="name" {...register("name")} className="mt-1" />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Textarea id="targetAudience" {...register("targetAudience")} className="mt-1" placeholder="Describe your target audience..." />
                {errors.targetAudience && <p className="text-sm text-destructive mt-1">{errors.targetAudience.message}</p>}
              </div>
              <div>
                <Label htmlFor="callObjective">Call Objective</Label>
                <Textarea id="callObjective" {...register("callObjective")} className="mt-1" placeholder="What is the primary goal of this campaign?" />
                {errors.callObjective && <p className="text-sm text-destructive mt-1">{errors.callObjective.message}</p>}
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && <p className="text-sm text-destructive mt-1">{errors.status.message}</p>}
              </div>

              <Card className="bg-muted/50 p-4">
                <CardHeader className="p-0 pb-2">
                  <CardTitle className="text-base">Script Generation Settings</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                  <div>
                    <Label htmlFor="tone">Desired Tone for Scripts</Label>
                    <Controller
                        name="tone"
                        control={control}
                        render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                            <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="Select tone" />
                            </SelectTrigger>
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
                    {errors.tone && <p className="text-sm text-destructive mt-1">{errors.tone.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="variantCount">Number of Script Variants (1-5)</Label>
                    <Input id="variantCount" type="number" {...register("variantCount")} className="mt-1" min="1" max="5" />
                    {errors.variantCount && <p className="text-sm text-destructive mt-1">{errors.variantCount.message}</p>}
                  </div>
                </CardContent>
              </Card>
            </form>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t mt-2"> 
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isGeneratingScripts}>Cancel</Button>
            <Button type="submit" form="campaignForm" disabled={isGeneratingScripts}> 
              {isGeneratingScripts && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCampaign ? "Save & Re-generate Scripts" : "Create & Generate Scripts"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingScriptsCampaign} onOpenChange={(isOpen) => { if(!isOpen) setViewingScriptsCampaign(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Scripts for: {viewingScriptsCampaign?.name}</DialogTitle>
            <DialogDescription>Master script and its variants generated for this campaign.</DialogDescription>
          </DialogHeader>
          {viewingScriptsCampaign && (
            <ScrollArea className="max-h-[60vh] p-1 pr-4">
              <div className="space-y-4 py-4">
                {viewingScriptsCampaign.masterScript && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Master Script</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="whitespace-pre-wrap text-sm bg-muted/30 p-3 rounded-md">{viewingScriptsCampaign.masterScript}</pre>
                    </CardContent>
                  </Card>
                )}
                {viewingScriptsCampaign.scriptVariants && viewingScriptsCampaign.scriptVariants.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Script Variants:</h4>
                    {viewingScriptsCampaign.scriptVariants.map(variant => (
                       <Card key={variant.id}>
                         <CardHeader className="pb-2 pt-4">
                           <CardTitle className="text-md">{variant.name}</CardTitle>
                         </CardHeader>
                         <CardContent>
                           <pre className="whitespace-pre-wrap text-sm bg-muted/30 p-3 rounded-md">{variant.content}</pre>
                         </CardContent>
                       </Card>
                    ))}
                  </div>
                )}
                {!viewingScriptsCampaign.masterScript && (!viewingScriptsCampaign.scriptVariants || viewingScriptsCampaign.scriptVariants.length === 0) && (
                  <p>No scripts have been generated for this campaign yet.</p>
                )}
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingScriptsCampaign(null)}>Close</Button>
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
                <Input
                  id="campaignSearch"
                  placeholder="Enter campaign name or objective..."
                  value={searchTermCampaigns}
                  onChange={(e) => setSearchTermCampaigns(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="campaignStatusFilter">Status</Label>
              <Select value={filterStatusCampaigns} onValueChange={(value) => setFilterStatusCampaigns(value as Campaign["status"] | "all")}>
                <SelectTrigger id="campaignStatusFilter" className="w-full mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <Button onClick={resetFilters} variant="outline" size="sm" className="md:col-start-3">
                <FilterX className="mr-2 h-4 w-4" /> Reset Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Objective</TableHead>
                <TableHead>Scripts</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaignsData.length > 0 ? filteredCampaignsData.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(campaign.status)} className="capitalize">
                      {statusIcon(campaign.status)}{campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{campaign.callObjective}</TableCell>
                  <TableCell>
                    {campaign.masterScript || (campaign.scriptVariants && campaign.scriptVariants.length > 0) ? (
                       <Button variant="outline" size="sm" onClick={() => setViewingScriptsCampaign(campaign)}>
                         <Eye className="mr-2 h-4 w-4" /> View ({1 + (campaign.scriptVariants?.length || 0)})
                       </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">No scripts</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(campaign.createdDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(campaign)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit Details & Scripts
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openScriptGenerationDialog(campaign)}>
                          <Wand2 className="mr-2 h-4 w-4" /> Regenerate Scripts
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => setViewingScriptsCampaign(campaign)} disabled={!campaign.masterScript && (!campaign.scriptVariants || campaign.scriptVariants.length === 0)}>
                          <Eye className="mr-2 h-4 w-4" /> View Scripts
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {campaign.status !== "active" && <DropdownMenuItem onClick={() => handleStatusChange(campaign.id, "active")}> <Play className="mr-2 h-4 w-4" /> Activate</DropdownMenuItem>}
                        {campaign.status === "active" && <DropdownMenuItem onClick={() => handleStatusChange(campaign.id, "paused")}> <Pause className="mr-2 h-4 w-4" /> Pause</DropdownMenuItem>}
                        {campaign.status !== "archived" && <DropdownMenuItem onClick={() => handleStatusChange(campaign.id, "archived")}> <Archive className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(campaign.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    {campaigns.length === 0 ? "No campaigns found for this call center. Create one to get started!" : "No campaigns match your current filters."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
