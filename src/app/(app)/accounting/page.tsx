"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
// More imports will be needed for tables, dialogs, forms etc.
// import { getAllInvoices, updateInvoiceStatus, generateNewInvoice } from "@/lib/accounting-mock";
// import type { Invoice, CallCenter } from "@/types";
// import { useCallCenter } from "@/contexts/CallCenterContext"; // To get allCallCenters for rate setting

export default function AccountingPage() {
  const { currentUser, isLoading: authLoading } = useAuth();
  // const { allCallCenters, isLoading: ccLoading } = useCallCenter();
  // const [invoices, setInvoices] = useState<Invoice[]>([]);
  // const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   if (!authLoading && !ccLoading) {
  //     setInvoices(getAllInvoices());
  //     setIsLoading(false);
  //   }
  // }, [authLoading, ccLoading]);

  if (authLoading) {
    return <div>Loading user data...</div>; // Replace with Skeleton
  }

  if (currentUser?.role !== "SUPER_ADMIN") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You do not have permission to access this page.</p>
        </CardContent>
      </Card>
    );
  }

  // const summary = {
  //   totalRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
  //   pendingInvoices: invoices.filter(i => i.status === 'pending').length,
  //   overdueInvoices: invoices.filter(i => i.status === 'overdue').length,
  // };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Accounting Dashboard</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (Mock)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">From paid invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices (Mock)</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices (Mock)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rate_management">Rate Management</TabsTrigger>
          <TabsTrigger value="invoice_management">Invoice Management</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Accounting Overview</CardTitle>
              <CardDescription>Summary of financial activities and billing status.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Detailed overview statistics and charts will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="rate_management" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Call Center Billing Rate Management</CardTitle>
              <CardDescription>Set and manage billing rates for each call center.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Table for call center rate management will be implemented here.</p>
              {/* This will involve listing allCallCenters and allowing edit of billingConfig */}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="invoice_management" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Management</CardTitle>
              <CardDescription>View, generate, and manage invoices for all call centers.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button>Generate New Invoice (Coming Soon)</Button>
              <p className="mt-4">Table for invoices (view, mark paid) will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}