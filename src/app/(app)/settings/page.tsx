
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, KeyRound, ShieldCheck, Lock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const emailSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
  confirmEmail: z.string().email("Invalid email address"),
}).refine(data => data.newEmail === data.confirmEmail, {
  message: "Emails do not match",
  path: ["confirmEmail"],
});
type EmailFormData = z.infer<typeof emailSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match",
  path: ["confirmPassword"],
});
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const [is2FAEnabled, setIs2FAEnabled] = useState(currentUser?.is2FAEnabled || false); // Assuming User type has is2FAEnabled

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { newEmail: "", confirmEmail: "" },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const handleEmailSubmit = (data: EmailFormData) => {
    // Mock implementation
    toast({ title: "Email Change Requested", description: `An email has been sent to ${data.newEmail} to confirm the change. (Mocked)` });
    emailForm.reset();
  };

  const handlePasswordSubmit = (data: PasswordFormData) => {
    // Mock implementation
    toast({ title: "Password Changed", description: "Your password has been successfully changed. (Mocked)" });
    passwordForm.reset();
  };

  const handle2FAToggle = (enabled: boolean) => {
    setIs2FAEnabled(enabled);
    // Mock implementation
    toast({ title: "2FA Status Updated", description: `Two-Factor Authentication is now ${enabled ? 'enabled' : 'disabled'}. (Mocked)` });
    // In a real app, you'd trigger the 2FA setup/disable flow here.
  };

  if (authLoading) {
     return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-1/4" />
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-40 w-full lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Card>
        <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
        <CardContent><p>You must be logged in to access settings.</p></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight">Account Settings</h2>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Mail className="mr-2 h-5 w-5 text-primary" /> Change Email Address</CardTitle>
          <CardDescription>Update the email address associated with your account.</CardDescription>
        </CardHeader>
        <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentEmail">Current Email</Label>
              <Input id="currentEmail" type="email" value={currentUser.email} disabled className="mt-1 bg-muted/50" />
            </div>
            <div>
              <Label htmlFor="newEmail">New Email Address</Label>
              <Input id="newEmail" type="email" {...emailForm.register("newEmail")} className="mt-1" />
              {emailForm.formState.errors.newEmail && <p className="text-sm text-destructive mt-1">{emailForm.formState.errors.newEmail.message}</p>}
            </div>
            <div>
              <Label htmlFor="confirmEmail">Confirm New Email Address</Label>
              <Input id="confirmEmail" type="email" {...emailForm.register("confirmEmail")} className="mt-1" />
              {emailForm.formState.errors.confirmEmail && <p className="text-sm text-destructive mt-1">{emailForm.formState.errors.confirmEmail.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={emailForm.formState.isSubmitting}>
              {emailForm.formState.isSubmitting ? "Updating..." : "Update Email"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Separator />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><KeyRound className="mr-2 h-5 w-5 text-primary" /> Change Password</CardTitle>
          <CardDescription>Choose a strong, unique password.</CardDescription>
        </CardHeader>
        <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" {...passwordForm.register("currentPassword")} className="mt-1" />
              {passwordForm.formState.errors.currentPassword && <p className="text-sm text-destructive mt-1">{passwordForm.formState.errors.currentPassword.message}</p>}
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" {...passwordForm.register("newPassword")} className="mt-1" />
              {passwordForm.formState.errors.newPassword && <p className="text-sm text-destructive mt-1">{passwordForm.formState.errors.newPassword.message}</p>}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" {...passwordForm.register("confirmPassword")} className="mt-1" />
              {passwordForm.formState.errors.confirmPassword && <p className="text-sm text-destructive mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting ? "Changing..." : "Change Password"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Separator />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-primary" /> Two-Factor Authentication (2FA)</CardTitle>
          <CardDescription>Add an extra layer of security to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="twoFactorAuth"
              checked={is2FAEnabled}
              onCheckedChange={handle2FAToggle}
              aria-label="Toggle Two-Factor Authentication"
            />
            <Label htmlFor="twoFactorAuth" className="text-base">
              {is2FAEnabled ? "2FA Enabled" : "2FA Disabled"}
            </Label>
          </div>
          {is2FAEnabled && (
            <p className="text-sm text-muted-foreground mt-3">
              Authenticator app configured. (Mocked - In a real app, you'd show recovery codes or management options here).
            </p>
          )}
           {!is2FAEnabled && (
            <p className="text-sm text-muted-foreground mt-3">
              Enable 2FA to enhance your account security. You'll need an authenticator app.
            </p>
          )}
        </CardContent>
         <CardFooter className="border-t pt-6">
            <Button disabled={is2FAEnabled} onClick={() => toast({title: "Setup 2FA (Mock)", description: "Initiate 2FA setup flow..."})}>
              <Lock className="mr-2 h-4 w-4" />
              Setup 2FA
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
