
"use client"; 

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Bot, Zap, Megaphone, PhoneCall } from "lucide-react"; 
import { useEffect, useState } from "react";
import type { CallCenter } from "@/types";
import { useCallCenter } from "@/contexts/CallCenterContext"; 
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link"; // Added for linking to call center page

// Mock data for charts - specific to call centers
const allDailyConversionData: Record<string, { name: string; rate: number }[]> = {
  cc1: [
    { name: 'Mon', rate: 12 }, { name: 'Tue', rate: 19 }, { name: 'Wed', rate: 15 },
    { name: 'Thu', rate: 22 }, { name: 'Fri', rate: 18 }, { name: 'Sat', rate: 25 }, { name: 'Sun', rate: 20 },
  ],
  cc2: [
    { name: 'Mon', rate: 10 }, { name: 'Tue', rate: 17 }, { name: 'Wed', rate: 13 },
    { name: 'Thu', rate: 20 }, { name: 'Fri', rate: 16 }, { name: 'Sat', rate: 23 }, { name: 'Sun', rate: 18 },
  ],
  cc3: [ 
    { name: 'Mon', rate: 8 }, { name: 'Tue', rate: 15 }, { name: 'Wed', rate: 11 },
    { name: 'Thu', rate: 18 }, { name: 'Fri', rate: 14 }, { name: 'Sat', rate: 21 }, { name: 'Sun', rate: 17 },
  ],
};

const allCampaignPerformanceData: Record<string, { name: string; activeBots: number; conversions: number }[]> = {
  cc1: [
    { name: 'Campaign A (CC1)', activeBots: 40, conversions: 200 },
    { name: 'Campaign B (CC1)', activeBots: 60, conversions: 350 },
  ],
  cc2: [
    { name: 'Campaign C (CC2)', activeBots: 30, conversions: 150 },
    { name: 'Campaign D (CC2)', activeBots: 75, conversions: 420 },
  ],
  cc3: [ 
    { name: 'Campaign E (CC3)', activeBots: 20, conversions: 100 },
    { name: 'Campaign F (CC3)', activeBots: 50, conversions: 280 },
  ],
};

const allMetricsData: Record<string, { totalBots: string; activeCampaigns: string; conversionRate: string; totalCalls: string }> = {
    cc1: { totalBots: "1,250", activeCampaigns: "15", conversionRate: "18.5%", totalCalls: "250,600" },
    cc2: { totalBots: "850", activeCampaigns: "10", conversionRate: "16.2%", totalCalls: "180,300" },
    cc3: { totalBots: "500", activeCampaigns: "7", conversionRate: "15.0%", totalCalls: "120,000" },
};

const defaultMetrics = { totalBots: "N/A", activeCampaigns: "N/A", conversionRate: "N/A", totalCalls: "N/A" };
const defaultChartData: any[] = [];


interface MetricCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ElementType;
  trend?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, description, icon: Icon, trend }) => (
  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {trend && <div className="text-xs mt-1">{trend}</div>}
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { currentCallCenter, isLoading: isCallCenterLoading } = useCallCenter();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const dailyConversionData = currentCallCenter ? (allDailyConversionData[currentCallCenter.id] || defaultChartData) : defaultChartData;
  const campaignPerformanceData = currentCallCenter ? (allCampaignPerformanceData[currentCallCenter.id] || defaultChartData) : defaultChartData;
  const currentMetrics = currentCallCenter ? (allMetricsData[currentCallCenter.id] || defaultMetrics) : defaultMetrics;

  if (!mounted || isCallCenterLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-3/4 md:w-1/2" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/3 mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-lg h-[350px]"><CardContent className="flex items-center justify-center h-full"><Skeleton className="h-full w-full" /></CardContent></Card>
            <Card className="shadow-lg h-[350px]"><CardContent className="flex items-center justify-center h-full"><Skeleton className="h-full w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview ({currentCallCenter?.name || 'No Call Center Selected'})</h2>
      
      {currentCallCenter ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Total Bots Deployed" value={currentMetrics.totalBots} description="+20.1% from last month" icon={Bot} />
            <MetricCard title="Active Campaigns" value={currentMetrics.activeCampaigns} description="2 currently pending" icon={Megaphone} />
            <MetricCard title="Overall Conversion Rate" value={currentMetrics.conversionRate} description="+2.3% this week" icon={Zap} />
            <MetricCard title="Total Calls Handled" value={currentMetrics.totalCalls} description="Average 8.2k calls/day" icon={PhoneCall} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Daily Conversion Rate</CardTitle>
                <CardDescription>Performance over the last 7 days for {currentCallCenter?.name}.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyConversionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickFormatter={(value) => `${value}%`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      itemStyle={{ color: 'hsl(var(--chart-1))' }}
                    />
                    <Legend wrapperStyle={{fontSize: "12px"}} />
                    <Line type="monotone" dataKey="rate" name="Conversion Rate" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--chart-1))" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>Active bots and conversions by campaign for {currentCallCenter?.name}.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={campaignPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend wrapperStyle={{fontSize: "12px"}} />
                    <Bar dataKey="activeBots" name="Active Bots" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="conversions" name="Conversions" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>No Call Center Selected</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Please select a call center from the header or <Link href="/call-centers" className="text-primary underline">manage call centers</Link> to view dashboard data.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
