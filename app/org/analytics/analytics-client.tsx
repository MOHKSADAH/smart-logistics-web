"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TrendingUp, Package, Users, Clock } from "lucide-react";

interface AnalyticsClientProps {
  totalJobs: number;
  completedJobs: number;
  pendingJobs: number;
  inProgressJobs: number;
  priorityData: Array<{ priority: string; count: number; fill: string }>;
  weeklyData: Array<{ week: string; jobs: number }>;
  driversCount: number;
  availableDriversCount: number;
}

export default function AnalyticsClient({
  totalJobs,
  completedJobs,
  pendingJobs,
  inProgressJobs,
  priorityData,
  weeklyData,
  driversCount,
  availableDriversCount,
}: AnalyticsClientProps) {
  const driverUtilization = driversCount
    ? (((driversCount - availableDriversCount) / driversCount) * 100).toFixed(0)
    : 0;

  const chartConfig = {
    jobs: { label: "Jobs", color: "#3B82F6" },
  } satisfies ChartConfig;

  const pieConfig = {
    count: { label: "Count" },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Organization performance metrics and trends
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              {completedJobs} completed (
              {totalJobs > 0
                ? Math.round((completedJobs / totalJobs) * 100)
                : 0}
              %)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingJobs}</div>
            <p className="text-xs text-muted-foreground">
              {inProgressJobs} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Drivers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{driversCount}</div>
            <p className="text-xs text-muted-foreground">
              {availableDriversCount} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Driver Utilization
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{driverUtilization}%</div>
            <p className="text-xs text-muted-foreground">
              {driversCount - availableDriversCount} on jobs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Weekly Jobs Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Jobs Trend (Last 4 Weeks)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="week"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="jobs" fill="var(--color-jobs)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Jobs by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pieConfig}>
              <PieChart>
                <Pie
                  data={priorityData}
                  dataKey="count"
                  nameKey="priority"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {priorityData.map((item) => (
                <div key={item.priority} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span>
                    {item.priority}: {item.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Impact Summary */}
      <Card>
        <CardHeader>
          <CardTitle>PORTA Impact Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-green-600">100%</div>
              <div className="text-sm text-muted-foreground mt-1">
                EMERGENCY On-Time
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                All urgent cargo protected during congestion
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-green-600">65%</div>
              <div className="text-sm text-muted-foreground mt-1">
                Peak Reduction
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Congestion decreased from 171 to 60 trucks/hour
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-green-600">24/7</div>
              <div className="text-sm text-muted-foreground mt-1">
                Operation
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Traffic distributed across all hours
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
