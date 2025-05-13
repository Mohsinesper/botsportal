
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Building, MapPin, Edit2, Trash2 } from "lucide-react";
import { useCallCenter } from "@/contexts/CallCenterContext";
import type { CallCenter } from "@/types";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const callCenterSchema = z.object({
  name: z.string().min(3, "Call center name must be at least 3 characters"),
  location: z.string().optional(),
});

type CallCenterFormData = z.infer<typeof callCenterSchema>;

export default function CallCentersPage() {
  const { callCenters, addCallCenter, setCurrentCallCenterById, currentCallCenter, isLoading } = useCallCenter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // For now, editing and deleting are not fully implemented beyond context, so a local mock delete is not needed.
  // If we were to implement local delete before context update, we'd manage a local state too.

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CallCenterFormData>({
    resolver: zodResolver(callCenterSchema),
    defaultValues: { name: "", location: "" },
  });

  const onSubmit = (data: CallCenterFormData) => {
    addCallCenter(data);
    toast({ title: "Call Center Added", description: `"${data.name}" has been successfully added.` });
    setIsDialogOpen(false);
    reset();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-10 w-36" />
        </div>
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
        <Button onClick={() => { reset(); setIsDialogOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Call Center
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Call Center</DialogTitle>
            <DialogDescription>
              Enter the details for the new call center.
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Add Call Center</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Existing Call Centers</CardTitle>
          <CardDescription>List of all configured call centers. Select one to make it active.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {callCenters.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {callCenters.map((center) => (
                  <TableRow 
                    key={center.id} 
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      currentCallCenter?.id === center.id && "bg-accent/50 hover:bg-accent/60"
                    )}
                    onClick={() => setCurrentCallCenterById(center.id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                        {center.name}
                        {currentCallCenter?.id === center.id && (
                           <span className="ml-2 text-xs font-semibold text-primary">(Active)</span>
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
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => {e.stopPropagation(); toast({title: "Edit Clicked", description: "Edit functionality to be implemented."})}} className="mr-2" aria-label={`Edit ${center.name}`}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => {e.stopPropagation(); toast({title: "Delete Clicked", description: "Delete functionality to be implemented.", variant: "destructive"})}} className="text-destructive hover:text-destructive" aria-label={`Delete ${center.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              No call centers have been added yet. Click "Add New Call Center" to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
