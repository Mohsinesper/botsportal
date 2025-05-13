
"use client"; // For charts and potential client-side interactions

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Activity, Users, PhoneCall, Target, Bot, Zap, Megaphone } from "lucide-react"; // Added Megaphone
import { useEffect, useState } from "react";

// Mock data for charts - ensure this runs client-side
const dailyConversionData = [
  { name: 'Mon', rate: 12 },
  { name: 'Tue', rate: 19 },
  { name: 'Wed', rate: 15 },
  { name: 'Thu', rate: 22 },
  { name: 'Fri', rate: 18 },
  { name: 'Sat', rate: 25 },
  { name: 'Sun', rate: 20 },
];

const campaignPerformanceData = [
  { name: 'Campaign A', activeBots: 40, conversions: 200 },
  { name: 'Campaign B', activeBots: 60, conversions: 350 },
  { name: 'Campaign C', activeBots: 30, conversions: 150 },
  { name: 'Campaign D', activeBots: 75, conversions: 420 },
];

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
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render skeleton or minimal content before client-side hydration
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
                <div className="h-5 w-5 bg-muted rounded-full animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3 mb-2 animate-pulse"></div>
                <div className="h-3 bg-muted rounded w-3/4 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-lg h-[350px] animate-pulse bg-muted"></Card>
            <Card className="shadow-lg h-[350px] animate-pulse bg-muted"></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Bots Deployed" value="1,250" description="+20.1% from last month" icon={Bot} />
        <MetricCard title="Active Campaigns" value="15" description="2 currently pending" icon={Megaphone} />
        <MetricCard title="Overall Conversion Rate" value="18.5%" description="+2.3% this week" icon={Zap} />
        <MetricCard title="Total Calls Handled" value="250,600" description="Average 8.2k calls/day" icon={PhoneCall} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Daily Conversion Rate</CardTitle>
            <CardDescription>Performance over the last 7 days.</CardDescription>
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
            <CardDescription>Active bots and conversions by campaign.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignPerformanceData}>
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
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

