
"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DollarSign, FileText, AlertTriangle, CheckCircle2, Edit, PlusCircle, CalendarIcon, Settings, FilterX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { getAllInvoices, updateInvoiceStatus, generateNewInvoice, getInvoiceById } from "@/lib/accounting-mock";
import type { Invoice, CallCenter, BillingRateType, InvoiceStatus } from "@/types";
import { toast } from "@/hooks/use-toast";
import { format, parseISO } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const billingConfigSchema = z.object({
  rateType: z.enum(["per_call", "per_hour", "per_day", "per_month"]),
  amount: z.coerce.number().min(0, "Amount must be non-negative"),
  currency: z.string().min(3, "Currency code must be 3 characters").max(3, "Currency code must be 3 characters").default("USD"),
});
type BillingConfigFormData = z.infer<typeof billingConfigSchema>;

const generateInvoiceSchema = z.object({
  callCenterId: z.string().min(1, "Call center is required"),
  issueDate: z.date({ required_error: "Issue date is required." }),
  dueDate: z.date({ required_error: "Due date is required." }),
  notes: z.string().optional(),
});
type GenerateInvoiceFormData = z.infer<typeof generateInvoiceSchema>;


export default function AccountingPage() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const { allCallCenters, updateCallCenterBillingConfig, isLoading: ccLoading } = useCallCenter();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);
  const [editingRateCallCenter, setEditingRateCallCenter] = useState<CallCenter | null>(null);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);

  const rateForm = useForm<BillingConfigFormData>({
    resolver: zodResolver(billingConfigSchema),
    defaultValues: { rateType: "per_month", amount: 0, currency: "USD" },
  });

  const invoiceForm = useForm<GenerateInvoiceFormData>({
    resolver: zodResolver(generateInvoiceSchema),
  });

  useEffect(() => {
    if (!authLoading && !ccLoading) {
      setInvoices(getAllInvoices());
      setIsLoadingData(false);
    }
  }, [authLoading, ccLoading]);
  
  useEffect(() => {
    if (editingRateCallCenter?.billingConfig) {
      rateForm.reset(editingRateCallCenter.billingConfig);
    } else {
      rateForm.reset({ rateType: "per_month", amount: 0, currency: "USD" });
    }
  }, [editingRateCallCenter, rateForm]);

  const handleOpenRateDialog = (callCenter: CallCenter) => {
    setEditingRateCallCenter(callCenter);
    setIsRateDialogOpen(true);
  };

  const handleSaveRateConfig = (data: BillingConfigFormData) => {
    if (!editingRateCallCenter) return;
    const updatedCallCenter = updateCallCenterBillingConfig(editingRateCallCenter.id, data);
    if (updatedCallCenter) {
      toast({ title: "Billing Rate Updated", description: `Rates for ${updatedCallCenter.name} saved.` });
    } else {
      toast({ title: "Error", description: "Failed to update billing rate.", variant: "destructive" });
    }
    setIsRateDialogOpen(false);
    setEditingRateCallCenter(null);
  };

  const handleGenerateInvoice = (data: GenerateInvoiceFormData) => {
    const result = generateNewInvoice(data.callCenterId, data.issueDate, data.dueDate, data.notes);
    if ("error" in result) {
      toast({ title: "Invoice Generation Failed", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Invoice Generated", description: `Invoice ${result.invoiceNumber} created.` });
      setInvoices(getAllInvoices()); // Refresh invoices
    }
    setIsInvoiceFormOpen(false);
    invoiceForm.reset();
  };

  const handleMarkAsPaid = (invoiceId: string) => {
    updateInvoiceStatus(invoiceId, "paid");
    setInvoices(getAllInvoices()); // Refresh
    toast({ title: "Invoice Updated", description: `Invoice marked as paid.` });
  };

  const isOverdue = (invoice: Invoice): boolean => {
    return new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' && invoice.status !== 'cancelled';
  };

  const summary = {
    totalRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
    pendingInvoicesCount: invoices.filter(i => i.status === 'pending').length,
    overdueInvoicesCount: invoices.filter(isOverdue).length,
  };

  if (isLoadingData || authLoading || ccLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-3/4 md:w-1/2" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (currentUser?.role !== "SUPER_ADMIN") {
    return (
      <Card>
        <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
        <CardContent><p>You do not have permission to access this page.</p></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Accounting Dashboard</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From paid invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pendingInvoicesCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.overdueInvoicesCount}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoice_management">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rate_management">Rate Management</TabsTrigger>
          <TabsTrigger value="invoice_management">Invoice Management</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Accounting Overview</CardTitle>
              <CardDescription>Summary of financial activities and billing status. More charts coming soon.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Detailed overview statistics and charts will be implemented here.</p>
              {/* Future: Add charts for revenue trends, payment status distribution, etc. */}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Call Center</TableHead>
                    <TableHead>Rate Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allCallCenters.map((cc) => (
                    <TableRow key={cc.id}>
                      <TableCell>{cc.name}</TableCell>
                      <TableCell>{cc.billingConfig?.rateType || "Not Set"}</TableCell>
                      <TableCell>{cc.billingConfig?.amount?.toFixed(2) || "N/A"}</TableCell>
                      <TableCell>{cc.billingConfig?.currency || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenRateDialog(cc)}>
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="invoice_management" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Invoice Management</CardTitle>
                    <CardDescription>View, generate, and manage invoices for all call centers.</CardDescription>
                </div>
                <Button onClick={() => { invoiceForm.reset(); setIsInvoiceFormOpen(true); }}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Generate New Invoice
                </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Call Center</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id} className={isOverdue(inv) ? "bg-destructive/10" : ""}>
                      <TableCell>{inv.invoiceNumber}</TableCell>
                      <TableCell>{allCallCenters.find(cc => cc.id === inv.callCenterId)?.name || 'Unknown CC'}</TableCell>
                      <TableCell>{format(parseISO(inv.issueDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>{format(parseISO(inv.dueDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>${inv.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          inv.status === 'paid' ? 'bg-green-100 text-green-700' : 
                          inv.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                          inv.status === 'overdue' || isOverdue(inv) ? 'bg-red-100 text-red-700' : 
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {isOverdue(inv) && inv.status !== 'paid' ? 'Overdue' : inv.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                          <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid(inv.id)}>
                            Mark Paid
                          </Button>
                        )}
                        {/* Future: View Details button */}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for Editing Billing Rate */}
      <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Billing Rate for {editingRateCallCenter?.name}</DialogTitle>
            <DialogDescription>Set the billing configuration for this call center.</DialogDescription>
          </DialogHeader>
          <form onSubmit={rateForm.handleSubmit(handleSaveRateConfig)} className="space-y-4">
            <div>
              <Label htmlFor="rateType">Rate Type</Label>
              <Controller
                name="rateType"
                control={rateForm.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select rate type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_call">Per Call</SelectItem>
                      <SelectItem value="per_hour">Per Hour</SelectItem>
                      <SelectItem value="per_day">Per Day</SelectItem>
                      <SelectItem value="per_month">Per Month</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {rateForm.formState.errors.rateType && <p className="text-sm text-destructive mt-1">{rateForm.formState.errors.rateType.message}</p>}
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" {...rateForm.register("amount")} />
              {rateForm.formState.errors.amount && <p className="text-sm text-destructive mt-1">{rateForm.formState.errors.amount.message}</p>}
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" {...rateForm.register("currency")} placeholder="USD" />
              {rateForm.formState.errors.currency && <p className="text-sm text-destructive mt-1">{rateForm.formState.errors.currency.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRateDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Configuration</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog for Generating New Invoice */}
      <Dialog open={isInvoiceFormOpen} onOpenChange={setIsInvoiceFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate New Invoice</DialogTitle>
            <DialogDescription>Create a new invoice for a call center.</DialogDescription>
          </DialogHeader>
          <form onSubmit={invoiceForm.handleSubmit(handleGenerateInvoice)} className="space-y-4">
             <div>
              <Label htmlFor="callCenterId">Call Center</Label>
              <Controller
                name="callCenterId"
                control={invoiceForm.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select call center" /></SelectTrigger>
                    <SelectContent>
                      {allCallCenters.filter(cc => cc.billingConfig).map(cc => (
                        <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
               {invoiceForm.formState.errors.callCenterId && <p className="text-sm text-destructive mt-1">{invoiceForm.formState.errors.callCenterId.message}</p>}
            </div>
            <div>
                <Label htmlFor="issueDate">Issue Date</Label>
                <Controller
                    name="issueDate"
                    control={invoiceForm.control}
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                        </Popover>
                    )}
                />
                {invoiceForm.formState.errors.issueDate && <p className="text-sm text-destructive mt-1">{invoiceForm.formState.errors.issueDate.message}</p>}
            </div>
             <div>
                <Label htmlFor="dueDate">Due Date</Label>
                 <Controller
                    name="dueDate"
                    control={invoiceForm.control}
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                        </Popover>
                    )}
                />
                {invoiceForm.formState.errors.dueDate && <p className="text-sm text-destructive mt-1">{invoiceForm.formState.errors.dueDate.message}</p>}
            </div>
            <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea id="notes" {...invoiceForm.register("notes")} placeholder="Any additional notes for the invoice..."/>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsInvoiceFormOpen(false)}>Cancel</Button>
              <Button type="submit">Generate Invoice</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}

    