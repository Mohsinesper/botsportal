"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCallCenter } from "@/contexts/CallCenterContext";
// import { getInvoicesByCallCenterId } from "@/lib/accounting-mock";
// import type { Invoice } from "@/types";
import Link from "next/link";

export default function BillingPage() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const { currentCallCenter, isLoading: ccLoading } = useCallCenter();
  // const [invoices, setInvoices] = useState<Invoice[]>([]);
  // const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   if (!authLoading && !ccLoading && currentCallCenter) {
  //     setInvoices(getInvoicesByCallCenterId(currentCallCenter.id));
  //     setIsLoading(false);
  //   } else if (!authLoading && !ccLoading && !currentCallCenter) {
  //     setIsLoading(false); // No call center selected
  //   }
  // }, [authLoading, ccLoading, currentCallCenter]);

  if (authLoading || ccLoading) {
    return <div>Loading data...</div>; // Replace with Skeleton
  }

  if (!currentUser || currentUser.role !== "CALL_CENTER_ADMIN") {
     // Also allow SUPER_ADMIN to see this page for a selected call center? For now, strictly CC_ADMIN.
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You do not have permission to access this page or no call center is selected for your role.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!currentCallCenter) {
    return (
       <Card>
        <CardHeader>
          <CardTitle>No Call Center Selected</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please select a call center from the header to view billing information.</p>
           <p className="mt-2">If you are a Super Admin, you can manage call centers <Link href="/call-centers" className="text-primary underline">here</Link>.</p>
        </CardContent>
      </Card>
    );
  }
  
  // const billingSummary = {
  //   amountDue: invoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((sum, i) => sum + i.total, 0),
  //   totalPaid: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
  // };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Billing Overview for {currentCallCenter.name}</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Usage (Mock)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">Estimated for current period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount Due (Mock)</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">From pending/overdue invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid (Mock)</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">All-time payments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>Your past and current invoices for {currentCallCenter.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Invoice table will be implemented here.</p>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>Usage Details</CardTitle>
          <CardDescription>Details of your bot usage for {currentCallCenter.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Detailed usage statistics and charts will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}