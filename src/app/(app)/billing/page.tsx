
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { getInvoicesByCallCenterId } from "@/lib/accounting-mock";
import type { Invoice, InvoiceStatus } from "@/types";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function BillingPage() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const { currentCallCenter, isLoading: ccLoading } = useCallCenter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !ccLoading && currentCallCenter) {
      setInvoices(getInvoicesByCallCenterId(currentCallCenter.id));
      setIsLoading(false);
    } else if (!authLoading && !ccLoading && !currentCallCenter) {
      setIsLoading(false); // No call center selected
    }
  }, [authLoading, ccLoading, currentCallCenter]);

  const isOverdue = (invoice: Invoice): boolean => {
    try {
      return new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' && invoice.status !== 'cancelled';
    } catch (e) { return false; }
  };

  const billingSummary = useMemo(() => {
    const amountDue = invoices.filter(i => (i.status === 'pending' || i.status === 'draft' || isOverdue(i)) && i.status !== 'paid' && i.status !== 'cancelled').reduce((sum, i) => sum + i.total, 0);
    const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
    const overdueCount = invoices.filter(isOverdue).length;
    return { amountDue, totalPaid, overdueCount };
  }, [invoices]);

  if (isLoading || authLoading || ccLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-9 w-3/4 md:w-1/2" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
            <Card><Skeleton className="h-64 w-full" /></Card>
        </div>
    );
  }

  if (!currentUser || currentUser.role !== "CALL_CENTER_ADMIN") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You do not have permission to access this page. This page is for Call Center Admins.</p>
          {currentUser?.role === "SUPER_ADMIN" && <p className="mt-2">Super Admins should use the <Link href="/accounting" className="text-primary underline">Accounting</Link> page.</p>}
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
          <p>Please select a call center from the header to view its billing information.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Billing Overview for {currentCallCenter.name}</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount Due</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${billingSummary.amountDue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From pending & overdue invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${billingSummary.totalPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All-time payments for this center</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingSummary.overdueCount}</div>
            <p className="text-xs text-muted-foreground">Number of invoices past due</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>Your past and current invoices for {currentCallCenter.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Billing Period</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id} className={isOverdue(inv) ? "bg-destructive/10" : ""}>
                    <TableCell>{inv.invoiceNumber}</TableCell>
                    <TableCell>{format(parseISO(inv.issueDate), "MMM d, yyyy")}</TableCell>
                    <TableCell>{format(parseISO(inv.dueDate), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      {inv.billingPeriodStart && inv.billingPeriodEnd ?
                        `${format(parseISO(inv.billingPeriodStart), "MMM d, yyyy")} - ${format(parseISO(inv.billingPeriodEnd), "MMM d, yyyy")}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>${inv.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        inv.status === 'paid' ? 'default' :
                        isOverdue(inv) ? 'destructive' :
                        inv.status === 'pending' ? 'secondary' :
                        'outline'
                      } className="capitalize">
                         {isOverdue(inv) && inv.status !== 'paid' && inv.status !== 'cancelled' ? 'Overdue' : inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {inv.paidDate ? format(parseISO(inv.paidDate), "MMM d, yyyy") : inv.status === 'paid' ? 'Record Pending' : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No invoices found for {currentCallCenter.name}.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
