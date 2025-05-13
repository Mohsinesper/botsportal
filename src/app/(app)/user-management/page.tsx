
"use client";

import { useState, useEffect } from "react";
import { useForm, Controller }  from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, UserCog, Edit2, Trash2, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { User, UserRole, CallCenter } from "@/types";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
// Required imports for FormField, FormItem, FormControl, FormLabel from shadcn/ui
import {
  Form,
  FormControl as ShadFormControl, // Renamed to avoid conflict if needed elsewhere
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";


const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["SUPER_ADMIN", "CALL_CENTER_ADMIN", "DESIGN_ADMIN"]),
  assignedCallCenterIds: z.array(z.string()).optional(),
});

type UserFormData = z.infer<typeof userSchema>;

export default function UserManagementPage() {
  const { currentUser, users, addUser, updateUser, isLoading: isAuthLoading } = useAuth();
  const { allCallCenters, isLoading: isCallCenterLoading } = useCallCenter(); 
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const formMethods = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      name: "",
      role: "DESIGN_ADMIN", 
      assignedCallCenterIds: [],
    },
  });

  const selectedRole = formMethods.watch("role");

  useEffect(() => {
    if (editingUser) {
      formMethods.reset({
        id: editingUser.id,
        email: editingUser.email,
        name: editingUser.name || "",
        role: editingUser.role,
        assignedCallCenterIds: editingUser.assignedCallCenterIds || [],
      });
    } else {
      formMethods.reset({ email: "", name: "", role: "DESIGN_ADMIN", assignedCallCenterIds: [] });
    }
  }, [editingUser, formMethods]);

  const onSubmit = (data: UserFormData) => {
    const userDataForStorage: Partial<User> = { 
        email: data.email,
        name: data.name,
        role: data.role,
        assignedCallCenterIds: (data.role === "CALL_CENTER_ADMIN" || data.role === "DESIGN_ADMIN") ? data.assignedCallCenterIds : undefined,
    };

    if (editingUser) {
      updateUser({ ...editingUser, ...userDataForStorage });
      toast({ title: "User Updated", description: `User "${data.name}" has been updated.` });
    } else {
      addUser(userDataForStorage as Omit<User, "id">);
      toast({ title: "User Added", description: `User "${data.name}" has been added.` });
    }
    setIsDialogOpen(false);
    setEditingUser(null);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (userId: string) => {
    toast({ title: "Delete Action (Mock)", description: `User ${userId} delete action triggered. Implement actual deletion.`, variant: "destructive"});
  };

  const isLoading = isAuthLoading || isCallCenterLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-3/4 md:w-1/2" />
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (currentUser?.role !== "SUPER_ADMIN") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You do not have permission to access user management.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight flex items-center"><Users className="mr-3 h-8 w-8" /> User Management</h2>
        <Button onClick={() => { setEditingUser(null); setIsDialogOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New User
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingUser(null);
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              Manage user accounts and their permissions.
            </DialogDescription>
          </DialogHeader>
          <Form {...formMethods}>
            <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...formMethods.register("name")} className="mt-1" placeholder="e.g., Jane Doe" />
                {formMethods.formState.errors.name && <p className="text-sm text-destructive mt-1">{formMethods.formState.errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" {...formMethods.register("email")} className="mt-1" placeholder="e.g., user@example.com" />
                {formMethods.formState.errors.email && <p className="text-sm text-destructive mt-1">{formMethods.formState.errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Controller
                  name="role"
                  control={formMethods.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                        <SelectItem value="CALL_CENTER_ADMIN">Call Center Admin</SelectItem>
                        <SelectItem value="DESIGN_ADMIN">Design Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {formMethods.formState.errors.role && <p className="text-sm text-destructive mt-1">{formMethods.formState.errors.role.message}</p>}
              </div>

              {(selectedRole === "CALL_CENTER_ADMIN" || selectedRole === "DESIGN_ADMIN") && (
                <div>
                  <Label>Assigned Call Centers</Label>
                  {allCallCenters.length > 0 ? (
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border p-3 rounded-md">
                      {allCallCenters.map((cc) => (
                        <FormField
                          key={cc.id}
                          control={formMethods.control}
                          name="assignedCallCenterIds"
                          render={({ field }) => {
                            return (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <ShadFormControl>
                                  <Checkbox
                                    checked={field.value?.includes(cc.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), cc.id])
                                        : field.onChange(
                                            (field.value || []).filter(
                                              (value) => value !== cc.id
                                            )
                                          )
                                    }}
                                  />
                                </ShadFormControl>
                                <FormLabel className="font-normal text-sm">
                                  {cc.name} ({cc.location || 'N/A'})
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">No call centers available to assign. Please <Link href="/call-centers" className="underline">add call centers</Link> first.</p>
                  )}
                  {formMethods.formState.errors.assignedCallCenterIds && <p className="text-sm text-destructive mt-1">{formMethods.formState.errors.assignedCallCenterIds.message}</p>}
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editingUser ? "Save Changes" : "Add User"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>List of all users in the system.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned Call Centers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge variant={user.role === "SUPER_ADMIN" ? "default" : "secondary"}>{user.role.replace("_", " ")}</Badge></TableCell>
                    <TableCell className="text-xs max-w-xs truncate">
                      {user.assignedCallCenterIds && user.assignedCallCenterIds.length > 0
                        ? user.assignedCallCenterIds.map(id => allCallCenters.find(cc => cc.id === id)?.name || id).join(", ")
                        : (user.role === "SUPER_ADMIN" ? "All" : "None")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(user)} className="mr-2" aria-label={`Edit ${user.name}`}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)} className="text-destructive hover:text-destructive" aria-label={`Delete ${user.name}`} disabled={currentUser?.id === user.id /* Cannot delete self */}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              No users found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
