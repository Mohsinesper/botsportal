
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Edit2, Trash2, Play, Pause, Archive, Wand2, Loader2, Eye } from "lucide-react";
import type { Campaign, ScriptVariant, CallCenter } from "@/types";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { handleGenerateCampaignScripts } from "./actions";
import { ScrollArea } from "@/components/ui/scroll-area";

// Assume a current call center ID for now. In a real app, this would come from user session/context.
const MOCK_CURRENT_CALL_CENTER_ID = "cc1";

const mockCallCenters: CallCenter[] = [
  { id: "cc1", name: "Main Call Center HQ", location: "New York" },
  { id: "cc2", name: "West Coast Operations", location: "California" },
];

const campaignSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Campaign name must be at least 3 characters"),
  status: z.enum(["active", "paused", "archived", "draft"]),
  targetAudience: z.string().min(10, "Target audience description is required"),
  callObjective: z.string().min(5, "Call objective is required"),
  callCenterId: z.string().min(1, "Call Center ID is required"),
  tone: z.string().min(3, "Tone for script generation is required"),
  variantCount: z.coerce.number().int().min(1).max(5).default(3),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isGeneratingScripts, setIsGeneratingScripts] = useState(false);
  const [viewingScriptsCampaign, setViewingScriptsCampaign] = useState<Campaign | null>(null);
  
  // Simulating a selected call center.
  const [currentCallCenterId, setCurrentCallCenterId] = useState<string>(MOCK_CURRENT_CALL_CENTER_ID);

  const { control, handleSubmit, register, reset, formState: { errors }, setValue } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      status: "draft",
      targetAudience: "",
      callObjective: "",
      callCenterId: currentCallCenterId,
      tone: "Professional",
      variantCount: 3,
    }
  });
  
  useEffect(() => {
    const fetchedCampaigns: Campaign[] = [
      { id: "1", name: "Summer Sale Promo CC1", status: "active", targetAudience: "Existing customers aged 25-40 interested in tech.", callObjective: "Promote new summer discounts and drive sales.", createdDate: new Date().toISOString(), callCenterId: "cc1", conversionRate: 22.5, masterScript: "Hello [Customer Name], this is a call about our amazing Summer Sale!", scriptVariants: [{id: "sv1-1", name: "Variant 1", content: "Summer Sale Variant 1 content..."}]},
      { id: "2", name: "New Product Launch CC1", status: "paused", targetAudience: "New leads from recent marketing campaign.", callObjective: "Introduce new product and generate qualified leads.", createdDate: new Date(Date.now() - 86400000 * 5).toISOString(), callCenterId: "cc1", conversionRate: 15.2 },
      { id: "3", name: "Customer Feedback Drive CC2", status: "draft", targetAudience: "Customers who purchased in the last 3 months.", callObjective: "Gather feedback on recent purchases and identify areas for improvement.", createdDate: new Date(Date.now() - 86400000 * 10).toISOString(), callCenterId: "cc2" },
      { id: "4", name: "Winter Special CC1", status: "archived", targetAudience: "All subscribers in cold regions.", callObjective: "Promote winter heating solutions.", createdDate: new Date(Date.now() - 86400000 * 20).toISOString(), callCenterId: "cc1", masterScript: "Stay warm this winter with our new heaters!", scriptVariants: [] },
    ];
    setCampaigns(fetchedCampaigns);
  }, []);

  const onSubmit = async (data: CampaignFormData) => {
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
      callCenterId: data.callCenterId || currentCallCenterId, // Ensure callCenterId is set
    };

    if (editingCampaign) {
      setCampaigns(campaigns.map(c => c.id === editingCampaign.id ? { ...editingCampaign, ...campaignDataWithCallCenter, masterScript: masterScript ?? editingCampaign.masterScript, scriptVariants: scriptVariants ?? editingCampaign.scriptVariants } : c));
      toast({ title: "Campaign Updated", description: `Campaign "${data.name}" has been successfully updated.`});
    } else {
      const newCampaign: Campaign = {
        id: campaignId,
        ...campaignDataWithCallCenter,
        createdDate: new Date().toISOString(),
        masterScript,
        scriptVariants,
      };
      setCampaigns(prev => [...prev, newCampaign]);
      toast({ title: "Campaign Created", description: `Campaign "${data.name}" has been successfully created.`});
    }
    
    setIsGeneratingScripts(false);
    setIsDialogOpen(false);
    reset({ ...campaignSchema.shape, callCenterId: currentCallCenterId }); // Reset with current call center
    setEditingCampaign(null);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    reset({
      ...campaign, // Spread all campaign fields
      tone: "Professional", // Default or fetch if stored
      variantCount: campaign.scriptVariants?.length || 3,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setCampaigns(campaigns.filter(c => c.id !== id));
    toast({ title: "Campaign Deleted", description: "The campaign has been deleted.", variant: "destructive" });
  };
  
  const handleStatusChange = (id: string, status: Campaign["status"]) => {
    setCampaigns(campaigns.map(c => c.id === id ? { ...c, status } : c));
    toast({ title: "Status Updated", description: `Campaign status changed to ${status}.`});
  };

  const openScriptGenerationDialog = (campaign: Campaign) => {
    setEditingCampaign(campaign); 
    setValue("tone", "Professional"); 
    setValue("variantCount", campaign.scriptVariants?.length || 3);
    setValue("name", campaign.name);
    setValue("targetAudience", campaign.targetAudience);
    setValue("callObjective", campaign.callObjective);
    setValue("status", campaign.status);
    setValue("callCenterId", campaign.callCenterId);
    setIsDialogOpen(true); 
  };
  
  const statusBadgeVariant = (status: Campaign["status"]) => {
    switch (status) {
      case "active": return "default";
      case "paused": return "secondary";
      case "archived": return "outline";
      case "draft": return "outline"; // Consider a "info" or "warning" variant for draft
      default: return "outline";
    }
  };

   const statusIcon = (status: Campaign["status"]) => {
    switch (status) {
      case "active": return <Play className="mr-2 h-4 w-4" />;
      case "paused": return <Pause className="mr-2 h-4 w-4" />;
      case "archived": return <Archive className="mr-2 h-4 w-4" />;
      default: return null; // Or a specific icon for "draft"
    }
  };

  const filteredCampaigns = campaigns.filter(c => c.callCenterId === currentCallCenterId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Campaign Management ({mockCallCenters.find(cc => cc.id === currentCallCenterId)?.name || 'Selected Call Center'})</h2>
        <Button onClick={() => { 
          setEditingCampaign(null); 
          reset({name: "", status: "draft", targetAudience: "", callObjective: "", callCenterId: currentCallCenterId, tone: "Professional", variantCount: 3}); 
          setIsDialogOpen(true); 
        }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Campaign
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
        setIsDialogOpen(isOpen);
        if (!isOpen) {
          setEditingCampaign(null);
          reset({ ...campaignSchema.shape, callCenterId: currentCallCenterId });
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? "Edit Campaign & Scripts" : "Create New Campaign & Generate Scripts"}</DialogTitle>
            <DialogDescription>
              {editingCampaign ? "Update campaign details and re-generate scripts." : "Fill in details to create a campaign and generate initial scripts."}
              {" "}Campaigns will be associated with '{mockCallCenters.find(cc => cc.id === (editingCampaign?.callCenterId || currentCallCenterId))?.name || 'current call center'}'.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* Hidden Call Center ID field, or could be a selector if users can change it */}
            <input type="hidden" {...register("callCenterId")} />

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
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isGeneratingScripts}>Cancel</Button>
              <Button type="submit" disabled={isGeneratingScripts}>
                {isGeneratingScripts && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingCampaign ? "Save & Re-generate Scripts" : "Create & Generate Scripts"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingScriptsCampaign} onOpenChange={(isOpen) => { if(!isOpen) setViewingScriptsCampaign(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Scripts for: {viewingScriptsCampaign?.name}</DialogTitle>
            <DialogDescription>Master script and its variants generated for this campaign.</DialogDescription>
          </DialogHeader>
          {viewingScriptsCampaign && (
            <ScrollArea className="max-h-[60vh] p-1">
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
              {filteredCampaigns.length > 0 ? filteredCampaigns.map((campaign) => (
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
                  <TableCell colSpan={6} className="text-center h-24">No campaigns found for this call center. Create one to get started!</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
