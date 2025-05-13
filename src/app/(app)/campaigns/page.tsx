
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Edit2, Trash2, Play, Pause, Archive } from "lucide-react";
import type { Campaign } from "@/types";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card"; // Added import

const campaignSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Campaign name must be at least 3 characters"),
  status: z.enum(["active", "paused", "archived", "draft"]),
  targetAudience: z.string().min(10, "Target audience description is required"),
  callObjective: z.string().min(5, "Call objective is required"),
  // scriptVariants: z.array(z.string()).min(1, "At least one script variant is required"), // Simplified for now
});

type CampaignFormData = z.infer<typeof campaignSchema>;

// Mock Script Variants for selection (in a real app, these would be managed elsewhere)
const mockScriptVariants = [
  { id: "sv1", name: "General Intro Script" },
  { id: "sv2", name: "Product Focused Script" },
  { id: "sv3", name: "Urgency Script" },
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const { control, handleSubmit, register, reset, formState: { errors } } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      status: "draft",
      targetAudience: "",
      callObjective: "",
    }
  });
  
  useEffect(() => {
    // Simulate fetching campaigns
    const fetchedCampaigns: Campaign[] = [
      { id: "1", name: "Summer Sale Promo", status: "active", scriptVariants: ["sv1"], targetAudience: "Existing customers aged 25-40 interested in tech.", callObjective: "Promote new summer discounts and drive sales.", createdDate: new Date().toISOString(), conversionRate: 22.5 },
      { id: "2", name: "New Product Launch", status: "paused", scriptVariants: ["sv2", "sv3"], targetAudience: "New leads from recent marketing campaign.", callObjective: "Introduce new product and generate qualified leads.", createdDate: new Date(Date.now() - 86400000 * 5).toISOString(), conversionRate: 15.2 },
      { id: "3", name: "Customer Feedback Drive", status: "draft", scriptVariants: ["sv1"], targetAudience: "Customers who purchased in the last 3 months.", callObjective: "Gather feedback on recent purchases and identify areas for improvement.", createdDate: new Date(Date.now() - 86400000 * 10).toISOString() },
    ];
    setCampaigns(fetchedCampaigns);
  }, []);

  const onSubmit = (data: CampaignFormData) => {
    if (editingCampaign) {
      setCampaigns(campaigns.map(c => c.id === editingCampaign.id ? { ...editingCampaign, ...data, scriptVariants: [] } : c)); // scriptVariants simplified
      toast({ title: "Campaign Updated", description: `Campaign "${data.name}" has been successfully updated.`});
    } else {
      const newCampaign: Campaign = {
        ...data,
        id: Date.now().toString(),
        createdDate: new Date().toISOString(),
        scriptVariants: [], // scriptVariants simplified
      };
      setCampaigns([...campaigns, newCampaign]);
      toast({ title: "Campaign Created", description: `Campaign "${data.name}" has been successfully created.`});
    }
    setIsDialogOpen(false);
    reset();
    setEditingCampaign(null);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    reset({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      targetAudience: campaign.targetAudience,
      callObjective: campaign.callObjective,
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

  const statusBadgeVariant = (status: Campaign["status"]) => {
    switch (status) {
      case "active": return "default"; // Will use primary color (blue)
      case "paused": return "secondary";
      case "archived": return "outline";
      case "draft": return "outline"; // Consider a specific color for draft if needed
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Campaign Management</h2>
        <Button onClick={() => { setEditingCampaign(null); reset(); setIsDialogOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Campaign
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? "Edit Campaign" : "Create New Campaign"}</DialogTitle>
            <DialogDescription>
              {editingCampaign ? "Update the details of your existing campaign." : "Fill in the details to create a new campaign."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            {/* Script Variants selection can be added here later with a multi-select component */}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingCampaign ? "Save Changes" : "Create Campaign"}</Button>
            </DialogFooter>
          </form>
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
                <TableHead>Conversion Rate</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length > 0 ? campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(campaign.status)} className="capitalize">
                      {statusIcon(campaign.status)}{campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{campaign.callObjective}</TableCell>
                  <TableCell className="text-muted-foreground">{campaign.conversionRate ? `${campaign.conversionRate}%` : "N/A"}</TableCell>
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
                          <Edit2 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
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
                  <TableCell colSpan={6} className="text-center h-24">No campaigns found. Create one to get started!</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

