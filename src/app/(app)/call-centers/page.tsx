
"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Building, MapPin, Edit2, Trash2, ToggleLeft, ToggleRight, Search } from "lucide-react";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { useAuth } from "@/contexts/AuthContext";
import type { CallCenter } from "@/types";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch"; // Added for status toggle

const callCenterSchema = z.object({
  name: z.string().min(3, "Call center name must be at least 3 characters"),
  location: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

type CallCenterFormData = z.infer<typeof callCenterSchema>;

export default function CallCentersPage() {
  const { 
    callCenters: accessibleCallCenters,
    allCallCenters,
    addCallCenter, 
    updateCallCenter,
    updateCallCenterStatus,
    setCurrentCallCenterById, 
    currentCallCenter, 
    isLoading: isCallCenterLoading 
  } = useCallCenter();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCallCenter, setEditingCallCenter] = useState<CallCenter | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<CallCenterFormData>({ // Added control
    resolver: zodResolver(callCenterSchema),
    defaultValues: { name: "", location: "", status: "active" },
  });

  const onSubmit = (data: CallCenterFormData) => {
    if (currentUser?.role !== "SUPER_ADMIN") {
      toast({ title: "Permission Denied", description: "Only Super Admins can modify call centers.", variant: "destructive"});
      return;
    }

    if (editingCallCenter) {
      const updatedCenter: CallCenter = { 
        ...editingCallCenter, 
        name: data.name, 
        location: data.location || "",
        status: data.status,
      };
      updateCallCenter(updatedCenter);
      toast({ title: "Call Center Updated", description: `"${data.name}" has been successfully updated.` });
    } else {
      addCallCenter({name: data.name, location: data.location, status: data.status});
      toast({ title: "Call Center Added", description: `"${data.name}" has been successfully added.` });
    }
    
    setIsDialogOpen(false);
    setEditingCallCenter(null);
    reset({ name: "", location: "", status: "active" });
  };

  const handleAddNew = () => {
    setEditingCallCenter(null);
    reset({ name: "", location: "", status: "active" });
    setIsDialogOpen(true);
  };

  const handleEdit = (center: CallCenter) => {
    setEditingCallCenter(center);
    reset({ name: center.name, location: center.location || "", status: center.status || "active" });
    setIsDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingCallCenter(null);
    reset({ name: "", location: "", status: "active" });
  };

  const handleStatusToggle = (centerId: string, currentStatus: CallCenter['status']) => {
    if (currentUser?.role !== "SUPER_ADMIN") return;
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const updatedCenter = updateCallCenterStatus(centerId, newStatus);
    if (updatedCenter) {
      let toastDescription = `Call center "${updatedCenter.name}" status changed to ${newStatus}.`;
      if (newStatus === "inactive") {
        toastDescription += " Associated bots have also been set to inactive.";
      }
      toast({ title: "Status Updated", description: toastDescription});
    }
  };

  const isLoading = isCallCenterLoading || isAuthLoading;
  
  const filteredDisplayCallCenters = useMemo(() => {
    const baseList = currentUser?.role === "SUPER_ADMIN" ? allCallCenters : accessibleCallCenters;
    if (!searchTerm) return baseList;
    return baseList.filter(center => center.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [currentUser, allCallCenters, accessibleCallCenters, searchTerm]);


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-10 w-full mb-4" /> {/* Search Skeleton */}
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72 mt-1" />
          </CardHeader>
          <CardContent className="p-0">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-8 w-20 mr-2" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Manage Call Centers</h2>
        {currentUser?.role === "SUPER_ADMIN" && (
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Call Center
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Search call centers by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full"
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCallCenter ? "Edit Call Center" : "Add New Call Center"}</DialogTitle>
            <DialogDescription>
              {editingCallCenter ? "Update the details for this call center." : "Enter the details for the new call center."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Call Center Name</Label>
              <Input id="name" {...register("name")} className="mt-1" placeholder="e.g., North America Sales Hub" />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="location">Location (Optional)</Label>
              <Input id="location" {...register("location")} className="mt-1" placeholder="e.g., Chicago, IL" />
              {errors.location && <p className="text-sm text-destructive mt-1">{errors.location.message}</p>}
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
               <select {...register("status")} className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {errors.status && <p className="text-sm text-destructive mt-1">{errors.status.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
              <Button type="submit">{editingCallCenter ? "Save Changes" : "Add Call Center"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>
            {currentUser?.role === "SUPER_ADMIN" ? "All Call Centers" : "Accessible Call Centers"}
          </CardTitle>
          <CardDescription>
            List of {currentUser?.role === "SUPER_ADMIN" ? `all configured (${filteredDisplayCallCenters.length})` : `your accessible (${filteredDisplayCallCenters.length})`} call centers. Select one to make it active.
            {currentUser?.role !== "SUPER_ADMIN" && accessibleCallCenters.length === 0 && " You are not assigned to any call centers."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredDisplayCallCenters.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDisplayCallCenters.map((center) => (
                  <TableRow 
                    key={center.id} 
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      (currentCallCenter?.id === center.id && (currentUser?.role === "SUPER_ADMIN" || accessibleCallCenters.some(acc => acc.id === center.id))) && "bg-accent/50 hover:bg-accent/60"
                    )}
                    onClick={() => {
                      if (currentUser?.role === "SUPER_ADMIN" || accessibleCallCenters.some(acc => acc.id === center.id)) {
                        setCurrentCallCenterById(center.id);
                      } else {
                        toast({ title: "Access Denied", description: "You are not assigned to this call center.", variant: "destructive"});
                      }
                    }}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                        {center.name}
                        {currentCallCenter?.id === center.id && (
                           <span className="ml-2 text-xs font-semibold text-primary">(Active Session)</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {center.location ? (
                        <div className="flex items-center text-muted-foreground">
                           <MapPin className="mr-2 h-4 w-4" />
                           {center.location}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell>
                       <Badge variant={center.status === "active" ? "default" : "secondary"} className="capitalize">
                         {center.status}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {currentUser?.role === "SUPER_ADMIN" ? (
                        <>
                          <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); handleEdit(center);}} aria-label={`Edit ${center.name}`}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => {e.stopPropagation(); handleStatusToggle(center.id, center.status || "active");}} 
                            aria-label={`Toggle status for ${center.name}`}
                            title={center.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {center.status === 'active' ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); toast({title: "Delete Clicked", description: "Delete functionality to be implemented.", variant: "destructive"})}} className="text-destructive hover:text-destructive" aria-label={`Delete ${center.name}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">View only</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              {searchTerm ? `No call centers found matching "${searchTerm}".` : 
                (currentUser?.role === "SUPER_ADMIN" 
                  ? "No call centers have been added yet. Click \"Add New Call Center\" to get started."
                  : "You do not have access to any call centers."
                )
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

