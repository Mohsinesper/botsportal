
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wand2, Copy } from "lucide-react";
import { generateMasterScript, type MasterScriptInput, type MasterScriptOutput } from "@/ai/flows/master-script-generator";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const masterScriptSchema = z.object({
  productDescription: z.string().min(20, "Product description must be at least 20 characters"),
  targetAudience: z.string().min(10, "Target audience description is required"),
  callObjective: z.string().min(5, "Call objective is required"),
  keyTalkingPoints: z.string().min(10, "Please provide some key talking points"),
  tone: z.string().min(3, "Tone is required"),
  variantCount: z.coerce.number().int().min(1).max(5),
});

type MasterScriptFormData = z.infer<typeof masterScriptSchema>;

// Server action to call the Genkit flow
async function handleGenerateScript(data: MasterScriptInput): Promise<MasterScriptOutput | { error: string }> {
  "use server";
  try {
    const result = await generateMasterScript(data);
    return result;
  } catch (error) {
    console.error("Error generating master script:", error);
    return { error: error instanceof Error ? error.message : "An unknown error occurred." };
  }
}

export default function MasterScriptGeneratorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<MasterScriptOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, register, formState: { errors } } = useForm<MasterScriptFormData>({
    resolver: zodResolver(masterScriptSchema),
    defaultValues: {
      productDescription: "",
      targetAudience: "",
      callObjective: "",
      keyTalkingPoints: "",
      tone: "Professional",
      variantCount: 3,
    }
  });

  const onSubmit = async (data: MasterScriptFormData) => {
    setIsLoading(true);
    setError(null);
    setGeneratedScript(null);

    const result = await handleGenerateScript(data);

    if ("error" in result) {
      setError(result.error);
      toast({ title: "Error Generating Script", description: result.error, variant: "destructive" });
    } else {
      setGeneratedScript(result);
      toast({ title: "Script Generated Successfully!", description: "Master script and variants are ready." });
    }
    setIsLoading(false);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to Clipboard", description: `${type} has been copied.` });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Master Script Generator</h2>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Generate AI-Powered Scripts</CardTitle>
          <CardDescription>Provide details about your campaign, and let AI create a master script and variants for your call center agents.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="productDescription">Product/Service Description</Label>
              <Textarea id="productDescription" {...register("productDescription")} className="mt-1 min-h-[100px]" placeholder="e.g., Our new SaaS platform helps businesses streamline their workflow..." />
              {errors.productDescription && <p className="text-sm text-destructive mt-1">{errors.productDescription.message}</p>}
            </div>
            <div>
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input id="targetAudience" {...register("targetAudience")} className="mt-1" placeholder="e.g., Small to medium-sized e-commerce businesses" />
              {errors.targetAudience && <p className="text-sm text-destructive mt-1">{errors.targetAudience.message}</p>}
            </div>
            <div>
              <Label htmlFor="callObjective">Call Objective</Label>
              <Input id="callObjective" {...register("callObjective")} className="mt-1" placeholder="e.g., Schedule a demo, Close a sale, Gather feedback" />
              {errors.callObjective && <p className="text-sm text-destructive mt-1">{errors.callObjective.message}</p>}
            </div>
            <div>
              <Label htmlFor="keyTalkingPoints">Key Talking Points (comma-separated)</Label>
              <Textarea id="keyTalkingPoints" {...register("keyTalkingPoints")} className="mt-1" placeholder="e.g., Feature X, Benefit Y, Special offer Z" />
              {errors.keyTalkingPoints && <p className="text-sm text-destructive mt-1">{errors.keyTalkingPoints.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tone">Desired Tone</Label>
                 <Controller
                    name="tone"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <Label htmlFor="variantCount">Number of Variants (1-5)</Label>
                <Input id="variantCount" type="number" {...register("variantCount")} className="mt-1" min="1" max="5" />
                {errors.variantCount && <p className="text-sm text-destructive mt-1">{errors.variantCount.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Generate Scripts
            </Button>
          </CardFooter>
        </form>
      </Card>

      {error && (
        <Card className="border-destructive bg-destructive/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-destructive">Generation Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {generatedScript && (
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Master Script</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedScript.masterScript, "Master Script")}>
                <Copy className="mr-2 h-4 w-4" /> Copy
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-72 w-full rounded-md border p-4 bg-muted/30">
                <pre className="whitespace-pre-wrap text-sm">{generatedScript.masterScript}</pre>
              </ScrollArea>
            </CardContent>
          </Card>

          {generatedScript.variants.map((variant, index) => (
            <Card key={index} className="shadow-lg">
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>Variant {index + 1}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(variant, `Variant ${index + 1}`)}>
                  <Copy className="mr-2 h-4 w-4" /> Copy
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-60 w-full rounded-md border p-4 bg-muted/30">
                  <pre className="whitespace-pre-wrap text-sm">{variant}</pre>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
