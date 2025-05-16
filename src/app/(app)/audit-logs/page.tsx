
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, FilterX, Search, ClipboardCheck, Building } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { DateRange } from "react-day-picker";
import { useAuth } from "@/contexts/AuthContext";
import { useCallCenter } from "@/contexts/CallCenterContext"; // Added import
import { MOCK_AUDIT_LOGS } from "@/lib/mock-data";
import type { AuditLogEntry, User } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

export default function AuditLogsPage() {
  const { currentUser, users: allUsersForFilter, isLoading: authLoading } = useAuth(); // Renamed allUsers to allUsersForFilter
  const { allCallCenters, isLoading: ccLoading } = useCallCenter(); // Get allCallCenters
  
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDateRange, setFilterDateRange] = useState<DateRange | undefined>(undefined);
  const [filterUserId, setFilterUserId] = useState<string | "all">("all");
  const [filterActionTerm, setFilterActionTerm] = useState("");
  const [filterCallCenterIdAudit, setFilterCallCenterIdAudit] = useState<string | "all">("all");


  useEffect(() => {
    if (!authLoading && !ccLoading) {
      setAuditLogs(MOCK_AUDIT_LOGS);
      setIsLoadingData(false);
    }
  }, [authLoading, ccLoading]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const logTimestamp = parseISO(log.timestamp);
      const matchesSearch = searchTerm === "" ||
                            log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (typeof log.details === 'string' && log.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (log.ipAddress && log.ipAddress.includes(searchTerm)) ||
                            (log.location && log.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (log.callCenterName && log.callCenterName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesDate = !filterDateRange || !filterDateRange.from || 
                          (isValid(logTimestamp) && logTimestamp >= filterDateRange.from && (!filterDateRange.to || logTimestamp <= filterDateRange.to));
      const matchesUser = filterUserId === "all" || log.userId === filterUserId;
      const matchesAction = filterActionTerm === "" || log.action.toLowerCase().includes(filterActionTerm.toLowerCase());
      const matchesCallCenter = filterCallCenterIdAudit === "all" || log.callCenterId === filterCallCenterIdAudit;
      
      return matchesSearch && matchesDate && matchesUser && matchesAction && matchesCallCenter;
    });
  }, [auditLogs, searchTerm, filterDateRange, filterUserId, filterActionTerm, filterCallCenterIdAudit]);

  const resetFilters = () => {
    setSearchTerm("");
    setFilterDateRange(undefined);
    setFilterUserId("all");
    setFilterActionTerm("");
    setFilterCallCenterIdAudit("all");
  };

  const renderDetails = (details: string | Record<string, any> | undefined) => {
    if (!details) return <span className="text-muted-foreground italic">N/A</span>;
    if (typeof details === 'string') return <span className="truncate max-w-xs inline-block" title={details}>{details}</span>;
    return <pre className="text-xs bg-muted p-2 rounded-md max-w-xs overflow-x-auto">{JSON.stringify(details, null, 2)}</pre>;
  };

  if (isLoadingData || authLoading || ccLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-1/3" />
        </div>
        <Card className="shadow-lg">
            <CardHeader><Skeleton className="h-20 w-full" /></CardHeader>
            <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  if (currentUser?.role !== "SUPER_ADMIN") {
    return (
      <Card className="shadow-lg">
        <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
        <CardContent><p>You do not have permission to view audit logs.</p></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <ClipboardCheck className="h-8 w-8 mr-3 text-primary" />
        <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Filter Audit Logs</CardTitle>
          <CardDescription>Showing {filteredAuditLogs.length} of {auditLogs.length} log entries.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <Label htmlFor="auditSearch">General Search</Label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="auditSearch" 
                placeholder="User, Action, IP, Location, Details, Call Center..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="filterUser">User</Label>
            <Select value={filterUserId} onValueChange={setFilterUserId}>
              <SelectTrigger id="filterUser" className="mt-1"><SelectValue placeholder="Filter by User" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {allUsersForFilter.map(user => <SelectItem key={user.id} value={user.id}>{user.name || user.email}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

           <div>
            <Label htmlFor="filterCallCenterAudit">Call Center</Label>
            <Select value={filterCallCenterIdAudit} onValueChange={setFilterCallCenterIdAudit}>
              <SelectTrigger id="filterCallCenterAudit" className="mt-1"><SelectValue placeholder="Filter by Call Center" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Call Centers</SelectItem>
                {allCallCenters.map(cc => <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>)}
                 <SelectItem value="none">No Specific Call Center</SelectItem> 
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="filterAction">Action Contains</Label>
            <Input 
              id="filterAction" 
              placeholder="e.g., Created, Login" 
              value={filterActionTerm} 
              onChange={(e) => setFilterActionTerm(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button id="auditDateRange" variant={"outline"} className={`w-full justify-start text-left font-normal mt-1 ${!filterDateRange && "text-muted-foreground"}`}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterDateRange?.from ? (filterDateRange.to ? <>{format(filterDateRange.from, "LLL dd, yyyy")} - {format(filterDateRange.to, "LLL dd, yyyy")}</> : format(filterDateRange.from, "LLL dd, yyyy")) : <span>Pick a date range</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar initialFocus mode="range" defaultMonth={filterDateRange?.from} selected={filterDateRange} onSelect={setFilterDateRange} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="lg:col-span-4 flex justify-end"> {/* Adjusted col-span for button */}
            <Button onClick={resetFilters} variant="outline">
              <FilterX className="mr-2 h-4 w-4" /> Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Call Center</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAuditLogs.length > 0 ? filteredAuditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{format(parseISO(log.timestamp), "MMM d, yyyy HH:mm:ss")}</TableCell>
                    <TableCell>{log.userName}</TableCell>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.callCenterName || <span className="italic">Global/N/A</span>}
                    </TableCell>
                    <TableCell>{renderDetails(log.details)}</TableCell>
                    <TableCell className="text-muted-foreground">{log.ipAddress || "N/A"}</TableCell>
                    <TableCell className="text-muted-foreground">{log.location || "N/A"}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24"> {/* Adjusted colSpan */}
                      {auditLogs.length === 0 ? "No audit logs found." : "No audit logs match your current filters."}
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
