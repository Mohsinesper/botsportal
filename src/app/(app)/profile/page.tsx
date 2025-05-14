
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle, Mail, ShieldCheck, Building } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const { allCallCenters, isLoading: ccLoading } = useCallCenter();

  const isLoading = authLoading || ccLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-1/4" />
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
             <div className="flex items-center space-x-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-40" />
                </div>
            </div>
             <div className="flex items-center space-x-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                 <div className="space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
             <div className="flex items-center space-x-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                 <div className="space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>User Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please log in to view your profile.</p>
        </CardContent>
      </Card>
    );
  }

  const getAssignedCallCenterNames = () => {
    if (!currentUser?.assignedCallCenterIds || currentUser.assignedCallCenterIds.length === 0) {
      return "None";
    }
    return currentUser.assignedCallCenterIds
      .map(id => {
        const center = allCallCenters.find(cc => cc.id === id);
        return center?.name || `Unknown Center (ID: ${id.slice(-4)})`;
      })
      .join(", ");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
      <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={`https://picsum.photos/seed/${currentUser.id}/200/200`} alt={currentUser.name || currentUser.email} data-ai-hint="profile avatar" />
            <AvatarFallback>
              <UserCircle className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{currentUser.name || "User Name Not Set"}</CardTitle>
          <CardDescription>{currentUser.email}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="grid grid-cols-1 gap-6">
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-base">Email Address</p>
                <p className="text-muted-foreground">{currentUser.email}</p>
              </div>
            </div>
             <div className="flex items-start space-x-3">
              <ShieldCheck className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-base">Role</p>
                <p className="text-muted-foreground capitalize">{currentUser.role.replace("_", " ").toLowerCase()}</p>
              </div>
            </div>
            {(currentUser.role === "CALL_CENTER_ADMIN" || currentUser.role === "DESIGN_ADMIN") && (
                 <div className="flex items-start space-x-3">
                    <Building className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-base">Assigned Call Centers</p>
                        <p className="text-muted-foreground">{getAssignedCallCenterNames()}</p>
                    </div>
                </div>
            )}
             {currentUser.role === "SUPER_ADMIN" && (
                 <div className="flex items-start space-x-3">
                    <Building className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-base">Assigned Call Centers</p>
                        <p className="text-muted-foreground">All (Super Admin)</p>
                    </div>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
