"use client";

import { Bar, BarChart, Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const permitTrendsConfig = {
  EMERGENCY: {
    label: "Emergency",
    color: "#EF4444",
  },
  ESSENTIAL: {
    label: "Essential",
    color: "#F59E0B",
  },
  NORMAL: {
    label: "Normal",
    color: "#3B82F6",
  },
  LOW: {
    label: "Low",
    color: "#6B7280",
  },
} satisfies ChartConfig;

const trafficConfig = {
  avgVehicleCount: {
    label: "Avg Vehicles",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

interface AnalyticsChartsProps {
  permitsByDate: Record<string, Record<string, number>>;
  avgTrafficByHour: Array<{ hour: number; avgVehicleCount: number }>;
}

export function AnalyticsCharts({
  permitsByDate,
  avgTrafficByHour,
}: AnalyticsChartsProps) {
  // Transform permits by date for chart
  const permitTrendsData = Object.entries(permitsByDate)
    .map(([date, counts]) => ({
      date: date.slice(5), // MM-DD format
      ...counts,
    }))
    .slice(-14); // Last 14 days

  // Sort traffic by hour
  const trafficData = avgTrafficByHour.sort((a, b) => a.hour - b.hour);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Daily Permit Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Permit Trends</CardTitle>
          <CardDescription>Permits created per day by priority level</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={permitTrendsConfig}>
            <BarChart data={permitTrendsData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar
                dataKey="EMERGENCY"
                stackId="a"
                fill="var(--color-EMERGENCY)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="ESSENTIAL"
                stackId="a"
                fill="var(--color-ESSENTIAL)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="NORMAL"
                stackId="a"
                fill="var(--color-NORMAL)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="LOW"
                stackId="a"
                fill="var(--color-LOW)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Congestion Patterns */}
      <Card>
        <CardHeader>
          <CardTitle>Congestion Patterns</CardTitle>
          <CardDescription>Average vehicle count by hour of day</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={trafficConfig}>
            <AreaChart data={trafficData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="hour"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value}:00`}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                content={<ChartTooltipContent hideLabel />}
              />
              <Area
                dataKey="avgVehicleCount"
                type="natural"
                fill="var(--color-avgVehicleCount)"
                fillOpacity={0.4}
                stroke="var(--color-avgVehicleCount)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
