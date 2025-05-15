
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, FilterX, Search, ExternalLink, PhoneOff, CheckCircle2, XCircle, AlertCircle, Ear } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Label } from "@/components/ui/label"; // Added import

import { useAuth } from "@/contexts/AuthContext";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { MOCK_CALL_LOGS, MOCK_GLOBAL_CALL_CENTERS } from "@/lib/mock-data";
import type { CallLog, CallResult, CallCenter as CallCenterType } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

const CALL_RESULT_OPTIONS: { value: CallResult; label: string }[] = [
  { value: "answered_success", label: "Answered - Success" },
  { value: "answered_dnc_requested", label: "Answered - DNC Requested" },
  { value: "answered_declined", label: "Answered - Declined" },
  { value: "busy", label: "Busy" },
  { value: "failed_technical", label: "Failed - Technical" },
  { value: "voicemail_left", label: "Voicemail Left" },
  { value: "voicemail_full", label: "Voicemail Full" },
  { value: "no_answer", label: "No Answer" },
  { value: "blocked_by_dnc", label: "Blocked by DNC" },
];

export default function CallLogsPage() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const { currentCallCenter: activeCallCenter, allCallCenters, isLoading: ccLoading } = useCallCenter();
  
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDateRange, setFilterDateRange] = useState<DateRange | undefined>(undefined);
  const [filterCallCenterId, setFilterCallCenterId] = useState<string | "all">("all");
  const [filterCallResult, setFilterCallResult] = useState<CallResult | "all">("all");

  useEffect(() => {
    if (!authLoading && !ccLoading) {
      setCallLogs(MOCK_CALL_LOGS); // In a real app, fetch based on user/call center
      setIsLoadingData(false);
      if (activeCallCenter && currentUser?.role !== "SUPER_ADMIN") {
        setFilterCallCenterId(activeCallCenter.id);
      }
    }
  }, [authLoading, ccLoading, activeCallCenter, currentUser]);

  const filteredCallLogs = useMemo(() => {
    let logsToFilter = callLogs;

    if (currentUser?.role !== "SUPER_ADMIN" && activeCallCenter) {
      logsToFilter = logsToFilter.filter(log => log.callCenterId === activeCallCenter.id);
    } else if (filterCallCenterId !== "all" && currentUser?.role === "SUPER_ADMIN") {
      logsToFilter = logsToFilter.filter(log => log.callCenterId === filterCallCenterId);
    }
    
    return logsToFilter.filter(log => {
      const callTime = parseISO(log.callStartTime);
      const matchesSearch = searchTerm === "" || 
                            log.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            log.leadPhoneNumber.includes(searchTerm) ||
                            log.botName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            log.campaignName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = !filterDateRange || !filterDateRange.from || 
                          (isValid(callTime) && callTime >= filterDateRange.from && (!filterDateRange.to || callTime <= filterDateRange.to));
      const matchesResult = filterCallResult === "all" || log.callResult === filterCallResult;
      
      return matchesSearch && matchesDate && matchesResult;
    });
  }, [callLogs, searchTerm, filterDateRange, filterCallCenterId, filterCallResult, currentUser, activeCallCenter]);

  const resetFilters = () => {
    setSearchTerm("");
    setFilterDateRange(undefined);
    setFilterCallResult("all");
    if (currentUser?.role === "SUPER_ADMIN") {
      setFilterCallCenterId("all");
    } else if (activeCallCenter) {
      setFilterCallCenterId(activeCallCenter.id);
    }
  };

  const getCallResultBadgeVariant = (result: CallResult): "default" | "secondary" | "destructive" | "outline" => {
    if (result.includes("success")) return "default";
    if (result.includes("dnc") || result.includes("blocked")) return "destructive";
    if (result.includes("failed") || result.includes("declined")) return "secondary";
    return "outline";
  };
  
  const getCallResultIcon = (result: CallResult) => {
    if (result.includes("success")) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (result.includes("dnc") || result.includes("blocked")) return <PhoneOff className="h-4 w-4 text-red-500" />;
    if (result.includes("failed") || result.includes("declined")) return <XCircle className="h-4 w-4 text-yellow-600" />;
    return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  };

  const handlePlayRecording = (url?: string) => {
    if (url) {
      toast({ title: "Playing Recording (Mock)", description: `Accessing: ${url}` });
      // window.open(url, '_blank'); // For real URLs
    } else {
      toast({ title: "No Recording Available", variant: "destructive" });
    }
  };


  if (isLoadingData || authLoading || ccLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-3/4 md:w-1/2" />
        <Card><Skeleton className="h-96 w-full" /></Card>
      </div>
    );
  }

  if (currentUser?.role !== "SUPER_ADMIN" && currentUser?.role !== "CALL_CENTER_ADMIN") {
    return (
      <Card>
        <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
        <CardContent><p>You do not have permission to access this page.</p></CardContent>
      </Card>
    );
  }
  
   if (currentUser?.role === "CALL_CENTER_ADMIN" && !activeCallCenter) {
    return (
      <Card>
        <CardHeader><CardTitle>No Call Center Selected</CardTitle></CardHeader>
        <CardContent><p>Please select your call center from the header to view call logs.</p></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Call Logs {activeCallCenter && currentUser?.role !== "SUPER_ADMIN" ? `(${activeCallCenter.name})` : ''}</h2>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Filter Call Logs</CardTitle>
          <CardDescription>Refine the list of calls. Showing {filteredCallLogs.length} logs.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-2">
            <Label htmlFor="logSearch">Search</Label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="logSearch" 
                placeholder="Lead, Phone, Bot, Campaign..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {currentUser?.role === "SUPER_ADMIN" && (
            <div>
              <Label htmlFor="filterCallCenterLogs">Call Center</Label>
              <Select value={filterCallCenterId} onValueChange={setFilterCallCenterId}>
                <SelectTrigger id="filterCallCenterLogs" className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Call Centers</SelectItem>
                  {allCallCenters.map(cc => <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div>
            <Label htmlFor="filterCallResult">Call Result</Label>
            <Select value={filterCallResult} onValueChange={(value) => setFilterCallResult(value as CallResult | "all")}>
              <SelectTrigger id="filterCallResult" className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                {CALL_RESULT_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Call Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button id="logDateRange" variant={"outline"} className={`w-full justify-start text-left font-normal mt-1 ${!filterDateRange && "text-muted-foreground"}`}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterDateRange?.from ? (filterDateRange.to ? <>{format(filterDateRange.from, "LLL dd, y")} - {format(filterDateRange.to, "LLL dd, y")}</> : format(filterDateRange.from, "LLL dd, y")) : <span>Pick a date range</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar initialFocus mode="range" defaultMonth={filterDateRange?.from} selected={filterDateRange} onSelect={setFilterDateRange} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={resetFilters} variant="outline" className="w-full lg:w-auto mt-5">
            <FilterX className="mr-2 h-4 w-4" /> Reset Filters
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-center">Age</TableHead>
                  <TableHead>Bot</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="text-center">DNC</TableHead>
                  <TableHead className="text-center">Recording</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCallLogs.length > 0 ? filteredCallLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.leadName}</TableCell>
                    <TableCell className="text-muted-foreground">{log.leadPhoneNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{log.leadCity || "N/A"}</TableCell>
                    <TableCell className="text-muted-foreground text-center">{log.leadAge || "N/A"}</TableCell>
                    <TableCell className="text-muted-foreground">{log.botName}</TableCell>
                    <TableCell className="text-muted-foreground">{log.campaignName}</TableCell>
                    <TableCell className="text-muted-foreground">{format(parseISO(log.callStartTime), "MMM d, yyyy HH:mm")}</TableCell>
                    <TableCell className="text-muted-foreground text-right">{log.callDurationSeconds ? `${log.callDurationSeconds}s` : "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={getCallResultBadgeVariant(log.callResult)} className="text-xs capitalize whitespace-nowrap">
                        {getCallResultIcon(log.callResult)}
                        <span className="ml-1.5">{CALL_RESULT_OPTIONS.find(o => o.value === log.callResult)?.label || log.callResult.replace(/_/g, " ")}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {log.markedDNC ? <PhoneOff className="h-5 w-5 text-red-500 mx-auto" title="Marked DNC" /> : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {log.recordingUrl ? (
                        <Button variant="ghost" size="icon" onClick={() => handlePlayRecording(log.recordingUrl)} title="Play Recording">
                          <Ear className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">None</span>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center h-24">
                      {callLogs.length === 0 ? "No call logs found." : "No call logs match your current filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
