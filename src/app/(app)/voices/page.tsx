
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlusCircle, Edit2, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import type { Voice } from "@/types";
import { useCallCenter } from "@/contexts/CallCenterContext";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

const voiceSchemaBase = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Voice name must be at least 2 characters"),
  provider: z.string().optional(),
  settings: z.string().optional().refine((val) => {
    if (!val) return true;
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, { message: "Settings must be valid JSON or empty"}),
  // callCenterId is handled by context
});

type VoiceFormData = z.infer<typeof voiceSchemaBase>;

const allMockVoices: Voice[] = [
  { id: "v1", name: "Ava - Friendly Female (CC1)", provider: "ElevenLabs", settings: { stability: 0.7, clarity: 0.8 }, callCenterId: "cc1" },
  { id: "v2", name: "John - Professional Male (CC1)", provider: "GoogleTTS", settings: { pitch: -2, speed: 1.0 }, callCenterId: "cc1" },
  { id: "v3", name: "Mia - Empathetic Female (CC2)", provider: "ElevenLabs", settings: { stability: 0.6, clarity: 0.75, style_exaggeration: 0.2 }, callCenterId: "cc2" },
  { id: "v4", name: "Echo - Standard Male (CC2)", provider: "GoogleTTS", settings: { pitch: 0, speed: 1.0 }, callCenterId: "cc2" },
  { id: "v5", name: "Zoe - Clear Announcer (CC3)", provider: "AzureTTS", settings: { style: "newscast-formal" }, callCenterId: "cc3"},
];

export default function VoicesPage() {
  const { currentCallCenter, isLoading: isCallCenterLoading } = useCallCenter();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVoice, setEditingVoice] = useState<Voice | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<VoiceFormData>({
    resolver: zodResolver(voiceSchemaBase),
    defaultValues: { 
      name: "", 
      provider: "", 
      settings: "",
    },
  });

  useEffect(() => {
    if (currentCallCenter) {
      setVoices(allMockVoices.filter(v => v.callCenterId === currentCallCenter.id));
    } else {
      setVoices([]);
    }
  }, [currentCallCenter]);

  const onSubmit = (data: VoiceFormData) => {
    if (!currentCallCenter) {
      toast({ title: "Error", description: "No call center selected.", variant: "destructive"});
      return;
    }

    const voiceData: Voice = {
      ...data,
      id: editingVoice ? editingVoice.id : `v-${Date.now()}`,
      settings: data.settings ? JSON.parse(data.settings) : undefined,
      callCenterId: currentCallCenter.id,
    };

    if (editingVoice) {
      const updatedAllMockVoices = allMockVoices.map(v => v.id === editingVoice.id ? voiceData : v);
      allMockVoices.splice(0, allMockVoices.length, ...updatedAllMockVoices);
      setVoices(updatedAllMockVoices.filter(v => v.callCenterId === currentCallCenter.id));
      toast({ title: "Voice Updated", description: `Voice "${voiceData.name}" updated.` });
    } else {
      allMockVoices.push(voiceData);
      setVoices(prev => [...prev, voiceData]);
      toast({ title: "Voice Added", description: `Voice "${voiceData.name}" added.` });
    }
    setIsDialogOpen(false);
    reset({ name: "", provider: "", settings: "" });
    setEditingVoice(null);
  };

  const handleEdit = (voice: Voice) => {
    setEditingVoice(voice);
    reset({
      name: voice.name,
      provider: voice.provider,
      settings: voice.settings ? JSON.stringify(voice.settings, null, 2) : "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const index = allMockVoices.findIndex(v => v.id === id);
    if (index > -1) allMockVoices.splice(index, 1);
    setVoices(voices.filter(v => v.id !== id));
    toast({ title: "Voice Deleted", variant: "destructive" });
  };

  if (isCallCenterLoading) {
     return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card className="shadow-lg">
          <CardContent className="p-0">
             <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentCallCenter) {
    return (
       <div className="space-y-6">
        <div className="flex justify-between items-center">
           <h2 className="text-3xl font-bold tracking-tight">Voice Management</h2>
        </div>
         <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>No Call Center Selected</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Please select a call center from the header or <Link href="/call-centers" className="text-primary underline">add and select a call center</Link> to manage voices.</p>
            </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Voice Management ({currentCallCenter.name})</h2>
        <Button onClick={() => { 
          setEditingVoice(null); 
          reset({ name: "", provider: "", settings: ""}); 
          setIsDialogOpen(true); 
        }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Voice
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
        setIsDialogOpen(isOpen);
        if (!isOpen) {
          setEditingVoice(null);
          reset({ name: "", provider: "", settings: ""});
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingVoice ? "Edit Voice" : "Add New Voice"}</DialogTitle>
            <DialogDescription>
              This voice will be associated with the '{currentCallCenter.name}'.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Voice Name</Label>
              <Input id="name" {...register("name")} className="mt-1" />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="provider">Provider (Optional)</Label>
              <Input id="provider" {...register("provider")} className="mt-1" placeholder="e.g., ElevenLabs, GoogleTTS" />
            </div>
            <div>
              <Label htmlFor="settings">Settings (JSON, Optional)</Label>
              <textarea
                id="settings"
                {...register("settings")}
                className="mt-1 w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder={'{\n  "stability": 0.7,\n  "clarity": 0.8\n}'}
              />
              {errors.settings && <p className="text-sm text-destructive mt-1">{errors.settings.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingVoice ? "Save Changes" : "Add Voice"}</Button>
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
                <TableHead>Provider</TableHead>
                <TableHead>Settings Preview</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {voices.length > 0 ? voices.map((voice) => (
                <TableRow key={voice.id}>
                  <TableCell className="font-medium">{voice.name}</TableCell>
                  <TableCell>{voice.provider || "N/A"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate max-w-xs">
                    {voice.settings ? JSON.stringify(voice.settings) : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                     <Button variant="ghost" size="sm" onClick={() => handleEdit(voice)} className="mr-2">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(voice.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">No voices configured for this call center yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
