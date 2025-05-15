
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DollarSign, FileText, AlertTriangle, CheckCircle2, Edit, PlusCircle, CalendarIcon, Settings, FilterX, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { getAllInvoices, updateInvoiceStatus, generateNewInvoice } from "@/lib/accounting-mock";
import type { Invoice, CallCenter, BillingRateType, InvoiceStatus } from "@/types";
import { toast } from "@/hooks/use-toast";
import { format, parseISO, isValid, startOfMonth, endOfMonth } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { DateRange } from "react-day-picker";

const supportedCurrencies = ["USD", "EUR", "GBP"] as const;

const billingConfigSchema = z.object({
  rateType: z.enum(["per_call", "per_hour", "per_day", "per_month"]),
  amount: z.coerce.number().min(0, "Amount must be non-negative"),
  currency: z.enum(supportedCurrencies, { errorMap: () => ({ message: "Please select a valid currency." }) }).default("USD"),
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

  // Filters for Invoice Management
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | "all" | "overdue">("all");
  const [filterDateRange, setFilterDateRange] = useState<DateRange | undefined>(undefined);
  const [filterCallCenterId, setFilterCallCenterId] = useState<string | "all">("all");
  const [searchTermInvoices, setSearchTermInvoices] = useState("");

  // Search for Rate Management
  const [rateManagementSearchTerm, setRateManagementSearchTerm] = useState("");


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
      setInvoices(getAllInvoices()); 
    }
    setIsInvoiceFormOpen(false);
    invoiceForm.reset();
  };

  const handleMarkAsPaid = (invoiceId: string) => {
    updateInvoiceStatus(invoiceId, "paid");
    setInvoices(getAllInvoices()); 
    toast({ title: "Invoice Updated", description: `Invoice marked as paid.` });
  };

  const isOverdue = (invoice: Invoice): boolean => {
    try {
      return new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' && invoice.status !== 'cancelled';
    } catch (e) { return false; }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const invoiceIssueDate = parseISO(inv.issueDate);
      const matchesStatus = filterStatus === "all" || inv.status === filterStatus || (filterStatus === "overdue" && isOverdue(inv));
      const matchesCallCenter = filterCallCenterId === "all" || inv.callCenterId === filterCallCenterId;
      const matchesDate = !filterDateRange || !filterDateRange.from || !filterDateRange.to || 
                          (isValid(invoiceIssueDate) && invoiceIssueDate >= filterDateRange.from && invoiceIssueDate <= filterDateRange.to);
      const matchesSearch = searchTermInvoices === "" || 
                            inv.invoiceNumber.toLowerCase().includes(searchTermInvoices.toLowerCase()) ||
                            (allCallCenters.find(cc => cc.id === inv.callCenterId)?.name.toLowerCase().includes(searchTermInvoices.toLowerCase())) ||
                            (inv.notes && inv.notes.toLowerCase().includes(searchTermInvoices.toLowerCase()));
      return matchesStatus && matchesCallCenter && matchesDate && matchesSearch;
    });
  }, [invoices, filterStatus, filterDateRange, filterCallCenterId, searchTermInvoices, allCallCenters]);

  const filteredCallCentersForRateManagement = useMemo(() => {
    if (!rateManagementSearchTerm) return allCallCenters;
    return allCallCenters.filter(cc => 
      cc.name.toLowerCase().includes(rateManagementSearchTerm.toLowerCase())
    );
  }, [allCallCenters, rateManagementSearchTerm]);


  const summary = {
    totalRevenue: filteredInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
    pendingInvoicesCount: filteredInvoices.filter(i => i.status === 'pending' && !isOverdue(i)).length,
    overdueInvoicesCount: filteredInvoices.filter(isOverdue).length,
  };
  
  const invoiceStatusChartData = [
    { name: 'Paid', count: filteredInvoices.filter(i => i.status === 'paid').length },
    { name: 'Pending', count: summary.pendingInvoicesCount },
    { name: 'Overdue', count: summary.overdueInvoicesCount },
    { name: 'Draft', count: filteredInvoices.filter(i => i.status === 'draft').length },
    { name: 'Cancelled', count: filteredInvoices.filter(i => i.status === 'cancelled').length },
  ];


  const resetInvoiceFilters = () => {
    setFilterStatus("all");
    setFilterDateRange(undefined);
    setFilterCallCenterId("all");
    setSearchTermInvoices("");
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
            <CardTitle className="text-sm font-medium">Total Revenue (Filtered)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From paid invoices in current view</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices (Filtered)</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pendingInvoicesCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment in current view</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices (Filtered)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.overdueInvoicesCount}</div>
            <p className="text-xs text-muted-foreground">Past due date in current view</p>
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
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>Summary of invoice statuses based on current filters.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={invoiceStatusChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false}/>
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Invoice Count" />
                </BarChart>
              </ResponsiveContainer>
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
              <div className="mb-4">
                <Label htmlFor="rateManagementSearch">Search Call Centers</Label>
                 <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="rateManagementSearch"
                        placeholder="Search by call center name..."
                        value={rateManagementSearchTerm}
                        onChange={(e) => setRateManagementSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
              </div>
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
                  {filteredCallCentersForRateManagement.map((cc) => (
                    <TableRow key={cc.id}>
                      <TableCell>{cc.name}</TableCell>
                      <TableCell>{cc.billingConfig?.rateType?.replace("_", " ") || "Not Set"}</TableCell>
                      <TableCell>{cc.billingConfig?.amount?.toFixed(2) || "N/A"}</TableCell>
                      <TableCell>{cc.billingConfig?.currency || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenRateDialog(cc)}>
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCallCentersForRateManagement.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                            {allCallCenters.length === 0 ? "No call centers found." : "No call centers match your search."}
                        </TableCell>
                    </TableRow>
                  )}
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
                    <CardDescription>View, generate, and manage invoices. ({filteredInvoices.length} invoices shown)</CardDescription>
                </div>
                <Button onClick={() => { invoiceForm.reset(); setIsInvoiceFormOpen(true); }}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Generate New Invoice
                </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 border rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                  <div className="lg:col-span-2">
                    <Label htmlFor="invoiceSearch">Search Invoices</Label>
                    <div className="relative">
                       <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                       <Input 
                        id="invoiceSearch"
                        placeholder="Invoice #, CC Name, Notes..." 
                        value={searchTermInvoices} 
                        onChange={(e) => setSearchTermInvoices(e.target.value)}
                        className="pl-9"
                        />
                    </div>
                  </div>
                   <div>
                      <Label htmlFor="filterStatus">Status</Label>
                      <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as InvoiceStatus | "all" | "overdue")}>
                        <SelectTrigger id="filterStatus"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                   <div>
                      <Label htmlFor="filterCallCenter">Call Center</Label>
                      <Select value={filterCallCenterId} onValueChange={(value) => setFilterCallCenterId(value)}>
                        <SelectTrigger id="filterCallCenter"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Call Centers</SelectItem>
                          {allCallCenters.map(cc => <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                   </div>
                    <div>
                        <Label>Issue Date Range</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button id="date" variant={"outline"} className={`w-full justify-start text-left font-normal ${!filterDateRange && "text-muted-foreground"}`}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {filterDateRange?.from ? (
                                        filterDateRange.to ? (
                                            <>{format(filterDateRange.from, "LLL dd, y")} - {format(filterDateRange.to, "LLL dd, y")}</>
                                        ) : (
                                            format(filterDateRange.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date range</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={filterDateRange?.from}
                                    selected={filterDateRange}
                                    onSelect={setFilterDateRange}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <Button onClick={resetInvoiceFilters} variant="outline" size="sm"><FilterX className="mr-2 h-4 w-4" /> Reset Filters</Button>
              </div>

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
                  {filteredInvoices.map((inv) => (
                    <TableRow key={inv.id} className={isOverdue(inv) ? "bg-destructive/10" : ""}>
                      <TableCell>{inv.invoiceNumber}</TableCell>
                      <TableCell>{allCallCenters.find(cc => cc.id === inv.callCenterId)?.name || 'Unknown CC'}</TableCell>
                      <TableCell>{format(parseISO(inv.issueDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>{format(parseISO(inv.dueDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>${inv.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          inv.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300' : 
                          inv.status === 'pending' && !isOverdue(inv) ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300' : 
                          isOverdue(inv) ? 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300' : 
                          inv.status === 'draft' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300' :
                          inv.status === 'cancelled' ? 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300'
                        } capitalize`}>
                          {isOverdue(inv) && inv.status !== 'paid' && inv.status !== 'cancelled' ? 'Overdue' : inv.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                          <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid(inv.id)}>
                            Mark Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                   {filteredInvoices.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center h-24">
                            {invoices.length === 0 ? "No invoices found." : "No invoices match your current filters."}
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
              <Controller
                name="currency"
                control={rateForm.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                    <SelectContent>
                      {supportedCurrencies.map(curr => (
                        <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {rateForm.formState.errors.currency && <p className="text-sm text-destructive mt-1">{rateForm.formState.errors.currency.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRateDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Configuration</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isInvoiceFormOpen} onOpenChange={setIsInvoiceFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate New Invoice</DialogTitle>
            <DialogDescription>Create a new invoice for a call center.</DialogDescription>
          </DialogHeader>
          <form onSubmit={invoiceForm.handleSubmit(handleGenerateInvoice)} className="space-y-4">
             <div>
              <Label htmlFor="callCenterIdInv">Call Center</Label>
              <Controller
                name="callCenterId"
                control={invoiceForm.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger id="callCenterIdInv"><SelectValue placeholder="Select call center" /></SelectTrigger>
                    <SelectContent>
                      {allCallCenters.filter(cc => cc.billingConfig).map(cc => (
                        <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>
                      ))}
                       {allCallCenters.filter(cc => cc.billingConfig).length === 0 && <p className="p-2 text-xs text-muted-foreground">No call centers with billing configs.</p>}
                    </SelectContent>
                  </Select>
                )}
              />
               {invoiceForm.formState.errors.callCenterId && <p className="text-sm text-destructive mt-1">{invoiceForm.formState.errors.callCenterId.message}</p>}
            </div>
            <div>
                <Label htmlFor="issueDateInv">Issue Date</Label>
                <Controller
                    name="issueDate"
                    control={invoiceForm.control}
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button id="issueDateInv" variant={"outline"} className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}>
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
                <Label htmlFor="dueDateInv">Due Date</Label>
                 <Controller
                    name="dueDate"
                    control={invoiceForm.control}
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button id="dueDateInv" variant={"outline"} className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}>
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
                <Label htmlFor="notesInv">Notes (Optional)</Label>
                <Textarea id="notesInv" {...invoiceForm.register("notes")} placeholder="Any additional notes for the invoice..."/>
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


    